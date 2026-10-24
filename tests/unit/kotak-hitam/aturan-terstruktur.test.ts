// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-03 (turunkanButirCek), C-06 dan C-07 (simpan butir, kunci 4a),
// CRC ButirCek dan BagianTemplat; formulir terstruktur Tambah Butir dan sinkron dua arah bagian-aturan (revisi rancangan 24 Okt 2026).
import { describe, expect, it } from "vitest";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import { BAGIAN_BARU } from "@/app/(semar)/tim-kerja/templat/[idTemplat]/isian";
import { mentahKeBagian, type BarisBagianMentah } from "@/lib/templat/kelengkapan";
import {
  FORM_ATURAN_KOSONG,
  JENIS_ATURAN,
  KELOMPOK_LAMPIRAN,
  KELOMPOK_UMUM,
  asalAturanButir,
  bangunNilaiButir,
  dapatDiubahDiBagian,
  deskripsiOtomatis,
  formDariAsal,
  formDariButir,
  hapusDariBagian,
  kelompokkanAturan,
  kodeOtomatis,
  terapkanKeBagian,
  validasiFormAturan,
  type FormAturan,
} from "@/lib/aturan/terstruktur";

const bagian = (o: Partial<BarisBagianMentah> = {}): BarisBagianMentah => ({ ...BAGIAN_BARU, nama: "Metode", ...o });
const form = (o: Partial<FormAturan>): FormAturan => ({ ...FORM_ATURAN_KOSONG, bagian: "Metode", ...o });
const turunan = (b: BarisBagianMentah) => turunkanButirDariTemplat([mentahKeBagian(b)], []);
const kodeUnik = (xs: { kode: string }[]) => xs.map((x) => x.kode);

