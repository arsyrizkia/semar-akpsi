// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-01 potongPerBagian (tahap ekstraksi teks naskah PDF dan lampiran); setiap cabang ekstraksi.
import { bagianBawaan } from "@/lib/templat/isian-substansi";
import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buatLampiranPdf, susunContoh } from "@/lib/contoh/proposal";
import { ekstrakNaskah, ekstrakTeksLampiran, TIPE_PDF } from "@/lib/pengajuan/ekstraksi";
import { potongTeks } from "@/lib/pengajuan/potong";


const bagian = bagianBawaan("dasar").map((b, i) => ({ urutan: i + 1, nama: b.nama, batasKata: b.batasKata, wajib: b.wajib }));

describe("naskah PDF dan lampiran", () => {
  it("KP-ekstrakNaskah-01: PDF: judul bagian dikenali dari nama templat", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const halaman = pdf.addPage([595, 842]);
    let y = 800;
    for (const baris of ["Judul Uji Naskah PDF", "Ringkasan", "Isi ringkasan satu dua tiga.", "Kata Kunci", "a; b; c; d; e"]) {
      halaman.drawText(baris, { x: 50, y, size: 12, font });
      y -= 20;
    }
    const bytes = Buffer.from(await pdf.save());
    const potong = potongTeks(await ekstrakNaskah(bytes, "n.pdf", TIPE_PDF), bagian);
    expect(potong.judulDokumen).toBe("Judul Uji Naskah PDF");
    expect(potong.teksPerBagian.Ringkasan).toBe("Isi ringkasan satu dua tiga.");
    expect(potong.kataKunci).toBe("a; b; c; d; e");
  });

  it("KP-ekstrakNaskah-02: format tidak dikenal ditolak", async () => {
    await expect(ekstrakNaskah(Buffer.from("bukan dokumen"), "x.txt", "text/plain")).rejects.toThrow("format berkas tidak didukung");
  });

  it("KP-ekstrakNaskah-03: teks lampiran PDF terbaca; berkas rusak menghasilkan teks kosong", async () => {
    const def = susunContoh("a");
    const pdf = Buffer.from(await buatLampiranPdf(def.lampiran[0].nama, def.lampiran[0].teks));
    expect(await ekstrakTeksLampiran(pdf, "s.pdf", TIPE_PDF)).toContain("Surat Pernyataan Mitra");
    expect(await ekstrakTeksLampiran(Buffer.from("%PDF-rusak"), "s.pdf", TIPE_PDF)).toBe("");
  });
});
