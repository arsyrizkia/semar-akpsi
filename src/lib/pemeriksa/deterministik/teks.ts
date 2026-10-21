/** Pembantu teks murni untuk pemeriksa deterministik (tanpa basis data). */

/** Format angka gaya Indonesia (titik pemisah ribuan) tanpa bergantung pada data ICU runtime. */
export function fmt(n: number): string {
  return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Normalisasi judul bagian untuk pencocokan: huruf kecil, nomor/penomoran di depan dibuang
 * ("1. Pendahuluan", "BAB II Metode", "2.1) Metode"), tanda baca di ujung dan spasi ganda dibuang.
 */
export function normalisasiJudul(s: string): string {
  return s
    .toLowerCase()
    .replace(/^\s*(?:bab\s+[ivxl\d]+\s*[.:)\-–]?\s*|\d+(?:\.\d+)*\s*[.)]?\s+|[ivxl]+\s*[.)]\s+)/i, "")
    .replace(/[:.\-–\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalisasi judul proposal untuk butir judul_sama: abaikan huruf besar/kecil, tanda baca, dan spasi ganda. */
export function normalisasiJudulProposal(s: string): string {
  return s
    .toLowerCase()
    .replace(/[“”"'‘’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const POLA_KETERANGAN = /^\s*(?:gambar|tabel|diagram|grafik|bagan|skema|foto)\s*\d+(?:[.\-]\d+)*\s*[.:)\-–]/i;
const POLA_PENANDA = /^\s*\[(?:tabel|gambar|diagram)\]\s*$/i;

/** Baris yang bukan isi naratif: keterangan gambar/tabel dan penanda tabel/gambar (NFR: tidak dihitung). */
export function barisBukanNaratif(baris: string): boolean {
  return POLA_KETERANGAN.test(baris) || POLA_PENANDA.test(baris);
}

/** Memecah teks bagian menjadi baris tak kosong. */
export function barisTeks(teks: string): string[] {
  return teks
    .split(/\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);
}

/**
 * hitungKata: jumlah kata (dipisah spasi) pada teks satu bagian, tidak menghitung isi
 * tabel, gambar, dan keterangannya. Tanpa toleransi.
 */
export function hitungKata(teks: string): number {
  let n = 0;
  for (const baris of barisTeks(teks)) {
    if (barisBukanNaratif(baris)) continue;
    n += baris.split(/\s+/).filter(Boolean).length;
  }
  return n;
}
