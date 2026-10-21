/**
 * Layanan UC-07 (pemeriksaan akhir) dan UC-08 (koreksi rekomendasi) di sisi server.
 * Semua fungsi menerima akun reviewer yang sedang masuk dan memeriksa kepemilikan penugasan (NFR 3.1).
 */
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bagianTemplat,
  butirCek,
  hasilPemeriksaan,
  keputusanKomponen,
  koreksiRekomendasi,
  penilaian,
  penugasanReviewer,
  proposal,
  skemaPendanaan,
  versiProposal,
} from "@/db/schema";
import type { Akun } from "@/lib/auth";
import { catatLogAudit } from "@/lib/audit";
import { bima } from "@/lib/bima/client";
import { KOMPONEN_BORANG, type Keputusan, type ParameterButir, type StatusHasilSemantik } from "@/lib/kontrak/tipe";
import { cariKutipan, ambilBerdasarkanNama } from "@/lib/pemeriksa/semantik/teks";
import { pastikanSemantikBerjalan } from "@/lib/pemeriksa/semantik/jalankan";
import type { BarisDaftarPenugasan, ButirTampil, DataPemeriksaan, HasilAksi, PenilaianTampil, TabTeks } from "./tipe";
import {
  PESAN_KOMPONEN_BELUM_LENGKAP,
  bersihkanKomponen,
  komponenLengkap,
  validasiKoreksi,
  type MasukanKoreksi,
} from "./validasi";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const format = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" });

/* ------------------------------- J-07 ------------------------------- */
/** Hanya penugasan milik reviewer yang sedang masuk (NFR 3.1). */
export async function daftarPenugasanReviewer(akunId: string): Promise<BarisDaftarPenugasan[]> {
  const baris = await getDb()
    .select({
      id: penugasanReviewer.id,
      judul: proposal.judul,
      skema: skemaPendanaan.namaSkema,
      tanggal: penugasanReviewer.tanggal,
      label: penugasanReviewer.label,
    })
    .from(penugasanReviewer)
    .innerJoin(proposal, eq(proposal.id, penugasanReviewer.proposalId))
    .innerJoin(skemaPendanaan, eq(skemaPendanaan.id, proposal.skemaId))
    .where(and(eq(penugasanReviewer.reviewerId, akunId), inArray(penugasanReviewer.status, ["Ditetapkan", "Selesai"])))
    .orderBy(desc(penugasanReviewer.tanggal));
  return baris.map((b) => ({ penugasanId: b.id, judul: b.judul, skema: b.skema, tanggal: format.format(b.tanggal), label: b.label }));
}

/* ------------------------------- akses ------------------------------- */
type Penugasan = typeof penugasanReviewer.$inferSelect;
export type HasilAkses = { ok: true; penugasan: Penugasan } | { ok: false; kode: 403 | 404 };

/** bukaProposal(): pastikan penugasan ada dan milik reviewer ini. Penolakan 403 dicatat di log audit. */
export async function periksaAkses(penugasanId: string, akun: Pick<Akun, "id" | "idBima">): Promise<HasilAkses> {
  if (!UUID.test(penugasanId)) return { ok: false, kode: 404 };
  const [p] = await getDb().select().from(penugasanReviewer).where(eq(penugasanReviewer.id, penugasanId));
  if (!p || p.status === "Diusulkan") return { ok: false, kode: 404 };
  if (p.reviewerId !== akun.id) {
    await catatLogAudit({ aktor: akun.idBima, aksi: "akses.ditolak", objek: `penugasan:${penugasanId}`, rincian: { alasan: "bukan reviewer yang ditugaskan" } });
    return { ok: false, kode: 403 };
  }
  return { ok: true, penugasan: p };
}

/* ------------------------------- J-08 ------------------------------- */
async function pastikanPenilaian(penugasanId: string) {
  const db = getDb();
  const [ada] = await db.select().from(penilaian).where(eq(penilaian.penugasanId, penugasanId)).orderBy(asc(penilaian.diperbaruiPada)).limit(1);
  if (ada) return ada;
  const [baru] = await db.insert(penilaian).values({ penugasanId, status: "Draf" }).returning(); // «create» penilaian (UC-07 langkah 5)
  return baru;
}

