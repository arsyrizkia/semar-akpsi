/**
 * Formulir terstruktur "Tambah Butir" / "Ubah" di tab Aturan Pemeriksaan (revisi rancangan 24 Okt 2026, menggantikan isian bebas
 * "Aturan Hitung"). Bagian > Jenis Aturan > parameter sesuai jenis > Kode dan Deskripsi otomatis. Murni, tanpa basis data.
 *
 * Satu sumber data: aturan yang menempel pada isi bagian (batas kata, daftar, tabel, gambar, sitasi, frasa, unsur isi) ditulis ke
 * ketentuan bagian templat (`terapkanKeBagian`, `hapusDariBagian`) dan butirnya diturunkan ulang (seed-butir), sehingga bagian dan
 * aturan tidak berselisih. Aturan di luar isi bagian (lampiran, judul sama, struktur judul, pertanyaan semantik bebas) tetap butir
 * manual (`bangunNilaiButir`). Sumber uji: Contract C-03 (turunkanButirCek), C-06/C-07 (simpan butir), CRC ButirCek dan BagianTemplat.
 */
import type { BagianTemplatDto, ParameterButir } from "@/lib/kontrak/tipe";
import { mentahKeBagian, type BarisBagianMentah } from "@/lib/templat/kelengkapan";
import { susunPetunjuk } from "@/lib/templat/isian-substansi";
import { PEMERIKSA_PER_TIPE, type NilaiButir } from "./parameter";
import { uraiKolomRentang } from "@/lib/templat/kolom-rentang";

export type JenisAturan =
  | "batas_kata"
  | "batas_kata_min"
  | "daftar"
  | "tabel"
  | "gambar"
  | "sitasi"
  | "frasa"
  | "unsur"
  | "lampiran_ada"
  | "lampiran_kunci"
  | "semantik_bebas"
  | "judul_sama"
  | "struktur_judul";

export interface InfoJenisAturan {
  nilai: JenisAturan;
  label: string;
  jenis: "deterministik" | "semantik";
  /** menempel pada isi bagian: disimpan di ketentuan bagian templat (satu sumber data) */
  terikatIsi: boolean;
  perluBagian: boolean;
  perluLampiran: boolean;
  /** prefiks kode butir manual */
  prefiks: string;
}

export const JENIS_ATURAN: readonly InfoJenisAturan[] = [
  { nilai: "batas_kata", label: "Batas kata maksimal", jenis: "deterministik", terikatIsi: true, perluBagian: true, perluLampiran: false, prefiks: "KTA" },
  { nilai: "batas_kata_min", label: "Batas kata minimal", jenis: "deterministik", terikatIsi: true, perluBagian: true, perluLampiran: false, prefiks: "KTM" },
  { nilai: "daftar", label: "Format daftar", jenis: "deterministik", terikatIsi: true, perluBagian: true, perluLampiran: false, prefiks: "KAT" },
  { nilai: "tabel", label: "Tabel berkolom", jenis: "deterministik", terikatIsi: true, perluBagian: true, perluLampiran: false, prefiks: "TBL" },
  { nilai: "gambar", label: "Gambar berketerangan", jenis: "deterministik", terikatIsi: true, perluBagian: true, perluLampiran: false, prefiks: "GBR" },
  { nilai: "sitasi", label: "Sitasi bernomor", jenis: "deterministik", terikatIsi: true, perluBagian: true, perluLampiran: false, prefiks: "SIT" },
  { nilai: "frasa", label: "Frasa wajib", jenis: "deterministik", terikatIsi: true, perluBagian: true, perluLampiran: false, prefiks: "FRS" },
  { nilai: "unsur", label: "Unsur isi", jenis: "semantik", terikatIsi: true, perluBagian: true, perluLampiran: false, prefiks: "UNS" },
  { nilai: "lampiran_ada", label: "Kelengkapan lampiran", jenis: "deterministik", terikatIsi: false, perluBagian: false, perluLampiran: true, prefiks: "LMP" },
  { nilai: "lampiran_kunci", label: "Kalimat kunci lampiran", jenis: "deterministik", terikatIsi: false, perluBagian: false, perluLampiran: true, prefiks: "FMT" },
  { nilai: "semantik_bebas", label: "Pertanyaan semantik bebas", jenis: "semantik", terikatIsi: false, perluBagian: true, perluLampiran: false, prefiks: "SEM" },
  { nilai: "judul_sama", label: "Judul sama dengan BIMA", jenis: "deterministik", terikatIsi: false, perluBagian: false, perluLampiran: false, prefiks: "JDL" },
  { nilai: "struktur_judul", label: "Urutan bagian sesuai templat", jenis: "deterministik", terikatIsi: false, perluBagian: false, perluLampiran: false, prefiks: "STR" },
];

