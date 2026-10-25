import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bimaAkun } from "@/db/schema";
import { KATA_SANDI_DEMO } from "@/lib/bima/akun-demo";
import { COOKIE_BIMA, buatSesiBima, buatTokenSso, jalurAman, opsiCookie } from "@/lib/sesi";

export const dynamic = "force-dynamic";

/** Memasang cookie sesi BIMA, lalu (bila SSO) kembali ke SEMAR membawa token bertanda tangan. */
async function masukkan(idBima: string, kembali: string, lanjut: string, dasar: string) {
  let tujuan = kembali;
  if (kembali.startsWith("/api/sso/callback")) {
    const token = await buatTokenSso(idBima);
    tujuan = `/api/sso/callback?token=${encodeURIComponent(token)}${lanjut ? `&lanjut=${encodeURIComponent(lanjut)}` : ""}`;
  }
  const res = NextResponse.redirect(new URL(tujuan, dasar), 303);
  res.cookies.set(COOKIE_BIMA, await buatSesiBima(idBima), opsiCookie);
  return res;
}

/** Masuk cepat (pintasan demo): langsung sebagai satu akun demo. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const idBima = q.get("idBima") ?? "";
  const [akun] = await getDb().select().from(bimaAkun).where(eq(bimaAkun.idBima, idBima));
  if (!akun) return NextResponse.redirect(new URL("/bima/masuk?galat=akun", req.url));
  return masukkan(akun.idBima, jalurAman(q.get("kembali"), "/bima/pengajuan"), jalurAman(q.get("lanjut"), ""), req.url);
}

/**
 * Formulir masuk BIMA tiruan: nama pengguna (id akun demo) dan kata sandi demo. Kata sandi yang diketik hanya dibandingkan, tidak
 * disimpan atau dicatat. Gagal: kembali ke formulir dengan ?galat=sandi (nama pengguna dipertahankan, kata sandi tidak).
 */
export async function POST(req: NextRequest) {
  const asal = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (asal && host && new URL(asal).host !== host) return new NextResponse("Asal permintaan tidak sah.", { status: 403 });

  const fd = await req.formData();
  const namaPengguna = String(fd.get("namaPengguna") ?? "").trim().toLowerCase();
  const kataSandi = String(fd.get("kataSandi") ?? "");
  const kembali = jalurAman(String(fd.get("kembali") ?? ""), "/bima/pengajuan");
  const lanjut = jalurAman(String(fd.get("lanjut") ?? ""), "");

  const [akun] = namaPengguna ? await getDb().select().from(bimaAkun).where(eq(bimaAkun.idBima, namaPengguna)) : [];
  if (!akun || kataSandi !== KATA_SANDI_DEMO) {
    const balik = new URLSearchParams({ galat: "sandi", kembali, pengguna: namaPengguna });
    if (lanjut) balik.set("lanjut", lanjut);
    return NextResponse.redirect(new URL(`/bima/masuk?${balik}`, req.url), 303);
  }
  return masukkan(akun.idBima, kembali, lanjut, req.url);
}
