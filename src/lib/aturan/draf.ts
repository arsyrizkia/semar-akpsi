/**
 * Basis aturan "sedang disusun" (versi baru yang belum berlaku).
 * UC-02 langkah 5: perubahan disimpan sebagai bagian basis aturan versi baru yang belum berlaku, sehingga aturan yang
 * sedang dipakai tidak berubah sebelum "Simpan Versi". Skema fondasi tidak punya kolom status pada basis_aturan, jadi
 * draf dikenali dari tiga penanda sekaligus: tanggalBerlaku = 31 Des 9999, periodeId kosong, dan kode berakhiran "-DRAF".
 * Pembaca basis aturan lain wajib memilih baris dengan tanggalBerlaku <= waktuDemo() dan mengabaikan draf.
 */
import { and, eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { basisAturan, butirCek, skemaPendanaan } from "@/db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, any, any>;

export type BarisBasis = typeof basisAturan.$inferSelect;
export type BarisButir = typeof butirCek.$inferSelect;

export const TANGGAL_DRAF = new Date("9999-12-31T00:00:00.000Z");

export const adalahDraf = (b: Pick<BarisBasis, "tanggalBerlaku">) => b.tanggalBerlaku.getUTCFullYear() >= 9999;

export async function semuaBasisSkema(db: Db, skemaId: string): Promise<BarisBasis[]> {
  return db.select().from(basisAturan).where(eq(basisAturan.skemaId, skemaId));
}

export function pilihBasisNyata(semua: BarisBasis[], periodeId?: string | null): BarisBasis | null {
  const nyata = semua.filter((b) => !adalahDraf(b)).sort((a, b) => b.versi - a.versi);
  return nyata.find((b) => periodeId && b.periodeId === periodeId) ?? nyata[0] ?? null;
}

export async function ambilDrafBasis(db: Db, skemaId: string): Promise<BarisBasis | null> {
  return (await semuaBasisSkema(db, skemaId)).find(adalahDraf) ?? null;
}

/** Ambil basis yang sedang disusun; bila belum ada, salin basis terbaru (butir ikut disalin dengan id baru). */
export async function pastikanDrafBasis(db: Db, skemaId: string, pelakuId: string | null): Promise<BarisBasis> {
  const semua = await semuaBasisSkema(db, skemaId);
  const ada = semua.find(adalahDraf);
  if (ada) return ada;

  const [skema] = await db.select().from(skemaPendanaan).where(eq(skemaPendanaan.id, skemaId));
  if (!skema) throw new Error("Skema tidak ditemukan");
  const nyata = pilihBasisNyata(semua);
  const versi = Math.max(0, ...semua.map((b) => b.versi)) + 1;

  let draf: BarisBasis;
  try {
    [draf] = await db
      .insert(basisAturan)
      .values({
        kode: `BA-${skema.kode}-DRAF`,
        nama: nyata?.nama ?? `Basis Aturan ${skema.namaSkema}`,
        skemaId,
        periodeId: null,
        versi,
        tanggalBerlaku: TANGGAL_DRAF,
        dibuatOleh: pelakuId,
      })
      .returning();
  } catch (e) {
    // dua permintaan serentak: pemenang sudah membuat draf
    const ulang = await ambilDrafBasis(db, skemaId);
    if (ulang) return ulang;
    throw e;
  }

  if (nyata) {
    const butir = await db.select().from(butirCek).where(eq(butirCek.basisAturanId, nyata.id));
    if (butir.length > 0) {
      await db.insert(butirCek).values(
        butir.map((b) => ({
          basisAturanId: draf.id,
          templatId: b.templatId,
          kode: b.kode,
          deskripsi: b.deskripsi,
          jenis: b.jenis,
          asal: b.asal,
          komponen: b.komponen,
          pemeriksa: b.pemeriksa,
          parameter: b.parameter,
          aturanHitung: b.aturanHitung,
          pertanyaan: b.pertanyaan,
          contohJawaban: b.contohJawaban,
          status: b.status,
          urutan: b.urutan,
          ditandaiOleh: b.ditandaiOleh,
          ditandaiPada: b.ditandaiPada,
        })),
      );
    }
  }
  return draf;
}

export async function butirBasis(db: Db, basisId: string): Promise<BarisButir[]> {
  return db.select().from(butirCek).where(eq(butirCek.basisAturanId, basisId));
}

export async function cariButirDenganKode(db: Db, basisId: string, kode: string, asal?: "templat" | "manual"): Promise<BarisButir | null> {
  const baris = await db
    .select()
    .from(butirCek)
    .where(and(eq(butirCek.basisAturanId, basisId), eq(butirCek.kode, kode)));
  const cocok = baris.filter((b) => (asal ? b.asal === asal : true) && b.status !== "Nonaktif");
  return cocok[0] ?? baris[0] ?? null;
}
