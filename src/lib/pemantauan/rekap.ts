/**
 * Perhitungan murni UC-04 (rekapKesesuaian, hitungTingkatKoreksi). Masukannya sel agregat dari basis data (layanan.ts:susunLaporan
 * menghitung jumlah per kombinasi di SQL), jadi ribuan proposal tidak ditarik baris demi baris. Tanpa basis data supaya mudah diuji.
 *
 * Definisi (UC-04 langkah 3-5, diperluas J-05 "triase dulu"):
 * - % disetujui: porsi hasil semantik pada penilaian final yang tidak dikoreksi reviewer.
 * - arah koreksi: "longgar" = sistem bilang Memenuhi, reviewer Tidak memenuhi; "ketat" = sebaliknya.
 * - definisi berlaku: hasil sebuah butir digabung lintas versi basis aturan selama deskripsi butirnya sama dengan deskripsi pada basis
 *   berlaku. Hasil dari deskripsi lama masuk perbandingan sebelum-sesudah, bukan ke % disetujui.
 * - gagal saat pengajuan: jumlah proposal (bukan baris hasil) yang pernah Gagal pada butir deterministik itu, di versi mana pun.
 */
import { AMBANG_PEMANTAUAN, type AmbangPemantauan } from "./ambang";

export type TingkatKeyakinan = "tinggi" | "sedang" | "rendah";
export type ArahKoreksi = "longgar" | "ketat";
export const TINGKAT_KEYAKINAN: TingkatKeyakinan[] = ["tinggi", "sedang", "rendah"];

/** Satu sel agregat hasil semantik pada penilaian final. arah null = tidak dikoreksi. */
export interface SelSemantik {
  butirKode: string;
  versi: number;
  /** deskripsi butir pada versi basis itu */
  deskripsi: string;
  tingkat: TingkatKeyakinan | null;
  /** minggu ke-n sesudah masa pengusulan ditutup (>= 1) */
  minggu: number;
  arah: ArahKoreksi | null;
  jenis: string | null;
  jumlah: number;
}

/** Jumlah proposal yang pernah Gagal pada satu butir deterministik, per institusi pengusul. */
export interface SelGagal {
  butirKode: string;
  institusi: string;
  proposal: number;
}

export interface InfoButir {
  id: string;
  kode: string;
  deskripsi: string;
  status: string;
  jenis: "semantik" | "deterministik";
}

export interface ContohRincian {
  butirKode: string;
  proposalId: string;
  idProposal: string;
  judulProposal: string;
  rekomendasi: string | null;
  statusSistem: string;
  kutipan: string | null;
  keyakinan: number | null;
  versi: number;
  keputusanReviewer: string;
  dikoreksi: boolean;
  jenis: string | null;
  alasanKoreksi: string | null;
  tiruan: boolean;
}

export interface ContohGagal {
  butirKode: string;
  proposalId: string;
  idProposal: string;
  judulProposal: string;
  institusi: string;
  angka: string | null;
  batas: string | null;
}

export interface MasukanRekap {
  sel: SelSemantik[];
  gagal: SelGagal[];
  /** jumlah proposal per institusi pengusul pada periode dan skema itu */
  pengajuan: { institusi: string; proposal: number }[];
  /** butir basis aturan berlaku */
  butir: InfoButir[];
  contoh: ContohRincian[];
  contohGagal: ContohGagal[];
  proposalPernahGagal: number;
  penilaianFinal: number;
  ambang?: AmbangPemantauan;
}

export interface TitikTren {
  minggu: number;
  jumlah: number;
  dikoreksi: number;
  /** % disetujui */
  persen: number;
}

export interface BarisKalibrasi {
  tingkat: TingkatKeyakinan;
  jumlah: number;
  dikoreksi: number;
  persenDikoreksi: number;
}

export interface BarisSemantik {
  kode: string;
  deskripsi: string;
  butirId: string | null;
  status: string | null;
  jumlah: number;
  dikoreksi: number;
  /** % disetujui */
  persen: number;
  /** jumlah >= ambang.minHasil */
  cukup: boolean;
  longgar: number;
  ketat: number;
  jenis: { jenis: string; jumlah: number; persen: number }[];
  /** versi basis yang hasilnya digabung (deskripsi sama dengan basis berlaku) */
  versi: number[];
  /** keyakinan tinggi tetap sering dikoreksi */
  terlaluYakin: boolean;
  perhatian: boolean;
}

