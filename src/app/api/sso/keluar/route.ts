import { NextResponse } from "next/server";
import { COOKIE_SEMAR } from "@/lib/sesi";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/masuk", req.url), 303);
  res.cookies.delete(COOKIE_SEMAR);
  return res;
}
