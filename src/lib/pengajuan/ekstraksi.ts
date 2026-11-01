/**
 * Ekstraksi isi berkas proposal dari BIMA menjadi blok teks (tanpa konversi manual, NFR 1.2).
 * DOCX dibaca dengan mammoth (struktur judul dipertahankan); PDF dengan unpdf (judul dikenali dari nama bagian templat).
 */
import mammoth from "mammoth";
import type { GambarNaskah } from "@/lib/kontrak/tipe";
import { siapkanGambar } from "./gambar";

export type JenisBlok = "judul" | "paragraf" | "gambar" | "tabel";

export interface BlokTeks {
  jenis: JenisBlok;
  teks: string;
  /** tingkat judul 1..6 (hanya untuk jenis "judul") */
  tingkat?: number;
  /** jenis "gambar": isi gambar yang sudah disiapkan untuk Layanan LLM (tidak ada bila gambar terlalu kecil atau tak terbaca) */
  gambar?: GambarNaskah;
  /** jenis "gambar" dari DOCX: nomor urut gambar mammoth (src "gambar:N"), diganti `gambar` oleh ekstrakDocx */
  rujukanGambar?: number;
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
      const rujukan = [...isi.matchAll(/<img\b[^>]*\bsrc="gambar:(\d+)"/gi)].map((m) => Number(m[1]));
      const t = bersihkan(isi);
      if (rujukan.length) for (const r of rujukan) blok.push({ jenis: "gambar", teks: "[gambar]", rujukanGambar: r });
      else if (/<img\b/i.test(isi)) blok.push({ jenis: "gambar", teks: "[gambar]" });
      if (t) {
        if (tag[0] === "h") blok.push({ jenis: "judul", teks: t.replace(/\n+/g, " "), tingkat: Number(tag[1]) });
        else for (const baris of t.split("\n")) if (baris.trim()) blok.push({ jenis: "paragraf", teks: baris.trim() });
      }
    }
  }
  return blok;
}

/** `gambar: false`: penanda "[gambar]" tetap ada di posisinya, tetapi isi gambar tidak disiapkan (pemeriksaan deterministik cukup penandanya). */
export interface OpsiEkstrak {
  gambar?: boolean;
}

export async function ekstrakDocx(bytes: Buffer, opsi: OpsiEkstrak = {}): Promise<BlokTeks[]> {
  // gambar dikumpulkan berurutan; HTML hanya membawa rujukan "gambar:N" supaya blokDariHtml tetap murni
  const berkasGambar: Buffer[] = [];
  const hasil = await mammoth.convertToHtml(
    { buffer: bytes },
    {
      convertImage: mammoth.images.imgElement(async (gambar) => {
        berkasGambar.push(await gambar.read());
        return { src: `gambar:${berkasGambar.length - 1}` };
      }),
    },
  );
  const blok = blokDariHtml(hasil.value);
  for (const b of blok) {
    if (b.rujukanGambar === undefined) continue;
    const berkas = berkasGambar[b.rujukanGambar];
    const siap = berkas && opsi.gambar !== false ? await siapkanGambar({ berkas }) : null;
    if (siap) b.gambar = siap;
    delete b.rujukanGambar;
  }
  return blok;
}

/** Baris teks satu halaman PDF beserta posisi vertikal (y PDF, makin besar makin atas) awal barisnya. */
export interface BarisHalaman {
  teks: string;
  y: number | null;
}

/**
 * Menyisipkan gambar ke urutan baca satu halaman: setiap gambar diletakkan sebelum baris pertama (urutan aliran PDF) yang berada di
 * bawah tepi bawah gambar; bila tidak ada, di akhir halaman. Keterangan "Gambar n. ..." yang ditulis di bawah gambar jadi mengikutinya.
 */
export function susunBarisHalaman(baris: BarisHalaman[], gambar: { bawah: number; indeks: number }[]): ({ teks: string } | { gambar: number })[] {
  const hasil: ({ teks: string } | { gambar: number })[] = [];
  const sisa = [...gambar].sort((a, b) => b.bawah - a.bawah);
  for (const br of baris) {
    while (sisa.length && br.y !== null && br.y < sisa[0].bawah) hasil.push({ gambar: sisa.shift()!.indeks });
    hasil.push({ teks: br.teks });
  }
  for (const g of sisa) hasil.push({ gambar: g.indeks });
  return hasil;
}

