// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): setiap cabang validasiTanggalBerlaku. Sumber: Method Specification MS-12 (Contract C-08).
import { describe, expect, it } from "vitest";
import { PESAN_TANGGAL_DI_TENGAH_MASA, validasiTanggalBerlaku } from "@/lib/aturan/tanggal";

const periode = { tanggalBuka: new Date("2026-10-01T00:00:00+07:00"), tanggalTutup: new Date("2026-11-04T00:00:00+07:00") };

describe("validasiTanggalBerlaku (MS-12, cabang)", () => {
  it("KP-validasiTanggalBerlaku-01: format tidak sah (cabang uraiTanggalIsian null)", () => {
    expect(validasiTanggalBerlaku("2026-13-45", periode, false)).toEqual({ ok: false, pesan: "Tanggal Berlaku wajib diisi dengan tanggal yang valid." });
    expect(validasiTanggalBerlaku("  ", periode, false).ok).toBe(false);
  });
  it("KP-validasiTanggalBerlaku-02: masa berjalan dan tepat pada hari buka ditolak (batas bawah ikut, 8a)", () => {
    expect(validasiTanggalBerlaku("2026-10-01", periode, true)).toEqual({ ok: false, pesan: PESAN_TANGGAL_DI_TENGAH_MASA });
  });
  it("KP-validasiTanggalBerlaku-03: masa berjalan dan tepat pada hari tutup ditolak (batas atas ikut, 8a)", () => {
    expect(validasiTanggalBerlaku("2026-11-04", periode, true).ok).toBe(false);
  });
  it("KP-validasiTanggalBerlaku-04: masa berjalan, sehari sebelum buka dan sehari sesudah tutup diterima (kedua sisi kondisi majemuk)", () => {
    expect(validasiTanggalBerlaku("2026-09-30", periode, true).ok).toBe(true);
    expect(validasiTanggalBerlaku("2026-11-05", periode, true).ok).toBe(true);
  });
  it("KP-validasiTanggalBerlaku-05: masa tidak berjalan melewati pemeriksaan rentang", () => {
    expect(validasiTanggalBerlaku("2026-10-15", periode, false).ok).toBe(true);
  });
  it("KP-validasiTanggalBerlaku-06: tanggal tepat sama dengan versi sebelumnya ditolak; sehari sesudahnya diterima; tanpa versi sebelumnya dilewati", () => {
    const sebelum = new Date("2026-12-01T00:00:00+07:00");
    expect(validasiTanggalBerlaku("2026-12-01", periode, false, sebelum).ok).toBe(false);
    expect(validasiTanggalBerlaku("2026-12-02", periode, false, sebelum).ok).toBe(true);
    expect(validasiTanggalBerlaku("2026-12-01", periode, false, null).ok).toBe(true);
  });
  it("KP-validasiTanggalBerlaku-07: bila ditolak 8a sekaligus lebih awal dari versi sebelumnya, pesan 8a didahulukan", () => {
    const sebelum = new Date("2026-12-01T00:00:00+07:00");
    const r = validasiTanggalBerlaku("2026-10-10", periode, true, sebelum);
    expect(r).toEqual({ ok: false, pesan: PESAN_TANGGAL_DI_TENGAH_MASA });
  });
});
