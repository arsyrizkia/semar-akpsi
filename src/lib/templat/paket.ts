/**
 * Paket templat proposal (UC-01, tambahan 23 Okt 2026): kop, bagian depan 1-6, dan templat lampiran. Murni (tanpa basis data).
 * Susunan dan kop bawaan mengikuti ekspor BIMA (contoh no. 5, 6, 10): sistem dirancang untuk Kemdiktisaintek, jadi kop dokumen
 * templat memuat nama lembaga asli (teks yang dapat disunting di J-02b). Aturan "tanpa identitas Kemdiktisaintek" hanya berlaku
 * untuk tampilan halaman BIMA tiruan, bukan dokumen templat; tanpa lambang. Nilai di sini adalah NILAI BAWAAN; sumber kebenaran adalah data templat (kolom `kop`, `lampiran_templat`).
 */

export type BagianDepan = "judul" | "identitas" | "mitra" | "luaran" | "strategis" | "anggaran";

export interface KopTemplat {
  lembaga: string;
  alamat: string;
  laman: string;
  /** teks kotak "PROTEKSI ISI PROPOSAL" */
  proteksi: string;
  /** judul halaman depan, bawaan "PROPOSAL PENELITIAN" */
  judulProposal: string;
  /** bagian depan 1-6 yang disertakan */
  depan: Record<BagianDepan, boolean>;
}

export interface KolomDepan {
  kunci: BagianDepan;
  judul: string;
  /** kalimat penjelas di bawah judul bagian (boleh kosong) */
  penjelas: string;
  /** isian berbentuk "label : ...." (bagian berkolom tunggal) */
  isian: string[];
  /** kepala tabel kosong (bagian bertabel) */
  tabel: string[];
}

/** Bagian depan 1-6 menurut ekspor BIMA no. 6 dan 10 (nama kolom disalin dari contoh). */
export const BAGIAN_DEPAN: readonly KolomDepan[] = [
  {
    kunci: "judul",
    judul: "JUDUL PENELITIAN",
    penjelas: "",
    isian: ["Judul", "Bidang Fokus", "Tema", "Topik", "Prioritas Riset", "Rumpun Ilmu Level 1", "Rumpun Ilmu Level 2", "Rumpun Ilmu Level 3", "Skema Penelitian", "Strata (Dasar/Terapan/Pengembangan)", "Nilai SBK", "Target Akhir TKT", "Lama Kegiatan"],
    tabel: [],
  },
  { kunci: "identitas", judul: "IDENTITAS PENGUSUL", penjelas: "", isian: [], tabel: ["Nama/Peran", "Jenis", "Program Studi/Bagian", "Bidang Tugas", "ID Sinta"] },
  {
    kunci: "mitra",
    judul: "MITRA KERJASAMA PENELITIAN (Jika Ada)",
    penjelas: "Pelaksanaan penelitian dapat melibatkan mitra kerjasama yaitu mitra kerjasama dalam melaksanakan penelitian, mitra sebagai calon pengguna hasil penelitian, atau mitra investor",
    isian: [],
    tabel: ["Mitra", "Nama Mitra", "Dana"],
  },
  { kunci: "luaran", judul: "LUARAN DAN TARGET CAPAIAN", penjelas: "", isian: [], tabel: ["Tahun Luaran", "Kategori Luaran", "Jenis Luaran", "Status target capaian", "Keterangan"] },
  { kunci: "strategis", judul: "BIDANG STRATEGIS", penjelas: "", isian: [], tabel: ["8 Bidang Strategis", "Rumusan Masalah", "Uraian"] },
  {
    kunci: "anggaran",
    judul: "ANGGARAN",
    penjelas: "Rencana Anggaran Biaya penelitian mengacu pada PMK dan buku Panduan Penelitian dan Pengabdian kepada Masyarakat yang berlaku.",
    isian: [],
    tabel: ["Kelompok", "Komponen", "Item", "Satuan", "Vol.", "Biaya Satuan", "Total"],
  },
];

export const KOP_BAWAAN: KopTemplat = {
  lembaga: "Kementerian Pendidikan Tinggi, Sains, dan Teknologi",
  alamat: "Jalan Jenderal Sudirman, Senayan, Jakarta Pusat 10270",
  laman: "https://bima.kemdiktisaintek.go.id",
  proteksi:
    "Dilarang menyalin, menyimpan, memperbanyak sebagian atau seluruh isi proposal ini dalam bentuk apapun kecuali oleh pengusul dan pengelola administrasi penelitian dan pengabdian kepada masyarakat",
  judulProposal: "PROPOSAL PENELITIAN",
  depan: { judul: true, identitas: true, mitra: true, luaran: true, strategis: true, anggaran: true },
};

/** Kop dari kolom jsonb templat; nilai yang hilang diisi bawaan (baris lama dan data sebagian). */
export function kopDariBaris(k: Partial<KopTemplat> | null | undefined): KopTemplat {
  const a = k ?? {};
  return {
    lembaga: a.lembaga ?? KOP_BAWAAN.lembaga,
    alamat: a.alamat ?? KOP_BAWAAN.alamat,
    laman: a.laman ?? KOP_BAWAAN.laman,
    proteksi: a.proteksi ?? KOP_BAWAAN.proteksi,
    judulProposal: a.judulProposal ?? KOP_BAWAAN.judulProposal,
    depan: { ...KOP_BAWAAN.depan, ...(a.depan ?? {}) },
  };
}

