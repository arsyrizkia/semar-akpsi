import { NextResponse } from "next/server";
import { ambilSesiBima } from "@/lib/bima/sesi";
import { UsulanDitolak, ajukanUsulan, setStatusUsulan } from "@/lib/bima/servis-pengajuan";
import { buatTokenPengajuan } from "@/lib/pengajuan/token";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * "Kirim Usulan" (langkah 5 Konfirmasi Usulan): BIMA tiruan memastikan dokumen usulan lolos pra-periksa SEMAR, menandai usulan
 * "Diajukan ke SEMAR", lalu meneruskannya ke SEMAR server ke server (/api/semar/pengajuan/terima) dengan token pengajuan. Pengusul
 * tetap di BIMA; status Terkirim dicerminkan SEMAR sesudah pemeriksaan resmi. Masa pengusulan yang sudah ditutup ditolak SEMAR (UC-05c).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const akun = await ambilSesiBima();
  if (!akun || akun.peran !== "pengusul") return NextResponse.json({ galat: "Masuk sebagai pengusul terlebih dahulu." }, { status: 401 });
  const { id } = await params;

  let usulan: { judul: string; skemaKode: string };
  try {
    usulan = await ajukanUsulan(akun.idBima, id);
  } catch (e) {
    if (e instanceof UsulanDitolak) return NextResponse.json({ galat: e.message }, { status: 409 });
    throw e;
  }

  const token = await buatTokenPengajuan({ idProposal: id, idBima: akun.idBima, judul: usulan.judul, skemaKode: usulan.skemaKode });
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  let status: string | null = null;
  try {
    const res = await fetch(new URL("/api/semar/pengajuan/terima", req.url), { method: "POST", headers, body: JSON.stringify({ token }), cache: "no-store", signal: AbortSignal.timeout(30_000) });
    status = ((await res.json().catch(() => ({}))) as { status?: string }).status ?? null;
  } catch {
    status = null;
  }
  if (status === "ditolak") {
    await setStatusUsulan(id, "Ditolak");
    return NextResponse.json({ galat: "Usulan ditolak SEMAR: masa pengusulan sudah ditutup." }, { status: 409 });
  }
  if (!status) {
    await setStatusUsulan(id, "Draf");
    return NextResponse.json({ galat: "SEMAR tidak dapat dihubungi. Usulan belum terkirim; coba kirim lagi." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, lanjut: `/bima/pengajuan?terkirim=${encodeURIComponent(id)}` });
}
