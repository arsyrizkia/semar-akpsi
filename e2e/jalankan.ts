/**
 * Uji ujung ke ujung SEMAR (puppeteer-core + Chrome lokal).
 *
 * Menyalakan aplikasi dengan `next start` pada port bebas (jalankan `npm run build` lebih dulu), memakai LLM mode tiruan,
 * lalu menjalankan jalur utama setiap use case beserta alternatif pentingnya. Tangkapan layar (1440x900) dan laporan
 * ditulis ke e2e/hasil/. Jalankan: `npm run e2e`. Bila E2E_BASE_URL diisi, aplikasi yang sudah berjalan dipakai.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
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

async function foto(page: Page, nama: string) {
  nomorGambar++;
  const berkas = `${String(nomorGambar).padStart(2, "0")}-${nama}.png`;
  await page.screenshot({ path: path.join(HASIL, berkas), fullPage: nama.startsWith("gagal") });
  tangkapan.push(`e2e/hasil/${berkas}`);
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
    catatan.push(`GAGAL: ${e instanceof Error ? e.message : String(e)}`);
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
async function tidakAdaTeks(page: Page, teks: string, ms = 10_000) {
  await page.waitForFunction((t) => !document.body.innerText.includes(t), { timeout: ms }, teks).catch(() => {
    throw new Error(`teks "${teks}" masih tampil`);
  });
}
const teksHalaman = (page: Page) => page.evaluate(() => document.body.innerText);

async function cariTombol(page: Page, teks: string, indeks = 0, ms = 15_000): Promise<ElementHandle<Element>> {
  const h = await page
    .waitForFunction(
      (t, i) => {
        const semua = [...document.querySelectorAll("button, a, [role=button], [role=tab]")].filter((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim() === t && !(e as HTMLButtonElement).disabled);
        return semua[i] ?? null;
      },
      { timeout: ms },
      teks,
      indeks,
    )
    .catch(() => {
      throw new Error(`tombol/tautan "${teks}" (ke-${indeks}) tidak ditemukan atau nonaktif`);
    });
  return h.asElement() as ElementHandle<Element>;
}
async function klik(page: Page, teks: string, indeks = 0) {
  const el = await cariTombol(page, teks, indeks);
  await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await el.click();
}
async function jumlahTombol(page: Page, teks: string) {
  return page.evaluate((t) => [...document.querySelectorAll("button, a, [role=button]")].filter((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim() === t).length, teks);
}
async function isi(page: Page, selektor: string, nilai: string) {
  await page.waitForSelector(selektor, { timeout: 10_000 });
  await page.click(selektor, { count: 3 });
  await page.keyboard.press("Backspace");
  if (nilai) await page.type(selektor, nilai);
}
async function pilih(page: Page, selektor: string, cocok: (teks: string) => boolean): Promise<string> {
  await page.waitForSelector(selektor, { timeout: 10_000 });
  const opsi = await page.$$eval(`${selektor} option`, (os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: o.textContent ?? "" })));
  const target = opsi.find((o) => o.v && cocok(o.t));
  yakin(target, `opsi tidak ditemukan pada ${selektor}: ${opsi.map((o) => o.t).join(" / ")}`);
  await page.select(selektor, target.v);
  return target.t;
}
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

async function buka(page: Page, url: string, tungguTeks?: string, ms = 60_000) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: Math.max(120_000, ms) });
  if (tungguTeks) await adaTeks(page, tungguTeks, ms);
}

/** Status pada J-06 ("Status pengajuan [Terkirim|Ditahan|Ditolak]"); menunggu sampai pemeriksaan selesai. */
async function tungguStatusPengajuan(page: Page, ms = 150_000): Promise<string> {
  await page.waitForFunction(() => /Status pengajuan\s*(Terkirim|Ditahan|Ditolak)/.test(document.body.innerText), { timeout: ms }).catch(() => {
    throw new Error("status pengajuan tidak muncul (pemeriksaan tidak selesai)");
  });
  return (await teksHalaman(page)).match(/Status pengajuan\s*(Terkirim|Ditahan|Ditolak)/)![1];
}

