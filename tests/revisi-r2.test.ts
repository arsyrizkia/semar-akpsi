import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bimaBerkas, bimaKotakMasuk } from "@/db/schema";
import { terimaKeputusanDariSemar, terimaPenugasanDariSemar } from "@/lib/bima/servis";
import { siapkanJalanPintas } from "@/lib/demo/skenario";

const ada = Boolean(process.env.DATABASE_URL);

describe.skipIf(!ada)("revisi r2: idempotensi", () => {
  it("kotak masuk BIMA: kunci yang sama tidak menambah baris ganda (keputusan dan penugasan)", async () => {
    const kunci = `uji-${Date.now()}`;
    const k = { idProposal: "PRP-UJI", reviewerIdBima: "reviewer-uji", komponen: [], umpanBalik: "x", kunci };
    await terimaKeputusanDariSemar(k);
    await terimaKeputusanDariSemar(k);
    const p = { penugasan: [{ idProposal: "PRP-UJI", reviewerIdBima: "reviewer-uji", tanggal: new Date().toISOString(), kunci: `${kunci}-p` }] };
    await terimaPenugasanDariSemar(p);
    const lagi = await terimaPenugasanDariSemar(p);
    expect(lagi.diterima).toBe(0);
    const baris = await getDb().select().from(bimaKotakMasuk).where(eq(bimaKotakMasuk.idProposal, "PRP-UJI"));
    expect(baris.filter((b) => (b.payload as { kunci?: string }).kunci === kunci)).toHaveLength(1);
    expect(baris.filter((b) => (b.payload as { kunci?: string }).kunci === `${kunci}-p`)).toHaveLength(1);
    await getDb().delete(bimaKotakMasuk).where(eq(bimaKotakMasuk.idProposal, "PRP-UJI"));
  });

  it("kotak masuk BIMA: dua permintaan serentak untuk kelompok yang sama menghasilkan satu baris per kunci", async () => {
    const dasar = `serentak-${Date.now()}`;
    const kelompok = Array.from({ length: 200 }, (_, i) => ({ idProposal: "PRP-SERENTAK", reviewerIdBima: "reviewer-uji", tanggal: new Date().toISOString(), kunci: `${dasar}-${i}` }));
    await Promise.all([terimaPenugasanDariSemar({ penugasan: kelompok }), terimaPenugasanDariSemar({ penugasan: kelompok }), terimaPenugasanDariSemar({ penugasan: kelompok })]);
    const baris = await getDb().select().from(bimaKotakMasuk).where(eq(bimaKotakMasuk.idProposal, "PRP-SERENTAK"));
    expect(baris).toHaveLength(200);
    await getDb().delete(bimaKotakMasuk).where(eq(bimaKotakMasuk.idProposal, "PRP-SERENTAK"));
  });

  it("jalan pintas UC-05b: naskah BIMA dipulihkan ke seed pada pemakaian berulang", async () => {
    const db = getDb();
    const naskah = async () => (await db.select().from(bimaBerkas).where(and(eq(bimaBerkas.proposalId, "PRP-2026-0002"), eq(bimaBerkas.peran, "naskah")))).map((b) => b.nama);
    await siapkanJalanPintas("UC-05b");
    const pertama = await naskah();
    // simulasikan "Pakai naskah perbaikan": berkas naskah diganti
    await db.update(bimaBerkas).set({ nama: "naskah-perbaikan-contoh.docx" }).where(and(eq(bimaBerkas.proposalId, "PRP-2026-0002"), eq(bimaBerkas.peran, "naskah")));
    await siapkanJalanPintas("UC-05b");
    expect(await naskah()).toEqual(pertama);
    expect(pertama).toEqual(["PRP-2026-0002-proposal.docx"]);
  });
});
