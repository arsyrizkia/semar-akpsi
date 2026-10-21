/**
 * ENTRI AGEN D (UC-09). Nama dan tanda tangan ekspor mengikuti src/lib/kontrak/layanan.ts.
 * Rincian: teks.ts (siapkanTeksTanpaIdentitas, cocokkanKutipan), llm.ts (Layanan LLM), mesin.ts (penilaian tanpa DB),
 * jalankan.ts (antrean dan penyimpanan).
 */
import type {
  AntrekanPemeriksaanSemantik,
  JalankanPemeriksaanSemantik,
  NilaiSemantikTeks,
} from "../../kontrak/layanan";
import { antrekan, jalankan } from "./jalankan";
import { nilaiSemantikDenganOpsi } from "./mesin";

export const antrekanPemeriksaanSemantik: AntrekanPemeriksaanSemantik = (versiId) => antrekan(versiId);

export const jalankanPemeriksaanSemantik: JalankanPemeriksaanSemantik = (versiId) => jalankan(versiId);

export const nilaiSemantikTeks: NilaiSemantikTeks = async (dokumen, butir) =>
  (await nilaiSemantikDenganOpsi(dokumen, butir)).map((x) => x.hasil);
