import { afterAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { bimaBerkas, logAudit } from "@/db/schema";
import { ambilBerkas, simpanBerkas } from "@/lib/berkas";
import { catatLogAudit } from "@/lib/audit";

const ada = Boolean(process.env.DATABASE_URL);
const dibuat: string[] = [];

describe.skipIf(!ada)("basis data", () => {
  afterAll(async () => {
    for (const id of dibuat) await getDb().delete(bimaBerkas).where(eq(bimaBerkas.id, id));
  });

  it("berkas: simpan dan ambil (adaptor bytea bila tanpa token Blob)", async () => {
    const bytes = Buffer.from([0, 1, 2, 250, 255, 7]);
    const r = await simpanBerkas({ ruang: "bima", nama: "tes bin.bin", tipe: "application/octet-stream", bytes });
    dibuat.push(r.id);
    if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) expect(r.penyimpanan).toBe("db");
    const b = await ambilBerkas("bima", r.id);
    expect(b?.bytes.equals(bytes)).toBe(true);
    expect(await ambilBerkas("bima", "00000000-0000-0000-0000-000000000000")).toBeNull();
  });

  it("log_audit: hanya bisa ditambah", async () => {
    await catatLogAudit({ aktor: "tes", aksi: "tes.append-only", objek: "vitest" });
    const [baris] = await getDb().select().from(logAudit).where(eq(logAudit.aksi, "tes.append-only")).limit(1);
    expect(baris).toBeTruthy();
    await expect(getDb().update(logAudit).set({ aksi: "diubah" }).where(eq(logAudit.id, baris.id))).rejects.toThrow();
    await expect(getDb().delete(logAudit).where(eq(logAudit.id, baris.id))).rejects.toThrow();
    const [{ n }] = await getDb().select({ n: sql<number>`count(*)::int` }).from(logAudit).where(eq(logAudit.id, baris.id));
    expect(n).toBe(1);
  });
});
