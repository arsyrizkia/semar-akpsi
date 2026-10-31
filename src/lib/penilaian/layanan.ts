/**
 * Layanan UC-07 (pemeriksaan akhir) dan UC-08 (koreksi rekomendasi) di sisi server.
 * Semua fungsi menerima akun reviewer yang sedang masuk dan memeriksa kepemilikan penugasan (NFR 3.1).
 */
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { getDb, type Db } from "@/db";
import {
  bagianTemplat,
  berkasVersi,
  bimaBerkas,
  butirCek,
  hasilPemeriksaan,
  keputusanKomponen,
  koreksiRekomendasi,
  penilaian,
  penugasanReviewer,
  periodeSeleksi,
  proposal,
  skemaPendanaan,
  versiProposal,
} from "@/db/schema";
import type { Akun } from "@/lib/auth";
import { catatLogAudit } from "@/lib/audit";
import { bima } from "@/lib/bima/client";
import { KOMPONEN_BORANG, type Keputusan, type ParameterButir, type StatusHasilSemantik } from "@/lib/kontrak/tipe";
import { pastikanSemantikBerjalan } from "@/lib/pemeriksa/semantik/jalankan";
import { daftarGambarPemilik, pemilikVersi } from "@/lib/pengajuan/gambar-simpan";
import { waktuDemo } from "@/lib/waktu";
import { formatTenggat, hitungTenggat, posisiMasa, teksSisa } from "./masa";
import { bolehUbahPenilaian } from "./status";
import { susunButirTampil, susunTab, type BahanButir } from "./tinjauan";
import type { BarisDaftarPenugasan, BerkasTampil, ButirTampil, DataKeputusan, DataPemeriksaan, HasilAksi, PenilaianTampil, TabTeks, TenggatTampil } from "./tipe";
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
      periodeId: penugasanReviewer.periodeId,
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
  return baris.map((b) => ({ penugasanId: b.id, periodeId: b.periodeId, judul: b.judul, skema: b.skema, tanggal: format.format(b.tanggal), label: b.label }));
}

/** Tenggat masa penilaian beberapa periode menurut jam demo (hanya periode yang masanya sudah dimulai). */
export async function ambilTenggat(periodeIds: string[]): Promise<Map<string, TenggatTampil & { nama: string }>> {
  const hasil = new Map<string, TenggatTampil & { nama: string }>();
  if (!periodeIds.length) return hasil;
  const [baris, sekarang] = await Promise.all([
    getDb().select().from(periodeSeleksi).where(inArray(periodeSeleksi.id, [...new Set(periodeIds)])),
    waktuDemo(),
  ]);
  for (const p of baris) {
    if (!p.mulaiPenilaian) continue;
    const batas = p.batasPenilaian ?? hitungTenggat(p.mulaiPenilaian, p.lamaPenilaianHari);
    const pos = posisiMasa(sekarang, p.mulaiPenilaian, p.lamaPenilaianHari);
    hasil.set(p.id, { nama: p.nama, batas: batas.toISOString(), teks: formatTenggat(batas), sisa: teksSisa(pos, sekarang, batas), lewat: pos.lewat, hariKe: pos.hariKe, lama: pos.lama });
  }
  return hasil;
}

/* ------------------------------- akses ------------------------------- */
type Penugasan = typeof penugasanReviewer.$inferSelect;
export type HasilAkses = { ok: true; penugasan: Penugasan } | { ok: false; kode: 403 | 404 };

/** bukaProposal() (seq-uc07): nama metode sequence untuk periksaAkses. */
export async function bukaProposal(penugasanId: string, akun: Pick<Akun, "id" | "idBima">): Promise<HasilAkses> {
  return periksaAkses(penugasanId, akun);
}

/** Pastikan penugasan ada dan milik reviewer ini. Penolakan 403 dicatat di log audit. */
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
  const [ada] = await db.select().from(penilaian).where(eq(penilaian.penugasanId, penugasanId)).orderBy(desc(penilaian.diperbaruiPada)).limit(1); // yang terbaru disimpan = yang dipakai (stabil walau ada baris ganda akibat permintaan serentak)
  if (ada) return ada;
  const [baru] = await db.insert(penilaian).values({ penugasanId, status: "Draf" }).returning(); // «create» penilaian (UC-07 langkah 5)
  return baru;
}

