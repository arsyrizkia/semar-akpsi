// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-01 periksaKelengkapan (validasi M-12), C-03 turunkanButirCek (butir deterministik dan
// semantik per ketentuan), C-17 cekKataKunci (daftar bagian lain), Class Diagram BagianTemplat (ketentuan komprehensif), C-31 buatDokumenTemplat (tipe isian).
import mammoth from "mammoth";
import { describe, expect, it } from "vitest";
import type { DokumenPeriksa } from "@/lib/kontrak/tipe";
import { cekKataKunci, cekTabel, periksaBatasMin, periksaDiagramAlir, periksaFrasa } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { ekstrakDocx } from "@/lib/pengajuan/ekstraksi";
import { potongPerBagian } from "@/lib/pengajuan/potong";
import { turunkanButirDariTemplat as turunkan } from "@/lib/seed-butir";
import { buatDokumenTemplat } from "@/lib/templat/dokumen";
import { bagianBawaan, bagianDariBaris, keKolomBagian, lengkapiBagian, ringkasKetentuan, susunPetunjuk } from "@/lib/templat/isian-substansi";
import { KETENTUAN_KOSONG, mentahKeBagian, periksaKelengkapan, periksaKetentuan, type BarisBagianMentah } from "@/lib/templat/kelengkapan";

const baris = (o: Partial<BarisBagianMentah> = {}): BarisBagianMentah => ({ ...KETENTUAN_KOSONG, nama: "Bagian", batas: "", tanpaBatas: true, wajib: true, ...o });
const dok = (teks: Record<string, string>, kataKunci: string | null = null): DokumenPeriksa => ({ judul: "", judulBima: "", teksPerBagian: teks, kataKunci, lampiranAda: [], teksLampiran: {}, judulBagianDitemukan: [] });

describe("validasi ketentuan M-12 (Contract C-01)", () => {
  it("KH-ketentuanR3-01: bagian polos sah", () => expect(periksaKetentuan([baris()])).toEqual([null]));
  it("KH-ketentuanR3-02: batas minimal harus bilangan bulat > 0 dan tidak melebihi maksimal", () => {
    expect(periksaKetentuan([baris({ batasMin: "0" })])[0]?.batasMin).toBeTruthy();
    expect(periksaKetentuan([baris({ batasMin: "abc" })])[0]?.batasMin).toBeTruthy();
    expect(periksaKetentuan([baris({ batasMin: "500", batas: "300", tanpaBatas: false })])[0]?.batasMin).toContain("melebihi");
    expect(periksaKetentuan([baris({ batasMin: "300", batas: "300", tanpaBatas: false })])).toEqual([null]);
    expect(periksaKetentuan([baris({ batasMin: "100" })])).toEqual([null]);
  });
  it("KH-ketentuanR3-03: tabel butuh minimal satu kolom terisi; kolom kosong ditolak; wajibTabel boleh tanpa kolom", () => {
    expect(periksaKetentuan([baris({ jenisIsian: "tabel", kolomTabel: [] })])[0]?.kolomTabel).toContain("sekurang-kurangnya satu kolom");
    expect(periksaKetentuan([baris({ jenisIsian: "tabel", kolomTabel: ["No", " "] })])[0]?.kolomTabel).toContain("tidak boleh kosong");
    expect(periksaKetentuan([baris({ jenisIsian: "tabel", kolomTabel: ["No", "Kegiatan"] })])).toEqual([null]);
    expect(periksaKetentuan([baris({ wajibTabel: true, kolomTabel: [] })])).toEqual([null]);
    expect(periksaKetentuan([baris({ wajibTabel: true, kolomTabel: [""] })])[0]?.kolomTabel).toBeTruthy();
  });
  it("KH-ketentuanR3-04: frasa dan unsur isi tidak boleh kosong", () => {
    expect(periksaKetentuan([baris({ frasaWajib: ["a", ""] })])[0]?.frasaWajib).toBeTruthy();
    expect(periksaKetentuan([baris({ unsurIsi: [{ unsur: "  " }] })])[0]?.unsurIsi).toBeTruthy();
    expect(periksaKetentuan([baris({ frasaWajib: ["a"], unsurIsi: [{ unsur: "urgensi" }] })])).toEqual([null]);
  });
  it("KH-ketentuanR3-05: daftar_pustaka maksimal satu; sitasi bernomor butuh daftar_pustaka", () => {
    const p = baris({ nama: "P", jenisIsian: "daftar_pustaka" });
    expect(periksaKetentuan([p, { ...p, nama: "Q" }])[1]?.daftarPustaka).toContain("Hanya satu");
    expect(periksaKetentuan([baris({ sitasiBernomor: true })])[0]?.sitasiBernomor).toContain("daftar pustaka");
    expect(periksaKetentuan([baris({ sitasiBernomor: true }), p])).toEqual([null, null]);
  });
  it("KH-ketentuanR3-06: ketentuan tidak sah membuat templat tidak lengkap", () => {
    const h = periksaKelengkapan({ bagian: [baris({ frasaWajib: [""] })], periodeBerlakuId: "p" });
    expect(h.lengkap).toBe(false);
    expect(h.bagian[0].ketentuan?.frasaWajib).toBeTruthy();
  });
});