describe("formulir terstruktur: validasi per jenis aturan (C-06)", () => {
  it("KH-formAturan-01: jenis aturan wajib dipilih; setiap jenis berlabel Deterministik atau Semantik", () => {
    expect(validasiFormAturan(form({}), { manual: false }).jenisAturan).toBeDefined();
    expect(JENIS_ATURAN.filter((j) => j.jenis === "semantik").map((j) => j.nilai)).toEqual(["unsur", "semantik_bebas"]);
    expect(JENIS_ATURAN.filter((j) => j.terikatIsi).map((j) => j.nilai)).toEqual(["batas_kata", "batas_kata_min", "daftar", "tabel", "gambar", "sitasi", "frasa", "unsur"]);
  });
  it("KH-formAturan-02: bagian wajib untuk jenis yang menempel pada isi; lampiran wajib untuk jenis lampiran", () => {
    expect(validasiFormAturan(form({ jenisAturan: "batas_kata", batas: "10", bagian: "" }), { manual: false }).bagian).toBeDefined();
    expect(validasiFormAturan(form({ jenisAturan: "lampiran_ada" }), { manual: true, kodeTerpakai: [], }).lampiran).toBeDefined();
    expect(validasiFormAturan(form({ jenisAturan: "judul_sama", bagian: "", kode: "JDL-M01", deskripsi: "x" }), { manual: true })).toEqual({});
  });
  it("KH-formAturan-03: batas kata harus angka bulat > 0 (nilai sah, 0, negatif, desimal, teks, batas atas)", () => {
    const g = (b: string) => validasiFormAturan(form({ jenisAturan: "batas_kata", batas: b }), { manual: false }).batas;
    expect(g("250")).toBeUndefined();
    expect(g("1")).toBeUndefined();
    for (const salah of ["0", "-5", "1,5", "abc", "", "1234567"]) expect(g(salah), salah).toBeDefined();
  });
  it("KH-formAturan-04: format daftar: jumlah 1-99 dan pemisah satu karakter", () => {
    const g = (j: string, p: string) => validasiFormAturan(form({ jenisAturan: "daftar", jumlahButir: j, pemisah: p }), { manual: false });
    expect(g("5", ";")).toEqual({});
    expect(g("0", ";").jumlahButir).toBeDefined();
    expect(g("100", ";").jumlahButir).toBeDefined();
    expect(g("5", ";;").pemisah).toBeDefined();
    expect(g("5", "").pemisah).toBeDefined();
  });
  it("KH-formAturan-05: tabel butuh kolom tak kosong; frasa, unsur, pertanyaan semantik bebas, dan kalimat kunci tidak boleh kosong", () => {
    expect(validasiFormAturan(form({ jenisAturan: "tabel", kolom: [] }), { manual: false }).kolom).toBeDefined();
    expect(validasiFormAturan(form({ jenisAturan: "tabel", kolom: ["No", " "] }), { manual: false }).kolom).toBeDefined();
    expect(validasiFormAturan(form({ jenisAturan: "tabel", kolom: ["No", "Bulan 1–24"] }), { manual: false })).toEqual({});
    expect(validasiFormAturan(form({ jenisAturan: "frasa", frasa: " " }), { manual: false }).frasa).toBeDefined();
    expect(validasiFormAturan(form({ jenisAturan: "unsur", unsur: "" }), { manual: false }).unsur).toBeDefined();
    expect(validasiFormAturan(form({ jenisAturan: "semantik_bebas", pertanyaan: "" }), { manual: false }).pertanyaan).toBeDefined();
    expect(validasiFormAturan(form({ jenisAturan: "lampiran_kunci", lampiran: "S", kunci: "\n \n" }), { manual: false }).kunci).toBeDefined();
  });
  it("KH-formAturan-06: butir manual: kode berpola sah dan unik, deskripsi wajib; kode asal boleh sama saat Ubah", () => {
    const f = form({ jenisAturan: "sitasi", kode: "SIT-M01", deskripsi: "d" });
    expect(validasiFormAturan(f, { manual: true, kodeTerpakai: [] })).toEqual({});
    expect(validasiFormAturan(f, { manual: true, kodeTerpakai: ["SIT-M01"] }).kode).toBeDefined();
    expect(validasiFormAturan(f, { manual: true, kodeTerpakai: ["SIT-M01"], kodeAsal: "SIT-M01" })).toEqual({});
    expect(validasiFormAturan({ ...f, kode: "" }, { manual: true }).kode).toBeDefined();
    expect(validasiFormAturan({ ...f, kode: "a b" }, { manual: true }).kode).toBeDefined();
    expect(validasiFormAturan({ ...f, deskripsi: " " }, { manual: true }).deskripsi).toBeDefined();
  });
  it("KH-formAturan-07: kode dan deskripsi otomatis; kode melewati yang sudah dipakai", () => {
    expect(kodeOtomatis("frasa", [])).toBe("FRS-M01");
    expect(kodeOtomatis("frasa", ["FRS-M01", "FRS-M02"])).toBe("FRS-M03");
    expect(kodeOtomatis("", [])).toBe("BTR-M01");
    expect(deskripsiOtomatis(form({ jenisAturan: "batas_kata", batas: "300" }))).toBe("Bagian “Metode” tidak melebihi 300 kata");
    expect(deskripsiOtomatis(form({ jenisAturan: "daftar", jumlahButir: "5", pemisah: ";" }))).toContain("tepat 5 butir, dipisahkan titik koma");
  });
});

