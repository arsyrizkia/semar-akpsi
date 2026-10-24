/**
 * "Jam demo" dan sakelar masa pengusulan (tabel pengaturan_demo).
 * Prototipe hanya memiliki satu periode berjalan: sakelar masaPengusulan adalah penentu tunggal
 * apakah pengusulan dianggap berjalan atau ditutup; geserHari menggeser tampilan/perhitungan tanggal.
 */
import { and, desc, eq, lte, notLike } from "drizzle-orm";
import { getDb } from "@/db";
import { masaBerjalanUntuk } from "@/lib/templat/daftar";
import { pengaturanDemo, periodeSeleksi } from "@/db/schema";

export type PengaturanDemo = typeof pengaturanDemo.$inferSelect;

export async function ambilPengaturanDemo(): Promise<PengaturanDemo> {
  const db = getDb();
  const [baris] = await db.select().from(pengaturanDemo).where(eq(pengaturanDemo.id, 1));
  if (baris) return baris;
  const [baru] = await db.insert(pengaturanDemo).values({ id: 1 }).onConflictDoNothing().returning();
  return baru ?? (await db.select().from(pengaturanDemo).where(eq(pengaturanDemo.id, 1)))[0];
}

const HARI_MS = 86_400_000;

export async function ubahPengaturanDemo(ubah: Partial<Pick<PengaturanDemo, "masaPengusulan" | "geserHari">>) {
  const db = getDb();
  await ambilPengaturanDemo();
  if (ubah.masaPengusulan) {
    // Sakelar masa menggeser tanggalTutup periode berjalan supaya tanggal yang tampil (J-04, pesan 3a.2 J-06) konsisten
    // dengan statusnya: "ditutup" = tanggalTutup semenit lalu (hari ini); "berjalan" = tanggalTutup dua pekan lagi.
    const [p] = await db.select().from(periodeSeleksi).where(and(notLike(periodeSeleksi.nama, `${NAMA_PERIODE_SKALA}%`), periodeSudahDibuka())).orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka)).limit(1);
    if (p) {
      const tutup = new Date(ubah.masaPengusulan === "ditutup" ? Date.now() - 60_000 : Date.now() + 14 * HARI_MS);
      await db.update(periodeSeleksi).set({ tanggalTutup: tutup }).where(eq(periodeSeleksi.id, p.id));
    }
    // skenario skala nyata: periode aktif J-04 (periode tersendiri) ikut digeser supaya lencana dan tanggal tutupnya konsisten
    const { periodeAktifId } = await ambilPengaturanDemo();
    if (periodeAktifId && periodeAktifId !== p?.id) {
      const tutup = new Date(ubah.masaPengusulan === "ditutup" ? Date.now() - 60_000 : Date.now() + 14 * HARI_MS);
      await db.update(periodeSeleksi).set({ tanggalTutup: tutup }).where(eq(periodeSeleksi.id, periodeAktifId));
    }
  }
  await db
    .update(pengaturanDemo)
    .set({ ...ubah, diperbaruiPada: new Date() })
    .where(eq(pengaturanDemo.id, 1));
}

/**
 * Syarat "periode sudah dibuka" (tanggal buka sudah lewat). Periode mendatang (mis. Seleksi Pendanaan 2027, belum dibuka)
 * hanya muncul di pilihan Periode Berlaku templat; jendela lain yang memakai "periode berjalan/terbaru" mengabaikannya.
 */
export const periodeSudahDibuka = () => lte(periodeSeleksi.tanggalBuka, new Date());

/** Id periode berjalan: periode nonskala terbaru yang sudah dibuka (null bila belum ada periode). */
export async function ambilPeriodeBerjalanId(): Promise<string | null> {
  const [p] = await getDb()
    .select({ id: periodeSeleksi.id })
    .from(periodeSeleksi)
    .where(and(notLike(periodeSeleksi.nama, `${NAMA_PERIODE_SKALA}%`), periodeSudahDibuka()))
    .orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka))
    .limit(1);
  return p?.id ?? null;
}

export { masaBerjalanUntuk };

/** masaPengusulanBerjalan() khusus satu periode (9a UC-01, 8a UC-02). */
export async function masaPengusulanBerjalanPada(periodeId: string | null): Promise<boolean> {
  return masaBerjalanUntuk(await masaPengusulanBerjalan(), periodeId, await ambilPeriodeBerjalanId());
}

/** Waktu sekarang menurut jam demo. */
export async function waktuDemo(): Promise<Date> {
  const p = await ambilPengaturanDemo();
  return new Date(Date.now() + p.geserHari * 86_400_000);
}

/** true bila masa pengusulan sedang berjalan (cekMasaPengusulan / masaPengusulanBerjalan). */
export async function masaPengusulanBerjalan(): Promise<boolean> {
  return (await ambilPengaturanDemo()).masaPengusulan === "berjalan";
}

export type PeriodeSeleksi = typeof periodeSeleksi.$inferSelect;

/** Awalan nama periode skenario skala nyata; periode ini disembunyikan dari pilihan periode jendela lain. */
export const NAMA_PERIODE_SKALA = "Skala Nyata";

/** Periode yang dibuka J-04: periodeAktifId pada pengaturan demo bila ada, selain itu periode terbaru. */
export async function ambilPeriodeAktif(): Promise<PeriodeSeleksi | null> {
  const db = getDb();
  const { periodeAktifId } = await ambilPengaturanDemo();
  if (periodeAktifId) {
    const [p] = await db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, periodeAktifId));
    if (p) return p;
  }
  const [terbaru] = await db.select().from(periodeSeleksi).where(periodeSudahDibuka()).orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka)).limit(1);
  return terbaru ?? null;
}

export async function setPeriodeAktif(periodeId: string | null) {
  await ambilPengaturanDemo();
  await getDb().update(pengaturanDemo).set({ periodeAktifId: periodeId, diperbaruiPada: new Date() }).where(eq(pengaturanDemo.id, 1));
}
