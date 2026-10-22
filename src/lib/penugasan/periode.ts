/**
 * Aturan murni J-04 (UC-03 langkah 1): kapan periode masuk daftar penugasan dan bagaimana status penetapannya diringkas.
 */

/** Periode masuk daftar J-04 bila sakelar masa pengusulan "ditutup" dan tanggal tutupnya sudah lewat menurut jam demo. */
export function periodeDitutup(p: { tanggalTutup: Date; sekarang: Date; masaBerjalan: boolean }): boolean {
  return !p.masaBerjalan && p.tanggalTutup.getTime() <= p.sekarang.getTime();
}

export type StatusPenetapan = "Tidak ada proposal" | "Belum disusun" | "Usulan menunggu penetapan" | "Sebagian ditetapkan" | "Seluruhnya ditetapkan";

export interface HitungPeriode {
  /** proposal berstatus Terkirim pada periode */
  terkirim: number;
  /** Terkirim yang belum punya penugasan Ditetapkan/Selesai */
  belumDitugaskan: number;
  diusulkan: number;
  ditetapkan: number;
}

export function ringkasStatusPenetapan(h: HitungPeriode): StatusPenetapan {
  if (h.terkirim === 0) return "Tidak ada proposal";
  if (h.belumDitugaskan === 0) return "Seluruhnya ditetapkan";
  if (h.diusulkan > 0) return "Usulan menunggu penetapan";
  if (h.ditetapkan > 0) return "Sebagian ditetapkan";
  return "Belum disusun";
}

/** Jumlah halaman tabel (minimal 1). */
export function jumlahHalaman(total: number, ukuran: number): number {
  if (!Number.isFinite(total) || total <= 0 || ukuran <= 0) return 1;
  return Math.ceil(total / ukuran);
}

/** Nomor halaman dari URL: bilangan bulat >= 1, nilai lain = 1, dijepit ke jumlah halaman. */
export function halamanDariUrl(nilai: string | string[] | undefined, maks: number): number {
  const mentah = Array.isArray(nilai) ? nilai[0] : nilai;
  const n = Number.parseInt(mentah ?? "1", 10);
  const sah = Number.isFinite(n) && n > 0 ? n : 1;
  return Math.min(sah, Math.max(1, maks));
}
