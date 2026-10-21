/**
 * UC-04 Memantau kesesuaian penilaian: ambilAturanBerlaku, rekapKesesuaian, ambilStatus, ambilAlasan, tandaiButir,
 * tandaiPerluDitinjau, ambilRincian, ambilContoh (nama mengikuti seq-uc04.puml).
 */
import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  akun,
  basisAturan,
  butirCek,
  hasilPemeriksaan,
  koreksiRekomendasi,
  penilaian,
  penugasanReviewer,
  periodeSeleksi,
  proposal,
  skemaPendanaan,
  versiProposal,
} from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { rekapKesesuaian, type BarisGagal, type BarisNilai, type HasilRekap, type InfoButir } from "./rekap";

export async function daftarPeriode() {
  return getDb().select().from(periodeSeleksi).orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka));
}

export async function daftarSkema() {
  return getDb().select().from(skemaPendanaan).orderBy(skemaPendanaan.namaSkema);
}

/** ambilAturanBerlaku(periode) pada objek skema: versi basis aturan tertinggi untuk skema dan periode itu. */
export async function ambilAturanBerlaku(skemaId: string, periodeId: string) {
  const db = getDb();
  const [basis] = await db
    .select()
    .from(basisAturan)
    .where(and(eq(basisAturan.skemaId, skemaId), or(eq(basisAturan.periodeId, periodeId), isNull(basisAturan.periodeId)), lt(basisAturan.tanggalBerlaku, new Date("9999-01-01T00:00:00Z")))) // draf J-03 (31 Des 9999) tidak ikut
    .orderBy(desc(basisAturan.versi))
    .limit(1);
  return basis ?? null;
}

export interface LaporanKesesuaian extends HasilRekap {
  basis: { id: string; nama: string; versi: number } | null;
  jumlahPenilaianFinal: number;
}

export async function susunLaporan(periodeId: string, skemaId: string): Promise<LaporanKesesuaian> {
  const db = getDb();
  const basis = await ambilAturanBerlaku(skemaId, periodeId);
  const butir: InfoButir[] = basis
    ? (await db.select().from(butirCek).where(eq(butirCek.basisAturanId, basis.id))).map((b) => ({
        id: b.id,
        kode: b.kode,
        deskripsi: b.deskripsi,
        status: b.status,
      }))
    : [];

  /* ambilStatus(): hasil deterministik Gagal saat pengajuan */
  const gagalMentah = await db
    .select({ butirKode: hasilPemeriksaan.butirKode, institusi: akun.institusi })
    .from(hasilPemeriksaan)
    .innerJoin(versiProposal, eq(hasilPemeriksaan.versiId, versiProposal.id))
    .innerJoin(proposal, eq(versiProposal.proposalId, proposal.id))
    .innerJoin(akun, eq(proposal.pengusulId, akun.id))
    .where(
      and(
        eq(proposal.periodeId, periodeId),
        eq(proposal.skemaId, skemaId),
        eq(hasilPemeriksaan.jenis, "deterministik"),
        eq(hasilPemeriksaan.status, "Gagal"),
      ),
    );
  const gagal: BarisGagal[] = gagalMentah.map((g) => ({ butirKode: g.butirKode, institusiPengusul: g.institusi }));

  /* hasil semantik pada penilaian final (+ ambilAlasan() bila dikoreksi) */
  const nilaiMentah = await db
    .select({
      hasilId: hasilPemeriksaan.id,
      butirKode: hasilPemeriksaan.butirKode,
      judulProposal: proposal.judul,
      rekomendasi: hasilPemeriksaan.rekomendasi,
      status: hasilPemeriksaan.status,
      kutipan: hasilPemeriksaan.kutipan,
      alasanSistem: hasilPemeriksaan.alasanSistem,
      tiruan: hasilPemeriksaan.tiruan,
      keputusanReviewer: koreksiRekomendasi.keputusanReviewer,
      alasan: koreksiRekomendasi.alasan,
      jenisKekeliruan: koreksiRekomendasi.jenisKekeliruan,
    })
    .from(hasilPemeriksaan)
    .innerJoin(versiProposal, eq(hasilPemeriksaan.versiId, versiProposal.id))
    .innerJoin(proposal, eq(versiProposal.proposalId, proposal.id))
    .innerJoin(penugasanReviewer, eq(penugasanReviewer.versiId, hasilPemeriksaan.versiId))
    .innerJoin(penilaian, and(eq(penilaian.penugasanId, penugasanReviewer.id), eq(penilaian.status, "Final")))
    .leftJoin(
      koreksiRekomendasi,
      and(eq(koreksiRekomendasi.hasilId, hasilPemeriksaan.id), eq(koreksiRekomendasi.penilaianId, penilaian.id)),
    )
    .where(and(eq(proposal.periodeId, periodeId), eq(proposal.skemaId, skemaId), eq(hasilPemeriksaan.jenis, "semantik")));
  const nilai: BarisNilai[] = nilaiMentah.map((n) => ({
    hasilId: n.hasilId,
    butirKode: n.butirKode,
    judulProposal: n.judulProposal,
    rekomendasi: n.rekomendasi,
    status: n.status,
    kutipan: n.kutipan,
    alasanSistem: n.alasanSistem,
    tiruan: n.tiruan,
    koreksi: n.keputusanReviewer
      ? { keputusanReviewer: n.keputusanReviewer, alasan: n.alasan ?? "", jenisKekeliruan: n.jenisKekeliruan ?? "" }
      : null,
  }));

  const jumlahFinal = new Set(nilaiMentah.map((n) => n.hasilId)).size;
  return {
    ...rekapKesesuaian(gagal, nilai, butir),
    basis: basis ? { id: basis.id, nama: basis.nama, versi: basis.versi } : null,
    jumlahPenilaianFinal: jumlahFinal,
  };
}

/**
 * tandaiButir(butir) -> tandaiPerluDitinjau(): status Aktif menjadi "Perlu ditinjau" pada basis aturan berlaku.
 * Hanya penanda bahan UC-02; butir tetap dipakai pemeriksa sampai basis versi baru disimpan.
 */
export async function tandaiButir(skemaId: string, periodeId: string, kodeButir: string[], aktorId: string, aktorNama: string) {
  const db = getDb();
  const basis = await ambilAturanBerlaku(skemaId, periodeId);
  if (!basis || !kodeButir.length) return { ditandai: [] as string[] };
  const baris = await db
    .select({ id: butirCek.id, kode: butirCek.kode, status: butirCek.status })
    .from(butirCek)
    .where(and(eq(butirCek.basisAturanId, basis.id), inArray(butirCek.kode, kodeButir)));
  const target = baris.filter((b) => b.status === "Aktif");
  if (target.length) {
    await db
      .update(butirCek)
      .set({ status: "Perlu ditinjau", ditandaiOleh: aktorId, ditandaiPada: new Date() })
      .where(inArray(butirCek.id, target.map((t) => t.id)));
  }
  for (const t of target) {
    await catatLogAudit({
      aktor: aktorNama,
      aksi: "tandai_butir_perlu_ditinjau",
      objek: `butir:${t.kode}`,
      rincian: { skemaId, periodeId, basisAturanId: basis.id },
    });
  }
  return { ditandai: target.map((t) => t.kode) };
}
