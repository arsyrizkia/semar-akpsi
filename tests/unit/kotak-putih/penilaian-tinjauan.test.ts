// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: bahan tampilan naskah bersorot (lib/penilaian/tinjauan.ts) yang dipakai J-08,
// J-05b, dan J-03b per dokumen: susunTab, pilihTab, susunButirTampil; setiap cabang.
import { describe, expect, it } from "vitest";
import type { ParameterButir } from "@/lib/kontrak/tipe";
import { pilihTab, susunButirTampil, susunTab, type BahanButir } from "@/lib/penilaian/tinjauan";

const gambar = [
  { id: "g1", bagian: "metode", nomor: 1, lebar: 800, tinggi: 600 },
  { id: "g2", bagian: "Lain", nomor: 1, lebar: 10, tinggi: 10 },
];

describe("susunTab", () => {
  it("KP-susunTab-01: urutan templat lebih dulu, bagian naskah di luar templat menyusul, lalu lampiran; gambar menurut nama bagian", () => {
    const tab = susunTab({
      urutanBagian: ["Pendahuluan", "Metode"],
      teksPerBagian: { metode: "Isi metode", Pendahuluan: "Isi pendahuluan", Tambahan: "Isi tambahan" },
      teksLampiran: { RAB: "Isi RAB" },
      gambar,
    });
    expect(tab.map((t) => [t.nama, t.jenis, t.teks])).toEqual([
      ["Pendahuluan", "bagian", "Isi pendahuluan"],
      ["Metode", "bagian", "Isi metode"],
      ["Tambahan", "bagian", "Isi tambahan"],
      ["Lampiran: RAB", "lampiran", "Isi RAB"],
    ]);
    expect(tab[1].gambar).toEqual([{ id: "g1", nomor: 1, lebar: 800, tinggi: 600 }]);
    expect(tab[0].gambar).toEqual([]);
  });
  it("KP-susunTab-02: tanpa lampiran dan bagian templat yang tidak ada di naskah tetap menjadi tab kosong", () => {
    const tab = susunTab({ urutanBagian: ["Judul"], teksPerBagian: {}, gambar: [] });
    expect(tab).toEqual([{ nama: "Judul", jenis: "bagian", teks: "", gambar: [] }]);
  });
});

describe("pilihTab", () => {
  const tabs = susunTab({ urutanBagian: ["Pendahuluan", "Metode"], teksPerBagian: { Pendahuluan: "Urgensi penelitian tinggi.", Metode: "Survei lapangan." }, teksLampiran: { RAB: "Rincian biaya." }, gambar: [] });
  const sem = (p: Partial<{ bagian: string; lampiran: string }>) => ({ tipe: "semantik", ...p }) as unknown as ParameterButir;
  it("KP-pilihTab-01: tab yang memuat kutipan menang atas bagian parameter", () => {
    expect(pilihTab(tabs, "Survei lapangan.", sem({ bagian: "Pendahuluan" }))).toBe("Metode");
  });
  it("KP-pilihTab-02: kutipan tidak ditemukan: lampiran parameter, lalu bagian parameter", () => {
    expect(pilihTab(tabs, "tidak ada", sem({ lampiran: "rab" }))).toBe("Lampiran: RAB");
    expect(pilihTab(tabs, null, sem({ bagian: " metode " }))).toBe("Metode");
  });
  it("KP-pilihTab-03: tanpa petunjuk, tab pertama; tanpa tab, kosong", () => {
    expect(pilihTab(tabs, null, null)).toBe("Pendahuluan");
    expect(pilihTab([], null, null)).toBe("");
  });
});

describe("susunButirTampil", () => {
  it("KP-susunButirTampil-01: parameter dibuang, tab diisi menurut pilihTab, sisa field utuh", () => {
    const tabs = susunTab({ urutanBagian: ["Pendahuluan", "Metode"], teksPerBagian: { Pendahuluan: "a", Metode: "Survei lapangan." }, gambar: [] });
    const bahan: BahanButir = {
      hasilId: "h1",
      kode: "UNS-01",
      deskripsi: "Metode sesuai tujuan",
      parameter: null,
      status: "Memenuhi",
      rekomendasi: "Memenuhi",
      kutipan: "Survei lapangan.",
      kutipanLain: [],
      tingkatKeyakinan: 0.9,
      alasanSistem: null,
      tiruan: false,
      koreksi: null,
    };
    const [b] = susunButirTampil([bahan], tabs);
    expect(b.tab).toBe("Metode");
    expect(b).not.toHaveProperty("parameter");
    expect(b.deskripsi).toBe("Metode sesuai tujuan");
  });
});
