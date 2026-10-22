// Uji integrasi baca-saja pada basis data bersama (dilewati bila tidak ada basis data uji). Sumber: use-case testing UC-03 s.1 dan UC-04/J-05b.
import { describe, expect, it } from "vitest";
import { ambilRincianProposal } from "@/lib/pemantauan/proposal";
import { ambilRingkasanPeriode, daftarPeriodeDitutup } from "@/lib/penugasan/layanan";

const ada = Boolean(process.env.DATABASE_URL);

describe.skipIf(!ada)("penugasan dan pemantauan (baca saja)", () => {
  it("IT-penugasanDb-01: daftar periode ditutup hanya memuat periode ditutup dengan hitungan tak negatif", async () => {
    const { periode, jumlahBerjalan } = await daftarPeriodeDitutup();
    expect(jumlahBerjalan).toBeGreaterThanOrEqual(0);
    for (const p of periode) {
      expect(p.ditutup).toBe(true);
      expect(p.belumDitugaskan).toBeLessThanOrEqual(p.terkirim);
      expect(p.diusulkan).toBeGreaterThanOrEqual(0);
    }
  });

  it("IT-penugasanDb-02: id periode tidak sah atau tidak ada menghasilkan null", async () => {
    expect(await ambilRingkasanPeriode("bukan-uuid")).toBeNull();
    expect(await ambilRingkasanPeriode("00000000-0000-0000-0000-000000000000")).toBeNull();
  });

  it("IT-pemantauanDb-01: rincian proposal yang tidak ada menghasilkan null", async () => {
    expect(await ambilRincianProposal("PRP-0000-0000")).toBeNull();
    expect(await ambilRincianProposal("00000000-0000-0000-0000-000000000000")).toBeNull();
  });

  it("IT-pemantauanDb-02: rincian proposal contoh dapat dibuka lewat idProposal BIMA maupun id baris", async () => {
    const a = await ambilRincianProposal("PRP-2026-0004");
    if (!a) return; // basis data belum diisi data demo
    const b = await ambilRincianProposal(a.id);
    expect(b?.idProposal).toBe("PRP-2026-0004");
    expect(a.versi.length).toBeGreaterThan(0);
  });
});
