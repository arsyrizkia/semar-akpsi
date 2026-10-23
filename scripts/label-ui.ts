/**
 * Pemeriksa label antarmuka: mengumpulkan teks tombol/tautan/judul/kepala tabel/label dari src/app/** dan src/components/**,
 * lalu melaporkan yang TIDAK muncul di docs/spesifikasi-ui.md, docs/catatan-inkonsistensi.md, atau docs/peta-uc-jendela.md.
 * Dipakai supaya catatan inkonsistensi No. 20 tidak tertinggal. Jalankan: npm run label-ui
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const rujukan = ["docs/spesifikasi-ui.md", "docs/catatan-inkonsistensi.md", "docs/peta-uc-jendela.md"].map((f) => readFileSync(path.join(ROOT, f), "utf8")).join("\n").toLowerCase();

function berkas(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? berkas(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

const temuan = new Map<string, Set<string>>();
const tambah = (teks: string, f: string) => {
  const t = teks.replace(/\s+/g, " ").replace(/&ldquo;|&rdquo;/g, '"').replace(/&amp;/g, "&").trim();
  if (t.length < 4 || t.length > 70 || /[{}=;()<>]/.test(t.replace(/\(n\)|\(\.docx\)|\(simulasi\)/g, ""))) return;
  if (!/^[A-Z]/.test(t)) return;
  if (rujukan.includes(t.toLowerCase())) return;
  if (!temuan.has(t)) temuan.set(t, new Set());
  temuan.get(t)!.add(path.relative(ROOT, f));
};

for (const f of [...berkas(path.join(ROOT, "src/app")), ...berkas(path.join(ROOT, "src/components"))]) {
  const isi = readFileSync(f, "utf8");
  for (const m of isi.matchAll(/>\s*([A-Z][^<>{}\n]{3,70}?)\s*</g)) tambah(m[1], f);
  for (const m of isi.matchAll(/\b(?:label|judul|labelKonfirmasi|labelBatal|aria-label)="([^"{}]{4,70})"/g)) tambah(m[1], f);
}

const urut = [...temuan.entries()].sort((a, b) => [...a[1]][0].localeCompare([...b[1]][0]));
console.log(`${urut.length} teks di antarmuka yang tidak ditemukan di spesifikasi-ui, catatan-inkonsistensi, dan peta-uc-jendela:\n`);
for (const [t, fs] of urut) console.log(`- "${t}"  (${[...fs].join(", ")})`);
