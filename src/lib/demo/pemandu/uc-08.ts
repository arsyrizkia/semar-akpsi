import type { LangkahPemandu } from "@/components/layout/panel-pemandu";

/** Langkah real use case UC-08 Mengoreksi rekomendasi sistem (Bab 10.2.8). Nomor diberi awalan "8." agar tidak bentrok dengan UC-07. */
export const judulUc08 = "Mengoreksi rekomendasi sistem";

export const langkahUc08: LangkahPemandu[] = [
  { nomor: "8.1", teks: "Tekan \"Tidak Setuju\" pada butir yang rekomendasinya tidak disetujui.", alternatif: true },
  { nomor: "8.2", teks: "Sistem membuat koreksi untuk hasil pemeriksaan butir itu (catatKoreksi).", alternatif: true },
  { nomor: "8.3", teks: "Panel koreksi terbuka di bawah butir: rekomendasi, kutipan, dan alasan sistem.", alternatif: true },
  { nomor: "8.4", teks: "Pilih \"Memenuhi\" atau \"Tidak memenuhi\" pada \"Keputusan Reviewer\".", alternatif: true },
  { nomor: "8.5", teks: "Ketik \"Alasan Koreksi\" dan pilih \"Jenis Kekeliruan\".", alternatif: true },
  { nomor: "8.6", teks: "Tekan \"Simpan Koreksi\".", alternatif: true },
  { nomor: "8.7", teks: "Keputusan reviewer menjadi keputusan berlaku; rekomendasi semula tetap tersimpan untuk pemantauan.", alternatif: true },
  { nomor: "8.8", teks: "Panel tertutup; butir berlabel \"Dikoreksi reviewer\".", alternatif: true },
  { nomor: "8.S-1", teks: "(UC-08) Alasan kosong: kotak diberi bingkai merah, pesan \"Alasan koreksi wajib diisi\", kembali ke langkah 8.5.", alternatif: true },
  { nomor: "8.4a", teks: "(UC-08) Tekan \"Batal\": panel ditutup tanpa menulis koreksi; rekomendasi semula tetap berlaku.", alternatif: true },
];
