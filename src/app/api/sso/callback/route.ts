import { NextResponse, type NextRequest } from "next/server";
import { pastikanAkunDariBima, targetSetelahMasuk } from "@/lib/auth";
import { COOKIE_SEMAR, buatSesiSemar, jalurAman, opsiCookie, verifikasiTokenSso } from "@/lib/sesi";

export const dynamic = "force-dynamic";

/** Menukar token SSO dari BIMA menjadi cookie sesi SEMAR. Pengusul diteruskan BIMA ke sini dengan `lanjut` = J-06. */
export async function GET(req: NextRequest) {
  const isi = await verifikasiTokenSso(req.nextUrl.searchParams.get("token") ?? undefined);
  const akun = isi ? await pastikanAkunDariBima(isi.idBima) : null;
  if (!akun) return NextResponse.redirect(new URL("/masuk?galat=token", req.url), 303);

  const lanjut = jalurAman(req.nextUrl.searchParams.get("lanjut"), targetSetelahMasuk(akun));
  const res = NextResponse.redirect(new URL(lanjut, req.url), 303);
  res.cookies.set(COOKIE_SEMAR, await buatSesiSemar(akun.idBima), opsiCookie);
  return res;
}
