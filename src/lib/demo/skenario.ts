/**
 * Penyiapan data dan sesi untuk halaman /demo: jalan pintas UC-01..UC-09, varian UC-01 S-1 dan UC-09 S-1/S-2, dan enam
 * use scenario Bab 10.1 (UC-05 a/b/c, UC-07 a/b/c).
 * Fungsi ini dirancang dapat diulang tanpa Reset (pulihkanDrafBima memulihkan naskah BIMA, jalan pintas UC-04 mengembalikan butir
 * terkoreksi ke Aktif, UC-07 memulihkan penugasan PRP-2026-0004); tidak mereset seluruh basis data; reset penuh hanya lewat tombol "Reset & isi data demo".
 */
import { and, eq, like, sql } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { simpanBerkas } from "@/lib/berkas";
import { buatDocx, buatLampiranPdf, susunContoh, type VarianContoh } from "@/lib/contoh/proposal";
import { simpanUsulanBima } from "@/lib/bima/servis-pengajuan";
import { jalankanPemeriksaanDeterministik } from "@/lib/kontrak";
import { KOMPONEN_BORANG } from "@/lib/kontrak/tipe";
import { hitungTenggat } from "@/lib/penilaian/masa";
import { jalankan as jalankanSemantik } from "@/lib/pemeriksa/semantik/jalankan";
import { kirimPermintaanTiruan } from "@/lib/pemeriksa/semantik/llm";
import { ambilAturanBerlaku, ambilPeriodeBerjalan, ambilTemplatBerlaku } from "@/lib/pengajuan/layanan";
import { susunPenugasan, tetapkanPenugasan } from "@/lib/penugasan/layanan";
import { hapusDrafInti, susunVersiBaru } from "@/lib/templat/layanan";
import { setPeriodeAktif, ubahPengaturanDemo } from "@/lib/waktu";
import { jalankanUjiLangsung } from "@/lib/aturan/uji-jalan";
import { kosongkanPenugasanContoh1200, siapkanContoh1200 } from "./skala";
import { pasangSkenarioPemantauan } from "./pemantauan";
import { SKENARIO_PEMANTAUAN, type IdSkenarioPemantauan } from "./pemantauan-skenario";
import { PROFIL } from "./profil-skala";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type KodeJalanPintas =
  | "UC-01" | "UC-02" | "UC-03" | "UC-04" | "UC-05" | "UC-06" | "UC-07" | "UC-08" | "UC-09"
  | "UC-01-S1" | "UC-09-S1" | "UC-09-S2"
  | "UC-05a" | "UC-05b" | "UC-05c" | "UC-06-koma" | "UC-07a" | "UC-07b" | "UC-07c" | "UC-07c-awal";

export interface HasilSiapkan {
  /** idBima akun yang dimasukkan */
  akun: string;
  /** jendela awal */
  tujuan: string;
  catatan: string;
}

/* ------------------------------ pembangun proposal klon ------------------------------ */

async function idBimaBerikut(tahun: number): Promise<string> {
  const db = getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.bimaProposal).where(like(s.bimaProposal.id, `PRP-${tahun}-%`));
  let nomor = n + 1;
  for (;;) {
    const id = `PRP-${tahun}-${String(nomor).padStart(4, "0")}`;
    const [ada] = await db.select({ id: s.bimaProposal.id }).from(s.bimaProposal).where(eq(s.bimaProposal.id, id));
    if (!ada) return id;
    nomor++;
  }
}

/**
 * Membuat proposal beserta versi pertamanya langsung di SEMAR (tanpa melewati BIMA), lalu menjalankan pemeriksaan
 * deterministik sungguhan. Lolos semua -> Terkirim (+ antrean semantik Menunggu); ada Gagal -> Ditahan.
 */
