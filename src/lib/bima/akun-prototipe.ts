/** Daftar akun prototipe dan pencocokan masuk (username, email, atau idBima lama + kata sandi). Murni: tanpa basis data. */
import akunJson from "../../../data/contoh/akun.json";
import { KATA_SANDI_LAMA_DITERIMA, KATA_SANDI_PROTOTIPE } from "./akun-demo";

export interface AkunPrototipe {
  idBima: string;
  nama: string;
  username: string;
  email: string;
}

export const AKUN_PROTOTIPE: readonly AkunPrototipe[] = akunJson.akun.map((a) => ({
  idBima: a.idBima,
  nama: a.nama,
  username: a.username,
  email: a.email,
}));

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Menentukan idBima dari isian "Username" formulir masuk: username, email, atau idBima lama (tidak peka huruf besar; spasi tepi
 * dibuang). Isian yang tidak cocok dengan username/email diperlakukan sebagai idBima apa adanya (huruf kecil), karena akun massal
 * skenario skala (rvw-skala-*, rvw-c12-*) ada di basis data tetapi tidak di akun.json; pemanggil tetap harus memeriksa basis data.
 * Isian kosong menghasilkan null.
 */
export function idBimaDariMasukan(masukan: string, daftar: readonly AkunPrototipe[] = AKUN_PROTOTIPE): string | null {
  const k = norm(masukan);
  if (!k) return null;
  const cocok = daftar.find((a) => norm(a.username) === k || norm(a.email) === k || norm(a.idBima) === k);
  return cocok ? cocok.idBima : k;
}

/** Kata sandi benar bila sama persis dengan kata sandi prototipe, atau kata sandi lama yang diterima sementara. Peka huruf besar. */
export function kataSandiBenar(kataSandi: string): boolean {
  return kataSandi === KATA_SANDI_PROTOTIPE || kataSandi === KATA_SANDI_LAMA_DITERIMA;
}

/** Pencocokan akun: idBima kandidat bila kata sandi benar, selain itu null. Keberadaan idBima di basis data diperiksa pemanggil. */
export function cocokkanAkun(masukan: string, kataSandi: string, daftar: readonly AkunPrototipe[] = AKUN_PROTOTIPE): string | null {
  const id = idBimaDariMasukan(masukan, daftar);
  if (!id || !kataSandiBenar(kataSandi)) return null;
  return id;
}

/** Jalur SSO BIMA tiruan ke SEMAR (BIMA menambahkan token bertanda tangan, SEMAR memilih jendela menurut peran). */
export const JALUR_SSO_SEMAR = "/api/sso/callback";

/** Halaman BIMA tiruan khusus pengusul: beranda /bima (dialihkan ke pengajuan) dan /bima/pengajuan/... */
function halamanPengusul(jalur: string): boolean {
  const j = jalur.split(/[?#]/)[0].replace(/\/+$/, "");
  return j === "/bima" || j === "/bima/pengajuan" || j.startsWith("/bima/pengajuan/");
}

/**
 * Tujuan sesudah masuk BIMA tiruan, supaya setiap akun langsung tiba di jendela perannya. Pengusul tetap ke `kembali`. Tim Kerja
 * DPPM dan Reviewer yang masuk dari halaman BIMA khusus pengusul (bawaan formulir: /bima/pengajuan) diteruskan lewat SSO ke SEMAR,
 * yang memilih J-02 (pengelola), J-04 (anggota), atau J-07 (reviewer), alih-alih ditolak dengan galat peran (Arsy, 21 Nov 2026).
 * Tujuan lain (SSO, kotak masuk BIMA) tidak diubah.
 */
export function tujuanSesudahMasuk(peran: string, kembali: string): string {
  if (peran === "pengusul") return kembali;
  return halamanPengusul(kembali) ? JALUR_SSO_SEMAR : kembali;
}
