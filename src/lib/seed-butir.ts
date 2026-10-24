/**
 * Penurunan butir cek dari templat (turunkanButirCek pada UC-01; dipakai juga seed). Skema parameter sama dengan ParameterButir di kontrak.
 * Butir diturunkan dari KETENTUAN per bagian (UC-01 M-12, putaran 3), deterministik DAN semantik:
 *  - wajib             -> BGN-nn   bagian terisi          (periksaBagianTerisi)          Deterministik
 *  - batas maksimal    -> KTA-nn   hitungKata                                            Deterministik
 *  - batas minimal     -> KTM-nn   hitungKata (minimal)                                  Deterministik
 *  - tipe daftar       -> KAT-nn   cekKataKunci           ("tepat N butir, pemisah ;")   Deterministik
 *  - wajib gambar      -> GBR-nn   periksaDiagramAlir (keterangan gambar)                Deterministik
 *                         UNS-nn   kesesuaian isi gambar dengan bagian                    Semantik
 *  - tipe tabel / wajib tabel -> TBL-nn cekTabel (kolom wajib)                           Deterministik
 *  - frasa wajib       -> FRS-nn   periksaFrasa (satu butir per frasa)                   Deterministik
 *  - sitasi bernomor   -> SIT-01 dan tipe daftar_pustaka -> SIT-02, SIT-03  cocokkanSitasi  Deterministik
 *  - unsur isi         -> UNS-nn   nilaiSemantik, satu butir per unsur                   Semantik
 * Lampiran tidak diturunkan: lampiran dan templat lampirannya milik BIMA, SEMAR hanya memeriksa isi (arah-isi-saja-2026-10-24).
 * Penomoran nn dua digit terpisah per awalan, mengikuti urutan bagian.
 */
import type { BagianTemplatDto, ParameterButir } from "./kontrak/tipe";
import { adalahDaftarPustaka, frasaTerisi, keteranganGambar, kolomTerisi, perluTabel, pertanyaanUnsur, unsurTerisi } from "./templat/isian-substansi";
import { formatAngka } from "@/lib/utils";
import { normalisasiJudul } from "./pemeriksa/deterministik/teks";

export type BagianSeed = Pick<BagianTemplatDto, "nama" | "batasKata" | "wajib"> &
  Partial<
    Pick<
      BagianTemplatDto,
      "jenisIsian" | "jumlahButir" | "pemisah" | "wajibGambar" | "sitasiBernomor" | "daftarPustaka" | "batasMin" | "wajibTabel" | "kolomTabel" | "judulTabel" | "ketGambar" | "frasaWajib" | "unsurIsi"
    >
  >;

export interface ButirSeed {
  kode: string;
  deskripsi: string;
  jenis: "deterministik" | "semantik";
  asal: "templat";
  komponen: string;
  pemeriksa: string;
  parameter: ParameterButir;
  aturanHitung: string | null;
  /** hanya butir semantik */
  pertanyaan: string | null;
  contohJawaban: string | null;
  /** bagian templat asal butir (untuk pratinjau M-12); null = butir umum */
  bagian: string | null;
}

const NAMA_PEMISAH: Record<string, string> = { ";": "titik koma", ",": "koma", "|": "garis tegak", "/": "garis miring" };
const nn = (n: number) => String(n).padStart(2, "0");

