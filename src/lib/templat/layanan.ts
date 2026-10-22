/**
 * UC-01 Mengelola templat proposal (J-02). Nama fungsi mengikuti sequence diagram seq-uc01.puml:
 * ambilTemplatBerlaku, aturBagian, tetapkanPeriodeBerlaku, periksaKelengkapan, terbitkan (cekPengusulanBerjalan,
 * gantiTemplatBerlaku, arsipkan, nonaktifkan), turunkanButirCek.
 */
import { and, desc, eq, inArray, max, notLike } from "drizzle-orm";
import { getDb } from "@/db";
import { bagianTemplat, butirCek, periodeSeleksi, skemaPendanaan, templatProposal } from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { masaPengusulanBerjalan, NAMA_PERIODE_SKALA, waktuDemo } from "@/lib/waktu";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import type { BagianTemplatDto } from "@/lib/kontrak";
import { pastikanDrafBasis, type Db } from "@/lib/aturan/draf";
import { bagianTersimpan, bersihkanIsianDraf, periksaKelengkapan, type HasilKelengkapan, type MasukanKelengkapan } from "./kelengkapan";
import { putuskanTerbitkan } from "./status";

export interface Pelaku {
  /** akun.id; boleh null (mis. pada pengujian) */
  id: string | null;
  /** idBima, dicatat sebagai aktor log audit */
  idBima: string;
}

export interface TemplatTampil {
  id: string;
  versi: number;
  status: "Draf" | "Terbit" | "Arsip";
  periodeBerlakuId: string | null;
  periodeBerlakuNama: string | null;
  lampiranWajib: string[];
  diterbitkanPada: string | null;
  bagian: { urutan: number; nama: string; batasKata: number | null; wajib: boolean }[];
}

export interface SkemaPilihan {
  id: string;
  kode: string;
  namaSkema: string;
}

export interface PeriodePilihan {
  id: string;
  nama: string;
  tahun: number;
  tanggalBuka: string;
  tanggalTutup: string;
}

export async function daftarSkema(): Promise<SkemaPilihan[]> {
  const baris = await getDb().select().from(skemaPendanaan).orderBy(skemaPendanaan.namaSkema);
  return baris.map((s) => ({ id: s.id, kode: s.kode, namaSkema: s.namaSkema }));
}

export async function daftarPeriode(): Promise<PeriodePilihan[]> {
  const baris = await getDb().select().from(periodeSeleksi).where(notLike(periodeSeleksi.nama, `${NAMA_PERIODE_SKALA}%`)).orderBy(desc(periodeSeleksi.tahun));
  return baris.map((p) => ({
    id: p.id,
    nama: p.nama,
    tahun: p.tahun,
    tanggalBuka: p.tanggalBuka.toISOString(),
    tanggalTutup: p.tanggalTutup.toISOString(),
  }));
}

async function muatTemplat(db: Db, t: typeof templatProposal.$inferSelect): Promise<TemplatTampil> {
  const bagian = await db.select().from(bagianTemplat).where(eq(bagianTemplat.templatId, t.id)).orderBy(bagianTemplat.urutan);
  let periodeBerlakuNama: string | null = null;
  if (t.periodeBerlakuId) {
    const [p] = await db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, t.periodeBerlakuId));
    periodeBerlakuNama = p?.nama ?? null;
  }
  return {
    id: t.id,
    versi: t.versi,
    status: t.status,
    periodeBerlakuId: t.periodeBerlakuId,
    periodeBerlakuNama,
    lampiranWajib: t.lampiranWajib,
    diterbitkanPada: t.diterbitkanPada?.toISOString() ?? null,
    bagian: bagian.map((b) => ({ urutan: b.urutan, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })),
  };
}

/** ambilTemplatBerlaku: templat berstatus Terbit untuk skema (null = skema belum punya templat, SubFlow S-1). */
export async function ambilTemplatBerlaku(skemaId: string): Promise<TemplatTampil | null> {
  const db = getDb();
  const [t] = await db
    .select()
    .from(templatProposal)
    .where(and(eq(templatProposal.skemaId, skemaId), eq(templatProposal.status, "Terbit")))
    .orderBy(desc(templatProposal.versi))
    .limit(1);
  return t ? muatTemplat(db, t) : null;
}

/** Draf tersimpan (hasil "Susun Versi Baru" atau alur 9a); sequence diagram S-3. */
export async function ambilDrafTemplat(skemaId: string): Promise<TemplatTampil | null> {
  const db = getDb();
  const [t] = await db
    .select()
    .from(templatProposal)
    .where(and(eq(templatProposal.skemaId, skemaId), eq(templatProposal.status, "Draf")))
    .orderBy(desc(templatProposal.versi))
    .limit(1);
  return t ? muatTemplat(db, t) : null;
}