/** Pembacaan paralel membuka beberapa sambungan WebSocket ke Neon sekaligus; satu kegagalan sambungan sesaat diulang sekali. */
async function ulangSekali<T>(kerja: () => Promise<T>): Promise<T> {
  try {
    return await kerja();
  } catch {
    return await kerja();
  }
}

/** bukaVersiDinilai() (seq-uc07): versi proposal yang dinilai penugasan ini; bila belum tercatat, memakai versi terbaru. */
export async function bukaVersiDinilai(penugasan: Penugasan): Promise<string> {
  const db = getDb();
  let versiId = penugasan.versiId;
  if (!versiId) {
    const [terbaru] = await db.select({ id: versiProposal.id }).from(versiProposal).where(eq(versiProposal.proposalId, penugasan.proposalId)).orderBy(desc(versiProposal.nomor)).limit(1);
    versiId = terbaru?.id ?? null;
    if (versiId) await db.update(penugasanReviewer).set({ versiId }).where(eq(penugasanReviewer.id, penugasan.id));
  }
  if (!versiId) throw new Error("Proposal belum memiliki versi yang dapat dinilai");
  return versiId;
}

/** ambilHasilPemeriksaan() (seq-uc07): semua hasil pemeriksaan sebuah versi beserta butirnya, urut menurut butir. */
export function ambilHasilPemeriksaan(versiId: string) {
  return getDb()
    .select({ h: hasilPemeriksaan, urutan: butirCek.urutan, deskripsi: butirCek.deskripsi, parameter: butirCek.parameter })
    .from(hasilPemeriksaan)
    .innerJoin(butirCek, eq(butirCek.id, hasilPemeriksaan.butirId))
    .where(eq(hasilPemeriksaan.versiId, versiId))
    .orderBy(asc(butirCek.urutan));
}

/** Seluruh bahan J-08 (bukaVersiDinilai + ambilHasilPemeriksaan + keputusan tersimpan). Tidak memanggil LLM. */
export async function muatPemeriksaan(penugasan: Penugasan): Promise<DataPemeriksaan> {
  const db = getDb();
  const ambilProposal = () =>
    db
      .select({ p: proposal, skema: skemaPendanaan.namaSkema })
      .from(proposal)
      .innerJoin(skemaPendanaan, eq(skemaPendanaan.id, proposal.skemaId))
      .where(eq(proposal.id, penugasan.proposalId));

  const idVersi = await bukaVersiDinilai(penugasan);
  // pembacaan yang saling bebas dijalankan serempak (NFR 2.3: J-08 terbuka paling lama 3 detik)
  const [[prop], [versi]] = await ulangSekali(() => Promise.all([ambilProposal(), db.select().from(versiProposal).where(eq(versiProposal.id, idVersi))]));

  const [daftarBagian, pen, semuaHasil, semantik, berkas, gambar, tenggat] = await ulangSekali(() => Promise.all([
    versi.templatId ? db.select().from(bagianTemplat).where(eq(bagianTemplat.templatId, versi.templatId)).orderBy(asc(bagianTemplat.urutan)) : Promise.resolve([]),
    pastikanPenilaian(penugasan.id),
    ambilHasilPemeriksaan(idVersi),
    // rekomendasi harus sudah ada saat reviewer membuka (UC-07 langkah 1); bila belum, jadwalkan tanpa menunggu
    pastikanSemantikBerjalan(idVersi),
    daftarBerkasProposal(prop.p.idProposal, versi.berkasId),
    daftarGambarPemilik(pemilikVersi(idVersi)),
    ambilTenggat([penugasan.periodeId]),
  ]));

  const tab = susunTab({ urutanBagian: daftarBagian.map((b) => b.nama), teksPerBagian: versi.teksPerBagian, teksLampiran: versi.teksLampiran, gambar });

  const [koreksi, komponenRows] = await ulangSekali(() =>
    Promise.all([
      db.select().from(koreksiRekomendasi).where(eq(koreksiRekomendasi.penilaianId, pen.id)),
      db.select().from(keputusanKomponen).where(eq(keputusanKomponen.penilaianId, pen.id)),
    ]),
  );
  const petaKoreksi = new Map(koreksi.map((k) => [k.hasilId, k]));

  const butir = susunButirTampil(bahanButir(semuaHasil, petaKoreksi), tab);
  const det = semuaHasil.filter((r) => r.h.jenis === "deterministik");

  const penilaianTampil: PenilaianTampil = {
    id: pen.id,
    status: pen.status,
    umpanBalik: pen.komentar ?? "",
    komponen: Object.fromEntries(komponenRows.map((r) => [r.komponen, r.keputusan])),
    terkirimKeBima: pen.dikirimKeBimaPada !== null,
  };

  const t = tenggat.get(penugasan.periodeId);
  return {
    penugasanId: penugasan.id,
    tenggat: t ? { batas: t.batas, teks: t.teks, sisa: t.sisa, lewat: t.lewat, hariKe: t.hariKe, lama: t.lama } : null,
    label: penugasan.label,
    proposal: { idProposal: prop.p.idProposal, judul: prop.p.judul, skema: prop.skema, kodeVersi: versi.kode },
    tab,
    butir,
    deterministik: { total: det.length, lolos: det.filter((r) => r.h.status === "Lolos").length, gagal: det.filter((r) => r.h.status === "Gagal").length },
    semantik,
    penilaian: penilaianTampil,
    berkas,
  };
}

