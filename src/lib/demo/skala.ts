/**
 * Skenario J-04 berskala besar (profil di demo/profil-skala.ts), keduanya simulasi (skala seleksi sebenarnya 79.210 usulan):
 *  - "Uji beban" (skala10k): 10.000 proposal Terkirim, 130 reviewer rvw-skala-* dari 40 institusi, semua skema PD, tanpa naskah
 *    (J-08 hanya kerangka).
 *  - "Contoh 1.200 proposal" (contoh1200): 1.200 proposal Terkirim (PD dan PT) dari 14 institusi yang timpang, 27 reviewer rvw-c12-*
 *    (3 tidak bersedia) ditambah reviewer-1..6 yang dapat masuk. Naskah dan hasil pemeriksaan disalin dari proposal skenario kecil
 *    PRP-2026-0004 (judul diganti judul proposal), jadi J-05b dan J-08 berisi.
 * Data massal dibuat set-based pada PERIODE TERSENDIRI berawalan "Simulasi " sehingga skenario lain tidak ikut menanggungnya: J-04
 * membukanya bila pengaturan_demo.periodeAktifId menunjuknya, dan semua pembaca periode lain mengecualikan namanya. Reset & isi data
 * demo (TRUNCATE) menghapusnya.
 */
import { eq, like, sql } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { setPeriodeAktif, ubahPengaturanDemo } from "@/lib/waktu";
import { NAMA_LAMA, NAMA_PERIODE_SKALA, PROFIL, type ProfilSkala } from "./profil-skala";

const P10 = PROFIL.skala10k;
export const JUMLAH_PROPOSAL_SKALA = P10.jumlahProposal;
export const JUMLAH_REVIEWER_SKALA = P10.jumlahReviewer;
export const JUMLAH_PENGUSUL_SKALA = P10.jumlahPengusul;
export const JUMLAH_INSTITUSI_SKALA = P10.jumlahInstitusi;
/** Batas beban bawaan skenario: 10.000 / ±119 reviewer bersedia = ±84 per reviewer, jadi 100 cukup; 60 memicu kekurangan (S-1). */
export const BATAS_BEBAN_SKALA = P10.batasBawaan;
export const NAMA_PERIODE_SKALA_LENGKAP = P10.namaPeriode;

const JENIS = ["Universitas", "Institut", "Politeknik", "Universitas", "Sekolah Tinggi"];
const WILAYAH = [
  "Nusantara", "Bahari", "Kepulauan", "Pertiwi", "Karya", "Mandala", "Cendana", "Garuda", "Samudra", "Khatulistiwa",
  "Wanua", "Pasundan", "Borneo", "Celebes", "Kenari", "Lintang", "Merapi", "Rinjani", "Sriwijaya", "Majapahit",
  "Dwipa", "Arunika", "Bumantara", "Tirta", "Kencana", "Laksana", "Nirmala", "Paramita", "Satria", "Taruna",
  "Utama", "Wijaya", "Yudistira", "Cakra", "Dharma", "Eka", "Gema", "Harapan", "Indra", "Jaya",
];
const NAMA_DEPAN = [
  "Agus", "Bambang", "Citra", "Dewi", "Eka", "Fajar", "Gita", "Hendra", "Indah", "Joko", "Kartika", "Lestari", "Mega", "Nur", "Oka",
  "Putri", "Rangga", "Sari", "Teguh", "Umar", "Vina", "Wulan", "Yusuf", "Zahra", "Arif", "Bayu", "Dian", "Farhan", "Hana", "Ilham",
];
const NAMA_BELAKANG = [
  "Pratama", "Wijaya", "Santoso", "Hidayat", "Kusuma", "Saputra", "Lestari", "Nugroho", "Rahmawati", "Susanto", "Purnama", "Wibowo",
  "Maharani", "Setiawan", "Anggraini", "Permana", "Firmansyah", "Handayani", "Gunawan", "Kurniawan", "Utami", "Sari", "Budiman", "Ramadhan",
  "Syahputra", "Puspita", "Hakim", "Fadillah", "Mulyadi", "Suryani",
];
const PENDEKATAN = ["studi kasus", "eksperimen lapangan", "pengembangan prototipe", "pemodelan numerik", "penelitian tindakan", "survei terstruktur", "kajian komparatif"];
const TOPIK = [
  "pengolahan limbah pesisir", "irigasi tetes cerdas", "literasi digital desa", "bahan bangunan ramah lingkungan", "pemetaan potensi perikanan",
  "energi surya skala rumah tangga", "pembelajaran adaptif berbasis data", "pangan lokal bergizi", "deteksi dini banjir", "tata kelola koperasi desa",
  "pengemasan produk UMKM", "kesehatan ibu dan anak",
];