export async function buatProposalDemo(opsi: { varian: VarianContoh; pengusulIdBima: string; sufiks: string; idTetap?: string }) {
  const db = getDb();
  const periode = await ambilPeriodeBerjalan();
  const [skema] = await db.select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PD"));
  const [pengusul] = await db.select().from(s.akun).where(eq(s.akun.idBima, opsi.pengusulIdBima));
  const { templat } = await ambilTemplatBerlaku(periode.id, skema.id);
  const basis = await ambilAturanBerlaku(periode.id, skema.id);

  const def = susunContoh(opsi.varian);
  const judul = `${def.judul} (${opsi.sufiks})`;
  const id = opsi.idTetap ?? (await idBimaBerikut(periode.tahun));
  if (!opsi.idTetap) {
    await db.insert(s.bimaProposal).values({ id, judul, skemaKode: "PD", pengusulIdBima: opsi.pengusulIdBima, statusBima: "Diajukan ke SEMAR", kataKunci: def.kataKunci });
  }

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

/* ------------------------------ UC-04 ------------------------------ */

/** J-05: data pemantauan skenario `id` pada periode Seleksi Pendanaan 2026 (1.200 proposal), lalu J-05 dibuka pada periode itu. */
async function siapkanPemantauan1200(id: IdSkenarioPemantauan): Promise<HasilSkenario & { akun: string }> {
  const h = await pasangSkenarioPemantauan(id);
  return { akun: "dppm-pengelola", tujuan: `/tim-kerja/pemantauan?periode=${h.periodeId}&skema=${h.skemaPdId}`, catatan: SKENARIO_PEMANTAUAN[id].ringkas };
}

/* ------------------------------ UC-05 ------------------------------ */

/** Mengembalikan draf BIMA periode 2027 bernomor n (PRP-2027-000n) ke status Draf supaya dapat diajukan lagi. */
async function pulihkanDrafBima(nomor: 1 | 2 | 3 | 4): Promise<string> {
  const db = getDb();
  const id = `PRP-2027-${String(nomor).padStart(4, "0")}`;
  const [p] = await db.select().from(s.proposal).where(eq(s.proposal.idProposal, id));
  if (p) {
    await db.delete(s.penugasanReviewer).where(eq(s.penugasanReviewer.proposalId, p.id));
    await db.delete(s.proposal).where(eq(s.proposal.id, p.id));
  }
  // Naskah dan lampiran BIMA dipulihkan ke isi seed: "Ajukan ulang" dengan naskah perbaikan (UC-05b) menggantinya,
  // sehingga tanpa pemulihan ini kartu berikutnya langsung Terkirim, bukan Ditahan.
  await db.update(s.bimaProposal).set({ statusBima: "Draf" }).where(eq(s.bimaProposal.id, id)); // simpanUsulanBima menolak usulan Terkirim
  const varian: VarianContoh = nomor === 1 ? "a" : nomor === 2 ? "b" : nomor === 4 ? "f" : "c";
  const def = susunContoh(varian);
  const pengusulIdBima = nomor === 4 ? "pengusul-3" : `pengusul-${nomor}`;
  const lampiran: Record<string, { nama: string; tipe: string; bytes: Buffer }> = {};
  for (const l of def.lampiran) lampiran[l.nama] = { nama: l.berkas, tipe: "application/pdf", bytes: Buffer.from(await buatLampiranPdf(l.nama, l.teks)) };
  await simpanUsulanBima({
    idProposal: id,
    pengusulIdBima,
    judul: def.judul,
    skemaKode: "PD",
    naskah: { nama: `${id}-proposal.docx`, tipe: DOCX, bytes: Buffer.from(await buatDocx(def)) },
    lampiran,
  });
  await db.update(s.bimaProposal).set({ statusBima: "Draf", kataKunci: def.kataKunci, diperbaruiPada: new Date() }).where(eq(s.bimaProposal.id, id));
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
    .set({ status: "Ditetapkan", label: "Baru", reviewerId: await idAkun("reviewer-2"), tanggal: new Date() })
    .where(eq(s.penugasanReviewer.id, pn.id));
  // masa penilaian dimulai hari ini bila belum dimulai atau tenggatnya sudah lewat (seed bisa dijalankan berhari-hari sebelumnya);
  // masa yang masih berjalan (mis. garis waktu data J-05 periode 2026) dibiarkan
  const [periode] = await db.select().from(s.periodeSeleksi).where(eq(s.periodeSeleksi.id, pn.periodeId));
  if (periode && (!periode.batasPenilaian || periode.batasPenilaian.getTime() < Date.now())) {
    await db.update(s.periodeSeleksi).set({ mulaiPenilaian: new Date(), batasPenilaian: hitungTenggat(new Date(), periode.lamaPenilaianHari) }).where(eq(s.periodeSeleksi.id, periode.id));
  }

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
      .values({ kode: "PK", namaSkema: "Penelitian Kolaborasi", deskripsi: "Skema tanpa templat untuk memperagakan UC-01 S-1.", contoh: true })
      .returning();
  }
  return sk.id;
}

