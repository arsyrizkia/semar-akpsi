/**
 * Sisi BIMA tiruan untuk halaman pengajuan (agen C). Berkas baru, tidak mengubah servis.ts.
 * Hanya dipakai halaman dan route /bima/pengajuan. Menyimpan unggahan ke bima_proposal dan bima_berkas.
 *
 * Catatan batas sistem: daftar skema dan ada-tidaknya templat Terbit dibaca dari tabel SEMAR (skema_pendanaan, templat_proposal)
 * karena BIMA tiruan berbagi satu basis data dengan SEMAR dan tidak memiliki katalog skema sendiri. Lampiran wajib dan templat
 * lampirannya milik BIMA (src/lib/bima/lampiran.ts), bukan templat SEMAR.
 */
import { and, desc, eq, inArray, like } from "drizzle-orm";
import { lampiranWajibSkema } from "./lampiran";
import { getDb } from "@/db";
import { ambilPeriodeBerjalanId } from "@/lib/waktu";
import { bimaBerkas, bimaKotakMasuk, bimaProposal, skemaPendanaan, templatProposal } from "@/db/schema";
import { simpanBerkas } from "../berkas";

export interface OpsiSkemaBima {
  kode: string;
  nama: string;
  /** nama lampiran wajib skema menurut konfigurasi BIMA (bukan templat SEMAR) */
  lampiranWajib: string[];
  /** ada templat Terbit untuk skema ini (tombol "Unduh Templat" hanya bila ada) */
  adaTemplat: boolean;
}

export async function daftarSkemaBima(): Promise<OpsiSkemaBima[]> {
  const db = getDb();
  const skema = await db.select().from(skemaPendanaan).orderBy(skemaPendanaan.kode);
  const hasil: OpsiSkemaBima[] = [];
  const berjalan = await ambilPeriodeBerjalanId();
  for (const s of skema) {
    const daftar = await db
      .select({ periodeBerlakuId: templatProposal.periodeBerlakuId })
      .from(templatProposal)
      .where(and(eq(templatProposal.skemaId, s.id), eq(templatProposal.status, "Terbit")))
      .orderBy(desc(templatProposal.versi));
    const t = daftar.find((x) => x.periodeBerlakuId === berjalan) ?? daftar[0];
    hasil.push({ kode: s.kode, nama: s.namaSkema, lampiranWajib: lampiranWajibSkema(s.kode), adaTemplat: Boolean(t) });
  }
  return hasil;
}

export interface UsulanBima {
  id: string;
  judul: string;
  skemaKode: string;
  statusBima: string;
  naskah: { id: string; nama: string; ukuran: number } | null;
  lampiran: { id: string; namaLampiran: string; nama: string; ukuran: number }[];
  /** naskah tersimpan lolos pra-periksa SEMAR (M-16); null bila belum atau naskah sudah berganti */
  praPeriksa: { jumlahButir: number; pada: string } | null;
  diperbaruiPada: Date;
}

export async function daftarUsulanPengusul(idBima: string): Promise<UsulanBima[]> {
  const db = getDb();
  const proposal = await db.select().from(bimaProposal).where(eq(bimaProposal.pengusulIdBima, idBima)).orderBy(bimaProposal.id);
  const hasil: UsulanBima[] = [];
  for (const p of proposal) {
    const berkas = await db.select().from(bimaBerkas).where(eq(bimaBerkas.proposalId, p.id));
    const naskah = berkas.find((b) => b.peran === "naskah");
    hasil.push({
      id: p.id,
      judul: p.judul,
      skemaKode: p.skemaKode,
      statusBima: p.statusBima,
      naskah: naskah ? { id: naskah.id, nama: naskah.nama, ukuran: naskah.ukuran } : null,
      lampiran: berkas.filter((b) => b.peran === "lampiran" && b.namaLampiran).map((b) => ({ id: b.id, namaLampiran: b.namaLampiran!, nama: b.nama, ukuran: b.ukuran })),
      praPeriksa: p.praPeriksa && naskah && p.praPeriksa.berkasId === naskah.id ? { jumlahButir: p.praPeriksa.jumlahButir, pada: p.praPeriksa.pada } : null,
      diperbaruiPada: p.diperbaruiPada,
    });
  }
  return hasil;
}

