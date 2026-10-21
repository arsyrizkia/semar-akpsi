import { NextResponse } from "next/server";
import { COOKIE_BIMA } from "@/lib/sesi";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/bima/masuk", req.url), 303);
  res.cookies.delete(COOKIE_BIMA);
  return res;
}
