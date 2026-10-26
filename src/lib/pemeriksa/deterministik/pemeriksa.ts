/**
 * Mesin UC-06 Memeriksa butir deterministik. Murni (tanpa basis data), dipakai UC-05 dan "Uji pada Contoh" (J-03).
 * Nama fungsi mengikuti seq-uc06.puml: cocokkanStrukturJudul, hitungKata, cekKataKunci, cocokkanSitasi, cekLampiran.
 * Setiap fungsi mengembalikan status Lolos/Gagal dengan angka pembukti.
 */
import { uraiKolomRentang } from "@/lib/templat/kolom-rentang";
import type {
  BagianTemplatDto,
  ButirCek,
  DokumenPeriksa,
  HasilButirDeterministik,
  KonteksPeriksa,
  ParameterButir,
  StatusHasilDeterministik,
} from "../../kontrak/tipe";
import { normFrasa } from "./teks";
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

/** Batas kata minimal: Lolos bila jumlah kata bagian >= batas. */
export function periksaBatasMin(dokumen: DokumenPeriksa, bagian: string, batas: number): HasilPeriksa {
  const ada = kunciBagian(dokumen, bagian) !== undefined;
  const n = hitungKata(teksBagian(dokumen, bagian));
  if (n >= batas) return lolos(`${fmt(n)} kata dari minimal ${fmt(batas)}${ada ? "" : " (bagian tidak ditemukan)"}`, bagian);
  return gagal(`${fmt(n)} kata dari minimal ${fmt(batas)} (kurang ${fmt(batas - n)} kata)`, bagian, `Bagian "${bagian}": minimal ${fmt(batas)} kata, ditemukan ${fmt(n)} kata`);
}

/** Frasa wajib: kalimat harus muncul persis di bagian (huruf besar-kecil dan spasi berlebih diabaikan). */
export function periksaFrasa(dokumen: DokumenPeriksa, bagian: string, frasa: string): HasilPeriksa {
  const teks = normFrasa(teksBagian(dokumen, bagian));
  const ringkas = frasa.length > 60 ? `${frasa.slice(0, 57)}...` : frasa;
  if (teks.includes(normFrasa(frasa))) return lolos(`kalimat "${ringkas}" ditemukan`, bagian);
  return gagal(`kalimat "${ringkas}" tidak ditemukan`, bagian, `Bagian "${bagian}" harus memuat kalimat "${frasa}"`);
}

const POLA_PENANDA_ISI = /^\s*\[(?:tabel|gambar)(?:\s+\d+)?\]\s*$/i;

/** Bagian terisi: ada kata (tidak termasuk tabel/gambar/keterangannya) atau, bila hanya berisi tabel atau gambar, penanda tabel/gambar. */
export function periksaBagianTerisi(dokumen: DokumenPeriksa, bagian: string): HasilPeriksa {
  const teks = teksBagian(dokumen, bagian);
  const n = hitungKata(teks);
  if (n > 0) return lolos(`${fmt(n)} kata`, bagian);
  const penanda = barisTeks(teks).filter((b) => POLA_PENANDA_ISI.test(b));
  if (penanda.length > 0) return lolos(`0 kata; berisi ${penanda.map((p) => p.replace(/[[\]]/g, "").toLowerCase()).join(", ")}`, bagian);
  return gagal("0 kata", bagian, `Bagian "${bagian}" harus terisi (lebih dari 0 kata)`);
}

const POLA_KETERANGAN_GAMBAR = /^\s*(?:gambar|diagram|bagan)\s*\d+(?:[.\-]\d+)*\s*[.:)\-–]?\s*\S/i;
const POLA_DIAGRAM_ALIR = /(?:diagram\s+al[iu]r|bagan\s+al[iu]r|al[iu]r\s+penelitian|flow\s*chart|flowchart)/i;
const POLA_GAMBAR_BERIKUT = /\bgambar\s+(?:\d+\s+)?berikut\b/i;

/**
 * Bagian wajib gambar (diagram alir Metode): gambar ada bila ada penanda gambar dari berkas ("[gambar]" atau "[gambar n]"), baris keterangan
 * "Gambar n. ...", atau kalimat "disajikan pada Gambar berikut". Keterangan yang menyebut diagram alir disebut di angka pembukti;
 * kesesuaian isi gambar dinilai butir semantik, bukan butir ini.
 */
