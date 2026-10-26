/**
 * Data tiruan UC-04 (J-05) berskenario untuk periode Simulasi Contoh 2026 (1.200 proposal). Murni, tanpa basis data: dari daftar
 * proposal dan kode butir dihasilkan keputusan per baris (versi gagal saat pengajuan, rekomendasi dan keyakinan tiap hasil semantik,
 * penilaian final per hari masa penilaian, koreksi reviewer), lalu demo/pemantauan.ts menulisnya secara set-based. Masa penilaian
 * administrasi singkat: 7 hari sejak penugasan ditetapkan (naskah: seleksi administrasi 2026 berlangsung delapan hari).
 *
 * PRNG berbiji (mulberry32 dari id skenario + id proposal + kode butir), jadi setiap skenario selalu menghasilkan angka yang sama; uji
 * tests/unit/kotak-putih/demo-pemantauan.test.ts memastikan angka cerita tiap skenario (mis. UNS-10 58% disetujui pada "bermasalah").
 * Kalibrasi keyakinan tidak ditulis langsung: tingkat keyakinan dipilih lebih dulu, lalu peluang dikoreksi dikalikan pengali tingkat itu.
 */
import type { JENIS_KEKELIRUAN } from "@/lib/kontrak/tipe";

export type IdSkenarioPemantauan = "awal" | "sehat" | "bermasalah" | "terlalu-ketat" | "sesudah-perbaikan" | "terlambat";
export type JenisKekeliruan = (typeof JENIS_KEKELIRUAN)[number];
export type KodeSkema = "PD" | "PT";

/** lama masa penilaian (hari); sama dengan bawaan lib/penilaian/masa.ts */
export const JUMLAH_HARI = 7;
/** porsi penilaian final per hari masa penilaian: naik di hari-hari awal, rata di tengah, sedikit turun di akhir */
export const BOBOT_HARI = [0.1, 0.14, 0.16, 0.16, 0.16, 0.15, 0.13];
/** indeks institusi pada profil contoh1200 (namaInstitusiSkala(0) = "Universitas Nusantara Contoh", 220 proposal) */
export const INSTITUSI_TERBESAR = 0;

type Bobot<K extends string> = Partial<Record<K, number>>;

export interface ParamSemantik {
  /** porsi hasil pada penilaian final yang dikoreksi reviewer */
  laju: number;
  /** porsi koreksi yang membalik Memenuhi menjadi Tidak memenuhi (sistem terlalu longgar); sisanya terlalu ketat */
  longgar: number;
  jenisLonggar: Bobot<JenisKekeliruan>;
  jenisKetat: Bobot<JenisKekeliruan>;
  /** porsi tingkat keyakinan tinggi, sedang, rendah */
  keyakinan: [number, number, number];
  /** laju koreksi relatif per tingkat keyakinan (tinggi, sedang, rendah); [1, 1, 1] = keyakinan tidak bermakna */
  pengali: [number, number, number];
  /** laju koreksi relatif per hari 1..7 */
  tren: number[];
  /** peluang rekomendasi Memenuhi bila tidak dikoreksi */
  memenuhi: number;
}

export interface SkenarioPemantauan {
  id: IdSkenarioPemantauan;
  nama: string;
  ringkas: string;
  /** jumlah penilaian final per skema */
  final: Record<KodeSkema, number>;
  /** hari masa penilaian yang sedang berjalan (awal = 1; 7 = hari terakhir) */
  hariBerjalan: number;
  /** reviewer (beban terbanyak lebih dulu) yang belum menilai sama sekali; penilaian final proposal mereka dibuang penulis */
  reviewerBelumMulai?: number;
  /** parameter per kode butir semantik (ditimpakan ke BAWAAN); kode tanpa entri memakai BAWAAN dengan laju bervariasi per kode */
  semantik: Record<string, Partial<ParamSemantik>>;
  /** peluang gagal saat pengajuan per kode butir deterministik; per institusi menimpa nilai umum */
  gagal: Record<string, number>;
  gagalInstitusi?: Record<string, Record<number, number>>;
  /** butir yang diperbaiki di tengah masa penilaian (basis aturan versi berikutnya berlaku mulai hariBerlaku) */
  perbaikan?: { skema: KodeSkema; kode: string; hariBerlaku: number; hariDitandai: number; sesudah: Partial<ParamSemantik>; deskripsiBaru: string; pertanyaanBaru: string };
}

