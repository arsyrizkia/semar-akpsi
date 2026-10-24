/**
 * Skenario J-04 "Skala nyata": 10.000 proposal Terkirim pada satu periode yang masa pengusulannya sudah ditutup, siap dibagikan ke
 * reviewer. Data massal dibuat set-based (generate_series / INSERT ... SELECT) pada PERIODE TERSENDIRI ("Skala Nyata ...") sehingga
 * skenario lain tidak ikut menanggung 10.000 baris: J-04 hanya membukanya bila pengaturan_demo.periodeAktifId menunjuknya, dan semua
 * pembaca periode lain mengecualikan namanya. Reset & isi data demo (TRUNCATE) menghapusnya.
 *
 * Isi (semua rekaan): 40 institusi, 130 reviewer (±9% tidak bersedia; kesediaan hanya biner, belum per bidang), 4.000 pengusul (2-3 proposal
 * tiap pengusul), 10.000 proposal beserta satu versi (V1) tiap proposal; judul dari topik x pendekatan x wilayah, semuanya skema PD.
 * Hasil pemeriksaan deterministik per butir tidak dibuat untuk 10.000 proposal ini: status Terkirim berarti semua butir lolos (pembuktian
 * per butir dipertunjukkan pada proposal skenario kecil). Teks naskah juga kosong, jadi J-08 pada proposal skala nyata hanya kerangka.
 */
import { eq, like, sql } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { catatLogAudit } from "@/lib/audit";
import { NAMA_PERIODE_SKALA, setPeriodeAktif, ubahPengaturanDemo } from "@/lib/waktu";

export const JUMLAH_PROPOSAL_SKALA = 10_000;
export const JUMLAH_REVIEWER_SKALA = 130;
export const JUMLAH_PENGUSUL_SKALA = 4000;
export const JUMLAH_INSTITUSI_SKALA = 40;
/** Batas beban bawaan skenario: 10.000 / ±123 reviewer bersedia = ±81 per reviewer, jadi 100 cukup; 60 memicu kekurangan (S-1). */
export const BATAS_BEBAN_SKALA = 100;
export const NAMA_PERIODE_SKALA_LENGKAP = `${NAMA_PERIODE_SKALA} 2026 (10.000 proposal)`;
const AWALAN_ID_PROPOSAL = "SKL-2026-";
const AWALAN_REVIEWER = "rvw-skala-";
const AWALAN_PENGUSUL = "pgs-skala-";

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

/** Kesediaan reviewer skala nyata bervariasi: setiap reviewer ke-11 tidak bersedia. */
async function pasangKesediaanSkala(): Promise<void> {
  const db = getDb();
  const bersedia = sql`(substring(id_bima from '[0-9]+$')::int % 11 <> 0)`;
  await db.execute(sql`UPDATE akun SET bersedia = ${bersedia} WHERE id_bima LIKE ${AWALAN_REVIEWER + "%"}`);
  await db.execute(sql`UPDATE bima_akun SET bersedia = ${bersedia} WHERE id_bima LIKE ${AWALAN_REVIEWER + "%"}`);
  await db.execute(sql`UPDATE bima_reviewer SET bersedia = ${bersedia} WHERE id_bima LIKE ${AWALAN_REVIEWER + "%"}`);
}

