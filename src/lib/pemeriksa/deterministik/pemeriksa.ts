/**
 * Mesin UC-06 Memeriksa butir deterministik. Murni (tanpa basis data), dipakai UC-05 dan "Uji pada Contoh" (J-03).
 * Nama fungsi mengikuti seq-uc06.puml: cocokkanStrukturJudul, hitungKata, cekKataKunci, cocokkanSitasi, cekLampiran.
 * Setiap fungsi mengembalikan status Lolos/Gagal dengan angka pembukti.
 */
import type {
  BagianTemplatDto,
  ButirCek,
  DokumenPeriksa,
  HasilButirDeterministik,
  KonteksPeriksa,
  ParameterButir,
  StatusHasilDeterministik,
} from "../../kontrak/tipe";
import { barisTeks, fmt, hitungKata, normalisasiJudul, normalisasiJudulProposal } from "./teks";

export { hitungKata } from "./teks";

export interface HasilPeriksa {
  status: StatusHasilDeterministik;
  angkaPembukti: string;
  bagian: string | null;
  batasDilanggar: string | null;
}

const lolos = (angkaPembukti: string, bagian: string | null): HasilPeriksa => ({ status: "Lolos", angkaPembukti, bagian, batasDilanggar: null });
const gagal = (angkaPembukti: string, bagian: string | null, batasDilanggar: string): HasilPeriksa => ({
  status: "Gagal",
  angkaPembukti,
  bagian,
  batasDilanggar,
});

/* ------------------------------------------------------------------ */
/* cocokkanStrukturJudul                                               */
/* ------------------------------------------------------------------ */

function bagianWajibUrut(konteks: KonteksPeriksa): BagianTemplatDto[] {
  return konteks.bagianTemplat.filter((b) => b.wajib).sort((a, b) => a.urutan - b.urutan);
}

/** Kunci teksPerBagian yang cocok dengan nama bagian (setelah normalisasi), atau undefined. */
export function kunciBagian(dokumen: DokumenPeriksa, nama: string): string | undefined {
  const target = normalisasiJudul(nama);
  return Object.keys(dokumen.teksPerBagian).find((k) => normalisasiJudul(k) === target);
}

export function teksBagian(dokumen: DokumenPeriksa, nama: string): string {
  const k = kunciBagian(dokumen, nama);
  return k ? dokumen.teksPerBagian[k] : "";
}

export function cocokkanStrukturJudul(
  dokumen: DokumenPeriksa,
  konteks: KonteksPeriksa,
  parameter: Extract<ParameterButir, { tipe: "bagian_wajib" | "struktur_judul" | "judul_sama" }>,
): HasilPeriksa {
  const ditemukan = dokumen.judulBagianDitemukan.map(normalisasiJudul);
  const wajib = bagianWajibUrut(konteks);
  const adaWajib = wajib.map((b) => ({ b, posisi: ditemukan.indexOf(normalisasiJudul(b.nama)) }));
  const jumlahAda = adaWajib.filter((x) => x.posisi >= 0).length;
  const ringkas = `${fmt(jumlahAda)} dari ${fmt(wajib.length)} bagian wajib templat ditemukan`;

  if (parameter.tipe === "bagian_wajib") {
    const ada = ditemukan.includes(normalisasiJudul(parameter.bagian));
    return ada
      ? lolos(`judul bagian "${parameter.bagian}" ditemukan (${ringkas})`, parameter.bagian)
      : gagal(`judul bagian "${parameter.bagian}" tidak ditemukan di naskah (${ringkas})`, parameter.bagian, `Bagian wajib "${parameter.bagian}" tidak ditemukan`);
  }

  if (parameter.tipe === "judul_sama") {
    const judulNaskah = dokumen.judul?.trim() ?? "";
    if (!judulNaskah) {
      return gagal("judul proposal tidak ditemukan di naskah", "Judul", "Judul proposal di naskah harus sama dengan judul di BIMA");
    }
    const sama = normalisasiJudulProposal(judulNaskah) === normalisasiJudulProposal(dokumen.judulBima);
    return sama
      ? lolos("judul di naskah sama dengan judul di BIMA", "Judul")
      : gagal(
          `judul di naskah "${judulNaskah}" berbeda dari judul di BIMA "${dokumen.judulBima}"`,
          "Judul",
          "Judul di naskah harus sama dengan judul di BIMA",
        );
  }

  // struktur_judul: semua bagian wajib ada dan urutannya sama dengan templat
  const hilang = adaWajib.filter((x) => x.posisi < 0).map((x) => x.b.nama);
  const posisiAda = adaWajib.filter((x) => x.posisi >= 0).map((x) => x.posisi);
  let urutanSesuai = true;
  let pelanggar: string | null = null;
  for (let i = 1; i < posisiAda.length; i++) {
    if (posisiAda[i] < posisiAda[i - 1]) {
      urutanSesuai = false;
      pelanggar = adaWajib.filter((x) => x.posisi >= 0)[i].b.nama;
      break;
    }
  }
  const dikenal = new Set(konteks.bagianTemplat.map((b) => normalisasiJudul(b.nama)));
  const asing = dokumen.judulBagianDitemukan.filter((j) => !dikenal.has(normalisasiJudul(j)));
  const catatanAsing = asing.length ? `; judul di luar templat: ${asing.map((a) => `"${a}"`).join(", ")}` : "";
  if (hilang.length === 0 && urutanSesuai) return lolos(`${ringkas}; urutan sesuai templat${catatanAsing}`, "Struktur naskah");
  const sebab = [
    hilang.length ? `bagian belum ada: ${hilang.map((h) => `"${h}"`).join(", ")}` : "",
    !urutanSesuai ? `urutan tidak sesuai templat pada bagian "${pelanggar}"` : "",
  ]
    .filter(Boolean)
    .join("; ");
  return gagal(`${ringkas}; ${sebab}${catatanAsing}`, "Struktur naskah", `Struktur judul naskah harus sama dengan templat: ${sebab}`);
}

