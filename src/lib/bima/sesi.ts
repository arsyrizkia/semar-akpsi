/** Sesi sisi BIMA tiruan (cookie bima_sesi). Hanya untuk halaman dan route /bima/*. */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bimaAkun } from "@/db/schema";
import { COOKIE_BIMA, verifikasiSesiBima } from "../sesi";

export type AkunBima = typeof bimaAkun.$inferSelect;

export async function ambilSesiBima(): Promise<AkunBima | null> {
  const jar = await cookies();
  const isi = await verifikasiSesiBima(jar.get(COOKIE_BIMA)?.value);
  if (!isi) return null;
  const [a] = await getDb().select().from(bimaAkun).where(eq(bimaAkun.idBima, isi.idBima));
  return a ?? null;
}

/** Guard halaman BIMA: arahkan ke /bima/masuk bila belum masuk. */
export async function wajibSesiBima(kembali = "/bima/pengajuan"): Promise<AkunBima> {
  const a = await ambilSesiBima();
  if (!a) redirect(`/bima/masuk?kembali=${encodeURIComponent(kembali)}`);
  return a;
}

export async function wajibPengusulBima(kembali = "/bima/pengajuan"): Promise<AkunBima> {
  const a = await wajibSesiBima(kembali);
  if (a.peran !== "pengusul") redirect("/bima/masuk?galat=peran");
  return a;
}
