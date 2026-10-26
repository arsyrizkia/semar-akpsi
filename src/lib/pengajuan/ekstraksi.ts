/**
 * Ekstraksi isi berkas proposal dari BIMA menjadi blok teks (tanpa konversi manual, NFR 1.2).
 * DOCX dibaca dengan mammoth (struktur judul dipertahankan); PDF dengan unpdf (judul dikenali dari nama bagian templat).
 */
import mammoth from "mammoth";

export type JenisBlok = "judul" | "paragraf" | "gambar" | "tabel";

export interface BlokTeks {
  jenis: JenisBlok;
  teks: string;
  /** tingkat judul 1..6 (hanya untuk jenis "judul") */
  tingkat?: number;
}

export const TIPE_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const TIPE_PDF = "application/pdf";

const ENTITAS: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function dekodeEntitas(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (semua, kode: string) => {
    if (kode[0] === "#") {
      const n = kode[1].toLowerCase() === "x" ? parseInt(kode.slice(2), 16) : parseInt(kode.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : semua;
    }
    return ENTITAS[kode.toLowerCase()] ?? semua;
  });
}

const bersihkan = (html: string) =>
  dekodeEntitas(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();

const POLA_TAG_ATAS = /<(h[1-6]|p|table|ul|ol)\b[^>]*>/gi;

/** Elemen tingkat atas dari potongan HTML; kemunculan bersarang dengan nama yang sama (tabel dalam tabel) dihitung agar penutupnya tepat. */
function elemenTingkatAtas(html: string, nama: RegExp = POLA_TAG_ATAS): { tag: string; isi: string }[] {
  const hasil: { tag: string; isi: string }[] = [];
  const pola = new RegExp(nama.source, "gi");
  let m: RegExpExecArray | null;
  let dari = 0;
  pola.lastIndex = dari;
  while ((m = pola.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const awal = m.index + m[0].length;
    const buka = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, "gi");
    buka.lastIndex = awal;
    let kedalaman = 1;
    let tutup = -1;
    let akhir = awal;
    let t: RegExpExecArray | null;
    while ((t = buka.exec(html)) !== null) {
      if (t[0][1] === "/") kedalaman--;
      else kedalaman++;
      if (kedalaman === 0) {
        tutup = t.index;
        akhir = t.index + t[0].length;
        break;
      }
    }
    if (tutup < 0) break;
    hasil.push({ tag, isi: html.slice(awal, tutup) });
    dari = akhir;
    pola.lastIndex = dari;
  }
  return hasil;
}

/** Judul bagian berhuruf ("A. JUDUL") di awal sel pertama tabel: tabel itu adalah tabel bagian Isian Substansi, bukan tabel data. */
const POLA_SEL_BAGIAN = /^[A-Z]\s*[.)]\s*\S/;

/**
 * HTML keluaran mammoth menjadi blok: judul, paragraf, gambar, tabel (isi tabel data dibuang). Pengecualian: tabel bagian Isian Substansi
 * (sel pertamanya berawal judul berhuruf, "A. JUDUL"), yang isi selnya dibuka menjadi blok sendiri; tabel di dalam sel tetap satu blok "[tabel]".
 */
export function blokDariHtml(html: string): BlokTeks[] {
  const blok: BlokTeks[] = [];
  for (const { tag, isi } of elemenTingkatAtas(html)) {
    if (tag === "table") {
      const sel = elemenTingkatAtas(isi, /<(td|th)\b[^>]*>/gi).map((x) => blokDariHtml(x.isi));
      const pertama = sel[0]?.find((b) => b.jenis === "judul" || b.jenis === "paragraf");
      if (pertama && POLA_SEL_BAGIAN.test(pertama.teks.trim())) for (const b of sel) blok.push(...b);
      else blok.push({ jenis: "tabel", teks: "[tabel]" });
    } else if (tag === "ul" || tag === "ol") {
      for (const li of isi.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
        const t = bersihkan(li[1]);
        if (t) blok.push({ jenis: "paragraf", teks: t });
      }
    } else {
      const adaGambar = /<img\b/i.test(isi);
      const t = bersihkan(isi);
      if (adaGambar) blok.push({ jenis: "gambar", teks: "[gambar]" });
      if (t) {
        if (tag[0] === "h") blok.push({ jenis: "judul", teks: t.replace(/\n+/g, " "), tingkat: Number(tag[1]) });
        else for (const baris of t.split("\n")) if (baris.trim()) blok.push({ jenis: "paragraf", teks: baris.trim() });
      }
    }
  }
  return blok;
}

export async function ekstrakDocx(bytes: Buffer): Promise<BlokTeks[]> {
  const hasil = await mammoth.convertToHtml(
    { buffer: bytes },
    { convertImage: mammoth.images.imgElement(async () => ({ src: "gambar" })) },
  );
  return blokDariHtml(hasil.value);
}

export async function ekstrakTeksPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const dokumen = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(dokumen, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

/**
 * Glyph butir daftar dari font simbol (Wingdings/Symbol) di PDF ekspor Word/BIMA terbaca sebagai karakter Private Use Area
 * (mis. U+F071, U+F0B7). Diganti tanda butir biasa supaya teks, kutipan, dan hitungan kata tidak membawa karakter tak terbaca.
 */
export const normalkanButirPdf = (teks: string) => teks.replace(/[\uE000-\uF8FF]/g, "•");

export async function ekstrakPdf(bytes: Buffer): Promise<BlokTeks[]> {
  const teks = normalkanButirPdf(await ekstrakTeksPdf(bytes));
  return teks
    .split(/\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => ({ jenis: "paragraf" as const, teks: b }));
}

export function jenisBerkas(nama: string, tipe: string, bytes: Buffer): "docx" | "pdf" | null {
  const n = nama.toLowerCase();
  if (bytes.subarray(0, 4).toString("latin1") === "%PDF" || tipe === TIPE_PDF || n.endsWith(".pdf")) {
    return bytes.subarray(0, 4).toString("latin1") === "%PDF" ? "pdf" : null;
  }
  if (bytes.subarray(0, 2).toString("latin1") === "PK" && (tipe === TIPE_DOCX || n.endsWith(".docx"))) return "docx";
  return null;
}

/** Blok naskah proposal dari berkas BIMA (DOCX atau PDF). */
export async function ekstrakNaskah(bytes: Buffer, nama: string, tipe: string): Promise<BlokTeks[]> {
  const jenis = jenisBerkas(nama, tipe, bytes);
  if (jenis === "docx") return ekstrakDocx(bytes);
  if (jenis === "pdf") return ekstrakPdf(bytes);
  throw new Error(`format berkas tidak didukung: ${nama} (hanya DOCX atau PDF)`);
}

const BATAS_TEKS_LAMPIRAN = 20_000;

/** Teks lampiran untuk butir semantik atas lampiran (UC-09). Kegagalan baca tidak menggagalkan pengajuan. */
export async function ekstrakTeksLampiran(bytes: Buffer, nama: string, tipe: string): Promise<string> {
  try {
    const jenis = jenisBerkas(nama, tipe, bytes);
    let teks = "";
    if (jenis === "pdf") teks = await ekstrakTeksPdf(bytes);
    else if (jenis === "docx") teks = (await mammoth.extractRawText({ buffer: bytes })).value;
    return teks.replace(/[ \t]+/g, " ").trim().slice(0, BATAS_TEKS_LAMPIRAN);
  } catch {
    return "";
  }
}
