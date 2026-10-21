/** Tipe hasil aksi server J-04 (dipisah dari aksi.ts karena berkas "use server" hanya boleh mengekspor fungsi). */
export interface HasilSusunAksi {
  galat?: string;
  /** > 0 bila reviewer kurang (S-1) */
  kekurangan?: number;
  jumlahUsulan?: number;
  berhasil?: boolean;
}

export interface HasilPindahAksi {
  diterima: boolean;
  syaratDilanggar: string[];
  galat?: string;
}

export interface HasilTetapkanAksi {
  berhasil: boolean;
  jumlah?: number;
  galat?: string;
  /** true bila kegagalan berasal dari API BIMA (tampilkan "Kirim ulang") */
  gagalBima?: boolean;
}
