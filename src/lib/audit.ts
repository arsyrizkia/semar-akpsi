import { getDb } from "@/db";
import { logAudit } from "@/db/schema";

export interface EntriLogAudit {
  aktor: string;
  aksi: string;
  objek?: string;
  rincian?: Record<string, unknown>;
}

/** Hanya menambah (NFR 3.3). Tidak ada fungsi ubah/hapus, dan pemicu basis data menolaknya. */
export async function catatLogAudit(entri: EntriLogAudit): Promise<void> {
  await getDb()
    .insert(logAudit)
    .values({ aktor: entri.aktor, aksi: entri.aksi, objek: entri.objek ?? null, rincian: entri.rincian ?? null });
}
