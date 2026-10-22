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
