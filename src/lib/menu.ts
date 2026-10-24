/**
 * Menu sidebar per peran (docs/arah-perbaikan-2026-10-22.md, NFR 5.1). Murni, tanpa basis data.
 * - Tim Kerja pengelola: Templat Proposal (J-02 daftar, J-02a rincian; J-03 Aturan Pemeriksaan hanya tab di rincian, tanpa menu sendiri), Penugasan Reviewer, Pemantauan Kesesuaian.
 * - Tim Kerja non-pengelola: Penugasan Reviewer, Pemantauan Kesesuaian.
 * - Reviewer: Daftar Penugasan.
 * - Pengusul: tanpa menu.
 */
export interface ItemMenu {
  href: string;
  kode: string;
  nama: string;
  /** awalan jalur yang menandai item ini aktif */
  awalan: string;
  /** awalan jalur tambahan yang juga menandai item ini aktif (mis. J-03b di bawah Templat & Aturan) */
  awalanLain?: string[];
}

export interface PeranMenu {
  peran: "tim_kerja" | "reviewer" | "pengusul";
  pengelola: boolean;
}

const TIM_KERJA: (ItemMenu & { hanyaPengelola: boolean })[] = [
  { href: "/tim-kerja/templat", kode: "J-02", nama: "Templat Proposal", awalan: "/tim-kerja/templat", awalanLain: ["/tim-kerja/aturan"], hanyaPengelola: true },
  { href: "/tim-kerja/penugasan", kode: "J-04", nama: "Penugasan Reviewer", awalan: "/tim-kerja/penugasan", hanyaPengelola: false },
  { href: "/tim-kerja/pemantauan", kode: "J-05", nama: "Pemantauan Kesesuaian", awalan: "/tim-kerja/pemantauan", hanyaPengelola: false },
];

const REVIEWER: ItemMenu[] = [{ href: "/reviewer/penugasan", kode: "J-07", nama: "Daftar Penugasan", awalan: "/reviewer" }];

export function menuUntukPeran({ peran, pengelola }: PeranMenu): ItemMenu[] {
  if (peran === "reviewer") return REVIEWER;
  if (peran === "tim_kerja") return TIM_KERJA.filter((m) => pengelola || !m.hanyaPengelola).map((m) => ({ href: m.href, kode: m.kode, nama: m.nama, awalan: m.awalan, awalanLain: m.awalanLain }));
  return [];
}

/** J-05b (rincian proposal) termasuk Pemantauan, J-04b termasuk Penugasan: item aktif ditentukan oleh awalan jalur. */
export function itemAktif(menu: ItemMenu[], jalur: string): ItemMenu | undefined {
  if (jalur.startsWith("/tim-kerja/proposal")) return menu.find((m) => m.awalan === "/tim-kerja/pemantauan");
  return menu.find((m) => [m.awalan, ...(m.awalanLain ?? [])].some((a) => jalur === a || jalur.startsWith(`${a}/`)));
}

export const NAMA_PERAN = { tim_kerja: "Tim Kerja DPPM", reviewer: "Reviewer", pengusul: "Pengusul" } as const;
