// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: kunciTemplat (lib/templat/dokumen.ts): templat .docx hanya-baca kecuali
// baris isian putih setiap bagian; naskah contoh yang sudah terisi tidak dikunci.
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buatDocx, susunContoh } from "@/lib/contoh/proposal";
import { buatDokumenTemplat } from "@/lib/templat/dokumen";
import { bagianBawaan } from "@/lib/templat/isian-substansi";

const bagian = bagianBawaan("dasar").map((b, i) => ({ ...b, urutan: i + 1 }));
const baca = async (buf: Buffer) => {
  const zip = await JSZip.loadAsync(buf);
  return { dokumen: await zip.file("word/document.xml")!.async("string"), pengaturan: await zip.file("word/settings.xml")!.async("string") };
};

describe("kunciTemplat", () => {
  it("KP-kunciTemplat-01: templat hanya-baca; satu wilayah sunting per bagian; penanda sementara tidak tersisa", async () => {
    const { dokumen, pengaturan } = await baca(await buatDokumenTemplat({ versi: 2, status: "Terbit" }, bagian, { kode: "PD", namaSkema: "Penelitian Dasar" }, null));
    expect(pengaturan).toContain('<w:documentProtection w:edit="readOnly" w:enforcement="1"/>');
    // urutan skema: documentProtection sebelum evenAndOddHeaders
    expect(pengaturan.indexOf("documentProtection")).toBeLessThan(pengaturan.indexOf("evenAndOddHeaders"));
    const mulai = dokumen.match(/<w:permStart w:id="\d+" w:edGrp="everyone"\/>/g) ?? [];
    const akhir = dokumen.match(/<w:permEnd w:id="\d+"\/>/g) ?? [];
    expect(mulai).toHaveLength(bagian.length);
    expect(akhir).toHaveLength(bagian.length);
    expect(dokumen).not.toContain("IZIN-");
    // wilayah sunting membungkus tempat isian, bukan judul bagian
    const awal = dokumen.indexOf('<w:permStart w:id="1"');
    const ujung = dokumen.indexOf('<w:permEnd w:id="1"/>');
    expect(dokumen.slice(awal, ujung)).toContain("[ ]");
    expect(dokumen.slice(awal, ujung)).not.toContain("A. JUDUL");
    expect(dokumen.lastIndexOf("A. JUDUL", awal)).toBeGreaterThan(-1);
  });
  it("KP-kunciTemplat-02: naskah contoh terisi tidak dikunci", async () => {
    const { dokumen, pengaturan } = await baca(await buatDocx(susunContoh("a")));
    expect(pengaturan).not.toContain("documentProtection");
    expect(dokumen).not.toContain("permStart");
  });
});
