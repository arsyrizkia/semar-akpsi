/**
 * Skenario J-05 berskala (UC-04) pada periode Simulasi Contoh 2026 (1.200 proposal). Keputusan per baris berasal dari
 * pemantauan-skenario.ts (murni, teruji); berkas ini menulisnya set-based (jsonb_array_elements), sama dengan pola demo/skala.ts.
 *
 * Urutan pasang (dapat diulang; setiap skenario mulai dari keadaan dasar yang sama):
 *  1. siapkanContoh1200(): data 1.200 proposal ada, penugasan dan kotak masuk penugasan periode itu dikosongkan.
 *  2. Basis aturan simulasi per periode (salinan basis terbaru PD dan PT, periode_id = periode simulasi, kode berakhiran "-SIM",
 *     versi = maks + 1 per skema karena indeks unik basis_skema_versi_uq per skema). Hasil dipetakan ulang ke butirnya menurut kode, jadi periode utama tidak
 *     tersentuh dan J-03/J-05/J-05b periode simulasi konsisten.
 *  3. Lapisan skenario sebelumnya dibersihkan: versi gagal (V1) dihapus dan V2 kembali menjadi V1, basis versi perbaikan dihapus,
 *     status butir kembali Aktif.
 *  4. Gagal saat pengajuan: versi yang dinilai digeser menjadi V2 dan V1 disisipkan dengan hasil deterministik Gagal (meniru UC-05:
 *     Ditahan, diperbaiki, lalu Terkirim; semua proposal tetap Terkirim sehingga UC-03 tidak terganggu).
 *  5. Hasil semantik versi yang dinilai: rekomendasi, status, tingkat keyakinan.
 *  6. Sesudah-perbaikan: basis versi berikutnya (butir diperbaiki berdeskripsi baru), naskah yang dinilai mulai minggu berlaku diperiksa
 *     ulang dengan basis itu; butir di versi lama berlabel Perlu ditinjau.
 *  7. Penugasan disusun dengan susunUsulan (algoritma UC-03), ditetapkan, dan dicatat di kotak masuk BIMA tiruan (ditulis langsung
 *     seperti seed; kode SEMAR tidak mengimpor servis BIMA); penilaian Final per minggu beserta keputusan komponen dan koreksi reviewer.
 */
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { AKHIRAN_SIMULASI, type Db } from "@/lib/aturan/draf";
import { catatLogAudit } from "@/lib/audit";
import { KOMPONEN_BORANG } from "@/lib/kontrak/tipe";
import { susunUsulan } from "@/lib/penugasan/aturan";
import { PROFIL, dalamKumpulanPeriode, reviewerMassal } from "./profil-skala";
import { namaInstitusiSkala, siapkanContoh1200 } from "./skala";
import {
  JUMLAH_MINGGU,
  SKENARIO_PEMANTAUAN,
  acakBerbiji,
  bangkitkanPemantauan,
  buktiGagal,
  type ButirSim,
  type IdSkenarioPemantauan,
  type KodeSkema,
  type ProposalSim,
} from "./pemantauan-skenario";

const P = PROFIL.contoh1200;
const HARI = 86_400_000;
const UKURAN_KELOMPOK = 4000;
/** batas beban penugasan data pemantauan (25 reviewer massal bersedia x 50 >= 1.200) */
const BATAS_BEBAN = 50;
const baris = <T>(r: unknown) => (r as { rows: T[] }).rows;
const kelompokkan = <T>(isi: T[]) => Array.from({ length: Math.ceil(isi.length / UKURAN_KELOMPOK) }, (_, i) => isi.slice(i * UKURAN_KELOMPOK, (i + 1) * UKURAN_KELOMPOK));

const UMPAN_BALIK = [
  "Naskah lengkap dan runtut. Perjelas keterkaitan diagram alir dengan tahapan yang diuraikan di Metode.",
  "Rumusan masalah dan tujuan sudah selaras. Lengkapi indikator capaian untuk setiap tahun.",
  "Uraian metode memadai. Tambahkan peran anggota tim pada setiap tahapan penelitian.",
];

interface BasisSim {
  id: string;
  versi: number;
  skemaId: string;
}

