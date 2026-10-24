/**
 * Templat lampiran (.docx) milik BIMA tiruan: satu halaman bergaya surat (Times New Roman): kop, judul, isian label | ":" | isian,
 * blok tanda tangan di kanan. Bukan bagian templat SEMAR (SEMAR hanya Isian Substansi). Memakai perkakas tata letak dokumen.ts.
 */
import { Document, HeadingLevel, Packer, Paragraph, Tab, TabStopType, Table, TableRow, TextRun } from "docx";
import { FONT_SURAT, garis, para, run, sel, tabelTetap, type OpsiTeks } from "@/lib/templat/dokumen";
import { labelIsian, type TemplatLampiranBima } from "./lampiran";

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

export async function buatDokumenLampiran(l: TemplatLampiranBima): Promise<Buffer> {
  const o: (Paragraph | Table)[] = [];
  o.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      tabStops: [{ type: TabStopType.RIGHT, position: LEBAR_SURAT }],
      border: { bottom: garis(12) },
      spacing: { after: 240 },
      children: [
        run("KOP INSTANSI MITRA", { font: FONT_SURAT, ukuran: 26, tebal: true, warna: "1F2A7C" }),
        new TextRun({ children: [new Tab(), "Alamat, telepon, dan laman instansi"], font: FONT_SURAT, size: 15, color: "1F2A7C" }),
      ],
    }),
  );
  o.push(para(l.judul || l.nama.toUpperCase(), { ...T_SURAT, tebal: true, tengah: true, sesudah: 240 }));
  for (const k of l.kalimat) {
    const label = labelIsian(k);
    if (label) {
      o.push(tabelLabelSurat(label));
      o.push(para("", { sesudah: 120 }));
    } else o.push(para(k, { ...T_SURAT, rataPenuh: true, sesudah: 120 }));
  }
  o.push(para("...., ....................", { ...T_SURAT, indentKiri: 5200, sebelum: 240, sesudah: 1000 }));
  o.push(para("Nama : ....", { ...T_SURAT, indentKiri: 5200 }));
  const dokumen = new Document({
    creator: "Simulasi BIMA",
    title: `Templat Lampiran: ${l.nama}`,
    styles: { default: { document: { run: { font: FONT_SURAT, size: 22 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: M_SURAT.atas, bottom: M_SURAT.bawah, left: M_SURAT.kiri, right: M_SURAT.kanan } } }, children: o }],
  });
  return Packer.toBuffer(dokumen);
}