export interface BarisInstitusi {
  institusi: string;
  gagal: number;
  pengajuan: number;
  persen: number;
}

export interface BarisDeterministik {
  kode: string;
  deskripsi: string;
  butirId: string | null;
  status: string | null;
  proposalGagal: number;
  /** % pengajuan */
  persen: number;
  /** semua institusi berpengajuan, urut % gagal menurun */
  perInstitusi: BarisInstitusi[];
  /** institusi dengan % gagal tertinggi di antara yang pengajuannya >= ambang.minPengajuanInstitusi */
  tertinggi: BarisInstitusi | null;
  perhatian: boolean;
  sebab: "keseluruhan" | "terpusat" | null;
}

export type ItemPerhatian = { jenis: "semantik"; baris: BarisSemantik } | { jenis: "deterministik"; baris: BarisDeterministik };

export interface BandingVersi {
  kode: string;
  lama: { versi: number; deskripsi: string; jumlah: number; persen: number };
  baru: { versi: number; deskripsi: string; jumlah: number; persen: number };
}

export interface TafsirKalibrasi {
  bermakna: boolean | null;
  kalimat: string;
}

export interface HasilRekap {
  ringkas: {
    hasilDinilai: number;
    dikoreksi: number;
    /** % disetujui seluruh hasil semantik; null bila belum ada */
    persen: number | null;
    butirSemantik: number;
    butirDeterministik: number;
    perluPerhatian: number;
    proposalPernahGagal: number;
    pengajuan: number;
    penilaianFinal: number;
  };
  /** butir yang menyala (urut paling parah dulu), lalu butir yang sudah ditandai Perlu ditinjau */
  perluPerhatian: ItemPerhatian[];
  semantik: BarisSemantik[];
  deterministik: BarisDeterministik[];
  tren: TitikTren[];
  trenButir: Record<string, TitikTren[]>;
  kalibrasi: BarisKalibrasi[];
  kalibrasiButir: Record<string, BarisKalibrasi[]>;
  tafsirKalibrasi: TafsirKalibrasi;
  bandingVersi: BandingVersi[];
  rincian: Record<string, ContohRincian[]>;
  rincianGagal: Record<string, ContohGagal[]>;
}

export const STATUS_DITANDAI = "Perlu ditinjau";

const persenDari = (bagian: number, total: number) => (total ? (bagian * 100) / total : 0);
const jumlahkan = (sel: SelSemantik[]) => sel.reduce((n, s) => n + s.jumlah, 0);
const jumlahDikoreksi = (sel: SelSemantik[]) => sel.reduce((n, s) => n + (s.arah ? s.jumlah : 0), 0);

/** hitungTingkatKoreksi per minggu: % disetujui setiap minggu yang punya hasil, urut minggu. */
export function trenMingguan(sel: SelSemantik[]): TitikTren[] {
  const per = new Map<number, { jumlah: number; dikoreksi: number }>();
  for (const s of sel) {
    const t = per.get(s.minggu) ?? { jumlah: 0, dikoreksi: 0 };
    t.jumlah += s.jumlah;
    if (s.arah) t.dikoreksi += s.jumlah;
    per.set(s.minggu, t);
  }
  return [...per.entries()]
    .sort(([a], [b]) => a - b)
    .map(([minggu, t]) => ({ minggu, ...t, persen: persenDari(t.jumlah - t.dikoreksi, t.jumlah) }));
}

/** % dikoreksi per tingkat keyakinan (tinggi >= 0,8; sedang 0,5 sampai < 0,8; rendah < 0,5); tingkat tanpa hasil tidak ikut. */
export function kelompokKeyakinan(sel: SelSemantik[]): BarisKalibrasi[] {
  return TINGKAT_KEYAKINAN.map((tingkat) => {
    const isi = sel.filter((s) => s.tingkat === tingkat);
    const jumlah = jumlahkan(isi);
    const dikoreksi = jumlahDikoreksi(isi);
    return { tingkat, jumlah, dikoreksi, persenDikoreksi: persenDari(dikoreksi, jumlah) };
  }).filter((b) => b.jumlah > 0);
}

