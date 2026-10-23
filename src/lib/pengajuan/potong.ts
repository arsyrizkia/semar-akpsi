/**
 * potongTeks / potongPerBagian / ambilTeksBagian (seq-uc05): memotong blok naskah per bagian templat. Murni, tanpa basis data.
 *
 * Dua cara mengenali judul bagian:
 *  - mode berhuruf (Isian Substansi BIMA): judul "A. JUDUL" ... "H. DAFTAR PUSTAKA" (huruf besar atau kecil, spasi bebas).
 *    Semua isi sebelum bagian A (sampul, "PROTEKSI ISI PROPOSAL", bagian bernomor 1-6 ekspor BIMA) dilewati.
 *  - mode polos (naskah lama): judul bernama sama dengan bagian templat, tanpa huruf.
 * Di kedua mode kalimat petunjuk resmi bagian dibuang dari isian, dan tanda kurung siku isian pengusul "[ ... ]" dilepas.
 */
import type { BagianTemplatDto } from "../kontrak/tipe";
import { normalisasiJudul } from "../pemeriksa/deterministik/teks";
import { petunjukBagian } from "../templat/isian-substansi";
import type { BlokTeks } from "./ekstraksi";

export interface HasilPotong {
  /** judul dokumen: isi bagian Judul (mode berhuruf), selain itu blok pertama sebelum judul bagian templat yang pertama */
  judulDokumen: string;
  /** { "Nama Bagian templat": teks } hanya bagian yang ditemukan; baris dipisah \n; tanpa kalimat petunjuk dan tanda [ ] */
  teksPerBagian: Record<string, string>;
  /** judul bagian sebagaimana tertulis di naskah, berurutan (termasuk judul tingkat 1 di luar templat) */
  judulBagianDitemukan: string[];
  /** isi baris kata kunci tanpa awalan "Kata kunci:" ; semua baris bagian digabung; null bila tidak ditemukan */
  kataKunci: string | null;
}

const POLA_AWALAN_KATA_KUNCI = /^\s*kata\s*kunci\s*[:\-–]\s*/i;
/** "A. JUDUL", "a) Judul", "A.JUDUL": huruf tunggal, penanda, sisa judul */
const POLA_JUDUL_BERHURUF = /^\s*([A-Za-z])\s*[.)]\s*(\S.*?)\s*$/;
const POLA_PANDUAN = /^\s*panduan\s*:/i;
const PANJANG_JUDUL_MAKS = 100;

interface Kecocokan {
  nama: string;
  huruf: string | null;
  /** teks judul dengan spasi dibakukan ("A.JUDUL" menjadi "A. JUDUL") */
  teks: string;
}

/* ------------------------------ petunjuk ------------------------------ */

const tokenKata = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);

function jarakSatu(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let beda = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      if (++beda > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else {
        i++;
        j++;
      }
    }
  }
  return beda + (a.length - i) + (b.length - j) <= 1;
}

/** Dua token dianggap sama: persis, sama-sama angka (batas kata boleh berbeda), atau beda satu huruf pada kata panjang (salah ketik). */
function tokenSama(a: string, b: string): boolean {
  if (a === b) return true;
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) return true;
  return a.length >= 5 && b.length >= 5 && jarakSatu(a, b);
}

/**
 * Membuang baris-baris pembuka isi bagian yang membentuk kalimat petunjuk (boleh terpecah beberapa baris/paragraf), dan baris
 * "Panduan: ..." buatan generator templat untuk bagian di luar Isian Substansi. Pencocokan kata demi kata.
 */
export function buangPetunjuk(baris: string[], petunjuk: string | null): string[] {
  let mulai = 0;
  // baris kosong dan baris "Panduan: ..." di awal dibuang
  while (mulai < baris.length && (!baris[mulai].trim() || POLA_PANDUAN.test(baris[mulai]))) mulai++;
  if (!petunjuk) return baris.slice(mulai);
  const target = tokenKata(petunjuk);
  if (target.length === 0) return baris.slice(mulai);
  let pos = 0;
  let i = mulai;
  while (i < baris.length && pos < target.length) {
    const t = tokenKata(baris[i]);
    if (t.length === 0 || t.length > target.length - pos) break;
    if (!t.every((k, j) => tokenSama(k, target[pos + j]))) break;
    pos += t.length;
    i++;
  }
  // petunjuk dianggap ada bila hampir seluruh kalimatnya terbaca (toleran terhadap kalimat yang dipotong penyunting)
  return pos >= Math.ceil(target.length * 0.8) ? baris.slice(i) : baris.slice(mulai);
}

