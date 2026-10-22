/**
 * Transisi status butir yang dipicu UC-04 (tandaiPerluDitinjau): hanya butir Aktif yang menjadi "Perlu ditinjau".
 * Murni, tanpa basis data. Keadaan lain milik UC-02 (Draf -> Aktif -> Perlu ditinjau -> Nonaktif).
 */
export type StatusButir = "Draf" | "Aktif" | "Perlu ditinjau" | "Nonaktif";

export function bolehDitandai(status: StatusButir): boolean {
  return status === "Aktif";
}

/** tandaiPerluDitinjau(): Aktif -> "Perlu ditinjau". Status lain tidak berubah (dikembalikan apa adanya). */
export function tandaiPerluDitinjau(status: StatusButir): StatusButir {
  return bolehDitandai(status) ? "Perlu ditinjau" : status;
}

export interface BarisButirTanda {
  id: string;
  kode: string;
  status: StatusButir;
}

/** Memilah kode yang dicentang: butir Aktif yang akan ditandai, sisanya dilewati beserta alasannya. Kode ganda dihitung sekali. */
export function pilahButirDitandai(
  butir: BarisButirTanda[],
  kodeDipilih: string[],
): { target: BarisButirTanda[]; dilewati: { kode: string; alasan: string }[] } {
  const peta = new Map(butir.map((b) => [b.kode, b]));
  const target: BarisButirTanda[] = [];
  const dilewati: { kode: string; alasan: string }[] = [];
  for (const kode of new Set(kodeDipilih)) {
    const b = peta.get(kode);
    if (!b) dilewati.push({ kode, alasan: "Butir tidak ada pada basis aturan berlaku." });
    else if (!bolehDitandai(b.status)) dilewati.push({ kode, alasan: `Butir berstatus ${b.status}; hanya butir Aktif yang dapat ditandai.` });
    else target.push(b);
  }
  return { target, dilewati };
}
