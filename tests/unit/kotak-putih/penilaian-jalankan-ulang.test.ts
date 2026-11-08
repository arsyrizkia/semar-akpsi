// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-26 jalankanUlangSemantik
// (lib/penilaian/status.ts:putuskanJalankanUlangSemantik); setiap cabang keputusan.
import { describe, expect, it } from "vitest";
import {
  PESAN_ULANG_ADA_HASIL,
  PESAN_ULANG_BUKAN_PENUGASAN,
  PESAN_ULANG_FINAL,
  PESAN_ULANG_SEDANG_BERJALAN,
  PESAN_ULANG_TIDAK_PERLU,
  putuskanJalankanUlangSemantik,
} from "@/lib/penilaian/status";

describe("putuskanJalankanUlangSemantik (MS-26)", () => {
  it("KP-putuskanJalankanUlangSemantik-01: cabang [J1] bukan penugasan: kondisi pertama benar, kondisi lain tidak dievaluasi", () => {
    const r = putuskanJalankanUlangSemantik({ ditugaskan: false, final: true, status: "Gagal", macet: true, adaHasil: true });
    expect(r).toEqual({ boleh: false, pesan: PESAN_ULANG_BUKAN_PENUGASAN });
  });
  it("KP-putuskanJalankanUlangSemantik-02: cabang [J2] penilaian final", () => {
    const r = putuskanJalankanUlangSemantik({ ditugaskan: true, final: true, status: "Gagal", macet: false, adaHasil: true });
    expect(r).toEqual({ boleh: false, pesan: PESAN_ULANG_FINAL });
  });
  it("KP-putuskanJalankanUlangSemantik-03: cabang [J3] hasil sudah ada", () => {
    const r = putuskanJalankanUlangSemantik({ ditugaskan: true, final: false, status: "Gagal", macet: false, adaHasil: true });
    expect(r).toEqual({ boleh: false, pesan: PESAN_ULANG_ADA_HASIL });
  });
  it("KP-putuskanJalankanUlangSemantik-04: cabang [J4] status Gagal: job baru", () => {
    const r = putuskanJalankanUlangSemantik({ ditugaskan: true, final: false, status: "Gagal", macet: false, adaHasil: false });
    expect(r).toEqual({ boleh: true, tindakan: "job-baru" });
  });
  it("KP-putuskanJalankanUlangSemantik-05: cabang [J5] Menunggu atau Berjalan dan macet: pakai job yang ada", () => {
    for (const status of ["Menunggu", "Berjalan"] as const) {
      expect(putuskanJalankanUlangSemantik({ ditugaskan: true, final: false, status, macet: true, adaHasil: false })).toEqual({ boleh: true, tindakan: "pakai-job-ada" });
    }
  });
  it("KP-putuskanJalankanUlangSemantik-06: cabang [J6] Menunggu atau Berjalan dan belum macet: ditolak sedang berjalan", () => {
    for (const status of ["Menunggu", "Berjalan"] as const) {
      expect(putuskanJalankanUlangSemantik({ ditugaskan: true, final: false, status, macet: false, adaHasil: false })).toEqual({ boleh: false, pesan: PESAN_ULANG_SEDANG_BERJALAN });
    }
  });
  it("KP-putuskanJalankanUlangSemantik-07: cabang [J7] sisanya (Selesai tanpa hasil, Belum ada): ditolak tidak perlu", () => {
    for (const status of ["Selesai", "Belum ada"] as const) {
      expect(putuskanJalankanUlangSemantik({ ditugaskan: true, final: false, status, macet: true, adaHasil: false })).toEqual({ boleh: false, pesan: PESAN_ULANG_TIDAK_PERLU });
    }
  });
});