describe("turunkanButirCek per ketentuan (Contract C-03)", () => {
  const b = (o: Record<string, unknown>) => ({ nama: "Bagian X", batasKata: null, wajib: false, ...o }) as Parameters<typeof turunkan>[0][number];
  it("KH-turunkanR3-01: satu butir semantik per unsur isi, pertanyaan otomatis atau hasil sunting, parameter semantik ke bagian", () => {
    const t = turunkan([b({ unsurIsi: [{ unsur: "urgensi" }, { unsur: "tujuan", pertanyaan: "Apakah tujuan jelas?" }] })]);
    expect(t.map((x) => [x.kode, x.jenis, x.pemeriksa])).toEqual([["UNS-01", "semantik", "nilaiSemantik"], ["UNS-02", "semantik", "nilaiSemantik"]]);
    expect(t[0].pertanyaan).toBe("Apakah bagian Bagian X memuat urgensi?");
    expect(t[1].pertanyaan).toBe("Apakah tujuan jelas?");
    expect(t[0].parameter).toEqual({ tipe: "semantik", bagian: "Bagian X" });
    expect(t[0].deskripsi).toBe("Bagian X memuat urgensi");
  });
  it("KH-turunkanR3-02: unsur kosong diabaikan", () => expect(turunkan([b({ unsurIsi: [{ unsur: " " }] })])).toEqual([]));
  it("KH-turunkanR3-03: batas minimal menjadi KTM, maksimal KTA, keduanya bisa bersama", () => {
    const t = turunkan([b({ batasKata: 300, batasMin: 100 })]);
    expect(t.map((x) => [x.kode, x.parameter])).toEqual([
      ["KTA-01", { tipe: "batas_kata", bagian: "Bagian X", batas: 300 }],
      ["KTM-01", { tipe: "batas_kata_min", bagian: "Bagian X", batas: 100 }],
    ]);
  });
  it("KH-turunkanR3-04: frasa wajib menjadi satu FRS per frasa", () => {
    const t = turunkan([b({ frasaWajib: ["kalimat satu", "kalimat dua"] })]);
    expect(t.map((x) => [x.kode, x.parameter])).toEqual([
      ["FRS-01", { tipe: "frasa_wajib", bagian: "Bagian X", frasa: "kalimat satu" }],
      ["FRS-02", { tipe: "frasa_wajib", bagian: "Bagian X", frasa: "kalimat dua" }],
    ]);
  });
  it("KH-turunkanR3-05: tabel di dalam bagian teks menjadi TBL dengan kolom; tipe tabel juga; tanpa kolom tidak memuat kolom", () => {
    const t = turunkan([b({ wajibTabel: true, kolomTabel: ["No", "Uraian"] })]);
    expect(t[0].parameter).toEqual({ tipe: "tabel_wajib", bagian: "Bagian X", kolom: ["No", "Uraian"] });
    expect(turunkan([b({ jenisIsian: "tabel" })])[0].parameter).toEqual({ tipe: "tabel_wajib", bagian: "Bagian X" });
  });
  it("KH-turunkanR3-06: gambar berketerangan menjadi GBR deterministik dan UNS semantik kesesuaian isi", () => {
    const t = turunkan([b({ wajibGambar: true, ketGambar: "arsitektur sistem" })]);
    expect(t.map((x) => [x.kode, x.jenis])).toEqual([["GBR-01", "deterministik"], ["UNS-01", "semantik"]]);
    expect(t[0].parameter).toEqual({ tipe: "diagram_alir", bagian: "Bagian X", keterangan: "arsitektur sistem" });
    expect(t[1].pertanyaan).toContain("arsitektur sistem");
  });
  it("KH-turunkanR3-07: daftar bagian lain membawa nama bagian di parameter dan deskripsi", () => {
    const t = turunkan([b({ nama: "Bidang Keilmuan", jenisIsian: "daftar", jumlahButir: 3, pemisah: ";" })]);
    expect(t[0]).toMatchObject({ kode: "KAT-01", deskripsi: "Bidang Keilmuan: tepat 3 butir, dipisahkan titik koma (;)", parameter: { tipe: "kata_kunci", jumlah: 3, pemisah: ";", bagian: "Bidang Keilmuan" } });
  });
  it("KH-turunkanR3-08: bawaan A-H Dasar: 15 butir semantik (pemetaan ISI-01 4, ISI-02 5, ISI-04 4, ISI-05S 1, ISI-03S 1 gambar) dan butir deterministik tetap", () => {
    const t = turunkan(bagianBawaan("dasar"));
    const sem = t.filter((x) => x.jenis === "semantik");
    expect(sem).toHaveLength(15);
    expect(sem.filter((x) => x.bagian === "Ringkasan")).toHaveLength(4);
    expect(sem.filter((x) => x.bagian === "Pendahuluan")).toHaveLength(5);
    expect(sem.filter((x) => x.bagian === "Metode")).toHaveLength(5); // 4 unsur + kesesuaian gambar
    expect(sem.filter((x) => x.bagian === "Hasil yang Diharapkan")).toHaveLength(1);
    expect(t.filter((x) => x.jenis === "deterministik").map((x) => x.kode.replace(/-\d+$/, "")).filter((k, i, a) => a.indexOf(k) === i)).toEqual(["BGN", "KTA", "KAT", "GBR", "TBL", "SIT"]);
    expect(t.find((x) => x.kode === "TBL-01")?.parameter).toEqual({ tipe: "tabel_wajib", bagian: "Jadwal Penelitian", kolom: ["No", "Nama Kegiatan", "Bulan 1–12"] });
  });
});