/** Konteks templat untuk pemeriksaan "Uji pada Contoh": templat Terbit terbaru, bila tidak ada draf terbaru. */
export async function ambilKonteksTemplat(skemaId: string): Promise<{ bagianTemplat: BagianTemplatDto[]; lampiranWajib: string[] }> {
  const t = (await ambilTemplatBerlaku(skemaId)) ?? (await ambilDrafTemplat(skemaId));
  return {
    bagianTemplat: (t?.bagian ?? []).map((b) => ({ urutan: b.urutan, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })),
    lampiranWajib: t?.lampiranWajib ?? [],
  };
}

/**
 * "Susun Versi Baru" (langkah 4): templat Draf bernomor versi berikutnya, isian awal disalin dari templat yang berlaku.
 * Bila skema sudah punya draf tersimpan, draf itu dibuka kembali (S-3). Skema tanpa templat menghasilkan versi 1 (S-1).
 */
export async function susunVersiBaru(skemaId: string, pelaku: Pelaku): Promise<{ templat: TemplatTampil; dilanjutkan: boolean }> {
  const db = getDb();
  const draf = await ambilDrafTemplat(skemaId);
  if (draf) return { templat: draf, dilanjutkan: true };

  const berlaku = await ambilTemplatBerlaku(skemaId);
  const [{ nilai }] = await db.select({ nilai: max(templatProposal.versi) }).from(templatProposal).where(eq(templatProposal.skemaId, skemaId));
  const versi = (nilai ?? 0) + 1;

  const id = await db.transaction(async (tx) => {
    const [t] = await tx
      .insert(templatProposal)
      .values({ skemaId, versi, status: "Draf", periodeBerlakuId: null, lampiranWajib: berlaku?.lampiranWajib ?? [], dibuatOleh: pelaku.id })
      .returning();
    if (berlaku && berlaku.bagian.length > 0) {
      await tx
        .insert(bagianTemplat)
        .values(berlaku.bagian.map((b) => ({ templatId: t.id, urutan: b.urutan, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })));
    }
    return t.id;
  });
  await catatLogAudit({ aktor: pelaku.idBima, aksi: "templat.susun-versi-baru", objek: `templat:${id}`, rincian: { skemaId, versi } });
  const [t] = await db.select().from(templatProposal).where(eq(templatProposal.id, id));
  return { templat: await muatTemplat(db, t), dilanjutkan: false };
}

/** aturBagian(daftarBagian, lampiranWajib) + aturKetentuan per bagian + tetapkanPeriodeBerlaku, untuk isian yang sudah lengkap. */
async function simpanIsian(db: Db, templatId: string, isian: MasukanKelengkapan) {
  await db.delete(bagianTemplat).where(eq(bagianTemplat.templatId, templatId));
  const bagian = isian.bagian.map(bagianTersimpan);
  if (bagian.length > 0) {
    await db.insert(bagianTemplat).values(bagian.map((b, i) => ({ templatId, urutan: i + 1, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })));
  }
  await db
    .update(templatProposal)
    .set({ lampiranWajib: isian.lampiran.map((l) => l.trim()), periodeBerlakuId: isian.periodeBerlakuId })
    .where(eq(templatProposal.id, templatId));
}

export type HasilTerbitkan =
  | { hasil: "tidak-ditemukan"; pesan: string }
  | { hasil: "tidak-lengkap"; kelengkapan: HasilKelengkapan }
  | { hasil: "draf-disimpan"; versi: number }
  | { hasil: "terbit"; versi: number; jumlahButir: number };

export interface MasukanTerbitkan {
  skemaId: string;
  templatId: string;
  isian: MasukanKelengkapan;
  pelaku: Pelaku;
  /** Hanya untuk pengujian: menggantikan hasil masaPengusulanBerjalan() */
  masaBerjalan?: boolean;
}

