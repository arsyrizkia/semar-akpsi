/**
 * ENTRI AGEN C: UC-06 Memeriksa butir deterministik.
 * - periksaDeterministikTeks: murni, tanpa basis data (UC-06 dan "Uji pada Contoh" di J-03).
 * - jalankanPemeriksaanDeterministik: membaca versi proposal, menerapkan butir Aktif / Perlu ditinjau, menyimpan hasil_pemeriksaan.
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { bagianTemplat, basisAturan, butirCek, hasilPemeriksaan, proposal, templatProposal, versiProposal } from "@/db/schema";
import { catatLogAudit } from "../../audit";
import type {
  ButirCek,
  DokumenPeriksa,
  JenisButir,
  KonteksPeriksa,
  ParameterButir,
  StatusButir,
} from "../../kontrak/tipe";
import type { JalankanPemeriksaanDeterministik, PeriksaDeterministikTeks } from "../../kontrak/layanan";
import { periksaBanyakButir } from "./pemeriksa";

export { cekKataKunci, cekLampiran, cocokkanSitasi, cocokkanStrukturJudul, periksaBanyakButir } from "./pemeriksa";
export { hitungKata } from "./teks";

export const periksaDeterministikTeks: PeriksaDeterministikTeks = (dokumen, butir, konteks) =>
  periksaBanyakButir(butir, dokumen, konteks);

type BarisButir = typeof butirCek.$inferSelect;

/** Baris butir_cek menjadi ButirCek kontrak. */
export function keButirCek(b: BarisButir): ButirCek {
  return {
    id: b.id,
    kode: b.kode,
    deskripsi: b.deskripsi,
    jenis: b.jenis as JenisButir,
    asal: b.asal,
    komponen: b.komponen,
    pemeriksa: b.pemeriksa,
    parameter: (b.parameter as ParameterButir | null) ?? null,
    aturanHitung: b.aturanHitung,
    pertanyaan: b.pertanyaan,
    contohJawaban: b.contohJawaban,
    status: b.status as StatusButir,
  };
}

/** versi_proposal menjadi bahan yang diperiksa (ambilTeksBagian: teks bagian, lampiran, metadata). */
export function keDokumenPeriksa(
  versi: typeof versiProposal.$inferSelect,
  judulBima: string,
): DokumenPeriksa {
  return {
    judul: versi.judulDokumen ?? "",
    judulBima,
    teksPerBagian: versi.teksPerBagian,
    kataKunci: versi.kataKunci,
    lampiranAda: versi.lampiranAda,
    teksLampiran: versi.teksLampiran,
    judulBagianDitemukan: versi.judulBagianDitemukan,
  };
}

export const jalankanPemeriksaanDeterministik: JalankanPemeriksaanDeterministik = async (versiId) => {
  const db = getDb();
  const [versi] = await db.select().from(versiProposal).where(eq(versiProposal.id, versiId));
  if (!versi) throw new Error(`versi proposal tidak ditemukan: ${versiId}`);
  const [prop] = await db.select().from(proposal).where(eq(proposal.id, versi.proposalId));
  if (!versi.basisAturanId || !versi.templatId) throw new Error("versi proposal belum merujuk templat dan basis aturan");

  const [templat] = await db.select().from(templatProposal).where(eq(templatProposal.id, versi.templatId));
  const bagian = await db.select().from(bagianTemplat).where(eq(bagianTemplat.templatId, versi.templatId)).orderBy(asc(bagianTemplat.urutan));
  const konteks: KonteksPeriksa = {
    bagianTemplat: bagian.map((b) => ({ urutan: b.urutan, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib })),
    lampiranWajib: templat.lampiranWajib,
  };

  // periksaDeterministik(versi): butir deterministik berstatus Aktif atau Perlu ditinjau
  const [basis] = await db.select().from(basisAturan).where(eq(basisAturan.id, versi.basisAturanId));
  const baris = await db
    .select()
    .from(butirCek)
    .where(
      and(
        eq(butirCek.basisAturanId, basis.id),
        eq(butirCek.jenis, "deterministik"),
        inArray(butirCek.status, ["Aktif", "Perlu ditinjau"]),
      ),
    )
    .orderBy(asc(butirCek.urutan));

  const hasil = periksaBanyakButir(baris.map(keButirCek), keDokumenPeriksa(versi, prop.judul), konteks);

  await db.transaction(async (tx) => {
    // pemeriksaan ulang atas versi yang sama menggantikan hasil deterministik sebelumnya
    const lama = await tx.select({ id: hasilPemeriksaan.id, jenis: hasilPemeriksaan.jenis }).from(hasilPemeriksaan).where(eq(hasilPemeriksaan.versiId, versiId));
    if (lama.some((l) => l.jenis === "deterministik")) {
      await tx.delete(hasilPemeriksaan).where(and(eq(hasilPemeriksaan.versiId, versiId), eq(hasilPemeriksaan.jenis, "deterministik")));
    }
    if (hasil.length) {
      await tx.insert(hasilPemeriksaan).values(
        hasil.map((h) => ({
          versiId,
          butirId: h.butirId,
          butirKode: h.kode,
          jenis: "deterministik" as const,
          bagian: h.bagian,
          status: h.status,
          angkaPembukti: h.angkaPembukti,
          batasDilanggar: h.batasDilanggar,
        })),
      );
    }
    await tx.update(versiProposal).set({ statusPemeriksaan: "Selesai" }).where(eq(versiProposal.id, versiId));
  });

  const jumlahGagal = hasil.filter((h) => h.status === "Gagal").length;
  await catatLogAudit({
    aktor: "sistem",
    aksi: "pemeriksaan.deterministik",
    objek: prop.idProposal,
    rincian: { versiId, kodeVersi: versi.kode, jumlahButir: hasil.length, jumlahGagal },
  });
  return { versiId, hasil, semuaLolos: jumlahGagal === 0, jumlahGagal };
};
