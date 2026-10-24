/**
 * KONTRAK BERSAMA: tipe domain lintas agen. Tidak boleh diubah oleh agen paralel (laporkan kebutuhan perubahan).
 */

export type JenisButir = "deterministik" | "semantik";
export type StatusButir = "Draf" | "Aktif" | "Perlu ditinjau" | "Nonaktif";
export type StatusHasilDeterministik = "Lolos" | "Gagal";
export type StatusHasilSemantik = "Memenuhi" | "Tidak memenuhi" | "Perlu diperiksa manual" | "Belum ada rekomendasi";
export type Keputusan = "Memenuhi" | "Tidak memenuhi";

/** Enam komponen "Keputusan Komponen Borang" pada J-08 (Tabel 5.5). */
export const KOMPONEN_BORANG = [
  "Kesesuaian isi per bagian",
  "Jumlah kata per bagian",
  "Sitasi dan daftar pustaka",
  "Lampiran surat mahasiswa bimbingan",
  "Artikel ketua pengusul",
  "Surat pernyataan mitra",
] as const;
export type KomponenBorang = (typeof KOMPONEN_BORANG)[number];

export const JENIS_KEKELIRUAN = [
  "Kutipan salah tempat",
  "Salah tafsir isi",
  "Bagian tidak ditemukan padahal ada",
  "Rekomendasi tidak relevan dengan butir",
  "Lainnya",
] as const;

/** Ambang contoh tingkat keyakinan (NFR 5.2): tinggi >= 0,8; sedang 0,5 sampai < 0,8; rendah < 0,5. */
export const AMBANG_KEYAKINAN = { tinggi: 0.8, sedang: 0.5 } as const;

/**
 * Parameter terstruktur butir cek (kolom butir_cek.parameter). Diskriminan: `tipe`.
 * Butir turunan templat memakai bagian_wajib, batas_kata, lampiran_wajib (terkunci).
 */
export type ParameterButir =
  | { tipe: "bagian_wajib"; bagian: string }
  | { tipe: "batas_kata"; bagian: string; batas: number }
  | { tipe: "lampiran_wajib"; nama: string }
  | { tipe: "lampiran_format"; nama: string; kunci: string[] }
  | { tipe: "kata_kunci"; jumlah: number; pemisah: string; bagian?: string }
  | { tipe: "batas_kata_min"; bagian: string; batas: number }
  | { tipe: "frasa_wajib"; bagian: string; frasa: string }
  | { tipe: "sitasi_bernomor"; pustaka?: string }
  | { tipe: "pustaka_berurutan"; pustaka?: string }
  | { tipe: "jumlah_referensi_sama"; pustaka?: string }
  | { tipe: "struktur_judul" }
  | { tipe: "judul_sama" }
  | { tipe: "bagian_terisi"; bagian: string }
  | { tipe: "diagram_alir"; bagian: string; keterangan?: string }
  | { tipe: "tabel_wajib"; bagian: string; kolom?: string[] }
  | { tipe: "semantik"; bagian: string; lampiran?: string };

/** Butir cek sebagaimana dibaca fungsi pemeriksa (turunan baris butir_cek). */
export interface ButirCek {
  id: string;
  kode: string;
  deskripsi: string;
  jenis: JenisButir;
  asal: "templat" | "manual";
  komponen: string | null;
  pemeriksa: string | null;
  parameter: ParameterButir | null;
  aturanHitung: string | null;
  pertanyaan: string | null;
  contohJawaban: string | null;
  status: StatusButir;
}

/**
 * Tipe Isian sebuah bagian templat: teks bebas, daftar bersambung pemisah (kata kunci), tabel (jadwal), atau daftar pustaka bernomor.
 * "daftar_pustaka" disimpan di basis data sebagai jenis_isian "teks" dengan daftar_pustaka true (kode lama di produksi tetap membacanya).
 */
export type JenisIsian = "teks" | "daftar" | "tabel" | "daftar_pustaka";

/** Satu unsur isi yang harus dimuat sebuah bagian (menjadi satu butir semantik); pertanyaan null/kosong = disusun otomatis. */
export interface UnsurIsi {
  unsur: string;
  pertanyaan?: string | null;
  /** contoh jawaban untuk butir semantik unsur ini (aditif, 24 Okt 2026) */
  contoh?: string | null;
}

