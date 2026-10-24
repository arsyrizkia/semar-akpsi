"use server";

import { pelakuPengelola, PESAN_BUKAN_PENGELOLA } from "@/lib/aturan/akses";
import { simpanDrafTemplat, susunVersiBaru, terbitkan, type HasilSimpanDraf, type HasilTerbitkan, type TemplatTampil } from "@/lib/templat/layanan";
import type { MasukanKelengkapan } from "@/lib/templat/kelengkapan";

export type HasilSusun = { ok: true; templat: TemplatTampil; dilanjutkan: boolean } | { ok: false; pesan: string };

/** Tombol "Susun Versi Baru" (UC-01 langkah 4, S-1, S-3). */
export async function aksiSusunVersiBaru(skemaId: string, periodeId: string | null = null): Promise<HasilSusun> {
  const pelaku = await pelakuPengelola();
  if (!pelaku) return { ok: false, pesan: PESAN_BUKAN_PENGELOLA };
  try {
    const r = await susunVersiBaru(skemaId, pelaku, periodeId);
    return { ok: true, ...r };
  } catch (e) {
    return { ok: false, pesan: e instanceof Error ? e.message : "Gagal menyusun versi baru." };
  }
}

/** "Simpan Draf" dan "Unduh Pratinjau (.docx)" (J-02b): menyimpan isian yang belum tentu lengkap. */
export async function aksiSimpanDraf(skemaId: string, templatId: string, isian: MasukanKelengkapan): Promise<HasilSimpanDraf> {
  const pelaku = await pelakuPengelola();
  if (!pelaku) return { ok: false, pesan: PESAN_BUKAN_PENGELOLA };
  try {
    return await simpanDrafTemplat({ skemaId, templatId, isian, pelaku });
  } catch (e) {
    return { ok: false, pesan: e instanceof Error ? e.message : "Gagal menyimpan draf." };
  }
}

export type HasilAksiTerbitkan = { ok: true; hasil: HasilTerbitkan } | { ok: false; pesan: string };

/** Tombol "Terbitkan" di M-01 (UC-01 langkah 7 sampai 10, S-2, 9a). */
export async function aksiTerbitkan(skemaId: string, templatId: string, isian: MasukanKelengkapan): Promise<HasilAksiTerbitkan> {
  const pelaku = await pelakuPengelola();
  if (!pelaku) return { ok: false, pesan: PESAN_BUKAN_PENGELOLA };
  try {
    return { ok: true, hasil: await terbitkan({ skemaId, templatId, isian, pelaku }) };
  } catch (e) {
    return { ok: false, pesan: e instanceof Error ? e.message : "Gagal menerbitkan templat." };
  }
}