/** Draf templat sisa demo sebelumnya dibuang supaya jalan pintas UC-01 selalu mulai dari langkah 3 (tombol Susun Versi Baru tampil). */
async function bersihkanDrafTemplat() {
  const db = getDb();
  const draf = await db.select({ id: s.templatProposal.id }).from(s.templatProposal).where(eq(s.templatProposal.status, "Draf"));
  for (const d of draf) await hapusDrafInti(db, d.id);
}

/* ------------------------------ pintu masuk ------------------------------ */

export async function siapkanJalanPintas(kode: KodeJalanPintas, opsi: { langsungJ08?: boolean } = {}): Promise<HasilSiapkan> {
  // periode J-04 aktif (dipakai tautan lama ?susun=1) dikembalikan ke bawaan; data periode 2026 dan 2027 tidak disentuh di sini
  await setPeriodeAktif(null);
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
    case "UC-03": {
      const h = await siapkanContoh1200();
      return { akun: "dppm-pengelola", tujuan: `/tim-kerja/penugasan/${h.periodeId}`, catatan: CATATAN_1200 };
    }
    case "UC-04":
      return siapkanPemantauan1200("bermasalah");
    case "UC-05":
    case "UC-05a":
    case "UC-06":
    case "UC-05b":
    case "UC-05c":
    case "UC-06-koma": {
      const nomor = kode === "UC-05" || kode === "UC-05a" ? 1 : kode === "UC-06" || kode === "UC-05b" ? 2 : kode === "UC-06-koma" ? 4 : 3;
      const id = await pulihkanDrafBima(nomor);
      // masa berjalan; UC-05c menutupnya lewat alat simulasi di BIMA sebelum Kirim Usulan -> ditolak SEMAR (3a)
      await ubahPengaturanDemo({ masaPengusulan: "berjalan" });
      return {
        akun: nomor === 4 ? "pengusul-3" : `pengusul-${nomor}`,
        // langkah 2 Substansi Usulan: dokumen usulan diunggah ke M-16 Pemeriksaan SEMAR (catatan inkonsistensi #65)
        tujuan: `/bima/pengajuan/${id}?langkah=substansi`,
        catatan:
          kode === "UC-06-koma"
            ? "Unduh contoh \"Kata kunci dipisah koma\", lalu Unggah Dokumen Usulan: SEMAR menahan karena kata kunci dipisah koma (pola contoh BIMA no. 5)."
            : kode === "UC-05c"
              ? "Unggah contoh lolos dan Simpan ke BIMA, tutup masa pengusulan (alat simulasi), lalu Kirim Usulan di langkah 5: ditolak SEMAR (3a)."
              : kode === "UC-05b"
                ? "Unggah contoh \"Metode melebihi 1.000 kata\": belum lolos, Kirim terkunci. Unggah Ulang contoh lolos, Simpan ke BIMA, lalu Kirim."
                : "Unduh contoh \"Lolos semua pemeriksaan\", Unggah Dokumen Usulan, Simpan ke BIMA, lalu Kirim Usulan di langkah 5 (Terkirim).",
      };
    }
    case "UC-07":
    case "UC-07a":
    case "UC-07b":
    case "UC-07c":
    case "UC-07c-awal":
    case "UC-08":
    case "UC-09":
    case "UC-09-S1":
    case "UC-09-S2": {
      const skenario: SkenarioLlm = kode === "UC-09-S1" ? "kutipan-salah" : kode === "UC-09-S2" ? "tidak-merespons" : "normal";
      const { penugasanId } = await siapkanPemeriksaanReviewer(skenario);
      if (kode === "UC-07c") await siapkanDrafSebagian(penugasanId);
      const langsungJ08 = kode === "UC-08" || kode === "UC-09" || kode === "UC-09-S1" || kode === "UC-09-S2" || opsi.langsungJ08 === true;
      return {
        akun: "reviewer-2",
        tujuan: langsungJ08 ? `/reviewer/pemeriksaan/${penugasanId}` : "/reviewer/penugasan",
        catatan:
          kode === "UC-07c"
            ? "Langkah 3-4 us-07c (menetapkan sebagian komponen dan Simpan Sementara) disiapkan otomatis: J-07 berlabel Draf, J-08 memuat ulang isiannya. Untuk memperagakan Simpan Sementara sendiri, pakai kartu UC-07c-awal."
            : kode === "UC-07c-awal"
              ? "Mulai dari label Baru: buka dengan Periksa, tetapkan sebagian komponen, isi sebagian umpan balik, Simpan Sementara, lalu Periksa lagi dari J-07."
              : kode === "UC-07b"
                ? "Buka proposal baris PRP-2026-0004 dengan Periksa, pilih satu butir yang keliru, tekan Tidak Setuju, isi alasan, lalu Simpan Koreksi (UC-08)."
              : skenario === "kutipan-salah"
                ? "Butir pertama: kutipan LLM tidak ditemukan di teks (UC-09 S-1, Perlu diperiksa manual)."
                : skenario === "tidak-merespons"
                  ? "Butir pertama: LLM tidak merespons dua kali (UC-09 S-2, Belum ada rekomendasi)."
                  : "Hasil semantik normal (mode tiruan).",
      };
    }
  }
}

