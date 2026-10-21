/**
 * Validasi isian panel butir (J-03) dan penerjemahan "Aturan Hitung" menjadi ParameterButir terstruktur
 * yang dibaca pemeriksa (UC-06, UC-09). Murni, tanpa basis data.
 */
import type { JenisButir, ParameterButir } from "@/lib/kontrak";

export interface MasukanButir {
  jenis: JenisButir | "";
  kode: string;
  deskripsi: string;
  aturanHitung: string;
  pertanyaan: string;
  contohJawaban: string;
  /** "Bagian yang Diperiksa" (tambahan prototipe, lihat docs/perubahan-model.md) */
  bagian: string;
  /** "Lampiran yang Diperiksa" untuk butir semantik atas lampiran (opsional) */
  lampiran: string;
}

export type GalatButir = Partial<Record<keyof MasukanButir, string>>;

export interface NilaiButir {
  jenis: JenisButir;
  kode: string;
  deskripsi: string;
  parameter: ParameterButir;
  pemeriksa: string;
  komponen: string;
  aturanHitung: string | null;
  pertanyaan: string | null;
  contohJawaban: string | null;
}

export type HasilValidasiButir = { ok: true; nilai: NilaiButir } | { ok: false; galat: GalatButir };

export const MASUKAN_BUTIR_KOSONG: MasukanButir = {
  jenis: "",
  kode: "",
  deskripsi: "",
  aturanHitung: "",
  pertanyaan: "",
  contohJawaban: "",
  bagian: "",
  lampiran: "",
};

export const CONTOH_ATURAN_HITUNG =
  "Contoh: \"Kata kunci tepat lima, dipisahkan titik koma\"; \"Sitasi dalam paragraf memakai penomoran [n]\"; \"Daftar pustaka bernomor dan berurutan sesuai pengutipan\"; \"Jumlah referensi sama dengan jumlah yang dikutip\".";

const KATA_ANGKA: Record<string, number> = {
  satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10,
};

const KOMPONEN_LAMPIRAN: Record<string, string> = {
  "Surat Keterangan Mahasiswa Bimbingan": "4. Lampiran surat mahasiswa bimbingan",
  "Artikel Ketua Pengusul": "5. Artikel ketua pengusul",
  "Surat Pernyataan Mitra": "6. Surat pernyataan mitra",
};

export const PEMERIKSA_PER_TIPE: Record<ParameterButir["tipe"], string> = {
  bagian_wajib: "cocokkanStrukturJudul",
  batas_kata: "hitungKata",
  lampiran_wajib: "cekLampiran",
  kata_kunci: "cekKataKunci",
  sitasi_bernomor: "cocokkanSitasi",
  pustaka_berurutan: "cocokkanSitasi",
  jumlah_referensi_sama: "cocokkanSitasi",
  struktur_judul: "cocokkanStrukturJudul",
  judul_sama: "cocokkanStrukturJudul",
  bagian_terisi: "hitungKata",
  diagram_alir: "cekLampiran",
  semantik: "nilaiSemantik",
};

const KOMPONEN_PER_TIPE: Partial<Record<ParameterButir["tipe"], string>> = {
  kata_kunci: "2. Jumlah kata per bagian",
  sitasi_bernomor: "3. Sitasi dan daftar pustaka",
  pustaka_berurutan: "3. Sitasi dan daftar pustaka",
  jumlah_referensi_sama: "3. Sitasi dan daftar pustaka",
  struktur_judul: "Screening",
  judul_sama: "Screening",
  bagian_terisi: "1. Kesesuaian isi per bagian",
  diagram_alir: "1. Kesesuaian isi per bagian",
};

type HasilUrai = { ok: true; parameter: ParameterButir } | { ok: false; pesan: string };

