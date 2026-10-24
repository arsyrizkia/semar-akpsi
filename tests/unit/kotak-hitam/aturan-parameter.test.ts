// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-06 ButirCek.aturParameter/ubahParameter (uraikanAturanHitung, validasiButir), Contract C-08 BasisAturan.validasiTanggalBerlaku (8a); CRC ButirCek dan BasisAturan.
import { describe, expect, it } from "vitest";
import { MASUKAN_BUTIR_KOSONG, ringkasParameter, uraikanAturanHitung, validasiButir } from "@/lib/aturan/parameter";
import { PESAN_TANGGAL_DI_TENGAH_MASA, hariWib, uraiTanggalIsian, validasiTanggalBerlaku } from "@/lib/aturan/tanggal";

describe("uraikanAturanHitung", () => {
  it("KH-uraikanAturanHitung-01: kata kunci tepat lima, dipisah titik koma", () => {
    expect(uraikanAturanHitung("Kata kunci tepat lima, dipisahkan titik koma", "")).toEqual({ ok: true, parameter: { tipe: "kata_kunci", jumlah: 5, pemisah: ";" } });
    expect(uraikanAturanHitung("kata kunci 3 dipisah koma", "")).toEqual({ ok: true, parameter: { tipe: "kata_kunci", jumlah: 3, pemisah: "," } });
    expect(uraikanAturanHitung("kata kunci tepat", "").ok).toBe(false);
  });

  it("KH-uraikanAturanHitung-02: sitasi dan daftar pustaka", () => {
    expect(uraikanAturanHitung("Sitasi dalam paragraf memakai penomoran [n]", "")).toMatchObject({ ok: true, parameter: { tipe: "sitasi_bernomor" } });
    expect(uraikanAturanHitung("Daftar pustaka bernomor dan berurutan sesuai pengutipan", "")).toMatchObject({ ok: true, parameter: { tipe: "pustaka_berurutan" } });
    expect(uraikanAturanHitung("Jumlah referensi sama dengan jumlah yang dikutip", "")).toMatchObject({ ok: true, parameter: { tipe: "jumlah_referensi_sama" } });
  });

  it("KH-uraikanAturanHitung-03: aturan yang butuh bagian", () => {
    expect(uraikanAturanHitung("Metode memuat diagram alir", "").ok).toBe(false);
    expect(uraikanAturanHitung("Metode memuat diagram alir", "Metode")).toMatchObject({ ok: true, parameter: { tipe: "diagram_alir", bagian: "Metode" } });
  });

  it("KH-uraikanAturanHitung-04: aturan tak dikenali ditolak dengan petunjuk", () => {
    const r = uraikanAturanHitung("hitung sesuatu", "");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.pesan).toMatch(/belum dikenali/);
  });
});

describe("validasiButir", () => {
  it("KH-validasiButir-01: menandai isian wajib yang kosong", () => {
    const r = validasiButir(MASUKAN_BUTIR_KOSONG);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.galat).sort()).toEqual(["deskripsi", "jenis", "kode"]);
  });

  it("KH-validasiButir-02: butir deterministik: parameter, pemeriksa, dan komponen diturunkan", () => {
    const r = validasiButir({ ...MASUKAN_BUTIR_KOSONG, jenis: "deterministik", kode: "KAT-01", deskripsi: "Kata kunci", aturanHitung: "Kata kunci tepat lima, dipisah titik koma" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.nilai.pemeriksa).toBe("cekKataKunci");
      expect(r.nilai.komponen).toBe("2. Jumlah kata per bagian");
      expect(r.nilai.pertanyaan).toBeNull();
    }
  });

  it("KH-validasiButir-03: butir semantik wajib pertanyaan dan bagian; lampiran tidak lagi diperiksa SEMAR", () => {
    const kurang = validasiButir({ ...MASUKAN_BUTIR_KOSONG, jenis: "semantik", kode: "MIT-S1", deskripsi: "Surat mitra" });
    expect(kurang.ok).toBe(false);
    const r = validasiButir({
      ...MASUKAN_BUTIR_KOSONG,
      jenis: "semantik",
      kode: "MIT-S1",
      deskripsi: "Surat mitra",
      pertanyaan: "Apakah surat bermeterai?",
      contohJawaban: "Memenuhi",
      bagian: "Metode",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.nilai.parameter).toEqual({ tipe: "semantik", bagian: "Metode" });
      expect(r.nilai.komponen).toBe("1. Kesesuaian isi per bagian");
      expect(r.nilai.aturanHitung).toBeNull();
    }
  });

  it("KH-validasiButir-04: kode dengan karakter tidak sah ditolak", () => {
    const r = validasiButir({ ...MASUKAN_BUTIR_KOSONG, jenis: "semantik", kode: "a b", deskripsi: "x", pertanyaan: "?", bagian: "Metode" });
    expect(r.ok).toBe(false);
  });

  it("KH-validasiButir-05: ringkasan parameter", () => {
    expect(ringkasParameter({ jenis: "semantik", aturanHitung: null, pertanyaan: "Apakah?", parameter: { bagian: "Metode" } })).toBe("[Metode] Apakah?");
    expect(ringkasParameter({ jenis: "deterministik", aturanHitung: "Aturan", pertanyaan: null, parameter: null })).toBe("Aturan");
  });
});

describe("validasiTanggalBerlaku (8a)", () => {
  const periode = { tanggalBuka: new Date("2026-10-01T00:00:00+07:00"), tanggalTutup: new Date("2026-11-04T00:00:00+07:00") };

  it("KH-validasiTanggalBerlaku-01: menolak tanggal di antara buka dan tutup (batas ikut) bila masa pengusulan berjalan", () => {
    for (const t of ["2026-10-01", "2026-10-21", "2026-11-04"]) {
      const r = validasiTanggalBerlaku(t, periode, true);
      expect(r).toEqual({ ok: false, pesan: PESAN_TANGGAL_DI_TENGAH_MASA });
    }
  });

  it("KH-validasiTanggalBerlaku-02: menerima tanggal di luar rentang, atau bila masa pengusulan ditutup", () => {
    expect(validasiTanggalBerlaku("2026-11-05", periode, true).ok).toBe(true);
    expect(validasiTanggalBerlaku("2026-09-30", periode, true).ok).toBe(true);
    expect(validasiTanggalBerlaku("2026-10-21", periode, false).ok).toBe(true);
  });

  it("KH-validasiTanggalBerlaku-03: tanggal kosong atau tidak valid ditolak; harus lebih akhir dari versi sebelumnya", () => {
    expect(validasiTanggalBerlaku("", periode, false).ok).toBe(false);
    expect(validasiTanggalBerlaku("21/10/2026", periode, false).ok).toBe(false);
    const sebelumnya = new Date("2026-12-01T00:00:00+07:00");
    expect(validasiTanggalBerlaku("2026-12-01", periode, false, sebelumnya).ok).toBe(false);
    expect(validasiTanggalBerlaku("2026-12-02", periode, false, sebelumnya).ok).toBe(true);
  });

  it("KH-validasiTanggalBerlaku-04: hari menurut WIB", () => {
    expect(hariWib(new Date("2026-10-20T17:30:00Z"))).toBe("2026-10-21");
    expect(uraiTanggalIsian("2026-10-21")?.toISOString()).toBe("2026-10-20T17:00:00.000Z");
  });
});
