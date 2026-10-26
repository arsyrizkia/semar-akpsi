/**
 * "Uji pada Contoh" bertahap (UC-02 langkah 6, Contract C-10) supaya kemajuannya dapat ditampilkan di peramban:
 *  mulaiUji        : naskah unggahan dibaca dan dipotong per bagian templat lalu disimpan sebagai dokumen contoh; butir dan bagian
 *                    templat dibekukan pada baris uji_contoh;
 *  ujiDeterministik: semua butir deterministik atas semua dokumen (cepat, satu langkah);
 *  ujiSemantikSatu : satu butir semantik atas satu dokumen (satu panggilan LLM), dipanggil berulang dari peramban;
 *  selesaikanUji   : menandai selesai atau dihentikan.
 * Hasil tersimpan di uji_contoh_hasil dan dibaca J-03b, jadi membuka J-03b tidak memanggil LLM lagi.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { dokumenContoh, ujiContoh, ujiContohHasil } from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { adalahVarianContoh } from "@/lib/contoh/proposal";
import { VARIAN_ASLI } from "./contoh-asli";
import { nilaiSemantikTeks, periksaDeterministikTeks } from "@/lib/kontrak";
import type { BagianTemplatDto, ButirCek, DokumenPeriksa, HasilButirDeterministik, HasilButirSemantik, HasilUjiContoh } from "@/lib/kontrak";
import { nilaiSemantikDenganOpsi } from "@/lib/pemeriksa/semantik/mesin";
import { kirimPermintaanTiruan } from "@/lib/pemeriksa/semantik/llm";
import { ekstrakNaskah, jenisBerkas } from "@/lib/pengajuan/ekstraksi";
import { potongPerBagian } from "@/lib/pengajuan/potong";
import { siapkanButirUji, type ButirUji, type SumberUji } from "./layanan";

/** Batas satu unggahan (badan permintaan server action dibatasi 4 MB; Vercel 4,5 MB). */
export const BATAS_UNGGAH_BYTE = 3.5 * 1024 * 1024;

export class UjiDitolakError extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = "UjiDitolakError";
  }
}

export interface BerkasUnggah {
  nama: string;
  tipe: string;
  bytes: Buffer;
}

export interface RencanaUji {
  ujiId: string;
  dokumen: { kode: string; nama: string; unggahan: boolean; bagianDitemukan: number; bagianTemplat: number }[];
  deterministik: number;
  semantik: { kode: string; deskripsi: string }[];
  peringatan: string[];
}

type BarisDokumen = typeof dokumenContoh.$inferSelect;

const keDokumenPeriksa = (d: BarisDokumen): DokumenPeriksa => ({
  judul: d.judul,
  judulBima: d.judulBima,
  teksPerBagian: d.teksPerBagian,
  kataKunci: d.kataKunci,
  lampiranAda: d.lampiranAda,
  teksLampiran: d.teksLampiran,
  judulBagianDitemukan: d.judulBagianDitemukan,
});

/**
 * Dokumen contoh yang dapat dipilih untuk sebuah skema: PDF asli BIMA (semua skema; skema yang sama lebih dulu), lalu contoh rekaan
 * skema itu (bila belum ada, semua contoh rekaan), lalu unggahan. `unduh`: format berkas yang dapat diunduh (unggahan tidak disimpan
 * berkasnya).
 */
export async function daftarContohUji(skemaId: string): Promise<{ kode: string; nama: string; catatan: string | null; unggahan: boolean; unduh: "pdf" | "docx" | null }[]> {
  const db = getDb();
  const semua = await db.select().from(dokumenContoh);
  const asli = semua.filter((d) => d.varian === VARIAN_ASLI);
  let lain = semua.filter((d) => d.varian !== VARIAN_ASLI && d.skemaId === skemaId);
  if (!lain.some((d) => d.label !== "unggahan")) lain = [...lain, ...semua.filter((d) => d.varian !== VARIAN_ASLI && d.label !== "unggahan" && d.skemaId !== skemaId)];
  const urutan = (d: (typeof semua)[number]) => (d.varian === VARIAN_ASLI ? (d.skemaId === skemaId ? 0 : 1) : d.label === "unggahan" ? 3 : 2);
  return [...asli, ...lain]
    .sort((a, b) => urutan(a) - urutan(b) || a.kode.localeCompare(b.kode, "id", { numeric: true }))
    .map((d) => ({
      kode: d.kode,
      nama: d.nama,
      catatan: d.catatan,
      unggahan: d.label === "unggahan",
      unduh: d.varian === VARIAN_ASLI ? "pdf" : adalahVarianContoh(d.varian) ? "docx" : null,
    }));
}

