/**
 * Uji ujung ke ujung SEMAR (puppeteer-core + Chrome lokal).
 *
 * Menyalakan aplikasi dengan `next start` pada port bebas (jalankan `npm run build` lebih dulu), memakai LLM mode tiruan,
 * lalu menjalankan jalur utama setiap use case beserta alternatif pentingnya. Tangkapan layar (1440 dan 390 px) dan laporan
 * ditulis ke e2e/hasil/. Jalankan: `npm run e2e`. Bila E2E_BASE_URL diisi, aplikasi yang sudah berjalan dipakai.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import mammoth from "mammoth";
import puppeteer, { type Browser, type ElementHandle, type Page } from "puppeteer-core";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* env dari lingkungan */
}

const ROOT = path.resolve(import.meta.dirname, "..");
/**
 * Run penuh menulis ke e2e/hasil/. Run terfilter (E2E_FILTER) menulis ke subfolder e2e/hasil/filter-<nama>/ dan tidak
 * menghapus hasil run penuh.
 */
const HASIL = process.env.E2E_FILTER
  ? path.join(ROOT, "e2e", "hasil", `filter-${process.env.E2E_FILTER.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 30)}`)
  : path.join(ROOT, "e2e", "hasil");

/**
 * Penjaga basis data: e2e menekan "Reset & isi data demo" (TRUNCATE semua tabel). DATABASE_URL hasil `vercel env pull`
 * sama dengan produksi, jadi e2e hanya jalan terhadap basis data uji (DATABASE_URL_UJI) atau dengan izin eksplisit.
 */
function jagaBasisData() {
  if (process.env.E2E_BASE_URL && process.env.SEMAR_IZINKAN_DB_PRODUKSI !== "1") {
    console.error("e2e dihentikan: E2E_BASE_URL mengarah ke aplikasi yang basis datanya tidak dapat diperiksa (mungkin produksi). Pakai server lokal dengan DATABASE_URL_UJI, atau SEMAR_IZINKAN_DB_PRODUKSI=1 bila disengaja.");
    process.exit(2);
  }
  if (process.env.DATABASE_URL_UJI) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_UJI;
    process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UJI_UNPOOLED ?? process.env.DATABASE_URL_UJI;
    return;
  }
  if (process.env.SEMAR_IZINKAN_DB_PRODUKSI === "1") return;
  console.error("e2e dihentikan: tidak ada DATABASE_URL_UJI. Basis data dari .env.local adalah basis data produksi yang dipakai bersama, dan e2e menekan Reset. Isi DATABASE_URL_UJI dengan branch Neon uji, atau SEMAR_IZINKAN_DB_PRODUKSI=1 bila memang disengaja.");
  process.exit(2);
}
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/* ------------------------------ pelaporan ------------------------------ */

interface HasilSkenario {
  skenario: string;
  lulus: boolean;
  catatan: string;
}
const hasil: HasilSkenario[] = [];
const tangkapan: string[] = [];
const masalah: string[] = [];
let galatKonsol: string[] = [];
let abaikanKonsol: RegExp[] = [];
let nomorGambar = 0;

/** Tangkapan layar pada dua lebar (1440 dan 390 px); viewport dikembalikan ke 1440 sesudahnya. */
async function foto(page: Page, nama: string) {
  nomorGambar++;
  const nomor = String(nomorGambar).padStart(2, "0");
  for (const [lebar, tinggi] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    await page.setViewport({ width: lebar, height: tinggi });
    await new Promise((r) => setTimeout(r, 250));
    const berkas = `${nomor}-${nama}-${lebar}.png`;
    await page.screenshot({ path: path.join(HASIL, berkas), fullPage: nama.startsWith("gagal") });
    tangkapan.push(`e2e/hasil/${berkas}`);
  }
  await page.setViewport({ width: 1440, height: 900 });
}

function yakin(kondisi: unknown, pesan: string): asserts kondisi {
  if (!kondisi) throw new Error(pesan);
}

async function skenario(nama: string, page: Page, kerja: (catat: (c: string) => void) => Promise<void>, opsi: { abaikan?: RegExp[] } = {}) {
  if (process.env.E2E_FILTER && !new RegExp(process.env.E2E_FILTER, "i").test(nama)) return;
  const mulai = Date.now();
  galatKonsol = [];
  abaikanKonsol = opsi.abaikan ?? [];
  const catatan: string[] = [];
  let lulus = true;
  try {
    await kerja((c) => catatan.push(c));
    const sisa = galatKonsol.filter((g) => !abaikanKonsol.some((r) => r.test(g)));
    if (sisa.length) throw new Error(`galat konsol: ${sisa.slice(0, 3).join(" | ")}`);
    catatan.push("tanpa galat konsol");
  } catch (e) {
    lulus = false;
    catatan.push(`GAGAL: ${e instanceof Error ? e.message : String(e)}${galatKonsol.length ? ` | konsol: ${galatKonsol.slice(0, 2).join(" | ").slice(0, 400)}` : ""}`);
    masalah.push(`${nama}: ${e instanceof Error ? e.message : String(e)}`);
    try {
      await foto(page, `gagal-${nama.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40)}`);
    } catch {
      /* abaikan */
    }
  }
  const detik = ((Date.now() - mulai) / 1000).toFixed(1);
  hasil.push({ skenario: nama, lulus, catatan: `${catatan.join("; ")} (${detik} dtk)` });
  console.log(`${lulus ? "LULUS" : "GAGAL"}  ${nama}  (${detik} dtk)`);
  if (!lulus) console.log("   ", catatan[catatan.length - 1]);
}

/* ------------------------------ pembantu peramban ------------------------------ */

const tunggu = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function adaTeks(page: Page, teks: string, ms = 30_000) {
  await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout: ms }, teks).catch(() => {
    throw new Error(`teks "${teks}" tidak muncul dalam ${ms / 1000} dtk`);
  });
}
const teksHalaman = (page: Page) => page.evaluate(() => document.body.innerText);
const adaModal = (page: Page) => page.$("[role=dialog]").then((e) => e !== null);
async function tungguModal(page: Page, judul: string) {
  await page
    .waitForFunction((j) => [...document.querySelectorAll("[role=dialog] h2")].some((h) => (h.textContent ?? "").trim() === j), { timeout: 15_000 }, judul)
    .catch(() => {
      throw new Error(`modal "${judul}" tidak terbuka`);
    });
}
async function tungguModalTutup(page: Page) {
  await page.waitForFunction(() => !document.querySelector("[role=dialog]"), { timeout: 20_000 }).catch(() => {
    throw new Error("modal tidak tertutup");
  });
}

/**
 * Mencari tombol/tautan menurut teksnya. Bila sebuah modal (role=dialog) terbuka, pencarian dibatasi di dalam modal itu,
 * seperti pengguna sebenarnya. `awalan` memakai teks yang diawali (tautan Unduh memuat teks sr-only sesudah labelnya).
 */
async function cariTombol(page: Page, teks: string, indeks = 0, ms = 15_000, opsi: { awalan?: boolean; luar?: boolean } = {}): Promise<ElementHandle<Element>> {
  const h = await page
    .waitForFunction(
      (t, i, awalan, luar) => {
        const akar = (!luar && document.querySelector("[role=dialog]")) || document;
        const semua = [...akar.querySelectorAll("button, a, [role=button], [role=tab]")].filter((e) => {
          const x = (e.textContent ?? "").replace(/\s+/g, " ").trim();
          return (awalan ? x === t || x.startsWith(`${t} `) : x === t) && !(e as HTMLButtonElement).disabled && e.getAttribute("aria-disabled") !== "true";
        });
        return semua[i] ?? null;
      },
      { timeout: ms },
      teks,
      indeks,
      opsi.awalan ?? false,
      opsi.luar ?? false,
    )
    .catch(() => {
      throw new Error(`tombol/tautan "${teks}" (ke-${indeks}) tidak ditemukan atau nonaktif`);
    });
  return h.asElement() as ElementHandle<Element>;
}
async function klik(page: Page, teks: string, indeks = 0, opsi: { awalan?: boolean; luar?: boolean } = {}) {
  const el = await cariTombol(page, teks, indeks, 15_000, opsi);
  await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await el.click();
}
async function jumlahTombol(page: Page, teks: string, awalan = false) {
  return page.evaluate(
    (t, a) => [...document.querySelectorAll("button, a, [role=button]")].filter((e) => {
      const x = (e.textContent ?? "").replace(/\s+/g, " ").trim();
      return a ? x === t || x.startsWith(`${t} `) : x === t;
    }).length,
    teks,
    awalan,
  );
}
/** Selektor id isian dari label terlihat (label for=id); dibatasi di dalam modal bila ada modal terbuka. */
async function selektorLabel(page: Page, label: string, ms = 10_000): Promise<string> {
  const h = await page
    .waitForFunction(
      (l) => {
        const akar = document.querySelector("[role=dialog]") ?? document;
        const lab = [...akar.querySelectorAll("label")].find((x) => (x.textContent ?? "").replace(/\s+/g, " ").replace(/\*$/, "").trim() === l);
        return lab && (lab as HTMLLabelElement).htmlFor ? (lab as HTMLLabelElement).htmlFor : null;
      },
      { timeout: ms },
      label,
    )
    .catch(() => {
      throw new Error(`isian berlabel "${label}" tidak ditemukan`);
    });
  return `[id="${await h.jsonValue()}"]`;
}
async function isi(page: Page, selektor: string, nilai: string) {
  await page.waitForSelector(selektor, { timeout: 10_000 });
  await page.click(selektor, { count: 3 });
  await page.keyboard.press("Backspace");
  if (nilai) await page.type(selektor, nilai);
}
const isiLabel = async (page: Page, label: string, nilai: string) => isi(page, await selektorLabel(page, label), nilai);
/** Mencentang kotak centang menurut teks labelnya (di dalam modal bila ada). */
async function centang(page: Page, label: string) {
  const ada = await page.evaluate((l) => {
    const akar = document.querySelector("[role=dialog]") ?? document;
    const lab = [...akar.querySelectorAll("label")].find((x) => (x.textContent ?? "").replace(/\s+/g, " ").trim() === l) as HTMLLabelElement | undefined;
    lab?.click();
    return Boolean(lab);
  }, label);
  yakin(ada, `kotak centang "${label}" tidak ditemukan`);
}
/**
 * "Tambah Bagian" membuka M-12; helper mengisi nama, batas maksimal, tipe daftar (jumlah butir, pemisah) dan unsur isi, lalu Terapkan.
 * Mengembalikan nomor baris bagian baru di J-02b.
 */
async function tambahBagian(page: Page, nama: string, o: { batas?: string; daftar?: { butir: string }; unsur?: string[]; tanpaTerapkan?: boolean } = {}): Promise<number> {
  await klik(page, "Tambah Bagian");
  await tungguModal(page, "Tambah Bagian");
  await isiLabel(page, "Nama Bagian", nama);
  if (o.batas) {
    await centang(page, "Tanpa batas maksimal");
    await isiLabel(page, "Maksimal", o.batas);
  }
  if (o.daftar) {
    await pilihLabel(page, "Tipe Isian", (t) => t.startsWith("Daftar ("));
    await isiLabel(page, "Jumlah Butir", o.daftar.butir);
  }
  let n = 0;
  for (const u of o.unsur ?? []) {
    await klik(page, "Tambah Unsur Isi");
    await isiLabel(page, `Unsur ${++n}`, u);
  }
  if (o.tanpaTerapkan) return 0;
  await klik(page, "Terapkan");
  await tungguModalTutup(page);
  return page.$$eval("input[aria-label^='Nama Bagian baris']", (e) => e.length);
}
/** Tangkapan bukti putaran 3 (1440 px) ke docs/bukti-e2e/uc01r3-<nama>.png; dilewati pada run terfilter yang tidak menulis dokumen. */
async function buktiR3(page: Page, nama: string, elemen?: string) {
  const berkas = path.join(ROOT, "docs", "bukti-e2e", `uc01r3-${nama}.png`);
  await new Promise((r) => setTimeout(r, 300));
  if (elemen) {
    const el = await page.$(elemen);
    if (el) return void (await el.screenshot({ path: berkas }));
  }
  await page.screenshot({ path: berkas });
}
async function pilih(page: Page, selektor: string, cocok: (teks: string) => boolean): Promise<string> {
  await page.waitForSelector(selektor, { timeout: 10_000 });
  const opsi = await page.$$eval(`${selektor} option`, (os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: o.textContent ?? "" })));
  const target = opsi.find((o) => o.v && cocok(o.t));
  yakin(target, `opsi tidak ditemukan pada ${selektor}: ${opsi.map((o) => o.t).join(" / ")}`);
  await page.select(selektor, target.v);
  return target.t;
}
const pilihLabel = async (page: Page, label: string, cocok: (teks: string) => boolean) => pilih(page, await selektorLabel(page, label), cocok);
async function isiTanggal(page: Page, selektor: string, iso: string) {
  await page.$eval(
    selektor,
    (el, v) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    iso,
  );
}
const hariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const jalur = (page: Page) => new URL(page.url()).pathname;
async function tungguJalur(page: Page, awalan: string, ms = 30_000) {
  await page.waitForFunction((a) => location.pathname.startsWith(a), { timeout: ms }, awalan).catch(() => {
    throw new Error(`halaman tidak berpindah ke ${awalan} (sekarang ${new URL(page.url()).pathname})`);
  });
}

async function buka(page: Page, url: string, tungguTeks?: string, ms = 60_000) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: Math.max(120_000, ms) });
  if (tungguTeks) await adaTeks(page, tungguTeks, ms);
}

/** Status pada J-06 ("Status pengajuan [Terkirim|Ditahan|Ditolak]"); menunggu sampai pemeriksaan selesai. */
async function tungguStatusPengajuan(page: Page, ms = 150_000): Promise<string> {
  const siap = () => /Status pengajuan\s*(Terkirim|Ditahan|Ditolak)/.test(document.body.innerText);
  // Pemeriksaan latar belakang yang macet (basis data lambat) membuat J-06 menawarkan "Kirim ulang" sesudah 125 dtk (NFR 2.1);
  // tombol itu dipakai satu kali supaya satu gangguan jaringan tidak menggagalkan seluruh run.
  const hasilPertama = await page
    .waitForFunction(() => (/Status pengajuan\s*(Terkirim|Ditahan|Ditolak)/.test(document.body.innerText) ? "siap" : /Kirim ulang/.test(document.body.innerText) ? "ulang" : ""), { timeout: ms })
    .then(async (h) => String(await h.jsonValue()))
    .catch(() => {
      throw new Error("status pengajuan tidak muncul (pemeriksaan tidak selesai)");
    });
  if (hasilPertama === "ulang") {
    await klik(page, "Kirim ulang");
    await page.waitForFunction(siap, { timeout: ms }).catch(() => {
      throw new Error("status pengajuan tidak muncul sesudah Kirim ulang");
    });
  }
  return (await teksHalaman(page)).match(/Status pengajuan\s*(Terkirim|Ditahan|Ditolak)/)![1];
}

