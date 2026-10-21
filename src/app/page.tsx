import { redirect } from "next/navigation";
import { ambilSesi, targetSetelahMasuk } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Tidak ada beranda: arahkan ke J-01 atau ke jendela awal sesuai peran. */
export default async function Awal() {
  const sesi = await ambilSesi();
  redirect(sesi ? targetSetelahMasuk(sesi.akun) : "/masuk");
}
