// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: CRC TemplatProposal dan PeriodeSeleksi, Class Diagram (TemplatProposal berelasi
// dengan PeriodeSeleksi lewat periodeBerlaku), Contract C-02 (terbitkan), behavioral state machine templat; J-02 Daftar Templat dan J-02a Rincian.
import { describe, expect, it } from "vitest";
import {
  adaPenyaring,
  bacaPenyaring,
  bacaTab,
  dapatDisunting,
  dapatSusunVersiBaru,
  daftarTahun,
  kueriPenyaring,
  masaBerjalanUntuk,
  pilihTemplatAturan,
  saringDaftar,
  statusTampil,
  urlTabAturan,
  urutkanDaftar,
  type BarisDaftar,
} from "@/lib/templat/daftar";

const baris = (o: Partial<BarisDaftar>): BarisDaftar => ({
  id: "t",
  skemaId: "pd",
  namaSkema: "Penelitian Dasar",
  versi: 1,
  status: "Terbit",
  tahun: 2026,
  periodeId: "p26",
  periodeNama: "Seleksi Pendanaan 2026",
  jumlahBagian: 8,
  jumlahDeterministik: 12,
  jumlahSemantik: 5,
  diperbarui: "2026-09-01T00:00:00.000Z",
  ...o,
});

describe("statusTampil (CRC TemplatProposal: Terbit = Aktif untuk periodenya)", () => {
  it("KH-statusTampil-01: Terbit tampil Aktif; Draf dan Arsip tetap", () => {
    expect(statusTampil("Terbit")).toBe("Aktif");
    expect(statusTampil("Draf")).toBe("Draf");
    expect(statusTampil("Arsip")).toBe("Arsip");
  });
});

describe("Aktif per periode (Class Diagram PeriodeSeleksi-TemplatProposal)", () => {
  const versi = [
    { id: "a26", versi: 1, status: "Terbit" as const, periodeId: "p26" },
    { id: "a27", versi: 2, status: "Terbit" as const, periodeId: "p27" },
    { id: "d3", versi: 3, status: "Draf" as const, periodeId: "p27" },
    { id: "r0", versi: 0, status: "Arsip" as const, periodeId: "p26" },
  ];
  it("KH-aktifPeriode-01: satu skema boleh punya templat Aktif 2026 dan 2027 sekaligus; masing-masing dipilih menurut periodenya", () => {
    expect(pilihTemplatAturan(versi, "p26")?.id).toBe("a26");
    expect(pilihTemplatAturan(versi, "p27")?.id).toBe("a27");
  });
  it("KH-aktifPeriode-02: periode tanpa templat Aktif memakai Aktif terbaru; tanpa periode juga Aktif terbaru", () => {
    expect(pilihTemplatAturan(versi, "p28")?.id).toBe("a27");
    expect(pilihTemplatAturan(versi, null)?.id).toBe("a27");
  });
  it("KH-aktifPeriode-03: tanpa Aktif sama sekali, versi terbaru apa pun; skema tanpa versi menghasilkan null", () => {
    expect(pilihTemplatAturan([{ id: "d", versi: 1, status: "Draf", periodeId: null }], "p26")?.id).toBe("d");
    expect(pilihTemplatAturan([], "p26")).toBeNull();
  });
  it("KH-aktifPeriode-04: 9a hanya untuk periode yang sedang berjalan; 2027 yang belum dibuka tidak terpengaruh sakelar", () => {
    expect(masaBerjalanUntuk(true, "p26", "p26")).toBe(true);
    expect(masaBerjalanUntuk(true, "p27", "p26")).toBe(false);
    expect(masaBerjalanUntuk(false, "p26", "p26")).toBe(false);
    expect(masaBerjalanUntuk(true, null, "p26")).toBe(false);
    expect(masaBerjalanUntuk(true, "p26", null)).toBe(false);
  });
});