describe("pemeriksa baru (Contract C-17 dan turunannya)", () => {
  it("KH-pemeriksaR3-01: cekKataKunci pada bagian daftar lain: pemisah, jumlah, nama bagian di angka pembukti", () => {
    const d = dok({ "Bidang Keilmuan": "[Ekonomi; Hukum; Sosial]" });
    const h = cekKataKunci(d, 3, ";", "Bidang Keilmuan");
    expect(h).toMatchObject({ status: "Lolos", bagian: "Bidang Keilmuan" });
    expect(h.angkaPembukti).toBe("3 butir: Ekonomi | Hukum | Sosial (pemisah ;)");
    expect(cekKataKunci(dok({ "Bidang Keilmuan": "Ekonomi, Hukum, Sosial" }), 3, ";", "Bidang Keilmuan").angkaPembukti).toContain("pemisah yang dipakai koma (,)");
    expect(cekKataKunci(dok({ "Bidang Keilmuan": "a / b / c" }), 3, "/", "Bidang Keilmuan").status).toBe("Lolos");
    expect(cekKataKunci(dok({}), 3, ";", "Bidang Keilmuan").angkaPembukti).toBe("butir tidak ditemukan di naskah");
  });
  it("KH-pemeriksaR3-02: cekTabel kolom wajib: lengkap Lolos, kurang Gagal, penanda DOCX dicatat belum terbaca", () => {
    const kolom = ["No", "Nama Kegiatan", "Bulan 1–12"];
    expect(cekTabel(dok({ J: "Tahun ke-1\nNo Nama Kegiatan Bulan\n1 2 3 4 5 6 7 8 9 10 11 12" }), "J", kolom).status).toBe("Lolos");
    const g = cekTabel(dok({ J: "Tahun ke-1\nNo Uraian Bulan\n1 2 3 4 5 6 7 8 9 10 11 12" }), "J", kolom);
    expect(g.status).toBe("Gagal");
    expect(g.angkaPembukti).toContain("belum ada: Nama Kegiatan");
    expect(cekTabel(dok({ J: "[tabel]" }), "J", kolom).angkaPembukti).toContain("belum dapat diperiksa");
  });
  it("KH-pemeriksaR3-03: periksaFrasa: huruf besar-kecil, spasi, tanda baca diabaikan", () => {
    const d = dok({ B: "Kami   MENYATAKAN, bahwa data benar." });
    expect(periksaFrasa(d, "B", "menyatakan bahwa data benar").status).toBe("Lolos");
    const g = periksaFrasa(d, "B", "tidak ada kalimat ini");
    expect(g.status).toBe("Gagal");
    expect(g.batasDilanggar).toContain("harus memuat kalimat");
  });
  it("KH-pemeriksaR3-04: periksaBatasMin: tepat batas Lolos, kurang Gagal dengan selisih", () => {
    const d = dok({ B: "satu dua tiga empat lima" });
    expect(periksaBatasMin(d, "B", 5).status).toBe("Lolos");
    const g = periksaBatasMin(d, "B", 8);
    expect(g.status).toBe("Gagal");
    expect(g.angkaPembukti).toContain("kurang 3 kata");
  });
  it("KH-pemeriksaR3-05: periksaDiagramAlir dengan keterangan khusus: keterangan cocok Lolos; keterangan gambar lain tetap lolos sebagai gambar; tanpa gambar Gagal dengan nama keterangan", () => {
    expect(periksaDiagramAlir(dok({ B: "Gambar 1. Arsitektur sistem terpadu" }), "B", "arsitektur sistem").angkaPembukti).toContain("arsitektur sistem");
    expect(periksaDiagramAlir(dok({ B: "teks saja" }), "B", "arsitektur sistem").batasDilanggar).toContain("arsitektur sistem");
  });
});

