import { NextResponse } from "next/server";
import { tolakBilaKunciSalah } from "@/lib/bima/api";
import { ambilBerkasBima } from "@/lib/bima/servis";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ditolak = tolakBilaKunciSalah(req);
  if (ditolak) return ditolak;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ galat: "id berkas tidak valid" }, { status: 400 });
  const b = await ambilBerkasBima(id);
  if (!b) return NextResponse.json({ galat: "berkas tidak ditemukan" }, { status: 404 });
  return new NextResponse(new Uint8Array(b.bytes), {
    headers: { "content-type": b.tipe, "content-disposition": `attachment; filename="${encodeURIComponent(b.nama)}"` },
  });
}
