/**
 * Aturan murni UC-05 (tanpa basis data), dipisah dari layanan.ts supaya bisa diuji unit:
 * - hitungMasaPengusulan  : isi cekMasaPengusulan (Contract C-11), inklusif di kedua ujung dan tunduk pada sakelar demo;
 * - transisiProposal      : state machine status proposal (Belum diajukan, Sedang diperiksa, Terkirim, Ditahan, Ditolak);
 * - statusSetelahPemeriksaan : keputusan Terkirim atau Ditahan dari jumlah butir gagal (UC-05 langkah 10, S-1);
 * - adalahPengajuanPertama : satu token = satu pengajuan (penanda jti pada log audit).
 */

export type StatusProposal = "Belum diajukan" | "Sedang diperiksa" | "Terkirim" | "Ditahan" | "Ditolak";

export type PeristiwaProposal = "mulai" | "semua-lolos" | "ada-gagal" | "masa-tutup" | "galat";

/** true bila `sekarang` berada di antara tanggal buka dan tanggal tutup (inklusif) dan sakelar demo "berjalan". */
export function hitungMasaPengusulan(sekarang: Date, buka: Date, tutup: Date, sakelarBerjalan: boolean): boolean {
  const t = sekarang.getTime();
  return t >= buka.getTime() && t <= tutup.getTime() && sakelarBerjalan;
}

const TRANSISI: Record<StatusProposal, Partial<Record<PeristiwaProposal, StatusProposal | "tergantung-versi">>> = {
  "Belum diajukan": { mulai: "Sedang diperiksa", "masa-tutup": "Ditolak" },
  "Sedang diperiksa": { "semua-lolos": "Terkirim", "ada-gagal": "Ditahan", galat: "tergantung-versi", "masa-tutup": "Ditolak" },
  Ditahan: { mulai: "Sedang diperiksa", "masa-tutup": "Ditolak" },
  Ditolak: { mulai: "Sedang diperiksa", "masa-tutup": "Ditolak" },
  Terkirim: {},
};

/**
 * Status proposal berikutnya. Peristiwa yang tidak didefinisikan untuk status itu melempar galat (Terkirim bersifat akhir).
 * `galat` mengembalikan Ditahan bila sudah ada versi yang selesai diperiksa, selain itu Belum diajukan.
 */
export function transisiProposal(dari: StatusProposal, peristiwa: PeristiwaProposal, adaVersiSelesai = false): StatusProposal {
  const ke = TRANSISI[dari]?.[peristiwa];
  if (!ke) throw new Error(`transisi tidak diizinkan: ${dari} + ${peristiwa}`);
  if (ke === "tergantung-versi") return adaVersiSelesai ? "Ditahan" : "Belum diajukan";
  return ke;
}

/** Semua butir lolos (0 gagal) berarti Terkirim, selain itu Ditahan. Jumlah negatif atau bukan bilangan bulat ditolak. */
export function statusSetelahPemeriksaan(jumlahGagal: number): "Terkirim" | "Ditahan" {
  if (!Number.isInteger(jumlahGagal) || jumlahGagal < 0) throw new Error("jumlah butir gagal harus bilangan bulat tidak negatif");
  return jumlahGagal === 0 ? "Terkirim" : "Ditahan";
}

/** Entri audit pertama untuk sebuah jti menang; pengajuan berikutnya dengan jti sama adalah duplikat (muat ulang halaman). */
export function adalahPengajuanPertama(idPertama: number | null | undefined, idSaya: number): boolean {
  return idPertama != null && idPertama === idSaya;
}