export function namaInstitusiSkala(i: number): string {
  return `${JENIS[i % JENIS.length]} ${WILAYAH[i % WILAYAH.length]} Contoh`;
}
const nomor = (i: number, lebar: number) => String(i).padStart(lebar, "0");
// pasangan (depan, belakang) tidak berulang sampai ±150 orang: indeks belakang bergeser 5 setiap putaran 30 nama depan
const namaOrang = (i: number, gelar: string) =>
  `${gelar} ${NAMA_DEPAN[i % NAMA_DEPAN.length]} ${NAMA_BELAKANG[(i * 7 + 3 + Math.floor(i / NAMA_DEPAN.length) * 5) % NAMA_BELAKANG.length]}`;

export interface HasilSiapkanSkala {
  periodeId: string;
  dibuatBaru: boolean;
  /** milidetik: pembuatan data massal (0 bila sudah ada) */
  waktuBuatMs: number;
  /** milidetik: pembersihan penugasan/kotak masuk lama dan pemasangan keadaan awal */
  waktuAturMs: number;
}

/**
 * Kesediaan reviewer massal sesuai profil. Akun reviewer contoh (reviewer-1..5) tidak disentuh: kesediaannya berlaku global, lintas
 * periode dan skenario, jadi tetap seperti data seed.
 */
async function pasangKesediaan(profil: ProfilSkala): Promise<void> {
  const db = getDb();
  const nomorRvw = sql`substring(id_bima from '[0-9]+$')::int`;
  const bersedia = profil.kunci === "skala10k" ? sql`(${nomorRvw} % 11 <> 0)` : sql`(${nomorRvw} <= 25)`;
  for (const tabel of ["akun", "bima_akun", "bima_reviewer"]) {
    await db.execute(sql`UPDATE ${sql.raw(tabel)} SET bersedia = ${bersedia} WHERE id_bima LIKE ${profil.awalanReviewer + "%"}`);
  }
}

