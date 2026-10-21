/** Memasang pemicu yang menjadikan log_audit append-only (NFR 3.3). Idempoten. */
import { Pool } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diatur");
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
  await pool.end();
  console.log("Pemicu log_audit append-only terpasang.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
