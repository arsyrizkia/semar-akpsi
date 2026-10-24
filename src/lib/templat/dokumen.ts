/**
 * Generator templat proposal (.docx), dipakai unduhan J-02 (per versi), J-02b (pratinjau draf), dan BIMA pengajuan (templat Terbit).
 * Murni: tanpa basis data. Meniru tampilan ekspor BIMA (contoh no. 1, 5, 6, 10; putaran 2, 23 Okt 2026):
 *  1. halaman depan (mode "paket", font Roboto): kop berlogo dan bergaris, kalimat proteksi persis contoh, "PROPOSAL PENELITIAN" putih di atas
 *     hitam, lalu bagian 1-6 sebagai tabel kosong (judul, tiga tabel klasifikasi, identitas, mitra, luaran, bidang strategis, anggaran);
 *  2. Isian Substansi (Avenir Next LT Pro dan Calibri): kepala berlogo (judul, subjudul skema, pengantar miring) dan garis, lalu tiap bagian
 *     A-H sebagai tabel satu kolom: baris kepala berlatar biru muda ("A. JUDUL" tebal + petunjuk miring) dan baris isian berbingkai
 *     ("[ ]", "[kata kunci 1; ...]", tabel "Tahun ke-1", "[1] ", "[Sisipkan diagram alir ...]");
 *  3. satu halaman per templat lampiran (mode "paket", Times New Roman): kop, judul, isian label | ":" | isian, blok tanda tangan di kanan.
 * Skema, periode, dan versi templat ada di kaki halaman (dan properti dokumen), bukan di badan.
 * Berkas dapat dibaca balik oleh `potongPerBagian` (src/lib/pengajuan/potong.ts) dengan bagian yang sama (uji round-trip): judul bagian ada di
 * dalam sel tabel dan dibuka oleh `blokDariHtml`; bagian depan dan lampiran tidak ikut terpotong sebagai isian. Kalimat petunjuk, "[ ]", dan
 * "[Sisipkan ...]" tidak dihitung `hitungKata`. Logo disematkan dari src/lib/templat/aset/logo-kementerian.ts.
 */
import { AlignmentType, BorderStyle, Document, Footer, HeadingLevel, HeightRule, ImageRun, LineRuleType, Packer, Paragraph, ShadingType, Tab, TabStopType, Table, TableCell, TableLayoutType, TableRow, TextRun, VerticalAlign, VerticalMergeType, WidthType } from "docx";
import type { BagianTemplatDto, KepalaTemplatDto } from "@/lib/kontrak/tipe";
import { normalisasiJudul } from "@/lib/pemeriksa/deterministik/teks";
import { JUDUL_DOKUMEN_BAWAAN, PENGANTAR_ISIAN_SUBSTANSI, TEMPAT_ISIAN, adalahDaftarPustaka, judulBerhuruf, keteranganGambar, kolomTerisi, lengkapiBagian, petunjukBagian } from "./isian-substansi";
import { judulBlokTahun, pecahKotak, uraiKolomRentang, type KolomRentang } from "./kolom-rentang";
import { LOGO_KEMENTERIAN_BASE64 } from "./aset/logo-kementerian";
import { BAGIAN_DEPAN, KOP_BAWAAN, labelIsian, lampiranDariBaris, type KopTemplat, type LampiranTemplat } from "./paket";

export interface IdentitasTemplatDokumen {
  versi: number;
  status: "Draf" | "Terbit" | "Arsip";
}
export interface SkemaDokumen {
  kode: string;
  namaSkema: string;
}
export interface PeriodeDokumen {
  nama: string;
  tahun?: number;
}

/** Bagian paket di luar data bagian templat; semua opsional (kosong = bawaan). */
export interface PaketDokumen {
  kepala?: KepalaTemplatDto | null;
  kop?: KopTemplat | null;
  lampiranTemplat?: LampiranTemplat[] | null;
  /** "paket" (bawaan): halaman depan + Isian Substansi + lampiran; "isian": hanya Isian Substansi A-H */
  mode?: "paket" | "isian";
}

export const BAGIAN_WAJIB_DOKUMEN = ["Kata Kunci", "Daftar Pustaka"] as const;
export const TIPE_DOCX_TEMPLAT = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Bagian yang benar-benar menjadi Heading 1 di berkas: bagian templat berurutan + "Kata Kunci" dan "Daftar Pustaka" bila belum ada. */
export function bagianDokumen(bagian: BagianTemplatDto[]): BagianTemplatDto[] {
  const urut = [...bagian].sort((a, b) => a.urutan - b.urutan);
  const ada = new Set(urut.map((b) => normalisasiJudul(b.nama)));
  let n = urut.reduce((m, b) => Math.max(m, b.urutan), 0);
  for (const nama of BAGIAN_WAJIB_DOKUMEN) {
    if (!ada.has(normalisasiJudul(nama))) urut.push({ urutan: ++n, nama, batasKata: null, wajib: true });
  }
  return urut;
}

