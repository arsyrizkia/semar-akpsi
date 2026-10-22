/**
 * Fungsi teks murni untuk UC-09 (tanpa basis data, aman diimpor komponen klien):
 * siapkanTeksTanpaIdentitas dan cocokkanKutipan.
 */

export const PENANDA_IDENTITAS = "[identitas dihapus]";

export interface IdentitasPengusul {
  nama?: string | null;
  institusi?: string | null;
  nomorInduk?: string | null;
  /** identitas tambahan yang tercatat pada metadata proposal dari BIMA (mis. email) */
  lain?: (string | null | undefined)[];
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const GELAR_DEPAN = /^((prof|dr|drs|dra|ir|h|hj)\.?\s+)+/i;

/** Varian penulisan nama: lengkap, tanpa gelar depan, tanpa gelar belakang (setelah koma). */
function varianNama(nama: string): string[] {
  const v = new Set<string>();
  const lengkap = nama.trim();
  if (lengkap.length >= 3) v.add(lengkap);
  const tanpaBelakang = lengkap.split(",")[0].trim();
  const tanpaDepan = tanpaBelakang.replace(GELAR_DEPAN, "").trim();
  for (const x of [tanpaBelakang, tanpaDepan]) if (x.length >= 3) v.add(x);
  return [...v];
}

/** siapkanTeksTanpaIdentitas (UC-09 langkah 3): membuang nama, afiliasi, dan nomor induk pengusul dari teks. */
export function siapkanTeksTanpaIdentitas(teks: string, identitas: IdentitasPengusul): string {
  const target = new Set<string>();
  if (identitas.nama) varianNama(identitas.nama).forEach((x) => target.add(x));
  for (const x of [identitas.institusi, identitas.nomorInduk, ...(identitas.lain ?? [])]) {
    if (x && x.trim().length >= 3) target.add(x.trim());
  }
  // yang terpanjang dulu agar "Dr. Sekar Anindita" tidak tersisa sebagian
  const urut = [...target].sort((a, b) => b.length - a.length);
  let hasil = teks;
  for (const t of urut) {
    const pola = escapeRegex(t).replace(/\s+/g, "\\s+");
    hasil = hasil.replace(new RegExp(pola, "gi"), PENANDA_IDENTITAS);
  }
  return hasil;
}

const KELAS_KUTIP: Record<string, string> = { "'": "['\u2018\u2019]", "\u2018": "['\u2018\u2019]", "\u2019": "['\u2018\u2019]", '"': '["\u201C\u201D]', "\u201C": '["\u201C\u201D]', "\u201D": '["\u201C\u201D]' };

/** Satu token kutipan menjadi pola: tanda kutip lurus dan lengkung dianggap sama, karakter lain persis. */
const polaToken = (t: string) => [...t].map((c) => KELAS_KUTIP[c] ?? escapeRegex(c)).join("");

/**
 * Mencari kutipan di teks (UC-09 langkah 7). Perbedaan spasi/baris baru dan tanda kutip lurus/lengkung diabaikan;
 * huruf besar-kecil dan tanda baca lain dibedakan. Mengembalikan rentang di teks asli, atau null.
 */
export function cariKutipan(teks: string, kutipan: string | null | undefined): { mulai: number; akhir: number } | null {
  const token = (kutipan ?? "").trim().split(/\s+/).filter(Boolean);
  if (token.length === 0 || !teks) return null;
  const pola = token.map(polaToken).join("\\s+");
  const m = new RegExp(pola).exec(teks);
  return m ? { mulai: m.index, akhir: m.index + m[0].length } : null;
}

/** cocokkanKutipan(teksBagian): true bila kutipan ada di teks. */
export function cocokkanKutipan(teksBagian: string, kutipan: string | null | undefined): boolean {
  return cariKutipan(teksBagian, kutipan) !== null;
}

/** Cari kunci tanpa membedakan huruf besar-kecil/spasi tepi. */
export function ambilBerdasarkanNama(peta: Record<string, string>, nama: string | null | undefined): string {
  if (!nama) return "";
  if (peta[nama] !== undefined) return peta[nama];
  const kunci = nama.trim().toLowerCase();
  const ketemu = Object.keys(peta).find((k) => k.trim().toLowerCase() === kunci);
  return ketemu ? peta[ketemu] : "";
}
