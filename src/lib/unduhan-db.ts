/** Pembacaan basis data untuk rute unduhan (api/semar/*). Fungsi murni ada di unduhan.ts. */
import { and, asc, desc, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { bagianTemplat, bimaBerkas, penugasanReviewer, periodeSeleksi, proposal, skemaPendanaan, templatProposal, versiProposal } from "@/db/schema";
import type { BagianTemplatDto } from "@/lib/kontrak/tipe";
import type { IdentitasTemplatDokumen, PeriodeDokumen, SkemaDokumen } from "@/lib/templat/dokumen";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const adalahUuid = (s: string) => UUID.test(s);

/* ------------------------------ templat ------------------------------ */
export interface DataTemplatUnduh {
  templat: IdentitasTemplatDokumen & { id: string; lampiranWajib: string[] };
  bagian: BagianTemplatDto[];
  skema: SkemaDokumen & { id: string };
  periode: (PeriodeDokumen & { tahun: number }) | null;
}

async function lengkapiTemplat(t: typeof templatProposal.$inferSelect): Promise<DataTemplatUnduh> {
  const db = getDb();
  const [bagian, [skema], periode] = await Promise.all([
    db.select().from(bagianTemplat).where(eq(bagianTemplat.templatId, t.id)).orderBy(asc(bagianTemplat.urutan)),
    db.select().from(skemaPendanaan).where(eq(skemaPendanaan.id, t.skemaId)),
    t.periodeBerlakuId ? db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, t.periodeBerlakuId)) : Promise.resolve([]),
  ]);
  return {
    templat: { id: t.id, versi: t.versi, status: t.status, lampiranWajib: t.lampiranWajib },
    bagian: bagian.map((b) => ({ urutan: b.urutan, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })),
    skema: { id: skema.id, kode: skema.kode, namaSkema: skema.namaSkema },
    periode: periode[0] ? { nama: periode[0].nama, tahun: periode[0].tahun } : null,
  };
}

export async function dataTemplatById(idTemplat: string): Promise<DataTemplatUnduh | null> {
  if (!adalahUuid(idTemplat)) return null;
  const [t] = await getDb().select().from(templatProposal).where(eq(templatProposal.id, idTemplat));
  return t ? lengkapiTemplat(t) : null;
}

/** Templat Terbit terbaru sebuah skema; `idSkema` boleh id (uuid) atau kode skema. */
export async function dataTemplatTerbit(idSkema: string): Promise<DataTemplatUnduh | null> {
  const db = getDb();
  const [skema] = await db
    .select()
    .from(skemaPendanaan)
    .where(adalahUuid(idSkema) ? or(eq(skemaPendanaan.id, idSkema), eq(skemaPendanaan.kode, idSkema)) : eq(skemaPendanaan.kode, idSkema));
  if (!skema) return null;
  const [t] = await db
    .select()
    .from(templatProposal)
    .where(and(eq(templatProposal.skemaId, skema.id), eq(templatProposal.status, "Terbit")))
    .orderBy(desc(templatProposal.versi))
    .limit(1);
  return t ? lengkapiTemplat(t) : null;
}

/* ------------------------------ berkas proposal ------------------------------ */
export interface ProposalUnduh {
  id: string;
  idProposal: string;
}

/** `ref` boleh idProposal BIMA (mis. PRP-2026-0004) atau id baris proposal (uuid). */
export async function cariProposal(ref: string): Promise<ProposalUnduh | null> {
  const [p] = await getDb()
    .select({ id: proposal.id, idProposal: proposal.idProposal })
    .from(proposal)
    .where(adalahUuid(ref) ? or(eq(proposal.idProposal, ref), eq(proposal.id, ref)) : eq(proposal.idProposal, ref));
  return p ?? null;
}

export async function adaPenugasanTetap(proposalId: string, reviewerId: string): Promise<boolean> {
  const baris = await getDb()
    .select({ status: penugasanReviewer.status })
    .from(penugasanReviewer)
    .where(and(eq(penugasanReviewer.proposalId, proposalId), eq(penugasanReviewer.reviewerId, reviewerId)));
  return baris.some((b) => b.status !== "Diusulkan");
}

/** Ruang berkas bila `idBerkas` milik proposal ini (naskah versi SEMAR, atau naskah/lampiran di BIMA); null bila bukan miliknya. */
export async function ruangBerkasProposal(p: ProposalUnduh, idBerkas: string): Promise<"semar" | "bima" | null> {
  if (!adalahUuid(idBerkas)) return null;
  const db = getDb();
  const [v] = await db
    .select({ id: versiProposal.id })
    .from(versiProposal)
    .where(and(eq(versiProposal.proposalId, p.id), eq(versiProposal.berkasId, idBerkas)))
    .limit(1);
  if (v) return "semar";
  const [b] = await db
    .select({ id: bimaBerkas.id })
    .from(bimaBerkas)
    .where(and(eq(bimaBerkas.id, idBerkas), eq(bimaBerkas.proposalId, p.idProposal)))
    .limit(1);
  return b ? "bima" : null;
}
