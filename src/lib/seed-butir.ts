/**
 * Penurunan butir cek dari templat (turunkanButirCek pada UC-01; dipakai juga seed). Skema parameter sama dengan ParameterButir di kontrak.
 * Butir diturunkan dari KETENTUAN per bagian (UC-01 M-12), bukan hanya batas kata:
 *  - wajib          -> BGN-nn   bagian terisi          (periksaBagianTerisi)
 *  - batas kata     -> KTA-nn   hitungKata
 *  - jenis daftar   -> KAT-nn   cekKataKunci           ("Kata kunci tepat 5, dipisahkan titik koma (;)")
 *  - wajib gambar   -> GBR-nn   periksaDiagramAlir
 *  - jenis tabel    -> TBL-nn   cekTabel
 *  - sitasi bernomor -> SIT-01 dan daftar pustaka -> SIT-02, SIT-03   cocokkanSitasi
 *  - lampiran wajib -> LMP-nn   cekLampiran; lampiran berformulir -> FMT-nn cekLampiran (kalimat kunci templat)
 * Penomoran nn dua digit terpisah per awalan, mengikuti urutan bagian.
 */
import type { BagianTemplatDto, ParameterButir } from "./kontrak/tipe";
import type { LampiranTemplat } from "./templat/paket";
import { formatAngka } from "@/lib/utils";

export type BagianSeed = Pick<BagianTemplatDto, "nama" | "batasKata" | "wajib"> &
  Partial<Pick<BagianTemplatDto, "jenisIsian" | "jumlahButir" | "pemisah" | "wajibGambar" | "sitasiBernomor" | "daftarPustaka">>;

export interface ButirSeed {
  kode: string;
  deskripsi: string;
  jenis: "deterministik";
  asal: "templat";
  komponen: string;
  pemeriksa: string;
  parameter: ParameterButir;
  aturanHitung: string;
}

const NAMA_PEMISAH: Record<string, string> = { ";": "titik koma", ",": "koma", "|": "garis tegak", "/": "garis miring" };
const nn = (n: number) => String(n).padStart(2, "0");

