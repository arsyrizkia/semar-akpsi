// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: kunciTemplat (lib/templat/dokumen.ts): kop dan kepala setiap bagian templat
// .docx dikunci content control tak tampak, baris isian putih bebas; naskah contoh yang sudah terisi tidak dikunci.
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
  it("KP-kunciTemplat-01: kop dan kepala setiap bagian terkunci tanpa Restrict Editing; baris isian bebas; penanda tidak tersisa", async () => {
    const { dokumen, pengaturan } = await baca(await buatDokumenTemplat({ versi: 2, status: "Terbit" }, bagian, { kode: "PD", namaSkema: "Penelitian Dasar" }, null));
    // tanpa perlindungan dokumen dan tanpa wilayah izin: Word tidak menampilkan kurung atau sorotan kuning
    expect(pengaturan).not.toContain("documentProtection");
    expect(dokumen).not.toContain("permStart");
    expect(dokumen).not.toContain("KUNCI-");
    const kontrol = [...dokumen.matchAll(/<w:sdt><w:sdtPr>((?:(?!<\/w:sdtPr>)[\s\S])*)<\/w:sdtPr><w:sdtContent>((?:(?!<\/w:sdtContent>)[\s\S])*)<\/w:sdtContent><\/w:sdt>/g)];
    // satu untuk kop + satu per bagian (tujuh bagian bawaan + Kata Kunci dan Daftar Pustaka bila belum ada)
    expect(kontrol.length).toBeGreaterThanOrEqual(bagian.length + 1);
    for (const [, pr] of kontrol) {
      expect(pr).toContain('<w:lock w:val="sdtContentLocked"/>');
      expect(pr).toContain('<w15:appearance w15:val="hidden"/>');
    }
    expect(new Set(kontrol.map(([, pr]) => /<w:id w:val="(\d+)"/.exec(pr)?.[1])).size).toBe(kontrol.length);
    // kontrol pertama = kop; kontrol kedua = kepala bagian A (judul + petunjuk), tanpa tempat isian
    expect(kontrol[0][2]).toContain("SKEMA PENELITIAN DASAR");
    expect(kontrol[1][2]).toContain("A. JUDUL");
    expect(kontrol[1][2]).not.toContain("[ ]");
    // tempat isian "[ ]" berada di luar semua content control
    const luar = dokumen.replace(/<w:sdt>[\s\S]*?<\/w:sdt>/g, "");
    expect(luar).toContain("[ ]");
  });
  it("KP-kunciTemplat-02: naskah contoh terisi tidak dikunci", async () => {
    const { dokumen, pengaturan } = await baca(await buatDocx(susunContoh("a")));
    expect(pengaturan).not.toContain("documentProtection");
    expect(dokumen).not.toContain("<w:sdt>");
  });
});
