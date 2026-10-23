/**
 * periksaKelengkapan() UC-01 langkah 7: murni (tanpa basis data) sehingga dipakai server dan peramban.
 * Setiap baris bagian harus punya nama dan batas kata (angka bulat > 0, atau dicentang "Tanpa batas kata"),
 * ketentuan bagian (M-12) harus sah, isian "Periode Berlaku" harus terisi, dan templat memuat sekurang-kurangnya satu bagian.
 */
import type { JenisIsian } from "../kontrak/tipe";
import type { KopTemplat, LampiranTemplat } from "./paket";

export interface KetentuanMentah {
  /** kalimat petunjuk; boleh memuat {batas}; "" = tanpa petunjuk */
  petunjuk: string;
  jenisIsian: JenisIsian;
  /** isian mentah "Jumlah Butir" (jenis daftar) */
  jumlahButir: string;
  /** isian mentah "Pemisah" (jenis daftar) */
  pemisah: string;
  wajibGambar: boolean;
  sitasiBernomor: boolean;
  daftarPustaka: boolean;
}

export const KETENTUAN_KOSONG: KetentuanMentah = {
  petunjuk: "",
  jenisIsian: "teks",
  jumlahButir: "",
  pemisah: "",
  wajibGambar: false,
  sitasiBernomor: false,
  daftarPustaka: false,
};

export interface BarisBagianMentah extends Partial<KetentuanMentah> {
  nama: string;
  /** isian mentah "Batas Kata" */
  batas: string;
  /** true bila bagian memang tanpa batas kata (mis. Daftar Pustaka) */
  tanpaBatas: boolean;
  wajib: boolean;
}

export interface MasukanKelengkapan {
  bagian: BarisBagianMentah[];
  lampiran: string[];
  periodeBerlakuId: string | null;
  /** kepala dokumen (judul, subjudul, pengantar); tidak ikut menentukan kelengkapan */
  kepala?: { judulDokumen: string; subjudul: string; pengantar: string };
  /** kop dan bagian depan 1-6; tidak ada = tidak diubah */
  kop?: KopTemplat;
  /** templat per lampiran wajib (M-13); tidak ada = tidak diubah */
  lampiranTemplat?: LampiranTemplat[];
}

/** Galat ketentuan satu bagian (M-12): pesan per isian, null = sah. */
export interface GalatKetentuan {
  jumlahButir: string | null;
  pemisah: string | null;
  sitasiBernomor: string | null;
  daftarPustaka: string | null;
}

export interface HasilKelengkapan {
  lengkap: boolean;
  /** per baris: true = isian itu perlu ditandai; `ketentuan` = galat ketentuan bagian (M-12) atau null */
  bagian: { nama: boolean; batas: boolean; ketentuan: GalatKetentuan | null }[];
  lampiran: boolean[];
  periode: boolean;
  tanpaBagian: boolean;
}

export function batasKataValid(s: string): boolean {
  return /^\d{1,6}$/.test(s.trim()) && Number(s) > 0;
}

export const jumlahButirValid = (s: string): boolean => /^\d{1,3}$/.test(s.trim()) && Number(s) >= 1;

export const PESAN_DAFTAR_PUSTAKA_GANDA = "Hanya satu bagian yang boleh ditandai daftar pustaka";
export const PESAN_SITASI_TANPA_PUSTAKA = "Sitasi bernomor butuh satu bagian yang ditandai daftar pustaka";

/**
 * Validasi ketentuan seluruh bagian (aturan M-12): jenis daftar wajib berjumlah butir bilangan bulat >= 1 dan berpemisah satu karakter;
 * maksimal satu bagian berpenanda daftar pustaka; sitasi bernomor butuh bagian daftar pustaka. Hasil sepanjang `bagian`, null = sah.
 */
export function periksaKetentuan(bagian: BarisBagianMentah[]): (GalatKetentuan | null)[] {
  const jumlahPustaka = bagian.filter((b) => b.daftarPustaka === true).length;
  const adaPustaka = jumlahPustaka > 0;
  return bagian.map((b) => {
    const g: GalatKetentuan = { jumlahButir: null, pemisah: null, sitasiBernomor: null, daftarPustaka: null };
    if (b.jenisIsian === "daftar") {
      if (!jumlahButirValid(b.jumlahButir ?? "")) g.jumlahButir = "Isi bilangan bulat 1 atau lebih";
      if ((b.pemisah ?? "").length !== 1) g.pemisah = "Isi tepat satu karakter, misalnya ;";
    }
    if (b.daftarPustaka === true && jumlahPustaka > 1) g.daftarPustaka = PESAN_DAFTAR_PUSTAKA_GANDA;
    if (b.sitasiBernomor === true && !adaPustaka) g.sitasiBernomor = PESAN_SITASI_TANPA_PUSTAKA;
    return g.jumlahButir || g.pemisah || g.sitasiBernomor || g.daftarPustaka ? g : null;
  });
}