/** Kalimat tafsir kalibrasi untuk Tim Kerja. bermakna null = data belum cukup. */
export function tafsirKalibrasi(kalibrasi: BarisKalibrasi[], ambang: AmbangPemantauan = AMBANG_PEMANTAUAN): TafsirKalibrasi {
  const tinggi = kalibrasi.find((k) => k.tingkat === "tinggi");
  const pembanding = [...kalibrasi].reverse().find((k) => k.tingkat !== "tinggi" && k.jumlah >= ambang.minHasil);
  if (!tinggi || tinggi.jumlah < ambang.minHasil || !pembanding) {
    return { bermakna: null, kalimat: `Data belum cukup untuk menilai tingkat keyakinan (minimal ${ambang.minHasil} hasil per tingkat).` };
  }
  const t = formatPersen(tinggi.persenDikoreksi);
  if (tinggi.persenDikoreksi >= ambang.terlaluYakin) {
    return { bermakna: false, kalimat: `Rekomendasi berkeyakinan tinggi tetap sering dikoreksi (${t}), jadi tingkat keyakinan pemeriksa belum dapat dijadikan pegangan.` };
  }
  const rasio = pembanding.persenDikoreksi / Math.max(tinggi.persenDikoreksi, 0.1);
  if (rasio >= 1.5) {
    const kali = String(Math.round(rasio * 10) / 10).replace(".", ",");
    return {
      bermakna: true,
      kalimat: `Rekomendasi berkeyakinan ${pembanding.tingkat} dikoreksi ${kali} kali lebih sering daripada yang berkeyakinan tinggi (${t}), jadi tingkat keyakinan dapat dijadikan pegangan.`,
    };
  }
  return { bermakna: false, kalimat: "Tingkat keyakinan hampir tidak membedakan rekomendasi yang dikoreksi dari yang disetujui." };
}

function barisSemantik(kode: string, sel: SelSemantik[], info: InfoButir | undefined, deskripsi: string, ambang: AmbangPemantauan): BarisSemantik {
  const jumlah = jumlahkan(sel);
  const dikoreksi = jumlahDikoreksi(sel);
  const persen = persenDari(jumlah - dikoreksi, jumlah);
  const cukup = jumlah >= ambang.minHasil;
  const perJenis = new Map<string, number>();
  for (const s of sel) if (s.arah) perJenis.set(s.jenis || "Tanpa jenis", (perJenis.get(s.jenis || "Tanpa jenis") ?? 0) + s.jumlah);
  const tinggi = kelompokKeyakinan(sel).find((k) => k.tingkat === "tinggi");
  return {
    kode,
    deskripsi,
    butirId: info?.id ?? null,
    status: info?.status ?? null,
    jumlah,
    dikoreksi,
    persen,
    cukup,
    longgar: sel.reduce((n, s) => n + (s.arah === "longgar" ? s.jumlah : 0), 0),
    ketat: sel.reduce((n, s) => n + (s.arah === "ketat" ? s.jumlah : 0), 0),
    jenis: [...perJenis.entries()]
      .map(([jenis, n]) => ({ jenis, jumlah: n, persen: persenDari(n, dikoreksi) }))
      .sort((a, b) => b.jumlah - a.jumlah || a.jenis.localeCompare(b.jenis)),
    versi: [...new Set(sel.map((s) => s.versi))].sort((a, b) => a - b),
    terlaluYakin: !!tinggi && tinggi.jumlah >= ambang.minHasil && tinggi.persenDikoreksi >= ambang.terlaluYakin,
    perhatian: cukup && persen < ambang.disetujui,
  };
}

