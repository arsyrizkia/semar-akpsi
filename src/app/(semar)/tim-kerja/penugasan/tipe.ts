/** Tipe hasil aksi server J-04 (dipisah dari aksi.ts karena berkas "use server" hanya boleh mengekspor fungsi). */
export interface HasilSusunAksi {
  galat?: string;
  /** > 0 bila reviewer kurang (S-1) */
  kekurangan?: number;
  /** batas beban yang benar-benar dipakai saat Susun (isian bisa berubah sesudahnya) */
  batasDipakai?: number;
  jumlahUsulan?: number;
  berhasil?: boolean;
  /** lama menyusun di server, milidetik */
  durasiMs?: number;
}

export interface HasilPindahAksi {
  diterima: boolean;
  syaratDilanggar: string[];
  galat?: string;
}

export interface HasilTetapkanAksi {
  berhasil: boolean;
  jumlah?: number;
  /** lama menetapkan dan mengirim ke BIMA di server, milidetik */
  durasiMs?: number;
  galat?: string;
  /** true bila kegagalan berasal dari API BIMA (tampilkan "Kirim ulang") */
  gagalBima?: boolean;
}
