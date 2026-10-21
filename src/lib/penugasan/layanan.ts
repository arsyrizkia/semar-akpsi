/**
 * UC-03 Menugaskan reviewer: tetapkanBatasBeban, susunPenugasan, pilihReviewer, tetapkan, mencatatPenugasan,
 * kirimPenugasan (API BIMA lewat client), terimaProposal. Nama fungsi mengikuti seq-uc03.puml.
 */
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { akun, penugasanReviewer, periodeSeleksi, proposal, skemaPendanaan, versiProposal } from "@/db/schema";
import { pastikanAkunDariBima } from "@/lib/auth";
import { bima, BimaGagalError } from "@/lib/bima/client";
import { catatLogAudit } from "@/lib/audit";
import { masaPengusulanBerjalan } from "@/lib/waktu";
import type { BarisUsulanPenugasan, HasilPilihReviewer, HasilSusunPenugasan, SebaranBeban } from "@/lib/kontrak/tipe";
import { periksaSyarat, susunUsulanMurni } from "./aturan";

export class MasaBelumDitutupError extends Error {
  constructor() {
    super("Masa pengusulan belum ditutup. Usulan penugasan baru dapat disusun sesudah masa pengusulan ditutup.");
    this.name = "MasaBelumDitutupError";
  }
}

/** Beban = jumlah penugasan reviewer pada periode (semua status), kecuali penugasan yang dikecualikan. */
async function bebanPerReviewer(periodeId: string, kecualiPenugasanId?: string): Promise<Record<string, number>> {
  const db = getDb();
  const baris = await db
    .select({ id: penugasanReviewer.id, reviewerId: penugasanReviewer.reviewerId })
    .from(penugasanReviewer)
    .where(eq(penugasanReviewer.periodeId, periodeId));
  const beban: Record<string, number> = {};
  for (const b of baris) {
    if (b.id === kecualiPenugasanId) continue;
    beban[b.reviewerId] = (beban[b.reviewerId] ?? 0) + 1;
  }
  return beban;
}

/** Usulan (status Diusulkan) beserta data tampilan untuk satu periode. */
export async function ambilUsulan(periodeId: string, status: "Diusulkan" | "Ditetapkan" = "Diusulkan"): Promise<BarisUsulanPenugasan[]> {
  const db = getDb();
  const baris = await db
    .select({
      penugasanId: penugasanReviewer.id,
      proposalId: proposal.id,
      judulProposal: proposal.judul,
      skema: skemaPendanaan.namaSkema,
      pengusulId: proposal.pengusulId,
      reviewerId: penugasanReviewer.reviewerId,
      tanggal: penugasanReviewer.tanggal,
    })
    .from(penugasanReviewer)
    .innerJoin(proposal, eq(penugasanReviewer.proposalId, proposal.id))
    .innerJoin(skemaPendanaan, eq(proposal.skemaId, skemaPendanaan.id))
    .where(and(eq(penugasanReviewer.periodeId, periodeId), eq(penugasanReviewer.status, status)));
  if (!baris.length) return [];
  const idAkun = [...new Set(baris.flatMap((b) => [b.pengusulId, b.reviewerId]))];
  const akunBaris = await db.select().from(akun).where(inArray(akun.id, idAkun));
  const petaAkun = new Map(akunBaris.map((a) => [a.id, a]));
  return baris
    .sort((a, b) => a.judulProposal.localeCompare(b.judulProposal))
    .map((b) => ({
      penugasanId: b.penugasanId,
      proposalId: b.proposalId,
      judulProposal: b.judulProposal,
      skema: b.skema,
      institusiPengusul: petaAkun.get(b.pengusulId)?.institusi ?? "-",
      reviewerId: b.reviewerId,
      namaReviewer: petaAkun.get(b.reviewerId)?.nama ?? "-",
      institusiReviewer: petaAkun.get(b.reviewerId)?.institusi ?? "-",
    }));
}

