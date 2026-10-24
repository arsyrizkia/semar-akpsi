// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-31 TemplatProposal.buatDokumenTemplat (tabel jadwal berkotak bulan),
// Contract C-18 cekTabel (kolom wajib berbentuk rentang), Class Diagram BagianTemplat (kolomTabel, judulTabel).
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import type { BagianTemplatDto } from "@/lib/kontrak/tipe";
import { buatDokumenTemplat } from "@/lib/templat/dokumen";
import { judulBlokTahun, pecahKotak, ringkasKolomTabel, uraiKolomRentang } from "@/lib/templat/kolom-rentang";
import { ringkasKetentuan } from "@/lib/templat/isian-substansi";
import { cekTabel } from "@/lib/pemeriksa/deterministik/pemeriksa";
import type { DokumenPeriksa } from "@/lib/kontrak/tipe";

const skema = { kode: "PD", namaSkema: "Penelitian Dasar" };
const jadwal = (kolom: string[], judulTabel?: string): BagianTemplatDto[] => [{ urutan: 1, nama: "Jadwal Penelitian", batasKata: null, wajib: true, jenisIsian: "tabel", kolomTabel: kolom, judulTabel: judulTabel ?? null }];
async function xmlDokumen(b: BagianTemplatDto[]): Promise<string> {
  const bytes = await buatDokumenTemplat({ versi: 1, status: "Draf" }, b, [], skema, null, { mode: "isian" });
  return (await (await JSZip.loadAsync(bytes)).file("word/document.xml")!.async("string")) ?? "";
}
const hitung = (xml: string, pola: RegExp) => (xml.match(pola) ?? []).length;

describe("uraiKolomRentang (C-31)", () => {
  it("KH-kolomRentang-01: rentang dengan en dash atau tanda hubung biasa terurai; nama dan jumlah benar", () => {
    expect(uraiKolomRentang("Bulan 1–12")).toEqual({ nama: "Bulan", dari: 1, sampai: 12, jumlah: 12 });
    expect(uraiKolomRentang("Bulan 1-24")).toEqual({ nama: "Bulan", dari: 1, sampai: 24, jumlah: 24 });
    expect(uraiKolomRentang("  Minggu 1 – 8 ")?.jumlah).toBe(8);
  });
  it("KH-kolomRentang-02: bukan rentang sah (nilai salah, batas bawah/atas): null", () => {
    for (const k of ["Bulan", "Nama Kegiatan", "No", "Bulan 0–12", "Bulan 5–3", "Bulan 1–121", "1–12", "Bulan a–b", ""]) expect(uraiKolomRentang(k), k).toBeNull();
    expect(uraiKolomRentang("Bulan 1–120")?.jumlah).toBe(120);
  });
  it("KH-kolomRentang-03: pecah per tahun: 12 jadi satu, 24 jadi dua, 18 jadi 12+6, 36 jadi tiga, 5 tetap, 0 kosong", () => {
    expect(pecahKotak(12)).toEqual([12]);
    expect(pecahKotak(24)).toEqual([12, 12]);
    expect(pecahKotak(18)).toEqual([12, 6]);
    expect(pecahKotak(36)).toEqual([12, 12, 12]);
    expect(pecahKotak(5)).toEqual([5]);
    expect(pecahKotak(13)).toEqual([12, 1]);
    expect(pecahKotak(0)).toEqual([]);
  });
  it("KH-kolomRentang-04: judul blok mengikuti pola 'Tahun ke-'; tanpa pola diberi akhiran; satu tabel apa adanya", () => {
    expect(judulBlokTahun("Tahun ke-1", 2, 3)).toBe("Tahun ke-2");
    expect(judulBlokTahun(null, 1, 2)).toBe("Tahun ke-1");
    expect(judulBlokTahun("Jadwal", 2, 2)).toBe("Jadwal – Tahun ke-2");
    expect(judulBlokTahun("Jadwal", 1, 1)).toBe("Jadwal");
    expect(judulBlokTahun(null, 1, 1)).toBeNull();
    expect(judulBlokTahun("  ", 1, 1)).toBeNull();
  });
  it("KH-kolomRentang-05: ringkasan chip menyebut tahun hanya bila lebih dari 12", () => {
    expect(ringkasKolomTabel(["No", "Nama Kegiatan", "Bulan 1–24"])).toBe("No, Nama Kegiatan, Bulan ×24 (2 tahun)");
    expect(ringkasKolomTabel(["No", "Bulan 1-12"])).toBe("No, Bulan ×12");
    expect(ringkasKolomTabel(["Bulan 1–18"])).toBe("Bulan ×18 (2 tahun)");
    expect(ringkasKetentuan(jadwal(["No", "Nama Kegiatan", "Bulan 1–24"])[0])).toEqual(["tabel: No, Nama Kegiatan, Bulan ×24 (2 tahun)"]);
  });
});