/** urutan tampil di navigator (yang pertama = bawaan J-05 dan UC-04) */
export const ID_SKENARIO_PEMANTAUAN: IdSkenarioPemantauan[] = ["bermasalah", "terlalu-ketat", "sesudah-perbaikan", "terlambat", "sehat", "awal"];

export const BAWAAN: ParamSemantik = {
  laju: 0.05,
  longgar: 0.5,
  jenisLonggar: { "Kutipan salah tempat": 0.45, "Salah tafsir isi": 0.3, "Rekomendasi tidak relevan dengan butir": 0.15, Lainnya: 0.1 },
  jenisKetat: { "Bagian tidak ditemukan padahal ada": 0.45, "Salah tafsir isi": 0.35, "Rekomendasi tidak relevan dengan butir": 0.1, Lainnya: 0.1 },
  keyakinan: [0.6, 0.3, 0.1],
  pengali: [0.5, 1.4, 3],
  tren: [1, 1, 1, 1, 1, 1, 1],
  memenuhi: 0.82,
};

/** Gagal saat pengajuan yang lazim (pola contoh BIMA: kata kunci dipisah koma, sitasi tidak cocok, kelebihan kata). */
const GAGAL_LAZIM: Record<string, number> = {
  "KAT-01": 0.07,
  "SIT-03": 0.035,
  "KTA-02": 0.025,
  "TBL-01": 0.02,
  "SCR-02": 0.015,
  "SIT-01": 0.015,
  "KTA-03": 0.012,
  "KTA-04": 0.012,
  "GBR-01": 0.01,
};
/** peluang gagal butir deterministik lain */
export const GAGAL_LAIN = 0.002;

const UNS10_BURUK: Partial<ParamSemantik> = {
  laju: 0.42,
  longgar: 0.81,
  jenisLonggar: { "Kutipan salah tempat": 0.79, "Salah tafsir isi": 0.13, "Rekomendasi tidak relevan dengan butir": 0.08 },
  jenisKetat: { "Salah tafsir isi": 0.5, "Bagian tidak ditemukan padahal ada": 0.4, Lainnya: 0.1 },
  keyakinan: [0.78, 0.17, 0.05],
  pengali: [1, 1, 1],
};
const UNS08_SEDANG: Partial<ParamSemantik> = {
  laju: 0.24,
  longgar: 0.35,
  jenisLonggar: { "Salah tafsir isi": 0.7, "Kutipan salah tempat": 0.3 },
  jenisKetat: { "Salah tafsir isi": 0.6, "Bagian tidak ditemukan padahal ada": 0.3, Lainnya: 0.1 },
};
/** semua penugasan final (profil contoh1200: 700 PD, 500 PT) */
const FINAL_PENUH: Record<KodeSkema, number> = { PD: 700, PT: 500 };