/* ------------------------------------------------------------------ */
/* hitungKata (batas kata, bagian terisi)                              */
/* ------------------------------------------------------------------ */

export function periksaBatasKata(dokumen: DokumenPeriksa, bagian: string, batas: number): HasilPeriksa {
  const ada = kunciBagian(dokumen, bagian) !== undefined;
  const n = hitungKata(teksBagian(dokumen, bagian));
  if (n <= batas) {
    return lolos(`${fmt(n)} kata dari batas ${fmt(batas)}${ada ? "" : " (bagian tidak ditemukan)"}`, bagian);
  }
  return gagal(
    `${fmt(n)} kata dari batas ${fmt(batas)} (lebih ${fmt(n - batas)} kata)`,
    bagian,
    `Bagian "${bagian}": batas ${fmt(batas)} kata, ditemukan ${fmt(n)} kata`,
  );
}

export function periksaBagianTerisi(dokumen: DokumenPeriksa, bagian: string): HasilPeriksa {
  const n = hitungKata(teksBagian(dokumen, bagian));
  return n > 0
    ? lolos(`${fmt(n)} kata`, bagian)
    : gagal("0 kata", bagian, `Bagian "${bagian}" harus terisi (lebih dari 0 kata)`);
}

const POLA_DIAGRAM_ALIR = /(?:diagram\s+alir|bagan\s+alir|alur\s+penelitian|flow\s*chart|flowchart)/i;
const POLA_KETERANGAN_GAMBAR = /^\s*(?:gambar|diagram|bagan)\s*\d+(?:[.\-]\d+)*\s*[.:)\-–]/i;

/** Diagram alir di bagian Metode: ada keterangan gambar yang menyebut diagram alir. */
export function periksaDiagramAlir(dokumen: DokumenPeriksa, bagian: string): HasilPeriksa {
  const baris = barisTeks(teksBagian(dokumen, bagian));
  const ket = baris.find((b) => POLA_KETERANGAN_GAMBAR.test(b) && POLA_DIAGRAM_ALIR.test(b));
  return ket
    ? lolos(`keterangan gambar diagram alir ditemukan: "${ket.slice(0, 80)}"`, bagian)
    : gagal(
        "tidak ada keterangan gambar yang menyebut diagram alir",
        bagian,
        `Bagian "${bagian}" harus memuat diagram alir dengan keterangan gambar`,
      );
}

/* ------------------------------------------------------------------ */
/* cekKataKunci                                                        */
/* ------------------------------------------------------------------ */

const NAMA_PEMISAH: Record<string, string> = { ";": "titik koma", ",": "koma", "|": "garis tegak" };