/** Unduh lewat fetch di dalam peramban (memakai cookie sesi); .docx dibaca balik dengan mammoth agar isinya dapat diperiksa. */
async function unduh(page: Page, href: string): Promise<{ status: number; tipe: string; disposisi: string; html: string; ukuran: number }> {
  const r = await page.evaluate(async (h) => {
    const res = await fetch(h, { credentials: "include" });
    const b = new Uint8Array(await res.arrayBuffer());
    let s = "";
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return { status: res.status, tipe: res.headers.get("content-type") ?? "", disposisi: res.headers.get("content-disposition") ?? "", b64: btoa(s), ukuran: b.length };
  }, href);
  let html = "";
  if (r.status === 200 && r.tipe.includes("wordprocessingml")) html = (await mammoth.convertToHtml({ buffer: Buffer.from(r.b64, "base64") })).value;
  return { status: r.status, tipe: r.tipe, disposisi: r.disposisi, html, ukuran: r.ukuran };
}
/** Judul bagian di templat bergaya Isian Substansi tercetak huruf besar ("I. DAMPAK SOSIAL E2E"), jadi cocokkan tanpa membedakan huruf. */
const memuatBagian = (html: string, nama: string) => html.toLowerCase().includes(nama.toLowerCase());
const TIPE_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
/** href tautan unduh pertama yang labelnya diawali teks tertentu. */
async function hrefUnduh(page: Page, label: string, indeks = 0): Promise<string> {
  const el = await cariTombol(page, label, indeks, 15_000, { awalan: true });
  return (await el.evaluate((e) => e.getAttribute("href"))) as string;
}

/** Membuka J-03 untuk skema PD (bawaan) dengan tabel butir. */
async function bukaAturan(page: Page, base: string) {
  await page.goto(`${base}/tim-kerja/aturan`, { waitUntil: "domcontentloaded" });
  await adaTeks(page, "Butir Cek", 60_000);
}

/** J-04: membuka J-04b untuk periode utama (bukan periode skala nyata) atau periode skala nyata. */
async function bukaUsulan(page: Page, skala = false) {
  await adaTeks(page, "Buka Usulan", 60_000);
  const href = await page.evaluate((s) => {
    const baris = [...document.querySelectorAll("tbody tr")].find((tr) => (tr.textContent ?? "").includes("Skala Nyata") === s);
    return (baris?.querySelector("a[href^='/tim-kerja/penugasan/']") as HTMLAnchorElement | null)?.getAttribute("href") ?? null;
  }, skala);
  yakin(href, skala ? "baris periode Skala Nyata tidak ada di J-04" : "baris periode utama tidak ada di J-04");
  await Promise.all([page.waitForFunction((h) => location.pathname === h, { timeout: 60_000 }, href), page.evaluate((h) => (document.querySelector(`a[href='${h}']`) as HTMLElement).click(), href)]);
}
/* ------------------------------ server ------------------------------ */

async function portBebas(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, () => {
      const p = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(p));
    });
    s.on("error", reject);
  });
}

