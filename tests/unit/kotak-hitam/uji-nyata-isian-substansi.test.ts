// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-21 TemplatProposal.potongPerBagian, C-16 ButirCek.hitungKata,
// C-17 ButirCek.cekKataKunci, C-23 VersiProposal.siapkanTeksTanpaIdentitas, C-31 TemplatProposal.buatDokumenTemplat; CRC TemplatProposal dan VersiProposal.
//
// Bahan uji: empat PDF contoh proposal BIMA asli di data/uji-nyata/ (HANYA lokal: masuk .gitignore, tidak di-commit, tidak di-seed ke basis data
// atau Blob). Bila berkas tidak ada (mis. di CI atau klon baru), seluruh berkas uji ini dilewati (it.skipIf / describe.skipIf).
// Nama dan isi proposal asli sengaja tidak ditulis di berkas ini: identitas ketua dibaca dari PDF saat uji berjalan.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import type { BagianTemplatDto, DokumenPeriksa } from "@/lib/kontrak/tipe";
import { cekKataKunci, periksaBatasKata } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { hitungKata, normalisasiJudul } from "@/lib/pemeriksa/deterministik/teks";
import { siapkanTeksTanpaIdentitas } from "@/lib/pemeriksa/semantik/teks";
import { ekstrakPdf, ekstrakTeksPdf } from "@/lib/pengajuan/ekstraksi";
import { potongPerBagian, type HasilPotong } from "@/lib/pengajuan/potong";
import { bagianBawaan, judulBerhuruf, lengkapiBagian, petunjukResmi } from "@/lib/templat/isian-substansi";

const DIR = path.join(process.cwd(), "data", "uji-nyata");

interface Berkas {
  nama: string;
  skema: "dasar" | "terapan";
  /** ekspor BIMA lengkap (sampul, identitas pengusul, anggaran sebelum Isian Substansi) */
  eksporBima: boolean;
  /** pemisah kata kunci yang dipakai berkas (PDF 5 memakai koma, menyimpang dari petunjuk titik koma) */
  pemisahKataKunci: ";" | ",";
}

const BERKAS: Berkas[] = [
  { nama: "1. Contoh Proposal Soshum.pdf", skema: "dasar", eksporBima: false, pemisahKataKunci: ";" },
  { nama: "5. Contoh Proposal Soshum.pdf", skema: "terapan", eksporBima: false, pemisahKataKunci: "," },
  { nama: "6. Contoh Proposal.pdf", skema: "dasar", eksporBima: true, pemisahKataKunci: ";" },
  { nama: "10. Contoh Proposal.pdf", skema: "dasar", eksporBima: true, pemisahKataKunci: ";" },
];

const semuaAda = BERKAS.every((b) => existsSync(path.join(DIR, b.nama)));

interface Hasil {
  berkas: Berkas;
  bagian: BagianTemplatDto[];
  potong: HasilPotong;
  teksPenuh: string;
}

const hasil = new Map<string, Hasil>();

