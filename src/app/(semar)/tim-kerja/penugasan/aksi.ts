"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { wajibTimKerja } from "@/lib/auth";
import { BimaGagalError } from "@/lib/bima/client";
import { catatLogAudit } from "@/lib/audit";
import { MasaBelumDitutupError, PenugasanDitolakError, pindahkanBanyak, susunPenugasan, tetapkanPenugasan, type PilihanPindah } from "@/lib/penugasan/layanan";
import type { TujuanPindah } from "@/lib/penugasan/aturan";
import type { HasilPindahAksi, HasilSusunAksi, HasilTetapkanAksi } from "./tipe";

const JALUR = "/tim-kerja/penugasan";

/** Galat tak terduga (mis. galat basis data berisi SQL dan parameter) dicatat di server; pengguna menerima pesan umum. */
function pesanUmum(e: unknown, umum: string): string {
  if (e instanceof PenugasanDitolakError || e instanceof MasaBelumDitutupError) return e.message;
  if (e instanceof Error && e.message.startsWith("Batas Beban per Reviewer")) return e.message;
  console.error(umum, e);
  return `${umum} Coba lagi; bila berulang, muat ulang halaman.`;
}
const segarkan = () => revalidatePath(JALUR, "layout");
const skemaUuid = z.string().uuid();

/** UC-03 s.2-5, S-1: "Susun Usulan Penugasan". */
export async function aksiSusun(_sebelumnya: HasilSusunAksi, data: FormData): Promise<HasilSusunAksi> {
  const sesi = await wajibTimKerja();
  const periodeId = skemaUuid.safeParse(data.get("periodeId"));
  const batas = Number(String(data.get("batas") ?? "").trim());
  if (!periodeId.success) return { galat: "Periode tidak dikenali." };
  if (!Number.isInteger(batas) || batas < 1) return { galat: "Isi “Batas Beban per Reviewer” dengan bilangan bulat minimal 1." };
  try {
    await catatLogAudit({ aktor: sesi.akun.idBima, aksi: "minta_susun_penugasan", objek: `periode:${periodeId.data}`, rincian: { batas } });
    const hasil = await susunPenugasan(periodeId.data, batas);
    segarkan();
    if (hasil.jumlahBelumDitugaskan > 0) return { kekurangan: hasil.jumlahBelumDitugaskan, batasDipakai: batas, rincian: hasil.kekurangan };
    return { berhasil: true, jumlahUsulan: hasil.jumlahUsulan };
  } catch (e) {
    if (e instanceof BimaGagalError) return { galat: `Daftar reviewer dari BIMA tidak dapat diambil: ${e.message}. Tekan "Susun Usulan Penugasan" untuk mencoba lagi.` };
    return { galat: pesanUmum(e, "Usulan penugasan gagal disusun.") };
  }
}

const skemaFilter = z.object({
  q: z.string().max(100),
  rev: z.string().uuid().nullable(),
  inst: z.string().max(100).nullable(),
  skema: z.string().max(100).nullable(),
  melanggar: z.boolean(),
  urut: z.enum(["id", "judul", "reviewer", "institusi"]),
});
const skemaPilihan = z.union([z.object({ ids: z.array(z.string().uuid()).min(1).max(20_000) }), z.object({ filter: skemaFilter })]);
const skemaTujuan = z.union([z.object({ jenis: z.literal("reviewer"), reviewerId: z.string().uuid() }), z.object({ jenis: z.literal("otomatis") })]);

/**
 * UC-03 S-2.1-S-2.3: pratinjau (simpan = false) dan "Simpan Pemindahan" (simpan = true) untuk satu atau banyak baris. Syarat diperiksa
 * ulang di server dalam transaksi berkunci; baris yang melanggar tetap pada reviewer semula.
 */
export async function aksiPindah(periodeId: string, pilihan: PilihanPindah, tujuan: TujuanPindah, simpan: boolean): Promise<HasilPindahAksi> {
  const sesi = await wajibTimKerja();
  const id = skemaUuid.safeParse(periodeId);
  const p = skemaPilihan.safeParse(pilihan);
  const t = skemaTujuan.safeParse(tujuan);
  if (!id.success || !p.success) return { ok: false, galat: "Pilih proposal yang akan dipindahkan." };
  if (!t.success) return { ok: false, galat: "Pilih “Reviewer Pengganti” terlebih dahulu." };
  try {
    const hasil = await pindahkanBanyak(id.data, p.data, t.data, { simpan, aktor: sesi.akun.idBima });
    if (simpan) segarkan();
    return { ok: true, ...hasil };
  } catch (e) {
    return { ok: false, galat: pesanUmum(e, "Pemindahan gagal diproses.") };
  }
}

/** UC-03 s.7-8: "Tetapkan Penugasan" (dan "Kirim ulang" bila BIMA gagal). */
export async function aksiTetapkan(periodeId: string): Promise<HasilTetapkanAksi> {
  const sesi = await wajibTimKerja();
  const id = skemaUuid.safeParse(periodeId);
  if (!id.success) return { berhasil: false, galat: "Periode tidak dikenali." };
  try {
    const { jumlah } = await tetapkanPenugasan(id.data, sesi.akun.idBima);
    segarkan();
    if (jumlah === 0) return { berhasil: false, galat: "Belum ada usulan penugasan yang dapat ditetapkan." };
    return { berhasil: true, jumlah };
  } catch (e) {
    segarkan();
    if (e instanceof BimaGagalError) return { berhasil: false, gagalBima: true, galat: `Penugasan gagal dikirim ke BIMA: ${e.message}` };
    return { berhasil: false, galat: pesanUmum(e, "Penugasan gagal ditetapkan.") };
  }
}