export const infoJenis = (j: JenisAturan | ""): InfoJenisAturan | undefined => JENIS_ATURAN.find((x) => x.nilai === j);

/** Kelompok tanpa bagian di daftar aturan. */
export const KELOMPOK_LAMPIRAN = "Lampiran";
export const KELOMPOK_UMUM = "Umum (di luar bagian)";

export interface FormAturan {
  jenisAturan: JenisAturan | "";
  bagian: string;
  /** angka batas kata (maksimal atau minimal) */
  batas: string;
  jumlahButir: string;
  pemisah: string;
  kolom: string[];
  judulTabel: string;
  ketGambar: string;
  frasa: string;
  unsur: string;
  pertanyaan: string;
  contoh: string;
  lampiran: string;
  /** satu kalimat kunci per baris */
  kunci: string;
  kode: string;
  deskripsi: string;
}

export const FORM_ATURAN_KOSONG: FormAturan = {
  jenisAturan: "",
  bagian: "",
  batas: "",
  jumlahButir: "5",
  pemisah: ";",
  kolom: [],
  judulTabel: "",
  ketGambar: "",
  frasa: "",
  unsur: "",
  pertanyaan: "",
  contoh: "",
  lampiran: "",
  kunci: "",
  kode: "",
  deskripsi: "",
};

export type GalatFormAturan = Partial<Record<keyof FormAturan, string>>;

const bulat = (s: string) => /^\d{1,6}$/.test(s.trim()) && Number(s.trim()) > 0;

/** Validasi isian formulir; `kodeTerpakai` hanya dipakai untuk butir manual. Kosong = sah. */
export function validasiFormAturan(f: FormAturan, o: { manual: boolean; kodeTerpakai?: string[]; kodeAsal?: string }): GalatFormAturan {
  const g: GalatFormAturan = {};
  const info = infoJenis(f.jenisAturan);
  if (!info) {
    g.jenisAturan = "Pilih jenis aturan";
    return g;
  }
  if (info.perluBagian && !f.bagian) g.bagian = "Pilih bagian";
  if (info.perluLampiran && !f.lampiran) g.lampiran = "Pilih lampiran";
  switch (info.nilai) {
    case "batas_kata":
    case "batas_kata_min":
      if (!bulat(f.batas)) g.batas = "Isi angka bulat lebih dari 0";
      break;
    case "daftar":
      if (!/^\d{1,2}$/.test(f.jumlahButir.trim()) || Number(f.jumlahButir) < 1) g.jumlahButir = "Isi jumlah butir 1 sampai 99";
      if (f.pemisah.length !== 1) g.pemisah = "Pemisah harus satu karakter";
      break;
    case "tabel":
      if (f.kolom.length === 0 || f.kolom.some((k) => k.trim() === "")) g.kolom = "Isi sekurang-kurangnya satu kolom; nama kolom tidak boleh kosong";
      break;
    case "gambar":
      break;
    case "frasa":
      if (!f.frasa.trim()) g.frasa = "Frasa wajib diisi";
      break;
    case "unsur":
      if (!f.unsur.trim()) g.unsur = "Unsur isi wajib diisi";
      break;
    case "semantik_bebas":
      if (!f.pertanyaan.trim()) g.pertanyaan = "Pertanyaan pemeriksaan wajib diisi";
      break;
    case "lampiran_kunci":
      if (kunciDariTeks(f.kunci).length === 0) g.kunci = "Isi sekurang-kurangnya satu kalimat kunci";
      break;
    default:
      break;
  }
  if (o.manual) {
    const kode = f.kode.trim();
    if (!kode) g.kode = "Kode wajib diisi";
    else if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,19}$/.test(kode)) g.kode = "Kode hanya huruf, angka, titik, garis bawah, atau tanda hubung (maks. 20)";
    else if ((o.kodeTerpakai ?? []).includes(kode) && kode !== o.kodeAsal) g.kode = "Kode sudah dipakai butir lain pada versi ini";
    if (!f.deskripsi.trim()) g.deskripsi = "Deskripsi wajib diisi";
  }
  return g;
}

