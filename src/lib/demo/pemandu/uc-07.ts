import type { LangkahPemandu } from "@/components/layout/panel-pemandu";

/** Langkah real use case UC-07 Melakukan pemeriksaan akhir (Bab 10.2.7). */
export const judulUc07 = "Melakukan pemeriksaan akhir";

export const langkahUc07: LangkahPemandu[] = [
  { nomor: "1", teks: "Rekomendasi butir semantik sudah tersimpan oleh proses latar belakang (UC-09)." },
  { nomor: "2", teks: "Di J-07 Daftar Penugasan, tekan \"Periksa\" pada baris proposal." },
  { nomor: "3", teks: "Sistem memastikan proposal ditugaskan kepada Anda, lalu membaca rekomendasi dan kutipan." },
  { nomor: "4", teks: "J-08 terbuka (≤ 3 detik): teks per bagian di kiri, butir semantik di kanan." },
  { nomor: "5", teks: "Penilaian baru dibuat bila proposal baru pertama kali dibuka." },
  { nomor: "6", teks: "Tekan satu butir; panel kiri menggulir ke kutipan dan menyorotnya. Rekomendasi yang disetujui dibiarkan." },
  { nomor: "7", teks: "Pilih \"Memenuhi\" atau \"Tidak memenuhi\" pada panel \"Keputusan Komponen Borang\"." },
  { nomor: "8", teks: "Ketik \"Umpan Balik untuk Pengusul\"." },
  { nomor: "9", teks: "Tekan \"Simpan Permanen\"." },
  { nomor: "10", teks: "Penilaian tersimpan final; penugasan menjadi Selesai." },
  { nomor: "11", teks: "Satu entri log audit ditambahkan (hanya-baca)." },
  { nomor: "12", teks: "Keputusan terkirim ke BIMA (ulang otomatis maks. 2 kali); muncul \"Penilaian tersimpan dan terkirim ke BIMA\", isian hanya-baca." },
  { nomor: "S-1", teks: "Tekan \"Simpan Sementara\": draf tersimpan tanpa log audit dan tanpa kirim ke BIMA; status J-07 menjadi \"Draf\". Tekan \"Periksa\" lagi untuk melanjutkan dari langkah 6.", alternatif: true },
];
