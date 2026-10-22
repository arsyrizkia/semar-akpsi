import type { LangkahPemandu } from "./tipe";

/** Langkah real use case UC-05 Mengajukan proposal (docs/sumber/bab10, 10.2.5). */
export const LANGKAH_UC05: LangkahPemandu[] = [
  { nomor: "1", teks: "Pengusul mengunggah berkas proposal dan lampiran di halaman usulan BIMA, lalu menekan \"Ajukan Usulan\"." },
  { nomor: "2", teks: "BIMA meneruskan pengusul ke J-06 membawa idProposal dan identitas pengusul. J-06 menampilkan \"Pemeriksaan sedang berjalan\"." },
  { nomor: "3", teks: "cekMasaPengusulan(): masa pengusulan masih berjalan, proses berlanjut (di prototipe dipanggil sebelum tarikDariBima; lihat catatan inkonsistensi no. 13)." },
  { nomor: "4", teks: "tarikDariBima(): ambilBerkas lewat API BIMA (didahului ambilProposal untuk metadata); gagal diulang otomatis paling banyak dua kali." },
  { nomor: "5", teks: "ambilTemplatBerlaku(periode) dan ambilAturanBerlaku(periode) pada skema yang diikuti." },
  { nomor: "6", teks: "VersiProposal baru dibuat dengan «create»(berkas, templat, basis)." },
  { nomor: "7", teks: "potongTeks() memotong naskah per bagian sesuai templat (potongPerBagian, ambilTeksBagian)." },
  { nomor: "8", teks: "jalankanPemeriksaan(deterministik): UC-06 memeriksa setiap butir dan menyimpan hasilnya." },
  { nomor: "9", teks: "J-06 menampilkan setiap butir: nama butir, bagian, status Lolos atau Gagal, dan angka pembukti." },
  { nomor: "10", teks: "Semua butir Lolos: catatTerkirim() mengubah status menjadi Terkirim dan memasukkan versi ke antrean semantik." },
  { nomor: "11", teks: "J-06 menampilkan status \"Terkirim\" dan bukti pengiriman (idProposal, judul, skema, kode versi, waktu pencatatan)." },
  { nomor: "S-1.1", teks: "Ada butir Gagal: catatTerkirim() tidak dipanggil dan versi tidak masuk antrean semantik.", alternatif: true },
  { nomor: "S-1.2", teks: "J-06 menampilkan \"Ditahan\"; butir Gagal paling atas dengan bagian, batas yang dilanggar, dan angka pembukti.", alternatif: true },
  { nomor: "S-1.3", teks: "Pengusul menekan \"Kembali ke BIMA\" lalu memperbaiki naskah di luar sistem.", alternatif: true },
  { nomor: "S-1.4", teks: "Pengusul mengunggah perbaikan dan menekan \"Ajukan Usulan\" lagi: kembali ke langkah 1, versi baru dibuat.", alternatif: true },
  { nomor: "3a.1", teks: "Masa pengusulan sudah ditutup: API BIMA tidak dipanggil dan versi baru tidak dibuat.", alternatif: true },
  { nomor: "3a.2", teks: "J-06 menampilkan \"Ditolak\" dan pemberitahuan masa pengusulan telah ditutup, tanpa daftar butir.", alternatif: true },
];
