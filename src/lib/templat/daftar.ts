/**
 * Logika murni untuk J-02 Daftar Templat dan J-02a Rincian Templat (docs/arah-uc01-ui-2026-10-24.md):
 * status tampil (Aktif/Draf/Arsip), penyaring daftar (tahun, skema, status), pilihan tab, dan pemilihan templat
 * tujuan pengalihan /tim-kerja/aturan. Tanpa basis data supaya dapat diuji tanpa stub.
 * Sumber uji: CRC TemplatProposal, Contract C-02, behavioral state machine templat (Dennis dkk., 2015, hlm. 473).
 */
import type { StatusTemplat } from "./status";

export type StatusTampil = "Aktif" | "Draf" | "Arsip";
export type FilterStatus = StatusTampil | "Semua";

export const FILTER_STATUS: readonly FilterStatus[] = ["Semua", "Aktif", "Draf", "Arsip"];

/** Terbit pada basis data = Aktif di layar: templat yang berlaku untuk periodenya. */
export function statusTampil(status: StatusTemplat): StatusTampil {
  return status === "Terbit" ? "Aktif" : status;
}

export interface BarisDaftar {
  id: string;
  skemaId: string;
  namaSkema: string;
  versi: number;
  status: StatusTemplat;
  /** tahun periode berlaku; null bila belum ditetapkan */
  tahun: number | null;
  periodeId: string | null;
  periodeNama: string | null;
  jumlahBagian: number;
  jumlahDeterministik: number;
  jumlahSemantik: number;
  /** waktu terbit; draf memakai waktu dibuat */
  diperbarui: string | null;
}

export interface PenyaringDaftar {
  /** null = semua tahun */
  tahun: number | null;
  /** null = semua skema */
  skema: string | null;
  status: FilterStatus;
}

type Mentah = string | string[] | undefined;
const satu = (v: Mentah): string | undefined => (Array.isArray(v) ? v[0] : v);

/** Membaca ?tahun=&skema=&status= dari URL; nilai asing atau kosong menjadi "semua". */
export function bacaPenyaring(p: { tahun?: Mentah; skema?: Mentah; status?: Mentah }): PenyaringDaftar {
  const t = Number.parseInt(satu(p.tahun) ?? "", 10);
  const s = satu(p.status);
  return {
    tahun: Number.isInteger(t) && t > 0 ? t : null,
    skema: satu(p.skema)?.trim() || null,
    status: FILTER_STATUS.find((x) => x === s) ?? "Semua",
  };
}

/** Penyaring aktif untuk menampilkan keadaan kosong yang berbeda ("Belum ada templat untuk tahun ini"). */
export const adaPenyaring = (p: PenyaringDaftar): boolean => p.tahun !== null || p.skema !== null || p.status !== "Semua";

export function saringDaftar(baris: BarisDaftar[], p: PenyaringDaftar): BarisDaftar[] {
  return baris.filter(
    (b) => (p.tahun === null || b.tahun === p.tahun) && (p.skema === null || b.skemaId === p.skema) && (p.status === "Semua" || statusTampil(b.status) === p.status),
  );
}

const URUT_STATUS: Record<StatusTemplat, number> = { Draf: 0, Terbit: 1, Arsip: 2 };

/** Draf paling atas (perlu tindakan), lalu Aktif, lalu Arsip; dalam kelompok: skema, versi terbaru dulu. */
export function urutkanDaftar(baris: BarisDaftar[]): BarisDaftar[] {
  return [...baris].sort((a, b) => URUT_STATUS[a.status] - URUT_STATUS[b.status] || a.namaSkema.localeCompare(b.namaSkema) || b.versi - a.versi);
}

/** Tahun yang tersedia untuk penyaring: dari periode berlaku, terbaru dulu, tanpa duplikat. */
export function daftarTahun(baris: Pick<BarisDaftar, "tahun">[]): number[] {
  return [...new Set(baris.map((b) => b.tahun).filter((t): t is number => t !== null))].sort((a, b) => b - a);
}

/** Kueri URL daftar untuk satu penyaring; nilai "semua" tidak ditulis supaya URL tetap pendek. */
export function kueriPenyaring(p: PenyaringDaftar): string {
  const q = new URLSearchParams();
  if (p.tahun !== null) q.set("tahun", String(p.tahun));
  if (p.skema) q.set("skema", p.skema);
  if (p.status !== "Semua") q.set("status", p.status);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ----------------------------- tab J-02a ----------------------------- */

export type TabTemplat = "bagian" | "aturan" | "lampiran" | "depan";
export const TAB_TEMPLAT: readonly { nilai: TabTemplat; label: string }[] = [
  { nilai: "bagian", label: "Bagian" },
  { nilai: "aturan", label: "Aturan Pemeriksaan" },
  { nilai: "lampiran", label: "Lampiran" },
  { nilai: "depan", label: "Halaman Depan" },
];

export function bacaTab(v: Mentah): TabTemplat {
  const s = satu(v);
  return TAB_TEMPLAT.find((t) => t.nilai === s)?.nilai ?? "bagian";
}

/** Hanya Draf yang dapat disunting; Aktif dan Arsip lewat versi baru (aturan real use case). */
export const dapatDisunting = (status: StatusTemplat): boolean => status === "Draf";

/** "Susun Versi Baru" hanya untuk versi aktif yang terbaru dan hanya bila skema belum punya draf. */
export function dapatSusunVersiBaru(status: StatusTemplat, adaDraf: boolean): boolean {
  return status === "Terbit" && !adaDraf;
}

/* ----------------------------- pengalihan /tim-kerja/aturan ----------------------------- */

export interface VersiRingkas {
  id: string;
  versi: number;
  status: StatusTemplat;
  periodeId: string | null;
}

/**
 * Templat tujuan untuk tab Aturan Pemeriksaan: templat Aktif untuk periode itu; bila tidak ada, templat Aktif terbaru;
 * bila skema belum punya templat Aktif, versi terbaru apa pun (draf pertama). null bila skema tanpa templat.
 */
export function pilihTemplatAturan(versi: VersiRingkas[], periodeId: string | null): VersiRingkas | null {
  const terbaru = (xs: VersiRingkas[]) => [...xs].sort((a, b) => b.versi - a.versi)[0] ?? null;
  const aktif = versi.filter((v) => v.status === "Terbit");
  return (periodeId ? terbaru(aktif.filter((v) => v.periodeId === periodeId)) : null) ?? terbaru(aktif) ?? terbaru(versi);
}

/** URL tab Aturan Pemeriksaan suatu templat, dengan periode dan butir yang disorot (boleh beberapa kode dipisah koma). */
export function urlTabAturan(templatId: string, o: { periodeId?: string | null; sorot?: string | null } = {}): string {
  const q = new URLSearchParams({ tab: "aturan" });
  if (o.periodeId) q.set("periode", o.periodeId);
  if (o.sorot) q.set("sorot", o.sorot);
  return `/tim-kerja/templat/${templatId}?${q.toString()}`;
}

/** Murni: masa pengusulan berjalan hanya berlaku bagi periode yang sedang berjalan; periode lain (mis. 2027) tidak terpengaruh (9a UC-01, 8a UC-02). */
export const masaBerjalanUntuk = (sakelarBerjalan: boolean, periodeId: string | null, periodeBerjalanId: string | null): boolean =>
  sakelarBerjalan && periodeId !== null && periodeId === periodeBerjalanId;
