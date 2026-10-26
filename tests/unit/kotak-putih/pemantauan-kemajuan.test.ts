// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-22 rekapKemajuan (J-05 tab Kemajuan Penilaian); setiap cabang.
import { describe, expect, it } from "vitest";
import { rekapKemajuan } from "@/lib/pemantauan/kemajuan";
import { MASA_BAWAAN } from "@/lib/penilaian/masa";

const wib = (s: string) => new Date(`${s.replace(" ", "T")}:00+07:00`);
const mulai = wib("2026-10-26 09:00");
const reviewer = [
  { reviewerId: "a", nama: "Ani", institusi: "U1", beban: 48, selesai: 30 },
  { reviewerId: "b", nama: "Budi", institusi: "U2", beban: 48, selesai: 0 },
  { reviewerId: "c", nama: "Cici", institusi: "U3", beban: 48, selesai: 48 },
];

describe("rekapKemajuan", () => {
  it("KP-rekapKemajuan-01: masa belum dimulai: tanpa posisi, proyeksi, dan harian; tidak perlu perhatian", () => {
    const k = rekapKemajuan({ masa: MASA_BAWAAN, mulai: null, sekarang: wib("2026-10-30 12:00"), total: 0, finalPerHari: [], reviewer: [] });
    expect(k).toMatchObject({ dimulai: false, posisi: null, proyeksi: null, harian: [], perluPerhatian: false });
  });
  it("KP-rekapKemajuan-02: harian kumulatif 7 hari dengan jadwal merata; hari di luar rentang dijepit; hari mendatang belum berjalan", () => {
    const k = rekapKemajuan({
      masa: MASA_BAWAAN,
      mulai,
      sekarang: wib("2026-10-30 12:00"),
      total: 140,
      finalPerHari: [{ hari: 1, jumlah: 10 }, { hari: 2, jumlah: 20 }, { hari: 0, jumlah: 5 }, { hari: 5, jumlah: 15 }],
      reviewer,
    });
    expect(k.final).toBe(50);
    expect(k.harian).toHaveLength(7);
    expect(k.harian.map((h) => h.kumulatif)).toEqual([15, 35, 35, 35, 50, 50, 50]);
    expect(k.harian.map((h) => h.jadwal)).toEqual([20, 40, 60, 80, 100, 120, 140]);
    expect(k.harian.map((h) => h.berjalan)).toEqual([true, true, true, true, true, false, false]);
  });
  it("KP-rekapKemajuan-03: reviewer urut Tertinggal, Di bawah jadwal, Sesuai jadwal, Selesai; perlu perhatian bila proyeksi terlambat", () => {
    const k = rekapKemajuan({ masa: MASA_BAWAAN, mulai, sekarang: wib("2026-10-31 12:00"), total: 144, finalPerHari: [{ hari: 3, jumlah: 78 }], reviewer });
    expect(k.reviewer.map((r) => [r.nama, r.status])).toEqual([
      ["Budi", "Tertinggal"],
      ["Ani", "Sesuai jadwal"],
      ["Cici", "Selesai"],
    ]);
    expect(k.jumlahStatus).toEqual({ Tertinggal: 1, "Di bawah jadwal": 0, "Sesuai jadwal": 1, Selesai: 1 });
    expect(k.perluPerhatian).toBe(true);
  });
  it("KP-rekapKemajuan-04: semua final: tepat waktu, tidak perlu perhatian", () => {
    const k = rekapKemajuan({
      masa: MASA_BAWAAN,
      mulai,
      sekarang: wib("2026-11-01 20:00"),
      total: 96,
      finalPerHari: [{ hari: 7, jumlah: 96 }],
      reviewer: [{ ...reviewer[0], selesai: 48 }, { ...reviewer[2] }],
    });
    expect(k.proyeksi?.tepatWaktu).toBe(true);
    expect(k.perluPerhatian).toBe(false);
  });
});
