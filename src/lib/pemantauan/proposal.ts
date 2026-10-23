/**
 * J-05b Rincian Proposal: satu proposal beserta identitas, versi pengajuan, hasil pemeriksaan (deterministik dan semantik),
 * penugasan, status penilaian beserta koreksi, dan berkas yang dapat diunduh. Hanya baca.
 */
import { and, asc, desc, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  akun,
  basisAturan,
  berkasVersi,
  bimaBerkas,
  butirCek,
  hasilPemeriksaan,
  koreksiRekomendasi,
  penilaian,
  penugasanReviewer,
  periodeSeleksi,
  proposal,
  skemaPendanaan,
  templatProposal,
  versiProposal,
} from "@/db/schema";
import { adalahUuid } from "@/lib/unduhan-db";

export interface HasilRincianProposal {
  butirId: string;
  butirKode: string;
  deskripsi: string;
  jenis: "deterministik" | "semantik";
  bagian: string | null;
  status: string;
  angkaPembukti: string | null;
  batasDilanggar: string | null;
  rekomendasi: string | null;
  kutipan: string | null;
  tingkatKeyakinan: number | null;
  alasanSistem: string | null;
  tiruan: boolean;
  koreksi: { keputusanReviewer: string; alasan: string; jenisKekeliruan: string } | null;
}

export interface VersiRincian {
  id: string;
  nomor: number;
  kode: string;
  waktu: Date;
  statusPemeriksaan: string;
  versiTemplat: number | null;
  /** id templat_proposal yang dipakai versi ini (untuk tautan ke J-02) */
  templatId: string | null;
  versiAturan: number | null;
  /** id berkas_versi (naskah) bila tersimpan di SEMAR */
  berkasId: string | null;
  namaBerkas: string | null;
}

export interface PenugasanRincian {
  id: string;
  reviewerId: string;
  namaReviewer: string;
  institusiReviewer: string;
  status: "Diusulkan" | "Ditetapkan" | "Selesai";
  label: string;
  tanggal: Date;
  penilaian: { status: "Draf" | "Final"; komentar: string | null; jumlahKoreksi: number } | null;
}

export interface BerkasRincian {
  id: string;
  nama: string;
  peran: string;
  ukuran: number;
  keterangan: string | null;
}

export interface RincianProposal {
  id: string;
  idProposal: string;
  judul: string;
  status: string;
  waktuTerkirim: Date | null;
  skema: { id: string; nama: string; kode: string };
  periode: { id: string; nama: string };
  pengusul: { nama: string; institusi: string };
  versi: VersiRincian[];
  /** versi yang hasilnya ditampilkan (terbaru) */
  versiDinilai: VersiRincian | null;
  hasil: HasilRincianProposal[];
  penugasan: PenugasanRincian[];
  /** naskah dari versi SEMAR (satu per versi yang berkasnya tersimpan) dan lampiran/naskah dari BIMA */
  berkas: BerkasRincian[];
  /** id basis aturan versi yang dipakai (untuk tautan butir ke J-03) */
  basisAturanId: string | null;
}

