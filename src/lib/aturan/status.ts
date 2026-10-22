/**
 * State machine ButirCek (Draf, Aktif, Perlu ditinjau, Nonaktif) dan aturan penguncian butir turunan templat (UC-02 4a).
 * Murni, tanpa basis data. Sumber uji: CRC ButirCek, Contract C-06 dan C-07, behavioral state machine butir (Dennis dkk., 2015, hlm. 473).
 */
import type { StatusButir } from "@/lib/kontrak/tipe";

export type AksiButir = "simpanVersi" | "tandai" | "nonaktifkan";

export const STATUS_BUTIR: readonly StatusButir[] = ["Draf", "Aktif", "Perlu ditinjau", "Nonaktif"];

export const PESAN_TERKUNCI = "Nilai butir ini berasal dari templat dan hanya dapat diubah melalui jendela J-02 Templat Proposal";

/**
 * Transisi yang didefinisikan:
 * - simpanVersi: Draf dan Perlu ditinjau menjadi Aktif (UC-02 langkah 7; butir ditinjau ulang lalu disahkan);
 * - tandai: Aktif menjadi Perlu ditinjau (UC-04 langkah 7);
 * - nonaktifkan: Draf, Aktif, dan Perlu ditinjau menjadi Nonaktif (UC-02 langkah 4).
 * Nonaktif adalah keadaan akhir.
 */
const TRANSISI: Record<AksiButir, Partial<Record<StatusButir, StatusButir>>> = {
  simpanVersi: { Draf: "Aktif", "Perlu ditinjau": "Aktif" },
  tandai: { Aktif: "Perlu ditinjau" },
  nonaktifkan: { Draf: "Nonaktif", Aktif: "Nonaktif", "Perlu ditinjau": "Nonaktif" },
};

export type HasilTransisiButir = { ok: true; ke: StatusButir } | { ok: false; pesan: string };

export function transisiButir(dari: StatusButir, aksi: AksiButir): HasilTransisiButir {
  const ke = TRANSISI[aksi]?.[dari];
  if (!ke) return { ok: false, pesan: `Butir berstatus ${dari} tidak dapat menjalani aksi ${aksi}.` };
  return { ok: true, ke };
}

export type AsalButir = "templat" | "manual";

/** Butir turunan templat terkunci: tidak dapat diubah atau dinonaktifkan dari J-03 (4a). */
export const butirTerkunci = (asal: AsalButir): boolean => asal === "templat";