describe("tabel jadwal di .docx (C-31)", () => {
  it("KH-jadwalDocx-01: Bulan 1–12 menjadi satu tabel: kepala 'Bulan' menggabung 12 kolom, 12 kotak, kolom lain vMerge", async () => {
    const x = await xmlDokumen(jadwal(["No", "Nama Kegiatan", "Bulan 1–12"], "Tahun ke-1"));
    expect(hitung(x, /<w:gridSpan w:val="12"\/>/g)).toBe(1);
    expect(x).toContain("Tahun ke-1");
    expect(x).not.toContain("Tahun ke-2");
    expect(hitung(x, /<w:vMerge w:val="restart"\/>/g)).toBe(2);
    expect(hitung(x, /<w:vMerge w:val="continue"\/>/g)).toBe(2);
    for (const n of [1, 6, 12]) expect(x).toContain(`>${n}</w:t>`);
    expect(x).toContain(">Bulan</w:t>");
    expect(x).not.toContain("Bulan 1–12");
  });
  it("KH-jadwalDocx-02: Bulan 1-24 (tanda hubung biasa) menjadi dua tabel Tahun ke-1 dan Tahun ke-2, masing-masing 12 kotak", async () => {
    const x = await xmlDokumen(jadwal(["No", "Nama Kegiatan", "Bulan 1-24"], "Tahun ke-1"));
    expect(hitung(x, /<w:gridSpan w:val="12"\/>/g)).toBe(2); // dua kepala 'Bulan' (baris judul blok selebar 14 kolom: 12 kotak + No + Nama Kegiatan)
    expect(x).toContain("Tahun ke-1");
    expect(x).toContain("Tahun ke-2");
    expect(x).not.toContain("Tahun ke-3");
    expect(x).not.toContain("Bulan 1-24");
  });
  it("KH-jadwalDocx-03: Bulan 1–18 menjadi tabel 12 kotak lalu tabel 6 kotak", async () => {
    const x = await xmlDokumen(jadwal(["No", "Nama Kegiatan", "Bulan 1–18"]));
    expect(hitung(x, /<w:gridSpan w:val="6"\/>/g)).toBe(1);
    expect(hitung(x, /<w:gridSpan w:val="12"\/>/g)).toBe(1);
    expect(x).toContain("Tahun ke-1");
    expect(x).toContain("Tahun ke-2");
  });
  it("KH-jadwalDocx-04: Bulan 1–36 menjadi tiga tabel", async () => {
    const x = await xmlDokumen(jadwal(["No", "Nama Kegiatan", "Bulan 1–36"], "Tahun ke-1"));
    for (const t of ["Tahun ke-1", "Tahun ke-2", "Tahun ke-3"]) expect(x).toContain(t);
    expect(x).not.toContain("Tahun ke-4");
  });
  it("KH-jadwalDocx-05: tanpa kolom rentang tidak ada kepala bertingkat", async () => {
    const x = await xmlDokumen(jadwal(["Uraian", "Biaya"]));
    expect(x).not.toContain("w:vMerge");
    expect(x).toContain(">Uraian</w:t>");
  });
});

describe("cekTabel dengan kolom rentang (C-18)", () => {
  const dokumen = (teks: string): DokumenPeriksa => ({ judul: "", judulBima: "", teksPerBagian: { "Jadwal Penelitian": teks }, kataKunci: null, lampiranAda: [], teksLampiran: {}, judulBagianDitemukan: ["Jadwal Penelitian"] });
  it("KH-cekTabelRentang-01: kolom 'Bulan 1–24' ada bila kepala Bulan dan baris angka bulan terbaca", () => {
    const t = "Tahun ke-1\nNo Nama Kegiatan Bulan\n1 2 3 4 5 6 7 8 9 10 11 12\n1. Pengumpulan data";
    expect(cekTabel(dokumen(t), "Jadwal Penelitian", ["No", "Nama Kegiatan", "Bulan 1–24"]).status).toBe("Lolos");
  });
  it("KH-cekTabelRentang-02: kepala Bulan ada tetapi angka bulan tidak terbaca: Gagal menyebut kolom Bulan 1-24", () => {
    const t = "Tabel 1\nNo Nama Kegiatan Bulan\n1. Pengumpulan data";
    const r = cekTabel(dokumen(t), "Jadwal Penelitian", ["No", "Nama Kegiatan", "Bulan 1-24"]);
    expect(r.status).toBe("Gagal");
    expect(JSON.stringify(r)).toContain("Bulan 1-24");
  });
});
