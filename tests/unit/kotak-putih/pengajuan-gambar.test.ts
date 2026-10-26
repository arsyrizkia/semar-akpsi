// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification susunBarisHalaman, siapkanGambar, potongPerBagian
// (gambar per bagian); setiap cabang.
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { BagianTemplatDto, GambarNaskah } from "@/lib/kontrak/tipe";
import { susunBarisHalaman, type BlokTeks } from "@/lib/pengajuan/ekstraksi";
import { GAMBAR_MAKS_PER_BAGIAN, LUAS_MAKS_GAMBAR, SISI_MAKS_GAMBAR, siapkanGambar, ukuranSasaran } from "@/lib/pengajuan/gambar";
import { potongPerBagian } from "@/lib/pengajuan/potong";

describe("susunBarisHalaman", () => {
  const baris = [
    { teks: "Paragraf atas", y: 700 },
    { teks: "Gambar 1. Diagram alir", y: 480 },
    { teks: "Paragraf bawah", y: 300 },
  ];
  it("KP-susunBarisHalaman-01: gambar diletakkan sebelum baris pertama di bawah tepi bawahnya, keterangan mengikutinya", () => {
    expect(susunBarisHalaman(baris, [{ bawah: 500, indeks: 0 }])).toEqual([
      { teks: "Paragraf atas" },
      { gambar: 0 },
      { teks: "Gambar 1. Diagram alir" },
      { teks: "Paragraf bawah" },
    ]);
  });
  it("KP-susunBarisHalaman-02: dua gambar berurutan dari atas ke bawah walau urutan masukan terbalik", () => {
    const h = susunBarisHalaman(baris, [{ bawah: 350, indeks: 1 }, { bawah: 600, indeks: 0 }]);
    expect(h).toEqual([{ teks: "Paragraf atas" }, { gambar: 0 }, { teks: "Gambar 1. Diagram alir" }, { gambar: 1 }, { teks: "Paragraf bawah" }]);
  });
  it("KP-susunBarisHalaman-03: gambar di bawah semua baris, dan baris tanpa posisi, tidak memicu sisipan: gambar di akhir halaman", () => {
    expect(susunBarisHalaman([{ teks: "a", y: null }, { teks: "b", y: 400 }], [{ bawah: 100, indeks: 0 }])).toEqual([{ teks: "a" }, { teks: "b" }, { gambar: 0 }]);
  });
});

describe("ukuranSasaran dan siapkanGambar", () => {
  it("KP-ukuranSasaran-01: sisi terpanjang dan luas dibatasi, rasio tetap, gambar kecil tidak diperbesar", () => {
    const panjang = ukuranSasaran(4000, 1000);
    expect(panjang.lebar).toBeLessThanOrEqual(SISI_MAKS_GAMBAR);
    expect(Math.abs(panjang.lebar / panjang.tinggi - 4)).toBeLessThan(0.02);
    const luas = ukuranSasaran(1500, 1500);
    expect(luas.lebar * luas.tinggi).toBeLessThanOrEqual(LUAS_MAKS_GAMBAR);
    expect(ukuranSasaran(300, 200)).toEqual({ lebar: 300, tinggi: 200 });
  });
  it("KP-siapkanGambar-01: gambar dengan sisi terpendek di bawah batas (ikon, logo kecil) diabaikan", async () => {
    expect(await siapkanGambar({ piksel: new Uint8Array(60 * 400 * 3).fill(200), lebar: 400, tinggi: 60, kanal: 3 })).toBeNull();
  });
  it("KP-siapkanGambar-02: piksel mentah berlatar transparan menjadi PNG berlatar putih", async () => {
    const piksel = new Uint8Array(200 * 120 * 4); // RGBA transparan semua
    const g = (await siapkanGambar({ piksel, lebar: 200, tinggi: 120, kanal: 4 }))!;
    expect(g).toMatchObject({ tipe: "image/png", lebar: 200, tinggi: 120 });
    const { data } = await sharp(g.data).raw().toBuffer({ resolveWithObject: true });
    expect([data[0], data[1], data[2]]).toEqual([255, 255, 255]);
  });
  it("KP-siapkanGambar-03: gambar besar berderau (mirip foto) dikecilkan dan memakai JPEG bila lebih kecil", async () => {
    const lebar = 1800, tinggi = 1200;
    const piksel = new Uint8Array(lebar * tinggi * 3);
    let x = 12345;
    for (let i = 0; i < piksel.length; i++) piksel[i] = (x = (x * 1103515245 + 12345) & 0x7fffffff) & 0xff;
    const g = (await siapkanGambar({ piksel, lebar, tinggi, kanal: 3 }))!;
    expect(g.tipe).toBe("image/jpeg");
    expect(g.lebar * g.tinggi).toBeLessThanOrEqual(LUAS_MAKS_GAMBAR);
  });
  it("KP-siapkanGambar-04: berkas yang bukan gambar menghasilkan null", async () => {
    expect(await siapkanGambar({ berkas: Buffer.from("bukan gambar") })).toBeNull();
  });
});

