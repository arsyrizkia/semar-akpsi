// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): setiap cabang potongPerBagian (seq-uc05).
import { describe, expect, it } from "vitest";
import type { BagianTemplatDto } from "@/lib/kontrak/tipe";
import type { BlokTeks } from "@/lib/pengajuan/ekstraksi";
import { potongPerBagian } from "@/lib/pengajuan/potong";

const bagian: BagianTemplatDto[] = [
  { urutan: 1, nama: "Ringkasan", batasKata: 300, wajib: true },
  { urutan: 2, nama: "Metode", batasKata: 1200, wajib: true },
  { urutan: 3, nama: "Kata Kunci", batasKata: null, wajib: true },
];
const J = (teks: string, tingkat = 1): BlokTeks => ({ jenis: "judul", teks, tingkat });
const P = (teks: string): BlokTeks => ({ jenis: "paragraf", teks });

describe("potongPerBagian (cabang)", () => {
  it("KP-potongPerBagian-01: blok sebelum judul bagian pertama menjadi judul dokumen (baris kosong dilewati)", () => {
    const h = potongPerBagian([P("  "), P("Judul Proposal"), J("Ringkasan"), P("isi")], bagian);
    expect(h.judulDokumen).toBe("Judul Proposal");
    expect(h.teksPerBagian).toEqual({ Ringkasan: "isi" });
  });
  it("KP-potongPerBagian-02: tanpa satu pun judul bagian, hasil kosong dan judul dokumen dari blok pertama", () => {
    const h = potongPerBagian([P("Hanya paragraf"), P("lain")], bagian);
    expect(h.teksPerBagian).toEqual({});
    expect(h.judulBagianDitemukan).toEqual([]);
    expect(h.judulDokumen).toBe("Hanya paragraf");
  });
  it("KP-potongPerBagian-03: paragraf pendek yang isinya nama bagian (mis. PDF) dikenali sebagai judul", () => {
    const h = potongPerBagian([P("Judul"), P("Ringkasan"), P("isi ringkasan"), P("Metode"), P("isi metode")], bagian);
    expect(h.teksPerBagian).toEqual({ Ringkasan: "isi ringkasan", Metode: "isi metode" });
  });
  it("KP-potongPerBagian-04: paragraf lebih dari 80 karakter bernama sama dengan bagian bukan judul", () => {
    const panjang = "Ringkasan " + "x".repeat(80);
    const h = potongPerBagian([J("Ringkasan"), P(panjang)], bagian);
    expect(h.teksPerBagian.Ringkasan).toBe(panjang);
  });
  it("KP-potongPerBagian-05: judul bagian ganda: yang kedua menjadi isi, bukan bagian baru", () => {
    const h = potongPerBagian([J("Ringkasan"), P("a"), J("Ringkasan", 2), P("b")], bagian);
    expect(h.judulBagianDitemukan).toEqual(["Ringkasan"]);
    expect(h.teksPerBagian.Ringkasan).toBe("a\nRingkasan\nb");
  });
  it("KP-potongPerBagian-06: judul tingkat 1 di luar templat mengakhiri bagian dan isinya dibuang; tingkat 2 tidak mengakhiri", () => {
    const h = potongPerBagian([J("Ringkasan"), P("a"), J("Lampiran Tambahan"), P("dibuang"), J("Metode"), P("m"), J("Subbagian", 2), P("n")], bagian);
    expect(h.judulBagianDitemukan).toEqual(["Ringkasan", "Lampiran Tambahan", "Metode"]);
    expect(h.teksPerBagian).toEqual({ Ringkasan: "a", Metode: "m\nSubbagian\nn" });
  });
  it("KP-potongPerBagian-07: judul tanpa tingkat dianggap tingkat 1", () => {
    const h = potongPerBagian([J("Ringkasan"), P("a"), { jenis: "judul", teks: "Asing" }, P("x")], bagian);
    expect(h.teksPerBagian).toEqual({ Ringkasan: "a" });
  });
  it("KP-potongPerBagian-08: penomoran judul diabaikan saat mencocokkan nama", () => {
    const h = potongPerBagian([J("2. Metode"), P("m")], bagian);
    expect(h.teksPerBagian).toEqual({ Metode: "m" });
  });
});

describe("potongPerBagian kata kunci (cabang)", () => {
  it("KP-potongPerBagian-09: dari bagian 'Kata Kunci' (awalan dibuang; baris kosong pertama dilewati)", () => {
    const h = potongPerBagian([J("Kata Kunci"), P("Kata kunci: a; b; c")], bagian);
    expect(h.kataKunci).toBe("a; b; c");
  });
  it("KP-potongPerBagian-10: bagian 'Kata Kunci' ada tetapi kosong -> null", () => {
    expect(potongPerBagian([J("Kata Kunci")], bagian).kataKunci).toBeNull();
  });
  it("KP-potongPerBagian-11: tanpa bagian Kata Kunci di templat, baris 'Kata kunci: ...' di mana pun dipakai", () => {
    const h = potongPerBagian([J("Ringkasan"), P("isi"), P("Kata kunci: x; y")], [bagian[0]]);
    expect(h.kataKunci).toBe("x; y");
  });
  it("KP-potongPerBagian-12: tidak ada sama sekali -> null", () => {
    expect(potongPerBagian([J("Ringkasan"), P("isi")], [bagian[0]]).kataKunci).toBeNull();
  });
});
