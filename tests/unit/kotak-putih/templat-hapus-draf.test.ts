// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): setiap cabang keputusan hapus draf.
// Sumber: Method Specification MS-25 (hapusDraf) pada templat/status.ts:putuskanHapusDraf dan templat/daftar.ts:bacaHasilHapus.
import { describe, expect, it } from "vitest";
import { bacaHasilHapus } from "@/lib/templat/daftar";
import { putuskanHapusDraf } from "@/lib/templat/status";

describe("putuskanHapusDraf (MS-25, cabang)", () => {
  it("KP-putuskanHapusDraf-01: cabang bukan pengelola (kondisi pertama benar), status tidak dievaluasi", () => {
    expect(putuskanHapusDraf({ pengelola: false, status: null })).toMatchObject({ alasan: "bukan-pengelola" });
  });
  it("KP-putuskanHapusDraf-02: cabang pengelola dan templat tidak ada", () => {
    expect(putuskanHapusDraf({ pengelola: true, status: null })).toMatchObject({ alasan: "tidak-ada" });
  });
  it("KP-putuskanHapusDraf-03: cabang pengelola, ada, status Terbit (label Aktif pada pesan)", () => {
    expect(putuskanHapusDraf({ pengelola: true, status: "Terbit" })).toMatchObject({ alasan: "bukan-draf", pesan: expect.stringContaining("Aktif") });
  });
  it("KP-putuskanHapusDraf-04: cabang pengelola, ada, status Arsip (label tetap Arsip)", () => {
    expect(putuskanHapusDraf({ pengelola: true, status: "Arsip" })).toMatchObject({ alasan: "bukan-draf", pesan: expect.stringContaining("Arsip") });
  });
  it("KP-putuskanHapusDraf-05: cabang jalur sukses (Draf)", () => {
    expect(putuskanHapusDraf({ pengelola: true, status: "Draf" })).toEqual({ ok: true });
  });
});

describe("bacaHasilHapus (MS-25, cabang)", () => {
  it("KP-bacaHasilHapus-01: cabang hasil bukan hapus", () => {
    expect(bacaHasilHapus({ hasil: "draf", versi: "1", nama: "A" })).toBeNull();
  });
  it("KP-bacaHasilHapus-02: cabang versi tidak sah, lalu cabang nama kosong, lalu cabang sah dengan nilai larik dan nama dipangkas 120", () => {
    expect(bacaHasilHapus({ hasil: "hapus", versi: "x", nama: "A" })).toBeNull();
    expect(bacaHasilHapus({ hasil: "hapus", versi: "1", nama: "" })).toBeNull();
    const h = bacaHasilHapus({ hasil: ["hapus"], versi: ["4"], nama: "N".repeat(200) });
    expect(h?.versi).toBe(4);
    expect(h?.nama).toHaveLength(120);
  });
});
