/**
 * Penyiapan data dan sesi untuk halaman /demo: jalan pintas UC-01..UC-09, varian UC-01 S-1 dan UC-09 S-1/S-2, dan enam
 * use scenario Bab 10.1 (UC-05 a/b/c, UC-07 a/b/c).
 * Setiap fungsi idempotent dan tidak mereset seluruh basis data; reset penuh hanya lewat tombol "Reset & isi data demo".
 */
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { simpanBerkas } from "@/lib/berkas";
import { buatDocx, susunContoh, type VarianContoh } from "@/lib/contoh/proposal";
import { jalankanPemeriksaanDeterministik } from "@/lib/kontrak";
import { KOMPONEN_BORANG } from "@/lib/kontrak/tipe";
import { jalankan as jalankanSemantik } from "@/lib/pemeriksa/semantik/jalankan";
import { kirimPermintaanTiruan } from "@/lib/pemeriksa/semantik/llm";
import { ambilAturanBerlaku, ambilPeriodeBerjalan, ambilTemplatBerlaku } from "@/lib/pengajuan/layanan";
import { ubahPengaturanDemo } from "@/lib/waktu";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type KodeJalanPintas =
  | "UC-01" | "UC-02" | "UC-03" | "UC-04" | "UC-05" | "UC-06" | "UC-07" | "UC-08" | "UC-09"
  | "UC-01-S1" | "UC-09-S1" | "UC-09-S2"
  | "UC-05a" | "UC-05b" | "UC-05c" | "UC-07a" | "UC-07b" | "UC-07c";

export interface HasilSiapkan {
  /** idBima akun yang dimasukkan */
  akun: string;
  /** jendela awal */
  tujuan: string;
  catatan: string;
}

/* ------------------------------ pembangun proposal klon ------------------------------ */

async function idBimaBerikut(): Promise<string> {
  const db = getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.bimaProposal);
  let nomor = n + 1;
  for (;;) {
    const id = `PRP-2026-${String(nomor).padStart(4, "0")}`;
    const [ada] = await db.select({ id: s.bimaProposal.id }).from(s.bimaProposal).where(eq(s.bimaProposal.id, id));
    if (!ada) return id;
    nomor++;
  }
}

/**
 * Membuat proposal beserta versi pertamanya langsung di SEMAR (tanpa melewati BIMA), lalu menjalankan pemeriksaan
 * deterministik sungguhan. Lolos semua -> Terkirim (+ antrean semantik Menunggu); ada Gagal -> Ditahan.
 */
export async function buatProposalDemo(opsi: { varian: VarianContoh; pengusulIdBima: string; sufiks: string }) {
  const db = getDb();
  const periode = await ambilPeriodeBerjalan();
  const [skema] = await db.select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PD"));
  const [pengusul] = await db.select().from(s.akun).where(eq(s.akun.idBima, opsi.pengusulIdBima));
  const { templat } = await ambilTemplatBerlaku(periode.id, skema.id);
  const basis = await ambilAturanBerlaku(periode.id, skema.id);

  const def = susunContoh(opsi.varian);
  const judul = `${def.judul} (${opsi.sufiks})`;
  const id = await idBimaBerikut();
  await db.insert(s.bimaProposal).values({ id, judul, skemaKode: "PD", pengusulIdBima: opsi.pengusulIdBima, statusBima: "Diajukan ke SEMAR", kataKunci: def.kataKunci });

  const berkas = await simpanBerkas({ ruang: "semar", nama: `${id}-V1.docx`, tipe: DOCX, bytes: await buatDocx(def), peran: "naskah" });
  const [p] = await db
    .insert(s.proposal)
    .values({ idProposal: id, judul, skemaId: skema.id, periodeId: periode.id, pengusulId: pengusul.id, status: "Sedang diperiksa" })
    .returning();
  const [v] = await db
    .insert(s.versiProposal)
    .values({
      proposalId: p.id,
      nomor: 1,
      kode: "V1",
      templatId: templat.id,
      basisAturanId: basis.id,
      berkasId: berkas.id,
      teksPerBagian: def.bagian,
      kataKunci: def.kataKunci,
      lampiranAda: def.lampiran.map((l) => l.nama),
      teksLampiran: Object.fromEntries(def.lampiran.map((l) => [l.nama, l.teks])),
      judulBagianDitemukan: Object.keys(def.bagian),
      judulDokumen: judul,
      statusPemeriksaan: "Sedang diperiksa",
    })
    .returning();
  const hasil = await jalankanPemeriksaanDeterministik(v.id);
  await db.update(s.versiProposal).set({ statusPemeriksaan: "Selesai" }).where(eq(s.versiProposal.id, v.id));
  if (hasil.semuaLolos) {
    await db.update(s.proposal).set({ status: "Terkirim", waktuTerkirim: new Date() }).where(eq(s.proposal.id, p.id));
    await db.insert(s.jobSemantik).values({ versiId: v.id, status: "Menunggu" });
    await db.update(s.bimaProposal).set({ statusBima: "Terkirim" }).where(eq(s.bimaProposal.id, id));
  } else {
    await db.update(s.proposal).set({ status: "Ditahan" }).where(eq(s.proposal.id, p.id));
    await db.update(s.bimaProposal).set({ statusBima: "Ditahan" }).where(eq(s.bimaProposal.id, id));
  }
  return { idProposal: id, proposalId: p.id, versiId: v.id, periodeId: periode.id, terkirim: hasil.semuaLolos, pengusulId: pengusul.id };
}

