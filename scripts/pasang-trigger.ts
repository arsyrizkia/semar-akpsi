/** Memasang pemicu yang menjadikan log_audit append-only (NFR 3.3). Idempoten. */
import { Pool } from "@neondatabase/serverless";
import { pasangProxyLokal } from "../src/db";

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diatur");
  pasangProxyLokal();
  const pool = new Pool({ connectionString: url });
  await pool.query(`
    CREATE OR REPLACE FUNCTION log_audit_tolak_ubah() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'log_audit hanya boleh ditambah (append-only)';
    END;
    $$ LANGUAGE plpgsql;
  `);
  await pool.query(`DROP TRIGGER IF EXISTS log_audit_append_only ON log_audit;`);
  await pool.query(`
    CREATE TRIGGER log_audit_append_only BEFORE UPDATE OR DELETE ON log_audit
    FOR EACH ROW EXECUTE FUNCTION log_audit_tolak_ubah();
  `);
  // Idempotensi kotak masuk BIMA tiruan: satu kunci per jenis pesan. Duplikat lama dibuang dulu (simpan baris tertua).
  await pool.query(`
    DELETE FROM bima_kotak_masuk a USING bima_kotak_masuk b
    WHERE (a.payload->>'kunci') IS NOT NULL AND a.jenis = b.jenis AND a.payload->>'kunci' = b.payload->>'kunci'
      AND (a.diterima_pada, a.id) > (b.diterima_pada, b.id);
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS bima_kotak_masuk_kunci_uq ON bima_kotak_masuk (jenis, (payload->>'kunci'))
    WHERE (payload->>'kunci') IS NOT NULL;
  `);
  await pool.end();
  console.log("Pemicu log_audit append-only dan indeks unik kunci kotak masuk BIMA terpasang.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
