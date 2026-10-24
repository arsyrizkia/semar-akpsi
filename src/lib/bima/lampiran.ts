/**
 * Lampiran proposal milik BIMA (tiruan). SEMAR hanya untuk ISI proposal (arah-isi-saja-2026-10-24): daftar lampiran wajib per skema
 * dan templat lampirannya (surat pernyataan mitra, surat keterangan mahasiswa) diatur di sisi BIMA. Pengusul mengunduh templat,
 * mengisinya, lalu mengunggahnya kembali di halaman pengajuan. SEMAR tidak memeriksa lampiran; reviewer hanya melihat dan
 * mengunduhnya dari BIMA (J-08, hanya baca). Murni, tanpa basis data.
 */

export interface TemplatLampiranBima {
  nama: string;
  /** judul surat/formulir */
  judul: string;
  /** kalimat templat berurutan; baris "A | B | C" menjadi tabel isian berlabel */
  kalimat: string[];
}

/** Lampiran wajib per kode skema (konfigurasi BIMA tiruan; nama sama untuk semua skema contoh). */
const LAMPIRAN_WAJIB: Record<string, string[]> = {
  PD: ["Surat Pernyataan Mitra", "Artikel Ketua Pengusul", "Surat Keterangan Mahasiswa Bimbingan"],
  PT: ["Surat Pernyataan Mitra", "Artikel Ketua Pengusul", "Surat Keterangan Mahasiswa Bimbingan"],
};

export const lampiranWajibSkema = (kodeSkema: string): string[] => [...(LAMPIRAN_WAJIB[kodeSkema] ?? [])];

const TEMPLAT: TemplatLampiranBima[] = [
  {
    nama: "Surat Pernyataan Mitra",
    judul: "SURAT PERNYATAAN",
    kalimat: [
      "Yang bertanda tangan di bawah ini:",
      "Nama | Jabatan (jika ada) | Instansi/Lembaga | No Telepon/HP | Alamat",
      "dengan ini menyatakan bersedia menjadi mitra terhadap penelitian:",
      "Nama | NIDN | Judul Proposal | Bentuk Dukungan/Total Kontribusi Dana",
      "Dan saya menyatakan bahwa saya tidak memiliki afiliasi atau hubungan keluarga dengan tim pengusul.",
      "Demikian pernyataan ini saya buat dengan sebenar-benarnya untuk digunakan sebagaimana mestinya.",
    ],
  },
  {
    nama: "Surat Keterangan Mahasiswa Bimbingan",
    judul: "SURAT KETERANGAN",
    kalimat: [
      "Yang bertanda tangan di bawah ini:",
      "Nama | NIDN | Jabatan | Program Studi",
      "menerangkan bahwa mahasiswa berikut dibimbing oleh yang bersangkutan dan terlibat dalam penelitian:",
      "Nama Mahasiswa | NIM | Judul Proposal",
      "Demikian surat keterangan ini dibuat untuk digunakan sebagaimana mestinya.",
    ],
  },
];

/** Templat lampiran yang tersedia untuk diunduh; lampiran lain (mis. artikel ketua) hanya diunggah, tanpa templat. */
export function templatLampiran(nama: string): TemplatLampiranBima | null {
  const n = nama.trim().toLowerCase();
  return TEMPLAT.find((t) => t.nama.toLowerCase() === n) ?? null;
}

/** Baris kalimat templat berbentuk "A | B | C" menjadi daftar label isian. */
export function labelIsian(baris: string): string[] | null {
  return baris.includes(" | ") ? baris.split(" | ").map((x) => x.trim()).filter(Boolean) : null;
}