/* ======================================================================================================
 * Navigator demo: skenario KEADAAN per jendela (katalog di katalog.ts). Setiap skenario menyiapkan data, menyebut akun yang
 * dimasukkan (null = hapus sesi), dan jendela tujuan. Penyiap UC-xx di atas dipakai ulang.
 * ====================================================================================================== */

export interface HasilSkenario {
  /** idBima akun yang dimasukkan; null = sesi dihapus */
  akun: string | null;
  tujuan: string;
  catatan: string;
}

const dariJalanPintas = (h: HasilSiapkan): HasilSkenario => h;

/** Penugasan milik reviewer-2 (PRP-2026-0004) dijadikan penilaian Final yang sudah terkirim ke BIMA: label Selesai. */
async function finalkanPenilaian(penugasanId: string) {
  const db = getDb();
  const [pl] = await db
    .insert(s.penilaian)
    .values({
      penugasanId,
      status: "Final",
      komentar: "Seluruh komponen borang sudah memenuhi; naskah jelas dan terstruktur.",
      nilai: `${KOMPONEN_BORANG.length} dari ${KOMPONEN_BORANG.length} komponen Memenuhi`,
      dikirimKeBimaPada: new Date(),
    })
    .returning();
  await db.insert(s.keputusanKomponen).values(KOMPONEN_BORANG.map((k) => ({ penilaianId: pl.id, komponen: k, keputusan: "Memenuhi" as const })));
  await db.update(s.penugasanReviewer).set({ status: "Selesai", label: "Selesai" }).where(eq(s.penugasanReviewer.id, penugasanId));
}

/** Butir yang ditandai Perlu ditinjau kembali Aktif (keadaan J-03 "normal"). */
async function pulihkanButirDitinjau() {
  const periode = await ambilPeriodeBerjalan();
  const [skemaPd] = await getDb().select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PD"));
  const basis = await ambilAturanBerlaku(periode.id, skemaPd.id);
  await getDb()
    .update(s.butirCek)
    .set({ status: "Aktif", ditandaiOleh: null, ditandaiPada: null })
    .where(and(eq(s.butirCek.basisAturanId, basis.id), eq(s.butirCek.status, "Perlu ditinjau")));
  return { periode, skemaPd, basis };
}

