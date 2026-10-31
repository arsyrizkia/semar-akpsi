/**
 * Bahan tampilan naskah bersorot (murni; dipakai J-08 reviewer, J-05b Rincian Proposal, dan J-03b Hasil Uji per dokumen): tab teks per
 * bagian beserta gambarnya, dan butir semantik yang ditempatkan pada tab tempat kutipan buktinya berada.
 */
import type { Keputusan, ParameterButir, StatusHasilSemantik } from "@/lib/kontrak/tipe";
import { ambilBerdasarkanNama, cariKutipan } from "@/lib/pemeriksa/semantik/teks";
import type { ButirTampil, KoreksiTampil, TabTeks } from "./tipe";

/** Metadata satu gambar naskah (tanpa isi) dari gambar_naskah. */
export interface GambarBagian {
  id: string;
  bagian: string;
  nomor: number;
  lebar: number;
  tinggi: number;
}

const sama = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Tab: bagian menurut urutan templat (bagian naskah di luar templat menyusul), lalu lampiran. */
export function susunTab(o: { urutanBagian: string[]; teksPerBagian: Record<string, string>; teksLampiran?: Record<string, string>; gambar: GambarBagian[] }): TabTeks[] {
  const nama = [...o.urutanBagian];
  for (const k of Object.keys(o.teksPerBagian)) if (!nama.some((n) => sama(n, k))) nama.push(k);
  return [
    ...nama.map((n) => ({
      nama: n,
      jenis: "bagian" as const,
      teks: ambilBerdasarkanNama(o.teksPerBagian, n),
      gambar: o.gambar.filter((g) => sama(g.bagian, n)).map(({ id, nomor, lebar, tinggi }) => ({ id, nomor, lebar, tinggi })),
    })),
    ...Object.entries(o.teksLampiran ?? {}).map(([n, t]) => ({ nama: `Lampiran: ${n}`, jenis: "lampiran" as const, teks: t, gambar: [] })),
  ];
}

/** Tab tempat butir ditampilkan: tab yang memuat kutipannya, lalu lampiran atau bagian sasaran parameter, lalu tab pertama. */
export function pilihTab(tabs: TabTeks[], kutipan: string | null, param: ParameterButir | null): string {
  if (kutipan) {
    const t = tabs.find((x) => cariKutipan(x.teks, kutipan));
    if (t) return t.nama;
  }
  const p = param && param.tipe === "semantik" ? param : null;
  if (p?.lampiran) {
    const t = tabs.find((x) => x.jenis === "lampiran" && sama(x.nama, `lampiran: ${p.lampiran}`));
    if (t) return t.nama;
  }
  if (p?.bagian) {
    const t = tabs.find((x) => x.jenis === "bagian" && sama(x.nama, p.bagian));
    if (t) return t.nama;
  }
  return tabs[0]?.nama ?? "";
}

/** Satu hasil pemeriksaan semantik beserta butir dan koreksinya, sebelum ditempatkan pada tab. */
export interface BahanButir {
  hasilId: string;
  kode: string;
  deskripsi: string;
  parameter: ParameterButir | null;
  status: StatusHasilSemantik;
  rekomendasi: Keputusan | null;
  kutipan: string | null;
  kutipanLain: string[];
  tingkatKeyakinan: number | null;
  alasanSistem: string | null;
  tiruan: boolean;
  koreksi: KoreksiTampil | null;
}

export function susunButirTampil(bahan: BahanButir[], tab: TabTeks[]): ButirTampil[] {
  return bahan.map(({ parameter, ...b }) => ({ ...b, tab: pilihTab(tab, b.kutipan, parameter) }));
}
