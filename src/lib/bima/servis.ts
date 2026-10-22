/**
 * Fungsi servis sisi BIMA tiruan. HANYA dipanggil dari route /api/bima/* dan halaman /bima/*.
 * Kode SEMAR tidak boleh mengimpor berkas ini; SEMAR memakai src/lib/bima/client.ts (HTTP).
 */
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { bimaAkun, bimaBerkas, bimaKotakMasuk, bimaProposal, bimaReviewer } from "@/db/schema";
import { ambilBerkas } from "../berkas";

export interface RingkasanProposalBima {
  id: string;
  judul: string;
  skemaKode: string;
  kataKunci: string | null;
  statusBima: string;
  pengusul: { idBima: string; nama: string; institusi: string; nomorInduk: string | null };
  naskah: { berkasId: string; nama: string; tipe: string } | null;
  lampiran: { berkasId: string; nama: string; tipe: string; namaLampiran: string | null }[];
}

export async function ambilProposalBima(idProposal: string): Promise<RingkasanProposalBima | null> {
  const db = getDb();
  const [p] = await db.select().from(bimaProposal).where(eq(bimaProposal.id, idProposal));
  if (!p) return null;
  const [u] = await db.select().from(bimaAkun).where(eq(bimaAkun.idBima, p.pengusulIdBima));
  const berkas = await db.select().from(bimaBerkas).where(eq(bimaBerkas.proposalId, idProposal));
  const naskah = berkas.find((b) => b.peran === "naskah");
  return {
    id: p.id,
    judul: p.judul,
    skemaKode: p.skemaKode,
    kataKunci: p.kataKunci,
    statusBima: p.statusBima,
    pengusul: { idBima: u.idBima, nama: u.nama, institusi: u.institusi, nomorInduk: u.nomorInduk },
    naskah: naskah ? { berkasId: naskah.id, nama: naskah.nama, tipe: naskah.tipe } : null,
    lampiran: berkas
      .filter((b) => b.peran === "lampiran")
      .map((b) => ({ berkasId: b.id, nama: b.nama, tipe: b.tipe, namaLampiran: b.namaLampiran })),
  };
}

export async function ambilBerkasBima(berkasId: string) {
  return ambilBerkas("bima", berkasId);
}

export async function daftarReviewerBima() {
  return getDb().select().from(bimaReviewer);
}

export interface PayloadPenugasan {
  periodeId?: string;
  penugasan: { idProposal: string; reviewerIdBima: string; tanggal: string; kunci?: string }[];
}
export async function terimaPenugasanDariSemar(p: PayloadPenugasan) {
  const db = getDb();
  if (!p.penugasan.length) return { diterima: 0 };
  // idempoten: pengiriman ulang (ulang otomatis klien atau "Kirim ulang") tidak menambah baris ganda untuk kunci yang sama.
  // Penjamin idempotensi adalah indeks unik parsial bima_kotak_masuk_kunci_uq (jenis, payload->>'kunci') + ON CONFLICT DO NOTHING, jadi dua
  // permintaan serentak untuk kelompok yang sama (percobaan ulang klien setelah batas waktu) tidak pernah menyisipkan baris ganda.
  // Satu pernyataan INSERT ... SELECT per kelompok (500 penugasan) supaya penerimaan skala 10.000 tetap cepat.
  const lihat = new Set<string>();
  const elemen = p.penugasan
    .filter((x) => {
      if (!x.kunci) return true;
      if (lihat.has(x.kunci)) return false;
      lihat.add(x.kunci);
      return true;
    })
    .map((x) => ({ ...x, periodeId: p.periodeId ?? null }));
  const hasil = await db.execute(sql`
    INSERT INTO bima_kotak_masuk (jenis, id_proposal, penerima_id_bima, payload)
    SELECT 'penugasan', e->>'idProposal', e->>'reviewerIdBima', e
    FROM jsonb_array_elements(${JSON.stringify(elemen)}::jsonb) AS e
    ON CONFLICT (jenis, (payload->>'kunci')) WHERE (payload->>'kunci') IS NOT NULL DO NOTHING
    RETURNING 1`);
  const diterima = (hasil as unknown as { rows: unknown[] }).rows.length;
  return { diterima, duplikat: p.penugasan.length - diterima };
}

