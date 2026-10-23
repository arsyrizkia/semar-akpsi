// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-31 TemplatProposal.buatDokumenTemplat (uji round-trip dengan Contract C-21 potongPerBagian); CRC TemplatProposal.
import { describe, expect, it } from "vitest";
import mammoth from "mammoth";
import { ekstrakDocx } from "@/lib/pengajuan/ekstraksi";
import { potongPerBagian } from "@/lib/pengajuan/potong";
import type { BagianTemplatDto } from "@/lib/kontrak/tipe";
import { bagianBawaan, judulBerhuruf, lengkapiBagian } from "@/lib/templat/isian-substansi";
import { hitungKata } from "@/lib/pemeriksa/deterministik/teks";
import { TIPE_DOCX_TEMPLAT, bagianDokumen, buatDokumenTemplat, namaBerkasTemplat } from "@/lib/templat/dokumen";

const skema = { kode: "PD", namaSkema: "Penelitian Dasar" };
const bagian: BagianTemplatDto[] = [
  { urutan: 1, nama: "Judul", batasKata: 20, wajib: true },
  { urutan: 2, nama: "Ringkasan", batasKata: 300, wajib: true },
  { urutan: 3, nama: "Kata Kunci", batasKata: null, wajib: true },
  { urutan: 4, nama: "Pendahuluan", batasKata: 1000, wajib: true },
  { urutan: 5, nama: "Metode", batasKata: 1000, wajib: true },
  { urutan: 6, nama: "Hasil yang Diharapkan", batasKata: null, wajib: true },
  { urutan: 7, nama: "Rencana Hilirisasi", batasKata: 400, wajib: false },
  { urutan: 8, nama: "Daftar Pustaka", batasKata: null, wajib: true },
];
const lampiran = ["Surat Pernyataan Mitra", "Rencana Anggaran Biaya"];
const teksDocx = async (bytes: Buffer) => (await mammoth.extractRawText({ buffer: bytes })).value;

