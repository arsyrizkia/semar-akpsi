/**
 * Perhitungan murni untuk J-05b Rincian Proposal: ringkasan hasil pemeriksaan dan urutan tampil. Tanpa basis data.
 */
export interface BarisHasilRincian {
  butirKode: string;
  jenis: "deterministik" | "semantik";
  status: string;
}

export interface RingkasanHasil {
  jumlah: number;
  lolos: number;
  gagal: number;
  memenuhi: number;
  tidakMemenuhi: number;
  perluManual: number;
  belumAda: number;
}

export function ringkasHasil(hasil: BarisHasilRincian[]): { deterministik: RingkasanHasil; semantik: RingkasanHasil } {
  const kosong = (): RingkasanHasil => ({ jumlah: 0, lolos: 0, gagal: 0, memenuhi: 0, tidakMemenuhi: 0, perluManual: 0, belumAda: 0 });
  const hasilRingkas = { deterministik: kosong(), semantik: kosong() };
  for (const h of hasil) {
    const r = hasilRingkas[h.jenis];
    r.jumlah++;
    if (h.status === "Lolos") r.lolos++;
    else if (h.status === "Gagal") r.gagal++;
    else if (h.status === "Memenuhi") r.memenuhi++;
    else if (h.status === "Tidak memenuhi") r.tidakMemenuhi++;
    else if (h.status === "Perlu diperiksa manual") r.perluManual++;
    else if (h.status === "Belum ada rekomendasi") r.belumAda++;
  }
  return hasilRingkas;
}

const PRIORITAS: Record<string, number> = { Gagal: 0, "Tidak memenuhi": 0, "Perlu diperiksa manual": 1, "Belum ada rekomendasi": 2, Lolos: 3, Memenuhi: 3 };

/** Butir bermasalah (Gagal / Tidak memenuhi) paling atas, lalu perlu manual, lalu belum ada rekomendasi, lalu lolos; seri menurut kode. */
export function urutkanHasil<T extends { butirKode: string; status: string }>(hasil: T[]): T[] {
  return [...hasil].sort((a, b) => (PRIORITAS[a.status] ?? 4) - (PRIORITAS[b.status] ?? 4) || a.butirKode.localeCompare(b.butirKode));
}

/** Status penilaian untuk J-05b, sama dengan label J-07 (Baru, Draf, Selesai): baris penilaian yang baru dibuka (belum "Simpan Sementara") bukan Draf. */
export function statusPenilaianDariLabel(label: string, statusPenugasan: string): "Belum dimulai" | "Draf" | "Final" | "Belum ditetapkan" {
  if (statusPenugasan === "Diusulkan") return "Belum ditetapkan";
  if (label === "Selesai") return "Final";
  if (label === "Draf") return "Draf";
  return "Belum dimulai";
}

/** Status penilaian reviewer untuk satu penugasan, dari baris penilaian (bila ada). */
export function statusPenilaian(penilaian: { status: "Draf" | "Final" } | null | undefined, statusPenugasan: string): "Belum dimulai" | "Draf" | "Final" | "Belum ditetapkan" {
  if (statusPenugasan === "Diusulkan") return "Belum ditetapkan";
  if (!penilaian) return "Belum dimulai";
  return penilaian.status;
}
