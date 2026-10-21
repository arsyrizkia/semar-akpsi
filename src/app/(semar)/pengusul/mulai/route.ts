import { NextResponse, after, type NextRequest } from "next/server";
import { ambilSesi } from "@/lib/auth";
import { mulaiPengajuan } from "@/lib/pengajuan/layanan";
import { verifikasiTokenPengajuan } from "@/lib/pengajuan/token";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Tujuan penerusan dari BIMA (UC-05 langkah 2 dan 3). SSO sudah memasang cookie sesi pengusul; token pengajuan
 * membawa idProposal dan identitas pengusul. Pemeriksaan berjalan di latar belakang (after) sementara J-06
 * menampilkan "Pemeriksaan sedang berjalan".
 */
export async function GET(req: NextRequest) {
  const sesi = await ambilSesi();
  if (!sesi || sesi.akun.peran !== "pengusul") return NextResponse.redirect(new URL("/masuk?galat=token", req.url), 303);

  const klaim = await verifikasiTokenPengajuan(req.nextUrl.searchParams.get("token"));
  if (!klaim || klaim.idBima !== sesi.akun.idBima) return NextResponse.redirect(new URL("/bima/pengajuan?galat=token", req.url), 303);

  try {
    await mulaiPengajuan(klaim, sesi.akun, (kerja) => after(kerja));
  } catch {
    return NextResponse.redirect(new URL("/bima/pengajuan?galat=token", req.url), 303);
  }
  return NextResponse.redirect(new URL(`/pengusul/hasil/${encodeURIComponent(klaim.idProposal)}`, req.url), 303);
}