describe("buatDokumenTemplat (round-trip dengan potongPerBagian)", () => {
  it("KH-buatDokumenTemplat-01: hasilnya .docx yang valid (ZIP berkepala PK) dan tidak kosong", async () => {
    const bytes = await buatDokumenTemplat({ versi: 3, status: "Terbit" }, bagian, lampiran, skema, { nama: "Seleksi 2026", tahun: 2026 });
    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("KH-buatDokumenTemplat-02: terbaca balik, bagian sama dan urutan sama; judul berhuruf A. JUDUL dst.; tempat isian kosong", async () => {
    const bytes = await buatDokumenTemplat({ versi: 3, status: "Terbit" }, bagian, lampiran, skema, { nama: "Seleksi 2026", tahun: 2026 });
    const hasil = potongPerBagian(await ekstrakDocx(bytes), bagian);
    expect(hasil.judulBagianDitemukan).toEqual(bagian.map((b, i) => judulBerhuruf(i, b.nama)));
    expect(hasil.judulBagianDitemukan.slice(0, 3)).toEqual(["A. JUDUL", "B. RINGKASAN", "C. KATA KUNCI"]);
    expect(Object.keys(hasil.teksPerBagian)).toEqual(bagian.map((b) => b.nama));
    // kalimat petunjuk, "[ ]", tempat gambar, dan daftar kata kunci contoh dibuang saat dibaca balik: tidak ada isian pengusul
    expect(Object.values(hasil.teksPerBagian).every((t) => t === "")).toBe(true);
    expect(hasil.kataKunci).toBeNull();
  });

  it("KH-buatDokumenTemplat-02b: bagian bertabel (Jadwal) terbaca balik hanya berisi penanda tabel; halaman depan dan lampiran tidak ikut terpotong dan tidak dicatat sebagai judul asing", async () => {
    const bawaan = lengkapiBagian(bagianBawaan("dasar").map((b, i) => ({ ...b, urutan: i + 1 })));
    const bytes = await buatDokumenTemplat({ versi: 1, status: "Draf" }, bawaan, ["Surat Pernyataan Mitra", "Artikel Ketua Pengusul"], skema, null);
    const hasil = potongPerBagian(await ekstrakDocx(bytes), bawaan);
    expect(hasil.teksPerBagian["Jadwal Penelitian"]).toBe("[tabel]");
    expect(hasil.judulBagianDitemukan).toEqual(bawaan.map((b, i) => judulBerhuruf(i, b.nama)));
    expect(hitungKata(Object.values(hasil.teksPerBagian).join("\n"))).toBe(0);
    expect(hasil.judulDokumen).toBe("");
  });

  it("KH-buatDokumenTemplat-02c: mode isian hanya memuat Isian Substansi A-H (tanpa halaman depan dan lampiran); kepala dan ketentuan khusus dipakai", async () => {
    const bawaan = lengkapiBagian(bagianBawaan("terapan").map((b, i) => ({ ...b, urutan: i + 1 })));
    const kepala = { judulDokumen: "Isian Uji", subjudul: "SKEMA UJI", pengantar: "Pengantar uji." };
    const teks = await teksDocx(await buatDokumenTemplat({ versi: 1, status: "Draf" }, bawaan, ["Surat Pernyataan Mitra"], skema, null, { mode: "isian", kepala }));
    expect(teks).toContain("Isian Uji");
    expect(teks).toContain("Pengantar uji.");
    expect(teks).not.toContain("PROTEKSI ISI PROPOSAL");
    expect(teks).not.toContain("SURAT PERNYATAAN");
    expect(teks).toContain("tidak lebih dari 1500 kata");
  });

  it("KH-buatDokumenTemplat-03: berkas memuat kalimat petunjuk resmi (batas dari templat), tempat isian per jenis, kepala, halaman depan, dan halaman lampiran", async () => {
    const teks = await teksDocx(await buatDokumenTemplat({ versi: 3, status: "Terbit" }, bagian, lampiran, skema, null));
    expect(teks).toContain("Isian Substansi Proposal");
    expect(teks).toContain("SKEMA PENELITIAN DASAR");
    expect(teks).toContain("Tuliskan judul usulan penelitian maksimal 20 kata");
    expect(teks).toContain("Pendahuluan penelitian tidak lebih dari 1000 kata yang memuat");
    expect(teks).toContain("Isian 5 kata kunci yang dipisahkan dengan tanda titik koma (;)");
    expect(teks).not.toContain("Panduan:");
    expect(teks).toContain("[kata kunci 1; kata kunci 2; kata kunci 3; kata kunci 4; kata kunci 5]");
    expect(teks).toContain("[Sisipkan diagram alir penelitian (JPG/PNG)]");
    expect(teks).toContain("PROTEKSI ISI PROPOSAL");
    expect(teks).toContain("PROPOSAL PENELITIAN");
    expect(teks).toContain("1. JUDUL PENELITIAN");
    expect(teks).toContain("6. ANGGARAN");
    expect(teks).toContain("SURAT PERNYATAAN");
    expect(teks).toContain("bersedia menjadi mitra");
    expect(teks).toContain("LAMPIRAN 2. RENCANA ANGGARAN BIAYA");
    expect(teks).toContain("KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI");
    expect(teks).toContain("https://bima.kemdiktisaintek.go.id");
  });

  it("KH-buatDokumenTemplat-04: bagian Kata Kunci dan Daftar Pustaka ditambahkan bila templat belum memuatnya", async () => {
    const tanpa = bagian.slice(0, 5);
    const efektif = bagianDokumen(tanpa);
    expect(efektif.map((b) => b.nama)).toEqual([...tanpa.map((b) => b.nama), "Daftar Pustaka"]);
    const hasil = potongPerBagian(await ekstrakDocx(await buatDokumenTemplat({ versi: 1, status: "Draf" }, tanpa, [], skema, null)), efektif);
    expect(hasil.judulBagianDitemukan).toEqual(efektif.map((b, i) => judulBerhuruf(i, b.nama)));
  });

  it("KH-buatDokumenTemplat-05: urutan bagian mengikuti nomor urutan, bukan urutan larik masukan", async () => {
    const acak = [bagian[4], bagian[0], bagian[7], bagian[2], bagian[1], bagian[5], bagian[3], bagian[6]];
    const hasil = potongPerBagian(await ekstrakDocx(await buatDokumenTemplat({ versi: 1, status: "Draf" }, acak, [], skema, null)), bagian);
    expect(hasil.judulBagianDitemukan).toEqual(bagian.map((b, i) => judulBerhuruf(i, b.nama)));
  });

  it("KH-buatDokumenTemplat-06: isian pengusul di bawah petunjuk terbaca balik tanpa petunjuk dan tanpa tanda [ ]", async () => {
    const dasar = await ekstrakDocx(await buatDokumenTemplat({ versi: 1, status: "Terbit" }, bagian, [], skema, null));
    // pengusul mengganti "[ ]" pada bagian Judul dan daftar kata kunci templat dengan isiannya
    let n = 0;
    const blok = dasar.map((b) => {
      if (b.teks.startsWith("[kata kunci 1")) return { ...b, teks: "[Satu; Dua; Tiga; Empat; Lima]" };
      return b.teks === "[ ]" ? { ...b, teks: ++n === 1 ? "[Judul Uji Penelitian]" : "[x]" } : b;
    });
    const hasil = potongPerBagian(blok, bagian);
    expect(hasil.teksPerBagian["Judul"]).toBe("Judul Uji Penelitian");
    expect(hasil.judulDokumen).toBe("Judul Uji Penelitian");
    expect(hasil.kataKunci).toBe("Satu; Dua; Tiga; Empat; Lima");
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
