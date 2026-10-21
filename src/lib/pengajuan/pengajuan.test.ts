import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buatDocx, buatLampiranPdf, susunContoh, type VarianContoh } from "@/lib/contoh/proposal";
import type { ButirCek, DokumenPeriksa, KonteksPeriksa, ParameterButir } from "@/lib/kontrak/tipe";
import { periksaDeterministikTeks } from "@/lib/pemeriksa/deterministik";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import { blokDariHtml, ekstrakNaskah, ekstrakTeksLampiran, TIPE_DOCX, TIPE_PDF } from "./ekstraksi";
import { potongTeks } from "./potong";
import { buatTokenPengajuan, verifikasiTokenPengajuan } from "./token";

const baca = (n: string) => JSON.parse(readFileSync(path.join(process.cwd(), "data", "contoh", n), "utf8"));
const templat = baca("templat.json") as { lampiranWajib: string[]; templat: Record<string, { nama: string; batasKata: number | null; wajib: boolean }[]> };
const katalog = baca("katalog-butir.json") as { butir: { kode: string; deskripsi: string; jenis: "deterministik" | "semantik"; komponen: string; pemeriksa: string; parameter: ParameterButir }[] };

const bagian = templat.templat.PD.map((b, i) => ({ urutan: i + 1, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib }));
const konteks: KonteksPeriksa = { bagianTemplat: bagian, lampiranWajib: templat.lampiranWajib };

const butir: ButirCek[] = [
  ...turunkanButirDariTemplat(templat.templat.PD, templat.lampiranWajib).map((b) => ({ ...b, pertanyaan: null, contohJawaban: null })),
  ...katalog.butir
    .filter((b) => b.jenis === "deterministik")
    .map((b) => ({ ...b, asal: "manual" as const, aturanHitung: null, pertanyaan: null, contohJawaban: null })),
].map((b, i) => ({
  id: `b${i}`,
  kode: b.kode,
  deskripsi: b.deskripsi,
  jenis: b.jenis,
  asal: b.asal as "templat" | "manual",
  komponen: b.komponen,
  pemeriksa: b.pemeriksa,
  parameter: b.parameter,
  aturanHitung: b.aturanHitung,
  pertanyaan: null,
  contohJawaban: null,
  status: "Aktif" as const,
}));

/** Jalur penuh UC-05 tanpa basis data: DOCX → ekstraksi → potongTeks → periksa. */
async function lewatPipeline(v: VarianContoh) {
  const def = susunContoh(v);
  const docx = await buatDocx(def);
  const blok = await ekstrakNaskah(docx, "proposal.docx", TIPE_DOCX);
  const potong = potongTeks(blok, bagian);
  const dokumen: DokumenPeriksa = {
    judul: potong.judulDokumen,
    judulBima: def.judul,
    teksPerBagian: potong.teksPerBagian,
    kataKunci: potong.kataKunci,
    lampiranAda: def.lampiran.map((l) => l.nama),
    teksLampiran: {},
    judulBagianDitemukan: potong.judulBagianDitemukan,
  };
  return { def, potong, hasil: periksaDeterministikTeks(dokumen, butir, konteks) };
}

