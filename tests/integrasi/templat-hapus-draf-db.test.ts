// Uji integrasi hapusDraf pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { bagianTemplat, skemaPendanaan, templatProposal } from "@/db/schema";
import { hapusDraf, type Pelaku } from "@/lib/templat/layanan";

const ada = Boolean(process.env.DATABASE_URL);
const kode = `TES-H-${Date.now().toString(36)}`.toUpperCase();
const pelaku: Pelaku = { id: null, idBima: "tes-hapus-draf" };

describe.skipIf(!ada)("IT-hapusDraf: hapus draf templat pada skema sementara", () => {
  let skemaId = "";
  const id = { draf: "", terbit: "", arsip: "" };

  afterAll(async () => {
    if (!skemaId) return;
    const db = getDb();
    try {
      const t = await db.select({ id: templatProposal.id }).from(templatProposal).where(eq(templatProposal.skemaId, skemaId));
      if (t.length) await db.delete(bagianTemplat).where(inArray(bagianTemplat.templatId, t.map((x) => x.id)));
      await db.delete(templatProposal).where(eq(templatProposal.skemaId, skemaId));
      await db.delete(skemaPendanaan).where(eq(skemaPendanaan.id, skemaId));
    } catch {
      /* data uji dibersihkan sebisanya */
    }
  });

  it("IT-hapusDraf-01: siapkan skema dengan satu templat Arsip, Terbit, dan Draf", async () => {
    const db = getDb();
    const [s] = await db.insert(skemaPendanaan).values({ kode, namaSkema: `Skema Uji ${kode}`, contoh: true }).returning();
    skemaId = s.id;
    const buat = async (versi: number, status: "Draf" | "Terbit" | "Arsip") => {
      const [t] = await db.insert(templatProposal).values({ skemaId, versi, status }).returning();
      await db.insert(bagianTemplat).values({ templatId: t.id, urutan: 1, nama: "Ringkasan", wajib: true });
      return t.id;
    };
    id.arsip = await buat(1, "Arsip");
    id.terbit = await buat(2, "Terbit");
    id.draf = await buat(3, "Draf");
    expect(skemaId).not.toBe("");
  });

  it("IT-hapusDraf-02: bukan pengelola ditolak dan draf tetap ada", async () => {
    const r = await hapusDraf(id.draf, null);
    expect(r.ok).toBe(false);
    expect(await getDb().select().from(templatProposal).where(eq(templatProposal.id, id.draf))).toHaveLength(1);
  });

  it("IT-hapusDraf-03: Terbit dan Arsip ditolak dan tidak berubah", async () => {
    for (const x of [id.terbit, id.arsip]) {
      const r = await hapusDraf(x, pelaku);
      expect(r.ok).toBe(false);
      expect(await getDb().select().from(templatProposal).where(eq(templatProposal.id, x))).toHaveLength(1);
    }
  });

  it("IT-hapusDraf-04: id tidak ada dan id bukan uuid ditolak", async () => {
    expect((await hapusDraf("00000000-0000-4000-8000-000000000000", pelaku)).ok).toBe(false);
    expect((await hapusDraf("bukan-uuid", pelaku)).ok).toBe(false);
  });

  it("IT-hapusDraf-05: Draf terhapus beserta bagiannya; templat Terbit dan Arsip tidak berubah", async () => {
    const r = await hapusDraf(id.draf, pelaku);
    expect(r).toMatchObject({ ok: true, versi: 3, skemaId });
    const db = getDb();
    expect(await db.select().from(templatProposal).where(eq(templatProposal.id, id.draf))).toHaveLength(0);
    expect(await db.select().from(bagianTemplat).where(eq(bagianTemplat.templatId, id.draf))).toHaveLength(0);
    const sisa = await db.select().from(templatProposal).where(eq(templatProposal.skemaId, skemaId));
    expect(sisa.map((t) => t.status).sort()).toEqual(["Arsip", "Terbit"]);
  });
});
