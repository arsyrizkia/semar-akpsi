// Uji kotak putih UC-05 dan UC-06 (Dennis dkk., 2015, hlm. 471-475): setiap cabang metode kompleks menurut Method Specification
// MS-02 hitungKata, MS-03 cocokkanSitasi, MS-13 cekKataKunci, serta pengarah periksaSatuButir dan state machine status Proposal.
import { describe, expect, it } from "vitest";
import type { ButirCek, DokumenPeriksa, KonteksPeriksa, ParameterButir } from "@/lib/kontrak/tipe";
import { cekKataKunci, cocokkanSitasi, entriPustaka, nomorSitasi, periksaBanyakButir, periksaSatuButir } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { barisBukanNaratif, fmt, hitungKata, normalisasiJudul } from "@/lib/pemeriksa/deterministik/teks";
import { transisiProposal } from "@/lib/pengajuan/aturan";

const dok = (s: Partial<DokumenPeriksa> = {}): DokumenPeriksa => ({
  judul: "J",
  judulBima: "J",
  teksPerBagian: {},
  kataKunci: null,
  lampiranAda: [],
  teksLampiran: {},
  judulBagianDitemukan: [],
  ...s,
});
const konteks: KonteksPeriksa = {
  bagianTemplat: [
    { urutan: 1, nama: "Ringkasan", batasKata: 10, wajib: true },
    { urutan: 2, nama: "Daftar Pustaka", batasKata: null, wajib: true },
  ],
};
const butir = (parameter: ParameterButir | null, jenis: "deterministik" | "semantik" = "deterministik"): ButirCek => ({
  id: "b1",
  kode: "K-1",
  deskripsi: "d",
  jenis,
  asal: "manual",
  komponen: "Administrasi",
  pemeriksa: "sistem",
  parameter,
  aturanHitung: null,
  pertanyaan: null,
  contohJawaban: null,
  status: "Aktif",
});

describe("hitungKata (MS-02): cabang", () => {
  it("KP-hitungKata-01: baris kosong dilewati (cabang barisTeks menyaring)", () => expect(hitungKata("a\n\n \nb")).toBe(2));
  it("KP-hitungKata-02: baris keterangan Gambar/Tabel/Diagram/Grafik/Bagan/Skema/Foto dilewati", () => {
    for (const k of ["Gambar 1. x y", "Tabel 2: x", "Diagram 3 - x", "Grafik 1.2) x", "Bagan 4. x", "Skema 5. x", "Foto 6: x"]) expect(hitungKata(k), k).toBe(0);
  });
  it("KP-hitungKata-03: penanda [tabel]/[gambar]/[diagram] dilewati, penanda lain dihitung", () => {
    expect(barisBukanNaratif("[Diagram]")).toBe(true);
    expect(barisBukanNaratif("[lampiran]")).toBe(false);
    expect(hitungKata("[lampiran]")).toBe(1);
  });
  it("KP-hitungKata-04: kata 'gambar' tanpa nomor di awal baris adalah teks biasa (cabang pola tidak cocok)", () => {
    expect(hitungKata("Gambar berikut menunjukkan hasil")).toBe(4);
  });
  it("KP-hitungKata-05: fmt memberi titik ribuan dan membulatkan ke bawah", () => {
    expect(fmt(1234567)).toBe("1.234.567");
    expect(fmt(12.9)).toBe("12");
    expect(fmt(999)).toBe("999");
  });
  it("KP-hitungKata-06: normalisasiJudul membuang penomoran bab, angka, romawi, dan tanda baca di ujung", () => {
    for (const j of ["BAB II Metode", "2.1) Metode", "II. Metode", "3 Metode:", "Metode."]) expect(normalisasiJudul(j), j).toBe("metode");
  });
});

describe("cekKataKunci (MS-13): cabang", () => {
  it("KP-cekKataKunci-01: null -> cabang kosong, pesan memakai nama pemisah dikenal", () => {
    expect(cekKataKunci(dok(), 5, ";").batasDilanggar).toBe("Kata kunci harus tepat 5, dipisah titik koma");
  });
  it("KP-cekKataKunci-02: pemisah tidak dikenal dipetik apa adanya pada pesan", () => {
    expect(cekKataKunci(dok({ kataKunci: "a#b" }), 2, "#").status).toBe("Lolos");
    expect(cekKataKunci(dok(), 2, "#").batasDilanggar).toContain('dipisah "#"');
  });
  it("KP-cekKataKunci-03: petunjuk 'pemisah salah' muncul hanya bila satu kata kunci mengandung koma/baris baru dan pemisah bukan koma", () => {
    expect(cekKataKunci(dok({ kataKunci: "a, b, c" }), 5, ";").angkaPembukti).toContain("bukan titik koma");
    expect(cekKataKunci(dok({ kataKunci: "a\nb" }), 5, ";").angkaPembukti).toContain("bukan titik koma");
    expect(cekKataKunci(dok({ kataKunci: "a b c" }), 5, ";").angkaPembukti).not.toContain("bukan");
    expect(cekKataKunci(dok({ kataKunci: "a, b, c" }), 5, ",").angkaPembukti).toContain("3 kata kunci");
  });
  it("KP-cekKataKunci-04: jumlah sama lolos tanpa batas dilanggar", () => {
    const h = cekKataKunci(dok({ kataKunci: "a;b;c" }), 3, ";");
    expect(h).toMatchObject({ status: "Lolos", batasDilanggar: null, bagian: "Kata Kunci" });
  });
});