/** Kalimat di bawah judul bagian: petunjuk tersimpan atau resmi; null bila bagian tanpa petunjuk. */
export function panduanBagian(b: Pick<BagianTemplatDto, "nama" | "batasKata"> & { petunjuk?: string | null }): string | null {
  return petunjukBagian(b);
}

/** Nama berkas unduhan yang bermakna, mis. "Templat-PD-v3-Terbit.docx" (paket) atau "Isian-Substansi-PD-v3-Terbit.docx". */
export function namaBerkasTemplat(skema: Pick<SkemaDokumen, "kode">, templat: IdentitasTemplatDokumen, mode: "paket" | "isian" = "paket"): string {
  const kode = skema.kode.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "skema";
  return `${mode === "isian" ? "Isian-Substansi" : "Templat"}-${kode}-v${templat.versi}-${templat.status}.docx`;
}

/* ------------------------------ tata letak (meniru contoh BIMA) ------------------------------ */

const FONT_ISIAN_JUDUL = "Avenir Next LT Pro";
const FONT_ISIAN = "Calibri";
const FONT_DEPAN = "Roboto";
const FONT_DEPAN_MEDIUM = "Roboto Medium";
const FONT_SURAT = "Times New Roman";
/** Latar baris kepala bagian Isian Substansi, diukur dari piksel dominan halaman 1 contoh no. 1 (RGB 189,214,238). */
const BIRU_MUDA = "BDD6EE";
const HITAM = "000000";

const garis = (ukuran = 4, warna = HITAM) => ({ style: BorderStyle.SINGLE, size: ukuran, color: warna }) as const;
const TANPA_GARIS = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const BINGKAI = { top: garis(), bottom: garis(), left: garis(), right: garis() };
const TANPA_BINGKAI = { top: TANPA_GARIS, bottom: TANPA_GARIS, left: TANPA_GARIS, right: TANPA_GARIS };
const TABEL_TANPA_GARIS = { ...TANPA_BINGKAI, insideHorizontal: TANPA_GARIS, insideVertical: TANPA_GARIS };

interface OpsiTeks {
  font?: string;
  ukuran?: number;
  tebal?: boolean;
  miring?: boolean;
  warna?: string;
  latar?: string;
}
interface OpsiParagraf extends OpsiTeks {
  tengah?: boolean;
  kanan?: boolean;
  rataPenuh?: boolean;
  sesudah?: number;
  sebelum?: number;
  indentKiri?: number;
  indentKanan?: number;
  halamanBaru?: boolean;
  garisBawah?: boolean;
  /** tebal garis bawah (per delapan poin); bawaan 12 */
  tebalGaris?: number;
  /** tinggi baris pasti (twip): meniru jarak baris contoh yang terukur */
  barisPasti?: number;
  judul?: boolean;
  jagaDenganBerikut?: boolean;
}

const run = (teks: string, o: OpsiTeks) =>
  new TextRun({
    text: teks,
    font: o.font,
    size: o.ukuran,
    bold: o.tebal,
    italics: o.miring,
    color: o.warna,
    shading: o.latar ? { type: ShadingType.CLEAR, fill: o.latar, color: "auto" } : undefined,
  });

function para(isi: string | TextRun[], o: OpsiParagraf = {}): Paragraph {
  return new Paragraph({
    heading: o.judul ? HeadingLevel.HEADING_1 : undefined,
    alignment: o.tengah ? AlignmentType.CENTER : o.kanan ? AlignmentType.RIGHT : o.rataPenuh ? AlignmentType.JUSTIFIED : undefined,
    pageBreakBefore: o.halamanBaru,
    keepNext: o.jagaDenganBerikut,
    spacing: { after: o.sesudah ?? 0, before: o.sebelum ?? 0, ...(o.barisPasti ? { line: o.barisPasti, lineRule: LineRuleType.EXACT } : {}) },
    indent: o.indentKiri || o.indentKanan ? { left: o.indentKiri, right: o.indentKanan } : undefined,
    border: o.garisBawah ? { bottom: garis(o.tebalGaris ?? 12) } : undefined,
    // tanda paragraf ikut ukuran huruf supaya paragraf kosong (garis pemisah) tidak membengkak ke ukuran bawaan
    run: o.ukuran ? { size: o.ukuran } : undefined,
    children: typeof isi === "string" ? [run(isi, o)] : isi,
  });
}