export function periksaKelengkapan(m: MasukanKelengkapan): HasilKelengkapan {
  const hitungNama = new Map<string, number>();
  for (const b of m.bagian) {
    const k = b.nama.trim().toLowerCase();
    if (k) hitungNama.set(k, (hitungNama.get(k) ?? 0) + 1);
  }
  const ketentuan = periksaKetentuan(m.bagian);
  const bagian = m.bagian.map((b, i) => ({
    // nama kosong atau ganda (kunci teksPerBagian harus unik)
    nama: b.nama.trim() === "" || (hitungNama.get(b.nama.trim().toLowerCase()) ?? 0) > 1,
    batas: !b.tanpaBatas && !batasKataValid(b.batas),
    ketentuan: ketentuan[i],
  }));
  const lampiran = m.lampiran.map((l) => l.trim() === "");
  const periode = !m.periodeBerlakuId;
  const tanpaBagian = m.bagian.length === 0;
  const lengkap = !tanpaBagian && !periode && bagian.every((b) => !b.nama && !b.batas && !b.ketentuan) && lampiran.every((x) => !x);
  return { lengkap, bagian, lampiran, periode, tanpaBagian };
}

/** Nilai tersimpan satu bagian (kolom bagian_templat). */
export interface BagianTersimpan {
  nama: string;
  batasKata: number | null;
  wajib: boolean;
  /** tidak ada = turunkan dari nama bagian (isian tidak memuat ketentuan, mis. pemanggil lama) */
  petunjuk?: string;
  jenisIsian?: JenisIsian;
  jumlahButir?: number | null;
  pemisah?: string | null;
  wajibGambar?: boolean;
  sitasiBernomor?: boolean;
  daftarPustaka?: boolean;
}

function ketentuanTersimpan(b: BarisBagianMentah): Omit<BagianTersimpan, "nama" | "batasKata" | "wajib"> {
  if (b.jenisIsian === undefined) return {};
  const daftar = b.jenisIsian === "daftar";
  return {
    petunjuk: b.petunjuk ?? "",
    jenisIsian: b.jenisIsian,
    jumlahButir: daftar && jumlahButirValid(b.jumlahButir ?? "") ? Number((b.jumlahButir ?? "").trim()) : null,
    pemisah: daftar && (b.pemisah ?? "").length === 1 ? (b.pemisah ?? "") : null,
    wajibGambar: b.wajibGambar === true,
    sitasiBernomor: b.sitasiBernomor === true,
    daftarPustaka: b.daftarPustaka === true,
  };
}

/** Ubah isian mentah yang sudah lengkap menjadi nilai tersimpan. */
export function bagianTersimpan(b: BarisBagianMentah): BagianTersimpan {
  return { nama: b.nama.trim(), batasKata: b.tanpaBatas ? null : Number(b.batas.trim()), wajib: b.wajib, ...ketentuanTersimpan(b) };
}

export interface IsianDrafBersih {
  bagian: BagianTersimpan[];
  lampiran: string[];
  periodeBerlakuId: string | null;
}

/**
 * Isian yang boleh disimpan sebagai Draf walau belum lengkap ("Simpan Draf", "Unduh Pratinjau (.docx)").
 * Baris tanpa nama dan lampiran kosong dibuang (tidak membawa informasi); batas kata yang tidak valid menjadi tanpa batas;
 * jumlah butir atau pemisah yang tidak sah disimpan null (kelengkapan penuh tetap diperiksa saat "Terbitkan", periksaKelengkapan).
 */
export function bersihkanIsianDraf(m: MasukanKelengkapan): IsianDrafBersih {
  return {
    bagian: m.bagian
      .filter((b) => b.nama.trim() !== "")
      .map((b) => ({
        ...bagianTersimpan({ ...b, tanpaBatas: b.tanpaBatas || !batasKataValid(b.batas) }),
        batasKata: b.tanpaBatas || !batasKataValid(b.batas) ? null : Number(b.batas.trim()),
      })),
    lampiran: m.lampiran.map((l) => l.trim()).filter((l) => l !== ""),
    periodeBerlakuId: m.periodeBerlakuId || null,
  };
}
