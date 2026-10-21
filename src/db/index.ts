import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type Db = NeonDatabase<typeof schema>;

let _db: Db | undefined;

/** Koneksi malas (lazy). Panggil di dalam fungsi/handler, bukan di tingkat modul. */
export function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL belum diatur");
    _db = drizzle(new Pool({ connectionString: url }), { schema });
  }
  return _db;
}

export { schema };
