/**
 * UC-03 Menugaskan reviewer: tetapkanBatasBeban, susunPenugasan, pilihReviewer, tetapkan, mencatatPenugasan,
 * kirimPenugasan (API BIMA lewat client), terimaProposal. Nama fungsi mengikuti seq-uc03.puml.
 */
import { and, desc, eq, inArray, isNull, ne, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { akun, penugasanReviewer, periodeSeleksi, proposal, versiProposal } from "@/db/schema";
import { pastikanAkunMassal } from "@/lib/auth";
import { bima, BimaGagalError } from "@/lib/bima/client";
import { catatLogAudit } from "@/lib/audit";
import { ambilPeriodeAktif, ambilPeriodeBerjalanId, masaBerjalanUntuk, masaPengusulanBerjalan, periodeSudahDibuka, waktuDemo } from "@/lib/waktu";
import { dalamKumpulanPeriode } from "@/lib/demo/profil-skala";
import type { Db } from "@/lib/aturan/draf";
import type { BarisUsulanPenugasan, HasilPilihReviewer, HasilSusunPenugasan, SebaranBeban } from "@/lib/kontrak/tipe";
import { kelompokkanPenolakan, periksaSyarat, rencanakanPindah, susunUsulan, type KodeSyarat, type TujuanPindah } from "./aturan";
import { hitungTenggat, kapasitasReviewer, periksaParamMasa, type ParamMasa } from "@/lib/penilaian/masa";
import { bolehDipindahkan } from "./status";
import { periodeDitutup, type FilterUsulan, type HitungPeriode } from "./periode";

/** Baris per perintah INSERT massal (dikirim sebagai satu array JSON, jadi tidak dibatasi jumlah parameter). */
const UKURAN_SISIP = 5000;
/** Penugasan per permintaan ke BIMA (kelompok) dan jumlah kelompok yang dikirim bersamaan. */
export const UKURAN_KELOMPOK_KIRIM = 500;
const KELOMPOK_SERENTAK = 5;

export class MasaBelumDitutupError extends Error {
  constructor() {
    super("Masa pengusulan belum ditutup. Usulan penugasan baru dapat disusun sesudah masa pengusulan ditutup.");
    this.name = "MasaBelumDitutupError";
  }
}

/**
 * Kumpulan reviewer yang boleh dipakai pada satu periode (demo/profil-skala.ts): periode berprofil (10.000 atau 1.200 proposal)
 * memakai reviewer massalnya sendiri ditambah reviewer contoh profil itu; periode lain tidak pernah memakai reviewer massal.
 */
async function kumpulanPeriode(periodeId: string, db: Db = getDb()): Promise<(idBima: string) => boolean> {
  const [p] = await db.select({ nama: periodeSeleksi.nama }).from(periodeSeleksi).where(eq(periodeSeleksi.id, periodeId));
  const nama = p?.nama ?? "";
  return (idBima) => dalamKumpulanPeriode(nama, idBima);
}

/** Galat yang dikembalikan ke Tim sebagai pesan biasa (bukan kegagalan sistem). */
export class PenugasanDitolakError extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = "PenugasanDitolakError";
  }
}

