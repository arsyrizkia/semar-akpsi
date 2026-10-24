// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-17 cekKataKunci (semua kasus daftar), C-01 periksaKelengkapan (aturan M-12),
// C-03 turunkanButirCek (butir per ketentuan; lampiran tidak diturunkan), C-31 buatDokumenTemplat (hanya Isian Substansi); CRC dan Class Diagram BagianTemplat.
// Teks sintetis yang meniru pola isian pengusul pada contoh BIMA (no. 1: kurung siku dan frasa terpotong baris; no. 5: koma; no. 6: sah; no. 10: titik koma penutup).
import { describe, expect, it } from "vitest";
import type { DokumenPeriksa } from "@/lib/kontrak/tipe";
import { cekKataKunci, cekTabel, periksaBagianTerisi, periksaDiagramAlir } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import { bagianBawaan, bagianDariBaris, ringkasKetentuan } from "@/lib/templat/isian-substansi";
import { bagianTersimpan, periksaKelengkapan, periksaKetentuan } from "@/lib/templat/kelengkapan";
import { lampiranWajibSkema, templatLampiran } from "@/lib/bima/lampiran";

const dok = (teksPerBagian: Record<string, string> = {}, tambahan: Partial<DokumenPeriksa> = {}): DokumenPeriksa => ({
  judul: "J",
  judulBima: "J",
  teksPerBagian,
  kataKunci: null,
  lampiranAda: [],
  teksLampiran: {},
  judulBagianDitemukan: [],
  ...tambahan,
});
const kk = (teks: string | null, jumlah = 5, pemisah = ";") => cekKataKunci(dok({}, { kataKunci: teks }), jumlah, pemisah);

describe("cekKataKunci: format daftar (Contract C-17)", () => {
  it("KH-cekKataKunci-20: kurung siku dibuang dan baris baru disambung spasi (pola contoh no. 1): Lolos, 5 butir", () => {
    const h = kk("[Degradasi lingkungan; JBMUR; Klaster Jasa Ekosistem; Pengendalian Tata Ruang; Spatial\nQuantitative]");
    expect(h.status).toBe("Lolos");
    expect(h.angkaPembukti).toBe("5 kata kunci: Degradasi lingkungan | JBMUR | Klaster Jasa Ekosistem | Pengendalian Tata Ruang | Spatial Quantitative (pemisah ;)");
  });
  it("KH-cekKataKunci-21: satu titik koma penutup diabaikan dan disebut di angka pembukti (pola contoh no. 10)", () => {
    const h = kk("Sistem Pakar; Penyakit Menular; Ensemble Learning; Explainable Artificial\nIntelligence; Rekam Medis;");
    expect(h.status).toBe("Lolos");
    expect(h.angkaPembukti).toContain("Explainable Artificial Intelligence");
    expect(h.angkaPembukti).toContain("satu titik koma penutup diabaikan");
  });
  it("KH-cekKataKunci-22: koma sebagai pemisah gagal dan disebut (pola contoh no. 5)", () => {
    const h = kk("Aksesibilitas, Prototype, Antarmuka, Sumber daya elektronik, Perpustakaan");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("pemisah yang dipakai koma (,), bukan titik koma (;)");
    expect(h.batasDilanggar).toBe("Kata kunci harus tepat 5, dipisah titik koma; pemisah yang dipakai koma (,), bukan titik koma (;)");
  });
  it("KH-cekKataKunci-23: butir kosong (a;; b; c; d) gagal dengan nomor butir", () => {
    const h = kk("a;; b; c; d");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("ada butir kosong (butir ke-2)");
  });
  it("KH-cekKataKunci-24: empat dan enam butir gagal (batas bawah dan atas), lima Lolos", () => {
    expect(kk("a; b; c; d").status).toBe("Gagal");
    expect(kk("a; b; c; d; e; f").status).toBe("Gagal");
    expect(kk("a; b; c; d; e").status).toBe("Lolos");
    expect(kk("a; b; c; d").angkaPembukti).toContain("diminta tepat 5");
  });
  it("KH-cekKataKunci-25: pemisah campuran (a; b, c; d; e) gagal", () => {
    const h = kk("a; b, c; d; e");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("pemisah bercampur");
  });
  it("KH-cekKataKunci-26: garis miring dan baris baru saja gagal; garis miring dalam frasa (TCP/IP) sah", () => {
    expect(kk("a / b / c / d / e").angkaPembukti).toContain("garis miring (/)");
    expect(kk("a\nb\nc\nd\ne").angkaPembukti).toContain("pemisah yang dipakai baris baru");
    expect(kk("TCP/IP; b; c; d; e").status).toBe("Lolos");
  });
  it("KH-cekKataKunci-27: kosong, hanya spasi, dan hanya kurung siku gagal 'tidak ditemukan'", () => {
    for (const t of [null, "", "   ", "[ ]"]) expect(kk(t).angkaPembukti).toBe("kata kunci tidak ditemukan di naskah");
  });
  it("KH-cekKataKunci-28: butir yang panjang dipotong dan daftar panjang diringkas dengan '...'", () => {
    const h = kk(`${"x".repeat(60)}; ${Array.from({ length: 9 }, (_, i) => `k${i}`).join("; ")}`, 10);
    expect(h.status).toBe("Lolos");
    expect(h.angkaPembukti).toContain(`${"x".repeat(37)}...`);
    expect(h.angkaPembukti).toContain("| ... (pemisah ;)");
  });
  it("KH-cekKataKunci-29: pemisah lain (koma, jumlah 3) dan titik koma salah pakai terdeteksi secara umum", () => {
    expect(kk("x, y, z", 3, ",").status).toBe("Lolos");
    expect(kk("x; y; z", 3, ",").angkaPembukti).toContain("pemisah yang dipakai titik koma (;), bukan koma (,)");
    expect(kk("x | y | z", 3, "|").status).toBe("Lolos");
    expect(kk("x # y # z", 3, "#").status).toBe("Lolos");
  });
});

