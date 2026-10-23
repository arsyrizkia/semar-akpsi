// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-16 hitungKata, C-17 cekKataKunci, C-18 cocokkanSitasi, C-19 cekLampiran, C-20 cocokkanStrukturJudul; CRC ButirCek.
import { bagianBawaan } from "@/lib/templat/isian-substansi";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ButirCek, DokumenPeriksa, KonteksPeriksa, ParameterButir } from "@/lib/kontrak/tipe";
import { hitungKataContoh, susunContoh, type VarianContoh } from "@/lib/contoh/proposal";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import { periksaDeterministikTeks } from "@/lib/pemeriksa/deterministik/index";
import { cekKataKunci, cekLampiran, cocokkanSitasi, cocokkanStrukturJudul, periksaBatasKata, periksaDiagramAlir } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { fmt, hitungKata } from "@/lib/pemeriksa/deterministik/teks";

const baca = (n: string) => JSON.parse(readFileSync(path.join(process.cwd(), "data", "contoh", n), "utf8"));
const templat = baca("templat.json") as { lampiranWajib: string[] };
const katalog = baca("katalog-butir.json") as { butir: (Omit<ButirCek, "id" | "asal" | "status" | "parameter"> & { parameter: ParameterButir })[] };

/** Himpunan butir deterministik yang sama dengan seed: turunan templat PD + katalog manual. */
function butirPD(): ButirCek[] {
  const turunan = turunkanButirDariTemplat(bagianBawaan("dasar"), templat.lampiranWajib).map((b) => ({ ...b, pertanyaan: null, contohJawaban: null }));
  const semua = [
    ...turunan.map((b) => ({ ...b, asal: "templat" as const })),
    ...katalog.butir.map((b) => ({ ...b, asal: "manual" as const, aturanHitung: (b as { aturanHitung?: string }).aturanHitung ?? null, pertanyaan: b.pertanyaan ?? null, contohJawaban: b.contohJawaban ?? null })),
  ];
  return semua.map((b, i) => ({
    id: `b${i}`,
    kode: b.kode,
    deskripsi: b.deskripsi,
    jenis: b.jenis,
    asal: b.asal,
    komponen: b.komponen,
    pemeriksa: b.pemeriksa,
    parameter: b.parameter,
    aturanHitung: b.aturanHitung,
    pertanyaan: b.pertanyaan,
    contohJawaban: b.contohJawaban,
    status: "Aktif" as const,
  }));
}

const konteksPD: KonteksPeriksa = {
  bagianTemplat: bagianBawaan("dasar").map((b, i) => ({ urutan: i + 1, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })),
  lampiranWajib: templat.lampiranWajib,
};

function dokumenDariContoh(v: VarianContoh): DokumenPeriksa {
  const def = susunContoh(v);
  return {
    judul: def.judul,
    judulBima: def.judul,
    teksPerBagian: def.bagian,
    kataKunci: def.kataKunci,
    lampiranAda: def.lampiran.map((l) => l.nama),
    teksLampiran: {},
    judulBagianDitemukan: Object.keys(def.bagian),
  };
}

const gagalKode = (v: VarianContoh) =>
  periksaDeterministikTeks(dokumenDariContoh(v), butirPD(), konteksPD)
    .filter((h) => h.status === "Gagal")
    .map((h) => h.kode);

/** Hitung independen: kata pada teks bagian tanpa baris keterangan gambar. */
const kataTanpaKeterangan = (t: string) =>
  t
    .split("\n")
    .filter((b) => !/^Gambar \d+\./.test(b))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

