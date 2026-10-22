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
  test: {
    environment: "node",
    // Tes tinggal di tests/ saja: tests/unit/kotak-hitam (KH-...), tests/unit/kotak-putih (KP-...), tests/integrasi (IT-..., butuh basis data uji).
    include: ["tests/**/*.test.ts"],
    testTimeout: 60_000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      // Pengecualian cakupan (dicatat di docs/rencana-uji.md): demo = pembangkit data demo, bukan logika produk;
      // berkas di bawah ini butuh basis data/jaringan nyata dan diuji lewat tests/integrasi dan e2e, bukan unit.
      exclude: [
        "src/lib/demo/**",
        "src/lib/kontrak/**", // tipe dan tanda tangan saja
        "src/lib/db*.ts",
        "src/lib/unduhan-db.ts",
        "src/lib/seed.ts",
        "src/lib/seed-butir.ts",
        "src/lib/auth.ts",
        "src/lib/audit.ts",
        "src/lib/berkas.ts",
        "src/lib/waktu.ts",
        "src/lib/bima/servis*.ts",
        "src/lib/bima/sesi.ts",
        "src/lib/bima/api.ts",
        "src/lib/**/layanan.ts", // lapisan servis yang memanggil basis data
        "src/lib/**/index.ts",
        "src/lib/aturan/akses.ts",
        "src/lib/aturan/draf.ts",
        "src/lib/penugasan/layanan.ts",
        "src/lib/pemeriksa/semantik/jalankan.ts",
        "src/lib/llm/konfigurasi.ts",
        "src/lib/contoh/**", // pembangkit berkas contoh
      ],
      reporter: ["text-summary", "json", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: { branches: 80 },
    },
  },
});
