import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dokumenContoh } from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { ambilSesi } from "@/lib/auth";
import { adalahVarianContoh, buatDocx, susunContoh } from "@/lib/contoh/proposal";
import { TIPE_DOCX_TEMPLAT } from "@/lib/templat/dokumen";
import { kepalaUnduhan } from "@/lib/unduhan";

export const dynamic = "force-dynamic";

/**
 * Unduh naskah contoh "Uji pada Contoh" (M-15, J-03b) sebagai .docx, supaya Tim Kerja dapat membaca naskah yang diuji. Contoh bawaan
 * (contoh-a, -b, -c, -f) dibangkitkan ulang dengan pembangkit yang sama dengan teks tersimpannya (susunContoh + buatDocx), jadi isinya
 * persis yang diuji. Naskah unggahan tidak disimpan berkas aslinya (hanya teks terbaca), jadi tidak dapat diunduh di sini.
 * Hanya Tim Kerja DPPM pengelola (sama dengan pengguna M-15).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ kode: string }> }) {
  const sesi = await ambilSesi();
  if (!sesi) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });
  if (sesi.akun.peran !== "tim_kerja" || !sesi.pengelola) return NextResponse.json({ galat: "Hanya pengelola Tim Kerja DPPM" }, { status: 403 });

  const { kode } = await params;
  if (!/^[a-z0-9-]{1,40}$/i.test(kode)) return NextResponse.json({ galat: "Contoh tidak ditemukan" }, { status: 404 });
  const [d] = await getDb().select({ kode: dokumenContoh.kode, nama: dokumenContoh.nama, varian: dokumenContoh.varian }).from(dokumenContoh).where(eq(dokumenContoh.kode, kode));
  if (!d) return NextResponse.json({ galat: "Contoh tidak ditemukan" }, { status: 404 });
  if (!adalahVarianContoh(d.varian)) return NextResponse.json({ galat: "Naskah unggahan tidak disimpan berkas aslinya; pakai berkas yang Anda unggah." }, { status: 404 });

  const bytes = await buatDocx(susunContoh(d.varian));
  await catatLogAudit({ aktor: sesi.akun.idBima, aksi: "contoh.unduh", objek: `contoh:${d.kode}`, rincian: { varian: d.varian } });
  return new NextResponse(new Uint8Array(bytes), { headers: kepalaUnduhan(`${d.nama}.docx`, TIPE_DOCX_TEMPLAT, bytes.length) });
}
