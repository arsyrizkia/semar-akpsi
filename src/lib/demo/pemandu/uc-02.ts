import type { LangkahPemandu } from "@/components/layout/panel-pemandu";

/** Langkah real use case UC-02 Mengelola aturan pemeriksaan (Bab 10.2.2) untuk PanelPemandu di J-03. */
export const LANGKAH_UC02: LangkahPemandu[] = [
  { nomor: "1", teks: "Buka J-03 Aturan Pemeriksaan dari menu atau dari tombol \"Buka Aturan Pemeriksaan\" di J-02 (akun pengelola)." },
  { nomor: "2", teks: "Pilih \"Skema Pendanaan\" dan \"Periode Seleksi\", lalu tekan \"Tampilkan\"." },
  { nomor: "3", teks: "Tabel butir menampilkan Kode, Deskripsi, Jenis, Asal, Parameter, Status. Butir turunan templat bergembok; butir Perlu ditinjau disorot." },
  { nomor: "4", teks: "\"Tambah Butir\", atau \"Ubah\" / \"Nonaktifkan\" pada baris butir manual; isi \"Kode\", \"Deskripsi\", \"Jenis\"." },
  { nomor: "4a", teks: "\"Ubah\" pada butir bergembok ditolak dengan tombol \"Buka Templat Proposal\"; use case berhenti.", alternatif: true },
  { nomor: "5", teks: "Isi \"Aturan Hitung\" (deterministik) atau \"Pertanyaan Pemeriksaan\" dan \"Contoh Jawaban\" (semantik), lalu \"Simpan Butir\"." },
  { nomor: "6", teks: "Tekan \"Uji pada Contoh\": panel \"Hasil Uji\" menampilkan Lolos/Gagal beserta angka pembukti, atau rekomendasi beserta kutipan." },
  { nomor: "S-1", teks: "Hasil uji belum sesuai: \"Ubah\" butir, \"Simpan Butir\", lalu \"Uji pada Contoh\" lagi.", alternatif: true },
  { nomor: "7", teks: "Isi \"Tanggal Berlaku\" lalu tekan \"Simpan Versi\": sistem memvalidasi tanggal terhadap masa pengusulan." },
  { nomor: "8a", teks: "Tanggal berlaku jatuh di antara tanggal buka dan tutup masa pengusulan yang berjalan: ditolak, basis aturan tidak berubah.", alternatif: true },
  { nomor: "8", teks: "Basis aturan versi baru tersimpan beserta tanggal berlaku; butir Draf dan Perlu ditinjau menjadi Aktif; entri log audit ditambahkan." },
];