function pilihTab(
  tabs: TabTeks[],
  kutipan: string | null,
  param: ParameterButir | null,
): string {
  if (kutipan) {
    const t = tabs.find((x) => cariKutipan(x.teks, kutipan));
    if (t) return t.nama;
  }
  const p = param && param.tipe === "semantik" ? param : null;
  if (p?.lampiran) {
    const t = tabs.find((x) => x.jenis === "lampiran" && x.nama.toLowerCase() === `lampiran: ${p.lampiran}`.toLowerCase());
    if (t) return t.nama;
  }
  if (p?.bagian) {
    const t = tabs.find((x) => x.jenis === "bagian" && x.nama.trim().toLowerCase() === p.bagian.trim().toLowerCase());
    if (t) return t.nama;
  }
  return tabs[0]?.nama ?? "";
}

/** Pembacaan paralel membuka beberapa sambungan WebSocket ke Neon sekaligus; satu kegagalan sambungan sesaat diulang sekali. */
async function ulangSekali<T>(kerja: () => Promise<T>): Promise<T> {
  try {
    return await kerja();
  } catch {
    return await kerja();
  }
}

/** bukaVersiDinilai() + ambilHasilPemeriksaan(): seluruh bahan J-08. Tidak memanggil LLM. */
export async function muatPemeriksaan(penugasan: Penugasan): Promise<DataPemeriksaan> {
  const db = getDb();
  const ambilProposal = () =>
    db
      .select({ p: proposal, skema: skemaPendanaan.namaSkema })
      .from(proposal)
      .innerJoin(skemaPendanaan, eq(skemaPendanaan.id, proposal.skemaId))
      .where(eq(proposal.id, penugasan.proposalId));

  let versiId = penugasan.versiId;
  if (!versiId) {
    const [terbaru] = await db.select({ id: versiProposal.id }).from(versiProposal).where(eq(versiProposal.proposalId, penugasan.proposalId)).orderBy(desc(versiProposal.nomor)).limit(1);
    versiId = terbaru?.id ?? null;
    if (versiId) await db.update(penugasanReviewer).set({ versiId }).where(eq(penugasanReviewer.id, penugasan.id));
  }
  if (!versiId) throw new Error("Proposal belum memiliki versi yang dapat dinilai");
  const idVersi = versiId;
  // pembacaan yang saling bebas dijalankan serempak (NFR 2.3: J-08 terbuka paling lama 3 detik)
  const [[prop], [versi]] = await ulangSekali(() => Promise.all([ambilProposal(), db.select().from(versiProposal).where(eq(versiProposal.id, idVersi))]));

  const [daftarBagian, pen, semuaHasil, semantik] = await ulangSekali(() => Promise.all([
    versi.templatId ? db.select().from(bagianTemplat).where(eq(bagianTemplat.templatId, versi.templatId)).orderBy(asc(bagianTemplat.urutan)) : Promise.resolve([]),
    pastikanPenilaian(penugasan.id),
    db
      .select({ h: hasilPemeriksaan, urutan: butirCek.urutan, deskripsi: butirCek.deskripsi, parameter: butirCek.parameter })
      .from(hasilPemeriksaan)
      .innerJoin(butirCek, eq(butirCek.id, hasilPemeriksaan.butirId))
      .where(eq(hasilPemeriksaan.versiId, idVersi))
      .orderBy(asc(butirCek.urutan)),
    // rekomendasi harus sudah ada saat reviewer membuka (UC-07 langkah 1); bila belum, jadwalkan tanpa menunggu
    pastikanSemantikBerjalan(idVersi),
  ]));

  // tab: bagian menurut urutan templat, lalu lampiran
  const namaBagian = daftarBagian.map((b) => b.nama);
  for (const k of Object.keys(versi.teksPerBagian)) if (!namaBagian.some((n) => n.toLowerCase() === k.toLowerCase())) namaBagian.push(k);
  const tab: TabTeks[] = [
    ...namaBagian.map((n) => ({ nama: n, jenis: "bagian" as const, teks: ambilBerdasarkanNama(versi.teksPerBagian, n) })),
    ...Object.entries(versi.teksLampiran).map(([n, t]) => ({ nama: `Lampiran: ${n}`, jenis: "lampiran" as const, teks: t })),
  ];

  const [koreksi, komponenRows] = await ulangSekali(() =>
    Promise.all([
      db.select().from(koreksiRekomendasi).where(eq(koreksiRekomendasi.penilaianId, pen.id)),
      db.select().from(keputusanKomponen).where(eq(keputusanKomponen.penilaianId, pen.id)),
    ]),
  );
  const petaKoreksi = new Map(koreksi.map((k) => [k.hasilId, k]));

  const butir: ButirTampil[] = semuaHasil
    .filter((r) => r.h.jenis === "semantik")
    .map((r) => {
      const k = petaKoreksi.get(r.h.id);
      return {
        hasilId: r.h.id,
        kode: r.h.butirKode,
        deskripsi: r.deskripsi,
        tab: pilihTab(tab, r.h.kutipan, r.parameter as ParameterButir | null),
        status: r.h.status as StatusHasilSemantik,
        rekomendasi: r.h.rekomendasi,
        kutipan: r.h.kutipan,
        tingkatKeyakinan: r.h.tingkatKeyakinan,
        alasanSistem: r.h.alasanSistem,
        tiruan: r.h.tiruan,
        koreksi: k ? { keputusan: k.keputusanReviewer, alasan: k.alasan, jenisKekeliruan: k.jenisKekeliruan } : null,
      };
    });
  const det = semuaHasil.filter((r) => r.h.jenis === "deterministik");

  const penilaianTampil: PenilaianTampil = {
    id: pen.id,
    status: pen.status,
    umpanBalik: pen.komentar ?? "",
    komponen: Object.fromEntries(komponenRows.map((r) => [r.komponen, r.keputusan])),
    terkirimKeBima: pen.dikirimKeBimaPada !== null,
  };

  return {
    penugasanId: penugasan.id,
    label: penugasan.label,
    proposal: { idProposal: prop.p.idProposal, judul: prop.p.judul, skema: prop.skema, kodeVersi: versi.kode },
    tab,
    butir,
    deterministik: { total: det.length, lolos: det.filter((r) => r.h.status === "Lolos").length, gagal: det.filter((r) => r.h.status === "Gagal").length },
    semantik,
    penilaian: penilaianTampil,
  };
}