export const SKENARIO_PEMANTAUAN: Record<IdSkenarioPemantauan, SkenarioPemantauan> = {
  awal: {
    id: "awal",
    nama: "Awal masa penilaian (1.200)",
    ringkas: "Baru 24 penilaian final Penelitian Dasar: setiap butir belum cukup data, daftar Perlu perhatian masih kosong.",
    final: { PD: 24, PT: 16 },
    hariBerjalan: 1,
    semantik: { "UNS-10": UNS10_BURUK, "UNS-08": UNS08_SEDANG },
    gagal: GAGAL_LAZIM,
  },
  sehat: {
    id: "sehat",
    nama: "Semua butir sehat (1.200)",
    ringkas: "Hari terakhir: semua 1.200 penugasan final tepat waktu; semua butir semantik di atas 90% disetujui, gagal saat pengajuan rendah.",
    final: FINAL_PENUH,
    hariBerjalan: JUMLAH_HARI,
    semantik: {},
    gagal: GAGAL_LAZIM,
  },
  bermasalah: {
    id: "bermasalah",
    nama: "Satu butir bermasalah (1.200)",
    ringkas: "Hari ke-5: UNS-10 (diagram alir Metode) hanya ±58% disetujui: sistem terlalu longgar, kutipan salah tempat, dan memburuk tiap hari. Kemajuan penilaian sesuai jadwal.",
    final: { PD: 560, PT: 400 },
    hariBerjalan: 5,
    semantik: { "UNS-10": { ...UNS10_BURUK, tren: [0.7, 0.8, 0.95, 1.05, 1.2, 1.2, 1.2] }, "UNS-08": UNS08_SEDANG },
    gagal: GAGAL_LAZIM,
  },
  "terlalu-ketat": {
    id: "terlalu-ketat",
    nama: "Aturan terlalu ketat (1.200)",
    ringkas: "Hari ke-6: KTA-04 (Metode ≤ 1.000 kata) gagal pada ±28% pengajuan, ±45% di Universitas Nusantara Contoh; UNS-09 sering dibalik reviewer menjadi Memenuhi.",
    final: { PD: 630, PT: 450 },
    hariBerjalan: 6,
    semantik: {
      "UNS-09": {
        laju: 0.3,
        longgar: 0.1,
        jenisKetat: { "Bagian tidak ditemukan padahal ada": 0.74, "Salah tafsir isi": 0.18, Lainnya: 0.08 },
        keyakinan: [0.35, 0.45, 0.2],
      },
    },
    gagal: { ...GAGAL_LAZIM, "KTA-04": 0.26 },
    gagalInstitusi: { "KTA-04": { [INSTITUSI_TERBESAR]: 0.46 } },
  },
  "sesudah-perbaikan": {
    id: "sesudah-perbaikan",
    nama: "Sesudah butir diperbaiki (1.200)",
    ringkas: "UNS-10 ditandai di hari ke-3, basis aturan versi baru berlaku mulai hari ke-4 (naskah yang belum dinilai diperiksa ulang): ±58% naik menjadi ±91% disetujui.",
    final: FINAL_PENUH,
    hariBerjalan: JUMLAH_HARI,
    semantik: { "UNS-10": UNS10_BURUK, "UNS-08": UNS08_SEDANG },
    gagal: GAGAL_LAZIM,
    perbaikan: {
      skema: "PD",
      kode: "UNS-10",
      hariBerlaku: 4,
      hariDitandai: 3,
      sesudah: { laju: 0.09, longgar: 0.5, keyakinan: [0.6, 0.3, 0.1], pengali: [0.5, 1.4, 3] },
      deskripsiBaru: "Tahapan pada diagram alir di bagian “Metode” sama urutan dan namanya dengan tahapan yang diuraikan di bagian itu",
      pertanyaanBaru:
        "Bandingkan setiap tahap yang tertulis pada diagram alir penelitian dengan tahapan yang diuraikan pada bagian Metode. Apakah urutan dan nama tahapnya sama? Abaikan keterangan gambar.",
    },
  },
  terlambat: {
    id: "terlambat",
    nama: "Penilaian terlambat (1.200)",
    ringkas: "Hari ke-6 dari 7: baru sekitar separuh penugasan final, lima reviewer belum menilai sama sekali; proyeksi ratusan penugasan belum final pada tenggat.",
    final: { PD: 420, PT: 300 },
    hariBerjalan: 6,
    reviewerBelumMulai: 5,
    semantik: {},
    gagal: GAGAL_LAZIM,
  },
};


/* ------------------------------ alasan koreksi ------------------------------ */

