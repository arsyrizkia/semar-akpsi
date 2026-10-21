/**
 * Proxy (Next.js 16, pengganti middleware): penjaga cepat berbasis cookie.
 * Pemeriksaan peran yang sebenarnya ada di guard server (src/lib/auth.ts); ini hanya mengalihkan permintaan tanpa sesi.
 */
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_BIMA, COOKIE_SEMAR, verifikasiSesiBima, verifikasiSesiSemar } from "@/lib/sesi";

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/bima/pengajuan")) {
    const sesi = await verifikasiSesiBima(req.cookies.get(COOKIE_BIMA)?.value);
    if (!sesi) {
      const url = new URL("/bima/masuk", req.url);
      url.searchParams.set("kembali", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const sesi = await verifikasiSesiSemar(req.cookies.get(COOKIE_SEMAR)?.value);
  if (!sesi) return NextResponse.redirect(new URL("/masuk", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/tim-kerja/:path*", "/reviewer/:path*", "/pengusul/:path*", "/bima/pengajuan/:path*"],
};