/* ------------------------------- UC-08 ------------------------------- */
/** catatKoreksi + simpanKoreksi + gantiRekomendasi. Rekomendasi sistem semula tidak diubah (untuk pemantauan UC-04). */
export async function simpanKoreksi(
  penugasanId: string,
  akun: Pick<Akun, "id" | "idBima">,
  hasilId: string,
  masukan: MasukanKoreksi,
): Promise<HasilAksi<{ koreksi: { keputusan: Keputusan; alasan: string; jenisKekeliruan: string } }>> {
  const kolom = validasiKoreksi(masukan);
  if (Object.keys(kolom).length) return { ok: false, galat: kolom.alasan ?? "Masukan koreksi tidak valid", kolom };
  const akses = await periksaAkses(penugasanId, akun);
  if (!akses.ok) return { ok: false, galat: akses.kode === 403 ? "Akses ditolak" : "Penugasan tidak ditemukan" };

  const db = getDb();
  const pen = await pastikanPenilaian(penugasanId);
  if (pen.status === "Final") return { ok: false, galat: "Penilaian sudah final dan tidak dapat diubah" };
  if (!UUID.test(hasilId)) return { ok: false, galat: "Butir tidak ditemukan" };
  const [h] = await db.select().from(hasilPemeriksaan).where(eq(hasilPemeriksaan.id, hasilId));
  const versiNilai = akses.penugasan.versiId;
  if (!h || h.jenis !== "semantik" || (versiNilai && h.versiId !== versiNilai)) return { ok: false, galat: "Butir tidak ditemukan pada proposal ini" };

  const keputusan = masukan.keputusan as Keputusan;
  const alasan = masukan.alasan.trim();
  await db
    .insert(koreksiRekomendasi)
    .values({ penilaianId: pen.id, hasilId, keputusanReviewer: keputusan, alasan, jenisKekeliruan: masukan.jenisKekeliruan })
    .onConflictDoUpdate({
      target: koreksiRekomendasi.hasilId,
      set: { penilaianId: pen.id, keputusanReviewer: keputusan, alasan, jenisKekeliruan: masukan.jenisKekeliruan, waktuKoreksi: new Date() },
    });
  await db.update(penilaian).set({ diperbaruiPada: new Date() }).where(eq(penilaian.id, pen.id));
  await catatLogAudit({
    aktor: akun.idBima,
    aksi: "koreksi.simpan",
    objek: `hasil:${hasilId}`,
    rincian: { penugasanId, butir: h.butirKode, rekomendasiSemula: h.rekomendasi, statusSemula: h.status, keputusanReviewer: keputusan, jenisKekeliruan: masukan.jenisKekeliruan },
  });
  return { ok: true, koreksi: { keputusan, alasan, jenisKekeliruan: masukan.jenisKekeliruan } };
}

