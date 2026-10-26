/**
 * UC-04 Memantau kesesuaian penilaian: ambilAturanBerlaku, rekapKesesuaian, ambilStatus, ambilAlasan, tandaiButir,
 * tandaiPerluDitinjau, ambilRincian, ambilContoh (nama mengikuti seq-uc04.puml).
 */
import { and, desc, eq, inArray, isNull, lt, notLike, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { basisAturan, butirCek, periodeSeleksi, skemaPendanaan } from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { PROFIL } from "@/lib/demo/profil-skala";
import { AMBANG_KEYAKINAN } from "@/lib/kontrak/tipe";
import { NAMA_PERIODE_SKALA, periodeSudahDibuka, waktuDemo } from "@/lib/waktu";
import { AMBANG_PEMANTAUAN, type AmbangPemantauan } from "./ambang";
import { pilahButirDitandai } from "./status-butir";
import { rekapKemajuan, type HasilKemajuan } from "./kemajuan";
import { rekapKesesuaian, type ContohGagal, type ContohRincian, type HasilRekap, type SelGagal, type SelSemantik } from "./rekap";

/** Periode J-05: periode biasa yang sudah dibuka, ditambah periode Simulasi Contoh (1.200 proposal; uji beban 10.000 tetap dikecualikan). */
export async function daftarPeriode() {
  return getDb()
    .select()
    .from(periodeSeleksi)
    .where(and(or(notLike(periodeSeleksi.nama, `${NAMA_PERIODE_SKALA}%`), eq(periodeSeleksi.nama, PROFIL.contoh1200.namaPeriode)), periodeSudahDibuka()))
    .orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka));
}

export async function daftarSkema() {
  return getDb().select().from(skemaPendanaan).orderBy(skemaPendanaan.namaSkema);
}

/**
 * ambilAturanBerlaku(periode) pada objek skema: basis aturan periode itu (atau tanpa periode) yang sudah berlaku menurut jam demo,
 * versi tertinggi lebih dulu; bila belum ada yang berlaku, versi tertinggi. Draf J-03 (31 Des 9999) tidak ikut. Sama dengan pemeriksa
 * pengajuan (pengajuan/layanan.ts:ambilAturanBerlaku), jadi versi yang disimpan dengan tanggal berlaku mendatang belum dianggap berlaku.
 */
export async function ambilAturanBerlaku(skemaId: string, periodeId: string) {
  const [sekarang, daftar] = await Promise.all([
    waktuDemo(),
    getDb()
      .select()
      .from(basisAturan)
      .where(and(eq(basisAturan.skemaId, skemaId), or(eq(basisAturan.periodeId, periodeId), isNull(basisAturan.periodeId)), lt(basisAturan.tanggalBerlaku, new Date("9999-01-01T00:00:00Z"))))
      .orderBy(desc(basisAturan.versi)),
  ]);
  return daftar.find((b) => b.tanggalBerlaku <= sekarang) ?? daftar[0] ?? null;
}

export interface LaporanKesesuaian extends HasilRekap {
  basis: { id: string; nama: string; versi: number } | null;
  /** versi basis yang mulai berlaku di tengah masa penilaian (penanda pada grafik tren) */
  penandaVersi: { versi: number; hari: number }[];
  ambang: AmbangPemantauan;
}

const baris = <T>(r: unknown) => (r as { rows: T[] }).rows;

/** Hasil semantik pada penilaian final periode dan skema itu (dipakai sel agregat dan contoh). */
const dasarFinal = (periodeId: string, skemaId: string) => sql`
  FROM hasil_pemeriksaan h
  JOIN butir_cek c ON c.id = h.butir_id
  JOIN basis_aturan b ON b.id = c.basis_aturan_id
  JOIN versi_proposal v ON v.id = h.versi_id
  JOIN proposal p ON p.id = v.proposal_id
  JOIN penugasan_reviewer pr ON pr.versi_id = h.versi_id
  JOIN penilaian pl ON pl.penugasan_id = pr.id AND pl.status = 'Final'
  LEFT JOIN koreksi_rekomendasi k ON k.hasil_id = h.id AND k.penilaian_id = pl.id
  WHERE p.periode_id = ${periodeId} AND p.skema_id = ${skemaId} AND h.jenis = 'semantik'`;

/**
 * Hari ke-n masa penilaian (kalender WIB, hari mulai = 1) dihitung dari mulai penilaian periode; periode lama tanpa catatan mulai memakai
 * penetapan penugasan pertama, lalu tanggal tutup.
 */
