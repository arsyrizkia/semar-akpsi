/**
 * Struktur "Isian Substansi Proposal" (BIMA): bagian A-H dengan kalimat petunjuk resmi per bagian.
 * Murni (tanpa basis data), aman diimpor klien. Sumber teks: empat PDF contoh proposal BIMA (22 Okt 2026).
 *
 * Kalimat petunjuk resmi disalin persis, termasuk salah ketik aslinya ("dengen Rencana Anggaran Biaya"), karena pemotong naskah
 * (`potongPerBagian`) mengenali dan membuang kalimat itu dari isian. Angka batas kata ditulis sebagai `{batas}` dan diisi dari
 * batas kata bagian templat.
 *
 * Sejak 23 Okt 2026 petunjuk dan ketentuan bagian (jenis isian, jumlah butir, pemisah, wajib gambar, sitasi bernomor, daftar pustaka)
 * disimpan di data templat (kolom bagian_templat); konstanta di berkas ini hanya NILAI BAWAAN saat menyusun versi baru atau seed, dan
 * penurun nilai untuk baris lama yang kolom barunya masih null (`lengkapiBagian`, `petunjukBagian`).
 */
import type { BagianTemplatDto, JenisIsian, KepalaTemplatDto } from "../kontrak/tipe";
import { fmt, normalisasiJudul } from "../pemeriksa/deterministik/teks";

export interface DefinisiBagianIsian {
  nama: string;
  /** petunjuk resmi; `{batas}` diganti batas kata bagian */
  petunjuk: string;
  /** batas kata bawaan Penelitian Dasar; null = tanpa batas */
  batasDasar: number | null;
  /** batas kata bawaan Penelitian Terapan; null = tanpa batas */
  batasTerapan: number | null;
  /** ketentuan bawaan bagian */
  jenisIsian: JenisIsian;
  jumlahButir?: number;
  pemisah?: string;
  wajibGambar?: boolean;
  sitasiBernomor?: boolean;
  daftarPustaka?: boolean;
}

export const BAGIAN_ISIAN_SUBSTANSI: readonly DefinisiBagianIsian[] = [
  { nama: "Judul", petunjuk: "Tuliskan judul usulan penelitian maksimal {batas} kata", batasDasar: 20, batasTerapan: 20, jenisIsian: "teks" },
  {
    nama: "Ringkasan",
    petunjuk: "Isian ringkasan penelitian tidak lebih dari {batas} kata yang berisi urgensi, tujuan, metode, dan luaran yang ditargetkan",
    batasDasar: 300,
    batasTerapan: 300,
    jenisIsian: "teks",
  },
  {
    nama: "Kata Kunci",
    petunjuk: "Isian 5 kata kunci yang dipisahkan dengan tanda titik koma (;)",
    batasDasar: null,
    batasTerapan: null,
    jenisIsian: "daftar",
    jumlahButir: 5,
    pemisah: ";",
  },
  {
    nama: "Pendahuluan",
    petunjuk:
      "Pendahuluan penelitian tidak lebih dari {batas} kata yang memuat, latar belakang, rumusan permasalahan yang akan diteliti, pendekatan pemecahan masalah, state-of-the-art dan kebaruan, peta jalan (road map) penelitian setidaknya 5 tahun. Sitasi disusun dan ditulis berdasarkan sistem nomor sesuai dengan urutan pengutipan.",
    batasDasar: 1000,
    batasTerapan: 1500,
    jenisIsian: "teks",
    sitasiBernomor: true,
  },
  {
    nama: "Metode",
    petunjuk:
      "Isian metode atau cara untuk mencapai tujuan yang telah ditetapkan tidak lebih dari {batas} kata. Pada bagian metode wajib dilengkapi dengan diagram alir penelitian yang menggambarkan apa yang sudah dilaksanakan dan yang akan dikerjakan selama waktu yang diusulkan. Format diagram alir dapat berupa file JPG/PNG. Metode penelitian harus memuat sekurang-kurangnya prosedur penelitian, hasil yang diharapkan, indikator capaian yang ditargetkan, serta anggota tim/mitra yang bertanggung jawab pada setiap tahapan penelitian. Metode penelitian harus sejalan dengen Rencana Anggaran Biaya (RAB).",
    batasDasar: 1000,
    batasTerapan: 1000,
    jenisIsian: "teks",
    wajibGambar: true,
  },
  {
    nama: "Hasil yang Diharapkan",
    petunjuk: "Jelaskan hasil yang diharapkan atau luaran yang dijanjikan dari penelitian",
    batasDasar: null,
    batasTerapan: null,
    jenisIsian: "teks",
  },
  {
    nama: "Jadwal Penelitian",
    petunjuk: "Jadwal penelitian disusun berdasarkan pelaksanaan penelitian dan disesuaikan berdasarkan lama tahun pelaksanaan penelitian",
    batasDasar: null,
    batasTerapan: null,
    jenisIsian: "tabel",
  },
  {
    nama: "Daftar Pustaka",
    petunjuk:
      "Sitasi disusun dan ditulis berdasarkan sistem nomor sesuai dengan urutan pengutipan. Hanya pustaka yang disitasi pada usulan penelitian yang dicantumkan dalam Daftar Pustaka.",
    batasDasar: null,
    batasTerapan: null,
    jenisIsian: "teks",
    sitasiBernomor: true,
    daftarPustaka: true,
  },
];

