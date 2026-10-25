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
  /** kode jendela tempat skenario ini mendarat bila bukan jendelanya sendiri (J-01: masuk lalu diarahkan); pil tetap menyebut skenario ini di sana */
  mendaratDi?: string;
}

export interface JendelaDemo {
  kode: string;
  nama: string;
  /** peran yang dipasang otomatis */
  peran: string;
  /** awalan alamat yang dianggap jendela ini */
  rute: string[];
  /** pola alamat (ekspresi reguler, string) untuk layar turunan seperti J-02b; didahulukan daripada awalan `rute` */
  pola?: string;
  /** layar turunan (b): induknya, dipakai navigator untuk mengelompokkan */
  induk?: string;
  /** akun demo yang dipasang saat "Pindah layar" bila sesi yang ada bukan peran jendela ini; null = tanpa sesi */
  akunBawaan?: string | null;
  /** peran sesi yang diperlukan jendela ini: pindah layar mempertahankan sesi bila peran (dan hak pengelola) sudah cocok */
  peranSesi?: "tim_kerja" | "reviewer" | "pengusul" | "siapa-saja" | "tanpa";
  /** hanya pengelola yang boleh membuka (J-02, J-03) */
  hanyaPengelola?: boolean;
  /** alamat tujuan "Pindah layar" bila tidak ada rujukan data tertentu (tidak mengubah data) */
  alamatPindah: string;
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
    peranSesi: "tanpa",
    akunBawaan: null,
    alamatPindah: "/masuk",
    skenario: [
      { id: "belum-masuk", nama: "Belum masuk", ringkas: "Sesi dihapus; halaman Masuk dengan akun BIMA." },
      { id: "pengelola", nama: "Masuk sebagai Tim Kerja (pengelola)", ringkas: "Sesi pengelola dipasang; tujuan sesudah masuk: J-02.", mendaratDi: "J-02" },
      { id: "anggota", nama: "Masuk sebagai Tim Kerja (anggota)", ringkas: "Sesi anggota dipasang; tujuan sesudah masuk: J-04 (menu J-04 dan J-05).", mendaratDi: "J-04" },
      { id: "reviewer", nama: "Masuk sebagai Reviewer", ringkas: "Sesi reviewer-2 dipasang; tujuan sesudah masuk: J-07.", mendaratDi: "J-07" },
    ],
  },
  {
    kode: "J-02",
    nama: "Templat Proposal (daftar)",
    peran: "Tim Kerja (pengelola)",
    rute: [],
    pola: "^/tim-kerja/templat/?(\\?.*)?$",
    peranSesi: "tim_kerja",
    hanyaPengelola: true,
    akunBawaan: "dppm-pengelola",
    alamatPindah: "/tim-kerja/templat",
    skenario: [
      { id: "normal", nama: "Templat berlaku", ringkas: "Skema PD punya templat Aktif; masa pengusulan ditutup (Terbitkan berakhir di jalur utama)." },
      { id: "tanpa-templat", nama: "Skema belum punya templat (S-1)", ringkas: "Skema PK tanpa templat; Templat Baru membuat versi 1." },
      { id: "masa-berjalan", nama: "Masa pengusulan berjalan (9a)", ringkas: "Terbitkan untuk periode berjalan menyimpan templat sebagai draf; periode 2027 tidak terpengaruh." },
      { id: "draf-tersimpan", nama: "Draf tersimpan", ringkas: "Draf versi berikutnya sudah ada dan dibuka kembali." },
    ],
  },
  {
    kode: "J-02a",
    nama: "Rincian Templat (tab Bagian, Aturan Pemeriksaan)",
    peran: "Tim Kerja (pengelola)",
    induk: "J-02",
    rute: [],
    pola: "^/tim-kerja/templat/[^/]+/?(\\?.*)?$",
    peranSesi: "tim_kerja",
    hanyaPengelola: true,
    akunBawaan: "dppm-pengelola",
    alamatPindah: "/tim-kerja/templat",
    skenario: [{ id: "draf", nama: "Draf versi baru terbuka", ringkas: "Draf versi berikutnya skema PD disiapkan dan dibuka di rincian templat." }],
  },
  {
    kode: "J-03",
    nama: "Aturan Pemeriksaan (tab di J-02a)",
    peran: "Tim Kerja (pengelola)",
    induk: "J-02a",
    rute: [],
    pola: "^/tim-kerja/templat/[^/]+/?\\?(.*&)?tab=aturan(&.*)?$",
    peranSesi: "tim_kerja",
    hanyaPengelola: true,
    akunBawaan: "dppm-pengelola",
    alamatPindah: "/tim-kerja/aturan",
    skenario: [
      { id: "normal", nama: "Normal", ringkas: "Tab Aturan Pemeriksaan skema PD pada templat Aktif; masa pengusulan ditutup." },
      { id: "perlu-ditinjau", nama: "Ada butir Perlu ditinjau (dari UC-04)", ringkas: "Satu butir manual ditandai Perlu ditinjau dari J-05." },
      { id: "uji-tanggal", nama: "Uji tanggal berlaku (8a)", ringkas: "Masa pengusulan berjalan; tanggal berlaku di tengah masa ditolak." },
    ],
  },
  {
    kode: "J-03b",
    nama: "Hasil Uji pada Contoh",
    peran: "Tim Kerja (pengelola)",
    induk: "J-03",
    rute: ["/tim-kerja/aturan/uji"],
    peranSesi: "tim_kerja",
    hanyaPengelola: true,
    akunBawaan: "dppm-pengelola",
    alamatPindah: "/tim-kerja/aturan",
    skenario: [{ id: "hasil", nama: "Laporan uji tiga contoh", ringkas: "Basis aturan skema PD normal; laporan uji atas contoh A, B, dan C dibuka." }],
  },
  {
    kode: "J-04",
    nama: "Penugasan Reviewer",
    peran: "Tim Kerja DPPM",
    rute: [],
    pola: "^/tim-kerja/penugasan/?$",
    peranSesi: "tim_kerja",
    akunBawaan: "dppm-pengelola",
    alamatPindah: "/tim-kerja/penugasan",
    bawaan: "siap",
    skenario: [
      { id: "kosong", nama: "Kosong", ringkas: "Tidak ada proposal Terkirim yang perlu ditugaskan dan tidak ada usulan yang menunggu penetapan." },
      { id: "siap", nama: "1.200 proposal siap disusun", ringkas: "1.200 proposal Terkirim dari 14 institusi, 30 reviewer bersedia, batas beban 45; belum ada usulan.", mendaratDi: "J-04b" },
      { id: "siap-kecil", nama: "Proposal Terkirim siap disusun (kecil)", ringkas: "Enam proposal Terkirim, masa ditutup; belum ada usulan." },
      { id: "menunggu", nama: "Usulan menunggu penetapan (1.200)", ringkas: "1.200 usulan (batas beban 45) sudah disusun, belum ditetapkan.", mendaratDi: "J-04b" },
      { id: "kekurangan", nama: "Kekurangan reviewer (S-1)", ringkas: "Batas beban 35 untuk 1.200 proposal; Susun ditekan otomatis, panel S-1 menyarankan batas yang cukup.", mendaratDi: "J-04b" },
      { id: "ditetapkan", nama: "Sudah ditetapkan (1.200)", ringkas: "1.200 penugasan ditetapkan dan tercatat di kotak masuk BIMA.", mendaratDi: "J-04b" },
      { id: "skala", nama: "Uji beban: 10.000 proposal", ringkas: "Simulasi 10.000 proposal Terkirim pada periode ditutup, ±130 reviewer dari 40 institusi, batas beban 100." },
    ],
  },
  {
    kode: "J-04b",
    nama: "Usulan Penugasan",
    peran: "Tim Kerja DPPM",
    induk: "J-04",
    rute: [],
    pola: "^/tim-kerja/penugasan/[^/]+",
    peranSesi: "tim_kerja",
    akunBawaan: "dppm-pengelola",
    alamatPindah: "/tim-kerja/penugasan",
    skenario: [
      { id: "siap", nama: "1.200 proposal siap disusun", ringkas: "1.200 proposal Terkirim, 30 reviewer bersedia, batas beban 45; belum ada usulan." },
      { id: "menunggu", nama: "Usulan menunggu penetapan (1.200)", ringkas: "1.200 usulan sudah disusun, belum ditetapkan." },
      { id: "kekurangan", nama: "Kekurangan reviewer (S-1)", ringkas: "Batas beban 35: panel Kekurangan Reviewer dengan saran batas tampil." },
      { id: "ditetapkan", nama: "Sudah ditetapkan (1.200)", ringkas: "Penugasan ditetapkan dan tercatat di kotak masuk BIMA." },
      { id: "siap-kecil", nama: "Enam proposal siap disusun", ringkas: "Enam proposal Terkirim; belum ada usulan; batas beban 3." },
    ],
  },
  {
    kode: "J-05",
    nama: "Pemantauan Kesesuaian",
    peran: "Tim Kerja DPPM",
    rute: ["/tim-kerja/pemantauan"],
    peranSesi: "tim_kerja",
    akunBawaan: "dppm-pengelola",
    alamatPindah: "/tim-kerja/pemantauan",
    bawaan: "contoh",
    skenario: [
      { id: "belum-final", nama: "Belum ada penilaian final", ringkas: "Penilaian final dihapus; hanya butir deterministik gagal yang tampil." },
      { id: "contoh", nama: "Data pemantauan contoh", ringkas: "Proposal Ditahan dan penilaian Final dengan koreksi reviewer." },
    ],
  },
  {
    kode: "J-05b",
    nama: "Rincian Proposal",
    peran: "Tim Kerja DPPM",
    induk: "J-05",
    rute: ["/tim-kerja/proposal"],
    peranSesi: "tim_kerja",
    akunBawaan: "dppm-pengelola",
    alamatPindah: "/tim-kerja/pemantauan",
    skenario: [{ id: "contoh", nama: "Proposal dengan penilaian dan koreksi", ringkas: "Data pemantauan contoh; rincian PRP-2026-0004 dibuka." }],
  },
  {
    kode: "J-06",
    nama: "Hasil Pemeriksaan Pengajuan",
    peran: "Pengusul",
    rute: ["/pengusul/hasil"],
    peranSesi: "pengusul",
    akunBawaan: "pengusul-1",
    alamatPindah: "/bima/pengajuan",
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
    peranSesi: "reviewer",
    akunBawaan: "reviewer-2",
    alamatPindah: "/reviewer/penugasan",
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
    rute: [],
    pola: "^/reviewer/pemeriksaan/[^/]+/?$",
    peranSesi: "reviewer",
    akunBawaan: "reviewer-2",
    alamatPindah: "/reviewer/penugasan",
    skenario: [
      { id: "normal", nama: "Normal", ringkas: "Hasil semantik normal (mode tiruan)." },
      { id: "perlu-manual", nama: "Perlu diperiksa manual", ringkas: "Kutipan LLM tidak ditemukan pada butir pertama (S-1)." },
      { id: "belum-rekomendasi", nama: "Belum ada rekomendasi", ringkas: "LLM tidak merespons dua kali pada butir pertama (S-2)." },
      { id: "draf", nama: "Draf tersimpan", ringkas: "Tiga komponen dan umpan balik sudah terisi." },
      { id: "final", nama: "Final (hanya baca)", ringkas: "Penilaian sudah Simpan Permanen; isian terkunci." },
    ],
  },
  {
    kode: "J-08b",
    nama: "Keputusan Penilaian",
    peran: "Reviewer",
    induk: "J-08",
    rute: [],
    pola: "^/reviewer/pemeriksaan/[^/]+/keputusan",
    peranSesi: "reviewer",
    akunBawaan: "reviewer-2",
    alamatPindah: "/reviewer/penugasan",
    skenario: [{ id: "draf", nama: "Draf terisi sebagian", ringkas: "Tiga komponen dan umpan balik sudah terisi; Simpan Permanen belum ditekan." }],
  },
  {
    kode: "BIMA-1",
    nama: "BIMA: Pengajuan",
    peran: "Pengusul",
    rute: ["/bima/pengajuan"],
    peranSesi: "pengusul",
    akunBawaan: "pengusul-1",
    alamatPindah: "/bima/pengajuan",
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
    peranSesi: "siapa-saja",
    akunBawaan: "dppm-pengelola",
    alamatPindah: "/bima/kotak-masuk",
    skenario: [{ id: "normal", nama: "Kotak masuk saat ini", ringkas: "Penugasan dan keputusan yang diterima dari SEMAR (ringkasan + 100 terbaru)." }],
  },
];

