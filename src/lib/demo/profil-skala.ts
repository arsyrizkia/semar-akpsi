/**
 * Profil data demo berskala besar untuk UC-03 (murni, tanpa impor server; dipakai pembangkit demo/skala.ts, layanan penugasan,
 * dan daftar Masuk cepat). Setiap profil punya periode sendiri yang namanya berawalan NAMA_PERIODE_SKALA ("Simulasi "), jadi
 * semua pembaca periode lain (J-02, J-05, pengajuan) mengecualikannya, dan kumpulan reviewernya sendiri. Keduanya simulasi, bukan
 * skala seleksi sebenarnya (naskah: 79.210 usulan 2026, 1.066-1.244 reviewer):
 *  - skala10k   : uji beban 10.000 proposal, 130 reviewer rvw-skala-* dari 40 institusi;
 *  - contoh1200 : 1.200 proposal (PD dan PT) dari 14 institusi yang timpang, 28 reviewer rvw-c12-* (3 tidak bersedia) ditambah
 *                 reviewer-1..5 yang dapat masuk (30 bersedia), supaya hasil penetapan terlihat di J-07 reviewer contoh.
 */
/** Awalan nama periode simulasi berskala besar; pembaca periode lain mengecualikannya (dipakai ulang oleh waktu.ts). */
export const NAMA_PERIODE_SKALA = "Simulasi ";

export type KunciProfil = "skala10k" | "contoh1200";

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
  skala10k: {
    kunci: "skala10k",
    namaPeriode: `${NAMA_PERIODE_SKALA}Uji Beban 2026 (10.000 proposal)`,
    awalanIdProposal: "SKL-2026-",
    awalanReviewer: "rvw-skala-",
    awalanPengusul: "pgs-skala-",
    jumlahProposal: 10_000,
    jumlahReviewer: 130,
    jumlahPengusul: 4000,
    jumlahInstitusi: 40,
    tidakBersedia: (n) => n % 11 === 0,
    reviewerContoh: [],
    batasBawaan: 100,
    bobotInstitusi: [],
    porsiTerapan: 0,
  },
  contoh1200: {
    kunci: "contoh1200",
    namaPeriode: `${NAMA_PERIODE_SKALA}Contoh 2026 (1.200 proposal)`,
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

/** Nama lama periode profil (sebelum 25 Okt 2026), diganti otomatis saat skenario disiapkan. */
export const NAMA_LAMA: Record<string, KunciProfil> = {
  "Skala Nyata 2026 (10.000 proposal)": "skala10k",
  "Skala Nyata 2026 (1.200 proposal)": "contoh1200",
};

/** Profil periode menurut namanya; null untuk periode biasa. */
export function profilPeriode(namaPeriode: string): ProfilSkala | null {
  return Object.values(PROFIL).find((p) => p.namaPeriode === namaPeriode) ?? null;
}

const AWALAN_MASSAL = Object.values(PROFIL).map((p) => p.awalanReviewer);

/** Reviewer massal (rvw-skala-*, rvw-c12-*): tidak ditampilkan sebagai pilihan Masuk cepat. */
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