describe("cocokkanSitasi (MS-03): cabang", () => {
  const isi = (i: string, p?: string) => dok({ teksPerBagian: p === undefined ? { Ringkasan: i } : { Ringkasan: i, "Daftar Pustaka": p } });
  it("KP-cocokkanSitasi-01: nomorSitasi memperluas rentang, daftar titik koma, dan menolak rentang terbalik atau terlalu lebar", () => {
    expect(nomorSitasi("[1-3] [5;7]")).toEqual([1, 2, 3, 5, 7]);
    expect(nomorSitasi("[5-3]")).toEqual([5]);
    expect(nomorSitasi("[1-900]")).toEqual([1]);
  });
  it("KP-cocokkanSitasi-02: sitasi_bernomor: tiga hasil (lolos, tanpa sitasi, nama-tahun)", () => {
    expect(cocokkanSitasi(isi("a [1]"), konteks, "sitasi_bernomor").status).toBe("Lolos");
    expect(cocokkanSitasi(isi("a"), konteks, "sitasi_bernomor").batasDilanggar).toContain("tidak ada sitasi bernomor");
    expect(cocokkanSitasi(isi("(Budi, 2020) [1]"), konteks, "sitasi_bernomor").batasDilanggar).toContain("nama-tahun");
  });
  it("KP-cocokkanSitasi-02b: gaya (n) seperti PDF BIMA no. 6 dan 10 tetap gagal (templat meminta [n]) dengan pesan yang menyebut kurung biasa", () => {
    const h = cocokkanSitasi(isi("menurut WHO (1) dan studi lain (2)-(3) pada 2024 (2024)", "1. A\n2. B\n3. C"), konteks, "sitasi_bernomor");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("3 sitasi ditulis dalam kurung biasa (n)");
    expect(h.batasDilanggar).toContain("bukan kurung siku [n]");
    const jumlah = cocokkanSitasi(isi("menurut WHO (1) dan (2)", "1. A\n2. B"), konteks, "jumlah_referensi_sama");
    expect(jumlah.status).toBe("Gagal");
    expect(jumlah.angkaPembukti).toContain("sitasi ditulis (n), bukan [n]");
  });
  it("KP-cocokkanSitasi-03: pustaka_berurutan: bagian Daftar Pustaka tidak ada versus ada tanpa entri", () => {
    expect(cocokkanSitasi(isi("a [1]"), konteks, "pustaka_berurutan").angkaPembukti).toBe("bagian Daftar Pustaka tidak ditemukan");
    expect(cocokkanSitasi(isi("a [1]", "tanpa nomor"), konteks, "pustaka_berurutan").angkaPembukti).toBe("tidak ada entri bernomor di Daftar Pustaka");
  });
  it("KP-cocokkanSitasi-04: pustaka_berurutan: salah nomor saja, lompat saja, keduanya, dan lolos", () => {
    const salahNomor = cocokkanSitasi(isi("a [1] b [2]", "[1] A\n[3] B"), konteks, "pustaka_berurutan");
    expect(salahNomor.angkaPembukti).toContain("entri ke-2 bernomor 3");
    const lompat = cocokkanSitasi(isi("a [3]", "[1] A\n[2] B\n[3] C"), konteks, "pustaka_berurutan");
    expect(lompat.angkaPembukti).toContain("nomor 3 pertama kali dikutip sebelum nomor 1");
    const dua = cocokkanSitasi(isi("a [2]", "[2] A"), konteks, "pustaka_berurutan");
    expect(dua.angkaPembukti).toContain("entri ke-1 bernomor 2; nomor 2 pertama");
    expect(cocokkanSitasi(isi("a [1] [1] [2]", "[1] A\n[2] B"), konteks, "pustaka_berurutan").status).toBe("Lolos");
  });
  it("KP-cocokkanSitasi-05: jumlah_referensi_sama: lolos, kosong, tidak dikutip, dikutip tanpa entri, dan keduanya", () => {
    expect(cocokkanSitasi(isi("a [1]", "[1] A"), konteks, "jumlah_referensi_sama").status).toBe("Lolos");
    expect(cocokkanSitasi(isi("tanpa", ""), konteks, "jumlah_referensi_sama").status).toBe("Gagal");
    const campur = cocokkanSitasi(isi("a [2]", "[1] A"), konteks, "jumlah_referensi_sama");
    expect(campur.angkaPembukti).toContain("nomor 1 tidak dikutip; nomor 2 dikutip tetapi tidak ada di daftar");
  });
  it("KP-cocokkanSitasi-06: sitasi di bagian Kata Kunci dan Daftar Pustaka tidak dihitung sebagai sitasi isi", () => {
    const d = dok({ teksPerBagian: { Ringkasan: "a [1]", "Kata Kunci": "[9]", "Daftar Pustaka": "[1] A [7]" } });
    expect(cocokkanSitasi(d, konteks, "jumlah_referensi_sama").status).toBe("Lolos");
  });
  it("KP-cocokkanSitasi-07: bagian di luar templat tetap dihitung setelah bagian bertemplat; Referensi dikenali sebagai pustaka", () => {
    const d = dok({ teksPerBagian: { Tambahan: "x [2]", Ringkasan: "a [1]", Referensi: "[1] A\n[2] B" } });
    expect(cocokkanSitasi(d, konteks, "jumlah_referensi_sama").status).toBe("Lolos");
  });
  it("KP-cocokkanSitasi-08: entriPustaka menggabungkan baris lanjutan dan mengabaikan baris sebelum entri pertama", () => {
    expect(entriPustaka("pengantar\n[1] A\nlanjut\n[2] B")).toEqual([
      { nomor: 1, teks: "A lanjut" },
      { nomor: 2, teks: "B" },
    ]);
  });
});

