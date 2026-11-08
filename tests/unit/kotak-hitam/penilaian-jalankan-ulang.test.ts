// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475).
// Sumber rencana uji: CRC PemeriksaanSemantik / JobSemantik (status Menunggu, Berjalan, Selesai, Gagal) dan Contract C-34
// JobSemantik.jalankanUlang (UC-07, UC-09): izin dan penolakan menjalankan ulang pemeriksaan semantik di J-08.
import { describe, expect, it } from "vitest";
import {
  PESAN_ULANG_ADA_HASIL,
  PESAN_ULANG_BUKAN_PENUGASAN,
  PESAN_ULANG_FINAL,
  PESAN_ULANG_SEDANG_BERJALAN,
  putuskanJalankanUlangSemantik,
  type MasukanJalankanUlang,
} from "@/lib/penilaian/status";

const dasar: MasukanJalankanUlang = { ditugaskan: true, final: false, status: "Gagal", macet: false, adaHasil: false };
const putus = (u: Partial<MasukanJalankanUlang>) => putuskanJalankanUlangSemantik({ ...dasar, ...u });

describe("Jalankan ulang pemeriksaan semantik (C-34)", () => {
  it("KH-jalankanUlangSemantik-01: nilai sah: reviewer ditugaskan, belum final, job Gagal -> boleh dengan job baru", () => {
    expect(putus({})).toEqual({ boleh: true, tindakan: "job-baru" });
  });
  it("KH-jalankanUlangSemantik-02: nilai sah: job Berjalan yang macet -> boleh memakai job yang ada", () => {
    expect(putus({ status: "Berjalan", macet: true })).toEqual({ boleh: true, tindakan: "pakai-job-ada" });
  });
  it("KH-jalankanUlangSemantik-03: nilai sah: job Menunggu yang macet -> boleh memakai job yang ada", () => {
    expect(putus({ status: "Menunggu", macet: true })).toEqual({ boleh: true, tindakan: "pakai-job-ada" });
  });
  it("KH-jalankanUlangSemantik-04: nilai tidak sah: bukan reviewer yang ditugaskan ditolak walau job Gagal", () => {
    expect(putus({ ditugaskan: false })).toEqual({ boleh: false, pesan: PESAN_ULANG_BUKAN_PENUGASAN });
  });
  it("KH-jalankanUlangSemantik-05: keadaan dan transisi: penilaian Final ditolak walau job Gagal", () => {
    expect(putus({ final: true })).toEqual({ boleh: false, pesan: PESAN_ULANG_FINAL });
  });
  it("KH-jalankanUlangSemantik-06: nilai tidak sah: hasil sudah tersedia ditolak", () => {
    expect(putus({ status: "Selesai", adaHasil: true })).toEqual({ boleh: false, pesan: PESAN_ULANG_ADA_HASIL });
    expect(putus({ adaHasil: true })).toEqual({ boleh: false, pesan: PESAN_ULANG_ADA_HASIL });
  });
  it("KH-jalankanUlangSemantik-07: nilai janggal: job Berjalan atau Menunggu yang belum macet ditolak dengan pesan sedang berjalan", () => {
    expect(putus({ status: "Berjalan" })).toEqual({ boleh: false, pesan: PESAN_ULANG_SEDANG_BERJALAN });
    expect(putus({ status: "Menunggu" })).toEqual({ boleh: false, pesan: PESAN_ULANG_SEDANG_BERJALAN });
  });
  it("KH-jalankanUlangSemantik-08: nilai janggal: job Selesai tanpa hasil atau belum ada job ditolak dengan pesan yang jelas", () => {
    for (const status of ["Selesai", "Belum ada"] as const) {
      const r = putus({ status });
      expect(r.boleh).toBe(false);
      expect(!r.boleh && r.pesan.length).toBeGreaterThan(10);
    }
  });
});
