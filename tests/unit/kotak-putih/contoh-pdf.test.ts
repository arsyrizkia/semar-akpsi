// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: buatPdfContoh (naskah contoh PDF untuk unggahan BIMA tiruan) dibaca balik oleh
// rantai pemeriksaan pengajuan yang sama (ekstrakNaskah -> potongPerBagian -> periksaDeterministikTeks): varian a lolos semua, b gagal
// batas kata Metode, f gagal kata kunci.
import { describe, expect, it } from "vitest";
import type { ButirCek, DokumenPeriksa } from "@/lib/kontrak/tipe";
import { buatPdfContoh } from "@/lib/contoh/pdf";
import { susunContoh, type VarianContoh } from "@/lib/contoh/proposal";
import { periksaDeterministikTeks } from "@/lib/pemeriksa/deterministik";
import { ekstrakNaskah, TIPE_PDF } from "@/lib/pengajuan/ekstraksi";
import { potongPerBagian } from "@/lib/pengajuan/potong";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import { bagianBawaan, lengkapiBagian } from "@/lib/templat/isian-substansi";

const bagian = lengkapiBagian(bagianBawaan("dasar").map((x, i) => ({ ...x, urutan: i + 1 })));
const butir: ButirCek[] = turunkanButirDariTemplat(bagian).map((x, i) => ({ ...x, id: `b${i}`, pertanyaan: null, contohJawaban: null, status: "Aktif" }));

async function periksa(varian: VarianContoh) {
  const def = susunContoh(varian);
  const bytes = Buffer.from(await buatPdfContoh(def));
  const potong = potongPerBagian(await ekstrakNaskah(bytes, "naskah.pdf", TIPE_PDF), bagian);
  const dokumen: DokumenPeriksa = {
    judul: potong.judulDokumen,
    judulBima: def.judul,
    teksPerBagian: potong.teksPerBagian,
    kataKunci: potong.kataKunci,
    lampiranAda: [],
    teksLampiran: {},
    judulBagianDitemukan: potong.judulBagianDitemukan,
  };
  return { bytes, potong, hasil: periksaDeterministikTeks(dokumen, butir, { bagianTemplat: bagian }) };
}

describe("buatPdfContoh", () => {
  it("KP-buatPdfContoh-01: berkas PDF sah; kedelapan bagian Isian Substansi dikenali dan judul terbaca utuh", async () => {
    const { bytes, potong } = await periksa("a");
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(potong.judulBagianDitemukan).toHaveLength(8);
    expect(potong.judulDokumen).toBe(susunContoh("a").judul);
  }, 30_000);

  it("KP-buatPdfContoh-02: varian a lolos semua butir deterministik", async () => {
    const { hasil } = await periksa("a");
    expect(hasil.length).toBeGreaterThan(10);
    expect(hasil.filter((h) => h.status === "Gagal").map((h) => `${h.kode}: ${h.angkaPembukti}`)).toEqual([]);
  }, 30_000);

  it("KP-buatPdfContoh-03: varian b gagal hanya pada batas kata Metode; varian f gagal hanya pada kata kunci", async () => {
    const b = (await periksa("b")).hasil.filter((h) => h.status === "Gagal");
    expect(b.map((h) => h.bagian)).toEqual(["Metode"]);
    expect(b[0].batasDilanggar).toMatch(/1\.000/);
    const f = (await periksa("f")).hasil.filter((h) => h.status === "Gagal");
    expect(f.map((h) => h.bagian)).toEqual(["Kata Kunci"]);
  }, 30_000);
});