export async function ambilUsulanPengusul(idBima: string, id: string): Promise<UsulanBima | null> {
  return (await daftarUsulanPengusul(idBima)).find((u) => u.id === id) ?? null;
}

async function idProposalBerikut(tahun: number): Promise<string> {
  const awalan = `PRP-${tahun}-`;
  const ada = await getDb().select({ id: bimaProposal.id }).from(bimaProposal).where(like(bimaProposal.id, `${awalan}%`));
  const terbesar = ada.reduce((m, x) => Math.max(m, Number(x.id.slice(awalan.length)) || 0), 0);
  return `${awalan}${String(terbesar + 1).padStart(4, "0")}`;
}

export interface BerkasUnggahan {
  nama: string;
  tipe: string;
  bytes: Buffer;
}

export interface MasukanUsulan {
  pengusulIdBima: string;
  /** kosong untuk usulan baru */
  idProposal?: string;
  judul: string;
  skemaKode: string;
  naskah?: BerkasUnggahan;
  /** kunci = nama lampiran wajib */
  lampiran: Record<string, BerkasUnggahan>;
}

/**
 * Menyimpan usulan dan berkasnya di BIMA tiruan lalu menandainya "Diajukan ke SEMAR".
 * Berkas lama dengan peran/nama lampiran yang sama digantikan supaya API BIMA selalu menyajikan berkas terbaru.
 */
export async function simpanUsulanBima(m: MasukanUsulan): Promise<{ idProposal: string }> {
  const db = getDb();
  let id = m.idProposal;
  if (id) {
    const [ada] = await db.select().from(bimaProposal).where(eq(bimaProposal.id, id));
    if (!ada || ada.pengusulIdBima !== m.pengusulIdBima) throw new Error("usulan tidak ditemukan atau bukan milik pengusul");
    if (ada.statusBima === "Terkirim") throw new Error("usulan sudah terkirim dan tidak dapat diajukan ulang");
    await db.update(bimaProposal).set({ judul: m.judul, skemaKode: m.skemaKode, statusBima: "Diajukan ke SEMAR", diperbaruiPada: new Date() }).where(eq(bimaProposal.id, id));
  } else {
    id = await idProposalBerikut(new Date().getFullYear());
    await db.insert(bimaProposal).values({ id, judul: m.judul, skemaKode: m.skemaKode, pengusulIdBima: m.pengusulIdBima, statusBima: "Diajukan ke SEMAR" });
  }

  if (m.naskah) {
    await db.delete(bimaBerkas).where(and(eq(bimaBerkas.proposalId, id), eq(bimaBerkas.peran, "naskah")));
    const b = await simpanBerkas({ ruang: "bima", nama: m.naskah.nama, tipe: m.naskah.tipe, bytes: m.naskah.bytes, peran: "naskah", proposalId: id });
    // naskah berganti: hasil pra-periksa naskah lama tidak berlaku lagi
    await db.update(bimaProposal).set({ naskahBerkasId: b.id, praPeriksa: null }).where(eq(bimaProposal.id, id));
  }
  for (const [namaLampiran, berkas] of Object.entries(m.lampiran)) {
    await db.delete(bimaBerkas).where(and(eq(bimaBerkas.proposalId, id), eq(bimaBerkas.peran, "lampiran"), eq(bimaBerkas.namaLampiran, namaLampiran)));
    await simpanBerkas({ ruang: "bima", nama: berkas.nama, tipe: berkas.tipe, bytes: berkas.bytes, peran: "lampiran", proposalId: id, namaLampiran });
  }
  return { idProposal: id };
}

export class UsulanDitolak extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = "UsulanDitolak";
  }
}

/** Usulan milik pengusul yang masih dapat disunting (belum Terkirim). */
async function usulanTerbuka(idBima: string, idProposal: string) {
  const [u] = await getDb().select().from(bimaProposal).where(eq(bimaProposal.id, idProposal));
  if (!u || u.pengusulIdBima !== idBima) throw new UsulanDitolak("Usulan tidak ditemukan.");
  if (u.statusBima === "Terkirim") throw new UsulanDitolak("Usulan sudah terkirim dan tidak dapat diubah.");
  return u;
}

