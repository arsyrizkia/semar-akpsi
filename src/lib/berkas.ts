/**
 * Penyimpanan berkas. Memakai Vercel Blob (private) bila BLOB_READ_WRITE_TOKEN atau BLOB_STORE_ID ada;
 * bila tidak ada (atau Blob gagal), bytes disimpan di kolom bytea tabel berkas_versi (ruang "semar")
 * atau bima_berkas (ruang "bima").
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { get, put } from "@vercel/blob";
import { getDb } from "@/db";
import { berkasVersi, bimaBerkas } from "@/db/schema";

export type RuangBerkas = "semar" | "bima";

export interface MasukanBerkas {
  ruang: RuangBerkas;
  nama: string;
  tipe: string;
  bytes: Buffer | Uint8Array;
  /** naskah | lampiran */
  peran?: string;
  /** hanya ruang "bima" */
  proposalId?: string;
  namaLampiran?: string;
}

export interface BerkasTersimpan {
  id: string;
  nama: string;
  tipe: string;
  ukuran: number;
  bytes: Buffer;
  penyimpanan: "blob" | "db";
}

export function blobTersedia(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

const bersihkanNama = (n: string) => n.replace(/[^\w.\-]+/g, "_");

export async function simpanBerkas(m: MasukanBerkas): Promise<{ id: string; penyimpanan: "blob" | "db"; kunci: string | null }> {
  const db = getDb();
  const bytes = Buffer.from(m.bytes);
  let kunci: string | null = null;
  let penyimpanan: "blob" | "db" = "db";

  if (blobTersedia()) {
    try {
      const hasil = await put(`semar/${m.ruang}/${randomUUID()}-${bersihkanNama(m.nama)}`, bytes, {
        access: "private",
        contentType: m.tipe,
        addRandomSuffix: false,
      });
      kunci = hasil.pathname;
      penyimpanan = "blob";
    } catch (e) {
      console.warn("[berkas] Vercel Blob gagal, memakai penyimpanan basis data:", (e as Error).message);
    }
  }

  const nilaiUmum = {
    kunci,
    penyimpanan,
    nama: m.nama,
    tipe: m.tipe,
    ukuran: bytes.length,
    bytes: penyimpanan === "db" ? bytes : null,
    peran: m.peran ?? "naskah",
  };

  if (m.ruang === "semar") {
    const [r] = await db.insert(berkasVersi).values(nilaiUmum).returning({ id: berkasVersi.id });
    return { id: r.id, penyimpanan, kunci };
  }
  const [r] = await db
    .insert(bimaBerkas)
    .values({ ...nilaiUmum, proposalId: m.proposalId ?? null, namaLampiran: m.namaLampiran ?? null })
    .returning({ id: bimaBerkas.id });
  return { id: r.id, penyimpanan, kunci };
}

export async function ambilBerkas(ruang: RuangBerkas, id: string): Promise<BerkasTersimpan | null> {
  const db = getDb();
  const tabel = ruang === "semar" ? berkasVersi : bimaBerkas;
  const [baris] = await db.select().from(tabel).where(eq(tabel.id, id));
  if (!baris) return null;
  let bytes: Buffer | null = baris.bytes ?? null;
  if (!bytes && baris.kunci) {
    const hasil = await get(baris.kunci, { access: "private" });
    if (!hasil || hasil.statusCode !== 200) return null;
    bytes = Buffer.from(await new Response(hasil.stream).arrayBuffer());
  }
  if (!bytes) return null;
  return { id: baris.id, nama: baris.nama, tipe: baris.tipe, ukuran: baris.ukuran, bytes, penyimpanan: baris.penyimpanan };
}
