import { NextResponse, after } from "next/server";
import { pastikanAkunDariBima } from "@/lib/auth";
import { mulaiPengajuan } from "@/lib/pengajuan/layanan";
import { verifikasiTokenPengajuan } from "@/lib/pengajuan/token";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Penerima pengajuan dari BIMA (UC-05 langkah 2-3, server ke server): BIMA memanggilnya saat pengusul menekan "Kirim Usulan" di langkah
 * Konfirmasi, dengan token pengajuan bertanda tangan. Pengusul tetap di BIMA; SEMAR menjalankan mulaiPengajuan (masa pengusulan,
 * proposal, lalu pemeriksaan resmi dan antrean semantik di latar belakang) dan mencerminkan status ke BIMA seperti biasa.
 */
export async function POST(req: Request) {
  const { token } = ((await req.json().catch(() => ({}))) ?? {}) as { token?: string };
  const klaim = await verifikasiTokenPengajuan(token);
  if (!klaim) return NextResponse.json({ galat: "token pengajuan tidak sah" }, { status: 401 });
  const akun = await pastikanAkunDariBima(klaim.idBima);
  if (!akun || akun.peran !== "pengusul") return NextResponse.json({ galat: "pengusul tidak dikenal SEMAR" }, { status: 403 });
  try {
    const h = await mulaiPengajuan(klaim, akun, (kerja) => after(kerja));
    return NextResponse.json({ status: h.status });
  } catch (e) {
    return NextResponse.json({ galat: (e as Error).message }, { status: 400 });
  }
}
