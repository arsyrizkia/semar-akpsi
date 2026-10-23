// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-01 potongPerBagian (Contract C-21), cabang baru Isian Substansi:
// judul berhuruf, melewati sampul/identitas ekspor BIMA, membuang kalimat petunjuk dan tanda [ ], memotong lampiran ekspor, kata kunci multibaris.
import { describe, expect, it } from "vitest";
import type { BagianTemplatDto } from "@/lib/kontrak/tipe";
import type { BlokTeks } from "@/lib/pengajuan/ekstraksi";
import { buangLampiranEkspor, buangPetunjuk, lepasTandaIsian, potongDaftarPustakaEkspor, potongPerBagian } from "@/lib/pengajuan/potong";
import { entriPustaka } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { normalisasiJudul } from "@/lib/pemeriksa/deterministik/teks";
import { bagianBawaan, lengkapiBagian, petunjukResmi } from "@/lib/templat/isian-substansi";

const bagian: BagianTemplatDto[] = bagianBawaan("dasar").map((b, i) => ({ ...b, urutan: i + 1 }));
const J = (teks: string, tingkat = 1): BlokTeks => ({ jenis: "judul", teks, tingkat });
const P = (teks: string): BlokTeks => ({ jenis: "paragraf", teks });
const baris = (teks: string) => teks.split("\n").map(P);

describe("potongPerBagian: judul berhuruf dan sampul ekspor BIMA (cabang)", () => {
  const sampul = ["Kementerian Pendidikan Tinggi, Sains, dan Teknologi", "PROTEKSI ISI PROPOSAL", "1. JUDUL PENELITIAN", "Judul di halaman identitas", "2. IDENTITAS PENGUSUL", "NAMA KETUA", "6. ANGGARAN", "Isian Substansi Proposal", "SKEMA PENELITIAN DASAR"];

  it("KP-potongIsian-01 (J11): judul A. JUDUL ... H. DAFTAR PUSTAKA dikenali; sampul, identitas, anggaran dilewati; judul dokumen = isi bagian Judul", () => {
    const blok = [...sampul.map(P), P("A. JUDUL"), P("Tuliskan judul usulan penelitian maksimal 20 kata"), P("[Judul Penelitian Contoh]"), P("B. RINGKASAN"), P("isi ringkasan")];
    const h = potongPerBagian(blok, bagian);
    expect(h.judulBagianDitemukan).toEqual(["A. JUDUL", "B. RINGKASAN"]);
    expect(h.teksPerBagian).toEqual({ Judul: "Judul Penelitian Contoh", Ringkasan: "isi ringkasan" });
    expect(h.judulDokumen).toBe("Judul Penelitian Contoh");
  });
  it("KP-potongIsian-02 (J12): variasi spasi dan huruf besar-kecil: 'A.JUDUL', 'b) ringkasan'; teks judul dibakukan menjadi 'A. JUDUL'", () => {
    const h = potongPerBagian([P("A.JUDUL"), P("isi judul"), P("b)  ringkasan"), P("isi")], bagian);
    expect(h.judulBagianDitemukan).toEqual(["A. JUDUL", "b. ringkasan"]);
    expect(Object.keys(h.teksPerBagian)).toEqual(["Judul", "Ringkasan"]);
  });
  it("KP-potongIsian-03 (J13): cukup satu judul berhuruf: bukan mode berhuruf, jadi memakai cara lama (judul dokumen dari blok pertama)", () => {
    const h = potongPerBagian([P("Judul Naskah Lama"), P("Ringkasan"), P("isi lama"), P("A. JUDUL"), P("tidak mengubah mode")], bagian);
    expect(h.judulDokumen).toBe("Judul Naskah Lama");
    expect(h.teksPerBagian.Ringkasan).toContain("isi lama");
  });
  it("KP-potongIsian-04 (J14): mode berhuruf: paragraf bernama bagian tanpa huruf bukan judul; judul gaya Heading tanpa huruf tetap diakui", () => {
    const blok = [P("A. JUDUL"), P("j"), P("B. RINGKASAN"), P("Metode"), P("isi ringkasan"), J("Daftar Pustaka"), P("[1] satu")];
    const h = potongPerBagian(blok, bagian);
    expect(h.teksPerBagian.Ringkasan).toBe("Metode\nisi ringkasan");
    expect(h.teksPerBagian["Daftar Pustaka"]).toBe("[1] satu");
    expect(h.judulBagianDitemukan).toEqual(["A. JUDUL", "B. RINGKASAN", "Daftar Pustaka"]);
  });
  it("KP-potongIsian-05 (J15): mode berhuruf tanpa bagian Judul pada templat: judul dokumen kosong (sampul tidak dipakai)", () => {
    const tanpaJudul = bagian.filter((b) => b.nama !== "Judul");
    const h = potongPerBagian([P("Kementerian ..."), P("B. RINGKASAN"), P("a"), P("C. KATA KUNCI"), P("x; y")], tanpaJudul);
    expect(h.judulDokumen).toBe("");
  });
  it("KP-potongIsian-06 (J16): judul panjang (> 100 karakter) bukan judul bagian; blok bukan paragraf/judul (gambar) tidak dicocokkan", () => {
    const panjang = `A. JUDUL ${"x".repeat(120)}`;
    const h = potongPerBagian([P("A. JUDUL"), P(panjang), { jenis: "gambar", teks: "B. RINGKASAN" }, P("C. KATA KUNCI"), P("a; b")], bagian);
    expect(h.teksPerBagian.Judul).toBe(`${panjang}\nB. RINGKASAN`); // blok gambar menjadi isi bagian aktif
    expect(h.judulBagianDitemukan).toEqual(["A. JUDUL", "C. KATA KUNCI"]);
  });
});

