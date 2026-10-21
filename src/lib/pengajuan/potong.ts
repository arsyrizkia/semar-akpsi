/**
 * potongTeks / potongPerBagian / ambilTeksBagian (seq-uc05): memotong blok naskah per bagian templat.
 * Murni, tanpa basis data.
 */
import type { BagianTemplatDto } from "../kontrak/tipe";
import { normalisasiJudul } from "../pemeriksa/deterministik/teks";
import type { BlokTeks } from "./ekstraksi";

export interface HasilPotong {
  /** judul dokumen: blok pertama sebelum judul bagian templat yang pertama */
  judulDokumen: string;
  /** { "Nama Bagian templat": teks } hanya bagian yang ditemukan; baris dipisah \n */
  teksPerBagian: Record<string, string>;
  /** judul bagian sebagaimana tertulis di naskah, berurutan (termasuk judul tingkat 1 di luar templat) */
  judulBagianDitemukan: string[];
  /** isi baris kata kunci tanpa awalan "Kata kunci:" ; null bila tidak ditemukan */
  kataKunci: string | null;
}

const POLA_AWALAN_KATA_KUNCI = /^\s*kata\s*kunci\s*[:\-–]\s*/i;

/**
 * ambilTeksBagian(teks) pada setiap bagian: bagian dimulai pada blok judul yang namanya sama dengan nama bagian templat
 * (atau paragraf pendek yang isinya hanya nama bagian, mis. pada PDF), dan berakhir pada judul bagian berikutnya.
 */
export function potongPerBagian(blok: BlokTeks[], bagian: BagianTemplatDto[]): HasilPotong {
  const nama = new Map(bagian.map((b) => [normalisasiJudul(b.nama), b.nama]));
  const teksPerBagian: Record<string, string[]> = {};
  const ditemukan: string[] = [];
  const sudahAda = new Set<string>();
  let judulDokumen = "";
  let aktif: string | null = null; // nama bagian templat yang sedang diisi
  let diLuarTemplat = false; // sedang di bawah judul tingkat 1 yang bukan bagian templat
  let mulai = false;
  const sebelum: string[] = [];

  for (const b of blok) {
    const norm = normalisasiJudul(b.teks);
    const namaCocok = nama.get(norm);
    const calonJudul = b.jenis === "judul" || (b.jenis === "paragraf" && b.teks.length <= 80);
    if (namaCocok && calonJudul && !sudahAda.has(namaCocok)) {
      sudahAda.add(namaCocok);
      ditemukan.push(b.teks);
      aktif = namaCocok;
      diLuarTemplat = false;
      mulai = true;
      teksPerBagian[namaCocok] = [];
      continue;
    }
    if (b.jenis === "judul" && (b.tingkat ?? 1) <= 1 && mulai) {
      // judul tingkat 1 di luar templat: akhir bagian sebelumnya, isinya tidak dipakai
      ditemukan.push(b.teks);
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

  judulDokumen = sebelum.find((t) => t.trim().length > 0) ?? "";
  const hasil: Record<string, string> = {};
  for (const b of bagian) if (teksPerBagian[b.nama]) hasil[b.nama] = teksPerBagian[b.nama].join("\n");

  // kata kunci: bagian "Kata Kunci" atau baris "Kata kunci: ..." di mana pun
  let kataKunci: string | null = null;
  const kunciKK = Object.keys(hasil).find((k) => normalisasiJudul(k) === "kata kunci");
  if (kunciKK) {
    const baris = hasil[kunciKK].split("\n").find((x) => x.trim());
    kataKunci = baris ? baris.replace(POLA_AWALAN_KATA_KUNCI, "").trim() : null;
  } else {
    const ada = blok.find((b) => b.jenis === "paragraf" && POLA_AWALAN_KATA_KUNCI.test(b.teks));
    kataKunci = ada ? ada.teks.replace(POLA_AWALAN_KATA_KUNCI, "").trim() : null;
  }
  return { judulDokumen, teksPerBagian: hasil, judulBagianDitemukan: ditemukan, kataKunci: kataKunci || null };
}

/** potongTeks(): blok naskah → teks per bagian sesuai templat skema. */
export const potongTeks = potongPerBagian;
