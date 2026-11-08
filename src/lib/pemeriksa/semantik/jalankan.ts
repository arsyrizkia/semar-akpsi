/**
 * UC-09 sisi basis data: antrean (job_semantik), jalankanPemeriksaan(semantik), penyimpanan hasil_pemeriksaan.
 * Antrean tahan hilang (NFR 2.5): baris job disimpan dulu; pemrosesan dijadwalkan lewat after() dan
 * dijadwalkan ulang oleh J-08 bila job masih Menunggu (pastikanSemantikBerjalan).
 */
import { after } from "next/server";
import { and, desc, eq, inArray, lt, notLike, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { akun, basisAturan, butirCek, hasilPemeriksaan, jobSemantik, proposal, versiProposal } from "@/db/schema";
import { AKHIRAN_SIMULASI } from "@/lib/aturan/draf";
import { catatLogAudit } from "@/lib/audit";
import { PESAN_ULANG_SEDANG_BERJALAN as PESAN_SEDANG_BERJALAN, putuskanJalankanUlangSemantik, type StatusSemantikJob } from "@/lib/penilaian/status";
import type { ButirCek, RingkasanPemeriksaanSemantik } from "@/lib/kontrak/tipe";
import { modeLlm } from "@/lib/llm/konfigurasi";
import { muatGambarNaskah, pemilikVersi } from "@/lib/pengajuan/gambar-simpan";
import { nilaiSemantikDenganOpsi, type OpsiNilai } from "./mesin";
import { siapkanTeksTanpaIdentitas } from "./teks";

/** Job Berjalan yang lebih lama dari ini dianggap macet dan boleh diambil ulang. */
const BATAS_MACET_MS = 3 * 60_000;

function keButir(r: typeof butirCek.$inferSelect): ButirCek {
  return {
    id: r.id,
    kode: r.kode,
    deskripsi: r.deskripsi,
    jenis: r.jenis,
    asal: r.asal,
    komponen: r.komponen,
    pemeriksa: r.pemeriksa,
    parameter: r.parameter as ButirCek["parameter"],
    aturanHitung: r.aturanHitung,
    pertanyaan: r.pertanyaan,
    contohJawaban: r.contohJawaban,
    status: r.status,
  };
}

/** Jadwalkan pemrosesan setelah respons dikirim; di luar lingkup permintaan (tes, skrip) langsung dilewati. */
function jadwalkan(versiId: string) {
  try {
    after(async () => {
      try {
        await jalankan(versiId);
      } catch (e) {
        console.error("[semantik] pemrosesan latar belakang gagal", versiId, e);
      }
    });
  } catch {
    /* di luar lingkup permintaan: job tetap Menunggu dan diambil J-08 atau pemanggil berikutnya */
  }
}

/** antrekanPemeriksaanSemantik (UC-05 langkah 10): masukkan versi ke antrean. */
export async function antrekan(versiId: string): Promise<{ jobId: string }> {
  const db = getDb();
  const [ada] = await db
    .select()
    .from(jobSemantik)
    .where(and(eq(jobSemantik.versiId, versiId), inArray(jobSemantik.status, ["Menunggu", "Berjalan"])))
    .orderBy(desc(jobSemantik.diantrekanPada))
    .limit(1);
  let jobId = ada?.id;
  if (!jobId) {
    const [baru] = await db.insert(jobSemantik).values({ versiId, status: "Menunggu" }).returning({ id: jobSemantik.id });
    jobId = baru.id;
    await catatLogAudit({ aktor: "sistem", aksi: "semantik.diantrekan", objek: `versi:${versiId}`, rincian: { jobId } });
  }
  jadwalkan(versiId);
  return { jobId };
}

/**
 * Dipanggil saat J-08 dibuka: bila hasil semantik belum ada, pastikan jobnya ada dan terjadwal.
 * Tidak memanggil LLM di jalur render (NFR 2.3). Mengembalikan status untuk ditampilkan.
 */
export async function pastikanSemantikBerjalan(versiId: string): Promise<{ siap: boolean; status: "Menunggu" | "Berjalan" | "Selesai" | "Gagal" | "Belum ada" }> {
  const db = getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(hasilPemeriksaan)
    .where(and(eq(hasilPemeriksaan.versiId, versiId), eq(hasilPemeriksaan.jenis, "semantik")));
  if (n > 0) return { siap: true, status: "Selesai" };
  const [job] = await db.select().from(jobSemantik).where(eq(jobSemantik.versiId, versiId)).orderBy(desc(jobSemantik.diantrekanPada)).limit(1);
  if (!job) {
    await antrekan(versiId);
    return { siap: false, status: "Menunggu" };
  }
  if (job.status === "Selesai") return { siap: true, status: "Selesai" }; // tidak ada butir semantik aktif
  if (job.status === "Gagal") return { siap: true, status: "Gagal" };
  const macet = job.status === "Berjalan" && job.mulaiPada && Date.now() - job.mulaiPada.getTime() > BATAS_MACET_MS;
  if (job.status === "Menunggu" || macet) jadwalkan(versiId);
  return { siap: false, status: job.status === "Berjalan" ? "Berjalan" : "Menunggu" };
}

/** Keadaan antrean semantik sebuah versi (hanya baca; tidak memanggil LLM). */
export async function bacaKeadaanSemantik(versiId: string): Promise<{ status: StatusSemantikJob; macet: boolean; adaHasil: boolean }> {
  const db = getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(hasilPemeriksaan)
    .where(and(eq(hasilPemeriksaan.versiId, versiId), eq(hasilPemeriksaan.jenis, "semantik")));
  const [job] = await db.select().from(jobSemantik).where(eq(jobSemantik.versiId, versiId)).orderBy(desc(jobSemantik.diantrekanPada)).limit(1);
  if (!job) return { status: "Belum ada", macet: false, adaHasil: n > 0 };
  const sejak = job.status === "Berjalan" ? (job.mulaiPada ?? job.diantrekanPada) : job.diantrekanPada;
  const macet = (job.status === "Berjalan" || job.status === "Menunggu") && Date.now() - sejak.getTime() > BATAS_MACET_MS;
  return { status: job.status, macet, adaHasil: n > 0 };
}

export type HasilJalankanUlang = { ok: true; tindakan: "job-baru" | "pakai-job-ada" } | { ok: false; galat: string };

/**
 * Reviewer menjalankan ulang pemeriksaan semantik di J-08 (UC-07, UC-09). Pemanggil sudah memeriksa penugasan dan status
 * penilaian (`konteks`); keadaan antrean dibaca dan diputuskan ulang di sini. LLM tidak dipanggil: pekerjaan hanya dijadwalkan.
 *
 * Hasil sebagian: `jalankan` menyimpan semua hasil semantik dengan satu pernyataan INSERT ... ON CONFLICT sebelum job
 * ditandai Selesai, sehingga job yang gagal di tahap LLM tidak meninggalkan baris hasil. Bila job gagal sesudah penyimpanan
 * (mis. saat mencatat audit), hasil sudah ada: `adaHasil` menolak jalan ulang, dan jalan ulang memang tidak diperlukan.
 * Jalan ulang tidak pernah berjalan di atas hasil lama, jadi tidak ada percampuran; upsert berkunci (versi, butir) menjaga sisanya.
 */
export async function jalankanUlangSemantik(
  versiId: string,
  aktor: string,
  konteks: { ditugaskan: boolean; final: boolean },
): Promise<HasilJalankanUlang> {
  const keadaan = await bacaKeadaanSemantik(versiId);
  const putusan = putuskanJalankanUlangSemantik({ ...konteks, ...keadaan });
  if (!putusan.boleh) return { ok: false, galat: putusan.pesan };

  const db = getDb();
  let jobId: string | undefined;
  if (putusan.tindakan === "job-baru") {
    // baris Gagal lama dibiarkan sebagai riwayat; sisip hanya bila belum ada job aktif (menahan klik ganda serentak)
    const r = await db.execute(sql`
      insert into job_semantik (versi_id, status)
      select ${versiId}::uuid, 'Menunggu'
      where not exists (select 1 from job_semantik where versi_id = ${versiId}::uuid and status in ('Menunggu', 'Berjalan'))
      returning id`);
    jobId = (r.rows[0] as { id: string } | undefined)?.id;
    if (!jobId) return { ok: false, galat: PESAN_SEDANG_BERJALAN };
  } else {
    const [job] = await db.select({ id: jobSemantik.id }).from(jobSemantik).where(eq(jobSemantik.versiId, versiId)).orderBy(desc(jobSemantik.diantrekanPada)).limit(1);
    jobId = job?.id;
  }
  await catatLogAudit({ aktor, aksi: "semantik.dijalankan-ulang", objek: `versi:${versiId}`, rincian: { jobId, tindakan: putusan.tindakan, statusSebelumnya: keadaan.status } });
  jadwalkan(versiId);
  return { ok: true, tindakan: putusan.tindakan };
}

async function ringkas(versiId: string, tiruan: boolean): Promise<RingkasanPemeriksaanSemantik> {
  const baris = await getDb()
    .select({ status: hasilPemeriksaan.status, tiruan: hasilPemeriksaan.tiruan })
    .from(hasilPemeriksaan)
    .where(and(eq(hasilPemeriksaan.versiId, versiId), eq(hasilPemeriksaan.jenis, "semantik")));
  return {
    versiId,
    jumlahButir: baris.length,
    jumlahMemenuhi: baris.filter((b) => b.status === "Memenuhi").length,
    jumlahPerluManual: baris.filter((b) => b.status === "Perlu diperiksa manual").length,
    jumlahBelumAda: baris.filter((b) => b.status === "Belum ada rekomendasi").length,
    tiruan: baris.length ? baris.some((b) => b.tiruan) : tiruan,
  };
}

/** Mengambil job untuk dikerjakan secara atomik; null bila sedang dikerjakan proses lain. */
async function klaimJob(versiId: string): Promise<string | null> {
  const db = getDb();
  const [job] = await db.select().from(jobSemantik).where(eq(jobSemantik.versiId, versiId)).orderBy(desc(jobSemantik.diantrekanPada)).limit(1);
  const sekarang = new Date();
  if (!job || job.status === "Selesai" || job.status === "Gagal") {
    const [baru] = await db.insert(jobSemantik).values({ versiId, status: "Berjalan", percobaan: 1, mulaiPada: sekarang }).returning({ id: jobSemantik.id });
    return baru.id;
  }
  const macet = job.status === "Berjalan" && job.mulaiPada && sekarang.getTime() - job.mulaiPada.getTime() > BATAS_MACET_MS;
  if (job.status === "Berjalan" && !macet) return null;
  const diklaim = await db
    .update(jobSemantik)
    .set({ status: "Berjalan", mulaiPada: sekarang, percobaan: sql`${jobSemantik.percobaan} + 1`, galat: null })
    .where(and(eq(jobSemantik.id, job.id), eq(jobSemantik.status, job.status)))
    .returning({ id: jobSemantik.id });
  return diklaim[0]?.id ?? null;
}

/** jalankanPemeriksaanSemantik (UC-09). */
export async function jalankan(versiId: string, opsi: OpsiNilai = {}): Promise<RingkasanPemeriksaanSemantik> {
  const db = getDb();
  const tiruan = opsi.tiruan ?? modeLlm() === "tiruan";
  const jobId = await klaimJob(versiId);
  if (!jobId) return ringkas(versiId, tiruan); // proses lain sedang mengerjakan

  try {
    const [versi] = await db.select().from(versiProposal).where(eq(versiProposal.id, versiId));
    if (!versi) throw new Error("versi proposal tidak ditemukan");
    const [prop] = await db.select().from(proposal).where(eq(proposal.id, versi.proposalId));
    const [pengusul] = await db.select().from(akun).where(eq(akun.id, prop.pengusulId));

    // langkah 2: basis aturan yang berlaku, butir semantik Aktif / Perlu ditinjau
    let basisId = versi.basisAturanId;
    if (!basisId) {
      const [b] = await db
        .select({ id: basisAturan.id })
        .from(basisAturan)
        .where(and(eq(basisAturan.skemaId, prop.skemaId), lt(basisAturan.tanggalBerlaku, new Date("9999-01-01T00:00:00Z")), notLike(basisAturan.kode, `%${AKHIRAN_SIMULASI}`)))
        .orderBy(desc(basisAturan.versi))
        .limit(1);
      basisId = b?.id ?? null;
    }
    const butir = basisId
      ? (
          await db
            .select()
            .from(butirCek)
            .where(and(eq(butirCek.basisAturanId, basisId), eq(butirCek.jenis, "semantik"), inArray(butirCek.status, ["Aktif", "Perlu ditinjau"])))
            .orderBy(butirCek.urutan)
        ).map(keButir)
      : [];

    // langkah 3: teks tanpa identitas pengusul
    const identitas = { nama: pengusul?.nama, institusi: pengusul?.institusi, nomorInduk: pengusul?.nomorInduk };
    const tanpa = (t: string) => siapkanTeksTanpaIdentitas(t, identitas);
    const teksPerBagian = Object.fromEntries(Object.entries(versi.teksPerBagian).map(([k, v]) => [k, tanpa(v)]));
    const teksLampiran = Object.fromEntries(Object.entries(versi.teksLampiran).map(([k, v]) => [k, tanpa(v)]));

    // langkah 4-7
    const gambarPerBagian = tiruan ? {} : await muatGambarNaskah(pemilikVersi(versiId));
    const hasil = await nilaiSemantikDenganOpsi({ teksPerBagian, teksLampiran, gambarPerBagian }, butir, { ...opsi, tiruan });

    // langkah 8: simpan satu baris hasil per butir (upsert agar id hasil, dan koreksi yang menempel, tetap)
    if (hasil.length) {
      await db
        .insert(hasilPemeriksaan)
        .values(
          hasil.map(({ hasil: h }) => ({
            versiId,
            butirId: h.butirId,
            butirKode: h.kode,
            jenis: "semantik" as const,
            bagian: h.bagian,
            status: h.status,
            angkaPembukti: null,
            batasDilanggar: null,
            rekomendasi: h.rekomendasi,
            kutipan: h.kutipan,
            kutipanLain: h.kutipanLain ?? [],
            tingkatKeyakinan: h.tingkatKeyakinan,
            alasanSistem: h.alasanSistem,
            tiruan: h.tiruan,
          })),
        )
        .onConflictDoUpdate({
          target: [hasilPemeriksaan.versiId, hasilPemeriksaan.butirId],
          set: {
            bagian: sql`excluded.bagian`,
            status: sql`excluded.status`,
            rekomendasi: sql`excluded.rekomendasi`,
            kutipan: sql`excluded.kutipan`,
            kutipanLain: sql`excluded.kutipan_lain`,
            tingkatKeyakinan: sql`excluded.tingkat_keyakinan`,
            alasanSistem: sql`excluded.alasan_sistem`,
            tiruan: sql`excluded.tiruan`,
            dibuatPada: new Date(),
          },
        });
    }
    await db.update(jobSemantik).set({ status: "Selesai", selesaiPada: new Date() }).where(eq(jobSemantik.id, jobId));
    const ringkasan = await ringkas(versiId, tiruan);
    await catatLogAudit({
      aktor: "sistem",
      aksi: "semantik.selesai",
      objek: `versi:${versiId}`,
      rincian: { jobId, ...ringkasan, mode: tiruan ? "tiruan" : "nyata" },
    });
    return ringkasan;
  } catch (e) {
    await db
      .update(jobSemantik)
      .set({ status: "Gagal", selesaiPada: new Date(), galat: e instanceof Error ? e.message.slice(0, 500) : String(e) })
      .where(eq(jobSemantik.id, jobId));
    throw e;
  }
}