async function idAkun(idBima: string): Promise<string> {
  const [a] = await getDb().select({ id: s.akun.id }).from(s.akun).where(eq(s.akun.idBima, idBima));
  if (!a) throw new Error(`akun ${idBima} belum ada; jalankan "Reset & isi data demo" lebih dulu`);
  return a.id;
}

/* ------------------------------ UC-03 ------------------------------ */

const PENGUSUL_SIKLUS = ["pengusul-1", "pengusul-2", "pengusul-3", "pengusul-1", "pengusul-2", "pengusul-3"] as const;

/** Memastikan ada paling sedikit `jumlah` proposal Terkirim yang belum punya penugasan (bahan UC-03). */
async function pastikanProposalBelumDitugaskan(jumlah: number) {
  const db = getDb();
  await db.delete(s.penugasanReviewer).where(eq(s.penugasanReviewer.status, "Diusulkan"));
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.proposal)
    .where(sql`${s.proposal.status} = 'Terkirim' AND NOT EXISTS (SELECT 1 FROM penugasan_reviewer pr WHERE pr.proposal_id = ${s.proposal.id})`);
  for (let i = n; i < jumlah; i++) {
    await buatProposalDemo({ varian: i % 2 === 0 ? "a" : "d", pengusulIdBima: PENGUSUL_SIKLUS[i % PENGUSUL_SIKLUS.length], sufiks: `kelompok ${i + 1}` });
  }
}

/* ------------------------------ UC-04 ------------------------------ */