describe("cekTabel, periksaDiagramAlir, periksaBagianTerisi (butir turunan ketentuan)", () => {
  it("KH-cekTabel-01: penanda tabel DOCX, keterangan Tabel n, kepala tabel, dan baris bulan PDF terdeteksi; teks biasa gagal", () => {
    const ada = (teks: string) => cekTabel(dok({ "Jadwal Penelitian": teks }), "Jadwal Penelitian");
    expect(ada("[tabel]").status).toBe("Lolos");
    expect(ada("Tabel 1. Jadwal").status).toBe("Lolos");
    expect(ada("Tahun ke-1\nNo Nama Kegiatan Bulan\n1 2 3 4 5 6 7 8 9 10 11 12\n1 Persiapan").status).toBe("Lolos");
    expect(ada("1 2 3 4 5 6 7 8").status).toBe("Lolos");
    const g = ada("Persiapan lalu analisis lalu publikasi");
    expect(g.status).toBe("Gagal");
    expect(g.batasDilanggar).toBe('Bagian "Jadwal Penelitian" harus memuat tabel');
    expect(cekTabel(dok(), "Jadwal Penelitian").status).toBe("Gagal");
  });
  it("KH-periksaDiagramAlir-01: penanda gambar, keterangan 'Gambar n', dan 'pada Gambar berikut' lolos; tanpa gambar gagal", () => {
    const m = (t: string) => periksaDiagramAlir(dok({ Metode: t }), "Metode");
    expect(m("Gambar 1. Diagram alir penelitian").angkaPembukti).toContain("keterangan gambar diagram alir");
    expect(m("[gambar]").status).toBe("Lolos");
    expect(m("Gambar 2. Lokasi studi").status).toBe("Lolos");
    expect(m("Alur disajikan pada Gambar berikut:").status).toBe("Lolos");
    expect(m("hanya teks tentang diagram alir tanpa gambar").status).toBe("Gagal");
  });
  it("KH-periksaBagianTerisi-01: bagian hanya berisi tabel atau gambar tetap terisi; kosong gagal", () => {
    expect(periksaBagianTerisi(dok({ J: "[tabel]" }), "J").angkaPembukti).toContain("tabel");
    expect(periksaBagianTerisi(dok({ J: "[gambar]\nGambar 1. x" }), "J").status).toBe("Lolos");
    expect(periksaBagianTerisi(dok({ J: "" }), "J").status).toBe("Gagal");
  });
});

