/** Validasi masukan reviewer (murni, dipakai server dan klien). */
import { JENIS_KEKELIRUAN, KOMPONEN_BORANG, type Keputusan } from "@/lib/kontrak/tipe";

export const PESAN_ALASAN_WAJIB = "Alasan koreksi wajib diisi";
export const PESAN_KOMPONEN_BELUM_LENGKAP = "Tetapkan keputusan untuk semua komponen borang sebelum menyimpan permanen";

export interface MasukanKoreksi {
  keputusan: string;
  alasan: string;
  jenisKekeliruan: string;
}

/** UC-08 S-1: alasan kosong ditolak. Mengembalikan galat per kolom (kosong = valid). */
export function validasiKoreksi(m: MasukanKoreksi): Record<string, string> {
  const galat: Record<string, string> = {};
  if (m.keputusan !== "Memenuhi" && m.keputusan !== "Tidak memenuhi") galat.keputusan = "Pilih keputusan reviewer";
  if (!m.alasan || m.alasan.trim().length === 0) galat.alasan = PESAN_ALASAN_WAJIB;
  if (!(JENIS_KEKELIRUAN as readonly string[]).includes(m.jenisKekeliruan)) galat.jenisKekeliruan = "Pilih jenis kekeliruan";
  return galat;
}

/** Hanya nama komponen baku dengan keputusan sah yang diterima. */
export function bersihkanKomponen(masukan: Record<string, string | undefined>): Record<string, Keputusan> {
  const hasil: Record<string, Keputusan> = {};
  for (const k of KOMPONEN_BORANG) {
    const v = masukan[k];
    if (v === "Memenuhi" || v === "Tidak memenuhi") hasil[k] = v;
  }
  return hasil;
}

export function komponenLengkap(k: Record<string, Keputusan>): boolean {
  return KOMPONEN_BORANG.every((n) => k[n] !== undefined);
}
