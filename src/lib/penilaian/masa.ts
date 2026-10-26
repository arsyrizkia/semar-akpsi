/**
 * Masa penilaian administrasi (aman diimpor komponen klien). Seluruh proposal satu periode dinilai reviewer dalam satu masa singkat
 * (bawaan 7 hari sejak penugasan ditetapkan; naskah: seleksi administrasi 2026 berlangsung delapan hari). Dari lama masa, jam kerja
 * reviewer per hari, dan waktu pemeriksaan per proposal (to-be 5,17 menit, Tabel 5.2 duration analysis) dihitung kapasitas satu
 * reviewer, tenggat, posisi hari, proyeksi selesai, dan status jadwal setiap reviewer. Hari dihitung menurut kalender WIB.
 */

export interface ParamMasa {
  /** lama masa penilaian (hari kalender, hari penetapan = hari ke-1) */
  lamaHari: number;
  /** jam yang dapat dipakai satu reviewer per hari untuk menilai */
  jamPerHari: number;
  /** rata-rata menit pemeriksaan satu proposal */
  menitPerProposal: number;
}

export const MASA_BAWAAN: ParamMasa = { lamaHari: 7, jamPerHari: 2, menitPerProposal: 5.17 };
/** rentang isian yang diterima (J-04b) */
export const RENTANG_MASA = { lamaHari: [1, 31], jamPerHari: [0.5, 12], menitPerProposal: [1, 60] } as const;

export const HARI_MS = 86_400_000;
const WIB_MS = 7 * 3_600_000;

/** Proposal yang dapat diselesaikan satu reviewer per hari (pecahan). */
export const kapasitasPerHari = (m: ParamMasa) => (m.jamPerHari * 60) / m.menitPerProposal;

/** Proposal yang dapat diselesaikan satu reviewer selama masa penilaian (dibulatkan ke bawah). */
export const kapasitasReviewer = (m: ParamMasa) => Math.floor(m.lamaHari * kapasitasPerHari(m) + 1e-9);

/** Jam yang dibutuhkan untuk menilai `beban` proposal. */
export const jamDibutuhkan = (beban: number, m: Pick<ParamMasa, "menitPerProposal">) => (beban * m.menitPerProposal) / 60;

/** Galat isian masa penilaian (null bila sah). */
export function periksaParamMasa(m: ParamMasa): string | null {
  const [l0, l1] = RENTANG_MASA.lamaHari;
  const [j0, j1] = RENTANG_MASA.jamPerHari;
  const [n0, n1] = RENTANG_MASA.menitPerProposal;
  if (!Number.isInteger(m.lamaHari) || m.lamaHari < l0 || m.lamaHari > l1) return `Lama masa penilaian harus bilangan bulat ${l0} sampai ${l1} hari.`;
  if (!Number.isFinite(m.jamPerHari) || m.jamPerHari < j0 || m.jamPerHari > j1) return `Jam per reviewer per hari harus ${j0} sampai ${j1}.`;
  if (!Number.isFinite(m.menitPerProposal) || m.menitPerProposal < n0 || m.menitPerProposal > n1) return `Menit per proposal harus ${n0} sampai ${n1}.`;
  return null;
}

/** Awal hari kalender WIB tempat `t` berada (ms epoch). */
export const awalHariWib = (t: Date) => Math.floor((t.getTime() + WIB_MS) / HARI_MS) * HARI_MS - WIB_MS;

/** Tenggat: akhir hari ke-`lamaHari` (23.59.59 WIB), hari mulai dihitung hari ke-1. */
export function hitungTenggat(mulai: Date, lamaHari: number): Date {
  return new Date(awalHariWib(mulai) + lamaHari * HARI_MS - 1000);
}

/** Hari ke-n masa penilaian tempat `waktu` berada (hari mulai = 1; sebelum mulai = 0 atau negatif). */
export const hariPenilaian = (waktu: Date, mulai: Date) => Math.floor((awalHariWib(waktu) - awalHariWib(mulai)) / HARI_MS) + 1;

export interface PosisiMasa {
  /** hari ke-n (dijepit 1..lama; 0 bila belum mulai) */
  hariKe: number;
  lama: number;
  /** hari kalender tersisa termasuk hari ini (0 bila lewat) */
  sisaHari: number;
  /** hari yang sudah berjalan, pecahan (untuk laju), minimal 0,5 sesudah mulai */
  berjalan: number;
  lewat: boolean;
  belumMulai: boolean;
}

