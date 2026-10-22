// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Class Diagram TemplatProposal 1 — 0..* BagianTemplat, Contract C-01/C-31 (struktur Isian Substansi),
// Contract C-16 hitungKata dan C-17 cekKataKunci (butir turunan); data templat seed data/contoh/templat.json.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import {
  BAGIAN_ISIAN_SUBSTANSI,
  PENGANTAR_ISIAN_SUBSTANSI,
  bagianBawaan,
  hurufBagian,
  judulBerhuruf,
  petunjukResmi,
} from "@/lib/templat/isian-substansi";

const baca = (n: string) => JSON.parse(readFileSync(path.join(process.cwd(), "data", "contoh", n), "utf8"));
const templat = baca("templat.json") as { label: string; lampiranWajib: string[]; templat: Record<string, { nama: string; batasKata: number | null; wajib: boolean }[]> };
const katalog = baca("katalog-butir.json") as { butir: { kode: string; parameter: { tipe: string; bagian?: string; jumlah?: number; pemisah?: string } }[] };

describe("Isian Substansi Proposal: struktur templat", () => {
  it("KH-isianSubstansi-01: delapan bagian A-H berurutan dengan judul berhuruf besar", () => {
    expect(BAGIAN_ISIAN_SUBSTANSI.map((b, i) => judulBerhuruf(i, b.nama))).toEqual([
      "A. JUDUL",
      "B. RINGKASAN",
      "C. KATA KUNCI",
      "D. PENDAHULUAN",
      "E. METODE",
      "F. HASIL YANG DIHARAPKAN",
      "G. JADWAL PENELITIAN",
      "H. DAFTAR PUSTAKA",
    ]);
    expect(hurufBagian(0)).toBe("A");
    expect(hurufBagian(25)).toBe("Z");
    expect(hurufBagian(26)).toBe("27");
  });

  it("KH-isianSubstansi-02: batas kata: Judul 20, Ringkasan 300, Pendahuluan 1000 (Dasar) atau 1500 (Terapan), Metode 1000, sisanya tanpa batas", () => {
    const dasar = Object.fromEntries(bagianBawaan("dasar").map((b) => [b.nama, b.batasKata]));
    const terapan = Object.fromEntries(bagianBawaan("terapan").map((b) => [b.nama, b.batasKata]));
    expect(dasar).toEqual({ Judul: 20, Ringkasan: 300, "Kata Kunci": null, Pendahuluan: 1000, Metode: 1000, "Hasil yang Diharapkan": null, "Jadwal Penelitian": null, "Daftar Pustaka": null });
    expect(terapan).toEqual({ ...dasar, Pendahuluan: 1500 });
    expect(bagianBawaan("dasar").every((b) => b.wajib)).toBe(true);
  });

  it("KH-isianSubstansi-03: seed data/contoh/templat.json sama persis dengan struktur Isian Substansi (Dasar dan Terapan) dan berlabel struktur Isian Substansi", () => {
    expect(templat.templat.PD).toEqual(bagianBawaan("dasar"));
    expect(templat.templat.PT).toEqual(bagianBawaan("terapan"));
    expect(templat.label).toBe("struktur mengikuti Isian Substansi Proposal");
    expect(templat.lampiranWajib).toEqual(["Surat Pernyataan Mitra", "Artikel Ketua Pengusul", "Surat Keterangan Mahasiswa Bimbingan"]);
  });

  it("KH-isianSubstansi-04: kalimat petunjuk resmi per bagian, angka batas diisi dari batas kata bagian", () => {
    expect(petunjukResmi("Judul", 20)).toBe("Tuliskan judul usulan penelitian maksimal 20 kata");
    expect(petunjukResmi("Ringkasan", 300)).toBe("Isian ringkasan penelitian tidak lebih dari 300 kata yang berisi urgensi, tujuan, metode, dan luaran yang ditargetkan");
    expect(petunjukResmi("Kata Kunci", null)).toBe("Isian 5 kata kunci yang dipisahkan dengan tanda titik koma (;)");
    expect(petunjukResmi("Pendahuluan", 1000)).toMatch(/^Pendahuluan penelitian tidak lebih dari 1000 kata yang memuat, latar belakang,/);
    expect(petunjukResmi("D. Pendahuluan", 1500)).toContain("tidak lebih dari 1500 kata");
    expect(petunjukResmi("Metode", 1000)).toContain("Metode penelitian harus sejalan dengen Rencana Anggaran Biaya (RAB).");
    expect(petunjukResmi("Hasil yang Diharapkan", null)).toBe("Jelaskan hasil yang diharapkan atau luaran yang dijanjikan dari penelitian");
    expect(petunjukResmi("Jadwal Penelitian", null)).toMatch(/^Jadwal penelitian disusun berdasarkan pelaksanaan penelitian/);
    expect(petunjukResmi("Daftar Pustaka", null)).toMatch(/Hanya pustaka yang disitasi pada usulan penelitian yang dicantumkan dalam Daftar Pustaka\.$/);
    expect(PENGANTAR_ISIAN_SUBSTANSI).toMatch(/^Pengusul hanya diperkenankan mengisi di tempat yang telah disediakan/);
  });

  it("KH-isianSubstansi-05: batas kata null memakai batas resmi bawaan; bagian di luar Isian Substansi tanpa petunjuk resmi (null)", () => {
    expect(petunjukResmi("Metode", null)).toContain("tidak lebih dari 1000 kata");
    expect(petunjukResmi("Rencana Hilirisasi", 400)).toBeNull();
  });
});

