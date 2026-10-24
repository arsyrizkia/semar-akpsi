/**
 * npm run pratinjau-docx: membangkitkan paket .docx templat (skema Dasar dan Terapan) lalu merendernya dengan docx-preview di Chrome
 * (puppeteer-core) dan menyimpan tangkapan ke docs/bukti-e2e:
 *  - uc01-docx-{dasar,terapan,depan,lampiran}-templat.png : hanya hasil generator (di-commit);
 *  - uc01-docx-{dasar,terapan,depan,lampiran}.png         : berdampingan dengan halaman PDF contoh di data/uji-nyata (lokal, tidak di-commit,
 *    karena memuat potongan PDF asli). Dilewati bila pdftoppm atau PDF contoh tidak ada.
 * Font Avenir Next LT Pro, Roboto, dan Calibri tidak terpasang di mesin; pratinjau memetakannya ke font sistem terdekat (hanya untuk tangkapan).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { bagianBawaan, kepalaBawaan, lengkapiBagian, susunPetunjuk } from "../src/lib/templat/isian-substansi";
import { buatDokumenTemplat } from "../src/lib/templat/dokumen";

const akar = path.resolve(import.meta.dirname, "..");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const KELUAR = path.join(akar, "docs", "bukti-e2e");
const CONTOH = path.join(akar, "data", "uji-nyata");
const TMP = path.join(process.env.TMPDIR ?? "/tmp", "pratinjau-docx");
mkdirSync(TMP, { recursive: true });

const FONT_CSS = `
@font-face{font-family:'Avenir Next LT Pro';font-weight:400;font-style:normal;src:local('AvenirNext-Regular');}
@font-face{font-family:'Avenir Next LT Pro';font-weight:700;font-style:normal;src:local('AvenirNext-Bold');}
@font-face{font-family:'Avenir Next LT Pro';font-weight:400;font-style:italic;src:local('AvenirNext-Italic');}
@font-face{font-family:'Avenir Next LT Pro';font-weight:700;font-style:italic;src:local('AvenirNext-BoldItalic');}
@font-face{font-family:'Calibri';font-weight:400;font-style:normal;src:local('AvenirNext-Regular');}
@font-face{font-family:'Calibri';font-weight:700;font-style:normal;src:local('AvenirNext-Bold');}
@font-face{font-family:'Calibri';font-weight:400;font-style:italic;src:local('AvenirNext-Italic');}
@font-face{font-family:'Calibri';font-weight:700;font-style:italic;src:local('AvenirNext-BoldItalic');}
@font-face{font-family:'Roboto';font-weight:400;font-style:normal;src:local('HelveticaNeue');}
@font-face{font-family:'Roboto';font-weight:700;font-style:normal;src:local('HelveticaNeue-Bold');}
@font-face{font-family:'Roboto';font-weight:400;font-style:italic;src:local('HelveticaNeue-Italic');}
@font-face{font-family:'Roboto';font-weight:700;font-style:italic;src:local('HelveticaNeue-BoldItalic');}
@font-face{font-family:'Roboto Medium';font-weight:400;font-style:normal;src:local('HelveticaNeue-Medium');}
@font-face{font-family:'Roboto Medium';font-weight:700;font-style:normal;src:local('HelveticaNeue-Bold');}
@font-face{font-family:'Roboto Medium';font-weight:400;font-style:italic;src:local('HelveticaNeue-MediumItalic');}
@font-face{font-family:'Roboto Medium';font-weight:700;font-style:italic;src:local('HelveticaNeue-BoldItalic');}
body{margin:0;background:#888}
.docx-wrapper{padding:0 !important;background:#888 !important}
.docx-wrapper>section.docx{margin:0 0 8px 0 !important;box-shadow:none !important}
`;

async function bangun(skema: "dasar" | "terapan") {
  const bagian = lengkapiBagian(bagianBawaan(skema).map((b, i) => ({ ...b, urutan: i + 1 })));
  return buatDokumenTemplat(
    { versi: 1, status: "Draf" },
    bagian,
    ["Surat Pernyataan Mitra", "Surat Keterangan Mahasiswa Bimbingan"],
    { kode: skema === "dasar" ? "PD" : "PT", namaSkema: skema === "dasar" ? "Penelitian Dasar" : "Penelitian Terapan" },
    { nama: "Seleksi 2026", tahun: 2026 },
    { kepala: kepalaBawaan(skema) },
  );
}

/** Halaman 1 contoh pada 96 dpi (1 pt = 1,333 px), skala yang sama dengan halaman A4 docx-preview (794 px), untuk perbandingan kop. */
function rujukanKop(pdf: string, nama: string): string | null {
  const berkas = path.join(CONTOH, pdf);
  if (!existsSync(berkas)) return null;
  try {
    const awalan = path.join(TMP, nama);
    execFileSync("pdftoppm", ["-r", "96", "-png", "-f", "1", "-l", "1", berkas, awalan]);
    return execFileSync("sh", ["-c", `ls "${awalan}"*.png | head -1`]).toString().trim() || null;
  } catch {
    return null;
  }
}

