/**
 * Struktur "Isian Substansi Proposal" (BIMA): bagian A-H dengan kalimat petunjuk resmi per bagian.
 * Murni (tanpa basis data), aman diimpor klien. Sumber teks: empat PDF contoh proposal BIMA (22 Okt 2026).
 *
 * Kalimat petunjuk resmi disalin persis, termasuk salah ketik aslinya ("dengen Rencana Anggaran Biaya"), karena pemotong naskah
 * (`potongPerBagian`) mengenali dan membuang kalimat itu dari isian. Angka batas kata ditulis sebagai `{batas}` dan diisi dari
 * batas kata bagian templat.
 *
 * Petunjuk adalah atribut bagian templat yang diturunkan dari nama bagian (tidak ada kolom basis data baru): lihat
 * `petunjukResmi` dan `lengkapiBagian`.
 */
import type { BagianTemplatDto } from "../kontrak/tipe";
import { normalisasiJudul } from "../pemeriksa/deterministik/teks";

export interface DefinisiBagianIsian {
  nama: string;
  /** petunjuk resmi; `{batas}` diganti batas kata bagian */
  petunjuk: string;
  /** batas kata bawaan Penelitian Dasar; null = tanpa batas */
  batasDasar: number | null;
  /** batas kata bawaan Penelitian Terapan; null = tanpa batas */
  batasTerapan: number | null;
}

export const BAGIAN_ISIAN_SUBSTANSI: readonly DefinisiBagianIsian[] = [
  { nama: "Judul", petunjuk: "Tuliskan judul usulan penelitian maksimal {batas} kata", batasDasar: 20, batasTerapan: 20 },
  {
    nama: "Ringkasan",
    petunjuk: "Isian ringkasan penelitian tidak lebih dari {batas} kata yang berisi urgensi, tujuan, metode, dan luaran yang ditargetkan",
    batasDasar: 300,
    batasTerapan: 300,
  },
  { nama: "Kata Kunci", petunjuk: "Isian 5 kata kunci yang dipisahkan dengan tanda titik koma (;)", batasDasar: null, batasTerapan: null },
  {
    nama: "Pendahuluan",
    petunjuk:
      "Pendahuluan penelitian tidak lebih dari {batas} kata yang memuat, latar belakang, rumusan permasalahan yang akan diteliti, pendekatan pemecahan masalah, state-of-the-art dan kebaruan, peta jalan (road map) penelitian setidaknya 5 tahun. Sitasi disusun dan ditulis berdasarkan sistem nomor sesuai dengan urutan pengutipan.",
    batasDasar: 1000,
    batasTerapan: 1500,
  },
  {
    nama: "Metode",
    petunjuk:
      "Isian metode atau cara untuk mencapai tujuan yang telah ditetapkan tidak lebih dari {batas} kata. Pada bagian metode wajib dilengkapi dengan diagram alir penelitian yang menggambarkan apa yang sudah dilaksanakan dan yang akan dikerjakan selama waktu yang diusulkan. Format diagram alir dapat berupa file JPG/PNG. Metode penelitian harus memuat sekurang-kurangnya prosedur penelitian, hasil yang diharapkan, indikator capaian yang ditargetkan, serta anggota tim/mitra yang bertanggung jawab pada setiap tahapan penelitian. Metode penelitian harus sejalan dengen Rencana Anggaran Biaya (RAB).",
    batasDasar: 1000,
    batasTerapan: 1000,
  },
  {
    nama: "Hasil yang Diharapkan",
    petunjuk: "Jelaskan hasil yang diharapkan atau luaran yang dijanjikan dari penelitian",
    batasDasar: null,
    batasTerapan: null,
  },
  {
    nama: "Jadwal Penelitian",
    petunjuk: "Jadwal penelitian disusun berdasarkan pelaksanaan penelitian dan disesuaikan berdasarkan lama tahun pelaksanaan penelitian",
    batasDasar: null,
    batasTerapan: null,
  },
  {
    nama: "Daftar Pustaka",
    petunjuk:
      "Sitasi disusun dan ditulis berdasarkan sistem nomor sesuai dengan urutan pengutipan. Hanya pustaka yang disitasi pada usulan penelitian yang dicantumkan dalam Daftar Pustaka.",
    batasDasar: null,
    batasTerapan: null,
  },
];

/** Kalimat pembuka templat Isian Substansi (di atas bagian A). */
export const PENGANTAR_ISIAN_SUBSTANSI =
  "Pengusul hanya diperkenankan mengisi di tempat yang telah disediakan sesuai dengan petunjuk pengisian dan tidak diperkenankan melakukan modifikasi template atau penghapusan di setiap bagian.";

/** Tempat isian pada berkas templat: pengusul mengganti isi tanda kurung siku. */
export const TEMPAT_ISIAN = "[ … ]";

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

/**
 * Kalimat petunjuk resmi untuk bagian bernama `nama`, dengan angka batas dari `batasKata` (atau batas bawaan resmi bila null).
 * null bila bagian bukan bagian Isian Substansi.
 */
export function petunjukResmi(nama: string, batasKata: number | null | undefined): string | null {
  const d = cari(nama);
  if (!d) return null;
  const bawaan = d.batasDasar ?? d.batasTerapan;
  const angka = batasKata ?? bawaan;
  return d.petunjuk.replace("{batas}", angka == null ? "" : nf.format(angka)).replace(/\s{2,}/g, " ").trim();
}

/** Bagian templat Isian Substansi untuk skema Dasar atau Terapan (nama, batas kata, wajib). */
export function bagianBawaan(skema: "dasar" | "terapan"): { nama: string; batasKata: number | null; wajib: boolean }[] {
  return BAGIAN_ISIAN_SUBSTANSI.map((d) => ({
    nama: d.nama,
    batasKata: skema === "dasar" ? d.batasDasar : d.batasTerapan,
    wajib: true,
  }));
}

/** Melengkapi bagian templat dengan atribut `huruf` dan `petunjuk` (bagian di luar Isian Substansi tanpa petunjuk resmi). */
export function lengkapiBagian(bagian: BagianTemplatDto[]): BagianTemplatDto[] {
  const urut = [...bagian].sort((a, b) => a.urutan - b.urutan);
  return urut.map((b, i) => ({ ...b, huruf: hurufBagian(i), petunjuk: b.petunjuk ?? petunjukResmi(b.nama, b.batasKata) }));
}
