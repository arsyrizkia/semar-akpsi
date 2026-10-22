/**
 * Penyusunan tabel J-03b (hasil uji pada contoh): butir menjadi baris, contoh menjadi kolom, plus ringkasan per contoh.
 * Murni, tanpa basis data. Sumber uji: Contract C-10 (ujiPadaContoh), Method Specification susunBarisUji.
 */
import type { HasilButirDeterministik, HasilButirSemantik, HasilUjiContoh } from "@/lib/kontrak/tipe";

export type SelUji = HasilButirDeterministik | HasilButirSemantik;

export interface ButirUjiMasukan {
  id: string;
  kode: string;
  deskripsi: string;
  status: string;
}

export interface BarisUji<B extends ButirUjiMasukan = ButirUjiMasukan> {
  butir: B;
  /** satu sel per contoh, urut sama dengan `contoh`; null bila butir itu tidak menghasilkan apa pun untuk contoh tersebut */
  sel: (SelUji | null)[];
}

export const adalahDeterministik = (s: SelUji): s is HasilButirDeterministik => "angkaPembukti" in s;

/** Butir Nonaktif dilewati; butir tanpa satu pun hasil tidak ditampilkan. Urutan baris mengikuti urutan butir. */
export function susunBarisUji<B extends ButirUjiMasukan>(butir: B[], contoh: HasilUjiContoh[]): BarisUji<B>[] {
  return butir
    .filter((b) => b.status !== "Nonaktif")
    .map((b) => ({
      butir: b,
      sel: contoh.map((c) => c.deterministik.find((h) => h.kode === b.kode) ?? c.semantik.find((h) => h.kode === b.kode) ?? null),
    }))
    .filter((r) => r.sel.some((s) => s !== null));
}

export interface RingkasanContoh {
  dokumenKode: string;
  dokumenNama: string;
  lolos: number;
  gagal: number;
  /** butir semantik dengan rekomendasi Memenuhi */
  memenuhi: number;
  tidakMemenuhi: number;
  /** semantik "Perlu diperiksa manual" atau "Belum ada rekomendasi" */
  tanpaRekomendasi: number;
}

export function ringkasPerContoh(contoh: HasilUjiContoh[]): RingkasanContoh[] {
  return contoh.map((c) => ({
    dokumenKode: c.dokumenKode,
    dokumenNama: c.dokumenNama,
    lolos: c.deterministik.filter((h) => h.status === "Lolos").length,
    gagal: c.deterministik.filter((h) => h.status === "Gagal").length,
    memenuhi: c.semantik.filter((h) => h.status === "Memenuhi").length,
    tidakMemenuhi: c.semantik.filter((h) => h.status === "Tidak memenuhi").length,
    tanpaRekomendasi: c.semantik.filter((h) => h.status === "Perlu diperiksa manual" || h.status === "Belum ada rekomendasi").length,
  }));
}
