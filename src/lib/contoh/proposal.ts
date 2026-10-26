/**
 * Pembangkit proposal contoh (semua rekaan, berlabel "contoh sementara").
 * Dipakai skrip scripts/buat-proposal-contoh.ts dan seed (tanpa akses berkas disk, aman di Vercel).
 * Struktur naskah mengikuti Isian Substansi Proposal (bagian A-H, skema Penelitian Dasar): Judul, Ringkasan, Kata Kunci, Pendahuluan,
 * Metode, Hasil yang Diharapkan, Jadwal Penelitian, Daftar Pustaka; di DOCX tiap bagian berjudul berhuruf, berkalimat petunjuk resmi,
 * dan isiannya dibungkus tanda kurung siku seperti berkas BIMA. Nama dan isi rekaan; tidak ada data dari PDF contoh asli.
 *
 * Varian:
 *  a = lolos semua butir deterministik
 *  b = gagal jumlah kata di satu bagian (Metode melebihi batas 1.000 kata)
 *  c = gagal kata kunci (4, bukan 5) dan sitasi (9 referensi, 7 dikutip)
 *  d = seperti a, topik lain; dipakai skenario reviewer (sudah Terkirim)
 *  f = gagal kata kunci karena dipisah koma (bukan titik koma), seperti contoh BIMA no. 5; dipakai demo UC-06
 *  e = naskah perbaikan varian b: topik dan judul sama, bagian Metode dalam batas (dipakai UC-05b "terkirim setelah diperbaiki")
 */
import type { Paragraph, Table } from "docx";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { BagianTemplatDto } from "@/lib/kontrak/tipe";
import { buatDokumenTemplat, gambarIsian, isiIsian, pemisahTabel, tabelJadwalTerisi, type BarisJadwal } from "../templat/dokumen";
import { bagianBawaan, kepalaBawaan, lengkapiBagian } from "../templat/isian-substansi";
import { DIAGRAM_ALIR_PNG_BASE64 } from "./aset/diagram-alir";

export type VarianContoh = "a" | "b" | "c" | "d" | "e" | "f";
const SEMUA_VARIAN: readonly string[] = ["a", "b", "c", "d", "e", "f"];
/** Varian contoh bawaan (dokumen_contoh.varian); "u" = naskah unggahan. */
export const adalahVarianContoh = (v: string): v is VarianContoh => SEMUA_VARIAN.includes(v);

export const BAGIAN_CONTOH = ["Judul", "Ringkasan", "Kata Kunci", "Pendahuluan", "Metode", "Hasil yang Diharapkan", "Jadwal Penelitian", "Daftar Pustaka"] as const;
export const LAMPIRAN_CONTOH = ["Surat Pernyataan Mitra", "Artikel Ketua Pengusul", "Surat Keterangan Mahasiswa Bimbingan"] as const;

interface Topik {
  judul: string;
  objek: string;
  metode: string;
  lokasi: string;
  luaran: string;
  masalah: string;
  kebaruan: string;
  mitra: string;
  mahasiswa: string;
  promotor: string;
  kataKunci: string[];
}

