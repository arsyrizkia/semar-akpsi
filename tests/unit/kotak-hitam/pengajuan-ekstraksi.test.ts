// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475): diturunkan dari kontrak, spesifikasi, dan real use case, tanpa melihat isi metode.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buatDocx, susunContoh, type VarianContoh } from "@/lib/contoh/proposal";
import type { ButirCek, DokumenPeriksa, KonteksPeriksa, ParameterButir } from "@/lib/kontrak/tipe";
import { periksaDeterministikTeks } from "@/lib/pemeriksa/deterministik";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import { blokDariHtml, ekstrakNaskah, TIPE_DOCX } from "@/lib/pengajuan/ekstraksi";
import { potongTeks } from "@/lib/pengajuan/potong";
import { buatTokenPengajuan, verifikasiTokenPengajuan } from "@/lib/pengajuan/token";

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
  it("KH-potongTeks-01: memotong naskah contoh menjadi tujuh bagian bertemplat dengan judul dan kata kunci", async () => {
    const { def, potong } = await lewatPipeline("a");
    expect(potong.judulDokumen).toBe(def.judul);
    expect(Object.keys(potong.teksPerBagian)).toEqual(bagian.map((b) => b.nama));
    expect(potong.judulBagianDitemukan).toEqual(bagian.map((b) => b.nama));
    expect(potong.kataKunci).toBe(def.kataKunci);
    expect(potong.teksPerBagian["Daftar Pustaka"].split("\n")).toHaveLength(def.jumlahPustaka);
  });

  it("KH-potongTeks-02: A lolos semua; B hanya KTA-04; C hanya KAT-01 dan SIT-03 (hasil sama dengan jalur murni)", async () => {
    expect((await lewatPipeline("a")).hasil.filter((h) => h.status === "Gagal")).toEqual([]);
    const b = await lewatPipeline("b");
    expect(b.hasil.filter((h) => h.status === "Gagal").map((h) => h.kode)).toEqual(["KTA-04"]);
    expect(b.hasil.find((h) => h.kode === "KTA-04")!.angkaPembukti).toMatch(/^1\.\d{3} kata dari batas 1\.200 \(lebih \d+ kata\)$/);
    const c = await lewatPipeline("c");
    expect(c.hasil.filter((h) => h.status === "Gagal").map((h) => h.kode)).toEqual(["KAT-01", "SIT-03"]);
    expect(c.hasil.find((h) => h.kode === "SIT-03")!.angkaPembukti).toContain("9 entri daftar pustaka, 7 referensi dikutip");
  });

  it("KH-potongTeks-03: lampiran yang tidak diunggah membuat butir lampiran gagal", async () => {
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

  it("KH-potongTeks-04: tabel dan gambar dibuang dari hitungan: HTML dengan tabel dan gambar", () => {
    const blok = blokDariHtml('<p>Judul Dokumen</p><h1>Metode</h1><p>satu dua tiga</p><table><tr><td><p>sel panjang sekali</p></td></tr></table><p><img src="gambar" /></p><p>Gambar 1. Diagram alir penelitian</p><p>empat &amp; lima</p>');
    expect(blok.map((b) => b.jenis)).toEqual(["paragraf", "judul", "paragraf", "tabel", "gambar", "paragraf", "paragraf"]);
    const { teksPerBagian } = potongTeks(blok, [{ urutan: 1, nama: "Metode", batasKata: 10, wajib: true }]);
    expect(teksPerBagian.Metode).toContain("empat & lima");
    expect(teksPerBagian.Metode).not.toContain("sel panjang");
  });

  it("KH-potongTeks-05: judul tingkat 1 di luar templat mengakhiri bagian dan tercatat", () => {
    const blok = blokDariHtml("<p>Judul</p><h1>Ringkasan</h1><p>isi ringkasan</p><h1>Lampiran Tambahan</h1><p>tidak dipakai</p>");
    const hasil = potongTeks(blok, [{ urutan: 1, nama: "Ringkasan", batasKata: 300, wajib: true }]);
    expect(hasil.teksPerBagian).toEqual({ Ringkasan: "isi ringkasan" });
    expect(hasil.judulBagianDitemukan).toEqual(["Ringkasan", "Lampiran Tambahan"]);
  });
});

describe("token pengajuan", () => {
  it("KH-tokenPengajuan-01: membawa idProposal dan identitas pengusul; token rusak ditolak", async () => {
    const t = await buatTokenPengajuan({ idProposal: "PRP-2026-0001", idBima: "pengusul-1", judul: "J", skemaKode: "PD" });
    const k = await verifikasiTokenPengajuan(t);
    expect(k).toMatchObject({ idProposal: "PRP-2026-0001", idBima: "pengusul-1", skemaKode: "PD" });
    expect(k!.jti.length).toBeGreaterThan(10);
    expect(await verifikasiTokenPengajuan(t + "x")).toBeNull();
    expect(await verifikasiTokenPengajuan(undefined)).toBeNull();
  });
});
