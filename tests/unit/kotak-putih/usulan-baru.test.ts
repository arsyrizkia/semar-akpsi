// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-24 (validasiUsulanBaru, teksLampiranDemo;
// lib/bima/usulan-baru.ts): "Tambah Usulan" di Daftar Usulan BIMA tiruan.
import { describe, expect, it } from "vitest";
import { susunContoh } from "@/lib/contoh/proposal";
import { teksLampiranDemo, validasiUsulanBaru } from "@/lib/bima/usulan-baru";

describe("validasiUsulanBaru", () => {
  it("KP-validasiUsulanBaru-01: skema tersedia dan judul dirapikan spasinya", () => {
    expect(validasiUsulanBaru({ skemaKode: " PD ", judul: "  Model   Prediksi\nCurah Hujan  " }, ["PD", "PT"])).toEqual({ ok: true, skemaKode: "PD", judul: "Model Prediksi Curah Hujan" });
  });
  it("KP-validasiUsulanBaru-02: skema di luar daftar atau bukan teks ditolak", () => {
    expect(validasiUsulanBaru({ skemaKode: "XX", judul: "Judul yang cukup panjang" }, ["PD"]).ok).toBe(false);
    expect(validasiUsulanBaru({ skemaKode: 1, judul: "Judul yang cukup panjang" }, ["PD"]).ok).toBe(false);
  });
  it("KP-validasiUsulanBaru-03: batas judul 10-250 karakter sesudah dirapikan", () => {
    expect(validasiUsulanBaru({ skemaKode: "PD", judul: "   Pendek  " }, ["PD"])).toEqual({ ok: false, galat: "Judul usulan minimal 10 karakter." });
    expect(validasiUsulanBaru({ skemaKode: "PD", judul: "a".repeat(251) }, ["PD"])).toEqual({ ok: false, galat: "Judul usulan maksimal 250 karakter." });
    expect(validasiUsulanBaru({ skemaKode: "PD", judul: "a".repeat(250) }, ["PD"]).ok).toBe(true);
    expect(validasiUsulanBaru({ skemaKode: "PD" }, ["PD"]).ok).toBe(false);
  });
});

describe("teksLampiranDemo", () => {
  const contoh = susunContoh("a");
  it("KP-teksLampiranDemo-01: lampiran naskah contoh memakai judul usulan baru", () => {
    const l = teksLampiranDemo("Surat Pernyataan Mitra", "Judul Usulan Baru Uji", contoh);
    expect(l.berkas).toBe("surat-pernyataan-mitra.pdf");
    expect(l.teks).toContain('"Judul Usulan Baru Uji"');
    expect(l.teks).not.toContain(contoh.judul);
  });
  it("KP-teksLampiranDemo-02: lampiran tanpa contoh memakai teks umum rekaan", () => {
    const l = teksLampiranDemo("Surat Izin Etik", "Judul Usulan Baru Uji", contoh);
    expect(l.berkas).toBe("surat-izin-etik.pdf");
    expect(l.teks).toContain("CONTOH SEMENTARA (data rekaan)");
    expect(l.teks).toContain("Judul Usulan Baru Uji");
  });
});
