import { NextResponse } from "next/server";
import { catatLogAudit } from "@/lib/audit";
import { ambilSesi } from "@/lib/auth";
import { ambilSesiBima } from "@/lib/bima/sesi";
import { TIPE_DOCX_TEMPLAT, buatDokumenTemplat, namaBerkasTemplat } from "@/lib/templat/dokumen";
import { kepalaUnduhan } from "@/lib/unduhan";
import { dataTemplatTerbit } from "@/lib/unduhan-db";

export const dynamic = "force-dynamic";

/**
 * Unduh templat Terbit sebuah skema (.docx). Dipakai halaman pengajuan BIMA tiruan (pengusul yang masuk di BIMA) dan Tim Kerja DPPM
 * yang masuk di SEMAR. `idSkema` boleh id skema atau kodenya (mis. PD).
 */
export async function GET(req: Request, { params }: { params: Promise<{ idSkema: string }> }) {
  const [sesi, sesiBima] = await Promise.all([ambilSesi(), ambilSesiBima()]);
  const aktor = sesi?.akun.idBima ?? sesiBima?.idBima;
  if (!aktor) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });

  const { idSkema } = await params;
  const d = await dataTemplatTerbit(idSkema);
  if (!d) return NextResponse.json({ galat: "Belum ada templat Terbit untuk skema ini" }, { status: 404 });

  const mode = new URL(req.url).searchParams.get("mode") === "isian" ? "isian" : "paket";
  const bytes = await buatDokumenTemplat(d.templat, d.bagian, d.templat.lampiranWajib, d.skema, d.periode, { ...d.paket, mode });
  await catatLogAudit({ aktor, aksi: "templat.unduh", objek: `templat:${d.templat.id}`, rincian: { skema: d.skema.kode, versi: d.templat.versi, sumber: sesi ? "semar" : "bima" } });
  return new NextResponse(new Uint8Array(bytes), { headers: kepalaUnduhan(namaBerkasTemplat(d.skema, d.templat, mode), TIPE_DOCX_TEMPLAT, bytes.length) });
}
