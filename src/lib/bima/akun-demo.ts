/**
 * Akun prototipe untuk halaman masuk BIMA tiruan (formulir, dialog Bantuan, dan pintasan "Masuk cepat"). Murni data, tanpa impor
 * server, sehingga dipakai bersama oleh komponen klien dan route. Pencocokan username/email/idBima ada di akun-prototipe.ts.
 */

/** Kata sandi bersama semua akun prototipe. Bukan rahasia: ditampilkan di dialog Bantuan; prototipe tidak memakai akun BIMA asli. */
export const KATA_SANDI_PROTOTIPE = "Semar2026!";

/**
 * Kata sandi lama ("simulasi") tetap DITERIMA sementara supaya skrip e2e dan peragaan yang sudah ada tidak rusak. Sengaja tidak
 * ditampilkan di UI mana pun. Hapus setelah semua skrip memakai KATA_SANDI_PROTOTIPE.
 */
export const KATA_SANDI_LAMA_DITERIMA = "simulasi";

/** Alamat masuk langsung sebagai satu akun prototipe (GET /api/bima/sesi/masuk), membawa tujuan kembali dan lanjut. */
export function alamatMasukCepat(idBima: string, kembali: string, lanjut?: string): string {
  const q = new URLSearchParams({ idBima, kembali });
  if (lanjut) q.set("lanjut", lanjut);
  return `/api/bima/sesi/masuk?${q}`;
}

export interface AkunCepat {
  idBima: string;
  nama: string;
  keterangan: string;
  href: string;
}

export interface KelompokCepat {
  judul: string;
  catatan?: string;
  akun: AkunCepat[];
}

/** Satu baris tabel akun di dialog Bantuan. */
export interface BarisAkunBantuan {
  nama: string;
  peran: string;
  username: string;
  email: string;
}