/** Menerjemahkan teks "Aturan Hitung" ke parameter terstruktur. */
export function uraikanAturanHitung(teks: string, bagian: string): HasilUrai {
  const t = teks.toLowerCase();
  const butuhBagian = (tipe: "bagian_terisi" | "diagram_alir"): HasilUrai =>
    bagian ? { ok: true, parameter: { tipe, bagian } } : { ok: false, pesan: "Pilih bagian yang diperiksa untuk aturan ini." };

  if (/kata kunci/.test(t)) {
    const angka = t.match(/\b(\d{1,2})\b/)?.[1];
    const kata = Object.keys(KATA_ANGKA).find((k) => new RegExp(`\\b${k}\\b`).test(t));
    const jumlah = angka ? Number(angka) : kata ? KATA_ANGKA[kata] : 0;
    if (!jumlah) return { ok: false, pesan: "Sebutkan jumlah kata kunci, misalnya \"tepat lima\"." };
    const pemisah = /titik koma/.test(t) ? ";" : /koma/.test(t) ? "," : ";";
    return { ok: true, parameter: { tipe: "kata_kunci", jumlah, pemisah } };
  }
  if (/jumlah (referensi|pustaka|rujukan)/.test(t)) return { ok: true, parameter: { tipe: "jumlah_referensi_sama" } };
  if (/(daftar pustaka|pustaka)/.test(t) && /(urut|berurutan)/.test(t)) return { ok: true, parameter: { tipe: "pustaka_berurutan" } };
  if (/sitasi|kutipan/.test(t)) return { ok: true, parameter: { tipe: "sitasi_bernomor" } };
  if (/diagram alir/.test(t)) return butuhBagian("diagram_alir");
  if (/judul/.test(t) && /(sama|identik)/.test(t)) return { ok: true, parameter: { tipe: "judul_sama" } };
  if (/(struktur|templat sesuai|urutan bagian)/.test(t)) return { ok: true, parameter: { tipe: "struktur_judul" } };
  if (/(terisi|tidak kosong)/.test(t)) return butuhBagian("bagian_terisi");
  return { ok: false, pesan: "Aturan Hitung belum dikenali sistem. " + CONTOH_ATURAN_HITUNG };
}

export function validasiButir(m: MasukanButir): HasilValidasiButir {
  const galat: GalatButir = {};
  const kode = m.kode.trim();
  const deskripsi = m.deskripsi.trim();
  if (!kode) galat.kode = "Kode wajib diisi";
  else if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,19}$/.test(kode)) galat.kode = "Kode hanya huruf, angka, titik, garis bawah, atau tanda hubung (maks. 20)";
  if (!deskripsi) galat.deskripsi = "Deskripsi wajib diisi";
  if (m.jenis !== "deterministik" && m.jenis !== "semantik") galat.jenis = "Pilih jenis butir";

  if (m.jenis === "deterministik") {
    const aturan = m.aturanHitung.trim();
    if (!aturan) galat.aturanHitung = "Aturan Hitung wajib diisi";
    else {
      const u = uraikanAturanHitung(aturan, m.bagian);
      if (!u.ok) galat.aturanHitung = u.pesan;
      else if (Object.keys(galat).length === 0) {
        return {
          ok: true,
          nilai: {
            jenis: "deterministik",
            kode,
            deskripsi,
            parameter: u.parameter,
            pemeriksa: PEMERIKSA_PER_TIPE[u.parameter.tipe],
            komponen: KOMPONEN_PER_TIPE[u.parameter.tipe] ?? "Lainnya",
            aturanHitung: aturan,
            pertanyaan: null,
            contohJawaban: null,
          },
        };
      }
    }
  } else if (m.jenis === "semantik") {
    const pertanyaan = m.pertanyaan.trim();
    if (!pertanyaan) galat.pertanyaan = "Pertanyaan Pemeriksaan wajib diisi";
    if (!m.bagian) galat.bagian = "Pilih bagian yang diperiksa";
    if (Object.keys(galat).length === 0) {
      const lampiran = m.lampiran.trim() || undefined;
      return {
        ok: true,
        nilai: {
          jenis: "semantik",
          kode,
          deskripsi,
          parameter: { tipe: "semantik", bagian: m.bagian, ...(lampiran ? { lampiran } : {}) },
          pemeriksa: "nilaiSemantik",
          komponen: (lampiran && KOMPONEN_LAMPIRAN[lampiran]) || "1. Kesesuaian isi per bagian",
          aturanHitung: null,
          pertanyaan,
          contohJawaban: m.contohJawaban.trim() || null,
        },
      };
    }
  }
  return { ok: false, galat };
}

/** Ringkasan satu baris untuk kolom "Parameter" di tabel J-03. */
export function ringkasParameter(b: {
  jenis: JenisButir;
  aturanHitung: string | null;
  pertanyaan: string | null;
  parameter: Record<string, unknown> | null;
}): string {
  if (b.jenis === "semantik") {
    const bagian = typeof b.parameter?.bagian === "string" ? `[${b.parameter.bagian}] ` : "";
    return bagian + (b.pertanyaan ?? "-");
  }
  return b.aturanHitung ?? "-";
}