/** Langkah 1: siapkan uji (baca unggahan, bekukan butir). Melempar UjiDitolakError untuk masukan yang tidak dapat diuji. */
export async function mulaiUji(m: { skemaId: string; periodeId: string | null; templatId: string | null; kodeContoh: string[]; unggahan: BerkasUnggah[]; pelaku: string }): Promise<RencanaUji> {
  const db = getDb();
  const siap = await siapkanButirUji(m.skemaId, m.periodeId, m.templatId);
  if (!siap) throw new UjiDitolakError("Skema ini belum memiliki basis aturan untuk diuji.");
  const peringatan: string[] = [];
  const dokumen: RencanaUji["dokumen"] = [];
  const jumlahBagian = siap.bagianTemplat.length;

  for (const u of m.unggahan) {
    if (u.bytes.byteLength > BATAS_UNGGAH_BYTE) throw new UjiDitolakError(`Berkas "${u.nama}" lebih dari 3,5 MB. Perkecil berkasnya (mis. kompres gambar) lalu unggah lagi.`);
    if (!jenisBerkas(u.nama, u.tipe, u.bytes)) throw new UjiDitolakError(`Berkas "${u.nama}" bukan .docx atau .pdf.`);
    const potong = potongPerBagian(await ekstrakNaskah(u.bytes, u.nama, u.tipe), siap.bagianTemplat as BagianTemplatDto[]);
    const ditemukan = Object.keys(potong.teksPerBagian).length;
    if (ditemukan === 0) peringatan.push(`Tidak ada bagian templat yang dikenali di "${u.nama}"; pastikan judul bagian (A. Judul, B. Ringkasan, ...) sesuai templat.`);
    const kode = `unggah-${randomUUID().slice(0, 8)}`;
    await db.insert(dokumenContoh).values({
      kode,
      nama: u.nama,
      skemaId: m.skemaId,
      varian: "u",
      judul: potong.judulDokumen || u.nama,
      judulBima: potong.judulDokumen || u.nama,
      teksPerBagian: potong.teksPerBagian,
      kataKunci: potong.kataKunci,
      judulBagianDitemukan: potong.judulBagianDitemukan,
      catatan: `Diunggah ${m.pelaku} untuk Uji pada Contoh.`,
      label: "unggahan",
    });
    dokumen.push({ kode, nama: u.nama, unggahan: true, bagianDitemukan: ditemukan, bagianTemplat: jumlahBagian });
  }

  if (m.kodeContoh.length) {
    const ada = await db.select().from(dokumenContoh).where(inArray(dokumenContoh.kode, m.kodeContoh));
    for (const kode of m.kodeContoh) {
      const d = ada.find((x) => x.kode === kode);
      if (d) dokumen.push({ kode, nama: d.nama, unggahan: d.label === "unggahan", bagianDitemukan: Object.keys(d.teksPerBagian).length, bagianTemplat: jumlahBagian });
    }
  }
  if (dokumen.length === 0) throw new UjiDitolakError("Pilih sekurang-kurangnya satu contoh atau unggah satu naskah.");

  const [uji] = await db
    .insert(ujiContoh)
    .values({
      skemaId: m.skemaId,
      periodeId: m.periodeId,
      templatId: m.templatId,
      sumber: siap.sumber as unknown as Record<string, unknown>,
      dokumen: dokumen.map((d) => d.kode),
      butir: siap.butir,
      bagianTemplat: siap.bagianTemplat,
      dibuatOleh: m.pelaku,
    })
    .returning({ id: ujiContoh.id });
  await catatLogAudit({ aktor: m.pelaku, aksi: "uji_contoh.mulai", objek: `uji:${uji.id}`, rincian: { dokumen: dokumen.map((d) => d.kode), butir: siap.butir.length } });

  return {
    ujiId: uji.id,
    dokumen,
    deterministik: siap.butir.filter((b) => b.jenis === "deterministik").length,
    semantik: siap.butir.filter((b) => b.jenis === "semantik").map((b) => ({ kode: b.kode, deskripsi: b.deskripsi })),
    peringatan,
  };
}