const sqlArr = (a: string[]) => sql.raw(`ARRAY[${a.map((x) => `'${x.replaceAll("'", "''")}'`).join(",")}]`);

/** Reviewer massal: BIMA (akun + reviewer) dan salinan SEMAR. Institusi diambil bergiliran dari institusi profil. */
async function buatReviewer(profil: ProfilSkala): Promise<void> {
  const db = getDb();
  const reviewer = Array.from({ length: profil.jumlahReviewer }, (_, k) => {
    const i = k + 1;
    return {
      idBima: `${profil.awalanReviewer}${nomor(i, 3)}`,
      nama: namaOrang(i + (profil.kunci === "contoh1200" ? 37 : 0), i % 4 === 0 ? "Prof." : "Dr."),
      institusi: namaInstitusiSkala((i - 1) % profil.jumlahInstitusi),
      nomorInduk: `RVW-${profil.kunci === "contoh1200" ? "C" : "S"}${nomor(i, 3)}`,
      bersedia: !profil.tidakBersedia(i),
      bidang: TOPIK[i % TOPIK.length],
    };
  });
  await db.insert(s.bimaAkun).values(reviewer.map((r) => ({ ...r, peran: "reviewer" as const })));
  await db.insert(s.bimaReviewer).values(reviewer.map((r) => ({ idBima: r.idBima, kode: r.nomorInduk, nama: r.nama, institusi: r.institusi, bidang: r.bidang, bersedia: r.bersedia })));
  await db.insert(s.akun).values(reviewer.map((r) => ({ ...r, peran: "reviewer" as const })));
}

/** 10.000 proposal skema PD, pengusul dan proposal dibangkitkan dengan generate_series (rumus institusi merata). */
async function buatProposalSkala10k(profil: ProfilSkala, periodeId: string, skemaPd: string): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    INSERT INTO akun (id_bima, nama, peran, institusi, nomor_induk, bersedia)
    SELECT ${profil.awalanPengusul} || lpad(n::text, 4, '0'),
           'Dr. ' || (${sqlArr(NAMA_DEPAN)})[1 + (n + 11) % ${NAMA_DEPAN.length}] || ' ' || (${sqlArr(NAMA_BELAKANG)})[1 + (n * 7 + 3 + (n / ${NAMA_DEPAN.length}) * 5) % ${NAMA_BELAKANG.length}],
           'pengusul', (${sqlArr(JENIS)})[1 + ((n * 17 + (n % 3) * 5) % ${profil.jumlahInstitusi}) % ${JENIS.length}] || ' ' || (${sqlArr(WILAYAH)})[1 + ((n * 17 + (n % 3) * 5) % ${profil.jumlahInstitusi}) % ${WILAYAH.length}] || ' Contoh',
           'NIDN-S' || lpad(n::text, 5, '0'), false
    FROM generate_series(1, ${profil.jumlahPengusul}) AS n`);
  await db.execute(sql`
    INSERT INTO proposal (id_proposal, judul, skema_id, periode_id, pengusul_id, status, waktu_terkirim)
    SELECT ${profil.awalanIdProposal} || lpad(n::text, 5, '0'),
           'Penelitian ' || (${sqlArr(TOPIK)})[1 + n % ${TOPIK.length}] || ' dengan ' || (${sqlArr(PENDEKATAN)})[1 + (n / ${TOPIK.length}) % ${PENDEKATAN.length}] || ' di wilayah ' || (${sqlArr(WILAYAH)})[1 + (n * 7) % ${WILAYAH.length}] || ' (uji beban ' || lpad(n::text, 5, '0') || ')',
           ${skemaPd}::uuid, ${periodeId}::uuid,
           (SELECT array_agg(id ORDER BY id_bima) FROM akun WHERE id_bima LIKE ${profil.awalanPengusul + "%"})[1 + (n * 37) % ${profil.jumlahPengusul}],
           'Terkirim', now() - ((n % 240) || ' minutes')::interval
    FROM generate_series(1, ${profil.jumlahProposal}) AS n`);
}

/**
 * Proposal profil berbobot (contoh 1.200): tiap institusi mendapat `bobotInstitusi[i]` proposal dan sekitar separuhnya pengusul
 * (dua proposal per pengusul); sebagian proposal skema PT menurut `porsiTerapan`. Dibangun di sini lalu disisipkan sebagai satu array JSON.
 */
async function buatProposalBerbobot(profil: ProfilSkala, periodeId: string, skemaPd: string, skemaPt: string): Promise<void> {
  const db = getDb();
  const pengusul: { idBima: string; nama: string; institusi: string; nomorInduk: string }[] = [];
  const usulan: { id: string; judul: string; skema: string; pengusul: string; menit: number }[] = [];
  let n = 0;
  let m = 0;
  profil.bobotInstitusi.forEach((jumlah, i) => {
    const institusi = namaInstitusiSkala(i);
    const banyakPengusul = Math.max(1, Math.ceil(jumlah / 2));
    const awal = pengusul.length;
    for (let k = 0; k < banyakPengusul; k++) {
      m++;
      pengusul.push({ idBima: `${profil.awalanPengusul}${nomor(m, 4)}`, nama: namaOrang(m + 5, "Dr."), institusi, nomorInduk: `NIDN-C${nomor(m, 5)}` });
    }
    for (let k = 0; k < jumlah; k++) {
      n++;
      const terapan = (n * 7) % 12 < Math.round(profil.porsiTerapan * 12);
      usulan.push({
        id: `${profil.awalanIdProposal}${nomor(n, 4)}`,
        judul: `${terapan ? "Penerapan" : "Kajian"} ${TOPIK[n % TOPIK.length]} dengan ${PENDEKATAN[Math.floor(n / TOPIK.length) % PENDEKATAN.length]} di wilayah ${WILAYAH[(n * 7) % WILAYAH.length]}`,
        skema: terapan ? skemaPt : skemaPd,
        pengusul: pengusul[awal + (k % banyakPengusul)].idBima,
        menit: n % 240,
      });
    }
  });
  await db.insert(s.akun).values(pengusul.map((p) => ({ ...p, peran: "pengusul" as const, bersedia: false })));
  await db.execute(sql`
    INSERT INTO proposal (id_proposal, judul, skema_id, periode_id, pengusul_id, status, waktu_terkirim)
    SELECT x->>'id', x->>'judul', (x->>'skema')::uuid, ${periodeId}::uuid, a.id, 'Terkirim', now() - ((x->>'menit') || ' minutes')::interval
    FROM jsonb_array_elements(${JSON.stringify(usulan)}::jsonb) AS x
    JOIN akun a ON a.id_bima = x->>'pengusul'`);
}

/**
 * Naskah dan hasil pemeriksaan proposal contoh PRP-2026-0004 (skenario reviewer, Terkirim) disalin ke setiap versi profil supaya J-05b
 * dan J-08 berisi; judul di teks bagian diganti judul proposal. Bila contoh itu belum ada, versi tetap tanpa naskah (kerangka).
 */
async function salinNaskahContoh(periodeId: string): Promise<void> {
  const db = getDb();
  const [sumber] = (
    (await db.execute(sql`
      SELECT v.id, v.berkas_id, v.templat_id, v.basis_aturan_id FROM versi_proposal v JOIN proposal p ON p.id = v.proposal_id
      WHERE p.id_proposal = 'PRP-2026-0004' AND v.berkas_id IS NOT NULL ORDER BY v.nomor DESC LIMIT 1`)) as unknown as { rows: { id: string }[] }
  ).rows;
  if (!sumber) return;
  await db.execute(sql`
    UPDATE versi_proposal v SET
      berkas_id = c.berkas_id, templat_id = COALESCE(v.templat_id, c.templat_id), basis_aturan_id = COALESCE(v.basis_aturan_id, c.basis_aturan_id),
      teks_per_bagian = jsonb_set(c.teks_per_bagian, '{Judul}', to_jsonb(p.judul)), kata_kunci = c.kata_kunci,
      lampiran_ada = c.lampiran_ada, teks_lampiran = c.teks_lampiran, judul_bagian_ditemukan = c.judul_bagian_ditemukan
    FROM versi_proposal c, proposal p
    WHERE c.id = ${sumber.id}::uuid AND p.id = v.proposal_id AND p.periode_id = ${periodeId}::uuid`);
  await db.execute(sql`
    INSERT INTO hasil_pemeriksaan (versi_id, butir_id, butir_kode, jenis, bagian, status, angka_pembukti, batas_dilanggar, rekomendasi, kutipan, kutipan_lain, tingkat_keyakinan, alasan_sistem, tiruan)
    SELECT v.id, h.butir_id, h.butir_kode, h.jenis, h.bagian, h.status, h.angka_pembukti, h.batas_dilanggar, h.rekomendasi, h.kutipan, h.kutipan_lain, h.tingkat_keyakinan, h.alasan_sistem, h.tiruan
    FROM versi_proposal v JOIN proposal p ON p.id = v.proposal_id CROSS JOIN hasil_pemeriksaan h
    WHERE p.periode_id = ${periodeId}::uuid AND h.versi_id = ${sumber.id}::uuid
    ON CONFLICT DO NOTHING`);
}

async function buatDataMassal(profil: ProfilSkala, periodeId: string): Promise<void> {
  const db = getDb();
  const skema = await db.select().from(s.skemaPendanaan);
  const pd = skema.find((x) => x.kode === "PD");
  const pt = skema.find((x) => x.kode === "PT") ?? pd;
  if (!pd || !pt) throw new Error('skema PD belum ada; jalankan "Reset & isi data demo" lebih dulu');

  await buatReviewer(profil);
  if (profil.bobotInstitusi.length) await buatProposalBerbobot(profil, periodeId, pd.id, pt.id);
  else await buatProposalSkala10k(profil, periodeId, pd.id);

  // satu versi (V1) tiap proposal dengan templat Terbit dan basis aturan skemanya
  await db.execute(sql`
    INSERT INTO versi_proposal (proposal_id, nomor, kode, templat_id, basis_aturan_id, judul_dokumen, status_pemeriksaan)
    SELECT p.id, 1, 'V1',
           (SELECT t.id FROM templat_proposal t WHERE t.skema_id = p.skema_id AND t.status = 'Terbit' ORDER BY t.versi DESC LIMIT 1),
           (SELECT b.id FROM basis_aturan b WHERE b.skema_id = p.skema_id ORDER BY b.versi LIMIT 1),
           p.judul, 'Selesai'
    FROM proposal p WHERE p.periode_id = ${periodeId}::uuid`);
  if (profil.kunci === "contoh1200") await salinNaskahContoh(periodeId);
  // Tabel yang baru diisi massal: VACUUM ANALYZE menetapkan hint bit dan statistik sekarang (di waktu persiapan), bukan pada klik pertama
  // di J-04 (pembacaan pertama sesudah tulis massal di Neon bisa jauh lebih lambat dan sulit diduga).
  await db.execute(sql`VACUUM ANALYZE proposal`);
  await db.execute(sql`VACUUM ANALYZE versi_proposal`);
  await db.execute(sql`VACUUM ANALYZE akun`);
}

/**
 * Menyiapkan satu profil dan mengaktifkannya untuk J-04. Membuat data massal bila belum ada (sekali; sesudah itu hanya mengosongkan
 * penugasan dan kotak masuk BIMA hasil percobaan sebelumnya), lalu: masa pengusulan ditutup, batas beban bawaan, kesediaan reviewer
 * sesuai profil, dan periode profil dipilih sebagai periode J-04.
 */
export async function siapkanProfilSkala(profil: ProfilSkala): Promise<HasilSiapkanSkala> {
  const db = getDb();
  const mulai = Date.now();
  // periode bernama lama ("Skala Nyata ...") diganti nama, datanya dipakai terus
  for (const [lama, kunci] of Object.entries(NAMA_LAMA)) {
    if (kunci === profil.kunci) await db.update(s.periodeSeleksi).set({ nama: profil.namaPeriode }).where(eq(s.periodeSeleksi.nama, lama));
  }
  let [periode] = await db.select().from(s.periodeSeleksi).where(eq(s.periodeSeleksi.nama, profil.namaPeriode));
  let dibuatBaru = false;

  if (periode) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.proposal).where(eq(s.proposal.periodeId, periode.id));
    const [{ r }] = await db.select({ r: sql<number>`count(*)::int` }).from(s.akun).where(like(s.akun.idBima, `${profil.awalanReviewer}%`));
    if (n !== profil.jumlahProposal || r !== profil.jumlahReviewer) {
      // data rusak atau sebagian: bangun ulang dari nol
      await db.delete(s.penugasanReviewer).where(eq(s.penugasanReviewer.periodeId, periode.id));
      await db.delete(s.proposal).where(eq(s.proposal.periodeId, periode.id));
      // basis aturan simulasi J-05 (demo/pemantauan.ts) merujuk periode ini; hasil yang merujuk butirnya sudah ikut terhapus bersama proposal
      await db.delete(s.basisAturan).where(eq(s.basisAturan.periodeId, periode.id));
      await db.delete(s.akun).where(sql`${s.akun.idBima} like ${profil.awalanReviewer + "%"} or ${s.akun.idBima} like ${profil.awalanPengusul + "%"}`);
      await db.delete(s.bimaReviewer).where(like(s.bimaReviewer.idBima, `${profil.awalanReviewer}%`));
      await db.delete(s.bimaAkun).where(like(s.bimaAkun.idBima, `${profil.awalanReviewer}%`));
      await db.delete(s.periodeSeleksi).where(eq(s.periodeSeleksi.id, periode.id));
      periode = undefined as unknown as typeof periode;
    }
  }
  if (!periode) {
    const [utama] = await db
      .select()
      .from(s.periodeSeleksi)
      .where(sql`${s.periodeSeleksi.nama} not like ${NAMA_PERIODE_SKALA + "%"} and ${s.periodeSeleksi.tanggalBuka} <= now()`)
      .orderBy(sql`${s.periodeSeleksi.tahun} desc, ${s.periodeSeleksi.tanggalBuka} desc`)
      .limit(1);
    if (!utama) throw new Error('belum ada periode seleksi; jalankan "Reset & isi data demo" lebih dulu');
    // tahun sama, tanggal buka lebih awal supaya periode utama tetap "terbaru" bagi jendela lain
    [periode] = await db
      .insert(s.periodeSeleksi)
      .values({
        tahun: utama.tahun,
        nama: profil.namaPeriode,
        tanggalBuka: new Date(utama.tanggalBuka.getTime() - 90 * 86_400_000),
        tanggalTutup: new Date(Date.now() - 60_000),
        batasBebanReviewer: profil.batasBawaan,
      })
      .returning();
    await buatDataMassal(profil, periode.id);
    dibuatBaru = true;
  }
  const waktuBuatMs = dibuatBaru ? Date.now() - mulai : 0;

  const mulaiAtur = Date.now();
  await db.delete(s.penugasanReviewer).where(eq(s.penugasanReviewer.periodeId, periode.id));
  await db.execute(sql`DELETE FROM bima_kotak_masuk WHERE jenis = 'penugasan' AND id_proposal LIKE ${profil.awalanIdProposal + "%"}`);
  // buang baris mati hasil percobaan sebelumnya dan segarkan statistik sekarang, supaya Susun/Tetapkan pertama tidak menanggungnya
  await db.execute(sql`VACUUM ANALYZE penugasan_reviewer`);
  await db.execute(sql`VACUUM ANALYZE bima_kotak_masuk`);
  await db
    .update(s.periodeSeleksi)
    // penugasan dikosongkan: masa penilaian belum dimulai lagi dan kembali ke bawaan (7 hari, 2 jam per hari, 5,17 menit per proposal)
    .set({ batasBebanReviewer: profil.batasBawaan, tanggalTutup: new Date(Date.now() - 60_000), mulaiPenilaian: null, batasPenilaian: null, lamaPenilaianHari: 7, jamReviewerPerHari: 2, menitPerProposal: 5.17 })
    .where(eq(s.periodeSeleksi.id, periode.id));
  await pasangKesediaan(profil);
  await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
  await setPeriodeAktif(periode.id);
  const waktuAturMs = Date.now() - mulaiAtur;

  await catatLogAudit({
    aktor: "demo",
    aksi: profil.kunci === "skala10k" ? "demo.skala_nyata" : "demo.contoh_1200",
    objek: `periode:${periode.id}`,
    rincian: { dibuatBaru, waktuBuatMs, waktuAturMs, proposal: profil.jumlahProposal },
  });
  return { periodeId: periode.id, dibuatBaru, waktuBuatMs, waktuAturMs };
}

/** Skenario "Uji beban: 10.000 proposal". */
export const siapkanSkalaNyata = () => siapkanProfilSkala(PROFIL.skala10k);

/** Skenario UC-03 bawaan: 1.200 proposal Terkirim, reviewer contoh ikut dibagi. */
export const siapkanContoh1200 = () => siapkanProfilSkala(PROFIL.contoh1200);

/** Penugasan dan kotak masuk periode contoh 1.200 dikosongkan (jendela reviewer kembali ke keadaan skenario kecil). */
export async function kosongkanPenugasanContoh1200(): Promise<void> {
  const db = getDb();
  const [p] = await db.select({ id: s.periodeSeleksi.id }).from(s.periodeSeleksi).where(eq(s.periodeSeleksi.nama, PROFIL.contoh1200.namaPeriode));
  if (!p) return;
  await db.execute(sql`DELETE FROM penugasan_reviewer pr WHERE pr.periode_id = ${p.id} AND NOT EXISTS (SELECT 1 FROM penilaian pl WHERE pl.penugasan_id = pr.id)`);
  // pesan BIMA hanya dibuang untuk proposal yang penugasannya ikut terhapus (penugasan berpenilaian tetap tercatat di kedua sisi)
  await db.execute(sql`
    DELETE FROM bima_kotak_masuk km WHERE km.jenis = 'penugasan' AND km.id_proposal LIKE ${PROFIL.contoh1200.awalanIdProposal + "%"}
      AND NOT EXISTS (SELECT 1 FROM penugasan_reviewer pr JOIN proposal p ON p.id = pr.proposal_id WHERE p.id_proposal = km.id_proposal)`);
  // tanpa penugasan tetap, masa penilaian dianggap belum dimulai (dimulai lagi saat Tetapkan)
  await db.execute(sql`
    UPDATE periode_seleksi SET mulai_penilaian = NULL, batas_penilaian = NULL
    WHERE id = ${p.id} AND NOT EXISTS (SELECT 1 FROM penugasan_reviewer WHERE periode_id = ${p.id} AND status <> 'Diusulkan')`);
}
