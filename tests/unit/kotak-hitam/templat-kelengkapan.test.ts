// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475): diturunkan dari kontrak, spesifikasi, dan real use case, tanpa melihat isi metode.
import { describe, expect, it } from "vitest";
import { bagianTersimpan, batasKataValid, periksaKelengkapan } from "@/lib/templat/kelengkapan";

const lengkap = {
  bagian: [
    { nama: "Ringkasan", batas: "300", tanpaBatas: false, wajib: true },
    { nama: "Daftar Pustaka", batas: "", tanpaBatas: true, wajib: true },
  ],
  lampiran: ["Surat Pernyataan Mitra"],
  periodeBerlakuId: "p1",
};

describe("periksaKelengkapan (UC-01 S-2)", () => {
  it("KH-periksaKelengkapan-01: isian lengkap lolos", () => {
    expect(periksaKelengkapan(lengkap).lengkap).toBe(true);
  });

  it("KH-periksaKelengkapan-02: menandai nama kosong, batas kata tidak valid, lampiran kosong, dan periode kosong", () => {
    const h = periksaKelengkapan({
      bagian: [
        { nama: " ", batas: "300", tanpaBatas: false, wajib: true },
        { nama: "Metode", batas: "abc", tanpaBatas: false, wajib: true },
        { nama: "Hasil", batas: "0", tanpaBatas: false, wajib: true },
      ],
      lampiran: ["", "Artikel"],
      periodeBerlakuId: null,
    });
    expect(h.lengkap).toBe(false);
    expect(h.bagian.map((b) => b.nama)).toEqual([true, false, false]);
    expect(h.bagian.map((b) => b.batas)).toEqual([false, true, true]);
    expect(h.lampiran).toEqual([true, false]);
    expect(h.periode).toBe(true);
  });

  it("KH-periksaKelengkapan-03: menandai nama bagian ganda dan templat tanpa bagian", () => {
    const ganda = periksaKelengkapan({
      ...lengkap,
      bagian: [lengkap.bagian[0], { ...lengkap.bagian[0], nama: "ringkasan" }],
    });
    expect(ganda.bagian.every((b) => b.nama)).toBe(true);
    expect(periksaKelengkapan({ ...lengkap, bagian: [] }).lengkap).toBe(false);
  });

  it("KH-periksaKelengkapan-04: batas kata dan nilai tersimpan", () => {
    expect(batasKataValid("1.200")).toBe(false);
    expect(batasKataValid("1200")).toBe(true);
    expect(bagianTersimpan(lengkap.bagian[1])).toEqual({ nama: "Daftar Pustaka", batasKata: null, wajib: true });
    expect(bagianTersimpan(lengkap.bagian[0]).batasKata).toBe(300);
  });
});