async function tujuanAturan(): Promise<string> {
  const periode = await ambilPeriodeBerjalan();
  const [skemaPd] = await getDb().select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PD"));
  return `/tim-kerja/aturan?skema=${skemaPd.id}&periode=${periode.id}`;
}

/** J-06: proposal milik pengusul pada slot PRP-2027-000N (periode berjalan) dalam keadaan tertentu. */
async function siapkanJ06(keadaan: "terkirim" | "ditahan" | "ditolak" | "diperiksa"): Promise<HasilSkenario> {
  const db = getDb();
  const nomorSlot = keadaan === "ditahan" ? 2 : keadaan === "ditolak" ? 3 : 1;
  const id = await pulihkanDrafBima(nomorSlot as 1 | 2 | 3);
  const pengusul = `pengusul-${nomorSlot}`;
  const periode = await ambilPeriodeBerjalan();
  if (keadaan === "terkirim" || keadaan === "ditahan") {
    await ubahPengaturanDemo({ masaPengusulan: "berjalan" });
    await buatProposalDemo({ varian: keadaan === "terkirim" ? "a" : "b", pengusulIdBima: pengusul, sufiks: keadaan, idTetap: id });
    return {
      akun: pengusul,
      tujuan: `/pengusul/hasil/${id}`,
      catatan: keadaan === "terkirim" ? "Semua butir deterministik lolos (Terkirim)." : "Bagian Metode melebihi batas kata (Ditahan); butir gagal paling atas.",
    };
  }
  const [skemaPd] = await db.select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PD"));
  const [pengusulAkun] = await db.select().from(s.akun).where(eq(s.akun.idBima, pengusul));
  const def = susunContoh("a");
  if (keadaan === "ditolak") {
    await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
    await db.insert(s.proposal).values({ idProposal: id, judul: def.judul, skemaId: skemaPd.id, periodeId: periode.id, pengusulId: pengusulAkun.id, status: "Ditolak" });
    await catatLogAudit({ aktor: pengusul, aksi: "pengajuan.ditolak", objek: id, rincian: { alasan: "masa pengusulan ditutup" } });
    return { akun: pengusul, tujuan: `/pengusul/hasil/${id}`, catatan: "Masa pengusulan sudah ditutup: pengajuan Ditolak (3a), tanpa daftar butir." };
  }
  // sedang diperiksa: proposal tercatat, pemeriksaan belum selesai
  await ubahPengaturanDemo({ masaPengusulan: "berjalan" });
  await db.insert(s.proposal).values({ idProposal: id, judul: def.judul, skemaId: skemaPd.id, periodeId: periode.id, pengusulId: pengusulAkun.id, status: "Sedang diperiksa" });
  await db.update(s.bimaProposal).set({ statusBima: "Diajukan ke SEMAR" }).where(eq(s.bimaProposal.id, id));
  await catatLogAudit({ aktor: pengusul, aksi: "pengajuan.mulai", objek: id });
  return { akun: pengusul, tujuan: `/pengusul/hasil/${id}`, catatan: "Pemeriksaan ditampilkan sedang berjalan. Bila dibiarkan lebih dari dua menit halaman menampilkan galat batas waktu (NFR 2.1)." };
}

/**
 * Menyiapkan satu skenario keadaan bagi satu jendela (navigator demo, rute /demo/mulai?j=&s=). Idempoten dan tidak mereset basis data.
 */
const CATATAN_1200 =
  "1.200 proposal Terkirim (PD dan PT) dari 14 institusi, 30 reviewer bersedia termasuk reviewer-1..5, batas beban 45. Batas 35 memicu S-1 beserta saran batas terkecil yang cukup.";

