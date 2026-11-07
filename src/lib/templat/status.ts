/**
 * State machine TemplatProposal (Draf, Terbit, Arsip) dan keputusan "Terbitkan" (UC-01 langkah 7 sampai 10, S-2, 9a).
 * Murni, tanpa basis data, sehingga dapat diuji tanpa stub dan dipakai server maupun peramban.
 * Sumber uji: CRC TemplatProposal, Contract C-02 dan C-04, behavioral state machine templat (Dennis dkk., 2015, hlm. 473).
 */

export type StatusTemplat = "Draf" | "Terbit" | "Arsip";
export type AksiTemplat = "terbitkan" | "arsipkan";

export const STATUS_TEMPLAT: readonly StatusTemplat[] = ["Draf", "Terbit", "Arsip"];

/** Transisi yang didefinisikan: terbitkan (Draf menjadi Terbit) dan arsipkan (Terbit menjadi Arsip). Selain itu tidak ada. */
const TRANSISI: Record<AksiTemplat, { dari: StatusTemplat; ke: StatusTemplat }> = {
  terbitkan: { dari: "Draf", ke: "Terbit" },
  arsipkan: { dari: "Terbit", ke: "Arsip" },
};

export type HasilTransisiTemplat = { ok: true; ke: StatusTemplat } | { ok: false; pesan: string };

export function transisiTemplat(dari: StatusTemplat, aksi: AksiTemplat): HasilTransisiTemplat {
  const t = TRANSISI[aksi];
  if (!t || t.dari !== dari) return { ok: false, pesan: `Templat berstatus ${dari} tidak dapat menjalani aksi ${aksi}.` };
  return { ok: true, ke: t.ke };
}

/** Hanya templat berstatus Draf yang isiannya boleh diubah dan dibuka di J-02b; Terbit dan Arsip hanya-baca di J-02. */
export const dapatDisusun = (status: StatusTemplat): boolean => status === "Draf";

export const PESAN_DRAF_9A = "Masa pengusulan skema ini sedang berjalan. Templat disimpan sebagai draf untuk periode berikutnya.";
export const PESAN_LENGKAPI = "Lengkapi isian yang ditandai";

export type KeputusanTerbit = "tidak-lengkap" | "draf-disimpan" | "terbit";

/**
 * Cabang keputusan "Terbitkan": isian tidak lengkap menghasilkan S-2, masa pengusulan berjalan menghasilkan 9a (tetap Draf),
 * selain itu terbit. Pemeriksaan kelengkapan selalu mendahului pemeriksaan masa (urutan langkah 7 lalu 8).
 */
export function putuskanTerbitkan(p: { lengkap: boolean; masaBerjalan: boolean }): KeputusanTerbit {
  if (!p.lengkap) return "tidak-lengkap";
  if (p.masaBerjalan) return "draf-disimpan";
  return "terbit";
}

export const PESAN_HAPUS_BUKAN_PENGELOLA = "Hanya akun dengan hak pengelola yang dapat menghapus draf templat.";
export const PESAN_HAPUS_TIDAK_ADA = "Templat tidak ditemukan atau sudah dihapus. Muat ulang halaman.";

export const PESAN_HAPUS_BERUBAH = "Draf sudah tidak berstatus Draf (mungkin baru diterbitkan). Muat ulang halaman.";

export type KeputusanHapusDraf = { ok: true } | { ok: false; alasan: "bukan-pengelola" | "tidak-ada" | "bukan-draf"; pesan: string };

/**
 * Keputusan "Hapus Draf" (UC-01, tambahan prototipe): hanya pengelola, hanya templat yang ada, hanya berstatus Draf.
 * Terbit (Aktif) dan Arsip tidak pernah dihapus; Arsip terjadi otomatis saat versi baru terbit. Hak diperiksa lebih dulu,
 * lalu keberadaan, lalu status (tidak membocorkan status templat kepada yang bukan pengelola).
 */
export function putuskanHapusDraf(p: { pengelola: boolean; status: StatusTemplat | null }): KeputusanHapusDraf {
  if (!p.pengelola) return { ok: false, alasan: "bukan-pengelola", pesan: PESAN_HAPUS_BUKAN_PENGELOLA };
  if (p.status === null) return { ok: false, alasan: "tidak-ada", pesan: PESAN_HAPUS_TIDAK_ADA };
  if (p.status !== "Draf") {
    return { ok: false, alasan: "bukan-draf", pesan: `Hanya templat berstatus Draf yang dapat dihapus. Templat ini berstatus ${p.status === "Terbit" ? "Aktif" : p.status}.` };
  }
  return { ok: true };
}
