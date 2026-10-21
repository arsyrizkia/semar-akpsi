/**
 * Token pengajuan (UC-05 langkah 2): BIMA tiruan meneruskan pengusul ke SEMAR dengan token bertanda tangan
 * yang membawa idProposal dan identitas pengusul. Tanpa batas jumlah pengajuan (keputusan 3); setiap token
 * hanya berlaku untuk satu pengajuan lewat penanda `jti` (lihat layanan.ts).
 */
import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

const AUDIENS = "semar-pengajuan";
const DURASI_DETIK = 600;

function kunciRahasia(): Uint8Array {
  // sama dengan cadangan di src/lib/sesi.ts agar prototipe jalan tanpa AUTH_SECRET
  const s =
    process.env.AUTH_SECRET ??
    createHash("sha256")
      .update(`semar-prototipe:${process.env.DATABASE_URL ?? "lokal"}`)
      .digest("hex");
  return new TextEncoder().encode(s);
}

export interface KlaimPengajuan {
  idProposal: string;
  /** identitas pengusul di BIMA */
  idBima: string;
  judul: string;
  skemaKode: string;
  jti: string;
}

export async function buatTokenPengajuan(k: Omit<KlaimPengajuan, "jti">): Promise<string> {
  return new SignJWT({ idProposal: k.idProposal, idBima: k.idBima, judul: k.judul, skemaKode: k.skemaKode })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENS)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${DURASI_DETIK}s`)
    .sign(kunciRahasia());
}

export async function verifikasiTokenPengajuan(token: string | null | undefined): Promise<KlaimPengajuan | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunciRahasia(), { audience: AUDIENS });
    const { idProposal, idBima, judul, skemaKode } = payload as Record<string, unknown>;
    if (
      typeof idProposal !== "string" ||
      typeof idBima !== "string" ||
      typeof judul !== "string" ||
      typeof skemaKode !== "string" ||
      typeof payload.jti !== "string"
    ) {
      return null;
    }
    return { idProposal, idBima, judul, skemaKode, jti: payload.jti };
  } catch {
    return null;
  }
}
