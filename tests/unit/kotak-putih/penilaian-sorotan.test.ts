// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification susunSorotan (sorotan kutipan bukti J-08); setiap cabang.
import { describe, expect, it } from "vitest";
import { cariPenandaGambar, nomorButirPerTab, susunSorotan } from "@/lib/penilaian/sorotan";

describe("susunSorotan", () => {
  it("KP-susunSorotan-01: tanpa rentang, teks utuh satu potongan tanpa sorotan", () => {
    expect(susunSorotan("Satu dua tiga.", [])).toEqual([{ jenis: "teks", teks: "Satu dua tiga.", rentang: [] }]);
  });
  it("KP-susunSorotan-02: satu rentang di tengah: teks, teks tersorot, label, teks", () => {
    const t = "Awal. Urgensi penelitian ini tinggi. Akhir.";
    const mulai = t.indexOf("Urgensi");
    const akhir = mulai + "Urgensi penelitian ini tinggi.".length;
    expect(susunSorotan(t, [{ id: "a#0", mulai, akhir }])).toEqual([
      { jenis: "teks", teks: "Awal. ", rentang: [] },
      { jenis: "teks", teks: "Urgensi penelitian ini tinggi.", rentang: ["a#0"] },
      { jenis: "label", rentang: ["a#0"] },
      { jenis: "teks", teks: " Akhir.", rentang: [] },
    ]);
  });
  it("KP-susunSorotan-03: dua rentang bertumpuk: bagian bersama menyandang keduanya, label di ujung masing-masing", () => {
    const t = "abcdefghij";
    const h = susunSorotan(t, [{ id: "b#0", mulai: 4, akhir: 9 }, { id: "a#0", mulai: 1, akhir: 6 }]);
    expect(h).toEqual([
      { jenis: "teks", teks: "a", rentang: [] },
      { jenis: "teks", teks: "bcd", rentang: ["a#0"] },
      { jenis: "teks", teks: "ef", rentang: ["a#0", "b#0"] },
      { jenis: "label", rentang: ["a#0"] },
      { jenis: "teks", teks: "ghi", rentang: ["b#0"] },
      { jenis: "label", rentang: ["b#0"] },
      { jenis: "teks", teks: "j", rentang: [] },
    ]);
  });
  it("KP-susunSorotan-04: penanda [gambar n] menjadi potongan gambar (dengan pindah barisnya); kutipan penanda menyorot gambar", () => {
    const t = "Tahapan berikut.\n[gambar 2]\nGambar 2. Diagram alir";
    const mulai = t.indexOf("[gambar 2]");
    const h = susunSorotan(t, [{ id: "a#0", mulai, akhir: mulai + "[gambar 2]".length }]);
    expect(h).toEqual([
      { jenis: "teks", teks: "Tahapan berikut.\n", rentang: [] },
      { jenis: "gambar", nomor: 2, teks: "[gambar 2]\n", rentang: ["a#0"] },
      { jenis: "label", rentang: ["a#0"] },
      { jenis: "teks", teks: "Gambar 2. Diagram alir", rentang: [] },
    ]);
  });
  it("KP-susunSorotan-05: ujung rentang di dalam penanda diperluas menutup penanda; rentang kosong atau di luar teks diabaikan", () => {
    const t = "x\n[gambar 1]\ny";
    const h = susunSorotan(t, [{ id: "a#0", mulai: 4, akhir: 8 }, { id: "z#0", mulai: 5, akhir: 5 }, { id: "q#0", mulai: 40, akhir: 50 }]);
    expect(h.filter((p) => p.jenis === "gambar")).toEqual([{ jenis: "gambar", nomor: 1, teks: "[gambar 1]\n", rentang: ["a#0"] }]);
    expect(h.some((p) => p.rentang.includes("z#0") || p.rentang.includes("q#0"))).toBe(false);
  });
  it("KP-cariPenandaGambar-01: hanya penanda bernomor sebaris penuh; [gambar] tanpa nomor dan penanda di tengah kalimat tetap teks", () => {
    expect(cariPenandaGambar("[gambar]\nlihat [gambar 1] di sini\n[gambar 3]")).toEqual([{ mulai: 34, akhir: 44, nomor: 3 }]);
  });
});

describe("nomorButirPerTab", () => {
  it("KP-nomorButirPerTab-01: nomor mulai dari 1 di setiap tab, mengikuti urutan butir", () => {
    const n = nomorButirPerTab([
      { hasilId: "a", tab: "Metode" },
      { hasilId: "b", tab: "Pendahuluan" },
      { hasilId: "c", tab: "Metode" },
    ]);
    expect([n.get("a"), n.get("b"), n.get("c")]).toEqual([1, 1, 2]);
  });
  it("KP-nomorButirPerTab-02: tanpa butir, peta kosong", () => {
    expect(nomorButirPerTab([]).size).toBe(0);
  });
});
