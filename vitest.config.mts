import path from "node:path";
import { defineConfig } from "vitest/config";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* tanpa .env.local: tes basis data dilewati */
}

// Penjaga basis data: DATABASE_URL hasil `vercel env pull` sama dengan basis data produksi yang dipakai bersama.
// Tes integrasi menulis ke basis data (menghapus proposal, membalik sakelar masa, menulis log audit), jadi hanya jalan
// bila ada basis data uji khusus (DATABASE_URL_UJI) atau bila diizinkan eksplisit (SEMAR_IZINKAN_DB_PRODUKSI=1).
if (process.env.DATABASE_URL_UJI) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_UJI;
  process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UJI_UNPOOLED ?? process.env.DATABASE_URL_UJI;
} else if (process.env.SEMAR_IZINKAN_DB_PRODUKSI !== "1") {
  delete process.env.DATABASE_URL; // tes yang butuh basis data dilewati (describe.skipIf)
  delete process.env.DATABASE_URL_UNPOOLED;
}

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { environment: "node", include: ["tests/**/*.test.ts", "src/**/*.test.ts"], testTimeout: 60_000, fileParallelism: false },
});
