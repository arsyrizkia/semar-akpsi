// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: CRC TemplatProposal (tanggung jawab: menyimpan bagian dan lampiran sebagai Draf),
// Contract C-01 (periksaKelengkapan, isian yang tidak lengkap hanya boleh disimpan sebagai Draf), Class Diagram: TemplatProposal 1 — 0..* BagianTemplat.
import { describe, expect, it } from "vitest";
import { bersihkanIsianDraf, periksaKelengkapan } from "@/lib/templat/kelengkapan";

describe("bersihkanIsianDraf (simpan draf yang belum lengkap)", () => {
  it("KH-bersihkanIsianDraf-01: isian lengkap disimpan apa adanya (nilai sah) dan tetap lolos periksaKelengkapan", () => {
    const masukan = {
      bagian: [
        { nama: "Ringkasan", batas: "300", tanpaBatas: false, wajib: true },
        { nama: "Daftar Pustaka", batas: "", tanpaBatas: true, wajib: false },
      ],
      lampiran: ["Surat Pernyataan Mitra"],
      periodeBerlakuId: "p1",
    };
    expect(periksaKelengkapan(masukan).lengkap).toBe(true);
    expect(bersihkanIsianDraf(masukan)).toEqual({
      bagian: [
        { nama: "Ringkasan", batasKata: 300, wajib: true },
        { nama: "Daftar Pustaka", batasKata: null, wajib: false },
      ],
      periodeBerlakuId: "p1",
    });
  });

  it("KH-bersihkanIsianDraf-02: baris bagian tanpa nama dan lampiran kosong dibuang; draf kosong sah", () => {
    expect(bersihkanIsianDraf({ bagian: [{ nama: "  ", batas: "10", tanpaBatas: false, wajib: true }], periodeBerlakuId: null })).toEqual({ bagian: [], periodeBerlakuId: null });
  });

  it("KH-bersihkanIsianDraf-03: batas kata tidak sah (di bawah batas, huruf, desimal) menjadi tanpa batas", () => {
    const b = (batas: string) => bersihkanIsianDraf({ bagian: [{ nama: "X", batas, tanpaBatas: false, wajib: true }], periodeBerlakuId: null }).bagian[0].batasKata;
    expect(b("0")).toBeNull();
    expect(b("-5")).toBeNull();
    expect(b("abc")).toBeNull();
    expect(b("12,5")).toBeNull();
    expect(b("")).toBeNull();
  });

  it("KH-bersihkanIsianDraf-04: spasi di nama dan batas dipangkas; batas tepat 1 sah (batas bawah)", () => {
    const r = bersihkanIsianDraf({ bagian: [{ nama: "  Metode ", batas: " 1 ", tanpaBatas: false, wajib: false }], periodeBerlakuId: "" });
    expect(r).toEqual({ bagian: [{ nama: "Metode", batasKata: 1, wajib: false }], periodeBerlakuId: null });
  });
});
