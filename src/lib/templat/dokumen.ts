/**
 * Generator templat proposal (.docx), dipakai unduhan J-02 (per versi), J-02b (pratinjau draf), dan BIMA pengajuan (templat Terbit).
 * Murni: tanpa basis data. Berkas hasilnya dapat dibaca balik oleh `potongPerBagian` (src/lib/pengajuan/potong.ts) dengan bagian yang sama
 * (uji round-trip KH-dokumen-templat).
 *
 * Susunan: judul, identitas (skema, periode, versi, status), daftar lampiran wajib, lalu satu Heading 1 per bagian sesuai urutan dengan
 * baris panduan (batas kata, wajib/opsional). Bagian "Kata Kunci" dan "Daftar Pustaka" selalu ada (ditambahkan bila belum ada di templat).
 * Daftar lampiran ditaruh sebelum bagian pertama supaya tidak menjadi judul tingkat 1 di luar templat.
 */
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { BagianTemplatDto } from "@/lib/kontrak/tipe";
import { normalisasiJudul } from "@/lib/pemeriksa/deterministik/teks";

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

const nf = new Intl.NumberFormat("id-ID");

/** Baris panduan di bawah judul bagian. */
export function panduanBagian(b: Pick<BagianTemplatDto, "nama" | "batasKata" | "wajib">): string {
  const sifat = b.wajib ? "Bagian wajib." : "Bagian opsional.";
  if (normalisasiJudul(b.nama) === "kata kunci") return `Panduan: tuliskan kata kunci dalam satu baris, dipisahkan titik koma (;). ${sifat}`;
  if (normalisasiJudul(b.nama) === "daftar pustaka") return `Panduan: tulis daftar pustaka berurutan sesuai nomor sitasi di naskah. ${sifat}`;
  const batas = b.batasKata == null ? "tanpa batas kata" : `maksimal ${nf.format(b.batasKata)} kata`;
  return `Panduan: ${batas}. ${sifat}`;
}

/** Nama berkas unduhan yang bermakna, mis. "Templat-PD-v3-Terbit.docx". */
export function namaBerkasTemplat(skema: Pick<SkemaDokumen, "kode">, templat: IdentitasTemplatDokumen): string {
  const kode = skema.kode.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "skema";
  return `Templat-${kode}-v${templat.versi}-${templat.status}.docx`;
}

export async function buatDokumenTemplat(
  templat: IdentitasTemplatDokumen,
  bagian: BagianTemplatDto[],
  lampiran: string[],
  skema: SkemaDokumen,
  periode: PeriodeDokumen | null,
): Promise<Buffer> {
  const anak: Paragraph[] = [];
  anak.push(new Paragraph({ children: [new TextRun({ text: `Templat Proposal ${skema.namaSkema}`, bold: true, size: 36 })], spacing: { after: 200 } }));
  const identitas = [
    `Skema pendanaan: ${skema.namaSkema} (${skema.kode})`,
    `Periode berlaku: ${periode ? `${periode.nama}${periode.tahun ? ` (${periode.tahun})` : ""}` : "belum ditetapkan"}`,
    `Versi templat: ${templat.versi} (${templat.status})`,
  ];
  for (const baris of identitas) anak.push(new Paragraph({ children: [new TextRun(baris)] }));

  anak.push(new Paragraph({ children: [new TextRun({ text: "Lampiran wajib (diunggah sebagai berkas terpisah):", bold: true })], spacing: { before: 240 } }));
  if (lampiran.length === 0) anak.push(new Paragraph({ children: [new TextRun("Tidak ada lampiran wajib.")] }));
  lampiran.forEach((nama, i) => anak.push(new Paragraph({ children: [new TextRun(`${i + 1}. ${nama}`)] })));

  for (const b of bagianDokumen(bagian)) {
    anak.push(new Paragraph({ text: b.nama, heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 120 } }));
    anak.push(new Paragraph({ children: [new TextRun({ text: panduanBagian(b), italics: true })] }));
  }

  const dokumen = new Document({
    creator: "SEMAR",
    title: `Templat Proposal ${skema.namaSkema} v${templat.versi}`,
    sections: [{ children: anak }],
  });
  return Packer.toBuffer(dokumen);
}