/** Hasil semantik (ambilHasilPemeriksaan) beserta koreksi per hasilId, sebelum ditempatkan pada tab. */
function bahanButir(
  semuaHasil: Awaited<ReturnType<typeof ambilHasilPemeriksaan>>,
  petaKoreksi: Map<string, { keputusanReviewer: Keputusan; alasan: string; jenisKekeliruan: string }>,
): BahanButir[] {
  return semuaHasil
    .filter((r) => r.h.jenis === "semantik")
    .map((r) => {
      const k = petaKoreksi.get(r.h.id);
      return {
        hasilId: r.h.id,
        kode: r.h.butirKode,
        deskripsi: r.deskripsi,
        parameter: r.parameter as ParameterButir | null,
        status: r.h.status as StatusHasilSemantik,
        rekomendasi: r.h.rekomendasi,
        kutipan: r.h.kutipan,
        kutipanLain: r.h.kutipanLain ?? [],
        tingkatKeyakinan: r.h.tingkatKeyakinan,
        alasanSistem: r.h.alasanSistem,
        tiruan: r.h.tiruan,
        koreksi: k ? { keputusan: k.keputusanReviewer, alasan: k.alasan, jenisKekeliruan: k.jenisKekeliruan } : null,
      };
    });
}

/** Bahan teks bersorot J-05b (hanya baca): tab dan butir semantik versi yang dinilai, dengan koreksi reviewer bila ada. */
export async function muatTinjauanVersi(versiId: string): Promise<{ tab: TabTeks[]; butir: ButirTampil[] } | null> {
  if (!UUID.test(versiId)) return null;
  const db = getDb();
  const [versi] = await db.select().from(versiProposal).where(eq(versiProposal.id, versiId));
  if (!versi) return null;
  const [daftarBagian, semuaHasil, gambar] = await ulangSekali(() =>
    Promise.all([
      versi.templatId ? db.select({ nama: bagianTemplat.nama }).from(bagianTemplat).where(eq(bagianTemplat.templatId, versi.templatId)).orderBy(asc(bagianTemplat.urutan)) : Promise.resolve([]),
      ambilHasilPemeriksaan(versiId),
      daftarGambarPemilik(pemilikVersi(versiId)),
    ]),
  );
  const idHasil = semuaHasil.filter((r) => r.h.jenis === "semantik").map((r) => r.h.id);
  const koreksi = idHasil.length ? await db.select().from(koreksiRekomendasi).where(inArray(koreksiRekomendasi.hasilId, idHasil)) : [];
  const tab = susunTab({ urutanBagian: daftarBagian.map((b) => b.nama), teksPerBagian: versi.teksPerBagian, teksLampiran: versi.teksLampiran, gambar });
  return { tab, butir: susunButirTampil(bahanButir(semuaHasil, new Map(koreksi.map((k) => [k.hasilId, k]))), tab) };
}

