/**
 * KONTRAK BERSAMA: tanda tangan fungsi servis lintas agen.
 * Implementasi ada di berkas masing-masing pemilik (lihat docs/KONTRAK.md); berkas ini hanya tipe.
 */
import type {
  ButirCek,
  DokumenPeriksa,
  HasilButirDeterministik,
  HasilButirSemantik,
  HasilPilihReviewer,
  HasilSusunPenugasan,
  KonteksPeriksa,
  RingkasanPemeriksaanDeterministik,
  RingkasanPemeriksaanSemantik,
} from "./tipe";

/** [milik C] UC-06: periksa satu versi proposal, simpan ke hasil_pemeriksaan, perbarui versi_proposal.statusPemeriksaan. */
export type JalankanPemeriksaanDeterministik = (versiId: string) => Promise<RingkasanPemeriksaanDeterministik>;

/** [milik C] Murni, tanpa basis data: dipakai UC-06 dan "Uji pada Contoh" (J-03). Hanya butir deterministik yang diproses. */
export type PeriksaDeterministikTeks = (
  dokumen: DokumenPeriksa,
  butir: ButirCek[],
  konteks: KonteksPeriksa,
) => HasilButirDeterministik[];

/** [milik D] UC-05 setelah catatTerkirim: masukkan versi ke antrean (job_semantik); tidak boleh kehilangan permintaan (NFR 2.5). */
export type AntrekanPemeriksaanSemantik = (versiId: string) => Promise<{ jobId: string }>;

/** [milik D] UC-09: proses versi, simpan ke hasil_pemeriksaan (jenis semantik). Teks dikirim tanpa identitas pengusul. */
export type JalankanPemeriksaanSemantik = (versiId: string) => Promise<RingkasanPemeriksaanSemantik>;

/** [milik D] Tanpa basis data: dipakai UC-09 dan "Uji pada Contoh" (J-03). Hanya butir semantik yang diproses. */
export type NilaiSemantikTeks = (dokumen: DokumenPeriksa, butir: ButirCek[]) => Promise<HasilButirSemantik[]>;

/** [milik B] UC-03: susun usulan penugasan untuk periode yang masa pengusulannya sudah ditutup. */
export type SusunPenugasan = (periodeId: string, batasBeban: number) => Promise<HasilSusunPenugasan>;

/** [milik B] UC-03 S-2: periksa ulang syarat institusi dan beban bagi reviewer pengganti. */
export type PilihReviewer = (penugasanId: string, reviewerBaruId: string) => Promise<HasilPilihReviewer>;
