import { NextResponse } from "next/server";
import { z } from "zod";
import { tolakBilaKunciSalah } from "@/lib/bima/api";
import { terimaKeputusanDariSemar } from "@/lib/bima/servis";

export const dynamic = "force-dynamic";

const skema = z.object({
  idProposal: z.string(),
  reviewerIdBima: z.string(),
  komponen: z.array(z.object({ komponen: z.string(), keputusan: z.enum(["Memenuhi", "Tidak memenuhi"]) })),
  umpanBalik: z.string(),
  jumlahKoreksi: z.number().optional(),
});

export async function POST(req: Request) {
  const ditolak = tolakBilaKunciSalah(req);
  if (ditolak) return ditolak;
  const hasil = skema.safeParse(await req.json().catch(() => null));
  if (!hasil.success) return NextResponse.json({ galat: "badan permintaan tidak valid" }, { status: 400 });
  return NextResponse.json(await terimaKeputusanDariSemar(hasil.data));
}