export function periksaDiagramAlir(dokumen: DokumenPeriksa, bagian: string, keterangan?: string): HasilPeriksa {
  const baris = barisTeks(teksBagian(dokumen, bagian));
  const sebut = keterangan?.trim() || "diagram alir";
  const dasarAlir = !keterangan || /diagram\s+al[iu]r/i.test(keterangan);
  const polaKet = dasarAlir ? POLA_DIAGRAM_ALIR : new RegExp(normFrasa(keterangan).split(" ").map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"), "i");
  const ketAlir = baris.find((b) => POLA_KETERANGAN_GAMBAR.test(b) && polaKet.test(normFrasa(b)));
  if (ketAlir) return lolos(`keterangan gambar ${sebut} ditemukan: "${ketAlir.slice(0, 80)}"`, bagian);
  const penanda = baris.find((b) => /^\s*\[gambar(?:\s+\d+)?\]\s*$/i.test(b));
  if (penanda) return lolos("gambar ditemukan di berkas (penanda gambar)", bagian);
  const ket = baris.find((b) => POLA_KETERANGAN_GAMBAR.test(b) || POLA_GAMBAR_BERIKUT.test(b));
  if (ket) return lolos(`gambar ditemukan: "${ket.slice(0, 80)}"`, bagian);
  return gagal(
    `tidak ada gambar atau keterangan gambar yang menyebut ${sebut}`,
    bagian,
    `Bagian "${bagian}" harus memuat gambar (${sebut}) dengan keterangan gambar`,
  );
}

const POLA_KEPALA_TABEL = /\bno\b.*\b(?:kegiatan|aktivitas|tahapan|uraian|indikator|luaran)\b/i;
const POLA_BARIS_BULAN = /^(?:\d{1,2}\s+){5,}\d{1,2}$/;

/**
 * cekTabel: bagian wajib memuat tabel. Bukti: penanda "[tabel]" dari berkas DOCX, keterangan "Tabel n", baris kepala tabel
 * ("No ... Nama Kegiatan ...") atau baris nomor bulan "1 2 3 4 5 6 ..." pada hasil ekstraksi PDF.
 */
export function cekTabel(dokumen: DokumenPeriksa, bagian: string, kolom?: string[]): HasilPeriksa {
  const baris = barisTeks(teksBagian(dokumen, bagian));
  const penandaDocx = baris.some((b) => /^\s*\[tabel\]\s*$/i.test(b));
  const bukti = penandaDocx
    ? "penanda tabel dari berkas"
    : baris.find((b) => /^\s*tabel\s*\d+/i.test(b))
      ? "keterangan tabel"
      : baris.find((b) => POLA_KEPALA_TABEL.test(b))
        ? "baris kepala tabel (No, kegiatan)"
        : baris.find((b) => POLA_BARIS_BULAN.test(b))
          ? "baris nomor bulan"
          : null;
  if (!bukti) return gagal("tidak ada tabel di bagian ini", bagian, `Bagian "${bagian}" harus memuat tabel`);
  if (!kolom || kolom.length === 0) return lolos(`tabel ditemukan (${bukti})`, bagian);
  // kolom wajib: dicari di teks bagian; "Bulan 1–12" cukup dengan kata "bulan"; isi tabel DOCX tidak terbaca (hanya penanda)
  const teks = normFrasa(baris.join(" "));
  // kolom rentang ("Bulan 1–24") dianggap ada bila kepala "Bulan" ada dan angka-angkanya terbaca sebagai baris nomor (atau berkasnya DOCX, isi sel tak terbaca)
  const adaBarisAngka = baris.some((b) => POLA_BARIS_BULAN.test(b));
  const ada = (k: string) => {
    const rentang = uraiKolomRentang(k);
    const dasar = normFrasa(rentang ? rentang.nama : k.replace(/\s*\d+\s*[–-]\s*\d+\s*$/, ""));
    return dasar !== "" && teks.includes(dasar) && (!rentang || penandaDocx || adaBarisAngka);
  };
  const hilang = kolom.filter((k) => !ada(k));
  const daftar = kolom.join("; ");
  if (penandaDocx && hilang.length === kolom.length) {
    return lolos(`tabel ditemukan (${bukti}); isi kolom tidak terbaca dari berkas sehingga ${fmt(kolom.length)} kolom wajib (${daftar}) belum dapat diperiksa`, bagian);
  }
  if (hilang.length === 0) return lolos(`tabel ditemukan (${bukti}); ${fmt(kolom.length)} dari ${fmt(kolom.length)} kolom wajib ada: ${daftar}`, bagian);
  return gagal(
    `tabel ditemukan (${bukti}); ${fmt(kolom.length - hilang.length)} dari ${fmt(kolom.length)} kolom wajib ada; belum ada: ${hilang.join("; ")}`,
    bagian,
    `Tabel pada bagian "${bagian}" harus berkolom ${daftar}; kolom ${hilang.join("; ")} tidak ditemukan`,
  );
}

/* ------------------------------------------------------------------ */
/* cekKataKunci                                                        */
/* ------------------------------------------------------------------ */

const NAMA_PEMISAH: Record<string, string> = { ";": "titik koma", ",": "koma", "|": "garis tegak", "/": "garis miring" };
const namaPemisah = (c: string) => NAMA_PEMISAH[c] ?? `"${c}"`;
const sebutPemisah = (c: string) => `${namaPemisah(c)} (${c})`;
const CALON_PEMISAH_SALAH = [";", ",", "/", "|"];
const garisMiringPemisah = (t: string) => /\s\/\s/.test(t);
const garisTegakPemisah = (t: string) => /\s\|\s/.test(t);

function daftarRingkas(butir: string[]): string {
  const potong = (b: string) => (b.length > 40 ? `${b.slice(0, 37)}...` : b);
  return butir.slice(0, 8).map(potong).join(" | ") + (butir.length > 8 ? " | ..." : "");
}

/**
 * cekKataKunci: isian daftar kata kunci harus memuat tepat `jumlah` butir yang dipisah `pemisah`. Tanda kurung siku isian dibuang, baris
 * baru dianggap lanjutan baris (frasa boleh terpotong baris), satu pemisah penutup diabaikan. Gagal bila: kosong, pemisah salah (koma,
 * garis miring, baris baru saja), pemisah bercampur, ada butir kosong, atau jumlah butir tidak tepat. Angka pembukti menyebut butir yang terbaca.
 */
export function cekKataKunci(dokumen: DokumenPeriksa, jumlah: number, pemisah: string, bagianDaftar?: string): HasilPeriksa {
  // bagian nama (atau tanpa nama bagian) membaca isian kata kunci dokumen; bagian daftar lain membaca teks bagiannya
  const kataKunciDokumen = !bagianDaftar || normalisasiJudul(bagianDaftar) === "kata kunci";
  const nama = bagianDaftar ?? "Kata Kunci";
  const label = kataKunciDokumen ? "kata kunci" : "butir";
  const syarat = `${kataKunciDokumen ? "Kata kunci" : `Daftar "${nama}"`} harus tepat ${fmt(jumlah)}${kataKunciDokumen ? "" : " butir"}, dipisah ${namaPemisah(pemisah)}`;
  let teks = (kataKunciDokumen ? (dokumen.kataKunci ?? "") : teksBagian(dokumen, nama)).trim();
  if (/^\[[\s\S]*\]$/.test(teks)) teks = teks.slice(1, -1).trim();
  if (!teks) return gagal(`${label} tidak ditemukan di naskah`, nama, syarat);

  const adaBarisBaru = /\r?\n/.test(teks);
  const satuBaris = teks.replace(/\s*\r?\n\s*/g, " ").replace(/\s{2,}/g, " ");
  const pemisahAda = satuBaris.includes(pemisah);

  // pemisah selain yang diminta; bila pemisah diminta ada, hanya koma/titik koma dan garis miring/tegak berspasi yang dianggap pemisah
  const lain = CALON_PEMISAH_SALAH.filter((c) => {
    if (c === pemisah || !satuBaris.includes(c)) return false;
    if (!pemisahAda) return true;
    return c === "," || c === ";" || (c === "/" && garisMiringPemisah(satuBaris)) || (c === "|" && garisTegakPemisah(satuBaris));
  });

  const bacaDengan = (c: string) => {
    let t = satuBaris.trim();
    const penutup = t.endsWith(c);
    if (penutup) t = t.slice(0, -c.length).trim();
    const butir = t.split(c).map((x) => x.trim());
    return { butir, penutup };
  };

  if (!pemisahAda && lain.length > 0) {
    // pemisah yang dipakai bukan yang diminta: baca dengan pemisah yang dipakai supaya angka pembukti menyebut butir yang terbaca
    const dipakai = lain[0];
    const { butir } = bacaDengan(dipakai);
    const terbaca = butir.filter(Boolean);
    const sebab = `pemisah yang dipakai ${sebutPemisah(dipakai)}, bukan ${sebutPemisah(pemisah)}`;
    return gagal(
      `${fmt(terbaca.length)} ${label} terbaca dengan ${namaPemisah(dipakai)}: ${daftarRingkas(terbaca)}; ${sebab}`,
      nama,
      `${syarat}; ${sebab}`,
    );
  }
  if (!pemisahAda && adaBarisBaru) {
    const butir = teks.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (butir.length >= 2) {
      const sebab = `pemisah yang dipakai baris baru, bukan ${sebutPemisah(pemisah)}`;
      return gagal(`${fmt(butir.length)} ${label} terbaca dengan baris baru: ${daftarRingkas(butir)}; ${sebab}`, nama, `${syarat}; ${sebab}`);
    }
  }

  const { butir, penutup } = bacaDengan(pemisah);
  const terbaca = butir.filter(Boolean);
  const catatPenutup = penutup ? `; satu ${namaPemisah(pemisah)} penutup diabaikan` : "";
  const ringkas = `${fmt(terbaca.length)} ${label}: ${daftarRingkas(terbaca)} (pemisah ${pemisah})${catatPenutup}`;

  if (lain.length > 0) {
    const sebab = `pemisah bercampur: selain ${sebutPemisah(pemisah)} juga ada ${lain.map(sebutPemisah).join(", ")}`;
    return gagal(`${ringkas}; ${sebab}`, nama, `${syarat}; ${sebab}`);
  }
  const kosong = butir.map((b, i) => (b === "" ? i + 1 : 0)).filter(Boolean);
  if (kosong.length > 0) {
    const sebab = `ada butir kosong (butir ke-${kosong.join(", ")})`;
    return gagal(`${ringkas}; ${sebab}`, nama, `${syarat}; ${sebab}`);
  }
  if (terbaca.length === jumlah) return lolos(ringkas, nama);
  return gagal(`${ringkas}; diminta tepat ${fmt(jumlah)}`, nama, `${syarat}; ditemukan ${fmt(terbaca.length)}`);
}

/* ------------------------------------------------------------------ */
/* cocokkanSitasi                                                      */
/* ------------------------------------------------------------------ */

const POLA_SITASI = /\[\s*(\d+(?:\s*[,;]\s*\d+|\s*[–-]\s*\d+)*)\s*\]/g;
/** Nomor dalam kurung biasa, mis. "(1)", "(5)-(6)", "(2, 3)": bukan gaya templat ([n]); hanya dihitung untuk memperjelas pesan gagal. */
const POLA_SITASI_KURUNG = /\(\s*(\d{1,3}(?:\s*[,;]\s*\d{1,3}|\s*[–-]\s*\d{1,3})*)\s*\)/g;
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

/** Entri daftar pustaka bernomor: "[1] ...", "1. ...", "1) ...". Baris lanjutan (termasuk DOI dan tahun di awal baris) digabung ke entri sebelumnya. */
export function entriPustaka(teks: string): EntriPustaka[] {
  const hasil: EntriPustaka[] = [];
  for (const baris of barisTeks(teks)) {
    // "[1]teks" boleh rapat; "1." atau "1)" harus diikuti spasi dan bernomor paling banyak tiga angka, supaya baris lanjutan
    // seperti "10.1016/j.x" (DOI) atau "2016. doi: ..." (tahun) tidak terbaca sebagai entri baru
    const m = baris.match(/^(?:\[\s*(\d+)\s*\]\s*|(\d{1,3})\s*[.)]\s+)(.*)$/);
    if (m) hasil.push({ nomor: Number(m[1] ?? m[2]), teks: m[3] });
    else if (hasil.length) hasil[hasil.length - 1].teks += ` ${baris}`;
  }
  return hasil;
}

