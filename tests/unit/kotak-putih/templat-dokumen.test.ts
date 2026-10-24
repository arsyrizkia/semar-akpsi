// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-10 buatDokumenTemplat (Contract C-31); setiap cabang generator templat (.docx).
import { describe, expect, it } from "vitest";
import mammoth from "mammoth";
import JSZip from "jszip";
import { bagianDokumen, buatDokumenTemplat, panduanBagian } from "@/lib/templat/dokumen";

const skema = { kode: "PT", namaSkema: "Penelitian Terapan" };
/** Badan dokumen ditambah teks kaki halaman (metadata skema, periode, versi templat ada di kaki). */
async function teksDenganKaki(bytes: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const kaki = await Promise.all(Object.keys(zip.files).filter((n) => /^word\/footer\d+\.xml$/.test(n)).map(async (n) => (await zip.file(n)!.async("string")).replace(/<[^>]+>/g, "")));
  return `${(await mammoth.extractRawText({ buffer: bytes })).value}\n${kaki.join("\n")}`;
}

describe("panduanBagian (cabang)", () => {
  it("KP-panduanBagian-01: bagian Isian Substansi memakai kalimat petunjuk resmi; Kata Kunci menyebut titik koma", () => {
    expect(panduanBagian({ nama: "Kata Kunci", batasKata: null })).toBe("Isian 5 kata kunci yang dipisahkan dengan tanda titik koma (;)");
  });
  it("KP-panduanBagian-02: nama dinormalisasi (penomoran/huruf diabaikan) dan angka batas diisi dari batas kata bagian", () => {
    expect(panduanBagian({ nama: "6. Daftar Pustaka", batasKata: null })).toMatch(/^Sitasi disusun dan ditulis berdasarkan sistem nomor/);
    expect(panduanBagian({ nama: "D. Pendahuluan", batasKata: 1500 })).toContain("tidak lebih dari 1500 kata");
  });
  it("KP-panduanBagian-02b: atribut petunjuk pada bagian lebih diutamakan daripada petunjuk resmi turunan nama", () => {
    expect(panduanBagian({ nama: "Metode", batasKata: 1000, petunjuk: "Petunjuk khusus." })).toBe("Petunjuk khusus.");
  });
  it("KP-panduanBagian-03: bagian di luar Isian Substansi tanpa petunjuk tersimpan: tanpa kalimat petunjuk (tidak ada 'Panduan:' buatan); petunjuk kosong juga tanpa kalimat; {batas} diganti batas kata", () => {
    expect(panduanBagian({ nama: "Lain", batasKata: null })).toBeNull();
    expect(panduanBagian({ nama: "Lain", batasKata: 1500, petunjuk: "" })).toBeNull();
    expect(panduanBagian({ nama: "Lain", batasKata: 1500, petunjuk: "Maksimal {batas} kata." })).toBe("Maksimal 1500 kata.");
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
  it("KP-buatDokumenTemplat-01: periode null menulis 'belum ditetapkan'; tidak ada halaman lampiran (lampiran milik BIMA)", async () => {
    const teks = await teksDenganKaki(await buatDokumenTemplat({ versi: 1, status: "Draf" }, [], skema, null));
    expect(teks).toContain("belum ditetapkan");
    expect(teks).toContain("Versi templat: 1 (Draf)");
    expect(teks).not.toContain("LAMPIRAN 1.");
  });
  it("KP-buatDokumenTemplat-02: periode terisi menulis nama dan tahun; tidak ada halaman depan", async () => {
    const teks = await teksDenganKaki(await buatDokumenTemplat({ versi: 2, status: "Terbit" }, [], skema, { nama: "Seleksi 2026", tahun: 2026 }));
    expect(teks).toContain("Seleksi 2026 (2026)");
    expect(teks).not.toContain("PROTEKSI ISI PROPOSAL");
  });
  it("KP-buatDokumenTemplat-03: periode tanpa tahun tidak menulis tanda kurung", async () => {
    const teks = await teksDenganKaki(await buatDokumenTemplat({ versi: 2, status: "Terbit" }, [], skema, { nama: "Seleksi X" }));
    expect(teks).toContain("Periode berlaku: Seleksi X |");
  });
});
