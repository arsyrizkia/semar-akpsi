// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475): diturunkan dari kontrak, spesifikasi, dan real use case, tanpa melihat isi metode.
import { describe, expect, it } from "vitest";
import { KOMPONEN_BORANG } from "@/lib/kontrak/tipe";
import { PESAN_ALASAN_WAJIB, bersihkanKomponen, komponenLengkap, validasiKoreksi } from "@/lib/penilaian/validasi";

describe("validasiKoreksi (UC-08 S-1)", () => {
  it("KH-validasiKoreksi-01: alasan kosong atau spasi ditolak dengan pesan baku", () => {
    expect(validasiKoreksi({ keputusan: "Memenuhi", alasan: "   ", jenisKekeliruan: "Salah tafsir isi" }).alasan).toBe(PESAN_ALASAN_WAJIB);
    expect(PESAN_ALASAN_WAJIB).toBe("Alasan koreksi wajib diisi");
  });
  it("KH-validasiKoreksi-02: masukan lengkap valid", () => {
    expect(validasiKoreksi({ keputusan: "Tidak memenuhi", alasan: "Kutipan di bagian lain.", jenisKekeliruan: "Kutipan salah tempat" })).toEqual({});
  });
  it("KH-validasiKoreksi-03: keputusan dan jenis di luar daftar ditolak", () => {
    const g = validasiKoreksi({ keputusan: "Mungkin", alasan: "x", jenisKekeliruan: "Karangan" });
    expect(Object.keys(g).sort()).toEqual(["jenisKekeliruan", "keputusan"]);
  });
});

describe("jenis kekeliruan opsional (Bab 10)", () => {
  it("KH-validasiKoreksi-04: kosong diterima; hanya alasan yang wajib", () => {
    expect(validasiKoreksi({ keputusan: "Memenuhi", alasan: "Sudah menjawab butir.", jenisKekeliruan: "" })).toEqual({});
  });
});

describe("komponen borang", () => {
  it("KH-komponenBorang-01: hanya komponen baku dengan keputusan sah", () => {
    const k = bersihkanKomponen({ [KOMPONEN_BORANG[0]]: "Memenuhi", [KOMPONEN_BORANG[1]]: "entah", "Komponen asing": "Memenuhi" });
    expect(k).toEqual({ [KOMPONEN_BORANG[0]]: "Memenuhi" });
    expect(komponenLengkap(k)).toBe(false);
  });
  it("KH-komponenBorang-02: lengkap bila keenam komponen terisi", () => {
    const k = bersihkanKomponen(Object.fromEntries(KOMPONEN_BORANG.map((n) => [n, "Tidak memenuhi"])));
    expect(komponenLengkap(k)).toBe(true);
  });
});