describe("penyaring daftar J-02", () => {
  const semua = [
    baris({ id: "1", status: "Terbit", tahun: 2026, versi: 2 }),
    baris({ id: "2", status: "Arsip", tahun: 2026, versi: 1 }),
    baris({ id: "3", status: "Draf", tahun: 2027, periodeId: "p27", versi: 3 }),
    baris({ id: "4", status: "Terbit", tahun: 2027, periodeId: "p27", skemaId: "pt", namaSkema: "Penelitian Terapan", versi: 1 }),
    baris({ id: "5", status: "Draf", tahun: null, periodeId: null, versi: 4 }),
  ];
  const ids = (p: Parameters<typeof saringDaftar>[1]) => saringDaftar(semua, p).map((b) => b.id);
  it("KH-saringDaftar-01: tanpa penyaring semua baris tampil", () => {
    expect(ids(bacaPenyaring({}))).toEqual(["1", "2", "3", "4", "5"]);
  });
  it("KH-saringDaftar-02: tahun, skema, dan status bekerja sendiri-sendiri dan digabung", () => {
    expect(ids(bacaPenyaring({ tahun: "2027" }))).toEqual(["3", "4"]);
    expect(ids(bacaPenyaring({ skema: "pt" }))).toEqual(["4"]);
    expect(ids(bacaPenyaring({ status: "Aktif" }))).toEqual(["1", "4"]);
    expect(ids(bacaPenyaring({ tahun: "2027", status: "Aktif" }))).toEqual(["4"]);
    expect(ids(bacaPenyaring({ tahun: "2026", status: "Draf" }))).toEqual([]);
  });
  it("KH-saringDaftar-03: nilai asing atau kosong dianggap semua (tipe salah, batas)", () => {
    expect(bacaPenyaring({ tahun: "abc", status: "Rahasia", skema: " " })).toEqual({ tahun: null, skema: null, status: "Semua" });
    expect(bacaPenyaring({ tahun: "0" }).tahun).toBeNull();
    expect(bacaPenyaring({ tahun: "-5" }).tahun).toBeNull();
    expect(bacaPenyaring({ tahun: ["2027", "2026"] }).tahun).toBe(2027);
  });
  it("KH-saringDaftar-04: baris tanpa periode hanya muncul bila penyaring tahun kosong", () => {
    expect(ids(bacaPenyaring({ tahun: "2026" }))).not.toContain("5");
    expect(ids(bacaPenyaring({}))).toContain("5");
  });
  it("KH-saringDaftar-05: urutan Draf, Aktif, Arsip; dalam kelompok skema lalu versi terbaru", () => {
    expect(urutkanDaftar(semua).map((b) => b.id)).toEqual(["5", "3", "1", "4", "2"]);
  });
  it("KH-saringDaftar-06: daftar tahun tanpa duplikat, terbaru dulu, tanpa null; kueri URL hanya memuat penyaring aktif", () => {
    expect(daftarTahun(semua)).toEqual([2027, 2026]);
    expect(kueriPenyaring(bacaPenyaring({}))).toBe("");
    expect(kueriPenyaring(bacaPenyaring({ tahun: "2027", status: "Draf" }))).toBe("?tahun=2027&status=Draf");
    expect(adaPenyaring(bacaPenyaring({}))).toBe(false);
    expect(adaPenyaring(bacaPenyaring({ status: "Arsip" }))).toBe(true);
  });
});

describe("tab dan aksi J-02a", () => {
  it("KH-tabTemplat-01: tab dikenal; nilai asing atau kosong jatuh ke Bagian", () => {
    expect(bacaTab("aturan")).toBe("aturan");
    expect(bacaTab("lampiran")).toBe("bagian"); // tab lampiran dan depan dihapus (milik BIMA)
    expect(bacaTab("depan")).toBe("bagian");
    expect(bacaTab("x")).toBe("bagian");
    expect(bacaTab(undefined)).toBe("bagian");
  });
  it("KH-tabTemplat-02: hanya Draf yang dapat disunting; Susun Versi Baru hanya untuk Aktif tanpa draf menunggu", () => {
    expect(dapatDisunting("Draf")).toBe(true);
    expect(dapatDisunting("Terbit")).toBe(false);
    expect(dapatDisunting("Arsip")).toBe(false);
    expect(dapatSusunVersiBaru("Terbit", false)).toBe(true);
    expect(dapatSusunVersiBaru("Terbit", true)).toBe(false);
    expect(dapatSusunVersiBaru("Draf", false)).toBe(false);
    expect(dapatSusunVersiBaru("Arsip", false)).toBe(false);
  });
  it("KH-tabTemplat-03: URL tab Aturan memuat periode dan butir yang disorot hanya bila ada", () => {
    expect(urlTabAturan("t1")).toBe("/tim-kerja/templat/t1?tab=aturan");
    expect(urlTabAturan("t1", { periodeId: "p", sorot: "BGN-01,KTA-02" })).toBe("/tim-kerja/templat/t1?tab=aturan&periode=p&sorot=BGN-01%2CKTA-02");
  });
});
