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
import type { BagianTemplatDto, JenisIsian, KepalaTemplatDto, UnsurIsi } from "../kontrak/tipe";
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
  ketGambar?: string;
  sitasiBernomor?: boolean;
  daftarPustaka?: boolean;
  kolomTabel?: string[];
  judulTabel?: string;
  unsurIsi?: string[];
}

export const BAGIAN_ISIAN_SUBSTANSI: readonly DefinisiBagianIsian[] = [
  { nama: "Judul", petunjuk: "Tuliskan judul usulan penelitian maksimal {batas} kata", batasDasar: 20, batasTerapan: 20, jenisIsian: "teks" },
  {
    nama: "Ringkasan",
    petunjuk: "Isian ringkasan penelitian tidak lebih dari {batas} kata yang berisi urgensi, tujuan, metode, dan luaran yang ditargetkan",
    batasDasar: 300,
    batasTerapan: 300,
    jenisIsian: "teks",
    unsurIsi: ["urgensi", "tujuan", "metode", "luaran yang ditargetkan"],
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
    unsurIsi: ["latar belakang", "rumusan permasalahan", "pendekatan pemecahan masalah", "state-of-the-art dan kebaruan", "peta jalan penelitian setidaknya 5 tahun"],
  },
  {
    nama: "Metode",
    petunjuk:
      "Isian metode atau cara untuk mencapai tujuan yang telah ditetapkan tidak lebih dari {batas} kata. Pada bagian metode wajib dilengkapi dengan diagram alir penelitian yang menggambarkan apa yang sudah dilaksanakan dan yang akan dikerjakan selama waktu yang diusulkan. Format diagram alir dapat berupa file JPG/PNG. Metode penelitian harus memuat sekurang-kurangnya prosedur penelitian, hasil yang diharapkan, indikator capaian yang ditargetkan, serta anggota tim/mitra yang bertanggung jawab pada setiap tahapan penelitian. Metode penelitian harus sejalan dengen Rencana Anggaran Biaya (RAB).",
    batasDasar: 1000,
    batasTerapan: 1000,
    jenisIsian: "teks",
    wajibGambar: true,
    ketGambar: "diagram alir penelitian",
    unsurIsi: ["prosedur penelitian", "hasil yang diharapkan", "indikator capaian yang ditargetkan", "anggota tim/mitra yang bertanggung jawab pada setiap tahapan"],
  },
  {
    nama: "Hasil yang Diharapkan",
    petunjuk: "Jelaskan hasil yang diharapkan atau luaran yang dijanjikan dari penelitian",
    batasDasar: null,
    batasTerapan: null,
    jenisIsian: "teks",
    unsurIsi: ["hasil atau luaran yang dijanjikan"],
  },
  {
    nama: "Jadwal Penelitian",
    petunjuk: "Jadwal penelitian disusun berdasarkan pelaksanaan penelitian dan disesuaikan berdasarkan lama tahun pelaksanaan penelitian",
    batasDasar: null,
    batasTerapan: null,
    jenisIsian: "tabel",
    kolomTabel: ["No", "Nama Kegiatan", "Bulan 1–12"],
    judulTabel: "Tahun ke-1",
  },
  {
    nama: "Daftar Pustaka",
    petunjuk:
      "Sitasi disusun dan ditulis berdasarkan sistem nomor sesuai dengan urutan pengutipan. Hanya pustaka yang disitasi pada usulan penelitian yang dicantumkan dalam Daftar Pustaka.",
    batasDasar: null,
    batasTerapan: null,
    jenisIsian: "daftar_pustaka",
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

/** Nilai ketentuan lengkap sebuah bagian (tanpa urutan); bentuk yang sama dipakai bawaan, seed, dan penyimpanan. */
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
  batasMin: number | null;
  wajibTabel: boolean;
  kolomTabel: string[] | null;
  judulTabel: string | null;
  ketGambar: string | null;
  frasaWajib: string[] | null;
  unsurIsi: UnsurIsi[] | null;
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
    batasMin: null,
    wajibTabel: false,
    kolomTabel: d.kolomTabel ?? null,
    judulTabel: d.judulTabel ?? null,
    ketGambar: d.ketGambar ?? null,
    frasaWajib: null,
    unsurIsi: d.unsurIsi ? d.unsurIsi.map((unsur) => ({ unsur, pertanyaan: null })) : null,
  }));
}

