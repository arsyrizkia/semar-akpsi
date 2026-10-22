// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-10 (ujiPadaContoh: laporan per butir per contoh), Class Diagram: BasisAturan — ButirCek.
import { describe, expect, it } from "vitest";
import { ringkasPerContoh, susunBarisUji } from "@/lib/aturan/uji";
import type { HasilButirDeterministik, HasilButirSemantik, HasilUjiContoh } from "@/lib/kontrak/tipe";

const det = (kode: string, status: "Lolos" | "Gagal"): HasilButirDeterministik => ({ butirId: kode, kode, bagian: null, status, angkaPembukti: "1 dari 2", batasDilanggar: status === "Gagal" ? "batas" : null });
const sem = (kode: string, status: HasilButirSemantik["status"]): HasilButirSemantik => ({ butirId: kode, kode, bagian: null, status, rekomendasi: null, kutipan: null, tingkatKeyakinan: null, alasanSistem: null, tiruan: true });
const butir = (kode: string, status = "Aktif") => ({ id: kode, kode, deskripsi: `Butir ${kode}`, status });

describe("susunBarisUji (laporan per butir per contoh)", () => {
  const contoh: HasilUjiContoh[] = [
    { dokumenKode: "a", dokumenNama: "Contoh A", deterministik: [det("D1", "Lolos")], semantik: [sem("S1", "Memenuhi")] },
    { dokumenKode: "b", dokumenNama: "Contoh B", deterministik: [det("D1", "Gagal")], semantik: [] },
  ];

  it("KH-susunBarisUji-01: satu baris per butir, satu sel per contoh, urutan butir dipertahankan", () => {
    const r = susunBarisUji([butir("S1"), butir("D1")], contoh);
    expect(r.map((x) => x.butir.kode)).toEqual(["S1", "D1"]);
    expect(r[1].sel.map((s) => s?.status)).toEqual(["Lolos", "Gagal"]);
    expect(r[0].sel.map((s) => s?.status)).toEqual(["Memenuhi", undefined]);
  });

  it("KH-susunBarisUji-02: butir Nonaktif tidak ditampilkan", () => {
    expect(susunBarisUji([butir("D1", "Nonaktif")], contoh)).toEqual([]);
  });

  it("KH-susunBarisUji-03: tanpa contoh atau tanpa butir menghasilkan daftar kosong (batas bawah)", () => {
    expect(susunBarisUji([butir("D1")], [])).toEqual([]);
    expect(susunBarisUji([], contoh)).toEqual([]);
  });

  it("KH-susunBarisUji-04: butir tanpa satu pun hasil dilewati (nilai janggal: kode tidak dikenal)", () => {
    expect(susunBarisUji([butir("TIDAK-ADA")], contoh)).toEqual([]);
  });
});

describe("ringkasPerContoh", () => {
  it("KH-ringkasPerContoh-01: menghitung Lolos, Gagal, dan rekomendasi semantik per contoh", () => {
    const r = ringkasPerContoh([
      {
        dokumenKode: "a",
        dokumenNama: "A",
        deterministik: [det("D1", "Lolos"), det("D2", "Gagal"), det("D3", "Gagal")],
        semantik: [sem("S1", "Memenuhi"), sem("S2", "Tidak memenuhi"), sem("S3", "Perlu diperiksa manual"), sem("S4", "Belum ada rekomendasi")],
      },
    ]);
    expect(r).toEqual([{ dokumenKode: "a", dokumenNama: "A", lolos: 1, gagal: 2, memenuhi: 1, tidakMemenuhi: 1, tanpaRekomendasi: 2 }]);
  });

  it("KH-ringkasPerContoh-02: tanpa contoh menghasilkan daftar kosong; contoh tanpa hasil menghasilkan nol", () => {
    expect(ringkasPerContoh([])).toEqual([]);
    expect(ringkasPerContoh([{ dokumenKode: "x", dokumenNama: "X", deterministik: [], semantik: [] }])[0]).toMatchObject({ lolos: 0, gagal: 0, memenuhi: 0, tidakMemenuhi: 0, tanpaRekomendasi: 0 });
  });
});
