/**
 * Penurunan butir cek dari templat untuk seed (turunkanButirCek pada UC-01).
 * Skema parameter sama dengan ParameterButir di kontrak. Agen A boleh membuat versi sendiri di src/lib/templat/**.
 */
import type { ParameterButir } from "./kontrak/tipe";

export interface BagianSeed {
  nama: string;
  batasKata: number | null;
  wajib: boolean;
}

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

export function turunkanButirDariTemplat(bagian: BagianSeed[], lampiranWajib: string[]): ButirSeed[] {
  const hasil: ButirSeed[] = [];
  let b = 0;
  let k = 0;
  for (const x of bagian) {
    if (x.wajib) {
      hasil.push({
        kode: `BGN-${String(++b).padStart(2, "0")}`,
        deskripsi: `Bagian wajib "${x.nama}" ada di naskah`,
        jenis: "deterministik",
        asal: "templat",
        komponen: "Screening",
        pemeriksa: "cocokkanStrukturJudul",
        parameter: { tipe: "bagian_wajib", bagian: x.nama },
        aturanHitung: `Judul bagian "${x.nama}" ditemukan di naskah.`,
      });
    }
    if (x.batasKata != null) {
      hasil.push({
        kode: `KTA-${String(++k).padStart(2, "0")}`,
        deskripsi: `Bagian "${x.nama}" tidak melebihi ${x.batasKata} kata`,
        jenis: "deterministik",
        asal: "templat",
        komponen: "2. Jumlah kata per bagian",
        pemeriksa: "hitungKata",
        parameter: { tipe: "batas_kata", bagian: x.nama, batas: x.batasKata },
        aturanHitung: `Jumlah kata bagian "${x.nama}" <= ${x.batasKata}; tanpa toleransi; diagram, tabel, dan gambar tidak dihitung.`,
      });
    }
  }
  lampiranWajib.forEach((nama, i) =>
    hasil.push({
      kode: `LMP-${String(i + 1).padStart(2, "0")}`,
      deskripsi: `Lampiran "${nama}" dilampirkan`,
      jenis: "deterministik",
      asal: "templat",
      komponen: "Lampiran",
      pemeriksa: "cekLampiran",
      parameter: { tipe: "lampiran_wajib", nama },
      aturanHitung: `Berkas lampiran "${nama}" ada pada pengajuan.`,
    }),
  );
  return hasil;
}
