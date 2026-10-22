"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { wajibTimKerja } from "@/lib/auth";
import { tandaiButir } from "@/lib/pemantauan/layanan";

export interface HasilTandaiAksi {
  ditandai: string[];
  galat?: string;
}

const masukan = z.object({
  periodeId: z.string().uuid(),
  skemaId: z.string().uuid(),
  kode: z.array(z.string().min(1).max(40)).max(200),
});

/** UC-04 s.6-7: "Tandai Butir". Boleh dilakukan Tim Kerja DPPM mana pun (hanya penanda, bukan perubahan aturan). */
export async function aksiTandaiButir(periodeId: string, skemaId: string, kode: string[]): Promise<HasilTandaiAksi> {
  const sesi = await wajibTimKerja();
  const ok = masukan.safeParse({ periodeId, skemaId, kode });
  if (!ok.success) return { ditandai: [], galat: "Pilih minimal satu butir dengan mencentang “Perlu Diperbaiki”." };
  if (!ok.data.kode.length) return { ditandai: [], galat: "Pilih minimal satu butir dengan mencentang “Perlu Diperbaiki”." };
  try {
    const { ditandai } = await tandaiButir(ok.data.skemaId, ok.data.periodeId, ok.data.kode, sesi.akun.id, sesi.akun.idBima);
    revalidatePath("/tim-kerja/pemantauan");
    revalidatePath("/tim-kerja/proposal", "layout");
    revalidatePath("/tim-kerja/aturan");
    return { ditandai };
  } catch (e) {
    return { ditandai: [], galat: e instanceof Error ? e.message : "Butir gagal ditandai." };
  }
}
