"use server";

import { revalidatePath } from "next/cache";
import { jalankanSeed } from "@/lib/seed";
import { ubahPengaturanDemo } from "@/lib/waktu";
import { catatLogAudit } from "@/lib/audit";

export async function resetDemo(): Promise<{ ok: boolean; pesan: string }> {
  try {
    const r = await jalankanSeed({ reset: true });
    await catatLogAudit({ aktor: "demo", aksi: "demo.reset", objek: "seed", rincian: { akun: r.akun, skema: r.skema } });
    revalidatePath("/demo");
    return { ok: true, pesan: "Data demo direset dan diisi ulang." };
  } catch (e) {
    return { ok: false, pesan: `Reset gagal: ${e instanceof Error ? e.message : "galat tak dikenal"}` };
  }
}

export async function setSakelarMasa(nilai: "berjalan" | "ditutup"): Promise<{ ok: boolean; pesan: string }> {
  if (nilai !== "berjalan" && nilai !== "ditutup") return { ok: false, pesan: "Nilai tidak valid." };
  await ubahPengaturanDemo({ masaPengusulan: nilai });
  await catatLogAudit({ aktor: "demo", aksi: "demo.sakelar_masa", objek: "pengaturan_demo", rincian: { masaPengusulan: nilai } });
  revalidatePath("/demo");
  return { ok: true, pesan: `Masa pengusulan: ${nilai}.` };
}