/** Naskah (versi SEMAR; cadangan: naskah di BIMA) dan lampiran di BIMA. Hanya metadata, tanpa isi berkas. */
async function daftarBerkasProposal(idProposal: string, berkasVersiId: string | null): Promise<BerkasTampil[]> {
  const db = getDb();
  const [naskahVersi, bima] = await Promise.all([
    berkasVersiId
      ? db.select({ id: berkasVersi.id, nama: berkasVersi.nama, ukuran: berkasVersi.ukuran }).from(berkasVersi).where(eq(berkasVersi.id, berkasVersiId))
      : Promise.resolve([]),
    db
      .select({ id: bimaBerkas.id, nama: bimaBerkas.nama, ukuran: bimaBerkas.ukuran, peran: bimaBerkas.peran, namaLampiran: bimaBerkas.namaLampiran })
      .from(bimaBerkas)
      .where(eq(bimaBerkas.proposalId, idProposal))
      .orderBy(asc(bimaBerkas.dibuatPada)),
  ]);
  const hasil: BerkasTampil[] = naskahVersi.map((b) => ({ id: b.id, nama: b.nama, ukuran: b.ukuran, peran: "naskah", namaLampiran: null }));
  for (const b of bima) {
    if (b.peran === "lampiran") hasil.push({ id: b.id, nama: b.nama, ukuran: b.ukuran, peran: "lampiran", namaLampiran: b.namaLampiran });
    else if (naskahVersi.length === 0 && !hasil.some((x) => x.peran === "naskah")) hasil.push({ id: b.id, nama: b.nama, ukuran: b.ukuran, peran: "naskah", namaLampiran: null });
  }
  return hasil;
}

/** Bahan J-08b: penilaian tersimpan, ringkasan butir semantik, dan hasil deterministik. Tidak memanggil LLM. */
export async function muatKeputusan(penugasan: Penugasan): Promise<DataKeputusan> {
  const db = getDb();
  const idVersi = await bukaVersiDinilai(penugasan);
  const [[prop], [versi], pen, semuaHasil] = await ulangSekali(() =>
    Promise.all([
      db
        .select({ p: proposal, skema: skemaPendanaan.namaSkema })
        .from(proposal)
        .innerJoin(skemaPendanaan, eq(skemaPendanaan.id, proposal.skemaId))
        .where(eq(proposal.id, penugasan.proposalId)),
      db.select({ kode: versiProposal.kode }).from(versiProposal).where(eq(versiProposal.id, idVersi)),
      pastikanPenilaian(penugasan.id),
      ambilHasilPemeriksaan(idVersi),
    ]),
  );
  const [koreksi, komponenRows] = await ulangSekali(() =>
    Promise.all([
      db.select({ hasilId: koreksiRekomendasi.hasilId }).from(koreksiRekomendasi).where(eq(koreksiRekomendasi.penilaianId, pen.id)),
      db.select().from(keputusanKomponen).where(eq(keputusanKomponen.penilaianId, pen.id)),
    ]),
  );
  const dikoreksi = new Set(koreksi.map((k) => k.hasilId));
  const det = semuaHasil.filter((r) => r.h.jenis === "deterministik");
  return {
    penugasanId: penugasan.id,
    label: penugasan.label,
    proposal: { idProposal: prop.p.idProposal, judul: prop.p.judul, skema: prop.skema, kodeVersi: versi.kode },
    penilaian: {
      id: pen.id,
      status: pen.status,
      umpanBalik: pen.komentar ?? "",
      komponen: Object.fromEntries(komponenRows.map((r) => [r.komponen, r.keputusan])),
      terkirimKeBima: pen.dikirimKeBimaPada !== null,
    },
    butir: semuaHasil.filter((r) => r.h.jenis === "semantik").map((r) => ({ status: r.h.status as StatusHasilSemantik, dikoreksi: dikoreksi.has(r.h.id) })),
    deterministik: { total: det.length, lolos: det.filter((r) => r.h.status === "Lolos").length, gagal: det.filter((r) => r.h.status === "Gagal").length },
  };
}

/* ------------------------------- UC-08 ------------------------------- */
type HasilSemantik = typeof hasilPemeriksaan.$inferSelect;

