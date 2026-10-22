"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { wajibTimKerja } from "@/lib/auth";
import { BimaGagalError } from "@/lib/bima/client";
import { catatLogAudit } from "@/lib/audit";
import { MasaBelumDitutupError, pilihReviewer, susunPenugasan, tetapkanPenugasan } from "@/lib/penugasan/layanan";
import type { HasilPilihReviewer } from "@/lib/kontrak/tipe";
import type { HasilPindahAksi, HasilSusunAksi, HasilTetapkanAksi } from "./tipe";

const JALUR = "/tim-kerja/penugasan";
const skemaUuid = z.string().uuid();

/** UC-03 s.2-5, S-1: "Susun Usulan Penugasan". */
export async function aksiSusun(_sebelumnya: HasilSusunAksi, data: FormData): Promise<HasilSusunAksi> {
  const sesi = await wajibTimKerja();
  const periodeId = skemaUuid.safeParse(data.get("periodeId"));
  const batas = Number(String(data.get("batas") ?? "").trim());
  if (!periodeId.success) return { galat: "Periode tidak dikenali." };
  if (!Number.isInteger(batas) || batas < 1) return { galat: "Isi \"Batas Beban per Reviewer\" dengan bilangan bulat minimal 1." };
  try {
    const mulai = Date.now();
    await catatLogAudit({ aktor: sesi.akun.idBima, aksi: "minta_susun_penugasan", objek: `periode:${periodeId.data}`, rincian: { batas } });
    const hasil = await susunPenugasan(periodeId.data, batas);
    const durasiMs = Date.now() - mulai;
    revalidatePath(JALUR);
    if (hasil.jumlahBelumDitugaskan > 0) return { kekurangan: hasil.jumlahBelumDitugaskan, batasDipakai: batas, durasiMs };
    return { berhasil: true, jumlahUsulan: hasil.jumlahUsulan, durasiMs };
  } catch (e) {
    if (e instanceof MasaBelumDitutupError) return { galat: e.message };
    if (e instanceof BimaGagalError) return { galat: `Daftar reviewer dari BIMA tidak dapat diambil: ${e.message}. Tekan "Susun Usulan Penugasan" untuk mencoba lagi.` };
    return { galat: e instanceof Error ? e.message : "Usulan penugasan gagal disusun." };
  }
}

/** UC-03 S-2.1-S-2.3: "Simpan Pemindahan". */
export async function aksiPindah(penugasanId: string, reviewerBaruId: string): Promise<HasilPindahAksi> {
  const sesi = await wajibTimKerja();
  const a = skemaUuid.safeParse(penugasanId);
  const b = skemaUuid.safeParse(reviewerBaruId);
  if (!a.success || !b.success) return { diterima: false, syaratDilanggar: [], galat: "Pilih \"Reviewer Pengganti\" terlebih dahulu." };
  try {
    const hasil: HasilPilihReviewer = await pilihReviewer(a.data, b.data, sesi.akun.idBima);
    revalidatePath(JALUR);
    return { diterima: hasil.diterima, syaratDilanggar: hasil.syaratDilanggar };
  } catch (e) {
    return { diterima: false, syaratDilanggar: [], galat: e instanceof Error ? e.message : "Pemindahan gagal disimpan." };
  }
}

/** UC-03 s.7-8: "Tetapkan Penugasan" (dan "Kirim ulang" bila BIMA gagal). */
export async function aksiTetapkan(periodeId: string): Promise<HasilTetapkanAksi> {
  const sesi = await wajibTimKerja();
  const id = skemaUuid.safeParse(periodeId);
  if (!id.success) return { berhasil: false, galat: "Periode tidak dikenali." };
  try {
    const mulai = Date.now();
    const { jumlah } = await tetapkanPenugasan(id.data, sesi.akun.idBima);
    const durasiMs = Date.now() - mulai;
    revalidatePath(JALUR);
    if (jumlah === 0) return { berhasil: false, galat: "Belum ada usulan penugasan yang dapat ditetapkan." };
    return { berhasil: true, jumlah, durasiMs };
  } catch (e) {
    revalidatePath(JALUR);
    if (e instanceof BimaGagalError) {
      return { berhasil: false, gagalBima: true, galat: `Penugasan gagal dikirim ke BIMA: ${e.message}` };
    }
    return { berhasil: false, galat: e instanceof Error ? e.message : "Penugasan gagal ditetapkan." };
  }
}