/**
 * Basis aturan simulasi per skema (dibuat sekali, dipakai ulang): salinan basis terbaru skema itu di luar periode simulasi, berkode
 * akhiran "-SIM" sehingga pencarian versi tertinggi tanpa periode (draf J-03, Simpan Versi, pemeriksa) melewatinya. Basis dan butirnya
 * dibuat dalam satu transaksi; basis simulasi tanpa butir (pembuatan pertama yang terputus) dibuat ulang.
 */
async function pastikanBasisSimulasi(periodeId: string, tanggalBerlaku: Date): Promise<Record<KodeSkema, BasisSim>> {
  const db = getDb();
  const hasil = {} as Record<KodeSkema, BasisSim>;
  for (const kode of ["PD", "PT"] as const) {
    const [skema] = await db.select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, kode));
    if (!skema) throw new Error(`skema ${kode} belum ada; jalankan "Reset & isi data demo" lebih dulu`);
    const [ada] = baris<{ id: string; versi: number; butir: number }>(
      await db.execute(sql`
        SELECT b.id, b.versi, (SELECT count(*) FROM butir_cek c WHERE c.basis_aturan_id = b.id)::int AS butir
        FROM basis_aturan b WHERE b.periode_id = ${periodeId} AND b.skema_id = ${skema.id} ORDER BY b.versi LIMIT 1`),
    );
    if (ada && ada.butir > 0) {
      await db.execute(sql`
        UPDATE basis_aturan SET tanggal_berlaku = ${tanggalBerlaku.toISOString()},
               kode = CASE WHEN kode LIKE ${`%${AKHIRAN_SIMULASI}`} THEN kode ELSE kode || ${AKHIRAN_SIMULASI} END
        WHERE id = ${ada.id}`);
      hasil[kode] = { id: ada.id, versi: ada.versi, skemaId: skema.id };
      continue;
    }
    if (ada) {
      await db.execute(sql`UPDATE versi_proposal SET basis_aturan_id = NULL WHERE basis_aturan_id = ${ada.id}`);
      await db.delete(s.basisAturan).where(eq(s.basisAturan.id, ada.id));
    }
    const [sumber] = baris<{ id: string; kode: string; nama: string }>(
      await db.execute(sql`
        SELECT id, kode, nama FROM basis_aturan
        WHERE skema_id = ${skema.id} AND tanggal_berlaku < '9999-01-01' AND (periode_id IS NULL OR periode_id <> ${periodeId})
          AND kode NOT LIKE ${`%${AKHIRAN_SIMULASI}`}
        ORDER BY versi DESC LIMIT 1`),
    );
    if (!sumber) throw new Error(`basis aturan ${kode} belum ada; jalankan "Reset & isi data demo" lebih dulu`);
    const baru = await db.transaction(async (tx) => {
      const [b] = baris<{ id: string; versi: number }>(
        await tx.execute(sql`
          INSERT INTO basis_aturan (kode, nama, skema_id, periode_id, versi, tanggal_berlaku)
          SELECT ${`${sumber.kode}${AKHIRAN_SIMULASI}`}::text, ${`${sumber.nama.replace(/\s*\(contoh sementara\)/i, "")} (Simulasi Contoh)`}::text, ${skema.id}::uuid, ${periodeId}::uuid,
                 (SELECT max(versi) + 1 FROM basis_aturan WHERE skema_id = ${skema.id}), ${tanggalBerlaku.toISOString()}::timestamptz
          RETURNING id, versi`),
      );
      await salinButir(tx, sumber.id, b.id);
      return b;
    });
    hasil[kode] = { ...baru, skemaId: skema.id };
  }
  return hasil;
}

/** Salin butir basis (status apa adanya, kecuali Perlu ditinjau kembali Aktif); `ubah` mengganti deskripsi dan pertanyaan satu kode. */
async function salinButir(db: Db, dari: string, ke: string, ubah?: { kode: string; deskripsi: string; pertanyaan: string }) {
  await db.execute(sql`
    INSERT INTO butir_cek (basis_aturan_id, templat_id, kode, deskripsi, jenis, asal, komponen, pemeriksa, parameter, aturan_hitung, pertanyaan, contoh_jawaban, status, urutan)
    SELECT ${ke}::uuid, templat_id, kode,
           CASE WHEN kode = ${ubah?.kode ?? ""}::text THEN ${ubah?.deskripsi ?? ""}::text ELSE deskripsi END,
           jenis, asal, komponen, pemeriksa, parameter, aturan_hitung,
           CASE WHEN kode = ${ubah?.kode ?? ""}::text THEN ${ubah?.pertanyaan ?? ""}::text ELSE pertanyaan END,
           contoh_jawaban, CASE WHEN status = 'Perlu ditinjau' THEN 'Aktif'::status_butir ELSE status END, urutan
    FROM butir_cek WHERE basis_aturan_id = ${dari}`);
}

