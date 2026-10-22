// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-01 potongPerBagian (tahap ambilTeksBagian untuk DOCX); cabang blokDariHtml dan jenisBerkas/ekstrakTeksLampiran.
import { describe, expect, it } from "vitest";
import { blokDariHtml, ekstrakTeksLampiran, jenisBerkas, TIPE_DOCX, TIPE_PDF } from "@/lib/pengajuan/ekstraksi";

describe("blokDariHtml (cabang)", () => {
  it("KP-blokDariHtml-01: judul h1..h6 membawa tingkat; paragraf dengan <br> dipecah per baris", () => {
    expect(blokDariHtml("<h2>Metode</h2><p>satu<br/>dua</p>")).toEqual([
      { jenis: "judul", teks: "Metode", tingkat: 2 },
      { jenis: "paragraf", teks: "satu" },
      { jenis: "paragraf", teks: "dua" },
    ]);
  });
  it("KP-blokDariHtml-02: tabel menjadi satu penanda dan isinya dibuang", () => {
    expect(blokDariHtml("<table><tr><td>a b c</td></tr></table>")).toEqual([{ jenis: "tabel", teks: "[tabel]" }]);
  });
  it("KP-blokDariHtml-03: daftar ul/ol dipecah per item; item kosong dilewati", () => {
    const b = blokDariHtml("<ul><li>satu</li><li>  </li><li>dua</li></ul><ol><li>tiga</li></ol>");
    expect(b.map((x) => x.teks)).toEqual(["satu", "dua", "tiga"]);
  });
  it("KP-blokDariHtml-04: paragraf bergambar menghasilkan penanda gambar lalu teksnya; paragraf hanya gambar tanpa teks", () => {
    expect(blokDariHtml('<p><img src="gambar"/> Gambar 1. Diagram alir</p>').map((x) => x.jenis)).toEqual(["gambar", "paragraf"]);
    expect(blokDariHtml('<p><img src="gambar"/></p>')).toEqual([{ jenis: "gambar", teks: "[gambar]" }]);
  });
  it("KP-blokDariHtml-05: entitas bernama, desimal, dan heksadesimal didekode; entitas tidak dikenal dibiarkan", () => {
    expect(blokDariHtml("<p>A &amp; B &#65; &#x42; &zzz; &lt;x&gt;</p>")[0].teks).toBe("A & B A B &zzz; <x>");
  });
  it("KP-blokDariHtml-06: judul multibaris digabung satu baris; paragraf kosong tidak menghasilkan blok", () => {
    expect(blokDariHtml("<h1>Satu<br/>Dua</h1><p> </p>")).toEqual([{ jenis: "judul", teks: "Satu Dua", tingkat: 1 }]);
  });
});

describe("jenisBerkas dan ekstrakTeksLampiran (cabang)", () => {
  it("KP-jenisBerkas-01: PDF dikenali dari tanda %PDF; nama .pdf tanpa tanda %PDF ditolak", () => {
    expect(jenisBerkas("a.pdf", TIPE_PDF, Buffer.from("%PDF-1.7"))).toBe("pdf");
    expect(jenisBerkas("a.bin", "application/octet-stream", Buffer.from("%PDF-1.7"))).toBe("pdf");
    expect(jenisBerkas("a.pdf", TIPE_PDF, Buffer.from("palsu"))).toBeNull();
  });
  it("KP-jenisBerkas-02: DOCX butuh tanda PK dan tipe atau ekstensi docx", () => {
    expect(jenisBerkas("a.docx", "x", Buffer.from("PK\x03\x04"))).toBe("docx");
    expect(jenisBerkas("a", TIPE_DOCX, Buffer.from("PK\x03\x04"))).toBe("docx");
    expect(jenisBerkas("a.docx", TIPE_DOCX, Buffer.from("XX"))).toBeNull();
    expect(jenisBerkas("a.txt", "text/plain", Buffer.from("PK\x03\x04"))).toBeNull();
  });
  it("KP-ekstrakTeksLampiran-01: format tidak dikenal menghasilkan teks kosong, bukan galat", async () => {
    expect(await ekstrakTeksLampiran(Buffer.from("teks"), "a.txt", "text/plain")).toBe("");
  });
  it("KP-ekstrakTeksLampiran-02: DOCX rusak ditelan menjadi teks kosong", async () => {
    expect(await ekstrakTeksLampiran(Buffer.from("PK rusak"), "a.docx", TIPE_DOCX)).toBe("");
  });
});