async function nyalakanServer(): Promise<{ base: string; proses?: ChildProcess }> {
  if (process.env.E2E_BASE_URL) return { base: process.env.E2E_BASE_URL };
  const port = await portBebas();
  const base = `http://localhost:${port}`;
  const proses = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), BIMA_BASE_URL: base, SEMAR_LLM_MODE: "tiruan", NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  proses.stderr?.on("data", (d) => process.stderr.write(`[server] ${d}`));
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${base}/masuk`);
      if (r.ok) return { base, proses };
    } catch {
      /* belum siap */
    }
    await tunggu(500);
  }
  proses.kill();
  throw new Error("server tidak siap dalam 60 detik (sudah npm run build?)");
}

/* ------------------------------ utama ------------------------------ */

async function utama() {
  jagaBasisData();
  rmSync(HASIL, { recursive: true, force: true }); // hanya folder run ini (subfolder bila terfilter)
  mkdirSync(HASIL, { recursive: true });
  const { base, proses } = await nyalakanServer();
  console.log("Aplikasi berjalan di", base);
  const peramban: Browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });
  const page = await peramban.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.setDefaultTimeout(30_000);
  page.on("dialog", (d) => void d.accept()); // jaga-jaga bila ada konfirmasi bawaan peramban
  page.on("console", (m) => {
    if (m.type() === "error") galatKonsol.push(m.text());
  });
  page.on("pageerror", (e) => galatKonsol.push(`pageerror: ${e instanceof Error ? e.message : String(e)}`));
  const url = (p: string) => `${base}${p}`;

  const atur = async (masa: "berjalan" | "ditutup") => {
    await buka(page, url("/demo"), "Pusat Demo");
    await klik(page, masa);
    await page.waitForFunction((m) => document.querySelector("[data-testid=masa-saat-ini]")?.textContent === m, { timeout: 20_000 }, masa);
  };
  /** Reset & isi data demo lewat modal konfirmasi M-reset. */
  const resetDemo = async () => {
    await buka(page, url("/demo"), "Pusat Demo");
    await tunggu(3000); // hidrasi (di produksi yang cepat, klik sebelum hidrasi tidak melakukan apa pun)
    await klik(page, "Reset & isi data demo");
    await tungguModal(page, "Reset & isi data demo");
    await foto(page, "m-reset-konfirmasi");
    await klik(page, "Reset sekarang");
    await adaTeks(page, "Data demo direset dan diisi ulang.", 240_000);
  };
  const ajukan = async () => {
    await adaTeks(page, "Ajukan Usulan");
    await klik(page, "Ajukan Usulan");
  };
  const judulTab = async (kode: string) => yakin((await page.title()).includes(kode), `judul tab tidak memuat ${kode}: ${await page.title()}`);

  let pathJ08 = "";
  let hrefBerkasJ08 = "";

  try {
    /* ---- beranda, J-01, Pusat Demo ---- */
    await skenario("Beranda diarahkan ke J-01 Masuk", page, async (c) => {
      await page.deleteCookie(...(await page.cookies(base)));
      await buka(page, url("/"), "Masuk dengan akun BIMA");
      yakin(jalur(page) === "/masuk", `/ seharusnya menuju /masuk, bukan ${jalur(page)}`);
      yakin((await jumlahTombol(page, "Buka Pusat Demo")) === 1, "tautan ke Pusat Demo tidak ada di J-01");
      await judulTab("J-01");
      await foto(page, "j01-masuk");
      c("/ menuju J-01; J-01 memuat Masuk dengan akun BIMA dan tautan Buka Pusat Demo");
    });

    await skenario("/demo: Reset & isi data demo lewat modal konfirmasi", page, async (c) => {
      await buka(page, url("/demo"), "Pusat Demo");
      await foto(page, "demo");
      await resetDemo();
      c("modal konfirmasi Reset & isi data demo, seed berhasil");
      await atur("berjalan");
      c("sakelar masa pengusulan berpindah ke berjalan");
    });

    await skenario("SSO J-01 dan guard peran", page, async (c) => {
      await page.deleteCookie(...(await page.cookies(base)));
      await buka(page, url("/masuk"));
      await klik(page, "Masuk dengan akun BIMA");
      await adaTeks(page, "Masuk (simulasi)");
      await foto(page, "bima-masuk");
      const akunAnggota = await page.evaluateHandle(() => [...document.querySelectorAll("a")].find((a) => a.textContent?.includes("Bagas Pramudya")) ?? null);
      yakin(akunAnggota.asElement(), "akun Bagas Pramudya tidak ada di BIMA masuk");
      await (akunAnggota.asElement() as ElementHandle<Element>).click();
      await page.waitForFunction(() => location.pathname === "/tim-kerja/penugasan", { timeout: 30_000 });
      c("anggota Tim Kerja masuk ke J-04");
      const menu = await page.$eval("nav[aria-label^='Menu']", (e) => e.textContent ?? "");
      yakin(!menu.includes("Templat Proposal") && menu.includes("Penugasan Reviewer"), `menu anggota salah: ${menu}`);
      await buka(page, url("/tim-kerja/templat"));
      await page.waitForFunction(() => location.pathname === "/tim-kerja/penugasan" && location.search.includes("galat=akses"), { timeout: 20_000 });
      c("anggota diarahkan dengan ?galat=akses saat membuka J-02");
    });

    /* ---- UC-05 a/b/c ---- */
    await skenario("UC-05a: proposal lolos semua butir (Terkirim) dan unduh templat di BIMA", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-05a"), "Pengajuan proposal");
      await foto(page, "bima-pengajuan");
      const d = await unduh(page, await hrefUnduh(page, "Unduh Templat"));
      yakin(d.status === 200 && d.tipe === TIPE_DOCX && /\.docx/.test(d.disposisi), `Unduh Templat di BIMA: status ${d.status}, tipe ${d.tipe}`);
      yakin((d.html.match(/<p>(?:<strong>)?[A-Z]\. [A-Z]{3,}/g) ?? []).length >= 3, "templat .docx dari BIMA tidak memuat judul bagian berhuruf (A. JUDUL ...)");
      c(`BIMA Unduh Templat: 200, ${d.tipe.split(".").pop()}, ${d.ukuran} byte`);
      await ajukan();
      await tungguJalur(page, "/pengusul/hasil/", 60_000);
      yakin((await tungguStatusPengajuan(page)) === "Terkirim", "status seharusnya Terkirim");
      await adaTeks(page, "Bukti pengiriman");
      await judulTab("J-06");
      const t = await teksHalaman(page);
      yakin(t.includes("Kembali ke BIMA"), "tombol Kembali ke BIMA tidak tampil");
      const baris = await page.$$eval("table tbody tr", (trs) => trs.map((tr) => (tr as HTMLElement).innerText.replace(/\s+/g, " ")));
      const lolos = baris.filter((x) => /\bLolos\b/.test(x)).length;
      yakin(lolos >= 10 && !baris.some((x) => /\bGagal\b/.test(x)), `semua butir seharusnya Lolos (${lolos} lolos dari ${baris.length} baris)`);
      await foto(page, "j06-terkirim");
      c("J-06 menampilkan Terkirim, daftar butir Lolos, Bukti pengiriman, Kembali ke BIMA");
    });

    await skenario("UC-05b / UC-06: ada butir gagal (Ditahan), diperbaiki lalu Terkirim V2", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-05b"), "Pengajuan proposal");
      await ajukan();
      await tungguJalur(page, "/pengusul/hasil/", 60_000);
      yakin((await tungguStatusPengajuan(page)) === "Ditahan", "status seharusnya Ditahan");
      const t = await teksHalaman(page);
      const barisGagal = await page.$$eval("table tbody tr", (trs) => trs.map((tr) => (tr as HTMLElement).innerText.replace(/\s+/g, " ")).filter((x) => /\bGagal\b/.test(x)));
      yakin(barisGagal.length >= 1, "butir Gagal tidak tampil");
      yakin(/Metode/.test(barisGagal[0]) && /kata/.test(barisGagal[0]), `butir Gagal paling atas tidak memuat bagian dan angka pembukti: ${barisGagal[0]}`);
      yakin(!t.includes("Bukti pengiriman"), "bukti pengiriman tidak boleh tampil pada Ditahan");
      c(`butir Gagal paling atas: ${barisGagal[0].slice(0, 120)}`);
      await foto(page, "j06-ditahan");
      await klik(page, "Kembali ke BIMA");
      await page.waitForFunction(() => location.pathname === "/bima/pengajuan", { timeout: 20_000 });
      c("tombol Kembali ke BIMA berfungsi");
      await buka(page, url("/bima/pengajuan?proposal=PRP-2026-0002"), "Ajukan: PRP-2026-0002");
      await page.click("input[name=naskahPerbaikan]");
      await ajukan();
      await tungguJalur(page, "/pengusul/hasil/", 60_000);
      yakin((await tungguStatusPengajuan(page)) === "Terkirim", "setelah diperbaiki, status seharusnya Terkirim");
      await adaTeks(page, "Bukti pengiriman");
      yakin(/Kode versi\s*V2/.test(await teksHalaman(page)), "bukti pengiriman seharusnya memuat kode versi V2");
      await foto(page, "j06-05b-terkirim-v2");
      c("S-1.3/S-1.4: ajukan ulang dengan naskah perbaikan menghasilkan Terkirim, kode versi V2, bukti pengiriman");
    });

    await skenario("UC-06: kata kunci dipisah koma Gagal di J-06 (cekKataKunci)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-06-koma"), "Pengajuan proposal");
      await ajukan();
      await tungguJalur(page, "/pengusul/hasil/", 60_000);
      yakin((await tungguStatusPengajuan(page)) === "Ditahan", "proposal berkata kunci berkoma seharusnya Ditahan");
      const baris = await page.$$eval("table tbody tr", (trs) => trs.map((tr) => (tr as HTMLElement).innerText.replace(/\s+/g, " ")).filter((x) => /\bGagal\b/.test(x)));
      yakin(baris.length === 1 && /Kata kunci/i.test(baris[0]) && /pemisah yang dipakai koma/.test(baris[0]), `hanya butir kata kunci yang seharusnya Gagal dengan penyebab koma: ${baris.join(" || ")}`);
      await foto(page, "j06-kata-kunci-koma");
      c(`J-06: butir kata kunci Gagal karena koma: ${baris[0].slice(0, 160)}`);
    });

    await skenario("UC-05c: ditahan lalu ditolak karena masa pengusulan ditutup (3a)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-05c"), "Pengajuan proposal");
      await ajukan();
      await tungguJalur(page, "/pengusul/hasil/", 60_000);
      yakin((await tungguStatusPengajuan(page)) === "Ditahan", "pengajuan pertama (masa berjalan) seharusnya Ditahan");
      await foto(page, "j06-05c-ditahan");
      await klik(page, "Kembali ke BIMA");
      await page.waitForFunction(() => location.pathname === "/bima/pengajuan", { timeout: 20_000 });
      await klik(page, "Tutup masa pengusulan");
      await page.waitForFunction(() => document.querySelector("[data-testid=masa-bima]")?.textContent === "ditutup", { timeout: 20_000 });
      await klik(page, "Ajukan ulang");
      await ajukan();
      await tungguJalur(page, "/pengusul/hasil/", 60_000);
      yakin((await tungguStatusPengajuan(page)) === "Ditolak", "pengajuan ulang setelah masa ditutup seharusnya Ditolak");
      const t = await teksHalaman(page);
      yakin(/masa pengusulan/i.test(t) && /ditutup/i.test(t), "pemberitahuan masa pengusulan ditutup tidak tampil");
      yakin((await page.$("table")) === null, "daftar butir tidak boleh tampil pada Ditolak");
      const tgl = t.match(/ditutup pada ([^\n.]+)/i)?.[1];
      yakin(tgl, "tanggal tutup tidak tampil pada pesan 3a.2");
      await foto(page, "j06-ditolak");
      c(`Ditahan lebih dulu, lalu Ditolak setelah masa ditutup; pesan 3a.2 memuat tanggal tutup (${tgl})`);
    });

    /* ---- UC-01: J-02 -> J-02b -> M-01 ---- */
    await skenario("UC-01: menyusun templat (J-02, J-02b, S-2, M-01, jalur utama)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-01"), "Templat Berlaku");
      yakin(jalur(page) === "/tim-kerja/templat", `UC-01 seharusnya membuka J-02, bukan ${jalur(page)}`);
      await judulTab("J-02");
      const d0 = await unduh(page, await hrefUnduh(page, "Unduh Templat (.docx)"));
      yakin(d0.status === 200 && d0.tipe === TIPE_DOCX, `Unduh Templat di J-02: ${d0.status} ${d0.tipe}`);
      yakin((await jumlahTombol(page, "Unduh Isian Substansi (.docx)")) >= 1, "J-02 tanpa tombol Unduh Isian Substansi (.docx)");
      yakin((await teksHalaman(page)).includes("Isian Substansi Proposal") && /Kode\s+Nama Bagian\s+Ketentuan\s+Wajib/.test(await teksHalaman(page)), "J-02 tanpa kepala dokumen atau kolom Kode, Nama Bagian, Ketentuan, Wajib");
      c("J-02: Unduh Templat (.docx) menghasilkan 200 dan tipe .docx; kolom Kode, Nama Bagian, Ketentuan, Wajib");
      await foto(page, "j02-templat");
      await klik(page, "Susun Versi Baru");
      await tungguJalur(page, "/tim-kerja/templat/", 30_000);
      await adaTeks(page, "Penyusunan Templat");
      yakin(jalur(page).endsWith("/susun"), "Susun Versi Baru tidak membuka J-02b");
      await judulTab("J-02b");
      await foto(page, "j02b-draf");
      // bagian baru lewat M-12 lalu namanya dikosongkan di tabel: isian bertanda S-2
      const barisUji = await tambahBagian(page, "Bagian Uji S2");
      await isi(page, `input[aria-label='Nama Bagian baris ${barisUji}']`, "");
      await klik(page, "Terbitkan");
      await adaTeks(page, "Lengkapi isian yang ditandai");
      yakin((await page.$$("[aria-invalid=true]")).length > 0, "isian kosong tidak ditandai aria-invalid");
      await tunggu(300);
      yakin(await page.evaluate(() => document.activeElement?.getAttribute("aria-invalid") === "true"), "fokus tidak pindah ke isian bertanda pertama");
      yakin(!(await adaModal(page)), "M-01 tidak boleh terbuka saat isian belum lengkap");
      await foto(page, "j02b-isian-ditandai");
      c("S-2: pesan Lengkapi isian yang ditandai, isian bertanda mendapat fokus, M-01 tidak terbuka");
      const jumlahBaris = await page.$$eval("input[aria-label^='Nama Bagian baris']", (e) => e.length);
      await page.evaluate((n) => (document.querySelector(`button[aria-label='Hapus bagian baris ${n}']`) as HTMLButtonElement | null)?.click(), jumlahBaris);
      await pilihLabel(page, "Periode Berlaku", () => true);
      // M-12 Ketentuan Bagian: baris ke-3 (Kata Kunci), validasi dekat isian, Terapkan memperbarui chip ringkasan
      await klik(page, "Atur Ketentuan", 2);
      await tungguModal(page, "Ketentuan Bagian");
      await adaTeks(page, "Jumlah Butir");
      await isiLabel(page, "Jumlah Butir", "0");
      await adaTeks(page, "Isi bilangan bulat 1 atau lebih");
      yakin(await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].some((b) => b.textContent?.trim() === "Terapkan" && (b as HTMLButtonElement).disabled)), "Terapkan seharusnya nonaktif saat jumlah butir tidak sah");
      await foto(page, "m12-ketentuan-bagian");
      await isiLabel(page, "Jumlah Butir", "5");
      await klik(page, "Terapkan");
      await tungguModalTutup(page);
      yakin((await teksHalaman(page)).includes("5 butir · pemisah ;"), "chip ringkasan '5 butir · pemisah ;' tidak tampil sesudah Terapkan");
      c("M-12: validasi jumlah butir di dekat isian (Terapkan nonaktif), Terapkan memperbarui chip ketentuan");
      // M-12 komprehensif: tipe isian, batas kata minimal dan maksimal, wajib memuat dengan label jenis butir, petunjuk otomatis, pratinjau butir
      await klik(page, "Atur Ketentuan", 1);
      await tungguModal(page, "Ketentuan Bagian");
      const m12 = await page.$eval("[role=dialog]", (e) => (e as HTMLElement).innerText);
      for (const x of ["Tipe Isian", "Batas Kata", "Wajib Memuat", "Petunjuk Pengisian", "Susun ulang petunjuk", "Butir cek yang akan lahir dari bagian ini", "Unsur isi", "Frasa wajib", "Deterministik", "Semantik"]) yakin(m12.includes(x), `M-12 tanpa "${x}"`);
      yakin(m12.includes("Ringkasan memuat urgensi") && /UNS\s+Ringkasan memuat tujuan\s+Semantik/.test(m12), "pratinjau butir M-12 tanpa butir semantik per unsur Ringkasan");
      await isiLabel(page, "Minimal", "500");
      await adaTeks(page, "Minimal tidak boleh melebihi maksimal");
      yakin(await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].some((b) => b.textContent?.trim() === "Terapkan" && (b as HTMLButtonElement).disabled)), "Terapkan seharusnya nonaktif saat minimal melebihi maksimal");
      await isiLabel(page, "Minimal", "100");
      await klik(page, "Terapkan");
      await tungguModalTutup(page);
      yakin((await teksHalaman(page)).includes("100–300 kata"), "chip '100–300 kata' tidak tampil sesudah Terapkan");
      await klik(page, "Atur Ketentuan", 1);
      await tungguModal(page, "Ketentuan Bagian");
      await isiLabel(page, "Minimal", "");
      await klik(page, "Terapkan");
      await tungguModalTutup(page);
      c("M-12: tipe isian, batas minimal dan maksimal (validasi di dekat isian), Wajib Memuat berlabel Deterministik/Semantik, petunjuk otomatis, pratinjau butir turunan");
      // M-13 Templat Lampiran
      await klik(page, "Atur Templat Lampiran", 0);
      await tungguModal(page, "Templat Lampiran");
      await adaTeks(page, "Kalimat Kunci");
      await foto(page, "m13-templat-lampiran");
      await klik(page, "Batal");
      await tungguModalTutup(page);
      c("M-13: Templat Lampiran (formulir bertemplat dengan kalimat kunci) dapat dibuka dan ditutup");
      // keputusan Arsy 23 Okt: Tambah Bagian "Bidang Keilmuan" bertipe daftar 3 butir (;) dengan unsur isi, lalu Terbitkan
      await tambahBagian(page, "Bidang Keilmuan", { daftar: { butir: "3" }, unsur: ["bidang keilmuan utama penelitian"], tanpaTerapkan: true });
      await foto(page, "m12-tambah-bagian-daftar");
      await buktiR3(page, "m12-daftar-unsur", "[role=dialog]");
      await klik(page, "Terapkan");
      await tungguModalTutup(page);
      yakin((await teksHalaman(page)).includes("3 butir · pemisah ;") && (await teksHalaman(page)).includes("1 unsur isi"), "chip '3 butir · pemisah ;' dan '1 unsur isi' tidak tampil untuk bagian baru");
      await buktiR3(page, "j02b-chip-ketentuan");
      await klik(page, "Unduh Pratinjau (.docx)");
      await adaTeks(page, "Pratinjau diunduh dari isian yang baru disimpan.");
      c("J-02b: Tambah Bagian membuka M-12 (tipe daftar 3 butir, unsur isi), chip ketentuan tampil; Unduh Pratinjau (.docx) menyimpan draf lalu mengunduh");
      const idDraf = jalur(page).split("/")[3];
      const paket = await unduh(page, `/api/semar/templat/${idDraf}/unduh`);
      const perlu = ["A. JUDUL", "C. KATA KUNCI", "Tuliskan judul usulan penelitian maksimal 20 kata", "Kementerian Pendidikan Tinggi, Sains, dan Teknologi", "PROPOSAL PENELITIAN", "PROTEKSI ISI PROPOSAL", "SURAT PERNYATAAN", "bersedia menjadi mitra", "[kata kunci 1; kata kunci 2; kata kunci 3; kata kunci 4; kata kunci 5]", "[butir 1; butir 2; butir 3]", "BIDANG KEILMUAN", "[Sisipkan diagram alir penelitian (JPG/PNG)]"];
      const kurang = perlu.filter((x) => !paket.html.includes(x));
      yakin(paket.status === 200 && kurang.length === 0, `paket .docx kurang: ${kurang.join(" | ") || `status ${paket.status}`}`);
      const isianSaja = await unduh(page, `/api/semar/templat/${idDraf}/unduh?mode=isian`);
      yakin(isianSaja.status === 200 && isianSaja.html.includes("A. JUDUL") && !isianSaja.html.includes("PROTEKSI ISI PROPOSAL") && !isianSaja.html.includes("SURAT PERNYATAAN"), "mode=isian seharusnya hanya memuat Isian Substansi");
      c("unduhan .docx: paket lengkap (halaman depan, judul berhuruf A-H dalam tabel berlatar biru muda, petunjuk, tempat isian per jenis, halaman lampiran) dan mode=isian hanya A-H");
      await klik(page, "Terbitkan");
      await tungguModal(page, "Konfirmasi Terbitkan");
      const ringkas = await page.$eval("[role=dialog]", (e) => (e as HTMLElement).innerText);
      yakin(ringkas.includes("Penelitian Dasar") && /Bagian/.test(ringkas) && /Lampiran Wajib/.test(ringkas), `ringkasan M-01 tidak lengkap: ${ringkas.slice(0, 160)}`);
      yakin(/akan membuat \d+ butir deterministik dan \d+ butir semantik \(draf\); kelola di Aturan Pemeriksaan/i.test(ringkas), `M-01 tanpa jumlah butir turunan: ${ringkas.slice(0, 300)}`);
      await foto(page, "m01-konfirmasi-terbitkan");
      await klik(page, "Batal");
      await tungguModalTutup(page);
      c("M-01: ringkasan versi, Batal menutup modal tanpa menerbitkan");
      await klik(page, "Terbitkan");
      await tungguModal(page, "Konfirmasi Terbitkan");
      await klik(page, "Terbitkan");
      await page.waitForFunction(() => location.pathname === "/tim-kerja/templat" && location.search.includes("hasil=terbit"), { timeout: 60_000 });
      await adaTeks(page, "telah terbit");
      const t = await teksHalaman(page);
      yakin(/\d+ butir deterministik dan \d+ butir semantik dibuat sebagai draf/.test(t), "jumlah butir draf deterministik dan semantik tidak ditampilkan");
      yakin((await jumlahTombol(page, "Buka Aturan Pemeriksaan")) === 1, "tombol Buka Aturan Pemeriksaan tidak ada");
      await buktiR3(page, "j02-terbit-butir");
      yakin((await jumlahTombol(page, "Unduh Templat (.docx)", true)) >= 1, "Unduh Templat (.docx) tidak ada sesudah terbit");
      await foto(page, "j02-terbit");
      c("jalur utama: M-01 Terbitkan, hasil s.10 tampil di J-02 dengan jumlah butir draf, Buka Aturan Pemeriksaan, Unduh Templat (.docx)");
      // aturan DIBUAT dari templat, DIKELOLA di J-03: tombol membuka J-03 dengan butir turunan baru tersorot (deterministik dan semantik)
      await klik(page, "Buka Aturan Pemeriksaan");
      await page.waitForFunction(() => location.pathname === "/tim-kerja/aturan" && location.search.includes("sorot="), { timeout: 60_000 });
      await adaTeks(page, "Bidang Keilmuan: tepat 3 butir", 60_000);
      const j03 = await teksHalaman(page);
      yakin(j03.includes("Bidang Keilmuan memuat bidang keilmuan utama penelitian"), "J-03 tanpa butir semantik turunan dari unsur isi bagian baru");
      yakin(j03.includes("Ringkasan memuat urgensi") && j03.includes("Metode memuat prosedur penelitian"), "J-03 tanpa butir semantik turunan bagian bawaan (pemetaan ISI-xx)");
      const jenisTurunan = await page.$$eval("tbody tr[id^='butir-UNS-']", (e) => e.map((x) => (x as HTMLElement).innerText));
      yakin(jenisTurunan.length >= 16 && jenisTurunan.every((x) => /Semantik/i.test(x)), `butir UNS-nn di J-03: ${jenisTurunan.length}`);
      const tersorot = await page.$$eval("tbody tr[aria-current]", (e) => e.length);
      yakin(tersorot >= 20, `butir turunan baru tidak tersorot (${tersorot})`);
      await foto(page, "j03-butir-turunan-baru");
      await buktiR3(page, "j03-butir-turunan");
      c("J-03 dibuka dari Buka Aturan Pemeriksaan: butir turunan baru tersorot, deterministik (KAT bagian baru) dan semantik (UNS per unsur isi, pemetaan ISI-xx)");
    });

    await skenario("UC-01 9a: masa berjalan, draf disimpan, Buka Draf, Back", page, async (c) => {
      await atur("berjalan");
      await buka(page, url("/tim-kerja/templat"), "Templat Berlaku");
      await klik(page, "Susun Versi Baru");
      await adaTeks(page, "Penyusunan Templat");
      await pilihLabel(page, "Periode Berlaku", () => true);
      await klik(page, "Terbitkan");
      await tungguModal(page, "Konfirmasi Terbitkan");
      yakin((await page.$eval("[role=dialog]", (e) => (e as HTMLElement).innerText)).includes("Masa pengusulan sedang berjalan"), "M-01 tidak menyebut masa berjalan");
      await klik(page, "Terbitkan");
      await page.waitForFunction(() => location.pathname === "/tim-kerja/templat" && location.search.includes("hasil=draf"), { timeout: 60_000 });
      await adaTeks(page, "Masa pengusulan skema ini sedang berjalan. Templat disimpan sebagai draf untuk periode berikutnya.");
      yakin((await jumlahTombol(page, "Buka Draf Versi", true)) >= 1 && (await jumlahTombol(page, "Unduh Pratinjau (.docx)", true)) >= 1, "9a tanpa tombol Buka Draf / Unduh Pratinjau");
      const pr = await unduh(page, await hrefUnduh(page, "Unduh Pratinjau (.docx)"));
      yakin(pr.status === 200 && pr.tipe === TIPE_DOCX, `Unduh Pratinjau: ${pr.status}`);
      await foto(page, "j02-9a-draf");
      c("pesan 9a persis, Buka Draf dan Unduh Pratinjau (.docx); templat berlaku tidak berubah");
      await klik(page, "Buka Draf Versi", 0, { awalan: true });
      await adaTeks(page, "Penyusunan Templat");
      await tambahBagian(page, "Bagian Tambahan 9a", { batas: "120" });
      await adaTeks(page, "Ada perubahan yang belum disimpan");
      await klik(page, "Simpan Draf");
      await adaTeks(page, "tersimpan. Buka lagi kapan saja");
      await page.goBack();
      await adaTeks(page, "Masa pengusulan skema ini sedang berjalan.");
      await foto(page, "j02-9a-kembali");
      c("Simpan Draf di J-02b, tombol Back kembali ke J-02 dengan pesan 9a (hasil ada di URL)");
    });

    await skenario("UC-01 S-1: skema belum punya templat", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-01-S1"), "Skema ini belum memiliki templat");
      yakin((await jumlahTombol(page, "Unduh Templat (.docx)", true)) === 0, "skema tanpa templat tidak boleh punya Unduh Templat");
      await foto(page, "j02-s1-belum-ada-templat");
      await klik(page, "Susun Versi Baru");
      await adaTeks(page, "Draf versi 1");
      await foto(page, "j02b-versi-1");
      c("S-1: keterangan Skema ini belum memiliki templat; Susun Versi Baru membuka J-02b untuk versi 1");
    });

    /* ---- UC-02: J-03, M-02..M-05, J-03b ---- */
    await skenario("UC-02: aturan pemeriksaan (J-03, M-02 galat, M-04 4a, J-03b, M-03, M-05 8a)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-02"), "Butir Cek", 60_000);
      yakin(jalur(page) === "/tim-kerja/aturan", `UC-02 seharusnya membuka J-03, bukan ${jalur(page)}`);
      await judulTab("J-03");
      await foto(page, "j03-aturan");
      // 4a: ubah butir turunan templat -> M-04
      const idTerkunci = await page.evaluate(() => {
        const tr = [...document.querySelectorAll("tbody tr")].find((t) => t.querySelector("a[title^='Nilai butir ini terkunci']") && [...t.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Ubah"));
        return tr?.id ?? null;
      });
      yakin(idTerkunci, "tidak ada butir turunan templat");
      const adaNonaktifkan = await page.$eval(`[id="${idTerkunci}"]`, (tr) => [...tr.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Nonaktifkan"));
      yakin(!adaNonaktifkan, "butir templat tidak boleh punya tombol Nonaktifkan");
      await page.$eval(`[id="${idTerkunci}"]`, (tr) => ([...tr.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Ubah") as HTMLButtonElement).click());
      await tungguModal(page, "Butir Turunan Templat");
      await adaTeks(page, "Nilai butir ini berasal dari templat dan hanya dapat diubah melalui jendela J-02 Templat Proposal");
      yakin((await jumlahTombol(page, "Buka Templat Proposal")) >= 1, "tombol Buka Templat Proposal tidak ada");
      yakin((await page.$("[name=kode]")) === null, "form butir tidak boleh terbuka pada 4a");
      await foto(page, "j03-m04-4a");
      await klik(page, "Tutup");
      await tungguModalTutup(page);
      c("4a: M-04 memuat pesan penolakan dan Buka Templat Proposal; form butir tidak dibuka; Tutup menutup modal");

      // M-02: galat inline, lalu simpan butir semantik
      await klik(page, "Tambah Butir");
      await tungguModal(page, "Tambah Butir");
      await klik(page, "Simpan Butir");
      await page.waitForSelector("[role=dialog] [aria-invalid=true]", { timeout: 10_000 });
      await foto(page, "j03-m02-galat");
      c("M-02: isian wajib kosong ditandai di dekat isiannya, modal tetap terbuka");
      await isiLabel(page, "Kode", "SEM-E2E");
      await pilihLabel(page, "Jenis", (t) => /semantik/i.test(t));
      await isiLabel(page, "Deskripsi", "Ringkasan menyebut tujuan penelitian");
      await isiLabel(page, "Pertanyaan Pemeriksaan", "Apakah ringkasan menyebut tujuan penelitian dengan jelas?");
      await isiLabel(page, "Contoh Jawaban", "Tujuan penelitian ini adalah menyusun model prediksi.");
      await pilihLabel(page, "Bagian yang Diperiksa", (t) => t === "Ringkasan");
      await foto(page, "j03-m02-form");
      await klik(page, "Simpan Butir");
      await tungguModalTutup(page);
      await adaTeks(page, "SEM-E2E");
      c("butir manual semantik ditambahkan lewat M-02");

      // J-03b
      await klik(page, "Uji pada Contoh");
      await tungguJalur(page, "/tim-kerja/aturan/uji", 30_000);
      await adaTeks(page, "Hasil per Butir", 90_000);
      await judulTab("J-03b");
      const t3b = await teksHalaman(page);
      yakin(t3b.includes("Ringkasan per Contoh") && t3b.includes("Lolos") && (await jumlahTombol(page, "Uji Ulang")) >= 1 && (await jumlahTombol(page, "Kembali ke Aturan Pemeriksaan")) >= 1, "J-03b tidak lengkap (ringkasan, Lolos, Uji Ulang, Kembali)");
      await foto(page, "j03b-hasil-uji");
      c("J-03b: layar sendiri dengan ringkasan per contoh, tabel butir x contoh, Uji Ulang dan Kembali ke Aturan Pemeriksaan");
      const hrefKode = await page.$eval("tbody a[href*='sorot=']", (a) => a.getAttribute("href"));
      yakin(hrefKode, "kode butir di J-03b tidak menaut ke J-03");
      await Promise.all([page.waitForFunction(() => location.pathname === "/tim-kerja/aturan", { timeout: 30_000 }), page.$eval("tbody a[href*='sorot=']", (a) => (a as HTMLElement).click())]);
      await adaTeks(page, "Butir Cek");
      const sorotan = await page.evaluate(() => {
        const kode = new URLSearchParams(location.search).get("sorot") ?? location.hash.replace("#butir-", "");
        const tr = document.getElementById(`butir-${kode}`);
        if (!tr) return "baris tidak ada";
        const r = tr.getBoundingClientRect();
        return r.top >= 0 && r.top < innerHeight ? "" : "baris tidak tergulir ke layar";
      });
      yakin(!sorotan, sorotan);
      c("kode butir di J-03b menaut ke baris J-03 yang tergulir ke layar");
      await page.goBack();
      await adaTeks(page, "Hasil per Butir");
      c("Back dari J-03 kembali ke J-03b");
      await klik(page, "Kembali ke Aturan Pemeriksaan");
      await adaTeks(page, "Butir Cek");

      // M-03 Nonaktifkan
      await page.$eval(`[id="butir-SEM-E2E"]`, (tr) => ([...tr.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Nonaktifkan") as HTMLButtonElement).click());
      await tungguModal(page, "Konfirmasi Nonaktifkan");
      await foto(page, "j03-m03-nonaktifkan");
      await klik(page, "Nonaktifkan");
      await tungguModalTutup(page);
      await adaTeks(page, "Tampilkan butir nonaktif");
      c("M-03: Nonaktifkan butir manual; butir nonaktif tersembunyi dengan pilihan Tampilkan butir nonaktif");

      // M-05 / 8a
      await atur("berjalan");
      await bukaAturan(page, base);
      await klik(page, "Simpan Versi");
      await tungguModal(page, "Simpan Versi");
      await isiTanggal(page, await selektorLabel(page, "Tanggal Berlaku"), hariIni());
      await klik(page, "Simpan Versi");
      await adaTeks(page, "Tanggal berlaku tidak boleh jatuh di antara tanggal buka dan tanggal tutup");
      yakin(await adaModal(page), "penolakan 8a harus tampil di dalam M-05");
      await foto(page, "j03-m05-8a");
      c("8a: tanggal berlaku di tengah masa pengusulan ditolak di dalam M-05");
      await klik(page, "Batal");
      await tungguModalTutup(page);

      await atur("ditutup");
      await bukaAturan(page, base);
      await klik(page, "Simpan Versi");
      await tungguModal(page, "Simpan Versi");
      await isiTanggal(page, await selektorLabel(page, "Tanggal Berlaku"), hariIni());
      await klik(page, "Simpan Versi");
      await tungguModalTutup(page);
      await adaTeks(page, "Basis aturan versi baru tersimpan");
      // bukti tidak boleh saling bertentangan: tunggu data segar (versi baru berlaku, lencana "sedang disusun" hilang)
      await page.waitForFunction(() => !document.body.innerText.includes("sedang disusun, belum berlaku") && /Basis aturan berlaku: versi \d+, sejak/.test(document.body.innerText), { timeout: 30_000 });
      await foto(page, "j03-versi-tersimpan");
      c("jalur utama: M-05 Simpan Versi menampilkan basis aturan versi baru tersimpan");
    });

    /* ---- UC-03: J-04 -> J-04b -> M-06, M-07 ---- */
    await skenario("UC-03: menugaskan reviewer (J-04, J-04b, S-1, M-06 S-2, M-07, Back)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-03"), "Penugasan Reviewer");
      yakin(jalur(page) === "/tim-kerja/penugasan", `UC-03 seharusnya membuka J-04, bukan ${jalur(page)}`);
      await judulTab("J-04");
      await foto(page, "j04-daftar-periode");
      await bukaUsulan(page, false);
      await adaTeks(page, "Susun Usulan Penugasan");
      await judulTab("J-04b");
      await foto(page, "j04b-awal");
      const batas = await selektorLabel(page, "Batas Beban per Reviewer");
      await isi(page, batas, "1");
      await klik(page, "Susun Usulan Penugasan");
      await adaTeks(page, "Kekurangan Reviewer", 90_000);
      await foto(page, "j04b-s1-kekurangan");
      c("S-1: panel Kekurangan Reviewer tampil");
      await isi(page, batas, "3");
      await klik(page, "Susun Usulan Penugasan");
      await page
        .waitForFunction(() => [...document.querySelectorAll("table")].some((t) => t.querySelector("thead")?.textContent?.includes("Judul Proposal") && t.querySelectorAll("tbody tr").length >= 4), { timeout: 90_000 })
        .catch(() => {
          throw new Error("tabel Usulan Penugasan tidak terisi setelah Susun Usulan Penugasan (batas 3)");
        });
      await adaTeks(page, "Sebaran Beban");
      const jBaris = await page.$$eval("table", (ts) => ts.map((t) => (t.querySelector("thead")?.textContent?.includes("Judul Proposal") ? t.querySelectorAll("tbody tr").length : -1)));
      yakin(jBaris.some((n) => n >= 4), `tabel usulan terlalu sedikit: ${jBaris}`);
      yakin((await page.$("table tbody a[href^='/tim-kerja/proposal/']")) !== null, "judul proposal tidak menaut ke J-05b");
      await foto(page, "j04b-usulan");
      c(`tabel Usulan Penugasan (${Math.max(...jBaris)} baris), Sebaran Beban, judul proposal menaut ke J-05b`);

      const infoBaris = await page.evaluate(() => {
        const tabel = [...document.querySelectorAll("table")].find((t) => t.querySelector("thead")?.textContent?.includes("Judul Proposal"))!;
        const sel = [...tabel.querySelector("tbody tr")!.querySelectorAll("td")].map((td) => td.textContent?.trim() ?? "");
        return { institusiPengusul: sel[2], reviewer: sel[3] };
      });
      await klik(page, "Pindahkan");
      await tungguModal(page, "Pindahkan Proposal");
      const sPengganti = await selektorLabel(page, "Reviewer Pengganti");
      await pilih(page, sPengganti, (t) => t.includes(`(${infoBaris.institusiPengusul})`));
      await klik(page, "Simpan Pemindahan");
      await adaTeks(page, "Pemindahan ditolak, reviewer semula tetap dipakai.");
      yakin(await adaModal(page), "syarat yang dilanggar harus tampil di dalam M-06");
      await foto(page, "j04b-m06-s2-ditolak");
      c("S-2: pemindahan ke reviewer sealmamater ditolak, syarat tampil di dalam M-06");
      await pilih(page, sPengganti, (t) => !t.includes(`(${infoBaris.institusiPengusul})`) && !t.includes(infoBaris.reviewer));
      await klik(page, "Simpan Pemindahan");
      await tungguModalTutup(page);
      await page.waitForFunction((lama) => [...document.querySelectorAll("table")].find((t) => t.querySelector("thead")?.textContent?.includes("Judul Proposal"))?.querySelector("tbody tr")?.querySelectorAll("td")[3]?.textContent?.trim() !== lama, { timeout: 30_000 }, infoBaris.reviewer);
      c("pemindahan yang memenuhi syarat mengganti reviewer dan menutup M-06");

      await klik(page, "Tetapkan Penugasan");
      await tungguModal(page, "Konfirmasi Tetapkan Penugasan");
      await foto(page, "j04b-m07-tetapkan");
      await klik(page, "Tetapkan Penugasan");
      await adaTeks(page, "Penugasan telah ditetapkan dan tercatat di BIMA", 90_000);
      await tungguModalTutup(page);
      yakin((await jumlahTombol(page, "Buka Pemantauan Kesesuaian")) === 1 && (await jumlahTombol(page, "Lihat di Kotak Masuk BIMA (simulasi)")) === 1, "tautan langkah berikut (J-05 dan kotak masuk BIMA) tidak ada");
      // pesan dan data harus tampil serentak: ringkasan sudah "Seluruhnya ditetapkan" dan tabel usulan sudah kosong
      await page.waitForFunction(() => document.querySelector("[data-testid=ringkasan-periode]")?.textContent?.includes("Seluruhnya ditetapkan"), { timeout: 30_000 });
      yakin(!(await teksHalaman(page)).includes("usulan menunggu penetapan"), "ringkasan masih menyebut usulan menunggu penetapan sesudah ditetapkan");
      await foto(page, "j04b-ditetapkan");
      c("M-07: pesan ditetapkan dan tercatat di BIMA dengan tautan ke J-05 dan kotak masuk BIMA");
      await klik(page, "Lihat di Kotak Masuk BIMA (simulasi)");
      await adaTeks(page, "Kotak masuk");
      yakin((await teksHalaman(page)).includes("Penugasan reviewer"), "kotak masuk BIMA tidak memuat penugasan");
      await foto(page, "bima-kotak-masuk");
      c("kotak masuk BIMA tiruan menerima penugasan");
      await page.goBack();
      await tungguJalur(page, "/tim-kerja/penugasan/");
      await adaTeks(page, "Penugasan yang Sudah Ditetapkan");
      c("Back dari kotak masuk BIMA kembali ke J-04b yang memuat penugasan ditetapkan");
    });

    /* ---- UC-04: J-05, M-08, M-09, J-05b ---- */
    await skenario("UC-04: memantau kesesuaian (J-05, M-08, M-09, tautan ke J-03 dan J-05b)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-04"), "Butir Deterministik Paling Sering Gagal", 90_000);
      yakin(jalur(page) === "/tim-kerja/pemantauan", `UC-04 seharusnya membuka J-05, bukan ${jalur(page)}`);
      await judulTab("J-05");
      const t = await teksHalaman(page);
      for (const s of ["kesesuaian per butir", "% disetujui", "butir dengan koreksi tertinggi"]) yakin(t.toLowerCase().includes(s), `bagian "${s}" tidak tampil`);
      await foto(page, "j05-pemantauan");
      c("tiga bagian laporan tampil");
      // kode butir -> baris J-03
      const hrefKode = await page.$eval("a[href*='/tim-kerja/aturan?'][href*='butir=']", (a) => a.getAttribute("href"));
      yakin(hrefKode && /skema=/.test(hrefKode) && /periode=/.test(hrefKode), `kode butir tidak menaut ke J-03: ${hrefKode}`);
      // M-08
      await page.$eval("a[aria-label^='Rincian butir']", (a) => (a as HTMLElement).click());
      await page.waitForFunction(() => [...document.querySelectorAll("[role=dialog] h2")].some((h) => (h.textContent ?? "").startsWith("Rincian Butir")), { timeout: 15_000 });
      yakin(page.url().includes("butir="), "butir yang dibuka tidak tersimpan di URL");
      await foto(page, "j05-m08-rincian-butir");
      const hrefProposal = await page.$eval("[role=dialog] a[href^='/tim-kerja/proposal/']", (a) => a.getAttribute("href")).catch(() => null);
      c(`M-08 (sheet) terbuka, butir di URL; judul proposal di sheet ${hrefProposal ? `menaut ke ${hrefProposal}` : "tanpa tautan"}`);
      await klik(page, "Tutup");
      await tungguModalTutup(page);
      yakin(!page.url().includes("butir="), "butir masih ada di URL sesudah Tutup");
      // M-09
      await klik(page, "Tandai Butir");
      await adaTeks(page, "Pilih minimal satu butir");
      const kotak = await page.$("button[role=checkbox][id^='perbaiki-']");
      yakin(kotak, "tidak ada kotak centang Perlu Diperbaiki");
      await kotak.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await kotak.click();
      await klik(page, "Tandai Butir");
      await tungguModal(page, "Konfirmasi Tandai Butir");
      await foto(page, "j05-m09-tandai");
      await klik(page, "Tandai Butir");
      await tungguModalTutup(page);
      await adaTeks(page, "sekarang berlabel");
      // langkah UC-04 s.7: baris butir tampil berlabel Perlu ditinjau bersama pesan (bukan hanya toast)
      await page.waitForFunction(() => document.body.innerText.includes("Sudah ditandai") && document.body.innerText.includes("Perlu ditinjau"), { timeout: 30_000 }).catch(() => {
        throw new Error("baris butir yang ditandai tidak berlabel Perlu ditinjau di J-05");
      });
      await foto(page, "j05-ditandai");
      await klik(page, "Buka Aturan Pemeriksaan");
      await tungguJalur(page, "/tim-kerja/aturan");
      await adaTeks(page, "Perlu ditinjau");
      await foto(page, "j03-perlu-ditinjau");
      c("M-09: butir yang ditandai berlabel Perlu ditinjau dan tampil di J-03 lewat tautan Buka Aturan Pemeriksaan");
    });

    await skenario("J-05b: rincian proposal, tautan antarentitas, unduh berkas", page, async (c) => {
      await buka(page, url("/demo/mulai?j=J-05b&s=contoh"), "Rincian Proposal", 90_000);
      yakin(jalur(page) === "/tim-kerja/proposal/PRP-2026-0004", `J-05b seharusnya PRP-2026-0004, bukan ${jalur(page)}`);
      await judulTab("J-05b");
      const t = await teksHalaman(page);
      for (const s of ["Identitas", "Berkas"]) yakin(t.includes(s), `bagian ${s} tidak tampil di J-05b`);
      await foto(page, "j05b-rincian-proposal");
      await hrefUnduh(page, "Unduh Berkas");
      const jumlahBerkas = await jumlahTombol(page, "Unduh Berkas", true);
      const sts: number[] = [];
      for (let i = 0; i < jumlahBerkas; i++) sts.push((await unduh(page, await hrefUnduh(page, "Unduh Berkas", i))).status);
      yakin(sts.length >= 1 && sts.every((x) => x === 200), `unduh berkas J-05b: status ${sts}`);
      c(`Unduh Berkas: ${jumlahBerkas} berkas, semua status 200`);
      yakin((await page.$("a[href^='/tim-kerja/penugasan/']")) !== null, "periode tidak menaut ke J-04b");
      await klik(page, "Kembali ke Pemantauan");
      await tungguJalur(page, "/tim-kerja/pemantauan");
      await page.goBack();
      await tungguJalur(page, "/tim-kerja/proposal/");
      c("Kembali ke Pemantauan membuka J-05; Back kembali ke J-05b; periode menaut ke J-04b");
    });

    /* ---- UC-07 / UC-08 / UC-09: J-07, J-08, M-10, J-08b, M-11 ---- */
    const isiSemuaKomponen = async () => {
      const n = await page.$$eval("[id^='kb-m-']", (e) => e.length);
      yakin(n >= 6, `komponen borang hanya ${n}`);
      for (let i = 0; i < n; i++) await page.click(`#kb-m-${i}`);
      return n;
    };

    await skenario("UC-07a: menyetujui seluruh rekomendasi, J-08b dan M-11 Simpan Permanen", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-07a&j08=1"), "Butir Semantik");
      yakin((await jumlahTombol(page, "Tidak Setuju")) >= 1, "tombol Tidak Setuju tidak ada");
      await judulTab("J-08");
      await klik(page, "Lanjut ke Keputusan");
      await adaTeks(page, "Keputusan Komponen Borang");
      yakin(jalur(page).endsWith("/keputusan"), "Lanjut ke Keputusan tidak membuka J-08b");
      await judulTab("J-08b");
      await foto(page, "j08b-keputusan");
      await klik(page, "Simpan Permanen");
      await adaTeks(page, "Belum diputuskan");
      yakin(!(await adaModal(page)), "M-11 tidak boleh terbuka saat komponen belum lengkap");
      await foto(page, "j08b-s1-komponen-kosong");
      c("komponen belum diputuskan ditandai dengan teks, M-11 tidak terbuka");
      await isiSemuaKomponen();
      await isi(page, "textarea[name=umpan-balik]", "Seluruh rekomendasi sistem saya setujui.");
      await klik(page, "Simpan Permanen");
      await tungguModal(page, "Konfirmasi Simpan Permanen");
      await adaTeks(page, "Setelah disimpan permanen, penilaian menjadi hanya-baca dan dikirim ke BIMA.");
      yakin(/\d+ Memenuhi/.test(await page.$eval("[role=dialog]", (e) => (e as HTMLElement).innerText)), "M-11 tanpa ringkasan keputusan");
      await foto(page, "j08b-m11-simpan-permanen");
      await klik(page, "Simpan Permanen");
      await adaTeks(page, "Penilaian tersimpan dan terkirim ke BIMA", 90_000);
      await tungguModalTutup(page);
      yakin((await page.$("textarea[name=umpan-balik][disabled]")) !== null, "isian tidak menjadi hanya-baca");
      await foto(page, "j08b-final");
      await klik(page, "Kembali ke Pemeriksaan");
      await adaTeks(page, "Butir Semantik");
      yakin(!(await teksHalaman(page)).includes("Dikoreksi reviewer"), "tidak boleh ada butir berlabel Dikoreksi reviewer");
      yakin((await jumlahTombol(page, "Lihat Keputusan")) >= 1, "penilaian final seharusnya menampilkan Lihat Keputusan");
      c("rekomendasi tidak dikoreksi dihitung disetujui; Simpan Permanen terkirim ke BIMA, isian hanya-baca");
    });

    await skenario("UC-07c: menyimpan sementara lalu melanjutkan (Draf sudah terisi)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-07c"), "Periksa");
      yakin((await teksHalaman(page)).includes("Draf"), "J-07 seharusnya berlabel Draf");
      await judulTab("J-07");
      await foto(page, "j07-07c-draf");
      await klik(page, "Periksa", 0);
      await adaTeks(page, "Butir Semantik", 60_000);
      await klik(page, "Lanjut ke Keputusan");
      await adaTeks(page, "Keputusan Komponen Borang");
      const umpan = await page.$eval("textarea[name=umpan-balik]", (e) => (e as HTMLTextAreaElement).value);
      yakin(umpan.startsWith("Draf:"), `umpan balik draf tidak dimuat ulang: ${umpan.slice(0, 40)}`);
      yakin((await page.$$eval("[role=radio][aria-checked=true]", (e) => e.length)) >= 3, "keputusan komponen draf tidak dimuat");
      await foto(page, "j08b-07c-draf-dimuat");
      c("J-07 berlabel Draf; J-08b memuat ulang umpan balik dan keputusan komponen tersimpan");
    });

    await skenario("UC-07b/UC-08: pemeriksaan reviewer (J-08, M-10 S-1 dan 4a, J-08b Simpan Sementara dan Permanen)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-07a"), "Periksa");
      yakin((await teksHalaman(page)).includes("Baru"), "label Baru tidak tampil di J-07");
      await foto(page, "j07-daftar-penugasan");
      await buka(page, url("/demo/mulai?k=UC-07a&j08=1"), "Butir Semantik");
      pathJ08 = jalur(page);
      const mulaiBuka = Date.now();
      await buka(page, url(pathJ08), "Butir Semantik");
      const waktuBuka = Date.now() - mulaiBuka;
      c(`J-08 terbuka dalam ${(waktuBuka / 1000).toFixed(1)} dtk`);
      yakin(waktuBuka <= 3000, `J-08 terbuka ${(waktuBuka / 1000).toFixed(1)} dtk (batas NFR 2.3: 3 dtk)`);
      const t = await teksHalaman(page);
      yakin(/Memenuhi|Tidak memenuhi/.test(t) && t.includes("tiruan"), "rekomendasi atau label tiruan tidak tampil");
      // unduh berkas proposal (reviewer pemilik penugasan)
      hrefBerkasJ08 = await hrefUnduh(page, "Unduh Berkas");
      const ub = await unduh(page, hrefBerkasJ08);
      yakin(ub.status === 200, `Unduh Berkas di J-08: status ${ub.status}`);
      c(`Unduh Berkas di J-08: 200 (${ub.tipe})`);
      // klik butir -> sorot kutipan, tersimpan di URL
      const butir = await page.$("button[aria-pressed][id^='judul-butir-']");
      yakin(butir, "tidak ada butir semantik pada tab pertama");
      await butir.click();
      await page.waitForSelector("mark", { timeout: 10_000 });
      await page.waitForFunction(() => location.search.includes("butir="), { timeout: 10_000 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForSelector("mark", { timeout: 20_000 });
      await foto(page, "j08-pemeriksaan");
      c("butir menyorot kutipan (mark); butir dan tab tersimpan di URL sehingga muat ulang mempertahankannya");

      // M-10 S-1
      await klik(page, "Tidak Setuju");
      await tungguModal(page, "Koreksi Rekomendasi");
      await klik(page, "Simpan Koreksi");
      await adaTeks(page, "Alasan koreksi wajib diisi");
      yakin((await page.$("[role=dialog] textarea[aria-invalid=true]")) !== null, "bingkai merah (aria-invalid) pada alasan tidak ada");
      await foto(page, "j08-m10-s1-alasan-kosong");
      c("S-1: pesan Alasan koreksi wajib diisi dengan bingkai merah di dalam M-10");
      await klik(page, "Batal");
      await tungguModalTutup(page);
      c("4a: Batal menutup M-10");
      // koreksi sah
      await klik(page, "Tidak Setuju");
      await tungguModal(page, "Koreksi Rekomendasi");
      await page.click("[role=dialog] [id^='kr-t-']");
      await isi(page, "[role=dialog] textarea[name=alasan-koreksi]", "Kutipan bukan bagian yang menjawab butir ini.");
      await pilih(page, "[role=dialog] [id^='kr-jenis-']", (x) => x === "Kutipan salah tempat");
      await foto(page, "j08-m10-form");
      await klik(page, "Simpan Koreksi");
      await tungguModalTutup(page);
      await adaTeks(page, "Dikoreksi reviewer");
      await foto(page, "j08-dikoreksi");
      c("koreksi tersimpan dan butir berlabel Dikoreksi reviewer");

      // J-08b: simpan sementara
      await klik(page, "Lanjut ke Keputusan");
      await adaTeks(page, "Keputusan Komponen Borang");
      for (let i = 0; i < 3; i++) await page.click(`#kb-m-${i}`);
      await isi(page, "textarea[name=umpan-balik]", "Draf umpan balik reviewer.");
      await klik(page, "Simpan Sementara");
      await adaTeks(page, "Draf penilaian tersimpan");
      await buka(page, url("/reviewer/penugasan"), "Periksa");
      yakin((await teksHalaman(page)).includes("Draf"), "label Draf tidak tampil di J-07");
      await foto(page, "j07-draf");
      c("Simpan Sementara menghasilkan label Draf di J-07");
      const idx = await page.evaluate((h) => [...document.querySelectorAll("a")].filter((a) => a.textContent?.trim() === "Periksa").findIndex((a) => a.getAttribute("href") === h), pathJ08);
      yakin(idx >= 0, "tautan Periksa untuk penugasan skenario tidak ada di J-07");
      await klik(page, "Periksa", idx);
      await adaTeks(page, "Dikoreksi reviewer");
      await klik(page, "Lanjut ke Keputusan");
      await adaTeks(page, "Keputusan Komponen Borang");
      yakin((await page.$eval("textarea[name=umpan-balik]", (e) => (e as HTMLTextAreaElement).value)) === "Draf umpan balik reviewer.", "draf umpan balik tidak dimuat ulang");
      c("draf dan koreksi dimuat ulang saat Periksa lagi (J-07 ke J-08 ke J-08b)");
      await isiSemuaKomponen();
      await isi(page, "textarea[name=umpan-balik]", "Proposal memenuhi syarat administratif; mohon perhatikan kutipan pada Pendahuluan.");
      await klik(page, "Simpan Permanen");
      await tungguModal(page, "Konfirmasi Simpan Permanen");
      await klik(page, "Simpan Permanen");
      await adaTeks(page, "Penilaian tersimpan dan terkirim ke BIMA", 90_000);
      yakin((await page.$("textarea[name=umpan-balik][disabled]")) !== null, "isian tidak menjadi hanya-baca");
      yakin((await jumlahTombol(page, "Kembali ke Daftar Penugasan")) >= 1, "langkah berikut sesudah Simpan Permanen (Kembali ke Daftar Penugasan) tidak ada");
      await foto(page, "j08b-final-sesudah-koreksi");
      c("Simpan Permanen (M-11): terkirim ke BIMA, isian hanya-baca");
    });

    await skenario("UC-09 S-1: kutipan LLM tidak ditemukan (Perlu diperiksa manual)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-09-S1"), "Butir Semantik");
      yakin(await cariTekSemuaTab(page, "Perlu diperiksa manual"), "label Perlu diperiksa manual tidak muncul");
      await foto(page, "j08-s1-perlu-manual");
      c("label Perlu diperiksa manual tampil pada butir yang kutipannya tidak ditemukan");
    });

    await skenario("UC-09 S-2: LLM tidak merespons (Belum ada rekomendasi)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-09-S2"), "Butir Semantik");
      yakin(await cariTekSemuaTab(page, "Belum ada rekomendasi"), "label Belum ada rekomendasi tidak muncul");
      await foto(page, "j08-s2-belum-ada");
      c("label Belum ada rekomendasi tampil; reviewer tetap dapat menilai");
    });

    await skenario("Hak akses: 403 reviewer lain di J-08, J-08b, berkas; Tim Kerja boleh", page, async (c) => {
      yakin(pathJ08 && hrefBerkasJ08, "jalur J-08 atau tautan berkas tidak tercatat dari skenario sebelumnya");
      // masuk sebagai reviewer-1 (bukan pemilik penugasan)
      await buka(page, url(`/api/bima/sesi/masuk?idBima=reviewer-1&kembali=${encodeURIComponent("/api/sso/callback")}`));
      await page.waitForFunction(() => location.pathname === "/reviewer/penugasan", { timeout: 30_000 });
      await buka(page, url(pathJ08), "403 Akses ditolak");
      await foto(page, "j08-403");
      c("halaman J-08 milik reviewer lain menampilkan 403 Akses ditolak");
      const sData = await page.evaluate(async (p) => (await fetch(`${p}/data`)).status, pathJ08);
      yakin(sData === 403, `route data mengembalikan ${sData}, bukan 403`);
      // J-08b memakai tampilan penolakan yang sama dengan J-08 (403 Akses ditolak, tercatat), bukan 404
      await buka(page, url(`${pathJ08}/keputusan`), "403 Akses ditolak");
      const sKeputusan = "403 (tampilan Akses ditolak)";
      const sBerkas = await page.evaluate(async (h) => (await fetch(h)).status, hrefBerkasJ08);
      yakin(sBerkas === 403, `berkas proposal untuk reviewer lain mengembalikan ${sBerkas}, bukan 403`);
      c(`route data 403; J-08b ${sKeputusan}; unduh berkas proposal 403`);
      await buka(page, url("/tim-kerja/proposal/PRP-2026-0004"));
      await page.waitForFunction(() => location.search.includes("galat=akses"), { timeout: 20_000 });
      c("reviewer tidak dapat membuka J-05b (diarahkan dengan ?galat=akses)");
      // Tim Kerja boleh mengunduh berkas
      await buka(page, url(`/api/bima/sesi/masuk?idBima=dppm-pengelola&kembali=${encodeURIComponent("/api/sso/callback")}`));
      await page.waitForFunction(() => location.pathname.startsWith("/tim-kerja/"), { timeout: 30_000 });
      const sTim = await page.evaluate(async (h) => (await fetch(h)).status, hrefBerkasJ08);
      yakin(sTim === 200, `Tim Kerja mengunduh berkas: ${sTim}`);
      // tanpa sesi
      await page.deleteCookie(...(await page.cookies(base)));
      const tanpa = await page.evaluate(async (h) => {
        const r = await fetch(h, { redirect: "manual" });
        return { status: r.status, tipe: r.headers.get("content-type") ?? "", jenis: r.type };
      }, hrefBerkasJ08);
      yakin(tanpa.status !== 200 || tanpa.jenis === "opaqueredirect", `berkas dapat diunduh tanpa sesi: ${JSON.stringify(tanpa)}`);
      c("Tim Kerja mengunduh berkas (200); tanpa sesi tidak dapat");
    }, { abaikan: [/403/, /404/, /401/, /Failed to load resource/] });

    await skenario("Jalan pintas UC-06, UC-08, UC-09 membuka jendela yang benar", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-06"), "Pengajuan proposal");
      c("UC-06 membuka halaman pengajuan BIMA (proposal gagal jumlah kata)");
      await buka(page, url("/demo/mulai?k=UC-08"), "Butir Semantik");
      yakin(page.url().includes("/reviewer/pemeriksaan/"), "UC-08 tidak membuka J-08");
      await buka(page, url("/demo/mulai?k=UC-09"), "Butir Semantik");
      yakin(page.url().includes("/reviewer/pemeriksaan/"), "UC-09 tidak membuka J-08");
      c("UC-08 dan UC-09 membuka J-08 langsung");
      yakin((await page.$("aside[aria-label^='Panduan langkah']")) === null, "panel langkah lama masih tampil");
      c("panel langkah lama tidak ada lagi; navigator menggantikannya");
    });

    /* ---- Alur bolak-balik ---- */
    await skenario("Alur bolak-balik: J-02, J-02b, M-01, unduh .docx, J-03, BIMA, J-06, kembali ke J-02", page, async (c) => {
      const BARU = "Dampak Sosial E2E";
      await resetDemo(); // tanggal berlaku harus lebih akhir daripada versi sebelumnya; mulai dari data bersih
      await atur("ditutup");
      // 1. J-02 -> J-02b: susun versi baru dengan bagian tambahan
      await buka(page, url("/demo/mulai?k=UC-01"), "Templat Berlaku");
      const versiLama = Number((await teksHalaman(page)).match(/Templat Berlaku, Versi (\d+)/)?.[1] ?? 0);
      await klik(page, "Susun Versi Baru");
      await adaTeks(page, "Penyusunan Templat");
      await tambahBagian(page, BARU, { batas: "300" });
      await pilihLabel(page, "Periode Berlaku", () => true);
      // 2. pratinjau .docx (menyimpan draf dulu) memuat bagian baru
      await klik(page, "Unduh Pratinjau (.docx)");
      await adaTeks(page, "Pratinjau diunduh dari isian yang baru disimpan.");
      const idTemplat = jalur(page).split("/")[3];
      const pratinjau = await unduh(page, `/api/semar/templat/${idTemplat}/unduh`);
      yakin(pratinjau.status === 200 && memuatBagian(pratinjau.html, BARU), `pratinjau tidak memuat bagian baru (status ${pratinjau.status})`);
      c("J-02b: pratinjau .docx dari draf yang baru disimpan memuat judul bagian baru");
      // 3. M-01 Terbitkan
      await klik(page, "Terbitkan");
      await tungguModal(page, "Konfirmasi Terbitkan");
      await klik(page, "Terbitkan");
      await page.waitForFunction(() => location.search.includes("hasil=terbit"), { timeout: 60_000 });
      await adaTeks(page, "telah terbit");
      // 4. unduh templat dari J-02 dan periksa judul bagian (Heading 1)
      const d1 = await unduh(page, await hrefUnduh(page, "Unduh Templat (.docx)"));
      yakin(d1.status === 200 && new RegExp(`<p>(?:<strong>)?[A-Z]\\. [^<]*${BARU}`, "i").test(d1.html), `templat .docx tidak memuat judul bagian berhuruf "${BARU}"`);
      await foto(page, "bolak-balik-j02-terbit");
      c(`J-02: Unduh Templat (.docx) memuat "${BARU}" sebagai judul bagian`);
      // 5. J-03 menampilkan butir turunan baru
      await klik(page, "Buka Aturan Pemeriksaan");
      await adaTeks(page, `Bagian wajib "${BARU}" terisi di naskah`, 60_000);
      await foto(page, "bolak-balik-j03-butir-baru");
      c("J-03: butir turunan templat baru muncul");
      await klik(page, "Simpan Versi");
      await tungguModal(page, "Simpan Versi");
      await isiTanggal(page, await selektorLabel(page, "Tanggal Berlaku"), hariIni());
      await klik(page, "Simpan Versi");
      await tungguModalTutup(page);
      await adaTeks(page, "Basis aturan versi baru tersimpan");
      // 6. BIMA pengajuan: unduh templat terbit, lalu ajukan
      await buka(page, url("/demo/mulai?k=UC-05a"), "Pengajuan proposal");
      const dB = await unduh(page, await hrefUnduh(page, "Unduh Templat"));
      yakin(dB.status === 200 && memuatBagian(dB.html, BARU), "templat di BIMA belum memuat bagian baru");
      await foto(page, "bolak-balik-bima-unduh-templat");
      c("BIMA pengajuan: Unduh Templat memuat bagian baru");
      await ajukan();
      await tungguJalur(page, "/pengusul/hasil/", 60_000);
      const status = await tungguStatusPengajuan(page);
      const barisBaru = await page.$$eval("table tbody tr", (trs, b) => trs.map((tr) => (tr as HTMLElement).innerText.replace(/\s+/g, " ")).filter((x) => x.includes(b)), BARU);
      yakin(barisBaru.length >= 1, `J-06 tidak memeriksa bagian baru (status ${status})`);
      yakin(status === "Ditahan" && /Gagal/.test(barisBaru[0]), `bagian baru seharusnya Gagal dan pengajuan Ditahan: ${status}, ${barisBaru[0]}`);
      await foto(page, "bolak-balik-j06-bagian-baru");
      c(`J-06: butir bagian baru diperiksa dan Gagal (naskah lama tidak memuat bagian itu), status ${status}`);
      // 7. kembali ke J-02: riwayat versi
      await buka(page, url("/demo/pindah?j=J-02"), "Riwayat Versi");
      const t = await teksHalaman(page);
      yakin(/Terbit/.test(t) && /Arsip/.test(t), "riwayat versi tidak memuat Terbit dan Arsip");
      await klik(page, "Lihat", 1, { awalan: true }); // baris kedua = versi Arsip (baris pertama = versi Terbit yang sedang berlaku)
      await page.waitForFunction(() => location.search.includes("versi="), { timeout: 20_000 });
      await adaTeks(page, "(Arsip)");
      const dLama = await unduh(page, await hrefUnduh(page, "Unduh Templat (.docx)"));
      yakin(dLama.status === 200 && !memuatBagian(dLama.html, BARU), "versi arsip seharusnya tidak memuat bagian baru");
      yakin(versiLama >= 1, "versi lama tidak terbaca");
      await foto(page, "bolak-balik-j02-riwayat");
      c("J-02: Riwayat Versi memuat Terbit dan Arsip; versi Arsip dapat dibuka dan diunduh tanpa bagian baru");
    });

    await skenario("Reset data demo sesudah alur bolak-balik", page, async (c) => {
      await resetDemo();
      await atur("berjalan");
      c("data demo dipulihkan");
    });

    /* ---- Navigator demo ---- */
    const bukaNavigator = async () => {
      if (!(await page.$("[data-testid=navigator-panel]"))) await page.click("[data-testid=navigator-pil]");
      await page.waitForSelector("[data-testid=navigator-panel]", { timeout: 10_000 });
    };
    const ciutkanNavigator = async () => {
      if (await page.$("[data-testid=navigator-panel]")) await page.click("[aria-label='Ciutkan navigator demo']");
      await page.waitForSelector("[data-testid=navigator-pil]", { timeout: 10_000 });
    };
    /** Memilih jendela atau skenario lewat navigator dan menunggu halaman tujuan terbuka. */
    const lewatNavigator = async (selektor: string, tungguTeks: string, ms = 120_000) => {
      await bukaNavigator();
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: ms }), page.click(`[data-testid=navigator-panel] ${selektor}`)]);
      await adaTeks(page, tungguTeks, ms);
      await page.waitForSelector("[data-testid=navigator-pil]", { timeout: 10_000 });
      yakin((await page.$("[data-testid=navigator-panel]")) === null, `panel navigator tetap terbuka sesudah memilih ${selektor}`);
    };
    const tidakTertutupNavigator = (selektor: string) =>
      page.evaluate((sel) => {
        const e = document.querySelector(sel);
        if (!e) return `tidak ada ${sel}`;
        e.scrollIntoView({ block: "center" });
        const r = e.getBoundingClientRect();
        const di = document.elementFromPoint(r.left + Math.min(r.width / 2, 40), r.top + r.height / 2);
        return di && (e === di || e.contains(di)) ? "" : `${sel} tertutup oleh ${di?.getAttribute("data-testid") ?? di?.tagName}`;
      }, selektor);
    const aktifNavigator = () => page.$eval("[data-testid=navigator-aktif]", (e) => e.textContent ?? "");
    const ringkasanUsulan = () => page.$eval("[data-testid=ringkasan-usulan]", (e) => e.textContent ?? "");

    await skenario("Navigator demo: pindah layar/peran tidak mengubah data; 15 layar dapat dibuka", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-02"), "Butir Cek", 60_000);
      yakin((await page.$("[data-testid=navigator-pil]")) !== null, "pil navigator tidak ada di J-03");
      yakin((await page.$("[data-testid=navigator-panel]")) === null, "navigator seharusnya ciut bawaan");
      await bukaNavigator();
      const jendela = await page.$$eval("[data-testid=navigator-panel] [data-jendela]", (e) => e.map((x) => x.getAttribute("data-jendela")));
      for (const k of ["J-01", "J-02", "J-02b", "J-03", "J-03b", "J-04", "J-04b", "J-05", "J-05b", "J-06", "J-07", "J-08", "J-08b", "BIMA-1", "BIMA-2"]) yakin(jendela.includes(k), `navigator tanpa ${k}: ${jendela}`);
      yakin(jendela.length === 15, `navigator seharusnya 15 layar, ada ${jendela.length}`);
      const aktif = await page.$eval("[data-testid=navigator-panel] [aria-current=page]", (e) => e.getAttribute("data-jendela"));
      yakin(aktif === "J-03", `jendela aktif seharusnya J-03, bukan ${aktif}`);
      await foto(page, "navigator-terbuka-j03");
      c("navigator memuat 15 layar dan menandai J-03 sebagai layar yang dibuka");

      // satu dunia data: usulan menunggu penetapan tetap ada sesudah pindah layar dan peran
      await buka(page, url("/demo/mulai?j=J-04b&s=menunggu"), "Susun Usulan Penugasan");
      const sebelum = await ringkasanUsulan();
      yakin(sebelum.includes("usulan menunggu penetapan"), `J-04b menunggu tanpa usulan: ${sebelum}`);
      await lewatNavigator("[data-jendela='J-07']", "Periksa");
      yakin(jalur(page) === "/reviewer/penugasan" && (await teksHalaman(page)).includes("Dr. Intan Maharani"), "J-07 tidak terbuka sebagai reviewer");
      await lewatNavigator("[data-jendela='J-04b']", "Susun Usulan Penugasan");
      const sesudah = await ringkasanUsulan();
      yakin(sesudah === sebelum, `pindah layar mengubah data: "${sebelum}" menjadi "${sesudah}"`);
      c("pindah layar/peran (J-04b ke J-07 ke J-04b) tidak mengubah data usulan");

      // semua layar dapat dibuka
      const tujuan: [string, string, string][] = [
        ["J-04", "Penugasan Reviewer", "/tim-kerja/penugasan"],
        ["J-05", "Pemantauan Kesesuaian", "/tim-kerja/pemantauan"],
        ["J-05b", "Rincian Proposal", "/tim-kerja/proposal/"],
        ["J-06", "Status pengajuan", "/pengusul/hasil/"],
        ["J-02", "Templat Proposal", "/tim-kerja/templat"],
        ["J-02b", "Templat Proposal", "/tim-kerja/templat"],
        ["J-03", "Aturan Pemeriksaan", "/tim-kerja/aturan"],
        ["J-03b", "Hasil per Butir", "/tim-kerja/aturan/uji"],
        ["J-08", "Butir Semantik", "/reviewer/pemeriksaan/"],
        ["J-08b", "Keputusan Komponen Borang", "/reviewer/pemeriksaan/"],
        ["BIMA-1", "Pengajuan proposal", "/bima/pengajuan"],
        ["BIMA-2", "Kotak masuk", "/bima/kotak-masuk"],
        ["J-01", "Masuk dengan akun BIMA", "/masuk"],
      ];
      for (const [kode, teks, awalan] of tujuan) {
        await lewatNavigator(`[data-jendela='${kode}']`, teks, 120_000);
        yakin(jalur(page).startsWith(awalan), `${kode} membuka ${jalur(page)}, bukan ${awalan}`);
      }
      yakin((await page.$("[data-testid=navigator-pil]")) !== null, "navigator tidak tampil di halaman Masuk");
      c("J-01..J-08b dan dua halaman BIMA dapat dibuka dari navigator lewat Pindah layar");
    });

    await skenario("Navigator demo: skenario J-04 dan J-04b, aktif ditampilkan, Pasang skenario menyiapkan data", page, async (c) => {
      await buka(page, url("/demo/mulai?j=J-04&s=kosong"), "Penugasan Reviewer");
      await ciutkanNavigator();
      const daftar = await page.$eval("table tbody", (e) => (e as HTMLElement).innerText).catch(() => "");
      yakin(daftar.includes("Penelitian") || /\d/.test(daftar) || (await teksHalaman(page)).includes("Belum ada periode"), "J-04 kosong tanpa daftar periode");
      await page.waitForFunction(() => document.querySelector("[data-testid=navigator-pil]")?.textContent?.includes("Kosong"), { timeout: 10_000 }).catch(() => {
        throw new Error("pil tidak menampilkan skenario aktif");
      });
      await foto(page, "j04-kosong");
      await bukaNavigator();
      yakin((await aktifNavigator()).includes("J-04 · Kosong"), `panel tidak menyebut skenario aktif: ${await aktifNavigator()}`);
      yakin((await page.$eval("[data-skenario=kosong]", (e) => e.getAttribute("aria-pressed"))) === "true", "tombol skenario Kosong tidak ditandai aktif");
      const jumlahSkenario = await page.$$eval("[data-testid=navigator-panel] [data-skenario]", (e) => e.length);
      yakin(jumlahSkenario === 6, `J-04 seharusnya 6 skenario, ada ${jumlahSkenario}`);
      await foto(page, "navigator-skenario-j04");
      c("J-04 Kosong: daftar periode tampil, pil dan panel menyebut skenario aktif, 6 skenario");

      await lewatNavigator("[data-skenario='siap-kecil']", "Penugasan Reviewer");
      const baris = await page.$eval("table tbody", (e) => (e as HTMLElement).innerText);
      yakin(/(^|\D)6(\D|$)/.test(baris), `J-04 siap-kecil tidak menampilkan 6 proposal belum ditugaskan: ${baris.slice(0, 120)}`);
      c("J-04 siap-kecil: daftar periode menampilkan enam proposal belum ditugaskan");

      // J-04b: skenario di layar turunan
      await lewatNavigator("[data-jendela='J-04b']", "Susun Usulan Penugasan");
      await lewatNavigator("[data-skenario='siap']", "Susun Usulan Penugasan");
      const siap = await ringkasanUsulan();
      const enam = siap.match(/(\d+) proposal Terkirim belum punya penugasan tetap/)?.[1];
      yakin(enam === "6", `J-04b siap seharusnya tepat 6 proposal Terkirim, ada ${enam}`);
      yakin((await teksHalaman(page)).includes("Belum ada usulan penugasan"), "J-04b siap seharusnya menyuruh menyusun usulan");
      const tertutup = await tidakTertutupNavigator("input[name=batas]");
      yakin(!tertutup, tertutup);
      c("J-04b siap: enam proposal; navigator ciut tidak menutupi isian Batas Beban");
      // pil tidak menyebut skenario jendela lain
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), page.evaluate(() => (document.querySelector("nav[aria-label^='Menu'] a[href^='/tim-kerja/pemantauan']") as HTMLElement).click())]);
      await adaTeks(page, "Pemantauan Kesesuaian");
      await tunggu(1500);
      const pilLain = await page.$eval("[data-testid=navigator-pil]", (e) => e.textContent ?? "");
      yakin(pilLain.includes("J-05") && !pilLain.includes("Siap") && pilLain.includes("belum dipilih"), `pil memuat skenario jendela lain: ${pilLain}`);
      c(`pil di jendela yang dibuka lewat menu tidak menyebut skenario jendela lain (${pilLain})`);

      await buka(page, url("/demo/mulai?j=J-04b&s=siap"), "Susun Usulan Penugasan");
      await lewatNavigator("[data-skenario='menunggu']", "Usulan Penugasan");
      await page.waitForFunction(() => document.querySelectorAll("table tbody tr").length >= 4, { timeout: 30_000 });
      yakin((await ringkasanUsulan()).includes("usulan menunggu penetapan"), "usulan menunggu penetapan tidak tampil");
      await foto(page, "j04b-menunggu");
      c("J-04b menunggu: tabel Usulan Penugasan terisi");

      await lewatNavigator("[data-skenario='kekurangan']", "Susun Usulan Penugasan", 180_000);
      await page.waitForFunction(() => document.querySelector("#panel-kekurangan h2")?.textContent?.trim() === "Kekurangan Reviewer", { timeout: 180_000 }).catch(() => {
        throw new Error("panel Kekurangan Reviewer (#panel-kekurangan) tidak muncul sesudah Susun otomatis");
      });
      await foto(page, "j04b-kekurangan-navigator");
      c("J-04b kekurangan: Susun otomatis dan panel Kekurangan Reviewer tampil");

      await lewatNavigator("[data-skenario='ditetapkan']", "Penugasan yang Sudah Ditetapkan", 180_000);
      await foto(page, "j04b-ditetapkan-navigator");
      await buka(page, url("/bima/kotak-masuk"), "Kotak masuk");
      yakin((await teksHalaman(page)).includes("Penugasan reviewer"), "kotak masuk BIMA kosong sesudah ditetapkan");
      c("J-04b ditetapkan: penugasan tampil dan tercatat di kotak masuk BIMA");
    });

    await skenario("Navigator demo: skenario di J-01, J-02, J-03, J-05, J-06, J-07, J-08, BIMA", page, async (c) => {
      await buka(page, url("/demo/mulai?j=J-01&s=belum-masuk"), "Masuk dengan akun BIMA");
      await lewatNavigator("[data-skenario='anggota']", "Penugasan Reviewer");
      const menu = await page.$eval("nav[aria-label^='Menu']", (e) => e.textContent ?? "");
      yakin(!menu.includes("Templat Proposal") && menu.includes("Penugasan Reviewer") && menu.includes("Pemantauan Kesesuaian"), `menu anggota salah: ${menu}`);
      await tunggu(1500);
      const pilAnggota = await page.$eval("[data-testid=navigator-pil]", (e) => e.textContent ?? "");
      yakin(pilAnggota.includes("J-01") && pilAnggota.includes("Masuk sebagai Tim Kerja (anggota)") && !pilAnggota.includes("belum dipilih"), `pil sesudah J-01 anggota salah: ${pilAnggota}`);
      await buka(page, url("/demo/mulai?j=J-01&s=reviewer"), "Daftar Penugasan");
      await tunggu(1500);
      const pilRev = await page.$eval("[data-testid=navigator-pil]", (e) => e.textContent ?? "");
      yakin(pilRev.includes("J-01") && pilRev.includes("Masuk sebagai Reviewer"), `pil sesudah J-01 reviewer salah: ${pilRev}`);
      c("J-01: belum masuk, masuk sebagai anggota (menu J-04/J-05 saja), masuk sebagai reviewer (J-07)");
      await buka(page, url("/demo/mulai?j=J-02&s=tanpa-templat"), "Skema ini belum memiliki templat");
      await lewatNavigator("[data-skenario='masa-berjalan']", "Templat Proposal");
      await lewatNavigator("[data-skenario='draf-tersimpan']", "Templat Proposal");
      yakin((await jumlahTombol(page, "Buka Draf Versi", true)) >= 1, "draf tersimpan tidak dibuka (tombol Buka Draf Versi tidak ada)");
      await lewatNavigator("[data-skenario='normal']", "Templat Berlaku");
      // J-02b butuh id templat, jadi "pindah" ke J-02b mendarat di J-02; layar penyusunan dibuka lewat skenarionya
      await buka(page, url("/demo/mulai?j=J-02b&s=draf"), "Penyusunan Templat");
      await lewatNavigator("[data-skenario='draf']", "Penyusunan Templat");
      yakin(jalur(page).endsWith("/susun"), "skenario J-02b tidak membuka layar penyusunan");
      c("J-02: tanpa templat (S-1), masa berjalan (9a), draf tersimpan; J-02b membuka draf di layar penyusunan");
      await buka(page, url("/demo/mulai?j=J-03&s=perlu-ditinjau"), "Butir Cek", 90_000);
      yakin((await teksHalaman(page)).includes("Perlu ditinjau"), "butir Perlu ditinjau tidak tampil di J-03");
      await foto(page, "j03-perlu-ditinjau-navigator");
      await lewatNavigator("[data-skenario='normal']", "Butir Cek", 90_000);
      yakin(!(await teksHalaman(page)).includes("Perlu ditinjau"), "skenario normal J-03 seharusnya tanpa butir Perlu ditinjau");
      await buka(page, url("/demo/mulai?j=J-03b&s=hasil"), "Hasil per Butir", 120_000);
      await lewatNavigator("[data-skenario='hasil']", "Hasil per Butir", 120_000);
      c("J-03: butir Perlu ditinjau muncul pada skenario khusus dan hilang pada normal; J-03b membuka laporan uji");
      await buka(page, url("/demo/mulai?j=J-05&s=belum-final"), "Belum ada penilaian final untuk periode dan skema ini.", 90_000);
      await foto(page, "j05-belum-final");
      await lewatNavigator("[data-skenario='contoh']", "Butir Deterministik Paling Sering Gagal", 120_000);
      yakin(!(await teksHalaman(page)).includes("Belum ada penilaian final untuk periode dan skema ini."), "J-05 contoh seharusnya memuat penilaian final");
      c("J-05: belum ada penilaian final lalu data pemantauan contoh");
      await buka(page, url("/demo/mulai?j=J-06&s=terkirim"), "Bukti pengiriman");
      yakin((await tungguStatusPengajuan(page)) === "Terkirim", "J-06 terkirim");
      await lewatNavigator("[data-skenario='ditahan']", "belum terpenuhi");
      yakin((await tungguStatusPengajuan(page)) === "Ditahan", "J-06 ditahan");
      await foto(page, "j06-ditahan-navigator");
      await lewatNavigator("[data-skenario='ditolak']", "Pengajuan ditolak");
      yakin((await tungguStatusPengajuan(page)) === "Ditolak", "J-06 ditolak");
      await lewatNavigator("[data-skenario='diperiksa']", "Pemeriksaan sedang berjalan");
      c("J-06: Terkirim, Ditahan, Ditolak, dan Sedang diperiksa");
      await buka(page, url("/demo/mulai?j=J-07&s=kosong"), "Belum ada proposal yang ditugaskan kepada Anda.");
      await lewatNavigator("[data-skenario='baru']", "Periksa");
      yakin((await teksHalaman(page)).includes("Baru"), "J-07 baru tanpa label Baru");
      await lewatNavigator("[data-skenario='draf']", "Periksa");
      yakin((await teksHalaman(page)).includes("Draf"), "J-07 draf tanpa label Draf");
      await lewatNavigator("[data-skenario='selesai']", "Selesai");
      yakin((await jumlahTombol(page, "Periksa")) >= 1, "J-07 selesai tanpa tombol Periksa");
      c("J-07: kosong, Baru, Draf, Selesai");
      await buka(page, url("/demo/mulai?j=J-08&s=final"), "Penilaian final: koreksi tidak dapat diubah lagi.");
      yakin((await jumlahTombol(page, "Tidak Setuju")) === 0, "J-08 final tidak boleh punya tombol Tidak Setuju");
      await foto(page, "j08-final-navigator");
      await lewatNavigator("[data-skenario='perlu-manual']", "Butir Semantik");
      yakin(await cariTekSemuaTab(page, "Perlu diperiksa manual"), "J-08 perlu-manual tanpa label Perlu diperiksa manual");
      await lewatNavigator("[data-skenario='belum-rekomendasi']", "Butir Semantik");
      yakin(await cariTekSemuaTab(page, "Belum ada rekomendasi"), "J-08 tanpa label Belum ada rekomendasi");
      await lewatNavigator("[data-skenario='draf']", "Butir Semantik");
      await lewatNavigator("[data-skenario='normal']", "Butir Semantik");
      c("J-08: final hanya-baca, perlu diperiksa manual, belum ada rekomendasi, draf, normal");
      await buka(page, url("/demo/mulai?j=BIMA-1&s=ditahan"), "Pengajuan proposal");
      yakin((await jumlahTombol(page, "Ajukan Usulan")) >= 1, "BIMA pengajuan tanpa tombol Ajukan Usulan");
      c("BIMA tiruan: halaman pengajuan membuka draf siap diajukan");
    });

    await skenario("Navigator demo: sakelar masa pengusulan, papan ketik, dan ciut", page, async (c) => {
      await buka(page, url("/demo/mulai?j=J-04b&s=siap"), "Susun Usulan Penugasan");
      await bukaNavigator();
      await page.click("[data-testid=navigator-panel] [data-masa=berjalan]");
      await page.waitForFunction(() => document.querySelector("[data-testid=navigator-panel] [data-masa=berjalan]")?.getAttribute("aria-pressed") === "true", { timeout: 20_000 });
      await page.waitForFunction(() => document.body.innerText.includes("belum ditutup"), { timeout: 20_000 });
      await page.click("[data-testid=navigator-panel] [data-masa=ditutup]");
      await page.waitForFunction(() => document.querySelector("[data-testid=navigator-panel] [data-masa=ditutup]")?.getAttribute("aria-pressed") === "true", { timeout: 20_000 });
      await page.waitForFunction(() => !document.body.innerText.includes("belum ditutup"), { timeout: 20_000 });
      c("sakelar masa pengusulan di navigator mengganti keadaan J-04b (berjalan lalu ditutup)");
      await page.focus("[data-testid=navigator-panel] [data-jendela]");
      await page.keyboard.press("Escape");
      await page.waitForSelector("[data-testid=navigator-pil]", { timeout: 10_000 });
      yakin((await page.$("[data-testid=navigator-panel]")) === null, "Esc tidak menciutkan navigator");
      await page.keyboard.down("Alt");
      await page.keyboard.down("Shift");
      await page.keyboard.press("KeyN");
      await page.keyboard.up("Shift");
      await page.keyboard.up("Alt");
      await page.waitForSelector("[data-testid=navigator-panel]", { timeout: 10_000 });
      yakin(await page.evaluate(() => document.querySelector("[data-testid=navigator-panel]")?.contains(document.activeElement)), "fokus tidak pindah ke panel navigator");
      await page.keyboard.press("Tab");
      const fokusTombol = await page.evaluate(() => document.activeElement?.tagName);
      yakin(fokusTombol === "BUTTON" || fokusTombol === "A", `Tab seharusnya menjangkau tombol atau tautan, bukan ${fokusTombol}`);
      c("papan ketik: Esc menciutkan, Alt+Shift+N membuka, fokus pindah ke panel, Tab menjangkau tombol");
      await ciutkanNavigator();
      const tumpang = await page.evaluate(() => {
        const pil = document.querySelector("[data-testid=navigator-pil]")!.getBoundingClientRect();
        return [...document.querySelectorAll("main button")]
          .filter((b) => {
            const r = b.getBoundingClientRect();
            return r.width > 0 && r.bottom > 0 && r.top < innerHeight && !(r.right < pil.left || r.left > pil.right || r.bottom < pil.top || r.top > pil.bottom);
          })
          .map((b) => b.textContent?.trim());
      });
      yakin(tumpang.length === 0, `pil navigator menutupi tombol: ${tumpang.join(", ")}`);
      await foto(page, "navigator-ciut");
      c("navigator ciut tidak menutupi tombol utama di J-04b (viewport 1440x900)");
    });

    /* ---- J-04 skala nyata ---- */
    await skenario("J-04 skala nyata: 10.000 proposal (S-1, susun, halaman dan Back, sebaran, M-07 tetapkan, kotak masuk BIMA)", page, async (c) => {
      const lama = (mulai: number) => ((Date.now() - mulai) / 1000).toFixed(1);
      let t = Date.now();
      await buka(page, url("/demo/mulai?j=J-04&s=skala"), "Penugasan Reviewer");
      c(`menyiapkan skenario skala nyata (buka J-04): ${lama(t)} dtk`);
      await bukaUsulan(page, true);
      await adaTeks(page, "Susun Usulan Penugasan");
      const awal = await ringkasanUsulan();
      yakin(/10\.000 proposal Terkirim belum punya penugasan tetap/.test(awal), `J-04b skala tidak memuat 10.000 proposal: ${awal.slice(0, 120)}`);
      const batas = await selektorLabel(page, "Batas Beban per Reviewer");
      yakin((await page.$eval(batas, (e) => (e as HTMLInputElement).value)) === "100", "batas beban bawaan seharusnya 100");
      await foto(page, "j04b-skala-awal");
      await isi(page, batas, "60");
      t = Date.now();
      await klik(page, "Susun Usulan Penugasan");
      await adaTeks(page, "Kekurangan Reviewer", 120_000);
      c(`S-1 batas 60: panel Kekurangan Reviewer tampil (${lama(t)} dtk)`);
      await foto(page, "j04b-skala-s1");
      await isi(page, batas, "100");
      t = Date.now();
      await klik(page, "Susun Usulan Penugasan");
      await adaTeks(page, "Usulan penugasan disusun untuk 10.000 proposal", 240_000);
      const waktuSusun = lama(t);
      const pesanSusun = await page.evaluate(() => document.body.innerText.match(/Waktu proses di server: [\d,]+ detik/)?.[0] ?? "");
      c(`Susun Usulan Penugasan 10.000 proposal: ${waktuSusun} dtk dari klik sampai pesan (${pesanSusun})`);
      await page.waitForFunction(() => document.querySelector("[data-testid=ringkasan-usulan]")?.textContent?.includes("10.000 usulan menunggu penetapan"), { timeout: 60_000 });
      const baris = await page.evaluate(() => {
        const tabel = [...document.querySelectorAll("table")].find((x) => x.querySelector("thead")?.textContent?.includes("Judul Proposal"))!;
        return tabel.querySelectorAll("tbody tr").length;
      });
      yakin(baris === 50, `tabel usulan seharusnya 50 baris per halaman, ada ${baris}`);
      yakin((await teksHalaman(page)).includes("Halaman 1 dari 200"), "keterangan halaman 1 dari 200 tidak tampil");
      const sama = await page.evaluate(() => {
        const tabel = [...document.querySelectorAll("table")].find((x) => x.querySelector("thead")?.textContent?.includes("Judul Proposal"))!;
        return [...tabel.querySelectorAll("tbody tr")].filter((tr) => {
          const td = [...tr.querySelectorAll("td")].map((x) => x.textContent?.trim());
          return td[2] === td[4];
        }).length;
      });
      yakin(sama === 0, `${sama} baris halaman pertama memakai reviewer dari institusi pengusul`);
      const sebaran = await page.$eval("[data-testid=ringkasan-sebaran]", (e) => e.textContent ?? "");
      const m = sebaran.match(/(\d+) reviewer bersedia; proposal per reviewer terendah (\d+), tertinggi (\d+)/);
      yakin(m && Number(m[1]) >= 115 && Number(m[1]) <= 130 && Number(m[3]) <= 100 && Number(m[3]) - Number(m[2]) <= 2, `sebaran beban tidak merata: ${sebaran}`);
      const barisSebaran = await page.evaluate(() => {
        const tabel = [...document.querySelectorAll("table")].find((x) => x.querySelector("thead")?.textContent?.includes("Jumlah Proposal"))!;
        return tabel.querySelectorAll("tbody tr").length;
      });
      yakin(barisSebaran === Number(m![1]), `Sebaran Beban menampilkan ${barisSebaran} baris, bukan ${m![1]}`);
      c(`tabel Usulan Penugasan 50 baris dari 10.000 (halaman 1 dari 200); Sebaran Beban ${barisSebaran} reviewer, ${sebaran}`);
      await foto(page, "j04b-skala-usulan");

      t = Date.now();
      await klik(page, "Berikutnya");
      await adaTeks(page, "Halaman 2 dari 200", 60_000);
      yakin(page.url().includes("hal=2"), "halaman 2 tidak tersimpan di URL");
      c(`halaman 2 usulan terbuka dalam ${lama(t)} dtk; hal=2 di URL`);
      await foto(page, "j04b-skala-halaman-2");
      await page.goBack();
      await adaTeks(page, "Halaman 1 dari 200", 60_000);
      c("Back kembali ke halaman 1");

      t = Date.now();
      await klik(page, "Tetapkan Penugasan");
      await tungguModal(page, "Konfirmasi Tetapkan Penugasan");
      await klik(page, "Tetapkan Penugasan");
      await adaTeks(page, "Penugasan telah ditetapkan dan tercatat di BIMA (10.000 proposal)", 280_000);
      const waktuTetapkan = lama(t);
      const pesanTetapkan = await page.evaluate(() => [...document.body.innerText.matchAll(/Waktu proses di server: [\d,]+ detik/g)].pop()?.[0] ?? "");
      c(`Tetapkan Penugasan 10.000 proposal: ${waktuTetapkan} dtk dari klik sampai pesan (${pesanTetapkan})`);
      await adaTeks(page, "Penugasan yang Sudah Ditetapkan (10.000)", 60_000);
      await foto(page, "j04b-skala-ditetapkan");

      await lewatNavigator("[data-jendela='BIMA-2']", "Ringkasan");
      const total = await page.$eval("[data-testid=total-penugasan]", (e) => e.textContent ?? "");
      yakin(total === "10.000", `kotak masuk BIMA (B-2 lewat navigator) menerima ${total} penugasan, bukan 10.000`);
      const barisKotak = await page.$$eval("table tbody tr", (r) => r.length);
      yakin(barisKotak === 100, `kotak masuk seharusnya menampilkan 100 pesan terbaru, ada ${barisKotak}`);
      yakin((await teksHalaman(page)).includes("SKL-2026-"), "kotak masuk B-2 tidak memuat pesan SKL sesudah pindah dari J-04b skala");
      await foto(page, "bima-kotak-masuk-skala");
      c("kotak masuk BIMA: 10.000 penugasan diterima tanpa ganda, ringkasan + 100 pesan terbaru");
      c(`CATATAN WAKTU: susun ${waktuSusun} dtk, tetapkan ${waktuTetapkan} dtk (klik sampai pesan, ${process.env.E2E_BASE_URL ? `produksi ${new URL(process.env.E2E_BASE_URL).host}` : "lokal ke Neon"})`);
    });

    await skenario("Skenario kecil tidak terpengaruh data skala nyata", page, async (c) => {
      const t = Date.now();
      await buka(page, url("/demo/mulai?j=J-04b&s=siap"), "Susun Usulan Penugasan");
      const waktu = ((Date.now() - t) / 1000).toFixed(1);
      const panel = await ringkasanUsulan();
      yakin(/(^|\D)\d proposal Terkirim belum punya penugasan tetap/.test(panel), `skenario kecil memuat data skala: ${panel.slice(0, 160)}`);
      const sebaran = await page.$eval("[data-testid=ringkasan-sebaran]", (e) => e.textContent ?? "");
      yakin(/^[1-9]\d? reviewer bersedia/.test(sebaran), `reviewer skala nyata ikut tampil di skenario kecil: ${sebaran}`);
      c(`skenario J-04b siap sesudah skala nyata: ${waktu} dtk; ${sebaran.slice(0, 40)}`);
      await foto(page, "j04b-siap-sesudah-skala");
      await buka(page, url("/demo/mulai?j=J-07&s=selesai"), "Daftar Penugasan");
      const baris = await page.$$eval("table tbody tr", (r) => r.map((x) => x.textContent ?? ""));
      yakin(baris.length === 1 && baris[0].includes("Selesai") && !baris[0].includes("Baru"), `J-07 Semua Selesai sesudah skala memuat ${baris.length} baris: ${baris.slice(0, 2).join(" | ").slice(0, 160)}`);
      await buka(page, url("/demo/mulai?j=J-07&s=baru"), "Daftar Penugasan");
      const barisBaru = await page.$$eval("table tbody tr", (r) => r.length);
      yakin(barisBaru === 1, `J-07 Baru sesudah skala memuat ${barisBaru} baris`);
      await buka(page, url("/demo/mulai?j=BIMA-2&s=normal"), "Ringkasan");
      const totalSetelah = Number((await page.$eval("[data-testid=total-penugasan]", (e) => e.textContent ?? "0")).replace(/\./g, ""));
      yakin(totalSetelah >= 10_000, `kotak masuk B-2 hanya memuat ${totalSetelah} penugasan; data skala nyata terhapus`);
      await buka(page, url("/bima/masuk"), "Masuk (simulasi)");
      const ketSembunyi = await page.$eval("[data-testid=akun-skala-tersembunyi]", (e) => e.textContent ?? "");
      yakin(ketSembunyi.includes("130 akun reviewer skala nyata disembunyikan"), `keterangan akun tersembunyi salah: ${ketSembunyi}`);
      const jumlahAkun = await page.$$eval("a[href*='/api/bima/sesi/masuk']", (a) => a.length);
      const adaSkala = await page.$$eval("a[href*='rvw-skala-']", (a) => a.length);
      yakin(adaSkala === 0 && jumlahAkun < 30, `/bima/masuk menampilkan ${jumlahAkun} akun, ${adaSkala} akun skala`);
      c(`J-07 Semua Selesai dan Baru tepat 1 baris; kotak masuk B-2 tetap memuat ${totalSetelah} penugasan; /bima/masuk menyembunyikan akun skala (${jumlahAkun} akun tampil)`);
    });

    /* ---- putaran 1 revisi: fokus, tautan langsung, riwayat Back, Susun tidak berulang ---- */
    const fokusSama = (teks: string) =>
      page.waitForFunction((t) => (document.activeElement?.textContent ?? "").replace(/\s+/g, " ").trim().startsWith(t), { timeout: 5_000 }, teks).catch(async () => {
        const sekarang = await page.evaluate(() => `${document.activeElement?.tagName}:${(document.activeElement?.textContent ?? "").trim().slice(0, 40)}`);
        throw new Error(`fokus tidak kembali ke pemicu "${teks}" (sekarang ${sekarang})`);
      });

    await skenario("Fokus kembali ke pemicu sesudah modal ditutup (Esc dan Batal): M-reset, M-06, M-10", page, async (c) => {
      await buka(page, url("/demo"), "Pusat Demo");
      await tunggu(2000);
      await klik(page, "Reset & isi data demo");
      await tungguModal(page, "Reset & isi data demo");
      await page.keyboard.press("Escape");
      await tungguModalTutup(page);
      await fokusSama("Reset & isi data demo");
      c("modal Reset: Esc mengembalikan fokus ke tombol pemicu");
      await buka(page, url("/demo/mulai?j=J-04b&s=menunggu"), "Tetapkan Penugasan", 90_000);
      await tunggu(1500);
      await klik(page, "Pindahkan");
      await tungguModal(page, "Pindahkan Proposal");
      await klik(page, "Batal");
      await tungguModalTutup(page);
      await fokusSama("Pindahkan");
      c("M-06: Batal mengembalikan fokus ke tombol Pindahkan");
      await buka(page, url("/demo/mulai?k=UC-07a&j08=1"), "Butir Semantik", 90_000);
      await tunggu(1500);
      await klik(page, "Tidak Setuju");
      await tungguModal(page, "Koreksi Rekomendasi");
      await page.keyboard.press("Escape");
      await tungguModalTutup(page);
      await fokusSama("Tidak Setuju");
      c("M-10: Esc mengembalikan fokus ke tombol Tidak Setuju (modal tetap terpasang)");
    });

    await skenario("Tautan langsung tanpa sesi mempertahankan tujuan sesudah masuk (lanjut)", page, async (c) => {
      await page.deleteCookie(...(await page.cookies(base)));
      await page.goto(url("/tim-kerja/aturan?butir=UNS-01"), { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => location.pathname === "/masuk" && location.search.includes("lanjut="), { timeout: 30_000 });
      await klik(page, "Masuk dengan akun BIMA");
      await adaTeks(page, "Masuk (simulasi)");
      const href = await page.$eval("a[href*='idBima=dppm-pengelola']", (a) => a.getAttribute("href"));
      yakin(href && href.includes("lanjut="), `akun BIMA tidak membawa tujuan: ${href}`);
      await page.evaluate((h) => (document.querySelector(`a[href='${h}']`) as HTMLElement).click(), href);
      await page.waitForFunction(() => location.pathname === "/tim-kerja/aturan" && location.search.includes("butir=UNS-01"), { timeout: 60_000 });
      c("tautan J-03 ?butir=UNS-01 tanpa sesi: masuk lewat BIMA lalu mendarat di tautan semula");
    });

    await skenario("M-08: sesudah Tutup, satu kali Back keluar dari J-05", page, async (c) => {
      await buka(page, url("/demo"), "Pusat Demo");
      await buka(page, url("/demo/mulai?k=UC-04"), "Butir Deterministik Paling Sering Gagal", 90_000);
      await page.$eval("a[aria-label^='Rincian butir']", (a) => (a as HTMLElement).click());
      await page.waitForFunction(() => [...document.querySelectorAll("[role=dialog] h2")].some((h) => (h.textContent ?? "").startsWith("Rincian Butir")), { timeout: 15_000 });
      await klik(page, "Tutup");
      await tungguModalTutup(page);
      await page.goBack();
      await page.waitForFunction(() => location.pathname !== "/tim-kerja/pemantauan", { timeout: 15_000 }).catch(() => {
        throw new Error("Back sesudah menutup M-08 masih di J-05 (riwayat ganda)");
      });
      c("buka M-08, Tutup, lalu Back sekali meninggalkan J-05 (tanpa entri riwayat ganda)");
    });

    await skenario("Susun otomatis S-1 tidak berulang: parameter susun dibuang dari URL", page, async (c) => {
      await buka(page, url("/demo/mulai?j=J-04b&s=kekurangan"), "Kekurangan Reviewer", 120_000);
      await page.waitForFunction(() => !location.search.includes("susun"), { timeout: 20_000 }).catch(() => {
        throw new Error("parameter susun masih ada di URL sesudah Susun otomatis");
      });
      c("sesudah Susun otomatis, URL J-04b tanpa ?susun=1 (Back dan muat ulang tidak menyusun lagi)");
    });

    /* ---- akhir: basis data bersih ---- */
    await skenario("Akhir: Reset & isi data demo (basis data bersih)", page, async (c) => {
      await resetDemo();
      await atur("berjalan");
      const n = await page.$$eval("[data-skenario-kartu]", (e) => e.length);
      yakin(n >= 35, `kartu skenario di /demo hanya ${n}`);
      yakin((await page.$("[data-testid=navigator-pil]")) === null, "navigator tidak boleh tampil di /demo");
      c(`reset selesai; /demo memuat ${n} kartu skenario per jendela dan tanpa navigator mengambang`);
    });
  } finally {
    await peramban.close();
    proses?.kill();
  }

  /* ---- laporan ---- */
  const lulus = hasil.filter((h) => h.lulus).length;
  const md = [
    "# Laporan uji ujung ke ujung SEMAR",
    "",
    `Dijalankan: ${new Date().toISOString()}. Sasaran: ${process.env.E2E_BASE_URL ?? "server lokal (next start)"}. Mode LLM: tiruan. Hasil: ${lulus} dari ${hasil.length} skenario lulus.`,
    "",
    "| Skenario | Hasil | Catatan |",
    "|---|---|---|",
    ...hasil.map((h) => `| ${h.skenario} | ${h.lulus ? "lulus" : "GAGAL"} | ${h.catatan.replace(/\|/g, "/")} |`),
    "",
    "## Tangkapan layar (1440 dan 390 px)",
    "",
    ...tangkapan.map((t) => `- ${t}`),
    "",
    "## Masalah",
    "",
    ...(masalah.length ? masalah.map((m) => `- ${m}`) : ["- tidak ada"]),
    "",
  ].join("\n");
  writeFileSync(path.join(HASIL, "laporan.md"), md);
  console.log(`\n${lulus}/${hasil.length} skenario lulus. Laporan: e2e/hasil/laporan.md`);
  process.exit(lulus === hasil.length ? 0 : 1);
}

/** Memeriksa semua tab bagian J-08 sampai teks tertentu muncul. */
async function cariTekSemuaTab(page: Page, teks: string): Promise<boolean> {
  const tab = await page.$$("[role=tab]");
  for (const t of tab) {
    await t.click();
    await tunggu(150);
    if ((await teksHalaman(page)).includes(teks)) return true;
  }
  return (await teksHalaman(page)).includes(teks);
}

utama().catch((e) => {
  console.error(e);
  process.exit(2);
});