const TOPIK: Record<Exclude<VarianContoh, "e">, Topik> = {
  a: {
    judul: "Model Prediksi Curah Hujan Harian Berbasis Jaringan Saraf Tiruan untuk Wilayah Pesisir Utara",
    objek: "curah hujan harian",
    metode: "jaringan saraf tiruan berulang jenis LSTM",
    lokasi: "wilayah pesisir utara",
    luaran: "model prediksi yang tervalidasi, dua artikel jurnal, dan prototipe aplikasi peringatan dini",
    masalah: "keterbatasan akurasi prakiraan lokal pada skala harian",
    kebaruan: "penggabungan data stasiun darat dan citra satelit resolusi menengah pada satu model",
    mitra: "Badan Penanggulangan Bencana Daerah Contoh",
    mahasiswa: "Rina Kartika",
    promotor: "Dr. Sekar Anindita",
    kataKunci: ["prediksi curah hujan", "jaringan saraf tiruan", "LSTM", "wilayah pesisir", "peringatan dini"],
  },
  b: {
    judul: "Pengembangan Biokomposit Serat Pisang untuk Panel Akustik Ramah Lingkungan",
    objek: "biokomposit serat pisang",
    metode: "pencetakan tekan dengan perekat berbasis pati",
    lokasi: "laboratorium material",
    luaran: "formulasi biokomposit, satu paten sederhana, dan dua artikel jurnal",
    masalah: "ketergantungan panel akustik pada bahan sintetis yang sulit terurai",
    kebaruan: "pemanfaatan limbah batang pisang dengan perekat pati tanpa pelarut organik",
    mitra: "Perajin Panel Kayu Contoh",
    mahasiswa: "Bayu Nugroho",
    promotor: "Dr. Haris Mulyono",
    kataKunci: ["biokomposit", "serat pisang", "panel akustik", "koefisien serap bunyi", "bahan ramah lingkungan"],
  },
  c: {
    judul: "Sistem Pemantauan Kualitas Air Tambak Berbasis Sensor Murah dan Pembelajaran Mesin",
    objek: "kualitas air tambak",
    metode: "sensor murah terkalibrasi dan klasifikasi pembelajaran mesin",
    lokasi: "kawasan tambak pesisir",
    luaran: "purwarupa perangkat pemantau, set data terbuka, dan satu artikel jurnal",
    masalah: "mahalnya perangkat pemantau yang tersedia bagi pembudidaya kecil",
    kebaruan: "kalibrasi silang antarsensor murah menggunakan data referensi yang terbatas",
    mitra: "Kelompok Pembudidaya Tambak Contoh",
    mahasiswa: "Dewi Anggraini",
    promotor: "Dr. Laras Prameswari",
    kataKunci: ["kualitas air", "tambak", "sensor murah", "pembelajaran mesin"],
  },
  d: {
    judul: "Analisis Ketahanan Pangan Rumah Tangga Nelayan Kecil dengan Pemodelan Berbasis Agen",
    objek: "ketahanan pangan rumah tangga nelayan",
    metode: "pemodelan berbasis agen dan survei rumah tangga",
    lokasi: "desa nelayan pesisir selatan",
    luaran: "model simulasi, rekomendasi kebijakan desa, dan dua artikel jurnal",
    masalah: "belum adanya cara menelusuri dampak musim paceklik terhadap konsumsi pangan keluarga nelayan",
    kebaruan: "penyatuan data survei dan perilaku adaptasi rumah tangga dalam satu simulasi",
    mitra: "Koperasi Nelayan Mandiri Contoh",
    mahasiswa: "Fajar Ramadhan",
    promotor: "Dr. Sekar Anindita",
    kataKunci: ["ketahanan pangan", "nelayan kecil", "pemodelan berbasis agen", "paceklik", "adaptasi rumah tangga"],
  },
  f: {
    judul: "Pemetaan Rantai Pasok Garam Rakyat dengan Analisis Jaringan untuk Wilayah Pesisir Timur",
    objek: "rantai pasok garam rakyat",
    metode: "analisis jaringan dan wawancara pelaku usaha",
    lokasi: "sentra garam pesisir timur",
    luaran: "peta rantai pasok, rekomendasi tata niaga, dan satu artikel jurnal",
    masalah: "belum terpetakannya simpul tengkulak yang menekan harga di tingkat petambak",
    kebaruan: "penggunaan analisis jaringan sosial pada rantai pasok komoditas pesisir berskala kecil",
    mitra: "Koperasi Petambak Garam Contoh",
    mahasiswa: "Gita Maharani",
    promotor: "Dr. Haris Mulyono",
    kataKunci: ["rantai pasok", "garam rakyat", "analisis jaringan", "tata niaga", "pesisir timur"],
  },
};