/* ------------------------------ tanda isian [ ... ] ------------------------------ */

const adalahSitasiAwal = (s: string) => /^\[\s*\d+\s*\]/.test(s);
const hitung = (s: string, c: string) => s.split(c).length - 1;

/**
 * Melepas "[" pembuka pada baris isi pertama dan "]" penutup pada baris isi terakhir; "[ … ]" kosong menjadi tanpa isi.
 * Baris yang hanya berisi "[" di awal atau "]" di akhir selalu dibuang (sisa tanda templat, juga bila pasangannya tidak terbaca).
 */
export function lepasTandaIsian(baris: string[]): string[] {
  // tempat isian kosong "[ ]" dan tempat gambar "[Sisipkan ...]" dari generator templat bukan isi pengusul
  const hasil = baris.map((b) => b.trim()).filter((b) => b && !/^\[\s*(?:…|\.{3})?\s*\]$/.test(b) && !/^\[\s*sisipkan\b[^\]]*\]$/i.test(b) && !/^\[\d+\]$/.test(b) && !/^\[\s*kata kunci 1\b[^\]]*kata kunci 2\b[^\]]*\]$/i.test(b));
  if (hasil.length === 0) return [];
  if (hasil[hasil.length - 1] === "]") hasil.pop();
  if (hasil[0] === "[") hasil.shift();
  if (hasil.length === 0) return [];
  const pertama = hasil[0];
  if (pertama.startsWith("[") && !adalahSitasiAwal(pertama) && !/^\[(?:tabel|gambar)\]$/i.test(pertama)) {
    hasil[0] = pertama.slice(1).trim();
    const akhir = hasil.length - 1;
    const terakhir = hasil[akhir];
    if (terakhir.endsWith("]") && !/^\[(?:tabel|gambar)\]$/i.test(terakhir) && hitung(terakhir, "]") > hitung(terakhir, "[")) hasil[akhir] = terakhir.slice(0, -1).trim();
  }
  return hasil.filter((b) => b !== "" && !/^(?:…|\.{3})$/.test(b));
}

/* ------------------------------ lampiran yang ikut diekspor ------------------------------ */

/** Awal halaman lampiran/persetujuan yang ditempel BIMA sesudah Isian Substansi (surat pernyataan mitra, persetujuan pengusul/LPPM). */
const POLA_AWAL_LAMPIRAN_EKSPOR = /^(?:lampiran\s+\d+\b.{0,60}|kop\s+instansi\b.{0,60}|surat\s+(?:pernyataan|keterangan|kesediaan|dukungan)\b.{0,40}|persetujuan\s+pengusul|lembar\s+(?:pengesahan|persetujuan))$/i;
/** Baris kop surat tepat sebelum judul surat: huruf kapital semua, berawalan alamat/kontak, atau baris alamat pendek tanpa tautan/titik. */
const POLA_KOP_SURAT = /^(?:jalan|jl\.|kampus|telepon|telp\.?|laman|pos-el|faksimile|fax|email|e-mail)\b|\[at\]/i;

