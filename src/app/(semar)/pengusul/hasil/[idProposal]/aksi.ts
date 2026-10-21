"use server";

import { after } from "next/server";
import { wajibPengusul } from "@/lib/auth";
import { kirimUlangPengajuan } from "@/lib/pengajuan/layanan";

/** "Kirim ulang" setelah pemeriksaan gagal (BIMA tidak terjangkau atau batas waktu): ulangi langkah 3 sampai 10 UC-05. */
export async function kirimUlang(formData: FormData): Promise<void> {
  const sesi = await wajibPengusul();
  const proposalId = String(formData.get("proposalId") ?? "");
  if (!proposalId) return;
  await kirimUlangPengajuan(proposalId, sesi.akun, (kerja) => after(kerja));
}