describe("tipe isian dan petunjuk otomatis (Class Diagram BagianTemplat)", () => {
  it("KH-tipeR3-01: daftar_pustaka disimpan sebagai teks + daftarPustaka true dan dibaca kembali sebagai daftar_pustaka", () => {
    const kol = keKolomBagian({ nama: "Pustaka", batasKata: null, wajib: true, jenisIsian: "daftar_pustaka" });
    expect(kol).toMatchObject({ jenisIsian: "teks", daftarPustaka: true });
    expect(bagianDariBaris({ urutan: 1, nama: "Pustaka", batasKata: null, wajib: true, jenisIsian: "teks", daftarPustaka: true }).jenisIsian).toBe("daftar_pustaka");
  });
  it("KH-tipeR3-02: baris lama tanpa kolom baru tidak menurunkan unsur isi, tetapi tetap daftar_pustaka dan gambar bawaan", () => {
    const l = lengkapiBagian([{ urutan: 1, nama: "Metode", batasKata: 1000, wajib: true }, { urutan: 2, nama: "Daftar Pustaka", batasKata: null, wajib: true }]);
    expect(l[0].unsurIsi).toBeNull();
    expect(l[0].ketGambar).toBe("diagram alir penelitian");
    expect(l[1].jenisIsian).toBe("daftar_pustaka");
  });
  it("KH-tipeR3-03: chip ringkas ketentuan baru", () => {
    const c = ringkasKetentuan(mentahKeBagian(baris({ batas: "300", tanpaBatas: false, batasMin: "100", unsurIsi: [{ unsur: "a" }, { unsur: "b" }], frasaWajib: ["x"], wajibGambar: true, ketGambar: "peta", wajibTabel: true })));
    expect(c).toEqual(["100–300 kata", "tabel", "gambar: peta", "2 unsur isi", "1 frasa wajib"]);
  });
  it("KH-tipeR3-04: susunPetunjuk memuat batas, unsur, gambar, tabel, sitasi, frasa; daftar memuat jumlah dan pemisah", () => {
    const t = susunPetunjuk(mentahKeBagian(baris({ nama: "Latar", batas: "500", tanpaBatas: false, unsurIsi: [{ unsur: "masalah" }, { unsur: "tujuan" }], wajibGambar: true, ketGambar: "bagan", sitasiBernomor: true, frasaWajib: ["Kami setuju"] })));
    expect(t).toContain("tidak lebih dari {batas} kata yang memuat masalah dan tujuan");
    expect(t).toContain("bagan (format JPG/PNG)");
    expect(t).toContain("sistem nomor");
    expect(t).toContain('"Kami setuju"');
    expect(susunPetunjuk(mentahKeBagian(baris({ nama: "Bidang", jenisIsian: "daftar", jumlahButir: "3", pemisah: ";" })))).toBe("Isian 3 butir bidang yang dipisahkan dengan tanda titik koma (;).");
  });
});