describe("UC-06 pada tiga proposal contoh", () => {
  it("KH-periksaDeterministikTeks-01: contoh A: semua butir deterministik lolos", () => {
    const hasil = periksaDeterministikTeks(dokumenDariContoh("a"), butirPD(), konteksPD);
    expect(hasil.length).toBeGreaterThan(15);
    expect(hasil.filter((h) => h.status === "Gagal")).toEqual([]);
    expect(hasil.every((h) => h.angkaPembukti.length > 0)).toBe(true);
  });

  it("KH-periksaDeterministikTeks-02: contoh B: hanya jumlah kata bagian Metode yang gagal, dengan angka pembukti", () => {
    expect(gagalKode("b")).toEqual(["KTA-04"]);
    const def = susunContoh("b");
    const hasil = periksaDeterministikTeks(dokumenDariContoh("b"), butirPD(), konteksPD).find((h) => h.kode === "KTA-04")!;
    const n = kataTanpaKeterangan(def.bagian.Metode);
    expect(n).toBeGreaterThan(1000);
    expect(hasil.bagian).toBe("Metode");
    expect(hasil.angkaPembukti).toBe(`${fmt(n)} kata dari batas 1.000 (lebih ${fmt(n - 1000)} kata)`);
    expect(hasil.batasDilanggar).toBe(`Bagian "Metode": batas 1.000 kata, ditemukan ${fmt(n)} kata`);
  });

  it("KH-periksaDeterministikTeks-03: contoh C: kata kunci (4 dari 5) dan jumlah referensi (9 entri, 7 dikutip) gagal", () => {
    expect(gagalKode("c")).toEqual(["KAT-01", "SIT-03"]);
    const hasil = periksaDeterministikTeks(dokumenDariContoh("c"), butirPD(), konteksPD);
    expect(hasil.find((h) => h.kode === "KAT-01")!.angkaPembukti).toContain("4 kata kunci: kualitas air");
    const sit = hasil.find((h) => h.kode === "SIT-03")!;
    expect(sit.angkaPembukti).toContain("9 entri daftar pustaka, 7 referensi dikutip");
    expect(sit.angkaPembukti).toContain("nomor 8, 9 tidak dikutip");
    expect(hasil.find((h) => h.kode === "SIT-01")!.status).toBe("Lolos");
    expect(hasil.find((h) => h.kode === "SIT-02")!.status).toBe("Lolos");
  });

  it("KH-periksaDeterministikTeks-04: butir nonaktif/semantik tidak ikut dalam hasil murni", () => {
    const hasil = periksaDeterministikTeks(dokumenDariContoh("a"), butirPD(), konteksPD);
    expect(hasil.some((h) => h.kode.startsWith("ISI-0") && h.kode.endsWith("S"))).toBe(false);
    expect(hasil.some((h) => h.kode === "ART-S1")).toBe(false);
  });
});

describe("hitungKata", () => {
  it("KH-hitungKata-01: tidak menghitung tabel, gambar, dan keterangannya", () => {
    const teks = ["satu dua tiga", "[tabel]", "Tabel 1. Rincian biaya per tahun", "[gambar]", "Gambar 2: Diagram alir penelitian", "empat lima"].join("\n");
    expect(hitungKata(teks)).toBe(5);
  });
  it("KH-hitungKata-02: selaras dengan penghitung pembangkit contoh bila tanpa keterangan", () => {
    const t = "Ini kalimat contoh dengan delapan kata saja.\n\nParagraf kedua pendek.";
    expect(hitungKata(t)).toBe(hitungKataContoh(t));
  });
  it("KH-hitungKata-03: tanpa toleransi: tepat pada batas lolos, satu lebih gagal", () => {
    const dok = { ...dokumenDariContoh("a"), teksPerBagian: { Metode: Array(100).fill("kata").join(" ") } };
    expect(periksaBatasKata(dok, "Metode", 100).status).toBe("Lolos");
    expect(periksaBatasKata(dok, "Metode", 99).status).toBe("Gagal");
  });
});

describe("cekKataKunci", () => {
  const dok = (kk: string | null): DokumenPeriksa => ({ ...dokumenDariContoh("a"), kataKunci: kk });
  it("KH-cekKataKunci-01: tepat lima dipisah titik koma, boleh frasa", () => {
    expect(cekKataKunci(dok("a b; c; d; e f g; h"), 5, ";").status).toBe("Lolos");
  });
  it("KH-cekKataKunci-02: enam gagal", () => expect(cekKataKunci(dok("a; b; c; d; e; f"), 5, ";").status).toBe("Gagal"));
  it("KH-cekKataKunci-03: dipisah koma dikenali sebagai pemisah salah", () => {
    const h = cekKataKunci(dok("a, b, c, d, e"), 5, ";");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("5 kata kunci terbaca dengan koma");
    expect(h.angkaPembukti).toContain("bukan titik koma");
  });
  it("KH-cekKataKunci-04: kosong gagal", () => expect(cekKataKunci(dok(null), 5, ";").status).toBe("Gagal"));
});