type AlasanArah = { longgar: string[]; ketat: string[] };
const ALASAN_UMUM: Record<JenisKekeliruan, AlasanArah> = {
  "Kutipan salah tempat": {
    longgar: [
      "Kutipan yang diajukan sistem bukan bagian yang menjawab butir ini.",
      "Kalimat yang dikutip berasal dari bagian lain, bukan dari bagian yang diperiksa.",
      "Kutipan hanya menyebut istilahnya; isi yang diminta butir tidak ada.",
    ],
    ketat: ["Sistem mengutip paragraf yang salah; isi yang diminta ada di paragraf sesudahnya."],
  },
  "Salah tafsir isi": {
    longgar: ["Uraian hanya mengulang judul butir tanpa isi yang diminta.", "Sistem menganggap rencana umum sudah cukup, padahal butir meminta rincian."],
    ketat: ["Isi bagian sudah menjawab butir bila dibaca bersama paragraf berikutnya.", "Uraian memenuhi maksud butir walau memakai istilah berbeda."],
  },
  "Bagian tidak ditemukan padahal ada": {
    longgar: ["Sistem menemukan bagian yang salah dan menilainya memenuhi."],
    ketat: ["Bagian yang dicari ada, tetapi diberi judul lain oleh pengusul.", "Isi yang diminta ada di tabel, bukan di paragraf.", "Uraian ada di subbagian yang judulnya tidak persis sama dengan templat."],
  },
  "Rekomendasi tidak relevan dengan butir": {
    longgar: ["Alasan sistem membahas hal lain, bukan yang ditanyakan butir."],
    ketat: ["Rekomendasi menilai panjang uraian, padahal butir menanyakan isinya."],
  },
  Lainnya: {
    longgar: ["Naskah memakai format lama sehingga penilaian disesuaikan manual."],
    ketat: ["Butir ini sudah dipenuhi pada lampiran yang dirujuk naskah."],
  },
};
/** alasan khas butir cerita; jenis lain memakai ALASAN_UMUM */
const ALASAN_KHAS: Record<string, Partial<Record<JenisKekeliruan, Partial<AlasanArah>>>> = {
  "UNS-10": {
    "Kutipan salah tempat": {
      longgar: [
        "Sistem mengutip keterangan gambar, bukan isi diagram; tahapan di diagram tidak sama dengan uraian Metode.",
        "Kutipan diambil dari Tinjauan Pustaka; diagram alir di Metode justru tidak memuat tahap analisis data.",
        "Keterangan gambar cocok dengan judul butir, tetapi urutan tahap di diagram berbeda dengan uraian.",
      ],
    },
    "Salah tafsir isi": { longgar: ["Diagram berisi kerangka konsep, bukan alur penelitian; sistem menganggapnya diagram alir."] },
  },
  "UNS-09": {
    "Bagian tidak ditemukan padahal ada": {
      ketat: [
        "Peta jalan disajikan sebagai gambar lima tahun di akhir Pendahuluan; sistem tidak membacanya.",
        "Peta jalan ada dalam tabel tahunan 2026–2030, bukan dalam paragraf.",
        "Pengusul menulis “roadmap” di subjudul; isinya lengkap untuk lima tahun.",
      ],
    },
  },
  "UNS-08": {
    "Salah tafsir isi": {
      ketat: ["Kebaruan dijelaskan lewat perbandingan dengan tiga penelitian terdahulu; sistem mencari kata “kebaruan”."],
      longgar: ["Sistem menganggap daftar pustaka terbaru sebagai kebaruan, padahal kebaruan penelitian tidak diuraikan."],
    },
  },
};

export function alasanKoreksi(kode: string, jenis: JenisKekeliruan, arah: "longgar" | "ketat", u: number): string {
  const pilihan = ALASAN_KHAS[kode]?.[jenis]?.[arah] ?? ALASAN_UMUM[jenis][arah];
  return pilihan[Math.min(pilihan.length - 1, Math.floor(u * pilihan.length))];
}

/* ------------------------------ PRNG ------------------------------ */

