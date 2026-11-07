/**
 * UC-01 Mengelola templat proposal (J-02). Nama fungsi mengikuti sequence diagram seq-uc01.puml:
 * ambilTemplatBerlaku, aturBagian, tetapkanPeriodeBerlaku, periksaKelengkapan, terbitkan (cekPengusulanBerjalan,
 * gantiTemplatBerlaku, arsipkan, nonaktifkan), turunkanButirCek.
 */
import { and, desc, eq, inArray, max, notLike } from "drizzle-orm";
import { getDb } from "@/db";
import { bagianTemplat, butirCek, periodeSeleksi, skemaPendanaan, templatProposal, ujiContoh } from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { masaPengusulanBerjalan, masaPengusulanBerjalanPada, NAMA_PERIODE_SKALA, waktuDemo } from "@/lib/waktu";
import { PROFIL } from "@/lib/demo/profil-skala";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import type { BagianTemplatDto, KepalaTemplatDto } from "@/lib/kontrak";
import { pastikanDrafBasis, type Db } from "@/lib/aturan/draf";
import { bagianDariBaris, kepalaDariBaris, keKolomBagian } from "./isian-substansi";
import { batasKataValid, bagianTersimpan, bersihkanIsianDraf, periksaKelengkapan, type HasilKelengkapan, type MasukanKelengkapan } from "./kelengkapan";
import { PESAN_HAPUS_BERUBAH, putuskanHapusDraf, putuskanTerbitkan } from "./status";
import type { BarisDaftar } from "./daftar";

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
  diterbitkanPada: string | null;
  /** bagian dengan ketentuan lengkap (null pada baris lama sudah diturunkan dari nama bagian) */
  bagian: BagianTemplatDto[];
  kepala: KepalaTemplatDto;
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

const kePilihan = (p: typeof periodeSeleksi.$inferSelect): PeriodePilihan => ({
  id: p.id,
  nama: p.nama,
  tahun: p.tahun,
  tanggalBuka: p.tanggalBuka.toISOString(),
  tanggalTutup: p.tanggalTutup.toISOString(),
});

export async function daftarPeriode(): Promise<PeriodePilihan[]> {
  const baris = await getDb().select().from(periodeSeleksi).where(notLike(periodeSeleksi.nama, `${NAMA_PERIODE_SKALA}%`)).orderBy(desc(periodeSeleksi.tahun));
  return baris.map(kePilihan);
}

/**
 * Periode Simulasi Contoh (1.200 proposal) menurut id, untuk tab Aturan Pemeriksaan yang dibuka dari J-05 periode itu. Periode ini
 * sengaja tidak masuk daftarPeriode (pilihan Periode Berlaku templat), tetapi basis aturannya sendiri dapat ditinjau dan disunting.
 */
export async function ambilPeriodeSimulasiContoh(id: string): Promise<PeriodePilihan | null> {
  const [p] = await getDb().select().from(periodeSeleksi).where(and(eq(periodeSeleksi.id, id), eq(periodeSeleksi.nama, PROFIL.contoh1200.namaPeriode)));
  return p ? kePilihan(p) : null;
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
    diterbitkanPada: t.diterbitkanPada?.toISOString() ?? null,
    bagian: bagian.map(bagianDariBaris),
    kepala: kepalaDariBaris(t),
  };
}

/**
 * ambilTemplatBerlaku: templat berstatus Terbit (Aktif) untuk skema (null = skema belum punya templat, SubFlow S-1).
 * Aktif dihitung per periode: satu skema boleh punya satu templat Aktif untuk tiap periode. Dengan `periodeId`, templat
 * Aktif periode itu didahulukan; selain itu atau bila tidak ada, templat Aktif dengan versi terbaru.
 */
export async function ambilTemplatBerlaku(skemaId: string, periodeId?: string | null): Promise<TemplatTampil | null> {
  const db = getDb();
  const daftar = await db
    .select()
    .from(templatProposal)
    .where(and(eq(templatProposal.skemaId, skemaId), eq(templatProposal.status, "Terbit")))
    .orderBy(desc(templatProposal.versi));
  const t = (periodeId ? daftar.find((x) => x.periodeBerlakuId === periodeId) : undefined) ?? daftar[0];
  return t ? muatTemplat(db, t) : null;
}