export const kunciDariTeks = (t: string): string[] => t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

const NAMA_PEMISAH: Record<string, string> = { ";": "titik koma", ",": "koma", "|": "garis tegak", "/": "garis miring" };
const namaPemisah = (c: string) => NAMA_PEMISAH[c] ?? `"${c}"`;

/** Deskripsi otomatis (boleh disunting untuk butir manual). */
export function deskripsiOtomatis(f: FormAturan): string {
  const b = f.bagian;
  switch (f.jenisAturan) {
    case "batas_kata":
      return `Bagian “${b}” tidak melebihi ${f.batas.trim()} kata`;
    case "batas_kata_min":
      return `Bagian “${b}” sekurang-kurangnya ${f.batas.trim()} kata`;
    case "daftar":
      return `${b}: tepat ${f.jumlahButir.trim()} butir, dipisahkan ${namaPemisah(f.pemisah)} (${f.pemisah})`;
    case "tabel": {
      const k = f.kolom.map((x) => x.trim()).filter(Boolean);
      return k.length ? `Bagian “${b}” memuat tabel berkolom ${k.join("; ")}` : `Bagian “${b}” memuat tabel`;
    }
    case "gambar":
      return `Bagian “${b}” memuat gambar (${f.ketGambar.trim() || "gambar berketerangan"})`;
    case "sitasi":
      return "Sitasi dalam paragraf memakai penomoran [n]";
    case "frasa":
      return `Bagian “${b}” memuat kalimat “${f.frasa.trim()}”`;
    case "unsur":
      return `${b} memuat ${f.unsur.trim()}`;
    case "lampiran_ada":
      return `Lampiran "${f.lampiran}" dilampirkan`;
    case "lampiran_kunci":
      return `Lampiran "${f.lampiran}" sesuai format templat`;
    case "semantik_bebas":
      return `Bagian “${b}” sesuai pertanyaan pemeriksaan`;
    case "judul_sama":
      return "Judul di naskah sama dengan judul di BIMA";
    case "struktur_judul":
      return "Urutan dan judul bagian naskah sesuai templat";
    default:
      return "";
  }
}

/** Kode otomatis untuk butir manual: prefiks jenis + "M" + nomor berikutnya yang belum dipakai. */
export function kodeOtomatis(jenis: JenisAturan | "", kodeTerpakai: string[]): string {
  const p = infoJenis(jenis)?.prefiks ?? "BTR";
  for (let n = 1; n < 1000; n++) {
    const k = `${p}-M${String(n).padStart(2, "0")}`;
    if (!kodeTerpakai.includes(k)) return k;
  }
  return `${p}-M999`;
}

/* ------------------------------ butir manual (di luar isi bagian) ------------------------------ */

const KOMPONEN_ISI = "1. Kesesuaian isi per bagian";
const KOMPONEN_KATA = "2. Jumlah kata per bagian";
const KOMPONEN_SITASI = "3. Sitasi dan daftar pustaka";

export type HasilBangun = { ok: true; nilai: NilaiButir } | { ok: false; galat: GalatFormAturan };

