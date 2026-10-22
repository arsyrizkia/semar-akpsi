/**
 * npm run laporan-uji: menjalankan vitest (reporter JSON) dengan cakupan v8, lalu menulis docs/laporan-uji.md:
 * hasil aktual per ID uji (KH-/KP-/IT-) dan ringkasan cakupan cabang per modul. Basis data tidak disentuh kecuali tes integrasi diizinkan
 * (lihat vitest.config.mts); tes integrasi yang dilewati tercatat "Dilewati".
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const akar = path.resolve(import.meta.dirname, "..");
const keluaranJson = path.join(akar, "coverage", "hasil-vitest.json");
mkdirSync(path.dirname(keluaranJson), { recursive: true });
rmSync(keluaranJson, { force: true });

const jalan = spawnSync("npx", ["vitest", "run", "--coverage", "--reporter=json", `--outputFile=${keluaranJson}`], { cwd: akar, encoding: "utf8", env: process.env });
const ambangGagal = /does not meet global threshold/.test(`${jalan.stdout}${jalan.stderr}`);

interface Asersi {
  title: string;
  fullName: string;
  status: "passed" | "failed" | "skipped" | "pending" | "todo";
  duration?: number | null;
  ancestorTitles: string[];
  failureMessages?: string[];
}
interface BerkasHasil {
  name: string;
  assertionResults: Asersi[];
}
let hasil: { testResults: BerkasHasil[]; startTime?: number };
try {
  hasil = JSON.parse(readFileSync(keluaranJson, "utf8"));
} catch {
  console.error("Gagal membaca hasil vitest:\n", jalan.stdout, jalan.stderr);
  process.exit(2);
}

const POLA_ID = /^((KH|KP|IT)-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*?-\d{2}):\s*([\s\S]*)$/;
interface Baris {
  id: string;
  jenis: "KH" | "KP" | "IT" | "-";
  berkas: string;
  kasus: string;
  status: string;
  durasi: string;
  galat?: string;
}
const baris: Baris[] = [];
for (const b of hasil.testResults) {
  const berkas = path.relative(akar, b.name);
  for (const a of b.assertionResults) {
    const m = POLA_ID.exec(a.title);
    const status = a.status === "passed" ? "Lulus" : a.status === "failed" ? "GAGAL" : "Dilewati";
    baris.push({
      id: m ? m[1] : "(tanpa ID)",
      jenis: m ? (m[2] as Baris["jenis"]) : "-",
      berkas,
      kasus: (m ? m[3] : a.title).replace(/\|/g, "\\|").replace(/\n/g, " "),
      status,
      durasi: a.duration != null ? `${Math.round(a.duration)} ms` : "-",
      galat: a.failureMessages?.[0]?.split("\n")[0],
    });
  }
}

const hitung = (f: (r: Baris) => boolean) => baris.filter(f).length;
const ringkas = (j: string) => ({ lulus: hitung((r) => r.jenis === j && r.status === "Lulus"), gagal: hitung((r) => r.jenis === j && r.status === "GAGAL"), lewat: hitung((r) => r.jenis === j && r.status === "Dilewati") });
const kh = ringkas("KH");
const kp = ringkas("KP");
const it = ringkas("IT");
const tanpaId = baris.filter((r) => r.jenis === "-");

/* ------------------------------- cakupan ------------------------------- */
interface Ringkasan {
  statements: { pct: number };
  branches: { pct: number; covered: number; total: number };
  functions: { pct: number };
  lines: { pct: number };
}
let cakupan: Record<string, Ringkasan> = {};
try {
  cakupan = JSON.parse(readFileSync(path.join(akar, "coverage", "coverage-summary.json"), "utf8"));
} catch {
  /* tanpa cakupan */
}
const modul = new Map<string, { c: number; t: number; st: number; sc: number; ln: number; lc: number }>();
for (const [berkas, v] of Object.entries(cakupan)) {
  if (berkas === "total") continue;
  const rel = path.relative(akar, berkas);
  const bagian = rel.split(path.sep);
  const kunci = bagian.length > 3 ? bagian.slice(0, 3).join("/") : bagian.slice(0, 2).join("/") + "/(berkas langsung)";
  const e = modul.get(kunci) ?? { c: 0, t: 0, st: 0, sc: 0, ln: 0, lc: 0 };
  e.c += v.branches.covered;
  e.t += v.branches.total;
  modul.set(kunci, e);
}
const total = cakupan.total;
const pct = (c: number, t: number) => (t === 0 ? "100,0%" : `${((c / t) * 100).toFixed(1).replace(".", ",")}%`);
const f1 = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;