async function muatUji(ujiId: string) {
  const [uji] = await getDb().select().from(ujiContoh).where(eq(ujiContoh.id, ujiId));
  if (!uji) throw new UjiDitolakError("Uji tidak ditemukan. Mulai ulang Uji pada Contoh.");
  return uji;
}

async function muatDokumen(kode: string[]): Promise<Map<string, BarisDokumen>> {
  if (!kode.length) return new Map();
  const baris = await getDb().select().from(dokumenContoh).where(inArray(dokumenContoh.kode, kode));
  return new Map(baris.map((d) => [d.kode, d]));
}

/** Langkah 2: semua butir deterministik atas semua dokumen uji. */
export async function ujiDeterministik(ujiId: string): Promise<{ lolos: number; gagal: number }> {
  const db = getDb();
  const uji = await muatUji(ujiId);
  const det = (uji.butir as ButirCek[]).filter((b) => b.jenis === "deterministik");
  const dok = await muatDokumen(uji.dokumen);
  let lolos = 0;
  let gagal = 0;
  for (const kode of uji.dokumen) {
    const d = dok.get(kode);
    if (!d || !det.length) continue;
    const hasil = periksaDeterministikTeks(keDokumenPeriksa(d), det, { bagianTemplat: uji.bagianTemplat as BagianTemplatDto[] });
    const jumlahLolos = hasil.filter((h) => h.status === "Lolos").length;
    lolos += jumlahLolos;
    gagal += hasil.length - jumlahLolos;
    if (hasil.length) {
      await db
        .insert(ujiContohHasil)
        .values(hasil.map((h) => ({ ujiId, dokumenKode: kode, butirKode: h.kode, jenis: "deterministik", hasil: h as unknown as Record<string, unknown> })))
        .onConflictDoNothing();
    }
  }
  return { lolos, gagal };
}

/** Langkah 3: satu butir semantik atas satu dokumen (satu panggilan LLM; `tiruan` untuk skenario demo). */
export async function ujiSemantikSatu(ujiId: string, dokumenKode: string, butirKode: string, opsi: { tiruan?: boolean } = {}): Promise<HasilButirSemantik> {
  const db = getDb();
  const uji = await muatUji(ujiId);
  const butir = (uji.butir as ButirCek[]).find((b) => b.kode === butirKode && b.jenis === "semantik");
  if (!butir || !uji.dokumen.includes(dokumenKode)) throw new UjiDitolakError("Butir atau dokumen tidak termasuk uji ini.");
  const d = (await muatDokumen([dokumenKode])).get(dokumenKode);
  if (!d) throw new UjiDitolakError("Dokumen contoh tidak ditemukan.");
  const [hasil] = opsi.tiruan
    ? (await nilaiSemantikDenganOpsi(keDokumenPeriksa(d), [butir], { tiruan: true, penyedia: kirimPermintaanTiruan })).map((x) => x.hasil)
    : await nilaiSemantikTeks(keDokumenPeriksa(d), [butir]);
  await db
    .insert(ujiContohHasil)
    .values({ ujiId, dokumenKode, butirKode, jenis: "semantik", hasil: hasil as unknown as Record<string, unknown> })
    .onConflictDoUpdate({ target: [ujiContohHasil.ujiId, ujiContohHasil.dokumenKode, ujiContohHasil.butirKode], set: { hasil: hasil as unknown as Record<string, unknown> } });
  return hasil;
}

