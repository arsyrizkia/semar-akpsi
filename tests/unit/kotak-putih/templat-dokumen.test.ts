// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): setiap cabang generator templat (.docx).
import { describe, expect, it } from "vitest";
import mammoth from "mammoth";
import { bagianDokumen, buatDokumenTemplat, panduanBagian } from "@/lib/templat/dokumen";

const skema = { kode: "PT", namaSkema: "Penelitian Terapan" };

describe("panduanBagian (cabang)", () => {
  it("KP-panduanBagian-01: Kata Kunci memakai panduan pemisah titik koma", () => {
    expect(panduanBagian({ nama: "Kata Kunci", batasKata: null, wajib: true })).toMatch(/titik koma/);
  });
  it("KP-panduanBagian-02: Daftar Pustaka memakai panduan urutan sitasi (nama dinormalisasi, penomoran diabaikan)", () => {
    expect(panduanBagian({ nama: "6. Daftar Pustaka", batasKata: null, wajib: false })).toMatch(/berurutan sesuai nomor sitasi.*opsional/);
  });
  it("KP-panduanBagian-03: batas kata null menjadi tanpa batas; angka diformat Indonesia", () => {
    expect(panduanBagian({ nama: "Lain", batasKata: null, wajib: true })).toBe("Panduan: tanpa batas kata. Bagian wajib.");
    expect(panduanBagian({ nama: "Lain", batasKata: 1500, wajib: true })).toBe("Panduan: maksimal 1.500 kata. Bagian wajib.");
  });
});

describe("bagianDokumen (cabang)", () => {
  it("KP-bagianDokumen-01: tanpa bagian sama sekali hanya berisi dua bagian wajib dengan urutan 1 dan 2", () => {
    expect(bagianDokumen([])).toEqual([
      { urutan: 1, nama: "Kata Kunci", batasKata: null, wajib: true },
      { urutan: 2, nama: "Daftar Pustaka", batasKata: null, wajib: true },
    ]);
  });
  it("KP-bagianDokumen-02: hanya satu yang kurang: hanya itu yang ditambahkan, nomor urut melanjutkan yang terbesar", () => {
    const hasil = bagianDokumen([
      { urutan: 7, nama: "Daftar pustaka", batasKata: null, wajib: true },
      { urutan: 2, nama: "Ringkasan", batasKata: 100, wajib: true },
    ]);
    expect(hasil.map((b) => [b.urutan, b.nama])).toEqual([
      [2, "Ringkasan"],
      [7, "Daftar pustaka"],
      [8, "Kata Kunci"],
    ]);
  });
  it("KP-bagianDokumen-03: masukan tidak diubah (tidak ada efek samping)", () => {
    const masukan = [{ urutan: 2, nama: "B", batasKata: null, wajib: true }, { urutan: 1, nama: "A", batasKata: null, wajib: true }];
    bagianDokumen(masukan);
    expect(masukan.map((b) => b.nama)).toEqual(["B", "A"]);
  });
});

describe("buatDokumenTemplat (cabang isi)", () => {
  it("KP-buatDokumenTemplat-01: periode null menulis 'belum ditetapkan'; tanpa lampiran menulis 'Tidak ada lampiran wajib'", async () => {
    const teks = (await mammoth.extractRawText({ buffer: await buatDokumenTemplat({ versi: 1, status: "Draf" }, [], [], skema, null) })).value;
    expect(teks).toContain("belum ditetapkan");
    expect(teks).toContain("Tidak ada lampiran wajib.");
    expect(teks).toContain("Versi templat: 1 (Draf)");
  });
  it("KP-buatDokumenTemplat-02: periode terisi menulis nama dan tahun; lampiran bernomor", async () => {
    const teks = (await mammoth.extractRawText({ buffer: await buatDokumenTemplat({ versi: 2, status: "Terbit" }, [], ["Surat A", "Surat B"], skema, { nama: "Seleksi 2026", tahun: 2026 }) })).value;
    expect(teks).toContain("Seleksi 2026 (2026)");
    expect(teks).toContain("1. Surat A");
    expect(teks).toContain("2. Surat B");
  });
  it("KP-buatDokumenTemplat-03: periode tanpa tahun tidak menulis tanda kurung", async () => {
    const teks = (await mammoth.extractRawText({ buffer: await buatDokumenTemplat({ versi: 2, status: "Terbit" }, [], [], skema, { nama: "Seleksi X" }) })).value;
    expect(teks).toContain("Periode berlaku: Seleksi X\n");
  });
});