const tanggal = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" });
const tabel = (rows: Baris[]) =>
  ["| ID | Kasus | Berkas | Hasil aktual |", "|---|---|---|---|", ...rows.map((r) => `| ${r.id} | ${r.kasus} | \`${path.basename(r.berkas)}\` | ${r.status} |`)].join("\n");
const urut = (j: string) => baris.filter((r) => r.jenis === j).sort((a, b) => a.id.localeCompare(b.id));

const md = `# Laporan uji SEMAR

Dibangkitkan otomatis oleh \`npm run laporan-uji\` pada ${tanggal} WIB. Jangan disunting tangan.

Pendekatan: uji unit dua jenis menurut Dennis dkk. (2015, hlm. 471-475). *Black box* (KH, \`tests/unit/kotak-hitam/\`) diturunkan dari kontrak, kartu CRC, *state machine*, dan *real use case*; *white box* (KP, \`tests/unit/kotak-putih/\`) diturunkan dari spesifikasi metode dan menjalankan setiap cabang; tes integrasi (IT, \`tests/integrasi/\`) berjalan pada basis data uji dan dilewati bila tidak tersedia. Stub BIMA dan LLM ada di \`tests/unit/stub/\`.

## Ringkasan

| Jenis | Lulus | Gagal | Dilewati |
|---|---:|---:|---:|
| Kotak hitam (KH) | ${kh.lulus} | ${kh.gagal} | ${kh.lewat} |
| Kotak putih (KP) | ${kp.lulus} | ${kp.gagal} | ${kp.lewat} |
| Integrasi (IT) | ${it.lulus} | ${it.gagal} | ${it.lewat} |
| Tanpa ID | ${tanpaId.filter((r) => r.status === "Lulus").length} | ${tanpaId.filter((r) => r.status === "GAGAL").length} | ${tanpaId.filter((r) => r.status === "Dilewati").length} |

Cakupan cabang \`src/lib/**\` (kecuali pengecualian di \`vitest.config.mts\`): **${total ? f1(total.branches.pct) : "-"}** (${total ? `${total.branches.covered} dari ${total.branches.total} cabang` : "-"}); ambang minimum 80%${ambangGagal ? " **(TIDAK TERPENUHI)**" : " (terpenuhi)"}. Pernyataan ${total ? f1(total.statements.pct) : "-"}, fungsi ${total ? f1(total.functions.pct) : "-"}, baris ${total ? f1(total.lines.pct) : "-"}.

## Cakupan cabang per modul

| Modul | Cabang tercakup | Persen |
|---|---:|---:|
${[...modul.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `| \`${k}\` | ${v.c} / ${v.t} | ${pct(v.c, v.t)} |`).join("\n")}

## Hasil aktual per ID

### Kotak hitam (KH)

${tabel(urut("KH"))}

### Kotak putih (KP)

${tabel(urut("KP"))}

### Integrasi (IT)

${urut("IT").length ? tabel(urut("IT")) : "_Tidak ada._"}
${tanpaId.length ? `\n### Tanpa ID (harus nol)\n\n${tabel(tanpaId)}\n` : ""}
${baris.some((r) => r.status === "GAGAL") ? `\n## Kegagalan\n\n${baris.filter((r) => r.status === "GAGAL").map((r) => `- **${r.id}**: ${r.galat ?? ""}`).join("\n")}\n` : ""}`;

writeFileSync(path.join(akar, "docs", "laporan-uji.md"), md);
const gagal = baris.filter((r) => r.status === "GAGAL").length;
console.log(`docs/laporan-uji.md ditulis: KH ${kh.lulus}, KP ${kp.lulus}, IT lulus ${it.lulus}/dilewati ${it.lewat}, gagal ${gagal}, cabang ${total ? f1(total.branches.pct) : "-"}`);
process.exit(gagal > 0 || ambangGagal ? 1 : 0);