export function turunkanButirDariTemplat(bagian: BagianSeed[]): ButirSeed[] {
  const hasil: ButirSeed[] = [];
  const n = { BGN: 0, KTA: 0, KTM: 0, KAT: 0, GBR: 0, TBL: 0, FRS: 0, UNS: 0 };
  const det = { jenis: "deterministik", asal: "templat", pertanyaan: null, contohJawaban: null } as const;
  const sem = { jenis: "semantik", asal: "templat", pemeriksa: "nilaiSemantik", aturanHitung: null } as const;
  for (const x of bagian) {
    const bg = x as BagianTemplatDto;
    if (x.wajib) {
      hasil.push({
        ...det,
        bagian: x.nama,
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
        ...det,
        bagian: x.nama,
        kode: `KTA-${nn(++n.KTA)}`,
        deskripsi: `Bagian “${x.nama}” tidak melebihi ${formatAngka(x.batasKata)} kata`,
        komponen: "2. Jumlah kata per bagian",
        pemeriksa: "hitungKata",
        parameter: { tipe: "batas_kata", bagian: x.nama, batas: x.batasKata },
        aturanHitung: `Jumlah kata bagian "${x.nama}" <= ${x.batasKata}; tanpa toleransi; kalimat petunjuk templat, diagram, tabel, dan gambar tidak dihitung.`,
      });
    }
    if (x.batasMin != null) {
      hasil.push({
        ...det,
        bagian: x.nama,
        kode: `KTM-${nn(++n.KTM)}`,
        deskripsi: `Bagian “${x.nama}” sekurang-kurangnya ${formatAngka(x.batasMin)} kata`,
        komponen: "2. Jumlah kata per bagian",
        pemeriksa: "hitungKata",
        parameter: { tipe: "batas_kata_min", bagian: x.nama, batas: x.batasMin },
        aturanHitung: `Jumlah kata bagian "${x.nama}" >= ${x.batasMin}; kalimat petunjuk templat, diagram, tabel, dan gambar tidak dihitung.`,
      });
    }
    if (x.jenisIsian === "daftar" && x.jumlahButir != null && x.jumlahButir >= 1 && x.pemisah) {
      const nama = NAMA_PEMISAH[x.pemisah] ?? `"${x.pemisah}"`;
      hasil.push({
        ...det,
        bagian: x.nama,
        kode: `KAT-${nn(++n.KAT)}`,
        deskripsi: normalisasiJudul(x.nama) === "kata kunci" ? `Kata kunci tepat ${x.jumlahButir}, dipisahkan ${nama} (${x.pemisah})` : `${x.nama}: tepat ${x.jumlahButir} butir, dipisahkan ${nama} (${x.pemisah})`,
        komponen: "2. Jumlah kata per bagian",
        pemeriksa: "cekKataKunci",
        parameter: { tipe: "kata_kunci", jumlah: x.jumlahButir, pemisah: x.pemisah, bagian: x.nama },
        aturanHitung: `Isian bagian "${x.nama}" berupa daftar tepat ${x.jumlahButir} butir yang dipisahkan ${nama} (${x.pemisah}); butir boleh berupa frasa, tidak boleh kosong, dan pemisah tidak boleh bercampur.`,
      });
    }
    if (x.wajibGambar) {
      const ket = keteranganGambar(bg);
      hasil.push({
        ...det,
        bagian: x.nama,
        kode: `GBR-${nn(++n.GBR)}`,
        deskripsi: `Bagian “${x.nama}” memuat gambar (${ket})`,
        komponen: "1. Kesesuaian isi per bagian",
        pemeriksa: "periksaDiagramAlir",
        parameter: { tipe: "diagram_alir", bagian: x.nama, keterangan: ket },
        aturanHitung: `Bagian "${x.nama}" memuat gambar berketerangan yang menyebut "${ket}".`,
      });
      hasil.push({
        ...sem,
        bagian: x.nama,
        kode: `UNS-${nn(++n.UNS)}`,
        deskripsi: `Gambar (${ket}) pada bagian “${x.nama}” sesuai dengan isi bagian`,
        komponen: "1. Kesesuaian isi per bagian",
        parameter: { tipe: "semantik", bagian: x.nama },
        pertanyaan: `Apakah ${ket} yang dirujuk di bagian ${x.nama} menggambarkan isi bagian itu dengan sesuai?`,
        contohJawaban: null,
      });
    }
    if (perluTabel(bg)) {
      const kolom = kolomTerisi(bg);
      hasil.push({
        ...det,
        bagian: x.nama,
        kode: `TBL-${nn(++n.TBL)}`,
        deskripsi: kolom.length ? `Bagian “${x.nama}” memuat tabel berkolom ${kolom.join("; ")}` : `Bagian “${x.nama}” memuat tabel`,
        komponen: "1. Kesesuaian isi per bagian",
        pemeriksa: "cekTabel",
        parameter: kolom.length ? { tipe: "tabel_wajib", bagian: x.nama, kolom } : { tipe: "tabel_wajib", bagian: x.nama },
        aturanHitung: `Bagian "${x.nama}" memuat tabel (penanda tabel, keterangan "Tabel n", atau baris berkolom No, kegiatan, dan bulan)${kolom.length ? `; kolom wajib: ${kolom.join("; ")}` : ""}.`,
      });
    }
    for (const frasa of frasaTerisi(bg)) {
      hasil.push({
        ...det,
        bagian: x.nama,
        kode: `FRS-${nn(++n.FRS)}`,
        deskripsi: `Bagian “${x.nama}” memuat kalimat “${frasa}”`,
        komponen: "1. Kesesuaian isi per bagian",
        pemeriksa: "periksaFrasa",
        parameter: { tipe: "frasa_wajib", bagian: x.nama, frasa },
        aturanHitung: `Kalimat "${frasa}" muncul persis (huruf besar-kecil dan spasi berlebih diabaikan) di bagian "${x.nama}".`,
      });
    }
    for (const u of unsurTerisi(bg)) {
      hasil.push({
        ...sem,
        bagian: x.nama,
        kode: `UNS-${nn(++n.UNS)}`,
        deskripsi: `${x.nama} memuat ${u.unsur.trim()}`,
        komponen: "1. Kesesuaian isi per bagian",
        parameter: { tipe: "semantik", bagian: x.nama },
        pertanyaan: pertanyaanUnsur(x.nama, u),
        contohJawaban: u.contoh?.trim() || null,
      });
    }
  }

  const pustaka = bagian.find((b) => adalahDaftarPustaka(b))?.nama;
  const komponenSitasi = "3. Sitasi dan daftar pustaka";
  if (bagian.some((b) => b.sitasiBernomor)) {
    hasil.push({
      ...det,
      bagian: bagian.find((b) => b.sitasiBernomor)?.nama ?? null,
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
        ...det,
        bagian: pustaka,
        kode: "SIT-02",
        deskripsi: `Daftar pustaka ("${pustaka}") bernomor dan berurutan sesuai urutan pengutipan pertama`,
        komponen: komponenSitasi,
        pemeriksa: "cocokkanSitasi",
        parameter: { tipe: "pustaka_berurutan", pustaka },
        aturanHitung: `Entri "${pustaka}" bernomor 1, 2, 3, ...; nomor pertama kali dikutip berurutan tanpa melompat.`,
      },
      {
        ...det,
        bagian: pustaka,
        kode: "SIT-03",
        deskripsi: "Setiap sitasi [n] ada di daftar pustaka dan setiap pustaka disitasi",
        komponen: komponenSitasi,
        pemeriksa: "cocokkanSitasi",
        parameter: { tipe: "jumlah_referensi_sama", pustaka },
        aturanHitung: `Nomor yang dikutip di naskah sama persis dengan nomor entri "${pustaka}": jumlah sama, tidak ada nomor tanpa entri, tidak ada entri tanpa kutipan.`,
      },
    );
  }

  return hasil;
}
