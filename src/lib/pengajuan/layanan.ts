/**
 * UC-05 Mengajukan proposal, sisi SEMAR. Nama fungsi mengikuti seq-uc05.puml:
 * tarikDariBima, cekMasaPengusulan, ambilTemplatBerlaku, ambilAturanBerlaku, «create» VersiProposal (insert di prosesPengajuan),
 * potongTeks/potongPerBagian/ambilTeksBagian (potong.ts), jalankanPemeriksaan(deterministik), catatTerkirim.
 * SEMAR memanggil BIMA hanya lewat @/lib/bima/client (ulang otomatis maksimal 2 kali, NFR 4.4).
 */
import { and, asc, desc, eq, inArray, lt, max, min, ne } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bagianTemplat,
  basisAturan,
  butirCek,
  hasilPemeriksaan,
  logAudit,
  periodeSeleksi,
  proposal,
  skemaPendanaan,
  templatProposal,
  versiProposal,
} from "@/db/schema";
import type { Akun } from "../auth";
import { catatLogAudit } from "../audit";
import { simpanBerkas } from "../berkas";
import { bima, type RingkasanProposalBima } from "../bima/client";
import { antrekanPemeriksaanSemantik } from "../kontrak";
import { jalankanPemeriksaanDeterministik } from "../pemeriksa/deterministik";
import { masaPengusulanBerjalan, waktuDemo } from "../waktu";
import { ekstrakNaskah, ekstrakTeksLampiran } from "./ekstraksi";
import { potongTeks } from "./potong";
import type { KlaimPengajuan } from "./token";

export type Periode = typeof periodeSeleksi.$inferSelect;
export type Proposal = typeof proposal.$inferSelect;
export type VersiProposal = typeof versiProposal.$inferSelect;

/** Batas waktu pemeriksaan satu proposal (NFR 2.1). Lewat dari ini, J-06 menawarkan pengiriman ulang. */
export const BATAS_PEMERIKSAAN_MS = 125_000; // NFR 2.1: 2 menit, ditambah jeda sebelum J-06 menawarkan pengiriman ulang

/* ------------------------------ periode, templat, aturan ------------------------------ */

/** Prototipe hanya memiliki satu periode berjalan: periode terbaru. */
export async function ambilPeriodeBerjalan(): Promise<Periode> {
  const [p] = await getDb().select().from(periodeSeleksi).orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka)).limit(1);
  if (!p) throw new Error("belum ada periode seleksi");
  return p;
}

/**
 * cekMasaPengusulan() (UC-05 langkah 3): membandingkan waktu (jam demo) dengan tanggalBuka dan tanggalTutup periode.
 * Sakelar demo menggeser tanggalTutup (lihat ubahPengaturanDemo), jadi tanggal dan sakelar selalu searah; sakelar "ditutup" tetap menang.
 */
export async function cekMasaPengusulan(periode: Periode): Promise<{ berjalan: boolean; tanggalTutup: Date }> {
  const sekarang = await waktuDemo();
  const dalamRentang = sekarang >= periode.tanggalBuka && sekarang <= periode.tanggalTutup;
  return { berjalan: dalamRentang && (await masaPengusulanBerjalan()), tanggalTutup: periode.tanggalTutup };
}

/**
 * ambilTemplatBerlaku (versi UC-05): templat Terbit untuk periode tertentu, beserta bagiannya. Versi UC-01 di templat/layanan.ts
 * (ambilTemplatBerlaku(skemaId)) hanya membaca templat Terbit terbaru sebuah skema; keduanya sengaja berbeda tanda tangan.
 */
export async function ambilTemplatBerlaku(periodeId: string, skemaId: string) {
  const db = getDb();
  const daftar = await db
    .select()
    .from(templatProposal)
    .where(and(eq(templatProposal.skemaId, skemaId), eq(templatProposal.status, "Terbit")))
    .orderBy(desc(templatProposal.versi));
  const templat = daftar.find((t) => t.periodeBerlakuId === periodeId) ?? daftar[0];
  if (!templat) throw new Error("templat proposal yang berlaku belum terbit untuk skema ini");
  const bagian = await db.select().from(bagianTemplat).where(eq(bagianTemplat.templatId, templat.id)).orderBy(asc(bagianTemplat.urutan));
  return { templat, bagian };
}

