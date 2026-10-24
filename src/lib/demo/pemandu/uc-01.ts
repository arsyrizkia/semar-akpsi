import type { LangkahPemandu } from "./tipe";

/** Langkah real use case UC-01 Mengelola templat proposal (Bab 10.2.1) untuk PanelPemandu di J-02. */
export const LANGKAH_UC01: LangkahPemandu[] = [
  { nomor: "1", teks: "Buka J-02 Templat Proposal dari menu Tim Kerja DPPM (akun pengelola)." },
  { nomor: "2", teks: "Pilih skema pada daftar pilihan \"Skema Pendanaan\"." },
  { nomor: "3", teks: "Sistem menampilkan nomor versi, periode berlaku, dan tabel bagian A-H templat yang berlaku (halaman depan dan lampiran milik BIMA)." },
  { nomor: "S-1", teks: "Skema belum punya templat: tabel kosong \"Skema ini belum memiliki templat\"; \"Susun Versi Baru\" membuat versi 1.", alternatif: true },
  { nomor: "4", teks: "Tekan \"Susun Versi Baru\": Draf versi berikutnya dibuat dari salinan templat yang tampil." },
  { nomor: "5", teks: "Ubah tabel bagian: \"Tambah Bagian\", isi \"Nama Bagian\" dan \"Batas Kata\", centang \"Wajib\", \"Hapus\"." },
  { nomor: "6", teks: "Pilih isian \"Periode Berlaku\"." },
  { nomor: "7", teks: "Tekan \"Terbitkan\": sistem memeriksa kelengkapan isian." },
  { nomor: "S-2", teks: "Isian belum lengkap: isian ditandai dan muncul pesan \"Lengkapi isian yang ditandai\"; lengkapi lalu tekan \"Terbitkan\" lagi.", alternatif: true },
  { nomor: "8", teks: "Sistem memeriksa apakah masa pengusulan skema sedang berjalan (sakelar demo di /demo)." },
  { nomor: "9a", teks: "Masa pengusulan berjalan: templat disimpan sebagai Draf untuk periode berikutnya; use case berhenti.", alternatif: true },
  { nomor: "9", teks: "Masa pengusulan tidak berjalan: templat Terbit, versi lama Arsip, butir turunan versi lama Nonaktif." },
  { nomor: "10", teks: "Butir cek turunan (BGN, KTA, dst.) tersimpan berstatus Draf; tekan \"Buka Aturan Pemeriksaan\" untuk meninjaunya di J-03." },
];