describe("sinkron dua arah bagian dan aturan: satu sumber data (C-03)", () => {
  it("KH-sinkron-01: aturan yang ditambah lewat formulir melahirkan butir turunan dengan kode dan parameter yang sama dengan penurunan templat", () => {
    const b = terapkanKeBagian(bagian({ wajib: false }), form({ jenisAturan: "batas_kata", batas: "250" }));
    const t = turunan(b);
    expect(t.map((x) => x.parameter)).toEqual([{ tipe: "batas_kata", bagian: "Metode", batas: 250 }]);
    expect(kodeUnik(t)).toEqual(["KTA-01"]);
  });
  it("KH-sinkron-02: setiap jenis yang menempel pada isi menulis ke ketentuan bagian dan butirnya lahir", () => {
    const awal = bagian({ wajib: false });
    const hasil = [
      terapkanKeBagian(awal, form({ jenisAturan: "batas_kata_min", batas: "100" })),
      terapkanKeBagian(awal, form({ jenisAturan: "daftar", jumlahButir: "4", pemisah: "," })),
      terapkanKeBagian(awal, form({ jenisAturan: "tabel", kolom: ["No", "Nama Kegiatan", "Bulan 1–24"], judulTabel: "Tahun ke-1" })),
      terapkanKeBagian(awal, form({ jenisAturan: "gambar", ketGambar: "diagram alir" })),
      terapkanKeBagian(awal, form({ jenisAturan: "frasa", frasa: "Seluruh biaya sesuai RAB" })),
      terapkanKeBagian(awal, form({ jenisAturan: "unsur", unsur: "urgensi", pertanyaan: "Apakah urgensi jelas?", contoh: "Ya, karena ..." })),
    ];
    const tipe = hasil.map((b) => turunan(b).map((x) => (x.parameter as { tipe: string }).tipe));
    expect(tipe).toEqual([["batas_kata_min"], ["kata_kunci"], ["tabel_wajib"], ["diagram_alir", "semantik"], ["frasa_wajib"], ["semantik"]]);
    const unsur = turunan(hasil[5])[0];
    expect(unsur.pertanyaan).toBe("Apakah urgensi jelas?");
    expect(unsur.contohJawaban).toBe("Ya, karena ...");
  });
  it("KH-sinkron-03: tabel di bagian bertipe tabel mengisi kolom, selain itu menyalakan tabel wajib", () => {
    expect(terapkanKeBagian(bagian({ jenisIsian: "tabel" }), form({ jenisAturan: "tabel", kolom: ["A"] })).wajibTabel).toBe(false);
    expect(terapkanKeBagian(bagian({ jenisIsian: "teks" }), form({ jenisAturan: "tabel", kolom: ["A"] })).wajibTabel).toBe(true);
  });
  it("KH-sinkron-04: frasa dan unsur ditambahkan bila tanpa asal, dan diganti di tempat bila ada asal", () => {
    const b = bagian({ frasaWajib: ["satu", "dua"], unsurIsi: [{ unsur: "a", pertanyaan: "" }, { unsur: "b", pertanyaan: "" }] });
    expect(terapkanKeBagian(b, form({ jenisAturan: "frasa", frasa: "tiga" })).frasaWajib).toEqual(["satu", "dua", "tiga"]);
    expect(terapkanKeBagian(b, form({ jenisAturan: "frasa", frasa: "SATU" }), { frasa: "satu" }).frasaWajib).toEqual(["SATU", "dua"]);
    expect(terapkanKeBagian(b, form({ jenisAturan: "unsur", unsur: "bb" }), { unsur: "b" }).unsurIsi?.map((u) => u.unsur)).toEqual(["a", "bb"]);
    expect(terapkanKeBagian(b, form({ jenisAturan: "frasa", frasa: "x" }), { frasa: "tidak ada" }).frasaWajib).toEqual(["satu", "dua", "x"]);
  });
  it("KH-sinkron-05: hapus aturan meniadakan butirnya pada penurunan berikutnya (setiap jenis)", () => {
    const penuh = bagian({ wajib: false, batas: "100", tanpaBatas: false, batasMin: "10", jenisIsian: "daftar", jumlahButir: "5", pemisah: ";", wajibGambar: true, ketGambar: "g", wajibTabel: true, kolomTabel: ["No"], sitasiBernomor: true, frasaWajib: ["f"], unsurIsi: [{ unsur: "u", pertanyaan: "" }] });
    expect(turunan(penuh).length).toBeGreaterThan(6);
    let b = penuh;
    for (const a of [{ jenisAturan: "batas_kata" }, { jenisAturan: "batas_kata_min" }, { jenisAturan: "daftar" }, { jenisAturan: "gambar" }, { jenisAturan: "tabel" }, { jenisAturan: "sitasi" }, { jenisAturan: "frasa", frasa: "f" }, { jenisAturan: "unsur", unsur: "u" }] as const) b = hapusDariBagian(b, a);
    expect(turunan(b).filter((x) => x.kode.startsWith("SIT")).length).toBe(0);
    expect(turunan(b)).toEqual([]);
  });
  it("KH-sinkron-06: hapus tabel pada bagian bertipe tabel mengembalikan tipe teks", () => {
    expect(hapusDariBagian(bagian({ jenisIsian: "tabel", kolomTabel: ["A"] }), { jenisAturan: "tabel" }).jenisIsian).toBe("teks");
  });
  it("KH-sinkron-07: petunjuk bagian ikut berubah bila masih otomatis, dan tetap bila sudah disunting manual", () => {
    const otomatis = terapkanKeBagian(bagian({ petunjuk: "" }), form({ jenisAturan: "batas_kata", batas: "250" }));
    expect(otomatis.petunjuk).toContain("{batas}");
    expect(otomatis.petunjuk).not.toBe("");
    const manual = terapkanKeBagian(bagian({ petunjuk: "Petunjuk saya sendiri." }), form({ jenisAturan: "batas_kata", batas: "250" }));
    expect(manual.petunjuk).toBe("Petunjuk saya sendiri.");
  });
  it("KH-sinkron-08: butir turunan dipetakan balik ke asalnya dan formulir Ubah terisi dari ketentuan bagian", () => {
    const b = bagian({ wajib: true, batas: "250", tanpaBatas: false, jenisIsian: "daftar", jumlahButir: "5", pemisah: ";", frasaWajib: ["frasa a"], unsurIsi: [{ unsur: "urgensi", pertanyaan: "P?", contoh: "C" }] });
    const t = turunan(b);
    const asal = t.map((x) => asalAturanButir({ kode: x.kode, deskripsi: x.deskripsi, parameter: x.parameter as never }));
    expect(asal.map((a) => a?.jenisAturan)).toEqual(["wajib", "batas_kata", "daftar", "frasa", "unsur"]);
    expect(dapatDiubahDiBagian(asal[0])).toBe(false);
    const a = asal[4]!;
    if (!dapatDiubahDiBagian(a)) throw new Error("unsur harus dapat diubah");
    const f = formDariAsal(a, b);
    expect(f).toMatchObject({ jenisAturan: "unsur", bagian: "Metode", unsur: "urgensi", pertanyaan: "P?", contoh: "C" });
    const a2 = asal[2]!;
    if (!dapatDiubahDiBagian(a2)) throw new Error("daftar harus dapat diubah");
    expect(formDariAsal(a2, b)).toMatchObject({ jumlahButir: "5", pemisah: ";" });
  });
  it("KH-sinkron-09: butir pustaka, lampiran, parameter asing, dan tipe tak dikenal tidak dapat diubah di bagian", () => {
    expect(asalAturanButir({ kode: "x", deskripsi: "", parameter: { tipe: "pustaka_berurutan", pustaka: "Daftar Pustaka" } })?.jenisAturan).toBe("pustaka");
    expect(asalAturanButir({ kode: "x", deskripsi: "", parameter: { tipe: "lampiran_wajib", nama: "S" } })?.jenisAturan).toBe("lampiran");
    expect(asalAturanButir({ kode: "x", deskripsi: "", parameter: { tipe: "tidak-ada" } })).toBeNull();
    expect(asalAturanButir({ kode: "x", deskripsi: "", parameter: null })).toBeNull();
    expect(dapatDiubahDiBagian(null)).toBe(false);
    expect(dapatDiubahDiBagian({ jenisAturan: "lampiran", bagian: null })).toBe(false);
  });
});

