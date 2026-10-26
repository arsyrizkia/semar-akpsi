/**
 * Skema basis data SEMAR (Neon Postgres, Drizzle).
 * Mengikuti docs/model-data-dan-aturan.md; semua penyimpangan dicatat di docs/perubahan-model.md.
 * Tabel berawalan bima_ adalah sisi BIMA tiruan (sistem eksternal), terpisah dari tabel SEMAR.
 * FILE KONTRAK: tidak boleh diubah oleh agen paralel.
 */
import {
  bigserial,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const bytea = customType<{ data: Buffer; driverData: Buffer | string }>({
  dataType() {
    return "bytea";
  },
  fromDriver(v) {
    if (Buffer.isBuffer(v)) return v;
    const s = String(v);
    return s.startsWith("\\x") ? Buffer.from(s.slice(2), "hex") : Buffer.from(s, "binary");
  },
});

const waktu = (nama: string) => timestamp(nama, { withTimezone: true, mode: "date" });
const pk = () => uuid("id").defaultRandom().primaryKey();

/* ------------------------------ enum ------------------------------ */
export const peranEnum = pgEnum("peran", ["tim_kerja", "pengusul", "reviewer"]);
export const hakAksesEnum = pgEnum("hak_akses", ["pengelola", "anggota"]);
export const statusTemplatEnum = pgEnum("status_templat", ["Draf", "Terbit", "Arsip"]);
export const statusButirEnum = pgEnum("status_butir", ["Draf", "Aktif", "Perlu ditinjau", "Nonaktif"]);
export const jenisButirEnum = pgEnum("jenis_butir", ["deterministik", "semantik"]);
export const asalButirEnum = pgEnum("asal_butir", ["templat", "manual"]);
export const statusProposalEnum = pgEnum("status_proposal", [
  "Belum diajukan",
  "Sedang diperiksa",
  "Terkirim",
  "Ditahan",
  "Ditolak",
]);
export const statusHasilEnum = pgEnum("status_hasil", [
  "Lolos",
  "Gagal",
  "Memenuhi",
  "Tidak memenuhi",
  "Perlu diperiksa manual",
  "Belum ada rekomendasi",
]);
export const statusPenugasanEnum = pgEnum("status_penugasan", ["Diusulkan", "Ditetapkan", "Selesai"]);
export const labelPenugasanEnum = pgEnum("label_penugasan", ["Baru", "Draf", "Selesai"]);
export const statusPenilaianEnum = pgEnum("status_penilaian", ["Draf", "Final"]);
export const keputusanEnum = pgEnum("keputusan", ["Memenuhi", "Tidak memenuhi"]);
export const statusJobEnum = pgEnum("status_job", ["Menunggu", "Berjalan", "Selesai", "Gagal"]);
export const masaPengusulanEnum = pgEnum("masa_pengusulan", ["berjalan", "ditutup"]);
export const penyimpananEnum = pgEnum("penyimpanan", ["blob", "db"]);

/* --------------------------- pengaturan demo --------------------------- */
export const pengaturanDemo = pgTable("pengaturan_demo", {
  id: integer("id").primaryKey().default(1),
  masaPengusulan: masaPengusulanEnum("masa_pengusulan").notNull().default("berjalan"),
  /** Pergeseran "jam demo" dalam hari terhadap waktu nyata (boleh negatif). */
  geserHari: integer("geser_hari").notNull().default(0),
  /** Periode yang dibuka J-04. Kosong = periode terbaru. Diisi skenario uji beban (10.000 proposal) agar skenario lain tidak ikut menanggung datanya. */
  periodeAktifId: uuid("periode_aktif_id"),
  diperbaruiPada: waktu("diperbarui_pada").defaultNow().notNull(),
});

/* ------------------------------ akun SEMAR ------------------------------ */
export const akun = pgTable(
  "akun",
  {
    id: pk(),
    idBima: text("id_bima").notNull(),
    nama: text("nama").notNull(),
    peran: peranEnum("peran").notNull(),
    /** hanya untuk peran tim_kerja */
    hakAkses: hakAksesEnum("hak_akses"),
    institusi: text("institusi").notNull(),
    /** nip (Tim Kerja) / nidn (Pengusul) / kode (Reviewer) */
    nomorInduk: text("nomor_induk"),
    /** kesediaan menjadi reviewer pada periode berjalan */
    bersedia: boolean("bersedia").notNull().default(true),
    bidang: text("bidang"),
    contoh: boolean("contoh").notNull().default(true),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("akun_id_bima_uq").on(t.idBima)],
);

/* --------------------------- skema & periode --------------------------- */
export const skemaPendanaan = pgTable("skema_pendanaan", {
  id: pk(),
  kode: text("kode").notNull().unique(),
  namaSkema: text("nama_skema").notNull(),
  deskripsi: text("deskripsi"),
  contoh: boolean("contoh").notNull().default(true),
});

export const periodeSeleksi = pgTable("periode_seleksi", {
  id: pk(),
  tahun: integer("tahun").notNull(),
  nama: text("nama").notNull(),
  tanggalBuka: waktu("tanggal_buka").notNull(),
  tanggalTutup: waktu("tanggal_tutup").notNull(),
  batasBebanReviewer: integer("batas_beban_reviewer").notNull().default(30),
  contoh: boolean("contoh").notNull().default(true),
  /** masa penilaian administrasi (lib/penilaian/masa.ts): lama, jam reviewer per hari, menit per proposal */
  lamaPenilaianHari: integer("lama_penilaian_hari").notNull().default(7),
  jamReviewerPerHari: real("jam_reviewer_per_hari").notNull().default(2),
  menitPerProposal: real("menit_per_proposal").notNull().default(5.17),
  /** diisi saat penugasan pertama periode ditetapkan; tenggat = akhir hari ke-lama (WIB) */
  mulaiPenilaian: waktu("mulai_penilaian"),
  batasPenilaian: waktu("batas_penilaian"),
});

/* ------------------------------ templat ------------------------------ */
export const templatProposal = pgTable(
  "templat_proposal",
  {
    id: pk(),
    skemaId: uuid("skema_id").notNull().references(() => skemaPendanaan.id),
    versi: integer("versi").notNull(),
    status: statusTemplatEnum("status").notNull().default("Draf"),
    /** Periode berlaku; null = belum ditetapkan */
    periodeBerlakuId: uuid("periode_berlaku_id").references(() => periodeSeleksi.id),
    lampiranWajib: jsonb("lampiran_wajib").$type<string[]>().notNull().default([]),
    diterbitkanPada: waktu("diterbitkan_pada"),
    dibuatOleh: uuid("dibuat_oleh").references(() => akun.id),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
    /** Kepala dokumen templat (23 Okt 2026, aditif): judul bawaan "Isian Substansi Proposal"; subjudul dan pengantar null = tanpa */
    judulDokumen: text("judul_dokumen").default("Isian Substansi Proposal"),
    subjudul: text("subjudul"),
    pengantar: text("pengantar"),
    /** TIDAK DIPAKAI sejak 24 Okt 2026 (halaman depan milik BIMA); dibiarkan agar perubahan skema aditif */
    kop: jsonb("kop").$type<unknown>(),
    /** TIDAK DIPAKAI sejak 24 Okt 2026 (templat lampiran milik BIMA, src/lib/bima/lampiran.ts) */
    lampiranTemplat: jsonb("lampiran_templat").$type<unknown>(),
  },
  (t) => [uniqueIndex("templat_skema_versi_uq").on(t.skemaId, t.versi)],
);

export const bagianTemplat = pgTable(
  "bagian_templat",
  {
    id: pk(),
    templatId: uuid("templat_id").notNull().references(() => templatProposal.id, { onDelete: "cascade" }),
    urutan: integer("urutan").notNull(),
    nama: text("nama").notNull(),
    /** null = tanpa batas kata */
    batasKata: integer("batas_kata"),
    wajib: boolean("wajib").notNull().default(true),
    /** Ketentuan bagian (23 Okt 2026, aditif; null = diturunkan dari nama bagian Isian Substansi) */
    petunjuk: text("petunjuk"),
    jenisIsian: text("jenis_isian").$type<"teks" | "daftar" | "tabel">(),
    jumlahButir: integer("jumlah_butir"),
    pemisah: text("pemisah"),
    wajibGambar: boolean("wajib_gambar"),
    sitasiBernomor: boolean("sitasi_bernomor"),
    daftarPustaka: boolean("daftar_pustaka"),
    /** Ketentuan komprehensif (24 Okt 2026, aditif): batas minimal, tabel, keterangan gambar, frasa wajib, unsur isi. Tipe "daftar_pustaka" = jenis_isian "teks" + daftar_pustaka true. */
    batasMin: integer("batas_min"),
    wajibTabel: boolean("wajib_tabel"),
    kolomTabel: jsonb("kolom_tabel").$type<string[]>(),
    judulTabel: text("judul_tabel"),
    ketGambar: text("ket_gambar"),
    frasaWajib: jsonb("frasa_wajib").$type<string[]>(),
    unsurIsi: jsonb("unsur_isi").$type<{ unsur: string; pertanyaan?: string | null; contoh?: string | null }[]>(),
  },
  (t) => [index("bagian_templat_idx").on(t.templatId, t.urutan)],
);

/* --------------------------- basis aturan & butir --------------------------- */
export const basisAturan = pgTable(
  "basis_aturan",
  {
    id: pk(),
    kode: text("kode").notNull(),
    nama: text("nama").notNull(),
    skemaId: uuid("skema_id").references(() => skemaPendanaan.id),
    periodeId: uuid("periode_id").references(() => periodeSeleksi.id),
    versi: integer("versi").notNull(),
    tanggalBerlaku: waktu("tanggal_berlaku").notNull(),
    dibuatOleh: uuid("dibuat_oleh").references(() => akun.id),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("basis_skema_versi_uq").on(t.skemaId, t.versi)],
);

export const butirCek = pgTable(
  "butir_cek",
  {
    id: pk(),
    basisAturanId: uuid("basis_aturan_id").notNull().references(() => basisAturan.id, { onDelete: "cascade" }),
    templatId: uuid("templat_id").references(() => templatProposal.id),
    kode: text("kode").notNull(),
    deskripsi: text("deskripsi").notNull(),
    jenis: jenisButirEnum("jenis").notNull(),
    asal: asalButirEnum("asal").notNull().default("manual"),
    /** Komponen borang (Tabel 5.5), mis. "2. Jumlah kata per bagian" */
    komponen: text("komponen"),
    /** Nama fungsi pemeriksa, mis. hitungKata, cekKataKunci, nilaiSemantik */
    pemeriksa: text("pemeriksa"),
    /** Parameter terstruktur: lihat ParameterButir di src/lib/kontrak/tipe.ts */
    parameter: jsonb("parameter").$type<Record<string, unknown>>(),
    /** Teks "Aturan Hitung" untuk butir deterministik (isian J-03) */
    aturanHitung: text("aturan_hitung"),
    /** Untuk butir semantik (isian J-03) */
    pertanyaan: text("pertanyaan"),
    contohJawaban: text("contoh_jawaban"),
    status: statusButirEnum("status").notNull().default("Draf"),
    urutan: integer("urutan").notNull().default(0),
    ditandaiOleh: uuid("ditandai_oleh").references(() => akun.id),
    ditandaiPada: waktu("ditandai_pada"),
  },
  (t) => [index("butir_basis_idx").on(t.basisAturanId), index("butir_kode_idx").on(t.kode)],
);

/* ------------------------------ berkas ------------------------------ */
export const berkasVersi = pgTable("berkas_versi", {
  id: pk(),
  /** pathname/url Vercel Blob; null bila disimpan di kolom bytes */
  kunci: text("kunci"),
  penyimpanan: penyimpananEnum("penyimpanan").notNull(),
  nama: text("nama").notNull(),
  tipe: text("tipe").notNull(),
  ukuran: integer("ukuran").notNull(),
  bytes: bytea("bytes"),
  /** naskah | lampiran */
  peran: text("peran").notNull().default("naskah"),
  dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
});

/* ------------------------- proposal & pemeriksaan ------------------------- */
export const proposal = pgTable(
  "proposal",
  {
    id: pk(),
    /** idProposal di BIMA (bima_proposal.id) */
    idProposal: text("id_proposal").notNull(),
    judul: text("judul").notNull(),
    skemaId: uuid("skema_id").notNull().references(() => skemaPendanaan.id),
    periodeId: uuid("periode_id").notNull().references(() => periodeSeleksi.id),
    pengusulId: uuid("pengusul_id").notNull().references(() => akun.id),
    status: statusProposalEnum("status").notNull().default("Sedang diperiksa"),
    waktuTerkirim: waktu("waktu_terkirim"),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("proposal_id_bima_uq").on(t.idProposal)],
);

export const versiProposal = pgTable(
  "versi_proposal",
  {
    id: pk(),
    proposalId: uuid("proposal_id").notNull().references(() => proposal.id, { onDelete: "cascade" }),
    nomor: integer("nomor").notNull(),
    /** kode versi pada bukti pengiriman, mis. V1 */
    kode: text("kode").notNull(),
    templatId: uuid("templat_id").references(() => templatProposal.id),
    basisAturanId: uuid("basis_aturan_id").references(() => basisAturan.id),
    berkasId: uuid("berkas_id").references(() => berkasVersi.id),
    /** { "Nama Bagian": "teks" } hasil potongPerBagian */
    teksPerBagian: jsonb("teks_per_bagian").$type<Record<string, string>>().notNull().default({}),
    kataKunci: text("kata_kunci"),
    lampiranAda: jsonb("lampiran_ada").$type<string[]>().notNull().default([]),
    /** { "Nama Lampiran": "teks hasil ekstraksi" } untuk butir semantik atas lampiran */
    teksLampiran: jsonb("teks_lampiran").$type<Record<string, string>>().notNull().default({}),
    /** judul bagian sebagaimana ditemukan di naskah, berurutan (cocokkanStrukturJudul) */
    judulBagianDitemukan: jsonb("judul_bagian_ditemukan").$type<string[]>().notNull().default([]),
    judulDokumen: text("judul_dokumen"),
    /** Pemeriksaan deterministik */
    statusPemeriksaan: text("status_pemeriksaan").notNull().default("Sedang diperiksa"),
    waktu: waktu("waktu").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("versi_proposal_nomor_uq").on(t.proposalId, t.nomor)],
);

export const hasilPemeriksaan = pgTable(
  "hasil_pemeriksaan",
  {
    id: pk(),
    versiId: uuid("versi_id").notNull().references(() => versiProposal.id, { onDelete: "cascade" }),
    butirId: uuid("butir_id").notNull().references(() => butirCek.id),
    butirKode: text("butir_kode").notNull(),
    jenis: jenisButirEnum("jenis").notNull(),
    bagian: text("bagian"),
    status: statusHasilEnum("status").notNull(),
    /** teks angka pembukti, mis. "1.240 kata dari batas 1.000" */
    angkaPembukti: text("angka_pembukti"),
    batasDilanggar: text("batas_dilanggar"),
    rekomendasi: keputusanEnum("rekomendasi"),
    kutipan: text("kutipan"),
    /** penggalan bukti lain (maks. 2) yang juga sudah diverifikasi ada di teks; disorot bersama `kutipan` di J-08 */
    kutipanLain: jsonb("kutipan_lain").$type<string[]>().notNull().default([]),
    tingkatKeyakinan: real("tingkat_keyakinan"),
    alasanSistem: text("alasan_sistem"),
    /** true bila dihasilkan mode tiruan LLM */
    tiruan: boolean("tiruan").notNull().default(false),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("hasil_versi_butir_uq").on(t.versiId, t.butirId), index("hasil_versi_idx").on(t.versiId)],
);

export const jobSemantik = pgTable("job_semantik", {
  id: pk(),
  versiId: uuid("versi_id").notNull().references(() => versiProposal.id, { onDelete: "cascade" }),
  status: statusJobEnum("status").notNull().default("Menunggu"),
  percobaan: integer("percobaan").notNull().default(0),
  galat: text("galat"),
  diantrekanPada: waktu("diantrekan_pada").defaultNow().notNull(),
  mulaiPada: waktu("mulai_pada"),
  selesaiPada: waktu("selesai_pada"),
});

/* ------------------------ penugasan & penilaian ------------------------ */
export const penugasanReviewer = pgTable(
  "penugasan_reviewer",
  {
    id: pk(),
    proposalId: uuid("proposal_id").notNull().references(() => proposal.id, { onDelete: "cascade" }),
    /** versi yang dinilai (bukaVersiDinilai) */
    versiId: uuid("versi_id").references(() => versiProposal.id),
    reviewerId: uuid("reviewer_id").notNull().references(() => akun.id),
    periodeId: uuid("periode_id").notNull().references(() => periodeSeleksi.id),
    status: statusPenugasanEnum("status").notNull().default("Diusulkan"),
    /** label J-07 */
    label: labelPenugasanEnum("label").notNull().default("Baru"),
    tanggal: waktu("tanggal").defaultNow().notNull(),
  },
  // satu reviewer per proposal per periode (Bab 10 UC-03): susun ulang mengganti usulan, tidak menambah baris kedua
  (t) => [index("penugasan_reviewer_idx").on(t.reviewerId), index("penugasan_proposal_idx").on(t.proposalId), uniqueIndex("penugasan_proposal_periode_uq").on(t.proposalId, t.periodeId)],
);

export const penilaian = pgTable("penilaian", {
  id: pk(),
  penugasanId: uuid("penugasan_id").notNull().references(() => penugasanReviewer.id, { onDelete: "cascade" }),
  status: statusPenilaianEnum("status").notNull().default("Draf"),
  /** komentar = "Umpan Balik untuk Pengusul" */
  komentar: text("komentar"),
  nilai: text("nilai"),
  dikirimKeBimaPada: waktu("dikirim_ke_bima_pada"),
  diperbaruiPada: waktu("diperbarui_pada").defaultNow().notNull(),
});

export const keputusanKomponen = pgTable(
  "keputusan_komponen",
  {
    id: pk(),
    penilaianId: uuid("penilaian_id").notNull().references(() => penilaian.id, { onDelete: "cascade" }),
    /** salah satu KOMPONEN_BORANG di src/lib/kontrak/tipe.ts */
    komponen: text("komponen").notNull(),
    keputusan: keputusanEnum("keputusan").notNull(),
  },
  (t) => [uniqueIndex("keputusan_komponen_uq").on(t.penilaianId, t.komponen)],
);

export const koreksiRekomendasi = pgTable(
  "koreksi_rekomendasi",
  {
    id: pk(),
    penilaianId: uuid("penilaian_id").notNull().references(() => penilaian.id, { onDelete: "cascade" }),
    hasilId: uuid("hasil_id").notNull().references(() => hasilPemeriksaan.id, { onDelete: "cascade" }),
    keputusanReviewer: keputusanEnum("keputusan_reviewer").notNull(),
    alasan: text("alasan").notNull(),
    jenisKekeliruan: text("jenis_kekeliruan").notNull(),
    waktuKoreksi: waktu("waktu_koreksi").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("koreksi_hasil_uq").on(t.hasilId)],
);

/* ------------------------------ lain-lain ------------------------------ */
export const dokumenContoh = pgTable("dokumen_contoh", {
  id: pk(),
  kode: text("kode").notNull().unique(),
  nama: text("nama").notNull(),
  skemaId: uuid("skema_id").references(() => skemaPendanaan.id),
  /** a | b | c */
  varian: text("varian").notNull(),
  judul: text("judul").notNull(),
  judulBima: text("judul_bima").notNull(),
  teksPerBagian: jsonb("teks_per_bagian").$type<Record<string, string>>().notNull(),
  kataKunci: text("kata_kunci"),
  lampiranAda: jsonb("lampiran_ada").$type<string[]>().notNull().default([]),
  teksLampiran: jsonb("teks_lampiran").$type<Record<string, string>>().notNull().default({}),
  judulBagianDitemukan: jsonb("judul_bagian_ditemukan").$type<string[]>().notNull().default([]),
  catatan: text("catatan"),
  label: text("label").notNull().default("contoh sementara"),
});

/**
 * Gambar di dalam isian per bagian (diagram alir, bagan, tabel bergambar) hasil ekstraksi PDF/DOCX, untuk dikirim ke Layanan LLM
 * bersama teks bagiannya. pemilik = "versi:<uuid versi_proposal>" atau "contoh:<kode dokumen_contoh>". Aditif, 26 Okt 2026.
 */
export const gambarNaskah = pgTable(
  "gambar_naskah",
  {
    id: pk(),
    pemilik: text("pemilik").notNull(),
    bagian: text("bagian").notNull(),
    urutan: integer("urutan").notNull(),
    tipe: text("tipe").notNull(),
    lebar: integer("lebar").notNull(),
    tinggi: integer("tinggi").notNull(),
    bytes: bytea("bytes").notNull(),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [index("gambar_naskah_pemilik_idx").on(t.pemilik)],
);

/**
 * PDF contoh proposal BIMA asli untuk "Uji pada Contoh" (keputusan Arsy 26 Okt 2026: empat PDF di data/uji-nyata dipakai sebagai dokumen
 * uji di produksi). Dimasukkan sekali lewat scripts/unggah-contoh-asli.ts (berkasnya tidak pernah masuk git) dan TIDAK ikut dikosongkan
 * "Reset & isi data demo"; seed mendaftarkannya ulang ke dokumen_contoh (kode pdf-asli-NN). Aditif, 26 Okt 2026.
 */
export const contohAsli = pgTable("contoh_asli", {
  id: pk(),
  /** kode dokumen_contoh, mis. pdf-asli-05 */
  kode: text("kode").notNull().unique(),
  nama: text("nama").notNull(),
  /** PD | PT */
  skemaKode: text("skema_kode").notNull(),
  namaBerkas: text("nama_berkas").notNull(),
  tipe: text("tipe").notNull(),
  ukuran: integer("ukuran").notNull(),
  bytes: bytea("bytes").notNull(),
  diunggahPada: waktu("diunggah_pada").defaultNow().notNull(),
});

/**
 * Satu kali "Uji pada Contoh" (UC-02 langkah 6): butir dan konteks templat dibekukan saat uji dimulai, hasil per dokumen per butir
 * di uji_contoh_hasil. J-03b menampilkan hasil tersimpan (tidak menguji ulang setiap kali dibuka). Aditif, 25 Okt 2026.
 */
export const ujiContoh = pgTable("uji_contoh", {
  id: pk(),
  skemaId: uuid("skema_id").notNull().references(() => skemaPendanaan.id),
  periodeId: uuid("periode_id").references(() => periodeSeleksi.id),
  templatId: uuid("templat_id").references(() => templatProposal.id),
  /** { jenis: "templat-draf" | "basis", versi, tanggalBerlaku? } */
  sumber: jsonb("sumber").$type<Record<string, unknown>>().notNull(),
  /** kode dokumen_contoh yang diuji, berurutan */
  dokumen: jsonb("dokumen").$type<string[]>().notNull(),
  /** ButirCek[] yang diuji (bukan Nonaktif) */
  butir: jsonb("butir").$type<unknown[]>().notNull(),
  /** bagian templat untuk pemeriksa deterministik */
  bagianTemplat: jsonb("bagian_templat").$type<unknown[]>().notNull(),
  status: text("status").notNull().default("Berjalan"),
  dibuatOleh: text("dibuat_oleh").notNull(),
  dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  selesaiPada: waktu("selesai_pada"),
});

export const ujiContohHasil = pgTable(
  "uji_contoh_hasil",
  {
    id: pk(),
    ujiId: uuid("uji_id").notNull().references(() => ujiContoh.id, { onDelete: "cascade" }),
    dokumenKode: text("dokumen_kode").notNull(),
    butirKode: text("butir_kode").notNull(),
    jenis: text("jenis").notNull(),
    /** HasilButirDeterministik atau HasilButirSemantik */
    hasil: jsonb("hasil").$type<Record<string, unknown>>().notNull(),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uji_contoh_hasil_uq").on(t.ujiId, t.dokumenKode, t.butirKode)],
);

/** Append-only. Pemicu basis data menolak UPDATE dan DELETE (scripts/pasang-trigger.ts). */
export const logAudit = pgTable("log_audit", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  waktu: waktu("waktu").defaultNow().notNull(),
  aktor: text("aktor").notNull(),
  aksi: text("aksi").notNull(),
  objek: text("objek"),
  rincian: jsonb("rincian").$type<Record<string, unknown>>(),
});

/* ========================== sisi BIMA tiruan ========================== */
export const bimaAkun = pgTable("bima_akun", {
  idBima: text("id_bima").primaryKey(),
  nama: text("nama").notNull(),
  peran: peranEnum("peran").notNull(),
  hakAkses: hakAksesEnum("hak_akses"),
  institusi: text("institusi").notNull(),
  nomorInduk: text("nomor_induk"),
  bersedia: boolean("bersedia").notNull().default(true),
  bidang: text("bidang"),
});

export const bimaReviewer = pgTable("bima_reviewer", {
  idBima: text("id_bima").primaryKey().references(() => bimaAkun.idBima),
  kode: text("kode").notNull(),
  nama: text("nama").notNull(),
  institusi: text("institusi").notNull(),
  bidang: text("bidang"),
  bersedia: boolean("bersedia").notNull().default(true),
});

export const bimaProposal = pgTable("bima_proposal", {
  /** idProposal, mis. PRP-2026-0001 */
  id: text("id").primaryKey(),
  judul: text("judul").notNull(),
  skemaKode: text("skema_kode").notNull(),
  pengusulIdBima: text("pengusul_id_bima").notNull().references(() => bimaAkun.idBima),
  /** Draf | Diajukan ke SEMAR | Terkirim | Ditahan | Ditolak (cermin status dari SEMAR) */
  statusBima: text("status_bima").notNull().default("Draf"),
  kataKunci: text("kata_kunci"),
  naskahBerkasId: uuid("naskah_berkas_id"),
  diperbaruiPada: waktu("diperbarui_pada").defaultNow().notNull(),
});

export const bimaBerkas = pgTable("bima_berkas", {
  id: pk(),
  proposalId: text("proposal_id").references(() => bimaProposal.id),
  kunci: text("kunci"),
  penyimpanan: penyimpananEnum("penyimpanan").notNull(),
  nama: text("nama").notNull(),
  tipe: text("tipe").notNull(),
  ukuran: integer("ukuran").notNull(),
  bytes: bytea("bytes"),
  /** naskah | lampiran */
  peran: text("peran").notNull().default("naskah"),
  /** nama lampiran wajib yang dipenuhi berkas ini, mis. "Surat Pernyataan Mitra" */
  namaLampiran: text("nama_lampiran"),
  dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
});

export const bimaKotakMasuk = pgTable("bima_kotak_masuk", {
  id: pk(),
  /** penugasan | keputusan */
  jenis: text("jenis").notNull(),
  idProposal: text("id_proposal"),
  penerimaIdBima: text("penerima_id_bima"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  diterimaPada: waktu("diterima_pada").defaultNow().notNull(),
},
(t) => [
  // idempotensi pesan BIMA tiruan: satu kunci per jenis (dipasang juga oleh scripts/pasang-trigger.ts)
  uniqueIndex("bima_kotak_masuk_kunci_uq").on(t.jenis, sql`(${t.payload}->>'kunci')`).where(sql`(${t.payload}->>'kunci') IS NOT NULL`),
]);