/** Kalimat pembuka templat Isian Substansi (di atas bagian A). */
export const PENGANTAR_ISIAN_SUBSTANSI =
  "Pengusul hanya diperkenankan mengisi di tempat yang telah disediakan sesuai dengan petunjuk pengisian dan tidak diperkenankan melakukan modifikasi template atau penghapusan di setiap bagian.";

/** Tempat isian pada berkas templat: pengusul mengganti isi tanda kurung siku. */
export const TEMPAT_ISIAN = "[ ]";

export const JUDUL_DOKUMEN_BAWAAN = "Isian Substansi Proposal";

/** Subjudul resmi per skema (kepala halaman Isian Substansi; PDF contoh no. 1 dan no. 5). */
export const SUBJUDUL_BAWAAN: Record<"dasar" | "terapan", string> = {
  dasar: "SKEMA PENELITIAN DASAR (PENELITIAN DASAR FUNDAMENTAL DAN PENELITIAN KERJA SAMA ANTAR PERGURUAN TINGGI)",
  terapan: "SKEMA PENELITIAN TERAPAN",
};

/** Kepala dokumen bawaan untuk skema Dasar atau Terapan (nilai awal seed dan "Susun Versi Baru" tanpa templat berlaku). */
export function kepalaBawaan(skema: "dasar" | "terapan"): KepalaTemplatDto {
  return { judulDokumen: JUDUL_DOKUMEN_BAWAAN, subjudul: SUBJUDUL_BAWAAN[skema], pengantar: PENGANTAR_ISIAN_SUBSTANSI };
}

/** Kepala dokumen dari baris templat; subjudul bawaan hanya bila baris lama tanpa kepala sama sekali. */
export function kepalaDariBaris(b: { judulDokumen?: string | null; subjudul?: string | null; pengantar?: string | null }): KepalaTemplatDto {
  return { judulDokumen: b.judulDokumen?.trim() || JUDUL_DOKUMEN_BAWAAN, subjudul: b.subjudul?.trim() || null, pengantar: b.pengantar?.trim() || null };
}

const nf = new Intl.NumberFormat("id-ID", { useGrouping: false });

function cari(nama: string): DefinisiBagianIsian | undefined {
  const n = normalisasiJudul(nama);
  return BAGIAN_ISIAN_SUBSTANSI.find((d) => normalisasiJudul(d.nama) === n);
}

/** Huruf judul bagian pada Isian Substansi: 0 -> "A", 1 -> "B", dst. (lewat "Z" menjadi nomor). */
export function hurufBagian(indeks: number): string {
  return indeks < 26 ? String.fromCharCode(65 + indeks) : String(indeks + 1);
}

/** Judul bagian sebagaimana tercetak: "A. JUDUL", "F. HASIL YANG DIHARAPKAN". */
export function judulBerhuruf(indeks: number, nama: string): string {
  return `${hurufBagian(indeks)}. ${nama.toUpperCase()}`;
}

function isiBatas(petunjuk: string, batasKata: number | null): string {
  return petunjuk.replace("{batas}", batasKata == null ? "" : nf.format(batasKata)).replace(/\s{2,}/g, " ").trim();
}

/**
 * Kalimat petunjuk resmi untuk bagian bernama `nama`, dengan angka batas dari `batasKata` (atau batas bawaan resmi bila null).
 * null bila bagian bukan bagian Isian Substansi.
 */
export function petunjukResmi(nama: string, batasKata: number | null | undefined): string | null {
  const d = cari(nama);
  if (!d) return null;
  const bawaan = d.batasDasar ?? d.batasTerapan;
  return isiBatas(d.petunjuk, batasKata ?? bawaan);
}

/**
 * Kalimat petunjuk yang dicetak untuk sebuah bagian: petunjuk tersimpan (`{batas}` diganti batas kata bagian; "" = tanpa petunjuk),
 * atau petunjuk resmi turunan nama bagian bila belum tersimpan (baris lama). null bila tidak ada petunjuk.
 */