describe("potongPerBagian: petunjuk, tanda isian, kata kunci multibaris (cabang)", () => {
  it("KP-potongIsian-07 (J17): kalimat petunjuk terpecah beberapa baris dibuang; isian [ ... ] dilepas; kata kunci multibaris digabung", () => {
    const blok = [
      P("A. JUDUL"),
      P("Tuliskan judul usulan penelitian maksimal 20 kata"),
      P("[Judul Panjang"),
      P("Dua Baris]"),
      P("C. KATA KUNCI"),
      ...baris("Isian 5 kata kunci yang dipisahkan dengan tanda titik koma (;)\n[Satu; Dua; Tiga; Empat;\nLima]"),
    ];
    const h = potongPerBagian(blok, bagian);
    expect(h.teksPerBagian.Judul).toBe("Judul Panjang\nDua Baris");
    expect(h.judulDokumen).toBe("Judul Panjang Dua Baris");
    expect(h.kataKunci).toBe("Satu; Dua; Tiga; Empat; Lima");
  });
  it("KP-potongIsian-08 (J18): bagian Kata Kunci memakai awalan 'Kata kunci:' pada isian berhuruf", () => {
    const h = potongPerBagian([P("A. JUDUL"), P("j"), P("C. KATA KUNCI"), P("Kata kunci: a; b; c; d; e")], bagian);
    expect(h.kataKunci).toBe("a; b; c; d; e");
  });
  it("KP-potongIsian-09 (J19): hanya bagian terakhir yang dipotong dari lampiran ekspor; bagian Daftar Pustaka dipotong sesudah entri terakhir", () => {
    const blok = [
      P("A. JUDUL"), P("j"),
      P("B. RINGKASAN"), P("SURAT PERNYATAAN"), P("ini tetap isi ringkasan"),
      P("H. DAFTAR PUSTAKA"), P("1. Satu. 2020."), P("2. Dua. 2021."), P("3. Tiga. 2022."), P("SURAT PERNYATAAN"), P("isi surat"),
    ];
    const h = potongPerBagian(blok, bagian);
    expect(h.teksPerBagian.Ringkasan).toBe("SURAT PERNYATAAN\nini tetap isi ringkasan");
    expect(h.teksPerBagian["Daftar Pustaka"]).toBe("1. Satu. 2020.\n2. Dua. 2021.\n3. Tiga. 2022.");
  });
  it("KP-potongIsian-10 (J20): bagian templat tanpa petunjuk resmi atau kalimat petunjuk dari atribut bagian: atribut dipakai", () => {
    const khusus: BagianTemplatDto[] = [{ urutan: 1, nama: "Rencana Hilirisasi", batasKata: 400, wajib: false, petunjuk: "Uraikan rencana hilirisasi hasil" }];
    const h = potongPerBagian([J("Rencana Hilirisasi"), P("Uraikan rencana hilirisasi hasil"), P("isi hilirisasi")], khusus);
    expect(h.teksPerBagian["Rencana Hilirisasi"]).toBe("isi hilirisasi");
    const tanpa = potongPerBagian([J("Rencana Hilirisasi"), P("Uraikan rencana hilirisasi hasil"), P("isi")], [{ ...khusus[0], petunjuk: null }]);
    expect(tanpa.teksPerBagian["Rencana Hilirisasi"]).toBe("Uraikan rencana hilirisasi hasil\nisi");
  });
});

