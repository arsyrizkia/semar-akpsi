/**
 * Naskah contoh dalam bentuk PDF, seperti berkas yang diunggah pengusul di BIMA (BIMA hanya menerima PDF). Isinya sama dengan buatDocx:
 * bagian Isian Substansi A-H dari susunContoh dengan judul bagian berhuruf di barisnya sendiri ("A. JUDUL", dikenali potongPerBagian),
 * jadwal sebagai baris teks (kepala "No Nama Kegiatan Bulan" dan "1 ... 12"), serta Gambar 1 diagram alir beserta keterangannya.
 * Dipakai panel "Berkas contoh (demo)" di BIMA tiruan dan uji. Catatan "contoh sementara" hanya di kepala halaman pertama, sebelum
 * bagian A, supaya tidak ikut terbaca sebagai isi bagian.
 */
import { PDFDocument, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { bagianBawaan, judulBerhuruf } from "@/lib/templat/isian-substansi";
import { DIAGRAM_ALIR_PNG_BASE64 } from "./aset/diagram-alir";
import type { DefinisiContoh } from "./proposal";

const LEBAR = 595;
const TINGGI = 842;
const TEPI = 56;
const LEBAR_TEKS = LEBAR - 2 * TEPI;
const UKURAN = 11;
const SPASI = 15;

/** Hanya karakter yang dapat dikodekan fon standar (WinAnsi); selebihnya dibuang supaya pdf-lib tidak gagal. */
const aman = (t: string) => t.replace(/[^\x20-\x7E -ÿ–—‘’“”…]/g, "");

class Penulis {
  private halaman: PDFPage;
  private y: number;
  constructor(
    private readonly pdf: PDFDocument,
    private readonly font: PDFFont,
    private readonly tebal: PDFFont,
  ) {
    this.halaman = pdf.addPage([LEBAR, TINGGI]);
    this.y = TINGGI - TEPI;
  }

  private ruang(tinggi: number) {
    if (this.y - tinggi >= TEPI) return;
    this.halaman = this.pdf.addPage([LEBAR, TINGGI]);
    this.y = TINGGI - TEPI;
  }

  /** Satu paragraf, dipecah per kata agar muat lebar teks. */
  paragraf(teks: string, o: { ukuran?: number; tebal?: boolean; sesudah?: number } = {}) {
    const ukuran = o.ukuran ?? UKURAN;
    const font = o.tebal ? this.tebal : this.font;
    const baris: string[] = [];
    let kini = "";
    for (const kata of aman(teks).split(/\s+/).filter(Boolean)) {
      const coba = kini ? `${kini} ${kata}` : kata;
      if (kini && font.widthOfTextAtSize(coba, ukuran) > LEBAR_TEKS) {
        baris.push(kini);
        kini = kata;
      } else kini = coba;
    }
    if (kini) baris.push(kini);
    const spasi = Math.round(ukuran * 1.36);
    for (const b of baris) {
      this.ruang(spasi);
      this.y -= spasi;
      this.halaman.drawText(b, { x: TEPI, y: this.y, size: ukuran, font });
    }
    this.y -= o.sesudah ?? 6;
  }

  gambar(img: PDFImage, lebar: number) {
    const tinggi = (img.height / img.width) * lebar;
    this.ruang(tinggi + SPASI);
    this.y -= tinggi;
    this.halaman.drawImage(img, { x: TEPI + (LEBAR_TEKS - lebar) / 2, y: this.y, width: lebar, height: tinggi });
    this.y -= 6;
  }
}

export async function buatPdfContoh(def: DefinisiContoh): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(aman(def.judul));
  pdf.setProducer("SEMAR prototipe - contoh sementara");
  const [font, tebal] = await Promise.all([pdf.embedFont(StandardFonts.Helvetica), pdf.embedFont(StandardFonts.HelveticaBold)]);
  const diagram = await pdf.embedPng(Buffer.from(DIAGRAM_ALIR_PNG_BASE64, "base64"));
  const p = new Penulis(pdf, font, tebal);

  // kepala (sebelum bagian A, dilewati pemotong bagian)
  p.paragraf("ISIAN SUBSTANSI PROPOSAL", { ukuran: 14, tebal: true, sesudah: 2 });
  p.paragraf("Skema Penelitian Dasar - dokumen contoh sementara (data rekaan) untuk prototipe SEMAR", { ukuran: 9, sesudah: 14 });

  bagianBawaan("dasar").forEach((b, i) => {
    const teks = def.bagian[b.nama];
    if (teks === undefined) return;
    p.paragraf(judulBerhuruf(i, b.nama), { tebal: true, sesudah: 4 });
    for (const baris of teks.split("\n").map((x) => x.trim()).filter(Boolean)) {
      if (/^Gambar \d+\./i.test(baris)) p.gambar(diagram, 300);
      p.paragraf(baris, { sesudah: b.nama === "Jadwal Penelitian" || b.nama === "Daftar Pustaka" ? 2 : 6 });
    }
    p.paragraf("", { sesudah: 8 });
  });
  return pdf.save();
}
