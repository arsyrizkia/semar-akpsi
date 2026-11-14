// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): setiap cabang adalahPintasanAlatPeragaan dan alatTampilDariNilai
// (src/lib/demo/alat-peragaan.ts).
import { describe, expect, it } from "vitest";
import { KUNCI_ALAT_PERAGAAN, NILAI_TAMPIL, NILAI_TERSEMBUNYI, adalahPintasanAlatPeragaan, alatTampilDariNilai, nilaiDariAlatTampil } from "@/lib/demo/alat-peragaan";

const dasar = { code: "KeyD", altKey: true, shiftKey: true, ctrlKey: false, metaKey: false };

describe("adalahPintasanAlatPeragaan (cabang)", () => {
  it("KP-adalahPintasan-01: code bukan KeyD -> false", () => {
    expect(adalahPintasanAlatPeragaan({ ...dasar, code: "KeyF" })).toBe(false);
  });
  it("KP-adalahPintasan-02: Alt/Shift hilang salah satu -> false", () => {
    expect(adalahPintasanAlatPeragaan({ ...dasar, altKey: false })).toBe(false);
    expect(adalahPintasanAlatPeragaan({ ...dasar, shiftKey: false })).toBe(false);
  });
  it("KP-adalahPintasan-03: Ctrl atau Meta ikut -> false", () => {
    expect(adalahPintasanAlatPeragaan({ ...dasar, ctrlKey: true })).toBe(false);
    expect(adalahPintasanAlatPeragaan({ ...dasar, metaKey: true })).toBe(false);
  });
  it("KP-adalahPintasan-04: tombol tertahan (repeat) -> false", () => {
    expect(adalahPintasanAlatPeragaan({ ...dasar, repeat: true })).toBe(false);
  });
  it("KP-adalahPintasan-05: sedang komposisi IME -> false", () => {
    expect(adalahPintasanAlatPeragaan({ ...dasar, isComposing: true })).toBe(false);
  });
  it("KP-adalahPintasan-06: semua syarat terpenuhi, repeat/isComposing eksplisit false -> true", () => {
    expect(adalahPintasanAlatPeragaan({ ...dasar, repeat: false, isComposing: false })).toBe(true);
  });
});

describe("keadaan alat peragaan (nilai tersimpan)", () => {
  it("KP-alatTampil-01: konstanta kunci dan nilai", () => {
    expect(KUNCI_ALAT_PERAGAAN).toBe("semar:alat-peragaan");
    expect(nilaiDariAlatTampil(true)).toBe(NILAI_TAMPIL);
    expect(nilaiDariAlatTampil(false)).toBe(NILAI_TERSEMBUNYI);
  });
  it("KP-alatTampil-02: tombol berurutan membalik keadaan (tersembunyi -> tampil -> tersembunyi)", () => {
    let nilai: string | null = null;
    const tekan = () => {
      nilai = nilaiDariAlatTampil(!alatTampilDariNilai(nilai));
    };
    tekan();
    expect(alatTampilDariNilai(nilai)).toBe(true);
    tekan();
    expect(alatTampilDariNilai(nilai)).toBe(false);
  });
});