/** FNV-1a 32 bit */
function hash(teks: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < teks.length; i++) {
    h ^= teks.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: deret bilangan [0, 1) yang selalu sama untuk biji yang sama */
export function acakBerbiji(biji: string): () => number {
  let a = hash(biji);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pilihBerbobot<K extends string>(bobot: Bobot<K>, u: number): K {
  const isi = Object.entries(bobot) as [K, number][];
  const total = isi.reduce((n, [, b]) => n + b, 0);
  let jalan = u * total;
  for (const [k, b] of isi) {
    jalan -= b;
    if (jalan < 0) return k;
  }
  return isi[isi.length - 1][0];
}

/* ------------------------------ pembangkit ------------------------------ */

export interface ProposalSim {
  idProposal: string;
  skema: KodeSkema;
  /** indeks institusi profil contoh1200 */
  institusi: number;
}

export type ButirSim = Record<KodeSkema, { semantik: string[]; deterministik: string[] }>;

export interface HasilBangkit {
  /** penilaian final: hari 1..7 masa penilaian, menit = menit sejak 08.00 WIB hari itu (sampai 21.59) */
  final: { idProposal: string; hari: number; menit: number }[];
  /** proposal yang pernah Ditahan saat pengajuan, beserta butir deterministik yang gagal pada versi pertamanya */
  gagal: { idProposal: string; butir: string[] }[];
  /** setiap hasil semantik pada versi yang dinilai; baru = diperiksa ulang dengan basis aturan versi perbaikan */
  semantik: { idProposal: string; kode: string; memenuhi: boolean; keyakinan: number; baru: boolean }[];
  koreksi: { idProposal: string; kode: string; keputusan: "Memenuhi" | "Tidak memenuhi"; jenis: JenisKekeliruan; alasan: string }[];
}

/** Parameter efektif satu butir: BAWAAN (laju bervariasi 0,6-1,4x per kode) ditimpa parameter skenario. */
export function paramButir(sk: SkenarioPemantauan, kode: string, versiBaru = false): ParamSemantik {
  const khusus = sk.semantik[kode];
  const variasi = 0.6 + 0.8 * acakBerbiji(`laju:${kode}`)();
  const dasar: ParamSemantik = { ...BAWAAN, laju: BAWAAN.laju * variasi, ...khusus };
  if (versiBaru && sk.perbaikan?.kode === kode) return { ...dasar, tren: BAWAAN.tren, ...sk.perbaikan.sesudah };
  return dasar;
}

const NILAI_KEYAKINAN: [number, number][] = [
  [0.8, 0.97],
  [0.55, 0.79],
  [0.3, 0.49],
];

/** Hari penilaian final untuk urutan ke-i dari n (sebaran BOBOT_HARI, dipotong di hari yang sedang berjalan). */
export function hariKe(i: number, n: number, hariBerjalan: number): number {
  const bobot = BOBOT_HARI.slice(0, hariBerjalan);
  const total = bobot.reduce((a, b) => a + b, 0);
  const posisi = ((i + 0.5) / n) * total;
  let jalan = 0;
  for (let m = 0; m < bobot.length; m++) {
    jalan += bobot[m];
    if (posisi < jalan) return m + 1;
  }
  return bobot.length;
}

export function bangkitkanPemantauan(sk: SkenarioPemantauan, proposal: ProposalSim[], butir: ButirSim): HasilBangkit {
  const hasil: HasilBangkit = { final: [], gagal: [], semantik: [], koreksi: [] };

  /* penilaian final: urutan acak berbiji (sama untuk semua skenario), N pertama per skema */
  const hariFinal = new Map<string, number>();
  for (const skema of ["PD", "PT"] as const) {
    const urut = proposal
      .filter((p) => p.skema === skema)
      .map((p) => ({ p, k: acakBerbiji(`final:${p.idProposal}`)() }))
      .sort((a, b) => a.k - b.k);
    const n = Math.min(sk.final[skema], urut.length);
    for (let i = 0; i < n; i++) {
      const hari = hariKe(i, n, sk.hariBerjalan);
      const menit = Math.floor(acakBerbiji(`jam:${urut[i].p.idProposal}`)() * 14 * 60);
      hariFinal.set(urut[i].p.idProposal, hari);
      hasil.final.push({ idProposal: urut[i].p.idProposal, hari, menit });
    }
  }

  /* pengali tren dinormalkan terhadap sebaran hari supaya laju keseluruhan tetap = laju */
  const bobotHari = BOBOT_HARI.slice(0, sk.hariBerjalan);
  const normalTren = (tren: number[]) => {
    const rata = bobotHari.reduce((n, b, m) => n + b * (tren[m] ?? 1), 0) / bobotHari.reduce((a, b) => a + b, 0);
    return rata || 1;
  };

  for (const p of proposal) {
    /* gagal saat pengajuan */
    const gagal = butir[p.skema].deterministik.filter((kode) => {
      const peluang = sk.gagalInstitusi?.[kode]?.[p.institusi] ?? sk.gagal[kode] ?? GAGAL_LAIN;
      return acakBerbiji(`${sk.id}:gagal:${p.idProposal}:${kode}`)() < peluang;
    });
    if (gagal.length) hasil.gagal.push({ idProposal: p.idProposal, butir: gagal });

    /* hasil semantik dan koreksi */
    const hari = hariFinal.get(p.idProposal);
    const perbaikan = sk.perbaikan && sk.perbaikan.skema === p.skema ? sk.perbaikan : null;
    // diperiksa ulang dengan basis baru: dinilai mulai hari berlaku, atau belum dinilai sama sekali
    const baru = !!perbaikan && (hari === undefined || hari >= perbaikan.hariBerlaku);
    for (const kode of butir[p.skema].semantik) {
      const acak = acakBerbiji(`${sk.id}:${p.idProposal}:${kode}`);
      const prm = paramButir(sk, kode, baru);
      const tingkat = pilihBerbobot({ t: prm.keyakinan[0], s: prm.keyakinan[1], r: prm.keyakinan[2] }, acak());
      const iTingkat = tingkat === "t" ? 0 : tingkat === "s" ? 1 : 2;
      const [bawah, atas] = NILAI_KEYAKINAN[iTingkat];
      const keyakinan = Math.round((bawah + acak() * (atas - bawah)) * 100) / 100;
      const pengaliTingkat = prm.pengali[iTingkat] / (prm.keyakinan[0] * prm.pengali[0] + prm.keyakinan[1] * prm.pengali[1] + prm.keyakinan[2] * prm.pengali[2]);
      const pengaliHari = hari ? (prm.tren[hari - 1] ?? 1) / normalTren(prm.tren) : 1;
      const dikoreksi = hari !== undefined && acak() < prm.laju * pengaliTingkat * pengaliHari;
      const uArah = acak();
      const uJenis = acak();
      const uAlasan = acak();
      const uMemenuhi = acak();
      if (dikoreksi) {
        const arah = uArah < prm.longgar ? "longgar" : "ketat";
        const jenis = pilihBerbobot(arah === "longgar" ? prm.jenisLonggar : prm.jenisKetat, uJenis);
        hasil.semantik.push({ idProposal: p.idProposal, kode, memenuhi: arah === "longgar", keyakinan, baru });
        hasil.koreksi.push({
          idProposal: p.idProposal,
          kode,
          keputusan: arah === "longgar" ? "Tidak memenuhi" : "Memenuhi",
          jenis,
          alasan: alasanKoreksi(kode, jenis, arah, uAlasan),
        });
      } else {
        hasil.semantik.push({ idProposal: p.idProposal, kode, memenuhi: uMemenuhi < prm.memenuhi, keyakinan, baru });
      }
    }
  }
  return hasil;
}

/** Angka pembukti untuk butir deterministik yang gagal pada versi pertama (tampil di J-05b). */
export function buktiGagal(kode: string, u: number): { angka: string; batas: string | null } {
  if (kode === "KAT-01") return { angka: "Kata kunci dipisah koma (,)", batas: "tepat 5, dipisah titik koma (;)" };
  if (kode === "KTA-04" || kode === "KTA-03") return { angka: `${(1_000 + Math.round(40 + u * 420)).toLocaleString("id-ID")} kata`, batas: "maks 1.000 kata" };
  if (kode === "KTA-02") return { angka: `${300 + Math.round(10 + u * 120)} kata`, batas: "maks 300 kata" };
  if (kode === "KTA-01") return { angka: `${20 + Math.round(1 + u * 8)} kata`, batas: "maks 20 kata" };
  if (kode === "SIT-03") return { angka: `${1 + Math.floor(u * 4)} sitasi tanpa pustaka`, batas: null };
  if (kode === "TBL-01") return { angka: "Kolom Bulan 1–12 tidak lengkap", batas: null };
  if (kode.startsWith("BGN")) return { angka: "Bagian kosong", batas: null };
  return { angka: "Tidak sesuai ketentuan", batas: null };
}
