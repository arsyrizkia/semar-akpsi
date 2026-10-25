// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-32 bacaFilterUsulan/bacaTabUsulan/ukuranDariUrl dan
// Contract C-14 [Q4] periksaSyaratRinci (docs/kontrak-dan-spesifikasi-metode.md). Kasus: nilai sah, batas, tipe salah, nilai janggal.
import { describe, expect, it } from "vitest";
import { periksaSyaratRinci } from "@/lib/penugasan/aturan";
import { bacaFilterUsulan, bacaTabUsulan, ukuranDariUrl } from "@/lib/penugasan/periode";

const UUID = "3f2b7f2e-8a1c-4d2e-9b7a-0c1d2e3f4a5b";

describe("bacaFilterUsulan (C-32)", () => {
  it("KH-bacaFilterUsulan-01: nilai sah dibaca apa adanya", () => {
    expect(bacaFilterUsulan({ q: " irigasi ", rev: UUID, inst: "Universitas A", skema: "PD", syarat: "melanggar", urut: "reviewer" })).toEqual({
      q: "irigasi",
      rev: UUID,
      inst: "Universitas A",
      skema: "PD",
      melanggar: true,
      urut: "reviewer",
    });
  });

  it("KH-bacaFilterUsulan-02: tanpa parameter = filter kosong, urut id", () => {
    expect(bacaFilterUsulan({})).toEqual({ q: "", rev: null, inst: null, skema: null, melanggar: false, urut: "id" });
  });

  it("KH-bacaFilterUsulan-03: rev bukan uuid dan urut tidak dikenal ditolak (nilai janggal)", () => {
    const f = bacaFilterUsulan({ rev: "reviewer-2", urut: "acak", syarat: "ya" });
    expect(f).toMatchObject({ rev: null, urut: "id", melanggar: false });
  });

  it("KH-bacaFilterUsulan-04: teks dipotong 100 huruf (batas atas); array memakai nilai pertama (tipe salah)", () => {
    expect(bacaFilterUsulan({ q: "x".repeat(150) }).q).toHaveLength(100);
    expect(bacaFilterUsulan({ skema: ["PT", "PD"] }).skema).toBe("PT");
  });
});

describe("bacaTabUsulan dan ukuranDariUrl (C-32)", () => {
  it("KH-bacaTabUsulan-01: sebaran dan ditetapkan dikenali, lainnya usulan", () => {
    expect(bacaTabUsulan("sebaran")).toBe("sebaran");
    expect(bacaTabUsulan("ditetapkan")).toBe("ditetapkan");
    expect(bacaTabUsulan("lain")).toBe("usulan");
    expect(bacaTabUsulan(undefined)).toBe("usulan");
  });

  it("KH-ukuranDariUrl-01: hanya 25, 50, 100; lainnya 50", () => {
    expect([ukuranDariUrl("25"), ukuranDariUrl("100"), ukuranDariUrl("10"), ukuranDariUrl("abc"), ukuranDariUrl(undefined)]).toEqual([25, 100, 50, 50, 50]);
  });
});

describe("periksaSyaratRinci (C-14 [Q4])", () => {
  it("KH-periksaSyaratRinci-01: tiga pelanggaran berurutan dengan kodenya", () => {
    const d = periksaSyaratRinci({ institusiPengusul: "A", reviewer: { institusi: "a", bersedia: false }, bebanSaatIni: 5, batas: 5 });
    expect(d.map((x) => x.kode)).toEqual(["bersedia", "institusi", "beban"]);
  });

  it("KH-periksaSyaratRinci-02: batas: beban = batas - 1 diterima", () => {
    expect(periksaSyaratRinci({ institusiPengusul: "A", reviewer: { institusi: "B", bersedia: true }, bebanSaatIni: 4, batas: 5 })).toEqual([]);
  });
});