/** Membuka J-03 lengkap dengan tabel butir (memilih skema dan periode lalu menekan Tampilkan). */
async function bukaAturan(page: Page, base: string) {
  await page.goto(`${base}/tim-kerja/aturan`, { waitUntil: "domcontentloaded" });
  await adaTeks(page, "Tampilkan");
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), klik(page, "Tampilkan")]);
  await adaTeks(page, "Butir Cek", 60_000);
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
  page.on("dialog", (d) => void d.accept()); // konfirmasi Reset & isi data demo
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

  try {
    /* ---- beranda, J-01, BIMA masuk, reset ---- */
    await skenario("Beranda dan J-01 Masuk", page, async (c) => {
      await page.deleteCookie(...(await page.cookies(base)));
      await buka(page, url("/"), "Sistem Evaluasi Mandiri dan Asisten Reviewer");
      yakin((await jumlahTombol(page, "Buka Pusat Demo")) === 1 && (await jumlahTombol(page, "Masuk")) === 1, "tautan beranda ke /demo dan /masuk tidak ada");
      await foto(page, "beranda");
      await klik(page, "Masuk");
      await adaTeks(page, "Masuk dengan akun BIMA");
      await foto(page, "j01-masuk");
      c("beranda memuat tautan Buka Pusat Demo dan Masuk; J-01 memuat Masuk dengan akun BIMA");
    });

    await skenario("/demo: Reset & isi data demo", page, async (c) => {
      await buka(page, url("/demo"), "Pusat Demo");
      await foto(page, "demo");
      await tunggu(3000);
      await klik(page, "Reset & isi data demo");
      await adaTeks(page, "Data demo direset dan diisi ulang.", 240_000);
      c("seed berhasil lewat tombol");
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
      const menu = await teksHalaman(page);
      yakin(!menu.includes("Templat Proposal") || !(await jumlahTombol(page, "Templat Proposal")), "anggota tidak boleh melihat menu J-02");
      await buka(page, url("/tim-kerja/templat"));
      await page.waitForFunction(() => location.pathname === "/tim-kerja/penugasan" && location.search.includes("galat=akses"), { timeout: 20_000 });
      c("anggota diarahkan dengan ?galat=akses saat membuka J-02");
    });

    /* ---- UC-05 a/b/c ---- */
    const ajukan = async () => {
      await adaTeks(page, "Ajukan Usulan");
      await klik(page, "Ajukan Usulan");
    };

    await skenario("UC-05a: proposal lolos semua butir (Terkirim)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-05a"), "Pengajuan proposal");
      await foto(page, "bima-pengajuan");
      await ajukan();
      await page.waitForFunction(() => location.pathname.startsWith("/pengusul/hasil/"), { timeout: 60_000 });
      yakin((await tungguStatusPengajuan(page)) === "Terkirim", "status seharusnya Terkirim");
      await adaTeks(page, "Bukti Pengiriman");
      const t = await teksHalaman(page);
      yakin(t.includes("Kembali ke BIMA"), "tombol Kembali ke BIMA tidak tampil");
      const statusSel = await page.$$eval("table tbody td", (tds) => tds.map((td) => (td.textContent ?? "").trim()).filter((x) => x === "Lolos" || x === "Gagal"));
      yakin(statusSel.length >= 10 && !statusSel.includes("Gagal"), `semua butir seharusnya Lolos (${statusSel.length} butir)`);
      await foto(page, "j06-terkirim");
      c("J-06 menampilkan Terkirim, daftar butir Lolos, Bukti Pengiriman, Kembali ke BIMA");
    });

    await skenario("UC-05b / UC-06: ada butir gagal (Ditahan)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-05b"), "Pengajuan proposal");
      await ajukan();
      await page.waitForFunction(() => location.pathname.startsWith("/pengusul/hasil/"), { timeout: 60_000 });
      yakin((await tungguStatusPengajuan(page)) === "Ditahan", "status seharusnya Ditahan");
      const t = await teksHalaman(page);
      const barisGagal = await page.$$eval("table tbody tr", (trs) => trs.filter((tr) => [...tr.querySelectorAll("td")].some((td) => (td.textContent ?? "").trim() === "Gagal")).map((tr) => (tr as HTMLElement).innerText.replace(/\s+/g, " ")));
      yakin(barisGagal.length >= 1, "butir Gagal tidak tampil");
      yakin(/Metode/.test(barisGagal[0]) && /kata/.test(barisGagal[0]), `butir Gagal paling atas tidak memuat bagian dan angka pembukti: ${barisGagal[0]}`);
      yakin(!t.includes("Bukti Pengiriman"), "bukti pengiriman tidak boleh tampil pada Ditahan");
      c(`butir Gagal paling atas: ${barisGagal[0].slice(0, 120)}`);
      await foto(page, "j06-ditahan");
      c("J-06 menampilkan Ditahan, butir Gagal dengan batas dan angka pembukti, tanpa bukti pengiriman");
      await klik(page, "Kembali ke BIMA");
      await page.waitForFunction(() => location.pathname === "/bima/pengajuan", { timeout: 20_000 });
      c("tombol Kembali ke BIMA berfungsi");

      // langkah 4-8: perbaiki (naskah perbaikan contoh), ajukan ulang, semua butir lolos, bukti pengiriman V2
      await buka(page, url("/bima/pengajuan?proposal=PRP-2026-0002"), "Ajukan: PRP-2026-0002");
      await page.click("input[name=naskahPerbaikan]");
      await ajukan();
      await page.waitForFunction(() => location.pathname.startsWith("/pengusul/hasil/"), { timeout: 60_000 });
      yakin((await tungguStatusPengajuan(page)) === "Terkirim", "setelah diperbaiki, status seharusnya Terkirim");
      await adaTeks(page, "Bukti Pengiriman");
      const sesudah = await teksHalaman(page);
      yakin(/Kode versi\s*V2/.test(sesudah), "bukti pengiriman seharusnya memuat kode versi V2");
      await foto(page, "j06-05b-terkirim-v2");
      c("S-1.3/S-1.4: ajukan ulang dengan naskah perbaikan menghasilkan Terkirim, kode versi V2, bukti pengiriman");
    });

    await skenario("UC-05c: ditahan lalu ditolak karena masa pengusulan ditutup (3a)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-05c"), "Pengajuan proposal");
      await ajukan();
      await page.waitForFunction(() => location.pathname.startsWith("/pengusul/hasil/"), { timeout: 60_000 });
      yakin((await tungguStatusPengajuan(page)) === "Ditahan", "pengajuan pertama (masa berjalan) seharusnya Ditahan");
      await foto(page, "j06-05c-ditahan");
      await klik(page, "Kembali ke BIMA");
      await page.waitForFunction(() => location.pathname === "/bima/pengajuan", { timeout: 20_000 });
      await klik(page, "Tutup masa pengusulan");
      await page.waitForFunction(() => document.querySelector("[data-testid=masa-bima]")?.textContent === "ditutup", { timeout: 20_000 });
      await klik(page, "Ajukan ulang");
      await adaTeks(page, "Ajukan Usulan");
      await ajukan();
      await page.waitForFunction(() => location.pathname.startsWith("/pengusul/hasil/"), { timeout: 60_000 });
      yakin((await tungguStatusPengajuan(page)) === "Ditolak", "pengajuan ulang setelah masa ditutup seharusnya Ditolak");
      const t = await teksHalaman(page);
      yakin(/masa pengusulan/i.test(t) && /ditutup/i.test(t), "pemberitahuan masa pengusulan ditutup tidak tampil");
      yakin((await page.$("table")) === null, "daftar butir tidak boleh tampil pada Ditolak");
      const tgl = t.match(/ditutup pada ([^\n.]+)/i)?.[1];
      yakin(tgl, "tanggal tutup tidak tampil pada pesan 3a.2");
      await foto(page, "j06-ditolak");
      c(`Ditahan lebih dulu, lalu Ditolak setelah masa ditutup; pesan 3a.2 memuat tanggal tutup (${tgl})`);
    });

    /* ---- UC-01 ---- */
    await skenario("UC-01: menyusun templat (jalur utama, S-2)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-01"), "Templat Berlaku");
      await foto(page, "j02-templat");
      await klik(page, "Susun Versi Baru");
      await adaTeks(page, "Isian Templat Versi 2 (Draf)");
      await klik(page, "Tambah Bagian");
      await klik(page, "Terbitkan");
      await adaTeks(page, "Lengkapi isian yang ditandai");
      yakin((await page.$$("[aria-invalid=true]")).length > 0, "isian kosong tidak ditandai aria-invalid");
      await foto(page, "j02-isian-ditandai");
      c("S-2: pesan Lengkapi isian yang ditandai dan isian bertanda");
      // lengkapi: hapus baris kosong terakhir, pilih periode
      const jumlahBaris = await page.$$eval("input[aria-label^='Nama Bagian baris']", (e) => e.length);
      await page.evaluate((n) => {
        const baris = [...document.querySelectorAll("tr")].filter((tr) => tr.querySelector(`input[aria-label='Nama Bagian baris ${n}']`));
        const tombol = [...(baris[0]?.querySelectorAll("button") ?? [])].find((b) => (b.textContent ?? "").trim() === "Hapus");
        (tombol as HTMLButtonElement | undefined)?.click();
      }, jumlahBaris);
      await pilih(page, "#periode-berlaku", () => true);
      await klik(page, "Terbitkan");
      await adaTeks(page, "telah terbit");
      const t = await teksHalaman(page);
      yakin(/butir cek draf dibuat/.test(t), "jumlah butir draf tidak ditampilkan");
      yakin((await jumlahTombol(page, "Buka Aturan Pemeriksaan")) === 1, "tombol Buka Aturan Pemeriksaan tidak ada");
      await foto(page, "j02-terbit");
      c("jalur utama: templat versi baru terbit, jumlah butir draf dan tombol Buka Aturan Pemeriksaan tampil");
    });

    await skenario("UC-01 9a: masa pengusulan berjalan, templat disimpan sebagai draf", page, async (c) => {
      await atur("berjalan");
      await buka(page, url("/tim-kerja/templat"), "Templat Berlaku");
      await klik(page, "Susun Versi Baru");
      await adaTeks(page, "(Draf)");
      await pilih(page, "#periode-berlaku", () => true);
      await klik(page, "Terbitkan");
      await adaTeks(page, "Masa pengusulan skema ini sedang berjalan. Templat disimpan sebagai draf untuk periode berikutnya.");
      await foto(page, "j02-9a-draf");
      c("pesan 9a persis; templat berlaku tidak berubah");
    });

    await skenario("UC-01 S-1: skema belum punya templat", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-01-S1"), "Skema ini belum memiliki templat");
      await foto(page, "j02-s1-belum-ada-templat");
      await klik(page, "Susun Versi Baru");
      await adaTeks(page, "Isian Templat Versi 1 (Draf)");
      c("S-1: keterangan Skema ini belum memiliki templat; Susun Versi Baru membuat versi 1");
    });

    /* ---- UC-02 ---- */
    await skenario("UC-02: aturan pemeriksaan (jalur utama, 4a, 8a)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-02"), "Tampilkan");
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), klik(page, "Tampilkan")]);
      await adaTeks(page, "Butir Cek", 60_000);
      await foto(page, "j03-aturan");
      // 4a: ubah butir turunan templat
      const barisTemplat = await page.evaluateHandle(() => {
        const baris = [...document.querySelectorAll("tbody tr")].filter((tr) => tr.querySelector("[aria-label='Terkunci']") && [...tr.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Ubah"));
        return baris[0] ?? null;
      });
      const brs = barisTemplat.asElement() as ElementHandle<Element>;
      yakin(brs, "tidak ada butir turunan templat");
      const adaNonaktifkan = await brs.evaluate((tr) => [...tr.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Nonaktifkan"));
      yakin(!adaNonaktifkan, "butir templat tidak boleh punya tombol Nonaktifkan");
      await brs.evaluate((tr) => ([...tr.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Ubah") as HTMLButtonElement).click());
      await adaTeks(page, "Nilai butir ini berasal dari templat dan hanya dapat diubah melalui jendela J-02 Templat Proposal");
      yakin((await jumlahTombol(page, "Buka Templat Proposal")) >= 1, "tombol Buka Templat Proposal tidak ada");
      yakin((await page.$("#b-kode")) === null, "panel butir tidak boleh terbuka pada 4a");
      await foto(page, "j03-4a");
      c("4a: pesan penolakan dan tombol Buka Templat Proposal, panel tidak dibuka");

      // tambah butir semantik manual
      await klik(page, "Tambah Butir");
      await isi(page, "#b-kode", "SEM-E2E");
      await pilih(page, "#b-jenis", (t) => /semantik/i.test(t));
      await isi(page, "#b-deskripsi", "Ringkasan menyebut tujuan penelitian");
      await isi(page, "#b-tanya", "Apakah ringkasan menyebut tujuan penelitian dengan jelas?");
      await isi(page, "#b-contoh", "Tujuan penelitian ini adalah menyusun model prediksi.");
      await pilih(page, "#b-bagian-s", (t) => t === "Ringkasan");
      await klik(page, "Simpan Butir");
      await adaTeks(page, "SEM-E2E");
      c("butir manual semantik ditambahkan");
      await klik(page, "Uji pada Contoh");
      await adaTeks(page, "Hasil Uji", 90_000);
      await foto(page, "j03-hasil-uji");
      c("Uji pada Contoh menampilkan panel Hasil Uji");

      // 8a: sakelar berjalan, tanggal di tengah masa pengusulan
      await atur("berjalan");
      await bukaAturan(page, base);
      await isiTanggal(page, "#tgl-berlaku", hariIni());
      await klik(page, "Simpan Versi");
      await adaTeks(page, "Tanggal berlaku tidak boleh jatuh di antara tanggal buka dan tanggal tutup");
      await foto(page, "j03-8a");
      c("8a: tanggal berlaku di tengah masa pengusulan ditolak");

      // sukses: ditutup
      await atur("ditutup");
      await bukaAturan(page, base);
      await isiTanggal(page, "#tgl-berlaku", hariIni());
      await klik(page, "Simpan Versi");
      await adaTeks(page, "Basis aturan versi baru tersimpan");
      await foto(page, "j03-versi-tersimpan");
      c("jalur utama: Simpan Versi menampilkan pesan basis aturan versi baru tersimpan");
    });

    /* ---- UC-03 ---- */
    await skenario("UC-03: menugaskan reviewer (jalur utama, S-1, S-2)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-03"), "Susun Usulan Penugasan");
      await foto(page, "j04-awal");
      // S-1: batas 1 -> kekurangan
      await isi(page, "#batas", "1");
      await klik(page, "Susun Usulan Penugasan");
      await adaTeks(page, "Kekurangan Reviewer", 90_000);
      await foto(page, "j04-s1-kekurangan");
      c("S-1: panel Kekurangan Reviewer tampil");
      // jalur utama: batas 3
      await isi(page, "#batas", "3");
      await klik(page, "Susun Usulan Penugasan");
      await page
        .waitForFunction(
          () => [...document.querySelectorAll("table")].some((t) => t.querySelector("thead")?.textContent?.includes("Judul Proposal") && t.querySelectorAll("tbody tr").length >= 4),
          { timeout: 90_000 },
        )
        .catch(() => {
          throw new Error("tabel Usulan Penugasan tidak terisi setelah Susun Usulan Penugasan (batas 3)");
        });
      await adaTeks(page, "Sebaran Beban");
      const jBaris = await page.$$eval("table", (ts) => ts.map((t) => (t.querySelector("thead")?.textContent?.includes("Judul Proposal") ? t.querySelectorAll("tbody tr").length : -1)));
      yakin(jBaris.some((n) => n >= 4), `tabel usulan terlalu sedikit: ${jBaris}`);
      await foto(page, "j04-usulan");
      c(`tabel Usulan Penugasan (${Math.max(...jBaris)} baris) dan Sebaran Beban tampil`);

      // S-2: pemindahan melanggar syarat institusi
      const infoBaris = await page.evaluate(() => {
        const tabel = [...document.querySelectorAll("table")].find((t) => t.querySelector("thead")?.textContent?.includes("Judul Proposal"))!;
        const tr = tabel.querySelector("tbody tr")!;
        const sel = [...tr.querySelectorAll("td")].map((td) => td.textContent?.trim() ?? "");
        return { institusiPengusul: sel[2], reviewer: sel[3] };
      });
      c(`baris pertama usulan: pengusul=${infoBaris.institusiPengusul}; reviewer=${infoBaris.reviewer}`);
      await klik(page, "Pindahkan");
      const idPengganti = await page.$eval("select[id^='pengganti-']", (s) => s.id);
      await pilih(page, `#${idPengganti}`, (t) => t.includes(`(${infoBaris.institusiPengusul})`));
      await klik(page, "Simpan Pemindahan");
      await adaTeks(page, "Pemindahan ditolak, reviewer semula tetap dipakai.");
      await foto(page, "j04-s2-ditolak");
      c("S-2: pemindahan ke reviewer sealmamater ditolak dengan syarat yang dilanggar");
      // pemindahan sah
      await pilih(page, `#${idPengganti}`, (t) => !t.includes(`(${infoBaris.institusiPengusul})`) && !t.includes(infoBaris.reviewer));
      await klik(page, "Simpan Pemindahan");
      await page.waitForFunction((lama) => [...document.querySelectorAll("table")].find((t) => t.querySelector("thead")?.textContent?.includes("Judul Proposal"))?.querySelector("tbody tr")?.querySelectorAll("td")[3]?.textContent?.trim() !== lama, { timeout: 30_000 }, infoBaris.reviewer);
      c("S-2: pemindahan yang memenuhi syarat mengganti reviewer");

      await klik(page, "Tetapkan Penugasan");
      await adaTeks(page, "Penugasan telah ditetapkan dan tercatat di BIMA", 90_000);
      await foto(page, "j04-ditetapkan");
      c("pesan penugasan ditetapkan dan tercatat di BIMA");
      await buka(page, url("/bima/kotak-masuk"), "Kotak masuk");
      yakin((await teksHalaman(page)).includes("Penugasan reviewer"), "kotak masuk BIMA tidak memuat penugasan");
      await foto(page, "bima-kotak-masuk");
      c("kotak masuk BIMA tiruan menerima penugasan");
    });

    /* ---- UC-04 ---- */
    await skenario("UC-04: memantau kesesuaian (jalur utama, S-1, tandai butir)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-04"), "Pemantauan Kesesuaian");
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), klik(page, "Tampilkan")]);
      await adaTeks(page, "Butir Deterministik Paling Sering Gagal", 60_000);
      const t = await teksHalaman(page);
      for (const s of ["kesesuaian per butir", "% disetujui", "butir dengan koreksi tertinggi"]) yakin(t.toLowerCase().includes(s), `bagian "${s}" tidak tampil`);
      await foto(page, "j05-pemantauan");
      c("tiga bagian laporan tampil");
      // S-1: Rincian Butir
      const pemicu = await page.evaluateHandle(() => {
        const h = [...document.querySelectorAll("h2")].find((e) => e.textContent?.includes("Koreksi Tertinggi"));
        return h?.closest("section")?.querySelector("tbody button") ?? null;
      });
      const el = pemicu.asElement() as ElementHandle<Element> | null;
      yakin(el, "tidak ada butir terkoreksi yang dapat diklik");
      await el.click();
      await adaTeks(page, "Rincian Butir");
      await foto(page, "j05-rincian-butir");
      await klik(page, "Tutup");
      await tidakAdaTeks(page, "Rincian Butir");
      c("S-1: panel Rincian Butir terbuka dan ditutup dengan Tutup");
      // tandai butir
      const kotak = await page.$("button[role=checkbox][id^='perbaiki-']");
      yakin(kotak, "tidak ada kotak centang Perlu Diperbaiki");
      await kotak.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await kotak.click();
      await klik(page, "Tandai Butir");
      await adaTeks(page, "sekarang berlabel");
      await bukaAturan(page, base);
      await adaTeks(page, "Perlu ditinjau");
      await foto(page, "j03-perlu-ditinjau");
      c("butir yang ditandai berlabel Perlu ditinjau dan tampil di J-03");
    });

    /* ---- UC-07 / UC-08 / UC-09 ---- */
    await skenario("UC-07a: menyetujui seluruh rekomendasi (tanpa koreksi)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-07a&j08=1"), "Butir Semantik");
      yakin((await jumlahTombol(page, "Tidak Setuju")) >= 1, "tombol Tidak Setuju tidak ada");
      for (let i = 0; i < 6; i++) await page.click(`#kb-m-${i}`);
      await isi(page, "#umpan-balik", "Seluruh rekomendasi sistem saya setujui.");
      await klik(page, "Simpan Permanen");
      await adaTeks(page, "Penilaian tersimpan dan terkirim ke BIMA", 90_000);
      yakin(!(await teksHalaman(page)).includes("Dikoreksi reviewer"), "tidak boleh ada butir berlabel Dikoreksi reviewer");
      await foto(page, "j08-07a-final-tanpa-koreksi");
      c("rekomendasi tidak dikoreksi (dihitung disetujui), Simpan Permanen berhasil dan terkirim ke BIMA");
    });

    await skenario("UC-07c: menyimpan sementara lalu melanjutkan (Draf sudah terisi)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-07c"), "Periksa");
      yakin((await teksHalaman(page)).includes("Draf"), "J-07 seharusnya berlabel Draf");
      await foto(page, "j07-07c-draf");
      const idx = await page.evaluate(() => [...document.querySelectorAll("a")].filter((a) => a.textContent?.trim() === "Periksa").length);
      yakin(idx >= 1, "tombol Periksa tidak ada");
      await klik(page, "Periksa", 0);
      await adaTeks(page, "Butir Semantik", 60_000);
      const umpan = await page.$eval("#umpan-balik", (e) => (e as HTMLTextAreaElement).value);
      yakin(umpan.startsWith("Draf:"), `umpan balik draf tidak dimuat ulang: ${umpan.slice(0, 40)}`);
      await foto(page, "j08-07c-draf-dimuat");
      c("J-07 berlabel Draf; J-08 memuat ulang umpan balik dan keputusan komponen tersimpan");
    });

    let urlJ08 = "";
    await skenario("UC-07b/UC-08: pemeriksaan reviewer (jalur utama, S-1 alasan kosong, 4a Batal, simpan sementara dan permanen)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-07a"), "Periksa");
      const j07 = await teksHalaman(page);
      yakin(j07.includes("Baru"), "label Baru tidak tampil di J-07");
      await foto(page, "j07-daftar-penugasan");
      yakin((await jumlahTombol(page, "Periksa")) >= 1, "tombol Periksa tidak ada");
      // jendela J-08 untuk penugasan skenario (daftar J-07 reviewer-2 juga memuat penugasan dari UC-03)
      await buka(page, url("/demo/mulai?k=UC-07a&j08=1"), "Butir Semantik");
      urlJ08 = page.url();
      const mulaiBuka = Date.now();
      await buka(page, urlJ08, "Butir Semantik");
      const waktuBuka = Date.now() - mulaiBuka;
      c(`J-08 terbuka dalam ${(waktuBuka / 1000).toFixed(1)} dtk`);
      yakin(waktuBuka <= 3000, `J-08 terbuka ${(waktuBuka / 1000).toFixed(1)} dtk (batas NFR 2.3: 3 dtk)`);

      const t = await teksHalaman(page);
      yakin(/Memenuhi|Tidak memenuhi/.test(t) && t.includes("tiruan"), "rekomendasi atau label tiruan tidak tampil");
      // klik butir -> sorot kutipan
      const butir = await page.$("[role=button][aria-pressed]");
      yakin(butir, "tidak ada butir semantik pada tab pertama");
      await butir.click();
      await page.waitForSelector("mark", { timeout: 10_000 });
      await foto(page, "j08-pemeriksaan");
      c("mengklik butir menyorot kutipan (mark) di panel kiri");

      // UC-08 S-1
      await klik(page, "Tidak Setuju");
      await klik(page, "Simpan Koreksi");
      await adaTeks(page, "Alasan koreksi wajib diisi");
      yakin((await page.$("textarea[aria-invalid=true]")) !== null, "bingkai merah (aria-invalid) pada alasan tidak ada");
      await foto(page, "j08-s1-alasan-kosong");
      c("S-1: pesan Alasan koreksi wajib diisi dengan bingkai merah");
      // 4a Batal
      await klik(page, "Batal");
      await page.waitForFunction(() => !document.querySelector("[role=group][aria-label^='Koreksi butir']"), { timeout: 10_000 });
      c("4a: Batal menutup panel koreksi");
      // koreksi sah
      await klik(page, "Tidak Setuju");
      const idAlasan = await page.$eval("textarea[id^='kr-alasan-']", (e) => e.id);
      const hasilId = idAlasan.replace("kr-alasan-", "");
      await page.click(`#kr-t-${hasilId}`);
      await isi(page, `#${idAlasan}`, "Kutipan bukan bagian yang menjawab butir ini.");
      await pilih(page, `#kr-jenis-${hasilId}`, (x) => x === "Kutipan salah tempat");
      await klik(page, "Simpan Koreksi");
      await adaTeks(page, "Dikoreksi reviewer");
      await foto(page, "j08-dikoreksi");
      c("koreksi tersimpan dan butir berlabel Dikoreksi reviewer");

      // simpan sementara
      await isi(page, "#umpan-balik", "Draf umpan balik reviewer.");
      await klik(page, "Simpan Sementara");
      await adaTeks(page, "Draf penilaian tersimpan");
      await buka(page, url("/reviewer/penugasan"), "Periksa");
      yakin((await teksHalaman(page)).includes("Draf"), "label Draf tidak tampil di J-07");
      await foto(page, "j07-draf");
      c("S-1 UC-07: Simpan Sementara menghasilkan label Draf di J-07");
      yakin((await page.$(`a[href="${new URL(urlJ08).pathname}"]`)) !== null, "tautan Periksa untuk penugasan skenario tidak ada di J-07");
      await klik(page, "Periksa", await page.evaluate((h) => [...document.querySelectorAll("a")].filter((a) => a.textContent?.trim() === "Periksa").findIndex((a) => a.getAttribute("href") === h), new URL(urlJ08).pathname));
      await adaTeks(page, "Butir Semantik", 60_000);
      await adaTeks(page, "Dikoreksi reviewer");
      c("draf dan koreksi dimuat ulang saat Periksa lagi");

      // simpan permanen
      for (let i = 0; i < 6; i++) await page.click(`#kb-m-${i}`);
      await isi(page, "#umpan-balik", "Proposal memenuhi syarat administratif; mohon perhatikan kutipan pada Pendahuluan.");
      await klik(page, "Simpan Permanen");
      await adaTeks(page, "Penilaian tersimpan dan terkirim ke BIMA", 90_000);
      yakin((await page.$("#umpan-balik[disabled]")) !== null, "isian tidak menjadi hanya-baca");
      await foto(page, "j08-final");
      c("Simpan Permanen: pesan Penilaian tersimpan dan terkirim ke BIMA, isian hanya-baca");
    });

    await skenario("UC-09 S-1: kutipan LLM tidak ditemukan (Perlu diperiksa manual)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-09-S1"), "Butir Semantik");
      const ditemukan = await cariTekSemuaTab(page, "Perlu diperiksa manual");
      yakin(ditemukan, "label Perlu diperiksa manual tidak muncul");
      await foto(page, "j08-s1-perlu-manual");
      c("label Perlu diperiksa manual tampil pada butir yang kutipannya tidak ditemukan");
    });

    await skenario("UC-09 S-2: LLM tidak merespons (Belum ada rekomendasi)", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-09-S2"), "Butir Semantik");
      const ditemukan = await cariTekSemuaTab(page, "Belum ada rekomendasi");
      yakin(ditemukan, "label Belum ada rekomendasi tidak muncul");
      await foto(page, "j08-s2-belum-ada");
      c("label Belum ada rekomendasi tampil; reviewer tetap dapat menilai");
    });

    await skenario("Reviewer lain mendapat 403 di J-08", page, async (c) => {
      yakin(urlJ08, "URL J-08 tidak tercatat dari skenario sebelumnya");
      const idPenugasan = new URL(urlJ08).pathname.split("/").pop()!;
      const idMilikReviewer2 = idPenugasan;
      // masuk sebagai reviewer-1
      await buka(page, url(`/api/bima/sesi/masuk?idBima=reviewer-1&kembali=${encodeURIComponent("/api/sso/callback")}`));
      await page.waitForFunction(() => location.pathname === "/reviewer/penugasan", { timeout: 30_000 });
      await buka(page, url(`/reviewer/pemeriksaan/${idMilikReviewer2}`), "403 Akses ditolak");
      await foto(page, "j08-403");
      c("halaman J-08 milik reviewer lain menampilkan 403 Akses ditolak");
      const status = await page.evaluate(async (id) => (await fetch(`/reviewer/pemeriksaan/${id}/data`)).status, idMilikReviewer2);
      yakin(status === 403, `route data mengembalikan ${status}, bukan 403`);
      c("route data J-08 mengembalikan HTTP 403");
    }, { abaikan: [/403/, /Failed to load resource/] });

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
      // halaman tujuan harus terbuka dengan pil (panel otomatis ciut), supaya tidak menutupi isian dan tombol di kiri bawah
      await page.waitForSelector("[data-testid=navigator-pil]", { timeout: 10_000 });
      yakin((await page.$("[data-testid=navigator-panel]")) === null, `panel navigator tetap terbuka sesudah memilih ${selektor}`);
    };
    /** Elemen di bawah titik tengah selektor harus elemen itu sendiri (tidak tertutup pil atau panel navigator). */
    const tidakTertutupNavigator = (selektor: string) =>
      page.evaluate((sel) => {
        const e = document.querySelector(sel);
        if (!e) return `tidak ada ${sel}`;
        e.scrollIntoView({ block: "center" });
        const r = e.getBoundingClientRect();
        const di = document.elementFromPoint(r.left + Math.min(r.width / 2, 40), r.top + r.height / 2);
        return di && (e === di || e.contains(di)) ? "" : `${sel} tertutup oleh ${di?.getAttribute("data-testid") ?? di?.tagName}`;
      }, selektor);
    const teksPanel = (judul: string) =>
      page.evaluate((j) => {
        const h = [...document.querySelectorAll("h2")].find((e) => e.textContent?.trim() === j);
        return h?.closest("section")?.textContent ?? "";
      }, judul);
    const aktifNavigator = () => page.$eval("[data-testid=navigator-aktif]", (e) => e.textContent ?? "");

    await skenario("Navigator demo: pindah antar-jendela dan peran dipasang otomatis", page, async (c) => {
      await buka(page, url("/demo/mulai?k=UC-02"), "Aturan Pemeriksaan");
      // 1. pil ada di jendela, ciut bawaan, tidak berisi daftar jendela
      yakin((await page.$("[data-testid=navigator-pil]")) !== null, "pil navigator tidak ada di J-03");
      yakin((await page.$("[data-testid=navigator-panel]")) === null, "navigator seharusnya ciut bawaan");
      // 2. terbuka: 10 jendela (J-01..J-08 + 2 halaman BIMA), jendela aktif ditandai
      await bukaNavigator();
      const jendela = await page.$$eval("[data-testid=navigator-panel] [data-jendela]", (e) => e.map((x) => x.getAttribute("data-jendela")));
      yakin(jendela.length === 10 && jendela.includes("J-01") && jendela.includes("J-08") && jendela.includes("BIMA-1") && jendela.includes("BIMA-2"), `daftar jendela salah: ${jendela}`);
      const aktif = await page.$eval("[data-testid=navigator-panel] [aria-current=page]", (e) => e.getAttribute("data-jendela"));
      yakin(aktif === "J-03", `jendela aktif seharusnya J-03, bukan ${aktif}`);
      await foto(page, "navigator-terbuka-j03");
      c("navigator memuat 10 jendela dan menandai J-03 sebagai jendela yang dibuka");

      // 3. pindah jendela: peran dipasang otomatis
      await lewatNavigator("[data-jendela='J-04']", "Susun Usulan Penugasan");
      yakin(page.url().includes("/tim-kerja/penugasan"), "J-04 tidak terbuka");
      await lewatNavigator("[data-jendela='J-07']", "Daftar Penugasan");
      yakin(page.url().includes("/reviewer/penugasan") && (await teksHalaman(page)).includes("Dr. Intan Maharani"), "J-07 tidak terbuka sebagai reviewer");
      c("J-04 terbuka sebagai Tim Kerja; J-07 terbuka sebagai reviewer (Dr. Intan Maharani) tanpa login manual");
      await lewatNavigator("[data-jendela='J-06']", "Status pengajuan");
      yakin(page.url().includes("/pengusul/hasil/"), "J-06 tidak terbuka");
      await lewatNavigator("[data-jendela='J-05']", "Pemantauan Kesesuaian");
      await lewatNavigator("[data-jendela='J-02']", "Templat Proposal");
      await lewatNavigator("[data-jendela='J-08']", "Butir Semantik");
      yakin(page.url().includes("/reviewer/pemeriksaan/"), "J-08 tidak terbuka");
      await lewatNavigator("[data-jendela='BIMA-1']", "Pengajuan proposal");
      await lewatNavigator("[data-jendela='BIMA-2']", "Kotak masuk");
      await lewatNavigator("[data-jendela='J-01']", "Masuk dengan akun BIMA");
      yakin(page.url().includes("/masuk"), "J-01 belum masuk tidak terbuka");
      yakin((await page.$("[data-testid=navigator-pil]")) !== null, "navigator tidak tampil di halaman Masuk");
      c("semua jendela J-01..J-08 dan dua halaman BIMA dapat dibuka dari navigator");
    });

    await skenario("Navigator demo: J-04 kosong versus berisi data, skenario aktif ditampilkan", page, async (c) => {
      await buka(page, url("/demo/mulai?j=J-04&s=kosong"), "Susun Usulan Penugasan");
      await ciutkanNavigator();
      const awal = await teksPanel("Usulan Penugasan");
      yakin(awal.includes("Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini."), "pesan kosong pertama tidak tampil");
      yakin(awal.includes("Tidak ada usulan yang menunggu penetapan."), "pesan kosong kedua tidak tampil");
      yakin((await page.$eval("[data-testid=navigator-pil]", (e) => e.textContent ?? "")).includes("Kosong"), "pil tidak menampilkan skenario aktif");
      await foto(page, "j04-kosong");
      c("skenario Kosong: kedua pesan keadaan kosong tampil dan pil menyebut skenario aktif");

      await bukaNavigator();
      yakin((await aktifNavigator()).includes("J-04 · Kosong"), "panel tidak menyebut skenario aktif");
      const aktifKosong = await page.$eval("[data-skenario=kosong]", (e) => e.getAttribute("aria-pressed"));
      yakin(aktifKosong === "true", "tombol skenario Kosong tidak ditandai aktif");
      const jumlahSkenario = await page.$$eval("[data-testid=navigator-panel] [data-skenario]", (e) => e.length);
      yakin(jumlahSkenario === 6, `J-04 seharusnya 6 skenario, ada ${jumlahSkenario}`);
      await foto(page, "navigator-skenario-j04");

      await lewatNavigator("[data-skenario='siap-kecil']", "Susun Usulan Penugasan");
      const siap = await teksPanel("Usulan Penugasan");
      yakin(/\d+ proposal Terkirim belum punya penugasan tetap/.test(siap), "keadaan siap-kecil tidak menampilkan proposal yang perlu ditugaskan");
      yakin(!siap.includes("Tidak ada proposal Terkirim yang masih perlu ditugaskan"), "keadaan berisi seharusnya tidak menampilkan pesan kosong");
      c("pindah ke skenario siap-kecil: pesan kosong hilang, jumlah proposal siap disusun tampil");
      const tepatEnam = siap.match(/(\d+) proposal Terkirim belum punya penugasan tetap/)?.[1];
      yakin(tepatEnam === "6", `siap-kecil seharusnya tepat 6 proposal Terkirim, ada ${tepatEnam}`);
      const tertutup = await tidakTertutupNavigator("#batas");
      yakin(!tertutup, tertutup);
      yakin((await teksPanel("Usulan Penugasan")).includes("Belum ada usulan penugasan"), "siap-kecil seharusnya menyuruh menyusun usulan");
      c("siap-kecil memuat tepat enam proposal; navigator ciut tidak menutupi isian Batas Beban sesudah pindah skenario");
      // pil tidak menyebut skenario jendela lain: pindah lewat menu header ke J-05
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), page.evaluate(() => (document.querySelector("nav[aria-label='Menu Tim Kerja DPPM'] a[href^='/tim-kerja/pemantauan']") as HTMLElement).click())]);
      await adaTeks(page, "Pemantauan Kesesuaian");
      const pilLain = await page.$eval("[data-testid=navigator-pil]", (e) => e.textContent ?? "");
      yakin(pilLain.includes("J-05") && !pilLain.includes("Siap") && pilLain.includes("belum dipilih"), `pil memuat skenario jendela lain: ${pilLain}`);
      c(`pil di jendela yang dibuka lewat menu tidak menyebut skenario jendela lain (${pilLain})`);
      await buka(page, url("/demo/mulai?j=J-04&s=siap-kecil"), "Susun Usulan Penugasan");

      await lewatNavigator("[data-skenario='menunggu']", "Usulan Penugasan");
      await page.waitForFunction(() => document.querySelectorAll("table tbody tr").length >= 4, { timeout: 30_000 });
      yakin((await teksPanel("Usulan Penugasan")).includes("usulan menunggu penetapan"), "usulan menunggu penetapan tidak tampil");
      await foto(page, "j04-menunggu");
      c("skenario menunggu: tabel Usulan Penugasan terisi");

      await lewatNavigator("[data-skenario='kekurangan']", "Kekurangan Reviewer", 180_000);
      await foto(page, "j04-kekurangan-navigator");
      c("skenario kekurangan: Susun otomatis dan panel Kekurangan Reviewer tampil");

      await lewatNavigator("[data-skenario='ditetapkan']", "Penugasan yang Sudah Ditetapkan", 180_000);
      yakin((await teksPanel("Penugasan yang Sudah Ditetapkan")).includes("penugasan sudah ditetapkan"), "ringkasan penugasan ditetapkan tidak tampil");
      await foto(page, "j04-ditetapkan-navigator");
      c("skenario ditetapkan: penugasan yang sudah ditetapkan tampil");
      await buka(page, url("/bima/kotak-masuk"), "Kotak masuk");
      yakin((await teksHalaman(page)).includes("Penugasan reviewer"), "kotak masuk BIMA kosong sesudah ditetapkan");
      c("kotak masuk BIMA memuat penugasan dari skenario ditetapkan");
    });

    await skenario("Navigator demo: skenario di J-01, J-02, J-03, J-05, J-06, J-07, J-08, BIMA", page, async (c) => {
      // J-01
      await buka(page, url("/demo/mulai?j=J-01&s=belum-masuk"), "Masuk dengan akun BIMA");
      await lewatNavigator("[data-skenario='anggota']", "Penugasan Reviewer");
      const menu = await page.$eval("nav[aria-label='Menu Tim Kerja DPPM']", (e) => e.textContent ?? "");
      yakin(!menu.includes("Templat Proposal") && menu.includes("Penugasan Reviewer") && menu.includes("Pemantauan Kesesuaian"), `menu anggota salah: ${menu}`);
      await buka(page, url("/demo/mulai?j=J-01&s=reviewer"), "Daftar Penugasan");
      c("J-01: belum masuk, masuk sebagai anggota (menu J-04/J-05 saja), masuk sebagai reviewer (J-07)");
      // J-02
      await buka(page, url("/demo/mulai?j=J-02&s=tanpa-templat"), "Skema ini belum memiliki templat");
      await lewatNavigator("[data-skenario='masa-berjalan']", "Templat Proposal");
      await lewatNavigator("[data-skenario='draf-tersimpan']", "Templat Proposal");
      yakin((await jumlahTombol(page, "Terbitkan")) >= 1, "draf tersimpan tidak dibuka (tombol Terbitkan tidak ada)");
      c("J-02: tanpa templat (S-1), masa berjalan (9a), draf tersimpan dibuka kembali");
      // J-03
      await buka(page, url("/demo/mulai?j=J-03&s=perlu-ditinjau"), "Butir Cek", 90_000);
      yakin((await teksHalaman(page)).includes("Perlu ditinjau"), "butir Perlu ditinjau tidak tampil di J-03");
      await foto(page, "j03-perlu-ditinjau-navigator");
      await lewatNavigator("[data-skenario='normal']", "Butir Cek", 90_000);
      yakin(!(await teksHalaman(page)).includes("Perlu ditinjau"), "skenario normal J-03 seharusnya tanpa butir Perlu ditinjau");
      c("J-03: butir Perlu ditinjau muncul pada skenario khusus dan hilang pada skenario normal");
      // J-05
      await buka(page, url("/demo/mulai?j=J-05&s=belum-final"), "Belum ada penilaian final untuk periode dan skema ini.", 90_000);
      await foto(page, "j05-belum-final");
      await lewatNavigator("[data-skenario='contoh']", "Butir Deterministik Paling Sering Gagal", 120_000);
      yakin(!(await teksHalaman(page)).includes("Belum ada penilaian final untuk periode dan skema ini."), "J-05 contoh seharusnya memuat penilaian final");
      c("J-05: belum ada penilaian final lalu data pemantauan contoh");
      // J-06
      await buka(page, url("/demo/mulai?j=J-06&s=terkirim"), "Bukti Pengiriman");
      yakin((await tungguStatusPengajuan(page)) === "Terkirim", "J-06 terkirim");
      await lewatNavigator("[data-skenario='ditahan']", "Pengiriman ditahan");
      yakin((await tungguStatusPengajuan(page)) === "Ditahan", "J-06 ditahan");
      await foto(page, "j06-ditahan-navigator");
      await lewatNavigator("[data-skenario='ditolak']", "Pengajuan ditolak");
      yakin((await tungguStatusPengajuan(page)) === "Ditolak", "J-06 ditolak");
      await lewatNavigator("[data-skenario='diperiksa']", "Pemeriksaan sedang berjalan");
      c("J-06: Terkirim, Ditahan, Ditolak, dan Sedang diperiksa");
      // J-07
      await buka(page, url("/demo/mulai?j=J-07&s=kosong"), "Belum ada proposal yang ditugaskan kepada Anda.");
      await lewatNavigator("[data-skenario='baru']", "Periksa");
      yakin((await teksHalaman(page)).includes("Baru"), "J-07 baru tanpa label Baru");
      await lewatNavigator("[data-skenario='draf']", "Periksa");
      yakin((await teksHalaman(page)).includes("Draf"), "J-07 draf tanpa label Draf");
      await lewatNavigator("[data-skenario='selesai']", "Selesai");
      yakin((await jumlahTombol(page, "Periksa")) >= 1, "J-07 selesai tanpa tombol Periksa");
      c("J-07: kosong, Baru, Draf, Selesai");
      // J-08
      await buka(page, url("/demo/mulai?j=J-08&s=final"), "Penilaian final: semua isian hanya dapat dibaca.");
      yakin((await jumlahTombol(page, "Simpan Permanen")) === 0, "J-08 final tidak boleh punya tombol Simpan Permanen");
      await foto(page, "j08-final-navigator");
      await lewatNavigator("[data-skenario='perlu-manual']", "Butir Semantik");
      yakin(await cariTekSemuaTab(page, "Perlu diperiksa manual"), "J-08 perlu-manual tanpa label Perlu diperiksa manual");
      await lewatNavigator("[data-skenario='belum-rekomendasi']", "Butir Semantik");
      yakin(await cariTekSemuaTab(page, "Belum ada rekomendasi"), "J-08 tanpa label Belum ada rekomendasi");
      await lewatNavigator("[data-skenario='draf']", "Butir Semantik");
      yakin((await jumlahTombol(page, "Simpan Permanen")) === 1, "J-08 draf seharusnya masih dapat disimpan permanen");
      await lewatNavigator("[data-skenario='normal']", "Butir Semantik");
      c("J-08: final hanya-baca, perlu diperiksa manual, belum ada rekomendasi, draf, normal");
      // BIMA
      await buka(page, url("/demo/mulai?j=BIMA-1&s=ditahan"), "Pengajuan proposal");
      yakin((await jumlahTombol(page, "Ajukan Usulan")) >= 1, "BIMA pengajuan tanpa tombol Ajukan Usulan");
      c("BIMA tiruan: halaman pengajuan membuka draf siap diajukan");
    });

    await skenario("Navigator demo: sakelar masa pengusulan, papan ketik, dan ciut", page, async (c) => {
      await buka(page, url("/demo/mulai?j=J-04&s=siap-kecil"), "Susun Usulan Penugasan");
      await bukaNavigator();
      await page.click("[data-testid=navigator-panel] [data-masa=berjalan]");
      await page.waitForFunction(() => document.querySelector("[data-testid=navigator-panel] [data-masa=berjalan]")?.getAttribute("aria-pressed") === "true", { timeout: 20_000 });
      await page.waitForFunction(() => document.body.innerText.includes("Masa pengusulan berjalan"), { timeout: 20_000 });
      await page.click("[data-testid=navigator-panel] [data-masa=ditutup]");
      await page.waitForFunction(() => document.querySelector("[data-testid=navigator-panel] [data-masa=ditutup]")?.getAttribute("aria-pressed") === "true", { timeout: 20_000 });
      await page.waitForFunction(() => document.body.innerText.includes("Masa pengusulan ditutup"), { timeout: 20_000 });
      c("sakelar masa pengusulan di navigator mengganti keadaan J-04 (berjalan lalu ditutup)");
      // papan ketik: Esc menciutkan, Alt+Shift+N membuka, fokus pindah ke panel
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
      const fokusDiPanel = await page.evaluate(() => document.querySelector("[data-testid=navigator-panel]")?.contains(document.activeElement));
      yakin(fokusDiPanel, "fokus tidak pindah ke panel navigator");
      await page.keyboard.press("Tab");
      const fokusTombol = await page.evaluate(() => document.activeElement?.tagName);
      yakin(fokusTombol === "BUTTON", `Tab seharusnya menjangkau tombol, bukan ${fokusTombol}`);
      c("papan ketik: Esc menciutkan, Alt+Shift+N membuka, fokus pindah ke panel, Tab menjangkau tombol");
      // tidak menutupi tombol utama
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
      c("navigator ciut tidak menutupi tombol utama di J-04 (viewport 1440x900)");
    });

    /* ---- J-04 skala nyata ---- */
    await skenario("J-04 skala nyata: 10.000 proposal (S-1, susun, halaman, sebaran, tetapkan, kotak masuk BIMA)", page, async (c) => {
      const lama = (mulai: number) => ((Date.now() - mulai) / 1000).toFixed(1);
      let t = Date.now();
      await buka(page, url("/demo/mulai?j=J-04&s=skala"), "Susun Usulan Penugasan");
      c(`menyiapkan skenario skala nyata (buka J-04): ${lama(t)} dtk`);
      const awal = await teksPanel("Usulan Penugasan");
      yakin(/10\.000 proposal Terkirim belum punya penugasan tetap/.test(awal), `J-04 skala tidak memuat 10.000 proposal: ${awal.slice(0, 120)}`);
      yakin((await page.$eval("#batas", (e) => (e as HTMLInputElement).value)) === "100", "batas beban bawaan seharusnya 100");
      yakin((await page.$eval("[data-testid=navigator-pil]", (e) => e.textContent ?? "")).includes("Skala nyata"), "pil tidak menyebut skenario skala nyata");
      await foto(page, "j04-skala-awal");

      // S-1: batas 60 x ±124 reviewer < 10.000
      await isi(page, "#batas", "60");
      t = Date.now();
      await klik(page, "Susun Usulan Penugasan");
      await adaTeks(page, "Kekurangan Reviewer", 120_000);
      c(`S-1 batas 60: panel Kekurangan Reviewer tampil (${lama(t)} dtk)`);
      await foto(page, "j04-skala-s1");

      // jalur utama: batas 100 membagi seluruh 10.000
      await isi(page, "#batas", "100");
      t = Date.now();
      await klik(page, "Susun Usulan Penugasan");
      await adaTeks(page, "Usulan penugasan disusun untuk 10.000 proposal", 240_000);
      const waktuSusun = lama(t);
      const pesanSusun = await page.evaluate(() => document.body.innerText.match(/Waktu proses di server: [\d,]+ detik/)?.[0] ?? "");
      c(`Susun Usulan Penugasan 10.000 proposal: ${waktuSusun} dtk dari klik sampai pesan (${pesanSusun})`);
      await page.waitForFunction(() => document.querySelector("[data-testid=ringkasan-usulan]")?.textContent?.includes("10.000 usulan menunggu penetapan"), { timeout: 60_000 });
      // tabel berhalaman: 50 baris + keterangan, bukan 10.000 baris
      const baris = await page.evaluate(() => {
        const tabel = [...document.querySelectorAll("table")].find((x) => x.querySelector("thead")?.textContent?.includes("Judul Proposal"))!;
        return tabel.querySelectorAll("tbody tr").length;
      });
      yakin(baris === 50, `tabel usulan seharusnya 50 baris per halaman, ada ${baris}`);
      const ket1 = await page.$eval("[data-testid=keterangan-hal]", (e) => e.textContent ?? "");
      yakin(ket1.includes("Baris 1-50 dari 10.000") && ket1.includes("halaman 1 dari 200"), `keterangan halaman salah: ${ket1}`);
      // setiap baris: institusi pengusul berbeda dengan institusi reviewer
      const sama = await page.evaluate(() => {
        const tabel = [...document.querySelectorAll("table")].find((x) => x.querySelector("thead")?.textContent?.includes("Judul Proposal"))!;
        return [...tabel.querySelectorAll("tbody tr")].filter((tr) => {
          const td = [...tr.querySelectorAll("td")].map((x) => x.textContent?.trim());
          return td[2] === td[4];
        }).length;
      });
      yakin(sama === 0, `${sama} baris halaman pertama memakai reviewer dari institusi pengusul`);
      // sebaran semua reviewer
      const sebaran = await page.$eval("[data-testid=ringkasan-sebaran]", (e) => e.textContent ?? "");
      const m = sebaran.match(/(\d+) reviewer bersedia; jumlah proposal per reviewer terendah (\d+), tertinggi (\d+)/);
      yakin(m && Number(m[1]) >= 120 && Number(m[3]) <= 100 && Number(m[3]) - Number(m[2]) <= 2, `sebaran beban tidak merata: ${sebaran}`);
      const barisSebaran = await page.evaluate(() => {
        const tabel = [...document.querySelectorAll("table")].find((x) => x.querySelector("thead")?.textContent?.includes("Jumlah Proposal"))!;
        return tabel.querySelectorAll("tbody tr").length;
      });
      yakin(barisSebaran === Number(m![1]), `Sebaran Beban menampilkan ${barisSebaran} baris, bukan ${m![1]}`);
      c(`tabel Usulan Penugasan 50 baris dari 10.000 (halaman 1 dari 200); Sebaran Beban ${barisSebaran} reviewer, ${sebaran}`);
      await foto(page, "j04-skala-usulan");

      // halaman berikutnya (navigasi sisi server)
      t = Date.now();
      await klik(page, "Berikutnya");
      await page.waitForFunction(() => document.querySelector("[data-testid=keterangan-hal]")?.textContent?.includes("Baris 51-100 dari 10.000"), { timeout: 60_000 });
      c(`halaman 2 usulan terbuka dalam ${lama(t)} dtk`);
      await foto(page, "j04-skala-halaman-2");

      // tetapkan: klaim atomik + kirim ke BIMA per kelompok 500
      t = Date.now();
      await klik(page, "Tetapkan Penugasan");
      await adaTeks(page, "Penugasan telah ditetapkan dan tercatat di BIMA (10.000 proposal)", 280_000);
      const waktuTetapkan = lama(t);
      const pesanTetapkan = await page.evaluate(() => [...document.body.innerText.matchAll(/Waktu proses di server: [\d,]+ detik/g)].pop()?.[0] ?? "");
      c(`Tetapkan Penugasan 10.000 proposal: ${waktuTetapkan} dtk dari klik sampai pesan (${pesanTetapkan})`);
      await page.waitForFunction(() => document.querySelector("[data-testid=ringkasan-ditetapkan]")?.textContent?.includes("10.000 penugasan sudah ditetapkan"), { timeout: 60_000 });
      yakin((await teksPanel("Usulan Penugasan")).includes("Tidak ada usulan yang menunggu penetapan."), "sesudah ditetapkan seharusnya tidak ada usulan menunggu");
      await foto(page, "j04-skala-ditetapkan");

      // kotak masuk BIMA: ringkasan, bukan 10.000 baris
      await buka(page, url("/bima/kotak-masuk"), "Ringkasan");
      const total = await page.$eval("[data-testid=total-penugasan]", (e) => e.textContent ?? "");
      yakin(total === "10.000", `kotak masuk BIMA menerima ${total} penugasan, bukan 10.000`);
      const barisKotak = await page.$$eval("table tbody tr", (r) => r.length);
      yakin(barisKotak === 100, `kotak masuk seharusnya menampilkan 100 pesan terbaru, ada ${barisKotak}`);
      await foto(page, "bima-kotak-masuk-skala");
      c("kotak masuk BIMA: 10.000 penugasan diterima tanpa ganda, ringkasan + 100 pesan terbaru");
      c(`CATATAN WAKTU: susun ${waktuSusun} dtk, tetapkan ${waktuTetapkan} dtk (klik sampai pesan, ${process.env.E2E_BASE_URL ? `produksi ${new URL(process.env.E2E_BASE_URL).host}` : "lokal ke Neon"})`);
    });

    await skenario("Skenario kecil tidak terpengaruh data skala nyata", page, async (c) => {
      const t = Date.now();
      await buka(page, url("/demo/mulai?j=J-04&s=siap-kecil"), "Susun Usulan Penugasan");
      const waktu = ((Date.now() - t) / 1000).toFixed(1);
      const panel = await teksPanel("Usulan Penugasan");
      yakin(/(^|\D)\d proposal Terkirim belum punya penugasan tetap/.test(panel), `skenario kecil memuat data skala: ${panel.slice(0, 160)}`);
      const sebaran = await page.$eval("[data-testid=ringkasan-sebaran]", (e) => e.textContent ?? "");
      yakin(/^[1-9]\d? reviewer bersedia/.test(sebaran), `reviewer skala nyata ikut tampil di skenario kecil: ${sebaran}`);
      c(`skenario siap-kecil sesudah skala nyata: ${waktu} dtk; ${sebaran.slice(0, 40)}`);
      await foto(page, "j04-siap-kecil-sesudah-skala");
      // sisa skala nyata (penugasan reviewer contoh dan pesan SKL) tidak boleh bocor ke jendela reviewer dan BIMA
      await buka(page, url("/demo/mulai?j=J-07&s=selesai"), "Daftar Penugasan");
      const baris = await page.$$eval("table tbody tr", (r) => r.map((x) => x.textContent ?? ""));
      yakin(baris.length === 1 && baris[0].includes("Selesai") && !baris[0].includes("Baru"), `J-07 Semua Selesai sesudah skala memuat ${baris.length} baris: ${baris.slice(0, 2).join(" | ").slice(0, 160)}`);
      await buka(page, url("/demo/mulai?j=J-07&s=baru"), "Daftar Penugasan");
      const barisBaru = await page.$$eval("table tbody tr", (r) => r.length);
      yakin(barisBaru === 1, `J-07 Baru sesudah skala memuat ${barisBaru} baris`);
      await buka(page, url("/bima/kotak-masuk"), "Kotak masuk");
      const sisaSkl = await page.evaluate(() => document.body.innerText.includes("SKL-2026-"));
      yakin(!sisaSkl, "kotak masuk BIMA masih memuat pesan SKL sesudah meninggalkan skala nyata");
      c("tidak ada sisa skala nyata: J-07 Semua Selesai dan Baru tepat 1 baris, kotak masuk BIMA tanpa pesan SKL");
    });

    /* ---- akhir: basis data bersih ---- */
    await skenario("Akhir: Reset & isi data demo (basis data bersih)", page, async (c) => {
      await buka(page, url("/demo"), "Pusat Demo");
      await tunggu(3000); // tunggu hidrasi (di produksi yang cepat, klik sebelum hidrasi tidak melakukan apa pun)
      await klik(page, "Reset & isi data demo");
      await adaTeks(page, "Data demo direset dan diisi ulang.", 240_000);
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
    "## Tangkapan layar (1440x900)",
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