/** Pemilahan "Perlu perhatian": butir yang menyala urut paling jauh dari ambang, lalu butir yang sudah ditandai (tanpa urutan parah). */
export function pilahPerluPerhatian(semantik: BarisSemantik[], deterministik: BarisDeterministik[], ambang: AmbangPemantauan = AMBANG_PEMANTAUAN): ItemPerhatian[] {
  const parah = (i: ItemPerhatian) =>
    i.jenis === "semantik" ? ambang.disetujui - i.baris.persen : Math.max(i.baris.persen - ambang.gagal, (i.baris.tertinggi?.persen ?? 0) - ambang.gagalInstitusi);
  const semua: ItemPerhatian[] = [
    ...semantik.filter((b) => b.perhatian || b.status === STATUS_DITANDAI).map((baris) => ({ jenis: "semantik" as const, baris })),
    ...deterministik.filter((b) => b.perhatian || b.status === STATUS_DITANDAI).map((baris) => ({ jenis: "deterministik" as const, baris })),
  ];
  const ditandai = (i: ItemPerhatian) => i.baris.status === STATUS_DITANDAI;
  return [
    ...semua.filter((i) => !ditandai(i)).sort((a, b) => parah(b) - parah(a) || a.baris.kode.localeCompare(b.baris.kode)),
    ...semua.filter(ditandai).sort((a, b) => a.baris.kode.localeCompare(b.baris.kode)),
  ];
}

/** Gagal saat pengajuan per butir: % pengajuan, sebaran per institusi, dan institusi tertinggi yang pengajuannya cukup. */
export function ringkasGagalInstitusi(
  kode: string,
  gagal: SelGagal[],
  pengajuan: { institusi: string; proposal: number }[],
  info: InfoButir | undefined,
  ambang: AmbangPemantauan = AMBANG_PEMANTAUAN,
): BarisDeterministik {
  const totalPengajuan = pengajuan.reduce((n, p) => n + p.proposal, 0);
  const perInst = new Map(gagal.filter((g) => g.butirKode === kode).map((g) => [g.institusi, g.proposal]));
  const proposalGagal = [...perInst.values()].reduce((n, x) => n + x, 0);
  const perInstitusi = pengajuan
    .map((p) => ({ institusi: p.institusi, gagal: perInst.get(p.institusi) ?? 0, pengajuan: p.proposal, persen: persenDari(perInst.get(p.institusi) ?? 0, p.proposal) }))
    .sort((a, b) => b.persen - a.persen || b.gagal - a.gagal || a.institusi.localeCompare(b.institusi));
  const tertinggi = perInstitusi.find((i) => i.pengajuan >= ambang.minPengajuanInstitusi && i.gagal > 0) ?? null;
  const persen = persenDari(proposalGagal, totalPengajuan);
  const keseluruhan = persen >= ambang.gagal;
  const terpusat = !!tertinggi && tertinggi.persen >= ambang.gagalInstitusi;
  return {
    kode,
    deskripsi: info?.deskripsi ?? kode,
    butirId: info?.id ?? null,
    status: info?.status ?? null,
    proposalGagal,
    persen,
    perInstitusi,
    tertinggi,
    perhatian: keseluruhan || terpusat,
    sebab: keseluruhan ? "keseluruhan" : terpusat ? "terpusat" : null,
  };
}

/** Sebelum-sesudah: butir yang deskripsinya berubah antarversi; lama = kelompok deskripsi lama dengan versi tertinggi. */
export function bandingkanVersi(kode: string, selLama: SelSemantik[], baru: BarisSemantik, versiBaru: number): BandingVersi | null {
  if (!selLama.length || !baru.jumlah) return null;
  const versiLama = Math.max(...selLama.map((s) => s.versi));
  const deskripsiLama = selLama.find((s) => s.versi === versiLama)!.deskripsi;
  const kelompok = selLama.filter((s) => s.deskripsi === deskripsiLama);
  const jumlah = jumlahkan(kelompok);
  return {
    kode,
    lama: { versi: versiLama, deskripsi: deskripsiLama, jumlah, persen: persenDari(jumlah - jumlahDikoreksi(kelompok), jumlah) },
    baru: { versi: versiBaru, deskripsi: baru.deskripsi, jumlah: baru.jumlah, persen: baru.persen },
  };
}

