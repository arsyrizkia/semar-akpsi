// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-31 TemplatProposal.buatDokumenTemplat (uji round-trip dengan Contract C-21 potongPerBagian); CRC TemplatProposal.
import { describe, expect, it } from "vitest";
import mammoth from "mammoth";
import JSZip from "jszip";
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
const bukaZip = async (bytes: Buffer) => JSZip.loadAsync(bytes);
const xml = async (bytes: Buffer, berkas: string) => (await (await bukaZip(bytes)).file(berkas)?.async("string")) ?? "";
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
    expect(teks).toContain("Kementerian Pendidikan Tinggi, Sains, dan Teknologi");
    expect(teks).toContain("Dilarang menyalin, menyimpan, memperbanyak sebagian atau seluruh isi proposal ini dalam bentuk apapun kecuali oleh pengusul dan pengelola administrasi penelitian dan pengabdian kepada masyarakat");
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

describe("buatDokumenTemplat (kemiripan visual dengan contoh BIMA)", () => {
  const buat = (mode: "paket" | "isian" = "paket") => buatDokumenTemplat({ versi: 3, status: "Terbit" }, bagian, lampiran, skema, { nama: "Seleksi 2026", tahun: 2026 }, { mode });

  it("KH-buatDokumenTemplat-07: setiap bagian A-H adalah tabel dengan baris kepala berlatar biru muda dan baris isian berbingkai; judul bagian bukan Heading", async () => {
    const dok = await xml(await buat("isian"), "word/document.xml");
    const jumlah = (dok.match(/w:fill="BDD6EE"/g) ?? []).length;
    expect(jumlah).toBe(lengkapiBagian(bagianDokumen(bagian)).length);
    const tabelBagian = dok.split("<w:tbl>").filter((t) => /w:fill="BDD6EE"/.test(t));
    for (const t of tabelBagian) {
      expect((t.match(/<w:tr[ >]/g) ?? []).length).toBeGreaterThanOrEqual(2);
      expect(t).toMatch(/<w:top w:val="single"/); // baris isian berbingkai
    }
    expect(dok).not.toMatch(/<w:pStyle w:val="Heading1"\/>\s*<\/w:pPr>\s*<w:r>\s*<w:t[^>]*>A\. JUDUL/);
  });

  it("KH-buatDokumenTemplat-08: font contoh dipakai: Avenir Next LT Pro dan Calibri di Isian Substansi, Roboto di halaman depan, Times New Roman di lampiran", async () => {
    const dok = await xml(await buat(), "word/document.xml");
    for (const f of ["Avenir Next LT Pro", "Calibri", "Roboto", "Roboto Medium", "Times New Roman"]) expect(dok).toContain(`w:ascii="${f}"`);
    expect(dok).toContain("<w:i/>"); // petunjuk miring
  });

  it("KH-buatDokumenTemplat-09: halaman depan: logo, 'PROPOSAL PENELITIAN' putih di atas hitam, tabel klasifikasi judul dan tabel 2-6 persis contoh", async () => {
    const bytes = await buat();
    const dok = await xml(bytes, "word/document.xml");
    const zip = await bukaZip(bytes);
    expect(Object.keys(zip.files).filter((n) => /^word\/media\/.+\.png$/.test(n)).length).toBeGreaterThanOrEqual(1);
    expect(dok).toMatch(/<w:color w:val="FFFFFF"\/>[\s\S]{0,200}?w:fill="000000"|w:fill="000000"[\s\S]{0,200}?<w:color w:val="FFFFFF"\/>/);
    const teks = await teksDocx(bytes);
    for (const k of [
      "Bidang Fokus", "Tema", "Topik (jika ada)", "Prioritas Riset",
      "Rumpun Ilmu Level 1", "Rumpun Ilmu Level 2", "Rumpun Ilmu Level 3",
      "Skema Penelitian", "Strata (Dasar/Terapan/Pengembangan)", "Nilai SBK", "Target Akhir TKT", "Lama Kegiatan",
      "Nama/Peran", "Jenis", "Program Studi/Bagian", "Bidang Tugas", "ID Sinta",
      "Pelaksanaan penelitian dapat melibatkan mitra kerjasama yaitu mitra kerjasama dalam melaksanakan penelitian, mitra sebagai calon pengguna hasil penelitian, atau mitra investor",
      "Mitra", "Nama Mitra", "Dana", "Luaran Wajib", "Luaran Tambahan", "Tahun Luaran", "Kategori Luaran", "Jenis Luaran", "Status target capaian", "Keterangan",
      "8 Bidang Strategis", "Rumusan Masalah", "Uraian",
      "Rencana Anggaran Biaya penelitian mengacu pada PMK dan buku Panduan Penelitian dan Pengabdian kepada Masyarakat yang berlaku.",
      "Kelompok", "Komponen", "Item", "Satuan", "Vol.", "Biaya Satuan", "Total",
    ])
      expect(teks).toContain(k);
  });

  it("KH-buatDokumenTemplat-10: metadata (skema, periode, versi templat) ada di kaki halaman dan properti dokumen, bukan di badan", async () => {
    const bytes = await buat();
    const badan = await teksDocx(bytes);
    expect(badan).not.toContain("Versi templat");
    expect(badan).not.toContain("Periode berlaku");
    const zip = await bukaZip(bytes);
    const kaki = (await Promise.all(Object.keys(zip.files).filter((n) => /^word\/footer\d+\.xml$/.test(n)).map((n) => zip.file(n)!.async("string")))).join(" ");
    expect(kaki).toContain("Penelitian Dasar (PD)");
    expect(kaki).toContain("Seleksi 2026 (2026)");
    expect(kaki).toContain("Versi templat: 3 (Terbit)");
    expect(await xml(bytes, "docProps/core.xml")).toContain("Versi templat: 3 (Terbit)");
  });

  it("KH-buatDokumenTemplat-11: lampiran: isian label | ':' | isian dalam tabel tanpa bingkai, blok tanda tangan di kanan, pemisah halaman sebelum tiap lampiran, tiga bagian dokumen (depan, isian, lampiran)", async () => {
    const dok = await xml(await buat(), "word/document.xml");
    expect((dok.match(/<w:sectPr/g) ?? []).length).toBe(3);
    expect((dok.match(/<w:pageBreakBefore\/>/g) ?? []).length).toBe(lampiran.length);
    expect(dok).toContain('<w:tab w:val="right" w:pos="9072"/>'); // tab kanan pada kop surat
    expect(dok).toMatch(/<w:ind w:left="5200"/);
    const tabelSurat = dok.split("<w:tbl>").find((t) => t.includes(">Jabatan (jika ada)<"));
    expect(tabelSurat).toBeDefined();
    expect(tabelSurat).toMatch(/<w:top w:val="nil"|<w:top w:val="none"/);
    expect((tabelSurat!.match(/<w:gridCol /g) ?? []).length).toBe(3);
    expect(tabelSurat).toContain(">:<");
  });

  it("KH-buatDokumenTemplat-12: tempat isian bertabel (Jadwal) berada di dalam sel isian bagian dan terbaca balik sebagai satu penanda tabel", async () => {
    const bawaan = lengkapiBagian(bagianBawaan("dasar").map((b, i) => ({ ...b, urutan: i + 1 })));
    const bytes = await buatDokumenTemplat({ versi: 1, status: "Draf" }, bawaan, [], skema, null, { mode: "isian" });
    const dok = await xml(bytes, "word/document.xml");
    const sel = dok.split("<w:tbl>").length;
    expect(sel).toBeGreaterThan(bawaan.length + 1); // tabel kepala + tabel tiap bagian + tabel jadwal bersarang
    const hasil = potongPerBagian(await ekstrakDocx(bytes), bawaan);
    expect(hasil.teksPerBagian["Jadwal Penelitian"]).toBe("[tabel]");
    expect(hasil.judulBagianDitemukan).toHaveLength(bawaan.length);
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