/** Butir tujuan pemetaan ulang hasil: satu baris per kode, yang Aktif lebih dulu (kode ganda bila butir dinonaktifkan lalu ditambah lagi). */
const butirPerKode = (basisId: string) => sql`
  SELECT DISTINCT ON (kode) id, kode FROM butir_cek WHERE basis_aturan_id = ${basisId} ORDER BY kode, (status = 'Aktif') DESC, urutan`;

/** Hasil dan versi periode dipetakan ke basis simulasi pertama; lapisan skenario sebelumnya dibuang. */
async function bersihkanLapisan(periodeId: string, basis: Record<KodeSkema, BasisSim>) {
  const db = getDb();
  await db.delete(s.penugasanReviewer).where(eq(s.penugasanReviewer.periodeId, periodeId));
  for (const b of Object.values(basis)) {
    await db.execute(sql`
      UPDATE hasil_pemeriksaan h SET butir_id = c.id
      FROM versi_proposal v, proposal p, (${butirPerKode(b.id)}) c
      WHERE h.versi_id = v.id AND p.id = v.proposal_id AND p.periode_id = ${periodeId} AND p.skema_id = ${b.skemaId}
        AND c.kode = h.butir_kode AND h.butir_id <> c.id`);
    // hasil berkode yang tidak ada di basis skema itu (proposal PT yang disalin dari contoh PD)
    await db.execute(sql`
      DELETE FROM hasil_pemeriksaan h USING versi_proposal v, proposal p
      WHERE h.versi_id = v.id AND p.id = v.proposal_id AND p.periode_id = ${periodeId} AND p.skema_id = ${b.skemaId}
        AND NOT EXISTS (SELECT 1 FROM butir_cek c WHERE c.basis_aturan_id = ${b.id} AND c.kode = h.butir_kode)`);
    await db.execute(sql`
      UPDATE versi_proposal v SET basis_aturan_id = ${b.id} FROM proposal p
      WHERE p.id = v.proposal_id AND p.periode_id = ${periodeId} AND p.skema_id = ${b.skemaId} AND v.basis_aturan_id IS DISTINCT FROM ${b.id}`);
    await db.execute(sql`UPDATE butir_cek SET status = 'Aktif', ditandai_oleh = NULL, ditandai_pada = NULL WHERE basis_aturan_id = ${b.id} AND status = 'Perlu ditinjau'`);
  }
  // basis versi perbaikan (skenario sesudah-perbaikan) tidak lagi dirujuk: hapus beserta butirnya
  await db.execute(sql`DELETE FROM basis_aturan WHERE periode_id = ${periodeId} AND id NOT IN (${basis.PD.id}, ${basis.PT.id})`);
  // versi gagal saat pengajuan
  await db.execute(sql`
    DELETE FROM versi_proposal v USING proposal p
    WHERE p.id = v.proposal_id AND p.periode_id = ${periodeId} AND v.nomor = 1
      AND EXISTS (SELECT 1 FROM versi_proposal w WHERE w.proposal_id = v.proposal_id AND w.nomor = 2)`);
  await db.execute(sql`
    UPDATE versi_proposal v SET nomor = 1, kode = 'V1' FROM proposal p
    WHERE p.id = v.proposal_id AND p.periode_id = ${periodeId} AND v.nomor = 2`);
}

/** CTE versi terbaru (yang dinilai) setiap proposal periode */
const versiTerbaru = (periodeId: string) => sql`
  SELECT DISTINCT ON (v.proposal_id) v.id, v.proposal_id, p.id_proposal
  FROM versi_proposal v JOIN proposal p ON p.id = v.proposal_id
  WHERE p.periode_id = ${periodeId}
  ORDER BY v.proposal_id, v.nomor DESC`;

export interface HasilPasangPemantauan {
  periodeId: string;
  skemaPdId: string;
  ms: number;
  ringkas: { final: number; koreksi: number; gagal: number };
}