describe("cocokkanSitasi", () => {
  const dasar = dokumenDariContoh("a");
  const dok = (isi: string, pustaka: string): DokumenPeriksa => ({
    ...dasar,
    teksPerBagian: { Pendahuluan: isi, "Daftar Pustaka": pustaka },
  });
  const kontekPendek: KonteksPeriksa = { bagianTemplat: [{ urutan: 1, nama: "Pendahuluan", batasKata: null, wajib: true }, { urutan: 2, nama: "Daftar Pustaka", batasKata: null, wajib: true }], lampiranWajib: [] };

  it("KH-cocokkanSitasi-01: sitasi gaya nama-tahun gagal", () => {
    const h = cocokkanSitasi(dok("Menurut (Santoso, 2020) hal ini benar [1].", "[1] A."), kontekPendek, "sitasi_bernomor");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("1 sitasi gaya nama-tahun");
  });
  it("KH-cocokkanSitasi-02: rentang dan daftar nomor diperluas", () => {
    const d = dok("Lihat [1-3] dan [4, 5].", "[1] A.\n[2] B.\n[3] C.\n[4] D.\n[5] E.");
    expect(cocokkanSitasi(d, kontekPendek, "jumlah_referensi_sama").status).toBe("Lolos");
    expect(cocokkanSitasi(d, kontekPendek, "pustaka_berurutan").status).toBe("Lolos");
  });
  it("KH-cocokkanSitasi-03: urutan pengutipan pertama yang melompat gagal", () => {
    const d = dok("Pertama [2] lalu [1].", "[1] A.\n[2] B.");
    const h = cocokkanSitasi(d, kontekPendek, "pustaka_berurutan");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("nomor 2 pertama kali dikutip sebelum nomor 1");
  });
  it("KH-cocokkanSitasi-04: nomor entri daftar pustaka loncat gagal", () => {
    const d = dok("Satu [1] dua [2].", "[1] A.\n[3] B.");
    expect(cocokkanSitasi(d, kontekPendek, "pustaka_berurutan").status).toBe("Gagal");
  });
  it("KH-cocokkanSitasi-05: nomor dikutip tanpa entri dilaporkan", () => {
    const d = dok("Satu [1] dua [2] tiga [3].", "[1] A.\n[2] B.");
    const h = cocokkanSitasi(d, kontekPendek, "jumlah_referensi_sama");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("nomor 3 dikutip tetapi tidak ada di daftar");
  });
  it("KH-cocokkanSitasi-06: tanpa Daftar Pustaka gagal", () => {
    const d: DokumenPeriksa = { ...dasar, teksPerBagian: { Pendahuluan: "Isi [1]." } };
    expect(cocokkanSitasi(d, kontekPendek, "pustaka_berurutan").status).toBe("Gagal");
  });
});

describe("cekLampiran dan struktur judul", () => {
  it("KH-cekLampiranStruktur-01: lampiran belum ada disebut dengan nama", () => {
    const d = { ...dokumenDariContoh("a"), lampiranAda: ["Surat Pernyataan Mitra"] };
    const h = cekLampiran(d, konteksPD, "Artikel Ketua Pengusul");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("1 dari 3 lampiran wajib ada");
    expect(h.angkaPembukti).toContain('"Artikel Ketua Pengusul"');
    expect(cekLampiran(d, konteksPD, "Surat Pernyataan Mitra").status).toBe("Lolos");
  });
  it("KH-cekLampiranStruktur-02: judul bagian berhuruf Isian Substansi (A. JUDUL ... H. DAFTAR PUSTAKA) dikenali", () => {
    const d = { ...dokumenDariContoh("a"), judulBagianDitemukan: ["A. JUDUL", "B. RINGKASAN", "C. KATA KUNCI", "D. PENDAHULUAN", "E. METODE", "F. HASIL YANG DIHARAPKAN", "G. JADWAL PENELITIAN", "H. DAFTAR PUSTAKA"] };
    expect(cocokkanStrukturJudul(d, konteksPD, { tipe: "struktur_judul" }).status).toBe("Lolos");
  });
  it("KH-cekLampiranStruktur-03: bagian hilang dan urutan salah gagal", () => {
    const d = { ...dokumenDariContoh("a"), judulBagianDitemukan: ["Judul", "Ringkasan", "Kata Kunci", "Metode", "Pendahuluan", "Hasil yang Diharapkan", "Tinjauan Pustaka"] };
    const h = cocokkanStrukturJudul(d, konteksPD, { tipe: "struktur_judul" });
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain('belum ada: "Jadwal Penelitian", "Daftar Pustaka"');
    expect(h.angkaPembukti).toContain("urutan tidak sesuai");
  });
  it("KH-cekLampiranStruktur-04: judul beda dari BIMA gagal, perbedaan huruf besar dan tanda baca lolos", () => {
    const d = dokumenDariContoh("a");
    expect(cocokkanStrukturJudul({ ...d, judul: d.judul.toUpperCase() + "." }, konteksPD, { tipe: "judul_sama" }).status).toBe("Lolos");
    expect(cocokkanStrukturJudul({ ...d, judul: "Judul Lain" }, konteksPD, { tipe: "judul_sama" }).status).toBe("Gagal");
  });
  it("KH-cekLampiranStruktur-05: diagram alir butuh keterangan gambar yang menyebutnya", () => {
    expect(periksaDiagramAlir(dokumenDariContoh("a"), "Metode").status).toBe("Lolos");
    const tanpa = { ...dokumenDariContoh("a"), teksPerBagian: { Metode: "Teks biasa tanpa gambar." } };
    expect(periksaDiagramAlir(tanpa, "Metode").status).toBe("Gagal");
  });
  it("KH-cekLampiranStruktur-06: butir tanpa parameter gagal tertutup", () => {
    const b: ButirCek = { ...butirPD()[0], parameter: null };
    const [h] = periksaDeterministikTeks(dokumenDariContoh("a"), [b], konteksPD);
    expect(h.status).toBe("Gagal");
  });
});
