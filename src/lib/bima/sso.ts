/** Pembantu SSO tiruan sisi BIMA → SEMAR. */
import { buatTokenSso } from "../sesi";

/**
 * URL SEMAR yang menukar token SSO menjadi cookie sesi SEMAR, lalu menuju `lanjut`.
 * Dipakai BIMA tiruan, mis. untuk meneruskan pengusul ke J-06 tanpa masuk ulang:
 *   urlSsoSemar("pengusul-1", "/pengusul/hasil/PRP-2026-0001")
 */
export async function urlSsoSemar(idBima: string, lanjut: string): Promise<string> {
  const token = await buatTokenSso(idBima);
  return `/api/sso/callback?token=${encodeURIComponent(token)}&lanjut=${encodeURIComponent(lanjut)}`;
}
