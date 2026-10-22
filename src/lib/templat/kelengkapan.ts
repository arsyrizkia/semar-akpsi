/**
 * periksaKelengkapan() UC-01 langkah 7: murni (tanpa basis data) sehingga dipakai server dan peramban.
 * Setiap baris bagian harus punya nama dan batas kata (angka bulat > 0, atau dicentang "Tanpa batas kata"),
 * isian "Periode Berlaku" harus terisi, dan templat memuat sekurang-kurangnya satu bagian.
 */

export interface BarisBagianMentah {
  nama: string;
  /** isian mentah "Batas Kata" */
  batas: string;
  /** true bila bagian memang tanpa batas kata (mis. Daftar Pustaka) */
  tanpaBatas: boolean;
  wajib: boolean;
}

export interface MasukanKelengkapan {
  bagian: BarisBagianMentah[];
  lampiran: string[];
  periodeBerlakuId: string | null;
}

export interface HasilKelengkapan {
  lengkap: boolean;
  /** per baris: true = isian itu perlu ditandai */
  bagian: { nama: boolean; batas: boolean }[];
  lampiran: boolean[];
  periode: boolean;
  tanpaBagian: boolean;
}

export function batasKataValid(s: string): boolean {
  return /^\d{1,6}$/.test(s.trim()) && Number(s) > 0;
}

export function periksaKelengkapan(m: MasukanKelengkapan): HasilKelengkapan {
  const hitungNama = new Map<string, number>();
  for (const b of m.bagian) {
    const k = b.nama.trim().toLowerCase();
    if (k) hitungNama.set(k, (hitungNama.get(k) ?? 0) + 1);
  }
  const bagian = m.bagian.map((b) => ({
    // nama kosong atau ganda (kunci teksPerBagian harus unik)
    nama: b.nama.trim() === "" || (hitungNama.get(b.nama.trim().toLowerCase()) ?? 0) > 1,
    batas: !b.tanpaBatas && !batasKataValid(b.batas),
  }));
  const lampiran = m.lampiran.map((l) => l.trim() === "");
  const periode = !m.periodeBerlakuId;
  const tanpaBagian = m.bagian.length === 0;
  const lengkap = !tanpaBagian && !periode && bagian.every((b) => !b.nama && !b.batas) && lampiran.every((x) => !x);
  return { lengkap, bagian, lampiran, periode, tanpaBagian };
}

/** Ubah isian mentah yang sudah lengkap menjadi nilai tersimpan. */
export function bagianTersimpan(b: BarisBagianMentah): { nama: string; batasKata: number | null; wajib: boolean } {
  return { nama: b.nama.trim(), batasKata: b.tanpaBatas ? null : Number(b.batas.trim()), wajib: b.wajib };
}

export interface IsianDrafBersih {
  bagian: { nama: string; batasKata: number | null; wajib: boolean }[];
  lampiran: string[];
  periodeBerlakuId: string | null;
}

/**
 * Isian yang boleh disimpan sebagai Draf walau belum lengkap ("Simpan Draf", "Unduh Pratinjau (.docx)").
 * Baris tanpa nama dan lampiran kosong dibuang (tidak membawa informasi); batas kata yang tidak valid menjadi tanpa batas
 * (kelengkapan penuh tetap diperiksa saat "Terbitkan", periksaKelengkapan).
 */
export function bersihkanIsianDraf(m: MasukanKelengkapan): IsianDrafBersih {
  return {
    bagian: m.bagian
      .filter((b) => b.nama.trim() !== "")
      .map((b) => ({ nama: b.nama.trim(), batasKata: b.tanpaBatas || !batasKataValid(b.batas) ? null : Number(b.batas.trim()), wajib: b.wajib })),
    lampiran: m.lampiran.map((l) => l.trim()).filter((l) => l !== ""),
    periodeBerlakuId: m.periodeBerlakuId || null,
  };
}