interface AnalisisSitasi {
  sitasi: number[];
  berbeda: number[];
  namaTahun: number;
  /** sitasi bergaya (n) yang tidak dihitung sebagai sitasi [n] */
  sitasiKurung: number;
  pustaka: EntriPustaka[];
  adaPustaka: boolean;
}

function analisisSitasi(dokumen: DokumenPeriksa, konteks: KonteksPeriksa, pustakaParam?: string): AnalisisSitasi {
  // bagian daftar pustaka: dari parameter butir, lalu bagian templat bertanda daftarPustaka, lalu menurut nama
  const namaPustaka = pustakaParam ?? konteks.bagianTemplat.find((b) => b.daftarPustaka)?.nama;
  const adalahPust = (k: string) => (namaPustaka ? normalisasiJudul(k) === normalisasiJudul(namaPustaka) : adalahPustaka(k));
  const isi = bagianIsi(dokumen, konteks).filter((k) => !adalahPust(k) && !adalahKataKunci(k));
  const sitasi: number[] = [];
  let namaTahun = 0;
  let sitasiKurung = 0;
  const kunciPustaka = Object.keys(dokumen.teksPerBagian).find(adalahPust);
  const pustaka = kunciPustaka ? entriPustaka(dokumen.teksPerBagian[kunciPustaka]) : [];
  const nomorMaks = Math.max(0, ...pustaka.map((e) => e.nomor));
  for (const k of isi) {
    const t = dokumen.teksPerBagian[k];
    sitasi.push(...nomorSitasi(t));
    namaTahun += (t.match(POLA_NAMA_TAHUN) ?? []).length;
    // gaya (n) hanya dihitung bila nomornya dalam rentang daftar pustaka (bukan tahun, persen, atau penomoran butir besar)
    for (const m of t.matchAll(POLA_SITASI_KURUNG)) {
      const n = Number(m[1].split(/[,;–-]/)[0]);
      if (n >= 1 && n <= (nomorMaks || 300)) sitasiKurung++;
    }
  }
  return { sitasi, berbeda: [...new Set(sitasi)].sort((a, b) => a - b), namaTahun, sitasiKurung, pustaka, adaPustaka: Boolean(kunciPustaka) };
}