/** Membangun nilai butir (parameter, pemeriksa, komponen, aturan hitung otomatis) dari formulir. Dipakai butir manual. */
export function bangunNilaiButir(f: FormAturan, o: { kodeTerpakai?: string[]; kodeAsal?: string }): HasilBangun {
  const galat = validasiFormAturan(f, { manual: true, ...o });
  if (Object.keys(galat).length > 0) return { ok: false, galat };
  const info = infoJenis(f.jenisAturan)!;
  const b = f.bagian;
  const kodeDasar = { kode: f.kode.trim(), deskripsi: f.deskripsi.trim() };
  const det = (parameter: ParameterButir, komponen: string, aturanHitung: string): HasilBangun => ({
    ok: true,
    nilai: { jenis: "deterministik", ...kodeDasar, parameter, pemeriksa: PEMERIKSA_PER_TIPE[parameter.tipe], komponen, aturanHitung, pertanyaan: null, contohJawaban: null },
  });
  const kolom = f.kolom.map((x) => x.trim()).filter(Boolean);
  switch (info.nilai) {
    case "batas_kata":
      return det({ tipe: "batas_kata", bagian: b, batas: Number(f.batas) }, KOMPONEN_KATA, `Jumlah kata bagian "${b}" <= ${Number(f.batas)}; tanpa toleransi.`);
    case "batas_kata_min":
      return det({ tipe: "batas_kata_min", bagian: b, batas: Number(f.batas) }, KOMPONEN_KATA, `Jumlah kata bagian "${b}" >= ${Number(f.batas)}.`);
    case "daftar":
      return det({ tipe: "kata_kunci", jumlah: Number(f.jumlahButir), pemisah: f.pemisah, bagian: b }, KOMPONEN_KATA, `Isian bagian "${b}" berupa daftar tepat ${Number(f.jumlahButir)} butir yang dipisahkan ${namaPemisah(f.pemisah)} (${f.pemisah}).`);
    case "tabel":
      return det({ tipe: "tabel_wajib", bagian: b, ...(kolom.length ? { kolom } : {}) }, KOMPONEN_ISI, `Bagian "${b}" memuat tabel${kolom.length ? `; kolom wajib: ${kolom.join("; ")}` : ""}.`);
    case "gambar":
      return det({ tipe: "diagram_alir", bagian: b, ...(f.ketGambar.trim() ? { keterangan: f.ketGambar.trim() } : {}) }, KOMPONEN_ISI, `Bagian "${b}" memuat gambar berketerangan${f.ketGambar.trim() ? ` yang menyebut "${f.ketGambar.trim()}"` : ""}.`);
    case "sitasi":
      return det({ tipe: "sitasi_bernomor" }, KOMPONEN_SITASI, "Sitasi dalam paragraf bernomor [n]; tidak ada sitasi gaya nama-tahun.");
    case "frasa":
      return det({ tipe: "frasa_wajib", bagian: b, frasa: f.frasa.trim() }, KOMPONEN_ISI, `Kalimat "${f.frasa.trim()}" muncul persis di bagian "${b}".`);
    case "lampiran_ada":
      return det({ tipe: "lampiran_wajib", nama: f.lampiran }, "Lampiran", `Berkas lampiran "${f.lampiran}" ada pada pengajuan.`);
    case "lampiran_kunci": {
      const kunci = kunciDariTeks(f.kunci);
      return det({ tipe: "lampiran_format", nama: f.lampiran, kunci }, "Lampiran", `Berkas lampiran "${f.lampiran}" memuat kalimat kunci templat: ${kunci.map((k) => `"${k}"`).join(", ")}.`);
    }
    case "judul_sama":
      return det({ tipe: "judul_sama" }, "Screening", "Judul di naskah sama dengan judul di BIMA.");
    case "struktur_judul":
      return det({ tipe: "struktur_judul" }, "Screening", "Urutan dan judul bagian naskah sesuai templat.");
    case "unsur":
    case "semantik_bebas": {
      const lampiran = f.lampiran.trim() || undefined;
      return {
        ok: true,
        nilai: {
          jenis: "semantik",
          ...kodeDasar,
          parameter: { tipe: "semantik", bagian: b, ...(lampiran ? { lampiran } : {}) },
          pemeriksa: "nilaiSemantik",
          komponen: KOMPONEN_ISI,
          aturanHitung: null,
          pertanyaan: f.pertanyaan.trim() || `Apakah bagian ${b} memuat ${f.unsur.trim()}?`,
          contohJawaban: f.contoh.trim() || null,
        },
      };
    }
  }
  return { ok: false, galat: { jenisAturan: "Pilih jenis aturan" } };
}

/* ------------------------------ aturan yang menempel pada isi bagian (satu sumber data) ------------------------------ */

/** Penunjuk asal sebuah aturan di ketentuan bagian (untuk Ubah dan Hapus). */
export interface AsalAturan {
  jenisAturan: JenisAturan | "wajib" | "pustaka" | "lampiran";
  bagian: string | null;
  frasa?: string;
  unsur?: string;
}

/** Butir minimal yang dipetakan ke asalnya (butir hasil turunkanButirDariTemplat atau baris basis aturan asal templat). */
export interface ButirUntukAsal {
  kode: string;
  deskripsi: string;
  parameter: Record<string, unknown> | ParameterButir | null;
}