/** Menyediakan data J-05: proposal Ditahan (butir deterministik Gagal) dan penilaian Final dengan koreksi reviewer. */
async function pastikanDataPemantauan() {
  const db = getDb();
  const [{ ditahan }] = await db.select({ ditahan: sql<number>`count(*)::int` }).from(s.proposal).where(eq(s.proposal.status, "Ditahan"));
  if (ditahan < 2) {
    await buatProposalDemo({ varian: "b", pengusulIdBima: "pengusul-2", sufiks: "ditahan 1" });
    await buatProposalDemo({ varian: "c", pengusulIdBima: "pengusul-3", sufiks: "ditahan 2" });
  }
  const [{ final }] = await db.select({ final: sql<number>`count(*)::int` }).from(s.penilaian).where(eq(s.penilaian.status, "Final"));
  if (final > 0) return;

  const klon = await buatProposalDemo({ varian: "d", pengusulIdBima: "pengusul-1", sufiks: "dinilai" });
  await jalankanSemantik(klon.versiId, { tiruan: true, penyedia: kirimPermintaanTiruan }); // data pemantauan selalu deterministik, apa pun mode LLM produksi
  await db.update(s.jobSemantik).set({ status: "Selesai", selesaiPada: new Date() }).where(eq(s.jobSemantik.versiId, klon.versiId));
  const [pn] = await db
    .insert(s.penugasanReviewer)
    .values({ proposalId: klon.proposalId, versiId: klon.versiId, reviewerId: await idAkun("reviewer-3"), periodeId: klon.periodeId, status: "Selesai", label: "Selesai" })
    .returning();
  const [pl] = await db
    .insert(s.penilaian)
    .values({ penugasanId: pn.id, status: "Final", komentar: "Penilaian contoh untuk pemantauan.", nilai: `${KOMPONEN_BORANG.length} dari ${KOMPONEN_BORANG.length} komponen Memenuhi`, dikirimKeBimaPada: new Date() })
    .returning();
  await db.insert(s.keputusanKomponen).values(KOMPONEN_BORANG.map((k) => ({ penilaianId: pl.id, komponen: k, keputusan: "Memenuhi" as const })));
  const semantik = await db
    .select()
    .from(s.hasilPemeriksaan)
    .where(and(eq(s.hasilPemeriksaan.versiId, klon.versiId), eq(s.hasilPemeriksaan.jenis, "semantik")));
  const jenis = ["Kutipan salah tempat", "Salah tafsir isi"];
  const dikoreksi = semantik.slice(0, 3);
  if (dikoreksi.length) {
    await db.insert(s.koreksiRekomendasi).values(
      dikoreksi.map((h, i) => ({
        penilaianId: pl.id,
        hasilId: h.id,
        keputusanReviewer: h.rekomendasi === "Memenuhi" ? ("Tidak memenuhi" as const) : ("Memenuhi" as const),
        alasan: i === 0 ? "Kutipan yang diajukan sistem bukan bagian yang menjawab butir ini." : "Isi bagian sudah menjawab butir bila dibaca bersama paragraf berikutnya.",
        jenisKekeliruan: jenis[i % jenis.length],
      })),
    );
  }
  await catatLogAudit({ aktor: "sistem", aksi: "demo.data_pemantauan", objek: klon.idProposal, rincian: { koreksi: dikoreksi.length } });
}

/* ------------------------------ UC-05 ------------------------------ */

/** Mengembalikan proposal BIMA bernomor n ke status Draf supaya dapat diajukan lagi. */
async function pulihkanDrafBima(nomor: 1 | 2 | 3): Promise<string> {
  const db = getDb();
  const id = `PRP-2026-${String(nomor).padStart(4, "0")}`;
  const [p] = await db.select().from(s.proposal).where(eq(s.proposal.idProposal, id));
  if (p) {
    await db.delete(s.penugasanReviewer).where(eq(s.penugasanReviewer.proposalId, p.id));
    await db.delete(s.proposal).where(eq(s.proposal.id, p.id));
  }
  await db.update(s.bimaProposal).set({ statusBima: "Draf", diperbaruiPada: new Date() }).where(eq(s.bimaProposal.id, id));
  return id;
}

/* ------------------------------ UC-07 ------------------------------ */

async function ambilPenugasanDemo() {
  const db = getDb();
  const [p] = await db.select().from(s.proposal).where(eq(s.proposal.idProposal, "PRP-2026-0004"));
  if (!p) throw new Error('proposal siap-reviewer (PRP-2026-0004) belum ada; jalankan "Reset & isi data demo"');
  const [pn] = await db.select().from(s.penugasanReviewer).where(eq(s.penugasanReviewer.proposalId, p.id));
  if (!pn) throw new Error("penugasan PRP-2026-0004 tidak ditemukan");
  return { p, pn };
}

export type SkenarioLlm = "normal" | "kutipan-salah" | "tidak-merespons";

