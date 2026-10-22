// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): setiap cabang keputusan Terbitkan dan transisi status templat.
// Sumber: Method Specification MS-11 (terbitkan: S-2, 9a, terbit; arsipkan) pada templat/status.ts.
import { describe, expect, it } from "vitest";
import { putuskanTerbitkan, transisiTemplat, type AksiTemplat, type StatusTemplat } from "@/lib/templat/status";

describe("putuskanTerbitkan (MS-11, cabang)", () => {
  it("KP-putuskanTerbitkan-01: cabang tidak lengkap (kondisi pertama benar), masa tidak dievaluasi", () => {
    expect(putuskanTerbitkan({ lengkap: false, masaBerjalan: true })).toBe("tidak-lengkap");
  });
  it("KP-putuskanTerbitkan-02: cabang lengkap dan masa berjalan (9a)", () => {
    expect(putuskanTerbitkan({ lengkap: true, masaBerjalan: true })).toBe("draf-disimpan");
  });
  it("KP-putuskanTerbitkan-03: cabang lengkap dan masa tidak berjalan (jalur terbit)", () => {
    expect(putuskanTerbitkan({ lengkap: true, masaBerjalan: false })).toBe("terbit");
  });
});

describe("transisiTemplat (MS-11, cabang)", () => {
  it("KP-transisiTemplat-01: aksi terdefinisi dan keadaan asal cocok", () => {
    expect(transisiTemplat("Draf", "terbitkan").ok).toBe(true);
    expect(transisiTemplat("Terbit", "arsipkan").ok).toBe(true);
  });
  it("KP-transisiTemplat-02: aksi terdefinisi tetapi keadaan asal tidak cocok", () => {
    expect(transisiTemplat("Arsip", "terbitkan").ok).toBe(false);
  });
  it("KP-transisiTemplat-03: aksi tidak dikenal (di luar tipe) ditolak tanpa melempar galat", () => {
    const r = transisiTemplat("Draf" as StatusTemplat, "hapus" as AksiTemplat);
    expect(r.ok).toBe(false);
  });
});