/** catatKoreksi(hasil) (seq-uc08): pastikan akses, penilaian belum final, dan butir semantik milik proposal ini. */
export async function catatKoreksi(
  penugasanId: string,
  akun: Pick<Akun, "id" | "idBima">,
  hasilId: string,
): Promise<{ ok: true; penilaianId: string; hasil: HasilSemantik } | { ok: false; galat: string }> {
  const akses = await bukaProposal(penugasanId, akun);
  if (!akses.ok) return { ok: false, galat: akses.kode === 403 ? "Akses ditolak" : "Penugasan tidak ditemukan" };
  const db = getDb();
  const pen = await pastikanPenilaian(penugasanId);
  if (!bolehUbahPenilaian(pen.status)) return { ok: false, galat: "Penilaian sudah final dan tidak dapat diubah" };
  if (!UUID.test(hasilId)) return { ok: false, galat: "Butir tidak ditemukan" };
  const [h] = await db.select().from(hasilPemeriksaan).where(eq(hasilPemeriksaan.id, hasilId));
  const versiNilai = akses.penugasan.versiId;
  if (!h || h.jenis !== "semantik" || (versiNilai && h.versiId !== versiNilai)) return { ok: false, galat: "Butir tidak ditemukan pada proposal ini" };
  return { ok: true, penilaianId: pen.id, hasil: h };
}

/** ambilRekomendasi() (seq-uc08 langkah 3): rekomendasi sistem semula untuk sebuah hasil; tidak pernah diubah oleh koreksi. */
export function ambilRekomendasi(hasil: HasilSemantik): { rekomendasi: Keputusan | null; status: string } {
  return { rekomendasi: hasil.rekomendasi, status: hasil.status };
}

/** gantiRekomendasi(keputusan) (seq-uc08): keputusan reviewer menggantikan rekomendasi pada penilaian ini (baris koreksi di-upsert). */
export async function gantiRekomendasi(penilaianId: string, hasilId: string, keputusan: Keputusan, alasan: string, jenisKekeliruan: string): Promise<void> {
  const db = getDb();
  await db
    .insert(koreksiRekomendasi)
    .values({ penilaianId, hasilId, keputusanReviewer: keputusan, alasan, jenisKekeliruan })
    .onConflictDoUpdate({
      target: koreksiRekomendasi.hasilId,
      set: { penilaianId, keputusanReviewer: keputusan, alasan, jenisKekeliruan, waktuKoreksi: new Date() },
    });
  await db.update(penilaian).set({ diperbaruiPada: new Date() }).where(eq(penilaian.id, penilaianId));
}

/** simpanKoreksi(keputusan, alasan, jenisKekeliruan): catatKoreksi, ambilRekomendasi, gantiRekomendasi, lalu log audit. */
export async function simpanKoreksi(
  penugasanId: string,
  akun: Pick<Akun, "id" | "idBima">,
  hasilId: string,
  masukan: MasukanKoreksi,
): Promise<HasilAksi<{ koreksi: { keputusan: Keputusan; alasan: string; jenisKekeliruan: string } }>> {
  const kolom = validasiKoreksi(masukan);
  if (Object.keys(kolom).length) return { ok: false, galat: kolom.alasan ?? "Masukan koreksi tidak valid", kolom };
  const catat = await catatKoreksi(penugasanId, akun, hasilId);
  if (!catat.ok) return catat;
  const semula = ambilRekomendasi(catat.hasil);

  const keputusan = masukan.keputusan as Keputusan;
  const alasan = masukan.alasan.trim();
  await gantiRekomendasi(catat.penilaianId, hasilId, keputusan, alasan, masukan.jenisKekeliruan);
  await catatLogAudit({
    aktor: akun.idBima,
    aksi: "koreksi.simpan",
    objek: `hasil:${hasilId}`,
    rincian: { penugasanId, butir: catat.hasil.butirKode, rekomendasiSemula: semula.rekomendasi, statusSemula: semula.status, keputusanReviewer: keputusan, jenisKekeliruan: masukan.jenisKekeliruan },
  });
  return { ok: true, koreksi: { keputusan, alasan, jenisKekeliruan: masukan.jenisKekeliruan } };
}