/** Mengembalikan PRP-2026-0004 ke keadaan siap diperiksa reviewer-2 dan menghitung ulang hasil semantik pada skenario LLM tertentu. */
export async function siapkanPemeriksaanReviewer(skenario: SkenarioLlm) {
  const db = getDb();
  const { p, pn } = await ambilPenugasanDemo();
  if (!pn.versiId) throw new Error("penugasan tanpa versi");
  await db.delete(s.penilaian).where(eq(s.penilaian.penugasanId, pn.id));
  await db.delete(s.hasilPemeriksaan).where(and(eq(s.hasilPemeriksaan.versiId, pn.versiId), eq(s.hasilPemeriksaan.jenis, "semantik")));
  await db.delete(s.jobSemantik).where(eq(s.jobSemantik.versiId, pn.versiId));
  await db.insert(s.jobSemantik).values({ versiId: pn.versiId, status: "Menunggu" });
  await db
    .update(s.penugasanReviewer)
    .set({ status: "Ditetapkan", label: "Baru", reviewerId: await idAkun("reviewer-2") })
    .where(eq(s.penugasanReviewer.id, pn.id));

  // mode tiruan dipaksa lewat opsi (bukan process.env) supaya permintaan lain yang berjalan bersamaan tidak ikut terpengaruh
  await jalankanSemantik(pn.versiId, { tiruan: true, penyedia: kirimPermintaanTiruan, skenario: skenario === "normal" ? undefined : skenario });
  return { penugasanId: pn.id, idProposal: p.idProposal };
}

/**
 * UC-07c: penilaian Draf yang sebagian terisi (tiga keputusan komponen dan umpan balik), sehingga J-07 berlabel "Draf"
 * dan J-08 memuat ulang isian itu (langkah 5 use scenario).
 */
async function siapkanDrafSebagian(penugasanId: string) {
  const db = getDb();
  const [pl] = await db
    .insert(s.penilaian)
    .values({ penugasanId, status: "Draf", komentar: "Draf: ringkasan sudah jelas; bagian metode masih perlu saya periksa lagi.", nilai: `3 dari ${KOMPONEN_BORANG.length} komponen Memenuhi` })
    .returning();
  await db.insert(s.keputusanKomponen).values(KOMPONEN_BORANG.slice(0, 3).map((k) => ({ penilaianId: pl.id, komponen: k, keputusan: "Memenuhi" as const })));
  await db.update(s.penugasanReviewer).set({ label: "Draf" }).where(eq(s.penugasanReviewer.id, penugasanId));
}

/** UC-01 S-1: skema tanpa templat. Dibuat sesuai kebutuhan (idempoten) supaya tidak mengubah skema contoh lain. */
async function pastikanSkemaTanpaTemplat(): Promise<string> {
  const db = getDb();
  let [sk] = await db.select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PK"));
  if (!sk) {
    [sk] = await db
      .insert(s.skemaPendanaan)
      .values({ kode: "PK", namaSkema: "Penelitian Kolaborasi (contoh sementara)", deskripsi: "Skema tanpa templat untuk memperagakan UC-01 S-1 (contoh sementara).", contoh: true })
      .returning();
  }
  return sk.id;
}

/** Draf templat sisa demo sebelumnya dibuang supaya jalan pintas UC-01 selalu mulai dari langkah 3 (tombol Susun Versi Baru tampil). */
async function bersihkanDrafTemplat() {
  const db = getDb();
  const draf = await db.select({ id: s.templatProposal.id }).from(s.templatProposal).where(eq(s.templatProposal.status, "Draf"));
  for (const d of draf) {
    await db.delete(s.butirCek).where(eq(s.butirCek.templatId, d.id));
    await db.delete(s.bagianTemplat).where(eq(s.bagianTemplat.templatId, d.id));
    await db.delete(s.templatProposal).where(eq(s.templatProposal.id, d.id));
  }
}

/* ------------------------------ pintu masuk ------------------------------ */