export async function ambilAturanBerlaku(periodeId: string, skemaId: string) {
  const sekarang = await waktuDemo();
  const daftar = (
    await getDb()
      .select()
      .from(basisAturan)
      .where(and(eq(basisAturan.skemaId, skemaId), lt(basisAturan.tanggalBerlaku, new Date("9999-01-01T00:00:00Z"))))
      .orderBy(desc(basisAturan.versi))
  ).filter((b) => b.periodeId === null || b.periodeId === periodeId);
  const basis = daftar.find((b) => b.tanggalBerlaku <= sekarang) ?? daftar[0];
  if (!basis) throw new Error("basis aturan pemeriksaan belum tersedia untuk skema ini");
  return basis;
}

/* ------------------------------ BIMA ------------------------------ */

export interface BerkasDariBima {
  ringkasan: RingkasanProposalBima;
  naskah: { nama: string; tipe: string; bytes: Buffer };
  lampiran: { namaLampiran: string; nama: string; tipe: string; bytes: Buffer }[];
}

/** tarikDariBima(): metadata dan semua berkas (ambilBerkas) lewat klien BIMA. */
export async function tarikDariBima(idProposal: string): Promise<BerkasDariBima> {
  const ringkasan = await bima.ambilProposal(idProposal);
  if (!ringkasan.naskah) throw new Error("proposal di BIMA belum memiliki berkas naskah");
  const n = await bima.ambilBerkas(ringkasan.naskah.berkasId);
  const lampiran: BerkasDariBima["lampiran"] = [];
  for (const l of ringkasan.lampiran) {
    if (!l.namaLampiran) continue;
    const b = await bima.ambilBerkas(l.berkasId);
    lampiran.push({ namaLampiran: l.namaLampiran, nama: l.nama, tipe: l.tipe, bytes: b.bytes });
  }
  return { ringkasan, naskah: { nama: ringkasan.naskah.nama, tipe: ringkasan.naskah.tipe, bytes: n.bytes }, lampiran };
}

/** Cermin status ke halaman proposal BIMA. Kegagalan hanya dicatat; tidak menggagalkan pengajuan. */
async function salinStatusKeBima(idProposal: string, status: string) {
  try {
    await bima.kirimStatusProposal(idProposal, status);
  } catch (e) {
    await catatLogAudit({ aktor: "sistem", aksi: "bima.status_gagal", objek: idProposal, rincian: { status, galat: (e as Error).message } });
  }
}

/* ------------------------------ catatTerkirim ------------------------------ */

/** catatTerkirim(): status Terkirim + waktu pencatatan, lalu versi masuk antrean pemeriksaan semantik (UC-09). */
export async function catatTerkirim(proposalId: string, versiId: string): Promise<{ waktuTerkirim: Date }> {
  const db = getDb();
  const waktuTerkirim = new Date();
  const [p] = await db.update(proposal).set({ status: "Terkirim", waktuTerkirim }).where(eq(proposal.id, proposalId)).returning();
  const [v] = await db.select().from(versiProposal).where(eq(versiProposal.id, versiId));
  await catatLogAudit({
    aktor: "sistem",
    aksi: "proposal.terkirim",
    objek: p.idProposal,
    rincian: { kodeVersi: v?.kode, versiId, waktuTerkirim: waktuTerkirim.toISOString() },
  });
  try {
    const { jobId } = await antrekanPemeriksaanSemantik(versiId);
    await catatLogAudit({ aktor: "sistem", aksi: "semantik.diantrekan", objek: p.idProposal, rincian: { versiId, jobId } });
  } catch (e) {
    await catatLogAudit({ aktor: "sistem", aksi: "semantik.antre_gagal", objek: p.idProposal, rincian: { versiId, galat: (e as Error).message } });
  }
  await salinStatusKeBima(p.idProposal, "Terkirim");
  return { waktuTerkirim };
}

/* ------------------------------ pengajuan ------------------------------ */

export type HasilMulai =
  | { status: "diproses"; proposalId: string }
  | { status: "ditolak"; proposalId: string }
  | { status: "sudah-terkirim"; proposalId: string }
  | { status: "duplikat"; proposalId: string | null };

async function idProposalSemar(idProposal: string): Promise<string | null> {
  const [p] = await getDb().select({ id: proposal.id }).from(proposal).where(eq(proposal.idProposal, idProposal));
  return p?.id ?? null;
}

