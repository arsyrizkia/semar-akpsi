// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): cabang uraikanAturanHitung dan validasiButir (aturParameter, Contract C-06).
// Sumber: struktur algoritma pada aturan/parameter.ts (Method Specification MS-06 usulan: belum tercantum di tabel MS naskah).
import { describe, expect, it } from "vitest";
import { MASUKAN_BUTIR_KOSONG, ringkasParameter, uraikanAturanHitung, validasiButir } from "@/lib/aturan/parameter";

describe("uraikanAturanHitung (cabang)", () => {
  it("KP-uraikanAturanHitung-01: kata kunci dengan angka numerik dan pemisah koma", () => {
    expect(uraikanAturanHitung("kata kunci 4 dipisah koma", "")).toEqual({ ok: true, parameter: { tipe: "kata_kunci", jumlah: 4, pemisah: "," } });
  });
  it("KP-uraikanAturanHitung-02: kata kunci dengan angka huruf dan pemisah bawaan titik koma", () => {
    expect(uraikanAturanHitung("kata kunci tepat tiga", "")).toEqual({ ok: true, parameter: { tipe: "kata_kunci", jumlah: 3, pemisah: ";" } });
  });
  it("KP-uraikanAturanHitung-03: kata kunci tanpa jumlah ditolak", () => {
    expect(uraikanAturanHitung("kata kunci saja", "").ok).toBe(false);
  });
  it("KP-uraikanAturanHitung-04: jumlah referensi, pustaka berurutan, dan sitasi memakai cabang masing-masing", () => {
    expect(uraikanAturanHitung("jumlah pustaka sama dengan kutipan", "")).toMatchObject({ parameter: { tipe: "jumlah_referensi_sama" } });
    expect(uraikanAturanHitung("daftar pustaka berurutan", "")).toMatchObject({ parameter: { tipe: "pustaka_berurutan" } });
    expect(uraikanAturanHitung("kutipan memakai nomor", "")).toMatchObject({ parameter: { tipe: "sitasi_bernomor" } });
  });
  it("KP-uraikanAturanHitung-05: judul sama, struktur, dan terisi; terisi tanpa bagian ditolak", () => {
    expect(uraikanAturanHitung("judul sama dengan BIMA", "")).toMatchObject({ parameter: { tipe: "judul_sama" } });
    expect(uraikanAturanHitung("struktur judul sesuai templat", "")).toMatchObject({ parameter: { tipe: "struktur_judul" } });
    expect(uraikanAturanHitung("bagian tidak kosong", "").ok).toBe(false);
    expect(uraikanAturanHitung("bagian terisi", "Metode")).toMatchObject({ parameter: { tipe: "bagian_terisi", bagian: "Metode" } });
  });
});

describe("validasiButir (cabang)", () => {
  const dasar = { ...MASUKAN_BUTIR_KOSONG, kode: "X-01", deskripsi: "Deskripsi" };
  it("KP-validasiButir-01: kode kosong, kode tidak sah, kode 20 karakter sah, 21 karakter tidak sah", () => {
    expect(validasiButir({ ...dasar, kode: "", jenis: "semantik" }).ok).toBe(false);
    expect(validasiButir({ ...dasar, kode: "a b", jenis: "semantik" }).ok).toBe(false);
    const semantik = { ...dasar, jenis: "semantik" as const, pertanyaan: "?", bagian: "Metode" };
    expect(validasiButir({ ...semantik, kode: "A".repeat(20) }).ok).toBe(true);
    expect(validasiButir({ ...semantik, kode: "A".repeat(21) }).ok).toBe(false);
  });
  it("KP-validasiButir-02: deterministik tanpa Aturan Hitung dan dengan aturan tak dikenal ditandai pada isian aturan", () => {
    const a = validasiButir({ ...dasar, jenis: "deterministik" });
    const b = validasiButir({ ...dasar, jenis: "deterministik", aturanHitung: "tidak jelas" });
    expect(!a.ok && a.galat.aturanHitung).toBe("Aturan Hitung wajib diisi");
    expect(!b.ok && b.galat.aturanHitung).toMatch(/belum dikenali/);
  });
  it("KP-validasiButir-03: deterministik valid tetapi kode kosong tetap gagal (galat lain mencegah hasil sah)", () => {
    const r = validasiButir({ ...dasar, kode: "", jenis: "deterministik", aturanHitung: "kata kunci tepat lima" });
    expect(!r.ok && Object.keys(r.galat)).toEqual(["kode"]);
  });
  it("KP-validasiButir-04: semantik tanpa lampiran memakai komponen kesesuaian isi dan contoh jawaban kosong menjadi null", () => {
    const r = validasiButir({ ...dasar, jenis: "semantik", pertanyaan: " Apakah? ", bagian: "Metode", contohJawaban: "  " });
    expect(r.ok && r.nilai.komponen).toBe("1. Kesesuaian isi per bagian");
    expect(r.ok && r.nilai.contohJawaban).toBeNull();
    expect(r.ok && r.nilai.parameter).toEqual({ tipe: "semantik", bagian: "Metode" });
  });
  it("KP-validasiButir-05: semantik dengan lampiran yang tidak ada di peta komponen memakai komponen bawaan", () => {
    const r = validasiButir({ ...dasar, jenis: "semantik", pertanyaan: "?", bagian: "Metode", lampiran: "Lampiran Baru" });
    expect(r.ok && r.nilai.komponen).toBe("1. Kesesuaian isi per bagian");
    expect(r.ok && r.nilai.parameter).toEqual({ tipe: "semantik", bagian: "Metode", lampiran: "Lampiran Baru" });
  });
  it("KP-validasiButir-06: jenis tidak dipilih ditandai; semantik tanpa pertanyaan dan bagian ditandai keduanya", () => {
    expect(!validasiButir(dasar).ok).toBe(true);
    const r = validasiButir({ ...dasar, jenis: "semantik" });
    expect(!r.ok && Object.keys(r.galat).sort()).toEqual(["bagian", "pertanyaan"]);
  });
  it("KP-validasiButir-07: ringkasParameter semantik tanpa bagian dan tanpa pertanyaan memakai tanda hubung", () => {
    expect(ringkasParameter({ jenis: "semantik", aturanHitung: null, pertanyaan: null, parameter: null })).toBe("-");
    expect(ringkasParameter({ jenis: "deterministik", aturanHitung: null, pertanyaan: null, parameter: null })).toBe("-");
  });
});
