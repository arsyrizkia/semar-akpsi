/**
 * Seed data contoh sementara (dipakai skrip `npm run seed` dan tombol reset di /demo).
 * Sumber data: data/contoh/*.json + pembangkit proposal di src/lib/contoh/proposal.ts.
 * Semua nama orang dan institusi rekaan.
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { simpanBerkas } from "./berkas";
import { buatDocx, buatLampiranPdf, hitungKataContoh, susunContoh, type DefinisiContoh, type VarianContoh } from "./contoh/proposal";
import { turunkanButirDariTemplat } from "./seed-butir";
import { bagianBawaan, kepalaBawaan, keKolomBagian } from "./templat/isian-substansi";
import { KOP_BAWAAN, lampiranBawaan } from "./templat/paket";
import akunJson from "../../data/contoh/akun.json";
import katalogJson from "../../data/contoh/katalog-butir.json";
import skemaJson from "../../data/contoh/skema.json";
import templatJson from "../../data/contoh/templat.json";

export interface OpsiSeed {
  /** Kosongkan semua tabel (kecuali log_audit yang append-only) sebelum mengisi. Bawaan: true. */
  reset?: boolean;
  /** Sertakan proposal yang sudah Terkirim + penugasan ke reviewer (bahan pengembangan B dan D). Bawaan: true. */
  skenarioReviewer?: boolean;
}

const TABEL_RESET = [
  "pengaturan_demo", "koreksi_rekomendasi", "keputusan_komponen", "penilaian", "penugasan_reviewer", "job_semantik",
  "hasil_pemeriksaan", "versi_proposal", "proposal", "berkas_versi", "dokumen_contoh", "butir_cek", "basis_aturan",
  "bagian_templat", "templat_proposal", "periode_seleksi", "skema_pendanaan", "akun", "bima_kotak_masuk", "bima_berkas",
  "bima_proposal", "bima_reviewer", "bima_akun",
];

const hari = (n: number) => new Date(Date.now() + n * 86_400_000);
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function idProposalBima(n: number) {
  return `PRP-2026-${String(n).padStart(4, "0")}`;
}