const ASPEK = [
  "ketersediaan data", "kualitas pengukuran", "keterulangan hasil", "keterbatasan sumber daya", "kebutuhan pengguna",
  "tingkat ketelitian", "kesiapan lapangan", "keberlanjutan program", "kesesuaian standar", "ketepatan waktu",
  "kemudahan penggunaan", "keandalan peralatan", "keterlibatan mitra", "kesesuaian biaya",
];

const KALIMAT = [
  "Pengamatan awal menunjukkan bahwa {aspek} sangat memengaruhi mutu kajian tentang {objek} di {lokasi}.",
  "Beberapa laporan teknis menyebut bahwa {aspek} sering kali menjadi penyebab perbedaan hasil antarkajian mengenai {objek}.",
  "Oleh karena itu, tim peneliti menempatkan {aspek} sebagai pertimbangan utama saat merancang kegiatan di {lokasi}.",
  "Setiap tahapan dirancang agar {aspek} dapat dipantau secara berkala dan dicatat dalam lembar kerja bersama.",
  "Pendekatan {metode} dipilih karena mampu menjawab persoalan {aspek} tanpa menambah beban biaya yang berarti.",
  "Hasil kajian sebelumnya tentang {objek} memperlihatkan bahwa {aspek} perlu dikendalikan sejak tahap perencanaan.",
  "Untuk itu, penelitian ini menyediakan prosedur tertulis agar {aspek} dapat diperiksa ulang oleh pihak lain.",
  "Di {lokasi}, kondisi lapangan yang berubah-ubah membuat {aspek} harus ditinjau pada setiap siklus kegiatan.",
];

const SIAPA = ["Ketua pengusul", "Anggota peneliti pertama", "Anggota peneliti kedua", "Mitra"];

export function hitungKataContoh(t: string): number {
  return t.split(/\s+/).filter(Boolean).length;
}

function isiKalimat(t: Topik, mulai: number, sitasi: number[]): string {
  const i = mulai;
  let k = KALIMAT[i % KALIMAT.length]
    .replaceAll("{aspek}", ASPEK[(i * 5 + 3) % ASPEK.length])
    .replaceAll("{objek}", t.objek)
    .replaceAll("{lokasi}", t.lokasi)
    .replaceAll("{metode}", t.metode);
  if (sitasi.length && i % 3 === 0) k = k.replace(/\.$/, ` [${sitasi[(i / 3) % sitasi.length | 0]}].`);
  return k;
}

/** Menyusun paragraf: paragraf wajib (berisi muatan yang diperiksa semantik) lalu pengisi sampai mendekati target kata. */
function susunTeks(t: Topik, wajib: string[], target: number, sitasi: number[]): string {
  const paragraf = [...wajib];
  let kata = paragraf.reduce((a, p) => a + hitungKataContoh(p), 0);
  let n = 0;
  let sekarang: string[] = [];
  while (kata < target) {
    const k = isiKalimat(t, n++, sitasi);
    const kk = hitungKataContoh(k);
    if (kata + kk > target) break;
    sekarang.push(k);
    kata += kk;
    if (sekarang.length === 4) {
      paragraf.push(sekarang.join(" "));
      sekarang = [];
    }
  }
  if (sekarang.length) paragraf.push(sekarang.join(" "));
  return paragraf.join("\n\n");
}

function daftarPustaka(t: Topik, jumlah: number): string[] {
  return Array.from({ length: jumlah }, (_, i) => {
    const n = i + 1;
    return `[${n}] Penulis${n}, A., & Contoh, B. (${2015 + n}). Kajian ${ASPEK[(n * 3) % ASPEK.length]} pada ${t.objek}. Jurnal Contoh Terapan, ${10 + n}(${(n % 4) + 1}), ${n * 10}-${n * 10 + 12}.`;
  });
}

export interface DefinisiContoh {
  varian: VarianContoh;
  judul: string;
  kataKunci: string;
  /** Teks per bagian sebagaimana tercetak di naskah (Daftar Pustaka dan Kata Kunci disertakan) */
  bagian: Record<string, string>;
  jumlahPustaka: number;
  jumlahDikutip: number;
  lampiran: { nama: string; berkas: string; teks: string }[];
  topik: Topik;
}

