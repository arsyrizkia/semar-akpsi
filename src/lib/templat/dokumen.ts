/**
 * Generator templat proposal (.docx), dipakai unduhan J-02 (per versi), J-02b (pratinjau draf), dan BIMA pengajuan (templat Terbit).
 * Murni: tanpa basis data. Meniru ekspor BIMA (contoh no. 1, 5, 6, 10):
 *  1. halaman depan (mode "paket"): kop, kotak proteksi, "PROPOSAL PENELITIAN", rencana pelaksanaan, nomor dokumen, lalu bagian
 *     depan bernomor 1-6 sebagai tabel kosong;
 *  2. Isian Substansi: kepala tebal di tengah (judul dokumen + subjudul skema), kalimat pengantar, lalu per bagian judul berhuruf
 *     ("A. JUDUL" ... "H. DAFTAR PUSTAKA") sebagai Heading 1, kalimat petunjuk (gaya biasa) dan tempat isian: "[ ]" (teks),
 *     "[kata kunci 1; ...; kata kunci 5]" (daftar), tabel "Tahun ke-1" (tabel), "[1] " (daftar pustaka), "[Sisipkan diagram alir ...]";
 *  3. satu halaman per templat lampiran (mode "paket"): surat berformulir dengan isian kosong, atau lembar unggahan.
 * Berkas dapat dibaca balik oleh `potongPerBagian` (src/lib/pengajuan/potong.ts) dengan bagian yang sama (uji round-trip);
 * bagian depan dan lampiran tidak ikut terpotong sebagai isian. Kalimat petunjuk, "[ ]", dan "[Sisipkan ...]" tidak dihitung `hitungKata`.
 */
import { AlignmentType, BorderStyle, Document, HeadingLevel, PageBreak, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import type { BagianTemplatDto, KepalaTemplatDto } from "@/lib/kontrak/tipe";
import { normalisasiJudul } from "@/lib/pemeriksa/deterministik/teks";
import { JUDUL_DOKUMEN_BAWAAN, PENGANTAR_ISIAN_SUBSTANSI, TEMPAT_ISIAN, judulBerhuruf, lengkapiBagian, petunjukBagian } from "./isian-substansi";
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

const FONT = "Times New Roman";
const GARIS_TEBAL = { style: BorderStyle.SINGLE, size: 8, color: "000000" } as const;

const para = (teks: string, opsi: { tebal?: boolean; tengah?: boolean; miring?: boolean; sesudah?: number; sebelum?: number; ukuran?: number } = {}) =>
  new Paragraph({
    alignment: opsi.tengah ? AlignmentType.CENTER : undefined,
    spacing: { after: opsi.sesudah ?? 120, before: opsi.sebelum ?? 0 },
    children: [new TextRun({ text: teks, bold: opsi.tebal, italics: opsi.miring, size: opsi.ukuran })],
  });

function tabel(kepala: string[], jumlahBaris: number): Table {
  const sel = (t: string, tebal: boolean) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: tebal, size: 20 })] })] });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: kepala.map((k) => sel(k, true)) }),
      ...Array.from({ length: jumlahBaris }, () => new TableRow({ children: kepala.map(() => sel("", false)) })),
    ],
  });
}

function tabelJadwal(): Table {
  const bulan = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const sel = (t: string, tebal: boolean, lebar: number, span = 1) =>
    new TableCell({ columnSpan: span, width: { size: lebar, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: tebal, size: 18 })] })] });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [sel("Tahun ke-1", true, 100, 14)] }),
      new TableRow({ tableHeader: true, children: [sel("No", true, 6), sel("Nama Kegiatan", true, 34), sel("Bulan", true, 60, 12)] }),
      new TableRow({ tableHeader: true, children: [sel("", false, 6), sel("", false, 34), ...bulan.map((b) => sel(b, true, 5))] }),
      ...[1, 2, 3, 4].map((n) => new TableRow({ children: [sel(String(n), false, 6), sel("", false, 34), ...bulan.map(() => sel("", false, 5))] })),
    ],
  });
}

function kotakProteksi(kop: KopTemplat): Table {
  const borders = { top: GARIS_TEBAL, bottom: GARIS_TEBAL, left: GARIS_TEBAL, right: GARIS_TEBAL };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({ borders, children: [para("PROTEKSI ISI PROPOSAL", { tebal: true, tengah: true }), para(kop.proteksi, { sesudah: 60 })] })] })],
  });
}