/* ------------------------------- simpan ------------------------------- */
/** simpanNilai(nilai, komentar) (seq-uc07): keputusan komponen dan umpan balik disimpan dalam satu transaksi. */
type Eksekutor = Pick<Db, "insert" | "update" | "delete" | "select">;

export async function simpanNilai(penilaianId: string, umpanBalik: string, komponen: Record<string, Keputusan>, status: "Draf" | "Final", ex?: Eksekutor) {
  const memenuhi = KOMPONEN_BORANG.filter((k) => komponen[k] === "Memenuhi").length;
  const tulis = async (tx: Eksekutor) => {
    await tx.delete(keputusanKomponen).where(eq(keputusanKomponen.penilaianId, penilaianId));
    const baris = Object.entries(komponen).map(([k, v]) => ({ penilaianId, komponen: k, keputusan: v }));
    if (baris.length) await tx.insert(keputusanKomponen).values(baris);
    await tx
      .update(penilaian)
      .set({ komentar: umpanBalik, status, nilai: `${memenuhi} dari ${KOMPONEN_BORANG.length} komponen Memenuhi`, diperbaruiPada: new Date() })
      .where(eq(penilaian.id, penilaianId));
  };
  if (ex) await tulis(ex);
  else await getDb().transaction(async (tx) => tulis(tx));
}

/** S-1: Simpan Sementara. Tanpa entri log audit dan tanpa pengiriman ke BIMA. */
export async function simpanSementara(
  penugasanId: string,
  akun: Pick<Akun, "id" | "idBima">,
  isian: { umpanBalik: string; komponen: Record<string, string | undefined> },
): Promise<HasilAksi> {
  const akses = await bukaProposal(penugasanId, akun);
  if (!akses.ok) return { ok: false, galat: akses.kode === 403 ? "Akses ditolak" : "Penugasan tidak ditemukan" };
  const pen = await pastikanPenilaian(penugasanId);
  if (!bolehUbahPenilaian(pen.status)) return { ok: false, galat: "Penilaian sudah final dan tidak dapat diubah" };
  await simpanNilai(pen.id, isian.umpanBalik ?? "", bersihkanKomponen(isian.komponen), "Draf");
  await getDb().update(penugasanReviewer).set({ label: "Draf" }).where(eq(penugasanReviewer.id, penugasanId));
  return { ok: true };
}

/** Kirim keputusan ke BIMA lewat klien (ulang otomatis maksimal 2 kali). */
async function kirimKeBima(penugasanId: string, akun: Pick<Akun, "id" | "idBima">): Promise<HasilAksi> {
  const db = getDb();
  const [pen] = await db.select().from(penilaian).where(eq(penilaian.penugasanId, penugasanId)).orderBy(desc(penilaian.diperbaruiPada)).limit(1);
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
      kunci: pen.id,
    });
  } catch (e) {
    await catatLogAudit({ aktor: akun.idBima, aksi: "penilaian.kirim_bima_gagal", objek: `penugasan:${penugasanId}`, rincian: { galat: e instanceof Error ? e.message : String(e) } });
    return { ok: false, galat: "Penilaian tersimpan, tetapi gagal terkirim ke BIMA. Tekan \"Kirim ulang\"." };
  }
  await db.update(penilaian).set({ dikirimKeBimaPada: new Date() }).where(eq(penilaian.id, pen.id));
  await catatLogAudit({ aktor: akun.idBima, aksi: "penilaian.terkirim_bima", objek: `penugasan:${penugasanId}`, rincian: { idProposal: prop.idProposal } });
  return { ok: true };
}

/** terima() (seq-uc07): penilaian diterima sebagai final; sesudah ini isian hanya dapat dibaca. */
export async function terima(penilaianId: string, ex: Pick<Db, "update"> = getDb()): Promise<void> {
  await ex.update(penilaian).set({ status: "Final", diperbaruiPada: new Date() }).where(eq(penilaian.id, penilaianId));
}

/** tandaiSelesai() (seq-uc07): penugasan berlabel Selesai di J-07. */
export async function tandaiSelesai(penugasanId: string, ex: Pick<Db, "update"> = getDb()): Promise<void> {
  await ex.update(penugasanReviewer).set({ status: "Selesai", label: "Selesai" }).where(eq(penugasanReviewer.id, penugasanId));
}

