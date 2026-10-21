import { getDb, type Db } from "@/db";
import { logAudit } from "@/db/schema";

export interface EntriLogAudit {
  aktor: string;
  aksi: string;
  objek?: string;
  rincian?: Record<string, unknown>;
}

/** Hanya menambah (NFR 3.3). Tidak ada fungsi ubah/hapus, dan pemicu basis data menolaknya. */
export async function catatLogAudit(entri: EntriLogAudit, ex: Pick<Db, "insert"> = getDb()): Promise<void> {
  await ex
    .insert(logAudit)
    .values({ aktor: entri.aktor, aksi: entri.aksi, objek: entri.objek ?? null, rincian: entri.rincian ?? null });
}
