import { NextResponse } from "next/server";
import { ambilSesiBima } from "@/lib/bima/sesi";
import { templatLampiran } from "@/lib/bima/lampiran";
import { buatDokumenLampiran } from "@/lib/bima/lampiran-dokumen";
import { TIPE_DOCX_TEMPLAT } from "@/lib/templat/dokumen";
import { kepalaUnduhan } from "@/lib/unduhan";

export const dynamic = "force-dynamic";

/** Unduh templat lampiran (.docx) di BIMA tiruan, mis. ?nama=Surat Pernyataan Mitra. Hanya untuk pengusul yang masuk di BIMA. */
export async function GET(req: Request) {
  if (!(await ambilSesiBima())) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });
  const nama = new URL(req.url).searchParams.get("nama") ?? "";
  const t = templatLampiran(nama);
  if (!t) return NextResponse.json({ galat: "Lampiran ini tidak memiliki templat; unggah berkas Anda sendiri" }, { status: 404 });
  const bytes = await buatDokumenLampiran(t);
  return new NextResponse(new Uint8Array(bytes), { headers: kepalaUnduhan(`Templat-${t.nama.replace(/\s+/g, "-")}.docx`, TIPE_DOCX_TEMPLAT, bytes.length) });
}
