/**
 * Token dan tiket M-16 (pra-periksa di BIMA):
 *  - token pra-periksa: dibuat BIMA saat modal SEMAR dibuka, membawa usulan dan pengusul (seperti token pengajuan, audiens berbeda);
 *  - tiket lolos: dibuat SEMAR bila naskah lolos semua butir deterministik, mengikat sidik sha256 berkas itu ke usulannya. BIMA hanya
 *    menyimpan naskah yang tiketnya sah dan sidiknya sama, sehingga berkas yang belum lolos tidak dapat masuk ke BIMA.
 */
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { kunciRahasia } from "./token";

const AUDIENS_TOKEN = "semar-pra-periksa";
const AUDIENS_TIKET = "bima-tiket-lolos";
const DURASI_TOKEN_DETIK = 1800;
const DURASI_TIKET_DETIK = 900;

export const sidikBerkas = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export interface KlaimPraPeriksa {
  idProposal: string;
  idBima: string;
  judul: string;
  skemaKode: string;
}

export async function buatTokenPraPeriksa(k: KlaimPraPeriksa): Promise<string> {
  return new SignJWT({ ...k }).setProtectedHeader({ alg: "HS256" }).setAudience(AUDIENS_TOKEN).setIssuedAt().setExpirationTime(`${DURASI_TOKEN_DETIK}s`).sign(kunciRahasia());
}

/** null bila tanda tangan, audiens, atau masa berlaku tidak sah. */
export async function bacaTokenPraPeriksa(token: string): Promise<KlaimPraPeriksa | null> {
  try {
    const { payload } = await jwtVerify(token, kunciRahasia(), { audience: AUDIENS_TOKEN });
    const { idProposal, idBima, judul, skemaKode } = payload as Record<string, unknown>;
    if (typeof idProposal !== "string" || typeof idBima !== "string" || typeof judul !== "string" || typeof skemaKode !== "string") return null;
    return { idProposal, idBima, judul, skemaKode };
  } catch {
    return null;
  }
}

export async function buatTiketLolos(k: { idProposal: string; sidik: string; jumlahButir: number }, durasiDetik = DURASI_TIKET_DETIK): Promise<string> {
  return new SignJWT({ ...k }).setProtectedHeader({ alg: "HS256" }).setAudience(AUDIENS_TIKET).setIssuedAt().setExpirationTime(`${durasiDetik}s`).sign(kunciRahasia());
}

/** Tiket sah untuk usulan dan sidik berkas ini; selain itu null (palsu, kedaluwarsa, usulan lain, atau berkas berbeda). */
export async function periksaTiketLolos(tiket: string, harap: { idProposal: string; sidik: string }): Promise<{ jumlahButir: number } | null> {
  try {
    const { payload } = await jwtVerify(tiket, kunciRahasia(), { audience: AUDIENS_TIKET });
    if (payload.idProposal !== harap.idProposal || payload.sidik !== harap.sidik) return null;
    return { jumlahButir: Number(payload.jumlahButir) || 0 };
  } catch {
    return null;
  }
}
