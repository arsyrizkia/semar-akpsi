/**
 * UC-01 Mengelola templat proposal (J-02). Nama fungsi mengikuti sequence diagram seq-uc01.puml:
 * ambilTemplatBerlaku, aturBagian, tetapkanPeriodeBerlaku, periksaKelengkapan, terbitkan (cekPengusulanBerjalan,
 * gantiTemplatBerlaku, arsipkan, nonaktifkan), turunkanButirCek.
 */
import { and, desc, eq, inArray, max } from "drizzle-orm";
import { getDb } from "@/db";
import { bagianTemplat, butirCek, periodeSeleksi, skemaPendanaan, templatProposal } from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { masaPengusulanBerjalan, waktuDemo } from "@/lib/waktu";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import type { BagianTemplatDto } from "@/lib/kontrak";
import { pastikanDrafBasis, type Db } from "@/lib/aturan/draf";
import { bagianTersimpan, periksaKelengkapan, type HasilKelengkapan, type MasukanKelengkapan } from "./kelengkapan";

export interface Pelaku {
  /** akun.id; boleh null (mis. pada pengujian) */
  id: string | null;
  /** idBima, dicatat sebagai aktor log audit */
  idBima: string;
}

export interface TemplatTampil {
  id: string;
  versi: number;
  status: "Draf" | "Terbit" | "Arsip";
  periodeBerlakuId: string | null;
  periodeBerlakuNama: string | null;
  lampiranWajib: string[];
  diterbitkanPada: string | null;
  bagian: { urutan: number; nama: string; batasKata: number | null; wajib: boolean }[];
}

export interface SkemaPilihan {
  id: string;
  kode: string;
  namaSkema: string;
}

export interface PeriodePilihan {
  id: string;
  nama: string;
  tahun: number;
  tanggalBuka: string;
  tanggalTutup: string;
}

export async function daftarSkema(): Promise<SkemaPilihan[]> {
  const baris = await getDb().select().from(skemaPendanaan).orderBy(skemaPendanaan.namaSkema);
  return baris.map((s) => ({ id: s.id, kode: s.kode, namaSkema: s.namaSkema }));
}

export async function daftarPeriode(): Promise<PeriodePilihan[]> {
  const baris = await getDb().select().from(periodeSeleksi).orderBy(desc(periodeSeleksi.tahun));
  return baris.map((p) => ({
    id: p.id,
    nama: p.nama,
    tahun: p.tahun,
    tanggalBuka: p.tanggalBuka.toISOString(),
    tanggalTutup: p.tanggalTutup.toISOString(),
  }));
}

async function muatTemplat(db: Db, t: typeof templatProposal.$inferSelect): Promise<TemplatTampil> {
  const bagian = await db.select().from(bagianTemplat).where(eq(bagianTemplat.templatId, t.id)).orderBy(bagianTemplat.urutan);
  let periodeBerlakuNama: string | null = null;
  if (t.periodeBerlakuId) {
    const [p] = await db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, t.periodeBerlakuId));
    periodeBerlakuNama = p?.nama ?? null;
  }
  return {
    id: t.id,
    versi: t.versi,
    status: t.status,
    periodeBerlakuId: t.periodeBerlakuId,
    periodeBerlakuNama,
    lampiranWajib: t.lampiranWajib,
    diterbitkanPada: t.diterbitkanPada?.toISOString() ?? null,
    bagian: bagian.map((b) => ({ urutan: b.urutan, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })),
  };
}

/** ambilTemplatBerlaku: templat berstatus Terbit untuk skema (null = skema belum punya templat, SubFlow S-1). */
export async function ambilTemplatBerlaku(skemaId: string): Promise<TemplatTampil | null> {
  const db = getDb();
  const [t] = await db
    .select()
    .from(templatProposal)
    .where(and(eq(templatProposal.skemaId, skemaId), eq(templatProposal.status, "Terbit")))
    .orderBy(desc(templatProposal.versi))
    .limit(1);
  return t ? muatTemplat(db, t) : null;
}

