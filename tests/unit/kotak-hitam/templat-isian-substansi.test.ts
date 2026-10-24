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
  kepalaBawaan,
  hurufBagian,
  judulBerhuruf,
  petunjukResmi,
} from "@/lib/templat/isian-substansi";

const baca = (n: string) => JSON.parse(readFileSync(path.join(process.cwd(), "data", "contoh", n), "utf8"));
const templat = baca("templat.json") as { label: string; lampiranWajib: string[] };
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

  it("KH-isianSubstansi-03: bagian bawaan Dasar dan Terapan memuat ketentuan per bagian (daftar 5 butir ';', wajib gambar Metode, tabel Jadwal, sitasi bernomor, daftar pustaka); seed templat.json berlabel struktur Isian Substansi", () => {
    for (const skema of ["dasar", "terapan"] as const) {
      const b = Object.fromEntries(bagianBawaan(skema).map((x) => [x.nama, x]));
      expect(b["Kata Kunci"]).toMatchObject({ jenisIsian: "daftar", jumlahButir: 5, pemisah: ";" });
      expect(b["Metode"]).toMatchObject({ jenisIsian: "teks", wajibGambar: true });
      expect(b["Jadwal Penelitian"]).toMatchObject({ jenisIsian: "tabel" });
      expect(b["Pendahuluan"].sitasiBernomor).toBe(true);
      expect(b["Daftar Pustaka"]).toMatchObject({ daftarPustaka: true, sitasiBernomor: true });
      expect(bagianBawaan(skema).filter((x) => x.daftarPustaka)).toHaveLength(1);
    }
    expect(kepalaBawaan("dasar").subjudul).toBe("SKEMA PENELITIAN DASAR (PENELITIAN DASAR FUNDAMENTAL DAN PENELITIAN KERJA SAMA ANTAR PERGURUAN TINGGI)");
    expect(kepalaBawaan("terapan").subjudul).toBe("SKEMA PENELITIAN TERAPAN");
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
  it("KH-isianSubstansi-06: turunan templat Dasar per ketentuan: delapan butir bagian terisi, empat batas kata (Judul 20, Ringkasan 300, Pendahuluan 1000, Metode 1000), satu kata kunci, satu gambar, satu tabel, tiga sitasi, tiga lampiran", () => {
    const butir = turunkanButirDariTemplat(bagianBawaan("dasar"));
    expect(butir.filter((b) => b.parameter.tipe === "bagian_terisi")).toHaveLength(8);
    const kata = butir.filter((b) => b.parameter.tipe === "batas_kata");
    expect(kata.map((b) => [b.kode, b.parameter])).toEqual([
      ["KTA-01", { tipe: "batas_kata", bagian: "Judul", batas: 20 }],
      ["KTA-02", { tipe: "batas_kata", bagian: "Ringkasan", batas: 300 }],
      ["KTA-03", { tipe: "batas_kata", bagian: "Pendahuluan", batas: 1000 }],
      ["KTA-04", { tipe: "batas_kata", bagian: "Metode", batas: 1000 }],
    ]);
    expect(kata[3].deskripsi).toBe('Bagian “Metode” tidak melebihi 1.000 kata');
    expect(kata[3].aturanHitung).toContain("kalimat petunjuk templat");
    expect(butir.find((b) => b.kode === "KAT-01")).toMatchObject({ deskripsi: "Kata kunci tepat 5, dipisahkan titik koma (;)", pemeriksa: "cekKataKunci", parameter: { tipe: "kata_kunci", jumlah: 5, pemisah: ";" } });
    expect(butir.find((b) => b.kode === "GBR-01")).toMatchObject({ parameter: { tipe: "diagram_alir", bagian: "Metode" } });
    expect(butir.find((b) => b.kode === "TBL-01")).toMatchObject({ pemeriksa: "cekTabel", parameter: { tipe: "tabel_wajib", bagian: "Jadwal Penelitian" } });
    expect(butir.filter((b) => b.pemeriksa === "cocokkanSitasi").map((b) => [b.kode, b.parameter.tipe])).toEqual([
      ["SIT-01", "sitasi_bernomor"],
      ["SIT-02", "pustaka_berurutan"],
      ["SIT-03", "jumlah_referensi_sama"],
    ]);
    // lampiran milik BIMA: SEMAR tidak menurunkan butir lampiran (arah-isi-saja-2026-10-24)
    expect(butir.filter((b) => /^(LMP|FMT)-/.test(b.kode))).toHaveLength(0);
  });

  it("KH-isianSubstansi-07: turunan templat Terapan: batas Pendahuluan 1500", () => {
    const kata = turunkanButirDariTemplat(bagianBawaan("terapan")).filter((b) => b.parameter.tipe === "batas_kata");
    expect(kata.map((b) => (b.parameter as { batas: number }).batas)).toEqual([20, 300, 1500, 1000]);
  });

  it("KH-isianSubstansi-08: setiap bagian yang dirujuk butir katalog ada di templat Dasar dan Terapan; kata kunci tepat 5 dipisah titik koma", () => {
    const nama = new Set(bagianBawaan("dasar").map((b) => b.nama));
    expect(new Set(bagianBawaan("terapan").map((b) => b.nama))).toEqual(nama);
    for (const b of katalog.butir) {
      if (b.parameter.bagian) expect(nama.has(b.parameter.bagian), `${b.kode} merujuk bagian ${b.parameter.bagian}`).toBe(true);
    }
    // kata kunci, sitasi, diagram alir, dan bagian wajib berasal dari templat, bukan katalog manual
    expect(katalog.butir.some((b) => ["KAT-01", "SIT-01", "SIT-02", "SIT-03", "ISI-03D"].includes(b.kode))).toBe(false);
  });
});
