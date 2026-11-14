/**
 * Keadaan "alat peragaan": navigator, Masuk cepat, berkas contoh, sakelar masa pengusulan, dan tautan pintas BIMA. Murni (tanpa DOM)
 * supaya mudah diuji; komponen klien ada di src/components/layout/alat-peragaan.tsx.
 *
 * Bawaannya TERSEMBUNYI: prototipe tampil seperti sistem sungguhan. Pintasan Alt+Shift+D menampilkan atau menyembunyikannya di halaman
 * mana pun (disimpan di localStorage peramban, berlaku untuk peramban itu saja).
 */

export const KUNCI_ALAT_PERAGAAN = "semar:alat-peragaan";
export const PERISTIWA_ALAT_PERAGAAN = "semar:alat-peragaan-ubah";
export const NILAI_TAMPIL = "tampil";
export const NILAI_TERSEMBUNYI = "tersembunyi";

/** Nilai tersimpan -> apakah alat tampil. Hanya "tampil" yang menampilkan; kosong, rusak, atau nilai lain = tersembunyi. */
export function alatTampilDariNilai(nilai: string | null | undefined): boolean {
  return nilai === NILAI_TAMPIL;
}

/** Keadaan -> nilai yang disimpan. */
export function nilaiDariAlatTampil(tampil: boolean): string {
  return tampil ? NILAI_TAMPIL : NILAI_TERSEMBUNYI;
}

/** Bagian KeyboardEvent yang dibaca pintasan (agar dapat diuji tanpa DOM). */
export interface TekananTombol {
  code: string;
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  repeat?: boolean;
  isComposing?: boolean;
}

/**
 * Apakah tekanan tombol ini pintasan Alt+Shift+D.
 *
 * Keputusan fokus isian teks: pintasan TETAP berlaku saat fokus di isian. Alasannya, kombinasi Alt+Shift tidak mengetik karakter di
 * Windows/Linux, dan di Mac (Option+Shift+D menghasilkan "Î") karakter itu dibatalkan karena pemanggil memanggil preventDefault.
 * Jadi tidak ada ketikan pengguna yang hilang atau tercemar. Yang dikecualikan: tombol tertahan (repeat, agar tidak berkedip), sedang
 * komposisi IME (Alt+Shift dipakai memilih kandidat), dan kombinasi yang menyertakan Ctrl/Cmd (milik peramban atau sistem).
 * Dipakai e.code, bukan e.key, karena di Mac e.key berisi karakter Option ("Î"), bukan "d".
 */
export function adalahPintasanAlatPeragaan(e: TekananTombol): boolean {
  if (e.code !== "KeyD") return false;
  if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return false;
  if (e.repeat || e.isComposing) return false;
  return true;
}