function halamanDepan(kop: KopTemplat, skema: SkemaDokumen, templat: IdentitasTemplatDokumen, periode: PeriodeDokumen | null): (Paragraph | Table)[] {
  const o: (Paragraph | Table)[] = [];
  o.push(para(kop.lembaga.toUpperCase(), { tebal: true, tengah: true, sesudah: 0, ukuran: 26 }));
  if (kop.alamat) o.push(para(kop.alamat, { tengah: true, sesudah: 0, ukuran: 20 }));
  if (kop.laman) o.push(para(kop.laman, { tengah: true, sesudah: 60, ukuran: 20 }));
  o.push(new Paragraph({ border: { bottom: GARIS_TEBAL }, spacing: { after: 240 }, children: [] }));
  o.push(kotakProteksi(kop));
  o.push(para(kop.judulProposal, { tebal: true, tengah: true, sebelum: 360, sesudah: 120, ukuran: 32 }));
  o.push(para(`Skema: ${skema.namaSkema} (${skema.kode})`, { tengah: true, sesudah: 0 }));
  o.push(para("Rencana Pelaksanaan Penelitian: tahun .... s.d. tahun ....", { tengah: true, sesudah: 0 }));
  o.push(para("NO. DOKUMEN: ....", { tengah: true, sesudah: 0 }));
  o.push(para(`Periode berlaku: ${periode ? `${periode.nama}${periode.tahun ? ` (${periode.tahun})` : ""}` : "belum ditetapkan"}`, { tengah: true, sesudah: 0, ukuran: 20 }));
  o.push(para(`Versi templat: ${templat.versi} (${templat.status})`, { tengah: true, sesudah: 240, ukuran: 20 }));
  BAGIAN_DEPAN.filter((d) => kop.depan[d.kunci]).forEach((d, i) => {
    o.push(para(`${i + 1}. ${d.judul}`, { tebal: true, sebelum: 240 }));
    if (d.penjelas) o.push(para(d.penjelas));
    for (const label of d.isian) o.push(para(`${label} : ....`, { sesudah: 40 }));
    if (d.tabel.length) o.push(tabel(d.tabel, 3));
  });
  return o;
}

function halamanLampiran(l: LampiranTemplat, nomor: number): (Paragraph | Table)[] {
  const o: (Paragraph | Table)[] = [new Paragraph({ children: [new PageBreak()] })];
  if (l.jenis === "unggahan") {
    o.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`LAMPIRAN ${nomor}. ${l.nama.toUpperCase()}`)] }));
    o.push(para("Lampiran ini diunggah sebagai berkas terpisah (PDF atau DOCX) bersama naskah proposal."));
    return o;
  }
  // kop surat sebagai judul tingkat 1 supaya pembaca balik memutus bagian terakhir di sini (potongPerBagian)
  o.push(new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun("KOP INSTANSI (nama, alamat, laman instansi)")] }));
  o.push(new Paragraph({ border: { bottom: GARIS_TEBAL }, spacing: { after: 240 }, children: [] }));
  o.push(new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun(l.judul || l.nama.toUpperCase())] }));
  for (const k of l.kalimat) {
    const label = labelIsian(k);
    if (label) for (const x of label) o.push(para(`${x} : ....`, { sesudah: 40 }));
    else o.push(para(k, { sebelum: 120 }));
  }
  o.push(para("...., ....................", { sebelum: 360, sesudah: 720 }));
  o.push(para("(tanda tangan)", { sesudah: 0 }));
  o.push(para("Nama : ....", { sesudah: 0 }));
  return o;
}

/** Tempat isian sebuah bagian menurut jenis dan ketentuannya (meniru contoh BIMA). */
function tempatIsian(b: BagianTemplatDto): (Paragraph | Table)[] {
  const o: (Paragraph | Table)[] = [];
  if (b.jenisIsian === "daftar") {
    const butir = Array.from({ length: b.jumlahButir ?? 5 }, (_, i) => `kata kunci ${i + 1}`);
    o.push(para(`[${butir.join(`${b.pemisah ?? ";"} `)}]`));
  } else if (b.jenisIsian === "tabel") {
    o.push(para(TEMPAT_ISIAN));
    o.push(tabelJadwal());
  } else if (b.daftarPustaka) {
    o.push(para("[1] "));
  } else {
    o.push(para(TEMPAT_ISIAN));
  }
  if (b.wajibGambar) o.push(para("[Sisipkan diagram alir penelitian (JPG/PNG)]", { miring: true }));
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
  const anak: (Paragraph | Table)[] = [];

  if (mode === "paket") {
    anak.push(...halamanDepan(kop, skema, templat, periode));
    anak.push(new Paragraph({ children: [new PageBreak()] }));
  } else {
    anak.push(para(`Skema pendanaan: ${skema.namaSkema} (${skema.kode}); versi templat ${templat.versi} (${templat.status})`, { ukuran: 18 }));
  }

  anak.push(para(kepala.judulDokumen, { tebal: true, tengah: true, sesudah: 60, ukuran: 28 }));
  if (kepala.subjudul) anak.push(para(kepala.subjudul, { tebal: true, tengah: true, sesudah: 120 }));
  if (kepala.pengantar) anak.push(para(kepala.pengantar, { sesudah: 240 }));

  lengkapiBagian(bagianDokumen(bagian)).forEach((b, i) => {
    anak.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 80 }, children: [new TextRun(judulBerhuruf(i, b.nama))] }));
    const petunjuk = panduanBagian(b);
    if (petunjuk) anak.push(para(petunjuk, { sesudah: 80 }));
    anak.push(...tempatIsian(b));
  });

  if (mode === "paket") {
    lampiranDariBaris(paket.lampiranTemplat, lampiran).forEach((l, i) => {
      if (l.sertakan !== false) anak.push(...halamanLampiran(l, i + 1));
    });
  }

  const dokumen = new Document({
    creator: "SEMAR",
    title: `Templat Proposal ${skema.namaSkema} v${templat.versi}`,
    styles: {
      default: { document: { run: { font: FONT, size: 24 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 24, bold: true }, paragraph: { spacing: { before: 240, after: 80 } } },
      ],
    },
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: anak }],
  });
  return Packer.toBuffer(dokumen);
}
