import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bimaAkun } from "@/db/schema";
import { COOKIE_BIMA, buatSesiBima, buatTokenSso, jalurAman, opsiCookie } from "@/lib/sesi";

export const dynamic = "force-dynamic";

/** Memilih akun demo di BIMA tiruan: memasang cookie sesi BIMA, lalu (bila SSO) kembali ke SEMAR membawa token bertanda tangan. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const idBima = q.get("idBima") ?? "";
  const [akun] = await getDb().select().from(bimaAkun).where(eq(bimaAkun.idBima, idBima));
  if (!akun) return NextResponse.redirect(new URL("/bima/masuk?galat=akun", req.url));

  const kembali = jalurAman(q.get("kembali"), "/bima/pengajuan");
  let tujuan = kembali;
  if (kembali.startsWith("/api/sso/callback")) {
    const lanjut = jalurAman(q.get("lanjut"), "");
    const token = await buatTokenSso(akun.idBima);
    tujuan = `/api/sso/callback?token=${encodeURIComponent(token)}${lanjut ? `&lanjut=${encodeURIComponent(lanjut)}` : ""}`;
  }
  const res = NextResponse.redirect(new URL(tujuan, req.url), 303);
  res.cookies.set(COOKIE_BIMA, await buatSesiBima(akun.idBima), opsiCookie);
  return res;
}