export interface PayloadKeputusan {
  idProposal: string;
  reviewerIdBima: string;
  komponen: { komponen: string; keputusan: "Memenuhi" | "Tidak memenuhi" }[];
  umpanBalik: string;
  jumlahKoreksi?: number;
  kunci?: string;
}
export async function terimaKeputusanDariSemar(p: PayloadKeputusan) {
  const hasil = await getDb().execute(sql`
    INSERT INTO bima_kotak_masuk (jenis, id_proposal, penerima_id_bima, payload)
    VALUES ('keputusan', ${p.idProposal}, ${p.reviewerIdBima}, ${JSON.stringify(p)}::jsonb)
    ON CONFLICT (jenis, (payload->>'kunci')) WHERE (payload->>'kunci') IS NOT NULL DO NOTHING
    RETURNING 1`);
  const baru = (hasil as unknown as { rows: unknown[] }).rows.length;
  return baru ? { diterima: true } : { diterima: true, duplikat: true };
}

/** Cermin status pengajuan dari SEMAR ke halaman proposal BIMA ("Lihat hasil pemeriksaan"). */
export async function perbaruiStatusProposalBima(idProposal: string, statusBima: string) {
  await getDb().update(bimaProposal).set({ statusBima, diperbaruiPada: new Date() }).where(eq(bimaProposal.id, idProposal));
  return { ok: true };
}

export async function daftarKotakMasuk(batas = 100) {
  return getDb().select().from(bimaKotakMasuk).orderBy(desc(bimaKotakMasuk.diterimaPada)).limit(batas);
}

export interface RingkasanKotakMasuk {
  totalPenugasan: number;
  totalKeputusan: number;
  jumlahPenerima: number;
  /** penerima dengan penugasan terbanyak */
  penerimaTeratas: { penerimaIdBima: string; nama: string | null; jumlah: number }[];
}

/** Ringkasan kotak masuk (hitungan di basis data) supaya halaman tetap ringan walau berisi ribuan penugasan. */
export async function ringkasanKotakMasuk(): Promise<RingkasanKotakMasuk> {
  const db = getDb();
  const [jumlah] = await db
    .select({
      penugasan: sql<number>`count(*) filter (where ${bimaKotakMasuk.jenis} = 'penugasan')::int`,
      keputusan: sql<number>`count(*) filter (where ${bimaKotakMasuk.jenis} = 'keputusan')::int`,
      penerima: sql<number>`count(distinct ${bimaKotakMasuk.penerimaIdBima}) filter (where ${bimaKotakMasuk.jenis} = 'penugasan')::int`,
    })
    .from(bimaKotakMasuk);
  const teratas = await db
    .select({ penerimaIdBima: bimaKotakMasuk.penerimaIdBima, nama: bimaAkun.nama, jumlah: sql<number>`count(*)::int` })
    .from(bimaKotakMasuk)
    .leftJoin(bimaAkun, eq(bimaAkun.idBima, bimaKotakMasuk.penerimaIdBima))
    .where(eq(bimaKotakMasuk.jenis, "penugasan"))
    .groupBy(bimaKotakMasuk.penerimaIdBima, bimaAkun.nama)
    .orderBy(desc(sql`count(*)`), bimaKotakMasuk.penerimaIdBima)
    .limit(5);
  return {
    totalPenugasan: jumlah.penugasan,
    totalKeputusan: jumlah.keputusan,
    jumlahPenerima: jumlah.penerima,
    penerimaTeratas: teratas.map((t) => ({ penerimaIdBima: t.penerimaIdBima ?? "-", nama: t.nama, jumlah: t.jumlah })),
  };
}