describe("buangPetunjuk (cabang)", () => {
  const petunjukRingkasan = petunjukResmi("Ringkasan", 300)!;
  it("KP-buangPetunjuk-01: baris kosong dan baris 'Panduan: ...' di awal dibuang meski tanpa petunjuk resmi", () => {
    expect(buangPetunjuk(["", "Panduan: maksimal 400 kata. Bagian opsional.", "isi"], null)).toEqual(["isi"]);
  });
  it("KP-buangPetunjuk-02: petunjuk kosong (tanpa kata) tidak membuang apa pun", () => {
    expect(buangPetunjuk(["isi"], "(;)")).toEqual(["isi"]);
  });
  it("KP-buangPetunjuk-03: baris tanpa kata (mis. tanda baca saja) menghentikan pencocokan; baris yang berbeda juga", () => {
    expect(buangPetunjuk(["---", "isi"], petunjukRingkasan)).toEqual(["---", "isi"]);
    expect(buangPetunjuk(["Kalimat lain sama sekali", "isi"], petunjukRingkasan)).toEqual(["Kalimat lain sama sekali", "isi"]);
  });
  it("KP-buangPetunjuk-04: baris lebih panjang daripada sisa petunjuk (isi menempel pada petunjuk) menghentikan pencocokan", () => {
    const kalimat = "Tuliskan judul usulan penelitian maksimal 20 kata";
    expect(buangPetunjuk([`${kalimat} dan isi yang menempel`], petunjukResmi("Judul", 20))).toEqual([`${kalimat} dan isi yang menempel`]);
  });
  it("KP-buangPetunjuk-05: angka batas boleh berbeda; salah ketik satu huruf pada kata panjang dimaafkan; kata pendek harus sama", () => {
    expect(buangPetunjuk(["Tuliskan judul usulan penelitian maksimal 25 kata", "isi"], petunjukResmi("Judul", 20))).toEqual(["isi"]);
    expect(buangPetunjuk(["Tuliskan judul usulan penelitian maksimal 20 kata", "isi"], "Tuliskan judul usulan penelitian maksimal 20 kata")).toEqual(["isi"]);
    expect(buangPetunjuk(["Tuliskan judul usulan penilitian maksimal 20 kata", "isi"], petunjukResmi("Judul", 20))).toEqual(["isi"]); // penilitian: salah ketik
    // 'kati' (kurang dari 5 huruf) tidak dimaafkan: pencocokan baris gagal sehingga tak satu pun dibuang
    expect(buangPetunjuk(["Tuliskan judul usulan penelitian maksimal 20 kati", "isi"], petunjukResmi("Judul", 20))).toEqual(["Tuliskan judul usulan penelitian maksimal 20 kati", "isi"]);
  });
  it("KP-buangPetunjuk-06: petunjuk terbaca sebagian: >= 80% kalimat dibuang; kurang dari itu dibiarkan", () => {
    const lengkap = "Isian ringkasan penelitian tidak lebih dari 300 kata yang berisi urgensi tujuan metode dan luaran yang ditargetkan";
    const hampir = lengkap.split(" ").slice(0, 15).join(" "); // 15 dari 19 kata
    expect(buangPetunjuk([hampir, "isi"], lengkap)).toEqual(["isi"]);
    const sedikit = lengkap.split(" ").slice(0, 8).join(" ");
    expect(buangPetunjuk([sedikit, "isi"], lengkap)).toEqual([sedikit, "isi"]);
  });
  it("KP-buangPetunjuk-07: kata pendek yang berbeda satu huruf bukan salah ketik (panjang kurang dari 5)", () => {
    expect(buangPetunjuk(["Jelaskan hasil yang diharapkan atau luaran yang dijanjikan dari penelitian", "x"], "Jelaskan hasil yang diharapkan atau luaran yang dijanjikan dari penelitian")).toEqual(["x"]);
    expect(buangPetunjuk(["Jelaskan hasil yang diharapkan atau luaran yang dijanjikan dari penelitian"], "Jelaskan hasil yang diharapkan atau luaran yang dijanjikan dari penelitian ini")).toEqual([]);
  });
});

