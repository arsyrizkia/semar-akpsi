import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type Db = NeonDatabase<typeof schema>;

let _db: Db | undefined;

/** Hanya untuk basis data uji lokal: SEMAR_DB_WS_PROXY=host:port (lihat scripts/jembatan-ws-pg.mjs). Tidak aktif di produksi. */
export function pasangProxyLokal() {
  const proxy = process.env.SEMAR_DB_WS_PROXY;
  if (!proxy) return;
  neonConfig.wsProxy = () => `${proxy}/v1`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

/** Koneksi malas (lazy). Panggil di dalam fungsi/handler, bukan di tingkat modul. */
export function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL belum diatur");
    pasangProxyLokal();
    _db = drizzle(new Pool({ connectionString: url }), { schema });
  }
  return _db;
}

export { schema };