/** Tabel "Sebaran Beban": jumlah proposal setiap reviewer yang bersedia terhadap batas. */
export async function ambilSebaranBeban(periodeId: string, batas: number): Promise<SebaranBeban[]> {
  const db = getDb();
  const reviewer = await db.select().from(akun).where(and(eq(akun.peran, "reviewer"), eq(akun.bersedia, true)));
  const beban = await bebanPerReviewer(periodeId);
  return reviewer
    .map((r) => ({ reviewerId: r.id, namaReviewer: r.nama, jumlah: beban[r.id] ?? 0, batas }))
    .sort((a, b) => b.jumlah - a.jumlah || a.namaReviewer.localeCompare(b.namaReviewer));
}

/** tetapkanBatasBeban(batas) pada objek periode. */
export async function tetapkanBatasBeban(periodeId: string, batas: number): Promise<void> {
  if (!Number.isInteger(batas) || batas < 1) throw new Error("Batas Beban per Reviewer harus bilangan bulat minimal 1.");
  await getDb().update(periodeSeleksi).set({ batasBebanReviewer: batas }).where(eq(periodeSeleksi.id, periodeId));
}

/**
 * UC-03 s.2-5 (+ S-1). Menggantikan usulan lama (status Diusulkan) bila ada. Penugasan yang sudah Ditetapkan
 * tidak diubah dan dihitung sebagai beban awal. Bila reviewer kurang (S-1), usulan tidak disusun.
 */
export async function susunPenugasan(periodeId: string, batasBeban: number): Promise<HasilSusunPenugasan> {
  const db = getDb();
  if (await masaPengusulanBerjalan()) throw new MasaBelumDitutupError();

  await tetapkanBatasBeban(periodeId, batasBeban);

  // ambilDaftarReviewer() melalui API BIMA (client mengulang otomatis maksimal 2 kali)
  const daftar = (await bima.ambilDaftarReviewer()).filter((r) => r.bersedia);
  const reviewerSemar = (await Promise.all(daftar.map((r) => pastikanAkunDariBima(r.idBima)))).filter(
    (a): a is NonNullable<typeof a> => !!a && a.peran === "reviewer",
  );

  // proposal Terkirim pada periode yang belum ditetapkan penugasannya
  const terkirim = await db
    .select({ id: proposal.id, judul: proposal.judul, pengusulId: proposal.pengusulId })
    .from(proposal)
    .where(and(eq(proposal.periodeId, periodeId), eq(proposal.status, "Terkirim")));
  const sudahDitetapkan = new Set(
    (
      await db
        .select({ proposalId: penugasanReviewer.proposalId })
        .from(penugasanReviewer)
        .where(and(eq(penugasanReviewer.periodeId, periodeId), ne(penugasanReviewer.status, "Diusulkan")))
    ).map((x) => x.proposalId),
  );
  const perluDitugaskan = terkirim.filter((p) => !sudahDitetapkan.has(p.id));
  const pengusul = perluDitugaskan.length
    ? await db.select().from(akun).where(inArray(akun.id, [...new Set(perluDitugaskan.map((p) => p.pengusulId))]))
    : [];
  const institusiPengusul = new Map(pengusul.map((a) => [a.id, a.institusi]));

  // beban awal: penugasan yang sudah ditetapkan atau selesai (usulan lama akan diganti)
  const tetap = await db
    .select({ reviewerId: penugasanReviewer.reviewerId })
    .from(penugasanReviewer)
    .where(and(eq(penugasanReviewer.periodeId, periodeId), ne(penugasanReviewer.status, "Diusulkan")));
  const bebanAwal: Record<string, number> = {};
  for (const t of tetap) bebanAwal[t.reviewerId] = (bebanAwal[t.reviewerId] ?? 0) + 1;

  const hasil = susunUsulanMurni(
    perluDitugaskan.map((p) => ({ id: p.id, institusiPengusul: institusiPengusul.get(p.pengusulId) ?? "-" })),
    reviewerSemar.map((r) => ({ id: r.id, nama: r.nama, institusi: r.institusi })),
    bebanAwal,
    batasBeban,
  );

  // S-1: reviewer tidak cukup, usulan tidak disusun
  if (hasil.belumDitugaskan.length > 0) {
    await catatLogAudit({
      aktor: "sistem",
      aksi: "susun_penugasan_kekurangan_reviewer",
      objek: `periode:${periodeId}`,
      rincian: { batasBeban, belumDitugaskan: hasil.belumDitugaskan.length, reviewerBersedia: reviewerSemar.length },
    });
    return { periodeId, usulan: [], sebaran: await ambilSebaranBeban(periodeId, batasBeban), jumlahBelumDitugaskan: hasil.belumDitugaskan.length };
  }

  // simpan usulan baru (status Diusulkan) menggantikan usulan lama
  const versiTerbaru = new Map<string, string>();
  if (perluDitugaskan.length) {
    const versi = await db
      .select({ id: versiProposal.id, proposalId: versiProposal.proposalId })
      .from(versiProposal)
      .where(inArray(versiProposal.proposalId, perluDitugaskan.map((p) => p.id)))
      .orderBy(desc(versiProposal.nomor));
    for (const v of versi) if (!versiTerbaru.has(v.proposalId)) versiTerbaru.set(v.proposalId, v.id);
  }
  await db.transaction(async (tx) => {
    await tx.delete(penugasanReviewer).where(and(eq(penugasanReviewer.periodeId, periodeId), eq(penugasanReviewer.status, "Diusulkan")));
    if (hasil.penugasan.length) {
      await tx.insert(penugasanReviewer).values(
        hasil.penugasan.map((p) => ({
          proposalId: p.proposalId,
          versiId: versiTerbaru.get(p.proposalId) ?? null,
          reviewerId: p.reviewerId,
          periodeId,
          status: "Diusulkan" as const,
          label: "Baru" as const,
        })),
      );
    }
  });

  await catatLogAudit({
    aktor: "sistem",
    aksi: "susun_penugasan",
    objek: `periode:${periodeId}`,
    rincian: { batasBeban, jumlahUsulan: hasil.penugasan.length },
  });

  return {
    periodeId,
    usulan: await ambilUsulan(periodeId),
    sebaran: await ambilSebaranBeban(periodeId, batasBeban),
    jumlahBelumDitugaskan: 0,
  };
}