export function cekKataKunci(dokumen: DokumenPeriksa, jumlah: number, pemisah: string): HasilPeriksa {
  const mentah = (dokumen.kataKunci ?? "").trim();
  const namaPemisah = NAMA_PEMISAH[pemisah] ?? `"${pemisah}"`;
  if (!mentah) {
    return gagal(
      "kata kunci tidak ditemukan di naskah",
      "Kata Kunci",
      `Kata kunci harus tepat ${fmt(jumlah)}, dipisah ${namaPemisah}`,
    );
  }
  const daftar = mentah
    .split(pemisah)
    .map((k) => k.trim())
    .filter(Boolean);
  const terbaca = `${fmt(daftar.length)} kata kunci terbaca (pemisah ${namaPemisah})`;
  if (daftar.length === jumlah) return lolos(`${terbaca}, diminta tepat ${fmt(jumlah)}`, "Kata Kunci");
  const petunjuk =
    daftar.length === 1 && /[,\n]/.test(mentah) && pemisah !== ","
      ? "; tanda pemisah yang dipakai bukan " + namaPemisah
      : "";
  return gagal(
    `${terbaca}, diminta tepat ${fmt(jumlah)}${petunjuk}`,
    "Kata Kunci",
    `Kata kunci harus tepat ${fmt(jumlah)}, dipisah ${namaPemisah}; ditemukan ${fmt(daftar.length)}`,
  );
}

/* ------------------------------------------------------------------ */
/* cocokkanSitasi                                                      */
/* ------------------------------------------------------------------ */

