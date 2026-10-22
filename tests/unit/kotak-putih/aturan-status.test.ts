// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): cabang transisi status butir dan susunan tabel J-03b.
// Sumber: Method Specification MS-11 (nonaktifkanTurunanLama, nonaktifkan) dan Contract C-10 (susunBarisUji) pada aturan/status.ts dan aturan/uji.ts.
import { describe, expect, it } from "vitest";
import { transisiButir, type AksiButir } from "@/lib/aturan/status";
import type { StatusButir } from "@/lib/kontrak/tipe";
import { adalahDeterministik, ringkasPerContoh, susunBarisUji } from "@/lib/aturan/uji";
import type { HasilButirDeterministik, HasilButirSemantik } from "@/lib/kontrak/tipe";

describe("transisiButir (cabang)", () => {
  it("KP-transisiButir-01: aksi dan keadaan asal terdefinisi menghasilkan keadaan tujuan", () => {
    expect(transisiButir("Draf", "simpanVersi")).toEqual({ ok: true, ke: "Aktif" });
  });
  it("KP-transisiButir-02: aksi terdefinisi tetapi keadaan asal tidak terdaftar pada aksi itu", () => {
    expect(transisiButir("Nonaktif", "simpanVersi").ok).toBe(false);
  });
  it("KP-transisiButir-03: aksi tidak dikenal (di luar tipe) ditolak tanpa melempar galat", () => {
    expect(transisiButir("Aktif" as StatusButir, "hapus" as AksiButir).ok).toBe(false);
  });
});

const det: HasilButirDeterministik = { butirId: "1", kode: "D1", bagian: null, status: "Lolos", angkaPembukti: "1", batasDilanggar: null };
const sem: HasilButirSemantik = { butirId: "2", kode: "S1", bagian: null, status: "Memenuhi", rekomendasi: "Memenuhi", kutipan: "k", tingkatKeyakinan: 0.9, alasanSistem: null, tiruan: false };

describe("susunBarisUji (cabang)", () => {
  const b = (kode: string, status = "Aktif") => ({ id: kode, kode, deskripsi: "", status });
  it("KP-susunBarisUji-01: cabang deterministik ditemukan lebih dulu daripada semantik untuk kode yang sama", () => {
    const r = susunBarisUji([b("D1")], [{ dokumenKode: "a", dokumenNama: "A", deterministik: [det], semantik: [{ ...sem, kode: "D1" }] }]);
    expect(r[0].sel[0]).toBe(det);
  });
  it("KP-susunBarisUji-02: cabang semantik dipakai bila tidak ada hasil deterministik", () => {
    const r = susunBarisUji([b("S1")], [{ dokumenKode: "a", dokumenNama: "A", deterministik: [det], semantik: [sem] }]);
    expect(r[0].sel[0]).toBe(sem);
  });
  it("KP-susunBarisUji-03: sel null pada sebagian contoh tidak membuang baris selama ada satu hasil", () => {
    const r = susunBarisUji([b("S1")], [
      { dokumenKode: "a", dokumenNama: "A", deterministik: [], semantik: [] },
      { dokumenKode: "b", dokumenNama: "B", deterministik: [], semantik: [sem] },
    ]);
    expect(r[0].sel).toEqual([null, sem]);
  });
  it("KP-susunBarisUji-04: cabang Nonaktif dan cabang tanpa hasil sama-sama membuang baris", () => {
    expect(susunBarisUji([b("S1", "Nonaktif"), b("X")], [{ dokumenKode: "a", dokumenNama: "A", deterministik: [], semantik: [sem] }])).toEqual([]);
  });
  it("KP-susunBarisUji-05: penjaga tipe adalahDeterministik membedakan bentuk hasil", () => {
    expect(adalahDeterministik(det)).toBe(true);
    expect(adalahDeterministik(sem)).toBe(false);
  });
});

describe("ringkasPerContoh (cabang filter)", () => {
  it("KP-ringkasPerContoh-01: setiap status pada setiap filter dihitung tepat satu kali", () => {
    const [r] = ringkasPerContoh([
      {
        dokumenKode: "a",
        dokumenNama: "A",
        deterministik: [det, { ...det, status: "Gagal" }],
        semantik: [sem, { ...sem, status: "Tidak memenuhi" }, { ...sem, status: "Perlu diperiksa manual" }, { ...sem, status: "Belum ada rekomendasi" }],
      },
    ]);
    expect([r.lolos, r.gagal, r.memenuhi, r.tidakMemenuhi, r.tanpaRekomendasi]).toEqual([1, 1, 1, 1, 2]);
  });
});