describe("lepasTandaIsian (cabang)", () => {
  it("KP-lepasTandaIsian-01: masukan kosong atau hanya baris kosong menghasilkan larik kosong", () => {
    expect(lepasTandaIsian([])).toEqual([]);
    expect(lepasTandaIsian(["", "  "])).toEqual([]);
  });
  it("KP-lepasTandaIsian-02: '[' dan ']' di baris sendiri di awal/akhir dibuang walau pasangannya tidak terbaca; hanya '[' atau ']' menjadi kosong", () => {
    expect(lepasTandaIsian(["[", "isi", "]"])).toEqual(["isi"]);
    expect(lepasTandaIsian(["isi tanpa pembuka", "]"])).toEqual(["isi tanpa pembuka"]);
    expect(lepasTandaIsian(["[", "]"])).toEqual([]);
  });
  it("KP-lepasTandaIsian-03: pembuka inline dan penutup seimbang: '[isi' ... 'akhir]' dilepas; penutup yang seimbang ('[4]') dipertahankan", () => {
    expect(lepasTandaIsian(["[isi satu", "akhir]"])).toEqual(["isi satu", "akhir"]);
    expect(lepasTandaIsian(["[isi satu", "rujukan [4]"])).toEqual(["isi satu", "rujukan [4]"]);
    expect(lepasTandaIsian(["[isi sebaris]"])).toEqual(["isi sebaris"]);
  });
  it("KP-lepasTandaIsian-04: baris pertama berupa sitasi '[1] ...' bukan tanda isian; placeholder '[ … ]' dan '[...]' menjadi kosong", () => {
    expect(lepasTandaIsian(["[1] Satu.", "[2] Dua."])).toEqual(["[1] Satu.", "[2] Dua."]);
    expect(lepasTandaIsian(["[ … ]"])).toEqual([]);
    expect(lepasTandaIsian(["[...]"])).toEqual([]);
  });
});

