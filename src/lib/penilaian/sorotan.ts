/**
 * Sorotan kutipan bukti di teks J-08 (aman diimpor komponen klien). Teks satu bagian dipecah menjadi potongan berurutan menurut rentang
 * kutipan (boleh bertumpuk) dan penanda gambar "[gambar n]", supaya setiap penggalan yang dikutip sistem dapat disorot, gambar dapat
 * ditampilkan di tempatnya, dan label butir diletakkan tepat sesudah penggalan yang dikutipnya.
 */

/** Satu penggalan yang dikutip; `id` unik per penggalan (mis. "<hasilId>#0"). */
export interface RentangSorot {
  id: string;
  mulai: number;
  akhir: number;
}

export type Potongan =
  /** teks biasa; `rentang` = penggalan yang menyorot potongan ini (kosong = tidak disorot) */
  | { jenis: "teks"; teks: string; rentang: string[] }
  /** baris penanda "[gambar n]" (beserta pindah barisnya) */
  | { jenis: "gambar"; nomor: number; teks: string; rentang: string[] }
  /** penggalan yang berakhir di titik ini: tempat label butir */
  | { jenis: "label"; rentang: string[] };

const POLA_PENANDA_GAMBAR = /^\[gambar (\d+)\]$/i;

/** Rentang baris penanda gambar bernomor, termasuk pindah baris sesudahnya (gambar tampil sebagai blok). */
export function cariPenandaGambar(teks: string): { mulai: number; akhir: number; nomor: number }[] {
  const hasil: { mulai: number; akhir: number; nomor: number }[] = [];
  let posisi = 0;
  for (const baris of teks.split("\n")) {
    const m = POLA_PENANDA_GAMBAR.exec(baris.trim());
    const akhirBaris = posisi + baris.length;
    if (m) hasil.push({ mulai: posisi, akhir: Math.min(teks.length, akhirBaris + 1), nomor: Number(m[1]) });
    posisi = akhirBaris + 1;
  }
  return hasil;
}

export function susunSorotan(teks: string, rentang: RentangSorot[]): Potongan[] {
  const penanda = cariPenandaGambar(teks);
  // rentang yang ujungnya jatuh di dalam penanda gambar diperluas menutup penanda itu (gambar tidak dipotong)
  const sah = rentang
    .filter((r) => r.akhir > r.mulai)
    .map((r) => {
      let { mulai, akhir } = r;
      for (const p of penanda) {
        if (mulai > p.mulai && mulai < p.akhir) mulai = p.mulai;
        if (akhir > p.mulai && akhir < p.akhir) akhir = p.akhir;
      }
      return { id: r.id, mulai: Math.max(0, mulai), akhir: Math.min(teks.length, akhir) };
    })
    .filter((r) => r.akhir > r.mulai)
    .sort((a, b) => a.mulai - b.mulai || a.akhir - b.akhir);

  const batas = [...new Set([0, teks.length, ...sah.flatMap((r) => [r.mulai, r.akhir]), ...penanda.flatMap((p) => [p.mulai, p.akhir])])].sort((a, b) => a - b);
  const hasil: Potongan[] = [];
  for (let i = 0; i + 1 < batas.length; i++) {
    const a = batas[i];
    const b = batas[i + 1];
    const ids = sah.filter((r) => r.mulai <= a && r.akhir >= b).map((r) => r.id);
    const p = penanda.find((x) => x.mulai === a && x.akhir === b);
    const terakhir = hasil.at(-1);
    if (p) hasil.push({ jenis: "gambar", nomor: p.nomor, teks: teks.slice(a, b), rentang: ids });
    else if (terakhir?.jenis === "teks" && sama(terakhir.rentang, ids)) terakhir.teks += teks.slice(a, b);
    else hasil.push({ jenis: "teks", teks: teks.slice(a, b), rentang: ids });
    const berakhir = sah.filter((r) => r.akhir === b).map((r) => r.id);
    if (berakhir.length) hasil.push({ jenis: "label", rentang: berakhir });
  }
  return hasil;
}

const sama = (x: string[], y: string[]) => x.length === y.length && x.every((v, i) => v === y[i]);

/**
 * Nomor tampil butir (1..n) per tab, menurut urutan butir pada tab itu. Nomor ini menggantikan kode butir di layar: penanda di ujung
 * penggalan bersorot dan kartu butir memakai nomor yang sama.
 */
export function nomorButirPerTab(butir: { hasilId: string; tab: string }[]): Map<string, number> {
  const jumlah = new Map<string, number>();
  const hasil = new Map<string, number>();
  for (const b of butir) {
    const n = (jumlah.get(b.tab) ?? 0) + 1;
    jumlah.set(b.tab, n);
    hasil.set(b.hasilId, n);
  }
  return hasil;
}