function barisKop(b: string): boolean {
  const t = b.trim();
  if (!t) return true;
  const huruf = t.replace(/[^\p{L}]/gu, "");
  if (POLA_KOP_SURAT.test(t) || (huruf.length >= 6 && huruf === huruf.toUpperCase())) return true;
  return t.length <= 45 && !/^\[?\d|https?:|doi|[.;]$/i.test(t);
}

/**
 * Ekspor BIMA menempelkan halaman lampiran dan persetujuan sesudah bagian terakhir (Daftar Pustaka). Bagian terakhir dipotong pada
 * judul surat pertama ("SURAT PERNYATAAN", "PERSETUJUAN PENGUSUL", ...) berikut kop suratnya; isi halaman itu bukan naskah proposal.
 */
export function buangLampiranEkspor(baris: string[]): string[] {
  const i = baris.findIndex((b) => POLA_AWAL_LAMPIRAN_EKSPOR.test(b.trim()));
  if (i < 0) return baris;
  let akhir = i;
  while (akhir > 0 && barisKop(baris[akhir - 1])) akhir--;
  return baris.slice(0, akhir);
}

const POLA_AWAL_ENTRI_PUSTAKA = /^\s*\[?\s*(\d+)\s*[\].)]\s+\S/;
const MAKS_BARIS_ENTRI_TERAKHIR = 8;
/** Baris yang menutup sebuah entri: berakhir titik (bukan inisial nama, mis. "Raskin, J. P.") atau tautan. */
const menutupEntri = (b: string) => /https?:\S*\s*$/.test(b) || (/\.\s*$/.test(b) && !/(?:^|[\s.])[A-Z]\.\s*$/.test(b));

/**
 * Ekspor BIMA juga menempelkan berkas lampiran (mis. artikel ketua pengusul utuh) tepat sesudah daftar pustaka. Daftar pustaka bernomor
 * berurutan 1, 2, ..., N dipotong sesudah entri terakhir N: baris lanjutan entri itu dibawa sampai baris yang menutup entri (berakhir titik
 * selain inisial nama, atau tautan) atau paling banyak delapan baris. Tanpa deretan bernomor sekurang-kurangnya tiga entri, baris dibiarkan.
 */
export function potongDaftarPustakaEkspor(baris: string[]): string[] {
  let terakhir = 0;
  let indeks = -1;
  let rantai = 0;
  baris.forEach((b, i) => {
    const m = POLA_AWAL_ENTRI_PUSTAKA.exec(b);
    if (m && Number(m[1]) === terakhir + 1) {
      terakhir++;
      indeks = i;
      rantai++;
    }
  });
  if (rantai < 3) return baris;
  let akhir = indeks + 1;
  const batas = Math.min(baris.length, indeks + MAKS_BARIS_ENTRI_TERAKHIR);
  while (akhir < batas && !menutupEntri(baris[akhir - 1]) && Number(POLA_AWAL_ENTRI_PUSTAKA.exec(baris[akhir])?.[1]) !== terakhir + 1) akhir++;
  return baris.slice(0, akhir);
}

/* ------------------------------ pemotong ------------------------------ */

function cocokkan(b: BlokTeks, nama: Map<string, string>, berhuruf: boolean): Kecocokan | null {
  if (b.jenis !== "judul" && b.jenis !== "paragraf") return null;
  const teks = b.teks.trim();
  if (!teks || teks.length > PANJANG_JUDUL_MAKS) return null;
  const m = POLA_JUDUL_BERHURUF.exec(teks);
  if (m) {
    const n = nama.get(normalisasiJudul(m[2]));
    if (n) return { nama: n, huruf: m[1].toUpperCase(), teks: `${m[1]}. ${m[2]}` };
  }
  if (berhuruf) {
    // mode berhuruf: judul tanpa huruf hanya diakui bila benar-benar judul (gaya Heading) di berkas DOCX
    const n = b.jenis === "judul" ? nama.get(normalisasiJudul(teks)) : undefined;
    return n ? { nama: n, huruf: null, teks } : null;
  }
  const n = nama.get(normalisasiJudul(teks));
  if (n && (b.jenis === "judul" || teks.length <= 80)) return { nama: n, huruf: null, teks };
  return null;
}

/**
 * ambilTeksBagian(teks) pada setiap bagian: bagian dimulai pada blok judul yang namanya sama dengan nama bagian templat
 * (judul berhuruf "A. JUDUL", atau paragraf pendek yang isinya hanya nama bagian), dan berakhir pada judul bagian berikutnya.
 */
