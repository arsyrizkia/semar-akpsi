import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { gambarNaskah, versiProposal } from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { ambilSesi } from "@/lib/auth";
import { bolehUnduhBerkasProposal } from "@/lib/unduhan";
import { adaPenugasanTetap, cariProposal } from "@/lib/unduhan-db";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Satu gambar naskah (gambar_naskah) milik salah satu versi proposal, untuk ditampilkan di teks J-08. Hak akses sama dengan unduh
 * berkas proposal: Tim Kerja DPPM, atau reviewer yang ditugaskan (NFR 3.1); penolakan dicatat.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ idProposal: string; idGambar: string }> }) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });

  const { idProposal, idGambar } = await params;
  if (!UUID.test(idGambar)) return NextResponse.json({ galat: "Gambar tidak ditemukan" }, { status: 404 });
  const p = await cariProposal(idProposal);
  if (!p) return NextResponse.json({ galat: "Proposal tidak ditemukan" }, { status: 404 });

  const { akun } = sesi;
  const ditugaskan = akun.peran === "reviewer" ? await adaPenugasanTetap(p.id, akun.id) : false;
  if (!bolehUnduhBerkasProposal(akun.peran, ditugaskan)) {
    await catatLogAudit({ aktor: akun.idBima, aksi: "akses.ditolak", objek: `proposal:${p.idProposal}`, rincian: { alasan: "bukan Tim Kerja dan bukan reviewer yang ditugaskan", gambar: idGambar } });
    return NextResponse.json({ galat: "Akses ditolak" }, { status: 403 });
  }

  const db = getDb();
  const [g] = await db.select().from(gambarNaskah).where(eq(gambarNaskah.id, idGambar));
  const versiId = g?.pemilik.startsWith("versi:") ? g.pemilik.slice("versi:".length) : null;
  // gambar harus milik versi proposal ini (bukan dokumen contoh atau proposal lain)
  const [milik] = versiId && UUID.test(versiId) ? await db.select({ id: versiProposal.id }).from(versiProposal).where(and(eq(versiProposal.id, versiId), eq(versiProposal.proposalId, p.id))) : [];
  if (!g || !milik) return NextResponse.json({ galat: "Gambar tidak ditemukan pada proposal ini" }, { status: 404 });

  return new NextResponse(new Uint8Array(g.bytes), {
    headers: { "Content-Type": g.tipe, "Content-Length": String(g.bytes.length), "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
