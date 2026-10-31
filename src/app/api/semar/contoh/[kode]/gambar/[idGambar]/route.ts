import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { gambarNaskah } from "@/db/schema";
import { ambilSesi } from "@/lib/auth";
import { pemilikContoh } from "@/lib/pengajuan/gambar-simpan";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Satu gambar naskah dokumen "Uji pada Contoh" (gambar_naskah berpemilik contoh:<kode>), untuk teks bersorot J-03b per dokumen. Hanya
 * Tim Kerja DPPM pengelola, sama dengan unduh naskah contoh.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ kode: string; idGambar: string }> }) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });
  if (sesi.akun.peran !== "tim_kerja" || !sesi.pengelola) return NextResponse.json({ galat: "Hanya pengelola Tim Kerja DPPM" }, { status: 403 });

  const { kode, idGambar } = await params;
  if (!/^[a-z0-9-]{1,40}$/i.test(kode) || !UUID.test(idGambar)) return NextResponse.json({ galat: "Gambar tidak ditemukan" }, { status: 404 });
  // gambar harus milik dokumen contoh ini (bukan versi proposal atau contoh lain)
  const [g] = await getDb()
    .select()
    .from(gambarNaskah)
    .where(and(eq(gambarNaskah.id, idGambar), eq(gambarNaskah.pemilik, pemilikContoh(kode))));
  if (!g) return NextResponse.json({ galat: "Gambar tidak ditemukan pada contoh ini" }, { status: 404 });

  return new NextResponse(new Uint8Array(g.bytes), {
    headers: { "Content-Type": g.tipe, "Content-Length": String(g.bytes.length), "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
