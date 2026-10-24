import type { LangkahPemandu } from "./tipe";

/** Langkah real use case UC-06 Memeriksa butir deterministik (docs/sumber/bab10, 10.2.6). */
export const LANGKAH_UC06: LangkahPemandu[] = [
  { nomor: "1", teks: "periksaDeterministik(versi): ambil butir deterministik berstatus Aktif atau Perlu ditinjau dari basis aturan." },
  { nomor: "2", teks: "Untuk setiap butir: ambilTeksBagian(bagian), lalu periksa(teksBagian) sesuai parameter butir." },
  { nomor: "3", teks: "cocokkanStrukturJudul(): judul bagian dicocokkan dengan templat; judul naskah dengan judul di BIMA." },
  { nomor: "4", teks: "hitungKata(): jumlah kata bagian (tanpa tabel, gambar, keterangan) dibanding batas kata templat." },
  { nomor: "5", teks: "cekKataKunci(): dipisah titik koma, tepat lima kata kunci." },
  { nomor: "6", teks: "cocokkanSitasi(): sitasi bernomor, daftar pustaka berurutan, jumlah entri sama dengan jumlah yang dikutip." },
  { nomor: "7", teks: "Lampiran milik BIMA: SEMAR tidak memeriksa lampiran, hanya isi naskah (reviewer melihat lampiran dari BIMA di J-08)." },
  { nomor: "8", teks: "Status Lolos atau Gagal dan angka pembukti disimpan sebagai baris hasil_pemeriksaan; hasil dikembalikan ke UC-05." },
];