const POLA_SITASI = /\[\s*(\d+(?:\s*[,;]\s*\d+|\s*[–-]\s*\d+)*)\s*\]/g;
const POLA_NAMA_TAHUN =
  /\(\s*[A-ZÀ-Ý][A-Za-zÀ-ÿ.'’-]+(?:\s+(?:dkk\.?|et\s+al\.?|dan\s+[A-ZÀ-Ý][\w.'’-]+|&\s*[A-ZÀ-Ý][\w.'’-]+))?\s*,?\s+(?:19|20)\d{2}[a-z]?\s*\)/g;

function bagianIsi(dokumen: DokumenPeriksa, konteks: KonteksPeriksa): string[] {
  const urutTemplat = [...konteks.bagianTemplat].sort((a, b) => a.urutan - b.urutan).map((b) => b.nama);
  const kunci = Object.keys(dokumen.teksPerBagian);
  const urut: string[] = [];
  for (const nama of urutTemplat) {
    const k = kunci.find((x) => normalisasiJudul(x) === normalisasiJudul(nama));
    if (k && !urut.includes(k)) urut.push(k);
  }
  for (const k of kunci) if (!urut.includes(k)) urut.push(k);
  return urut;
}

const adalahPustaka = (nama: string) => /^(daftar\s+pustaka|referensi|daftar\s+referensi)$/.test(normalisasiJudul(nama));
const adalahKataKunci = (nama: string) => normalisasiJudul(nama) === "kata kunci";

/** Nomor sitasi dalam teks, berurutan menurut kemunculan, dengan rentang "a-b" diperluas. */
export function nomorSitasi(teks: string): number[] {
  const hasil: number[] = [];
  for (const m of teks.matchAll(POLA_SITASI)) {
    for (const potong of m[1].split(/[,;]/)) {
      const rentang = potong.split(/[–-]/).map((x) => Number(x.trim()));
      if (rentang.length === 2 && rentang[1] >= rentang[0] && rentang[1] - rentang[0] < 200) {
        for (let n = rentang[0]; n <= rentang[1]; n++) hasil.push(n);
      } else if (!Number.isNaN(rentang[0])) hasil.push(rentang[0]);
    }
  }
  return hasil;
}

export interface EntriPustaka {
  nomor: number;
  teks: string;
}

/** Entri daftar pustaka bernomor: "[1] ...", "1. ...", "1) ...". Baris lanjutan digabung ke entri sebelumnya. */
export function entriPustaka(teks: string): EntriPustaka[] {
  const hasil: EntriPustaka[] = [];
  for (const baris of barisTeks(teks)) {
    const m = baris.match(/^\[?\s*(\d+)\s*[\].)]\s*(.*)$/);
    if (m) hasil.push({ nomor: Number(m[1]), teks: m[2] });
    else if (hasil.length) hasil[hasil.length - 1].teks += ` ${baris}`;
  }
  return hasil;
}

interface AnalisisSitasi {
  sitasi: number[];
  berbeda: number[];
  namaTahun: number;
  pustaka: EntriPustaka[];
  adaPustaka: boolean;
}

function analisisSitasi(dokumen: DokumenPeriksa, konteks: KonteksPeriksa): AnalisisSitasi {
  const isi = bagianIsi(dokumen, konteks).filter((k) => !adalahPustaka(k) && !adalahKataKunci(k));
  const sitasi: number[] = [];
  let namaTahun = 0;
  for (const k of isi) {
    const t = dokumen.teksPerBagian[k];
    sitasi.push(...nomorSitasi(t));
    namaTahun += (t.match(POLA_NAMA_TAHUN) ?? []).length;
  }
  const kunciPustaka = Object.keys(dokumen.teksPerBagian).find(adalahPustaka);
  const pustaka = kunciPustaka ? entriPustaka(dokumen.teksPerBagian[kunciPustaka]) : [];
  return { sitasi, berbeda: [...new Set(sitasi)].sort((a, b) => a - b), namaTahun, pustaka, adaPustaka: Boolean(kunciPustaka) };
}

export function cocokkanSitasi(
  dokumen: DokumenPeriksa,
  konteks: KonteksPeriksa,
  tipe: "sitasi_bernomor" | "pustaka_berurutan" | "jumlah_referensi_sama",
): HasilPeriksa {
  const a = analisisSitasi(dokumen, konteks);

  if (tipe === "sitasi_bernomor") {
    const angka = `${fmt(a.sitasi.length)} sitasi bernomor (${fmt(a.berbeda.length)} nomor berbeda), ${fmt(a.namaTahun)} sitasi gaya nama-tahun`;
    if (a.sitasi.length > 0 && a.namaTahun === 0) return lolos(angka, "Isi naskah");
    const sebab = a.sitasi.length === 0 ? "tidak ada sitasi bernomor [n]" : "ada sitasi gaya nama-tahun";
    return gagal(angka, "Isi naskah", `Sitasi dalam paragraf harus bernomor [n]: ${sebab}`);
  }

  if (tipe === "pustaka_berurutan") {
    if (a.pustaka.length === 0) {
      return gagal(
        a.adaPustaka ? "tidak ada entri bernomor di Daftar Pustaka" : "bagian Daftar Pustaka tidak ditemukan",
        "Daftar Pustaka",
        "Daftar pustaka harus bernomor dan berurutan",
      );
    }
    const salahNomor = a.pustaka.findIndex((e, i) => e.nomor !== i + 1);
    // urutan pertama kali dikutip harus 1, 2, 3, ... tanpa melompat
    let maks = 0;
    let lompat: { nomor: number; seharusnya: number } | null = null;
    for (const n of a.sitasi) {
      if (n > maks) {
        if (n !== maks + 1) {
          lompat = { nomor: n, seharusnya: maks + 1 };
          break;
        }
        maks = n;
      }
    }
    if (salahNomor < 0 && !lompat) {
      return lolos(`${fmt(a.pustaka.length)} entri bernomor 1 sampai ${fmt(a.pustaka.length)} berurutan; urutan pengutipan pertama sesuai`, "Daftar Pustaka");
    }
    const sebab = [
      salahNomor >= 0 ? `entri ke-${salahNomor + 1} bernomor ${a.pustaka[salahNomor].nomor}` : "",
      lompat ? `nomor ${lompat.nomor} pertama kali dikutip sebelum nomor ${lompat.seharusnya}` : "",
    ]
      .filter(Boolean)
      .join("; ");
    return gagal(`daftar pustaka tidak berurutan: ${sebab}`, "Daftar Pustaka", `Daftar pustaka harus berurutan sesuai pengutipan: ${sebab}`);
  }

  // jumlah_referensi_sama
  const nomorEntri = new Set(a.pustaka.map((e) => e.nomor));
  const tidakDikutip = [...nomorEntri].filter((n) => !a.berbeda.includes(n)).sort((x, y) => x - y);
  const tanpaEntri = a.berbeda.filter((n) => !nomorEntri.has(n));
  const angka = `${fmt(a.pustaka.length)} entri daftar pustaka, ${fmt(a.berbeda.length)} referensi dikutip`;
  if (a.pustaka.length === a.berbeda.length && tidakDikutip.length === 0 && tanpaEntri.length === 0 && a.pustaka.length > 0) {
    return lolos(angka, "Daftar Pustaka");
  }
  const tidakCocok = [
    tidakDikutip.length ? `nomor ${tidakDikutip.join(", ")} tidak dikutip` : "",
    tanpaEntri.length ? `nomor ${tanpaEntri.join(", ")} dikutip tetapi tidak ada di daftar` : "",
  ]
    .filter(Boolean)
    .join("; ");
  return gagal(
    `${angka}${tidakCocok ? `; nomor tidak cocok: ${tidakCocok}` : ""}`,
    "Daftar Pustaka",
    `Jumlah entri daftar pustaka (${fmt(a.pustaka.length)}) harus sama dengan jumlah referensi yang dikutip (${fmt(a.berbeda.length)})`,
  );
}

/* ------------------------------------------------------------------ */
/* cekLampiran                                                         */
/* ------------------------------------------------------------------ */

const normLampiran = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function cekLampiran(dokumen: DokumenPeriksa, konteks: KonteksPeriksa, nama: string): HasilPeriksa {
  const ada = new Set(dokumen.lampiranAda.map(normLampiran));
  const wajib = konteks.lampiranWajib.length ? konteks.lampiranWajib : [nama];
  const terpenuhi = wajib.filter((w) => ada.has(normLampiran(w)));
  const belum = wajib.filter((w) => !ada.has(normLampiran(w)));
  const ringkas = `${fmt(terpenuhi.length)} dari ${fmt(wajib.length)} lampiran wajib ada`;
  if (ada.has(normLampiran(nama))) return lolos(`lampiran "${nama}" ditemukan (${ringkas})`, null);
  return gagal(
    `lampiran "${nama}" belum ada (${ringkas}; belum ada: ${belum.map((b) => `"${b}"`).join(", ")})`,
    null,
    `Lampiran wajib "${nama}" belum diunggah`,
  );
}

/* ------------------------------------------------------------------ */
/* Pengarah per butir                                                  */
/* ------------------------------------------------------------------ */

/** Menerapkan satu butir deterministik. Butir tanpa parameter terstruktur ditolak (gagal) agar tidak lolos diam-diam. */
export function periksaSatuButir(butir: ButirCek, dokumen: DokumenPeriksa, konteks: KonteksPeriksa): HasilPeriksa {
  const p = butir.parameter;
  if (!p) {
    return gagal(
      "aturan butir belum memiliki parameter terstruktur, sehingga tidak dapat diterapkan",
      null,
      "Butir belum dapat diperiksa: parameter belum diisi di J-03 Aturan Pemeriksaan",
    );
  }
  switch (p.tipe) {
    case "bagian_wajib":
    case "struktur_judul":
    case "judul_sama":
      return cocokkanStrukturJudul(dokumen, konteks, p);
    case "batas_kata":
      return periksaBatasKata(dokumen, p.bagian, p.batas);
    case "bagian_terisi":
      return periksaBagianTerisi(dokumen, p.bagian);
    case "diagram_alir":
      return periksaDiagramAlir(dokumen, p.bagian);
    case "kata_kunci":
      return cekKataKunci(dokumen, p.jumlah, p.pemisah);
    case "sitasi_bernomor":
    case "pustaka_berurutan":
    case "jumlah_referensi_sama":
      return cocokkanSitasi(dokumen, konteks, p.tipe);
    case "lampiran_wajib":
      return cekLampiran(dokumen, konteks, p.nama);
    default:
      return gagal(
        `jenis aturan "${(p as { tipe: string }).tipe}" tidak dikenali pemeriksa deterministik`,
        null,
        "Butir tidak dapat diterapkan oleh pemeriksa deterministik",
      );
  }
}

export function periksaBanyakButir(butir: ButirCek[], dokumen: DokumenPeriksa, konteks: KonteksPeriksa): HasilButirDeterministik[] {
  return butir
    .filter((b) => b.jenis === "deterministik")
    .map((b) => {
      const h = periksaSatuButir(b, dokumen, konteks);
      return {
        butirId: b.id,
        kode: b.kode,
        bagian: h.bagian,
        status: h.status,
        angkaPembukti: h.angkaPembukti,
        batasDilanggar: h.status === "Gagal" ? h.batasDilanggar : null,
      };
    });
}
