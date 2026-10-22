/** Tipe data tampilan J-07 dan J-08 (aman diimpor komponen klien). */
import type { Keputusan, StatusHasilSemantik } from "@/lib/kontrak/tipe";

export interface BarisDaftarPenugasan {
  penugasanId: string;
  judul: string;
  skema: string;
  tanggal: string;
  label: "Baru" | "Draf" | "Selesai";
}

export interface KoreksiTampil {
  keputusan: Keputusan;
  alasan: string;
  jenisKekeliruan: string;
}

export interface ButirTampil {
  hasilId: string;
  kode: string;
  deskripsi: string;
  /** nama tab tempat butir ditampilkan */
  tab: string;
  status: StatusHasilSemantik;
  rekomendasi: Keputusan | null;
  kutipan: string | null;
  tingkatKeyakinan: number | null;
  alasanSistem: string | null;
  tiruan: boolean;
  koreksi: KoreksiTampil | null;
}

export interface TabTeks {
  nama: string;
  jenis: "bagian" | "lampiran";
  teks: string;
}

export interface PenilaianTampil {
  id: string;
  status: "Draf" | "Final";
  umpanBalik: string;
  komponen: Record<string, Keputusan>;
  terkirimKeBima: boolean;
}

/** Berkas proposal yang dapat diunduh dari J-08 (id = berkas_versi.id atau bima_berkas.id; rute fondasi api/semar/proposal). */
export interface BerkasTampil {
  id: string;
  nama: string;
  peran: "naskah" | "lampiran";
  /** nama lampiran wajib yang dipenuhi, bila ada */
  namaLampiran: string | null;
  ukuran: number;
}

export interface DataPemeriksaan {
  penugasanId: string;
  label: "Baru" | "Draf" | "Selesai";
  proposal: { idProposal: string; judul: string; skema: string; kodeVersi: string };
  tab: TabTeks[];
  butir: ButirTampil[];
  deterministik: { total: number; lolos: number; gagal: number };
  semantik: { siap: boolean; status: string };
  penilaian: PenilaianTampil;
  berkas: BerkasTampil[];
}

/** Bahan J-08b Keputusan Penilaian. */
export interface DataKeputusan {
  penugasanId: string;
  label: "Baru" | "Draf" | "Selesai";
  proposal: { idProposal: string; judul: string; skema: string; kodeVersi: string };
  penilaian: PenilaianTampil;
  /** butir semantik apa adanya (status + sudah dikoreksi atau belum), untuk ringkasan */
  butir: { status: StatusHasilSemantik; dikoreksi: boolean }[];
  deterministik: { total: number; lolos: number; gagal: number };
}

export type HasilAksi<T = object> = ({ ok: true } & T) | { ok: false; galat: string; kolom?: Record<string, string> };
