import { NextResponse } from "next/server";
import { ambilSesiBima } from "@/lib/bima/sesi";
import { UsulanDitolak, buatUsulanBaru } from "@/lib/bima/servis-pengajuan";

export const dynamic = "force-dynamic";

/** "Tambah Usulan" (Daftar Usulan): membuat draf usulan baru lalu mengarahkan pengusul ke langkah 1 wizard (Identitas Usulan). */
export async function POST(req: Request) {
  const akun = await ambilSesiBima();
  if (!akun || akun.peran !== "pengusul") return NextResponse.json({ galat: "Masuk sebagai pengusul terlebih dahulu." }, { status: 401 });
  const masukan = (await req.json().catch(() => ({}))) as { skemaKode?: unknown; judul?: unknown };
  try {
    const id = await buatUsulanBaru(akun.idBima, masukan);
    return NextResponse.json({ ok: true, lanjut: `/bima/pengajuan/${encodeURIComponent(id)}?langkah=identitas` });
  } catch (e) {
    if (e instanceof UsulanDitolak) return NextResponse.json({ galat: e.message }, { status: 409 });
    throw e;
  }
}