describe("butir manual di luar isi bagian dan butir tersimpan (C-06, C-07)", () => {
  const nilai = (f: FormAturan) => {
    const h = bangunNilaiButir(f, {});
    if (!h.ok) throw new Error(JSON.stringify(h.galat));
    return h.nilai;
  };
  it("KH-bangunNilai-01: lampiran dan umum menjadi butir deterministik dengan pemeriksa dan komponen yang benar", () => {
    const ada = nilai(form({ jenisAturan: "lampiran_ada", bagian: "", lampiran: "Surat Mitra", kode: "LMP-M01", deskripsi: "d" }));
    expect(ada).toMatchObject({ jenis: "deterministik", parameter: { tipe: "lampiran_wajib", nama: "Surat Mitra" }, pemeriksa: "cekLampiran", komponen: "Lampiran" });
    const kunci = nilai(form({ jenisAturan: "lampiran_kunci", bagian: "", lampiran: "Surat Mitra", kunci: "a\n\nb", kode: "FMT-M01", deskripsi: "d" }));
    expect(kunci.parameter).toEqual({ tipe: "lampiran_format", nama: "Surat Mitra", kunci: ["a", "b"] });
    expect(nilai(form({ jenisAturan: "judul_sama", bagian: "", kode: "J1", deskripsi: "d" })).parameter).toEqual({ tipe: "judul_sama" });
  });
  it("KH-bangunNilai-02: pertanyaan semantik bebas membawa bagian, lampiran, dan contoh; unsur tanpa pertanyaan disusun otomatis", () => {
    const s = nilai(form({ jenisAturan: "semantik_bebas", pertanyaan: "Apakah ok?", contoh: "ya", lampiran: "Surat", kode: "SEM-M01", deskripsi: "d" }));
    expect(s).toMatchObject({ jenis: "semantik", pertanyaan: "Apakah ok?", contohJawaban: "ya", parameter: { tipe: "semantik", bagian: "Metode", lampiran: "Surat" } });
    expect(nilai(form({ jenisAturan: "unsur", unsur: "urgensi", kode: "U1", deskripsi: "d" })).pertanyaan).toBe("Apakah bagian Metode memuat urgensi?");
  });
  it("KH-bangunNilai-03: formulir tidak sah menghasilkan galat dan tidak membangun nilai", () => {
    const h = bangunNilaiButir(form({ jenisAturan: "batas_kata", batas: "x", kode: "K", deskripsi: "d" }), {});
    expect(h.ok).toBe(false);
  });
  it("KH-bangunNilai-04: setiap jenis menghasilkan nilai yang pemeriksanya dikenal (bulat-pergi formDariButir)", () => {
    const contoh: FormAturan[] = [
      form({ jenisAturan: "batas_kata", batas: "9", kode: "A", deskripsi: "d" }),
      form({ jenisAturan: "batas_kata_min", batas: "9", kode: "A", deskripsi: "d" }),
      form({ jenisAturan: "daftar", jumlahButir: "3", pemisah: ",", kode: "A", deskripsi: "d" }),
      form({ jenisAturan: "tabel", kolom: ["No", "Bulan 1–12"], kode: "A", deskripsi: "d" }),
      form({ jenisAturan: "gambar", ketGambar: "peta", kode: "A", deskripsi: "d" }),
      form({ jenisAturan: "sitasi", kode: "A", deskripsi: "d" }),
      form({ jenisAturan: "frasa", frasa: "x", kode: "A", deskripsi: "d" }),
      form({ jenisAturan: "struktur_judul", bagian: "", kode: "A", deskripsi: "d" }),
    ];
    for (const f of contoh) {
      const n = nilai(f);
      expect(n.pemeriksa).not.toBe("");
      const balik = formDariButir({ kode: n.kode, deskripsi: n.deskripsi, jenis: n.jenis, parameter: n.parameter as never, pertanyaan: n.pertanyaan, contohJawaban: n.contohJawaban });
      expect(balik?.jenisAturan).toBe(f.jenisAturan);
    }
    expect(formDariButir({ kode: "x", deskripsi: "d", jenis: "deterministik", parameter: { tipe: "pustaka_berurutan" }, pertanyaan: null, contohJawaban: null })).toBeNull();
  });
});