function rujukan(pdf: string, halaman: number, nama: string): string | null {
  const berkas = path.join(CONTOH, pdf);
  if (!existsSync(berkas)) return null;
  try {
    const awalan = path.join(TMP, nama);
    execFileSync("pdftoppm", ["-r", "110", "-png", "-f", String(halaman), "-l", String(halaman), berkas, awalan]);
    const hasil = execFileSync("sh", ["-c", `ls "${awalan}"*.png | head -1`]).toString().trim();
    return hasil || null;
  } catch {
    return null;
  }
}

async function utama() {
  const peramban = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });
  let page = await peramban.newPage();
  const jszip = readFileSync(path.join(akar, "node_modules/jszip/dist/jszip.min.js"), "utf8");
  const dp = readFileSync(path.join(akar, "node_modules/docx-preview/dist/docx-preview.min.js"), "utf8");

  const tangkap = async (skema: "dasar" | "terapan") => {
    const bytes = await bangun(skema);
    await page.close();
    page = await peramban.newPage();
    await page.setViewport({ width: 1000, height: 1300, deviceScaleFactor: 1.5 });
    await page.setContent(`<!doctype html><html><head><style>${FONT_CSS}</style></head><body><div id="k"></div></body></html>`);
    await page.addScriptTag({ content: jszip });
    await page.addScriptTag({ content: dp });
    await page.evaluate(async (b64: string) => {
      const bin = atob(b64);
      const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      // @ts-expect-error global dari docx-preview
      await window.docx.renderAsync(u.buffer, document.getElementById("k"), undefined, { breakPages: true, ignoreLastRenderedPageBreak: false, useBase64URL: true });
    }, Buffer.from(bytes).toString("base64"));
    await new Promise((r) => setTimeout(r, 600));
    const halaman = await page.$$("section.docx");
    const teks = await page.$$eval("section.docx", (e) => e.map((x) => (x as HTMLElement).innerText));
    if (process.env.DEBUG_PRATINJAU) for (let i = 0; i < halaman.length; i++) console.log(i, JSON.stringify(await halaman[i].boundingBox()), JSON.stringify(teks[i].slice(0, 50)));
    const cari = (re: RegExp) => teks.findIndex((t) => re.test(t));
    /** Satu lembar A4 mulai dari `y` (docx-preview menggabung bagian tanpa pemisah halaman, jadi lembar dipotong menurut posisi). */
    const lembar = async (y: number, kotak: { x: number; width: number; height: number }, berkas: string) => {
      await page.screenshot({ path: path.join(TMP, berkas), captureBeyondViewport: true, clip: { x: kotak.x, y, width: kotak.width, height: Math.min(kotak.height, (kotak.width * 297) / 210) } });
      return path.join(TMP, berkas);
    };
    const shot = async (i: number, berkas: string) => {
      if (i < 0) throw new Error(`halaman untuk ${berkas} tidak ditemukan`);
      const kotak = await halaman[i].boundingBox();
      if (!kotak) throw new Error("kotak halaman tidak terbaca");
      return lembar(kotak.y, { ...kotak, height: kotak.height }, berkas);
    };
    const shotIsian = async (berkas: string, tinggi = 1e6) => {
      const h = await page.evaluateHandle(() => [...document.querySelectorAll("table")].find((t) => (t as HTMLElement).innerText.trim().startsWith("Isian Substansi Proposal")) ?? null);
      const el = h.asElement();
      // tanpa pemisah halaman di docx-preview: beri ruang atas supaya lembar tidak memuat ekor halaman depan
      await el?.evaluate((e) => ((e as HTMLElement).style.marginTop = "140px"));
      const kotak = await el?.boundingBox();
      if (!kotak) throw new Error("kepala Isian Substansi tidak ditemukan");
      const dasar = await halaman[0].boundingBox();
      if (!dasar) throw new Error("kotak halaman tidak terbaca");
      // margin atas lembar Isian Substansi 45 pt = 60 px (meniru contoh no. 1)
      return lembar(kotak.y - 60, { x: dasar.x, width: dasar.width, height: tinggi }, berkas);
    };
    /** Puncak lembar (230 px = 172 pt) untuk perbandingan kop pada skala sama dengan rujukanKop. */
    const puncak = async (i: number, berkas: string) => {
      const kotak = await halaman[i].boundingBox();
      if (!kotak) throw new Error("kotak halaman tidak terbaca");
      await page.screenshot({ path: path.join(TMP, berkas), captureBeyondViewport: true, clip: { x: kotak.x, y: kotak.y, width: kotak.width, height: 230 } });
      return path.join(TMP, berkas);
    };
    return {
      kopDepan: await puncak(cari(/PROTEKSI ISI PROPOSAL/), `${skema}-kop-depan.png`),
      kopIsian: await shotIsian(`${skema}-kop-isian.png`, 230),
      depan: await shot(cari(/PROTEKSI ISI PROPOSAL/), `${skema}-depan.png`),
      isian: await shotIsian(`${skema}-isian.png`),
      lampiran: skema === "dasar" ? await shot(cari(/SURAT PERNYATAAN/), `${skema}-lampiran.png`) : null,
      jumlah: halaman.length,
    };
  };

  const dasar = await tangkap("dasar");
  const terapan = await tangkap("terapan");
  console.log("halaman dasar:", dasar.jumlah, "terapan:", terapan.jumlah);

  const salin = (dari: string, nama: string) => execFileSync("cp", [dari, path.join(KELUAR, nama)]);
  salin(dasar.isian, "uc01-docx-dasar-templat.png");
  salin(terapan.isian, "uc01-docx-terapan-templat.png");
  salin(dasar.depan, "uc01-docx-depan-templat.png");
  if (dasar.lampiran) salin(dasar.lampiran, "uc01-docx-lampiran-templat.png");

  const pasangan: [string, string | null, string][] = [
    ["dasar", rujukan("1. Contoh Proposal Soshum.pdf", 1, "r-dasar"), dasar.isian],
    ["terapan", rujukan("5. Contoh Proposal Soshum.pdf", 1, "r-terapan"), terapan.isian],
    ["depan", rujukan("6. Contoh Proposal.pdf", 1, "r-depan"), dasar.depan],
    ["lampiran", rujukan("5. Contoh Proposal Soshum.pdf", 25, "r-lampiran"), dasar.lampiran ?? ""],
  ];
  for (const [nama, ref, gen] of pasangan) {
    if (!ref || !gen) {
      console.log(`lewati perbandingan ${nama} (PDF contoh atau pdftoppm tidak ada)`);
      continue;
    }
    await page.setViewport({ width: 1450, height: 1100, deviceScaleFactor: 1 });
    const uri = (f: string) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
    await page.setContent(
      `<!doctype html><body style="margin:0;background:#fff;font:600 16px Helvetica"><div style="display:flex;gap:16px;padding:12px;align-items:flex-start"><figure style="margin:0;width:700px"><figcaption style="padding:4px 0">Contoh BIMA (PDF)</figcaption><img style="width:700px;border:1px solid #999" src="${uri(ref)}"></figure><figure style="margin:0;width:700px"><figcaption style="padding:4px 0">Hasil generator (.docx, docx-preview)</figcaption><img style="width:700px;border:1px solid #999" src="${uri(gen)}"></figure></div></body>`,
    );
    await page.screenshot({ path: path.join(KELUAR, `uc01-docx-${nama}.png`), fullPage: true });
    console.log("tulis", `uc01-docx-${nama}.png`);
  }

  // bagian tambahan (putaran 3): daftar 3 butir, tabel berkolom, gambar berketerangan; hanya hasil generator, boleh di-commit
  {
    // petunjuk otomatis seperti yang tersimpan dari M-12 ("Susun ulang petunjuk")
    const tambahan = lengkapiBagian(
      lengkapiBagian([
      { urutan: 1, nama: "Bidang Keilmuan", batasKata: null, wajib: true, jenisIsian: "daftar", jumlahButir: 3, pemisah: ";", unsurIsi: [{ unsur: "bidang keilmuan utama penelitian" }] },
      { urutan: 2, nama: "Rencana Biaya", batasKata: 200, wajib: true, wajibTabel: true, kolomTabel: ["No", "Uraian", "Volume", "Biaya"], wajibGambar: true, ketGambar: "peta lokasi penelitian", frasaWajib: ["Seluruh biaya sesuai RAB"] },
      { urutan: 3, nama: "Rincian Tahap", batasKata: null, wajib: true, jenisIsian: "tabel", kolomTabel: ["Kode", "Tahap", "Penanggung Jawab"], judulTabel: "Tahap 1" },
      ]).map((b) => ({ ...b, petunjuk: susunPetunjuk(b) })),
    );
    const bytes = await buatDokumenTemplat({ versi: 2, status: "Draf" }, tambahan, [], { kode: "PD", namaSkema: "Penelitian Dasar" }, { nama: "Seleksi 2026", tahun: 2026 }, { kepala: kepalaBawaan("dasar"), mode: "isian" });
    await page.close();
    page = await peramban.newPage();
    await page.setViewport({ width: 1000, height: 1300, deviceScaleFactor: 1.5 });
    await page.setContent(`<!doctype html><html><head><style>${FONT_CSS}</style></head><body><div id="k"></div></body></html>`);
    await page.addScriptTag({ content: jszip });
    await page.addScriptTag({ content: dp });
    await page.evaluate(async (b64: string) => {
      const bin = atob(b64);
      const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      // @ts-expect-error global dari docx-preview
      await window.docx.renderAsync(u.buffer, document.getElementById("k"), undefined, { breakPages: true, ignoreLastRenderedPageBreak: false, useBase64URL: true });
    }, Buffer.from(bytes).toString("base64"));
    await new Promise((r) => setTimeout(r, 600));
    const halaman = await page.$$("section.docx");
    const kotak = await halaman[0].boundingBox();
    if (kotak) await page.screenshot({ path: path.join(KELUAR, "uc01r3-docx-tambahan.png"), captureBeyondViewport: true, clip: { x: kotak.x, y: kotak.y, width: kotak.width, height: Math.min(kotak.height, 760) } });
    console.log("tulis uc01r3-docx-tambahan.png");
  }

  // kop berdampingan dengan contoh pada skala sama (puncak lembar 230 px); tidak di-commit karena memuat potongan PDF asli
  const kop: [string, string | null, string][] = [
    ["isian", rujukanKop("1. Contoh Proposal Soshum.pdf", "k-isian"), dasar.kopIsian],
    ["depan", rujukanKop("6. Contoh Proposal.pdf", "k-depan"), dasar.kopDepan],
  ];
  for (const [nama, ref, gen] of kop) {
    if (!ref) {
      console.log(`lewati perbandingan kop ${nama} (PDF contoh atau pdftoppm tidak ada)`);
      continue;
    }
    await page.setViewport({ width: 1640, height: 300, deviceScaleFactor: 1 });
    const uri = (f: string) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
    await page.setContent(
      `<!doctype html><body style="margin:0;background:#fff;font:600 14px Helvetica"><div style="display:flex;gap:24px;padding:8px;align-items:flex-start"><figure style="margin:0;width:794px"><figcaption style="padding:2px 0">Contoh BIMA (PDF), 96 dpi</figcaption><div style="width:794px;height:230px;overflow:hidden;border:1px solid #999"><img style="display:block;width:794px" src="${uri(ref)}"></div></figure><figure style="margin:0;width:794px"><figcaption style="padding:2px 0">Hasil generator (.docx, docx-preview), skala sama</figcaption><div style="width:794px;height:230px;overflow:hidden;border:1px solid #999"><img style="display:block;width:794px" src="${uri(gen)}"></div></figure></div></body>`,
    );
    await page.screenshot({ path: path.join(KELUAR, `uc01r3-kop-${nama}.png`), fullPage: true });
    console.log("tulis", `uc01r3-kop-${nama}.png`);
  }
  await peramban.close();
}

void utama();
