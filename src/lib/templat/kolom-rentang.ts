/**
 * Kolom tabel berbentuk rentang, mis. "Bulan 1–12" atau "Bulan 1-24": satu kepala "<Nama>" di atas satu kotak sempit per angka
 * (gaya jadwal contoh BIMA no. 1). Rentang lebih dari 12 dipecah per tahun: 24 menjadi dua tabel "Tahun ke-1" dan "Tahun ke-2"
 * masing-masing Bulan 1–12; sisa bukan kelipatan 12 menjadi tabel terakhir (18 = 12 + 6). Murni, dipakai pembangkit .docx,
 * ringkasan chip J-02a, petunjuk M-12, dan pemeriksa tabel. Sumber uji: Contract C-31 (docx), C-18 (cekTabel); MS-10 [J11].
 */

export interface KolomRentang {
  /** nama kepala, mis. "Bulan" */
  nama: string;
  dari: number;
  sampai: number;
  jumlah: number;
}

export const KOTAK_PER_TABEL = 12;
const BATAS_JUMLAH = 120;
const POLA = /^(.*\S)\s+(\d{1,3})\s*[–-]\s*(\d{1,3})$/;

/** Menguraikan "<Nama> a–b" (tanda hubung biasa atau en dash); null bila bukan rentang sah (a < 1, b < a, atau lebih dari 120 kotak). */
export function uraiKolomRentang(kolom: string): KolomRentang | null {
  const m = POLA.exec(kolom.trim());
  if (!m) return null;
  const dari = Number(m[2]);
  const sampai = Number(m[3]);
  const jumlah = sampai - dari + 1;
  if (dari < 1 || sampai < dari || jumlah > BATAS_JUMLAH) return null;
  return { nama: m[1].trim(), dari, sampai, jumlah };
}

/** Jumlah kotak per tabel: 12 → [12], 24 → [12, 12], 18 → [12, 6], 5 → [5]. */
export function pecahKotak(jumlah: number): number[] {
  if (jumlah <= 0) return [];
  const hasil = Array<number>(Math.floor(jumlah / KOTAK_PER_TABEL)).fill(KOTAK_PER_TABEL);
  if (jumlah % KOTAK_PER_TABEL > 0) hasil.push(jumlah % KOTAK_PER_TABEL);
  return hasil;
}

/**
 * Judul blok untuk tabel ke-`n` dari `banyak` tabel. Satu tabel: `judul` apa adanya. Beberapa tabel: pola "Tahun ke-<angka>" pada judul
 * diganti nomor tabel; judul lain mendapat akhiran " – Tahun ke-n"; tanpa judul menjadi "Tahun ke-n".
 */
export function judulBlokTahun(judul: string | null, n: number, banyak: number): string | null {
  const j = judul?.trim() || null;
  if (banyak <= 1) return j;
  if (j && /Tahun ke-\d+/i.test(j)) return j.replace(/(Tahun ke-)\d+/i, `$1${n}`);
  return j ? `${j} – Tahun ke-${n}` : `Tahun ke-${n}`;
}

/** Ringkasan kolom untuk chip J-02a: "No, Nama Kegiatan, Bulan ×24 (2 tahun)". */
export function ringkasKolomTabel(kolom: string[]): string {
  return kolom
    .map((k) => {
      const r = uraiKolomRentang(k);
      if (!r) return k;
      const tahun = Math.ceil(r.jumlah / KOTAK_PER_TABEL);
      return `${r.nama} ×${r.jumlah}${r.jumlah > KOTAK_PER_TABEL ? ` (${tahun} tahun)` : ""}`;
    })
    .join(", ");
}

/** Petunjuk singkat di M-12 untuk isian kolom tabel. */
export const PETUNJUK_KOLOM_RENTANG = "Tulis “Bulan 1–12” untuk kolom bulan berkotak; lebih dari 12 bulan dipecah per tahun.";
