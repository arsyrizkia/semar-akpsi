// Uji integrasi pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
/**
 * Integrasi jalankan ulang pemeriksaan semantik (C-34) terhadap basis data pengembangan. Hanya membaca keadaan semantik
 * skenario seed PRP-2026-0004 (tidak menulis job atau hasil); penugasan uji dibuat sendiri dan dihapus lagi.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const ada = !!process.env.DATABASE_URL;

describe.skipIf(!ada)("jalankan ulang pemeriksaan semantik: basis data", () => {
  let db: ReturnType<typeof import("@/db").getDb>;
  let S: typeof import("@/db/schema");
  let L: typeof import("@/lib/penilaian/layanan");
  let akunR1: typeof import("@/db/schema").akun.$inferSelect;
  let akunR2: typeof import("@/db/schema").akun.$inferSelect;
  let penugasanId = "";
  let versiId = "";

  beforeAll(async () => {
    process.env.SEMAR_LLM_MODE = "tiruan";
    db = (await import("@/db")).getDb();
    S = await import("@/db/schema");
    L = await import("@/lib/penilaian/layanan");
    const [p] = await db.select().from(S.proposal).where(eq(S.proposal.idProposal, "PRP-2026-0004"));
    const [v] = await db.select().from(S.versiProposal).where(eq(S.versiProposal.proposalId, p.id));
    versiId = v.id;
    [akunR1] = await db.select().from(S.akun).where(eq(S.akun.idBima, "reviewer-1"));
    [akunR2] = await db.select().from(S.akun).where(eq(S.akun.idBima, "reviewer-2"));
    const [pg] = await db
      .insert(S.penugasanReviewer)
      .values({ proposalId: p.id, versiId: v.id, reviewerId: akunR2.id, periodeId: p.periodeId, status: "Ditetapkan", label: "Baru" })
      .returning();
    penugasanId = pg.id;
  });

  afterAll(async () => {
    if (penugasanId) await db.delete(S.penugasanReviewer).where(eq(S.penugasanReviewer.id, penugasanId));
  });

  it("IT-jalankanUlang-01: NFR 3.1: reviewer lain ditolak dan tidak menambah job", async () => {
    const sebelum = await db.select().from(S.jobSemantik).where(eq(S.jobSemantik.versiId, versiId));
    const r = await L.jalankanUlangPemeriksaanSemantik(penugasanId, akunR1);
    expect(r.ok).toBe(false);
    const sesudah = await db.select().from(S.jobSemantik).where(eq(S.jobSemantik.versiId, versiId));
    expect(sesudah.length).toBe(sebelum.length);
  });

  it("IT-jalankanUlang-02: hasil semantik sudah tersedia: ditolak dengan pesan jelas dan antrean tidak berubah", async () => {
    const { bacaKeadaanSemantik } = await import("@/lib/pemeriksa/semantik/jalankan");
    const { jalankanPemeriksaanSemantik } = await import("@/lib/pemeriksa/semantik");
    await jalankanPemeriksaanSemantik(versiId); // bahan skenario siap-reviewer (mode tiruan), sama dengan IT-penilaian-01
    expect((await bacaKeadaanSemantik(versiId)).adaHasil).toBe(true);
    const sebelum = await db.select().from(S.jobSemantik).where(eq(S.jobSemantik.versiId, versiId));
    const r = await L.jalankanUlangPemeriksaanSemantik(penugasanId, akunR2);
    expect(!r.ok && r.galat).toMatch(/sudah tersedia/);
    const sesudah = await db.select().from(S.jobSemantik).where(eq(S.jobSemantik.versiId, versiId));
    expect(sesudah.length).toBe(sebelum.length);
  }, 60_000);
});
