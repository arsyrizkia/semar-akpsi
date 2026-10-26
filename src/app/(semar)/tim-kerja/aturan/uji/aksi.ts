"use server";

import { z } from "zod";
import { wajibPengelola } from "@/lib/auth";
import { UjiDitolakError, mulaiUji, selesaikanUji, ujiDeterministik, type RencanaUji } from "@/lib/aturan/uji-jalan";

const uuid = z.string().uuid();
const opsionalUuid = z.string().uuid().nullable();

type Hasil<T> = ({ ok: true } & T) | { ok: false; galat: string };

function pesan(e: unknown, umum: string): string {
  if (e instanceof UjiDitolakError) return e.message;
  console.error(umum, e);
  return `${umum} Coba lagi.`;
}

/** Langkah 1 "Uji pada Contoh": contoh terpilih (kode) dan berkas unggahan (.docx/.pdf, maks 3,5 MB) dalam FormData. */
export async function aksiMulaiUji(data: FormData): Promise<Hasil<{ rencana: RencanaUji }>> {
  const sesi = await wajibPengelola();
  const skema = uuid.safeParse(data.get("skemaId"));
  const periode = opsionalUuid.safeParse(data.get("periodeId") || null);
  const templat = opsionalUuid.safeParse(data.get("templatId") || null);
  if (!skema.success || !periode.success || !templat.success) return { ok: false, galat: "Skema atau periode tidak dikenali." };
  const kodeContoh = data.getAll("contoh").map(String).filter((k) => /^[a-z0-9-]{1,40}$/i.test(k));
  const berkas = data.getAll("berkas").filter((b): b is File => b instanceof File && b.size > 0);
  try {
    const rencana = await mulaiUji({
      skemaId: skema.data,
      periodeId: periode.data,
      templatId: templat.data,
      kodeContoh,
      unggahan: await Promise.all(berkas.map(async (f) => ({ nama: f.name, tipe: f.type, bytes: Buffer.from(await f.arrayBuffer()) }))),
      pelaku: sesi.akun.idBima,
    });
    return { ok: true, rencana };
  } catch (e) {
    return { ok: false, galat: pesan(e, "Uji tidak dapat dimulai.") };
  }
}

/** Langkah 2: semua butir deterministik. */
export async function aksiUjiDeterministik(ujiId: string): Promise<Hasil<{ lolos: number; gagal: number }>> {
  await wajibPengelola();
  const id = uuid.safeParse(ujiId);
  if (!id.success) return { ok: false, galat: "Uji tidak dikenali." };
  try {
    return { ok: true, ...(await ujiDeterministik(id.data)) };
  } catch (e) {
    return { ok: false, galat: pesan(e, "Pemeriksaan deterministik gagal.") };
  }
}

// Langkah 3 (satu butir semantik) lewat route handler /api/semar/uji-contoh/[idUji]/semantik supaya dapat berjalan bersamaan.

/** Langkah 4: selesai atau dihentikan. */
export async function aksiSelesaikanUji(ujiId: string, dihentikan: boolean): Promise<Hasil<object>> {
  const sesi = await wajibPengelola();
  const id = uuid.safeParse(ujiId);
  if (!id.success) return { ok: false, galat: "Uji tidak dikenali." };
  await selesaikanUji(id.data, dihentikan, sesi.akun.idBima);
  return { ok: true };
}