/** Memetakan butir turunan templat ke aturan asalnya di ketentuan bagian; null bila tidak dikenal. */
export function asalAturanButir(b: ButirUntukAsal): AsalAturan | null {
  const p = (b.parameter ?? {}) as Record<string, unknown>;
  const bagian = typeof p.bagian === "string" ? p.bagian : null;
  switch (p.tipe) {
    case "bagian_terisi":
      return { jenisAturan: "wajib", bagian };
    case "batas_kata":
      return { jenisAturan: "batas_kata", bagian };
    case "batas_kata_min":
      return { jenisAturan: "batas_kata_min", bagian };
    case "kata_kunci":
      return { jenisAturan: "daftar", bagian };
    case "diagram_alir":
      return { jenisAturan: "gambar", bagian };
    case "tabel_wajib":
      return { jenisAturan: "tabel", bagian };
    case "frasa_wajib":
      return { jenisAturan: "frasa", bagian, frasa: String(p.frasa ?? "") };
    case "sitasi_bernomor":
      return { jenisAturan: "sitasi", bagian };
    case "pustaka_berurutan":
    case "jumlah_referensi_sama":
      return { jenisAturan: "pustaka", bagian: typeof p.pustaka === "string" ? p.pustaka : null };
    case "lampiran_wajib":
    case "lampiran_format":
      return { jenisAturan: "lampiran", bagian: null };
    case "semantik": {
      if (b.deskripsi.startsWith("Gambar (")) return { jenisAturan: "gambar", bagian };
      const awal = `${bagian} memuat `;
      return { jenisAturan: "unsur", bagian, unsur: bagian && b.deskripsi.startsWith(awal) ? b.deskripsi.slice(awal.length) : b.deskripsi };
    }
    default:
      return null;
  }
}

/** Aturan yang dapat diubah atau dihapus lewat ketentuan bagian (bukan wajib, pustaka, lampiran). */
export const dapatDiubahDiBagian = (a: AsalAturan | null | undefined): a is AsalAturan & { jenisAturan: JenisAturan; bagian: string } =>
  a != null && a.bagian !== null && infoJenis(a.jenisAturan as JenisAturan)?.terikatIsi === true;

/** Mengisi formulir dari butir turunan (Ubah) memakai ketentuan bagian saat ini. */
export function formDariAsal(a: AsalAturan & { jenisAturan: JenisAturan; bagian: string }, b: BarisBagianMentah): FormAturan {
  const f: FormAturan = { ...FORM_ATURAN_KOSONG, jenisAturan: a.jenisAturan, bagian: a.bagian, deskripsi: "" };
  switch (a.jenisAturan) {
    case "batas_kata":
      f.batas = b.batas;
      break;
    case "batas_kata_min":
      f.batas = b.batasMin ?? "";
      break;
    case "daftar":
      f.jumlahButir = b.jumlahButir ?? "";
      f.pemisah = b.pemisah ?? "";
      break;
    case "tabel":
      f.kolom = [...(b.kolomTabel ?? [])];
      f.judulTabel = b.judulTabel ?? "";
      break;
    case "gambar":
      f.ketGambar = b.ketGambar ?? "";
      break;
    case "frasa":
      f.frasa = a.frasa ?? "";
      break;
    case "unsur": {
      const u = (b.unsurIsi ?? []).find((x) => x.unsur.trim() === (a.unsur ?? "").trim());
      f.unsur = a.unsur ?? "";
      f.pertanyaan = u?.pertanyaan ?? "";
      f.contoh = u?.contoh ?? "";
      break;
    }
    default:
      break;
  }
  f.deskripsi = deskripsiOtomatis(f);
  return f;
}

/** Petunjuk bagian ikut berubah bila masih disusun otomatis (kosong atau sama dengan susunan otomatis ketentuan lama). */
function selaraskanPetunjuk(lama: BarisBagianMentah, baru: BarisBagianMentah): BarisBagianMentah {
  const p = (lama.petunjuk ?? "").trim();
  const otomatis = p === "" || p === susunPetunjuk(mentahKeBagian(lama)).trim();
  return otomatis ? { ...baru, petunjuk: susunPetunjuk(mentahKeBagian(baru)) } : baru;
}

const ganti = <T,>(daftar: T[], i: number, x: T): T[] => (i >= 0 ? daftar.map((y, j) => (j === i ? x : y)) : [...daftar, x]);

/**
 * Menulis aturan dari formulir ke ketentuan bagian. `asal` (opsional) menunjuk entri yang diganti (frasa dan unsur isi);
 * tanpa `asal`, frasa dan unsur isi ditambahkan. Aturan skalar (batas, daftar, tabel, gambar, sitasi) menimpa nilai bagian.
 */
