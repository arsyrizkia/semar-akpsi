/**
 * Penyimpanan gambar per bagian naskah (tabel gambar_naskah). Pemilik: versi pengajuan ("versi:<id>") atau dokumen Uji pada Contoh
 * ("contoh:<kode>"). Disimpan sekali saat naskah dibaca; dimuat saat pemeriksaan semantik bagian itu.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { gambarNaskah } from "@/db/schema";
import type { GambarNaskah } from "@/lib/kontrak/tipe";

export const pemilikVersi = (versiId: string) => `versi:${versiId}`;
export const pemilikContoh = (kode: string) => `contoh:${kode}`;

let tabelSiap: Promise<void> | null = null;

/** Tabel dibuat bila belum ada (aditif, sama dengan schema.ts); sekali per proses. */
export function pastikanTabelGambarNaskah(): Promise<void> {
  tabelSiap ??= buatTabel().catch((e) => {
    tabelSiap = null;
    throw e;
  });
  return tabelSiap;
}

async function buatTabel(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS gambar_naskah (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      pemilik text NOT NULL,
      bagian text NOT NULL,
      urutan integer NOT NULL,
      tipe text NOT NULL,
      lebar integer NOT NULL,
      tinggi integer NOT NULL,
      bytes bytea NOT NULL,
      dibuat_pada timestamptz NOT NULL DEFAULT now()
    )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS gambar_naskah_pemilik_idx ON gambar_naskah (pemilik)`);
}

/** Ganti seluruh gambar milik `pemilik`. Mengembalikan jumlah gambar tersimpan. */
export async function simpanGambarNaskah(pemilik: string, gambarPerBagian: Record<string, GambarNaskah[]> | undefined): Promise<number> {
  await pastikanTabelGambarNaskah();
  const db = getDb();
  await db.delete(gambarNaskah).where(eq(gambarNaskah.pemilik, pemilik));
  const baris = Object.entries(gambarPerBagian ?? {}).flatMap(([bagian, daftar]) =>
    daftar.map((g, urutan) => ({ pemilik, bagian, urutan, tipe: g.tipe, lebar: g.lebar, tinggi: g.tinggi, bytes: g.data })),
  );
  for (const b of baris) await db.insert(gambarNaskah).values(b);
  return baris.length;
}

/**
 * Gambar per bagian milik `pemilik` (hanya bagian `bagian` bila diberikan), berurutan. Gagal baca (mis. tabel belum ada) mengembalikan
 * kosong: pemeriksaan tetap berjalan atas teks saja.
 */
export async function muatGambarNaskah(pemilik: string, bagian?: string | null): Promise<Record<string, GambarNaskah[]>> {
  const syarat = bagian
    ? and(eq(gambarNaskah.pemilik, pemilik), sql`lower(trim(${gambarNaskah.bagian})) = lower(trim(${bagian}))`)
    : eq(gambarNaskah.pemilik, pemilik);
  let baris: (typeof gambarNaskah.$inferSelect)[];
  try {
    baris = await getDb().select().from(gambarNaskah).where(syarat).orderBy(asc(gambarNaskah.bagian), asc(gambarNaskah.urutan));
  } catch (e) {
    console.error("muatGambarNaskah", pemilik, e);
    return {};
  }
  const hasil: Record<string, GambarNaskah[]> = {};
  for (const b of baris) (hasil[b.bagian] ??= []).push({ tipe: b.tipe as GambarNaskah["tipe"], data: b.bytes, lebar: b.lebar, tinggi: b.tinggi });
  return hasil;
}