export async function siapkanSkenario(kodeJendela: string, id: string): Promise<HasilSkenario> {
  const db = getDb();
  const kunci = `${kodeJendela}/${id}`;

  await setPeriodeAktif(null);
  // jendela reviewer tidak memuat penugasan 1.200 sisa skenario J-04b "ditetapkan" pada reviewer contoh; penugasan periode 2027 (alur
  // end-to-end) tidak disentuh
  if (kodeJendela === "J-07" || kodeJendela === "J-08" || kunci === "J-01/reviewer") {
    await kosongkanPenugasanContoh1200();
  }

  switch (kunci) {
    /* J-01 */
    case "J-01/belum-masuk":
      return { akun: null, tujuan: "/masuk", catatan: "Sesi dihapus: belum masuk." };
    case "J-01/pengelola":
      return { akun: "dppm-pengelola", tujuan: "/tim-kerja/templat", catatan: "Masuk sebagai Tim Kerja pengelola; J-01 mengarahkan ke J-02." };
    case "J-01/anggota":
      return { akun: "dppm-anggota", tujuan: "/tim-kerja/penugasan", catatan: "Masuk sebagai Tim Kerja anggota; J-01 mengarahkan ke J-04 (menu hanya J-04 dan J-05)." };
    case "J-01/reviewer":
      return { akun: "reviewer-2", tujuan: "/reviewer/penugasan", catatan: "Masuk sebagai Reviewer; J-01 mengarahkan ke J-07." };

    /* J-02 */
    case "J-02/normal":
      return dariJalanPintas(await siapkanJalanPintas("UC-01"));
    case "J-02/tanpa-templat":
      return dariJalanPintas(await siapkanJalanPintas("UC-01-S1"));
    case "J-02/masa-berjalan": {
      await bersihkanDrafTemplat();
      await ubahPengaturanDemo({ masaPengusulan: "berjalan" });
      return { akun: "dppm-pengelola", tujuan: "/tim-kerja/templat", catatan: "Masa pengusulan berjalan: Terbitkan menyimpan templat sebagai draf untuk periode berikutnya (9a)." };
    }
    case "J-02/draf-tersimpan": {
      await bersihkanDrafTemplat();
      await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
      const [skemaPd] = await db.select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PD"));
      const pengelola = await idAkun("dppm-pengelola");
      await susunVersiBaru(skemaPd.id, { id: pengelola, idBima: "dppm-pengelola" });
      return { akun: "dppm-pengelola", tujuan: `/tim-kerja/templat?skema=${skemaPd.id}`, catatan: "Draf versi berikutnya sudah tersimpan dan dibuka kembali." };
    }

    /* J-03 */
    case "J-03/normal": {
      await pulihkanButirDitinjau();
      await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
      return { akun: "dppm-pengelola", tujuan: await tujuanAturan(), catatan: "Masa pengusulan ditutup; nyalakan sakelar berjalan untuk alternatif 8a." };
    }
    case "J-03/perlu-ditinjau": {
      const { basis } = await pulihkanButirDitinjau();
      await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
      const [kandidat] = await db
        .select({ id: s.butirCek.id })
        .from(s.butirCek)
        .where(and(eq(s.butirCek.basisAturanId, basis.id), eq(s.butirCek.asal, "manual"), eq(s.butirCek.status, "Aktif")))
        .orderBy(s.butirCek.urutan)
        .limit(1);
      if (kandidat) {
        await db.update(s.butirCek).set({ status: "Perlu ditinjau", ditandaiOleh: await idAkun("dppm-pengelola"), ditandaiPada: new Date() }).where(eq(s.butirCek.id, kandidat.id));
      }
      return { akun: "dppm-pengelola", tujuan: await tujuanAturan(), catatan: "Satu butir manual ditandai Perlu ditinjau dari J-05 (UC-04) dan disorot pada tabel." };
    }
    case "J-03/uji-tanggal": {
      await pulihkanButirDitinjau();
      await ubahPengaturanDemo({ masaPengusulan: "berjalan" });
      return { akun: "dppm-pengelola", tujuan: await tujuanAturan(), catatan: "Masa pengusulan berjalan: Tanggal Berlaku di antara tanggal buka dan tutup ditolak (8a)." };
    }

    /* J-04 */
    case "J-04/siap":
    case "J-04/menunggu":
    case "J-04/kekurangan":
    case "J-04/ditetapkan": {
      const h = await siapkanContoh1200();
      const ke = `/tim-kerja/penugasan/${h.periodeId}`;
      const dibuat = h.dibuatBaru ? ` Data contoh baru dibuat dalam ${(h.waktuBuatMs / 1000).toFixed(1)} dtk.` : "";
      if (id === "siap") return { akun: "dppm-pengelola", tujuan: ke, catatan: `${CATATAN_1200}${dibuat}` };
      if (id === "kekurangan") {
        await tetapkanBatas(h.periodeId, 35);
        return { akun: "dppm-pengelola", tujuan: `${ke}?susun=1`, catatan: "Batas beban 35 untuk 1.200 proposal: Susun ditekan otomatis dan panel Kekurangan Reviewer (S-1) menyarankan batas terkecil yang cukup." };
      }
      await susunPenugasan(h.periodeId, PROFIL.contoh1200.batasBawaan);
      if (id === "menunggu") return { akun: "dppm-pengelola", tujuan: ke, catatan: "1.200 usulan (batas beban 45) menunggu penetapan; coba cari, saring per reviewer, dan Pindahkan banyak baris." };
      await tetapkanPenugasan(h.periodeId, "dppm-pengelola");
      return { akun: "dppm-pengelola", tujuan: `${ke}?tab=ditetapkan`, catatan: "1.200 penugasan ditetapkan dan tercatat di kotak masuk BIMA; reviewer-1..5 menerimanya berlabel Baru di J-07." };
    }
    /* J-05 */
    case "J-05/awal":
    case "J-05/sehat":
    case "J-05/bermasalah":
    case "J-05/terlalu-ketat":
    case "J-05/sesudah-perbaikan":
    case "J-05/terlambat":
      return siapkanPemantauan1200(id as IdSkenarioPemantauan);
    /* J-06 */
    case "J-06/terkirim":
    case "J-06/ditahan":
    case "J-06/ditolak":
    case "J-06/diperiksa":
      return siapkanJ06(id as "terkirim" | "ditahan" | "ditolak" | "diperiksa");

    /* J-07 */
    case "J-07/kosong":
      return { akun: "reviewer-6", tujuan: "/reviewer/penugasan", catatan: "Reviewer-6 (tidak bersedia pada periode ini) belum punya penugasan." };
    case "J-07/baru": {
      await siapkanPemeriksaanReviewer("normal");
      return { akun: "reviewer-2", tujuan: "/reviewer/penugasan", catatan: "PRP-2026-0004 berlabel Baru." };
    }
    case "J-07/draf": {
      const { penugasanId } = await siapkanPemeriksaanReviewer("normal");
      await siapkanDrafSebagian(penugasanId);
      return { akun: "reviewer-2", tujuan: "/reviewer/penugasan", catatan: "Penilaian sebagian tersimpan: label Draf." };
    }
    case "J-07/selesai": {
      const { penugasanId } = await siapkanPemeriksaanReviewer("normal");
      await finalkanPenilaian(penugasanId);
      return { akun: "reviewer-2", tujuan: "/reviewer/penugasan", catatan: "Penilaian final sudah tersimpan dan terkirim ke BIMA: semua penugasan Selesai." };
    }

    /* J-08 */
    case "J-08/normal":
      return dariJalanPintas(await siapkanJalanPintas("UC-08"));
    case "J-08/perlu-manual":
      return dariJalanPintas(await siapkanJalanPintas("UC-09-S1"));
    case "J-08/belum-rekomendasi":
      return dariJalanPintas(await siapkanJalanPintas("UC-09-S2"));
    case "J-08/draf":
      return dariJalanPintas(await siapkanJalanPintas("UC-07c", { langsungJ08: true }));
    case "J-08/final": {
      const { penugasanId } = await siapkanPemeriksaanReviewer("normal");
      await finalkanPenilaian(penugasanId);
      return { akun: "reviewer-2", tujuan: `/reviewer/pemeriksaan/${penugasanId}`, catatan: "Penilaian sudah Simpan Permanen: isian hanya-baca." };
    }

    /* layar turunan (b): menyiapkan keadaan induknya lalu membuka layar turunan itu */
    case "J-02a/draf": {
      const h = await siapkanSkenario("J-02", "draf-tersimpan");
      const [skemaPd] = await db.select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PD"));
      const [draf] = await db
        .select({ id: s.templatProposal.id })
        .from(s.templatProposal)
        .where(and(eq(s.templatProposal.skemaId, skemaPd.id), eq(s.templatProposal.status, "Draf")))
        .limit(1);
      return { ...h, tujuan: draf ? `/tim-kerja/templat/${draf.id}` : h.tujuan, catatan: "Draf versi berikutnya skema PD terbuka di rincian templat; Unduh Pratinjau (.docx) dan Terbitkan tersedia di sini." };
    }
    case "J-03b/hasil": {
      const h = await siapkanSkenario("J-03", "normal");
      const periode = await ambilPeriodeBerjalan();
      const [skemaPd] = await db.select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PD"));
      // uji dijalankan langsung di server (semantik tiruan) supaya hasilnya ada tanpa menunggu M-15
      const ujiId = await jalankanUjiLangsung({ skemaId: skemaPd.id, periodeId: periode.id, templatId: null, kodeContoh: ["contoh-a", "contoh-b", "contoh-c"], pelaku: "dppm-pengelola" });
      return {
        ...h,
        tujuan: `${(await tujuanAturan()).replace("/tim-kerja/aturan?", "/tim-kerja/aturan/uji?")}&uji=${ujiId}`,
        catatan: "Hasil Uji pada Contoh atas contoh A, B, dan C (penilaian semantik tiruan). Uji Ulang membuka M-15: pilih contoh atau unggah naskah, lalu kemajuan ditampilkan per langkah.",
      };
    }
    case "J-04b/siap":
    case "J-04b/menunggu":
    case "J-04b/kekurangan":
    case "J-04b/ditetapkan":
      return siapkanSkenario("J-04", id);
    case "J-05b/contoh":
      return { akun: "dppm-pengelola", tujuan: "/tim-kerja/proposal/PRP-2026-0004", catatan: "Rincian PRP-2026-0004 (periode 2026): hasil pemeriksaan, penugasan, dan penilaian; Unduh Berkas tersedia untuk naskah dan lampiran." };
    case "J-08b/draf": {
      await kosongkanPenugasanContoh1200();
      const { penugasanId } = await siapkanPemeriksaanReviewer("normal");
      await siapkanDrafSebagian(penugasanId);
      return { akun: "reviewer-2", tujuan: `/reviewer/pemeriksaan/${penugasanId}/keputusan`, catatan: "Tiga komponen dan umpan balik sudah terisi; Simpan Sementara atau Simpan Permanen (M-11) tersedia." };
    }

    /* BIMA tiruan */
    case "BIMA-1/lolos":
      return dariJalanPintas(await siapkanJalanPintas("UC-05a"));
    case "BIMA-1/ditahan":
      return dariJalanPintas(await siapkanJalanPintas("UC-05b"));
    case "BIMA-1/ditolak":
      return dariJalanPintas(await siapkanJalanPintas("UC-05c"));
    case "BIMA-1/koma":
      return dariJalanPintas(await siapkanJalanPintas("UC-06-koma"));
    case "BIMA-2/normal":
      return { akun: "dppm-pengelola", tujuan: "/bima/kotak-masuk", catatan: "Kotak masuk BIMA tiruan: penugasan dan keputusan yang diterima dari SEMAR." };
  }
  throw new Error(`skenario tidak dikenal: ${kunci}`);
}

async function tetapkanBatas(periodeId: string, batas: number) {
  await getDb().update(s.periodeSeleksi).set({ batasBebanReviewer: batas }).where(eq(s.periodeSeleksi.id, periodeId));
}

/** Dua proposal Ditahan (butir deterministik gagal) tanpa membuat penilaian Final. */
