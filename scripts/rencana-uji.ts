/**
 * npm run rencana-uji: menyusun docs/rencana-uji.md (rencana uji gaya Dennis dkk., 2015, hlm. 469-475; Gambar 12-4 hlm. 472).
 *
 * Isi rencana diturunkan dari berkas uji itu sendiri, jadi tidak pernah menyimpang dari kode:
 *   - sumber rencana uji: komentar kepala berkas uji ("Sumber: CRC ..., Contract C-xx, Method Specification MS-xx");
 *   - unit yang diuji: judul `describe`;
 *   - ID, kasus uji, dan hasil yang diharapkan: judul `it("ID: ...")`;
 *   - hasil aktual dan lulus/gagal: coverage/hasil-vitest.json (jalankan `npm run laporan-uji` lebih dulu);
 *   - uji integrasi (e2e): e2e/hasil/laporan.md bila ada.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const akar = path.resolve(import.meta.dirname, "..");

function berkasUji(dir: string): string[] {
  const hasil: string[] = [];
  for (const nama of readdirSync(dir).sort()) {
    const p = path.join(dir, nama);
    if (statSync(p).isDirectory()) hasil.push(...berkasUji(p));
    else if (nama.endsWith(".test.ts")) hasil.push(p);
  }
  return hasil;
}

interface Kasus {
  id: string;
  judul: string;
  unit: string;
}
interface Berkas {
  jalur: string;
  jenis: "KH" | "KP" | "IT";
  sumber: string;
  kasus: Kasus[];
}

const POLA_ID = /^((KH|KP|IT)-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*?-\d{2}):\s*([\s\S]*)$/;

function uraikan(jalur: string): Berkas {
  const teks = readFileSync(jalur, "utf8");
  const baris = teks.split("\n");
  const kepala: string[] = [];
  for (const b of baris) {
    if (b.startsWith("//")) kepala.push(b.replace(/^\/\/\s?/, ""));
    else if (b.trim() === "" && kepala.length === 0) continue;
    else break;
  }
  const rel = path.relative(akar, jalur);
  const jenis = rel.includes("kotak-hitam") ? "KH" : rel.includes("kotak-putih") ? "KP" : "IT";
  const kasus: Kasus[] = [];
  let unit = "";
  for (const b of baris) {
    const d = /^\s*describe(?:\.\w+)?\(\s*(["'`])(.*?)\1/.exec(b);
    if (d) unit = d[2];
    const i = /^\s*(?:it|test)(?:\.\w+)?\(\s*(["'`])(.*?)\1/.exec(b);
    if (i) {
      const m = POLA_ID.exec(i[2]);
      if (m) kasus.push({ id: m[1], judul: m[3], unit });
    }
  }
  return { jalur: rel, jenis, sumber: kepala.join(" ").replace(/\s+/g, " ").trim(), kasus };
}

/** Jenis kasus menurut Dennis (hlm. 473), ditebak dari judul uji: nilai sah, batas, tidak sah, tipe salah/janggal, keadaan, cabang. */
function jenisKasus(judul: string, jenis: string): string {
  const j = judul.toLowerCase();
  if (/(tipe salah|null|undefined|bukan angka|tidak dikenal|janggal|nbsp|karakter regex|tipe)/.test(j)) return "tipe salah / nilai janggal";
  if (/(batas|tepat (di|pada)|satu (di )?(atas|bawah)|1 detik|sebelum dan sesudah)/.test(j)) return "batas bawah / atas";
  if (/(keadaan|transisi|state machine|dapat dicapai|hanya-baca)/.test(j)) return "keadaan dan transisi";
  if (/(ditolak|tidak sah|melebihi|gagal|kosong|tanpa )/.test(j)) return "nilai tidak sah";
  if (jenis === "KP") return "cabang / jalur";
  return "nilai sah";
}

const berkas = [...berkasUji(path.join(akar, "tests", "unit")), ...(existsSync(path.join(akar, "tests", "integrasi")) ? berkasUji(path.join(akar, "tests", "integrasi")) : [])].map(uraikan);

/* ---------------- hasil aktual dari vitest ---------------- */
const hasilVitest = new Map<string, { status: string; durasi: number | null; galat?: string }>();
const jsonVitest = path.join(akar, "coverage", "hasil-vitest.json");
let adaHasil = false;
if (existsSync(jsonVitest)) {
  try {
    const j = JSON.parse(readFileSync(jsonVitest, "utf8")) as { testResults: { assertionResults: { title: string; status: string; duration?: number | null; failureMessages?: string[] }[] }[] };
    for (const f of j.testResults)
      for (const a of f.assertionResults) {
        const m = POLA_ID.exec(a.title);
        if (m) hasilVitest.set(m[1], { status: a.status, durasi: a.duration ?? null, galat: a.failureMessages?.[0]?.split("\n")[0] });
      }
    adaHasil = true;
  } catch {
    /* tanpa hasil */
  }
}
const aktual = (id: string) => {
  const h = hasilVitest.get(id);
  if (!h) return { aktual: "belum dijalankan", status: "-" };
  if (h.status === "passed") return { aktual: `sesuai harapan${h.durasi != null ? ` (${Math.round(h.durasi)} ms)` : ""}`, status: "Lulus" };
  if (h.status === "failed") return { aktual: (h.galat ?? "tidak sesuai harapan").replace(/\|/g, "/"), status: "GAGAL" };
  return { aktual: "dilewati (butuh basis data uji)", status: "Dilewati" };
};

