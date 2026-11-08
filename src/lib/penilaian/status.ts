/**
 * Aturan keadaan penilaian dan ringkasan tampilan (murni, tanpa basis data; aman diimpor komponen klien).
 * State machine penilaian: Draf -> Final; Final tidak dapat diubah lagi (UC-07 langkah 12, NFR 3.x).
 */
import { KOMPONEN_BORANG, type Keputusan, type StatusHasilSemantik } from "@/lib/kontrak/tipe";

export type StatusPenilaian = "Draf" | "Final";
export type LabelPenugasan = "Baru" | "Draf" | "Selesai";

/** Transisi yang didefinisikan: Draf tetap Draf (Simpan Sementara) atau menjadi Final (Simpan Permanen); Final tidak ke mana-mana. */
export const TRANSISI_PENILAIAN: Record<StatusPenilaian, readonly StatusPenilaian[]> = {
  Draf: ["Draf", "Final"],
  Final: [],
};

export function bolehTransisiPenilaian(dari: StatusPenilaian, ke: StatusPenilaian): boolean {
  return TRANSISI_PENILAIAN[dari]?.includes(ke) ?? false;
}

/** Isian (komponen, umpan balik, koreksi) hanya dapat diubah selama penilaian masih Draf. */
export function bolehUbahPenilaian(status: StatusPenilaian): boolean {
  return status === "Draf";
}

/** Butir yang harus dibaca sendiri oleh reviewer (UC-09 S-1 dan S-2). */
export function perluBacaSendiri(status: StatusHasilSemantik): boolean {
  return status === "Perlu diperiksa manual" || status === "Belum ada rekomendasi";
}

export interface RingkasanRekomendasi {
  total: number;
  /** rekomendasi yang tidak dikoreksi: dianggap disetujui saat Simpan Permanen */
  disetujui: number;
  dikoreksi: number;
  /** butir tanpa rekomendasi yang dapat disetujui (perlu dibaca sendiri) dan belum dikoreksi */
  tanpaRekomendasi: number;
}

export function ringkasRekomendasi(butir: { status: StatusHasilSemantik; dikoreksi: boolean }[]): RingkasanRekomendasi {
  let disetujui = 0;
  let dikoreksi = 0;
  let tanpaRekomendasi = 0;
  for (const b of butir) {
    if (b.dikoreksi) dikoreksi++;
    else if (perluBacaSendiri(b.status)) tanpaRekomendasi++;
    else disetujui++;
  }
  return { total: butir.length, disetujui, dikoreksi, tanpaRekomendasi };
}

export interface RingkasanKeputusan {
  memenuhi: number;
  tidakMemenuhi: number;
  /** nama komponen yang belum diputuskan, urut menurut borang */
  kosong: string[];
  lengkap: boolean;
}

/** Ringkasan keputusan enam komponen borang untuk M-11 dan penanda komponen kosong di J-08b. */
export function ringkasKeputusan(komponen: Record<string, Keputusan | string | undefined>): RingkasanKeputusan {
  let memenuhi = 0;
  let tidakMemenuhi = 0;
  const kosong: string[] = [];
  for (const k of KOMPONEN_BORANG) {
    const v = komponen[k];
    if (v === "Memenuhi") memenuhi++;
    else if (v === "Tidak memenuhi") tidakMemenuhi++;
    else kosong.push(k);
  }
  return { memenuhi, tidakMemenuhi, kosong, lengkap: kosong.length === 0 };
}

/** Keterangan satu baris J-07: jumlah penugasan dan rinciannya per label. */
export function ringkasLabelPenugasan(labels: LabelPenugasan[]): string {
  if (labels.length === 0) return "Belum ada penugasan";
  const urut: LabelPenugasan[] = ["Baru", "Draf", "Selesai"];
  const rinci = urut
    .map((l) => ({ l, n: labels.filter((x) => x === l).length }))
    .filter((x) => x.n > 0)
    .map((x) => `${x.n} ${x.l}`);
  return `${labels.length} penugasan: ${rinci.join(", ")}`;
}

export type StatusSemantikJob = "Menunggu" | "Berjalan" | "Selesai" | "Gagal" | "Belum ada";

export interface MasukanJalankanUlang {
  /** reviewer yang masuk adalah reviewer penugasan ini */
  ditugaskan: boolean;
  /** penilaian sudah Final */
  final: boolean;
  /** status job semantik terbaru untuk versi yang dinilai */
  status: StatusSemantikJob;
  /** job Menunggu/Berjalan yang lebih lama dari batas macet */
  macet: boolean;
  /** sudah ada baris hasil_pemeriksaan semantik untuk versi ini */
  adaHasil: boolean;
}

export type KeputusanJalankanUlang =
  | { boleh: true; tindakan: "job-baru" | "pakai-job-ada" }
  | { boleh: false; pesan: string };

export const PESAN_ULANG_BUKAN_PENUGASAN = "Hanya reviewer yang ditugaskan pada proposal ini yang dapat menjalankan ulang pemeriksaan semantik.";
export const PESAN_ULANG_FINAL = "Penilaian sudah final, pemeriksaan semantik tidak dapat dijalankan ulang.";
export const PESAN_ULANG_ADA_HASIL = "Hasil pemeriksaan semantik sudah tersedia. Muat ulang halaman untuk melihatnya.";
export const PESAN_ULANG_SEDANG_BERJALAN = "Pemeriksaan semantik masih berjalan. Tunggu beberapa saat, lalu coba lagi bila belum selesai.";
export const PESAN_ULANG_TIDAK_PERLU = "Pemeriksaan semantik tidak memerlukan jalan ulang.";

/**
 * UC-07/UC-09 (tambahan prototipe): kapan reviewer boleh menjalankan ulang pemeriksaan semantik di J-08.
 * Boleh bila ditugaskan, penilaian belum final, belum ada hasil, dan job Gagal (buat job baru) atau Menunggu/Berjalan yang macet (pakai job yang ada).
 */
export function putuskanJalankanUlangSemantik(m: MasukanJalankanUlang): KeputusanJalankanUlang {
  if (!m.ditugaskan) return { boleh: false, pesan: PESAN_ULANG_BUKAN_PENUGASAN };
  if (m.final) return { boleh: false, pesan: PESAN_ULANG_FINAL };
  if (m.adaHasil) return { boleh: false, pesan: PESAN_ULANG_ADA_HASIL };
  if (m.status === "Gagal") return { boleh: true, tindakan: "job-baru" };
  if (m.status === "Menunggu" || m.status === "Berjalan") {
    return m.macet ? { boleh: true, tindakan: "pakai-job-ada" } : { boleh: false, pesan: PESAN_ULANG_SEDANG_BERJALAN };
  }
  return { boleh: false, pesan: PESAN_ULANG_TIDAK_PERLU };
}