describe("cekLampiran dan pengarah periksaSatuButir: cabang", () => {
  it("KP-periksaSatuButir-01: parameter null gagal tertutup", () => {
    expect(periksaSatuButir(butir(null), dok(), konteks).batasDilanggar).toContain("parameter belum diisi");
  });
  it("KP-periksaSatuButir-02: setiap tipe parameter diarahkan ke pemeriksa yang sesuai", () => {
    const d = dok({ teksPerBagian: { Ringkasan: "satu dua", "Daftar Pustaka": "[1] A" }, kataKunci: "a;b", lampiranAda: ["L"], judulBagianDitemukan: ["Ringkasan", "Daftar Pustaka"] });
    const tipe: [ParameterButir, "Lolos" | "Gagal"][] = [
      [{ tipe: "bagian_wajib", bagian: "Ringkasan" }, "Lolos"],
      [{ tipe: "struktur_judul" }, "Lolos"],
      [{ tipe: "judul_sama" }, "Lolos"],
      [{ tipe: "batas_kata", bagian: "Ringkasan", batas: 1 }, "Gagal"],
      [{ tipe: "bagian_terisi", bagian: "Ringkasan" }, "Lolos"],
      [{ tipe: "bagian_terisi", bagian: "Metode" }, "Gagal"],
      [{ tipe: "diagram_alir", bagian: "Ringkasan" }, "Gagal"],
      [{ tipe: "kata_kunci", jumlah: 2, pemisah: ";" }, "Lolos"],
      [{ tipe: "sitasi_bernomor" }, "Gagal"],
      [{ tipe: "pustaka_berurutan" }, "Lolos"],
      [{ tipe: "jumlah_referensi_sama" }, "Gagal"],
    ];
    for (const [p, harapan] of tipe) expect(periksaSatuButir(butir(p), d, konteks).status, p.tipe).toBe(harapan);
  });
  it("KP-periksaSatuButir-03: tipe parameter tidak dikenal gagal dengan nama tipenya", () => {
    const h = periksaSatuButir(butir({ tipe: "aneh" } as unknown as ParameterButir), dok(), konteks);
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain('"aneh"');
  });
  it("KP-periksaSatuButir-04: periksaBanyakButir membuang butir semantik dan menyaring batas dilanggar pada butir lolos", () => {
    const d = dok({ teksPerBagian: { Ringkasan: "satu" } });
    const hasil = periksaBanyakButir([butir({ tipe: "bagian_terisi", bagian: "Ringkasan" }), butir({ tipe: "semantik" } as unknown as ParameterButir, "semantik")], d, konteks);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].batasDilanggar).toBeNull();
  });
});

describe("transisiProposal: cabang 'galat'", () => {
  it("KP-transisiProposal-01: galat memberi Ditahan bila ada versi selesai, selain itu Belum diajukan", () => {
    expect(transisiProposal("Sedang diperiksa", "galat", true)).toBe("Ditahan");
    expect(transisiProposal("Sedang diperiksa", "galat", false)).toBe("Belum diajukan");
    expect(transisiProposal("Sedang diperiksa", "galat")).toBe("Belum diajukan");
  });
  it("KP-transisiProposal-02: galat pada status selain Sedang diperiksa ditolak", () => {
    expect(() => transisiProposal("Ditahan", "galat")).toThrow();
  });
});
