// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: behavioral state machine TemplatProposal (Draf, Terbit, Arsip; hapus hanya dari Draf),
// CRC TemplatProposal, Contract C-33 (hapusDraf). Hak pengelola dan keberadaan templat diputuskan oleh fungsi murni yang sama dengan layanan.
import { describe, expect, it } from "vitest";
import { bacaHasilHapus, pesanDrafDihapus, urlHasilHapus } from "@/lib/templat/daftar";
import { PESAN_HAPUS_BUKAN_PENGELOLA, PESAN_HAPUS_TIDAK_ADA, putuskanHapusDraf } from "@/lib/templat/status";

describe("putuskanHapusDraf (hapus draf templat)", () => {
  it("KH-hapusDraf-01: nilai sah: pengelola menghapus templat berstatus Draf", () => {
    expect(putuskanHapusDraf({ pengelola: true, status: "Draf" })).toEqual({ ok: true });
  });
  it("KH-hapusDraf-02: keadaan dan transisi: Terbit (Aktif) ditolak dengan pesan yang jelas", () => {
    const r = putuskanHapusDraf({ pengelola: true, status: "Terbit" });
    expect(r).toMatchObject({ ok: false, alasan: "bukan-draf" });
    expect(!r.ok && r.pesan).toContain("Aktif");
  });
  it("KH-hapusDraf-03: keadaan dan transisi: Arsip ditolak dengan pesan yang jelas", () => {
    const r = putuskanHapusDraf({ pengelola: true, status: "Arsip" });
    expect(r).toMatchObject({ ok: false, alasan: "bukan-draf" });
    expect(!r.ok && r.pesan).toContain("Arsip");
  });
  it("KH-hapusDraf-04: nilai janggal: templat tidak ada ditolak", () => {
    expect(putuskanHapusDraf({ pengelola: true, status: null })).toEqual({ ok: false, alasan: "tidak-ada", pesan: PESAN_HAPUS_TIDAK_ADA });
  });
  it("KH-hapusDraf-05: bukan pengelola ditolak walau templat berstatus Draf", () => {
    expect(putuskanHapusDraf({ pengelola: false, status: "Draf" })).toEqual({ ok: false, alasan: "bukan-pengelola", pesan: PESAN_HAPUS_BUKAN_PENGELOLA });
  });
});

describe("pesan hasil hapus di J-02 (?hasil=hapus)", () => {
  it("KH-bacaHasilHapus-01: nilai sah: url dari urlHasilHapus terbaca kembali dan pesannya persis", () => {
    const u = new URL(urlHasilHapus(3, "Penelitian Dasar & Terapan"), "http://x");
    expect(u.pathname).toBe("/tim-kerja/templat");
    const h = bacaHasilHapus(Object.fromEntries(u.searchParams));
    expect(h).toEqual({ versi: 3, nama: "Penelitian Dasar & Terapan" });
    expect(pesanDrafDihapus(h!)).toBe("Draf versi 3 skema Penelitian Dasar & Terapan dihapus.");
  });
  it("KH-bacaHasilHapus-02: nilai tidak sah: hasil lain, versi bukan angka atau nol, nama kosong menjadi null", () => {
    expect(bacaHasilHapus({ hasil: "terbit", versi: "1", nama: "X" })).toBeNull();
    expect(bacaHasilHapus({ hasil: "hapus", versi: "abc", nama: "X" })).toBeNull();
    expect(bacaHasilHapus({ hasil: "hapus", versi: "0", nama: "X" })).toBeNull();
    expect(bacaHasilHapus({ hasil: "hapus", versi: "2", nama: "  " })).toBeNull();
    expect(bacaHasilHapus({})).toBeNull();
  });
});