const asalHari = (periodeId: string) => sql`
  SELECT COALESCE(min(ps.mulai_penilaian), min(pr.tanggal) FILTER (WHERE pr.status <> 'Diusulkan'), min(ps.tanggal_tutup)) AS t
  FROM periode_seleksi ps LEFT JOIN penugasan_reviewer pr ON pr.periode_id = ps.id
  WHERE ps.id = ${periodeId}`;
/** nomor hari kalender WIB sebuah waktu */
const hariWib = (t: ReturnType<typeof sql>) => sql`floor(extract(epoch FROM (${t} + interval '7 hours')) / 86400)`;

/**
 * susunLaporan: membaca agregat dari basis data (tanpa menarik baris hasil satu per satu), lalu rekapKesesuaian (murni).
 * Kueri berjalan bersamaan; semuanya dibatasi periode dan skema.
 */
export async function susunLaporan(periodeId: string, skemaId: string, ambang: AmbangPemantauan = AMBANG_PEMANTAUAN): Promise<LaporanKesesuaian> {
  const db = getDb();
  const basis = await ambilAturanBerlaku(skemaId, periodeId);

  const [butirRaw, selQ, contohQ, gagalQ, pengajuanQ, ringkasQ, contohGagalQ, penandaQ] = await Promise.all([
    basis ? db.select().from(butirCek).where(eq(butirCek.basisAturanId, basis.id)) : Promise.resolve([]),
    /* (a) sel semantik */
    db.execute(sql`
      WITH asal AS (${asalHari(periodeId)})
      SELECT h.butir_kode AS "butirKode", b.versi, c.deskripsi,
             CASE WHEN h.tingkat_keyakinan IS NULL THEN NULL
                  WHEN h.tingkat_keyakinan >= ${AMBANG_KEYAKINAN.tinggi} THEN 'tinggi'
                  WHEN h.tingkat_keyakinan >= ${AMBANG_KEYAKINAN.sedang} THEN 'sedang' ELSE 'rendah' END AS tingkat,
             GREATEST(1, (${hariWib(sql`COALESCE(pl.dikirim_ke_bima_pada, pl.diperbarui_pada)`)} - ${hariWib(sql`(SELECT t FROM asal)`)})::int + 1) AS hari,
             CASE WHEN k.id IS NULL THEN NULL WHEN k.keputusan_reviewer = 'Tidak memenuhi' THEN 'longgar' ELSE 'ketat' END AS arah,
             CASE WHEN k.id IS NULL THEN NULL ELSE k.jenis_kekeliruan END AS jenis,
             count(*)::int AS jumlah
      ${dasarFinal(periodeId, skemaId)}
      GROUP BY 1, 2, 3, 4, 5, 6, 7`),
    /* (b) contoh: <= 3 terbaru per (butir, jenis kekeliruan), ditambah 4 yang disetujui */
    db.execute(sql`
      SELECT * FROM (
        SELECT h.butir_kode AS "butirKode", p.id AS "proposalId", p.id_proposal AS "idProposal", p.judul AS "judulProposal",
               h.rekomendasi, h.status AS "statusSistem", h.kutipan, h.tingkat_keyakinan AS keyakinan, b.versi, h.tiruan,
               k.id IS NOT NULL AS dikoreksi, k.keputusan_reviewer AS "keputusanKoreksi", k.jenis_kekeliruan AS jenis, k.alasan AS "alasanKoreksi",
               row_number() OVER (PARTITION BY h.butir_kode, k.id IS NOT NULL, k.jenis_kekeliruan
                                  ORDER BY COALESCE(pl.dikirim_ke_bima_pada, pl.diperbarui_pada) DESC, h.id) AS urut
        ${dasarFinal(periodeId, skemaId)}
      ) x
      WHERE (dikoreksi AND urut <= 3) OR (NOT dikoreksi AND urut <= 4)`),
    /* (c) gagal saat pengajuan: proposal (bukan baris) per butir dan institusi pengusul, versi mana pun */
    db.execute(sql`
      SELECT h.butir_kode AS "butirKode", COALESCE(a.institusi, '-') AS institusi, count(DISTINCT p.id)::int AS proposal
      FROM hasil_pemeriksaan h JOIN versi_proposal v ON v.id = h.versi_id JOIN proposal p ON p.id = v.proposal_id JOIN akun a ON a.id = p.pengusul_id
      WHERE p.periode_id = ${periodeId} AND p.skema_id = ${skemaId} AND h.jenis = 'deterministik' AND h.status = 'Gagal'
      GROUP BY 1, 2`),
    /* pengajuan per institusi */
    db.execute(sql`
      SELECT COALESCE(a.institusi, '-') AS institusi, count(*)::int AS proposal
      FROM proposal p JOIN akun a ON a.id = p.pengusul_id
      WHERE p.periode_id = ${periodeId} AND p.skema_id = ${skemaId}
      GROUP BY 1`),
    /* (d) angka ringkas */
    db.execute(sql`
      SELECT
        (SELECT count(DISTINCT p.id)::int FROM hasil_pemeriksaan h JOIN versi_proposal v ON v.id = h.versi_id JOIN proposal p ON p.id = v.proposal_id
          WHERE p.periode_id = ${periodeId} AND p.skema_id = ${skemaId} AND h.jenis = 'deterministik' AND h.status = 'Gagal') AS "proposalPernahGagal",
        (SELECT count(*)::int FROM penilaian pl JOIN penugasan_reviewer pr ON pr.id = pl.penugasan_id JOIN proposal p ON p.id = pr.proposal_id
          WHERE pl.status = 'Final' AND p.periode_id = ${periodeId} AND p.skema_id = ${skemaId}) AS "penilaianFinal"`),
    /* contoh proposal yang gagal per butir deterministik (<= 6, versi gagal terbaru) */
    db.execute(sql`
      SELECT * FROM (
        SELECT g.*, row_number() OVER (PARTITION BY g."butirKode" ORDER BY g.waktu DESC, g."idProposal") AS urut
        FROM (
          SELECT DISTINCT ON (h.butir_kode, p.id) h.butir_kode AS "butirKode", p.id AS "proposalId", p.id_proposal AS "idProposal", p.judul AS "judulProposal",
                 COALESCE(a.institusi, '-') AS institusi, h.angka_pembukti AS angka, h.batas_dilanggar AS batas, v.waktu
          FROM hasil_pemeriksaan h JOIN versi_proposal v ON v.id = h.versi_id JOIN proposal p ON p.id = v.proposal_id JOIN akun a ON a.id = p.pengusul_id
          WHERE p.periode_id = ${periodeId} AND p.skema_id = ${skemaId} AND h.jenis = 'deterministik' AND h.status = 'Gagal'
          ORDER BY h.butir_kode, p.id, v.waktu DESC
        ) g
      ) x WHERE urut <= 6`),
    /* versi basis yang mulai berlaku sesudah penilaian dimulai */
    db.execute(sql`
      WITH asal AS (${asalHari(periodeId)})
      SELECT b.versi, (${hariWib(sql`b.tanggal_berlaku`)} - ${hariWib(sql`(SELECT t FROM asal)`)})::int + 1 AS hari
      FROM basis_aturan b
      WHERE b.skema_id = ${skemaId} AND (b.periode_id = ${periodeId} OR b.periode_id IS NULL)
        AND b.tanggal_berlaku < '9999-01-01' AND b.tanggal_berlaku > (SELECT t FROM asal)
      ORDER BY b.versi`),
  ]);
  const selRaw = baris<SelSemantik>(selQ);
  const contohRaw = baris<Omit<ContohRincian, "keputusanReviewer"> & { keputusanKoreksi: string | null }>(contohQ);
  const gagalRaw = baris<SelGagal>(gagalQ);
  const pengajuanRaw = baris<{ institusi: string; proposal: number }>(pengajuanQ);
  const ringkasRaw = baris<{ proposalPernahGagal: number; penilaianFinal: number }>(ringkasQ);
  const contohGagalRaw = baris<ContohGagal>(contohGagalQ);
  const penandaRaw = baris<{ versi: number; hari: number }>(penandaQ);

  const hasil = rekapKesesuaian({
    sel: selRaw,
    gagal: gagalRaw,
    pengajuan: pengajuanRaw,
    // kode ganda (butir dinonaktifkan lalu ditambah lagi): baris Aktif ditaruh terakhir supaya menang di peta kode
    butir: [...butirRaw]
      .sort((a, b) => Number(a.status === "Aktif") - Number(b.status === "Aktif"))
      .map((b) => ({ id: b.id, kode: b.kode, deskripsi: b.deskripsi, status: b.status, jenis: b.jenis })),
    contoh: contohRaw.map(({ keputusanKoreksi, ...c }) => ({
      ...c,
      keyakinan: c.keyakinan === null ? null : Number(c.keyakinan),
      keputusanReviewer: c.dikoreksi ? (keputusanKoreksi ?? "-") : (c.rekomendasi ?? "Disetujui (tanpa koreksi)"),
    })),
    contohGagal: contohGagalRaw,
    proposalPernahGagal: ringkasRaw[0]?.proposalPernahGagal ?? 0,
    penilaianFinal: ringkasRaw[0]?.penilaianFinal ?? 0,
    ambang,
  });
  return {
    ...hasil,
    basis: basis ? { id: basis.id, nama: basis.nama, versi: basis.versi } : null,
    penandaVersi: penandaRaw.filter((x) => x.hari >= 1),
    ambang,
  };
}