export function potongPerBagian(blok: BlokTeks[], bagian: BagianTemplatDto[]): HasilPotong {
  const nama = new Map(bagian.map((b) => [normalisasiJudul(b.nama), b.nama]));
  const petunjuk = new Map(bagian.map((b) => [b.nama, petunjukBagian(b)]));

  // mode berhuruf: sekurang-kurangnya dua bagian templat berbeda muncul sebagai judul berhuruf
  const berhuruf =
    new Set(blok.map((b) => cocokkan(b, nama, false)).filter((k): k is Kecocokan => k !== null && k.huruf !== null).map((k) => k.nama)).size >= 2;

  const teksPerBagian: Record<string, string[]> = {};
  const ditemukan: string[] = [];
  const sudahAda = new Set<string>();
  let aktif: string | null = null; // nama bagian templat yang sedang diisi
  let diLuarTemplat = false; // sedang di bawah judul tingkat 1 yang bukan bagian templat
  let mulai = false;
  const sebelum: string[] = [];

  for (const b of blok) {
    const k = cocokkan(b, nama, berhuruf);
    if (k && !sudahAda.has(k.nama)) {
      sudahAda.add(k.nama);
      ditemukan.push(k.teks);
      aktif = k.nama;
      diLuarTemplat = false;
      mulai = true;
      teksPerBagian[k.nama] = [];
      continue;
    }
    if (b.jenis === "judul" && (b.tingkat ?? 1) <= 1 && mulai) {
      // judul tingkat 1 di luar templat: akhir bagian sebelumnya, isinya tidak dipakai (judul halaman lampiran tidak dicatat sebagai judul asing)
      if (!POLA_AWAL_LAMPIRAN_EKSPOR.test(b.teks.trim())) ditemukan.push(b.teks);
      aktif = null;
      diLuarTemplat = true;
      continue;
    }
    if (!mulai) {
      sebelum.push(b.teks);
      continue;
    }
    if (aktif && !diLuarTemplat) teksPerBagian[aktif].push(b.teks);
  }

  const hasil: Record<string, string> = {};
  const terakhir = ditemukan.length ? [...sudahAda].pop() : undefined; // bagian templat yang muncul paling akhir
  for (const b of bagian) {
    let mentah = teksPerBagian[b.nama];
    if (!mentah) continue;
    if (berhuruf && b.nama === terakhir) {
      mentah = buangLampiranEkspor(mentah);
      if (normalisasiJudul(b.nama) === "daftar pustaka") mentah = potongDaftarPustakaEkspor(mentah);
    }
    hasil[b.nama] = lepasTandaIsian(buangPetunjuk(mentah, petunjuk.get(b.nama) ?? null)).join("\n");
  }

  const kunciJudul = Object.keys(hasil).find((x) => normalisasiJudul(x) === "judul");
  // mode berhuruf: judul dokumen = isi bagian Judul (sebelum bagian A hanya sampul dan identitas ekspor BIMA)
  const judulDokumen = berhuruf
    ? kunciJudul
      ? hasil[kunciJudul].split("\n").join(" ").trim()
      : ""
    : (sebelum.find((t) => t.trim().length > 0) ?? "");

  // kata kunci: bagian "Kata Kunci" (semua barisnya, karena isian dapat terpecah baris) atau baris "Kata kunci: ..." di mana pun
  let kataKunci: string | null = null;
  const kunciKK = Object.keys(hasil).find((x) => normalisasiJudul(x) === "kata kunci");
  if (kunciKK) {
    const gabung = hasil[kunciKK].split("\n").map((x) => x.trim()).filter(Boolean).join(" ");
    kataKunci = gabung.replace(POLA_AWALAN_KATA_KUNCI, "").trim();
  } else {
    const ada = blok.find((b) => b.jenis === "paragraf" && POLA_AWALAN_KATA_KUNCI.test(b.teks));
    kataKunci = ada ? ada.teks.replace(POLA_AWALAN_KATA_KUNCI, "").trim() : null;
  }
  return { judulDokumen, teksPerBagian: hasil, judulBagianDitemukan: ditemukan, kataKunci: kataKunci || null };
}

/** potongTeks(): blok naskah → teks per bagian sesuai templat skema. */
export const potongTeks = potongPerBagian;
