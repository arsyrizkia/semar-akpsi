import { NextResponse } from "next/server";
import { catatLogAudit } from "@/lib/audit";
import { ambilSesi } from "@/lib/auth";
import { TIPE_DOCX_TEMPLAT, buatDokumenTemplat, namaBerkasTemplat } from "@/lib/templat/dokumen";
import { kepalaUnduhan } from "@/lib/unduhan";
import { dataTemplatById } from "@/lib/unduhan-db";

export const dynamic = "force-dynamic";

/** Unduh templat (.docx) per versi: J-02 (versi mana pun) dan J-02b (pratinjau draf). Hanya Tim Kerja DPPM pengelola. */
export async function GET(req: Request, { params }: { params: Promise<{ idTemplat: string }> }) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });
  if (sesi.akun.peran !== "tim_kerja" || !sesi.pengelola) return NextResponse.json({ galat: "Hanya pengelola Tim Kerja DPPM" }, { status: 403 });

  const { idTemplat } = await params;
  const d = await dataTemplatById(idTemplat);
  if (!d) return NextResponse.json({ galat: "Templat tidak ditemukan" }, { status: 404 });

  const mode = new URL(req.url).searchParams.get("mode") === "isian" ? "isian" : "paket";
  const bytes = await buatDokumenTemplat(d.templat, d.bagian, d.templat.lampiranWajib, d.skema, d.periode, { ...d.paket, mode });
  const nama = namaBerkasTemplat(d.skema, d.templat, mode);
  await catatLogAudit({ aktor: sesi.akun.idBima, aksi: "templat.unduh", objek: `templat:${d.templat.id}`, rincian: { skema: d.skema.kode, versi: d.templat.versi, status: d.templat.status } });
  return new NextResponse(new Uint8Array(bytes), { headers: kepalaUnduhan(nama, TIPE_DOCX_TEMPLAT, bytes.length) });
}