interface OpsiSel {
  lebar: number;
  isi: (Paragraph | Table)[];
  latar?: string;
  bingkai?: boolean;
  span?: number;
  /** garis tipis di bawah sel tanpa bingkai (garis kop halaman depan) */
  garisBawah?: number;
  margin?: { atas: number; bawah: number; kiri: number; kanan: number };
  tengahVertikal?: boolean;
}
const sel = (o: OpsiSel) =>
  new TableCell({
    width: { size: o.lebar, type: WidthType.DXA },
    columnSpan: o.span,
    borders: o.bingkai === false ? (o.garisBawah ? { ...TANPA_BINGKAI, bottom: garis(o.garisBawah) } : TANPA_BINGKAI) : BINGKAI,
    shading: o.latar ? { type: ShadingType.CLEAR, fill: o.latar, color: "auto" } : undefined,
    margins: o.margin ? { top: o.margin.atas, bottom: o.margin.bawah, left: o.margin.kiri, right: o.margin.kanan } : undefined,
    verticalAlign: o.tengahVertikal ? VerticalAlign.CENTER : undefined,
    children: o.isi,
  });

const tabelTetap = (lebar: number[], baris: TableRow[], tanpaGaris = false) =>
  new Table({
    width: { size: lebar.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: lebar,
    layout: TableLayoutType.FIXED,
    borders: tanpaGaris ? TABEL_TANPA_GARIS : undefined,
    rows: baris,
  });

/** Pembagi lebar proporsional (persen) menjadi dxa yang jumlahnya persis `total`. */
function bagiLebar(total: number, persen: number[]): number[] {
  const jumlah = persen.reduce((a, b) => a + b, 0);
  const l = persen.map((p) => Math.floor((total * p) / jumlah));
  l[l.length - 1] += total - l.reduce((a, b) => a + b, 0);
  return l;
}

/** Paragraf pemisah sangat tipis di antara dua tabel agar Word tidak menyatukannya. */
const pemisahTabel = () => new Paragraph({ spacing: { after: 0, before: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [new TextRun({ text: "", size: 2 })] });

const LOGO = () => Buffer.from(LOGO_KEMENTERIAN_BASE64, "base64");
const logo = (px: number) => new ImageRun({ type: "png", data: LOGO(), transformation: { width: px, height: px }, altText: { name: "Lambang", description: "Lambang kementerian", title: "Lambang" } });

/* ------------------------------ halaman depan (Roboto) ------------------------------ */

// ukuran terukur dari contoh no. 6 halaman 1 (pt): isi x 85 sampai 524, kop mulai y 34,5; teks kop mulai x 141
const LEBAR_DEPAN = 8786;
const M_DEPAN = { atas: 690, bawah: 1134, kiri: 1700, kanan: 1420 };
const T_DEPAN: OpsiTeks = { font: FONT_DEPAN, ukuran: 16 };
const M_SEL_DEPAN = { atas: 50, bawah: 50, kiri: 80, kanan: 80 };

/** Tabel bingkai ala ekspor BIMA: baris kepala bertengah, sejumlah baris kosong. */
function tabelDepan(kepala: string[], persen: number[], baris: number): Table {
  const w = bagiLebar(LEBAR_DEPAN, persen);
  const sl = (t: string, i: number, kepalaTabel: boolean) =>
    sel({ lebar: w[i], margin: M_SEL_DEPAN, isi: [para(t, { ...T_DEPAN, font: kepalaTabel ? FONT_DEPAN_MEDIUM : FONT_DEPAN, tengah: true })] });
  return tabelTetap(w, [
    new TableRow({ tableHeader: true, children: kepala.map((k, i) => sl(k, i, true)) }),
    ...Array.from({ length: baris }, () => new TableRow({ height: { value: 300, rule: HeightRule.ATLEAST }, children: kepala.map((_, i) => sl("", i, false)) })),
  ]);
}

const judulDepan = (teks: string) => para(teks, { ...T_DEPAN, font: FONT_DEPAN_MEDIUM, ukuran: 17, sebelum: 200, sesudah: 60, jagaDenganBerikut: true });

function bagianDepanKonten(kunci: string, nomor: number, d: (typeof BAGIAN_DEPAN)[number]): (Paragraph | Table)[] {
  const o: (Paragraph | Table)[] = [judulDepan(`${nomor}. ${d.judul}`)];
  const kalimat = () => d.penjelas && o.push(para(d.penjelas, { ...T_DEPAN, rataPenuh: true, sesudah: 60 }));
  const label = (t: string) => para(t, { ...T_DEPAN, font: FONT_DEPAN_MEDIUM, sebelum: 100, sesudah: 60, jagaDenganBerikut: true });
  switch (kunci) {
    case "judul":
      o.push(tabelTetap([LEBAR_DEPAN], [new TableRow({ height: { value: 500, rule: HeightRule.ATLEAST }, children: [sel({ lebar: LEBAR_DEPAN, margin: M_SEL_DEPAN, isi: [para("....", T_DEPAN)] })] })]));
      o.push(para("", { sesudah: 120 }));
      o.push(tabelDepan(["Bidang Fokus", "Tema", "Topik (jika ada)", "Prioritas Riset"], [25, 25, 25, 25], 1));
      o.push(para("", { sesudah: 120 }));
      o.push(tabelDepan(["Rumpun Ilmu Level 1", "Rumpun Ilmu Level 2", "Rumpun Ilmu Level 3"], [1, 1, 1], 1));
      o.push(para("", { sesudah: 120 }));
      o.push(tabelDepan(["Skema Penelitian", "Strata (Dasar/Terapan/Pengembangan)", "Nilai SBK", "Target Akhir TKT", "Lama Kegiatan"], [22, 26, 20, 16, 16], 1));
      break;
    case "luaran":
      o.push(label("Luaran Wajib"));
      o.push(tabelDepan(d.tabel, [10, 22, 26, 20, 22], 1));
      o.push(label("Luaran Tambahan"));
      o.push(tabelDepan(d.tabel, [10, 22, 26, 20, 22], 1));
      break;
    case "anggaran":
      kalimat();
      o.push(para("Total RAB .... Tahun Rp ....", { ...T_DEPAN, sebelum: 60, sesudah: 60 }));
      o.push(para("Tahun 1 Total Rp ....", { ...T_DEPAN, sesudah: 60 }));
      o.push(tabelDepan(d.tabel, [15, 16, 22, 10, 8, 15, 14], 2));
      break;
    case "identitas":
      o.push(tabelDepan(d.tabel, [28, 10, 22, 28, 12], 2));
      break;
    default:
      kalimat();
      o.push(tabelDepan(d.tabel, d.tabel.map(() => 1), 1));
  }
  return o;
}

function halamanDepan(kop: KopTemplat): (Paragraph | Table)[] {
  const o: (Paragraph | Table)[] = [];
  // logo 48 x 48 pt di kiri; kolom logo selebar 56 pt supaya teks kop mulai di x = 141 pt (margin kiri 85 pt); tanpa bantalan sel
  const wLogo = 1120;
  const baris = [kop.lembaga, kop.alamat, kop.laman].filter(Boolean);
  const NOL = { atas: 0, bawah: 0, kiri: 0, kanan: 0 };
  o.push(
    tabelTetap(
      [wLogo, LEBAR_DEPAN - wLogo],
      [
        new TableRow({
          height: { value: 960, rule: HeightRule.EXACT },
          children: [
            sel({ lebar: wLogo, bingkai: false, garisBawah: 8, margin: NOL, isi: [new Paragraph({ children: [logo(64)] })] }),
            sel({
              lebar: LEBAR_DEPAN - wLogo,
              bingkai: false,
              garisBawah: 8,
              margin: NOL,
              // tiga baris 10 pt, jarak 10,5 pt; baris pertama Medium; blok teks mulai 7,5 pt di bawah puncak logo (terukur dari contoh)
              isi: baris.map((t, i) => para(t, { font: i === 0 ? FONT_DEPAN_MEDIUM : FONT_DEPAN, ukuran: 20, barisPasti: 211, sebelum: i === 0 ? 165 : 0 })),
            }),
          ],
        }),
      ],
      true,
    ),
  );
  o.push(para("PROTEKSI ISI PROPOSAL", { ...T_DEPAN, font: FONT_DEPAN_MEDIUM, ukuran: 20, tengah: true, sebelum: 208, barisPasti: 211 }));
  // kalimat larangan: dua baris di tengah, lebar teks ±370 pt (contoh no. 6: baris pertama berakhir di "bentuk apapun")
  o.push(para(kop.proteksi, { ...T_DEPAN, ukuran: 15, tengah: true, sesudah: 0, barisPasti: 176, indentKiri: 690, indentKanan: 690 }));
  o.push(para([run(kop.judulProposal, { font: FONT_DEPAN_MEDIUM, ukuran: 20, warna: "FFFFFF", latar: HITAM })], { tengah: true, sesudah: 0, barisPasti: 211, ukuran: 20 }));
  o.push(para("Rencana Pelaksanaan Penelitian: tahun .... s.d. tahun ....", { ...T_DEPAN, font: FONT_DEPAN_MEDIUM, ukuran: 15, tengah: true, barisPasti: 176 }));
  o.push(para("NO. DOKUMEN: ....", { ...T_DEPAN, ukuran: 15, tengah: true, sesudah: 160, barisPasti: 176 }));
  BAGIAN_DEPAN.filter((d) => kop.depan[d.kunci]).forEach((d, i) => o.push(...bagianDepanKonten(d.kunci, i + 1, d)));
  return o;
}

/* ------------------------------ Isian Substansi (Avenir Next LT Pro + Calibri) ------------------------------ */

// ukuran terukur dari contoh no. 1 halaman 1 (pt): isi x 72 sampai 522,5; kepala mulai y 45; teks kepala mulai x 141
const LEBAR_ISIAN = 9026;
const M_ISIAN = { atas: 900, bawah: 1134, kiri: 1440, kanan: 1440 };
const M_SEL_ISIAN = { atas: 40, bawah: 40, kiri: 100, kanan: 100 };

function kepalaIsian(kepala: KepalaTemplatDto): (Paragraph | Table)[] {
  // logo 60 x 60 pt di kiri; kolom logo 69 pt supaya teks mulai di x = 141 pt; judul 12 pt reguler, SKEMA 12 pt tebal (jarak 14,4 pt), pengantar 9 pt miring (jarak 11 pt)
  const wLogo = 1380;
  const NOL = { atas: 0, bawah: 0, kiri: 0, kanan: 0 };
  const kanan: Paragraph[] = [para(kepala.judulDokumen, { font: FONT_ISIAN_JUDUL, ukuran: 24, barisPasti: 288 })];
  if (kepala.subjudul) kanan.push(para(kepala.subjudul, { font: FONT_ISIAN_JUDUL, ukuran: 24, tebal: true, barisPasti: 288 }));
  if (kepala.pengantar) kanan.push(para(kepala.pengantar, { font: FONT_ISIAN_JUDUL, ukuran: 18, miring: true, rataPenuh: true, barisPasti: 220 }));
  return [
    tabelTetap(
      [wLogo, LEBAR_ISIAN - wLogo],
      [
        new TableRow({
          children: [
            sel({ lebar: wLogo, bingkai: false, margin: NOL, isi: [new Paragraph({ children: [logo(80)] })] }),
            sel({ lebar: LEBAR_ISIAN - wLogo, bingkai: false, margin: NOL, isi: kanan }),
          ],
        }),
      ],
      true,
    ),
    para("", { garisBawah: true, tebalGaris: 12, sebelum: 0, sesudah: 300, ukuran: 2, barisPasti: 20 }),
  ];
}

const isiIsian = (teks: string, o: OpsiParagraf = {}) => para(teks, { font: FONT_ISIAN, ukuran: 22, rataPenuh: true, ...o });

/**
 * Tabel isian menurut kolom wajib bagian (Contract C-31, MS-10 [J11]). Kolom berbentuk rentang ("Bulan 1–12", "Bulan 1-24") menjadi kepala
 * dua tingkat gaya jadwal contoh BIMA: sel "<Nama>" menggabung kolom di atas kotak-kotak angka (gridSpan), kolom lain menggabung dua baris
 * kepala (vMerge). Rentang lebih dari 12 dipecah per tahun: satu tabel per 12 kotak ("Tahun ke-1", "Tahun ke-2", ...), sisa menjadi tabel
 * terakhir. Tanpa rentang, kolom dibagi rata dan diberi empat baris kosong. `judul` (mis. "Tahun ke-1") menjadi baris judul blok.
 */
function tabelIsian(kolomWajib: string[], judul: string | null): Table[] {
  const kolom = kolomWajib.length ? kolomWajib : ["No", "Nama Kegiatan", "Bulan 1–12"];
  const idxRentang = kolom.findIndex((k) => uraiKolomRentang(k) !== null);
  const rentang = idxRentang >= 0 ? uraiKolomRentang(kolom[idxRentang]) : null;
  if (!rentang) return [satuTabelIsian(kolom, null, 0, judul)];
  const potongan = pecahKotak(rentang.jumlah);
  return potongan.map((n, i) => satuTabelIsian(kolom, rentang, n, judulBlokTahun(judul, i + 1, potongan.length)));
}

const LEBAR_KOTAK = 505;

/** Satu tabel: `kotak` kotak angka bagi kolom rentang pertama (diberi nomor 1..kotak), kolom lain tetap. */
function satuTabelIsian(kolom: string[], rentang: KolomRentang | null, kotak: number, judul: string | null): Table {
  const nomorKolom = (k: string) => /^no\.?$/i.test(k);
  const idx = rentang ? kolom.findIndex((k) => uraiKolomRentang(k) !== null) : -1;
  const lain = kolom.filter((_, i) => i !== idx);
  const angka = Array.from({ length: kotak }, (_, i) => String(i + 1));
  // lebar dalam sel isian: lebar tabel bagian dikurangi bantalan sel kiri dan kanan (2 x 100 twip) dan sedikit ruang bingkai
  const sisa = LEBAR_ISIAN - 240 - kotak * LEBAR_KOTAK;
  const jumlahNo = lain.filter(nomorKolom).length;
  const jumlahBiasa = lain.length - jumlahNo;
  const lebarLain = lain.map((k) => (nomorKolom(k) ? 380 : Math.floor((sisa - jumlahNo * 380) / Math.max(1, jumlahBiasa))));
  if (lebarLain.length) lebarLain[lebarLain.length - 1] += sisa - lebarLain.reduce((a, b) => a + b, 0);
  // kolom rentang berada di posisinya semula di antara kolom lain
  const lebar: number[] = [];
  const urutan: ("lain" | "kotak")[] = [];
  let li = 0;
  kolom.forEach((_, i) => {
    if (i === idx) {
      for (let j = 0; j < kotak; j++) {
        lebar.push(LEBAR_KOTAK);
        urutan.push("kotak");
      }
    } else {
      lebar.push(lebarLain[li++]);
      urutan.push("lain");
    }
  });
  const m = { atas: 20, bawah: 20, kiri: 40, kanan: 40 };
  const sl = (t: string, i: number, tebal: boolean, span = 1, vm?: (typeof VerticalMergeType)[keyof typeof VerticalMergeType]) =>
    new TableCell({
      width: { size: lebar.slice(i, i + span).reduce((a, b) => a + b, 0), type: WidthType.DXA },
      columnSpan: span > 1 ? span : undefined,
      verticalMerge: vm,
      borders: BINGKAI,
      margins: { top: m.atas, bottom: m.bawah, left: m.kiri, right: m.kanan },
      children: [para(t, { font: FONT_ISIAN, ukuran: 18, tebal, tengah: span > 1 || nomorKolom(t) || !tebal })],
    });
  const baris: TableRow[] = [];
  if (judul) baris.push(new TableRow({ children: [sl(judul, 0, true, lebar.length)] }));
  if (rentang) {
    // kepala dua tingkat: kolom biasa menggabung dua baris (vMerge); kepala rentang melebar di atas kotak angka (gridSpan)
    const atas: TableCell[] = [];
    const bawah: TableCell[] = [];
    let pos = 0;
    let ki = 0;
    for (const u of urutan) {
      if (u === "lain") {
        atas.push(sl(lain[ki++], pos, true, 1, VerticalMergeType.RESTART));
        bawah.push(sl("", pos, false, 1, VerticalMergeType.CONTINUE));
        pos += 1;
      } else if (pos === urutan.indexOf("kotak")) {
        atas.push(sl(rentang.nama, pos, true, kotak));
        angka.forEach((a, j) => bawah.push(sl(a, pos + j, true)));
        pos += kotak;
      }
    }
    baris.push(new TableRow({ tableHeader: true, children: atas }), new TableRow({ tableHeader: true, children: bawah }));
  } else {
    baris.push(new TableRow({ tableHeader: true, children: lain.map((k, i) => sl(k, i, true)) }));
  }
  for (const n of [1, 2, 3, 4]) baris.push(new TableRow({ children: lebar.map((_, i) => sl(urutan[i] === "lain" && i === 0 && nomorKolom(kolom[0] ?? "") ? String(n) : "", i, false)) }));
  return tabelTetap(lebar, baris);
}

/** Tempat isian sebuah bagian menurut tipe dan ketentuannya (meniru contoh BIMA). */
function tempatIsian(b: BagianTemplatDto): (Paragraph | Table)[] {
  const o: (Paragraph | Table)[] = [];
  if (b.jenisIsian === "daftar") {
    // daftar kata kunci mengikuti contoh ("kata kunci 1"); daftar lain memakai "butir 1"
    const label = normalisasiJudul(b.nama) === "kata kunci" ? "kata kunci" : "butir";
    const butir = Array.from({ length: b.jumlahButir ?? 5 }, (_, i) => `${label} ${i + 1}`);
    o.push(isiIsian(`[${butir.join(`${b.pemisah ?? ";"} `)}]`));
  } else if (b.jenisIsian === "tabel") {
    const tabel = tabelIsian(kolomTerisi(b), b.judulTabel?.trim() || (kolomTerisi(b).length === 0 ? "Tahun ke-1" : null));
    tabel.forEach((t, i) => (i > 0 ? o.push(pemisahTabel()) : undefined, o.push(t)));
    o.push(isiIsian("", { sesudah: 0 }));
  } else if (adalahDaftarPustaka(b)) {
    o.push(isiIsian("[1] "));
  } else {
    o.push(isiIsian(TEMPAT_ISIAN));
  }
  if (b.wajibTabel && b.jenisIsian !== "tabel") {
    o.push(isiIsian("[Sisipkan tabel]", { miring: true }));
    tabelIsian(kolomTerisi(b), b.judulTabel?.trim() || null).forEach((t, i) => (i > 0 ? o.push(pemisahTabel()) : undefined, o.push(t)));
    o.push(isiIsian("", { sesudah: 0 }));
  }
  if (b.wajibGambar) o.push(isiIsian(`[Sisipkan ${keteranganGambar(b)} (JPG/PNG)]`, { miring: true }));
  return o;
}

/** Satu bagian = tabel satu kolom: baris kepala berlatar biru muda (judul berhuruf tebal + petunjuk miring) dan baris isian berbingkai. */
function tabelBagian(b: BagianTemplatDto, indeks: number): Table {
  const kepala: Paragraph[] = [para(judulBerhuruf(indeks, b.nama), { font: FONT_ISIAN_JUDUL, ukuran: 22, tebal: true })];
  const petunjuk = panduanBagian(b);
  if (petunjuk) kepala.push(para(petunjuk, { font: FONT_ISIAN_JUDUL, ukuran: 21, miring: true, rataPenuh: true }));
  return tabelTetap([LEBAR_ISIAN], [
    new TableRow({ cantSplit: true, children: [sel({ lebar: LEBAR_ISIAN, latar: BIRU_MUDA, margin: M_SEL_ISIAN, isi: kepala })] }),
    new TableRow({ children: [sel({ lebar: LEBAR_ISIAN, margin: M_SEL_ISIAN, isi: tempatIsian(b) })] }),
  ]);
}

/* ------------------------------ lampiran (gaya surat, Times New Roman) ------------------------------ */

const LEBAR_SURAT = 9072;
const M_SURAT = { atas: 1134, bawah: 1134, kiri: 1417, kanan: 1417 };
const T_SURAT: OpsiTeks = { font: FONT_SURAT, ukuran: 22 };

/** Isian surat: tabel tanpa bingkai tiga kolom (label | ":" | isian) dengan titik dua sejajar. */
function tabelLabelSurat(label: string[]): Table {
  const w = [2700, 300, LEBAR_SURAT - 3000];
  const m = { atas: 50, bawah: 50, kiri: 40, kanan: 40 };
  return tabelTetap(
    w,
    label.map(
      (x) =>
        new TableRow({
          children: [
            sel({ lebar: w[0], bingkai: false, margin: m, isi: [para(x, T_SURAT)] }),
            sel({ lebar: w[1], bingkai: false, margin: m, isi: [para(":", T_SURAT)] }),
            sel({ lebar: w[2], bingkai: false, margin: m, isi: [para("....", { ...T_SURAT, rataPenuh: true })] }),
          ],
        }),
    ),
    true,
  );
}

function halamanLampiran(l: LampiranTemplat, nomor: number): (Paragraph | Table)[] {
  const o: (Paragraph | Table)[] = [];
  if (l.jenis === "unggahan") {
    o.push(para(`LAMPIRAN ${nomor}. ${l.nama.toUpperCase()}`, { ...T_SURAT, tebal: true, judul: true, halamanBaru: true, sesudah: 120 }));
    o.push(para("Lampiran ini diunggah sebagai berkas terpisah (PDF atau DOCX) bersama naskah proposal.", { ...T_SURAT, rataPenuh: true }));
    return o;
  }
  // kop surat sebagai judul tingkat 1 supaya pembaca balik memutus bagian terakhir di sini (potongPerBagian)
  o.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      tabStops: [{ type: TabStopType.RIGHT, position: LEBAR_SURAT }],
      border: { bottom: garis(12) },
      spacing: { after: 240 },
      children: [
        run("KOP INSTANSI MITRA", { font: FONT_SURAT, ukuran: 26, tebal: true, warna: "1F2A7C" }),
        new TextRun({ children: [new Tab(), "Alamat, telepon, dan laman instansi"], font: FONT_SURAT, size: 15, color: "1F2A7C" }),
      ],
    }),
  );
  o.push(para(l.judul || l.nama.toUpperCase(), { ...T_SURAT, tebal: true, judul: true, tengah: true, sesudah: 240 }));
  for (const k of l.kalimat) {
    const label = labelIsian(k);
    if (label) {
      o.push(tabelLabelSurat(label));
      o.push(para("", { sesudah: 120 }));
    } else o.push(para(k, { ...T_SURAT, rataPenuh: true, sesudah: 120 }));
  }
  // blok tempat/tanggal, ruang tanda tangan, dan nama di kanan
  o.push(para("...., ....................", { ...T_SURAT, indentKiri: 5200, sebelum: 240, sesudah: 1000 }));
  o.push(para("Nama : ....", { ...T_SURAT, indentKiri: 5200 }));
  return o;
}