export async function pasangSkenarioPemantauan(id: IdSkenarioPemantauan): Promise<HasilPasangPemantauan> {
  const db = getDb();
  const mulai = Date.now();
  const sk = SKENARIO_PEMANTAUAN[id];
  const { periodeId } = await siapkanContoh1200();
  // masa pengusulan ditutup, sehari kemudian penugasan ditetapkan, lalu minggu-minggu penilaian berjalan sampai beberapa jam lalu
  const tutup = new Date(Date.now() - (sk.mingguBerjalan * 7 + 1) * HARI - 2 * 3_600_000);
  const ditetapkan = new Date(tutup.getTime() + HARI);
  const [periode] = await db.update(s.periodeSeleksi).set({ tanggalTutup: tutup }).where(eq(s.periodeSeleksi.id, periodeId)).returning();
  const basis = await pastikanBasisSimulasi(periodeId, periode.tanggalBuka);
  await bersihkanLapisan(periodeId, basis);

  /* masukan pembangkit: proposal (skema, indeks institusi) dan kode butir yang punya hasil */
  const indeksInstitusi = new Map(Array.from({ length: P.jumlahInstitusi }, (_, i) => [namaInstitusiSkala(i), i]));
  const proposal = baris<{ idProposal: string; skema: KodeSkema; institusi: string }>(
    await db.execute(sql`
      SELECT p.id_proposal AS "idProposal", sp.kode AS skema, a.institusi
      FROM proposal p JOIN skema_pendanaan sp ON sp.id = p.skema_id JOIN akun a ON a.id = p.pengusul_id
      WHERE p.periode_id = ${periodeId} ORDER BY p.id_proposal`),
  ).map<ProposalSim>((p) => ({ idProposal: p.idProposal, skema: p.skema, institusi: indeksInstitusi.get(p.institusi) ?? -1 }));
  const kodeButir = baris<{ skema: KodeSkema; jenis: "semantik" | "deterministik"; kode: string }>(
    await db.execute(sql`
      SELECT DISTINCT sp.kode AS skema, h.jenis, h.butir_kode AS kode
      FROM hasil_pemeriksaan h JOIN versi_proposal v ON v.id = h.versi_id JOIN proposal p ON p.id = v.proposal_id
      JOIN skema_pendanaan sp ON sp.id = p.skema_id
      WHERE p.periode_id = ${periodeId} ORDER BY 1, 2, 3`),
  );
  const butir: ButirSim = { PD: { semantik: [], deterministik: [] }, PT: { semantik: [], deterministik: [] } };
  for (const b of kodeButir) butir[b.skema][b.jenis].push(b.kode);
  const k = bangkitkanPemantauan(sk, proposal, butir);

  /* 4. gagal saat pengajuan */
  if (k.gagal.length) {
    const ids = k.gagal.map((g) => g.idProposal);
    await db.execute(sql`
      UPDATE versi_proposal v SET nomor = 2, kode = 'V2' FROM proposal p
      WHERE p.id = v.proposal_id AND p.periode_id = ${periodeId} AND p.id_proposal IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb))`);
    await db.execute(sql`
      INSERT INTO versi_proposal (proposal_id, nomor, kode, templat_id, basis_aturan_id, berkas_id, teks_per_bagian, kata_kunci, lampiran_ada,
                                  judul_dokumen, status_pemeriksaan, waktu, teks_lampiran, judul_bagian_ditemukan)
      SELECT v.proposal_id, 1, 'V1', v.templat_id, v.basis_aturan_id, v.berkas_id, v.teks_per_bagian, v.kata_kunci, v.lampiran_ada,
             v.judul_dokumen, 'Selesai', v.waktu - interval '2 days', v.teks_lampiran, v.judul_bagian_ditemukan
      FROM versi_proposal v JOIN proposal p ON p.id = v.proposal_id
      WHERE p.periode_id = ${periodeId} AND v.nomor = 2`);
    const pasangan = k.gagal.flatMap((g) => g.butir.map((kode) => ({ id: g.idProposal, kode, ...buktiGagal(kode, acakBerbiji(`bukti:${g.idProposal}:${kode}`)()) })));
    await db.execute(sql`
      WITH g AS (SELECT x->>'id' AS id, x->>'kode' AS kode, x->>'angka' AS angka, x->>'batas' AS batas FROM jsonb_array_elements(${JSON.stringify(pasangan)}::jsonb) AS x)
      INSERT INTO hasil_pemeriksaan (versi_id, butir_id, butir_kode, jenis, bagian, status, angka_pembukti, batas_dilanggar, tiruan)
      SELECT v1.id, h.butir_id, h.butir_kode, h.jenis, h.bagian, (CASE WHEN g.kode IS NULL THEN 'Lolos' ELSE 'Gagal' END)::status_hasil,
             COALESCE(g.angka, h.angka_pembukti), g.batas, h.tiruan
      FROM proposal p
      JOIN versi_proposal v1 ON v1.proposal_id = p.id AND v1.nomor = 1
      JOIN versi_proposal v2 ON v2.proposal_id = p.id AND v2.nomor = 2
      JOIN hasil_pemeriksaan h ON h.versi_id = v2.id AND h.jenis = 'deterministik'
      LEFT JOIN g ON g.id = p.id_proposal AND g.kode = h.butir_kode
      WHERE p.periode_id = ${periodeId}`);
  }

  /* 5. hasil semantik versi yang dinilai: [id, kode, memenuhi 1/0, keyakinan] */
  for (const isi of kelompokkan(k.semantik.map((x) => [x.idProposal, x.kode, x.memenuhi ? 1 : 0, x.keyakinan]))) {
    await db.execute(sql`
      WITH x AS (SELECT e->>0 AS id, e->>1 AS kode, (e->>2)::int AS m, (e->>3)::real AS k FROM jsonb_array_elements(${JSON.stringify(isi)}::jsonb) AS e),
           t AS (${versiTerbaru(periodeId)})
      UPDATE hasil_pemeriksaan h SET
        status = (CASE WHEN x.m = 1 THEN 'Memenuhi' ELSE 'Tidak memenuhi' END)::status_hasil,
        rekomendasi = (CASE WHEN x.m = 1 THEN 'Memenuhi' ELSE 'Tidak memenuhi' END)::keputusan,
        tingkat_keyakinan = x.k,
        alasan_sistem = CASE WHEN x.m = 1 THEN 'Unsur yang diminta butir ditemukan pada kutipan.' ELSE 'Unsur yang diminta butir tidak ditemukan pada bagian yang diperiksa.' END
      FROM x JOIN t ON t.id_proposal = x.id
      WHERE h.versi_id = t.id AND h.butir_kode = x.kode AND h.jenis = 'semantik'`);
  }

  /* 6. sesudah-perbaikan: basis versi berikutnya untuk naskah yang diperiksa ulang */
  const pb = sk.perbaikan;
  if (pb) {
    const lama = basis[pb.skema];
    const berlaku = new Date(ditetapkan.getTime() + (pb.mingguBerlaku - 1) * 7 * HARI);
    const [baru] = baris<{ id: string }>(
      await db.execute(sql`
        INSERT INTO basis_aturan (kode, nama, skema_id, periode_id, versi, tanggal_berlaku)
        SELECT kode, nama, skema_id, periode_id, (SELECT max(versi) + 1 FROM basis_aturan WHERE skema_id = ${lama.skemaId}), ${berlaku.toISOString()}::timestamptz
        FROM basis_aturan WHERE id = ${lama.id}
        RETURNING id`),
    );
    await salinButir(db, lama.id, baru.id, { kode: pb.kode, deskripsi: pb.deskripsiBaru, pertanyaan: pb.pertanyaanBaru });
    const diperiksaUlang = [...new Set(k.semantik.filter((x) => x.baru).map((x) => x.idProposal))];
    await db.execute(sql`
      WITH t AS (${versiTerbaru(periodeId)}), x AS (SELECT jsonb_array_elements_text(${JSON.stringify(diperiksaUlang)}::jsonb) AS id)
      UPDATE hasil_pemeriksaan h SET butir_id = c.id
      FROM t JOIN x ON x.id = t.id_proposal, (${butirPerKode(baru.id)}) c
      WHERE h.versi_id = t.id AND c.kode = h.butir_kode`);
    await db.execute(sql`
      WITH t AS (${versiTerbaru(periodeId)}), x AS (SELECT jsonb_array_elements_text(${JSON.stringify(diperiksaUlang)}::jsonb) AS id)
      UPDATE versi_proposal v SET basis_aturan_id = ${baru.id} FROM t JOIN x ON x.id = t.id_proposal WHERE v.id = t.id`);
    const [pengelola] = await db.select({ id: s.akun.id }).from(s.akun).where(eq(s.akun.idBima, "dppm-pengelola"));
    await db.execute(sql`
      UPDATE butir_cek SET status = 'Perlu ditinjau', ditandai_oleh = ${pengelola?.id ?? null},
             ditandai_pada = ${new Date(ditetapkan.getTime() + ((pb.mingguDitandai - 1) * 7 + 3) * HARI).toISOString()}
      WHERE basis_aturan_id = ${lama.id} AND kode = ${pb.kode}`);
  }

  /*
   * 7. penugasan: algoritma susun UC-03 (susunUsulan: institusi berbeda, bersedia, beban terendah) atas reviewer massal rvw-c12-*
   * periode ini. Reviewer contoh yang dapat masuk (reviewer-1..5) tidak ikut supaya Daftar Penugasan mereka (J-07) tetap milik skenario
   * kecil; 25 reviewer bersedia x batas 50 cukup untuk 1.200 proposal. Kesediaan dibaca dari salinan akun SEMAR, bukan lewat API BIMA, supaya skenario tetap dapat dipasang dari
   * skrip tanpa server. Ditetapkan sehari sesudah masa pengusulan ditutup (minggu penilaian J-05 dihitung dari tanggal ini), lalu
   * dicatat di kotak masuk BIMA tiruan.
   */
  const reviewer = baris<{ id: string; idBima: string; nama: string; institusi: string | null }>(
    await db.execute(sql`SELECT id, id_bima AS "idBima", nama, institusi FROM akun WHERE peran = 'reviewer' AND bersedia`),
  ).filter((r) => dalamKumpulanPeriode(P.namaPeriode, r.idBima) && reviewerMassal(r.idBima));
  const usulan = susunUsulan(
    baris<{ id: string; institusi: string | null }>(
      await db.execute(sql`SELECT p.id, a.institusi FROM proposal p JOIN akun a ON a.id = p.pengusul_id WHERE p.periode_id = ${periodeId} AND p.status = 'Terkirim'`),
    ).map((p) => ({ id: p.id, institusiPengusul: p.institusi ?? "-" })),
    reviewer.map((r) => ({ id: r.id, nama: r.nama, institusi: r.institusi ?? "-" })),
    {},
    BATAS_BEBAN,
  );
  if (usulan.kekurangan > 0) throw new Error(`reviewer kurang untuk ${usulan.kekurangan} proposal pada batas ${BATAS_BEBAN}`);
  const penugasan = baris<{ id: string; idProposal: string; reviewerIdBima: string }>(
    await db.execute(sql`
      WITH x AS (SELECT (e->>'p')::uuid AS p, (e->>'r')::uuid AS r FROM jsonb_array_elements(${JSON.stringify(usulan.penugasan.map((u) => ({ p: u.proposalId, r: u.reviewerId })))}::jsonb) AS e),
           t AS (${versiTerbaru(periodeId)}),
           ins AS (
             INSERT INTO penugasan_reviewer (proposal_id, versi_id, reviewer_id, periode_id, status, label, tanggal)
             SELECT x.p, t.id, x.r, ${periodeId}::uuid, 'Ditetapkan', 'Baru', ${ditetapkan.toISOString()}::timestamptz
             FROM x JOIN t ON t.proposal_id = x.p
             RETURNING id, proposal_id, reviewer_id
           )
      SELECT ins.id, p.id_proposal AS "idProposal", a.id_bima AS "reviewerIdBima"
      FROM ins JOIN proposal p ON p.id = ins.proposal_id JOIN akun a ON a.id = ins.reviewer_id`),
  );
  const pesan = penugasan.map((u) => ({ idProposal: u.idProposal, reviewerIdBima: u.reviewerIdBima, tanggal: ditetapkan.toISOString(), kunci: u.id, periodeId }));
  for (const isi of kelompokkan(pesan)) {
    await db.execute(sql`
      INSERT INTO bima_kotak_masuk (jenis, id_proposal, penerima_id_bima, payload, diterima_pada)
      SELECT 'penugasan', e->>'idProposal', e->>'reviewerIdBima', e, (e->>'tanggal')::timestamptz
      FROM jsonb_array_elements(${JSON.stringify(isi)}::jsonb) AS e
      ON CONFLICT (jenis, (payload->>'kunci')) WHERE (payload->>'kunci') IS NOT NULL DO NOTHING`);
  }

  /* penilaian Final: [id, waktu kirim, umpan balik] */
  const final = k.final.map((f) => {
    const waktu = new Date(ditetapkan.getTime() + ((f.minggu - 1) * 7 * 24 + f.jam) * 3_600_000);
    return [f.idProposal, waktu.toISOString(), UMPAN_BALIK[Math.floor(acakBerbiji(`ub:${f.idProposal}`)() * UMPAN_BALIK.length)]];
  });
  const komponen = `${KOMPONEN_BORANG.length} dari ${KOMPONEN_BORANG.length} komponen Memenuhi`;
  await db.execute(sql`
    WITH x AS (SELECT e->>0 AS id, (e->>1)::timestamptz AS t, e->>2 AS ub FROM jsonb_array_elements(${JSON.stringify(final)}::jsonb) AS e),
    u AS (
      UPDATE penugasan_reviewer pr SET status = 'Selesai', label = 'Selesai'
      FROM x JOIN proposal p ON p.id_proposal = x.id
      WHERE pr.proposal_id = p.id AND pr.periode_id = ${periodeId}
      RETURNING pr.id, x.t, x.ub
    )
    INSERT INTO penilaian (penugasan_id, status, komentar, nilai, dikirim_ke_bima_pada, diperbarui_pada)
    SELECT id, 'Final', ub, ${komponen}::text, t, t FROM u`);
  await db.execute(sql`
    INSERT INTO keputusan_komponen (penilaian_id, komponen, keputusan)
    SELECT pl.id, kb.komponen, 'Memenuhi'
    FROM penilaian pl JOIN penugasan_reviewer pr ON pr.id = pl.penugasan_id
    CROSS JOIN unnest(${sql.raw(`ARRAY[${KOMPONEN_BORANG.map((x) => `'${x.replaceAll("'", "''")}'`).join(",")}]`)}::text[]) AS kb(komponen)
    WHERE pr.periode_id = ${periodeId}`);

  /* koreksi reviewer: [id, kode, keputusan, jenis, alasan] */
  for (const isi of kelompokkan(k.koreksi.map((x) => [x.idProposal, x.kode, x.keputusan, x.jenis, x.alasan]))) {
    await db.execute(sql`
      WITH x AS (SELECT e->>0 AS id, e->>1 AS kode, e->>2 AS keputusan, e->>3 AS jenis, e->>4 AS alasan FROM jsonb_array_elements(${JSON.stringify(isi)}::jsonb) AS e)
      INSERT INTO koreksi_rekomendasi (penilaian_id, hasil_id, keputusan_reviewer, alasan, jenis_kekeliruan, waktu_koreksi)
      SELECT pl.id, h.id, x.keputusan::keputusan, x.alasan, x.jenis, pl.dikirim_ke_bima_pada - interval '3 hours'
      FROM x
      JOIN proposal p ON p.id_proposal = x.id AND p.periode_id = ${periodeId}
      JOIN penugasan_reviewer pr ON pr.proposal_id = p.id AND pr.periode_id = ${periodeId}
      JOIN penilaian pl ON pl.penugasan_id = pr.id
      JOIN hasil_pemeriksaan h ON h.versi_id = pr.versi_id AND h.butir_kode = x.kode AND h.jenis = 'semantik'`);
  }

  for (const t of ["versi_proposal", "hasil_pemeriksaan", "penugasan_reviewer", "penilaian", "keputusan_komponen", "koreksi_rekomendasi", "bima_kotak_masuk", "butir_cek"]) {
    await db.execute(sql.raw(`VACUUM ANALYZE ${t}`));
  }
  const ringkas = { final: k.final.length, koreksi: k.koreksi.length, gagal: k.gagal.length };
  const ms = Date.now() - mulai;
  await catatLogAudit({ aktor: "demo", aksi: "demo.pemantauan", objek: `periode:${periodeId}`, rincian: { skenario: id, ms, ...ringkas } });
  return { periodeId, skemaPdId: basis.PD.skemaId, ms, ringkas };
}

export { JUMLAH_MINGGU };
