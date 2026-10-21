import { describe, expect, it } from "vitest";
import { KOMPONEN_BORANG } from "@/lib/kontrak/tipe";
import { PESAN_ALASAN_WAJIB, bersihkanKomponen, komponenLengkap, validasiKoreksi } from "./validasi";

describe("validasiKoreksi (UC-08 S-1)", () => {
  it("alasan kosong atau spasi ditolak dengan pesan baku", () => {
    expect(validasiKoreksi({ keputusan: "Memenuhi", alasan: "   ", jenisKekeliruan: "Salah tafsir isi" }).alasan).toBe(PESAN_ALASAN_WAJIB);
    expect(PESAN_ALASAN_WAJIB).toBe("Alasan koreksi wajib diisi");
  });
  it("masukan lengkap valid", () => {
    expect(validasiKoreksi({ keputusan: "Tidak memenuhi", alasan: "Kutipan di bagian lain.", jenisKekeliruan: "Kutipan salah tempat" })).toEqual({});
  });
  it("keputusan dan jenis di luar daftar ditolak", () => {
    const g = validasiKoreksi({ keputusan: "Mungkin", alasan: "x", jenisKekeliruan: "Karangan" });
    expect(Object.keys(g).sort()).toEqual(["jenisKekeliruan", "keputusan"]);
  });
});

describe("jenis kekeliruan opsional (Bab 10)", () => {
  it("kosong diterima; hanya alasan yang wajib", () => {
    expect(validasiKoreksi({ keputusan: "Memenuhi", alasan: "Sudah menjawab butir.", jenisKekeliruan: "" })).toEqual({});
  });
});

describe("komponen borang", () => {
  it("hanya komponen baku dengan keputusan sah", () => {
    const k = bersihkanKomponen({ [KOMPONEN_BORANG[0]]: "Memenuhi", [KOMPONEN_BORANG[1]]: "entah", "Komponen asing": "Memenuhi" });
    expect(k).toEqual({ [KOMPONEN_BORANG[0]]: "Memenuhi" });
    expect(komponenLengkap(k)).toBe(false);
  });
  it("lengkap bila keenam komponen terisi", () => {
    const k = bersihkanKomponen(Object.fromEntries(KOMPONEN_BORANG.map((n) => [n, "Tidak memenuhi"])));
    expect(komponenLengkap(k)).toBe(true);
  });
});