/** mencatatPenilaian() (seq-uc07): entri log audit penilaian.simpan_permanen. */
export async function mencatatPenilaian(
  penugasanId: string,
  akun: Pick<Akun, "idBima">,
  penilaianId: string,
  komponen: Record<string, Keputusan>,
  panjangUmpanBalik: number,
  ex: Pick<Db, "select" | "insert"> = getDb(),
): Promise<void> {
  const koreksi = await ex.select({ id: koreksiRekomendasi.id }).from(koreksiRekomendasi).where(eq(koreksiRekomendasi.penilaianId, penilaianId));
  await catatLogAudit({
    aktor: akun.idBima,
    aksi: "penilaian.simpan_permanen",
    objek: `penugasan:${penugasanId}`,
    rincian: { komponen, jumlahKoreksi: koreksi.length, umpanBalikPanjang: panjangUmpanBalik },
  }, ex);
}

/** Simpan Permanen: simpanNilai, terima, tandaiSelesai, mencatatPenilaian (log audit), kirimKeputusan. */
export async function simpanPermanen(
  penugasanId: string,
  akun: Pick<Akun, "id" | "idBima">,
  isian: { umpanBalik: string; komponen: Record<string, string | undefined> },
): Promise<HasilAksi<{ terkirim: boolean; pesanKirim?: string }>> {
  const akses = await bukaProposal(penugasanId, akun);
  if (!akses.ok) return { ok: false, galat: akses.kode === 403 ? "Akses ditolak" : "Penugasan tidak ditemukan" };
  const pen = await pastikanPenilaian(penugasanId);
  if (!bolehUbahPenilaian(pen.status)) return { ok: false, galat: "Penilaian sudah final dan tidak dapat diubah" };
  const komponen = bersihkanKomponen(isian.komponen);
  if (!komponenLengkap(komponen)) return { ok: false, galat: PESAN_KOMPONEN_BELUM_LENGKAP };

  // Satu transaksi: klaim atomik status Final (dua permintaan serentak tidak keduanya lolos), keputusan komponen,
  // penugasan Selesai, dan log audit. Pengiriman ke BIMA dilakukan sesudah commit.
  const berhasil = await getDb().transaction(async (tx) => {
    const klaim = await tx
      .update(penilaian)
      .set({ status: "Final", diperbaruiPada: new Date() })
      .where(and(eq(penilaian.id, pen.id), ne(penilaian.status, "Final")))
      .returning({ id: penilaian.id });
    if (!klaim.length) return false;
    await simpanNilai(pen.id, isian.umpanBalik ?? "", komponen, "Final", tx);
    await tandaiSelesai(penugasanId, tx);
    await mencatatPenilaian(penugasanId, akun, pen.id, komponen, (isian.umpanBalik ?? "").length, tx);
    return true;
  });
  if (!berhasil) return { ok: false, galat: "Penilaian sudah final dan tidak dapat diubah" };

  const kirim = await kirimKeputusan(penugasanId, akun);
  return kirim.ok ? { ok: true, terkirim: true } : { ok: true, terkirim: false, pesanKirim: kirim.galat };
}

/** Tombol "Kirim ulang" bila pengiriman ke BIMA gagal setelah penilaian final tersimpan. */
export async function kirimUlangKeBima(penugasanId: string, akun: Pick<Akun, "id" | "idBima">): Promise<HasilAksi> {
  const akses = await bukaProposal(penugasanId, akun);
  if (!akses.ok) return { ok: false, galat: akses.kode === 403 ? "Akses ditolak" : "Penugasan tidak ditemukan" };
  const [pen] = await getDb().select().from(penilaian).where(eq(penilaian.penugasanId, penugasanId)).orderBy(desc(penilaian.diperbaruiPada)).limit(1);
  if (!pen || pen.status !== "Final") return { ok: false, galat: "Penilaian belum final" };
  if (pen.dikirimKeBimaPada) return { ok: true };
  return kirimKeputusan(penugasanId, akun);
}

/** kirimKeputusan(keputusan, umpanBalik) (seq-uc07): nama metode sequence untuk kirimKeBima. */
export const kirimKeputusan = kirimKeBima;