type Matriks = [number, number, number, number, number, number];
const kaliMatriks = (m1: Matriks, m2: number[]): Matriks => [
  m1[0] * m2[0] + m1[2] * m2[1],
  m1[1] * m2[0] + m1[3] * m2[1],
  m1[0] * m2[2] + m1[2] * m2[3],
  m1[1] * m2[2] + m1[3] * m2[3],
  m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
  m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
];
/** gambar yang tergambar lebih kecil dari ini (pt) di halaman dianggap ikon atau logo */
const UKURAN_MIN_PT = 60;

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

/**
 * Blok naskah PDF: baris teks sama dengan unpdf.extractText (item digabung, hasEOL memutus baris, spasi dirapatkan), ditambah blok
 * "[gambar]" di posisinya. Posisi gambar dihitung dari matriks transformasi daftar operator halaman (cm, save/restore, form XObject).
 */
export async function ekstrakPdf(bytes: Buffer, opsi: OpsiEkstrak = {}): Promise<BlokTeks[]> {
  const { getDocumentProxy, getResolvedPDFJS } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { OPS } = await getResolvedPDFJS();
  const blok: BlokTeks[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const halaman = await pdf.getPage(n);
    const isi = await halaman.getTextContent();
    const baris: BarisHalaman[] = [];
    let kini = "";
    let y: number | null = null;
    for (const it of isi.items) {
      if (!("str" in it) || it.str == null) continue;
      if (y === null && it.str.trim()) y = it.transform[5];
      kini += it.str;
      if (it.hasEOL) {
        baris.push({ teks: kini, y });
        kini = "";
        y = null;
      }
    }
    if (kini) baris.push({ teks: kini, y });

    const ops = await halaman.getOperatorList();
    const gambar: { bawah: number; indeks: number; objek: () => Promise<unknown> }[] = [];
    let ctm: Matriks = [1, 0, 0, 1, 0, 0];
    const tumpuk: Matriks[] = [];
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const arg = ops.argsArray[i];
      if (fn === OPS.save || fn === OPS.paintFormXObjectBegin) {
        tumpuk.push(ctm);
        if (fn === OPS.paintFormXObjectBegin && Array.isArray(arg?.[0])) ctm = kaliMatriks(ctm, arg[0]);
      } else if (fn === OPS.restore || fn === OPS.paintFormXObjectEnd) ctm = tumpuk.pop() ?? ctm;
      else if (fn === OPS.transform) ctm = kaliMatriks(ctm, arg);
      else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
        const ys = [ctm[5], ctm[5] + ctm[3], ctm[5] + ctm[1], ctm[5] + ctm[1] + ctm[3]];
        const lebarPt = Math.abs(ctm[0]) + Math.abs(ctm[2]);
        const tinggiPt = Math.max(...ys) - Math.min(...ys);
        if (lebarPt < UKURAN_MIN_PT || tinggiPt < UKURAN_MIN_PT) continue;
        const kunci = fn === OPS.paintImageXObject ? (arg[0] as string) : null;
        gambar.push({
          bawah: Math.min(...ys),
          indeks: gambar.length,
          objek: () =>
            kunci === null
              ? Promise.resolve(arg[0])
              : new Promise((selesai) => (kunci.startsWith("g_") ? halaman.commonObjs : halaman.objs).get(kunci, selesai)),
        });
      }
    }

    for (const x of susunBarisHalaman(baris, gambar)) {
      if ("teks" in x) {
        const t = normalkanButirPdf(x.teks).replace(/\s+/g, " ").trim();
        if (t) blok.push({ jenis: "paragraf", teks: t });
        continue;
      }
      if (opsi.gambar === false) {
        blok.push({ jenis: "gambar", teks: "[gambar]" });
        continue;
      }
      const o = (await gambar[x.gambar].objek()) as { data?: Uint8ClampedArray; width?: number; height?: number } | null;
      const kanal = o?.data && o.width && o.height ? o.data.length / (o.width * o.height) : 0;
      const siap = kanal === 1 || kanal === 3 || kanal === 4 ? await siapkanGambar({ piksel: o!.data!, lebar: o!.width!, tinggi: o!.height!, kanal }) : null;
      blok.push(siap ? { jenis: "gambar", teks: "[gambar]", gambar: siap } : { jenis: "gambar", teks: "[gambar]" });
    }
  }
  return blok;
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
export async function ekstrakNaskah(bytes: Buffer, nama: string, tipe: string, opsi: OpsiEkstrak = {}): Promise<BlokTeks[]> {
  const jenis = jenisBerkas(nama, tipe, bytes);
  if (jenis === "docx") return ekstrakDocx(bytes, opsi);
  if (jenis === "pdf") return ekstrakPdf(bytes, opsi);
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