/**
 * Langkah 3 UC-05 (sinkron, cepat): tarikDariBima() → cekMasaPengusulan(). Bila ditutup, pengajuan ditolak (3a)
 * tanpa memanggil API BIMA dan tanpa versi baru. Bila berjalan, pemeriksaan dijadwalkan di latar belakang
 * (`jadwalkan` = after() Next.js) dan J-06 menampilkan "Pemeriksaan sedang berjalan".
 */
export async function mulaiPengajuan(klaim: KlaimPengajuan, pengusul: Akun, jadwalkan: (kerja: () => Promise<void>) => void): Promise<HasilMulai> {
  const db = getDb();
  if (pengusul.idBima !== klaim.idBima || pengusul.peran !== "pengusul") throw new Error("identitas pengusul tidak cocok dengan token");

  // satu token = satu pengajuan: entri audit pertama untuk jti menang (reload halaman tidak membuat versi ganda)
  const [saya] = await db
    .insert(logAudit)
    .values({ aktor: pengusul.idBima, aksi: "pengajuan.diterima", objek: klaim.jti, rincian: { idProposal: klaim.idProposal } })
    .returning({ id: logAudit.id });
  const [pertama] = await db.select({ id: min(logAudit.id) }).from(logAudit).where(and(eq(logAudit.aksi, "pengajuan.diterima"), eq(logAudit.objek, klaim.jti)));
  if (pertama.id !== saya.id) return { status: "duplikat", proposalId: await idProposalSemar(klaim.idProposal) };

  const periode = await ambilPeriodeBerjalan();
  const [ada] = await db.select().from(proposal).where(eq(proposal.idProposal, klaim.idProposal));
  if (ada && ada.pengusulId !== pengusul.id) throw new Error("proposal ini bukan milik pengusul yang masuk");
  if (ada?.status === "Terkirim") return { status: "sudah-terkirim", proposalId: ada.id };

  const masa = await cekMasaPengusulan(periode);
  let p: Proposal;
  if (ada) {
    p = ada;
  } else {
    const [skema] = await db.select().from(skemaPendanaan).where(eq(skemaPendanaan.kode, klaim.skemaKode));
    if (!skema) throw new Error(`skema tidak dikenal: ${klaim.skemaKode}`);
    [p] = await db
      .insert(proposal)
      .values({ idProposal: klaim.idProposal, judul: klaim.judul, skemaId: skema.id, periodeId: periode.id, pengusulId: pengusul.id, status: "Belum diajukan" })
      .returning();
  }

  if (!masa.berjalan) {
    // 3a: masa pengusulan sudah ditutup
    await db.update(proposal).set({ status: "Ditolak" }).where(eq(proposal.id, p.id));
    await catatLogAudit({
      aktor: pengusul.idBima,
      aksi: "pengajuan.ditolak",
      objek: p.idProposal,
      rincian: { alasan: "masa pengusulan ditutup", tanggalTutup: masa.tanggalTutup.toISOString() },
    });
    return { status: "ditolak", proposalId: p.id };
  }

  await db.update(proposal).set({ status: "Sedang diperiksa" }).where(eq(proposal.id, p.id));
  await catatLogAudit({ aktor: pengusul.idBima, aksi: "pengajuan.mulai", objek: p.idProposal, rincian: { jti: klaim.jti } });
  jadwalkan(() => prosesPengajuan(p.id));
  return { status: "diproses", proposalId: p.id };
}

/** Kirim ulang atas kegagalan (BIMA tidak terjangkau, batas waktu): tombol "Kirim ulang" di J-06. */
export async function kirimUlangPengajuan(proposalId: string, pengusul: Akun, jadwalkan: (kerja: () => Promise<void>) => void): Promise<boolean> {
  const db = getDb();
  const [p] = await db.select().from(proposal).where(eq(proposal.id, proposalId));
  if (!p || p.pengusulId !== pengusul.id || p.status === "Terkirim") return false;
  const periode = await ambilPeriodeBerjalan();
  if (!(await cekMasaPengusulan(periode)).berjalan) {
    await db.update(proposal).set({ status: "Ditolak" }).where(eq(proposal.id, p.id));
    await catatLogAudit({ aktor: pengusul.idBima, aksi: "pengajuan.ditolak", objek: p.idProposal, rincian: { alasan: "masa pengusulan ditutup" } });
    return true;
  }
  // klik ganda atau dua tab tidak boleh menjalankan dua pemeriksaan yang berebut nomor versi
  if (p.status === "Sedang diperiksa") {
    const [terakhir] = await db
      .select({ waktu: logAudit.waktu })
      .from(logAudit)
      .where(and(eq(logAudit.aksi, "pengajuan.mulai"), eq(logAudit.objek, p.idProposal)))
      .orderBy(desc(logAudit.id))
      .limit(1);
    if (terakhir && Date.now() - terakhir.waktu.getTime() <= BATAS_PEMERIKSAAN_MS) return false; // masih berjalan
  }
  const klaim = await db
    .update(proposal)
    .set({ status: "Sedang diperiksa" })
    .where(and(eq(proposal.id, p.id), eq(proposal.status, p.status), ne(proposal.status, "Terkirim")))
    .returning({ id: proposal.id });
  if (klaim.length === 0) return false;
  await catatLogAudit({ aktor: pengusul.idBima, aksi: "pengajuan.mulai", objek: p.idProposal, rincian: { kirimUlang: true } });
  jadwalkan(() => prosesPengajuan(p.id));
  return true;
}

