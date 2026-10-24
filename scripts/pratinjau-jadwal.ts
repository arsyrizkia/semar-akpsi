/**
 * npm run pratinjau-jadwal: merender tabel jadwal (Bulan 1-12 dan Bulan 1-24) dari buatDokumenTemplat dengan docx-preview di Chrome
 * dan menyimpan docs/bukti-e2e/uc01ui-docx-jadwal.png (hanya hasil generator, tanpa PDF asli).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import type { BagianTemplatDto } from "../src/lib/kontrak/tipe";
import { buatDokumenTemplat } from "../src/lib/templat/dokumen";

const akar = path.resolve(import.meta.dirname, "..");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const bagian = (kolom: string[]): BagianTemplatDto[] => [{ urutan: 1, nama: "Jadwal Penelitian", batasKata: null, wajib: true, jenisIsian: "tabel", kolomTabel: kolom, judulTabel: "Tahun ke-1" }];

async function utama() {
  const peramban = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });
  const page = await peramban.newPage();
  await page.setViewport({ width: 1000, height: 1400, deviceScaleFactor: 1.5 });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#888}.docx-wrapper{padding:0 !important;background:#888 !important}</style></head><body><div id="k"></div></body></html>`);
  await page.addScriptTag({ content: readFileSync(path.join(akar, "node_modules/jszip/dist/jszip.min.js"), "utf8") });
  await page.addScriptTag({ content: readFileSync(path.join(akar, "node_modules/docx-preview/dist/docx-preview.min.js"), "utf8") });
  for (const n of [12, 24]) {
    const bytes = await buatDokumenTemplat({ versi: 1, status: "Draf" }, bagian(["No", "Nama Kegiatan", `Bulan 1–${n}`]), [], { kode: "PD", namaSkema: "Penelitian Dasar" }, null, { mode: "isian" });
    await page.evaluate(async (b64: string) => {
      const bin = atob(b64);
      const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      // @ts-expect-error global dari docx-preview
      await window.docx.renderAsync(u.buffer, document.getElementById("k"), undefined, { breakPages: true, useBase64URL: true });
    }, Buffer.from(bytes).toString("base64"));
    await new Promise((r) => setTimeout(r, 500));
    const el = await page.$("section.docx");
    if (!el) throw new Error("halaman tidak terender");
    await el.screenshot({ path: path.join(akar, "docs", "bukti-e2e", `uc01ui-docx-jadwal-${n}.png`) });
  }
  await peramban.close();
}
utama().catch((e) => {
  console.error(e);
  process.exit(1);
});
