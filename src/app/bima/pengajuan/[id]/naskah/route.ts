import { NextResponse } from "next/server";
import { ambilSesiBima } from "@/lib/bima/sesi";
import { UsulanDitolak, simpanNaskahLolos } from "@/lib/bima/servis-pengajuan";
import { jenisBerkas, TIPE_PDF } from "@/lib/pengajuan/ekstraksi";
import { BATAS_PRA_PERIKSA_BYTE } from "@/lib/pengajuan/pra-periksa";
import { periksaTiketLolos, sidikBerkas } from "@/lib/pengajuan/tiket";

export const dynamic = "force-dynamic";

/**
 * "Simpan ke BIMA" pada M-16: BIMA tiruan hanya menyimpan dokumen usulan yang membawa tiket lolos SEMAR untuk usulan ini dan berkas yang
 * sama persis (sidik sha256). Berkas yang belum lolos, berkas lain, atau tiket kedaluwarsa ditolak.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const akun = await ambilSesiBima();
  if (!akun || akun.peran !== "pengusul") return NextResponse.json({ galat: "Masuk sebagai pengusul terlebih dahulu." }, { status: 401 });
  const { id } = await params;
  const form = await req.formData().catch(() => null);
  const f = form?.get("berkas");
  const tiket = String(form?.get("tiket") ?? "");
  if (!(f instanceof File) || f.size === 0) return NextResponse.json({ galat: "Dokumen usulan tidak terbaca." }, { status: 400 });
  if (f.size > BATAS_PRA_PERIKSA_BYTE) return NextResponse.json({ galat: "Ukuran dokumen melebihi 4 MB." }, { status: 400 });
  const bytes = Buffer.from(await f.arrayBuffer());
  if (jenisBerkas(f.name, f.type, bytes) !== "pdf") return NextResponse.json({ galat: "Dokumen usulan harus berformat PDF." }, { status: 400 });

  const lolos = await periksaTiketLolos(tiket, { idProposal: id, sidik: sidikBerkas(bytes) });
  if (!lolos) return NextResponse.json({ galat: "Dokumen ini belum lolos pemeriksaan SEMAR atau sudah berganti. Periksa ulang dokumen di SEMAR." }, { status: 409 });
  try {
    await simpanNaskahLolos(akun.idBima, id, { nama: f.name, tipe: TIPE_PDF, bytes }, { sidik: sidikBerkas(bytes), jumlahButir: lolos.jumlahButir });
  } catch (e) {
    if (e instanceof UsulanDitolak) return NextResponse.json({ galat: e.message }, { status: 400 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}
