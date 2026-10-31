/**
 * Data berskala periode Seleksi Pendanaan 2026 (profil contoh1200 di demo/profil-skala.ts): 1.200 proposal Terkirim (PD dan PT) dari
 * 14 institusi yang timpang, 28 reviewer rvw-c12-* (3 tidak bersedia) ditambah reviewer-1..5 yang dapat masuk. Naskah dan hasil
 * pemeriksaan disalin dari proposal contoh PRP-2026-0004 (judul diganti judul proposal), jadi J-05b dan J-08 berisi.
 * Periode 2026 dibuat seed dan juga berisi PRP-2026-0004; semua operasi di sini dibatasi awalan id profil (C12-2026-, rvw-c12-, pgs-c12-),
 * jadi proposal contoh dan periode 2027 (alur end-to-end) tidak tersentuh.
 */
import { and, eq, like, sql } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { jalankan as jalankanSemantik } from "@/lib/pemeriksa/semantik/jalankan";
import { kirimPermintaanTiruan } from "@/lib/pemeriksa/semantik/llm";
import { setPeriodeAktif } from "@/lib/waktu";
import { PROFIL, type ProfilSkala } from "./profil-skala";

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
  const bersedia = sql`(${nomorRvw} <= 25)`;
  for (const tabel of ["akun", "bima_akun", "bima_reviewer"]) {
    await db.execute(sql`UPDATE ${sql.raw(tabel)} SET bersedia = ${bersedia} WHERE id_bima LIKE ${profil.awalanReviewer + "%"}`);
  }
}


