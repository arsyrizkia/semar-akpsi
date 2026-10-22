/** Langkah real use case UC-03 Menugaskan reviewer, untuk PanelPemandu (sumber: Bab 10, Tabel ruc-03). */
import type { LangkahPemandu } from "./tipe";

export const kodeUc03 = "UC-03";
export const judulUc03 = "Menugaskan reviewer";

export const langkahUc03: LangkahPemandu[] = [
  { nomor: "1", teks: "Buka J-04 Penugasan Reviewer dari menu Tim Kerja DPPM. Tombol \"Susun Usulan Penugasan\" hanya aktif bila masa pengusulan sudah ditutup." },
  { nomor: "2", teks: "Ketik angka pada isian \"Batas Beban per Reviewer\", lalu tekan \"Susun Usulan Penugasan\"." },
  { nomor: "3", teks: "Sistem menarik daftar reviewer yang bersedia dari BIMA (diulang otomatis maksimal 2 kali bila gagal)." },
  { nomor: "4", teks: "Sistem memilih reviewer berinstitusi berbeda dengan beban paling sedikit, tanpa melampaui batas; hasilnya berstatus Diusulkan." },
  { nomor: "5", teks: "J-04 menampilkan tabel \"Usulan Penugasan\" dan tabel \"Sebaran Beban\"." },
  { nomor: "6", teks: "Telusuri kedua tabel untuk meninjau usulan." },
  { nomor: "S-1", teks: "Reviewer tidak cukup: panel \"Kekurangan Reviewer\" tampil. Ubah \"Batas Beban per Reviewer\" lalu tekan \"Susun Usulan Penugasan\" lagi.", alternatif: true },
  { nomor: "S-2.1", teks: "Tekan \"Pindahkan\" pada baris proposal, pilih \"Reviewer Pengganti\", lalu tekan \"Simpan Pemindahan\".", alternatif: true },
  { nomor: "S-2.2", teks: "Sistem memeriksa ulang syarat institusi dan beban lewat pilihReviewer.", alternatif: true },
  { nomor: "S-2.3", teks: "Bila syarat dilanggar, syarat itu ditampilkan dan reviewer semula tetap dipakai.", alternatif: true },
  { nomor: "7", teks: "Tekan \"Tetapkan Penugasan\": status menjadi Ditetapkan." },
  { nomor: "8", teks: "Penugasan dikirim ke BIMA; proposal muncul di J-07 reviewer dengan tanda \"Baru\"; J-04 menampilkan pesan penugasan ditetapkan dan tercatat di BIMA." },
];
