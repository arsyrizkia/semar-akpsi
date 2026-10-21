import { NextResponse } from "next/server";
import { tolakBilaKunciSalah } from "@/lib/bima/api";
import { ambilProposalBima } from "@/lib/bima/servis";

export const dynamic = "force-dynamic";

/** Metadata proposal + daftar berkas (dasar ambilBerkas pada UC-05). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ditolak = tolakBilaKunciSalah(req);
  if (ditolak) return ditolak;
  const { id } = await params;
  const p = await ambilProposalBima(id);
  return p ? NextResponse.json(p) : NextResponse.json({ galat: "proposal tidak ditemukan" }, { status: 404 });
}