/**
 * Langkah 4 sampai 10 UC-05 di latar belakang: ambilBerkas → ambilTemplatBerlaku/ambilAturanBerlaku → «create» VersiProposal
 * → potongTeks → jalankanPemeriksaan(deterministik) → catatTerkirim bila semua butir lolos, selain itu Ditahan (S-1).
 */
export async function prosesPengajuan(proposalId: string): Promise<void> {
  const db = getDb();
  const [p] = await db.select().from(proposal).where(eq(proposal.id, proposalId));
  if (!p) return;
  let versiId: string | null = null;
  try {
    const periode = await ambilPeriodeBerjalan();
    const dariBima = await tarikDariBima(p.idProposal);
    const [skema] = await db.select().from(skemaPendanaan).where(eq(skemaPendanaan.id, p.skemaId));
    const { templat, bagian } = await ambilTemplatBerlaku(periode.id, skema.id);
    const basis = await ambilAturanBerlaku(periode.id, skema.id);

    const hasilPotong = potongTeks(
      await ekstrakNaskah(dariBima.naskah.bytes, dariBima.naskah.nama, dariBima.naskah.tipe),
      bagian.map((b) => ({ urutan: b.urutan, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })),
    );
    const teksLampiran: Record<string, string> = {};
    for (const l of dariBima.lampiran) teksLampiran[l.namaLampiran] = await ekstrakTeksLampiran(l.bytes, l.nama, l.tipe);

    const berkas = await simpanBerkas({ ruang: "semar", nama: dariBima.naskah.nama, tipe: dariBima.naskah.tipe, bytes: dariBima.naskah.bytes, peran: "naskah" });
    const [{ nomorTerakhir }] = await db.select({ nomorTerakhir: max(versiProposal.nomor) }).from(versiProposal).where(eq(versiProposal.proposalId, p.id));
    const nomor = (nomorTerakhir ?? 0) + 1;
    const [versi] = await db
      .insert(versiProposal)
      .values({
        proposalId: p.id,
        nomor,
        kode: `V${nomor}`,
        templatId: templat.id,
        basisAturanId: basis.id,
        berkasId: berkas.id,
        teksPerBagian: hasilPotong.teksPerBagian,
        kataKunci: hasilPotong.kataKunci ?? dariBima.ringkasan.kataKunci,
        lampiranAda: dariBima.lampiran.map((l) => l.namaLampiran),
        teksLampiran,
        judulBagianDitemukan: hasilPotong.judulBagianDitemukan,
        judulDokumen: hasilPotong.judulDokumen,
        statusPemeriksaan: "Sedang diperiksa",
      })
      .returning();
    versiId = versi.id;
    if (p.judul !== dariBima.ringkasan.judul) await db.update(proposal).set({ judul: dariBima.ringkasan.judul }).where(eq(proposal.id, p.id));

    const hasil = await jalankanPemeriksaanDeterministik(versi.id);
    if (hasil.semuaLolos) {
      await catatTerkirim(p.id, versi.id);
    } else {
      // S-1: pengiriman ditahan; versi tidak masuk antrean semantik
      await db.update(proposal).set({ status: "Ditahan" }).where(eq(proposal.id, p.id));
      await catatLogAudit({
        aktor: "sistem",
        aksi: "pengajuan.ditahan",
        objek: p.idProposal,
        rincian: { kodeVersi: versi.kode, jumlahGagal: hasil.jumlahGagal },
      });
      await salinStatusKeBima(p.idProposal, "Ditahan");
    }
  } catch (e) {
    const galat = e instanceof Error ? e.message : String(e);
    if (versiId) await db.update(versiProposal).set({ statusPemeriksaan: "Gagal" }).where(eq(versiProposal.id, versiId));
    const selesai = await db
      .select({ id: versiProposal.id })
      .from(versiProposal)
      .where(and(eq(versiProposal.proposalId, p.id), eq(versiProposal.statusPemeriksaan, "Selesai")))
      .limit(1);
    await db.update(proposal).set({ status: selesai.length ? "Ditahan" : "Belum diajukan" }).where(eq(proposal.id, p.id));
    await catatLogAudit({ aktor: "sistem", aksi: "pengajuan.gagal", objek: p.idProposal, rincian: { galat } });
  }
}

