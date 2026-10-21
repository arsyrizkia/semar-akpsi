"use server";

import { pelakuPengelola, PESAN_BUKAN_PENGELOLA } from "@/lib/aturan/akses";
import {
  nonaktifkanButir,
  periksaKunciButir,
  simpanButir,
  simpanVersiBaru,
  ujiPadaContoh,
  type HasilNonaktifkan,
  type HasilSimpanButir,
  type HasilSimpanVersi,
  type HasilUji,
} from "@/lib/aturan/layanan";
import type { MasukanButir } from "@/lib/aturan/parameter";

type Galat = { ok: false; pesan: string };
const tolak: Galat = { ok: false, pesan: PESAN_BUKAN_PENGELOLA };
const pesanGalat = (e: unknown, awal: string): Galat => ({ ok: false, pesan: e instanceof Error ? `${awal}: ${e.message}` : awal });

/** Tombol "Ubah": cek 4a di server sebelum panel isian butir dibuka. */
export async function aksiPeriksaKunci(butirId: string): Promise<{ ok: true; terkunci: boolean; pesan?: string } | Galat> {
  if (!(await pelakuPengelola())) return tolak;
  try {
    return { ok: true, ...(await periksaKunciButir(butirId)) };
  } catch (e) {
    return pesanGalat(e, "Gagal memeriksa butir");
  }
}

/** Tombol "Simpan Butir" (UC-02 langkah 5). */
export async function aksiSimpanButir(skemaId: string, butirId: string | null, masukan: MasukanButir): Promise<({ ok: true } & Extract<HasilSimpanButir, { ok: true }>) | Extract<HasilSimpanButir, { ok: false }> | Galat> {
  const pelaku = await pelakuPengelola();
  if (!pelaku) return tolak;
  try {
    return await simpanButir({ skemaId, butirId: butirId ?? undefined, masukan, pelaku });
  } catch (e) {
    return pesanGalat(e, "Gagal menyimpan butir");
  }
}

/** Tombol "Nonaktifkan" (UC-02 langkah 4). */
export async function aksiNonaktifkan(skemaId: string, butirId: string): Promise<HasilNonaktifkan | Galat> {
  const pelaku = await pelakuPengelola();
  if (!pelaku) return tolak;
  try {
    return await nonaktifkanButir({ skemaId, butirId, pelaku });
  } catch (e) {
    return pesanGalat(e, "Gagal menonaktifkan butir");
  }
}

/** Tombol "Uji pada Contoh" (UC-02 langkah 6). */
export async function aksiUji(skemaId: string, periodeId: string | null): Promise<({ ok: true } & HasilUji) | Galat> {
  if (!(await pelakuPengelola())) return tolak;
  try {
    return { ok: true, ...(await ujiPadaContoh(skemaId, periodeId)) };
  } catch (e) {
    return pesanGalat(e, "Gagal menjalankan uji");
  }
}

/** Tombol "Simpan Versi" (UC-02 langkah 7 dan 8, alur 8a). */
export async function aksiSimpanVersi(skemaId: string, periodeId: string, tanggalBerlaku: string): Promise<HasilSimpanVersi | Galat> {
  const pelaku = await pelakuPengelola();
  if (!pelaku) return tolak;
  try {
    return await simpanVersiBaru({ skemaId, periodeId, tanggalBerlaku, pelaku });
  } catch (e) {
    return pesanGalat(e, "Gagal menyimpan versi");
  }
}
