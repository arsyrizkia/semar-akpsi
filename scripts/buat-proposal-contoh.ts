/** Menulis proposal contoh DOCX + lampiran PDF ke data/contoh/proposal/<varian>/ untuk diperiksa manual. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buatDocx, buatLampiranPdf, susunContoh, type VarianContoh } from "../src/lib/contoh/proposal";

async function main() {
  for (const v of ["a", "b", "c", "d"] as VarianContoh[]) {
    const def = susunContoh(v);
    const dir = path.join(process.cwd(), "data", "contoh", "proposal", v);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "proposal.docx"), await buatDocx(def));
    for (const l of def.lampiran) await writeFile(path.join(dir, l.berkas), await buatLampiranPdf(l.nama, l.teks));
    console.log(`Varian ${v}: ${def.judul}`);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
