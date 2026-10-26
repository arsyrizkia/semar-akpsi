/**
 * Gambar di dalam isian proposal (diagram alir, tabel atau bagan bergambar, peta jalan): dibaca dari PDF/DOCX, dikecilkan, lalu
 * dikirim ke Layanan LLM bersama teks bagiannya, sehingga butir semantik yang buktinya ada di gambar dapat dinilai (Layanan LLM
 * membaca gambar langsung, termasuk teks di dalamnya). Ikon, logo kecil, dan tanda butir diabaikan.
 */
import type { GambarNaskah } from "@/lib/kontrak/tipe";

/** sisi terpanjang yang disarankan untuk gambar masukan Layanan LLM */
export const SISI_MAKS_GAMBAR = 1568;
/** gambar dengan sisi terpendek di bawah ini (piksel) dianggap ikon atau logo */
export const SISI_MIN_GAMBAR = 80;
/** luas maksimum (piksel); Layanan LLM mengecilkan gambar yang lebih luas, jadi dikecilkan di sini supaya hemat simpan dan kirim */
export const LUAS_MAKS_GAMBAR = 1_150_000;
/** PNG lebih besar dari ini dibandingkan dengan JPEG-nya dan dipakai yang lebih kecil (foto dan tangkapan layar) */
export const BYTE_PNG_LONGGAR = 300_000;
/** gambar per bagian yang disimpan dan dikirim (Metode PDF contoh BIMA no. 1 memuat 7 gambar; pembagian peran ada di gambar ke-7) */
export const GAMBAR_MAKS_PER_BAGIAN = 10;

/** Ukuran sesudah dikecilkan: sisi terpanjang <= SISI_MAKS_GAMBAR dan luas <= LUAS_MAKS_GAMBAR, rasio tetap, tidak diperbesar. */
export function ukuranSasaran(lebar: number, tinggi: number): { lebar: number; tinggi: number } {
  const skala = Math.min(1, SISI_MAKS_GAMBAR / Math.max(lebar, tinggi), Math.sqrt(LUAS_MAKS_GAMBAR / (lebar * tinggi)));
  return { lebar: Math.max(1, Math.floor(lebar * skala)), tinggi: Math.max(1, Math.floor(tinggi * skala)) };
}

export type SumberGambar =
  | { berkas: Buffer }
  | { piksel: Uint8Array | Uint8ClampedArray; lebar: number; tinggi: number; kanal: 1 | 3 | 4 };

/**
 * Satu gambar menjadi PNG (atau JPEG bila lebih kecil untuk gambar besar) berlatar putih, sisi terpanjang <= SISI_MAKS_GAMBAR dan luas
 * <= LUAS_MAKS_GAMBAR; null bila terlalu kecil atau tidak terbaca.
 */
export async function siapkanGambar(s: SumberGambar): Promise<GambarNaskah | null> {
  try {
    const sharp = (await import("sharp")).default;
    const masukan =
      "berkas" in s
        ? sharp(s.berkas, { failOn: "none" })
        : sharp(Buffer.from(s.piksel.buffer, s.piksel.byteOffset, s.piksel.byteLength), { raw: { width: s.lebar, height: s.tinggi, channels: s.kanal } });
    const meta = await masukan.metadata();
    const lebar = "berkas" in s ? (meta.width ?? 0) : s.lebar;
    const tinggi = "berkas" in s ? (meta.height ?? 0) : s.tinggi;
    if (!lebar || !tinggi || Math.min(lebar, tinggi) < SISI_MIN_GAMBAR) return null;
    const { lebar: l, tinggi: t } = ukuranSasaran(lebar, tinggi);
    const dasar = masukan.flatten({ background: "#ffffff" }).resize({ width: l, height: t, fit: "inside", withoutEnlargement: true });
    const png = await dasar.clone().png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true });
    if (png.data.length <= BYTE_PNG_LONGGAR) return { tipe: "image/png", data: png.data, lebar: png.info.width, tinggi: png.info.height };
    const jpg = await dasar.clone().jpeg({ quality: 80 }).toBuffer({ resolveWithObject: true });
    return jpg.data.length < png.data.length
      ? { tipe: "image/jpeg", data: jpg.data, lebar: jpg.info.width, tinggi: jpg.info.height }
      : { tipe: "image/png", data: png.data, lebar: png.info.width, tinggi: png.info.height };
  } catch {
    return null;
  }
}
