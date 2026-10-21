/**
 * Sesi SEMAR di server + guard per peran. Dipakai di server component, layout, dan route handler.
 * Cookie hanya memuat idBima; akun dibaca ulang dari basis data pada setiap permintaan.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { akun, bimaAkun } from "@/db/schema";
import { COOKIE_SEMAR, verifikasiSesiSemar } from "./sesi";

export type Akun = typeof akun.$inferSelect;
export type PeranAkun = Akun["peran"];

export interface SesiSemar {
  akun: Akun;
  /** Tim Kerja dengan hak pengelola */
  pengelola: boolean;
}

/** Menyalin akun BIMA ke tabel akun SEMAR (dipanggil saat SSO; juga oleh susunPenugasan untuk reviewer). */
export async function pastikanAkunDariBima(idBima: string): Promise<Akun | null> {
  const db = getDb();
  const [b] = await db.select().from(bimaAkun).where(eq(bimaAkun.idBima, idBima));
  if (!b) return null;
  const nilai = {
    nama: b.nama,
    peran: b.peran,
    hakAkses: b.hakAkses,
    institusi: b.institusi,
    nomorInduk: b.nomorInduk,
    bersedia: b.bersedia,
    bidang: b.bidang,
  };
  const [hasil] = await db
    .insert(akun)
    .values({ idBima: b.idBima, ...nilai })
    .onConflictDoUpdate({ target: akun.idBima, set: nilai })
    .returning();
  return hasil;
}

export async function ambilSesi(): Promise<SesiSemar | null> {
  const jar = await cookies();
  const isi = await verifikasiSesiSemar(jar.get(COOKIE_SEMAR)?.value);
  if (!isi) return null;
  const [a] = await getDb().select().from(akun).where(eq(akun.idBima, isi.idBima));
  if (!a) return null;
  return { akun: a, pengelola: a.peran === "tim_kerja" && a.hakAkses === "pengelola" };
}

/** Halaman awal setiap peran sesudah masuk (J-01). */
export function targetSetelahMasuk(a: Pick<Akun, "peran" | "hakAkses">): string {
  if (a.peran === "reviewer") return "/reviewer/penugasan"; // J-07
  if (a.peran === "tim_kerja") return a.hakAkses === "pengelola" ? "/tim-kerja/templat" : "/tim-kerja/penugasan"; // J-02 / J-04
  return "/bima"; // pengusul tidak lewat J-01
}

export async function wajibMasuk(): Promise<SesiSemar> {
  const s = await ambilSesi();
  if (!s) redirect("/masuk");
  return s;
}

export async function wajibPeran(...peran: PeranAkun[]): Promise<SesiSemar> {
  const s = await wajibMasuk();
  if (!peran.includes(s.akun.peran)) redirect(`${targetSetelahMasuk(s.akun)}?galat=akses`);
  return s;
}

export const wajibTimKerja = () => wajibPeran("tim_kerja");
export const wajibReviewer = () => wajibPeran("reviewer");
export const wajibPengusul = () => wajibPeran("pengusul");

/** Hanya pengelola (NFR 3.2): J-02 dan J-03. */
export async function wajibPengelola(): Promise<SesiSemar> {
  const s = await wajibTimKerja();
  if (!s.pengelola) redirect("/tim-kerja/penugasan?galat=akses");
  return s;
}

/** Untuk route handler: kembalikan sesi atau null (tanpa redirect). */
export const sesiOpsional = ambilSesi;
