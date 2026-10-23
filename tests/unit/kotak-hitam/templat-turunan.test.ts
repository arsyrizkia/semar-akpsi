// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-03 (turunkanButirCek), pascakondisi Q1 sampai Q6.
// Dipanggil lewat alias seq-uc01 `turunkanButirCek` dari templat/layanan.ts (nilai sama dengan turunkanButirDariTemplat).
import { describe, expect, it } from "vitest";
import { turunkanButirDariTemplat as turunkanButirCek } from "@/lib/seed-butir";

const bagian = (nama: string, batasKata: number | null, wajib = true) => ({ nama, batasKata, wajib });

describe("turunkanButirCek (Contract C-03)", () => {
  it("KH-turunkanButirCek-01: templat kosong dan tanpa lampiran tidak menurunkan butir (Q5)", () => {
    expect(turunkanButirCek([], [])).toEqual([]);
  });

  it("KH-turunkanButirCek-02: bagian wajib menjadi BGN-nn dan bagian opsional tanpa batas kata tidak menghasilkan apa pun (Q1)", () => {
    const b = turunkanButirCek([bagian("Latar Belakang", null), bagian("Catatan", null, false)], []);
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ kode: "BGN-01", parameter: { tipe: "bagian_terisi", bagian: "Latar Belakang" }, pemeriksa: "periksaBagianTerisi", komponen: "Screening" });
  });

  it("KH-turunkanButirCek-03: batas kata tepat 0 tetap menghasilkan KTA-nn, bagian tanpa batas tidak (Q2, batas bawah)", () => {
    const b = turunkanButirCek([bagian("Ringkasan", 0, false), bagian("Metode", null, false)], []);
    expect(b.map((x) => x.kode)).toEqual(["KTA-01"]);
    expect(b[0].parameter).toEqual({ tipe: "batas_kata", bagian: "Ringkasan", batas: 0 });
  });

  it("KH-turunkanButirCek-04: setiap lampiran menjadi LMP-nn (Q3)", () => {
    const b = turunkanButirCek([], ["Surat Pernyataan Mitra", "Artikel Ketua Pengusul"]);
    expect(b.map((x) => [x.kode, x.parameter])).toEqual([
      ["LMP-01", { tipe: "lampiran_wajib", nama: "Surat Pernyataan Mitra" }],
      ["LMP-02", { tipe: "lampiran_wajib", nama: "Artikel Ketua Pengusul" }],
    ]);
    expect(b.every((x) => x.pemeriksa === "cekLampiran" && x.komponen === "Lampiran")).toBe(true);
  });

  it("KH-turunkanButirCek-05: penomoran dua digit terpisah per awalan dan urutan keluaran per bagian lalu lampiran (Q4)", () => {
    const b = turunkanButirCek([bagian("A", 100), bagian("B", 200), bagian("C", null)], ["L1"]);
    expect(b.map((x) => x.kode)).toEqual(["BGN-01", "KTA-01", "BGN-02", "KTA-02", "BGN-03", "LMP-01"]);
  });

  it("KH-turunkanButirCek-06: jumlah keluaran sama dengan bagian wajib ditambah bagian berbatas kata ditambah lampiran (Q5)", () => {
    const masukan = [bagian("A", 100), bagian("B", null), bagian("C", 50, false), bagian("D", null, false)];
    const b = turunkanButirCek(masukan, ["L1", "L2", "L3"]);
    expect(b).toHaveLength(2 + 2 + 3);
  });

  it("KH-turunkanButirCek-07: semua butir deterministik dan berasal dari templat (Q6); 12 butir menghasilkan nomor dua digit sampai 12", () => {
    const banyak = Array.from({ length: 12 }, (_, i) => bagian(`Bagian ${i + 1}`, null));
    const b = turunkanButirCek(banyak, []);
    expect(b.every((x) => x.jenis === "deterministik" && x.asal === "templat")).toBe(true);
    expect(b[11].kode).toBe("BGN-12");
  });

  it("KH-turunkanButirCek-08: nama bagian dengan tanda kutip tetap utuh pada parameter dan deskripsi (nilai janggal)", () => {
    const b = turunkanButirCek([bagian('Metode "Baru"', 10)], []);
    expect(b[0].parameter).toMatchObject({ bagian: 'Metode "Baru"' });
    expect(b[0].deskripsi).toContain('Metode "Baru"');
  });
});