export function cocokkanSitasi(
  dokumen: DokumenPeriksa,
  konteks: KonteksPeriksa,
  tipe: "sitasi_bernomor" | "pustaka_berurutan" | "jumlah_referensi_sama",
  pustaka?: string,
): HasilPeriksa {
  const a = analisisSitasi(dokumen, konteks, pustaka);

  if (tipe === "sitasi_bernomor") {
    const angka = `${fmt(a.sitasi.length)} sitasi bernomor (${fmt(a.berbeda.length)} nomor berbeda), ${fmt(a.namaTahun)} sitasi gaya nama-tahun`;
    if (a.sitasi.length > 0 && a.namaTahun === 0) return lolos(angka, "Isi naskah");
    const kurung = a.sitasi.length === 0 && a.sitasiKurung > 0 ? `${fmt(a.sitasiKurung)} sitasi ditulis dalam kurung biasa (n)` : "";
    const sebab = kurung ? `${kurung}, bukan kurung siku [n]` : a.sitasi.length === 0 ? "tidak ada sitasi bernomor [n]" : "ada sitasi gaya nama-tahun";
    return gagal(kurung ? `${angka}; ${kurung}` : angka, "Isi naskah", `Sitasi dalam paragraf harus bernomor [n]: ${sebab}`);
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
    a.berbeda.length === 0 && a.sitasiKurung > 0 ? `sitasi ditulis (n), bukan [n], sehingga tidak terhitung` : "",
    tidakDikutip.length && !(a.berbeda.length === 0 && a.sitasiKurung > 0) ? `nomor ${tidakDikutip.join(", ")} tidak dikutip` : "",
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
    case "batas_kata_min":
      return periksaBatasMin(dokumen, p.bagian, p.batas);
    case "frasa_wajib":
      return periksaFrasa(dokumen, p.bagian, p.frasa);
    case "bagian_terisi":
      return periksaBagianTerisi(dokumen, p.bagian);
    case "diagram_alir":
      return periksaDiagramAlir(dokumen, p.bagian, p.keterangan);
    case "tabel_wajib":
      return cekTabel(dokumen, p.bagian, p.kolom);
    case "kata_kunci":
      return cekKataKunci(dokumen, p.jumlah, p.pemisah, p.bagian);
    case "sitasi_bernomor":
    case "pustaka_berurutan":
    case "jumlah_referensi_sama":
      return cocokkanSitasi(dokumen, konteks, p.tipe, p.pustaka);
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
