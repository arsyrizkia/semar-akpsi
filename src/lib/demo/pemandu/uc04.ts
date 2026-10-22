/** Langkah real use case UC-04 Memantau kesesuaian penilaian, untuk PanelPemandu (sumber: Bab 10, Tabel ruc-04). */
import type { LangkahPemandu } from "./tipe";

export const kodeUc04 = "UC-04";
export const judulUc04 = "Memantau kesesuaian penilaian";

export const langkahUc04: LangkahPemandu[] = [
  { nomor: "1", teks: "Buka J-05 Pemantauan Kesesuaian dari menu Tim Kerja DPPM." },
  { nomor: "2", teks: "Pilih \"Periode Seleksi\" dan \"Skema Pendanaan\", lalu tekan \"Tampilkan\"." },
  { nomor: "3", teks: "Bagian \"Butir Deterministik Paling Sering Gagal\": tabel silang butir dan institusi pengusul, urut dari yang terbanyak." },
  { nomor: "4", teks: "Bagian \"Kesesuaian per Butir\" dengan kolom \"% Disetujui\"." },
  { nomor: "5", teks: "Bagian \"Butir dengan Koreksi Tertinggi\" beserta alasan koreksi dan jenis kekeliruan." },
  { nomor: "S-1", teks: "Tekan nama butir: panel \"Rincian Butir\" memuat contoh rekomendasi, kutipan, dan keputusan reviewer. Tekan \"Tutup\" untuk kembali ke langkah 5.", alternatif: true },
  { nomor: "6", teks: "Centang \"Perlu Diperbaiki\" pada butir yang aturannya perlu diperbaiki, lalu tekan \"Tandai Butir\"." },
  { nomor: "7", teks: "Status butir berubah dari Aktif menjadi Perlu ditinjau; label \"Perlu ditinjau\" tampil di J-05 dan butir disorot di J-03." },
];
