import { NextResponse } from "next/server";
import { ambilSesiBima } from "@/lib/bima/sesi";
import { VARIAN_DEMO } from "@/lib/bima/contoh-demo";
import { ambilUsulanPengusul } from "@/lib/bima/servis-pengajuan";
import { buatPdfContoh } from "@/lib/contoh/pdf";
import { susunContoh } from "@/lib/contoh/proposal";
import { kepalaUnduhan } from "@/lib/unduhan";

export const dynamic = "force-dynamic";

/**
 * Panel "Berkas contoh (demo)" di langkah Substansi Usulan: naskah contoh PDF dengan judul usulan ini (judul di naskah sama dengan judul
 * di BIMA), supaya saat demo pengusul tinggal mengunggahnya ke modal SEMAR. Data rekaan; hanya untuk usulan milik pengusul yang masuk.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; varian: string }> }) {
  const akun = await ambilSesiBima();
  if (!akun || akun.peran !== "pengusul") return NextResponse.json({ galat: "Masuk sebagai pengusul terlebih dahulu." }, { status: 401 });
  const { id, varian } = await params;
  const v = VARIAN_DEMO[varian as keyof typeof VARIAN_DEMO]?.varian;
  const usulan = v ? await ambilUsulanPengusul(akun.idBima, id) : null;
  if (!v || !usulan) return NextResponse.json({ galat: "Contoh tidak ditemukan" }, { status: 404 });
  const def = susunContoh(v);
  const pdf = await buatPdfContoh({ ...def, judul: usulan.judul, bagian: { ...def.bagian, Judul: usulan.judul } });
  return new NextResponse(new Uint8Array(pdf), { headers: kepalaUnduhan(`${id}-${varian}.pdf`, "application/pdf", pdf.length) });
}
