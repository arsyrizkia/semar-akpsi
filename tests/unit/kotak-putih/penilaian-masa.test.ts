// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-21 masa penilaian (lib/penilaian/masa.ts): kapasitas,
// tenggat WIB, posisi hari, proyeksi, status jadwal reviewer; setiap cabang.
import { describe, expect, it } from "vitest";
import {
  MASA_BAWAAN,
  formatDurasi,
  formatTenggat,
  hariPenilaian,
  hitungTenggat,
  jamDibutuhkan,
  kapasitasPerHari,
  kapasitasReviewer,
  masaDariLama,
  menitPerHariDibutuhkan,
  periksaParamMasa,
  posisiMasa,
  proyeksiSelesai,
  statusReviewer,
  teksSisa,
} from "@/lib/penilaian/masa";
import { galatKapasitas } from "@/lib/penugasan/layanan";

/** waktu WIB "YYYY-MM-DD HH:mm" */
const wib = (s: string) => new Date(`${s.replace(" ", "T")}:00+07:00`);

describe("kapasitas", () => {
  it("KP-kapasitasReviewer-01: 7 hari x 2 jam / 5,17 menit = 162 proposal; per hari ±23,2; jam untuk 45 proposal ±3,9", () => {
    expect(kapasitasReviewer(MASA_BAWAAN)).toBe(162);
    expect(kapasitasPerHari(MASA_BAWAAN)).toBeCloseTo(23.21, 2);
    expect(jamDibutuhkan(45, MASA_BAWAAN)).toBeCloseTo(3.88, 2);
  });
  it("KP-periksaParamMasa-01: lama bulat 1..60, jam 0,5..12, menit 1..60; sah = null", () => {
    expect(periksaParamMasa(MASA_BAWAAN)).toBeNull();
    expect(periksaParamMasa({ ...MASA_BAWAAN, lamaHari: 37 })).toBeNull();
    expect(periksaParamMasa({ ...MASA_BAWAAN, lamaHari: 60 })).toBeNull();
    expect(periksaParamMasa({ ...MASA_BAWAAN, lamaHari: 61 })).toMatch(/Lama/);
    expect(periksaParamMasa({ ...MASA_BAWAAN, lamaHari: 7.5 })).toMatch(/Lama/);
    expect(periksaParamMasa({ ...MASA_BAWAAN, lamaHari: 0 })).toMatch(/Lama/);
    expect(periksaParamMasa({ ...MASA_BAWAAN, jamPerHari: 0.2 })).toMatch(/Jam/);
    expect(periksaParamMasa({ ...MASA_BAWAAN, menitPerProposal: Number.NaN })).toMatch(/Menit/);
  });
  it("KP-galatKapasitas-01: batas di atas kapasitas ditolak dengan pesan berawalan Batas Beban; sama dengan kapasitas diterima", () => {
    expect(galatKapasitas(162, MASA_BAWAAN)).toBeNull();
    expect(galatKapasitas(163, MASA_BAWAAN)).toMatch(/^Batas Beban per Reviewer 163 melebihi kapasitas satu reviewer: 162 proposal dalam 7 hari/);
  });
  it("KP-masaDariLama-01: hanya lama yang diisi; jam per hari dan menit per proposal mengikuti MASA_BAWAAN", () => {
    expect(masaDariLama(10)).toEqual({ lamaHari: 10, jamPerHari: MASA_BAWAAN.jamPerHari, menitPerProposal: MASA_BAWAAN.menitPerProposal });
    expect(kapasitasReviewer(masaDariLama(10))).toBe(232);
  });
  it("KP-menitPerHariDibutuhkan-01: beban x menit / lama; 45 proposal dalam 7 hari ±33 menit, 162 proposal ±2 jam", () => {
    expect(menitPerHariDibutuhkan(45, MASA_BAWAAN)).toBeCloseTo(33.24, 2);
    expect(menitPerHariDibutuhkan(162, MASA_BAWAAN)).toBeCloseTo(119.65, 2);
  });
  it("KP-formatDurasi-01: menit saja, jam dan menit, jam bulat; durasi positif minimal 1 menit; nol", () => {
    expect(formatDurasi(33.24)).toBe("33 menit");
    expect(formatDurasi(80.4)).toBe("1 jam 20 menit");
    expect(formatDurasi(119.65)).toBe("2 jam");
    expect(formatDurasi(0.2)).toBe("1 menit");
    expect(formatDurasi(0)).toBe("0 menit");
  });
});