describe("periksaKetentuan / periksaKelengkapan: aturan M-12 (Contract C-01)", () => {
  const baris = (p: object = {}) => ({ nama: "X", batas: "", tanpaBatas: true, wajib: true, ...p });
  it("KH-periksaKetentuan-01: jenis daftar butuh jumlah >= 1 dan pemisah satu karakter (batas 0, 1, 2 karakter)", () => {
    const g = (jumlahButir: string, pemisah: string) => periksaKetentuan([baris({ jenisIsian: "daftar", jumlahButir, pemisah })])[0];
    expect(g("5", ";")).toBeNull();
    expect(g("1", ";")).toBeNull();
    expect(g("0", ";")?.jumlahButir).not.toBeNull();
    expect(g("", ";")?.jumlahButir).not.toBeNull();
    expect(g("5", "")?.pemisah).not.toBeNull();
    expect(g("5", ";;")?.pemisah).not.toBeNull();
    expect(periksaKetentuan([baris({ jenisIsian: "teks", jumlahButir: "0", pemisah: "" })])[0]).toBeNull();
  });
  it("KH-periksaKetentuan-02: maksimal satu bagian daftar pustaka; sitasi bernomor butuh bagian daftar pustaka", () => {
    const dua = periksaKetentuan([baris({ daftarPustaka: true }), baris({ nama: "Y", daftarPustaka: true })]);
    expect(dua.map((x) => x?.daftarPustaka)).toEqual(["Hanya satu bagian yang boleh ditandai daftar pustaka", "Hanya satu bagian yang boleh ditandai daftar pustaka"]);
    expect(periksaKetentuan([baris({ sitasiBernomor: true })])[0]?.sitasiBernomor).toContain("butuh");
    expect(periksaKetentuan([baris({ sitasiBernomor: true }), baris({ nama: "P", daftarPustaka: true })])).toEqual([null, null]);
  });
  it("KH-periksaKelengkapan-10: ketentuan tidak sah menggagalkan kelengkapan dengan penanda per baris", () => {
    const m = { bagian: [baris({ jenisIsian: "daftar", jumlahButir: "", pemisah: ";" })], lampiran: [], periodeBerlakuId: "p" };
    const h = periksaKelengkapan(m);
    expect(h.lengkap).toBe(false);
    expect(h.bagian[0].ketentuan?.jumlahButir).toBeTruthy();
    expect(periksaKelengkapan({ ...m, bagian: [baris()] }).lengkap).toBe(true);
  });
  it("KH-bagianTersimpan-01: ketentuan disimpan tipe-benar; tanpa ketentuan (pemanggil lama) tidak ada kolom ketentuan; bukan daftar menghapus jumlah dan pemisah", () => {
    expect(bagianTersimpan(baris())).toEqual({ nama: "X", batasKata: null, wajib: true });
    const s = bagianTersimpan(baris({ jenisIsian: "daftar", jumlahButir: " 5 ", pemisah: ";", petunjuk: "p", wajibGambar: true }));
    expect(s).toMatchObject({ jenisIsian: "daftar", jumlahButir: 5, pemisah: ";", petunjuk: "p", wajibGambar: true, sitasiBernomor: false, daftarPustaka: false });
    expect(bagianTersimpan(baris({ jenisIsian: "teks", jumlahButir: "5", pemisah: ";" }))).toMatchObject({ jumlahButir: null, pemisah: null });
  });
});