/** Penanda bagian daftar pustaka: tipe "daftar_pustaka" atau penanda daftarPustaka (baris lama). */
export const adalahDaftarPustaka = (b: Pick<BagianTemplatDto, "jenisIsian" | "daftarPustaka">): boolean => b.jenisIsian === "daftar_pustaka" || b.daftarPustaka === true;

/** Bagian perlu memuat tabel: bertipe tabel atau teks dengan "wajib tabel". */
export const perluTabel = (b: Pick<BagianTemplatDto, "jenisIsian" | "wajibTabel">): boolean => b.jenisIsian === "tabel" || b.wajibTabel === true;

/** Unsur isi yang terisi (unsur kosong dibuang). */
export const unsurTerisi = (b: Pick<BagianTemplatDto, "unsurIsi">): UnsurIsi[] => (b.unsurIsi ?? []).filter((u) => u.unsur.trim() !== "");

/** Frasa wajib yang terisi. */
export const frasaTerisi = (b: Pick<BagianTemplatDto, "frasaWajib">): string[] => (b.frasaWajib ?? []).map((f) => f.trim()).filter(Boolean);

/** Pertanyaan pemeriksaan otomatis sebuah unsur isi. */
export const pertanyaanUnsur = (namaBagian: string, u: UnsurIsi): string => (u.pertanyaan?.trim() ? u.pertanyaan.trim() : `Apakah bagian ${namaBagian} memuat ${u.unsur.trim()}?`);

/** Kolom tabel yang terisi. */
export const kolomTerisi = (b: Pick<BagianTemplatDto, "kolomTabel">): string[] => (b.kolomTabel ?? []).map((k) => k.trim()).filter(Boolean);

/** Keterangan gambar wajib ("diagram alir penelitian" bila belum diisi). */
export const keteranganGambar = (b: Pick<BagianTemplatDto, "ketGambar">): string => b.ketGambar?.trim() || "diagram alir penelitian";

const NAMA_PEMISAH: Record<string, string> = { ";": "titik koma", ",": "koma", "|": "garis tegak", "/": "garis miring" };

/** Daftar dengan "dan" sebelum butir terakhir: "a, b, dan c". */
const sebutkan = (x: string[]): string => (x.length <= 1 ? (x[0] ?? "") : x.length === 2 ? `${x[0]} dan ${x[1]}` : `${x.slice(0, -1).join(", ")}, dan ${x[x.length - 1]}`);

/**
 * Petunjuk pengisian yang disusun otomatis dari ketentuan bagian (tombol "Susun ulang petunjuk" di M-12). `{batas}` tetap tertulis supaya
 * mengikuti Batas Kata. Bagian A-H bawaan memakai petunjuk resmi dari contoh, bukan hasil fungsi ini.
 */