export interface BagianTemplatDto {
  urutan: number;
  nama: string;
  batasKata: number | null;
  wajib: boolean;
  /** huruf judul pada Isian Substansi ("A".."H"); diturunkan dari urutan bila kosong */
  huruf?: string | null;
  /**
   * kalimat petunjuk bagian, boleh memuat `{batas}` (diganti batas kata bagian); null = diturunkan dari nama bagian
   * (templat/isian-substansi.ts), "" = tanpa petunjuk. Dibaca lewat `petunjukBagian`.
   */
  petunjuk?: string | null;
  /** ketentuan bagian (UC-01 M-12); null/kosong = diturunkan dari nama bagian Isian Substansi, selain itu teks */
  jenisIsian?: JenisIsian | null;
  /** jumlah butir bila jenisIsian = "daftar" */
  jumlahButir?: number | null;
  /** pemisah satu karakter bila jenisIsian = "daftar" */
  pemisah?: string | null;
  /** bagian wajib memuat gambar (mis. diagram alir pada Metode) */
  wajibGambar?: boolean | null;
  /** sitasi pada bagian ini bernomor sesuai urutan pengutipan */
  sitasiBernomor?: boolean | null;
  /** bagian ini adalah daftar pustaka yang dicocokkan dengan sitasi */
  daftarPustaka?: boolean | null;
  /** batas kata minimal (opsional); batasKata = maksimal */
  batasMin?: number | null;
  /** tabel wajib di dalam bagian bertipe teks */
  wajibTabel?: boolean | null;
  /** kolom wajib tabel (jenisIsian "tabel" atau wajibTabel), mis. ["No", "Nama Kegiatan", "Bulan 1–12"] */
  kolomTabel?: string[] | null;
  /** judul blok tabel, mis. "Tahun ke-1" */
  judulTabel?: string | null;
  /** keterangan gambar wajib, mis. "diagram alir penelitian" (dipakai bila wajibGambar) */
  ketGambar?: string | null;
  /** kalimat yang harus muncul persis di bagian ini */
  frasaWajib?: string[] | null;
  /** unsur isi yang harus dimuat (butir semantik, satu per unsur) */
  unsurIsi?: UnsurIsi[] | null;
}

/** Kepala dokumen templat (di atas bagian A): judul, subjudul skema, kalimat pengantar. */
export interface KepalaTemplatDto {
  judulDokumen: string;
  subjudul: string | null;
  pengantar: string | null;
}

/** Bahan yang diperiksa. Dipakai pemeriksaan nyata (dari versi_proposal) maupun "Uji pada Contoh" (dokumen_contoh). */
export interface DokumenPeriksa {
  judul: string;
  /** Judul menurut sistem BIMA (untuk butir judul_sama) */
  judulBima: string;
  teksPerBagian: Record<string, string>;
  /** Isi baris kata kunci mentah, mis. "a; b; c; d; e" */
  kataKunci: string | null;
  /** Nama lampiran yang ada, mis. "Surat Pernyataan Mitra" */
  lampiranAda: string[];
  /** Teks hasil ekstraksi tiap lampiran, kunci = nama lampiran (untuk butir semantik atas lampiran) */
  teksLampiran: Record<string, string>;
  /** Daftar judul bagian sebagaimana ditemukan di naskah, berurutan */
  judulBagianDitemukan: string[];
}

export interface KonteksPeriksa {
  bagianTemplat: BagianTemplatDto[];
  lampiranWajib: string[];
}

export interface HasilButirDeterministik {
  butirId: string;
  kode: string;
  bagian: string | null;
  status: StatusHasilDeterministik;
  /** Teks angka pembukti, mis. "1.240 kata dari batas 1.000" */
  angkaPembukti: string;
  /** Terisi bila Gagal: bagian dan batas yang dilanggar (S-1.2) */
  batasDilanggar: string | null;
}

export interface HasilButirSemantik {
  butirId: string;
  kode: string;
  bagian: string | null;
  status: StatusHasilSemantik;
  /** null bila "Belum ada rekomendasi" */
  rekomendasi: Keputusan | null;
  /** Kutipan yang sudah diverifikasi ada di teks (cocokkanKutipan) */
  kutipan: string | null;
  /** 0..1 */
  tingkatKeyakinan: number | null;
  alasanSistem: string | null;
  /** true bila dihasilkan mode tiruan, wajib ditampilkan berlabel "tiruan" */
  tiruan: boolean;
}

export interface RingkasanPemeriksaanDeterministik {
  versiId: string;
  hasil: HasilButirDeterministik[];
  semuaLolos: boolean;
  jumlahGagal: number;
}

export interface RingkasanPemeriksaanSemantik {
  versiId: string;
  jumlahButir: number;
  jumlahMemenuhi: number;
  jumlahPerluManual: number;
  jumlahBelumAda: number;
  tiruan: boolean;
}

/* ------------------------------ penugasan (UC-03) ------------------------------ */
export interface BarisUsulanPenugasan {
  penugasanId: string;
  proposalId: string;
  judulProposal: string;
  skema: string;
  institusiPengusul: string;
  reviewerId: string;
  namaReviewer: string;
  institusiReviewer: string;
  /** status penugasan sebenarnya (Diusulkan, Ditetapkan, Selesai) */
  status?: string;
}

export interface SebaranBeban {
  reviewerId: string;
  namaReviewer: string;
  jumlah: number;
  batas: number;
}

export interface HasilSusunPenugasan {
  periodeId: string;
  /** Halaman pertama usulan (skala besar: sisanya dibaca berhalaman lewat ambilUsulan) */
  usulan: BarisUsulanPenugasan[];
  /** Jumlah seluruh usulan yang disusun */
  jumlahUsulan: number;
  sebaran: SebaranBeban[];
  /** > 0 bila reviewer kurang (S-1): proposal yang belum dapat ditugaskan */
  jumlahBelumDitugaskan: number;
}

export interface HasilPilihReviewer {
  /** reviewer terpilih, atau reviewer semula bila syarat dilanggar */
  reviewerId: string;
  diterima: boolean;
  /** syarat yang dilanggar bila ditolak (beda institusi, batas beban, kesediaan) */
  syaratDilanggar: string[];
}

/* ------------------------------ pengujian aturan (UC-02 s.6) ------------------------------ */
export interface HasilUjiContoh {
  dokumenKode: string;
  dokumenNama: string;
  deterministik: HasilButirDeterministik[];
  semantik: HasilButirSemantik[];
}