export function petunjukBagian(b: Pick<BagianTemplatDto, "nama" | "batasKata"> & { petunjuk?: string | null }): string | null {
  if (b.petunjuk != null) {
    const t = isiBatas(b.petunjuk, b.batasKata ?? null);
    return t === "" ? null : t;
  }
  return petunjukResmi(b.nama, b.batasKata);
}

export interface BagianBawaan {
  nama: string;
  batasKata: number | null;
  wajib: boolean;
  petunjuk: string;
  jenisIsian: JenisIsian;
  jumlahButir: number | null;
  pemisah: string | null;
  wajibGambar: boolean;
  sitasiBernomor: boolean;
  daftarPustaka: boolean;
}

/** Bagian templat Isian Substansi untuk skema Dasar atau Terapan: nama, batas kata, wajib, petunjuk ({batas} tetap tertulis), ketentuan. */
export function bagianBawaan(skema: "dasar" | "terapan"): BagianBawaan[] {
  return BAGIAN_ISIAN_SUBSTANSI.map((d) => ({
    nama: d.nama,
    batasKata: skema === "dasar" ? d.batasDasar : d.batasTerapan,
    wajib: true,
    petunjuk: d.petunjuk,
    jenisIsian: d.jenisIsian,
    jumlahButir: d.jumlahButir ?? null,
    pemisah: d.pemisah ?? null,
    wajibGambar: d.wajibGambar ?? false,
    sitasiBernomor: d.sitasiBernomor ?? false,
    daftarPustaka: d.daftarPustaka ?? false,
  }));
}

/**
 * Melengkapi bagian templat: `huruf` dari urutan, dan ketentuan yang masih null (baris lama sebelum 23 Okt 2026) diturunkan dari nama
 * bagian Isian Substansi (selain itu teks tanpa ketentuan lain). `petunjuk` tidak diubah; baca lewat `petunjukBagian`.
 */
export function lengkapiBagian(bagian: BagianTemplatDto[]): BagianTemplatDto[] {
  const urut = [...bagian].sort((a, b) => a.urutan - b.urutan);
  return urut.map((b, i) => {
    const d = cari(b.nama);
    const jenisIsian: JenisIsian = b.jenisIsian ?? d?.jenisIsian ?? "teks";
    return {
      ...b,
      huruf: hurufBagian(i),
      jenisIsian,
      jumlahButir: jenisIsian === "daftar" ? (b.jumlahButir ?? d?.jumlahButir ?? null) : null,
      pemisah: jenisIsian === "daftar" ? (b.pemisah ?? d?.pemisah ?? null) : null,
      wajibGambar: b.wajibGambar ?? d?.wajibGambar ?? false,
      sitasiBernomor: b.sitasiBernomor ?? d?.sitasiBernomor ?? false,
      daftarPustaka: b.daftarPustaka ?? d?.daftarPustaka ?? false,
    };
  });
}

/** Baris bagian_templat (atau bentuk sejenis) menjadi BagianTemplatDto lengkap; dipakai semua pembaca basis data. */
export function bagianDariBaris(b: {
  urutan: number;
  nama: string;
  batasKata: number | null;
  wajib: boolean;
  petunjuk?: string | null;
  jenisIsian?: JenisIsian | null;
  jumlahButir?: number | null;
  pemisah?: string | null;
  wajibGambar?: boolean | null;
  sitasiBernomor?: boolean | null;
  daftarPustaka?: boolean | null;
}): BagianTemplatDto {
  const lengkap = lengkapiBagian([{ ...b }])[0];
  delete lengkap.huruf; // huruf bergantung urutan dalam daftar; diisi lengkapiBagian atas seluruh daftar
  return lengkap;
}

/** Ringkasan ketentuan bagian sebagai chip pendek untuk kolom J-02: "≤ 20 kata", "5 butir · pemisah ;", "wajib gambar", dst. */
export function ringkasKetentuan(b: BagianTemplatDto): string[] {
  const hasil: string[] = [];
  if (b.batasKata != null) hasil.push(`≤ ${fmt(b.batasKata)} kata`);
  if (b.jenisIsian === "daftar") hasil.push(`${b.jumlahButir ?? "?"} butir · pemisah ${b.pemisah ?? "?"}`);
  if (b.jenisIsian === "tabel") hasil.push("tabel");
  if (b.wajibGambar) hasil.push("wajib gambar");
  if (b.sitasiBernomor) hasil.push("sitasi bernomor");
  if (b.daftarPustaka) hasil.push("daftar pustaka");
  return hasil;
}