export function posisiMasa(sekarang: Date, mulai: Date, lamaHari: number): PosisiMasa {
  const tenggat = hitungTenggat(mulai, lamaHari);
  const belumMulai = sekarang.getTime() < awalHariWib(mulai);
  const lewat = sekarang.getTime() > tenggat.getTime();
  const hari = hariPenilaian(sekarang, mulai);
  const hariKe = belumMulai ? 0 : Math.min(lamaHari, Math.max(1, hari));
  const berjalan = belumMulai ? 0 : Math.min(lamaHari, Math.max(0.5, (sekarang.getTime() - awalHariWib(mulai)) / HARI_MS));
  return { hariKe, lama: lamaHari, sisaHari: lewat || belumMulai ? (belumMulai ? lamaHari : 0) : lamaHari - hariKe + 1, berjalan, lewat, belumMulai };
}

export interface Proyeksi {
  /** penilaian final per hari sejauh ini */
  lajuPerHari: number;
  /** perkiraan penilaian final pada tenggat dengan laju yang sama (maks. total) */
  perkiraanFinal: number;
  /** proposal yang diperkirakan belum final pada tenggat */
  kurang: number;
  tepatWaktu: boolean;
  /** laju per hari yang dibutuhkan untuk sisa proposal */
  lajuDibutuhkan: number;
}

/** Proyeksi linear: laju penilaian final sejauh ini diteruskan sampai tenggat. */
export function proyeksiSelesai(p: { final: number; total: number }, pos: PosisiMasa): Proyeksi {
  const sisa = Math.max(0, p.total - p.final);
  if (sisa === 0) return { lajuPerHari: pos.berjalan ? p.final / pos.berjalan : 0, perkiraanFinal: p.total, kurang: 0, tepatWaktu: true, lajuDibutuhkan: 0 };
  if (pos.lewat) return { lajuPerHari: p.final / pos.lama, perkiraanFinal: p.final, kurang: sisa, tepatWaktu: false, lajuDibutuhkan: Infinity };
  const laju = pos.berjalan > 0 ? p.final / pos.berjalan : 0;
  const sisaWaktu = Math.max(0, pos.lama - pos.berjalan);
  const perkiraanFinal = Math.min(p.total, Math.floor(p.final + laju * sisaWaktu));
  return {
    lajuPerHari: laju,
    perkiraanFinal,
    kurang: p.total - perkiraanFinal,
    tepatWaktu: perkiraanFinal >= p.total,
    lajuDibutuhkan: sisaWaktu > 0 ? sisa / sisaWaktu : Infinity,
  };
}

export type StatusJadwal = "Selesai" | "Sesuai jadwal" | "Di bawah jadwal" | "Tertinggal";

/**
 * Status jadwal satu reviewer. Tertinggal: sisa proposal melebihi kapasitas hari yang tersisa (atau tenggat sudah lewat). Di bawah
 * jadwal: yang selesai kurang dari jadwal merata sampai akhir kemarin, lebih dari toleransi 10% beban (minimal 1). Selain itu sesuai.
 */
export function statusReviewer(r: { beban: number; selesai: number }, pos: PosisiMasa, m: ParamMasa): { status: StatusJadwal; sisa: number; perluPerHari: number } {
  const sisa = Math.max(0, r.beban - r.selesai);
  if (sisa === 0) return { status: "Selesai", sisa, perluPerHari: 0 };
  const perluPerHari = pos.sisaHari > 0 ? sisa / pos.sisaHari : Infinity;
  if (pos.lewat || perluPerHari > kapasitasPerHari(m)) return { status: "Tertinggal", sisa, perluPerHari };
  const jadwal = Math.floor((r.beban * Math.max(0, pos.hariKe - 1)) / pos.lama);
  const toleransi = Math.max(1, Math.ceil(r.beban * 0.1));
  return { status: r.selesai < jadwal - toleransi ? "Di bawah jadwal" : "Sesuai jadwal", sisa, perluPerHari };
}

const tanggalWib = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const jamWib = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

/** "Minggu, 1 November 2026, 23.59 WIB" */
export const formatTenggat = (t: Date) => `${tanggalWib.format(t)}, ${jamWib.format(t)} WIB`;

/** "sisa 3 hari", "hari terakhir", "lewat 2 hari", "belum mulai" */
export function teksSisa(pos: PosisiMasa, sekarang: Date, tenggat: Date): string {
  if (pos.belumMulai) return "belum mulai";
  if (pos.lewat) {
    const lewatHari = Math.max(1, Math.round((awalHariWib(sekarang) - awalHariWib(tenggat)) / HARI_MS));
    return `lewat ${lewatHari} hari`;
  }
  return pos.sisaHari <= 1 ? "hari terakhir" : `sisa ${pos.sisaHari} hari`;
}