describe("pengelompokan aturan per bagian (CRC BagianTemplat)", () => {
  const baris = (kode: string, bagian: string | null, tipe: string | null = null, lampiran: string | null = null) => ({ kode, bagian, tipe, lampiran });
  it("KH-kelompok-01: bagian templat berurutan dengan huruf A-H, lalu Lampiran, lalu Umum; kelompok kosong disembunyikan", () => {
    const k = kelompokkanAturan([baris("1", "Metode"), baris("2", "Judul"), baris("3", null, "lampiran_wajib", "S"), baris("4", null, "judul_sama"), baris("5", "Metode")], ["Judul", "Ringkasan", "Metode"]);
    expect(k.map((x) => [x.huruf, x.nama, x.butir.length])).toEqual([["A", "Judul", 1], ["C", "Metode", 2], [null, KELOMPOK_LAMPIRAN, 1], [null, KELOMPOK_UMUM, 1]]);
  });
  it("KH-kelompok-02: termasukKosong menampilkan semua bagian templat; bagian di luar templat tetap muncul", () => {
    const k = kelompokkanAturan([baris("1", "Lain")], ["Judul", "Metode"], true);
    expect(k.map((x) => x.nama)).toEqual(["Judul", "Metode", "Lain"]);
  });
  it("KH-kelompok-03: tanpa butir dan tanpa bagian: kosong", () => {
    expect(kelompokkanAturan([], [])).toEqual([]);
  });
});
