import { ambilSesi } from "@/lib/auth";
import type { Pelaku } from "@/lib/templat/layanan";

export const PESAN_BUKAN_PENGELOLA = "Hanya akun dengan hak pengelola yang dapat mengubah templat dan aturan pemeriksaan.";

/** NFR 3.2: setiap aksi server J-02 dan J-03 memeriksa ulang hak pengelola (guard halaman saja tidak cukup). */
export async function pelakuPengelola(): Promise<Pelaku | null> {
  const sesi = await ambilSesi();
  if (!sesi || !sesi.pengelola) return null;
  return { id: sesi.akun.id, idBima: sesi.akun.idBima };
}
