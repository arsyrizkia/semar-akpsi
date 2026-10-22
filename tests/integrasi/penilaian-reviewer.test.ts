// Uji integrasi pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
/**
 * Integrasi UC-07/08/09 terhadap basis data pengembangan (dilewati tanpa DATABASE_URL).
 * Memakai skenario seed PRP-2026-0004 (penugasan reviewer-2). Penugasan uji dibuat sendiri dan dihapus lagi;
 * hasil semantik (mode tiruan) dibiarkan karena memang bahan skenario siap-reviewer.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

const terkirim: unknown[] = [];
let bimaGagal = false;
vi.mock("@/lib/bima/client", () => ({
  bima: {
    kirimKeputusan: async (p: unknown) => {
      if (bimaGagal) throw new Error("BIMA tidak dapat dihubungi");
      terkirim.push(p);
      return { diterima: true };
    },
  },
}));

const ada = !!process.env.DATABASE_URL;

describe.skipIf(!ada)("UC-07/08/09 basis data", () => {
  let db: ReturnType<typeof import("@/db").getDb>;
  let S: typeof import("@/db/schema");
  let L: typeof import("@/lib/penilaian/layanan");
  let akunR2: typeof import("@/db/schema").akun.$inferSelect;
  let akunR1: typeof import("@/db/schema").akun.$inferSelect;
  let penugasanId = "";
  let versiId = "";

  beforeAll(async () => {
    process.env.SEMAR_LLM_MODE = "tiruan";
    const dbMod = await import("@/db");
    db = dbMod.getDb();
    S = await import("@/db/schema");
    L = await import("@/lib/penilaian/layanan");
    const [p] = await db.select().from(S.proposal).where(eq(S.proposal.idProposal, "PRP-2026-0004"));
    const [v] = await db.select().from(S.versiProposal).where(eq(S.versiProposal.proposalId, p.id));
    versiId = v.id;
    [akunR2] = await db.select().from(S.akun).where(eq(S.akun.idBima, "reviewer-2"));
    [akunR1] = await db.select().from(S.akun).where(eq(S.akun.idBima, "reviewer-1"));
    const [pg] = await db
      .insert(S.penugasanReviewer)
      .values({ proposalId: p.id, versiId: v.id, reviewerId: akunR2.id, periodeId: p.periodeId, status: "Ditetapkan", label: "Baru" })
      .returning();
    penugasanId = pg.id;
  });

  afterAll(async () => {
    if (penugasanId) await db.delete(S.penugasanReviewer).where(eq(S.penugasanReviewer.id, penugasanId));
  });

  it("IT-penilaian-01: UC-09: jalankanPemeriksaanSemantik menyimpan hasil per butir semantik, kutipan sah, berlabel tiruan", async () => {
    const { jalankanPemeriksaanSemantik } = await import("@/lib/pemeriksa/semantik");
    const r = await jalankanPemeriksaanSemantik(versiId);
    expect(r.jumlahButir).toBeGreaterThan(0);
    expect(r.tiruan).toBe(true);
    const baris = await db.select().from(S.hasilPemeriksaan).where(and(eq(S.hasilPemeriksaan.versiId, versiId), eq(S.hasilPemeriksaan.jenis, "semantik")));
    expect(baris.length).toBe(r.jumlahButir);
    expect(baris.every((b) => b.tiruan)).toBe(true);
    const [job] = await db.select().from(S.jobSemantik).where(eq(S.jobSemantik.versiId, versiId));
    expect(job.status).toBe("Selesai");
  }, 60_000);

  it("IT-penilaian-02: NFR 3.1: reviewer lain mendapat 403; reviewer pemilik lolos", async () => {
    expect((await L.periksaAkses(penugasanId, akunR1)).ok).toBe(false);
    const x = await L.periksaAkses(penugasanId, akunR1);
    expect(!x.ok && x.kode).toBe(403);
    expect((await L.periksaAkses(penugasanId, akunR2)).ok).toBe(true);
    const tak = await L.periksaAkses("bukan-uuid", akunR2);
    expect(!tak.ok && tak.kode).toBe(404);
  });

  it("IT-penilaian-03: J-07 hanya memuat penugasan milik sendiri", async () => {
    const r2 = await L.daftarPenugasanReviewer(akunR2.id);
    expect(r2.some((b) => b.penugasanId === penugasanId)).toBe(true);
    const r1 = await L.daftarPenugasanReviewer(akunR1.id);
    expect(r1.some((b) => b.penugasanId === penugasanId)).toBe(false);
  });

  it("IT-penilaian-04: J-08 memuat tab, butir, dan membuka cepat tanpa LLM (NFR 2.3)", async () => {
    const a = await L.periksaAkses(penugasanId, akunR2);
    if (!a.ok) throw new Error("akses");
    await L.muatPemeriksaan(a.penugasan); // pemanasan kolam sambungan (server sungguhan sudah hangat)
    const t0 = Date.now();
    const data = await L.muatPemeriksaan(a.penugasan);
    expect(Date.now() - t0).toBeLessThan(3000);
    expect(data.tab.length).toBeGreaterThan(3);
    expect(data.butir.length).toBeGreaterThan(0);
    expect(data.semantik.siap).toBe(true);
    expect(data.deterministik.gagal).toBe(0);
    expect(data.penilaian.status).toBe("Draf");
    for (const b of data.butir) expect(data.tab.some((t) => t.nama === b.tab)).toBe(true);
  });

  it("IT-penilaian-05: UC-08: koreksi tanpa alasan ditolak; dengan alasan tersimpan dan rekomendasi semula tidak berubah", async () => {
    const a = await L.periksaAkses(penugasanId, akunR2);
    if (!a.ok) throw new Error("akses");
    const data = await L.muatPemeriksaan(a.penugasan);
    const b = data.butir[0];
    const tolak = await L.simpanKoreksi(penugasanId, akunR2, b.hasilId, { keputusan: "Memenuhi", alasan: "", jenisKekeliruan: "Salah tafsir isi" });
    expect(tolak.ok).toBe(false);
    const ok = await L.simpanKoreksi(penugasanId, akunR2, b.hasilId, { keputusan: b.rekomendasi === "Memenuhi" ? "Tidak memenuhi" : "Memenuhi", alasan: "Tafsir keliru", jenisKekeliruan: "Salah tafsir isi" });
    expect(ok.ok).toBe(true);
    const lagi = await L.muatPemeriksaan(a.penugasan);
    expect(lagi.butir[0].koreksi?.alasan).toBe("Tafsir keliru");
    expect(lagi.butir[0].rekomendasi).toBe(b.rekomendasi);
    // reviewer lain tidak boleh mengoreksi
    const x = await L.simpanKoreksi(penugasanId, akunR1, b.hasilId, { keputusan: "Memenuhi", alasan: "x", jenisKekeliruan: "Lainnya" });
    expect(x.ok).toBe(false);
  });

  it("IT-penilaian-06: S-1: simpan sementara memberi label Draf tanpa log audit dan tanpa kirim ke BIMA", async () => {
    const sebelum = (await db.select().from(S.logAudit).where(eq(S.logAudit.aksi, "penilaian.simpan_permanen"))).length;
    const r = await L.simpanSementara(penugasanId, akunR2, { umpanBalik: "Draf umpan balik", komponen: { [(await import("@/lib/kontrak/tipe")).KOMPONEN_BORANG[0]]: "Memenuhi" } });
    expect(r.ok).toBe(true);
    const [pg] = await db.select().from(S.penugasanReviewer).where(eq(S.penugasanReviewer.id, penugasanId));
    expect(pg.label).toBe("Draf");
    expect((await db.select().from(S.logAudit).where(eq(S.logAudit.aksi, "penilaian.simpan_permanen"))).length).toBe(sebelum);
    expect(terkirim.length).toBe(0);
  });

  it("IT-penilaian-07: simpan permanen menolak komponen belum lengkap; lengkap -> Final, Selesai, log audit, terkirim ke BIMA", async () => {
    const { KOMPONEN_BORANG } = await import("@/lib/kontrak/tipe");
    const sebagian = await L.simpanPermanen(penugasanId, akunR2, { umpanBalik: "x", komponen: { [KOMPONEN_BORANG[0]]: "Memenuhi" } });
    expect(sebagian.ok).toBe(false);
    const lengkap = Object.fromEntries(KOMPONEN_BORANG.map((k) => [k, "Memenuhi"]));
    bimaGagal = true;
    const gagal = await L.simpanPermanen(penugasanId, akunR2, { umpanBalik: "Umpan balik akhir", komponen: lengkap });
    expect(gagal.ok && gagal.terkirim).toBe(false);
    const [pg] = await db.select().from(S.penugasanReviewer).where(eq(S.penugasanReviewer.id, penugasanId));
    expect(pg.status).toBe("Selesai");
    expect(pg.label).toBe("Selesai");
    bimaGagal = false;
    const ulang = await L.kirimUlangKeBima(penugasanId, akunR2);
    expect(ulang.ok).toBe(true);
    expect(terkirim.length).toBe(1);
    const [pen] = await db.select().from(S.penilaian).where(eq(S.penilaian.penugasanId, penugasanId));
    expect(pen.status).toBe("Final");
    expect(pen.dikirimKeBimaPada).not.toBeNull();
    const final = await L.simpanSementara(penugasanId, akunR2, { umpanBalik: "ubah", komponen: lengkap });
    expect(final.ok).toBe(false);
  });
});
