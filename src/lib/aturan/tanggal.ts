/** validasiTanggalBerlaku() UC-02 langkah 7 dan alur 8a. Murni, tanpa basis data. */

export const PESAN_TANGGAL_DI_TENGAH_MASA =
  "Tanggal berlaku tidak boleh jatuh di antara tanggal buka dan tanggal tutup masa pengusulan, karena proposal dalam satu periode harus dinilai dengan aturan yang sama.";

const WIB_MS = 7 * 3_600_000;

/** Tanggal kalender (yyyy-mm-dd) menurut WIB. */
export function hariWib(d: Date): string {
  return new Date(d.getTime() + WIB_MS).toISOString().slice(0, 10);
}

export function uraiTanggalIsian(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type HasilValidasiTanggal = { ok: true; tanggal: Date } | { ok: false; pesan: string };

/**
 * @param masaBerjalan hasil masaPengusulanBerjalan() (sakelar demo). Bila masa pengusulan tidak berjalan,
 * tanggal apa pun boleh; bila berjalan, tanggal tidak boleh jatuh pada rentang buka sampai tutup periode.
 * @param tanggalVersiSebelumnya tanggal berlaku versi sebelumnya (bila ada): versi baru harus lebih akhir.
 */
export function validasiTanggalBerlaku(
  isian: string,
  periode: { tanggalBuka: Date; tanggalTutup: Date },
  masaBerjalan: boolean,
  tanggalVersiSebelumnya?: Date | null,
): HasilValidasiTanggal {
  const tanggal = uraiTanggalIsian(isian.trim());
  if (!tanggal) return { ok: false, pesan: "Tanggal Berlaku wajib diisi dengan tanggal yang valid." };
  const hari = hariWib(tanggal);
  if (masaBerjalan && hari >= hariWib(periode.tanggalBuka) && hari <= hariWib(periode.tanggalTutup)) {
    return { ok: false, pesan: PESAN_TANGGAL_DI_TENGAH_MASA };
  }
  if (tanggalVersiSebelumnya && hari <= hariWib(tanggalVersiSebelumnya)) {
    return { ok: false, pesan: "Tanggal Berlaku harus lebih akhir daripada tanggal berlaku versi sebelumnya." };
  }
  return { ok: true, tanggal };
}