describe("turunkanButirCek per ketentuan (Contract C-03)", () => {
  it("KH-turunkanButirCek-20: tiap ketentuan menghasilkan butirnya; bagian bawaan Dasar memuat KAT/GBR/TBL/SIT", () => {
    const b = turunkanButirDariTemplat(bagianBawaan("dasar"));
    const per = (k: string) => b.filter((x) => x.kode.startsWith(k));
    expect(per("KAT")).toHaveLength(1);
    expect(per("GBR")).toHaveLength(1);
    expect(per("TBL")).toHaveLength(1);
    expect(per("SIT")).toHaveLength(3);
    expect(b.every((x) => x.asal === "templat")).toBe(true);
    expect(b.filter((x) => x.jenis === "semantik").every((x) => x.kode.startsWith("UNS-"))).toBe(true);
  });
  it("KH-turunkanButirCek-21: tanpa ketentuan tidak ada butir tambahan; daftar tanpa jumlah/pemisah sah tidak menurunkan KAT; pemisah lain dinamai", () => {
    expect(turunkanButirDariTemplat([{ nama: "A", batasKata: null, wajib: false, jenisIsian: "teks" }])).toEqual([]);
    expect(turunkanButirDariTemplat([{ nama: "K", batasKata: null, wajib: false, jenisIsian: "daftar", jumlahButir: null, pemisah: ";" }])).toEqual([]);
    const b = turunkanButirDariTemplat([{ nama: "K", batasKata: null, wajib: false, jenisIsian: "daftar", jumlahButir: 3, pemisah: "," }]);
    expect(b[0].deskripsi).toBe("K: tepat 3 butir, dipisahkan koma (,)");
    expect(turunkanButirDariTemplat([{ nama: "K", batasKata: null, wajib: false, jenisIsian: "daftar", jumlahButir: 3, pemisah: "#" }])[0].deskripsi).toContain('"#"');
  });
  it("KH-turunkanButirCek-22: sitasi bernomor tanpa bagian pustaka hanya SIT-01; pustaka tanpa sitasi bernomor SIT-02 dan SIT-03 dengan nama pustaka di parameter", () => {
    const s = turunkanButirDariTemplat([{ nama: "P", batasKata: null, wajib: false, sitasiBernomor: true }]);
    expect(s.map((x) => x.kode)).toEqual(["SIT-01"]);
    const p = turunkanButirDariTemplat([{ nama: "Referensi", batasKata: null, wajib: false, daftarPustaka: true }]);
    expect(p.map((x) => [x.kode, x.parameter])).toEqual([
      ["SIT-02", { tipe: "pustaka_berurutan", pustaka: "Referensi" }],
      ["SIT-03", { tipe: "jumlah_referensi_sama", pustaka: "Referensi" }],
    ]);
  });
});

describe("bagian templat (Class Diagram BagianTemplat, C-31)", () => {
  it("KH-bagianDariBaris-01: baris lama (kolom baru null) diturunkan dari nama bagian; baris baru dipakai apa adanya; bukan daftar tidak membawa jumlah dan pemisah", () => {
    const lama = bagianDariBaris({ urutan: 3, nama: "Kata Kunci", batasKata: null, wajib: true });
    expect(lama).toMatchObject({ jenisIsian: "daftar", jumlahButir: 5, pemisah: ";", wajibGambar: false });
    expect(bagianDariBaris({ urutan: 5, nama: "Metode", batasKata: 1000, wajib: true }).wajibGambar).toBe(true);
    const baru = bagianDariBaris({ urutan: 1, nama: "Kata Kunci", batasKata: null, wajib: true, jenisIsian: "teks", jumlahButir: 5, pemisah: ";" });
    expect(baru).toMatchObject({ jenisIsian: "teks", jumlahButir: null, pemisah: null });
    expect(bagianDariBaris({ urutan: 1, nama: "Asing", batasKata: null, wajib: true })).toMatchObject({ jenisIsian: "teks", daftarPustaka: false });
  });
  it("KH-ringkasKetentuan-01: chip ringkas: batas kata, daftar, tabel, gambar, sitasi, pustaka", () => {
    const c = (n: string) => ringkasKetentuan(bagianDariBaris({ urutan: 1, nama: n, batasKata: n === "Judul" ? 20 : null, wajib: true }));
    expect(c("Judul")).toEqual(["≤ 20 kata"]);
    expect(c("Kata Kunci")).toEqual(["5 butir · pemisah ;"]);
    expect(c("Metode")).toEqual(["gambar: diagram alir penelitian"]);
    expect(c("Jadwal Penelitian")).toEqual(["tabel: No, Nama Kegiatan, Bulan ×12"]);
    expect(c("Daftar Pustaka")).toEqual(["sitasi bernomor", "daftar pustaka"]);
    expect(ringkasKetentuan({ urutan: 1, nama: "Z", batasKata: 1500, wajib: true, jenisIsian: "daftar" })).toEqual(["≤ 1.500 kata", "? butir · pemisah ?"]);
  });
});

describe("lampiran milik BIMA (arah-isi-saja-2026-10-24)", () => {
  it("KH-lampiranBima-01: daftar lampiran wajib per skema dan templat lampiran ada di sisi BIMA; artikel ketua tanpa templat; skema tak dikenal tanpa lampiran", () => {
    expect(lampiranWajibSkema("PD")).toEqual(["Surat Pernyataan Mitra", "Artikel Ketua Pengusul", "Surat Keterangan Mahasiswa Bimbingan"]);
    expect(lampiranWajibSkema("XX")).toEqual([]);
    expect(templatLampiran("surat pernyataan mitra")?.judul).toBe("SURAT PERNYATAAN");
    expect(templatLampiran("Artikel Ketua Pengusul")).toBeNull();
  });
});