/** Langkah 4: tandai uji selesai (atau dihentikan sebelum semua butir semantik dinilai). */
export async function selesaikanUji(ujiId: string, dihentikan: boolean, pelaku: string): Promise<void> {
  await getDb().update(ujiContoh).set({ status: dihentikan ? "Dihentikan" : "Selesai", selesaiPada: new Date() }).where(eq(ujiContoh.id, ujiId));
  await catatLogAudit({ aktor: pelaku, aksi: dihentikan ? "uji_contoh.dihentikan" : "uji_contoh.selesai", objek: `uji:${ujiId}`, rincian: {} });
}

/** Semua langkah sekaligus di server (skenario navigator J-03b): semantik memakai mode tiruan supaya cepat dan dapat diduga. */
export async function jalankanUjiLangsung(m: Omit<Parameters<typeof mulaiUji>[0], "unggahan">): Promise<string> {
  const rencana = await mulaiUji({ ...m, unggahan: [] });
  await ujiDeterministik(rencana.ujiId);
  for (const d of rencana.dokumen) for (const b of rencana.semantik) await ujiSemantikSatu(rencana.ujiId, d.kode, b.kode, { tiruan: true });
  await selesaikanUji(rencana.ujiId, false, m.pelaku);
  return rencana.ujiId;
}

export interface HasilUjiTersimpan {
  ujiId: string;
  status: string;
  dibuatPada: Date;
  dibuatOleh: string;
  sumber: SumberUji;
  butir: ButirUji[];
  contoh: HasilUjiContoh[];
  /** butir semantik yang belum dinilai (uji dihentikan) */
  belumDinilai: number;
}

/** Hasil satu uji untuk J-03b. */
export async function ambilHasilUji(ujiId: string): Promise<HasilUjiTersimpan | null> {
  if (!/^[0-9a-f-]{36}$/i.test(ujiId)) return null;
  const db = getDb();
  const [uji] = await db.select().from(ujiContoh).where(eq(ujiContoh.id, ujiId));
  if (!uji) return null;
  const [hasil, dok] = await Promise.all([db.select().from(ujiContohHasil).where(eq(ujiContohHasil.ujiId, ujiId)), muatDokumen(uji.dokumen)]);
  const butir = uji.butir as ButirCek[];
  const contoh: HasilUjiContoh[] = uji.dokumen.map((kode) => ({
    dokumenKode: kode,
    dokumenNama: dok.get(kode)?.nama ?? kode,
    deterministik: hasil.filter((h) => h.dokumenKode === kode && h.jenis === "deterministik").map((h) => h.hasil as unknown as HasilButirDeterministik),
    semantik: hasil.filter((h) => h.dokumenKode === kode && h.jenis === "semantik").map((h) => h.hasil as unknown as HasilButirSemantik),
  }));
  const jumlahSem = butir.filter((b) => b.jenis === "semantik").length * uji.dokumen.length;
  return {
    ujiId: uji.id,
    status: uji.status,
    dibuatPada: uji.dibuatPada,
    dibuatOleh: uji.dibuatOleh,
    sumber: uji.sumber as unknown as SumberUji,
    butir: butir.map((b) => ({ id: b.id, kode: b.kode, deskripsi: b.deskripsi, status: b.status })),
    contoh,
    belumDinilai: Math.max(0, jumlahSem - hasil.filter((h) => h.jenis === "semantik").length),
  };
}

/** Uji terakhir yang sudah selesai atau dihentikan untuk templat (atau skema bila tanpa templat). */
export async function ujiTerakhir(skemaId: string, templatId: string | null): Promise<string | null> {
  const [u] = await getDb()
    .select({ id: ujiContoh.id })
    .from(ujiContoh)
    .where(and(eq(ujiContoh.skemaId, skemaId), templatId ? eq(ujiContoh.templatId, templatId) : undefined, inArray(ujiContoh.status, ["Selesai", "Dihentikan"])))
    .orderBy(desc(ujiContoh.dibuatPada))
    .limit(1);
  return u?.id ?? null;
}
