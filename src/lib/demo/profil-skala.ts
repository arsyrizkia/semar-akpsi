/**
 * Profil data demo berskala (murni, tanpa impor server; dipakai pembangkit demo/skala.ts, layanan penugasan, dan daftar Masuk cepat).
 * Hanya ada dua periode: Seleksi Pendanaan 2026 (masa pengusulan sudah ditutup, berisi 1.200 proposal profil ini ditambah proposal
 * contoh PRP-2026-0004 untuk reviewer-2) dan Seleksi Pendanaan 2027 (masa pengusulan berjalan, alur end-to-end). Skala seleksi
 * sebenarnya jauh lebih besar (naskah: 79.210 usulan 2026, 1.066-1.244 reviewer); 1.200 cukup untuk memperagakan UC-03 dan UC-04.
 *  - contoh1200 : 1.200 proposal (PD dan PT) dari 14 institusi yang timpang, 28 reviewer rvw-c12-* (3 tidak bersedia) ditambah
 *                 reviewer-1..5 yang dapat masuk (30 bersedia), supaya hasil penetapan terlihat di J-07 reviewer contoh.
 * Data profil dikenali dari awalan id (C12-2026-, rvw-c12-, pgs-c12-), jadi operasi massal tidak menyentuh proposal lain di periode yang sama.
 */
/** Awalan nama periode simulasi lama (sebelum 26 Okt 2026); pembaca periode tetap mengecualikannya bila masih ada di basis data. */
export const NAMA_PERIODE_SKALA = "Simulasi ";

/** Nama periode yang sudah ditutup (2026) dan periode berjalan (2027). */
export const NAMA_PERIODE_2026 = "Seleksi Pendanaan 2026";
export const NAMA_PERIODE_2027 = "Seleksi Pendanaan 2027";

export type KunciProfil = "contoh1200";

export interface ProfilSkala {
  kunci: KunciProfil;
  namaPeriode: string;
  awalanIdProposal: string;
  awalanReviewer: string;
  awalanPengusul: string;
  jumlahProposal: number;
  /** reviewer yang dibangkitkan (rvw-*); reviewer contoh yang ikut dibagi ada di `reviewerContoh` */
  jumlahReviewer: number;
  jumlahPengusul: number;
  jumlahInstitusi: number;
  /** reviewer dibangkitkan ke-n (mulai 1) yang tidak bersedia */
  tidakBersedia: (n: number) => boolean;
  /** akun reviewer contoh (dapat masuk) yang ikut dalam kumpulan periode ini */
  reviewerContoh: string[];
  batasBawaan: number;
  /** bobot proposal per institusi (timpang); kosong = rata menurut rumus lama */
  bobotInstitusi: number[];
  /** bagian proposal skema PT (sisanya PD) */
  porsiTerapan: number;
}

export const PROFIL: Record<KunciProfil, ProfilSkala> = {
  contoh1200: {
    kunci: "contoh1200",
    namaPeriode: NAMA_PERIODE_2026,
    awalanIdProposal: "C12-2026-",
    awalanReviewer: "rvw-c12-",
    awalanPengusul: "pgs-c12-",
    jumlahProposal: 1200,
    jumlahReviewer: 28,
    jumlahPengusul: 600,
    jumlahInstitusi: 14,
    tidakBersedia: (n) => n > 25,
    // reviewer-6 tidak bersedia di data seed; kesediaan akun contoh tidak diubah oleh profil (berlaku global, lintas periode)
    reviewerContoh: ["reviewer-1", "reviewer-2", "reviewer-3", "reviewer-4", "reviewer-5"],
    batasBawaan: 45,
    // jumlah = 1.200: satu universitas besar, beberapa sedang, sisanya kecil
    bobotInstitusi: [220, 160, 130, 110, 100, 90, 80, 70, 60, 50, 40, 35, 25, 30],
    porsiTerapan: 500 / 1200,
  },
};

/** Profil periode menurut namanya; null untuk periode biasa. */
export function profilPeriode(namaPeriode: string): ProfilSkala | null {
  return Object.values(PROFIL).find((p) => p.namaPeriode === namaPeriode) ?? null;
}

// rvw-skala-* (uji beban 10.000 lama) tetap dianggap massal bila datanya masih tersisa sebelum Reset
const AWALAN_MASSAL = [...Object.values(PROFIL).map((p) => p.awalanReviewer), "rvw-skala-"];

/** Reviewer massal (rvw-c12-*): tidak ditampilkan sebagai pilihan Masuk cepat. */
export const reviewerMassal = (idBima: string) => AWALAN_MASSAL.some((a) => idBima.startsWith(a));

/**
 * Kumpulan reviewer yang boleh dibagi pada satu periode: periode berprofil memakai reviewer massalnya sendiri (ditambah reviewer
 * contoh profil itu), periode biasa tidak pernah memakai reviewer massal.
 */
export function dalamKumpulanPeriode(namaPeriode: string, idBima: string): boolean {
  const p = profilPeriode(namaPeriode);
  if (!p) return !reviewerMassal(idBima);
  return idBima.startsWith(p.awalanReviewer) || p.reviewerContoh.includes(idBima);
}