/**
 * Kemajuan penilaian satu periode (semua skema) terhadap tenggat: penugasan tetap, penilaian final per hari masa penilaian, dan beban
 * serta penilaian final setiap reviewer; lalu rekapKemajuan (murni).
 */
export async function susunKemajuan(periodeId: string): Promise<HasilKemajuan> {
  const db = getDb();
  const [[p], sekarang, totalQ, harianQ, reviewerQ] = await Promise.all([
    db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, periodeId)),
    waktuDemo(),
    db.execute(sql`SELECT count(*)::int AS n FROM penugasan_reviewer WHERE periode_id = ${periodeId} AND status IN ('Ditetapkan', 'Selesai')`),
    db.execute(sql`
      WITH asal AS (${asalHari(periodeId)})
      SELECT (${hariWib(sql`COALESCE(pl.dikirim_ke_bima_pada, pl.diperbarui_pada)`)} - ${hariWib(sql`(SELECT t FROM asal)`)})::int + 1 AS hari,
             count(DISTINCT pr.id)::int AS jumlah
      FROM penilaian pl JOIN penugasan_reviewer pr ON pr.id = pl.penugasan_id
      WHERE pr.periode_id = ${periodeId} AND pl.status = 'Final'
      GROUP BY 1`),
    db.execute(sql`
      SELECT a.id AS "reviewerId", a.nama, a.institusi, count(DISTINCT pr.id)::int AS beban,
             count(DISTINCT pr.id) FILTER (WHERE pl.status = 'Final')::int AS selesai
      FROM penugasan_reviewer pr JOIN akun a ON a.id = pr.reviewer_id LEFT JOIN penilaian pl ON pl.penugasan_id = pr.id
      WHERE pr.periode_id = ${periodeId} AND pr.status IN ('Ditetapkan', 'Selesai')
      GROUP BY a.id, a.nama, a.institusi`),
  ]);
  return rekapKemajuan({
    masa: { lamaHari: p?.lamaPenilaianHari ?? 7, jamPerHari: p?.jamReviewerPerHari ?? 2, menitPerProposal: p?.menitPerProposal ?? 5.17 },
    mulai: p?.mulaiPenilaian ?? null,
    sekarang,
    total: baris<{ n: number }>(totalQ)[0]?.n ?? 0,
    finalPerHari: baris<{ hari: number; jumlah: number }>(harianQ),
    reviewer: baris<{ reviewerId: string; nama: string; institusi: string | null; beban: number; selesai: number }>(reviewerQ),
  });
}