export function susunContoh(varian: VarianContoh): DefinisiContoh {
  const t = TOPIK[varian === "e" ? "b" : varian];
  const gagalKata = varian === "b";
  const gagalSitasi = varian === "c";
  const jumlahPustaka = gagalSitasi ? 9 : 8;
  const jumlahDikutip = gagalSitasi ? 7 : 8;
  const kataKunci = t.kataKunci.join(varian === "f" ? ", " : "; ");

  const ringkasan = susunTeks(
    t,
    [
      `Urgensi: ${t.masalah} menghambat upaya pengambilan keputusan di ${t.lokasi}. Tujuan penelitian ini adalah menyusun dan menguji ${t.objek} yang dapat dipakai pemangku kepentingan setempat. Metode yang digunakan adalah ${t.metode}, dengan pengumpulan data selama dua tahun dan validasi bersama mitra. Luaran yang dijanjikan adalah ${t.luaran}.`,
    ],
    265,
    [],
  );

  const pendahuluan = susunTeks(
    t,
    [
      `Latar belakang. Persoalan ${t.objek} di ${t.lokasi} semakin penting karena ${t.masalah} [1]. Kajian terdahulu menunjukkan bahwa kebutuhan akan solusi yang terukur terus meningkat [2].`,
      `Rumusan masalah. Bagaimana ${t.objek} dapat dikaji dengan ${t.metode} sehingga hasilnya dapat dipertanggungjawabkan dan dipakai oleh ${t.mitra}? Pendekatan pemecahan masalah ditempuh melalui tiga tahap: pengumpulan data, pengembangan model, dan validasi bersama mitra [3].`,
      `State of the art dan kebaruan. Landasan kajian mengenai ${t.objek} berangkat dari temuan yang menegaskan pentingnya ketelitian pengukuran [4]. Pendekatan ${t.metode} telah dilaporkan memberikan hasil yang baik pada kondisi serupa [5]. Kajian terbaru memperlihatkan keterbatasan pada ketersediaan data dan keterulangan hasil [6], sementara kajian lain menyoroti kebutuhan pengguna akhir yang kerap terabaikan [7]. Ketua pengusul telah menerbitkan artikel yang relevan dengan topik ini${jumlahDikutip >= 8 ? " [8]" : ""}. Penelitian yang ada belum menyatukan kebutuhan lapangan dengan ketelitian metode. Kebaruan penelitian ini adalah ${t.kebaruan}.`,
      `Peta jalan. Tahun pertama berfokus pada pengumpulan data dan pembangunan dasar model. Tahun kedua berfokus pada pengujian lapangan dan penyebarluasan hasil. Tahun ketiga hingga kelima hasil diarahkan menuju penerapan oleh mitra dan perluasan ke wilayah lain.`,
    ],
    900,
    [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n <= jumlahDikutip),
  );

  const metode = susunTeks(
    t,
    [
      `Penelitian dilakukan dalam empat tahap yang digambarkan pada diagram alir penelitian (Gambar 1). Tahap pertama adalah pengumpulan data di ${t.lokasi} [2]. Tahap kedua adalah pengembangan model dengan ${t.metode} [6]. Tahap ketiga adalah pengujian, dan tahap keempat adalah penyusunan luaran.`,
      `Gambar 1. Diagram alir penelitian (contoh sementara).`,
      `Pembagian tugas. Ketua pengusul bertanggung jawab atas perancangan model dan penulisan artikel. ${SIAPA[1]} menangani pengumpulan data. ${SIAPA[2]} menangani pengujian dan analisis. ${t.mitra} menyediakan lokasi, data pendukung, dan masukan atas kebutuhan pengguna.`,
    ],
    gagalKata ? 1240 : 880,
    [2, 6],
  );

  const hasil = susunTeks(
    t,
    [`Hasil yang diharapkan berupa ${t.luaran}. Seluruh luaran akan diserahkan kepada ${t.mitra} sebagai bahan penerapan [3].`],
    300,
    [3],
  );

  const jadwal = [
    "Tahun ke-1",
    "No Nama Kegiatan Bulan",
    "1 2 3 4 5 6 7 8 9 10 11 12",
    `1. Pengumpulan data dan inventarisasi ${t.objek} (bulan 1 sampai 4)`,
    `2. Pengembangan awal model dengan ${t.metode} (bulan 3 sampai 8)`,
    "3. Pengujian tahap pertama bersama mitra (bulan 7 sampai 10)",
    "4. Penyusunan artikel dan laporan kemajuan (bulan 10 sampai 12)",
    "Tahun ke-2",
    "No Nama Kegiatan Bulan",
    "1 2 3 4 5 6 7 8 9 10 11 12",
    "1. Penyempurnaan model dan pengujian lapangan (bulan 1 sampai 6)",
    "2. Penyerahan luaran kepada mitra dan penyebarluasan (bulan 7 sampai 10)",
    "3. Penyusunan artikel akhir dan laporan akhir (bulan 10 sampai 12)",
  ].join("\n");

  const pustaka = daftarPustaka(t, jumlahPustaka).join("\n");

  const nomorSurat = (jenis: string) => `Dokumen ${jenis} - CONTOH SEMENTARA (data rekaan)`;
  const lampiran = [
    {
      nama: "Surat Pernyataan Mitra",
      berkas: "surat-pernyataan-mitra.pdf",
      teks: `${nomorSurat("Surat Pernyataan Mitra")}\nYang bertanda tangan di bawah ini, pimpinan ${t.mitra}, menyatakan bersedia menjadi mitra pada proposal berjudul "${t.judul}". Dan saya menyatakan bahwa saya tidak memiliki afiliasi atau hubungan keluarga dengan tim pengusul. Surat ini bermeterai dan ditandatangani oleh pimpinan mitra.\n[meterai] [tanda tangan pimpinan mitra]`,
    },
    {
      nama: "Artikel Ketua Pengusul",
      berkas: "artikel-ketua-pengusul.pdf",
      teks: `${nomorSurat("Artikel Ketua Pengusul")}\nJudul artikel: Kajian ${t.objek} di ${t.lokasi}. Penulis: Ketua Pengusul (first author, corresponding author). Jurnal Contoh Terapan Internasional, vol. 12, no. 3, 2024. Status: published. Jenis: artikel hasil penelitian. Tautan: https://jurnal.contoh.example/artikel/123 (rekaan).`,
    },
    {
      nama: "Surat Keterangan Mahasiswa Bimbingan",
      berkas: "surat-mahasiswa-bimbingan.pdf",
      teks: `${nomorSurat("Surat Keterangan Mahasiswa Bimbingan")}\nMenerangkan bahwa mahasiswa ${t.mahasiswa} dibimbing oleh promotor ${t.promotor} dan terlibat dalam penelitian berjudul "${t.judul}".\nDitandatangani: Ketua Program Studi (contoh sementara).`,
    },
  ];

  return {
    varian,
    judul: t.judul,
    kataKunci,
    bagian: {
      Judul: t.judul,
      Ringkasan: ringkasan,
      "Kata Kunci": kataKunci,
      Pendahuluan: pendahuluan,
      Metode: metode,
      "Hasil yang Diharapkan": hasil,
      "Jadwal Penelitian": jadwal,
      "Daftar Pustaka": pustaka,
    },
    jumlahPustaka,
    jumlahDikutip,
    lampiran,
    topik: t,
  };
}

