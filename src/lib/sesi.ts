/** Token dan cookie sesi (jose). Tanpa akses basis data supaya aman dipakai di proxy.ts. */
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SEMAR = "semar_sesi";
export const COOKIE_BIMA = "bima_sesi";

function kunciRahasia(): Uint8Array {
  const s =
    process.env.AUTH_SECRET ??
    // cadangan deterministik agar prototipe tetap jalan tanpa AUTH_SECRET; atur AUTH_SECRET di produksi
    createHash("sha256")
      .update(`semar-prototipe:${process.env.DATABASE_URL ?? "lokal"}`)
      .digest("hex");
  return new TextEncoder().encode(s);
}

export interface IsiToken {
  idBima: string;
}

async function tandatangani(aud: string, idBima: string, detik: number): Promise<string> {
  return new SignJWT({ idBima })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime(`${detik}s`)
    .sign(kunciRahasia());
}

async function verifikasi(aud: string, token: string | undefined): Promise<IsiToken | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunciRahasia(), { audience: aud });
    return typeof payload.idBima === "string" ? { idBima: payload.idBima } : null;
  } catch {
    return null;
  }
}

export const DURASI_SESI_DETIK = 8 * 3600;

/** Token SSO berumur pendek yang diterbitkan BIMA tiruan untuk SEMAR. */
export const buatTokenSso = (idBima: string) => tandatangani("semar-sso", idBima, 120);
export const verifikasiTokenSso = (t?: string) => verifikasi("semar-sso", t);
/** Cookie sesi SEMAR. */
export const buatSesiSemar = (idBima: string) => tandatangani("semar-sesi", idBima, DURASI_SESI_DETIK);
export const verifikasiSesiSemar = (t?: string) => verifikasi("semar-sesi", t);
/** Cookie sesi BIMA tiruan. */
export const buatSesiBima = (idBima: string) => tandatangani("bima-sesi", idBima, DURASI_SESI_DETIK);
export const verifikasiSesiBima = (t?: string) => verifikasi("bima-sesi", t);

export const opsiCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL),
  path: "/",
  maxAge: DURASI_SESI_DETIK,
};

/** Cegah open redirect: hanya jalur internal. */
export function jalurAman(jalur: string | null | undefined, cadangan = "/"): string {
  if (!jalur || !jalur.startsWith("/") || jalur.startsWith("//") || jalur.includes("\\")) return cadangan;
  return jalur;
}

/** Kunci bersama antara klien SEMAR dan API BIMA tiruan (header x-bima-key). */
export function kunciApiBima(): string {
  return (
    process.env.BIMA_API_KEY ??
    createHash("sha256")
      .update(`bima-api:${process.env.AUTH_SECRET ?? process.env.DATABASE_URL ?? "lokal"}`)
      .digest("hex")
  );
}
