/**
 * "Tambah Usulan" di Daftar Usulan BIMA tiruan (UC-05 langkah 1): validasi skema dan judul, serta teks dokumen pendukung contoh untuk
 * draf baru. Murni, tanpa basis data; penulisan ada di buatUsulanBaru (servis-pengajuan.ts).
 */

export const BATAS_JUDUL_USULAN = { min: 10, maks: 250 } as const;

export type HasilValidasiUsulanBaru = { ok: true; skemaKode: string; judul: string } | { ok: false; galat: string };

/** Skema harus salah satu `skemaTersedia` (skema bertemplat Terbit); judul dirapikan spasinya lalu dibatasi 10-250 karakter. */
export function validasiUsulanBaru(m: { skemaKode?: unknown; judul?: unknown }, skemaTersedia: string[]): HasilValidasiUsulanBaru {
  const skemaKode = typeof m.skemaKode === "string" ? m.skemaKode.trim() : "";
  if (!skemaTersedia.includes(skemaKode)) return { ok: false, galat: "Pilih skema yang tersedia pada periode ini." };
  const judul = typeof m.judul === "string" ? m.judul.replace(/\s+/g, " ").trim() : "";
  if (judul.length < BATAS_JUDUL_USULAN.min) return { ok: false, galat: `Judul usulan minimal ${BATAS_JUDUL_USULAN.min} karakter.` };
  if (judul.length > BATAS_JUDUL_USULAN.maks) return { ok: false, galat: `Judul usulan maksimal ${BATAS_JUDUL_USULAN.maks} karakter.` };
  return { ok: true, skemaKode, judul };
}

interface NaskahContohLampiran {
  judul: string;
  lampiran: { nama: string; berkas: string; teks: string }[];
}

/**
 * Teks dokumen pendukung contoh untuk usulan baru: teks lampiran naskah contoh dengan judul naskah contoh diganti judul usulan ini.
 * Lampiran wajib yang tidak ada di naskah contoh memakai teks umum rekaan.
 */
export function teksLampiranDemo(nama: string, judul: string, contoh: NaskahContohLampiran): { berkas: string; teks: string } {
  const l = contoh.lampiran.find((x) => x.nama === nama);
  if (l) return { berkas: l.berkas, teks: l.teks.replaceAll(contoh.judul, judul) };
  const berkas = `${nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`;
  return { berkas, teks: `Dokumen ${nama}\nDokumen pendukung untuk usulan berjudul "${judul}".` };
}
