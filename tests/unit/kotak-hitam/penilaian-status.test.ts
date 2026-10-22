// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475).
// Sumber rencana uji: Behavioral State Machine Penilaian (Draf -> Final) bersama CRC Penilaian (hlm. 473: setiap keadaan dapat dicapai,
// hanya transisi yang didefinisikan yang diizinkan), Contract C-27 Penilaian.simpanNilai dan C-28 Penilaian.terima / PenugasanReviewer.tandaiSelesai.
import { describe, expect, it } from "vitest";
import { KOMPONEN_BORANG } from "@/lib/kontrak/tipe";
import {
  TRANSISI_PENILAIAN,
  bolehTransisiPenilaian,
  bolehUbahPenilaian,
  ringkasKeputusan,
  ringkasLabelPenugasan,
  ringkasRekomendasi,
  type StatusPenilaian,
} from "@/lib/penilaian/status";

describe("State machine Penilaian: Draf -> Final (C-27, C-28)", () => {
  it("KH-penilaianStatus-01: Draf dapat tetap Draf (Simpan Sementara) dan dapat menjadi Final (Simpan Permanen)", () => {
    expect(bolehTransisiPenilaian("Draf", "Draf")).toBe(true);
    expect(bolehTransisiPenilaian("Draf", "Final")).toBe(true);
  });
  it("KH-penilaianStatus-02: Final tidak dapat diubah ke keadaan mana pun, termasuk kembali ke Draf", () => {
    expect(bolehTransisiPenilaian("Final", "Draf")).toBe(false);
    expect(bolehTransisiPenilaian("Final", "Final")).toBe(false);
    expect(TRANSISI_PENILAIAN.Final).toEqual([]);
  });
  it("KH-penilaianStatus-03: isian (komponen, umpan balik, koreksi) hanya dapat diubah saat Draf", () => {
    expect(bolehUbahPenilaian("Draf")).toBe(true);
    expect(bolehUbahPenilaian("Final")).toBe(false);
  });
  it("KH-penilaianStatus-04: nilai janggal (keadaan tidak dikenal) tidak pernah diizinkan bertransisi atau diubah", () => {
    expect(bolehTransisiPenilaian("Dibatalkan" as StatusPenilaian, "Final")).toBe(false);
    expect(bolehUbahPenilaian("Dibatalkan" as StatusPenilaian)).toBe(false);
  });
});

describe("ringkasKeputusan: enam komponen borang (C-27, UC-07 langkah 9)", () => {
  const penuh = (v: string) => Object.fromEntries(KOMPONEN_BORANG.map((k) => [k, v]));
  it("KH-ringkasKeputusan-01: nilai sah, keenam komponen Memenuhi", () => {
    expect(ringkasKeputusan(penuh("Memenuhi"))).toEqual({ memenuhi: 6, tidakMemenuhi: 0, kosong: [], lengkap: true });
  });
  it("KH-ringkasKeputusan-02: batas bawah, tidak ada komponen terisi: keenamnya kosong dan tidak lengkap", () => {
    const r = ringkasKeputusan({});
    expect(r.kosong).toEqual([...KOMPONEN_BORANG]);
    expect(r.lengkap).toBe(false);
    expect(r.memenuhi + r.tidakMemenuhi).toBe(0);
  });
  it("KH-ringkasKeputusan-03: batas atas, lima dari enam terisi: tepat satu komponen kosong menurut urutan borang", () => {
    const k = penuh("Tidak memenuhi") as Record<string, string | undefined>;
    k[KOMPONEN_BORANG[5]] = undefined;
    const r = ringkasKeputusan(k);
    expect(r.kosong).toEqual([KOMPONEN_BORANG[5]]);
    expect(r.tidakMemenuhi).toBe(5);
    expect(r.lengkap).toBe(false);
  });
  it("KH-ringkasKeputusan-04: tipe salah dan nilai janggal (teks bebas, kosong, huruf kecil) dihitung kosong, bukan Memenuhi", () => {
    const r = ringkasKeputusan({ [KOMPONEN_BORANG[0]]: "memenuhi", [KOMPONEN_BORANG[1]]: "", [KOMPONEN_BORANG[2]]: "Ya", "Komponen asing": "Memenuhi" });
    expect(r.memenuhi).toBe(0);
    expect(r.kosong).toHaveLength(6);
  });
  it("KH-ringkasKeputusan-05: campuran Memenuhi dan Tidak memenuhi dijumlahkan benar", () => {
    const k: Record<string, string> = {};
    KOMPONEN_BORANG.forEach((n, i) => (k[n] = i % 2 === 0 ? "Memenuhi" : "Tidak memenuhi"));
    expect(ringkasKeputusan(k)).toMatchObject({ memenuhi: 3, tidakMemenuhi: 3, lengkap: true });
  });
});

describe("ringkasRekomendasi: butir tanpa koreksi dianggap disetujui (UC-07/UC-08)", () => {
  it("KH-ringkasRekomendasi-01: tanpa butir semua nol", () => {
    expect(ringkasRekomendasi([])).toEqual({ total: 0, disetujui: 0, dikoreksi: 0, tanpaRekomendasi: 0 });
  });
  it("KH-ringkasRekomendasi-02: tiga golongan dipisahkan: disetujui, dikoreksi, dan tanpa rekomendasi", () => {
    const r = ringkasRekomendasi([
      { status: "Memenuhi", dikoreksi: false },
      { status: "Tidak memenuhi", dikoreksi: false },
      { status: "Memenuhi", dikoreksi: true },
      { status: "Perlu diperiksa manual", dikoreksi: false },
      { status: "Belum ada rekomendasi", dikoreksi: false },
    ]);
    expect(r).toEqual({ total: 5, disetujui: 2, dikoreksi: 1, tanpaRekomendasi: 2 });
  });
  it("KH-ringkasRekomendasi-03: butir tanpa rekomendasi yang sudah dikoreksi dihitung dikoreksi, bukan tanpa rekomendasi", () => {
    const r = ringkasRekomendasi([{ status: "Belum ada rekomendasi", dikoreksi: true }]);
    expect(r).toMatchObject({ dikoreksi: 1, tanpaRekomendasi: 0, disetujui: 0 });
  });
});

describe("ringkasLabelPenugasan: keterangan J-07 (label Baru, Draf, Selesai)", () => {
  it("KH-ringkasLabelPenugasan-01: daftar kosong", () => {
    expect(ringkasLabelPenugasan([])).toBe("Belum ada penugasan");
  });
  it("KH-ringkasLabelPenugasan-02: rincian per label dalam urutan Baru, Draf, Selesai; label yang tidak ada dihilangkan", () => {
    expect(ringkasLabelPenugasan(["Selesai", "Baru", "Selesai"])).toBe("3 penugasan: 1 Baru, 2 Selesai");
    expect(ringkasLabelPenugasan(["Draf"])).toBe("1 penugasan: 1 Draf");
  });
});
