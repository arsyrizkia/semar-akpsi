"use server";

import { ambilSesi } from "@/lib/auth";
import { kirimUlangKeBima, simpanKoreksi, simpanPermanen, simpanSementara } from "@/lib/penilaian/layanan";
import type { HasilAksi } from "@/lib/penilaian/tipe";
import type { MasukanKoreksi } from "@/lib/penilaian/validasi";

/** Akun reviewer dibaca ulang dari sesi pada setiap aksi; kepemilikan penugasan diperiksa di layanan (NFR 3.1). */
async function reviewer() {
  const s = await ambilSesi();
  return s && s.akun.peran === "reviewer" ? s.akun : null;
}

const TOLAK: HasilAksi<never> = { ok: false, galat: "Akses ditolak" };
type Isian = { umpanBalik: string; komponen: Record<string, string | undefined> };

export async function aksiSimpanKoreksi(penugasanId: string, hasilId: string, masukan: MasukanKoreksi) {
  const a = await reviewer();
  return a ? simpanKoreksi(penugasanId, a, hasilId, masukan) : TOLAK;
}

export async function aksiSimpanSementara(penugasanId: string, isian: Isian) {
  const a = await reviewer();
  return a ? simpanSementara(penugasanId, a, isian) : TOLAK;
}

export async function aksiSimpanPermanen(penugasanId: string, isian: Isian) {
  const a = await reviewer();
  return a ? simpanPermanen(penugasanId, a, isian) : TOLAK;
}

export async function aksiKirimUlang(penugasanId: string) {
  const a = await reviewer();
  return a ? kirimUlangKeBima(penugasanId, a) : TOLAK;
}