describe.skipIf(!semuaAda)("PDF contoh proposal BIMA asli (data/uji-nyata, hanya lokal)", () => {
  beforeAll(async () => {
    for (const b of BERKAS) {
      const bytes = readFileSync(path.join(DIR, b.nama));
      const bagian = lengkapiBagian(bagianBawaan(b.skema).map((x, i) => ({ ...x, urutan: i + 1 })));
      hasil.set(b.nama, { berkas: b, bagian, potong: potongPerBagian(await ekstrakPdf(bytes), bagian), teksPenuh: await ekstrakTeksPdf(new Uint8Array(bytes)) });
    }
  }, 60_000); // empat PDF asli beserta gambarnya (dikecilkan sharp)

  for (const b of BERKAS) {
    describe(b.nama.replace(/\.pdf$/, ""), () => {
      const h = () => hasil.get(b.nama)!;
      const dokumen = (): DokumenPeriksa => ({
        judul: h().potong.judulDokumen,
        judulBima: h().potong.judulDokumen,
        teksPerBagian: h().potong.teksPerBagian,
        kataKunci: h().potong.kataKunci,
        lampiranAda: [],
        teksLampiran: {},
        judulBagianDitemukan: h().potong.judulBagianDitemukan,
      });

      it("KH-ujiNyata-01 (C-21): bagian A sampai H terpotong, berurutan, dan semuanya berisi", () => {
        const { potong, bagian } = h();
        expect(potong.judulBagianDitemukan).toEqual(bagian.map((x, i) => judulBerhuruf(i, x.nama)));
        expect(Object.keys(potong.teksPerBagian)).toEqual(bagian.map((x) => x.nama));
        for (const x of bagian) expect(hitungKata(potong.teksPerBagian[x.nama]), x.nama).toBeGreaterThan(0);
        expect(potong.judulDokumen.length).toBeGreaterThan(10);
        expect(potong.judulDokumen).toBe(potong.teksPerBagian["Judul"].replace(/\n/g, " "));
      });

      it("KH-ujiNyata-02 (C-21, C-16): sampul, identitas, anggaran, dan lampiran ekspor BIMA tidak ikut; tanda [ ] dan kalimat petunjuk dibuang", () => {
        const { potong, bagian } = h();
        const semua = Object.values(potong.teksPerBagian).join("\n");
        expect(semua).not.toMatch(/PROTEKSI ISI PROPOSAL|NO\. DOKUMEN|IDENTITAS PENGUSUL|Rencana Anggaran Biaya penelitian mengacu|PERSETUJUAN PENGUSUL|SURAT PERNYATAAN|Komponen Administrasi/);
        for (const x of bagian) {
          const teks = potong.teksPerBagian[x.nama];
          const petunjuk = petunjukResmi(x.nama, x.batasKata)!;
          // lima kata pertama petunjuk tidak boleh menjadi awal isian
          expect(normalisasiJudul(teks.slice(0, 40)), x.nama).not.toBe(normalisasiJudul(petunjuk.slice(0, 40)));
          expect(teks.startsWith("[") && !/^\[\d+\]/.test(teks), x.nama).toBe(false); // "[1] ..." adalah nomor pustaka, bukan tanda isian
          // bagian boleh berakhir dengan nomor pustaka "[12]" atau penanda gambar "[gambar 1]" (gambar tanpa keterangan di akhir bagian)
          expect(teks.trimEnd().endsWith("]") && !/\[(?:\d+|gambar(?:\s+\d+)?)\]$/.test(teks.trimEnd()), x.nama).toBe(false);
        }
      });

      it("KH-ujiNyata-03 (C-16): kata per bagian sesudah petunjuk dibuang tidak melebihi batas Isian Substansi", () => {
        const { bagian } = h();
        for (const x of bagian.filter((y) => y.batasKata != null)) {
          const hasilBatas = periksaBatasKata(dokumen(), x.nama, x.batasKata!);
          expect(hasilBatas.status, `${x.nama}: ${hasilBatas.angkaPembukti}`).toBe("Lolos");
        }
        const batas = Object.fromEntries(bagian.map((x) => [x.nama, x.batasKata]));
        expect(batas["Judul"]).toBe(20);
        expect(batas["Ringkasan"]).toBe(300);
        expect(batas["Pendahuluan"]).toBe(b.skema === "dasar" ? 1000 : 1500);
        expect(batas["Metode"]).toBe(1000);
      });

      it("KH-ujiNyata-04 (C-17, C-21): kata kunci tepat lima; PDF 5 memakai koma (menyimpang dari petunjuk titik koma)", () => {
        const { potong } = h();
        expect(potong.kataKunci).not.toBeNull();
        const lima = potong.kataKunci!
          .split(b.pemisahKataKunci)
          .map((x) => x.trim())
          .filter(Boolean);
        expect(lima).toHaveLength(5);
        const hasilCek = cekKataKunci(dokumen(), 5, ";");
        if (b.pemisahKataKunci === ";") expect(hasilCek.status).toBe("Lolos");
        else expect(hasilCek.status).toBe("Gagal"); // penyimpangan berkas contoh, bukan galat pemotong
      });

      it("KH-ujiNyata-05 (C-23): teks untuk LLM tidak memuat identitas pengusul ekspor BIMA", () => {
        const { teksPenuh, potong } = h();
        const baris = teksPenuh.split(/\r?\n/).map((x) => x.trim());
        if (!b.eksporBima) {
          // berkas Isian Substansi tanpa halaman identitas: tidak ada yang dibuang selain nama yang diberikan
          const bersih = siapkanTeksTanpaIdentitas(teksPenuh, {});
          expect(bersih).toBe(teksPenuh);
          return;
        }
        const i = baris.indexOf("Ketua Pengusul");
        expect(i, "baris Ketua Pengusul").toBeGreaterThan(2);
        const nomorInduk = baris[i - 1];
        const nama = baris[i - 2];
        const institusi = baris[i + 1];
        expect(nomorInduk).toMatch(/^\d{10,}$/);
        // semua nomor panjang (NIDN/NIM/NIK) di blok identitas, milik ketua maupun anggota
        const blokId = baris.slice(baris.findIndex((x) => /^2\.\s*IDENTITAS PENGUSUL/i.test(x)), baris.findIndex((x) => /^3\.\s*MITRA/i.test(x)));
        const nomorBlok = blokId.filter((x) => /^\d{10,}$/.test(x));
        expect(nomorBlok.length).toBeGreaterThanOrEqual(2);

        const bersih = siapkanTeksTanpaIdentitas(teksPenuh, { nama, institusi, nomorInduk });
        expect(bersih).not.toMatch(/IDENTITAS PENGUSUL|NO\. DOKUMEN/i);
        expect(bersih.toLowerCase()).not.toContain(nama.toLowerCase());
        expect(bersih.toLowerCase()).not.toContain(institusi.toLowerCase());
        for (const n of nomorBlok) expect(bersih).not.toContain(n);
        expect(bersih).toContain("[identitas dihapus]");
        // Isian Substansi tetap utuh: judul dan bagian pustaka masih ada
        expect(bersih).toContain("A. JUDUL");
        expect(bersih).toContain("H. DAFTAR PUSTAKA");
        // bagian hasil pemotongan juga tidak memuat identitas ketua
        for (const teks of Object.values(potong.teksPerBagian)) {
          expect(siapkanTeksTanpaIdentitas(teks, { nama, institusi, nomorInduk }).toLowerCase()).not.toContain(nama.toLowerCase());
        }
      });
    });
  }
});

describe("it.skipIf: berkas uji nyata", () => {
  it.skipIf(semuaAda)("KH-ujiNyata-00: bila data/uji-nyata tidak ada, uji PDF asli dilewati (bukan gagal)", () => {
    expect(semuaAda).toBe(false);
  });
});
