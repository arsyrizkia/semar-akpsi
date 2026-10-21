/**
 * Pembangkit proposal contoh (semua rekaan, berlabel "contoh sementara").
 * Dipakai skrip scripts/buat-proposal-contoh.ts dan seed (tanpa akses berkas disk, aman di Vercel).
 *
 * Varian:
 *  a = lolos semua butir deterministik
 *  b = gagal jumlah kata di satu bagian (Metode melebihi batas)
 *  c = gagal kata kunci (4, bukan 5) dan sitasi (9 referensi, 7 dikutip)
 *  d = seperti a, topik lain; dipakai skenario reviewer (sudah Terkirim)
 *  e = naskah perbaikan varian b: topik dan judul sama, bagian Metode dalam batas (dipakai UC-05b "terkirim setelah diperbaiki")
 */
import { Document, Footer, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts } from "pdf-lib";

export type VarianContoh = "a" | "b" | "c" | "d" | "e";

export const BAGIAN_CONTOH = ["Ringkasan", "Pendahuluan", "Tinjauan Pustaka", "Metode", "Hasil yang Diharapkan", "Kata Kunci", "Daftar Pustaka"] as const;
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
  const kataKunci = t.kataKunci.join("; ");

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
      `State of the art dan kebaruan. Penelitian yang ada belum menyatukan kebutuhan lapangan dengan ketelitian metode. Kebaruan penelitian ini adalah ${t.kebaruan}.`,
      `Peta jalan. Tahun pertama berfokus pada pengumpulan data dan pembangunan dasar model. Tahun kedua berfokus pada pengujian lapangan dan penyebarluasan hasil. Setelah itu, hasil diarahkan menuju penerapan oleh mitra.`,
    ],
    920,
    [1, 2, 3],
  );

  const tinjauan = susunTeks(
    t,
    [
      `Landasan teori mengenai ${t.objek} berangkat dari kajian yang menegaskan pentingnya ketelitian pengukuran [4]. Pendekatan ${t.metode} telah dilaporkan memberikan hasil yang baik pada kondisi serupa [5].`,
      `Kajian terbaru memperlihatkan keterbatasan pada ketersediaan data dan keterulangan hasil [6]. Kajian lain menyoroti kebutuhan pengguna akhir yang kerap terabaikan [7]. Ketua pengusul telah menerbitkan artikel yang relevan dengan topik ini${jumlahDikutip >= 8 ? " [8]" : ""}.`,
    ],
    920,
    [4, 5, 6, 7, 8].filter((n) => n <= jumlahDikutip),
  );

  const metode = susunTeks(
    t,
    [
      `Penelitian dilakukan dalam empat tahap yang digambarkan pada diagram alir penelitian (Gambar 1). Tahap pertama adalah pengumpulan data di ${t.lokasi} [2]. Tahap kedua adalah pengembangan model dengan ${t.metode} [6]. Tahap ketiga adalah pengujian, dan tahap keempat adalah penyusunan luaran.`,
      `Gambar 1. Diagram alir penelitian (contoh sementara).`,
      `Pembagian tugas. Ketua pengusul bertanggung jawab atas perancangan model dan penulisan artikel. ${SIAPA[1]} menangani pengumpulan data. ${SIAPA[2]} menangani pengujian dan analisis. ${t.mitra} menyediakan lokasi, data pendukung, dan masukan atas kebutuhan pengguna.`,
    ],
    gagalKata ? 1340 : 1100,
    [2, 6],
  );

  const hasil = susunTeks(
    t,
    [`Hasil yang diharapkan berupa ${t.luaran}. Seluruh luaran akan diserahkan kepada ${t.mitra} sebagai bahan penerapan [3].`],
    400,
    [3],
  );

  const pustaka = daftarPustaka(t, jumlahPustaka).join("\n");

  const nomorSurat = (jenis: string) => `Dokumen ${jenis} - CONTOH SEMENTARA (data rekaan)`;
  const lampiran = [
    {
      nama: "Surat Pernyataan Mitra",
      berkas: "surat-pernyataan-mitra.pdf",
      teks: `${nomorSurat("Surat Pernyataan Mitra")}\nYang bertanda tangan di bawah ini, pimpinan ${t.mitra}, menyatakan bersedia menjadi mitra pada proposal berjudul "${t.judul}". Mitra tidak berafiliasi dengan institusi pengusul. Surat ini bermeterai dan ditandatangani oleh pimpinan mitra.\n[meterai] [tanda tangan pimpinan mitra]`,
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
      Ringkasan: ringkasan,
      Pendahuluan: pendahuluan,
      "Tinjauan Pustaka": tinjauan,
      Metode: metode,
      "Hasil yang Diharapkan": hasil,
      "Kata Kunci": kataKunci,
      "Daftar Pustaka": pustaka,
    },
    jumlahPustaka,
    jumlahDikutip,
    lampiran,
    topik: t,
  };
}

export async function buatDocx(def: DefinisiContoh): Promise<Buffer> {
  const anak: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(def.judul)] }),
  ];
  for (const nama of BAGIAN_CONTOH) {
    anak.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(nama)] }));
    for (const baris of def.bagian[nama].split("\n")) {
      if (baris.trim()) anak.push(new Paragraph({ children: [new TextRun(baris)] }));
    }
  }
  const doc = new Document({
    creator: "SEMAR (contoh sementara)",
    title: def.judul,
    sections: [
      {
        footers: {
          default: new Footer({
            children: [new Paragraph({ children: [new TextRun({ text: "Dokumen contoh sementara - data rekaan untuk prototipe SEMAR", size: 16 })] })],
          }),
        },
        children: anak,
      },
    ],
  });
  return Packer.toBuffer(doc);
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