export function rekapKesesuaian(m: MasukanRekap): HasilRekap {
  const ambang = m.ambang ?? AMBANG_PEMANTAUAN;
  const info = new Map(m.butir.map((b) => [b.kode, b]));

  /* semantik: digabung per kode menurut definisi berlaku */
  const perKode = new Map<string, SelSemantik[]>();
  for (const s of m.sel) perKode.set(s.butirKode, [...(perKode.get(s.butirKode) ?? []), s]);
  const semantik: BarisSemantik[] = [];
  const bandingVersi: BandingVersi[] = [];
  const trenButir: Record<string, TitikTren[]> = {};
  const kalibrasiButir: Record<string, BarisKalibrasi[]> = {};
  for (const [kode, sel] of perKode) {
    const versiTerakhir = Math.max(...sel.map((s) => s.versi));
    const deskripsi = info.get(kode)?.deskripsi ?? sel.find((s) => s.versi === versiTerakhir)!.deskripsi;
    const berlaku = sel.filter((s) => s.deskripsi === deskripsi);
    const baris = barisSemantik(kode, berlaku, info.get(kode), deskripsi, ambang);
    semantik.push(baris);
    trenButir[kode] = trenMingguan(sel);
    kalibrasiButir[kode] = kelompokKeyakinan(berlaku);
    const banding = bandingkanVersi(
      kode,
      sel.filter((s) => s.deskripsi !== deskripsi),
      baris,
      Math.min(...berlaku.map((s) => s.versi).concat(versiTerakhir)),
    );
    if (banding) bandingVersi.push(banding);
  }
  semantik.sort((a, b) => Number(b.perhatian) - Number(a.perhatian) || Number(b.cukup) - Number(a.cukup) || a.persen - b.persen || a.kode.localeCompare(b.kode));

  /* deterministik: setiap butir deterministik basis berlaku, ditambah kode gagal yang tidak ada di basis */
  const kodeDet = [...new Set([...m.butir.filter((b) => b.jenis === "deterministik").map((b) => b.kode), ...m.gagal.map((g) => g.butirKode)])];
  const deterministik = kodeDet
    .map((kode) => ringkasGagalInstitusi(kode, m.gagal, m.pengajuan, info.get(kode), ambang))
    .sort((a, b) => Number(b.perhatian) - Number(a.perhatian) || b.persen - a.persen || a.kode.localeCompare(b.kode));

  const perluPerhatian = pilahPerluPerhatian(semantik, deterministik, ambang);
  const kalibrasi = kelompokKeyakinan(m.sel);
  const hasilDinilai = jumlahkan(m.sel);
  const dikoreksi = jumlahDikoreksi(m.sel);

  const rincian: Record<string, ContohRincian[]> = {};
  for (const c of m.contoh) (rincian[c.butirKode] ??= []).push(c);
  for (const daftar of Object.values(rincian)) daftar.sort((a, b) => Number(b.dikoreksi) - Number(a.dikoreksi));
  const rincianGagal: Record<string, ContohGagal[]> = {};
  for (const c of m.contohGagal) (rincianGagal[c.butirKode] ??= []).push(c);

  return {
    ringkas: {
      hasilDinilai,
      dikoreksi,
      persen: hasilDinilai ? persenDari(hasilDinilai - dikoreksi, hasilDinilai) : null,
      butirSemantik: semantik.length,
      butirDeterministik: deterministik.length,
      perluPerhatian: perluPerhatian.filter((i) => i.baris.perhatian && i.baris.status !== STATUS_DITANDAI).length,
      proposalPernahGagal: m.proposalPernahGagal,
      pengajuan: m.pengajuan.reduce((n, p) => n + p.proposal, 0),
      penilaianFinal: m.penilaianFinal,
    },
    perluPerhatian,
    semantik,
    deterministik,
    tren: trenMingguan(m.sel),
    trenButir,
    kalibrasi,
    kalibrasiButir,
    tafsirKalibrasi: tafsirKalibrasi(kalibrasi, ambang),
    bandingVersi,
    rincian,
    rincianGagal,
  };
}

/** 87.5 -> "87,5%" (gaya Indonesia) */
export function formatPersen(nilai: number): string {
  const bulat = Math.round(nilai * 10) / 10;
  return `${String(bulat).replace(".", ",")}%`;
}
