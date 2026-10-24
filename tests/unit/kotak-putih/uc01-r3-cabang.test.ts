// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-13 cekKataKunci [J10-J11 bagian daftar lain], cekTabel [J6-J9 kolom wajib],
// periksaFrasa [J1-J2], periksaBatasMin [J1-J3], periksaDiagramAlir [J5-J6 keterangan khusus], turunkanButirCek [J10-J16 ketentuan baru],
// susunPetunjuk [J1-J9], buatDokumenTemplat MS-10 [J15-J17 tabel menurut kolom wajib].
import mammoth from "mammoth";
import { describe, expect, it } from "vitest";
import type { DokumenPeriksa } from "@/lib/kontrak/tipe";
import { cekKataKunci, cekTabel, periksaBatasMin, periksaDiagramAlir, periksaFrasa, periksaSatuButir } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { turunkanButirDariTemplat as turunkan } from "@/lib/seed-butir";
import { buatDokumenTemplat } from "@/lib/templat/dokumen";
import { lengkapiBagian, susunPetunjuk } from "@/lib/templat/isian-substansi";

const dok = (teks: Record<string, string>, kataKunci: string | null = null): DokumenPeriksa => ({ judul: "", judulBima: "", teksPerBagian: teks, kataKunci, lampiranAda: [], teksLampiran: {}, judulBagianDitemukan: [] });
const sp = (o: Record<string, unknown>) => susunPetunjuk({ nama: "Bagian", batasKata: null, ...o } as Parameters<typeof susunPetunjuk>[0]);

describe("cekKataKunci bagian daftar (MS-13)", () => {
  it("KP-cekKataKunci-J10: bagian bernama Kata Kunci membaca isian kata kunci dokumen, bukan teks bagian", () => {
    expect(cekKataKunci(dok({ "Kata Kunci": "x; y" }, "a; b; c"), 3, ";", "Kata Kunci").status).toBe("Lolos");
    expect(cekKataKunci(dok({ "Kata Kunci": "a; b; c" }, null), 3, ";", "Kata Kunci").status).toBe("Gagal");
  });
  it("KP-cekKataKunci-J11: bagian lain membaca teks bagian dan memakai sebutan butir, termasuk pada jalur baris baru dan butir kosong", () => {
    expect(cekKataKunci(dok({ Bidang: "a\nb" }), 3, ";", "Bidang").angkaPembukti).toContain("2 butir terbaca dengan baris baru");
    expect(cekKataKunci(dok({ Bidang: "a;; b; c" }), 3, ";", "Bidang").angkaPembukti).toContain("ada butir kosong");
    expect(cekKataKunci(dok({ Bidang: "a; b" }), 3, ";", "Bidang").batasDilanggar).toContain('Daftar "Bidang" harus tepat 3 butir');
  });
});

describe("cekTabel kolom wajib (J6-J9)", () => {
  const kolom = ["No", "Nama Kegiatan", "Bulan 1–12"];
  it("KP-cekTabel-J6: tanpa bukti tabel Gagal walau kolom diminta", () => expect(cekTabel(dok({ J: "isi biasa" }), "J", kolom).status).toBe("Gagal"));
  it("KP-cekTabel-J7: kolom kosong atau tidak diminta cukup bukti tabel", () => {
    expect(cekTabel(dok({ J: "[tabel]" }), "J", []).angkaPembukti).toBe("tabel ditemukan (penanda tabel dari berkas)");
    expect(cekTabel(dok({ J: "[tabel]" }), "J").status).toBe("Lolos");
  });
  it("KP-cekTabel-J8: hanya penanda DOCX dan tak satu pun kolom terbaca: Lolos dengan catatan belum diperiksa; sebagian terbaca: Gagal", () => {
    expect(cekTabel(dok({ J: "[tabel]" }), "J", kolom).angkaPembukti).toContain("3 kolom wajib");
    expect(cekTabel(dok({ J: "[tabel]\nNo\nKegiatan lain" }), "J", kolom).status).toBe("Gagal");
  });
  it("KP-cekTabel-J9: kolom terbaca lengkap Lolos; 'Bulan 1–12' cukup dengan kata bulan", () => {
    const h = cekTabel(dok({ J: "Tahun ke-1\nNo Nama Kegiatan Bulan\n1 2 3 4 5 6 7 8 9 10 11 12" }), "J", kolom);
    expect(h.status).toBe("Lolos");
    expect(h.angkaPembukti).toContain("3 dari 3 kolom wajib ada");
  });
});

describe("periksaFrasa dan periksaBatasMin", () => {
  it("KP-periksaFrasa-J1/J2: ada dan tidak ada; frasa panjang dipotong di angka pembukti", () => {
    expect(periksaFrasa(dok({ B: "Saya  setuju dengan SEMUA ketentuan" }), "B", "setuju dengan semua ketentuan").status).toBe("Lolos");
    const panjang = "kalimat ".repeat(12).trim();
    expect(periksaFrasa(dok({ B: "lain" }), "B", panjang).angkaPembukti).toContain("...");
  });
  it("KP-periksaBatasMin-J1/J2/J3: cukup, kurang, bagian tidak ditemukan dicatat", () => {
    expect(periksaBatasMin(dok({ B: "a b c" }), "B", 3).angkaPembukti).toBe("3 kata dari minimal 3");
    expect(periksaBatasMin(dok({ B: "a b c" }), "B", 5).status).toBe("Gagal");
    expect(periksaBatasMin(dok({}), "Tidak Ada", 0).angkaPembukti).toContain("bagian tidak ditemukan");
  });
});