/** rasio tinggi/lebar gambar diagram alir contoh (aset/diagram-alir.ts, 1530 x 495 px) */
const RASIO_DIAGRAM = 495 / 1530;
const rentang = (dari: number, sampai: number) => Array.from({ length: Math.max(0, sampai - dari + 1) }, (_, i) => dari + i);

/**
 * Isi baris isian satu bagian naskah contoh, dalam bentuk naskah BIMA yang diisi pengusul (4 PDF contoh): teks ditulis langsung di
 * baris isian tanpa kurung tempat isian; Jadwal Penelitian berupa tabel per tahun dengan kotak bulan berarsir; bagian yang wajib
 * bergambar memuat gambar diagram alir tepat di atas keterangan "Gambar n. ...". Null bila naskah tidak punya bagian itu.
 */
function isiBagianContoh(def: DefinisiContoh, b: BagianTemplatDto): (Paragraph | Table)[] | null {
  const teks = def.bagian[b.nama];
  if (teks === undefined) return null;
  const baris = teks.split("\n").map((x) => x.trim()).filter(Boolean);
  const o: (Paragraph | Table)[] = [];
  if (b.jenisIsian === "tabel") {
    let judul: string | null = null;
    let kegiatan: BarisJadwal[] = [];
    const tutup = () => {
      if (judul && kegiatan.length) {
        if (o.length) o.push(pemisahTabel());
        o.push(tabelJadwalTerisi(b, judul, kegiatan));
      }
      kegiatan = [];
    };
    for (const x of baris) {
      if (/^Tahun ke-\d+$/i.test(x)) {
        tutup();
        judul = x;
        continue;
      }
      const m = x.match(/^\d+\.\s*(.+?)\s*\(bulan (\d+) sampai (\d+)\)\s*$/i);
      if (m) kegiatan.push({ nama: m[1], bulan: rentang(Number(m[2]), Number(m[3])) });
    }
    tutup();
    o.push(isiIsian("", { sesudah: 0 }));
    return o;
  }
  for (const x of baris) {
    if (b.wajibGambar && /^Gambar\s+\d+\./i.test(x)) {
      o.push(gambarIsian(Buffer.from(DIAGRAM_ALIR_PNG_BASE64, "base64"), 430, RASIO_DIAGRAM, "Diagram alir penelitian"));
      o.push(isiIsian(x, { tengah: true }));
      continue;
    }
    o.push(isiIsian(x));
  }
  return o;
}