describe("Isian Substansi Proposal: butir cek turunan dan katalog", () => {
  it("KH-isianSubstansi-06: turunan templat Dasar: delapan butir bagian wajib, empat butir batas kata (Judul 20, Ringkasan 300, Pendahuluan 1000, Metode 1000), tiga lampiran", () => {
    const butir = turunkanButirDariTemplat(templat.templat.PD, templat.lampiranWajib);
    expect(butir.filter((b) => b.parameter.tipe === "bagian_wajib")).toHaveLength(8);
    const kata = butir.filter((b) => b.parameter.tipe === "batas_kata");
    expect(kata.map((b) => [b.kode, b.parameter])).toEqual([
      ["KTA-01", { tipe: "batas_kata", bagian: "Judul", batas: 20 }],
      ["KTA-02", { tipe: "batas_kata", bagian: "Ringkasan", batas: 300 }],
      ["KTA-03", { tipe: "batas_kata", bagian: "Pendahuluan", batas: 1000 }],
      ["KTA-04", { tipe: "batas_kata", bagian: "Metode", batas: 1000 }],
    ]);
    expect(kata[3].deskripsi).toBe('Bagian "Metode" tidak melebihi 1000 kata');
    expect(kata[3].aturanHitung).toContain("kalimat petunjuk templat");
    expect(butir.filter((b) => b.parameter.tipe === "lampiran_wajib")).toHaveLength(3);
  });

  it("KH-isianSubstansi-07: turunan templat Terapan: batas Pendahuluan 1500", () => {
    const kata = turunkanButirDariTemplat(templat.templat.PT, templat.lampiranWajib).filter((b) => b.parameter.tipe === "batas_kata");
    expect(kata.map((b) => (b.parameter as { batas: number }).batas)).toEqual([20, 300, 1500, 1000]);
  });

  it("KH-isianSubstansi-08: setiap bagian yang dirujuk butir katalog ada di templat Dasar dan Terapan; kata kunci tepat 5 dipisah titik koma", () => {
    const nama = new Set(templat.templat.PD.map((b) => b.nama));
    expect(new Set(templat.templat.PT.map((b) => b.nama))).toEqual(nama);
    for (const b of katalog.butir) {
      if (b.parameter.bagian) expect(nama.has(b.parameter.bagian), `${b.kode} merujuk bagian ${b.parameter.bagian}`).toBe(true);
    }
    const kk = katalog.butir.find((b) => b.kode === "KAT-01")!;
    expect(kk.parameter).toMatchObject({ tipe: "kata_kunci", jumlah: 5, pemisah: ";" });
  });
});
