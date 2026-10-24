// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-17 cekKataKunci, C-03 turunkanButirCek (butir per ketentuan bagian), C-21 potongPerBagian.
// Bahan uji: empat PDF contoh proposal BIMA asli di data/uji-nyata/ (HANYA lokal, .gitignore; dilewati bila tidak ada). Nama dan isi proposal asli tidak ditulis di sini.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ButirCek, DokumenPeriksa, KonteksPeriksa } from "@/lib/kontrak/tipe";
import { cekKataKunci, cekTabel, periksaBagianTerisi, periksaDiagramAlir } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { periksaDeterministikTeks } from "@/lib/pemeriksa/deterministik";
import { ekstrakPdf } from "@/lib/pengajuan/ekstraksi";
import { potongPerBagian } from "@/lib/pengajuan/potong";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import { bagianBawaan, lengkapiBagian } from "@/lib/templat/isian-substansi";

const DIR = path.join(process.cwd(), "data", "uji-nyata");
const BERKAS = [
  { nama: "1. Contoh Proposal Soshum.pdf", skema: "dasar", kataKunci: "Lolos" },
  { nama: "5. Contoh Proposal Soshum.pdf", skema: "terapan", kataKunci: "Gagal" },
  { nama: "6. Contoh Proposal.pdf", skema: "dasar", kataKunci: "Lolos" },
  { nama: "10. Contoh Proposal.pdf", skema: "dasar", kataKunci: "Lolos" },
] as const;

describe.skipIf(!BERKAS.every((b) => existsSync(path.join(DIR, b.nama))))("ketentuan per bagian pada PDF asli (data/uji-nyata, hanya lokal)", () => {
  for (const b of BERKAS) {
    describe(b.nama.replace(/\.pdf$/, ""), () => {
      const muat = async () => {
        const bagian = lengkapiBagian(bagianBawaan(b.skema).map((x, i) => ({ ...x, urutan: i + 1 })));
        const potong = potongPerBagian(await ekstrakPdf(readFileSync(path.join(DIR, b.nama))), bagian);
        const dokumen: DokumenPeriksa = {
          judul: potong.judulDokumen,
          judulBima: potong.judulDokumen,
          teksPerBagian: potong.teksPerBagian,
          kataKunci: potong.kataKunci,
          lampiranAda: [],
          teksLampiran: {},
          judulBagianDitemukan: potong.judulBagianDitemukan,
        };
        return { bagian, dokumen };
      };

      it(`KH-ujiNyata-06 (C-17): cekKataKunci = ${b.kataKunci}; angka pembukti menyebut butir yang terbaca`, async () => {
        const { dokumen } = await muat();
        const h = cekKataKunci(dokumen, 5, ";");
        expect(h.status).toBe(b.kataKunci);
        if (b.nama.startsWith("5.")) {
          expect(h.angkaPembukti).toContain("pemisah yang dipakai koma (,), bukan titik koma (;)");
          expect(h.angkaPembukti).toContain("5 kata kunci terbaca dengan koma: Aksesibilitas | Prototype | Antarmuka | Sumber daya elektronik | Perpustakaan");
        } else {
          expect(h.angkaPembukti).toMatch(/^5 kata kunci: .* \(pemisah ;\)/);
        }
        if (b.nama.startsWith("1.")) expect(h.angkaPembukti).toContain("Spatial Quantitative"); // frasa terpotong baris tersambung
        if (b.nama.startsWith("10.")) expect(h.angkaPembukti).toContain("titik koma penutup diabaikan");
      });

      it("KH-ujiNyata-07 (C-03): butir turunan ketentuan (tabel jadwal, gambar Metode, bagian terisi) lolos pada contoh asli (kecuali no. 5: kata kunci koma dan gambar tanpa keterangan)", async () => {
        const { bagian, dokumen } = await muat();
        expect(cekTabel(dokumen, "Jadwal Penelitian").status).toBe("Lolos");
        expect(periksaBagianTerisi(dokumen, "Jadwal Penelitian").status).toBe("Lolos");
        // PDF no. 5 hanya memuat gambar tanpa keterangan di teks hasil ekstraksi: tidak terdeteksi (batas pemeriksa berbasis teks)
        expect(periksaDiagramAlir(dokumen, "Metode").status).toBe(b.nama.startsWith("5.") ? "Gagal" : "Lolos");
        const butir: ButirCek[] = turunkanButirDariTemplat(bagian).map((x, i) => ({ ...x, id: `b${i}`, pertanyaan: null, contohJawaban: null, status: "Aktif" }));
        const konteks: KonteksPeriksa = { bagianTemplat: bagian };
        const gagal = periksaDeterministikTeks(dokumen, butir, konteks).filter((h) => h.status === "Gagal").map((h) => h.kode);
        // satu-satunya kegagalan yang sah: kata kunci pada contoh no. 5 (koma)
        // butir sitasi (SIT-nn) tidak dibandingkan: ketidakrapian sitasi pada contoh asli dibahas terpisah (catatan-inkonsistensi 29)
        expect(gagal.filter((k) => !k.startsWith("SIT-"))).toEqual(b.nama.startsWith("5.") ? ["KAT-01", "GBR-01"] : []);
      });
    });
  }
});
