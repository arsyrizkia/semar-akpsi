/**
 * Ambang daftar "Perlu perhatian" J-05 (UC-04). Ditampilkan juga di "Cara menghitung" supaya Tim Kerja tahu kapan sebuah butir
 * menyala dan kapan datanya dianggap cukup.
 */
export interface AmbangPemantauan {
  /** butir semantik menyala bila % rekomendasi disetujui di bawah ini */
  disetujui: number;
  /** jumlah hasil minimal sebelum % disetujui sebuah butir dinilai ("belum cukup data" bila kurang) */
  minHasil: number;
  /** butir deterministik menyala bila gagal pada sekurangnya % pengajuan ini */
  gagal: number;
  /** ... atau gagal pada sekurangnya % ini di satu institusi */
  gagalInstitusi: number;
  /** institusi baru dihitung untuk ambang gagalInstitusi bila pengajuannya sekurangnya sebanyak ini */
  minPengajuanInstitusi: number;
  /** % dikoreksi pada keyakinan tinggi yang dianggap "keyakinan tinggi tetap sering dikoreksi" */
  terlaluYakin: number;
}

export const AMBANG_PEMANTAUAN: AmbangPemantauan = {
  disetujui: 80,
  minHasil: 30,
  gagal: 25,
  gagalInstitusi: 40,
  minPengajuanInstitusi: 20,
  terlaluYakin: 20,
};
