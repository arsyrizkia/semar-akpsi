/**
 * Fungsi servis sisi BIMA tiruan. HANYA dipanggil dari route /api/bima/* dan halaman /bima/*.
 * Kode SEMAR tidak boleh mengimpor berkas ini; SEMAR memakai src/lib/bima/client.ts (HTTP).
 */
import { and, desc, eq, sql } from "drizzle-orm";
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

/** Idempotensi tanpa mengubah skema: kunci disimpan di payload dan diperiksa sebelum insert. */
async function sudahAda(jenis: string, kunci: string): Promise<boolean> {
  const [ada] = await getDb()
    .select({ id: bimaKotakMasuk.id })
    .from(bimaKotakMasuk)
    .where(and(eq(bimaKotakMasuk.jenis, jenis), sql`${bimaKotakMasuk.payload}->>'kunci' = ${kunci}`))
    .limit(1);
  return Boolean(ada);
}

export interface PayloadPenugasan {
  periodeId?: string;
  penugasan: { idProposal: string; reviewerIdBima: string; tanggal: string; kunci?: string }[];
}
export async function terimaPenugasanDariSemar(p: PayloadPenugasan) {
  const db = getDb();
  if (!p.penugasan.length) return { diterima: 0 };
  // idempoten: pengiriman ulang (ulang otomatis klien atau "Kirim ulang") tidak menambah baris ganda untuk kunci yang sama
  const baru = [];
  for (const x of p.penugasan) {
    if (!x.kunci || !(await sudahAda("penugasan", x.kunci))) baru.push(x);
  }
  if (!baru.length) return { diterima: 0, duplikat: p.penugasan.length };
  await db.insert(bimaKotakMasuk).values(
    baru.map((x) => ({
      jenis: "penugasan",
      idProposal: x.idProposal,
      penerimaIdBima: x.reviewerIdBima,
      payload: { ...x, periodeId: p.periodeId ?? null },
    })),
  );
  return { diterima: baru.length };
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
  if (p.kunci && (await sudahAda("keputusan", p.kunci))) return { diterima: true, duplikat: true };
  await getDb().insert(bimaKotakMasuk).values({
    jenis: "keputusan",
    idProposal: p.idProposal,
    penerimaIdBima: p.reviewerIdBima,
    payload: p as unknown as Record<string, unknown>,
  });
  return { diterima: true };
}

/** Cermin status pengajuan dari SEMAR ke halaman proposal BIMA ("Lihat hasil pemeriksaan"). */
export async function perbaruiStatusProposalBima(idProposal: string, statusBima: string) {
  await getDb().update(bimaProposal).set({ statusBima, diperbaruiPada: new Date() }).where(eq(bimaProposal.id, idProposal));
  return { ok: true };
}

export async function daftarKotakMasuk(batas = 100) {
  return getDb().select().from(bimaKotakMasuk).orderBy(desc(bimaKotakMasuk.diterimaPada)).limit(batas);
}