/**
 * Naskah contoh (.docx) = templat Isian Substansi resmi skema Penelitian Dasar (buatDokumenTemplat: kop berlogo, satu tabel per bagian
 * dengan kepala biru muda dan petunjuk miring, sama dengan "Unduh Templat") yang baris isiannya sudah diisi, seperti berkas yang
 * diunggah pengusul di BIMA. Dipakai naskah BIMA hasil seed dan skenario, "Unduh .docx" M-15, e2e, dan uji.
 */
export async function buatDocx(def: DefinisiContoh): Promise<Buffer> {
  const bagian = lengkapiBagian(bagianBawaan("dasar").map((b, i) => ({ ...b, urutan: i + 1 })));
  return buatDokumenTemplat({ versi: 1, status: "Terbit" }, bagian, { kode: "PD", namaSkema: "Penelitian Dasar" }, null, {
    kepala: kepalaBawaan("dasar"),
    isiBagian: (b) => isiBagianContoh(def, b),
    teksKaki: "Dokumen contoh sementara - data rekaan untuk prototipe SEMAR",
    judul: def.judul,
  });
}

export async function buatLampiranPdf(judul: string, teks: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const halaman = pdf.addPage([595, 842]);
  halaman.drawText(judul, { x: 50, y: 780, size: 16, font: bold });
  let y = 750;
  for (const para of teks.split("\n")) {
    const kata = para.split(" ");
    let baris = "";
    for (const k of kata) {
      if (font.widthOfTextAtSize(`${baris} ${k}`, 11) > 495) {
        halaman.drawText(baris, { x: 50, y, size: 11, font });
        y -= 16;
        baris = k;
      } else baris = baris ? `${baris} ${k}` : k;
    }
    halaman.drawText(baris, { x: 50, y, size: 11, font });
    y -= 22;
  }
  halaman.drawText("Contoh sementara - bukan dokumen resmi", { x: 50, y: 40, size: 9, font });
  return pdf.save();
}
