/**
 * UC-02 Mengelola aturan pemeriksaan (J-03). Nama fungsi mengikuti sequence diagram seq-uc02.puml:
 * basisAturanBerlaku, daftarButirBerlaku, create, ubahParameter, nonaktifkan, ujiPadaContoh, validasiTanggalBerlaku,
 * masaPengusulanBerjalan, simpanVersiBaru.
 */
import { and, eq, inArray, max } from "drizzle-orm";
import { getDb } from "@/db";
import { basisAturan, butirCek, dokumenContoh, periodeSeleksi, skemaPendanaan } from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { masaPengusulanBerjalan } from "@/lib/waktu";
import { nilaiSemantikTeks, periksaDeterministikTeks } from "@/lib/kontrak";
import type { ButirCek, DokumenPeriksa, HasilUjiContoh, JenisButir, ParameterButir, StatusButir } from "@/lib/kontrak";
import { ambilKonteksTemplat, ambilDrafTemplat, ambilTemplatBerlaku, type Pelaku } from "@/lib/templat/layanan";
import {
  adalahDraf,
  ambilDrafBasis,
  butirBasis,
  cariButirDenganKode,
  pastikanDrafBasis,
  pilihBasisNyata,
  semuaBasisSkema,
  type BarisBasis,
  type BarisButir,
} from "./draf";
import { ringkasParameter, validasiButir, type GalatButir, type MasukanButir } from "./parameter";
import { validasiTanggalBerlaku } from "./tanggal";

export const PESAN_TERKUNCI = "Nilai butir ini berasal dari templat dan hanya dapat diubah melalui jendela J-02 Templat Proposal";

export interface InfoBasis {
  id: string;
  nama: string;
  versi: number;
  /** null untuk basis yang sedang disusun (belum berlaku) */
  tanggalBerlaku: string | null;
}

export interface ButirTampil {
  id: string;
  kode: string;
  deskripsi: string;
  jenis: JenisButir;
  asal: "templat" | "manual";
  komponen: string | null;
  parameter: Record<string, unknown> | null;
  aturanHitung: string | null;
  pertanyaan: string | null;
  contohJawaban: string | null;
  /** nilai bagian dan lampiran dari parameter semantik/terstruktur, untuk mengisi panel Ubah */
  bagian: string | null;
  lampiran: string | null;
  status: StatusButir;
  ringkasan: string;
  /** true bila status "Perlu ditinjau" berasal dari penandaan UC-04 pada versi yang berlaku */
  ditandaiPemantauan: boolean;
}

export interface TampilanAturan {
  nyata: InfoBasis | null;
  /** basis yang sedang disusun, bila ada */
  draf: InfoBasis | null;
  butir: ButirTampil[];
}

const info = (b: BarisBasis): InfoBasis => ({
  id: b.id,
  nama: b.nama,
  versi: b.versi,
  tanggalBerlaku: adalahDraf(b) ? null : b.tanggalBerlaku.toISOString(),
});

function keTampil(b: BarisButir, ditandaiPemantauan = false): ButirTampil {
  const par = (b.parameter ?? null) as Record<string, unknown> | null;
  return {
    id: b.id,
    kode: b.kode,
    deskripsi: b.deskripsi,
    jenis: b.jenis,
    asal: b.asal,
    komponen: b.komponen,
    parameter: par,
    aturanHitung: b.aturanHitung,
    pertanyaan: b.pertanyaan,
    contohJawaban: b.contohJawaban,
    bagian: typeof par?.bagian === "string" ? par.bagian : null,
    lampiran: typeof par?.lampiran === "string" ? par.lampiran : null,
    status: ditandaiPemantauan ? "Perlu ditinjau" : b.status,
    ringkasan: ringkasParameter({ jenis: b.jenis, aturanHitung: b.aturanHitung, pertanyaan: b.pertanyaan, parameter: par }),
    ditandaiPemantauan,
  };
}

/** basisAturanBerlaku(periode) + daftarButirBerlaku(semua): yang ditampilkan adalah draf bila ada, selain itu basis yang berlaku. */
export async function daftarButirBerlaku(skemaId: string, periodeId: string | null): Promise<TampilanAturan> {
  const db = getDb();
  const semua = await semuaBasisSkema(db, skemaId);
  const nyata = pilihBasisNyata(semua, periodeId);
  const draf = semua.find(adalahDraf) ?? null;
  const dasar = draf ?? nyata;
  if (!dasar) return { nyata: null, draf: null, butir: [] };

  const butir = await butirBasis(db, dasar.id);
  // butir yang ditandai pemantauan (UC-04) pada versi berlaku tetap tampil "Perlu ditinjau" di salinan draf
  const ditandai = new Set<string>();
  if (draf && nyata) {
    for (const b of await butirBasis(db, nyata.id)) if (b.status === "Perlu ditinjau") ditandai.add(b.kode);
  }
  butir.sort((a, b) => Number(a.status === "Nonaktif") - Number(b.status === "Nonaktif") || a.urutan - b.urutan || a.kode.localeCompare(b.kode));
  return {
    nyata: nyata ? info(nyata) : null,
    draf: draf ? info(draf) : null,
    butir: butir.map((b) => keTampil(b, draf !== null && b.status === "Aktif" && ditandai.has(b.kode))),
  };
}