/**
 * M-16: naskah yang lolos pra-periksa SEMAR (tiket sudah diverifikasi pemanggil) disimpan sebagai dokumen usulan, beserta catatan
 * pra_periksa yang mengikat berkas baru itu. Status tetap Draf (atau kembali Draf sesudah Ditahan/Ditolak) sampai usulan dikirim.
 */
export async function simpanNaskahLolos(idBima: string, idProposal: string, naskah: BerkasUnggahan, pra: { sidik: string; jumlahButir: number }): Promise<void> {
  const db = getDb();
  await usulanTerbuka(idBima, idProposal);
  await db.delete(bimaBerkas).where(and(eq(bimaBerkas.proposalId, idProposal), eq(bimaBerkas.peran, "naskah")));
  const b = await simpanBerkas({ ruang: "bima", nama: naskah.nama, tipe: naskah.tipe, bytes: naskah.bytes, peran: "naskah", proposalId: idProposal });
  await db
    .update(bimaProposal)
    .set({ naskahBerkasId: b.id, statusBima: "Draf", praPeriksa: { berkasId: b.id, sidik: pra.sidik, jumlahButir: pra.jumlahButir, pada: new Date().toISOString() }, diperbaruiPada: new Date() })
    .where(eq(bimaProposal.id, idProposal));
}

/**
 * "Kirim Usulan" (langkah Konfirmasi): hanya bila naskah tersimpan lolos pra-periksa SEMAR. Status menjadi "Diajukan ke SEMAR";
 * pemanggil lalu meneruskannya ke SEMAR. Status akhir (Terkirim/Ditahan) dicerminkan SEMAR.
 */
export async function ajukanUsulan(idBima: string, idProposal: string): Promise<{ judul: string; skemaKode: string }> {
  const u = await usulanTerbuka(idBima, idProposal);
  if (!u.naskahBerkasId || !u.praPeriksa || u.praPeriksa.berkasId !== u.naskahBerkasId) {
    throw new UsulanDitolak("Dokumen usulan belum lolos pemeriksaan SEMAR. Unggah dokumen usulan di langkah Substansi Usulan.");
  }
  await getDb().update(bimaProposal).set({ statusBima: "Diajukan ke SEMAR", diperbaruiPada: new Date() }).where(eq(bimaProposal.id, idProposal));
  return { judul: u.judul, skemaKode: u.skemaKode };
}

/** Status usulan di BIMA (mis. "Ditolak" bila SEMAR menolak karena masa pengusulan sudah ditutup). */
export async function setStatusUsulan(idProposal: string, statusBima: string): Promise<void> {
  await getDb().update(bimaProposal).set({ statusBima, diperbaruiPada: new Date() }).where(eq(bimaProposal.id, idProposal));
}

/** Hasil penilaian administrasi yang diterima BIMA dari SEMAR untuk satu usulan (keputusan reviewer terbaru). */
export interface HasilPenilaianBima {
  memenuhi: number;
  jumlahKomponen: number;
  tidakMemenuhi: string[];
  umpanBalik: string;
  diterimaPada: Date;
}

/** Keputusan reviewer terbaru per usulan dari kotak masuk BIMA (tampil di halaman pengajuan pengusul). */
export async function hasilPenilaianUsulan(idProposal: string[]): Promise<Map<string, HasilPenilaianBima>> {
  const hasil = new Map<string, HasilPenilaianBima>();
  if (!idProposal.length) return hasil;
  const baris = await getDb()
    .select()
    .from(bimaKotakMasuk)
    .where(and(eq(bimaKotakMasuk.jenis, "keputusan"), inArray(bimaKotakMasuk.idProposal, idProposal)))
    .orderBy(desc(bimaKotakMasuk.diterimaPada));
  for (const b of baris) {
    if (!b.idProposal || hasil.has(b.idProposal)) continue;
    const p = b.payload as { komponen?: { komponen: string; keputusan: string }[]; umpanBalik?: string };
    const komponen = p.komponen ?? [];
    hasil.set(b.idProposal, {
      memenuhi: komponen.filter((k) => k.keputusan === "Memenuhi").length,
      jumlahKomponen: komponen.length,
      tidakMemenuhi: komponen.filter((k) => k.keputusan !== "Memenuhi").map((k) => k.komponen),
      umpanBalik: p.umpanBalik ?? "",
      diterimaPada: b.diterimaPada,
    });
  }
  return hasil;
}