describe("periksaDiagramAlir keterangan khusus", () => {
  it("KP-periksaDiagramAlir-J5: keterangan khusus dicari pada baris keterangan gambar; keterangan 'diagram alir' memakai pola bawaan", () => {
    expect(periksaDiagramAlir(dok({ B: "Gambar 2. Denah lokasi uji" }), "B", "denah lokasi").angkaPembukti).toContain("keterangan gambar denah lokasi ditemukan");
    expect(periksaDiagramAlir(dok({ B: "Gambar 2. Bagan alir riset" }), "B", "diagram alir penelitian").angkaPembukti).toContain("keterangan gambar diagram alir penelitian ditemukan");
  });
  it("KP-periksaDiagramAlir-J6: keterangan tidak cocok tetapi ada gambar lain tetap Lolos sebagai gambar; tanpa gambar Gagal", () => {
    expect(periksaDiagramAlir(dok({ B: "Gambar 2. Lainnya" }), "B", "denah lokasi").angkaPembukti).toContain("gambar ditemukan");
    expect(periksaDiagramAlir(dok({ B: "teks" }), "B", "denah lokasi").status).toBe("Gagal");
  });
});

describe("pengarah periksaSatuButir untuk tipe baru", () => {
  const butir = (parameter: unknown) => ({ id: "b", kode: "X", deskripsi: "", jenis: "deterministik" as const, asal: "templat" as const, komponen: null, pemeriksa: null, parameter, aturanHitung: null, pertanyaan: null, contohJawaban: null, status: "Aktif" as const }) as Parameters<typeof periksaSatuButir>[0];
  const konteks = { bagianTemplat: [], lampiranWajib: [] };
  it("KP-periksaSatuButir-J10: batas_kata_min, frasa_wajib, kata_kunci berbagian, tabel_wajib berkolom, diagram_alir berketerangan", () => {
    const d = dok({ B: "satu dua tiga", Bid: "a; b", J: "[tabel]" });
    expect(periksaSatuButir(butir({ tipe: "batas_kata_min", bagian: "B", batas: 3 }), d, konteks).status).toBe("Lolos");
    expect(periksaSatuButir(butir({ tipe: "frasa_wajib", bagian: "B", frasa: "dua tiga" }), d, konteks).status).toBe("Lolos");
    expect(periksaSatuButir(butir({ tipe: "kata_kunci", jumlah: 2, pemisah: ";", bagian: "Bid" }), d, konteks).status).toBe("Lolos");
    expect(periksaSatuButir(butir({ tipe: "tabel_wajib", bagian: "J", kolom: ["No"] }), d, konteks).status).toBe("Lolos");
    expect(periksaSatuButir(butir({ tipe: "diagram_alir", bagian: "B", keterangan: "denah" }), d, konteks).status).toBe("Gagal");
  });
});

describe("susunPetunjuk (cabang)", () => {
  it("KP-susunPetunjuk-J1: daftar pustaka memakai kalimat resmi", () => expect(sp({ jenisIsian: "daftar_pustaka" })).toContain("sistem nomor sesuai dengan urutan pengutipan"));
  it("KP-susunPetunjuk-J2: daftar memuat jumlah dan nama pemisah; pemisah tak dikenal dikutip", () => {
    expect(sp({ nama: "Bidang", jenisIsian: "daftar", jumlahButir: 4, pemisah: "," })).toBe("Isian 4 butir bidang yang dipisahkan dengan tanda koma (,).");
    expect(sp({ nama: "Bidang", jenisIsian: "daftar", jumlahButir: 4, pemisah: "#" })).toContain('"#"');
  });
  it("KP-susunPetunjuk-J3: tabel dengan kolom dan judul blok; tabel tanpa kolom", () => {
    expect(sp({ jenisIsian: "tabel", kolomTabel: ["No", "Uraian", "Biaya"], judulTabel: "Tahap 1" })).toBe('Isian berupa tabel dengan kolom No, Uraian, dan Biaya, diberi judul blok "Tahap 1".');
    expect(sp({ jenisIsian: "tabel" })).toBe("Isian berupa tabel.");
  });
  it("KP-susunPetunjuk-J4..J6: teks dengan minimal saja, maksimal saja, keduanya, dan tanpa batas", () => {
    expect(sp({ batasMin: 50 })).toBe("Isian bagian sekurang-kurangnya 50 kata.");
    expect(sp({ batasKata: 80 })).toBe("Isian bagian tidak lebih dari {batas} kata.");
    expect(sp({ batasMin: 50, batasKata: 80 })).toBe("Isian bagian sebanyak 50 sampai {batas} kata.");
    expect(sp({})).toBe("Isian bagian.");
  });
  it("KP-susunPetunjuk-J7..J9: unsur pada daftar/tabel, tabel wajib berkolom, nama kosong, tiga unsur memakai koma dan 'dan'", () => {
    expect(sp({ jenisIsian: "daftar", jumlahButir: 2, pemisah: ";", unsurIsi: [{ unsur: "a" }] })).toContain("Isian memuat a");
    expect(sp({ wajibTabel: true, kolomTabel: ["A", "B"] })).toContain("tabel yang berkolom A dan B");
    expect(sp({ nama: " ", unsurIsi: [{ unsur: "x" }, { unsur: "y" }, { unsur: "z" }] })).toBe("Isian bagian ini yang memuat x, y, dan z.");
  });
});

