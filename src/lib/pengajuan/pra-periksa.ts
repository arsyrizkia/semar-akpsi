/**
 * Pra-periksa (UC-06 di dalam UC-05, M-16 Pemeriksaan SEMAR di BIMA): pemeriksaan deterministik atas naskah yang diunggah pengusul pada
 * langkah Substansi Usulan BIMA, SEBELUM naskah disimpan ke BIMA dan usulan dapat dikirim. Rantainya sama dengan pemeriksaan resmi
 * (prosesPengajuan dan jalankanPemeriksaanDeterministik): templat dan basis aturan berlaku periode berjalan, butir deterministik
 * Aktif/Perlu ditinjau, ekstrakNaskah -> potongTeks -> periksaDeterministikTeks. Tidak membuat versi dan tidak menulis hasil; isi
 * gambar tidak disiapkan karena butir deterministik cukup membaca penanda "[gambar]".
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { butirCek, skemaPendanaan } from "@/db/schema";
import type { ButirCek, DokumenPeriksa, HasilButirDeterministik } from "@/lib/kontrak/tipe";
import { keButirCek, periksaDeterministikTeks } from "@/lib/pemeriksa/deterministik";
import { bagianDariBaris } from "@/lib/templat/isian-substansi";
import { ekstrakNaskah, jenisBerkas } from "./ekstraksi";
import { ambilAturanBerlaku, ambilPeriodeBerjalan, ambilTemplatBerlaku } from "./layanan";
import { potongTeks } from "./potong";

/** Batas unggahan pada simulasi: badan permintaan fungsi Vercel dibatasi 4,5 MB (BIMA asli: 5 MB). */
export const BATAS_PRA_PERIKSA_BYTE = 4 * 1024 * 1024;

export class PraPeriksaDitolak extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = "PraPeriksaDitolak";
  }
}

export interface BarisPraPeriksa {
  /** hanya kunci internal; tidak ditampilkan */
  kode: string;
  deskripsi: string;
  bagian: string | null;
  status: "Lolos" | "Gagal";
  angkaPembukti: string;
  batasDilanggar: string | null;
}

export interface HasilPraPeriksa {
  lolos: boolean;
  jumlahButir: number;
  jumlahGagal: number;
  bagianDikenali: number;
  bagianTemplat: number;
  /** Gagal lebih dulu, lalu menurut urutan butir */
  baris: BarisPraPeriksa[];
}

/** Hasil pemeriksaan + deskripsi butir menjadi hasil pra-periksa (murni). */
export function susunHasilPraPeriksa(hasil: HasilButirDeterministik[], butir: ButirCek[], bagian: { dikenali: number; templat: number }): HasilPraPeriksa {
  const urutan = new Map(butir.map((b, i) => [b.kode, { i, deskripsi: b.deskripsi }]));
  const baris = hasil
    .map((h) => ({
      kode: h.kode,
      deskripsi: urutan.get(h.kode)?.deskripsi ?? h.kode,
      bagian: h.bagian,
      status: h.status,
      angkaPembukti: h.angkaPembukti,
      batasDilanggar: h.status === "Gagal" ? h.batasDilanggar : null,
    }))
    .sort((a, b) => Number(a.status === "Lolos") - Number(b.status === "Lolos") || (urutan.get(a.kode)?.i ?? 0) - (urutan.get(b.kode)?.i ?? 0));
  const jumlahGagal = baris.filter((b) => b.status === "Gagal").length;
  return { lolos: baris.length > 0 && jumlahGagal === 0, jumlahButir: baris.length, jumlahGagal, bagianDikenali: bagian.dikenali, bagianTemplat: bagian.templat, baris };
}

export async function praPeriksaNaskah(
  berkas: { bytes: Buffer; nama: string; tipe: string },
  k: { skemaKode: string; judulBima: string; lampiranAda: string[] },
): Promise<HasilPraPeriksa> {
  if (berkas.bytes.length > BATAS_PRA_PERIKSA_BYTE) throw new PraPeriksaDitolak("Ukuran dokumen melebihi 4 MB.");
  if (jenisBerkas(berkas.nama, berkas.tipe, berkas.bytes) !== "pdf") throw new PraPeriksaDitolak("Dokumen usulan harus berformat PDF.");

  const db = getDb();
  const periode = await ambilPeriodeBerjalan();
  const [skema] = await db.select().from(skemaPendanaan).where(eq(skemaPendanaan.kode, k.skemaKode));
  if (!skema) throw new PraPeriksaDitolak("Skema usulan tidak dikenal SEMAR.");
  const [{ bagian }, basis] = await Promise.all([ambilTemplatBerlaku(periode.id, skema.id), ambilAturanBerlaku(periode.id, skema.id)]);
  const bagianTemplat = bagian.map(bagianDariBaris);
  const butir = (
    await db
      .select()
      .from(butirCek)
      .where(and(eq(butirCek.basisAturanId, basis.id), eq(butirCek.jenis, "deterministik"), inArray(butirCek.status, ["Aktif", "Perlu ditinjau"])))
      .orderBy(asc(butirCek.urutan))
  ).map(keButirCek);

  let blok;
  try {
    blok = await ekstrakNaskah(berkas.bytes, berkas.nama, berkas.tipe, { gambar: false });
  } catch {
    throw new PraPeriksaDitolak("Dokumen tidak dapat dibaca. Pastikan PDF tidak terkunci kata sandi dan tidak rusak.");
  }
  const potong = potongTeks(blok, bagianTemplat);
  const dokumen: DokumenPeriksa = {
    judul: potong.judulDokumen,
    judulBima: k.judulBima,
    teksPerBagian: potong.teksPerBagian,
    kataKunci: potong.kataKunci,
    lampiranAda: k.lampiranAda,
    teksLampiran: {},
    judulBagianDitemukan: potong.judulBagianDitemukan,
  };
  return susunHasilPraPeriksa(periksaDeterministikTeks(dokumen, butir, { bagianTemplat }), butir, {
    dikenali: potong.judulBagianDitemukan.length,
    templat: bagianTemplat.length,
  });
}
