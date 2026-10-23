// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-13 cekKataKunci [J1-J9], MS-10 buatDokumenTemplat [J1-J14],
// MS baru cekTabel [J1-J5], periksaDiagramAlir [J1-J4], cekFormatLampiran [J1-J4], turunkanButirCek [J1-J9], lepasTandaIsian (penanda templat).
import mammoth from "mammoth";
import { describe, expect, it } from "vitest";
import type { DokumenPeriksa } from "@/lib/kontrak/tipe";
import { cekKataKunci, cekTabel, periksaDiagramAlir } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { ekstrakDocx } from "@/lib/pengajuan/ekstraksi";
import { lepasTandaIsian, potongPerBagian } from "@/lib/pengajuan/potong";
import { buatDokumenTemplat, namaBerkasTemplat } from "@/lib/templat/dokumen";
import { bagianBawaan, lengkapiBagian, petunjukBagian } from "@/lib/templat/isian-substansi";
import { KOP_BAWAAN } from "@/lib/templat/paket";

const dok = (kataKunci: string | null): DokumenPeriksa => ({ judul: "", judulBima: "", teksPerBagian: {}, kataKunci, lampiranAda: [], teksLampiran: {}, judulBagianDitemukan: [] });
const status = (t: string | null, n = 5, p = ";") => cekKataKunci(dok(t), n, p).angkaPembukti;

describe("cekKataKunci (MS-13) tiap jalur", () => {
  it("KP-cekKataKunci-J1: kosong", () => expect(status("")).toBe("kata kunci tidak ditemukan di naskah"));
  it("KP-cekKataKunci-J2: kurung siku pembuka dan penutup dibuang; kurung siku tak berpasangan dibiarkan", () => {
    expect(status("[a; b; c; d; e]")).toContain("5 kata kunci: a | b");
    expect(status("[a; b; c; d; e")).toContain("[a");
  });
  it("KP-cekKataKunci-J3: pemisah ada dan pemisah lain ada: campuran (koma, titik koma pada pemisah koma, garis miring berspasi, garis tegak berspasi)", () => {
    expect(status("a; b, c; d; e")).toContain("pemisah bercampur");
    expect(status("a, b; c, d, e", 5, ",")).toContain("pemisah bercampur");
    expect(status("a; b / c; d; e")).toContain("pemisah bercampur");
    expect(status("a; b | c; d; e")).toContain("pemisah bercampur");
  });
  it("KP-cekKataKunci-J4: pemisah diminta tidak ada, pemisah lain ada: pemisah salah", () => expect(status("a| b| c| d| e")).toContain("pemisah yang dipakai garis tegak"));
  it("KP-cekKataKunci-J5: tanpa pemisah, banyak baris: baris baru; satu baris saja tidak", () => {
    expect(status("a\nb")).toContain("baris baru");
    expect(status("satu\n")).toContain("1 kata kunci: satu");
  });
  it("KP-cekKataKunci-J6: pemisah penutup tunggal diabaikan; dua pemisah penutup membuat butir kosong", () => {
    expect(status("a; b; c; d; e;")).toContain("penutup diabaikan");
    expect(status("a; b; c; d; e;;")).toContain("ada butir kosong");
  });
  it("KP-cekKataKunci-J7/J8/J9: jumlah tepat Lolos, selain itu Gagal dengan batas dilanggar", () => {
    expect(cekKataKunci(dok("a; b"), 2, ";").status).toBe("Lolos");
    const g = cekKataKunci(dok("a; b; c"), 2, ";");
    expect(g.status).toBe("Gagal");
    expect(g.batasDilanggar).toContain("ditemukan 3");
  });
});

describe("cekTabel dan periksaDiagramAlir (cabang)", () => {
  const t = (s: string) => cekTabel({ ...dok(null), teksPerBagian: { B: s } }, "B");
  const g = (s: string) => periksaDiagramAlir({ ...dok(null), teksPerBagian: { B: s } }, "B");
  it("KP-cekTabel-J1..J5: penanda; keterangan; kepala; baris bulan; tidak ada", () => {
    expect(t("[tabel]").angkaPembukti).toContain("penanda tabel");
    expect(t("Tabel 2 Jadwal").angkaPembukti).toContain("keterangan tabel");
    expect(t("No Uraian Bulan").angkaPembukti).toContain("kepala tabel");
    expect(t("1 2 3 4 5 6").angkaPembukti).toContain("nomor bulan");
    expect(t("tidak ada").status).toBe("Gagal");
  });
  it("KP-periksaDiagramAlir-J1..J4: keterangan diagram alir; penanda; keterangan gambar; kalimat 'Gambar berikut'; tidak ada", () => {
    expect(g("Gambar 3: Bagan alir").angkaPembukti).toContain("diagram alir");
    expect(g("[gambar]").angkaPembukti).toContain("penanda gambar");
    expect(g("Gambar 3. Denah").angkaPembukti).toContain("gambar ditemukan");
    expect(g("lihat Gambar 4 berikut").status).toBe("Lolos");
    expect(g("Gambar").status).toBe("Gagal");
  });
});

