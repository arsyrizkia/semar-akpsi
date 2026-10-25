/**
 * Akun demo BIMA tiruan untuk halaman masuk (formulir dan pintasan "Masuk cepat"). Murni data, tanpa impor server, sehingga dipakai
 * bersama oleh komponen klien dan route.
 */

/** Kata sandi bersama semua akun demo. Bukan rahasia: ditampilkan di Masuk cepat; prototipe tidak memakai akun BIMA asli. */
export const KATA_SANDI_DEMO = "simulasi";

/** Alamat masuk langsung sebagai satu akun demo (GET /api/bima/sesi/masuk), membawa tujuan kembali dan lanjut. */
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