/** Draf tersimpan (hasil "Susun Versi Baru" atau alur 9a); sequence diagram S-3. */
export async function ambilDrafTemplat(skemaId: string, periodeId?: string | null): Promise<TemplatTampil | null> {
  const db = getDb();
  const daftar = await db
    .select()
    .from(templatProposal)
    .where(and(eq(templatProposal.skemaId, skemaId), eq(templatProposal.status, "Draf")))
    .orderBy(desc(templatProposal.versi));
  // draf per periode: draf tanpa periode juga cocok (belum ditetapkan)
  const t = periodeId === undefined ? daftar[0] : daftar.find((x) => x.periodeBerlakuId === periodeId || x.periodeBerlakuId === null);
  return t ? muatTemplat(db, t) : null;
}

/** Konteks templat untuk pemeriksaan "Uji pada Contoh": templat Terbit terbaru, bila tidak ada draf terbaru. */
export async function ambilKonteksTemplat(skemaId: string): Promise<{ bagianTemplat: BagianTemplatDto[] }> {
  const t = (await ambilTemplatBerlaku(skemaId)) ?? (await ambilDrafTemplat(skemaId));
  return {
    bagianTemplat: t?.bagian ?? [],
  };
}

/**
 * "Susun Versi Baru" (langkah 4): templat Draf bernomor versi berikutnya, isian awal disalin dari templat yang berlaku.
 * Bila skema sudah punya draf tersimpan, draf itu dibuka kembali (S-3). Skema tanpa templat menghasilkan versi 1 (S-1).
 */
export async function susunVersiBaru(skemaId: string, pelaku: Pelaku, periodeId: string | null = null): Promise<{ templat: TemplatTampil; dilanjutkan: boolean }> {
  const db = getDb();
  const draf = await ambilDrafTemplat(skemaId, periodeId);
  if (draf) return { templat: draf, dilanjutkan: true };

  const berlaku = await ambilTemplatBerlaku(skemaId, periodeId);
  const [{ nilai }] = await db.select({ nilai: max(templatProposal.versi) }).from(templatProposal).where(eq(templatProposal.skemaId, skemaId));
  const versi = (nilai ?? 0) + 1;

  const id = await db.transaction(async (tx) => {
    const [t] = await tx
      .insert(templatProposal)
      .values({
        skemaId,
        versi,
        status: "Draf",
        periodeBerlakuId: periodeId,
        dibuatOleh: pelaku.id,
        ...(berlaku ? { judulDokumen: berlaku.kepala.judulDokumen, subjudul: berlaku.kepala.subjudul, pengantar: berlaku.kepala.pengantar } : {}),
      })
      .returning();
    if (berlaku && berlaku.bagian.length > 0) {
      await tx.insert(bagianTemplat).values(berlaku.bagian.map((b) => ({ templatId: t.id, urutan: b.urutan, ...keKolomBagian(b) })));
    }
    return t.id;
  });
  await catatLogAudit({ aktor: pelaku.idBima, aksi: "templat.susun-versi-baru", objek: `templat:${id}`, rincian: { skemaId, versi } });
  const [t] = await db.select().from(templatProposal).where(eq(templatProposal.id, id));
  return { templat: await muatTemplat(db, t), dilanjutkan: false };
}

/** aturBagian(daftarBagian) + aturKetentuan per bagian + tetapkanPeriodeBerlaku, untuk isian yang sudah lengkap. */
async function simpanIsian(db: Db, templatId: string, isian: MasukanKelengkapan) {
  await db.delete(bagianTemplat).where(eq(bagianTemplat.templatId, templatId));
  const bagian = isian.bagian.map(bagianTersimpan);
  if (bagian.length > 0) {
    await db.insert(bagianTemplat).values(bagian.map((b, i) => ({ templatId, urutan: i + 1, ...keKolomBagian(b) })));
  }
  await db
    .update(templatProposal)
    .set({
      periodeBerlakuId: isian.periodeBerlakuId,
      ...(isian.kepala
        ? { judulDokumen: isian.kepala.judulDokumen.trim() || null, subjudul: isian.kepala.subjudul.trim() || null, pengantar: isian.kepala.pengantar.trim() || null }
        : {}),
    })
    .where(eq(templatProposal.id, templatId));
}

