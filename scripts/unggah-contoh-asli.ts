/**
 * Sekali jalan, lokal: masukkan empat PDF contoh proposal BIMA asli (data/uji-nyata, .gitignore) ke tabel contoh_asli sebagai dokumen
 * "Uji pada Contoh" di produksi (keputusan Arsy 26 Okt 2026), lalu daftarkan ke dokumen_contoh. Berkas tidak pernah masuk git; tabel
 * contoh_asli tidak ikut dikosongkan "Reset & isi data demo". Aman diulang (upsert per kode).
 *
 *   node_modules/.bin/tsx --env-file=.env.local scripts/unggah-contoh-asli.ts
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getDb } from "../src/db";
import { contohAsli } from "../src/db/schema";
import { daftarkanContohAsli, pastikanTabelContohAsli } from "../src/lib/aturan/contoh-asli";

const DIR = path.join(process.cwd(), "data", "uji-nyata");
// skema mengikuti tests/unit/kotak-hitam/uji-nyata-ketentuan.test.ts (no. 5 Penelitian Terapan)
const BERKAS = [
  { berkas: "1. Contoh Proposal Soshum.pdf", nomor: 1, skema: "PD", ket: "Soshum" },
  { berkas: "5. Contoh Proposal Soshum.pdf", nomor: 5, skema: "PT", ket: "Soshum" },
  { berkas: "6. Contoh Proposal.pdf", nomor: 6, skema: "PD", ket: null },
  { berkas: "10. Contoh Proposal.pdf", nomor: 10, skema: "PD", ket: null },
] as const;
const NAMA_SKEMA = { PD: "Penelitian Dasar", PT: "Penelitian Terapan" } as const;

async function utama() {
  const kurang = BERKAS.filter((b) => !existsSync(path.join(DIR, b.berkas)));
  if (kurang.length) throw new Error(`PDF tidak ditemukan di data/uji-nyata: ${kurang.map((b) => b.berkas).join(", ")}`);
  await pastikanTabelContohAsli();
  const db = getDb();
  for (const b of BERKAS) {
    const bytes = readFileSync(path.join(DIR, b.berkas));
    const nilai = {
      nama: `PDF asli BIMA no. ${b.nomor} (${NAMA_SKEMA[b.skema]}${b.ket ? `, ${b.ket}` : ""})`,
      skemaKode: b.skema,
      namaBerkas: b.berkas,
      tipe: "application/pdf",
      ukuran: bytes.length,
      bytes,
    };
    await db.insert(contohAsli).values({ kode: `pdf-asli-${String(b.nomor).padStart(2, "0")}`, ...nilai }).onConflictDoUpdate({ target: contohAsli.kode, set: nilai });
    console.log("unggah", b.berkas, `${(bytes.length / 1_048_576).toFixed(2)} MB`);
  }
  for (const h of await daftarkanContohAsli()) console.log("daftar", h.kode, h.nama, `bagian dikenali ${h.bagianDikenali}/${h.bagianTemplat}`, `gambar ${h.gambar}`);
}

utama()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
