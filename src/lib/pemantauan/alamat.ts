/** Alamat J-05 (murni; dipakai komponen server dan klien). Periode, skema, tab, urutan, dan butir M-08 tersimpan di URL. */

export type TabPemantauan = "semantik" | "deterministik" | "tren";
export const TAB_PEMANTAUAN: TabPemantauan[] = ["semantik", "deterministik", "tren"];

export function bacaTabPemantauan(v: string | string[] | undefined): TabPemantauan {
  const s = Array.isArray(v) ? v[0] : v;
  return TAB_PEMANTAUAN.includes(s as TabPemantauan) ? (s as TabPemantauan) : "semantik";
}

/** Urutan tabel Butir Semantik: kolom dan arah (awalan "-" = menurun). */
export type KolomUrut = "butir" | "disetujui" | "hasil" | "longgar";
export const URUT_BAWAAN = "disetujui";

export function bacaUrut(v: string | string[] | undefined): { kolom: KolomUrut; turun: boolean } {
  const s = (Array.isArray(v) ? v[0] : v) ?? URUT_BAWAAN;
  const turun = s.startsWith("-");
  const kolom = s.replace(/^-/, "") as KolomUrut;
  return ["butir", "disetujui", "hasil", "longgar"].includes(kolom) ? { kolom, turun } : { kolom: URUT_BAWAAN, turun: false };
}

/** Alamat J-05 dengan sebagian parameter diganti (null = dihapus). */
export function alamatPemantauan(sekarang: Record<string, string | undefined>, ubah: Record<string, string | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sekarang)) if (v) p.set(k, v);
  for (const [k, v] of Object.entries(ubah)) {
    if (v) p.set(k, v);
    else p.delete(k);
  }
  const q = p.toString();
  return q ? `/tim-kerja/pemantauan?${q}` : "/tim-kerja/pemantauan";
}
