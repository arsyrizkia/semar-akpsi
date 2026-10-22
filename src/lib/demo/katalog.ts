/**
 * Katalog navigator demo: jendela J-01..J-08, halaman BIMA tiruan, dan skenario keadaan setiap jendela.
 * Berkas ini murni data (tanpa impor server) sehingga dipakai bersama oleh NavigatorDemo (klien), rute /demo/mulai, dan e2e.
 * Penyiapan data dan sesi untuk tiap skenario ada di skenario.ts (siapkanSkenario).
 */

export interface SkenarioDemo {
  /** id tunggal dalam satu jendela; skenario pertama adalah bawaan saat berpindah jendela */
  id: string;
  nama: string;
  /** keadaan yang disiapkan, satu kalimat */
  ringkas: string;
}

export interface JendelaDemo {
  kode: string;
  nama: string;
  /** peran yang dipasang otomatis */
  peran: string;
  /** awalan alamat yang dianggap jendela ini */
  rute: string[];
  /** skenario yang dipakai saat berpindah ke jendela ini tanpa memilih skenario (bawaan: yang pertama) */
  bawaan?: string;
  skenario: SkenarioDemo[];
}

export const KATALOG_JENDELA: JendelaDemo[] = [
  {
    kode: "J-01",
    nama: "Masuk",
    peran: "Tim Kerja DPPM, Reviewer",
    rute: ["/masuk"],
    skenario: [
      { id: "belum-masuk", nama: "Belum masuk", ringkas: "Sesi dihapus; halaman Masuk dengan akun BIMA." },
      { id: "pengelola", nama: "Masuk sebagai Tim Kerja (pengelola)", ringkas: "Sesi pengelola dipasang; tujuan sesudah masuk: J-02." },
      { id: "anggota", nama: "Masuk sebagai Tim Kerja (anggota)", ringkas: "Sesi anggota dipasang; tujuan sesudah masuk: J-04 (menu J-04 dan J-05)." },
      { id: "reviewer", nama: "Masuk sebagai Reviewer", ringkas: "Sesi reviewer-2 dipasang; tujuan sesudah masuk: J-07." },
    ],
  },
  {
    kode: "J-02",
    nama: "Templat Proposal",
    peran: "Tim Kerja (pengelola)",
    rute: ["/tim-kerja/templat"],
    skenario: [
      { id: "normal", nama: "Templat berlaku", ringkas: "Skema PD punya templat terbit; masa pengusulan ditutup (Terbitkan berakhir di jalur utama)." },
      { id: "tanpa-templat", nama: "Skema belum punya templat (S-1)", ringkas: "Skema PK tanpa templat; Susun Versi Baru membuat versi 1." },
      { id: "masa-berjalan", nama: "Masa pengusulan berjalan (9a)", ringkas: "Terbitkan menyimpan templat sebagai draf untuk periode berikutnya." },
      { id: "draf-tersimpan", nama: "Draf tersimpan", ringkas: "Draf versi berikutnya sudah ada dan dibuka kembali." },
    ],
  },
  {
    kode: "J-03",
    nama: "Aturan Pemeriksaan",
    peran: "Tim Kerja (pengelola)",
    rute: ["/tim-kerja/aturan"],
    skenario: [
      { id: "normal", nama: "Normal", ringkas: "Tabel butir skema PD; masa pengusulan ditutup." },
      { id: "perlu-ditinjau", nama: "Ada butir Perlu ditinjau (dari UC-04)", ringkas: "Satu butir manual ditandai Perlu ditinjau dari J-05." },
      { id: "uji-tanggal", nama: "Uji tanggal berlaku (8a)", ringkas: "Masa pengusulan berjalan; tanggal berlaku di tengah masa ditolak." },
    ],
  },
  {
    kode: "J-04",
    nama: "Penugasan Reviewer",
    peran: "Tim Kerja DPPM",
    rute: ["/tim-kerja/penugasan"],
    bawaan: "siap-kecil",
    skenario: [
      { id: "kosong", nama: "Kosong", ringkas: "Tidak ada proposal Terkirim yang perlu ditugaskan dan tidak ada usulan yang menunggu penetapan." },
      { id: "siap-kecil", nama: "Proposal Terkirim siap disusun (kecil)", ringkas: "Enam proposal Terkirim, masa ditutup; belum ada usulan." },
      { id: "menunggu", nama: "Usulan menunggu penetapan", ringkas: "Usulan penugasan (batas beban 3) sudah disusun, belum ditetapkan." },
      { id: "kekurangan", nama: "Kekurangan reviewer (S-1)", ringkas: "Batas beban 1; Susun Usulan Penugasan ditekan otomatis dan menampilkan Kekurangan Reviewer." },
      { id: "ditetapkan", nama: "Sudah ditetapkan", ringkas: "Penugasan sudah ditetapkan dan tercatat di kotak masuk BIMA." },
      { id: "skala", nama: "Skala nyata: 10.000 proposal", ringkas: "10.000 proposal Terkirim pada periode ditutup, ±130 reviewer dari 40 institusi, batas beban 100." },
    ],
  },
  {
    kode: "J-05",
    nama: "Pemantauan Kesesuaian",
    peran: "Tim Kerja DPPM",
    rute: ["/tim-kerja/pemantauan"],
    bawaan: "contoh",
    skenario: [
      { id: "belum-final", nama: "Belum ada penilaian final", ringkas: "Penilaian final dihapus; hanya butir deterministik gagal yang tampil." },
      { id: "contoh", nama: "Data pemantauan contoh", ringkas: "Proposal Ditahan dan penilaian Final dengan koreksi reviewer." },
    ],
  },
  {
    kode: "J-06",
    nama: "Hasil Pemeriksaan Pengajuan",
    peran: "Pengusul",
    rute: ["/pengusul/hasil"],
    skenario: [
      { id: "terkirim", nama: "Terkirim", ringkas: "Semua butir lolos; bukti pengiriman tampil." },
      { id: "ditahan", nama: "Ditahan", ringkas: "Bagian Metode melebihi batas kata; butir gagal paling atas." },
      { id: "ditolak", nama: "Ditolak", ringkas: "Masa pengusulan sudah ditutup (3a)." },
      { id: "diperiksa", nama: "Sedang diperiksa", ringkas: "Pemeriksaan berjalan; halaman menyegarkan diri otomatis (lewat 2 menit berubah menjadi galat batas waktu)." },
    ],
  },
  {
    kode: "J-07",
    nama: "Daftar Penugasan",
    peran: "Reviewer",
    rute: ["/reviewer/penugasan"],
    bawaan: "baru",
    skenario: [
      { id: "kosong", nama: "Kosong", ringkas: "Reviewer tanpa penugasan." },
      { id: "baru", nama: "Ada penugasan Baru", ringkas: "PRP-2026-0004 berlabel Baru." },
      { id: "draf", nama: "Ada penugasan Draf", ringkas: "Penilaian sebagian tersimpan; label Draf." },
      { id: "selesai", nama: "Semua Selesai", ringkas: "Penilaian final tersimpan dan terkirim ke BIMA; label Selesai." },
    ],
  },
  {
    kode: "J-08",
    nama: "Pemeriksaan Proposal",
    peran: "Reviewer",
    rute: ["/reviewer/pemeriksaan"],
    skenario: [
      { id: "normal", nama: "Normal", ringkas: "Hasil semantik normal (mode tiruan)." },
      { id: "perlu-manual", nama: "Perlu diperiksa manual", ringkas: "Kutipan LLM tidak ditemukan pada butir pertama (S-1)." },
      { id: "belum-rekomendasi", nama: "Belum ada rekomendasi", ringkas: "LLM tidak merespons dua kali pada butir pertama (S-2)." },
      { id: "draf", nama: "Draf tersimpan", ringkas: "Tiga komponen dan umpan balik sudah terisi." },
      { id: "final", nama: "Final (hanya baca)", ringkas: "Penilaian sudah Simpan Permanen; isian terkunci." },
    ],
  },
  {
    kode: "BIMA-1",
    nama: "BIMA: Pengajuan",
    peran: "Pengusul",
    rute: ["/bima/pengajuan"],
    skenario: [
      { id: "lolos", nama: "Draf lolos semua butir", ringkas: "PRP-2026-0001; masa berjalan; Ajukan Usulan menghasilkan Terkirim." },
      { id: "ditahan", nama: "Draf ditahan lalu diperbaiki", ringkas: "PRP-2026-0002; Metode melebihi batas; Ajukan ulang dengan naskah perbaikan." },
      { id: "ditolak", nama: "Draf ditahan lalu ditolak", ringkas: "PRP-2026-0003; tutup masa di BIMA lalu Ajukan ulang (Ditolak)." },
    ],
  },
  {
    kode: "BIMA-2",
    nama: "BIMA: Kotak masuk",
    peran: "Simulasi BIMA",
    rute: ["/bima/kotak-masuk"],
    skenario: [{ id: "normal", nama: "Kotak masuk saat ini", ringkas: "Penugasan dan keputusan yang diterima dari SEMAR (ringkasan + 100 terbaru)." }],
  },
];