/* ------------------------------- simpan ------------------------------- */
async function simpanIsian(penilaianId: string, umpanBalik: string, komponen: Record<string, Keputusan>, status: "Draf" | "Final") {
  const db = getDb();
  const memenuhi = KOMPONEN_BORANG.filter((k) => komponen[k] === "Memenuhi").length;
  await db.transaction(async (tx) => {
    await tx.delete(keputusanKomponen).where(eq(keputusanKomponen.penilaianId, penilaianId));
    const baris = Object.entries(komponen).map(([k, v]) => ({ penilaianId, komponen: k, keputusan: v }));
    if (baris.length) await tx.insert(keputusanKomponen).values(baris);
    await tx
      .update(penilaian)
      .set({ komentar: umpanBalik, status, nilai: `${memenuhi} dari ${KOMPONEN_BORANG.length} komponen Memenuhi`, diperbaruiPada: new Date() })
      .where(eq(penilaian.id, penilaianId));
  });
}

/** S-1: Simpan Sementara. Tanpa entri log audit dan tanpa pengiriman ke BIMA. */
export async function simpanSementara(
  penugasanId: string,
  akun: Pick<Akun, "id" | "idBima">,
  isian: { umpanBalik: string; komponen: Record<string, string | undefined> },
): Promise<HasilAksi> {
  const akses = await periksaAkses(penugasanId, akun);
  if (!akses.ok) return { ok: false, galat: akses.kode === 403 ? "Akses ditolak" : "Penugasan tidak ditemukan" };
  const pen = await pastikanPenilaian(penugasanId);
  if (pen.status === "Final") return { ok: false, galat: "Penilaian sudah final dan tidak dapat diubah" };
  await simpanIsian(pen.id, isian.umpanBalik ?? "", bersihkanKomponen(isian.komponen), "Draf");
  await getDb().update(penugasanReviewer).set({ label: "Draf" }).where(eq(penugasanReviewer.id, penugasanId));
  return { ok: true };
}

