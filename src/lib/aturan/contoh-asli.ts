/**
 * PDF contoh proposal BIMA asli sebagai dokumen "Uji pada Contoh" (M-15, J-03b). Keputusan Arsy 26 Okt 2026: empat PDF di
 * data/uji-nyata dipakai sebagai dokumen uji di produksi. Berkasnya tidak pernah masuk git: scripts/unggah-contoh-asli.ts memasukkannya
 * sekali ke tabel contoh_asli, yang tidak ikut dikosongkan "Reset & isi data demo". daftarkanContohAsli membaca setiap PDF (ekstrakNaskah +
 * potongPerBagian menurut templat bawaan skemanya) lalu menulis baris dokumen_contoh berkode sama, jadi M-15 dan J-03b memakai jalur yang
 * sama dengan contoh rekaan; seed memanggilnya sesudah reset.
 */
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { contohAsli, dokumenContoh, skemaPendanaan } from "@/db/schema";
import { ekstrakNaskah } from "@/lib/pengajuan/ekstraksi";
import { potongPerBagian } from "@/lib/pengajuan/potong";
import { bagianBawaan, lengkapiBagian } from "@/lib/templat/isian-substansi";

/** dokumen_contoh.varian dan label untuk PDF asli */
export const VARIAN_ASLI = "asli";
export const LABEL_ASLI = "pdf asli";

/** Tabel contoh_asli dibuat bila belum ada (aditif, sama dengan definisi di schema.ts). */
export async function pastikanTabelContohAsli(): Promise<void> {
  await getDb().execute(sql`
    CREATE TABLE IF NOT EXISTS contoh_asli (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      kode text NOT NULL UNIQUE,
      nama text NOT NULL,
      skema_kode text NOT NULL,
      nama_berkas text NOT NULL,
      tipe text NOT NULL,
      ukuran integer NOT NULL,
      bytes bytea NOT NULL,
      diunggah_pada timestamptz NOT NULL DEFAULT now()
    )`);
}

/** Daftarkan (ulang) setiap PDF asli ke dokumen_contoh. Mengembalikan jumlah bagian templat yang dikenali per PDF. */
export async function daftarkanContohAsli(): Promise<{ kode: string; nama: string; bagianDikenali: number; bagianTemplat: number }[]> {
  const db = getDb();
  await pastikanTabelContohAsli();
  const [baris, skema] = await Promise.all([db.select().from(contohAsli).orderBy(contohAsli.kode), db.select().from(skemaPendanaan)]);
  const hasil: { kode: string; nama: string; bagianDikenali: number; bagianTemplat: number }[] = [];
  for (const b of baris) {
    const bagian = lengkapiBagian(bagianBawaan(b.skemaKode === "PT" ? "terapan" : "dasar").map((x, i) => ({ ...x, urutan: i + 1 })));
    const potong = potongPerBagian(await ekstrakNaskah(b.bytes, b.namaBerkas, b.tipe), bagian);
    const nilai = {
      nama: b.nama,
      skemaId: skema.find((x) => x.kode === b.skemaKode)?.id ?? null,
      varian: VARIAN_ASLI,
      judul: potong.judulDokumen || b.nama,
      judulBima: potong.judulDokumen || b.nama,
      teksPerBagian: potong.teksPerBagian,
      kataKunci: potong.kataKunci,
      lampiranAda: [] as string[],
      teksLampiran: {},
      judulBagianDitemukan: potong.judulBagianDitemukan,
      catatan: `PDF proposal asli dari BIMA (${b.namaBerkas}).`,
      label: LABEL_ASLI,
    };
    await db.insert(dokumenContoh).values({ kode: b.kode, ...nilai }).onConflictDoUpdate({ target: dokumenContoh.kode, set: nilai });
    hasil.push({ kode: b.kode, nama: b.nama, bagianDikenali: Object.keys(potong.teksPerBagian).length, bagianTemplat: bagian.length });
  }
  return hasil;
}

/** Berkas PDF asli untuk diunduh dari M-15/J-03b. */
export async function ambilBerkasContohAsli(kode: string): Promise<{ namaBerkas: string; tipe: string; bytes: Buffer } | null> {
  const [b] = await getDb()
    .select({ namaBerkas: contohAsli.namaBerkas, tipe: contohAsli.tipe, bytes: contohAsli.bytes })
    .from(contohAsli)
    .where(eq(contohAsli.kode, kode));
  return b ?? null;
}