/** Pilihan "Bagian yang Diperiksa" dan "Lampiran yang Diperiksa" pada panel butir. */
export async function pilihanBagianLampiran(skemaId: string): Promise<{ bagian: string[]; lampiran: string[] }> {
  const t = (await ambilTemplatBerlaku(skemaId)) ?? (await ambilDrafTemplat(skemaId));
  return { bagian: t?.bagian.map((b) => b.nama) ?? [], lampiran: t?.lampiranWajib ?? [] };
}

export type HasilSimpanButir =
  | { ok: true; butirId: string; kode: string; baru: boolean }
  | { ok: false; terkunci?: boolean; galat: GalatButir; pesan?: string };

export interface MasukanSimpanButir {
  skemaId: string;
  /** id butir yang diubah; kosong = butir baru (create) */
  butirId?: string;
  masukan: MasukanButir;
  pelaku: Pelaku;
}

/** Tombol "Simpan Butir": create(jenis, parameter) atau ubahParameter(parameter) pada basis yang sedang disusun. */
export async function simpanButir(m: MasukanSimpanButir): Promise<HasilSimpanButir> {
  const db = getDb();
  let sasaran: BarisButir | null = null;
  if (m.butirId) {
    const [b] = await db.select().from(butirCek).where(eq(butirCek.id, m.butirId));
    if (!b) return { ok: false, galat: {}, pesan: "Butir tidak ditemukan. Muat ulang halaman." };
    if (b.asal === "templat") return { ok: false, terkunci: true, galat: {}, pesan: PESAN_TERKUNCI }; // 4a
    sasaran = b;
  }

  const v = validasiButir(m.masukan);
  if (!v.ok) return { ok: false, galat: v.galat };

  return db.transaction(async (tx) => {
    const draf = await pastikanDrafBasis(tx, m.skemaId, m.pelaku.id);
    // butir pada versi berlaku dipetakan ke salinannya di draf lewat kode
    let target: BarisButir | null = null;
    if (sasaran) {
      target = sasaran.basisAturanId === draf.id ? sasaran : await cariButirDenganKode(tx, draf.id, sasaran.kode, "manual");
      if (!target) return { ok: false as const, galat: {}, pesan: "Butir tidak ditemukan pada versi yang sedang disusun." };
    }
    const adaKode = (await butirBasis(tx, draf.id)).some((b) => b.kode === v.nilai.kode && b.status !== "Nonaktif" && b.id !== target?.id);
    if (adaKode) return { ok: false as const, galat: { kode: "Kode sudah dipakai butir lain pada versi ini" } };

    const nilai = {
      deskripsi: v.nilai.deskripsi,
      komponen: v.nilai.komponen,
      pemeriksa: v.nilai.pemeriksa,
      parameter: v.nilai.parameter as unknown as Record<string, unknown>,
      aturanHitung: v.nilai.aturanHitung,
      pertanyaan: v.nilai.pertanyaan,
      contohJawaban: v.nilai.contohJawaban,
    };
    if (target) {
      await tx.update(butirCek).set(nilai).where(eq(butirCek.id, target.id));
      await catatLogAudit({ aktor: m.pelaku.idBima, aksi: "aturan.butir-ubah", objek: `butir:${target.id}`, rincian: { skemaId: m.skemaId, kode: target.kode } });
      return { ok: true as const, butirId: target.id, kode: target.kode, baru: false };
    }
    const [{ nilai: tertinggi }] = await tx.select({ nilai: max(butirCek.urutan) }).from(butirCek).where(eq(butirCek.basisAturanId, draf.id));
    const [baru] = await tx
      .insert(butirCek)
      .values({ basisAturanId: draf.id, kode: v.nilai.kode, jenis: v.nilai.jenis, asal: "manual", status: "Draf", urutan: (tertinggi ?? 0) + 1, ...nilai })
      .returning();
    await catatLogAudit({ aktor: m.pelaku.idBima, aksi: "aturan.butir-tambah", objek: `butir:${baru.id}`, rincian: { skemaId: m.skemaId, kode: baru.kode, jenis: baru.jenis } });
    return { ok: true as const, butirId: baru.id, kode: baru.kode, baru: true };
  });
}

