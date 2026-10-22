/**
 * Generator templat proposal (.docx), dipakai unduhan J-02 (per versi), J-02b (pratinjau draf), dan BIMA pengajuan (templat Terbit).
 * Murni: tanpa basis data. Gaya "Isian Substansi Proposal" BIMA: judul bagian berhuruf ("A. JUDUL" ... "H. DAFTAR PUSTAKA") sebagai
 * Heading 1, kalimat petunjuk resmi per bagian (huruf miring), lalu tempat isian "[ … ]". Berkas hasilnya dapat dibaca balik oleh
 * `potongPerBagian` (src/lib/pengajuan/potong.ts) dengan bagian yang sama (uji round-trip KH-dokumen-templat).
 *
 * Susunan: judul "Isian Substansi Proposal", skema, kalimat pengantar resmi, identitas (periode, versi, status), daftar lampiran wajib,
 * lalu satu Heading 1 per bagian sesuai urutan. Bagian "Kata Kunci" dan "Daftar Pustaka" selalu ada (ditambahkan bila belum ada di
 * templat). Semua yang mendahului bagian pertama dilewati pembaca balik. Bagian di luar Isian Substansi memakai baris "Panduan: ...".
 */
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { BagianTemplatDto } from "@/lib/kontrak/tipe";
import { normalisasiJudul } from "@/lib/pemeriksa/deterministik/teks";
import { PENGANTAR_ISIAN_SUBSTANSI, TEMPAT_ISIAN, judulBerhuruf, petunjukResmi } from "./isian-substansi";

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

/**
 * Kalimat di bawah judul bagian: petunjuk resmi Isian Substansi bila bagian dikenal, selain itu baris "Panduan: ..." buatan
 * generator (batas kata, wajib/opsional).
 */
export function panduanBagian(b: Pick<BagianTemplatDto, "nama" | "batasKata" | "wajib"> & { petunjuk?: string | null }): string {
  const resmi = b.petunjuk ?? petunjukResmi(b.nama, b.batasKata);
  if (resmi) return resmi;
  const sifat = b.wajib ? "Bagian wajib." : "Bagian opsional.";
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
  anak.push(new Paragraph({ children: [new TextRun({ text: "Isian Substansi Proposal", bold: true, size: 36 })], spacing: { after: 120 } }));
  anak.push(new Paragraph({ children: [new TextRun({ text: `SKEMA ${skema.namaSkema.toUpperCase()}`, bold: true })] }));
  anak.push(new Paragraph({ children: [new TextRun(PENGANTAR_ISIAN_SUBSTANSI)], spacing: { after: 120 } }));
  const identitas = [
    `Skema pendanaan: ${skema.namaSkema} (${skema.kode})`,
    `Periode berlaku: ${periode ? `${periode.nama}${periode.tahun ? ` (${periode.tahun})` : ""}` : "belum ditetapkan"}`,
    `Versi templat: ${templat.versi} (${templat.status})`,
  ];
  for (const baris of identitas) anak.push(new Paragraph({ children: [new TextRun(baris)] }));

  anak.push(new Paragraph({ children: [new TextRun({ text: "Lampiran wajib (diunggah sebagai berkas terpisah):", bold: true })], spacing: { before: 240 } }));
  if (lampiran.length === 0) anak.push(new Paragraph({ children: [new TextRun("Tidak ada lampiran wajib.")] }));
  lampiran.forEach((nama, i) => anak.push(new Paragraph({ children: [new TextRun(`${i + 1}. ${nama}`)] })));

  bagianDokumen(bagian).forEach((b, i) => {
    anak.push(new Paragraph({ text: judulBerhuruf(i, b.nama), heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 120 } }));
    anak.push(new Paragraph({ children: [new TextRun({ text: panduanBagian(b), italics: true })] }));
    anak.push(new Paragraph({ children: [new TextRun(TEMPAT_ISIAN)] }));
  });

  const dokumen = new Document({
    creator: "SEMAR",
    title: `Templat Proposal ${skema.namaSkema} v${templat.versi}`,
    sections: [{ children: anak }],
  });
  return Packer.toBuffer(dokumen);
}
