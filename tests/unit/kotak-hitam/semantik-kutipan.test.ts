// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-24 ButirCek.cocokkanKutipan dan Contract C-23 VersiProposal.siapkanTeksTanpaIdentitas; CRC ButirCek dan VersiProposal.
import { describe, expect, it } from "vitest";
import { cariKutipan, cocokkanKutipan, siapkanTeksTanpaIdentitas } from "@/lib/pemeriksa/semantik/teks";

describe("cocokkanKutipan", () => {
  const teks = "Kalimat pertama.\n  Tujuan   penelitian adalah\nmembangun model.";
  it("KH-cocokkanKutipan-01: abaikan perbedaan spasi dan baris baru, tetapi persis pada kata", () => {
    expect(cocokkanKutipan(teks, "Tujuan penelitian adalah membangun model.")).toBe(true);
    expect(cocokkanKutipan(teks, "tujuan penelitian adalah membangun model.")).toBe(false);
    expect(cocokkanKutipan(teks, "Tujuan penelitian ialah membangun model.")).toBe(false);
    expect(cocokkanKutipan(teks, "")).toBe(false);
  });
  it("KH-cocokkanKutipan-02: mengembalikan rentang di teks asli", () => {
    const r = cariKutipan(teks, "Tujuan penelitian adalah");
    expect(r && teks.slice(r.mulai, r.akhir)).toBe("Tujuan   penelitian adalah");
  });
  it("KH-cocokkanKutipan-03: karakter regex dalam kutipan tidak merusak pencarian", () => {
    expect(cocokkanKutipan("Biaya (Rp 1.000) [3] + pajak?", "(Rp 1.000) [3] + pajak?")).toBe(true);
  });
});

describe("cocokkanKutipan: normalisasi tanda kutip (Contract C-24 ButirCek.cocokkanKutipan)", () => {
  it("KH-cocokkanKutipan-04: tanda kutip lengkung di teks cocok dengan tanda kutip lurus dari LLM, dan sebaliknya", () => {
    const teks = "Pengusul menyebut \u201Cmodel prediksi\u201D dan \u2018baseline\u2019 sebagai pembanding.";
    expect(cocokkanKutipan(teks, 'menyebut "model prediksi" dan \'baseline\' sebagai')).toBe(true);
    expect(cocokkanKutipan('Ia menulis "model prediksi" di sini.', "menulis \u201Cmodel prediksi\u201D di")).toBe(true);
  });
  it("KH-cocokkanKutipan-05: rentang yang dikembalikan menunjuk teks asli (tanda kutip lengkung tetap ada)", () => {
    const teks = "Ia menulis \u201Cmodel prediksi\u201D di sini.";
    const r = cariKutipan(teks, 'menulis "model prediksi"');
    expect(r && teks.slice(r.mulai, r.akhir)).toBe("menulis \u201Cmodel prediksi\u201D");
  });
  it("KH-cocokkanKutipan-06: batas bawah dan tipe salah: kosong, spasi saja, null, undefined tidak cocok", () => {
    for (const k of ["", "   \n", null, undefined]) expect(cocokkanKutipan("Teks apa saja.", k)).toBe(false);
    expect(cocokkanKutipan("", "Teks")).toBe(false);
  });
  it("KH-cocokkanKutipan-07: nilai janggal: tanda kutip yang hilang atau beda jenis (apostrof vs kutip ganda) tidak cocok", () => {
    expect(cocokkanKutipan('Ia menulis "model" di sini.', "menulis model di")).toBe(false);
    expect(cocokkanKutipan("Ia menulis 'model' di sini.", 'menulis "model" di')).toBe(false);
  });
  it("KH-cocokkanKutipan-08: kutipan lebih panjang dari teks tidak cocok; kutipan sama persis dengan seluruh teks cocok", () => {
    expect(cocokkanKutipan("Satu dua.", "Satu dua. Tiga.")).toBe(false);
    expect(cocokkanKutipan("Satu dua.", "Satu dua.")).toBe(true);
  });
});

describe("siapkanTeksTanpaIdentitas: nilai sah dan janggal (Contract C-23 VersiProposal.siapkanTeksTanpaIdentitas)", () => {
  const id = { nama: "Dr. Sekar Anindita, M.Sc.", institusi: "Universitas Contoh Nusantara", nomorInduk: "0012345678" };
  it("KH-siapkanTeksTanpaIdentitas-01: tidak membedakan huruf besar-kecil dan spasi ganda pada nama", () => {
    const h = siapkanTeksTanpaIdentitas("Ditulis oleh SEKAR   ANINDITA di sini.", id);
    expect(h).not.toMatch(/sekar|anindita/i);
  });
  it("KH-siapkanTeksTanpaIdentitas-02: karakter regex pada nama institusi tidak merusak pencarian", () => {
    const h = siapkanTeksTanpaIdentitas("Afiliasi: PT. Maju (Persero) [Tbk].", { institusi: "PT. Maju (Persero) [Tbk]." });
    expect(h).not.toContain("Maju");
    expect(h).toContain("[identitas dihapus]");
  });
  it("KH-siapkanTeksTanpaIdentitas-03: batas bawah, identitas dua huruf atau kosong tidak dibuang (agar teks tidak rusak)", () => {
    expect(siapkanTeksTanpaIdentitas("Di Ab dan seterusnya.", { nama: "Ab", institusi: "", nomorInduk: null })).toBe("Di Ab dan seterusnya.");
  });
  it("KH-siapkanTeksTanpaIdentitas-04: teks kosong tetap kosong", () => {
    expect(siapkanTeksTanpaIdentitas("", id)).toBe("");
  });
});