/** Nama cookie (tidak httpOnly) berisi skenario yang terakhir dipilih: "<jendela>/<skenario>" */
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

/** Jendela yang sedang dibuka menurut alamat halaman: pola (layar turunan dan layar induk persis) didahulukan, lalu awalan terpanjang. */
export function jendelaDariJalur(jalur: string, kueri = ""): JendelaDemo | undefined {
  // pola menguji jalur beserta kueri ("/jalur?tab=aturan") supaya tab J-03 dibedakan dari J-02a; pola terpanjang (paling khusus) menang
  const lengkap = kueri ? `${jalur}?${kueri}` : jalur;
  const lewatPola = KATALOG_JENDELA.filter((j) => j.pola && new RegExp(j.pola).test(lengkap)).sort((a, b) => (b.pola?.length ?? 0) - (a.pola?.length ?? 0))[0];
  if (lewatPola) return lewatPola;
  let terbaik: { j: JendelaDemo; panjang: number } | undefined;
  for (const j of KATALOG_JENDELA) {
    for (const r of j.rute) {
      if ((jalur === r || jalur.startsWith(`${r}/`)) && (!terbaik || r.length > terbaik.panjang)) terbaik = { j, panjang: r.length };
    }
  }
  return terbaik?.j;
}

/** Alamat "Pindah layar": hanya berpindah dan memasang peran bila perlu, tidak pernah mengubah data. `rujukan` = idProposal bila ada. */
export function alamatPindah(kodeJendela: string, rujukan?: string): string {
  const p = new URLSearchParams({ j: kodeJendela });
  if (rujukan) p.set("p", rujukan);
  return `/demo/pindah?${p.toString()}`;
}

export function alamatSkenario(kodeJendela: string, id?: string): string {
  const p = new URLSearchParams({ j: kodeJendela });
  if (id) p.set("s", id);
  return `/demo/mulai?${p.toString()}`;
}
