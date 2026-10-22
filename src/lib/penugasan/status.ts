/**
 * Mesin keadaan PenugasanReviewer (UC-03): Diusulkan -> Ditetapkan -> Selesai. Murni, tanpa basis data.
 * Hanya transisi yang didefinisikan yang diizinkan; keadaan akhir (Selesai) tidak punya transisi keluar.
 */
export type StatusPenugasan = "Diusulkan" | "Ditetapkan" | "Selesai";

export const URUTAN_STATUS_PENUGASAN: readonly StatusPenugasan[] = ["Diusulkan", "Ditetapkan", "Selesai"];

const TRANSISI: Record<StatusPenugasan, readonly StatusPenugasan[]> = {
  Diusulkan: ["Ditetapkan"],
  Ditetapkan: ["Selesai"],
  Selesai: [],
};

export function bolehTransisiPenugasan(dari: StatusPenugasan, ke: StatusPenugasan): boolean {
  return TRANSISI[dari]?.includes(ke) ?? false;
}

/** Mengembalikan keadaan baru atau melempar galat bila transisi tidak didefinisikan. */
export function transisiPenugasan(dari: StatusPenugasan, ke: StatusPenugasan): StatusPenugasan {
  if (!bolehTransisiPenugasan(dari, ke)) throw new Error(`Transisi penugasan ${dari} -> ${ke} tidak diizinkan.`);
  return ke;
}

/** S-2: hanya usulan (belum ditetapkan) yang boleh dipindahkan ke reviewer lain. */
export function bolehDipindahkan(status: StatusPenugasan): boolean {
  return status === "Diusulkan";
}
