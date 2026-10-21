/**
 * Pintu tunggal kontrak lintas agen. Impor dari "@/lib/kontrak", bukan langsung dari folder agen lain.
 * Re-export mengarah ke berkas entri milik tiap agen (awalnya stub yang melempar "belum diimplementasi").
 * FILE KONTRAK: tidak boleh diubah oleh agen paralel.
 */
export * from "./tipe";
export type * from "./layanan";

export { catatLogAudit } from "../audit";
export type { EntriLogAudit } from "../audit";

// [C]
export { jalankanPemeriksaanDeterministik, periksaDeterministikTeks } from "../pemeriksa/deterministik";
// [D]
export {
  antrekanPemeriksaanSemantik,
  jalankanPemeriksaanSemantik,
  nilaiSemantikTeks,
} from "../pemeriksa/semantik";
// [B]
export { susunPenugasan, pilihReviewer } from "../penugasan";
