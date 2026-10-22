import { NextResponse } from "next/server";
import { z } from "zod";
import { tolakBilaKunciSalah } from "@/lib/bima/api";
import { terimaPenugasanDariSemar } from "@/lib/bima/servis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const skema = z.object({
  periodeId: z.string().optional(),
  penugasan: z.array(z.object({ idProposal: z.string(), reviewerIdBima: z.string(), tanggal: z.string(), kunci: z.string().optional() })),
});

export async function POST(req: Request) {
  const ditolak = tolakBilaKunciSalah(req);
  if (ditolak) return ditolak;
  const hasil = skema.safeParse(await req.json().catch(() => null));
  if (!hasil.success) return NextResponse.json({ galat: "badan permintaan tidak valid" }, { status: 400 });
  return NextResponse.json(await terimaPenugasanDariSemar(hasil.data));
}