/** `ref` boleh idProposal BIMA (mis. PRP-2026-0004) atau id baris proposal (uuid). Null bila tidak ada. */
export async function ambilRincianProposal(ref: string): Promise<RincianProposal | null> {
  const db = getDb();
  const [p] = await db
    .select({
      id: proposal.id,
      idProposal: proposal.idProposal,
      judul: proposal.judul,
      status: proposal.status,
      waktuTerkirim: proposal.waktuTerkirim,
      skemaId: skemaPendanaan.id,
      skemaNama: skemaPendanaan.namaSkema,
      skemaKode: skemaPendanaan.kode,
      periodeId: periodeSeleksi.id,
      periodeNama: periodeSeleksi.nama,
      namaPengusul: akun.nama,
      institusiPengusul: akun.institusi,
    })
    .from(proposal)
    .innerJoin(skemaPendanaan, eq(skemaPendanaan.id, proposal.skemaId))
    .innerJoin(periodeSeleksi, eq(periodeSeleksi.id, proposal.periodeId))
    .innerJoin(akun, eq(akun.id, proposal.pengusulId))
    .where(adalahUuid(ref) ? or(eq(proposal.idProposal, ref), eq(proposal.id, ref)) : eq(proposal.idProposal, ref));
  if (!p) return null;

  const versiMentah = await db
    .select({
      id: versiProposal.id,
      nomor: versiProposal.nomor,
      kode: versiProposal.kode,
      waktu: versiProposal.waktu,
      statusPemeriksaan: versiProposal.statusPemeriksaan,
      versiTemplat: templatProposal.versi,
      templatId: versiProposal.templatId,
      versiAturan: basisAturan.versi,
      basisAturanId: versiProposal.basisAturanId,
      berkasId: versiProposal.berkasId,
      namaBerkas: berkasVersi.nama,
    })
    .from(versiProposal)
    .leftJoin(templatProposal, eq(templatProposal.id, versiProposal.templatId))
    .leftJoin(basisAturan, eq(basisAturan.id, versiProposal.basisAturanId))
    .leftJoin(berkasVersi, eq(berkasVersi.id, versiProposal.berkasId))
    .where(eq(versiProposal.proposalId, p.id))
    .orderBy(desc(versiProposal.nomor));
  const versi: VersiRincian[] = versiMentah.map(({ basisAturanId: _b, ...v }) => {
    void _b;
    return v;
  });
  const versiDinilai = versi[0] ?? null;

  const hasil: HasilRincianProposal[] = versiDinilai
    ? (
        await db
          .select({
            butirId: hasilPemeriksaan.butirId,
            butirKode: hasilPemeriksaan.butirKode,
            deskripsi: butirCek.deskripsi,
            jenis: hasilPemeriksaan.jenis,
            bagian: hasilPemeriksaan.bagian,
            status: hasilPemeriksaan.status,
            angkaPembukti: hasilPemeriksaan.angkaPembukti,
            batasDilanggar: hasilPemeriksaan.batasDilanggar,
            rekomendasi: hasilPemeriksaan.rekomendasi,
            kutipan: hasilPemeriksaan.kutipan,
            tingkatKeyakinan: hasilPemeriksaan.tingkatKeyakinan,
            alasanSistem: hasilPemeriksaan.alasanSistem,
            tiruan: hasilPemeriksaan.tiruan,
            keputusanReviewer: koreksiRekomendasi.keputusanReviewer,
            alasan: koreksiRekomendasi.alasan,
            jenisKekeliruan: koreksiRekomendasi.jenisKekeliruan,
          })
          .from(hasilPemeriksaan)
          .innerJoin(butirCek, eq(butirCek.id, hasilPemeriksaan.butirId))
          .leftJoin(koreksiRekomendasi, eq(koreksiRekomendasi.hasilId, hasilPemeriksaan.id))
          .where(eq(hasilPemeriksaan.versiId, versiDinilai.id))
          .orderBy(asc(hasilPemeriksaan.butirKode))
      ).map(({ keputusanReviewer, alasan, jenisKekeliruan, ...h }) => ({
        ...h,
        koreksi: keputusanReviewer ? { keputusanReviewer, alasan: alasan ?? "", jenisKekeliruan: jenisKekeliruan ?? "" } : null,
      }))
    : [];

  const penugasanMentah = await db
    .select({
      id: penugasanReviewer.id,
      reviewerId: penugasanReviewer.reviewerId,
      namaReviewer: akun.nama,
      institusiReviewer: akun.institusi,
      status: penugasanReviewer.status,
      label: penugasanReviewer.label,
      tanggal: penugasanReviewer.tanggal,
      penilaianId: penilaian.id,
      statusPenilaian: penilaian.status,
      komentar: penilaian.komentar,
    })
    .from(penugasanReviewer)
    .innerJoin(akun, eq(akun.id, penugasanReviewer.reviewerId))
    .leftJoin(penilaian, eq(penilaian.penugasanId, penugasanReviewer.id))
    .where(eq(penugasanReviewer.proposalId, p.id))
    .orderBy(asc(penugasanReviewer.tanggal));
  const koreksiPer = new Map<string, number>();
  for (const x of penugasanMentah) {
    if (!x.penilaianId) continue;
    const baris = await db.select({ id: koreksiRekomendasi.id }).from(koreksiRekomendasi).where(eq(koreksiRekomendasi.penilaianId, x.penilaianId));
    koreksiPer.set(x.penilaianId, baris.length);
  }
  const penugasan: PenugasanRincian[] = penugasanMentah.map((x) => ({
    id: x.id,
    reviewerId: x.reviewerId,
    namaReviewer: x.namaReviewer,
    institusiReviewer: x.institusiReviewer,
    status: x.status,
    label: x.label,
    tanggal: x.tanggal,
    penilaian: x.penilaianId && x.statusPenilaian ? { status: x.statusPenilaian, komentar: x.komentar, jumlahKoreksi: koreksiPer.get(x.penilaianId) ?? 0 } : null,
  }));

  const bima = await db
    .select({ id: bimaBerkas.id, nama: bimaBerkas.nama, peran: bimaBerkas.peran, ukuran: bimaBerkas.ukuran, namaLampiran: bimaBerkas.namaLampiran })
    .from(bimaBerkas)
    .where(and(eq(bimaBerkas.proposalId, p.idProposal)))
    .orderBy(asc(bimaBerkas.peran), asc(bimaBerkas.dibuatPada));
  const idSemar = new Set(versi.filter((v) => v.berkasId).map((v) => v.berkasId as string));
  const berkas: BerkasRincian[] = [
    ...versi
      .filter((v) => v.berkasId)
      .map((v) => ({ id: v.berkasId as string, nama: v.namaBerkas ?? "Naskah", peran: "naskah", ukuran: 0, keterangan: `Naskah versi ${v.kode}` })),
    ...bima
      .filter((b) => !idSemar.has(b.id) && (b.peran !== "naskah" || idSemar.size === 0))
      .map((b) => ({ id: b.id, nama: b.nama, peran: b.peran, ukuran: b.ukuran, keterangan: b.namaLampiran ?? (b.peran === "naskah" ? "Naskah dari BIMA" : null) })),
  ];

  const [basis] = versiDinilai
    ? await db.select({ id: versiProposal.basisAturanId }).from(versiProposal).where(eq(versiProposal.id, versiDinilai.id))
    : [];

  return {
    id: p.id,
    idProposal: p.idProposal,
    judul: p.judul,
    status: p.status,
    waktuTerkirim: p.waktuTerkirim,
    skema: { id: p.skemaId, nama: p.skemaNama, kode: p.skemaKode },
    periode: { id: p.periodeId, nama: p.periodeNama },
    pengusul: { nama: p.namaPengusul, institusi: p.institusiPengusul },
    versi,
    versiDinilai,
    hasil,
    penugasan,
    berkas,
    basisAturanId: basis?.id ?? null,
  };
}