export function terapkanKeBagian(b: BarisBagianMentah, f: FormAturan, asal?: { frasa?: string; unsur?: string }): BarisBagianMentah {
  let baru: BarisBagianMentah = { ...b };
  switch (f.jenisAturan) {
    case "batas_kata":
      baru = { ...b, batas: f.batas.trim(), tanpaBatas: false };
      break;
    case "batas_kata_min":
      baru = { ...b, batasMin: f.batas.trim() };
      break;
    case "daftar":
      baru = { ...b, jenisIsian: "daftar", jumlahButir: f.jumlahButir.trim(), pemisah: f.pemisah, daftarPustaka: false };
      break;
    case "tabel": {
      const kolom = f.kolom.map((x) => x.trim()).filter(Boolean);
      baru = b.jenisIsian === "tabel" ? { ...b, kolomTabel: kolom, judulTabel: f.judulTabel.trim() } : { ...b, wajibTabel: true, kolomTabel: kolom, judulTabel: f.judulTabel.trim() };
      break;
    }
    case "gambar":
      baru = { ...b, wajibGambar: true, ketGambar: f.ketGambar.trim() };
      break;
    case "sitasi":
      baru = { ...b, sitasiBernomor: true };
      break;
    case "frasa": {
      const daftar = b.frasaWajib ?? [];
      const cari = asal?.frasa;
      const i = cari !== undefined ? daftar.findIndex((x) => x.trim() === cari.trim()) : -1;
      baru = { ...b, frasaWajib: ganti(daftar, i, f.frasa.trim()) };
      break;
    }
    case "unsur": {
      const daftar = b.unsurIsi ?? [];
      const cari = asal?.unsur;
      const i = cari !== undefined ? daftar.findIndex((x) => x.unsur.trim() === cari.trim()) : -1;
      baru = { ...b, unsurIsi: ganti(daftar, i, { unsur: f.unsur.trim(), pertanyaan: f.pertanyaan.trim(), contoh: f.contoh.trim() }) };
      break;
    }
    default:
      return b;
  }
  return selaraskanPetunjuk(b, baru);
}

/** Menghapus satu aturan dari ketentuan bagian (butir turunannya hilang pada penurunan berikutnya). */
export function hapusDariBagian(b: BarisBagianMentah, a: { jenisAturan: JenisAturan; frasa?: string; unsur?: string }): BarisBagianMentah {
  let baru: BarisBagianMentah = { ...b };
  switch (a.jenisAturan) {
    case "batas_kata":
      baru = { ...b, batas: "", tanpaBatas: true };
      break;
    case "batas_kata_min":
      baru = { ...b, batasMin: "" };
      break;
    case "daftar":
      baru = { ...b, jenisIsian: "teks", jumlahButir: "", pemisah: "" };
      break;
    case "tabel":
      baru = b.jenisIsian === "tabel" ? { ...b, jenisIsian: "teks", kolomTabel: [], judulTabel: "", wajibTabel: false } : { ...b, wajibTabel: false, kolomTabel: [], judulTabel: "" };
      break;
    case "gambar":
      baru = { ...b, wajibGambar: false, ketGambar: "" };
      break;
    case "sitasi":
      baru = { ...b, sitasiBernomor: false };
      break;
    case "frasa":
      baru = { ...b, frasaWajib: (b.frasaWajib ?? []).filter((x) => x.trim() !== (a.frasa ?? "").trim()) };
      break;
    case "unsur":
      baru = { ...b, unsurIsi: (b.unsurIsi ?? []).filter((x) => x.unsur.trim() !== (a.unsur ?? "").trim()) };
      break;
    default:
      return b;
  }
  return selaraskanPetunjuk(b, baru);
}

/* ------------------------------ butir manual: mengisi formulir dari butir tersimpan ------------------------------ */

export interface ButirManual {
  kode: string;
  deskripsi: string;
  jenis: "deterministik" | "semantik";
  parameter: Record<string, unknown> | null;
  pertanyaan: string | null;
  contohJawaban: string | null;
}

