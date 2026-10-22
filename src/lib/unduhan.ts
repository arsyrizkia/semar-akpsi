/**
 * Pendukung rute unduhan (api/semar/*): keputusan akses dan kepala respons yang murni (diuji unit).
 * Pembacaan basis data ada di unduhan-db.ts (diuji lewat tests/integrasi dan e2e).
 */
/**
 * Aturan akses berkas proposal: Tim Kerja (pengelola maupun bukan) boleh; reviewer hanya bila ditugaskan pada proposal itu
 * (penugasan sudah ditetapkan); pengusul dan selainnya tidak.
 */
export function bolehUnduhBerkasProposal(peran: "tim_kerja" | "reviewer" | "pengusul", adaPenugasanTetap: boolean): boolean {
  if (peran === "tim_kerja") return true;
  if (peran === "reviewer") return adaPenugasanTetap;
  return false;
}

/** Nama berkas aman untuk header: huruf, angka, titik, strip, garis bawah; selebihnya diganti "_". Tidak pernah kosong. */
export function bentukNamaBerkas(nama: string, cadangan = "berkas"): string {
  const bersih = nama
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/^[._]+|_+$/g, "");
  return bersih || cadangan;
}

/** Content-Disposition lampiran: filename ASCII aman + filename* (RFC 5987) berisi nama asli yang dikodekan. */
export function dispositionUnduhan(nama: string): string {
  const ascii = bentukNamaBerkas(nama);
  const utf8 = encodeURIComponent(nama).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

export function kepalaUnduhan(nama: string, tipe: string, ukuran: number): Record<string, string> {
  return {
    "content-type": tipe,
    "content-disposition": dispositionUnduhan(nama),
    "content-length": String(ukuran),
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  };
}