/** Draf tersimpan (hasil "Susun Versi Baru" atau alur 9a); sequence diagram S-3. */
export async function ambilDrafTemplat(skemaId: string): Promise<TemplatTampil | null> {
  const db = getDb();
  const [t] = await db
    .select()
    .from(templatProposal)
    .where(and(eq(templatProposal.skemaId, skemaId), eq(templatProposal.status, "Draf")))
    .orderBy(desc(templatProposal.versi))
    .limit(1);
  return t ? muatTemplat(db, t) : null;
}

/** Konteks templat untuk pemeriksaan "Uji pada Contoh": templat Terbit terbaru, bila tidak ada draf terbaru. */
export async function ambilKonteksTemplat(skemaId: string): Promise<{ bagianTemplat: BagianTemplatDto[]; lampiranWajib: string[] }> {
  const t = (await ambilTemplatBerlaku(skemaId)) ?? (await ambilDrafTemplat(skemaId));
  return {
    bagianTemplat: (t?.bagian ?? []).map((b) => ({ urutan: b.urutan, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })),
    lampiranWajib: t?.lampiranWajib ?? [],
  };
}

/**
 * "Susun Versi Baru" (langkah 4): templat Draf bernomor versi berikutnya, isian awal disalin dari templat yang berlaku.
 * Bila skema sudah punya draf tersimpan, draf itu dibuka kembali (S-3). Skema tanpa templat menghasilkan versi 1 (S-1).
 */
export async function susunVersiBaru(skemaId: string, pelaku: Pelaku): Promise<{ templat: TemplatTampil; dilanjutkan: boolean }> {
  const db = getDb();
  const draf = await ambilDrafTemplat(skemaId);
  if (draf) return { templat: draf, dilanjutkan: true };

  const berlaku = await ambilTemplatBerlaku(skemaId);
  const [{ nilai }] = await db.select({ nilai: max(templatProposal.versi) }).from(templatProposal).where(eq(templatProposal.skemaId, skemaId));
  const versi = (nilai ?? 0) + 1;

  const id = await db.transaction(async (tx) => {
    const [t] = await tx
      .insert(templatProposal)
      .values({ skemaId, versi, status: "Draf", periodeBerlakuId: null, lampiranWajib: berlaku?.lampiranWajib ?? [], dibuatOleh: pelaku.id })
      .returning();
    if (berlaku && berlaku.bagian.length > 0) {
      await tx
        .insert(bagianTemplat)
        .values(berlaku.bagian.map((b) => ({ templatId: t.id, urutan: b.urutan, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })));
    }
    return t.id;
  });
  await catatLogAudit({ aktor: pelaku.idBima, aksi: "templat.susun-versi-baru", objek: `templat:${id}`, rincian: { skemaId, versi } });
  const [t] = await db.select().from(templatProposal).where(eq(templatProposal.id, id));
  return { templat: await muatTemplat(db, t), dilanjutkan: false };
}

/** aturBagian(daftarBagian, lampiranWajib) + aturKetentuan per bagian + tetapkanPeriodeBerlaku, untuk isian yang sudah lengkap. */
async function simpanIsian(db: Db, templatId: string, isian: MasukanKelengkapan) {
  await db.delete(bagianTemplat).where(eq(bagianTemplat.templatId, templatId));
  const bagian = isian.bagian.map(bagianTersimpan);
  if (bagian.length > 0) {
    await db.insert(bagianTemplat).values(bagian.map((b, i) => ({ templatId, urutan: i + 1, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })));
  }
  await db
    .update(templatProposal)
    .set({ lampiranWajib: isian.lampiran.map((l) => l.trim()), periodeBerlakuId: isian.periodeBerlakuId })
    .where(eq(templatProposal.id, templatId));
}

export type HasilTerbitkan =
  | { hasil: "tidak-ditemukan"; pesan: string }
  | { hasil: "tidak-lengkap"; kelengkapan: HasilKelengkapan }
  | { hasil: "draf-disimpan"; versi: number }
  | { hasil: "terbit"; versi: number; jumlahButir: number };

export interface MasukanTerbitkan {
  skemaId: string;
  templatId: string;
  isian: MasukanKelengkapan;
  pelaku: Pelaku;
  /** Hanya untuk pengujian: menggantikan hasil masaPengusulanBerjalan() */
  masaBerjalan?: boolean;
}