/** Mengisi formulir dari butir tersimpan ("Ubah"); null bila parameternya tidak dikenal formulir. */
export function formDariButir(b: ButirManual): FormAturan | null {
  const p = (b.parameter ?? {}) as Record<string, unknown>;
  const bagian = typeof p.bagian === "string" ? p.bagian : "";
  const dasar = { ...FORM_ATURAN_KOSONG, kode: b.kode, deskripsi: b.deskripsi, bagian };
  switch (p.tipe) {
    case "batas_kata":
    case "batas_kata_min":
      return { ...dasar, jenisAturan: p.tipe, batas: String(p.batas ?? "") };
    case "kata_kunci":
      return { ...dasar, jenisAturan: "daftar", jumlahButir: String(p.jumlah ?? ""), pemisah: String(p.pemisah ?? ";") };
    case "tabel_wajib":
      return { ...dasar, jenisAturan: "tabel", kolom: Array.isArray(p.kolom) ? (p.kolom as string[]) : [] };
    case "diagram_alir":
      return { ...dasar, jenisAturan: "gambar", ketGambar: String(p.keterangan ?? "") };
    case "sitasi_bernomor":
      return { ...dasar, jenisAturan: "sitasi" };
    case "frasa_wajib":
      return { ...dasar, jenisAturan: "frasa", frasa: String(p.frasa ?? "") };
    case "lampiran_wajib":
      return { ...dasar, jenisAturan: "lampiran_ada", lampiran: String(p.nama ?? "") };
    case "lampiran_format":
      return { ...dasar, jenisAturan: "lampiran_kunci", lampiran: String(p.nama ?? ""), kunci: Array.isArray(p.kunci) ? (p.kunci as string[]).join("\n") : "" };
    case "judul_sama":
      return { ...dasar, jenisAturan: "judul_sama" };
    case "struktur_judul":
      return { ...dasar, jenisAturan: "struktur_judul" };
    case "semantik":
      return { ...dasar, jenisAturan: "semantik_bebas", pertanyaan: b.pertanyaan ?? "", contoh: b.contohJawaban ?? "", lampiran: typeof p.lampiran === "string" ? p.lampiran : "" };
    default:
      return null;
  }
}

/* ------------------------------ pengelompokan di tab Aturan ------------------------------ */

export interface BarisAturan {
  kode: string;
  bagian: string | null;
  /** parameter.tipe, untuk membedakan butir lampiran */
  tipe: string | null;
  /** nama lampiran (parameter.nama atau parameter.lampiran) */
  lampiran: string | null;
}

export interface Kelompok<T> {
  /** nama bagian, KELOMPOK_LAMPIRAN, atau KELOMPOK_UMUM */
  nama: string;
  huruf: string | null;
  butir: T[];
}

/**
 * Mengelompokkan butir per bagian: bagian templat berurutan (huruf A, B, ...), bagian di luar daftar menurut kemunculan, lalu Lampiran,
 * lalu Umum. Kelompok bagian templat yang kosong tetap tampil bila `termasukKosong` (agar Tambah Butir terlihat milik siapa).
 */
export function kelompokkanAturan<T extends BarisAturan>(butir: T[], namaBagian: string[], termasukKosong = false): Kelompok<T>[] {
  const peta = new Map<string, T[]>();
  const umum: T[] = [];
  const lampiran: T[] = [];
  for (const b of butir) {
    if (b.tipe === "lampiran_wajib" || b.tipe === "lampiran_format" || (b.bagian === null && b.lampiran !== null)) lampiran.push(b);
    else if (b.bagian) peta.set(b.bagian, [...(peta.get(b.bagian) ?? []), b]);
    else umum.push(b);
  }
  const hasil: Kelompok<T>[] = [];
  namaBagian.forEach((n, i) => {
    const isi = peta.get(n) ?? [];
    peta.delete(n);
    if (isi.length > 0 || termasukKosong) hasil.push({ nama: n, huruf: i < 26 ? String.fromCharCode(65 + i) : String(i + 1), butir: isi });
  });
  for (const [n, isi] of peta) hasil.push({ nama: n, huruf: null, butir: isi });
  if (lampiran.length) hasil.push({ nama: KELOMPOK_LAMPIRAN, huruf: null, butir: lampiran });
  if (umum.length) hasil.push({ nama: KELOMPOK_UMUM, huruf: null, butir: umum });
  return hasil;
}

/** Ringkasan kolom tabel di deskripsi aturan: rentang bulan dipecah per tahun diterangkan di dokumen, bukan di sini. */
export const adaRentangKolom = (kolom: string[]): boolean => kolom.some((k) => uraiKolomRentang(k) !== null);

export type { BagianTemplatDto };