async function buatDataMassal(periodeId: string): Promise<void> {
  const db = getDb();
  const [skema] = await db.select().from(s.skemaPendanaan).where(eq(s.skemaPendanaan.kode, "PD"));
  if (!skema) throw new Error('skema PD belum ada; jalankan "Reset & isi data demo" lebih dulu');
  const [templat] = await db.select({ id: s.templatProposal.id }).from(s.templatProposal).where(sql`${s.templatProposal.skemaId} = ${skema.id} and ${s.templatProposal.status} = 'Terbit'`).limit(1);
  const [basis] = await db.select({ id: s.basisAturan.id }).from(s.basisAturan).where(eq(s.basisAturan.skemaId, skema.id)).limit(1);

  // reviewer: BIMA (akun + reviewer) dan salinan SEMAR
  const reviewer = Array.from({ length: JUMLAH_REVIEWER_SKALA }, (_, k) => {
    const i = k + 1;
    return {
      idBima: `${AWALAN_REVIEWER}${nomor(i, 3)}`,
      nama: namaOrang(i, i % 4 === 0 ? "Prof." : "Dr."),
      institusi: namaInstitusiSkala(i - 1),
      nomorInduk: `RVW-S${nomor(i, 3)}`,
      bersedia: i % 11 !== 0,
      bidang: TOPIK[i % TOPIK.length],
    };
  });
  await db.insert(s.bimaAkun).values(reviewer.map((r) => ({ ...r, peran: "reviewer" as const })));
  await db.insert(s.bimaReviewer).values(reviewer.map((r) => ({ idBima: r.idBima, kode: r.nomorInduk, nama: r.nama, institusi: r.institusi, bidang: r.bidang, bersedia: r.bersedia })));
  await db.insert(s.akun).values(reviewer.map((r) => ({ ...r, peran: "reviewer" as const })));

  // pengusul (hanya sisi SEMAR; pengusul skala nyata tidak masuk lewat BIMA), set-based
  const sqlArr = (a: string[]) => sql.raw(`ARRAY[${a.map((x) => `'${x}'`).join(",")}]`);
  await db.execute(sql`
    INSERT INTO akun (id_bima, nama, peran, institusi, nomor_induk, bersedia)
    SELECT ${AWALAN_PENGUSUL} || lpad(n::text, 4, '0'),
           'Dr. ' || (${sqlArr(NAMA_DEPAN)})[1 + (n + 11) % ${NAMA_DEPAN.length}] || ' ' || (${sqlArr(NAMA_BELAKANG)})[1 + (n * 7 + 3 + (n / ${NAMA_DEPAN.length}) * 5) % ${NAMA_BELAKANG.length}],
           'pengusul', (${sqlArr(JENIS)})[1 + ((n * 17 + (n % 3) * 5) % ${JUMLAH_INSTITUSI_SKALA}) % ${JENIS.length}] || ' ' || (${sqlArr(WILAYAH)})[1 + ((n * 17 + (n % 3) * 5) % ${JUMLAH_INSTITUSI_SKALA}) % ${WILAYAH.length}] || ' Contoh',
           'NIDN-S' || lpad(n::text, 5, '0'), false
    FROM generate_series(1, ${JUMLAH_PENGUSUL_SKALA}) AS n`);

  // 10.000 proposal Terkirim + satu versi tiap proposal, set-based
  const topik = sqlArr(TOPIK);
  const pendekatan = sqlArr(PENDEKATAN);
  const wilayah = sqlArr(WILAYAH);
  await db.execute(sql`
    INSERT INTO proposal (id_proposal, judul, skema_id, periode_id, pengusul_id, status, waktu_terkirim)
    SELECT ${AWALAN_ID_PROPOSAL} || lpad(n::text, 5, '0'),
           'Penelitian ' || (${topik})[1 + n % ${TOPIK.length}] || ' dengan ' || (${pendekatan})[1 + (n / ${TOPIK.length}) % ${PENDEKATAN.length}] || ' di wilayah ' || (${wilayah})[1 + (n * 7) % ${WILAYAH.length}] || ' (skala nyata ' || lpad(n::text, 5, '0') || ')',
           ${skema.id}::uuid, ${periodeId}::uuid,
           (SELECT array_agg(id ORDER BY id_bima) FROM akun WHERE id_bima LIKE ${AWALAN_PENGUSUL + "%"})[1 + (n * 37) % ${JUMLAH_PENGUSUL_SKALA}],
           'Terkirim', now() - ((n % 240) || ' minutes')::interval
    FROM generate_series(1, ${JUMLAH_PROPOSAL_SKALA}) AS n`);
  await db.execute(sql`
    INSERT INTO versi_proposal (proposal_id, nomor, kode, templat_id, basis_aturan_id, judul_dokumen, status_pemeriksaan)
    SELECT id, 1, 'V1', ${templat?.id ?? null}::uuid, ${basis?.id ?? null}::uuid, judul, 'Selesai'
    FROM proposal WHERE periode_id = ${periodeId}::uuid`);
  // Tabel yang baru diisi massal: VACUUM ANALYZE menetapkan hint bit dan statistik sekarang (di waktu persiapan), bukan pada klik pertama
  // di J-04 (pembacaan pertama sesudah tulis massal di Neon bisa jauh lebih lambat dan sulit diduga).
  await db.execute(sql`VACUUM ANALYZE proposal`);
  await db.execute(sql`VACUUM ANALYZE versi_proposal`);
  await db.execute(sql`VACUUM ANALYZE akun`);
}

/**
 * Menyiapkan skenario skala nyata dan mengaktifkannya untuk J-04. Membuat data massal bila belum ada (sekali; sesudah itu hanya
 * mengosongkan penugasan dan kotak masuk BIMA hasil percobaan sebelumnya), lalu: masa pengusulan ditutup, batas beban bawaan, kesediaan
 * reviewer bervariasi, dan periode skala nyata dipilih sebagai periode J-04.
 */
