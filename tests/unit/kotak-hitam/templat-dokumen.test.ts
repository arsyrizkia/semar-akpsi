// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-31 TemplatProposal.buatDokumenTemplat (uji round-trip dengan Contract C-21 potongPerBagian); CRC TemplatProposal.
import { describe, expect, it } from "vitest";
import { ekstrakDocx } from "@/lib/pengajuan/ekstraksi";
import { potongPerBagian } from "@/lib/pengajuan/potong";
import type { BagianTemplatDto } from "@/lib/kontrak/tipe";
import { TIPE_DOCX_TEMPLAT, bagianDokumen, buatDokumenTemplat, namaBerkasTemplat } from "@/lib/templat/dokumen";

const skema = { kode: "PD", namaSkema: "Penelitian Dasar" };
const bagian: BagianTemplatDto[] = [
  { urutan: 1, nama: "Ringkasan", batasKata: 300, wajib: true },
  { urutan: 2, nama: "Pendahuluan", batasKata: 1000, wajib: true },
  { urutan: 3, nama: "Metode", batasKata: 1200, wajib: true },
  { urutan: 4, nama: "Hasil yang Diharapkan", batasKata: null, wajib: false },
  { urutan: 5, nama: "Kata Kunci", batasKata: null, wajib: true },
  { urutan: 6, nama: "Daftar Pustaka", batasKata: null, wajib: true },
];
const lampiran = ["Surat Pernyataan Mitra", "Rencana Anggaran Biaya"];

describe("buatDokumenTemplat (round-trip dengan potongPerBagian)", () => {
  it("KH-buatDokumenTemplat-01: hasilnya .docx yang valid (ZIP berkepala PK) dan tidak kosong", async () => {
    const bytes = await buatDokumenTemplat({ versi: 3, status: "Terbit" }, bagian, lampiran, skema, { nama: "Seleksi 2026", tahun: 2026 });
    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("KH-buatDokumenTemplat-02: terbaca balik, bagian sama dan urutan sama dengan templat", async () => {
    const bytes = await buatDokumenTemplat({ versi: 3, status: "Terbit" }, bagian, lampiran, skema, { nama: "Seleksi 2026", tahun: 2026 });
    const hasil = potongPerBagian(await ekstrakDocx(bytes), bagian);
    expect(hasil.judulBagianDitemukan).toEqual(bagian.map((b) => b.nama));
    expect(Object.keys(hasil.teksPerBagian)).toEqual(bagian.map((b) => b.nama));
  });

  it("KH-buatDokumenTemplat-03: judul dokumen memuat nama skema; panduan batas kata dan wajib/opsional ada di bawah judul bagian", async () => {
    const bytes = await buatDokumenTemplat({ versi: 3, status: "Terbit" }, bagian, lampiran, skema, null);
    const hasil = potongPerBagian(await ekstrakDocx(bytes), bagian);
    expect(hasil.judulDokumen).toContain("Penelitian Dasar");
    expect(hasil.teksPerBagian["Metode"]).toContain("maksimal 1.200 kata");
    expect(hasil.teksPerBagian["Metode"]).toContain("Bagian wajib");
    expect(hasil.teksPerBagian["Hasil yang Diharapkan"]).toContain("tanpa batas kata");
    expect(hasil.teksPerBagian["Hasil yang Diharapkan"]).toContain("Bagian opsional");
  });

  it("KH-buatDokumenTemplat-04: bagian Kata Kunci dan Daftar Pustaka ditambahkan bila templat belum memuatnya", async () => {
    const tanpa = bagian.slice(0, 4);
    const efektif = bagianDokumen(tanpa);
    expect(efektif.map((b) => b.nama)).toEqual([...tanpa.map((b) => b.nama), "Kata Kunci", "Daftar Pustaka"]);
    const hasil = potongPerBagian(await ekstrakDocx(await buatDokumenTemplat({ versi: 1, status: "Draf" }, tanpa, [], skema, null)), efektif);
    expect(hasil.judulBagianDitemukan).toEqual(efektif.map((b) => b.nama));
  });

  it("KH-buatDokumenTemplat-05: urutan bagian mengikuti nomor urutan, bukan urutan larik masukan", async () => {
    const acak = [bagian[2], bagian[0], bagian[1], bagian[4], bagian[5], bagian[3]];
    const hasil = potongPerBagian(await ekstrakDocx(await buatDokumenTemplat({ versi: 1, status: "Draf" }, acak, [], skema, null)), bagian);
    expect(hasil.judulBagianDitemukan).toEqual(bagian.map((b) => b.nama));
  });
});

describe("namaBerkasTemplat", () => {
  it("KH-namaBerkasTemplat-01: nama bermakna memuat kode skema, versi, dan status", () => {
    expect(namaBerkasTemplat(skema, { versi: 3, status: "Terbit" })).toBe("Templat-PD-v3-Terbit.docx");
  });
  it("KH-namaBerkasTemplat-02: kode skema dengan karakter janggal dibersihkan; kode kosong memakai cadangan", () => {
    expect(namaBerkasTemplat({ kode: "P/D 2026" }, { versi: 1, status: "Draf" })).toBe("Templat-P-D-2026-v1-Draf.docx");
    expect(namaBerkasTemplat({ kode: "///" }, { versi: 1, status: "Arsip" })).toBe("Templat-skema-v1-Arsip.docx");
  });
  it("KH-namaBerkasTemplat-03: tipe media DOCX baku", () => {
    expect(TIPE_DOCX_TEMPLAT).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });
});
