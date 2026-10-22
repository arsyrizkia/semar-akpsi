/**
 * Data langkah real use case (UC-01..UC-09) disimpan di repo sebagai dokumentasi. Tampilannya (panel mengambang) sudah diganti
 * NavigatorDemo (src/components/layout/navigator-demo.tsx) dan tidak lagi dipasang di jendela mana pun.
 */
export interface LangkahPemandu {
  /** nomor langkah real use case, mis. "1", "S-1.2", "4a" */
  nomor: string;
  teks: string;
  /** langkah alternatif / subflow */
  alternatif?: boolean;
}