export type HasilTerbitkan =
  | { hasil: "tidak-ditemukan"; pesan: string }
  | { hasil: "tidak-lengkap"; kelengkapan: HasilKelengkapan }
  | { hasil: "draf-disimpan"; versi: number }
  | { hasil: "terbit"; versi: number; jumlahButir: number; jumlahDeterministik: number; jumlahSemantik: number; kodeBaru: string[] };

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

  const berjalan = m.masaBerjalan ?? (await masaPengusulanBerjalanPada(m.isian.periodeBerlakuId)); // langkah 8 (per periode)
  if (putuskanTerbitkan({ lengkap: true, masaBerjalan: berjalan }) === "draf-disimpan") {
    // 9a: tetap Draf, templat yang berlaku tidak berubah, butir tidak diturunkan
    await catatLogAudit({ aktor: m.pelaku.idBima, aksi: "templat.simpan-draf", objek: `templat:${t.id}`, rincian: { skemaId: m.skemaId, versi: t.versi, alasan: "masa pengusulan berjalan" } });
    return { hasil: "draf-disimpan", versi: t.versi };
  }

  const waktu = await waktuDemo();
  const bagian = m.isian.bagian.map(bagianTersimpan);
  const turunanBaru = await db.transaction(async (tx) => {
    // gantiTemplatBerlaku, arsipkan, nonaktifkan (langkah 9)
    const lama = await tx
      .select()
      .from(templatProposal)
      .where(and(eq(templatProposal.skemaId, m.skemaId), eq(templatProposal.status, "Terbit"), m.isian.periodeBerlakuId ? eq(templatProposal.periodeBerlakuId, m.isian.periodeBerlakuId) : undefined));
    const drafBasis = await pastikanDrafBasis(tx, m.skemaId, m.pelaku.id);
    await gantiTemplatBerlaku(tx, { baruId: t.id, lamaIds: lama.map((l) => l.id), drafBasisId: drafBasis.id, waktu });

    // turunkanButirCek (langkah 10): berstatus Draf, terkunci (asal = templat)
    const turunan = turunkanButirCek(bagian);
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
          pertanyaan: b.pertanyaan,
          contohJawaban: b.contohJawaban,
          status: "Draf" as const,
          urutan: ++urutan,
        })),
      );
    }
    return turunan;
  });
  const jumlahButir = turunanBaru.length;
  const jumlahSemantik = turunanBaru.filter((b) => b.jenis === "semantik").length;
  const jumlahDeterministik = jumlahButir - jumlahSemantik;

  await catatLogAudit({
    aktor: m.pelaku.idBima,
    aksi: "templat.terbit",
    objek: `templat:${t.id}`,
    rincian: { skemaId: m.skemaId, versi: t.versi, jumlahButirDraf: jumlahButir, jumlahDeterministik, jumlahSemantik, periodeBerlakuId: m.isian.periodeBerlakuId },
  });
  return { hasil: "terbit", versi: t.versi, jumlahButir, jumlahDeterministik, jumlahSemantik, kodeBaru: turunanBaru.map((b) => b.kode) };
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

/** Semua versi templat semua skema untuk J-02 Daftar Templat, dengan jumlah butir cek turunan (deterministik, semantik). */
export async function daftarSemuaTemplat(): Promise<BarisDaftar[]> {
  const db = getDb();
  const [templat, skema, periode, bagian] = await Promise.all([
    db.select().from(templatProposal),
    db.select().from(skemaPendanaan),
    db.select().from(periodeSeleksi),
    db.select().from(bagianTemplat).orderBy(bagianTemplat.urutan),
  ]);
  const namaSkema = new Map(skema.map((s) => [s.id, s.namaSkema]));
  const per = new Map(periode.map((p) => [p.id, p]));
  const bagianPer = new Map<string, (typeof bagian)[number][]>();
  for (const b of bagian) bagianPer.set(b.templatId, [...(bagianPer.get(b.templatId) ?? []), b]);
  return templat.map((t) => {
    const bg = (bagianPer.get(t.id) ?? []).map(bagianDariBaris);
    const turunan = turunkanButirDariTemplat(bg);
    const sem = turunan.filter((b) => b.jenis === "semantik").length;
    const p = t.periodeBerlakuId ? per.get(t.periodeBerlakuId) : undefined;
    return {
      id: t.id,
      skemaId: t.skemaId,
      namaSkema: namaSkema.get(t.skemaId) ?? "",
      versi: t.versi,
      status: t.status,
      tahun: p?.tahun ?? null,
      periodeId: t.periodeBerlakuId,
      periodeNama: p?.nama ?? null,
      jumlahBagian: bg.length,
      jumlahDeterministik: turunan.length - sem,
      jumlahSemantik: sem,
      diperbarui: (t.diterbitkanPada ?? t.dibuatPada).toISOString(),
    };
  });
}

/** Templat menurut id (versi mana pun) beserta skemanya; null bila tidak ada atau id bukan uuid. */
export async function ambilTemplatPerId(templatId: string): Promise<{ templat: TemplatTampil; skemaId: string } | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templatId)) return null;
  const db = getDb();
  const [t] = await db.select().from(templatProposal).where(eq(templatProposal.id, templatId));
  return t ? { templat: await muatTemplat(db, t), skemaId: t.skemaId } : null;
}