describe("buangLampiranEkspor dan potongDaftarPustakaEkspor (cabang)", () => {
  it("KP-lampiranEkspor-01: tanpa judul surat, baris tidak berubah", () => {
    expect(buangLampiranEkspor(["a", "b"])).toEqual(["a", "b"]);
  });
  it("KP-lampiranEkspor-02: dipotong pada judul surat berikut kop suratnya (huruf kapital, alamat, baris pendek); pustaka bernomor dan tautan dipertahankan", () => {
    const masuk = ["1. Satu.", "doi: 10.1/ab", "KEMENTERIAN X", "Jalan Contoh 1", "Kota Contoh 12345", "Laman: x.example", "SURAT PERNYATAAN", "isi surat"];
    expect(buangLampiranEkspor(masuk)).toEqual(["1. Satu.", "doi: 10.1/ab"]);
    expect(buangLampiranEkspor(["PERSETUJUAN PENGUSUL", "x"])).toEqual([]);
    expect(buangLampiranEkspor(["1. Satu.", "", "Surat Pernyataan Kesediaan Mitra", "x"])).toEqual(["1. Satu."]);
  });
  it("KP-lampiranEkspor-03: kurang dari tiga entri berurutan: daftar tidak dipotong", () => {
    const masuk = ["1. Satu.", "2. Dua.", "teks lain"];
    expect(potongDaftarPustakaEkspor(masuk)).toEqual(masuk);
  });
  it("KP-lampiranEkspor-04: entri terakhir dibawa sampai baris penutup (titik, bukan inisial) atau tautan; artikel sesudahnya dibuang", () => {
    const daftar = ["1. A. Satu. Judul,", "Jurnal 2020.", "2. Dua. Judul,", "Jurnal 2021.", "[3] Tiga.", "4. Empat, J. P.", "Jurnal Empat, 2022.", "Artikel lampiran", "1. Pendahuluan"];
    expect(potongDaftarPustakaEkspor(daftar)).toEqual(["1. A. Satu. Judul,", "Jurnal 2020.", "2. Dua. Judul,", "Jurnal 2021.", "[3] Tiga.", "4. Empat, J. P.", "Jurnal Empat, 2022."]);
    expect(potongDaftarPustakaEkspor(["1. A.", "2. B.", "3. C. judul", "https://doi.org/x/y", "sisa artikel"])).toEqual(["1. A.", "2. B.", "3. C. judul", "https://doi.org/x/y"]);
  });
  it("KP-lampiranEkspor-05: entri terakhir tanpa penutup dibatasi delapan baris; nomor yang melompat tidak masuk rantai", () => {
    const panjang = ["1. A.", "2. B.", "3. C", ...Array.from({ length: 12 }, (_, i) => `lanjutan ${i}`)];
    expect(potongDaftarPustakaEkspor(panjang)).toHaveLength(2 + 8);
    expect(potongDaftarPustakaEkspor(["1. Ab.", "2. Bc.", "3. Cd.", "7. Lompat tidak dihitung"])).toEqual(["1. Ab.", "2. Bc.", "3. Cd."]);
    expect(potongDaftarPustakaEkspor(["1. A.", "2. B.", "3. C", "4. D."])).toEqual(["1. A.", "2. B.", "3. C", "4. D."]);
  });
});

describe("normalisasiJudul: huruf bagian (cabang)", () => {
  it("KP-normalisasiJudul-huruf: 'A. JUDUL' menjadi 'judul'; huruf tanpa jarak setelah titik tidak dihapus", () => {
    expect(normalisasiJudul("A. JUDUL")).toBe("judul");
    expect(normalisasiJudul("h) Daftar Pustaka")).toBe("daftar pustaka");
    expect(normalisasiJudul("A.JUDUL")).toBe("a.judul");
  });
  it("KP-lengkapiBagian-01: atribut huruf dari urutan; petunjuk tidak diubah; atribut petunjuk yang sudah ada dipertahankan", () => {
    const acak = [{ urutan: 5, nama: "Metode", batasKata: 1000, wajib: true, petunjuk: "Khusus" }, { urutan: 2, nama: "Lain", batasKata: null, wajib: false }];
    const hasil = lengkapiBagian(acak);
    expect(hasil.map((b) => [b.huruf, b.nama, b.petunjuk])).toEqual([["A", "Lain", undefined], ["B", "Metode", "Khusus"]]);
  });
});

describe("entriPustaka: baris lanjutan ekspor BIMA (cabang)", () => {
  it("KP-entriPustaka-01: baris lanjutan berawalan DOI ('10.1016/...') atau tahun ('2016. doi') bukan entri baru; '[1]teks' rapat tetap entri", () => {
    const teks = ["1. Satu, J. Judul, doi:", "10.1016/j.contoh.2020.01.001", "2. Dua, K. Judul,", "2016. doi: 10.1109/X.2016.1", "[3]Tiga rapat", "4) Empat"].join("\n");
    expect(entriPustaka(teks).map((e) => e.nomor)).toEqual([1, 2, 3, 4]);
    expect(entriPustaka(teks)[0].teks).toContain("10.1016/j.contoh.2020.01.001");
    expect(entriPustaka(teks)[1].teks).toContain("2016. doi");
  });
});
