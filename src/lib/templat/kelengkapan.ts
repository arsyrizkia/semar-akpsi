/**
 * periksaKelengkapan() UC-01 langkah 7: murni (tanpa basis data) sehingga dipakai server dan peramban.
 * Setiap baris bagian harus punya nama dan batas kata (angka bulat > 0, atau dicentang "Tanpa batas kata"),
 * ketentuan bagian (M-12) harus sah, isian "Periode Berlaku" harus terisi, dan templat memuat sekurang-kurangnya satu bagian.
 */
import type { BagianTemplatDto, JenisIsian, UnsurIsi } from "../kontrak/tipe";

export interface KetentuanMentah {
  /** kalimat petunjuk; boleh memuat {batas}; "" = tanpa petunjuk */
  petunjuk: string;
  jenisIsian: JenisIsian;
  /** isian mentah "Jumlah Butir" (jenis daftar) */
  jumlahButir: string;
  /** isian mentah "Pemisah" (jenis daftar) */
  pemisah: string;
  wajibGambar: boolean;
  /** keterangan gambar wajib, mis. "diagram alir penelitian" */
  ketGambar: string;
  sitasiBernomor: boolean;
  /** penanda lama; tipe isian "daftar_pustaka" sama artinya */
  daftarPustaka: boolean;
  /** isian mentah batas kata minimal (kosong = tanpa minimal) */
  batasMin: string;
  /** tabel wajib di dalam bagian teks */
  wajibTabel: boolean;
  kolomTabel: string[];
  judulTabel: string;
  /** frasa wajib, satu per entri */
  frasaWajib: string[];
  /** unsur isi wajib, satu per entri; pertanyaan kosong = disusun otomatis */
  unsurIsi: UnsurIsi[];
}

export const KETENTUAN_KOSONG: KetentuanMentah = {
  petunjuk: "",
  jenisIsian: "teks",
  jumlahButir: "",
  pemisah: "",
  wajibGambar: false,
  ketGambar: "",
  sitasiBernomor: false,
  daftarPustaka: false,
  batasMin: "",
  wajibTabel: false,
  kolomTabel: [],
  judulTabel: "",
  frasaWajib: [],
  unsurIsi: [],
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
  periodeBerlakuId: string | null;
  /** kepala dokumen (judul, subjudul, pengantar); tidak ikut menentukan kelengkapan */
  kepala?: { judulDokumen: string; subjudul: string; pengantar: string };
}

/** Galat ketentuan satu bagian (M-12): pesan per isian, null = sah. */
export interface GalatKetentuan {
  jumlahButir: string | null;
  pemisah: string | null;
  sitasiBernomor: string | null;
  daftarPustaka: string | null;
  batasMin: string | null;
  kolomTabel: string | null;
  frasaWajib: string | null;
  unsurIsi: string | null;
}

export interface HasilKelengkapan {
  lengkap: boolean;
  /** per baris: true = isian itu perlu ditandai; `ketentuan` = galat ketentuan bagian (M-12) atau null */
  bagian: { nama: boolean; batas: boolean; ketentuan: GalatKetentuan | null }[];
  periode: boolean;
  tanpaBagian: boolean;
}

export function batasKataValid(s: string): boolean {
  return /^\d{1,6}$/.test(s.trim()) && Number(s) > 0;
}

export const jumlahButirValid = (s: string): boolean => /^\d{1,3}$/.test(s.trim()) && Number(s) >= 1;

export const PESAN_DAFTAR_PUSTAKA_GANDA = "Hanya satu bagian yang boleh ditandai daftar pustaka";
export const PESAN_SITASI_TANPA_PUSTAKA = "Sitasi bernomor butuh satu bagian yang ditandai daftar pustaka";

/** Penanda bagian daftar pustaka pada isian mentah: tipe "daftar_pustaka" atau penanda lama. */
export const mentahPustaka = (b: Pick<BarisBagianMentah, "jenisIsian" | "daftarPustaka">): boolean => b.jenisIsian === "daftar_pustaka" || b.daftarPustaka === true;

const adaKosong = (x: string[]) => x.some((v) => v.trim() === "");

/**
 * Validasi ketentuan seluruh bagian (aturan M-12): daftar wajib berjumlah butir bilangan bulat >= 1 dan berpemisah satu karakter;
 * batas minimal bilangan bulat >= 1 dan tidak melebihi batas maksimal; tabel butuh sekurang-kurangnya satu kolom terisi; frasa dan unsur
 * isi tidak boleh kosong; maksimal satu bagian daftar pustaka; sitasi bernomor butuh bagian daftar pustaka. Hasil sepanjang `bagian`, null = sah.
 */
