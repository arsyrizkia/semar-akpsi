/**
 * UC-03 Menugaskan reviewer: tetapkanBatasBeban, susunPenugasan, pilihReviewer, tetapkan, mencatatPenugasan,
 * kirimPenugasan (API BIMA lewat client), terimaProposal. Nama fungsi mengikuti seq-uc03.puml.
 */
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { akun, penugasanReviewer, periodeSeleksi, proposal, skemaPendanaan, versiProposal } from "@/db/schema";
import { pastikanAkunMassal } from "@/lib/auth";
import { bima, BimaGagalError } from "@/lib/bima/client";
import { catatLogAudit } from "@/lib/audit";
import { ambilPeriodeAktif, masaPengusulanBerjalan } from "@/lib/waktu";
import type { BarisUsulanPenugasan, HasilPilihReviewer, HasilSusunPenugasan, SebaranBeban } from "@/lib/kontrak/tipe";
import { periksaSyarat, susunUsulanMurni } from "./aturan";

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

/** Beban = jumlah penugasan reviewer pada periode (semua status), kecuali penugasan yang dikecualikan. Dihitung di basis data (GROUP BY). */
async function bebanPerReviewer(periodeId: string, kecualiPenugasanId?: string): Promise<Record<string, number>> {
  const db = getDb();
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

/** Jumlah usulan/penugasan berstatus tertentu pada periode (untuk ringkasan dan penomoran halaman). */
export async function hitungPenugasan(periodeId: string, status: "Diusulkan" | "Ditetapkan"): Promise<number> {
  const [{ n }] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(penugasanReviewer)
    .where(and(eq(penugasanReviewer.periodeId, periodeId), eq(penugasanReviewer.status, status)));
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

/**
 * Usulan (status Diusulkan) atau penugasan Ditetapkan beserta data tampilan untuk satu periode, berhalaman di basis data
 * (urut id proposal lalu id penugasan). Tanpa `opsi.halaman` seluruh baris dikembalikan (hanya untuk data kecil).
 */
export async function ambilUsulan(
  periodeId: string,
  status: "Diusulkan" | "Ditetapkan" = "Diusulkan",
  opsi: { halaman?: number; ukuran?: number } = {},
): Promise<BarisUsulanPenugasan[]> {
  const db = getDb();
  const pengusul = alias(akun, "pengusul");
  const rev = alias(akun, "rev");
  const kueri = db
    .select({
      penugasanId: penugasanReviewer.id,
      proposalId: proposal.id,
      judulProposal: proposal.judul,
      skema: skemaPendanaan.namaSkema,
      institusiPengusul: pengusul.institusi,
      reviewerId: penugasanReviewer.reviewerId,
      namaReviewer: rev.nama,
      institusiReviewer: rev.institusi,
    })
    .from(penugasanReviewer)
    .innerJoin(proposal, eq(penugasanReviewer.proposalId, proposal.id))
    .innerJoin(skemaPendanaan, eq(proposal.skemaId, skemaPendanaan.id))
    .innerJoin(pengusul, eq(pengusul.id, proposal.pengusulId))
    .innerJoin(rev, eq(rev.id, penugasanReviewer.reviewerId))
    .where(and(eq(penugasanReviewer.periodeId, periodeId), eq(penugasanReviewer.status, status)))
    .orderBy(asc(proposal.idProposal), asc(penugasanReviewer.id));
  const baris = opsi.halaman
    ? await kueri.limit(opsi.ukuran ?? UKURAN_HALAMAN_USULAN).offset((Math.max(1, opsi.halaman) - 1) * (opsi.ukuran ?? UKURAN_HALAMAN_USULAN))
    : await kueri;
  return baris;
}

/** Tabel "Sebaran Beban": jumlah proposal setiap reviewer yang bersedia terhadap batas (semua reviewer, bukan hanya satu halaman). */
export async function ambilSebaranBeban(periodeId: string, batas: number): Promise<SebaranBeban[]> {
  const db = getDb();
  const reviewer = await db.select().from(akun).where(and(eq(akun.peran, "reviewer"), eq(akun.bersedia, true)));
  const beban = await bebanPerReviewer(periodeId);
  return reviewer
    .map((r) => ({ reviewerId: r.id, namaReviewer: r.nama, jumlah: beban[r.id] ?? 0, batas }))
    .sort((a, b) => b.jumlah - a.jumlah || a.namaReviewer.localeCompare(b.namaReviewer));
}

/** tetapkanBatasBeban(batas) pada objek periode. */
export async function tetapkanBatasBeban(periodeId: string, batas: number): Promise<void> {
  if (!Number.isInteger(batas) || batas < 1) throw new Error("Batas Beban per Reviewer harus bilangan bulat minimal 1.");
  await getDb().update(periodeSeleksi).set({ batasBebanReviewer: batas }).where(eq(periodeSeleksi.id, periodeId));
}

/**
 * UC-03 s.2-5 (+ S-1). Menggantikan usulan lama (status Diusulkan) bila ada. Penugasan yang sudah Ditetapkan
 * tidak diubah dan dihitung sebagai beban awal. Bila reviewer kurang (S-1), usulan tidak disusun.
 */
export async function susunPenugasan(periodeId: string, batasBeban: number): Promise<HasilSusunPenugasan> {
  const db = getDb();
  if (await masaPengusulanBerjalan()) throw new MasaBelumDitutupError();

  const t0 = Date.now();
  const langkah: Record<string, number> = {};
  let tCatat = t0;
  const tandai = (nama: string) => {
    const t = Date.now();
    langkah[nama] = t - tCatat;
    tCatat = t;
  };

  await tetapkanBatasBeban(periodeId, batasBeban);

  // ambilDaftarReviewer() melalui API BIMA (client mengulang otomatis maksimal 2 kali)
  const daftar = (await ambilDaftarReviewer()).filter((r) => r.bersedia);
  tandai("daftarReviewerBima");
  const reviewerSemar = (await pastikanAkunMassal(daftar.map((r) => r.idBima))).filter((a) => a.peran === "reviewer");
  tandai("salinAkunReviewer");

  // proposal Terkirim pada periode yang belum ditetapkan penugasannya, beserta institusi pengusul (satu kueri, tanpa N+1)
  const pengusul = alias(akun, "pengusul");
  const perluDitugaskan = await db
    .select({ id: proposal.id, judul: proposal.judul, institusiPengusul: pengusul.institusi })
    .from(proposal)
    .innerJoin(pengusul, eq(pengusul.id, proposal.pengusulId))
    .where(sql`${proposal.periodeId} = ${periodeId} AND ${proposal.status} = 'Terkirim' AND ${proposal.id} NOT IN (${sudahDitetapkan(periodeId)})`);

  tandai("bacaProposal");

  // beban awal: penugasan yang sudah ditetapkan atau selesai (usulan lama akan diganti)
  const tetap = await db
    .select({ reviewerId: penugasanReviewer.reviewerId, jumlah: sql<number>`count(*)::int` })
    .from(penugasanReviewer)
    .where(and(eq(penugasanReviewer.periodeId, periodeId), ne(penugasanReviewer.status, "Diusulkan")))
    .groupBy(penugasanReviewer.reviewerId);
  const bebanAwal: Record<string, number> = Object.fromEntries(tetap.map((t) => [t.reviewerId, t.jumlah]));

  const hasil = susunUsulanMurni(
    perluDitugaskan.map((p) => ({ id: p.id, institusiPengusul: p.institusiPengusul ?? "-" })),
    reviewerSemar.map((r) => ({ id: r.id, nama: r.nama, institusi: r.institusi })),
    bebanAwal,
    batasBeban,
  );
  tandai("algoritma");

  // S-1: reviewer tidak cukup, usulan tidak disusun. Usulan lama dibuang supaya tidak ada usulan yang melanggar batas baru dan dapat ditetapkan.
  if (hasil.belumDitugaskan.length > 0) {
    await db.delete(penugasanReviewer).where(and(eq(penugasanReviewer.periodeId, periodeId), eq(penugasanReviewer.status, "Diusulkan")));
    await catatLogAudit({
      aktor: "sistem",
      aksi: "susun_penugasan_kekurangan_reviewer",
      objek: `periode:${periodeId}`,
      rincian: { batasBeban, belumDitugaskan: hasil.belumDitugaskan.length, reviewerBersedia: reviewerSemar.length, langkahMs: langkah },
    });
    return {
      periodeId,
      usulan: [],
      jumlahUsulan: 0,
      sebaran: await ambilSebaranBeban(periodeId, batasBeban),
      jumlahBelumDitugaskan: hasil.belumDitugaskan.length,
    };
  }

  // versi terbaru setiap proposal yang akan ditugaskan (satu kueri DISTINCT ON)
  const versiTerbaru = new Map<string, string>();
  if (perluDitugaskan.length) {
    const versi = await db
      .selectDistinctOn([versiProposal.proposalId], { id: versiProposal.id, proposalId: versiProposal.proposalId })
      .from(versiProposal)
      .innerJoin(proposal, eq(proposal.id, versiProposal.proposalId))
      .where(and(eq(proposal.periodeId, periodeId), eq(proposal.status, "Terkirim")))
      .orderBy(versiProposal.proposalId, desc(versiProposal.nomor));
    for (const v of versi) versiTerbaru.set(v.proposalId, v.id);
  }

  // simpan usulan baru (status Diusulkan) menggantikan usulan lama. Sisipan massal: satu INSERT ... SELECT dari array JSON per
  // 5.000 baris (satu round trip, bukan ribuan parameter), di dalam satu transaksi dengan penghapusan usulan lama.
  await db.transaction(async (tx) => {
    await tx.delete(penugasanReviewer).where(and(eq(penugasanReviewer.periodeId, periodeId), eq(penugasanReviewer.status, "Diusulkan")));
    for (let i = 0; i < hasil.penugasan.length; i += UKURAN_SISIP) {
      const potongan = JSON.stringify(
        hasil.penugasan.slice(i, i + UKURAN_SISIP).map((p) => ({ p: p.proposalId, v: versiTerbaru.get(p.proposalId) ?? null, r: p.reviewerId })),
      );
      await tx.execute(sql`
        INSERT INTO penugasan_reviewer (proposal_id, versi_id, reviewer_id, periode_id, status, label)
        SELECT (x->>'p')::uuid, (x->>'v')::uuid, (x->>'r')::uuid, ${periodeId}::uuid, 'Diusulkan', 'Baru'
        FROM jsonb_array_elements(${potongan}::jsonb) AS x`);
    }
  });

  tandai("simpanUsulan");
  await catatLogAudit({
    aktor: "sistem",
    aksi: "susun_penugasan",
    objek: `periode:${periodeId}`,
    rincian: { batasBeban, jumlahUsulan: hasil.penugasan.length, totalMs: Date.now() - t0, langkahMs: langkah },
  });

  return {
    periodeId,
    usulan: await ambilUsulan(periodeId, "Diusulkan", { halaman: 1 }),
    jumlahUsulan: hasil.penugasan.length,
    sebaran: await ambilSebaranBeban(periodeId, batasBeban),
    jumlahBelumDitugaskan: 0,
  };
}

/**
 * UC-03 S-2.2/S-2.3: periksa ulang syarat institusi, kesediaan, dan beban bagi reviewer pengganti.
 * Bila memenuhi, baris penugasan diperbarui; bila tidak, reviewer semula tetap dipakai dan syarat yang dilanggar dikembalikan.
 */
export async function pilihReviewer(penugasanId: string, reviewerBaruId: string, aktor = "sistem"): Promise<HasilPilihReviewer> {
  const db = getDb();
  const [pn] = await db.select().from(penugasanReviewer).where(eq(penugasanReviewer.id, penugasanId));
  if (!pn) throw new Error("Penugasan tidak ditemukan.");
  if (pn.status !== "Diusulkan") {
    return { reviewerId: pn.reviewerId, diterima: false, syaratDilanggar: ["Penugasan sudah ditetapkan dan tidak dapat dipindahkan."] };
  }
  const [pr] = await db.select().from(proposal).where(eq(proposal.id, pn.proposalId));
  const [pengusul] = await db.select().from(akun).where(eq(akun.id, pr.pengusulId));
  const [baru] = await db.select().from(akun).where(eq(akun.id, reviewerBaruId));
  if (!baru || baru.peran !== "reviewer") {
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
  await db.update(penugasanReviewer).set({ reviewerId: baru.id }).where(eq(penugasanReviewer.id, pn.id));
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
  const waktu = new Date();
  const t0 = Date.now();
  // klaim atomik: hanya baris yang masih Diusulkan yang diproses, jadi dua klik serentak tidak mengirim penugasan ganda
  const hasilKlaim = await db.execute(sql`
    WITH klaim AS (
      UPDATE penugasan_reviewer SET status = 'Ditetapkan', label = 'Baru', tanggal = ${waktu.toISOString()}
      WHERE periode_id = ${periodeId} AND status = 'Diusulkan'
      RETURNING id, proposal_id, reviewer_id
    )
    SELECT k.id AS id, pr.id_proposal AS "idProposal", a.id_bima AS "reviewerIdBima"
    FROM klaim k
    JOIN proposal pr ON pr.id = k.proposal_id
    JOIN akun a ON a.id = k.reviewer_id
    ORDER BY pr.id_proposal`);
  const diklaim = (hasilKlaim as unknown as { rows: { id: string; idProposal: string; reviewerIdBima: string }[] }).rows;
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
  const reviewer = await getDb().select().from(akun).where(and(eq(akun.peran, "reviewer"), eq(akun.bersedia, true)));
  const beban = await bebanPerReviewer(periodeId);
  return reviewer
    .map((r) => ({ id: r.id, nama: r.nama, institusi: r.institusi, beban: beban[r.id] ?? 0 }))
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

/** Periode untuk J-04: periode aktif pengaturan demo (skenario skala nyata) atau periode terbaru menurut tahun. */
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
