import { NextResponse } from "next/server";
import { tolakBilaKunciSalah } from "@/lib/bima/api";
import { daftarReviewerBima } from "@/lib/bima/servis";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ditolak = tolakBilaKunciSalah(req);
  if (ditolak) return ditolak;
  return NextResponse.json({ reviewer: await daftarReviewerBima() });
}
