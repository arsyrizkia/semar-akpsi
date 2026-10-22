/**
 * Stub BIMA untuk uji kotak putih (Dennis dkk., 2015, hlm. 471: kelas yang belum siap atau eksternal diganti stub).
 * Dipakai lewat `buatKlienBima({ baseUrl: "http://bima.stub", jedaMs: 0, fetchImpl: stub.fetch })`.
 */
import type { ReviewerBima } from "@/lib/bima/client";

export interface PanggilanStub {
  jalur: string;
  metode: string;
  badan: unknown;
}

export interface OpsiStubBima {
  /** jumlah panggilan pertama yang dijawab status 503 (menguji ulang otomatis) */
  gagalDulu?: number;
  /** status tetap untuk semua panggilan (mis. 404); mengalahkan `gagalDulu` */
  statusTetap?: number;
  reviewer?: ReviewerBima[];
  berkas?: Record<string, { bytes: Uint8Array; tipe: string }>;
}

export function buatStubBima(opsi: OpsiStubBima = {}) {
  const panggilan: PanggilanStub[] = [];
  let n = 0;
  const fetchStub = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(String(url));
    n++;
    let badan: unknown = null;
    if (typeof init?.body === "string") badan = JSON.parse(init.body);
    panggilan.push({ jalur: u.pathname, metode: init?.method ?? "GET", badan });
    if (opsi.statusTetap) return new Response("", { status: opsi.statusTetap });
    if (n <= (opsi.gagalDulu ?? 0)) return new Response("", { status: 503 });
    if (u.pathname === "/api/bima/reviewer") return Response.json({ reviewer: opsi.reviewer ?? [] });
    if (u.pathname.startsWith("/api/bima/berkas/")) {
      const b = opsi.berkas?.[decodeURIComponent(u.pathname.split("/").pop() ?? "")];
      return b ? new Response(Buffer.from(b.bytes), { headers: { "content-type": b.tipe } }) : new Response("", { status: 404 });
    }
    if (u.pathname === "/api/bima/penugasan") return Response.json({ diterima: Array.isArray((badan as { penugasan?: unknown[] })?.penugasan) ? (badan as { penugasan: unknown[] }).penugasan.length : 0 });
    if (u.pathname === "/api/bima/keputusan") return Response.json({ diterima: true });
    if (u.pathname === "/api/bima/status") return Response.json({ ok: true });
    if (u.pathname === "/api/bima/kotak-masuk") return Response.json({ pesan: [] });
    return new Response("", { status: 404 });
  }) as typeof fetch;
  return { fetch: fetchStub, panggilan, jumlahPanggilan: () => n };
}
