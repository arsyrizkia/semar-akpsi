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
  | { tipe: "kata_kunci"; jumlah: number; pemisah: string }
  | { tipe: "sitasi_bernomor" }
  | { tipe: "pustaka_berurutan" }
  | { tipe: "jumlah_referensi_sama" }
  | { tipe: "struktur_judul" }
  | { tipe: "judul_sama" }
  | { tipe: "bagian_terisi"; bagian: string }
  | { tipe: "diagram_alir"; bagian: string }
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

export interface BagianTemplatDto {
  urutan: number;
  nama: string;
  batasKata: number | null;
  wajib: boolean;
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
}

export interface SebaranBeban {
  reviewerId: string;
  namaReviewer: string;
  jumlah: number;
  batas: number;
}

export interface HasilSusunPenugasan {
  periodeId: string;
  usulan: BarisUsulanPenugasan[];
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