/** Kirim keputusan ke BIMA lewat klien (ulang otomatis maksimal 2 kali). */
async function kirimKeBima(penugasanId: string, akun: Pick<Akun, "id" | "idBima">): Promise<HasilAksi> {
  const db = getDb();
  const [pen] = await db.select().from(penilaian).where(eq(penilaian.penugasanId, penugasanId));
  const [prop] = await db
    .select({ idProposal: proposal.idProposal })
    .from(penugasanReviewer)
    .innerJoin(proposal, eq(proposal.id, penugasanReviewer.proposalId))
    .where(eq(penugasanReviewer.id, penugasanId));
  const komponen = await db.select().from(keputusanKomponen).where(eq(keputusanKomponen.penilaianId, pen.id));
  const koreksi = await db.select({ id: koreksiRekomendasi.id }).from(koreksiRekomendasi).where(eq(koreksiRekomendasi.penilaianId, pen.id));
  try {
    await bima.kirimKeputusan({
      idProposal: prop.idProposal,
      reviewerIdBima: akun.idBima,
      komponen: komponen.map((k) => ({ komponen: k.komponen, keputusan: k.keputusan })),
      umpanBalik: pen.komentar ?? "",
      jumlahKoreksi: koreksi.length,
    });
  } catch (e) {
    await catatLogAudit({ aktor: akun.idBima, aksi: "penilaian.kirim_bima_gagal", objek: `penugasan:${penugasanId}`, rincian: { galat: e instanceof Error ? e.message : String(e) } });
    return { ok: false, galat: "Penilaian tersimpan, tetapi gagal terkirim ke BIMA. Tekan \"Kirim ulang\"." };
  }
  await db.update(penilaian).set({ dikirimKeBimaPada: new Date() }).where(eq(penilaian.id, pen.id));
  await catatLogAudit({ aktor: akun.idBima, aksi: "penilaian.terkirim_bima", objek: `penugasan:${penugasanId}`, rincian: { idProposal: prop.idProposal } });
  return { ok: true };
}

/** Simpan Permanen: simpanNilai, terima, tandaiSelesai, mencatatPenilaian (log audit), kirimKeputusan. */
export async function simpanPermanen(
  penugasanId: string,
  akun: Pick<Akun, "id" | "idBima">,
  isian: { umpanBalik: string; komponen: Record<string, string | undefined> },
): Promise<HasilAksi<{ terkirim: boolean; pesanKirim?: string }>> {
  const akses = await periksaAkses(penugasanId, akun);
  if (!akses.ok) return { ok: false, galat: akses.kode === 403 ? "Akses ditolak" : "Penugasan tidak ditemukan" };
  const pen = await pastikanPenilaian(penugasanId);
  if (pen.status === "Final") return { ok: false, galat: "Penilaian sudah final dan tidak dapat diubah" };
  const komponen = bersihkanKomponen(isian.komponen);
  if (!komponenLengkap(komponen)) return { ok: false, galat: PESAN_KOMPONEN_BELUM_LENGKAP };

  const db = getDb();
  await simpanIsian(pen.id, isian.umpanBalik ?? "", komponen, "Final");
  await db.update(penugasanReviewer).set({ status: "Selesai", label: "Selesai" }).where(eq(penugasanReviewer.id, penugasanId)); // tandaiSelesai
  const koreksi = await db.select({ id: koreksiRekomendasi.id }).from(koreksiRekomendasi).where(eq(koreksiRekomendasi.penilaianId, pen.id));
  await catatLogAudit({
    aktor: akun.idBima,
    aksi: "penilaian.simpan_permanen",
    objek: `penugasan:${penugasanId}`,
    rincian: { komponen, jumlahKoreksi: koreksi.length, umpanBalikPanjang: (isian.umpanBalik ?? "").length },
  }); // mencatatPenilaian

  const kirim = await kirimKeBima(penugasanId, akun);
  return kirim.ok ? { ok: true, terkirim: true } : { ok: true, terkirim: false, pesanKirim: kirim.galat };
}

/** Tombol "Kirim ulang" bila pengiriman ke BIMA gagal setelah penilaian final tersimpan. */
export async function kirimUlangKeBima(penugasanId: string, akun: Pick<Akun, "id" | "idBima">): Promise<HasilAksi> {
  const akses = await periksaAkses(penugasanId, akun);
  if (!akses.ok) return { ok: false, galat: akses.kode === 403 ? "Akses ditolak" : "Penugasan tidak ditemukan" };
  const [pen] = await getDb().select().from(penilaian).where(eq(penilaian.penugasanId, penugasanId));
  if (!pen || pen.status !== "Final") return { ok: false, galat: "Penilaian belum final" };
  if (pen.dikirimKeBimaPada) return { ok: true };
  return kirimKeBima(penugasanId, akun);
}