/** Tombol "Terbitkan" (langkah 7 sampai 10, S-2, 9a). */
export async function terbitkan(m: MasukanTerbitkan): Promise<HasilTerbitkan> {
  const db = getDb();
  const [t] = await db.select().from(templatProposal).where(eq(templatProposal.id, m.templatId));
  if (!t || t.skemaId !== m.skemaId || t.status !== "Draf") {
    return { hasil: "tidak-ditemukan", pesan: "Draf templat tidak ditemukan atau sudah diterbitkan. Muat ulang halaman." };
  }

  const kelengkapan = periksaKelengkapan(m.isian); // langkah 7
  if (putuskanTerbitkan({ lengkap: kelengkapan.lengkap, masaBerjalan: false }) === "tidak-lengkap") return { hasil: "tidak-lengkap", kelengkapan }; // S-2

  await simpanIsian(db, t.id, m.isian);

  const berjalan = m.masaBerjalan ?? (await cekPengusulanBerjalan()); // langkah 8
  if (putuskanTerbitkan({ lengkap: true, masaBerjalan: berjalan }) === "draf-disimpan") {
    // 9a: tetap Draf, templat yang berlaku tidak berubah, butir tidak diturunkan
    await catatLogAudit({ aktor: m.pelaku.idBima, aksi: "templat.simpan-draf", objek: `templat:${t.id}`, rincian: { skemaId: m.skemaId, versi: t.versi, alasan: "masa pengusulan berjalan" } });
    return { hasil: "draf-disimpan", versi: t.versi };
  }

  const waktu = await waktuDemo();
  const bagian = m.isian.bagian.map(bagianTersimpan);
  const lampiran = m.isian.lampiran.map((l) => l.trim());

  const jumlahButir = await db.transaction(async (tx) => {
    // gantiTemplatBerlaku, arsipkan, nonaktifkan (langkah 9)
    const lama = await tx
      .select()
      .from(templatProposal)
      .where(and(eq(templatProposal.skemaId, m.skemaId), eq(templatProposal.status, "Terbit")));
    const drafBasis = await pastikanDrafBasis(tx, m.skemaId, m.pelaku.id);
    await gantiTemplatBerlaku(tx, { baruId: t.id, lamaIds: lama.map((l) => l.id), drafBasisId: drafBasis.id, waktu });

    // turunkanButirCek (langkah 10): berstatus Draf, terkunci (asal = templat)
    const turunan = turunkanButirCek(bagian, lampiran);
    const [{ nilai }] = await tx.select({ nilai: max(butirCek.urutan) }).from(butirCek).where(eq(butirCek.basisAturanId, drafBasis.id));
    let urutan = nilai ?? 0;
    if (turunan.length > 0) {
      await tx.insert(butirCek).values(
        turunan.map((b) => ({
          basisAturanId: drafBasis.id,
          templatId: t.id,
          kode: b.kode,
          deskripsi: b.deskripsi,
          jenis: b.jenis,
          asal: b.asal,
          komponen: b.komponen,
          pemeriksa: b.pemeriksa,
          parameter: b.parameter as unknown as Record<string, unknown>, // aturParameter(parameter)
          aturanHitung: b.aturanHitung,
          status: "Draf" as const,
          urutan: ++urutan,
        })),
      );
    }
    return turunan.length;
  });

  await catatLogAudit({
    aktor: m.pelaku.idBima,
    aksi: "templat.terbit",
    objek: `templat:${t.id}`,
    rincian: { skemaId: m.skemaId, versi: t.versi, jumlahButirDraf: jumlahButir, periodeBerlakuId: m.isian.periodeBerlakuId },
  });
  return { hasil: "terbit", versi: t.versi, jumlahButir };
}

/* ------------------------------ riwayat versi dan draf (J-02, J-02b) ------------------------------ */

export interface VersiTemplatBaris {
  id: string;
  versi: number;
  status: "Draf" | "Terbit" | "Arsip";
  periodeBerlakuNama: string | null;
  diterbitkanPada: string | null;
  jumlahBagian: number;
}

/** Riwayat versi templat satu skema, versi terbaru di atas (Terbit, Draf, dan Arsip). */
export async function daftarVersiTemplat(skemaId: string): Promise<VersiTemplatBaris[]> {
  const db = getDb();
  const baris = await db.select().from(templatProposal).where(eq(templatProposal.skemaId, skemaId)).orderBy(desc(templatProposal.versi));
  const periode = await db.select().from(periodeSeleksi);
  const namaPeriode = new Map(periode.map((p) => [p.id, p.nama]));
  const bagian = baris.length ? await db.select().from(bagianTemplat).where(inArray(bagianTemplat.templatId, baris.map((b) => b.id))) : [];
  const jumlah = new Map<string, number>();
  for (const b of bagian) jumlah.set(b.templatId, (jumlah.get(b.templatId) ?? 0) + 1);
  return baris.map((t) => ({
    id: t.id,
    versi: t.versi,
    status: t.status,
    periodeBerlakuNama: t.periodeBerlakuId ? (namaPeriode.get(t.periodeBerlakuId) ?? null) : null,
    diterbitkanPada: t.diterbitkanPada?.toISOString() ?? null,
    jumlahBagian: jumlah.get(t.id) ?? 0,
  }));
}