describe("potongPerBagian: gambar per bagian", () => {
  const bagian: BagianTemplatDto[] = [
    { urutan: 1, nama: "Pendahuluan", batasKata: 1000, wajib: true },
    { urutan: 2, nama: "Metode", batasKata: 1000, wajib: true },
    { urutan: 3, nama: "Daftar Pustaka", batasKata: null, wajib: true },
  ];
  const gb = (n: number): GambarNaskah => ({ tipe: "image/png", data: Buffer.from([n]), lebar: 100, tinggi: 100 });
  const G = (g?: GambarNaskah): BlokTeks => ({ jenis: "gambar", teks: "[gambar]", ...(g ? { gambar: g } : {}) });
  const J = (teks: string): BlokTeks => ({ jenis: "judul", teks, tingkat: 1 });
  const P = (teks: string): BlokTeks => ({ jenis: "paragraf", teks });

  it("KP-potongPerBagian-G1: gambar sebelum bagian pertama (kop) dan di Daftar Pustaka tidak disimpan; penanda gambar tersimpan bernomor per bagian", () => {
    const h = potongPerBagian(
      [G(gb(0)), P("Judul"), J("Pendahuluan"), P("latar"), G(gb(1)), P("Gambar 1. Peta lokasi"), J("Metode"), G(gb(2)), P("Gambar 2. Diagram alir"), J("Daftar Pustaka"), G(gb(3)), P("[1] Rujukan.")],
      bagian,
    );
    expect(Object.keys(h.gambarPerBagian)).toEqual(["Pendahuluan", "Metode"]);
    expect(h.gambarPerBagian.Pendahuluan[0].data[0]).toBe(1);
    expect(h.gambarPerBagian.Metode[0].data[0]).toBe(2);
    expect(h.teksPerBagian.Pendahuluan).toBe("latar\n[gambar 1]\nGambar 1. Peta lokasi");
    expect(h.teksPerBagian.Metode).toContain("[gambar 1]");
    expect(h.teksPerBagian["Daftar Pustaka"]).toContain("[gambar]");
  });
  it("KP-potongPerBagian-G2: gambar tak terbaca tetap [gambar] tanpa nomor; lebih dari batas per bagian tidak disimpan", () => {
    const banyak = Array.from({ length: GAMBAR_MAKS_PER_BAGIAN + 1 }, (_, i) => G(gb(i)));
    const h = potongPerBagian([J("Metode"), G(), ...banyak], bagian);
    expect(h.gambarPerBagian.Metode).toHaveLength(GAMBAR_MAKS_PER_BAGIAN);
    const baris = h.teksPerBagian.Metode.split("\n");
    expect(baris[0]).toBe("[gambar]");
    expect(baris[1]).toBe("[gambar 1]");
    expect(baris[GAMBAR_MAKS_PER_BAGIAN]).toBe(`[gambar ${GAMBAR_MAKS_PER_BAGIAN}]`);
    expect(baris.at(-1)).toBe("[gambar]");
  });
});
