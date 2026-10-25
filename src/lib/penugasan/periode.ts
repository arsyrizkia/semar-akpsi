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

/* ------------------------------ J-04b: tab, filter, ringkasan beban ------------------------------ */

export type TabUsulan = "usulan" | "sebaran" | "ditetapkan";
export type UrutUsulan = "id" | "judul" | "reviewer" | "institusi";

/** Filter tabel Usulan Penugasan dan Sudah Ditetapkan (dibaca dari URL, sehingga Back dan tautan mempertahankannya). */
export interface FilterUsulan {
  /** cari judul, ID proposal, atau nama pengusul */
  q: string;
  /** id reviewer (akun) */
  rev: string | null;
  /** institusi pengusul persis */
  inst: string | null;
  /** kode skema */
  skema: string | null;
  /** hanya baris yang melanggar syarat penugasan */
  melanggar: boolean;
  urut: UrutUsulan;
}

export const UKURAN_PER_HALAMAN = [25, 50, 100] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const satu = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Tab J-04b dari URL; nilai lain menjadi "usulan". */
export function bacaTabUsulan(v: string | string[] | undefined): TabUsulan {
  const s = satu(v);
  return s === "sebaran" || s === "ditetapkan" ? s : "usulan";
}

/** Filter dari URL: teks dipangkas (maks 100 huruf), id reviewer harus uuid, urut di luar daftar menjadi "id". */
export function bacaFilterUsulan(sp: Record<string, string | string[] | undefined>): FilterUsulan {
  const rev = satu(sp.rev);
  const urut = satu(sp.urut);
  const teks = (v: string) => v.trim().slice(0, 100) || null;
  return {
    q: satu(sp.q).trim().slice(0, 100),
    rev: UUID.test(rev) ? rev : null,
    inst: teks(satu(sp.inst)),
    skema: teks(satu(sp.skema)),
    melanggar: satu(sp.syarat) === "melanggar",
    urut: urut === "judul" || urut === "reviewer" || urut === "institusi" ? urut : "id",
  };
}

/** Ukuran halaman dari URL: hanya 25, 50, atau 100 (bawaan 50). */
export function ukuranDariUrl(v: string | string[] | undefined): number {
  const n = Number.parseInt(satu(v), 10);
  return (UKURAN_PER_HALAMAN as readonly number[]).includes(n) ? n : 50;
}

/** Filter aktif selain urutan (untuk tombol "Hapus filter" dan pesan hasil kosong). */
export const adaFilter = (f: FilterUsulan) => Boolean(f.q || f.rev || f.inst || f.skema || f.melanggar);

export interface RingkasanBeban {
  jumlahReviewer: number;
  min: number;
  median: number;
  maks: number;
  /** reviewer yang bebannya melampaui batas */
  melampaui: number;
  /** histogram: rentang beban [dari, sampai] inklusif dan jumlah reviewer */
  kelompok: { dari: number; sampai: number; jumlah: number }[];
}

/**
 * Ringkasan sebaran beban untuk J-04b: min, median, maks, dan histogram berlebar sama (paling banyak 8 kelompok) dari 0 sampai
 * max(batas, beban tertinggi), supaya posisi batas selalu terlihat.
 */
export function ringkasBeban(beban: number[], batas: number): RingkasanBeban {
  const urut = [...beban].sort((a, b) => a - b);
  const n = urut.length;
  if (n === 0) return { jumlahReviewer: 0, min: 0, median: 0, maks: 0, melampaui: 0, kelompok: [] };
  const median = n % 2 ? urut[(n - 1) / 2] : (urut[n / 2 - 1] + urut[n / 2]) / 2;
  const atas = Math.max(batas, urut[n - 1], 1);
  const lebar = Math.max(1, Math.ceil((atas + 1) / 8));
  const kelompok: RingkasanBeban["kelompok"] = [];
  for (let dari = 0; dari <= atas; dari += lebar) kelompok.push({ dari, sampai: Math.min(atas, dari + lebar - 1), jumlah: 0 });
  for (const b of urut) kelompok[Math.min(kelompok.length - 1, Math.floor(b / lebar))].jumlah++;
  return { jumlahReviewer: n, min: urut[0], median, maks: urut[n - 1], melampaui: urut.filter((b) => b > batas).length, kelompok };
}
