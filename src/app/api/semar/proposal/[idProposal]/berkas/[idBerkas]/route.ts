import { NextResponse } from "next/server";
import { catatLogAudit } from "@/lib/audit";
import { ambilSesi } from "@/lib/auth";
import { ambilBerkas } from "@/lib/berkas";
import { bentukNamaBerkas, bolehUnduhBerkasProposal, kepalaUnduhan } from "@/lib/unduhan";
import { adaPenugasanTetap, cariProposal, ruangBerkasProposal } from "@/lib/unduhan-db";

export const dynamic = "force-dynamic";

/**
 * Unduh berkas proposal (naskah atau lampiran dari penyimpanan Blob/basis data). Tim Kerja DPPM boleh; reviewer hanya untuk proposal
 * yang ditugaskan kepadanya (NFR 3.1); selain itu 403 dan percobaannya dicatat.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ idProposal: string; idBerkas: string }> }) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });

  const { idProposal, idBerkas } = await params;
  const p = await cariProposal(idProposal);
  if (!p) return NextResponse.json({ galat: "Proposal tidak ditemukan" }, { status: 404 });

  const { akun } = sesi;
  const ditugaskan = akun.peran === "reviewer" ? await adaPenugasanTetap(p.id, akun.id) : false;
  if (!bolehUnduhBerkasProposal(akun.peran, ditugaskan)) {
    await catatLogAudit({ aktor: akun.idBima, aksi: "akses.ditolak", objek: `proposal:${p.idProposal}`, rincian: { alasan: "bukan Tim Kerja dan bukan reviewer yang ditugaskan", berkas: idBerkas } });
    return NextResponse.json({ galat: "Akses ditolak" }, { status: 403 });
  }

  const ruang = await ruangBerkasProposal(p, idBerkas);
  if (!ruang) return NextResponse.json({ galat: "Berkas tidak ditemukan pada proposal ini" }, { status: 404 });
  const berkas = await ambilBerkas(ruang, idBerkas);
  if (!berkas) return NextResponse.json({ galat: "Isi berkas tidak dapat dibaca" }, { status: 404 });

  await catatLogAudit({ aktor: akun.idBima, aksi: "berkas.unduh", objek: `proposal:${p.idProposal}`, rincian: { berkas: idBerkas, nama: berkas.nama, ruang } });
  return new NextResponse(new Uint8Array(berkas.bytes), { headers: kepalaUnduhan(`${bentukNamaBerkas(p.idProposal)}-${berkas.nama}`, berkas.tipe, berkas.ukuran) });
}
