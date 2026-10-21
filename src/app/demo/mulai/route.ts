import { NextResponse, type NextRequest } from "next/server";
import { pastikanAkunDariBima } from "@/lib/auth";
import { COOKIE_BIMA, COOKIE_SEMAR, buatSesiBima, buatSesiSemar, opsiCookie } from "@/lib/sesi";
import { siapkanJalanPintas, type KodeJalanPintas } from "@/lib/demo/skenario";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const KODE = new Set<string>([
  "UC-01", "UC-02", "UC-03", "UC-04", "UC-05", "UC-06", "UC-07", "UC-08", "UC-09",
  "UC-05a", "UC-05b", "UC-05c", "UC-07a", "UC-07b", "UC-07c",
]);

/** Jalan pintas /demo (parameter j08=1 pada skenario UC-07 membuka J-08 langsung, tanpa lewat daftar J-07): menyiapkan data skenario, memasang sesi peran yang sesuai (SEMAR dan BIMA), lalu membuka jendela awal. */
export async function GET(req: NextRequest) {
  const kode = req.nextUrl.searchParams.get("k") ?? "";
  if (!KODE.has(kode)) return NextResponse.redirect(new URL("/demo?galat=kode", req.url), 303);
  try {
    const hasil = await siapkanJalanPintas(kode as KodeJalanPintas, { langsungJ08: req.nextUrl.searchParams.get("j08") === "1" });
    const akun = await pastikanAkunDariBima(hasil.akun);
    if (!akun) throw new Error(`akun ${hasil.akun} tidak ada`);
    const res = NextResponse.redirect(new URL(hasil.tujuan, req.url), 303);
    res.cookies.set(COOKIE_SEMAR, await buatSesiSemar(akun.idBima), opsiCookie);
    res.cookies.set(COOKIE_BIMA, await buatSesiBima(akun.idBima), opsiCookie);
    return res;
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "gagal menyiapkan skenario";
    return NextResponse.redirect(new URL(`/demo?galat=${encodeURIComponent(pesan)}`, req.url), 303);
  }
}