describe("tenggat dan posisi hari (WIB)", () => {
  const mulai = wib("2026-10-26 09:00"); // Senin
  it("KP-hitungTenggat-01: akhir hari ke-7 pukul 23.59.59 WIB, hari mulai = hari ke-1", () => {
    expect(hitungTenggat(mulai, 7).toISOString()).toBe(wib("2026-11-01 23:59").toISOString().replace(":00.000Z", ":59.000Z"));
    expect(formatTenggat(hitungTenggat(mulai, 7))).toBe("Minggu, 1 November 2026, 23.59 WIB");
  });
  it("KP-hariPenilaian-01: pergantian hari mengikuti tengah malam WIB, bukan UTC", () => {
    expect(hariPenilaian(wib("2026-10-26 23:30"), mulai)).toBe(1);
    expect(hariPenilaian(wib("2026-10-27 00:10"), mulai)).toBe(2);
    expect(hariPenilaian(wib("2026-11-01 22:00"), mulai)).toBe(7);
  });
  it("KP-posisiMasa-01: berjalan, hari terakhir, lewat, belum mulai", () => {
    const tengah = posisiMasa(wib("2026-10-30 12:00"), mulai, 7);
    expect(tengah).toMatchObject({ hariKe: 5, sisaHari: 3, lewat: false, belumMulai: false });
    expect(tengah.berjalan).toBeCloseTo(4.5, 5);
    expect(teksSisa(tengah, wib("2026-10-30 12:00"), hitungTenggat(mulai, 7))).toBe("sisa 3 hari");
    const akhir = posisiMasa(wib("2026-11-01 08:00"), mulai, 7);
    expect(teksSisa(akhir, wib("2026-11-01 08:00"), hitungTenggat(mulai, 7))).toBe("hari terakhir");
    const lewat = posisiMasa(wib("2026-11-03 10:00"), mulai, 7);
    expect(lewat).toMatchObject({ hariKe: 7, sisaHari: 0, lewat: true });
    expect(teksSisa(lewat, wib("2026-11-03 10:00"), hitungTenggat(mulai, 7))).toBe("lewat 2 hari");
    const belum = posisiMasa(wib("2026-10-25 10:00"), mulai, 7);
    expect(belum).toMatchObject({ hariKe: 0, belumMulai: true, sisaHari: 7 });
  });
});

describe("proyeksi dan status reviewer", () => {
  const mulai = wib("2026-10-26 09:00");
  const pos = posisiMasa(wib("2026-10-30 12:00"), mulai, 7); // berjalan 4,5 hari, sisa 2,5 hari
  it("KP-proyeksiSelesai-01: laju diteruskan sampai tenggat; tepat waktu bila perkiraan >= total", () => {
    const lambat = proyeksiSelesai({ final: 450, total: 1200 }, pos);
    expect(lambat.lajuPerHari).toBe(100);
    expect(lambat.perkiraanFinal).toBe(700);
    expect(lambat).toMatchObject({ kurang: 500, tepatWaktu: false });
    expect(lambat.lajuDibutuhkan).toBe(300);
    expect(proyeksiSelesai({ final: 900, total: 1200 }, pos).tepatWaktu).toBe(true);
    expect(proyeksiSelesai({ final: 1200, total: 1200 }, pos)).toMatchObject({ kurang: 0, tepatWaktu: true });
    const lewat = proyeksiSelesai({ final: 1000, total: 1200 }, posisiMasa(wib("2026-11-02 10:00"), mulai, 7));
    expect(lewat).toMatchObject({ perkiraanFinal: 1000, kurang: 200, tepatWaktu: false });
  });
  it("KP-statusReviewer-01: selesai; tertinggal bila sisa per hari > kapasitas per hari atau tenggat lewat; di bawah jadwal; sesuai jadwal", () => {
    expect(statusReviewer({ beban: 48, selesai: 48 }, pos, MASA_BAWAAN).status).toBe("Selesai");
    // hari ke-5, sisa 3 hari: 48 sisa = 16 per hari (<= 23,2): belum tertinggal, tetapi jauh di bawah jadwal (jadwal 27)
    expect(statusReviewer({ beban: 48, selesai: 0 }, pos, MASA_BAWAAN).status).toBe("Di bawah jadwal");
    const h6 = posisiMasa(wib("2026-10-31 12:00"), mulai, 7); // sisa 2 hari
    expect(statusReviewer({ beban: 48, selesai: 0 }, h6, MASA_BAWAAN)).toMatchObject({ status: "Tertinggal", sisa: 48, perluPerHari: 24 });
    expect(statusReviewer({ beban: 48, selesai: 26 }, pos, MASA_BAWAAN).status).toBe("Sesuai jadwal");
    expect(statusReviewer({ beban: 48, selesai: 47 }, posisiMasa(wib("2026-11-02 10:00"), mulai, 7), MASA_BAWAAN).status).toBe("Tertinggal");
  });
});