const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function bagianBerkas(b: Berkas): string {
  if (b.kasus.length === 0) return "";
  const unit = [...new Set(b.kasus.map((k) => k.unit).filter(Boolean))];
  const baris = b.kasus.map((k) => {
    const a = aktual(k.id);
    return `| ${k.id} | ${jenisKasus(k.judul, b.jenis)} | ${esc(k.judul)} | ${esc(a.aktual)} | ${a.status} |`;
  });
  return [
    `#### \`${path.basename(b.jalur)}\``,
    "",
    `- **Unit yang diuji:** ${unit.length ? unit.map(esc).join("; ") : "-"}`,
    `- **Sumber rencana uji:** ${esc(b.sumber.replace(/^Uji kotak (hitam|putih) \(Dennis dkk\., 2015, hlm\. 471-475\)[:.]?\s*/, "")) || "-"}`,
    `- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.`,
    "",
    "| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |",
    "|---|---|---|---|---|",
    ...baris,
    "",
  ].join("\n");
}

const kh = berkas.filter((b) => b.jenis === "KH");
const kp = berkas.filter((b) => b.jenis === "KP");
const it = berkas.filter((b) => b.jenis === "IT");
const jumlah = (bs: Berkas[]) => bs.reduce((n, b) => n + b.kasus.length, 0);
const hitungStatus = (bs: Berkas[], s: string) => bs.flatMap((b) => b.kasus).filter((k) => aktual(k.id).status === s).length;

/* ---------------- e2e ---------------- */
const jalurE2e = path.join(akar, "e2e", "hasil", "laporan.md");
let barisE2e: { skenario: string; hasil: string; catatan: string }[] = [];
let ringkasE2e = "";
if (existsSync(jalurE2e)) {
  const t = readFileSync(jalurE2e, "utf8").split("\n");
  ringkasE2e = t.find((x) => x.startsWith("Dijalankan:")) ?? "";
  barisE2e = t
    .filter((x) => x.startsWith("| ") && !x.startsWith("| Skenario | Hasil") && !x.startsWith("|---"))
    .map((x) => {
      const p = x.split(" | ");
      return { skenario: p[0].replace(/^\| /, ""), hasil: p[1] ?? "", catatan: (p.slice(2).join(" | ") ?? "").replace(/ \|$/, "") };
    });
}
const sumberE2e = (nama: string): string => {
  const n = nama.toLowerCase();
  const m = /(uc-0\d)/.exec(n);
  if (m) return `Real use case ${m[1].toUpperCase()} (use-case testing)`;
  if (n.includes("bolak-balik")) return "Use scenario lintas UC-01, UC-02, UC-05, UC-06 dan alur bolak-balik (docs/arah-perbaikan-2026-10-22.md bagian 3)";
  if (n.includes("hak akses")) return "NFR 3.2 (hak akses) dan aturan unduhan berkas";
  if (n.includes("navigator")) return "Pusat Demo dan Navigator (docs/peta-uc-jendela.md)";
  if (n.includes("skala")) return "NFR kinerja: 10.000 proposal (UC-03)";
  return "Alur jendela (docs/peta-uc-jendela.md)";
};

const tanggal = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" });

