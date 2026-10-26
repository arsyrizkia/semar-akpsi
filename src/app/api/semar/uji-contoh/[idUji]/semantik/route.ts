import { NextResponse } from "next/server";
import { z } from "zod";
import { ambilSesi } from "@/lib/auth";
import { UjiDitolakError, ujiSemantikSatu } from "@/lib/aturan/uji-jalan";

export const dynamic = "force-dynamic";
// satu butir semantik atas satu dokumen = satu panggilan LLM
export const maxDuration = 60;

const badan = z.object({ dokumenKode: z.string().min(1).max(60), butirKode: z.string().min(1).max(60) });

/**
 * Langkah 3 "Uji pada Contoh" (M-15): satu butir semantik atas satu dokumen. Route handler, bukan server action, karena peramban
 * menjalankan server action satu per satu; lewat fetch beberapa penilaian berjalan bersamaan. Hanya pengelola Tim Kerja DPPM.
 */
export async function POST(req: Request, { params }: { params: Promise<{ idUji: string }> }) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });
  if (sesi.akun.peran !== "tim_kerja" || !sesi.pengelola) return NextResponse.json({ galat: "Hanya pengelola Tim Kerja DPPM" }, { status: 403 });
  const { idUji } = await params;
  const isi = badan.safeParse(await req.json().catch(() => null));
  if (!z.string().uuid().safeParse(idUji).success || !isi.success) return NextResponse.json({ galat: "Permintaan tidak dikenali" }, { status: 400 });
  try {
    const h = await ujiSemantikSatu(idUji, isi.data.dokumenKode, isi.data.butirKode);
    return NextResponse.json({ status: h.status, tiruan: Boolean(h.tiruan) });
  } catch (e) {
    if (e instanceof UjiDitolakError) return NextResponse.json({ galat: e.message }, { status: 409 });
    console.error("uji-contoh semantik", e);
    return NextResponse.json({ galat: "Penilaian semantik gagal." }, { status: 500 });
  }
}
