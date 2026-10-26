/** Tipe hasil aksi server J-04 (dipisah dari aksi.ts karena berkas "use server" hanya boleh mengekspor fungsi). */
import type { RincianKekurangan } from "@/lib/kontrak/tipe";
import type { HasilPindahBanyak } from "@/lib/penugasan/layanan";

export interface HasilSusunAksi {
  galat?: string;
  /** isian yang salah: "masa" = masa penilaian */
  kolom?: "masa";
  /** > 0 bila reviewer kurang (S-1) */
  kekurangan?: number;
  /** batas beban yang benar-benar dipakai saat Susun (isian bisa berubah sesudahnya) */
  batasDipakai?: number;
  /** rincian S-1: kapasitas, saran batas terkecil yang cukup, institusi penghambat */
  rincian?: RincianKekurangan;
  jumlahUsulan?: number;
  berhasil?: boolean;
}

export type HasilPindahAksi = ({ ok: true } & HasilPindahBanyak) | { ok: false; galat: string };

export interface HasilTetapkanAksi {
  berhasil: boolean;
  jumlah?: number;
  galat?: string;
  /** true bila kegagalan berasal dari API BIMA (tampilkan "Kirim ulang") */
  gagalBima?: boolean;
}