describe("UC-05 ekstraksi dan pemotongan DOCX", () => {
  it("memotong naskah contoh menjadi tujuh bagian bertemplat dengan judul dan kata kunci", async () => {
    const { def, potong } = await lewatPipeline("a");
    expect(potong.judulDokumen).toBe(def.judul);
    expect(Object.keys(potong.teksPerBagian)).toEqual(bagian.map((b) => b.nama));
    expect(potong.judulBagianDitemukan).toEqual(bagian.map((b) => b.nama));
    expect(potong.kataKunci).toBe(def.kataKunci);
    expect(potong.teksPerBagian["Daftar Pustaka"].split("\n")).toHaveLength(def.jumlahPustaka);
  });

  it("A lolos semua; B hanya KTA-04; C hanya KAT-01 dan SIT-03 (hasil sama dengan jalur murni)", async () => {
    expect((await lewatPipeline("a")).hasil.filter((h) => h.status === "Gagal")).toEqual([]);
    const b = await lewatPipeline("b");
    expect(b.hasil.filter((h) => h.status === "Gagal").map((h) => h.kode)).toEqual(["KTA-04"]);
    expect(b.hasil.find((h) => h.kode === "KTA-04")!.angkaPembukti).toMatch(/^1\.\d{3} kata dari batas 1\.200 \(lebih \d+ kata\)$/);
    const c = await lewatPipeline("c");
    expect(c.hasil.filter((h) => h.status === "Gagal").map((h) => h.kode)).toEqual(["KAT-01", "SIT-03"]);
    expect(c.hasil.find((h) => h.kode === "SIT-03")!.angkaPembukti).toContain("9 entri daftar pustaka, 7 referensi dikutip");
  });

  it("lampiran yang tidak diunggah membuat butir lampiran gagal", async () => {
    const { def, potong } = await lewatPipeline("a");
    const dokumen: DokumenPeriksa = {
      judul: potong.judulDokumen,
      judulBima: def.judul,
      teksPerBagian: potong.teksPerBagian,
      kataKunci: potong.kataKunci,
      lampiranAda: ["Surat Pernyataan Mitra", "Artikel Ketua Pengusul"],
      teksLampiran: {},
      judulBagianDitemukan: potong.judulBagianDitemukan,
    };
    const gagal = periksaDeterministikTeks(dokumen, butir, konteks).filter((h) => h.status === "Gagal");
    expect(gagal.map((h) => h.kode)).toEqual(["LMP-03"]);
    expect(gagal[0].batasDilanggar).toContain("Surat Keterangan Mahasiswa Bimbingan");
  });

  it("tabel dan gambar dibuang dari hitungan: HTML dengan tabel dan gambar", () => {
    const blok = blokDariHtml('<p>Judul Dokumen</p><h1>Metode</h1><p>satu dua tiga</p><table><tr><td><p>sel panjang sekali</p></td></tr></table><p><img src="gambar" /></p><p>Gambar 1. Diagram alir penelitian</p><p>empat &amp; lima</p>');
    expect(blok.map((b) => b.jenis)).toEqual(["paragraf", "judul", "paragraf", "tabel", "gambar", "paragraf", "paragraf"]);
    const { teksPerBagian } = potongTeks(blok, [{ urutan: 1, nama: "Metode", batasKata: 10, wajib: true }]);
    expect(teksPerBagian.Metode).toContain("empat & lima");
    expect(teksPerBagian.Metode).not.toContain("sel panjang");
  });

  it("judul tingkat 1 di luar templat mengakhiri bagian dan tercatat", () => {
    const blok = blokDariHtml("<p>Judul</p><h1>Ringkasan</h1><p>isi ringkasan</p><h1>Lampiran Tambahan</h1><p>tidak dipakai</p>");
    const hasil = potongTeks(blok, [{ urutan: 1, nama: "Ringkasan", batasKata: 300, wajib: true }]);
    expect(hasil.teksPerBagian).toEqual({ Ringkasan: "isi ringkasan" });
    expect(hasil.judulBagianDitemukan).toEqual(["Ringkasan", "Lampiran Tambahan"]);
  });
});

describe("naskah PDF dan lampiran", () => {
  it("PDF: judul bagian dikenali dari nama templat", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const halaman = pdf.addPage([595, 842]);
    let y = 800;
    for (const baris of ["Judul Uji Naskah PDF", "Ringkasan", "Isi ringkasan satu dua tiga.", "Kata Kunci", "a; b; c; d; e"]) {
      halaman.drawText(baris, { x: 50, y, size: 12, font });
      y -= 20;
    }
    const bytes = Buffer.from(await pdf.save());
    const potong = potongTeks(await ekstrakNaskah(bytes, "n.pdf", TIPE_PDF), bagian);
    expect(potong.judulDokumen).toBe("Judul Uji Naskah PDF");
    expect(potong.teksPerBagian.Ringkasan).toBe("Isi ringkasan satu dua tiga.");
    expect(potong.kataKunci).toBe("a; b; c; d; e");
  });

  it("format tidak dikenal ditolak", async () => {
    await expect(ekstrakNaskah(Buffer.from("bukan dokumen"), "x.txt", "text/plain")).rejects.toThrow("format berkas tidak didukung");
  });

  it("teks lampiran PDF terbaca; berkas rusak menghasilkan teks kosong", async () => {
    const def = susunContoh("a");
    const pdf = Buffer.from(await buatLampiranPdf(def.lampiran[0].nama, def.lampiran[0].teks));
    expect(await ekstrakTeksLampiran(pdf, "s.pdf", TIPE_PDF)).toContain("Surat Pernyataan Mitra");
    expect(await ekstrakTeksLampiran(Buffer.from("%PDF-rusak"), "s.pdf", TIPE_PDF)).toBe("");
  });
});

describe("token pengajuan", () => {
  it("membawa idProposal dan identitas pengusul; token rusak ditolak", async () => {
    const t = await buatTokenPengajuan({ idProposal: "PRP-2026-0001", idBima: "pengusul-1", judul: "J", skemaKode: "PD" });
    const k = await verifikasiTokenPengajuan(t);
    expect(k).toMatchObject({ idProposal: "PRP-2026-0001", idBima: "pengusul-1", skemaKode: "PD" });
    expect(k!.jti.length).toBeGreaterThan(10);
    expect(await verifikasiTokenPengajuan(t + "x")).toBeNull();
    expect(await verifikasiTokenPengajuan(undefined)).toBeNull();
  });
});