/** Nama cookie (tidak httpOnly) berisi skenario yang terakhir dipilih: "<jendela>|<skenario>" */
export const COOKIE_SKENARIO = "semar_skenario";

export function cariJendela(kode: string): JendelaDemo | undefined {
  return KATALOG_JENDELA.find((j) => j.kode === kode);
}

/** Skenario bawaan jendela (dipakai saat berpindah jendela tanpa memilih skenario). */
export function skenarioBawaan(kodeJendela: string): SkenarioDemo | undefined {
  const j = cariJendela(kodeJendela);
  return j?.skenario.find((x) => x.id === j.bawaan) ?? j?.skenario[0];
}

export function cariSkenario(kodeJendela: string, id: string): SkenarioDemo | undefined {
  return cariJendela(kodeJendela)?.skenario.find((s) => s.id === id);
}

/** Jendela yang sedang dibuka menurut alamat halaman. */
export function jendelaDariJalur(jalur: string): JendelaDemo | undefined {
  return KATALOG_JENDELA.find((j) => j.rute.some((r) => jalur === r || jalur.startsWith(`${r}/`)));
}

export function alamatSkenario(kodeJendela: string, id?: string): string {
  const p = new URLSearchParams({ j: kodeJendela });
  if (id) p.set("s", id);
  return `/demo/mulai?${p.toString()}`;
}