/** Satu transaksi dengan kunci penasihat per periode: Susun, Pindahkan, dan klaim Tetapkan pada periode yang sama berjalan bergiliran. */
async function denganKunciPeriode<T>(periodeId: string, kerja: (tx: Db) => Promise<T>): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${"penugasan:" + periodeId}))`);
    return kerja(tx as unknown as Db);
  });
}

/** Beban = jumlah penugasan reviewer pada periode (semua status), kecuali penugasan yang dikecualikan. Dihitung di basis data (GROUP BY). */
async function bebanPerReviewer(periodeId: string, kecualiPenugasanId?: string, db: Db = getDb()): Promise<Record<string, number>> {
  const baris = await db
    .select({ reviewerId: penugasanReviewer.reviewerId, jumlah: sql<number>`count(*)::int` })
    .from(penugasanReviewer)
    .where(
      kecualiPenugasanId
        ? and(eq(penugasanReviewer.periodeId, periodeId), ne(penugasanReviewer.id, kecualiPenugasanId))
        : eq(penugasanReviewer.periodeId, periodeId),
    )
    .groupBy(penugasanReviewer.reviewerId);
  return Object.fromEntries(baris.map((b) => [b.reviewerId, b.jumlah]));
}

export const UKURAN_HALAMAN_USULAN = 50;

/** Status penugasan yang dihitung "Ditetapkan": sudah ditetapkan, termasuk yang sudah Selesai dinilai (satu angka di J-04 dan J-04b). */
const statusDitetapkan = (status: "Diusulkan" | "Ditetapkan") => (status === "Ditetapkan" ? (["Ditetapkan", "Selesai"] as const) : ([status] as const));

/** Jumlah usulan/penugasan berstatus tertentu pada periode (untuk ringkasan dan penomoran halaman). "Ditetapkan" mencakup "Selesai". */
export async function hitungPenugasan(periodeId: string, status: "Diusulkan" | "Ditetapkan"): Promise<number> {
  const [{ n }] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(penugasanReviewer)
    .where(and(eq(penugasanReviewer.periodeId, periodeId), inArray(penugasanReviewer.status, [...statusDitetapkan(status)])));
  return n;
}

/** Jumlah reviewer berbeda pada usulan (status Diusulkan) satu periode: bahan ringkasan M-07. */
export async function hitungReviewerUsulan(periodeId: string): Promise<number> {
  const [{ n }] = await getDb()
    .select({ n: sql<number>`count(distinct ${penugasanReviewer.reviewerId})::int` })
    .from(penugasanReviewer)
    .where(and(eq(penugasanReviewer.periodeId, periodeId), eq(penugasanReviewer.status, "Diusulkan")));
  return n;
}

/**
 * Subkueri proposal yang sudah punya penugasan tetap (bukan Diusulkan) pada periode. Dipakai dengan NOT IN (subplan berhash: satu kali
 * baca penugasan), bukan NOT EXISTS berkorelasi yang pada statistik basi atau tabel penuh baris mati bisa menjadi nested loop 10.000 x seq scan.
 */
const sudahDitetapkan = (periodeId: string) =>
  sql`SELECT pr.proposal_id FROM penugasan_reviewer pr WHERE pr.periode_id = ${periodeId} AND pr.status <> 'Diusulkan'`;

/** Proposal Terkirim pada periode yang belum punya penugasan Ditetapkan/Selesai (bahan Susun Usulan Penugasan). */
export async function hitungPerluDitugaskan(periodeId: string): Promise<number> {
  const [{ n }] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(proposal)
    .where(sql`${proposal.periodeId} = ${periodeId} AND ${proposal.status} = 'Terkirim' AND ${proposal.id} NOT IN (${sudahDitetapkan(periodeId)})`);
  return n;
}

const FILTER_KOSONG: FilterUsulan = { q: "", rev: null, inst: null, skema: null, melanggar: false, urut: "id" };

/** Escape pola ILIKE (%, _ dan \\) supaya teks cari dibaca apa adanya. */
const polaCari = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/**
 * Bagian FROM + WHERE bersama daftar, hitungan, faset, dan "pilih semua hasil filter". Syarat per baris dihitung ulang di sini
 * (bukti deterministik): institusi reviewer sama dengan pengusul, reviewer tidak bersedia, atau beban reviewer di atas batas periode.
 */
function dasarUsulan(periodeId: string, status: "Diusulkan" | "Ditetapkan", f: FilterUsulan, batas: number, tanpa: (keyof FilterUsulan)[] = []): SQL {
  const syarat: SQL[] = [sql`pr.periode_id = ${periodeId}::uuid`, sql`pr.status IN (${sql.join([...statusDitetapkan(status)].map((x) => sql`${x}`), sql`, `)})`];
  if (f.q && !tanpa.includes("q")) {
    const pola = polaCari(f.q);
    syarat.push(sql`(p.judul ILIKE ${pola} OR p.id_proposal ILIKE ${pola} OR pg.nama ILIKE ${pola})`);
  }
  if (f.rev && !tanpa.includes("rev")) syarat.push(sql`pr.reviewer_id = ${f.rev}::uuid`);
  if (f.inst && !tanpa.includes("inst")) syarat.push(sql`pg.institusi = ${f.inst}`);
  if (f.skema && !tanpa.includes("skema")) syarat.push(sql`sk.kode = ${f.skema}`);
  if (f.melanggar && !tanpa.includes("melanggar")) {
    syarat.push(sql`(lower(trim(rv.institusi)) = lower(trim(pg.institusi)) OR NOT rv.bersedia OR COALESCE(b.n, 0) > ${batas})`);
  }
  return sql`
    FROM penugasan_reviewer pr
    JOIN proposal p ON p.id = pr.proposal_id
    JOIN skema_pendanaan sk ON sk.id = p.skema_id
    JOIN akun pg ON pg.id = p.pengusul_id
    JOIN akun rv ON rv.id = pr.reviewer_id
    LEFT JOIN (SELECT reviewer_id, count(*)::int AS n FROM penugasan_reviewer WHERE periode_id = ${periodeId}::uuid GROUP BY reviewer_id) b ON b.reviewer_id = pr.reviewer_id
    WHERE ${sql.join(syarat, sql` AND `)}`;
}

const URUTAN: Record<FilterUsulan["urut"], SQL> = {
  id: sql`p.id_proposal, pr.id`,
  judul: sql`p.judul, p.id_proposal`,
  reviewer: sql`rv.nama, p.id_proposal`,
  institusi: sql`pg.institusi, p.id_proposal`,
};

const baris = <T>(h: unknown) => (h as { rows: T[] }).rows;

async function batasPeriode(periodeId: string, db: Db = getDb()): Promise<number> {
  const [p] = await db.select({ batas: periodeSeleksi.batasBebanReviewer }).from(periodeSeleksi).where(eq(periodeSeleksi.id, periodeId));
  return p?.batas ?? 0;
}

/**
 * Usulan (Diusulkan) atau penugasan Ditetapkan (termasuk Selesai) satu periode dengan filter, urutan, dan halaman di basis data,
 * beserta jumlah seluruh baris yang cocok. Setiap baris membawa hasil periksa ulang syarat (kolom Syarat di J-04b).
 */
export async function ambilUsulanBerfilter(
  periodeId: string,
  status: "Diusulkan" | "Ditetapkan",
  filter: FilterUsulan = FILTER_KOSONG,
  halaman = 1,
  ukuran = UKURAN_HALAMAN_USULAN,
): Promise<{ baris: BarisUsulanPenugasan[]; total: number }> {
  const db = getDb();
  const batas = await batasPeriode(periodeId);
  const dasar = dasarUsulan(periodeId, status, filter, batas);
  const [daftar, hitung] = await Promise.all([
    db.execute(sql`
      SELECT pr.id AS "penugasanId", p.id AS "proposalId", p.id_proposal AS "idProposal", p.judul AS "judulProposal", sk.nama_skema AS skema,
             pg.nama AS "namaPengusul", pg.institusi AS "institusiPengusul", pr.reviewer_id AS "reviewerId", rv.nama AS "namaReviewer",
             rv.institusi AS "institusiReviewer", pr.status AS status,
             lower(trim(rv.institusi)) = lower(trim(pg.institusi)) AS "samaInstitusi", NOT rv.bersedia AS "tidakBersedia", COALESCE(b.n, 0) AS "bebanReviewer"
      ${dasar}
      ORDER BY ${URUTAN[filter.urut]}
      LIMIT ${ukuran} OFFSET ${(Math.max(1, halaman) - 1) * ukuran}`),
    db.execute(sql`SELECT count(*)::int AS n ${dasar}`),
  ]);
  return { baris: baris<BarisUsulanPenugasan>(daftar), total: baris<{ n: number }>(hitung)[0]?.n ?? 0 };
}

/**
 * Usulan (status Diusulkan) atau penugasan Ditetapkan beserta data tampilan untuk satu periode, berhalaman di basis data
 * (urut id proposal lalu id penugasan). Tanpa `opsi.halaman` seluruh baris dikembalikan (hanya untuk data kecil).
 */
export async function ambilUsulan(
  periodeId: string,
  status: "Diusulkan" | "Ditetapkan" = "Diusulkan",
  opsi: { halaman?: number; ukuran?: number } = {},
): Promise<BarisUsulanPenugasan[]> {
  if (opsi.halaman) return (await ambilUsulanBerfilter(periodeId, status, FILTER_KOSONG, opsi.halaman, opsi.ukuran ?? UKURAN_HALAMAN_USULAN)).baris;
  return (await ambilUsulanBerfilter(periodeId, status, FILTER_KOSONG, 1, 1_000_000)).baris;
}

export interface FasetUsulan {
  reviewer: { id: string; nama: string; institusi: string; jumlah: number }[];
  institusi: { nama: string; jumlah: number }[];
  skema: { kode: string; nama: string; jumlah: number }[];
  /** baris yang melanggar syarat (seluruh periode dan status ini, tanpa filter lain) */
  melanggar: number;
  /** waktu baris terbaru (berubah setiap Susun): kunci pengatur ulang pilihan baris di J-04b */
  stempel: string;
}

/** Pilihan filter J-04b (reviewer, institusi pengusul, skema) beserta jumlah baris, dan jumlah baris yang melanggar syarat. */
export async function ambilFasetUsulan(periodeId: string, status: "Diusulkan" | "Ditetapkan"): Promise<FasetUsulan> {
  const db = getDb();
  const batas = await batasPeriode(periodeId);
  const dasar = dasarUsulan(periodeId, status, FILTER_KOSONG, batas);
  const dasarMelanggar = dasarUsulan(periodeId, status, { ...FILTER_KOSONG, melanggar: true }, batas);
  const [rev, inst, sk, mlg, stp] = await Promise.all([
    db.execute(sql`SELECT rv.id, rv.nama, rv.institusi, count(*)::int AS jumlah ${dasar} GROUP BY rv.id, rv.nama, rv.institusi ORDER BY rv.nama`),
    db.execute(sql`SELECT pg.institusi AS nama, count(*)::int AS jumlah ${dasar} GROUP BY pg.institusi ORDER BY pg.institusi`),
    db.execute(sql`SELECT sk.kode, sk.nama_skema AS nama, count(*)::int AS jumlah ${dasar} GROUP BY sk.kode, sk.nama_skema ORDER BY sk.kode`),
    db.execute(sql`SELECT count(*)::int AS n ${dasarMelanggar}`),
    db.execute(sql`SELECT coalesce(max(pr.tanggal)::text, '') AS t ${dasar}`),
  ]);
  return {
    reviewer: baris<FasetUsulan["reviewer"][number]>(rev),
    institusi: baris<FasetUsulan["institusi"][number]>(inst),
    skema: baris<FasetUsulan["skema"][number]>(sk),
    melanggar: baris<{ n: number }>(mlg)[0]?.n ?? 0,
    stempel: baris<{ t: string }>(stp)[0]?.t ?? "",
  };
}

export interface ReviewerPeriode {
  id: string;
  idBima: string;
  nama: string;
  institusi: string;
  bersedia: boolean;
  /** jumlah penugasan pada periode (semua status) */
  beban: number;
}

/** Reviewer bersedia dalam kumpulan periode beserta bebannya (satu kali baca untuk Sebaran Beban dan pilihan Reviewer Pengganti). */
export async function ambilReviewerPeriode(periodeId: string, db: Db = getDb(), opsi: { termasukTidakBersedia?: boolean } = {}): Promise<ReviewerPeriode[]> {
  const boleh = await kumpulanPeriode(periodeId, db);
  const [reviewer, beban] = await Promise.all([
    db.select().from(akun).where(opsi.termasukTidakBersedia ? eq(akun.peran, "reviewer") : and(eq(akun.peran, "reviewer"), eq(akun.bersedia, true))),
    bebanPerReviewer(periodeId, undefined, db),
  ]);
  return reviewer
    .filter((r) => boleh(r.idBima))
    .map((r) => ({ id: r.id, idBima: r.idBima, nama: r.nama, institusi: r.institusi, bersedia: r.bersedia, beban: beban[r.id] ?? 0 }));
}

/** Tabel "Sebaran Beban": jumlah proposal setiap reviewer yang bersedia terhadap batas (semua reviewer, bukan hanya satu halaman). */
export async function ambilSebaranBeban(periodeId: string, batas: number): Promise<SebaranBeban[]> {
  return (await ambilReviewerPeriode(periodeId))
    .map((r) => ({ reviewerId: r.id, namaReviewer: r.nama, institusi: r.institusi, jumlah: r.beban, batas }))
    .sort((a, b) => b.jumlah - a.jumlah || a.namaReviewer.localeCompare(b.namaReviewer));
}

/** Parameter masa penilaian sebuah baris periode. */
export const masaPeriode = (p: { lamaPenilaianHari: number; jamReviewerPerHari: number; menitPerProposal: number }): ParamMasa => ({
  lamaHari: p.lamaPenilaianHari,
  jamPerHari: p.jamReviewerPerHari,
  menitPerProposal: p.menitPerProposal,
});

/** Galat batas beban yang melebihi kapasitas satu reviewer dalam masa penilaian (null bila cukup). */
export function galatKapasitas(batas: number, masa: ParamMasa): string | null {
  const kap = kapasitasReviewer(masa);
  if (batas <= kap) return null;
  const desimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
  return `Batas Beban per Reviewer ${batas} melebihi kapasitas satu reviewer: ${kap} proposal dalam ${masa.lamaHari} hari (paling lama ${desimal.format(masa.jamPerHari)} jam menilai per hari, ±${desimal.format(masa.menitPerProposal)} menit per proposal). Turunkan batas, atau perpanjang lama penilaian.`;
}

/**
 * tetapkanBatasBeban(batas) pada objek periode, beserta masa penilaian bila diberikan. Masa yang sudah dimulai (penugasan pertama sudah
 * ditetapkan) tidak diubah lagi.
 */
export async function tetapkanBatasBeban(periodeId: string, batas: number, db: Db = getDb(), masa?: ParamMasa): Promise<void> {
  if (!Number.isInteger(batas) || batas < 1) throw new Error("Batas Beban per Reviewer harus bilangan bulat minimal 1.");
  await db.update(periodeSeleksi).set({ batasBebanReviewer: batas }).where(eq(periodeSeleksi.id, periodeId));
  if (masa) {
    await db
      .update(periodeSeleksi)
      .set({ lamaPenilaianHari: masa.lamaHari, jamReviewerPerHari: masa.jamPerHari, menitPerProposal: masa.menitPerProposal })
      .where(and(eq(periodeSeleksi.id, periodeId), isNull(periodeSeleksi.mulaiPenilaian)));
  }
}

/**
 * UC-03 s.2-5 (+ S-1). Daftar reviewer diambil dari BIMA di luar transaksi; pembacaan proposal, keputusan, dan penulisan berjalan dalam
 * satu transaksi berkunci per periode. Keputusan S-1 memakai cekKelayakan (pasti). S-1 tidak mengubah penugasan maupun batas: batas
 * beban lama dan usulan lama tetap (salinan akun reviewer dari BIMA tetap diperbarui seperti biasa) dan log audit dicatat; hasilnya
 * membawa saran batas terkecil yang cukup. Bila cukup, batas disimpan,
 * usulan lama (Diusulkan) diganti, dan penugasan yang sudah Ditetapkan tidak diubah (dihitung sebagai beban awal).
 */
export async function susunPenugasan(periodeId: string, batasBeban: number, masaBaru?: ParamMasa): Promise<HasilSusunPenugasan> {
  if (!Number.isInteger(batasBeban) || batasBeban < 1) throw new Error("Batas Beban per Reviewer harus bilangan bulat minimal 1.");
  // sakelar demo DAN tanggal tutup periode ini (sama dengan guard Tetapkan)
  const ringkas = await ambilRingkasanPeriode(periodeId);
  if (!ringkas) throw new PenugasanDitolakError("Periode tidak dikenali.");
  if (!ringkas.ditutup) throw new MasaBelumDitutupError();
  // masa yang sudah dimulai tetap; masa baru diperiksa dulu, lalu batas beban tidak boleh melebihi kapasitas satu reviewer
  const masa = ringkas.mulaiPenilaian || !masaBaru ? ringkas.masa : masaBaru;
  const galatMasa = periksaParamMasa(masa) ?? galatKapasitas(batasBeban, masa);
  if (galatMasa) throw new PenugasanDitolakError(galatMasa);

  const t0 = Date.now();
  const langkah: Record<string, number> = {};
  let tCatat = t0;
  const tandai = (nama: string) => {
    const t = Date.now();
    langkah[nama] = t - tCatat;
    tCatat = t;
  };

  // ambilDaftarReviewer() melalui API BIMA (client mengulang otomatis maksimal 2 kali), di luar transaksi
  const boleh = await kumpulanPeriode(periodeId);
  const daftar = (await ambilDaftarReviewer()).filter((r) => r.bersedia && boleh(r.idBima));
  tandai("daftarReviewerBima");
  const reviewerSemar = (await pastikanAkunMassal(daftar.map((r) => r.idBima))).filter((a) => a.peran === "reviewer");
  tandai("salinAkunReviewer");

  const hasil = await denganKunciPeriode(periodeId, async (tx) => {
    // proposal Terkirim pada periode yang belum ditetapkan penugasannya, beserta institusi pengusul (satu kueri, tanpa N+1)
    const pengusul = alias(akun, "pengusul");
    const perluDitugaskan = await tx
      .select({ id: proposal.id, institusiPengusul: pengusul.institusi })
      .from(proposal)
      .innerJoin(pengusul, eq(pengusul.id, proposal.pengusulId))
      .where(sql`${proposal.periodeId} = ${periodeId} AND ${proposal.status} = 'Terkirim' AND ${proposal.id} NOT IN (${sudahDitetapkan(periodeId)})`);
    // beban awal: penugasan yang sudah ditetapkan atau selesai (usulan lama akan diganti)
    const tetap = await tx
      .select({ reviewerId: penugasanReviewer.reviewerId, jumlah: sql<number>`count(*)::int` })
      .from(penugasanReviewer)
      .where(and(eq(penugasanReviewer.periodeId, periodeId), ne(penugasanReviewer.status, "Diusulkan")))
      .groupBy(penugasanReviewer.reviewerId);
    tandai("bacaProposal");

    const susun = susunUsulan(
      perluDitugaskan.map((p) => ({ id: p.id, institusiPengusul: p.institusiPengusul ?? "-" })),
      reviewerSemar.map((r) => ({ id: r.id, nama: r.nama, institusi: r.institusi })),
      Object.fromEntries(tetap.map((t) => [t.reviewerId, t.jumlah])),
      batasBeban,
    );
    tandai("algoritma");
    if (susun.kekurangan > 0) return susun; // S-1: tidak ada yang ditulis

    await tetapkanBatasBeban(periodeId, batasBeban, tx, masa);
    // versi terbaru setiap proposal yang ditugaskan (satu kueri DISTINCT ON)
    const versiTerbaru = new Map<string, string>();
    if (perluDitugaskan.length) {
      const versi = await tx
        .selectDistinctOn([versiProposal.proposalId], { id: versiProposal.id, proposalId: versiProposal.proposalId })
        .from(versiProposal)
        .innerJoin(proposal, eq(proposal.id, versiProposal.proposalId))
        .where(and(eq(proposal.periodeId, periodeId), eq(proposal.status, "Terkirim")))
        .orderBy(versiProposal.proposalId, desc(versiProposal.nomor));
      for (const v of versi) versiTerbaru.set(v.proposalId, v.id);
    }
    // usulan baru (Diusulkan) menggantikan usulan lama; sisipan massal satu INSERT ... SELECT dari array JSON per 5.000 baris
    await tx.delete(penugasanReviewer).where(and(eq(penugasanReviewer.periodeId, periodeId), eq(penugasanReviewer.status, "Diusulkan")));
    for (let i = 0; i < susun.penugasan.length; i += UKURAN_SISIP) {
      const potongan = JSON.stringify(susun.penugasan.slice(i, i + UKURAN_SISIP).map((p) => ({ p: p.proposalId, v: versiTerbaru.get(p.proposalId) ?? null, r: p.reviewerId })));
      await tx.execute(sql`
        INSERT INTO penugasan_reviewer (proposal_id, versi_id, reviewer_id, periode_id, status, label)
        SELECT (x->>'p')::uuid, (x->>'v')::uuid, (x->>'r')::uuid, ${periodeId}::uuid, 'Diusulkan', 'Baru'
        FROM jsonb_array_elements(${potongan}::jsonb) AS x`);
    }
    tandai("simpanUsulan");
    return susun;
  });

  if (hasil.kekurangan > 0) {
    await catatLogAudit({
      aktor: "sistem",
      aksi: "susun_penugasan_kekurangan_reviewer",
      objek: `periode:${periodeId}`,
      rincian: { batasBeban, belumDitugaskan: hasil.kekurangan, batasCukup: hasil.batasCukup, reviewerBersedia: reviewerSemar.length, langkahMs: langkah },
    });
    return {
      periodeId,
      usulan: [],
      jumlahUsulan: 0,
      sebaran: [],
      jumlahBelumDitugaskan: hasil.kekurangan,
      kekurangan: {
        jumlahReviewer: reviewerSemar.length,
        kapasitas: hasil.kelayakan.kapasitas,
        batasCukup: hasil.batasCukup,
        hambatan: hasil.kelayakan.hambatan.slice(0, 5),
      },
    };
  }
  await catatLogAudit({
    aktor: "sistem",
    aksi: "susun_penugasan",
    objek: `periode:${periodeId}`,
    rincian: { batasBeban, jumlahUsulan: hasil.penugasan.length, totalMs: Date.now() - t0, langkahMs: langkah },
  });
  return { periodeId, usulan: [], jumlahUsulan: hasil.penugasan.length, sebaran: [], jumlahBelumDitugaskan: 0 };
}

/**
 * UC-03 S-2.2/S-2.3: periksa ulang syarat institusi, kesediaan, dan beban bagi reviewer pengganti.
 * Bila memenuhi, baris penugasan diperbarui; bila tidak, reviewer semula tetap dipakai dan syarat yang dilanggar dikembalikan.
 */
export async function pilihReviewer(penugasanId: string, reviewerBaruId: string, aktor = "sistem"): Promise<HasilPilihReviewer> {
  const db = getDb();
  const [pn] = await db.select().from(penugasanReviewer).where(eq(penugasanReviewer.id, penugasanId));
  if (!pn) throw new Error("Penugasan tidak ditemukan.");
  if (!bolehDipindahkan(pn.status)) {
    return { reviewerId: pn.reviewerId, diterima: false, syaratDilanggar: ["Penugasan sudah ditetapkan dan tidak dapat dipindahkan."] };
  }
  const [pr] = await db.select().from(proposal).where(eq(proposal.id, pn.proposalId));
  const [pengusul] = await db.select().from(akun).where(eq(akun.id, pr.pengusulId));
  const [baru] = await db.select().from(akun).where(eq(akun.id, reviewerBaruId));
  if (!baru || baru.peran !== "reviewer") {
    return { reviewerId: pn.reviewerId, diterima: false, syaratDilanggar: ["Reviewer pengganti tidak ditemukan."] };
  }
  if (!(await kumpulanPeriode(pn.periodeId))(baru.idBima)) {
    return { reviewerId: pn.reviewerId, diterima: false, syaratDilanggar: ["Reviewer pengganti tidak ditemukan."] };
  }
  if (baru.id === pn.reviewerId) return { reviewerId: pn.reviewerId, diterima: true, syaratDilanggar: [] };

  const [periode] = await db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, pn.periodeId));
  const beban = await bebanPerReviewer(pn.periodeId, pn.id);
  const syaratDilanggar = periksaSyarat({
    institusiPengusul: pengusul.institusi,
    reviewer: { institusi: baru.institusi, bersedia: baru.bersedia },
    bebanSaatIni: beban[baru.id] ?? 0,
    batas: periode.batasBebanReviewer,
  });
  if (syaratDilanggar.length) {
    await catatLogAudit({
      aktor,
      aksi: "pindah_penugasan_ditolak",
      objek: `penugasan:${pn.id}`,
      rincian: { reviewerBaru: baru.id, syaratDilanggar },
    });
    return { reviewerId: pn.reviewerId, diterima: false, syaratDilanggar };
  }
  const ubah = await db
    .update(penugasanReviewer)
    .set({ reviewerId: baru.id })
    .where(and(eq(penugasanReviewer.id, pn.id), eq(penugasanReviewer.status, "Diusulkan")))
    .returning({ id: penugasanReviewer.id });
  if (!ubah.length) return { reviewerId: pn.reviewerId, diterima: false, syaratDilanggar: ["Penugasan sudah ditetapkan dan tidak dapat dipindahkan."] };
  await catatLogAudit({
    aktor,
    aksi: "pindah_penugasan",
    objek: `penugasan:${pn.id}`,
    rincian: { dari: pn.reviewerId, ke: baru.id },
  });
  return { reviewerId: baru.id, diterima: true, syaratDilanggar: [] };
}

export interface HasilTetapkan {
  jumlah: number;
}

/**
 * UC-03 s.7-8: tetapkan() setiap usulan (status Ditetapkan, mencatatPenugasan), kirimPenugasan ke BIMA per kelompok
 * (500 penugasan; client mengulang maksimal 2 kali; kunci idempoten sehingga kelompok yang terkirim ganda tidak menggandakan baris di BIMA),
 * lalu terimaProposal: label "Baru" untuk reviewer di J-07.
 * Klaim status dilakukan dengan satu UPDATE ... RETURNING. Kelompok yang gagal dikembalikan ke Diusulkan agar tombol "Kirim ulang" dapat
 * mengulangnya; kelompok yang sudah diterima BIMA tetap Ditetapkan. Bila ada kelompok gagal, BimaGagalError dilempar.
 */
export async function tetapkanPenugasan(periodeId: string, aktor: string): Promise<HasilTetapkan> {
  const db = getDb();
  const ringkas = await ambilRingkasanPeriode(periodeId);
  if (!ringkas) throw new PenugasanDitolakError("Periode tidak dikenali.");
  if (!ringkas.ditutup) throw new MasaBelumDitutupError();
  const waktu = new Date();
  const t0 = Date.now();
  // Klaim atomik dalam kunci periode (bergiliran dengan Susun dan Pindahkan): usulan yang melanggar syarat menolak penetapan, lalu
  // hanya baris yang masih Diusulkan yang diklaim, jadi dua klik serentak tidak mengirim penugasan ganda.
  const diklaim = await denganKunciPeriode(periodeId, async (tx) => {
    const batas = await batasPeriode(periodeId, tx);
    const melanggar = baris<{ n: number }>(await tx.execute(sql`SELECT count(*)::int AS n ${dasarUsulan(periodeId, "Diusulkan", { ...FILTER_KOSONG, melanggar: true }, batas)}`))[0]?.n ?? 0;
    if (melanggar > 0) throw new PenugasanDitolakError(`${melanggar} usulan melanggar syarat penugasan. Pindahkan usulan itu dulu, lalu tetapkan lagi.`);
    // masa penilaian dimulai pada penetapan pertama periode: tenggat = akhir hari ke-lama (WIB)
    const [pr] = await tx.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, periodeId));
    if (pr && !pr.mulaiPenilaian) {
      await tx
        .update(periodeSeleksi)
        .set({ mulaiPenilaian: waktu, batasPenilaian: hitungTenggat(waktu, pr.lamaPenilaianHari) })
        .where(and(eq(periodeSeleksi.id, periodeId), isNull(periodeSeleksi.mulaiPenilaian)));
    }
    return baris<{ id: string; idProposal: string; reviewerIdBima: string }>(
      await tx.execute(sql`
        WITH klaim AS (
          UPDATE penugasan_reviewer SET status = 'Ditetapkan', label = 'Baru', tanggal = ${waktu.toISOString()}
          WHERE periode_id = ${periodeId} AND status = 'Diusulkan'
          RETURNING id, proposal_id, reviewer_id
        )
        SELECT k.id AS id, pr.id_proposal AS "idProposal", a.id_bima AS "reviewerIdBima"
        FROM klaim k
        JOIN proposal pr ON pr.id = k.proposal_id
        JOIN akun a ON a.id = k.reviewer_id
        ORDER BY pr.id_proposal`),
    );
  });
  if (!diklaim.length) return { jumlah: 0 };
  const msKlaim = Date.now() - t0;

  const kelompok: (typeof diklaim)[] = [];
  for (let i = 0; i < diklaim.length; i += UKURAN_KELOMPOK_KIRIM) kelompok.push(diklaim.slice(i, i + UKURAN_KELOMPOK_KIRIM));

  const gagal: { ids: string[]; galat: string }[] = [];
  let berikut = 0;
  async function pekerja() {
    for (;;) {
      const i = berikut++;
      if (i >= kelompok.length) return;
      const isi = kelompok[i];
      try {
        await kirimPenugasan({
          periodeId,
          penugasan: isi.map((u) => ({ idProposal: u.idProposal, reviewerIdBima: u.reviewerIdBima, tanggal: waktu.toISOString(), kunci: u.id })),
        });
      } catch (e) {
        gagal.push({ ids: isi.map((u) => u.id), galat: e instanceof Error ? e.message : String(e) });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(KELOMPOK_SERENTAK, kelompok.length) }, pekerja));

  if (gagal.length) {
    // kompensasi hanya untuk kelompok yang gagal; kelompok lain sudah tercatat di BIMA
    for (const g of gagal) await db.update(penugasanReviewer).set({ status: "Diusulkan" }).where(inArray(penugasanReviewer.id, g.ids));
    const jumlahGagal = gagal.reduce((n, g) => n + g.ids.length, 0);
    await catatLogAudit({
      aktor,
      aksi: "tetapkan_penugasan_gagal_kirim",
      objek: `periode:${periodeId}`,
      rincian: { jumlah: diklaim.length, gagal: jumlahGagal, kelompokGagal: gagal.length, galat: gagal[0].galat },
    });
    const pesan = jumlahGagal === diklaim.length ? gagal[0].galat : `${jumlahGagal} dari ${diklaim.length} penugasan gagal dikirim (${gagal[0].galat}); sisanya sudah tercatat di BIMA`;
    throw new BimaGagalError(pesan);
  }

  await catatLogAudit({
    aktor,
    aksi: "tetapkan_penugasan",
    objek: `periode:${periodeId}`,
    rincian: { jumlah: diklaim.length, kelompok: kelompok.length, totalMs: Date.now() - t0, klaimMs: msKlaim, kirimMs: Date.now() - t0 - msKlaim },
  });
  return { jumlah: diklaim.length };
}

export interface KandidatPengganti {
  id: string;
  nama: string;
  institusi: string;
  beban: number;
}

/** Pilihan "Reviewer Pengganti" (S-2): reviewer yang bersedia beserta bebannya saat ini. */
export async function ambilKandidatPengganti(periodeId: string): Promise<KandidatPengganti[]> {
  return (await ambilReviewerPeriode(periodeId)).map((r) => ({ id: r.id, nama: r.nama, institusi: r.institusi, beban: r.beban })).sort((a, b) => a.nama.localeCompare(b.nama));
}

/** Baris yang dipindahkan: daftar id penugasan, atau semua baris Diusulkan yang cocok dengan filter ("Pilih semua hasil filter"). */
export type PilihanPindah = { ids: string[] } | { filter: FilterUsulan };

export interface HasilPindahBanyak {
  dipilih: number;
  dipindahkan: number;
  ditolak: number;
  /** pengelompokan syarat yang dilanggar: jenis, jumlah baris, satu contoh teks persis S-2.3 */
  alasan: { kode: KodeSyarat; jumlah: number; contoh: string }[];
  /** reviewer tujuan beserta jumlah proposal yang diterima (otomatis bisa banyak) */
  tujuan: { reviewerId: string; nama: string; jumlah: number }[];
}

/**
 * UC-03 S-2 untuk satu atau banyak baris (pratinjau bila `simpan` false). Dalam transaksi berkunci per periode: baca baris Diusulkan
 * yang dipilih beserta institusi pengusulnya, beban saat ini, dan kumpulan reviewer; rencanakanPindah memeriksa ulang syarat
 * baris demi baris (pilihReviewer); yang memenuhi dipindahkan dengan UPDATE ... WHERE status = 'Diusulkan', yang tidak tetap pada
 * reviewer semula beserta syarat yang dilanggar.
 */
export async function pindahkanBanyak(periodeId: string, pilihan: PilihanPindah, tujuan: TujuanPindah, opsi: { simpan: boolean; aktor: string }): Promise<HasilPindahBanyak> {
  const hasil = await denganKunciPeriode(periodeId, async (tx) => {
    const batas = await batasPeriode(periodeId, tx);
    const saring =
      "ids" in pilihan
        ? sql`FROM penugasan_reviewer pr JOIN proposal p ON p.id = pr.proposal_id JOIN akun pg ON pg.id = p.pengusul_id
              WHERE pr.periode_id = ${periodeId}::uuid AND pr.status = 'Diusulkan' AND pr.id IN (SELECT jsonb_array_elements_text(${JSON.stringify(pilihan.ids)}::jsonb)::uuid)`
        : dasarUsulan(periodeId, "Diusulkan", pilihan.filter, batas);
    const terpilih = baris<{ penugasanId: string; institusiPengusul: string; reviewerId: string }>(
      await tx.execute(sql`SELECT pr.id AS "penugasanId", pg.institusi AS "institusiPengusul", pr.reviewer_id AS "reviewerId" ${saring} ORDER BY p.id_proposal`),
    );
    // termasuk reviewer kumpulan yang tidak bersedia: memilih mereka ditolak dengan teks S-2.3 "tidak bersedia", bukan "tidak ditemukan"
    const reviewer = await ambilReviewerPeriode(periodeId, tx, { termasukTidakBersedia: true });
    const beban = Object.fromEntries(reviewer.map((r) => [r.id, r.beban]));
    // reviewer asal yang tidak lagi bersedia/di luar kumpulan tetap dihitung bebannya
    for (const t of terpilih) beban[t.reviewerId] ??= 0;
    const rencana = rencanakanPindah(terpilih, tujuan, reviewer, beban, batas);

    // yang benar-benar pindah dihitung dari RETURNING (baris yang sudah ditetapkan di antaranya tidak ikut)
    let diterima = rencana.diterima;
    if (opsi.simpan && rencana.diterima.length) {
      const muatan = JSON.stringify(rencana.diterima.map((d) => ({ i: d.penugasanId, r: d.ke })));
      const pindah = new Set(
        baris<{ id: string }>(
          await tx.execute(sql`
            UPDATE penugasan_reviewer pr SET reviewer_id = (x->>'r')::uuid
            FROM jsonb_array_elements(${muatan}::jsonb) AS x
            WHERE pr.id = (x->>'i')::uuid AND pr.status = 'Diusulkan'
            RETURNING pr.id`),
        ).map((r) => r.id),
      );
      diterima = rencana.diterima.filter((d) => pindah.has(d.penugasanId));
    }
    const nama = new Map(reviewer.map((r) => [r.id, r.nama]));
    const perTujuan = new Map<string, number>();
    for (const d of diterima) perTujuan.set(d.ke, (perTujuan.get(d.ke) ?? 0) + 1);
    return {
      dipilih: terpilih.length,
      dipindahkan: diterima.length,
      ditolak: rencana.ditolak.length,
      alasan: kelompokkanPenolakan(rencana.ditolak),
      tujuan: [...perTujuan.entries()].map(([reviewerId, jumlah]) => ({ reviewerId, nama: nama.get(reviewerId) ?? "-", jumlah })).sort((a, b) => b.jumlah - a.jumlah),
    };
  });
  if (opsi.simpan) {
    await catatLogAudit({
      aktor: opsi.aktor,
      aksi: hasil.dipindahkan ? "pindah_penugasan" : "pindah_penugasan_ditolak",
      objek: `periode:${periodeId}`,
      rincian: { dipilih: hasil.dipilih, dipindahkan: hasil.dipindahkan, ditolak: hasil.ditolak, tujuan: tujuan.jenis === "otomatis" ? "otomatis" : tujuan.reviewerId, alasan: hasil.alasan.map((a) => `${a.kode}:${a.jumlah}`) },
    });
  }
  return hasil;
}

export interface RingkasanPeriode extends HitungPeriode {
  id: string;
  /** reviewer bersedia dalam kumpulan reviewer periode (hanya diisi daftar J-04) */
  reviewerBersedia?: number;
  nama: string;
  tahun: number;
  tanggalBuka: Date;
  tanggalTutup: Date;
  batasBeban: number;
  ditutup: boolean;
  /** masa penilaian: lama, jam per hari, menit per proposal */
  masa: ParamMasa;
  /** null sebelum penugasan pertama ditetapkan */
  mulaiPenilaian: Date | null;
  batasPenilaian: Date | null;
  /** jam demo saat dibaca (perkiraan tenggat M-07) */
  sekarang: Date;
}

/** Satu periode beserta ringkasan penetapannya (J-04b), atau null bila id tidak dikenal. */
export async function ambilRingkasanPeriode(periodeId: string): Promise<RingkasanPeriode | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(periodeId)) return null;
  const db = getDb();
  const [p] = await db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, periodeId));
  if (!p) return null;
  const [terkirim, belumDitugaskan, diusulkan, ditetapkan, sakelarBerjalan, sekarang, periodeBerjalanId] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(proposal).where(and(eq(proposal.periodeId, periodeId), eq(proposal.status, "Terkirim"))),
    hitungPerluDitugaskan(periodeId),
    hitungPenugasan(periodeId, "Diusulkan"),
    hitungPenugasan(periodeId, "Ditetapkan"),
    masaPengusulanBerjalan(),
    waktuDemo(),
    ambilPeriodeBerjalanId(),
  ]);
  const berjalan = masaBerjalanUntuk(sakelarBerjalan, p.id, periodeBerjalanId);
  return {
    id: p.id,
    nama: p.nama,
    tahun: p.tahun,
    tanggalBuka: p.tanggalBuka,
    tanggalTutup: p.tanggalTutup,
    batasBeban: p.batasBebanReviewer,
    masa: masaPeriode(p),
    mulaiPenilaian: p.mulaiPenilaian,
    batasPenilaian: p.batasPenilaian,
    sekarang,
    terkirim: terkirim[0].n,
    belumDitugaskan,
    diusulkan,
    ditetapkan,
    ditutup: periodeDitutup({ tanggalTutup: p.tanggalTutup, sekarang, masaBerjalan: berjalan }),
  };
}

/**
 * Daftar J-04 (UC-03 s.1): periode yang masa pengusulannya sudah ditutup beserta ringkasan (jumlah Terkirim, belum ditugaskan,
 * usulan, ditetapkan). Dihitung dengan empat kueri GROUP BY, bukan per periode. `jumlahBerjalan` = periode yang belum ditutup.
 */
export async function daftarPeriodeDitutup(): Promise<{ periode: RingkasanPeriode[]; jumlahBerjalan: number }> {
  const db = getDb();
  const [semua, sakelarBerjalan, sekarang, periodeBerjalanId] = await Promise.all([
    db.select().from(periodeSeleksi).where(periodeSudahDibuka()).orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka)),
    masaPengusulanBerjalan(),
    waktuDemo(),
    ambilPeriodeBerjalanId(),
  ]);
  const [terkirim, belum, penugasan, reviewer] = await Promise.all([
    db.select({ periodeId: proposal.periodeId, n: sql<number>`count(*)::int` }).from(proposal).where(eq(proposal.status, "Terkirim")).groupBy(proposal.periodeId),
    db
      .select({ periodeId: proposal.periodeId, n: sql<number>`count(*)::int` })
      .from(proposal)
      .where(sql`${proposal.status} = 'Terkirim' AND ${proposal.id} NOT IN (SELECT pr.proposal_id FROM penugasan_reviewer pr WHERE pr.status <> 'Diusulkan')`)
      .groupBy(proposal.periodeId),
    db
      .select({ periodeId: penugasanReviewer.periodeId, status: penugasanReviewer.status, n: sql<number>`count(*)::int` })
      .from(penugasanReviewer)
      .groupBy(penugasanReviewer.periodeId, penugasanReviewer.status),
    db.select({ idBima: akun.idBima }).from(akun).where(and(eq(akun.peran, "reviewer"), eq(akun.bersedia, true))),
  ]);
  const ambil = (daftar: { periodeId: string; n: number }[], id: string) => daftar.find((d) => d.periodeId === id)?.n ?? 0;
  const tugas = (id: string, status: string) => penugasan.find((x) => x.periodeId === id && x.status === status)?.n ?? 0;
  const semuaRingkas = semua.map((p): RingkasanPeriode => ({
    id: p.id,
    nama: p.nama,
    tahun: p.tahun,
    tanggalBuka: p.tanggalBuka,
    tanggalTutup: p.tanggalTutup,
    batasBeban: p.batasBebanReviewer,
    masa: masaPeriode(p),
    mulaiPenilaian: p.mulaiPenilaian,
    batasPenilaian: p.batasPenilaian,
    sekarang,
    terkirim: ambil(terkirim, p.id),
    belumDitugaskan: ambil(belum, p.id),
    diusulkan: tugas(p.id, "Diusulkan"),
    ditetapkan: tugas(p.id, "Ditetapkan") + tugas(p.id, "Selesai"),
    ditutup: periodeDitutup({ tanggalTutup: p.tanggalTutup, sekarang, masaBerjalan: masaBerjalanUntuk(sakelarBerjalan, p.id, periodeBerjalanId) }),
    reviewerBersedia: reviewer.filter((r) => dalamKumpulanPeriode(p.nama, r.idBima)).length,
  }));
  return { periode: semuaRingkas.filter((p) => p.ditutup), jumlahBerjalan: semuaRingkas.filter((p) => !p.ditutup).length };
}

/** Periode untuk J-04 (lama): periode aktif pengaturan demo (skenario uji beban) atau periode terbaru menurut tahun. */
export const ambilPeriodeTerbaru = ambilPeriodeAktif;

/* ------------------------------ metode seq-uc03 ------------------------------ */

/** ambilDaftarReviewer() (langkah 3): daftar reviewer BIMA lewat klien HTTP (ulang otomatis maksimal 2 kali). */
export const ambilDaftarReviewer = () => bima.ambilDaftarReviewer();

/** kirimPenugasan(): penugasan yang ditetapkan dikirim ke BIMA lewat klien HTTP. */
export const kirimPenugasan = (payload: Parameters<typeof bima.kirimPenugasan>[0]) => bima.kirimPenugasan(payload);

/**
 * tetapkan(), mencatatPenugasan(), terimaProposal(): ketiganya dijalankan di dalam tetapkanPenugasan (alias nominal, tidak dipanggil sendiri).
 * Urutannya bukan satu transaksi basis data: status diklaim atomik, BIMA dipanggil, dan status dikembalikan (kompensasi) bila BIMA gagal.
 */
export const tetapkan = tetapkanPenugasan;
export const mencatatPenugasan = tetapkanPenugasan;
export const terimaProposal = tetapkanPenugasan;