export type JenisLampiran = "unggahan" | "formulir";

export interface LampiranTemplat {
  nama: string;
  jenis: JenisLampiran;
  /** judul surat/formulir (jenis formulir) */
  judul: string;
  /** kalimat templat berurutan; baris "Label" tanpa titik dua dianggap judul bagian isian */
  kalimat: string[];
  /** frasa kunci yang harus ada di berkas yang diunggah (cekLampiran, format) */
  kunci: string[];
  /** halaman lampiran ikut di paket unduhan; tidak ada = ikut */
  sertakan?: boolean;
}

const SURAT_MITRA: LampiranTemplat = {
  nama: "Surat Pernyataan Mitra",
  jenis: "formulir",
  judul: "SURAT PERNYATAAN",
  kalimat: [
    "Yang bertanda tangan di bawah ini:",
    "Nama | Jabatan (jika ada) | Instansi/Lembaga | No Telepon/HP | Alamat",
    "dengan ini menyatakan bersedia menjadi mitra terhadap penelitian:",
    "Nama | NIDN | Judul Proposal | Bentuk Dukungan/Total Kontribusi Dana",
    "Dan saya menyatakan bahwa saya tidak memiliki afiliasi atau hubungan keluarga dengan tim pengusul.",
    "Demikian pernyataan ini saya buat dengan sebenar-benarnya untuk digunakan sebagaimana mestinya.",
  ],
  kunci: ["bersedia menjadi mitra", "tidak memiliki afiliasi"],
};

const SURAT_MAHASISWA: LampiranTemplat = {
  nama: "Surat Keterangan Mahasiswa Bimbingan",
  jenis: "formulir",
  judul: "SURAT KETERANGAN",
  kalimat: [
    "Yang bertanda tangan di bawah ini:",
    "Nama | NIDN | Jabatan | Program Studi",
    "menerangkan bahwa mahasiswa berikut dibimbing oleh yang bersangkutan dan terlibat dalam penelitian:",
    "Nama Mahasiswa | NIM | Judul Proposal",
    "Demikian surat keterangan ini dibuat untuk digunakan sebagaimana mestinya.",
  ],
  kunci: ["dibimbing oleh", "terlibat dalam penelitian"],
};

/** Templat lampiran bawaan untuk sebuah lampiran wajib: surat mitra dan surat mahasiswa berformulir, selain itu unggahan bebas. */
export function lampiranBawaan(nama: string): LampiranTemplat {
  const n = nama.trim().toLowerCase();
  if (n === SURAT_MITRA.nama.toLowerCase()) return { ...SURAT_MITRA };
  if (n === SURAT_MAHASISWA.nama.toLowerCase()) return { ...SURAT_MAHASISWA };
  return { nama: nama.trim(), jenis: "unggahan", judul: "", kalimat: [], kunci: [] };
}

/** Templat lampiran untuk setiap lampiran wajib: yang tersimpan dipakai, yang belum ada memakai bawaan. */
export function lampiranDariBaris(tersimpan: LampiranTemplat[] | null | undefined, lampiranWajib: string[]): LampiranTemplat[] {
  const peta = new Map((tersimpan ?? []).map((l) => [l.nama.trim().toLowerCase(), l]));
  return lampiranWajib.map((nama) => peta.get(nama.trim().toLowerCase()) ?? lampiranBawaan(nama));
}

/** Baris kalimat templat berbentuk "A | B | C" menjadi daftar label isian. */
export function labelIsian(baris: string): string[] | null {
  return baris.includes(" | ") ? baris.split(" | ").map((x) => x.trim()).filter(Boolean) : null;
}

/** Normalisasi untuk mencocokkan frasa kunci: huruf kecil, tanda baca dan spasi ganda dibuang. */
export const normFrasa = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export interface GalatTemplatLampiran {
  judul: string | null;
  kalimat: string | null;
  kunci: string | null;
}

const barisTeks = (s: string) => s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

/** Validasi M-13: lampiran berformulir butuh judul dan isi; setiap kalimat kunci harus tertulis di isi templat. Unggahan selalu sah. */
export function periksaTemplatLampiran(jenis: JenisLampiran, judul: string, kalimat: string, kunci: string): GalatTemplatLampiran | null {
  if (jenis !== "formulir") return null;
  const g: GalatTemplatLampiran = { judul: null, kalimat: null, kunci: null };
  if (!judul.trim()) g.judul = "Judul formulir wajib diisi";
  const isi = barisTeks(kalimat);
  if (isi.length === 0) g.kalimat = "Isi templat wajib diisi, satu kalimat per baris";
  const teks = normFrasa(isi.join(" "));
  const hilang = barisTeks(kunci).filter((k) => !teks.includes(normFrasa(k)));
  if (hilang.length > 0) g.kunci = `Kalimat kunci harus tertulis di isi templat: ${hilang.map((h) => `"${h}"`).join(", ")}`;
  return g.judul || g.kalimat || g.kunci ? g : null;
}