/**
 * tandaiButir(butir) -> tandaiPerluDitinjau(): status Aktif menjadi "Perlu ditinjau" pada basis aturan berlaku.
 * Hanya penanda bahan UC-02; butir tetap dipakai pemeriksa sampai basis versi baru disimpan.
 */
export async function tandaiButir(skemaId: string, periodeId: string, kodeButir: string[], aktorId: string, aktorIdBima: string) {
  const db = getDb();
  const basis = await ambilAturanBerlaku(skemaId, periodeId);
  if (!basis || !kodeButir.length) return { ditandai: [] as string[] };
  const baris = await db
    .select({ id: butirCek.id, kode: butirCek.kode, status: butirCek.status })
    .from(butirCek)
    .where(and(eq(butirCek.basisAturanId, basis.id), inArray(butirCek.kode, kodeButir)));
  const { target } = pilahButirDitandai(baris, kodeButir);
  if (target.length) {
    await db
      .update(butirCek)
      .set({ status: "Perlu ditinjau", ditandaiOleh: aktorId, ditandaiPada: new Date() })
      .where(inArray(butirCek.id, target.map((t) => t.id)));
  }
  for (const t of target) {
    await catatLogAudit({
      aktor: aktorIdBima,
      aksi: "tandai_butir_perlu_ditinjau",
      objek: `butir:${t.kode}`,
      rincian: { skemaId, periodeId, basisAturanId: basis.id },
    });
  }
  return { ditandai: target.map((t) => t.kode) };
}

/* ------------------------------ metode seq-uc04 ------------------------------ */

/** hitungTingkatKoreksi(), ambilStatus(), ambilAlasan(), ambilRincian(), ambilContoh(): dihitung bersama oleh susunLaporan lewat rekapKesesuaian. */
export const hitungTingkatKoreksi = susunLaporan;
export const ambilStatus = susunLaporan;
export const ambilAlasan = susunLaporan;
export const ambilRincian = susunLaporan;
export const ambilContoh = susunLaporan;

/** tandaiPerluDitinjau(): transisi status butir Aktif -> Perlu ditinjau (murni; dipakai tandaiButir lewat pilahButirDitandai). */
export { tandaiPerluDitinjau } from "./status-butir";