export async function buatDokumenTemplat(
  templat: IdentitasTemplatDokumen,
  bagian: BagianTemplatDto[],
  lampiran: string[],
  skema: SkemaDokumen,
  periode: PeriodeDokumen | null,
  paket: PaketDokumen = {},
): Promise<Buffer> {
  const mode = paket.mode ?? "paket";
  const kop = paket.kop ?? KOP_BAWAAN;
  const kepala: KepalaTemplatDto = paket.kepala ?? {
    judulDokumen: JUDUL_DOKUMEN_BAWAAN,
    subjudul: `SKEMA ${skema.namaSkema.toUpperCase()}`,
    pengantar: PENGANTAR_ISIAN_SUBSTANSI,
  };
  const kaki = (judulKaki: string) =>
    new Footer({
      children: [para(judulKaki, { font: FONT_ISIAN, ukuran: 14, warna: "7F7F7F", tengah: true })],
    });
  const teksKaki = `Skema: ${skema.namaSkema} (${skema.kode}) | Periode berlaku: ${periode ? `${periode.nama}${periode.tahun ? ` (${periode.tahun})` : ""}` : "belum ditetapkan"} | Versi templat: ${templat.versi} (${templat.status})`;
  const halaman = (margin: { atas: number; bawah: number; kiri: number; kanan: number }) => ({
    page: { size: { width: 11906, height: 16838 }, margin: { top: margin.atas, bottom: margin.bawah, left: margin.kiri, right: margin.kanan } },
  });

  const isian: (Paragraph | Table)[] = [...kepalaIsian(kepala)];
  lengkapiBagian(bagianDokumen(bagian)).forEach((b, i) => {
    if (i > 0) isian.push(pemisahTabel());
    isian.push(tabelBagian(b, i));
  });
  isian.push(pemisahTabel());

  const bagianDokumenDocx: { properties: ReturnType<typeof halaman>; footers: { default: Footer }; children: (Paragraph | Table)[] }[] = [];
  if (mode === "paket") bagianDokumenDocx.push({ properties: halaman(M_DEPAN), footers: { default: kaki(teksKaki) }, children: halamanDepan(kop) });
  bagianDokumenDocx.push({ properties: halaman(M_ISIAN), footers: { default: kaki(teksKaki) }, children: isian });
  if (mode === "paket") {
    const lamp: (Paragraph | Table)[] = [];
    lampiranDariBaris(paket.lampiranTemplat, lampiran).forEach((l, i) => {
      if (l.sertakan !== false) lamp.push(...halamanLampiran(l, i + 1));
    });
    if (lamp.length) bagianDokumenDocx.push({ properties: halaman(M_SURAT), footers: { default: kaki(teksKaki) }, children: lamp });
  }

  const dokumen = new Document({
    creator: "SEMAR",
    title: `Templat Proposal ${skema.namaSkema} v${templat.versi}`,
    description: teksKaki,
    styles: {
      default: { document: { run: { font: FONT_ISIAN, size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT_SURAT, size: 22, bold: true }, paragraph: { spacing: { before: 0, after: 0 } } },
      ],
    },
    sections: bagianDokumenDocx,
  });
  return Packer.toBuffer(dokumen);
}
