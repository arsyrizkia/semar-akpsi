/**
 * Sisi BIMA tiruan untuk halaman pengajuan (agen C). Berkas baru, tidak mengubah servis.ts.
 * Hanya dipakai halaman dan route /bima/pengajuan. Menyimpan unggahan ke bima_proposal dan bima_berkas.
 *
 * Catatan batas sistem: daftar skema dan nama lampiran wajib dibaca dari tabel SEMAR (skema_pendanaan, templat_proposal)
 * karena BIMA tiruan berbagi satu basis data dengan SEMAR dan tidak memiliki katalog skema sendiri.
 */
import { and, desc, eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { bimaBerkas, bimaProposal, skemaPendanaan, templatProposal } from "@/db/schema";
import { simpanBerkas } from "../berkas";

export interface OpsiSkemaBima {
  kode: string;
  nama: string;
  /** nama lampiran wajib menurut templat terbit skema */
  lampiranWajib: string[];
}

export async function daftarSkemaBima(): Promise<OpsiSkemaBima[]> {
  const db = getDb();
  const skema = await db.select().from(skemaPendanaan).orderBy(skemaPendanaan.kode);
  const hasil: OpsiSkemaBima[] = [];
  for (const s of skema) {
    const [t] = await db
      .select({ lampiranWajib: templatProposal.lampiranWajib })
      .from(templatProposal)
      .where(and(eq(templatProposal.skemaId, s.id), eq(templatProposal.status, "Terbit")))
      .orderBy(desc(templatProposal.versi))
      .limit(1);
    hasil.push({ kode: s.kode, nama: s.namaSkema, lampiranWajib: t?.lampiranWajib ?? [] });
  }
  return hasil;
}

export interface UsulanBima {
  id: string;
  judul: string;
  skemaKode: string;
  statusBima: string;
  naskah: { nama: string } | null;
  lampiran: { namaLampiran: string; nama: string }[];
}

export async function daftarUsulanPengusul(idBima: string): Promise<UsulanBima[]> {
  const db = getDb();
  const proposal = await db.select().from(bimaProposal).where(eq(bimaProposal.pengusulIdBima, idBima)).orderBy(bimaProposal.id);
  const hasil: UsulanBima[] = [];
  for (const p of proposal) {
    const berkas = await db.select().from(bimaBerkas).where(eq(bimaBerkas.proposalId, p.id));
    const naskah = berkas.find((b) => b.peran === "naskah");
    hasil.push({
      id: p.id,
      judul: p.judul,
      skemaKode: p.skemaKode,
      statusBima: p.statusBima,
      naskah: naskah ? { nama: naskah.nama } : null,
      lampiran: berkas.filter((b) => b.peran === "lampiran" && b.namaLampiran).map((b) => ({ namaLampiran: b.namaLampiran!, nama: b.nama })),
    });
  }
  return hasil;
}

export async function ambilUsulanPengusul(idBima: string, id: string): Promise<UsulanBima | null> {
  return (await daftarUsulanPengusul(idBima)).find((u) => u.id === id) ?? null;
}

async function idProposalBerikut(tahun: number): Promise<string> {
  const awalan = `PRP-${tahun}-`;
  const ada = await getDb().select({ id: bimaProposal.id }).from(bimaProposal).where(like(bimaProposal.id, `${awalan}%`));
  const terbesar = ada.reduce((m, x) => Math.max(m, Number(x.id.slice(awalan.length)) || 0), 0);
  return `${awalan}${String(terbesar + 1).padStart(4, "0")}`;
}

export interface BerkasUnggahan {
  nama: string;
  tipe: string;
  bytes: Buffer;
}

export interface MasukanUsulan {
  pengusulIdBima: string;
  /** kosong untuk usulan baru */
  idProposal?: string;
  judul: string;
  skemaKode: string;
  naskah?: BerkasUnggahan;
  /** kunci = nama lampiran wajib */
  lampiran: Record<string, BerkasUnggahan>;
}

/**
 * Menyimpan usulan dan berkasnya di BIMA tiruan lalu menandainya "Diajukan ke SEMAR".
 * Berkas lama dengan peran/nama lampiran yang sama digantikan supaya API BIMA selalu menyajikan berkas terbaru.
 */
export async function simpanUsulanBima(m: MasukanUsulan): Promise<{ idProposal: string }> {
  const db = getDb();
  let id = m.idProposal;
  if (id) {
    const [ada] = await db.select().from(bimaProposal).where(eq(bimaProposal.id, id));
    if (!ada || ada.pengusulIdBima !== m.pengusulIdBima) throw new Error("usulan tidak ditemukan atau bukan milik pengusul");
    if (ada.statusBima === "Terkirim") throw new Error("usulan sudah terkirim dan tidak dapat diajukan ulang");
    await db.update(bimaProposal).set({ judul: m.judul, skemaKode: m.skemaKode, statusBima: "Diajukan ke SEMAR", diperbaruiPada: new Date() }).where(eq(bimaProposal.id, id));
  } else {
    id = await idProposalBerikut(new Date().getFullYear());
    await db.insert(bimaProposal).values({ id, judul: m.judul, skemaKode: m.skemaKode, pengusulIdBima: m.pengusulIdBima, statusBima: "Diajukan ke SEMAR" });
  }

  if (m.naskah) {
    await db.delete(bimaBerkas).where(and(eq(bimaBerkas.proposalId, id), eq(bimaBerkas.peran, "naskah")));
    const b = await simpanBerkas({ ruang: "bima", nama: m.naskah.nama, tipe: m.naskah.tipe, bytes: m.naskah.bytes, peran: "naskah", proposalId: id });
    await db.update(bimaProposal).set({ naskahBerkasId: b.id }).where(eq(bimaProposal.id, id));
  }
  for (const [namaLampiran, berkas] of Object.entries(m.lampiran)) {
    await db.delete(bimaBerkas).where(and(eq(bimaBerkas.proposalId, id), eq(bimaBerkas.peran, "lampiran"), eq(bimaBerkas.namaLampiran, namaLampiran)));
    await simpanBerkas({ ruang: "bima", nama: berkas.nama, tipe: berkas.tipe, bytes: berkas.bytes, peran: "lampiran", proposalId: id, namaLampiran });
  }
  return { idProposal: id };
}