export function periksaKetentuan(bagian: BarisBagianMentah[]): (GalatKetentuan | null)[] {
  const jumlahPustaka = bagian.filter(mentahPustaka).length;
  const adaPustaka = jumlahPustaka > 0;
  return bagian.map((b) => {
    const g: GalatKetentuan = { jumlahButir: null, pemisah: null, sitasiBernomor: null, daftarPustaka: null, batasMin: null, kolomTabel: null, frasaWajib: null, unsurIsi: null };
    if (b.jenisIsian === "daftar") {
      if (!jumlahButirValid(b.jumlahButir ?? "")) g.jumlahButir = "Isi bilangan bulat 1 atau lebih";
      if ((b.pemisah ?? "").length !== 1) g.pemisah = "Isi tepat satu karakter, misalnya ;";
    }
    const min = (b.batasMin ?? "").trim();
    if (min !== "") {
      if (!batasKataValid(min)) g.batasMin = "Isi angka bulat lebih dari 0, atau kosongkan";
      else if (!b.tanpaBatas && batasKataValid(b.batas) && Number(min) > Number(b.batas.trim())) g.batasMin = "Minimal tidak boleh melebihi maksimal";
    }
    const kolom = b.kolomTabel ?? [];
    if (b.jenisIsian === "tabel" && kolom.length === 0) g.kolomTabel = "Tabel butuh sekurang-kurangnya satu kolom";
    else if ((b.jenisIsian === "tabel" || b.wajibTabel === true) && adaKosong(kolom)) g.kolomTabel = "Nama kolom tidak boleh kosong";
    if (adaKosong(b.frasaWajib ?? [])) g.frasaWajib = "Frasa wajib tidak boleh kosong";
    if (adaKosong((b.unsurIsi ?? []).map((u) => u.unsur))) g.unsurIsi = "Unsur isi tidak boleh kosong";
    if (mentahPustaka(b) && jumlahPustaka > 1) g.daftarPustaka = PESAN_DAFTAR_PUSTAKA_GANDA;
    if (b.sitasiBernomor === true && !adaPustaka) g.sitasiBernomor = PESAN_SITASI_TANPA_PUSTAKA;
    return Object.values(g).some(Boolean) ? g : null;
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
  const periode = !m.periodeBerlakuId;
  const tanpaBagian = m.bagian.length === 0;
  const lengkap = !tanpaBagian && !periode && bagian.every((b) => !b.nama && !b.batas && !b.ketentuan);
  return { lengkap, bagian, periode, tanpaBagian };
}

/** Nilai tersimpan satu bagian (kolom bagian_templat; "daftar_pustaka" dipetakan ke kolom oleh keKolomBagian). */
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
  batasMin?: number | null;
  wajibTabel?: boolean;
  kolomTabel?: string[] | null;
  judulTabel?: string | null;
  ketGambar?: string | null;
  frasaWajib?: string[] | null;
  unsurIsi?: UnsurIsi[] | null;
}

const bersih = (x: string[] | undefined) => (x ?? []).map((v) => v.trim()).filter(Boolean);

function ketentuanTersimpan(b: BarisBagianMentah): Omit<BagianTersimpan, "nama" | "batasKata" | "wajib"> {
  if (b.jenisIsian === undefined) return {};
  const daftar = b.jenisIsian === "daftar";
  const pustaka = mentahPustaka(b);
  const tabel = b.jenisIsian === "tabel" || b.wajibTabel === true;
  const kolom = bersih(b.kolomTabel);
  const frasa = bersih(b.frasaWajib);
  const unsur = (b.unsurIsi ?? []).filter((u) => u.unsur.trim() !== "").map((u) => ({ unsur: u.unsur.trim(), pertanyaan: u.pertanyaan?.trim() ? u.pertanyaan.trim() : null, ...(u.contoh?.trim() ? { contoh: u.contoh.trim() } : {}) }));
  const min = (b.batasMin ?? "").trim();
  return {
    petunjuk: b.petunjuk ?? "",
    jenisIsian: pustaka ? "daftar_pustaka" : b.jenisIsian,
    jumlahButir: daftar && jumlahButirValid(b.jumlahButir ?? "") ? Number((b.jumlahButir ?? "").trim()) : null,
    pemisah: daftar && (b.pemisah ?? "").length === 1 ? (b.pemisah ?? "") : null,
    wajibGambar: b.wajibGambar === true,
    sitasiBernomor: b.sitasiBernomor === true,
    daftarPustaka: pustaka,
    batasMin: batasKataValid(min) ? Number(min) : null,
    wajibTabel: b.jenisIsian === "tabel" ? false : b.wajibTabel === true,
    kolomTabel: tabel && kolom.length ? kolom : null,
    judulTabel: tabel && (b.judulTabel ?? "").trim() ? (b.judulTabel ?? "").trim() : null,
    ketGambar: b.wajibGambar === true && (b.ketGambar ?? "").trim() ? (b.ketGambar ?? "").trim() : null,
    frasaWajib: frasa.length ? frasa : null,
    unsurIsi: unsur.length ? unsur : null,
  };
}

/** Ubah isian mentah yang sudah lengkap menjadi nilai tersimpan. */
export function bagianTersimpan(b: BarisBagianMentah): BagianTersimpan {
  return { nama: b.nama.trim(), batasKata: b.tanpaBatas ? null : Number(b.batas.trim()), wajib: b.wajib, ...ketentuanTersimpan(b) };
}

export interface IsianDrafBersih {
  bagian: BagianTersimpan[];
  periodeBerlakuId: string | null;
}

/**
 * Isian yang boleh disimpan sebagai Draf walau belum lengkap ("Simpan Draf", "Unduh Pratinjau (.docx)").
 * Baris tanpa nama dibuang (tidak membawa informasi); batas kata yang tidak valid menjadi tanpa batas;
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
    periodeBerlakuId: m.periodeBerlakuId || null,
  };
}

/** Isian mentah satu bagian menjadi BagianTemplatDto (untuk chip ringkasan, pratinjau butir turunan, dan hitungan M-01); nilai tak sah dianggap kosong. */
export function mentahKeBagian(b: BarisBagianMentah): BagianTemplatDto {
  const batasSah = !b.tanpaBatas && batasKataValid(b.batas);
  const t = bagianTersimpan({ ...b, jenisIsian: b.jenisIsian ?? "teks", tanpaBatas: !batasSah });
  return { urutan: 0, ...t, batasKata: batasSah ? Number(b.batas.trim()) : null };
}
