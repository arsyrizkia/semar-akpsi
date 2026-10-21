import { NextResponse, type NextRequest } from "next/server";
import { ambilSesiBima } from "@/lib/bima/sesi";
import { ambilUsulanPengusul } from "@/lib/bima/servis-pengajuan";
import { urlSsoSemar } from "@/lib/bima/sso";

export const dynamic = "force-dynamic";

/** Tautan "Lihat hasil pemeriksaan" pada halaman proposal BIMA: SSO baru lalu J-06 (tanpa masuk ulang). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const akun = await ambilSesiBima();
  if (!akun || akun.peran !== "pengusul") return NextResponse.redirect(new URL(`/bima/masuk?kembali=${encodeURIComponent(`/bima/pengajuan/hasil/${id}`)}`, req.url), 303);
  const usulan = await ambilUsulanPengusul(akun.idBima, id);
  if (!usulan) return NextResponse.redirect(new URL("/bima/pengajuan?galat=usulan", req.url), 303);
  return NextResponse.redirect(new URL(await urlSsoSemar(akun.idBima, `/pengusul/hasil/${encodeURIComponent(id)}`), req.url), 303);
}