export type HasilSimpanDraf = { ok: true; versi: number; jumlahBagian: number } | { ok: false; pesan: string };

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
    bagian: m.isian.bagian.filter((b) => b.nama.trim() !== "").map((b) => ({ ...b, nama: b.nama.trim(), ...(!batasKataValid(b.batas) ? { batas: "", tanpaBatas: true } : {}) })),
    periodeBerlakuId: bersih.periodeBerlakuId,
    kepala: m.isian.kepala,
  });
  await catatLogAudit({ aktor: m.pelaku.idBima, aksi: "templat.draf-simpan", objek: `templat:${t.id}`, rincian: { skemaId: m.skemaId, versi: t.versi, bagian: bersih.bagian.length } });
  return { ok: true, versi: t.versi, jumlahBagian: bersih.bagian.length };
}

/* ------------------------------ hapus draf ------------------------------ */

/**
 * Inti hapus draf, dipakai "Hapus Draf" (J-02a, M-13) dan pembersihan draf sisa demo: butir cek templat itu, bagian templat,
 * lalu templat. Riwayat Uji pada Contoh dipertahankan (butirnya sudah dibekukan saat uji); tanpa melepas templatId, draf yang
 * pernah diuji gagal dihapus karena FK. Mengembalikan false bila tidak ada baris Draf yang terhapus (sudah terbit atau hilang).
 */
export async function hapusDrafInti(db: Db, templatId: string): Promise<boolean> {
  // penjaga: butir dan bagian templat Terbit/Arsip tidak boleh ikut terhapus walau pemanggil lupa memeriksa status
  const [t] = await db.select({ status: templatProposal.status }).from(templatProposal).where(eq(templatProposal.id, templatId));
  if (t?.status !== "Draf") return false;
  await db.delete(butirCek).where(eq(butirCek.templatId, templatId));
  await db.delete(bagianTemplat).where(eq(bagianTemplat.templatId, templatId));
  await db.update(ujiContoh).set({ templatId: null }).where(eq(ujiContoh.templatId, templatId));
  const terhapus = await db.delete(templatProposal).where(and(eq(templatProposal.id, templatId), eq(templatProposal.status, "Draf"))).returning({ id: templatProposal.id });
  return terhapus.length > 0;
}

export type HasilHapusDraf = { ok: true; versi: number; skemaId: string; namaSkema: string } | { ok: false; pesan: string };

/** Galat internal untuk membatalkan transaksi hapus bila templat berubah status di tengah jalan. */
class HapusDrafBatal extends Error {}

/**
 * hapusDraf(templatId): "Hapus Draf" pada J-02a. Hanya pengelola (`pelaku` null = bukan pengelola), hanya templat Draf.
 * Templat Terbit dan Arsip ditolak; templat yang berlaku tidak berubah. Seluruh penghapusan satu transaksi, lalu log audit.
 */
export async function hapusDraf(templatId: string, pelaku: Pelaku | null): Promise<HasilHapusDraf> {
  const db = getDb();
  const ada = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templatId);
  const [t] = pelaku && ada ? await db.select().from(templatProposal).where(eq(templatProposal.id, templatId)) : [];
  const putusan = putuskanHapusDraf({ pengelola: pelaku !== null, status: t?.status ?? null });
  if (!putusan.ok) return { ok: false, pesan: putusan.pesan };

  try {
    await db.transaction(async (tx) => {
      if (!(await hapusDrafInti(tx, t.id))) throw new HapusDrafBatal();
    });
  } catch (e) {
    if (e instanceof HapusDrafBatal) return { ok: false, pesan: PESAN_HAPUS_BERUBAH };
    throw e;
  }
  const [sk] = await db.select().from(skemaPendanaan).where(eq(skemaPendanaan.id, t.skemaId));
  await catatLogAudit({ aktor: pelaku!.idBima, aksi: "templat.draf-hapus", objek: `templat:${t.id}`, rincian: { skemaId: t.skemaId, versi: t.versi } });
  return { ok: true, versi: t.versi, skemaId: t.skemaId, namaSkema: sk?.namaSkema ?? "" };
}

/* ------------------------------ metode seq-uc01 ------------------------------ */

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** cekPengusulanBerjalan() (seq-uc01 langkah 8): nama metode sequence untuk masaPengusulanBerjalan. */
export const cekPengusulanBerjalan = masaPengusulanBerjalan;
export { masaPengusulanBerjalanPada };

/** turunkanButirCek() (seq-uc01 langkah 10): butir cek terkunci (asal templat) dari bagian templat (lampiran milik BIMA, tidak diperiksa SEMAR). */
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