/** Cek 4a tanpa menyimpan apa pun: apakah tombol "Ubah" boleh membuka panel butir. */
export async function periksaKunciButir(butirId: string): Promise<{ terkunci: boolean; pesan?: string }> {
  const [b] = await getDb().select().from(butirCek).where(eq(butirCek.id, butirId));
  return b?.asal === "templat" ? { terkunci: true, pesan: PESAN_TERKUNCI } : { terkunci: false };
}

export type HasilNonaktifkan = { ok: true; kode: string } | { ok: false; terkunci?: boolean; pesan: string };

/** Tombol "Nonaktifkan": nonaktifkan() pada versi yang sedang disusun. Butir turunan templat tidak dapat dinonaktifkan. */
export async function nonaktifkanButir(m: { skemaId: string; butirId: string; pelaku: Pelaku }): Promise<HasilNonaktifkan> {
  const db = getDb();
  const [b] = await db.select().from(butirCek).where(eq(butirCek.id, m.butirId));
  if (!b) return { ok: false, pesan: "Butir tidak ditemukan. Muat ulang halaman." };
  if (b.asal === "templat") return { ok: false, terkunci: true, pesan: PESAN_TERKUNCI };
  return db.transaction(async (tx) => {
    const draf = await pastikanDrafBasis(tx, m.skemaId, m.pelaku.id);
    const target = b.basisAturanId === draf.id ? b : await cariButirDenganKode(tx, draf.id, b.kode, "manual");
    if (!target) return { ok: false as const, pesan: "Butir tidak ditemukan pada versi yang sedang disusun." };
    await tx.update(butirCek).set({ status: "Nonaktif" }).where(eq(butirCek.id, target.id));
    await catatLogAudit({ aktor: m.pelaku.idBima, aksi: "aturan.butir-nonaktifkan", objek: `butir:${target.id}`, rincian: { skemaId: m.skemaId, kode: target.kode } });
    return { ok: true as const, kode: target.kode };
  });
}

/* ------------------------------ Uji pada Contoh ------------------------------ */

export interface HasilUji {
  contoh: HasilUjiContoh[];
  /** true bila skema belum punya contoh sendiri sehingga semua contoh dipakai */
  semuaContoh: boolean;
  /** kegagalan pemeriksa (mis. layanan belum tersedia); butir lain tetap ditampilkan */
  peringatan: string[];
  /** kode butir yang diuji */
  jumlahButir: number;
}

function keDto(b: BarisButir): ButirCek {
  return {
    id: b.id,
    kode: b.kode,
    deskripsi: b.deskripsi,
    jenis: b.jenis,
    asal: b.asal,
    komponen: b.komponen,
    pemeriksa: b.pemeriksa,
    parameter: (b.parameter ?? null) as ParameterButir | null,
    aturanHitung: b.aturanHitung,
    pertanyaan: b.pertanyaan,
    contohJawaban: b.contohJawaban,
    status: b.status,
  };
}

/** Tombol "Uji pada Contoh": butir versi yang sedang disusun (atau yang berlaku) diterapkan pada dokumen_contoh. */
export async function ujiPadaContoh(skemaId: string, periodeId: string | null): Promise<HasilUji> {
  const db = getDb();
  const semua = await semuaBasisSkema(db, skemaId);
  const dasar = semua.find(adalahDraf) ?? pilihBasisNyata(semua, periodeId);
  const peringatan: string[] = [];
  if (!dasar) return { contoh: [], semuaContoh: false, peringatan: ["Skema ini belum memiliki basis aturan untuk diuji."], jumlahButir: 0 };

  const butir = (await butirBasis(db, dasar.id)).filter((b) => b.status !== "Nonaktif").sort((a, b) => a.urutan - b.urutan);
  const det = butir.filter((b) => b.jenis === "deterministik").map(keDto);
  const sem = butir.filter((b) => b.jenis === "semantik").map(keDto);

  let dokumen = await db.select().from(dokumenContoh).where(eq(dokumenContoh.skemaId, skemaId));
  let semuaContoh = false;
  if (dokumen.length === 0) {
    dokumen = await db.select().from(dokumenContoh);
    semuaContoh = dokumen.length > 0;
  }
  dokumen.sort((a, b) => a.kode.localeCompare(b.kode));
  if (dokumen.length === 0) peringatan.push("Belum ada contoh proposal yang tersimpan di sistem.");

  const konteks = await ambilKonteksTemplat(skemaId);
  const hasil = await Promise.all(
    dokumen.map(async (d): Promise<HasilUjiContoh> => {
      const dok: DokumenPeriksa = {
        judul: d.judul,
        judulBima: d.judulBima,
        teksPerBagian: d.teksPerBagian,
        kataKunci: d.kataKunci,
        lampiranAda: d.lampiranAda,
        teksLampiran: d.teksLampiran,
        judulBagianDitemukan: d.judulBagianDitemukan,
      };
      let deterministik: HasilUjiContoh["deterministik"] = [];
      let semantik: HasilUjiContoh["semantik"] = [];
      try {
        deterministik = det.length ? periksaDeterministikTeks(dok, det, konteks) : [];
      } catch (e) {
        peringatan.push(`Pemeriksaan deterministik pada ${d.nama} tidak dapat dijalankan: ${e instanceof Error ? e.message : "galat tidak dikenal"}`);
      }
      try {
        semantik = sem.length ? await nilaiSemantikTeks(dok, sem) : [];
      } catch (e) {
        peringatan.push(`Pemeriksaan semantik pada ${d.nama} tidak dapat dijalankan: ${e instanceof Error ? e.message : "galat tidak dikenal"}`);
      }
      return { dokumenKode: d.kode, dokumenNama: d.nama, deterministik, semantik };
    }),
  );
  return { contoh: hasil, semuaContoh, peringatan: [...new Set(peringatan)], jumlahButir: butir.length };
}

