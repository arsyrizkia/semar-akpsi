/**
 * Satu-satunya pintu SEMAR ke BIMA (keputusan 1). HTTP ke /api/bima/*, ulang otomatis maksimal 2 kali (NFR 4.4).
 * Hanya jalankan di server.
 */
import { kunciApiBima } from "../sesi";
import type { PayloadKeputusan, PayloadPenugasan, RingkasanProposalBima } from "./servis";

export type { PayloadKeputusan, PayloadPenugasan, RingkasanProposalBima };

export class BimaGagalError extends Error {
  constructor(
    pesan: string,
    public readonly status?: number,
    public readonly percobaan?: number,
  ) {
    super(pesan);
    this.name = "BimaGagalError";
  }
}

export interface ReviewerBima {
  idBima: string;
  kode: string;
  nama: string;
  institusi: string;
  bidang: string | null;
  bersedia: boolean;
}

export const PERCOBAAN_ULANG_BIMA = 2;

export interface OpsiKlienBima {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  jedaMs?: number;
}

function baseUrlBawaan(): string {
  if (process.env.BIMA_BASE_URL) return process.env.BIMA_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function buatKlienBima(opsi: OpsiKlienBima = {}) {
  const jeda = opsi.jedaMs ?? 300;

  async function panggil(jalur: string, init: RequestInit = {}): Promise<Response> {
    const f = opsi.fetchImpl ?? fetch;
    const url = `${opsi.baseUrl ?? baseUrlBawaan()}${jalur}`;
    const headers: Record<string, string> = {
      "x-bima-key": kunciApiBima(),
      ...(init.body ? { "content-type": "application/json" } : {}),
    };
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      headers["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    }
    let galatTerakhir: unknown;
    for (let ke = 0; ke <= PERCOBAAN_ULANG_BIMA; ke++) {
      try {
        const res = await f(url, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) }, cache: "no-store" });
        if (res.ok) return res;
        if (res.status < 500) throw new BimaGagalError(`BIMA menolak permintaan (${res.status})`, res.status, ke + 1);
        galatTerakhir = new BimaGagalError(`BIMA gagal (${res.status})`, res.status, ke + 1);
      } catch (e) {
        if (e instanceof BimaGagalError && e.status && e.status < 500) throw e;
        galatTerakhir = e;
      }
      if (ke < PERCOBAAN_ULANG_BIMA) await new Promise((r) => setTimeout(r, jeda * (ke + 1)));
    }
    throw new BimaGagalError(
      `BIMA tidak dapat dihubungi setelah ${PERCOBAAN_ULANG_BIMA + 1} percobaan: ${(galatTerakhir as Error)?.message ?? "tidak diketahui"}`,
      undefined,
      PERCOBAAN_ULANG_BIMA + 1,
    );
  }

  const json = <T>(r: Response) => r.json() as Promise<T>;
  const kirim = (jalur: string, badan: unknown) => panggil(jalur, { method: "POST", body: JSON.stringify(badan) });

  return {
    /** Metadata proposal + daftar berkas (naskah dan lampiran). */
    ambilProposal: async (idProposal: string) =>
      json<RingkasanProposalBima>(await panggil(`/api/bima/proposal/${encodeURIComponent(idProposal)}`)),
    /** ambilBerkas(idProposal) pada sequence UC-05: unduh bytes satu berkas. */
    ambilBerkas: async (berkasId: string) => {
      const r = await panggil(`/api/bima/berkas/${encodeURIComponent(berkasId)}`);
      return { bytes: Buffer.from(await r.arrayBuffer()), tipe: r.headers.get("content-type") ?? "application/octet-stream" };
    },
    ambilDaftarReviewer: async () => (await json<{ reviewer: ReviewerBima[] }>(await panggil("/api/bima/reviewer"))).reviewer,
    kirimPenugasan: async (p: PayloadPenugasan) => json<{ diterima: number }>(await kirim("/api/bima/penugasan", p)),
    kirimKeputusan: async (p: PayloadKeputusan) => json<{ diterima: boolean }>(await kirim("/api/bima/keputusan", p)),
    kirimStatusProposal: async (idProposal: string, statusBima: string) =>
      json<{ ok: boolean }>(await kirim("/api/bima/status", { idProposal, statusBima })),
    ambilKotakMasuk: async () => (await json<{ pesan: unknown[] }>(await panggil("/api/bima/kotak-masuk"))).pesan,
  };
}

export type KlienBima = ReturnType<typeof buatKlienBima>;

/** Klien bawaan. */
export const bima: KlienBima = buatKlienBima();