/**
 * UC-03 S-2.2/S-2.3: periksa ulang syarat institusi, kesediaan, dan beban bagi reviewer pengganti.
 * Bila memenuhi, baris penugasan diperbarui; bila tidak, reviewer semula tetap dipakai dan syarat yang dilanggar dikembalikan.
 */
export async function pilihReviewer(penugasanId: string, reviewerBaruId: string): Promise<HasilPilihReviewer> {
  const db = getDb();
  const [pn] = await db.select().from(penugasanReviewer).where(eq(penugasanReviewer.id, penugasanId));
  if (!pn) throw new Error("Penugasan tidak ditemukan.");
  if (pn.status !== "Diusulkan") {
    return { reviewerId: pn.reviewerId, diterima: false, syaratDilanggar: ["Penugasan sudah ditetapkan dan tidak dapat dipindahkan."] };
  }
  const [pr] = await db.select().from(proposal).where(eq(proposal.id, pn.proposalId));
  const [pengusul] = await db.select().from(akun).where(eq(akun.id, pr.pengusulId));
  const [baru] = await db.select().from(akun).where(eq(akun.id, reviewerBaruId));
  if (!baru || baru.peran !== "reviewer") {
    return { reviewerId: pn.reviewerId, diterima: false, syaratDilanggar: ["Reviewer pengganti tidak ditemukan."] };
  }
  if (baru.id === pn.reviewerId) return { reviewerId: pn.reviewerId, diterima: true, syaratDilanggar: [] };

  const [periode] = await db.select().from(periodeSeleksi).where(eq(periodeSeleksi.id, pn.periodeId));
  const beban = await bebanPerReviewer(pn.periodeId, pn.id);
  const syaratDilanggar = periksaSyarat({
    institusiPengusul: pengusul.institusi,
    reviewer: { institusi: baru.institusi, bersedia: baru.bersedia },
    bebanSaatIni: beban[baru.id] ?? 0,
    batas: periode.batasBebanReviewer,
  });
  if (syaratDilanggar.length) {
    await catatLogAudit({
      aktor: "tim-kerja",
      aksi: "pindah_penugasan_ditolak",
      objek: `penugasan:${pn.id}`,
      rincian: { reviewerBaru: baru.id, syaratDilanggar },
    });
    return { reviewerId: pn.reviewerId, diterima: false, syaratDilanggar };
  }
  await db.update(penugasanReviewer).set({ reviewerId: baru.id }).where(eq(penugasanReviewer.id, pn.id));
  await catatLogAudit({
    aktor: "tim-kerja",
    aksi: "pindah_penugasan",
    objek: `penugasan:${pn.id}`,
    rincian: { dari: pn.reviewerId, ke: baru.id },
  });
  return { reviewerId: baru.id, diterima: true, syaratDilanggar: [] };
}