/** Templat menurut id (versi mana pun) beserta skemanya; null bila tidak ada atau id bukan uuid. */
export async function ambilTemplatPerId(templatId: string): Promise<{ templat: TemplatTampil; skemaId: string } | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templatId)) return null;
  const db = getDb();
  const [t] = await db.select().from(templatProposal).where(eq(templatProposal.id, templatId));
  return t ? { templat: await muatTemplat(db, t), skemaId: t.skemaId } : null;
}

export type HasilSimpanDraf = { ok: true; versi: number; jumlahBagian: number; jumlahLampiran: number } | { ok: false; pesan: string };

/**
 * "Simpan Draf" dan "Unduh Pratinjau (.docx)": menyimpan isian yang belum tentu lengkap pada templat berstatus Draf,
 * supaya draf dapat dibuka lagi dan pratinjau memuat isian terakhir. Tidak menerbitkan dan tidak menurunkan butir.
 */
export async function simpanDrafTemplat(m: { skemaId: string; templatId: string; isian: MasukanKelengkapan; pelaku: Pelaku }): Promise<HasilSimpanDraf> {
  const db = getDb();
  const [t] = await db.select().from(templatProposal).where(eq(templatProposal.id, m.templatId));
  if (!t || t.skemaId !== m.skemaId || t.status !== "Draf") {
    return { ok: false, pesan: "Draf templat tidak ditemukan atau sudah diterbitkan. Muat ulang halaman." };
  }
  const bersih = bersihkanIsianDraf(m.isian);
  await simpanIsian(db, t.id, {
    bagian: bersih.bagian.map((b) => ({ nama: b.nama, batas: b.batasKata == null ? "" : String(b.batasKata), tanpaBatas: b.batasKata == null, wajib: b.wajib })),
    lampiran: bersih.lampiran,
    periodeBerlakuId: bersih.periodeBerlakuId,
  });
  await catatLogAudit({ aktor: m.pelaku.idBima, aksi: "templat.draf-simpan", objek: `templat:${t.id}`, rincian: { skemaId: m.skemaId, versi: t.versi, bagian: bersih.bagian.length, lampiran: bersih.lampiran.length } });
  return { ok: true, versi: t.versi, jumlahBagian: bersih.bagian.length, jumlahLampiran: bersih.lampiran.length };
}

/* ------------------------------ metode seq-uc01 ------------------------------ */

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** cekPengusulanBerjalan() (seq-uc01 langkah 8): nama metode sequence untuk masaPengusulanBerjalan. */
export const cekPengusulanBerjalan = masaPengusulanBerjalan;

/** turunkanButirCek() (seq-uc01 langkah 10): butir cek terkunci (asal templat) dari bagian dan lampiran wajib. */
export const turunkanButirCek = turunkanButirDariTemplat;

/** arsipkan(): templat Terbit yang digantikan menjadi Arsip. */
async function arsipkan(tx: Tx, lamaIds: string[]) {
  if (lamaIds.length) await tx.update(templatProposal).set({ status: "Arsip" }).where(inArray(templatProposal.id, lamaIds));
}

/** nonaktifkan(): butir turunan templat lama pada draf basis aturan dinonaktifkan. */
async function nonaktifkanTurunanLama(tx: Tx, drafBasisId: string, lamaIds: string[]) {
  if (!lamaIds.length) return;
  await tx
    .update(butirCek)
    .set({ status: "Nonaktif" })
    .where(and(eq(butirCek.basisAturanId, drafBasisId), eq(butirCek.asal, "templat"), inArray(butirCek.templatId, lamaIds)));
}

/** gantiTemplatBerlaku() (seq-uc01 langkah 9): arsipkan yang lama, nonaktifkan turunannya, terbitkan yang baru. */
async function gantiTemplatBerlaku(tx: Tx, p: { baruId: string; lamaIds: string[]; drafBasisId: string; waktu: Date }) {
  await arsipkan(tx, p.lamaIds);
  await nonaktifkanTurunanLama(tx, p.drafBasisId, p.lamaIds);
  await tx.update(templatProposal).set({ status: "Terbit", diterbitkanPada: p.waktu }).where(eq(templatProposal.id, p.baruId));
}

/** aturBagian(), aturKetentuan(), tetapkanPeriodeBerlaku(): metode TemplatProposal; satu penyimpanan isian (simpanIsian) merealisasikan ketiganya. */
export const aturBagian = simpanIsian;
export const aturKetentuan = simpanIsian;
export const tetapkanPeriodeBerlaku = simpanIsian;