export async function siapkanJalanPintas(kode: KodeJalanPintas, opsi: { langsungJ08?: boolean } = {}): Promise<HasilSiapkan> {
  switch (kode) {
    case "UC-01-S1": {
      const skemaId = await pastikanSkemaTanpaTemplat();
      await bersihkanDrafTemplat();
      await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
      return { akun: "dppm-pengelola", tujuan: `/tim-kerja/templat?skema=${skemaId}`, catatan: "Skema belum memiliki templat (UC-01 S-1): \"Susun Versi Baru\" membuat versi 1." };
    }
    case "UC-01":
      await bersihkanDrafTemplat();
      await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
      return { akun: "dppm-pengelola", tujuan: "/tim-kerja/templat", catatan: "Masa pengusulan ditutup supaya Terbitkan berakhir di jalur utama; nyalakan sakelar \"berjalan\" untuk melihat alternatif 9a." };
    case "UC-02":
      await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
      return { akun: "dppm-pengelola", tujuan: "/tim-kerja/aturan", catatan: "Masa pengusulan ditutup; nyalakan sakelar \"berjalan\" untuk alternatif 8a." };
    case "UC-03":
      await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
      await pastikanProposalBelumDitugaskan(6);
      return { akun: "dppm-pengelola", tujuan: "/tim-kerja/penugasan", catatan: "Enam proposal Terkirim siap ditugaskan; batas beban 1 memicu S-1, batas 3 menyusun usulan." };
    case "UC-04":
      await pastikanDataPemantauan();
      return { akun: "dppm-pengelola", tujuan: "/tim-kerja/pemantauan", catatan: "Tersedia proposal Ditahan dan penilaian Final dengan koreksi reviewer." };
    case "UC-05":
    case "UC-05a":
    case "UC-06":
    case "UC-05b":
    case "UC-05c": {
      const nomor = kode === "UC-05" || kode === "UC-05a" ? 1 : kode === "UC-06" || kode === "UC-05b" ? 2 : 3;
      const id = await pulihkanDrafBima(nomor);
      // UC-05c dimulai saat masa berjalan: pengajuan pertama Ditahan; masa ditutup lewat alat simulasi di BIMA, lalu "Ajukan ulang" -> Ditolak (3a)
      await ubahPengaturanDemo({ masaPengusulan: "berjalan" });
      return {
        akun: `pengusul-${nomor}`,
        tujuan: `/bima/pengajuan?proposal=${id}`,
        catatan:
          kode === "UC-05c"
            ? "Ajukan (Ditahan karena kata kunci dan sitasi), tutup masa pengusulan di BIMA, lalu Ajukan ulang (Ditolak, alternatif 3a)."
            : kode === "UC-05b"
              ? "Ajukan (Ditahan karena Metode melebihi batas kata), lalu Ajukan ulang dengan naskah perbaikan contoh (Terkirim, versi V2)."
              : nomor === 1
                ? "Proposal lolos semua butir (Terkirim)."
                : "Bagian Metode melebihi batas kata (Ditahan).",
      };
    }
    case "UC-07":
    case "UC-07a":
    case "UC-07b":
    case "UC-07c":
    case "UC-08":
    case "UC-09":
    case "UC-09-S1":
    case "UC-09-S2": {
      const skenario: SkenarioLlm = kode === "UC-09-S1" ? "kutipan-salah" : kode === "UC-09-S2" ? "tidak-merespons" : "normal";
      const { penugasanId } = await siapkanPemeriksaanReviewer(skenario);
      if (kode === "UC-07c") await siapkanDrafSebagian(penugasanId);
      const langsungJ08 = kode === "UC-07b" || kode === "UC-08" || kode === "UC-09" || kode === "UC-09-S1" || kode === "UC-09-S2" || opsi.langsungJ08 === true;
      return {
        akun: "reviewer-2",
        tujuan: langsungJ08 ? `/reviewer/pemeriksaan/${penugasanId}` : "/reviewer/penugasan",
        catatan:
          kode === "UC-07c"
            ? "Penilaian Draf sudah berisi tiga keputusan komponen dan umpan balik: J-07 berlabel Draf, J-08 memuat ulang isiannya."
            : kode === "UC-07b"
              ? "Pilih satu butir yang menurut Anda keliru, tekan Tidak Setuju, isi alasan, lalu Simpan Koreksi (UC-08)."
              : skenario === "kutipan-salah"
                ? "Butir pertama: kutipan LLM tidak ditemukan di teks (UC-09 S-1, Perlu diperiksa manual)."
                : skenario === "tidak-merespons"
                  ? "Butir pertama: LLM tidak merespons dua kali (UC-09 S-2, Belum ada rekomendasi)."
                  : "Hasil semantik normal (mode tiruan).",
      };
    }
  }
}