/** Reviewer massal: BIMA (akun + reviewer) dan salinan SEMAR. Institusi diambil bergiliran dari institusi profil. */
async function buatReviewer(profil: ProfilSkala): Promise<void> {
  const db = getDb();
  const reviewer = Array.from({ length: profil.jumlahReviewer }, (_, k) => {
    const i = k + 1;
    return {
      idBima: `${profil.awalanReviewer}${nomor(i, 3)}`,
      nama: namaOrang(i + 37, i % 4 === 0 ? "Prof." : "Dr."),
      institusi: namaInstitusiSkala((i - 1) % profil.jumlahInstitusi),
      nomorInduk: `RVW-C${nomor(i, 3)}`,
      bersedia: !profil.tidakBersedia(i),
      bidang: TOPIK[i % TOPIK.length],
    };
  });
  await db.insert(s.bimaAkun).values(reviewer.map((r) => ({ ...r, peran: "reviewer" as const })));
  await db.insert(s.bimaReviewer).values(reviewer.map((r) => ({ idBima: r.idBima, kode: r.nomorInduk, nama: r.nama, institusi: r.institusi, bidang: r.bidang, bersedia: r.bersedia })));
  await db.insert(s.akun).values(reviewer.map((r) => ({ ...r, peran: "reviewer" as const })));
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
 * Versi proposal contoh PRP-2026-0004 (skenario reviewer, Terkirim) yang menjadi sumber salinan profil. Seed hanya membuat hasil
 * deterministiknya dan job semantik Menunggu (dikerjakan saat J-08 dibuka), jadi hasil semantiknya dibuat dulu di sini (penyedia tiruan,
 * tanpa LLM) bila belum ada. Tanpa ini salinan 1.200 proposal tidak punya hasil semantik dan J-05 kosong (hasil semantik 0 sejak reset 27 Okt 2026).
 */
async function versiSumberContoh(): Promise<string | null> {
  const db = getDb();
  const [sumber] = (
    (await db.execute(sql`
      SELECT v.id FROM versi_proposal v JOIN proposal p ON p.id = v.proposal_id
      WHERE p.id_proposal = 'PRP-2026-0004' AND v.berkas_id IS NOT NULL ORDER BY v.nomor DESC LIMIT 1`)) as unknown as { rows: { id: string }[] }
  ).rows;
  if (!sumber) return null;
  if (!(await adaHasilSemantik(sql`SELECT ${sumber.id}::uuid`))) await jalankanSemantik(sumber.id, { tiruan: true, penyedia: kirimPermintaanTiruan });
  return sumber.id;
}

/** Ada paling sedikit satu hasil semantik pada versi-versi dari subkueri id versi. */
async function adaHasilSemantik(idVersi: ReturnType<typeof sql>): Promise<boolean> {
  const { rows } = (await getDb().execute(sql`SELECT EXISTS (SELECT 1 FROM hasil_pemeriksaan WHERE jenis = 'semantik' AND versi_id IN (${idVersi})) AS ada`)) as unknown as {
    rows: { ada: boolean }[];
  };
  return rows[0]?.ada === true;
}

/** Versi proposal profil pada periode (berdasarkan awalan id), sebagai subkueri id. */
const versiProfil = (periodeId: string, awalan: string) =>
  sql`SELECT v.id FROM versi_proposal v JOIN proposal p ON p.id = v.proposal_id WHERE p.periode_id = ${periodeId}::uuid AND p.id_proposal LIKE ${awalan + "%"}`;

/**
 * Hasil pemeriksaan profil utuh: ada hasil semantik dan tidak ada butir yang tercatat dua kali pada satu versi. Data yang dibangun sebelum
 * sumbernya punya hasil semantik (reset 27 Okt 2026) atau yang hasilnya pernah tersalin ganda dibangun ulang, bukan ditambal.
 */
async function hasilProfilUtuh(periodeId: string, awalan: string): Promise<boolean> {
  if (!(await adaHasilSemantik(versiProfil(periodeId, awalan)))) return false;
  const { rows } = (await getDb().execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM hasil_pemeriksaan WHERE versi_id IN (${versiProfil(periodeId, awalan)}) GROUP BY versi_id, butir_kode HAVING count(*) > 1
    ) AS ganda`)) as unknown as { rows: { ganda: boolean }[] };
  return rows[0]?.ganda !== true;
}

/** Hasil pemeriksaan (deterministik dan semantik) versi sumber disalin ke setiap versi profil; yang sudah ada dilewati. */
async function salinHasilContoh(periodeId: string, awalan: string, sumberId: string): Promise<void> {
  await getDb().execute(sql`
    INSERT INTO hasil_pemeriksaan (versi_id, butir_id, butir_kode, jenis, bagian, status, angka_pembukti, batas_dilanggar, rekomendasi, kutipan, kutipan_lain, tingkat_keyakinan, alasan_sistem, tiruan)
    SELECT v.id, h.butir_id, h.butir_kode, h.jenis, h.bagian, h.status, h.angka_pembukti, h.batas_dilanggar, h.rekomendasi, h.kutipan, h.kutipan_lain, h.tingkat_keyakinan, h.alasan_sistem, h.tiruan
    FROM versi_proposal v JOIN proposal p ON p.id = v.proposal_id CROSS JOIN hasil_pemeriksaan h
    WHERE p.periode_id = ${periodeId}::uuid AND p.id_proposal LIKE ${awalan + "%"} AND h.versi_id = ${sumberId}::uuid
    ON CONFLICT DO NOTHING`);
}

/**
 * Naskah dan hasil pemeriksaan proposal contoh PRP-2026-0004 disalin ke setiap versi profil supaya J-05b dan J-08 berisi; judul di teks
 * bagian diganti judul proposal. Bila contoh itu belum ada, versi tetap tanpa naskah (kerangka).
 */
async function salinNaskahContoh(periodeId: string, awalan: string): Promise<void> {
  const sumberId = await versiSumberContoh();
  if (!sumberId) return;
  await getDb().execute(sql`
    UPDATE versi_proposal v SET
      berkas_id = c.berkas_id, templat_id = COALESCE(v.templat_id, c.templat_id), basis_aturan_id = COALESCE(v.basis_aturan_id, c.basis_aturan_id),
      teks_per_bagian = jsonb_set(c.teks_per_bagian, '{Judul}', to_jsonb(p.judul)), kata_kunci = c.kata_kunci,
      lampiran_ada = c.lampiran_ada, teks_lampiran = c.teks_lampiran, judul_bagian_ditemukan = c.judul_bagian_ditemukan
    FROM versi_proposal c, proposal p
    WHERE c.id = ${sumberId}::uuid AND p.id = v.proposal_id AND p.periode_id = ${periodeId}::uuid AND p.id_proposal LIKE ${awalan + "%"}`);
  await salinHasilContoh(periodeId, awalan, sumberId);
}

async function buatDataMassal(profil: ProfilSkala, periodeId: string): Promise<void> {
  const db = getDb();
  const skema = await db.select().from(s.skemaPendanaan);
  const pd = skema.find((x) => x.kode === "PD");
  const pt = skema.find((x) => x.kode === "PT") ?? pd;
  if (!pd || !pt) throw new Error('skema PD belum ada; jalankan "Reset & isi data demo" lebih dulu');

  await buatReviewer(profil);
  await buatProposalBerbobot(profil, periodeId, pd.id, pt.id);

  // satu versi (V1) tiap proposal dengan templat dan basis aturan periode itu (versi terendah = basis dasar periode)
  await db.execute(sql`
    INSERT INTO versi_proposal (proposal_id, nomor, kode, templat_id, basis_aturan_id, judul_dokumen, status_pemeriksaan)
    SELECT p.id, 1, 'V1',
           (SELECT t.id FROM templat_proposal t WHERE t.skema_id = p.skema_id AND t.status = 'Terbit' ORDER BY (t.periode_berlaku_id = p.periode_id) DESC, t.versi DESC LIMIT 1),
           (SELECT b.id FROM basis_aturan b WHERE b.skema_id = p.skema_id AND b.periode_id = p.periode_id ORDER BY b.versi LIMIT 1),
           p.judul, 'Selesai'
    FROM proposal p WHERE p.periode_id = ${periodeId}::uuid AND p.id_proposal LIKE ${profil.awalanIdProposal + "%"}`);
  await salinNaskahContoh(periodeId, profil.awalanIdProposal);
  // Tabel yang baru diisi massal: VACUUM ANALYZE menetapkan hint bit dan statistik sekarang (di waktu persiapan), bukan pada klik pertama
  // di J-04 (pembacaan pertama sesudah tulis massal di Neon bisa jauh lebih lambat dan sulit diduga).
  await db.execute(sql`VACUUM ANALYZE proposal`);
  await db.execute(sql`VACUUM ANALYZE versi_proposal`);
  await db.execute(sql`VACUUM ANALYZE akun`);
}

/** Proposal profil pada periode (berdasarkan awalan id), sebagai subkueri id. */
const proposalProfil = (profil: ProfilSkala, periodeId: string) =>
  sql`SELECT id FROM proposal WHERE periode_id = ${periodeId} AND id_proposal LIKE ${profil.awalanIdProposal + "%"}`;

/** Hapus seluruh data profil (proposal berawalan profil beserta penugasannya, akun reviewer dan pengusul massal). */
async function hapusDataProfil(profil: ProfilSkala, periodeId: string): Promise<void> {
  const db = getDb();
  await db.execute(sql`DELETE FROM penugasan_reviewer WHERE proposal_id IN (${proposalProfil(profil, periodeId)})`);
  await db.execute(sql`DELETE FROM proposal WHERE id IN (${proposalProfil(profil, periodeId)})`);
  await db.delete(s.akun).where(sql`${s.akun.idBima} like ${profil.awalanReviewer + "%"} or ${s.akun.idBima} like ${profil.awalanPengusul + "%"}`);
  await db.delete(s.bimaReviewer).where(like(s.bimaReviewer.idBima, `${profil.awalanReviewer}%`));
  await db.delete(s.bimaAkun).where(like(s.bimaAkun.idBima, `${profil.awalanReviewer}%`));
}

/**
 * Menyiapkan data profil pada periodenya (Seleksi Pendanaan 2026, dibuat seed) dan mengaktifkannya untuk J-04. Data massal dibuat bila
 * belum lengkap (sekali; sesudah itu hanya penugasan dan kotak masuk BIMA proposal profil yang dikosongkan), lalu: batas beban bawaan,
 * masa penilaian belum dimulai (bawaan 7 hari, 2 jam, 5,17 menit), dan kesediaan reviewer massal sesuai profil. Masa pengusulan 2026
 * ditutup menurut tanggalnya sendiri; sakelar masa pengusulan (periode berjalan 2027) tidak disentuh.
 */
export async function siapkanProfilSkala(profil: ProfilSkala): Promise<HasilSiapkanSkala> {
  const db = getDb();
  const mulai = Date.now();
  const [periode] = await db.select().from(s.periodeSeleksi).where(eq(s.periodeSeleksi.nama, profil.namaPeriode));
  if (!periode) throw new Error(`periode "${profil.namaPeriode}" belum ada; jalankan "Reset & isi data demo" lebih dulu`);

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.proposal).where(and(eq(s.proposal.periodeId, periode.id), like(s.proposal.idProposal, `${profil.awalanIdProposal}%`)));
  const [{ r }] = await db.select({ r: sql<number>`count(*)::int` }).from(s.akun).where(like(s.akun.idBima, `${profil.awalanReviewer}%`));
  const dibuatBaru = n !== profil.jumlahProposal || r !== profil.jumlahReviewer || !(await hasilProfilUtuh(periode.id, profil.awalanIdProposal));
  if (dibuatBaru) {
    // data kosong, rusak, sebagian, atau hasil pemeriksaannya tidak utuh: bangun ulang dari nol (hanya data berawalan profil)
    await hapusDataProfil(profil, periode.id);
    await buatDataMassal(profil, periode.id);
  }
  const waktuBuatMs = dibuatBaru ? Date.now() - mulai : 0;

  const mulaiAtur = Date.now();
  await db.execute(sql`DELETE FROM penugasan_reviewer WHERE proposal_id IN (${proposalProfil(profil, periode.id)})`);
  await db.execute(sql`DELETE FROM bima_kotak_masuk WHERE jenis = 'penugasan' AND id_proposal LIKE ${profil.awalanIdProposal + "%"}`);
  // buang baris mati hasil percobaan sebelumnya dan segarkan statistik sekarang, supaya Susun/Tetapkan pertama tidak menanggungnya
  await db.execute(sql`VACUUM ANALYZE penugasan_reviewer`);
  await db.execute(sql`VACUUM ANALYZE bima_kotak_masuk`);
  await db
    .update(s.periodeSeleksi)
    // penugasan dikosongkan: masa penilaian belum dimulai lagi dan kembali ke bawaan (7 hari, 2 jam per hari, 5,17 menit per proposal);
    // tanggal tutup dijaga tetap lampau
    .set({
      batasBebanReviewer: profil.batasBawaan,
      tanggalTutup: new Date(Math.min(periode.tanggalTutup.getTime(), Date.now() - 86_400_000)),
      mulaiPenilaian: null,
      batasPenilaian: null,
      lamaPenilaianHari: 7,
      jamReviewerPerHari: 2,
      menitPerProposal: 5.17,
    })
    .where(eq(s.periodeSeleksi.id, periode.id));
  await pasangKesediaan(profil);
  await setPeriodeAktif(periode.id);
  const waktuAturMs = Date.now() - mulaiAtur;

  await catatLogAudit({ aktor: "demo", aksi: "demo.contoh_1200", objek: `periode:${periode.id}`, rincian: { dibuatBaru, waktuBuatMs, waktuAturMs, proposal: profil.jumlahProposal } });
  return { periodeId: periode.id, dibuatBaru, waktuBuatMs, waktuAturMs };
}

/** Skenario UC-03 bawaan: 1.200 proposal Terkirim periode 2026, reviewer contoh ikut dibagi. */
export const siapkanContoh1200 = () => siapkanProfilSkala(PROFIL.contoh1200);

/**
 * Penugasan proposal profil milik reviewer contoh yang dapat masuk (reviewer-1..5, dari skenario J-04b "ditetapkan") yang belum dinilai
 * dikosongkan, supaya J-07 reviewer contoh kembali ke proposal contoh. Penugasan reviewer massal (data J-05) tidak disentuh.
 */
export async function kosongkanPenugasanContoh1200(): Promise<void> {
  const db = getDb();
  const profil = PROFIL.contoh1200;
  const [p] = await db.select({ id: s.periodeSeleksi.id }).from(s.periodeSeleksi).where(eq(s.periodeSeleksi.nama, profil.namaPeriode));
  if (!p) return;
  await db.execute(sql`
    DELETE FROM penugasan_reviewer pr WHERE pr.proposal_id IN (${proposalProfil(profil, p.id)})
      AND pr.reviewer_id IN (SELECT id FROM akun WHERE id_bima IN (SELECT jsonb_array_elements_text(${JSON.stringify(profil.reviewerContoh)}::jsonb)))
      AND NOT EXISTS (SELECT 1 FROM penilaian pl WHERE pl.penugasan_id = pr.id)`);
  // pesan BIMA hanya dibuang untuk proposal yang penugasannya ikut terhapus (penugasan berpenilaian tetap tercatat di kedua sisi)
  await db.execute(sql`
    DELETE FROM bima_kotak_masuk km WHERE km.jenis = 'penugasan' AND km.id_proposal LIKE ${profil.awalanIdProposal + "%"}
      AND NOT EXISTS (SELECT 1 FROM penugasan_reviewer pr JOIN proposal p ON p.id = pr.proposal_id WHERE p.id_proposal = km.id_proposal)`);
}