/* ------------------------------ Simpan Versi ------------------------------ */

export type HasilSimpanVersi =
  | { ok: true; versi: number; tanggalBerlaku: string; jumlahAktif: number }
  | { ok: false; alasan: "tidak-ada-perubahan" | "tanggal" | "periode"; pesan: string };

export interface MasukanSimpanVersi {
  skemaId: string;
  periodeId: string;
  /** yyyy-mm-dd */
  tanggalBerlaku: string;
  pelaku: Pelaku;
  /** Hanya untuk pengujian: menggantikan hasil masaPengusulanBerjalan() */
  masaBerjalan?: boolean;
}

/** Tombol "Simpan Versi": validasiTanggalBerlaku() lalu simpanVersiBaru(). */
export async function simpanVersiBaru(m: MasukanSimpanVersi): Promise<HasilSimpanVersi> {
  const db = getDb();
  const draf = await ambilDrafBasis(db, m.skemaId);
  if (!draf) return { ok: false, alasan: "tidak-ada-perubahan", pesan: "Belum ada perubahan aturan yang perlu disimpan sebagai versi baru." };
  const [periode] = await db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, m.periodeId));
  if (!periode) return { ok: false, alasan: "periode", pesan: "Periode Seleksi tidak ditemukan." };

  const semua = await semuaBasisSkema(db, m.skemaId);
  const sebelumnya = semua.filter((b) => !adalahDraf(b)).sort((a, b) => b.versi - a.versi)[0];
  const berjalan = m.masaBerjalan ?? (await masaPengusulanBerjalan()); // masaPengusulanBerjalan() pada periode
  const v = validasiTanggalBerlaku(m.tanggalBerlaku, periode, berjalan, sebelumnya?.tanggalBerlaku);
  if (!v.ok) return { ok: false, alasan: "tanggal", pesan: v.pesan }; // 8a: basis aturan tidak berubah

  const [skema] = await db.select().from(skemaPendanaan).where(eq(skemaPendanaan.id, m.skemaId));
  const jumlahAktif = await db.transaction(async (tx) => {
    await tx
      .update(butirCek)
      .set({ status: "Aktif", ditandaiOleh: null, ditandaiPada: null })
      .where(and(eq(butirCek.basisAturanId, draf.id), inArray(butirCek.status, ["Draf", "Perlu ditinjau"])));
    await tx
      .update(basisAturan)
      .set({ kode: `BA-${skema?.kode ?? draf.kode}`, periodeId: m.periodeId, tanggalBerlaku: v.tanggal, dibuatOleh: m.pelaku.id, dibuatPada: new Date() })
      .where(eq(basisAturan.id, draf.id));
    const aktif = await tx.select().from(butirCek).where(and(eq(butirCek.basisAturanId, draf.id), eq(butirCek.status, "Aktif")));
    return aktif.length;
  });
  await catatLogAudit({
    aktor: m.pelaku.idBima,
    aksi: "aturan.simpan-versi",
    objek: `basis:${draf.id}`,
    rincian: { skemaId: m.skemaId, skema: skema?.kode, versi: draf.versi, tanggalBerlaku: m.tanggalBerlaku, periodeId: m.periodeId },
  });
  return { ok: true, versi: draf.versi, tanggalBerlaku: v.tanggal.toISOString(), jumlahAktif };
}
