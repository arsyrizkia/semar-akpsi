import path from "node:path";
import { defineConfig } from "vitest/config";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* tanpa .env.local: tes basis data dilewati */
}

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { environment: "node", include: ["tests/**/*.test.ts", "src/**/*.test.ts"], testTimeout: 60_000, fileParallelism: false },
});
