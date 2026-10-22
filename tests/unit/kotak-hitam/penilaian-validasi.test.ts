// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-26 KoreksiRekomendasi.simpanKoreksi dan C-27 Penilaian.simpanNilai; CRC KoreksiRekomendasi dan Penilaian.
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

describe("validasiKoreksi: batas dan nilai janggal (Contract C-26 KoreksiRekomendasi.simpanKoreksi)", () => {
  const sah = { keputusan: "Memenuhi", alasan: "Ada di bagian Metode.", jenisKekeliruan: "" };
  it("KH-validasiKoreksi-05: batas bawah, alasan satu karakter sah", () => {
    expect(validasiKoreksi({ ...sah, alasan: "x" })).toEqual({});
  });
  it("KH-validasiKoreksi-06: alasan kosong, tab, dan baris baru saja ditolak (batas bawah tidak sah)", () => {
    for (const a of ["", "\t", "\n \n", "\u00a0"]) expect(validasiKoreksi({ ...sah, alasan: a }).alasan).toBe(PESAN_ALASAN_WAJIB);
  });
  it("KH-validasiKoreksi-07: alasan sangat panjang (batas atas tidak dibatasi kontrak) tetap sah", () => {
    expect(validasiKoreksi({ ...sah, alasan: "a".repeat(20000) })).toEqual({});
  });
  it("KH-validasiKoreksi-08: tipe salah (undefined/null pada alasan, keputusan kosong) ditolak tanpa melempar galat", () => {
    const g = validasiKoreksi({ keputusan: "", alasan: undefined as unknown as string, jenisKekeliruan: "" });
    expect(g.alasan).toBe(PESAN_ALASAN_WAJIB);
    expect(g.keputusan).toBeTruthy();
    expect(validasiKoreksi({ ...sah, alasan: null as unknown as string }).alasan).toBe(PESAN_ALASAN_WAJIB);
  });
  it("KH-validasiKoreksi-09: nilai janggal tetapi mungkin sah: alasan berisi hanya tanda baca atau angka diterima", () => {
    expect(validasiKoreksi({ ...sah, alasan: "..." })).toEqual({});
    expect(validasiKoreksi({ ...sah, alasan: "12345" })).toEqual({});
  });
  it("KH-validasiKoreksi-10: huruf besar-kecil keputusan dibedakan; hanya dua nilai baku diterima", () => {
    expect(validasiKoreksi({ ...sah, keputusan: "memenuhi" }).keputusan).toBeTruthy();
    expect(validasiKoreksi({ ...sah, keputusan: "Tidak memenuhi" })).toEqual({});
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
