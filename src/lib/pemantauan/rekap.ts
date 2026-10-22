/**
 * Perhitungan murni UC-04 (rekapKesesuaian, hitungTingkatKoreksi). Tanpa basis data supaya mudah diuji.
 *
 * Definisi (real use case UC-04 langkah 3-5):
 * - gagal per institusi: hasil deterministik berstatus Gagal saat pengajuan, dikelompokkan menurut butir dan institusi pengusul.
 * - % disetujui: porsi hasil pada penilaian final yang tidak memiliki baris koreksi_rekomendasi.
 * - tingkat koreksi: jumlah koreksi dibagi jumlah hasil pada penilaian final (butir dengan koreksi, urut tertinggi).
 */

export interface BarisGagal {
  butirKode: string;
  institusiPengusul: string;
}

export interface BarisNilai {
  hasilId: string;
  /** id baris proposal (untuk tautan ke J-05b); opsional supaya uji murni tidak perlu mengisinya */
  proposalId?: string;
  butirKode: string;
  judulProposal: string;
  rekomendasi: "Memenuhi" | "Tidak memenuhi" | null;
  status: string;
  kutipan: string | null;
  alasanSistem: string | null;
  tiruan: boolean;
  /** terisi bila reviewer mengoreksi */
  koreksi: { keputusanReviewer: "Memenuhi" | "Tidak memenuhi"; alasan: string; jenisKekeliruan: string } | null;
}

export interface InfoButir {
  id: string;
  kode: string;
  deskripsi: string;
  status: string;
}

export interface BarisGagalPerButir {
  kode: string;
  deskripsi: string;
  perInstitusi: Record<string, number>;
  total: number;
}

export interface BarisKesesuaian {
  kode: string;
  deskripsi: string;
  jumlah: number;
  disetujui: number;
  persenDisetujui: number;
  jumlahKoreksi: number;
  status: string | null;
}

export interface ContohRincian {
  proposalId?: string;
  judulProposal: string;
  rekomendasi: string | null;
  statusSistem: string;
  kutipan: string | null;
  keputusanReviewer: string;
  dikoreksi: boolean;
  alasanKoreksi: string | null;
  tiruan: boolean;
}

export interface BarisKoreksiTertinggi {
  kode: string;
  deskripsi: string;
  butirId: string | null;
  status: string | null;
  jumlah: number;
  jumlahKoreksi: number;
  tingkatKoreksi: number;
  alasan: { alasan: string; jenisKekeliruan: string; keputusanReviewer: string }[];
}

export interface HasilRekap {
  institusi: string[];
  gagalPerButir: BarisGagalPerButir[];
  kesesuaian: BarisKesesuaian[];
  koreksiTertinggi: BarisKoreksiTertinggi[];
  rincian: Record<string, ContohRincian[]>;
}

export const BATAS_CONTOH_RINCIAN = 6;

export function rekapKesesuaian(gagal: BarisGagal[], nilai: BarisNilai[], butir: InfoButir[]): HasilRekap {
  const info = new Map(butir.map((b) => [b.kode, b]));
  const deskripsi = (kode: string) => info.get(kode)?.deskripsi ?? kode;

  /* bagian 1: butir deterministik paling sering gagal */
  const institusi = [...new Set(gagal.map((g) => g.institusiPengusul))].sort((a, b) => a.localeCompare(b));
  const peta = new Map<string, BarisGagalPerButir>();
  for (const g of gagal) {
    const b = peta.get(g.butirKode) ?? { kode: g.butirKode, deskripsi: deskripsi(g.butirKode), perInstitusi: {}, total: 0 };
    b.perInstitusi[g.institusiPengusul] = (b.perInstitusi[g.institusiPengusul] ?? 0) + 1;
    b.total++;
    peta.set(g.butirKode, b);
  }
  const gagalPerButir = [...peta.values()].sort((a, b) => b.total - a.total || a.kode.localeCompare(b.kode));

  /* bagian 2 dan 3: hitungTingkatKoreksi per butir */
  const perButir = new Map<string, BarisNilai[]>();
  for (const n of nilai) perButir.set(n.butirKode, [...(perButir.get(n.butirKode) ?? []), n]);

  const kesesuaian: BarisKesesuaian[] = [];
  const koreksiTertinggi: BarisKoreksiTertinggi[] = [];
  const rincian: Record<string, ContohRincian[]> = {};
  for (const [kode, baris] of perButir) {
    const koreksi = baris.filter((n) => n.koreksi);
    const jumlah = baris.length;
    const disetujui = jumlah - koreksi.length;
    kesesuaian.push({
      kode,
      deskripsi: deskripsi(kode),
      jumlah,
      disetujui,
      persenDisetujui: jumlah ? (disetujui / jumlah) * 100 : 0,
      jumlahKoreksi: koreksi.length,
      status: info.get(kode)?.status ?? null,
    });
    if (koreksi.length) {
      koreksiTertinggi.push({
        kode,
        deskripsi: deskripsi(kode),
        butirId: info.get(kode)?.id ?? null,
        status: info.get(kode)?.status ?? null,
        jumlah,
        jumlahKoreksi: koreksi.length,
        tingkatKoreksi: koreksi.length / jumlah,
        alasan: koreksi.map((k) => ({
          alasan: k.koreksi!.alasan,
          jenisKekeliruan: k.koreksi!.jenisKekeliruan,
          keputusanReviewer: k.koreksi!.keputusanReviewer,
        })),
      });
    }
    /* ambilRincian / ambilContoh (S-1): koreksi lebih dulu, lalu yang disetujui */
    rincian[kode] = [...koreksi, ...baris.filter((n) => !n.koreksi)].slice(0, BATAS_CONTOH_RINCIAN).map((n) => ({
      proposalId: n.proposalId,
      judulProposal: n.judulProposal,
      rekomendasi: n.rekomendasi,
      statusSistem: n.status,
      kutipan: n.kutipan,
      keputusanReviewer: n.koreksi ? n.koreksi.keputusanReviewer : (n.rekomendasi ?? "Disetujui (tanpa koreksi)"),
      dikoreksi: !!n.koreksi,
      alasanKoreksi: n.koreksi?.alasan ?? null,
      tiruan: n.tiruan,
    }));
  }
  kesesuaian.sort((a, b) => a.persenDisetujui - b.persenDisetujui || a.kode.localeCompare(b.kode));
  koreksiTertinggi.sort((a, b) => b.tingkatKoreksi - a.tingkatKoreksi || b.jumlahKoreksi - a.jumlahKoreksi || a.kode.localeCompare(b.kode));

  return { institusi, gagalPerButir, kesesuaian, koreksiTertinggi, rincian };
}

/** 87.5 -> "87,5%" (gaya Indonesia) */
export function formatPersen(nilai: number): string {
  const bulat = Math.round(nilai * 10) / 10;
  return `${String(bulat).replace(".", ",")}%`;
}