/* ------------------------------ data J-06 ------------------------------ */

export interface BarisHasilPengajuan {
  butirId: string;
  kode: string;
  nama: string;
  bagian: string | null;
  status: "Lolos" | "Gagal";
  angkaPembukti: string;
  batasDilanggar: string | null;
}

export interface DataHasilPengajuan {
  proposal: Proposal;
  namaSkema: string;
  tanggalTutup: Date;
  versi: VersiProposal | null;
  hasil: BarisHasilPengajuan[];
  sedangDiperiksa: boolean;
  /** pemeriksaan berhenti karena galat atau melewati batas waktu: tawarkan "Kirim ulang" */
  gagal: { sebab: "galat" | "batas-waktu"; pesan: string } | null;
}

export async function ambilStatusPengajuan(idProposal: string, pengusulId: string): Promise<DataHasilPengajuan | null> {
  const db = getDb();
  const [p] = await db.select().from(proposal).where(and(eq(proposal.idProposal, idProposal), eq(proposal.pengusulId, pengusulId)));
  if (!p) return null;
  const [skema] = await db.select().from(skemaPendanaan).where(eq(skemaPendanaan.id, p.skemaId));
  const [periode] = await db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, p.periodeId));

  const [versi] = await db
    .select()
    .from(versiProposal)
    .where(and(eq(versiProposal.proposalId, p.id), eq(versiProposal.statusPemeriksaan, "Selesai")))
    .orderBy(desc(versiProposal.nomor))
    .limit(1);

  let hasil: BarisHasilPengajuan[] = [];
  if (versi) {
    const baris = await db
      .select({ h: hasilPemeriksaan, urutan: butirCek.urutan, deskripsi: butirCek.deskripsi })
      .from(hasilPemeriksaan)
      .innerJoin(butirCek, eq(hasilPemeriksaan.butirId, butirCek.id))
      .where(and(eq(hasilPemeriksaan.versiId, versi.id), eq(hasilPemeriksaan.jenis, "deterministik")));
    hasil = baris
      .sort((a, b) => Number(b.h.status === "Gagal") - Number(a.h.status === "Gagal") || a.urutan - b.urutan)
      .map(({ h, deskripsi }) => ({
        butirId: h.butirId,
        kode: h.butirKode,
        nama: deskripsi,
        bagian: h.bagian,
        status: h.status as "Lolos" | "Gagal",
        angkaPembukti: h.angkaPembukti ?? "",
        batasDilanggar: h.batasDilanggar,
      }));
  }

  const sedangDiperiksa = p.status === "Sedang diperiksa";
  let gagal: DataHasilPengajuan["gagal"] = null;
  const [terakhir] = await db
    .select()
    .from(logAudit)
    .where(and(eq(logAudit.objek, p.idProposal), inArray(logAudit.aksi, ["pengajuan.mulai", "pengajuan.gagal", "pengajuan.ditahan", "proposal.terkirim", "pengajuan.ditolak"])))
    .orderBy(desc(logAudit.id))
    .limit(1);
  if (terakhir?.aksi === "pengajuan.gagal") {
    gagal = { sebab: "galat", pesan: "Pemeriksaan tidak dapat diselesaikan karena BIMA atau berkas proposal tidak dapat dibaca." };
  } else if (sedangDiperiksa && terakhir?.aksi === "pengajuan.mulai" && Date.now() - terakhir.waktu.getTime() > BATAS_PEMERIKSAAN_MS) {
    gagal = { sebab: "batas-waktu", pesan: "Pemeriksaan melebihi batas waktu yang wajar." };
  }
  return { proposal: p, namaSkema: skema.namaSkema, tanggalTutup: periode.tanggalTutup, versi: versi ?? null, hasil, sedangDiperiksa, gagal };
}