const md = `# Rencana uji SEMAR

Disusun otomatis oleh \`npm run rencana-uji\` pada ${tanggal} WIB dari berkas uji dan hasil terakhir (\`npm run laporan-uji\`, \`npm run e2e\`). Jangan disunting tangan; ubah komentar kepala atau judul uji pada berkasnya.

Gaya dan istilah mengikuti Dennis, Wixom, dan Tegarden (2015) hlm. 469-475: uji unit *black box* dan *white box*, uji integrasi, dan uji kinerja. Sumber rencana uji persis Gambar 12-4 (hlm. 472).

## 1. Pendekatan dan sumber rencana uji

| Tingkat | Pendekatan | Sumber rencana uji (Gambar 12-4) | Letak |
|---|---|---|---|
| Unit | *Black box* (KH-) | CRC Cards, *Class Diagrams*, *Contracts* (Gambar 8-22, hlm. 309); *behavioral state machine* untuk kasus keadaan (hlm. 473), selalu dicatat bersama CRC atau *class diagram* kelas pemiliknya | \`tests/unit/kotak-hitam/\` |
| Unit | *White box* (KP-) | *Method Specifications* (Gambar 8-26, hlm. 315): setiap cabang dan jalur metode yang kompleks | \`tests/unit/kotak-putih/\` |
| Integrasi | *Use-case testing* | *Real use case* dan *use scenario* (e2e per UC dan alur bolak-balik) | \`e2e/jalankan.ts\`; basis data: \`tests/integrasi/\` |
| Kinerja | *Stress/volume test* | Persyaratan kinerja (NFR 2.x) | KP-susunUsulanMurniSkala dan e2e skala nyata |

*Real use case* bukan sumber unit test. Kelas yang belum siap atau eksternal diganti *stub* (hlm. 471): klien BIMA dan Layanan LLM (\`tests/unit/stub/\`). Kontrak dan spesifikasi metode ada di \`docs/kontrak-dan-spesifikasi-metode.md\`.

Jenis kasus pada tiap baris mengikuti hlm. 473 (nilai sah; tidak sah di bawah atau di atas batas; tipe salah; nilai janggal tetapi mungkin sah; keadaan dan transisi; cabang). Kolom itu ditebak dari kata kunci judul uji, jadi bersifat petunjuk; kasus sebenarnya adalah isi tes.

## 2. Ringkasan

| Jenis | Jumlah uji | Lulus | Gagal | Dilewati |
|---|---:|---:|---:|---:|
| Unit *black box* (KH) | ${jumlah(kh)} | ${hitungStatus(kh, "Lulus")} | ${hitungStatus(kh, "GAGAL")} | ${hitungStatus(kh, "Dilewati")} |
| Unit *white box* (KP) | ${jumlah(kp)} | ${hitungStatus(kp, "Lulus")} | ${hitungStatus(kp, "GAGAL")} | ${hitungStatus(kp, "Dilewati")} |
| Integrasi basis data (IT) | ${jumlah(it)} | ${hitungStatus(it, "Lulus")} | ${hitungStatus(it, "GAGAL")} | ${hitungStatus(it, "Dilewati")} |
| Integrasi e2e (skenario) | ${barisE2e.length} | ${barisE2e.filter((x) => x.hasil === "lulus").length} | ${barisE2e.filter((x) => x.hasil !== "lulus").length} | 0 |

${adaHasil ? "" : "> Hasil aktual belum tersedia: jalankan `npm run laporan-uji` lalu `npm run rencana-uji`.\n"}
## 3. Uji unit *black box* (KH)

Setiap butir sumber menjadi satu uji dengan beberapa kasus. Setiap keadaan *state machine* diuji dapat dicapai, dan hanya transisi yang didefinisikan yang diizinkan.

${kh.map(bagianBerkas).join("\n")}
## 4. Uji unit *white box* (KP)

Setiap cabang atau jalur metode yang kompleks diuji menurut *Method Specification*-nya.

${kp.map(bagianBerkas).join("\n")}
## 5. Uji integrasi

### 5.1 Integrasi dengan basis data (IT)

Berjalan pada basis data uji; dilewati bila \`DATABASE_URL\` tidak diizinkan (lihat \`vitest.config.mts\`).

${it.map(bagianBerkas).join("\n") || "Tidak ada."}
### 5.2 *Use-case testing* (e2e per UC dan alur bolak-balik)

Dijalankan dengan \`npm run e2e\` (puppeteer-core, Chrome lokal) terhadap \`next start\`, mode LLM tiruan. Sumber: *real use case* tiap UC dan *use scenario*. ${ringkasE2e}

Tangkapan layar setiap layar dan modal pada lebar 1440 dan 390 px ada di \`docs/bukti-e2e/\`.

| Skenario | Sumber | Hasil | Catatan hasil aktual |
|---|---|---|---|
${barisE2e.map((x) => `| ${esc(x.skenario)} | ${sumberE2e(x.skenario)} | ${x.hasil} | ${esc(x.catatan)} |`).join("\n") || "| (belum dijalankan) | | | |"}

## 6. Uji kinerja

- **Susun usulan 10.000 proposal:** KP-susunUsulanMurniSkala-01..02 (fungsi murni \`susunPenugasan\`, kurang dari 3 detik) pada bagian 4.
- **J-04b skala nyata:** skenario e2e "J-04 skala nyata" (10.000 proposal, sekitar 130 reviewer dari 40 institusi): Susun Usulan Penugasan, tabel berhalaman 50 baris, Tetapkan Penugasan, dan penerimaan di kotak masuk BIMA; catatan waktu ada pada baris skenarionya di bagian 5.2.
- **Pembukaan J-08 (NFR 2.3, batas 3 detik):** diukur di skenario e2e UC-07b/UC-08.

## 7. Cakupan

\`npm run test:coverage\` mengukur cakupan cabang untuk \`src/lib/**\` kecuali \`src/lib/demo/**\` dan pengecualian lain di \`vitest.config.mts\`; ambang minimum 80%. Angka per modul ada di \`docs/laporan-uji.md\`.
`;
writeFileSync(path.join(akar, "docs", "rencana-uji.md"), md);
console.log(`docs/rencana-uji.md: KH ${jumlah(kh)}, KP ${jumlah(kp)}, IT ${jumlah(it)}, e2e ${barisE2e.length}`);