export interface HasilTetapkan {
  jumlah: number;
}

/**
 * UC-03 s.7-8: tetapkan() setiap usulan (status Ditetapkan, mencatatPenugasan), kirimPenugasan ke BIMA
 * (client mengulang maksimal 2 kali), lalu terimaProposal: label "Baru" untuk reviewer di J-07.
 * Bila BIMA tetap gagal, status dikembalikan ke Diusulkan agar tombol "Kirim ulang" dapat mengulang; BimaGagalError dilempar.
 */
export async function tetapkanPenugasan(periodeId: string, aktor: string): Promise<HasilTetapkan> {
  const db = getDb();
  const usulan = await db
    .select({ id: penugasanReviewer.id, proposalId: penugasanReviewer.proposalId, reviewerId: penugasanReviewer.reviewerId })
    .from(penugasanReviewer)
    .where(and(eq(penugasanReviewer.periodeId, periodeId), eq(penugasanReviewer.status, "Diusulkan")));
  if (!usulan.length) return { jumlah: 0 };

  const ids = usulan.map((u) => u.id);
  const waktu = new Date();
  await db
    .update(penugasanReviewer)
    .set({ status: "Ditetapkan", label: "Baru", tanggal: waktu })
    .where(inArray(penugasanReviewer.id, ids));

  try {
    const proposalBaris = await db.select({ id: proposal.id, idProposal: proposal.idProposal }).from(proposal).where(inArray(proposal.id, usulan.map((u) => u.proposalId)));
    const reviewerBaris = await db.select({ id: akun.id, idBima: akun.idBima }).from(akun).where(inArray(akun.id, usulan.map((u) => u.reviewerId)));
    const idBimaProposal = new Map(proposalBaris.map((p) => [p.id, p.idProposal]));
    const idBimaReviewer = new Map(reviewerBaris.map((r) => [r.id, r.idBima]));
    await bima.kirimPenugasan({
      periodeId,
      penugasan: usulan.map((u) => ({
        idProposal: idBimaProposal.get(u.proposalId)!,
        reviewerIdBima: idBimaReviewer.get(u.reviewerId)!,
        tanggal: waktu.toISOString(),
      })),
    });
  } catch (e) {
    await db.update(penugasanReviewer).set({ status: "Diusulkan" }).where(inArray(penugasanReviewer.id, ids));
    await catatLogAudit({
      aktor,
      aksi: "tetapkan_penugasan_gagal_kirim",
      objek: `periode:${periodeId}`,
      rincian: { jumlah: usulan.length, galat: e instanceof Error ? e.message : String(e) },
    });
    throw e instanceof BimaGagalError ? e : new BimaGagalError(e instanceof Error ? e.message : "Gagal mengirim penugasan ke BIMA");
  }

  await catatLogAudit({
    aktor,
    aksi: "tetapkan_penugasan",
    objek: `periode:${periodeId}`,
    rincian: { jumlah: usulan.length },
  });
  return { jumlah: usulan.length };
}

export interface KandidatPengganti {
  id: string;
  nama: string;
  institusi: string;
  beban: number;
}

/** Pilihan "Reviewer Pengganti" (S-2): reviewer yang bersedia beserta bebannya saat ini. */
export async function ambilKandidatPengganti(periodeId: string): Promise<KandidatPengganti[]> {
  const reviewer = await getDb().select().from(akun).where(and(eq(akun.peran, "reviewer"), eq(akun.bersedia, true)));
  const beban = await bebanPerReviewer(periodeId);
  return reviewer
    .map((r) => ({ id: r.id, nama: r.nama, institusi: r.institusi, beban: beban[r.id] ?? 0 }))
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

/** Periode untuk J-04: yang terbaru menurut tahun. */
export async function ambilPeriodeTerbaru() {
  const [p] = await getDb().select().from(periodeSeleksi).orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka)).limit(1);
  return p ?? null;
}