describe("lepasTandaIsian: penanda templat (cabang)", () => {
  it("KP-lepasTandaIsian-01: '[ ]', '[…]', '[...]', '[Sisipkan ...]', '[1]' sendirian, dan daftar kata kunci contoh bukan isi", () => {
    for (const x of ["[ ]", "[]", "[ … ]", "[...]", "[Sisipkan diagram alir (JPG/PNG)]", "[1]", "[kata kunci 1; kata kunci 2; kata kunci 3]"]) expect(lepasTandaIsian([x])).toEqual([]);
  });
  it("KP-lepasTandaIsian-02: penanda tabel dan gambar tidak dilepas kurung sikunya; isi pengusul tetap", () => {
    expect(lepasTandaIsian(["[tabel]"])).toEqual(["[tabel]"]);
    expect(lepasTandaIsian(["[Isi saya", "[gambar]", "lanjut]"])).toEqual(["Isi saya", "[gambar]", "lanjut"]);
  });
});

describe("buatDokumenTemplat paket (MS-10 cabang baru)", () => {
  const skema = { kode: "PT", namaSkema: "Penelitian Terapan" };
  const bagian = lengkapiBagian(bagianBawaan("terapan").map((b, i) => ({ ...b, urutan: i + 1 })));
  const teks = async (b: Buffer) => (await mammoth.extractRawText({ buffer: b })).value;

  it("KP-buatDokumenTemplat-J10: sakelar bagian depan mematikan bagian; kop khusus dipakai; alamat dan laman kosong dilewati", async () => {
    const kop = { ...KOP_BAWAAN, lembaga: "Lembaga Uji", alamat: "", laman: "", depan: { ...KOP_BAWAAN.depan, anggaran: false, mitra: false } };
    const t = await teks(await buatDokumenTemplat({ versi: 1, status: "Draf" }, bagian, [], skema, null, { kop }));
    expect(t).toContain("Lembaga Uji");
    expect(t).not.toContain("ANGGARAN");
    expect(t).not.toContain("MITRA KERJASAMA");
    expect(t).toContain("5. BIDANG STRATEGIS".replace("5", "4"));
    expect(t).not.toContain(KOP_BAWAAN.alamat);
  });
  it("KP-buatDokumenTemplat-J11: kepala tanpa subjudul dan pengantar: hanya judul; petunjuk kosong tidak dicetak; templat lampiran formulir khusus dicetak", async () => {
    const b2 = bagian.map((b) => (b.nama === "Judul" ? { ...b, petunjuk: "" } : b));
    const t = await teks(
      await buatDokumenTemplat({ versi: 1, status: "Draf" }, b2, ["Surat X", "Berkas Y"], skema, null, {
        kepala: { judulDokumen: "Kepala Uji", subjudul: null, pengantar: null },
        lampiranTemplat: [{ nama: "Surat X", jenis: "formulir", judul: "FORMULIR X", kalimat: ["Isian lain:", "Nama | Alamat", "Kalimat penutup."], kunci: [] }],
      }),
    );
    expect(t).toContain("Kepala Uji");
    expect(t).not.toContain("Tuliskan judul usulan");
    expect(t).toContain("FORMULIR X");
    expect(t).toMatch(/Alamat\s*:\s*\.\.\.\./);
    expect(t).toContain("LAMPIRAN 2. BERKAS Y");
  });
  it("KP-buatDokumenTemplat-J12: daftar berpemisah koma dan 3 butir; daftar pustaka berawalan [1]; bagian bertabel punya tabel Tahun ke-1", async () => {
    const b3 = [
      { urutan: 1, nama: "Kata Kunci", batasKata: null, wajib: true, jenisIsian: "daftar" as const, jumlahButir: 3, pemisah: "," },
      { urutan: 2, nama: "Rencana", batasKata: null, wajib: true, jenisIsian: "tabel" as const },
      { urutan: 3, nama: "Daftar Pustaka", batasKata: null, wajib: true, daftarPustaka: true },
    ];
    const t = await teks(await buatDokumenTemplat({ versi: 1, status: "Draf" }, b3, [], skema, null, { mode: "isian" }));
    expect(t).toContain("[kata kunci 1, kata kunci 2, kata kunci 3]");
    expect(t).toContain("Tahun ke-1");
    expect(t).toContain("[1]");
    const hasil = potongPerBagian(await ekstrakDocx(await buatDokumenTemplat({ versi: 1, status: "Draf" }, b3, [], skema, null, { mode: "isian" })), b3);
    expect(hasil.kataKunci).toBeNull();
  });
  it("KP-namaBerkasTemplat-J1: mode isian memakai awalan Isian-Substansi", () => {
    expect(namaBerkasTemplat({ kode: "PT" }, { versi: 2, status: "Terbit" }, "isian")).toBe("Isian-Substansi-PT-v2-Terbit.docx");
  });
  it("KP-petunjukBagian-J1: petunjuk tersimpan menang; kosong = tidak ada; null = turunan resmi; {batas} diganti", () => {
    expect(petunjukBagian({ nama: "Metode", batasKata: 900, petunjuk: "Maks {batas} kata." })).toBe("Maks 900 kata.");
    expect(petunjukBagian({ nama: "Metode", batasKata: 900, petunjuk: "  " })).toBeNull();
    expect(petunjukBagian({ nama: "Metode", batasKata: 900, petunjuk: null })).toContain("tidak lebih dari 900 kata");
    expect(petunjukBagian({ nama: "Tak dikenal", batasKata: null })).toBeNull();
  });
});