export async function siapkanSkalaNyata(): Promise<HasilSiapkanSkala> {
  const db = getDb();
  const mulai = Date.now();
  let [periode] = await db.select().from(s.periodeSeleksi).where(eq(s.periodeSeleksi.nama, NAMA_PERIODE_SKALA_LENGKAP));
  let dibuatBaru = false;

  if (periode) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.proposal).where(eq(s.proposal.periodeId, periode.id));
    const [{ r }] = await db.select({ r: sql<number>`count(*)::int` }).from(s.akun).where(like(s.akun.idBima, `${AWALAN_REVIEWER}%`));
    if (n !== JUMLAH_PROPOSAL_SKALA || r !== JUMLAH_REVIEWER_SKALA) {
      // data rusak atau sebagian: bangun ulang dari nol
      await db.delete(s.proposal).where(eq(s.proposal.periodeId, periode.id));
      await db.delete(s.akun).where(sql`${s.akun.idBima} like ${AWALAN_REVIEWER + "%"} or ${s.akun.idBima} like ${AWALAN_PENGUSUL + "%"}`);
      await db.delete(s.bimaReviewer).where(like(s.bimaReviewer.idBima, `${AWALAN_REVIEWER}%`));
      await db.delete(s.bimaAkun).where(like(s.bimaAkun.idBima, `${AWALAN_REVIEWER}%`));
      await db.delete(s.periodeSeleksi).where(eq(s.periodeSeleksi.id, periode.id));
      periode = undefined as unknown as typeof periode;
    }
  }
  if (!periode) {
    const [utama] = await db.select().from(s.periodeSeleksi).where(sql`${s.periodeSeleksi.nama} not like ${NAMA_PERIODE_SKALA + "%"} and ${s.periodeSeleksi.tanggalBuka} <= now()`).orderBy(sql`${s.periodeSeleksi.tahun} desc, ${s.periodeSeleksi.tanggalBuka} desc`).limit(1);
    if (!utama) throw new Error('belum ada periode seleksi; jalankan "Reset & isi data demo" lebih dulu');
    // tahun sama, tanggal buka lebih awal supaya periode utama tetap "terbaru" bagi jendela lain
    [periode] = await db
      .insert(s.periodeSeleksi)
      .values({
        tahun: utama.tahun,
        nama: NAMA_PERIODE_SKALA_LENGKAP,
        tanggalBuka: new Date(utama.tanggalBuka.getTime() - 90 * 86_400_000),
        tanggalTutup: new Date(Date.now() - 60_000),
        batasBebanReviewer: BATAS_BEBAN_SKALA,
      })
      .returning();
    await buatDataMassal(periode.id);
    dibuatBaru = true;
  }
  const waktuBuatMs = dibuatBaru ? Date.now() - mulai : 0;

  const mulaiAtur = Date.now();
  await db.delete(s.penugasanReviewer).where(eq(s.penugasanReviewer.periodeId, periode.id));
  await db.execute(sql`DELETE FROM bima_kotak_masuk WHERE jenis = 'penugasan' AND id_proposal LIKE ${AWALAN_ID_PROPOSAL + "%"}`);
  // buang baris mati hasil percobaan sebelumnya dan segarkan statistik sekarang, supaya Susun/Tetapkan pertama tidak menanggungnya
  await db.execute(sql`VACUUM ANALYZE penugasan_reviewer`);
  await db.execute(sql`VACUUM ANALYZE bima_kotak_masuk`);
  await db
    .update(s.periodeSeleksi)
    .set({ batasBebanReviewer: BATAS_BEBAN_SKALA, tanggalTutup: new Date(Date.now() - 60_000) })
    .where(eq(s.periodeSeleksi.id, periode.id));
  await pasangKesediaanSkala();
  await ubahPengaturanDemo({ masaPengusulan: "ditutup" });
  await setPeriodeAktif(periode.id);
  const waktuAturMs = Date.now() - mulaiAtur;

  await catatLogAudit({
    aktor: "demo",
    aksi: "demo.skala_nyata",
    objek: `periode:${periode.id}`,
    rincian: { dibuatBaru, waktuBuatMs, waktuAturMs, proposal: JUMLAH_PROPOSAL_SKALA },
  });
  return { periodeId: periode.id, dibuatBaru, waktuBuatMs, waktuAturMs };
}