/** Tombol "Terbitkan" (langkah 7 sampai 10, S-2, 9a). */
export async function terbitkan(m: MasukanTerbitkan): Promise<HasilTerbitkan> {
  const db = getDb();
  const [t] = await db.select().from(templatProposal).where(eq(templatProposal.id, m.templatId));
  if (!t || t.skemaId !== m.skemaId || t.status !== "Draf") {
    return { hasil: "tidak-ditemukan", pesan: "Draf templat tidak ditemukan atau sudah diterbitkan. Muat ulang halaman." };
  }

  const kelengkapan = periksaKelengkapan(m.isian); // langkah 7
  if (!kelengkapan.lengkap) return { hasil: "tidak-lengkap", kelengkapan }; // S-2

  await simpanIsian(db, t.id, m.isian);

  const berjalan = m.masaBerjalan ?? (await masaPengusulanBerjalan()); // cekPengusulanBerjalan(), langkah 8
  if (berjalan) {
    // 9a: tetap Draf, templat yang berlaku tidak berubah, butir tidak diturunkan
    await catatLogAudit({ aktor: m.pelaku.idBima, aksi: "templat.simpan-draf", objek: `templat:${t.id}`, rincian: { skemaId: m.skemaId, versi: t.versi, alasan: "masa pengusulan berjalan" } });
    return { hasil: "draf-disimpan", versi: t.versi };
  }

  const waktu = await waktuDemo();
  const bagian = m.isian.bagian.map(bagianTersimpan);
  const lampiran = m.isian.lampiran.map((l) => l.trim());

  const jumlahButir = await db.transaction(async (tx) => {
    // gantiTemplatBerlaku, arsipkan, nonaktifkan (langkah 9)
    const lama = await tx
      .select()
      .from(templatProposal)
      .where(and(eq(templatProposal.skemaId, m.skemaId), eq(templatProposal.status, "Terbit")));
    const drafBasis = await pastikanDrafBasis(tx, m.skemaId, m.pelaku.id);
    if (lama.length > 0) {
      const idLama = lama.map((l) => l.id);
      await tx.update(templatProposal).set({ status: "Arsip" }).where(inArray(templatProposal.id, idLama));
      await tx
        .update(butirCek)
        .set({ status: "Nonaktif" })
        .where(and(eq(butirCek.basisAturanId, drafBasis.id), eq(butirCek.asal, "templat"), inArray(butirCek.templatId, idLama)));
    }
    await tx.update(templatProposal).set({ status: "Terbit", diterbitkanPada: waktu }).where(eq(templatProposal.id, t.id));

    // turunkanButirCek (langkah 10): berstatus Draf, terkunci (asal = templat)
    const turunan = turunkanButirDariTemplat(bagian, lampiran);
    const [{ nilai }] = await tx.select({ nilai: max(butirCek.urutan) }).from(butirCek).where(eq(butirCek.basisAturanId, drafBasis.id));
    let urutan = nilai ?? 0;
    if (turunan.length > 0) {
      await tx.insert(butirCek).values(
        turunan.map((b) => ({
          basisAturanId: drafBasis.id,
          templatId: t.id,
          kode: b.kode,
          deskripsi: b.deskripsi,
          jenis: b.jenis,
          asal: b.asal,
          komponen: b.komponen,
          pemeriksa: b.pemeriksa,
          parameter: b.parameter as unknown as Record<string, unknown>, // aturParameter(parameter)
          aturanHitung: b.aturanHitung,
          status: "Draf" as const,
          urutan: ++urutan,
        })),
      );
    }
    return turunan.length;
  });

  await catatLogAudit({
    aktor: m.pelaku.idBima,
    aksi: "templat.terbit",
    objek: `templat:${t.id}`,
    rincian: { skemaId: m.skemaId, versi: t.versi, jumlahButirDraf: jumlahButir, periodeBerlakuId: m.isian.periodeBerlakuId },
  });
  return { hasil: "terbit", versi: t.versi, jumlahButir };
}
