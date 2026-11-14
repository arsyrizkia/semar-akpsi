// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: State Machine "alat peragaan" (Tersembunyi <-> Tampil, pemicu Alt+Shift+D;
// bawaan Tersembunyi) dan Contract pintasan papan tombol.
import { describe, expect, it } from "vitest";
import { adalahPintasanAlatPeragaan, alatTampilDariNilai, nilaiDariAlatTampil, type TekananTombol } from "@/lib/demo/alat-peragaan";

const tombol = (o: Partial<TekananTombol> = {}): TekananTombol => ({ code: "KeyD", altKey: true, shiftKey: true, ctrlKey: false, metaKey: false, ...o });

describe("alatTampilDariNilai dan nilaiDariAlatTampil (keadaan)", () => {
  it("KH-alatTampil-01: bawaan (tanpa nilai tersimpan) = tersembunyi", () => {
    expect(alatTampilDariNilai(null)).toBe(false);
    expect(alatTampilDariNilai(undefined)).toBe(false);
    expect(alatTampilDariNilai("")).toBe(false);
  });
  it("KH-alatTampil-02: hanya \"tampil\" yang menampilkan; nilai janggal = tersembunyi", () => {
    expect(alatTampilDariNilai("tampil")).toBe(true);
    expect(alatTampilDariNilai("tersembunyi")).toBe(false);
    expect(alatTampilDariNilai("TAMPIL")).toBe(false);
    expect(alatTampilDariNilai("true")).toBe(false);
  });
  it("KH-alatTampil-03: tulis lalu baca kembali konsisten (dua arah)", () => {
    expect(alatTampilDariNilai(nilaiDariAlatTampil(true))).toBe(true);
    expect(alatTampilDariNilai(nilaiDariAlatTampil(false))).toBe(false);
  });
});

describe("adalahPintasanAlatPeragaan", () => {
  it("KH-pintasan-01: Alt+Shift+D dikenali lewat e.code (Mac: e.key berisi \"Î\" tidak dipakai)", () => {
    expect(adalahPintasanAlatPeragaan(tombol())).toBe(true);
  });
  it("KH-pintasan-02: tanpa Alt, tanpa Shift, atau tombol lain tidak dikenali", () => {
    expect(adalahPintasanAlatPeragaan(tombol({ altKey: false }))).toBe(false);
    expect(adalahPintasanAlatPeragaan(tombol({ shiftKey: false }))).toBe(false);
    expect(adalahPintasanAlatPeragaan(tombol({ code: "KeyN" }))).toBe(false);
  });
  it("KH-pintasan-03: kombinasi dengan Ctrl atau Cmd tidak dikenali (milik peramban/sistem)", () => {
    expect(adalahPintasanAlatPeragaan(tombol({ ctrlKey: true }))).toBe(false);
    expect(adalahPintasanAlatPeragaan(tombol({ metaKey: true }))).toBe(false);
  });
});