export function turunkanButirDariTemplat(bagian: BagianSeed[], lampiranWajib: string[], lampiranTemplat: LampiranTemplat[] = []): ButirSeed[] {
  const hasil: ButirSeed[] = [];
  const n = { BGN: 0, KTA: 0, KAT: 0, GBR: 0, TBL: 0 };
  const dasar = { jenis: "deterministik", asal: "templat" } as const;
  for (const x of bagian) {
    if (x.wajib) {
      hasil.push({
        ...dasar,
        kode: `BGN-${nn(++n.BGN)}`,
        deskripsi: `Bagian wajib "${x.nama}" terisi di naskah`,
        komponen: "Screening",
        pemeriksa: "periksaBagianTerisi",
        parameter: { tipe: "bagian_terisi", bagian: x.nama },
        aturanHitung: `Judul bagian "${x.nama}" ditemukan di naskah dan isinya lebih dari 0 kata.`,
      });
    }
    if (x.batasKata != null) {
      hasil.push({
        ...dasar,
        kode: `KTA-${nn(++n.KTA)}`,
        deskripsi: `Bagian “${x.nama}” tidak melebihi ${formatAngka(x.batasKata)} kata`,
        komponen: "2. Jumlah kata per bagian",
        pemeriksa: "hitungKata",
        parameter: { tipe: "batas_kata", bagian: x.nama, batas: x.batasKata },
        aturanHitung: `Jumlah kata bagian "${x.nama}" <= ${x.batasKata}; tanpa toleransi; kalimat petunjuk templat, diagram, tabel, dan gambar tidak dihitung.`,
      });
    }
    if (x.jenisIsian === "daftar" && x.jumlahButir != null && x.jumlahButir >= 1 && x.pemisah) {
      const nama = NAMA_PEMISAH[x.pemisah] ?? `"${x.pemisah}"`;
      hasil.push({
        ...dasar,
        kode: `KAT-${nn(++n.KAT)}`,
        deskripsi: `Kata kunci tepat ${x.jumlahButir}, dipisahkan ${nama} (${x.pemisah})`,
        komponen: "2. Jumlah kata per bagian",
        pemeriksa: "cekKataKunci",
        parameter: { tipe: "kata_kunci", jumlah: x.jumlahButir, pemisah: x.pemisah },
        aturanHitung: `Isian bagian "${x.nama}" berupa daftar tepat ${x.jumlahButir} butir yang dipisahkan ${nama} (${x.pemisah}); butir boleh berupa frasa, tidak boleh kosong, dan pemisah tidak boleh bercampur.`,
      });
    }
    if (x.wajibGambar) {
      hasil.push({
        ...dasar,
        kode: `GBR-${nn(++n.GBR)}`,
        deskripsi: `Bagian “${x.nama}” memuat gambar (diagram alir penelitian)`,
        komponen: "1. Kesesuaian isi per bagian",
        pemeriksa: "periksaDiagramAlir",
        parameter: { tipe: "diagram_alir", bagian: x.nama },
        aturanHitung: `Bagian "${x.nama}" memuat keterangan gambar yang menyebut diagram alir.`,
      });
    }
    if (x.jenisIsian === "tabel") {
      hasil.push({
        ...dasar,
        kode: `TBL-${nn(++n.TBL)}`,
        deskripsi: `Bagian “${x.nama}” memuat tabel`,
        komponen: "1. Kesesuaian isi per bagian",
        pemeriksa: "cekTabel",
        parameter: { tipe: "tabel_wajib", bagian: x.nama },
        aturanHitung: `Bagian "${x.nama}" memuat tabel (penanda tabel, keterangan "Tabel n", atau baris berkolom No, kegiatan, dan bulan).`,
      });
    }
  }

  const pustaka = bagian.find((b) => b.daftarPustaka)?.nama;
  const komponenSitasi = "3. Sitasi dan daftar pustaka";
  if (bagian.some((b) => b.sitasiBernomor)) {
    hasil.push({
      ...dasar,
      kode: "SIT-01",
      deskripsi: "Sitasi dalam paragraf memakai penomoran [n]",
      komponen: komponenSitasi,
      pemeriksa: "cocokkanSitasi",
      parameter: { tipe: "sitasi_bernomor", ...(pustaka ? { pustaka } : {}) },
      aturanHitung: "Sitasi dalam paragraf bernomor [n]; tidak ada sitasi gaya nama-tahun.",
    });
  }
  if (pustaka) {
    hasil.push(
      {
        ...dasar,
        kode: "SIT-02",
        deskripsi: `Daftar pustaka ("${pustaka}") bernomor dan berurutan sesuai urutan pengutipan pertama`,
        komponen: komponenSitasi,
        pemeriksa: "cocokkanSitasi",
        parameter: { tipe: "pustaka_berurutan", pustaka },
        aturanHitung: `Entri "${pustaka}" bernomor 1, 2, 3, ...; nomor pertama kali dikutip berurutan tanpa melompat.`,
      },
      {
        ...dasar,
        kode: "SIT-03",
        deskripsi: "Setiap sitasi [n] ada di daftar pustaka dan setiap pustaka disitasi",
        komponen: komponenSitasi,
        pemeriksa: "cocokkanSitasi",
        parameter: { tipe: "jumlah_referensi_sama", pustaka },
        aturanHitung: `Nomor yang dikutip di naskah sama persis dengan nomor entri "${pustaka}": jumlah sama, tidak ada nomor tanpa entri, tidak ada entri tanpa kutipan.`,
      },
    );
  }

  let f = 0;
  lampiranWajib.forEach((nama, i) => {
    hasil.push({
      ...dasar,
      kode: `LMP-${nn(i + 1)}`,
      deskripsi: `Lampiran "${nama}" dilampirkan`,
      komponen: "Lampiran",
      pemeriksa: "cekLampiran",
      parameter: { tipe: "lampiran_wajib", nama },
      aturanHitung: `Berkas lampiran "${nama}" ada pada pengajuan.`,
    });
  });
  // lampiran berformulir: kesesuaian format = kalimat kunci templat ada di berkas
  for (const l of lampiranTemplat) {
    if (l.jenis !== "formulir" || l.kunci.length === 0 || !lampiranWajib.some((w) => w.trim().toLowerCase() === l.nama.trim().toLowerCase())) continue;
    hasil.push({
      ...dasar,
      kode: `FMT-${nn(++f)}`,
      deskripsi: `Lampiran "${l.nama}" sesuai format templat`,
      komponen: "Lampiran",
      pemeriksa: "cekLampiran",
      parameter: { tipe: "lampiran_format", nama: l.nama, kunci: l.kunci },
      aturanHitung: `Berkas lampiran "${l.nama}" memuat kalimat kunci templat: ${l.kunci.map((k) => `"${k}"`).join(", ")}.`,
    });
  }
  return hasil;
}
