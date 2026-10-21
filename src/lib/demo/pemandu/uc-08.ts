import type { LangkahPemandu } from "@/components/layout/panel-pemandu";

/** Langkah real use case UC-08 Mengoreksi rekomendasi sistem (Bab 10.2.8). Nomor diberi awalan "UC-08·" agar tidak bentrok dengan UC-07. */
export const judulUc08 = "Mengoreksi rekomendasi sistem";

export const langkahUc08: LangkahPemandu[] = [
  { nomor: "UC-08·1", teks: "Tekan \"Tidak Setuju\" pada butir yang rekomendasinya tidak disetujui.", alternatif: true },
  { nomor: "UC-08·2", teks: "Panel koreksi dibuka di klien; catatKoreksi dan ambilRekomendasi baru dijalankan saat \"Simpan Koreksi\" (langkah 6), supaya Batal (4a) tidak menulis apa pun.", alternatif: true },
  { nomor: "UC-08·3", teks: "Panel koreksi terbuka di bawah butir: rekomendasi, kutipan, dan alasan sistem.", alternatif: true },
  { nomor: "UC-08·4", teks: "Pilih \"Memenuhi\" atau \"Tidak memenuhi\" pada \"Keputusan Reviewer\".", alternatif: true },
  { nomor: "UC-08·5", teks: "Ketik \"Alasan Koreksi\" dan pilih \"Jenis Kekeliruan\".", alternatif: true },
  { nomor: "UC-08·6", teks: "Tekan \"Simpan Koreksi\".", alternatif: true },
  { nomor: "UC-08·7", teks: "Keputusan reviewer menjadi keputusan berlaku; rekomendasi semula tetap tersimpan untuk pemantauan.", alternatif: true },
  { nomor: "UC-08·8", teks: "Panel tertutup; butir berlabel \"Dikoreksi reviewer\".", alternatif: true },
  { nomor: "UC-08·S-1", teks: "(UC-08) Alasan kosong: kotak diberi bingkai merah, pesan \"Alasan koreksi wajib diisi\", kembali ke langkah UC-08·5.", alternatif: true },
  { nomor: "UC-08·4a", teks: "(UC-08) Tekan \"Batal\": panel ditutup tanpa menulis koreksi; rekomendasi semula tetap berlaku.", alternatif: true },
];