export function susunPetunjuk(b: Pick<BagianTemplatDto, "nama" | "batasKata" | "jenisIsian" | "jumlahButir" | "pemisah" | "wajibGambar" | "sitasiBernomor" | "daftarPustaka" | "batasMin" | "wajibTabel" | "kolomTabel" | "judulTabel" | "ketGambar" | "frasaWajib" | "unsurIsi">): string {
  const nama = b.nama.trim() || "bagian ini";
  const kalimat: string[] = [];
  if (adalahDaftarPustaka(b)) {
    kalimat.push("Sitasi disusun dan ditulis berdasarkan sistem nomor sesuai dengan urutan pengutipan. Hanya pustaka yang disitasi pada usulan penelitian yang dicantumkan dalam Daftar Pustaka.");
  } else if (b.jenisIsian === "daftar") {
    const p = b.pemisah || ";";
    kalimat.push(`Isian ${b.jumlahButir ?? "?"} butir ${nama.toLowerCase()} yang dipisahkan dengan tanda ${NAMA_PEMISAH[p] ?? `"${p}"`} (${p})`);
  } else if (b.jenisIsian === "tabel") {
    const k = kolomTerisi(b);
    kalimat.push(`Isian berupa tabel${k.length ? ` dengan kolom ${sebutkan(k)}` : ""}${b.judulTabel?.trim() ? `, diberi judul blok "${b.judulTabel.trim()}"` : ""}`);
  } else {
    const adaMin = b.batasMin != null;
    const adaMaks = b.batasKata != null;
    const u = unsurTerisi(b).map((x) => x.unsur.trim());
    const awal = `Isian ${nama.toLowerCase()}`;
    if (adaMin && adaMaks) kalimat.push(`${awal} sebanyak ${b.batasMin} sampai {batas} kata${u.length ? ` yang memuat ${sebutkan(u)}` : ""}`);
    else if (adaMaks) kalimat.push(`${awal} tidak lebih dari {batas} kata${u.length ? ` yang memuat ${sebutkan(u)}` : ""}`);
    else if (adaMin) kalimat.push(`${awal} sekurang-kurangnya ${b.batasMin} kata${u.length ? ` yang memuat ${sebutkan(u)}` : ""}`);
    else kalimat.push(u.length ? `${awal} yang memuat ${sebutkan(u)}` : `Isian ${nama.toLowerCase()}`);
  }
  if (b.jenisIsian === "daftar" || b.jenisIsian === "tabel") {
    const u = unsurTerisi(b).map((x) => x.unsur.trim());
    if (u.length) kalimat.push(`Isian memuat ${sebutkan(u)}`);
  }
  if (b.wajibGambar) kalimat.push(`Pada bagian ini wajib dilengkapi dengan ${keteranganGambar(b)} (format JPG/PNG)`);
  if (b.wajibTabel && b.jenisIsian !== "tabel") {
    const k = kolomTerisi(b);
    kalimat.push(`Pada bagian ini wajib dilengkapi dengan tabel${k.length ? ` yang berkolom ${sebutkan(k)}` : ""}`);
  }
  if (b.sitasiBernomor && !adalahDaftarPustaka(b)) kalimat.push("Sitasi disusun dan ditulis berdasarkan sistem nomor sesuai dengan urutan pengutipan");
  const f = frasaTerisi(b);
  if (f.length) kalimat.push(`Wajib memuat kalimat: ${f.map((x) => `"${x}"`).join("; ")}`);
  return `${kalimat.join(". ").replace(/\.$/, "")}.`;
}

/**
 * Melengkapi bagian templat: `huruf` dari urutan, dan ketentuan yang masih null (baris lama sebelum 23 Okt 2026) diturunkan dari nama
 * bagian Isian Substansi (selain itu teks tanpa ketentuan lain). Ketentuan baru (batas minimal, tabel, frasa, unsur isi) tidak diturunkan
 * untuk baris lama. `petunjuk` tidak diubah; baca lewat `petunjukBagian`.
 */
