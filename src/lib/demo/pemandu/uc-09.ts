import type { LangkahPemandu } from "@/components/layout/panel-pemandu";

/** Langkah real use case UC-09 Memeriksa butir semantik (Bab 10.2.9), proses latar belakang. */
export const judulUc09 = "Memeriksa butir semantik";

export const langkahUc09: LangkahPemandu[] = [
  { nomor: "1", teks: "Proses latar belakang mengambil versi proposal dari antrean semantik." },
  { nomor: "2", teks: "Membaca basis aturan berlaku; ambil butir semantik berstatus Aktif atau Perlu ditinjau beserta pertanyaannya." },
  { nomor: "3", teks: "siapkanTeksTanpaIdentitas: nama, afiliasi, dan nomor induk pengusul dibuang dari teks." },
  { nomor: "4", teks: "periksaSemantik: setiap butir dinilai dengan teks bagian sasarannya." },
  { nomor: "5", teks: "kirimPermintaan ke Layanan LLM (batas tunggu 15 detik, dua percobaan)." },
  { nomor: "6", teks: "Jawaban terstruktur: rekomendasi, kutipan, tingkat keyakinan, alasan singkat." },
  { nomor: "7", teks: "cocokkanKutipan: kutipan dicari persis di teks bagian." },
  { nomor: "8", teks: "Satu HasilPemeriksaan disimpan per butir; siap dibaca J-08." },
  { nomor: "S-1", teks: "Kutipan tidak ditemukan: rekomendasi tetap disimpan, butir berlabel \"Perlu diperiksa manual\".", alternatif: true },
  { nomor: "S-2", teks: "Layanan LLM tidak menjawab dalam dua percobaan: butir berlabel \"Belum ada rekomendasi\".", alternatif: true },
];
