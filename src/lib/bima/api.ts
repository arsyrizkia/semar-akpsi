import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { kunciApiBima } from "../sesi";

/** API BIMA tiruan hanya melayani klien SEMAR yang membawa header x-bima-key. */
export function tolakBilaKunciSalah(req: Request): NextResponse | null {
  const dikirim = Buffer.from(req.headers.get("x-bima-key") ?? "");
  const harapan = Buffer.from(kunciApiBima());
  if (dikirim.length !== harapan.length || !timingSafeEqual(dikirim, harapan)) {
    return NextResponse.json({ galat: "kunci API BIMA tidak valid" }, { status: 401 });
  }
  return null;
}
