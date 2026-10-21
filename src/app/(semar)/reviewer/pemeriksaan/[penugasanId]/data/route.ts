import { NextResponse } from "next/server";
import { sesiOpsional } from "@/lib/auth";
import { muatPemeriksaan, periksaAkses } from "@/lib/penilaian/layanan";

export const dynamic = "force-dynamic";

/** Data J-08 sebagai JSON. 401 tanpa sesi, 403 bila bukan reviewer yang ditugaskan (NFR 3.1), 404 bila tidak ada. */
export async function GET(_req: Request, ctx: { params: Promise<{ penugasanId: string }> }) {
  const s = await sesiOpsional();
  if (!s) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });
  if (s.akun.peran !== "reviewer") return NextResponse.json({ galat: "Akses ditolak" }, { status: 403 });
  const { penugasanId } = await ctx.params;
  const akses = await periksaAkses(penugasanId, s.akun);
  if (!akses.ok) return NextResponse.json({ galat: akses.kode === 403 ? "Akses ditolak" : "Penugasan tidak ditemukan" }, { status: akses.kode });
  return NextResponse.json(await muatPemeriksaan(akses.penugasan));
}