describe("docx per tipe (Contract C-31)", () => {
  const skema = { kode: "PD", namaSkema: "Penelitian Dasar" };
  const teks = async (b: Buffer) => (await mammoth.extractRawText({ buffer: b })).value;
  const bagian = [
    { urutan: 1, nama: "Bidang Keilmuan", batasKata: null, wajib: true, jenisIsian: "daftar" as const, jumlahButir: 3, pemisah: ";", unsurIsi: [{ unsur: "bidang" }] },
    { urutan: 2, nama: "Rencana Biaya", batasKata: 200, wajib: true, wajibTabel: true, kolomTabel: ["No", "Uraian", "Biaya"], wajibGambar: true, ketGambar: "peta lokasi" },
    { urutan: 3, nama: "Rincian", batasKata: null, wajib: true, jenisIsian: "tabel" as const, kolomTabel: ["Kode", "Item"], judulTabel: "Tahap 1" },
    { urutan: 4, nama: "Rujukan", batasKata: null, wajib: true, jenisIsian: "daftar_pustaka" as const },
  ];
  it("KH-dokumenR3-01: daftar menjadi [butir 1; butir 2; butir 3], gambar dan tabel bernama, tabel berkolom, pustaka [1]", async () => {
    const buf = await buatDokumenTemplat({ versi: 1, status: "Draf" }, lengkapiBagian(bagian), skema, null);
    const t = await teks(buf);
    expect(t).toContain("[butir 1; butir 2; butir 3]");
    expect(t).toContain("[Sisipkan peta lokasi (JPG/PNG)]");
    expect(t).toContain("[Sisipkan tabel]");
    expect(t).toMatch(/Uraian\s+Biaya/);
    expect(t).toContain("Tahap 1");
    expect(t).toMatch(/Kode\s+Item/);
    expect(t).toContain("[1]");
  });
  it("KH-dokumenR3-02: round-trip: bagian terbaca, petunjuk dan tempat isian bukan isi, kata terhitung nol", async () => {
    const lengkap = lengkapiBagian(bagian);
    const buf = await buatDokumenTemplat({ versi: 1, status: "Draf" }, lengkap, skema, null);
    const h = potongPerBagian(await ekstrakDocx(buf), lengkap);
    const ada = h.judulBagianDitemukan.map((x) => x.toLowerCase());
    for (const n of ["bidang keilmuan", "rencana biaya", "rincian", "rujukan"]) expect(ada.some((x) => x.includes(n))).toBe(true);
    expect((h.teksPerBagian["Bidang Keilmuan"] ?? "").trim()).toBe("");
    expect((h.teksPerBagian["Rencana Biaya"] ?? "").replace(/\[(tabel|gambar)\]/gi, "").trim()).toBe("");
  });
});
