// Uji integrasi pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
/**
 * Uji integrasi UC-05 + UC-06 terhadap basis data (dilewati bila DATABASE_URL tidak ada).
 * Klien BIMA diganti pemanggilan langsung ke servis BIMA tiruan (tanpa server HTTP); sisanya nyata.
 * Hanya menyentuh PRP-2026-0001 s.d. 0003 dan membersihkannya sesudahnya; sakelar masa pengusulan dipulihkan.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { akun, berkasVersi, bimaProposal, hasilPemeriksaan, proposal, versiProposal } from "@/db/schema";
import { ambilPengaturanDemo, ubahPengaturanDemo } from "@/lib/waktu";
import { ambilStatusPengajuan, mulaiPengajuan } from "@/lib/pengajuan/layanan";
import type { KlaimPengajuan } from "@/lib/pengajuan/token";

vi.mock("@/lib/bima/client", async () => {
  const s = await import("@/lib/bima/servis");
  return {
    bima: {
      ambilProposal: async (id: string) => {
        const p = await s.ambilProposalBima(id);
        if (!p) throw new Error("tidak ada");
        return p;
      },
      ambilBerkas: async (id: string) => {
        const b = await s.ambilBerkasBima(id);
        if (!b) throw new Error("berkas tidak ada");
        return { bytes: b.bytes, tipe: b.tipe };
      },
      kirimStatusProposal: async (id: string, status: string) => s.perbaruiStatusProposalBima(id, status),
    },
  };
});

const ada = Boolean(process.env.DATABASE_URL);
const ID = ["PRP-2026-0001", "PRP-2026-0002", "PRP-2026-0003"];
let masaAwal: "berjalan" | "ditutup" = "berjalan";
let pengusul: typeof akun.$inferSelect[] = [];

const klaim = (idProposal: string, idBima: string, n: number): KlaimPengajuan => ({ idProposal, idBima, judul: "x", skemaKode: "PD", jti: `uji-${Date.now()}-${n}` });
const tampung = () => {
  const kerja: (() => Promise<void>)[] = [];
  return { jadwal: (k: () => Promise<void>) => void kerja.push(k), jalankan: async () => void (await Promise.all(kerja.map((k) => k()))) };
};

async function bersihkan() {
  const db = getDb();
  const baris = await db.select().from(proposal).where(inArray(proposal.idProposal, ID));
  const idP = baris.map((b) => b.id);
  if (idP.length) {
    const versi = await db.select().from(versiProposal).where(inArray(versiProposal.proposalId, idP));
    await db.delete(proposal).where(inArray(proposal.id, idP));
    const berkas = versi.map((v) => v.berkasId).filter((x): x is string => Boolean(x));
    if (berkas.length) await db.delete(berkasVersi).where(inArray(berkasVersi.id, berkas));
  }
  await db.update(bimaProposal).set({ statusBima: "Draf" }).where(inArray(bimaProposal.id, ID));
}

describe.skipIf(!ada)("UC-05 dan UC-06 pada basis data", () => {
  beforeAll(async () => {
    masaAwal = (await ambilPengaturanDemo()).masaPengusulan;
    await ubahPengaturanDemo({ masaPengusulan: "berjalan" });
    pengusul = await getDb().select().from(akun).where(inArray(akun.idBima, ["pengusul-1", "pengusul-2", "pengusul-3"]));
    await bersihkan();
  }, 120_000);
  afterAll(async () => {
    await bersihkan();
    await ubahPengaturanDemo({ masaPengusulan: masaAwal });
  }, 120_000);

  const dari = (idBima: string) => pengusul.find((a) => a.idBima === idBima)!;

  it("IT-pengajuan-01: contoh A: semua butir lolos, proposal Terkirim dengan bukti pengiriman", async () => {
    const t = tampung();
    const r = await mulaiPengajuan(klaim(ID[0], "pengusul-1", 1), dari("pengusul-1"), t.jadwal);
    expect(r.status).toBe("diproses");
    const sebelum = await ambilStatusPengajuan(ID[0], dari("pengusul-1").id);
    expect(sebelum?.sedangDiperiksa).toBe(true);
    await t.jalankan();
    const d = (await ambilStatusPengajuan(ID[0], dari("pengusul-1").id))!;
    expect(d.proposal.status).toBe("Terkirim");
    expect(d.versi?.kode).toBe("V1");
    expect(d.hasil.length).toBeGreaterThan(15);
    expect(d.hasil.every((h) => h.status === "Lolos")).toBe(true);
    expect(d.proposal.waktuTerkirim).toBeTruthy();
    const [bima] = await getDb().select().from(bimaProposal).where(eq(bimaProposal.id, ID[0]));
    expect(bima.statusBima).toBe("Terkirim");
  }, 180_000);

  it("IT-pengajuan-02: token yang sama tidak membuat versi ganda", async () => {
    const t = tampung();
    const k = klaim(ID[1], "pengusul-2", 2);
    expect((await mulaiPengajuan(k, dari("pengusul-2"), t.jadwal)).status).toBe("diproses");
    expect((await mulaiPengajuan(k, dari("pengusul-2"), t.jadwal)).status).toBe("duplikat");
    await t.jalankan();
    const versi = await getDb().select().from(versiProposal).where(eq(versiProposal.proposalId, (await ambilStatusPengajuan(ID[1], dari("pengusul-2").id))!.proposal.id));
    expect(versi).toHaveLength(1);
  }, 180_000);

  it("IT-pengajuan-03: contoh B: Ditahan, butir gagal paling atas dengan bagian dan batas; diajukan ulang tanpa batas token membuat versi baru", async () => {
    const d = (await ambilStatusPengajuan(ID[1], dari("pengusul-2").id))!;
    expect(d.proposal.status).toBe("Ditahan");
    expect(d.hasil[0]).toMatchObject({ kode: "KTA-04", status: "Gagal", bagian: "Metode" });
    expect(d.hasil[0].batasDilanggar).toContain("batas 1.200 kata");
    expect(d.hasil.slice(1).every((h) => h.status === "Lolos")).toBe(true);
    const [semantik] = await getDb().select().from(hasilPemeriksaan).where(eq(hasilPemeriksaan.versiId, d.versi!.id)).limit(1);
    expect(semantik?.jenis).toBe("deterministik");

    for (let i = 3; i <= 4; i++) {
      const t = tampung();
      expect((await mulaiPengajuan(klaim(ID[1], "pengusul-2", i), dari("pengusul-2"), t.jadwal)).status).toBe("diproses");
      await t.jalankan();
    }
    const d2 = (await ambilStatusPengajuan(ID[1], dari("pengusul-2").id))!;
    expect(d2.versi?.kode).toBe("V3");
    expect(d2.proposal.status).toBe("Ditahan");
  }, 180_000);

  it("IT-pengajuan-04: contoh C lalu masa ditutup: Ditahan, kemudian Ditolak tanpa versi baru (3a)", async () => {
    const t = tampung();
    await mulaiPengajuan(klaim(ID[2], "pengusul-3", 6), dari("pengusul-3"), t.jadwal);
    await t.jalankan();
    const c = (await ambilStatusPengajuan(ID[2], dari("pengusul-3").id))!;
    expect(c.proposal.status).toBe("Ditahan");
    expect(c.hasil.filter((h) => h.status === "Gagal").map((h) => h.kode).sort()).toEqual(["KAT-01", "SIT-03"]);

    await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
    const t2 = tampung();
    const r = await mulaiPengajuan(klaim(ID[2], "pengusul-3", 7), dari("pengusul-3"), t2.jadwal);
    expect(r.status).toBe("ditolak");
    await t2.jalankan();
    const d = (await ambilStatusPengajuan(ID[2], dari("pengusul-3").id))!;
    expect(d.proposal.status).toBe("Ditolak");
    expect(d.versi?.kode).toBe("V1");
    await ubahPengaturanDemo({ masaPengusulan: "berjalan" });
  }, 180_000);

  it("IT-pengajuan-05: proposal milik pengusul lain tidak dapat dibuka atau diajukan", async () => {
    expect(await ambilStatusPengajuan(ID[0], dari("pengusul-2").id)).toBeNull();
    await expect(mulaiPengajuan(klaim(ID[0], "pengusul-1", 8), dari("pengusul-2"), () => {})).rejects.toThrow();
  });
});
