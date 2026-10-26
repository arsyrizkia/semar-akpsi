/**
 * Kemajuan penilaian terhadap tenggat (J-05 tab Kemajuan Penilaian; murni). Masa penilaian administrasi singkat (bawaan 7 hari), jadi Tim
 * Kerja perlu tahu sejak hari-hari awal apakah seluruh penugasan akan final tepat waktu dan reviewer mana yang tertinggal. Masukannya
 * agregat dari basis data (layanan.ts:susunKemajuan); seluruh skema periode itu dihitung bersama karena beban reviewer lintas skema.
 */
import {
  hitungTenggat,
  posisiMasa,
  proyeksiSelesai,
  statusReviewer,
  type ParamMasa,
  type PosisiMasa,
  type Proyeksi,
  type StatusJadwal,
} from "@/lib/penilaian/masa";

export interface MasukanKemajuan {
  masa: ParamMasa;
  /** null = penugasan belum pernah ditetapkan */
  mulai: Date | null;
  sekarang: Date;
  /** penugasan Ditetapkan atau Selesai pada periode */
  total: number;
  /** penilaian final per hari masa penilaian (hari 1 = hari mulai) */
  finalPerHari: { hari: number; jumlah: number }[];
  reviewer: { reviewerId: string; nama: string; institusi: string | null; beban: number; selesai: number }[];
}

export interface HariKemajuan {
  hari: number;
  /** final pada hari itu */
  final: number;
  kumulatif: number;
  /** kumulatif menurut jadwal merata (total x hari / lama) */
  jadwal: number;
  /** hari ini atau sebelumnya */
  berjalan: boolean;
}

export interface ReviewerKemajuan {
  reviewerId: string;
  nama: string;
  institusi: string | null;
  beban: number;
  selesai: number;
  sisa: number;
  perluPerHari: number;
  status: StatusJadwal;
}

export interface HasilKemajuan {
  dimulai: boolean;
  posisi: PosisiMasa | null;
  tenggat: Date | null;
  total: number;
  final: number;
  persen: number;
  proyeksi: Proyeksi | null;
  harian: HariKemajuan[];
  /** urut: Tertinggal, Di bawah jadwal, Sesuai jadwal, Selesai; dalam status yang sama, sisa terbanyak lebih dulu */
  reviewer: ReviewerKemajuan[];
  jumlahStatus: Record<StatusJadwal, number>;
  /** tampil di Perlu perhatian: proyeksi tidak tepat waktu atau ada reviewer tertinggal */
  perluPerhatian: boolean;
}

export const URUT_STATUS: StatusJadwal[] = ["Tertinggal", "Di bawah jadwal", "Sesuai jadwal", "Selesai"];

export function rekapKemajuan(m: MasukanKemajuan): HasilKemajuan {
  const final = m.finalPerHari.reduce((n, h) => n + h.jumlah, 0);
  const persen = m.total ? (final * 100) / m.total : 0;
  const jumlahStatus: Record<StatusJadwal, number> = { Tertinggal: 0, "Di bawah jadwal": 0, "Sesuai jadwal": 0, Selesai: 0 };
  if (!m.mulai) {
    return { dimulai: false, posisi: null, tenggat: null, total: m.total, final, persen, proyeksi: null, harian: [], reviewer: [], jumlahStatus, perluPerhatian: false };
  }

  const posisi = posisiMasa(m.sekarang, m.mulai, m.masa.lamaHari);
  const proyeksi = proyeksiSelesai({ final, total: m.total }, posisi);
  const perHari = new Map<number, number>();
  for (const h of m.finalPerHari) {
    const k = Math.min(m.masa.lamaHari, Math.max(1, h.hari));
    perHari.set(k, (perHari.get(k) ?? 0) + h.jumlah);
  }
  let kumulatif = 0;
  const harian = Array.from({ length: m.masa.lamaHari }, (_, i) => {
    const hari = i + 1;
    const f = perHari.get(hari) ?? 0;
    kumulatif += f;
    return { hari, final: f, kumulatif, jadwal: Math.round((m.total * hari) / m.masa.lamaHari), berjalan: hari <= posisi.hariKe || posisi.lewat };
  });

  const reviewer = m.reviewer
    .map((r) => ({ ...r, ...statusReviewer(r, posisi, m.masa) }))
    .sort((a, b) => URUT_STATUS.indexOf(a.status) - URUT_STATUS.indexOf(b.status) || b.sisa - a.sisa || a.nama.localeCompare(b.nama, "id"));
  for (const r of reviewer) jumlahStatus[r.status]++;

  return {
    dimulai: true,
    posisi,
    tenggat: hitungTenggat(m.mulai, m.masa.lamaHari),
    total: m.total,
    final,
    persen,
    proyeksi,
    harian,
    reviewer,
    jumlahStatus,
    perluPerhatian: m.total > 0 && (!proyeksi.tepatWaktu || jumlahStatus.Tertinggal > 0),
  };
}