describe("lengkapiBagian dan tabel docx (cabang)", () => {
  it("KP-lengkapiBagian-J10: baris lama bernama Jadwal Penelitian mewarisi kolom dan judul bawaan; baris bertipe jelas tanpa kolom tidak", () => {
    const l = lengkapiBagian([
      { urutan: 1, nama: "Jadwal Penelitian", batasKata: null, wajib: true },
      { urutan: 2, nama: "Rencana", batasKata: null, wajib: true, jenisIsian: "tabel" },
    ]);
    expect(l[0].kolomTabel).toEqual(["No", "Nama Kegiatan", "Bulan 1–12"]);
    expect(l[0].judulTabel).toBe("Tahun ke-1");
    expect(l[1].kolomTabel).toBeNull();
  });
  const skema = { kode: "PD", namaSkema: "Penelitian Dasar" };
  const teks = async (b: Buffer) => (await mammoth.extractRawText({ buffer: b })).value;
  it("KP-buatDokumenTemplat-J15: tabel tanpa kolom bulan dan tanpa kolom No dibagi rata; judul blok tampil; tanpa judul tidak ada baris judul", async () => {
    const b = lengkapiBagian([{ urutan: 1, nama: "Rincian", batasKata: null, wajib: true, jenisIsian: "tabel", kolomTabel: ["Kode", "Item", "Biaya"], judulTabel: "Tahap 1" }]);
    const t = await teks(await buatDokumenTemplat({ versi: 1, status: "Draf" }, b, [], skema, null, { mode: "isian" }));
    expect(t).toContain("Tahap 1");
    expect(t).toMatch(/Kode\s+Item\s+Biaya/);
    const tanpa = await teks(await buatDokumenTemplat({ versi: 1, status: "Draf" }, lengkapiBagian([{ ...b[0], judulTabel: null }]), [], skema, null, { mode: "isian" }));
    expect(tanpa).not.toContain("Tahap 1");
  });
  it("KP-buatDokumenTemplat-J16: kolom bulan memperluas dua belas nomor bulan; kolom No diberi nomor baris", async () => {
    const b = lengkapiBagian([{ urutan: 1, nama: "Jadwal", batasKata: null, wajib: true, jenisIsian: "tabel", kolomTabel: ["No", "Kegiatan", "Bulan 1–12"] }]);
    const t = await teks(await buatDokumenTemplat({ versi: 1, status: "Draf" }, b, [], skema, null, { mode: "isian" }));
    expect(t).toMatch(/1\s+2\s+3\s+4\s+5\s+6\s+7\s+8\s+9\s+10\s+11\s+12/);
    expect(t).toContain("Bulan");
  });
  it("KP-buatDokumenTemplat-J17: bagian teks dengan tabel wajib mencetak [Sisipkan tabel]", async () => {
    const b = lengkapiBagian([{ urutan: 1, nama: "Anggaran", batasKata: 100, wajib: true, wajibTabel: true, kolomTabel: ["Item", "Biaya"] }]);
    const t = await teks(await buatDokumenTemplat({ versi: 1, status: "Draf" }, b, [], skema, null, { mode: "isian" }));
    expect(t).toContain("[Sisipkan tabel]");
  });
});

describe("turunkanButirCek: cabang ketentuan baru", () => {
  it("KP-turunkanButirCek-J10: gambar tanpa keterangan memakai 'diagram alir penelitian'; tabel tanpa kolom; penomoran terpisah per awalan lintas bagian", () => {
    const t = turunkan(
      [
        { nama: "A", batasKata: 10, wajib: true, wajibGambar: true, unsurIsi: [{ unsur: "x" }] },
        { nama: "B", batasKata: 20, batasMin: 5, wajib: true, unsurIsi: [{ unsur: "y" }], frasaWajib: ["f"] },
      ],
      [],
    );
    expect(t.map((x) => x.kode)).toEqual(["BGN-01", "KTA-01", "GBR-01", "UNS-01", "UNS-02", "BGN-02", "KTA-02", "KTM-01", "FRS-01", "UNS-03"]);
    expect(t.find((x) => x.kode === "GBR-01")?.parameter).toEqual({ tipe: "diagram_alir", bagian: "A", keterangan: "diagram alir penelitian" });
  });
});