export function lengkapiBagian(bagian: BagianTemplatDto[]): BagianTemplatDto[] {
  const urut = [...bagian].sort((a, b) => a.urutan - b.urutan);
  return urut.map((b, i) => {
    const d = cari(b.nama);
    let jenisIsian: JenisIsian = b.jenisIsian ?? d?.jenisIsian ?? "teks";
    const daftarPustaka = (b.daftarPustaka ?? d?.daftarPustaka ?? false) || jenisIsian === "daftar_pustaka";
    if (daftarPustaka) jenisIsian = "daftar_pustaka";
    const wajibGambar = b.wajibGambar ?? d?.wajibGambar ?? false;
    const kolomTabel = b.kolomTabel ?? (b.jenisIsian == null ? (d?.kolomTabel ?? null) : null);
    return {
      ...b,
      huruf: hurufBagian(i),
      jenisIsian,
      jumlahButir: jenisIsian === "daftar" ? (b.jumlahButir ?? d?.jumlahButir ?? null) : null,
      pemisah: jenisIsian === "daftar" ? (b.pemisah ?? d?.pemisah ?? null) : null,
      wajibGambar,
      sitasiBernomor: b.sitasiBernomor ?? d?.sitasiBernomor ?? false,
      daftarPustaka,
      batasMin: b.batasMin ?? null,
      wajibTabel: b.wajibTabel ?? false,
      kolomTabel: kolomTabel && kolomTabel.length ? kolomTabel : null,
      judulTabel: b.judulTabel ?? (b.jenisIsian == null ? (d?.judulTabel ?? null) : null),
      ketGambar: wajibGambar ? (b.ketGambar ?? d?.ketGambar ?? null) : null,
      frasaWajib: b.frasaWajib && b.frasaWajib.length ? b.frasaWajib : null,
      unsurIsi: b.unsurIsi && b.unsurIsi.length ? b.unsurIsi : null,
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
  batasMin?: number | null;
  wajibTabel?: boolean | null;
  kolomTabel?: string[] | null;
  judulTabel?: string | null;
  ketGambar?: string | null;
  frasaWajib?: string[] | null;
  unsurIsi?: UnsurIsi[] | null;
}): BagianTemplatDto {
  const lengkap = lengkapiBagian([{ ...b }])[0];
  delete lengkap.huruf; // huruf bergantung urutan dalam daftar; diisi lengkapiBagian atas seluruh daftar
  return lengkap;
}

/** Nilai kolom bagian_templat dari ketentuan bagian (tanpa templatId dan urutan). Tipe "daftar_pustaka" disimpan sebagai "teks" + daftar_pustaka true. */
export function keKolomBagian(b: Partial<BagianTemplatDto> & { nama: string; batasKata: number | null; wajib: boolean }) {
  const pustaka = b.jenisIsian === "daftar_pustaka" || b.daftarPustaka === true;
  const jenis = b.jenisIsian == null ? null : pustaka ? "teks" : (b.jenisIsian as "teks" | "daftar" | "tabel");
  return {
    nama: b.nama,
    batasKata: b.batasKata,
    wajib: b.wajib,
    petunjuk: b.petunjuk ?? null,
    jenisIsian: jenis,
    jumlahButir: b.jumlahButir ?? null,
    pemisah: b.pemisah ?? null,
    wajibGambar: b.wajibGambar ?? null,
    sitasiBernomor: b.sitasiBernomor ?? null,
    daftarPustaka: b.jenisIsian == null && b.daftarPustaka == null ? null : pustaka,
    batasMin: b.batasMin ?? null,
    wajibTabel: b.wajibTabel ?? null,
    kolomTabel: b.kolomTabel && b.kolomTabel.length ? b.kolomTabel : null,
    judulTabel: b.judulTabel ?? null,
    ketGambar: b.ketGambar ?? null,
    frasaWajib: b.frasaWajib && b.frasaWajib.length ? b.frasaWajib : null,
    unsurIsi: b.unsurIsi && b.unsurIsi.length ? b.unsurIsi : null,
  };
}

/** Ringkasan ketentuan bagian sebagai chip pendek untuk kolom J-02: "≤ 20 kata", "5 butir · pemisah ;", "gambar: diagram alir", "4 unsur isi", dst. */
export function ringkasKetentuan(b: BagianTemplatDto): string[] {
  const hasil: string[] = [];
  if (b.batasMin != null && b.batasKata != null) hasil.push(`${fmt(b.batasMin)}–${fmt(b.batasKata)} kata`);
  else if (b.batasKata != null) hasil.push(`≤ ${fmt(b.batasKata)} kata`);
  else if (b.batasMin != null) hasil.push(`≥ ${fmt(b.batasMin)} kata`);
  if (b.jenisIsian === "daftar") hasil.push(`${b.jumlahButir ?? "?"} butir · pemisah ${b.pemisah ?? "?"}`);
  if (b.jenisIsian === "tabel") hasil.push(kolomTerisi(b).length ? `tabel: ${kolomTerisi(b).length} kolom` : "tabel");
  else if (b.wajibTabel) hasil.push("tabel");
  if (b.wajibGambar) hasil.push(`gambar: ${keteranganGambar(b)}`);
  const u = unsurTerisi(b).length;
  if (u > 0) hasil.push(`${u} unsur isi`);
  const f = frasaTerisi(b).length;
  if (f > 0) hasil.push(`${f} frasa wajib`);
  if (b.sitasiBernomor) hasil.push("sitasi bernomor");
  if (adalahDaftarPustaka(b)) hasil.push("daftar pustaka");
  return hasil;
}