export async function jalankanSeed(opsi: OpsiSeed = {}) {
  const { reset = true, skenarioReviewer = true } = opsi;
  const db = getDb();

  if (reset) {
    await db.execute(sql.raw(`TRUNCATE TABLE ${TABEL_RESET.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`));
  }

  await db.insert(s.pengaturanDemo).values({ id: 1, masaPengusulan: "berjalan", geserHari: 0 }).onConflictDoNothing();

  /* akun BIMA + akun SEMAR + reviewer BIMA */
  await db.insert(s.bimaAkun).values(
    akunJson.akun.map((a) => ({
      idBima: a.idBima,
      nama: a.nama,
      peran: a.peran as "tim_kerja" | "pengusul" | "reviewer",
      hakAkses: (a as { hakAkses?: string }).hakAkses as "pengelola" | "anggota" | undefined,
      institusi: a.institusi,
      nomorInduk: a.nomorInduk,
      bersedia: a.bersedia,
      bidang: (a as { bidang?: string }).bidang ?? null,
    })),
  );
  const akunSemar = await db
    .insert(s.akun)
    .values(
      akunJson.akun.map((a) => ({
        idBima: a.idBima,
        nama: a.nama,
        peran: a.peran as "tim_kerja" | "pengusul" | "reviewer",
        hakAkses: (a as { hakAkses?: string }).hakAkses as "pengelola" | "anggota" | undefined,
        institusi: a.institusi,
        nomorInduk: a.nomorInduk,
        bersedia: a.bersedia,
        bidang: (a as { bidang?: string }).bidang ?? null,
      })),
    )
    .returning();
  const akunId = (idBima: string) => akunSemar.find((a) => a.idBima === idBima)!.id;
  await db.insert(s.bimaReviewer).values(
    akunJson.akun
      .filter((a) => a.peran === "reviewer")
      .map((a) => ({
        idBima: a.idBima,
        kode: a.nomorInduk,
        nama: a.nama,
        institusi: a.institusi,
        bidang: (a as { bidang?: string }).bidang ?? null,
        bersedia: a.bersedia,
      })),
  );

  /* skema, periode */
  const skemaBaris = await db
    .insert(s.skemaPendanaan)
    .values(skemaJson.skema.map((x) => ({ kode: x.kode, namaSkema: x.namaSkema, deskripsi: x.deskripsi })))
    .returning();
  const [periode] = await db
    .insert(s.periodeSeleksi)
    .values({
      tahun: skemaJson.periode.tahun,
      nama: skemaJson.periode.nama,
      tanggalBuka: hari(skemaJson.periode.bukaHariRelatif),
      tanggalTutup: hari(skemaJson.periode.tutupHariRelatif),
      batasBebanReviewer: skemaJson.periode.batasBebanReviewer,
    })
    .returning();

  /* templat terbit + basis aturan + butir */
  const pengelolaId = akunId("dppm-pengelola");
  const templatBaris: Record<string, string> = {};
  const basisBaris: Record<string, string> = {};
  for (const sk of skemaBaris) {
    const skemaIsian = sk.kode === "PT" ? "terapan" : "dasar";
    const bagian = bagianBawaan(skemaIsian);
    const kepala = kepalaBawaan(skemaIsian);
    const lampiranTemplat = templatJson.lampiranWajib.map(lampiranBawaan);
    const [t] = await db
      .insert(s.templatProposal)
      .values({
        skemaId: sk.id,
        versi: 1,
        status: "Terbit",
        periodeBerlakuId: periode.id,
        lampiranWajib: templatJson.lampiranWajib,
        diterbitkanPada: hari(-30),
        dibuatOleh: pengelolaId,
        judulDokumen: kepala.judulDokumen,
        subjudul: kepala.subjudul,
        pengantar: kepala.pengantar,
        kop: KOP_BAWAAN,
        lampiranTemplat,
      })
      .returning();
    templatBaris[sk.kode] = t.id;
    await db.insert(s.bagianTemplat).values(bagian.map((b, i) => ({ templatId: t.id, urutan: i + 1, ...keKolomBagian(b) })));

    const [basis] = await db
      .insert(s.basisAturan)
      .values({
        kode: `BA-${sk.kode}`,
        nama: `Basis Aturan ${sk.namaSkema} (contoh sementara)`,
        skemaId: sk.id,
        periodeId: periode.id,
        versi: 1,
        tanggalBerlaku: hari(skemaJson.periode.bukaHariRelatif - 1),
        dibuatOleh: pengelolaId,
      })
      .returning();
    basisBaris[sk.kode] = basis.id;

    const turunan = turunkanButirDariTemplat(bagian, templatJson.lampiranWajib, lampiranTemplat);
    const butir = [
      ...turunan.map((b) => ({ ...b, templatId: t.id })),
      ...katalogJson.butir.map((b) => ({
        kode: b.kode,
        deskripsi: b.deskripsi,
        jenis: b.jenis as "deterministik" | "semantik",
        asal: "manual" as const,
        komponen: b.komponen,
        pemeriksa: b.pemeriksa,
        parameter: b.parameter as Record<string, unknown>,
        aturanHitung: (b as { aturanHitung?: string }).aturanHitung ?? null,
        pertanyaan: (b as { pertanyaan?: string }).pertanyaan ?? null,
        contohJawaban: (b as { contohJawaban?: string }).contohJawaban ?? null,
        templatId: null as string | null,
      })),
    ];
    await db.insert(s.butirCek).values(
      butir.map((b, i) => ({
        basisAturanId: basis.id,
        templatId: b.templatId,
        kode: b.kode,
        deskripsi: b.deskripsi,
        jenis: b.jenis,
        asal: b.asal,
        komponen: b.komponen,
        pemeriksa: b.pemeriksa,
        parameter: b.parameter as Record<string, unknown>,
        aturanHitung: b.aturanHitung,
        pertanyaan: b.pertanyaan,
        contohJawaban: b.contohJawaban,
        status: "Aktif" as const,
        urutan: i + 1,
      })),
    );
  }

  /* dokumen contoh (Uji pada Contoh) + proposal di BIMA */
  const skemaPD = skemaBaris.find((x) => x.kode === "PD")!;
  const varian: { v: VarianContoh; label: string; ket: string; pengusul?: string }[] = [
    { v: "a", label: "Contoh A - lolos semua", ket: "Semua butir deterministik lolos.", pengusul: "pengusul-1" },
    { v: "b", label: "Contoh B - gagal jumlah kata", ket: "Bagian Metode melebihi batas 1.000 kata.", pengusul: "pengusul-2" },
    { v: "c", label: "Contoh C - gagal kata kunci dan sitasi", ket: "Kata kunci 4 (bukan 5); 9 referensi tetapi 7 dikutip.", pengusul: "pengusul-3" },
  ];
  const definisi: Record<string, DefinisiContoh> = {};
  for (const x of varian) {
    const def = susunContoh(x.v);
    definisi[x.v] = def;
    await db.insert(s.dokumenContoh).values({
      kode: `contoh-${x.v}`,
      nama: x.label,
      skemaId: skemaPD.id,
      varian: x.v,
      judul: def.judul,
      judulBima: def.judul,
      teksPerBagian: def.bagian,
      kataKunci: def.kataKunci,
      lampiranAda: def.lampiran.map((l) => l.nama),
      teksLampiran: Object.fromEntries(def.lampiran.map((l) => [l.nama, l.teks])),
      judulBagianDitemukan: Object.keys(def.bagian),
      catatan: x.ket,
    });
  }

  async function kirimKeBima(def: DefinisiContoh, n: number, pengusulIdBima: string, statusBima: string) {
    const id = idProposalBima(n);
    await db.insert(s.bimaProposal).values({ id, judul: def.judul, skemaKode: "PD", pengusulIdBima, statusBima, kataKunci: def.kataKunci });
    const naskah = await simpanBerkas({ ruang: "bima", nama: `${id}-proposal.docx`, tipe: DOCX, bytes: await buatDocx(def), peran: "naskah", proposalId: id });
    await db.update(s.bimaProposal).set({ naskahBerkasId: naskah.id }).where(sql`${s.bimaProposal.id} = ${id}`);
    for (const l of def.lampiran) {
      await simpanBerkas({ ruang: "bima", nama: l.berkas, tipe: "application/pdf", bytes: await buatLampiranPdf(l.nama, l.teks), peran: "lampiran", proposalId: id, namaLampiran: l.nama });
    }
    return id;
  }

  let nomor = 1;
  for (const x of varian) await kirimKeBima(definisi[x.v], nomor++, x.pengusul!, "Draf");

  /* skenario siap-reviewer: proposal "d" sudah Terkirim dan ditugaskan */
  let skenario: Record<string, string> | null = null;
  if (skenarioReviewer) {
    const def = susunContoh("d");
    const idBima = await kirimKeBima(def, nomor++, "pengusul-1", "Terkirim");
    const [p] = await db
      .insert(s.proposal)
      .values({ idProposal: idBima, judul: def.judul, skemaId: skemaPD.id, periodeId: periode.id, pengusulId: akunId("pengusul-1"), status: "Terkirim", waktuTerkirim: hari(-5) })
      .returning();
    const berkasSemar = await simpanBerkas({ ruang: "semar", nama: `${idBima}-V1.docx`, tipe: DOCX, bytes: await buatDocx(def), peran: "naskah" });
    const [v] = await db
      .insert(s.versiProposal)
      .values({
        proposalId: p.id,
        nomor: 1,
        kode: "V1",
        templatId: templatBaris.PD,
        basisAturanId: basisBaris.PD,
        berkasId: berkasSemar.id,
        teksPerBagian: def.bagian,
        kataKunci: def.kataKunci,
        lampiranAda: def.lampiran.map((l) => l.nama),
        teksLampiran: Object.fromEntries(def.lampiran.map((l) => [l.nama, l.teks])),
        judulBagianDitemukan: Object.keys(def.bagian),
        judulDokumen: def.judul,
        statusPemeriksaan: "Selesai",
        waktu: hari(-5),
      })
      .returning();

    const butirDet = await db.select().from(s.butirCek).where(sql`${s.butirCek.basisAturanId} = ${basisBaris.PD} AND ${s.butirCek.jenis} = 'deterministik'`);
    const bukti = (b: (typeof butirDet)[number]): { bagian: string | null; angka: string } => {
      const par = (b.parameter ?? {}) as Record<string, unknown>;
      const bagian = (par.bagian as string | undefined) ?? null;
      switch (par.tipe) {
        case "batas_kata":
          return { bagian, angka: `${hitungKataContoh(def.bagian[bagian!])} kata dari batas ${par.batas}` };
        case "bagian_wajib":
          return { bagian, angka: "judul bagian ditemukan" };
        case "lampiran_wajib":
          return { bagian: null, angka: "berkas lampiran ditemukan" };
        case "kata_kunci":
          return { bagian: "Kata Kunci", angka: `${def.kataKunci.split(";").length} kata kunci` };
        case "bagian_terisi":
          return { bagian, angka: `${hitungKataContoh(def.bagian[bagian!])} kata` };
        case "diagram_alir":
          return { bagian, angka: "keterangan gambar diagram alir ditemukan" };
        case "jumlah_referensi_sama":
          return { bagian: "Daftar Pustaka", angka: `${def.jumlahPustaka} referensi, ${def.jumlahDikutip} dikutip` };
        default:
          return { bagian, angka: "sesuai" };
      }
    };
    await db.insert(s.hasilPemeriksaan).values(
      butirDet.map((b) => {
        const x = bukti(b);
        return { versiId: v.id, butirId: b.id, butirKode: b.kode, jenis: "deterministik" as const, bagian: x.bagian, status: "Lolos" as const, angkaPembukti: x.angka };
      }),
    );
    await db.insert(s.jobSemantik).values({ versiId: v.id, status: "Menunggu" });
    const [pn] = await db
      .insert(s.penugasanReviewer)
      .values({ proposalId: p.id, versiId: v.id, reviewerId: akunId("reviewer-2"), periodeId: periode.id, status: "Ditetapkan", label: "Baru" })
      .returning();
    skenario = { idProposal: idBima, proposalId: p.id, versiId: v.id, penugasanId: pn.id, reviewer: "reviewer-2" };
  }

  /* proposal fiktif yang Gagal kata kunci karena dipisah koma (demo UC-06): dokumen contoh + proposal Draf di BIMA */
  {
    const defF = susunContoh("f");
    await db.insert(s.dokumenContoh).values({
      kode: "contoh-f",
      nama: "Contoh F - gagal kata kunci (dipisah koma)",
      skemaId: skemaPD.id,
      varian: "f",
      judul: defF.judul,
      judulBima: defF.judul,
      teksPerBagian: defF.bagian,
      kataKunci: defF.kataKunci,
      lampiranAda: defF.lampiran.map((l) => l.nama),
      teksLampiran: Object.fromEntries(defF.lampiran.map((l) => [l.nama, l.teks])),
      judulBagianDitemukan: Object.keys(defF.bagian),
      catatan: "Kata kunci dipisah koma (,), bukan titik koma (;), seperti contoh BIMA no. 5.",
    });
    await kirimKeBima(defF, 5, "pengusul-3", "Draf"); // PRP-2026-0005 tetap, tidak menggeser nomor skenario reviewer (0004)
    nomor = Math.max(nomor, 6);
  }

  return {
    skema: skemaBaris.length,
    periodeId: periode.id,
    akun: akunSemar.length,
    proposalBima: nomor - 1,
    skenarioReviewer: skenario,
  };
}
