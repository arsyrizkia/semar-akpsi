/**
 * "Jam demo" dan sakelar masa pengusulan (tabel pengaturan_demo).
 * Prototipe hanya memiliki satu periode berjalan: sakelar masaPengusulan adalah penentu tunggal
 * apakah pengusulan dianggap berjalan atau ditutup; geserHari menggeser tampilan/perhitungan tanggal.
 */
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pengaturanDemo } from "@/db/schema";

export type PengaturanDemo = typeof pengaturanDemo.$inferSelect;

export async function ambilPengaturanDemo(): Promise<PengaturanDemo> {
  const db = getDb();
  const [baris] = await db.select().from(pengaturanDemo).where(eq(pengaturanDemo.id, 1));
  if (baris) return baris;
  const [baru] = await db.insert(pengaturanDemo).values({ id: 1 }).onConflictDoNothing().returning();
  return baru ?? (await db.select().from(pengaturanDemo).where(eq(pengaturanDemo.id, 1)))[0];
}

export async function ubahPengaturanDemo(ubah: Partial<Pick<PengaturanDemo, "masaPengusulan" | "geserHari">>) {
  const db = getDb();
  await ambilPengaturanDemo();
  await db
    .update(pengaturanDemo)
    .set({ ...ubah, diperbaruiPada: new Date() })
    .where(eq(pengaturanDemo.id, 1));
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
