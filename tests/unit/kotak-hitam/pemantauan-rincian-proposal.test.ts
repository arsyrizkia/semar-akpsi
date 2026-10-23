// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: CRC VersiProposal / HasilPemeriksaan, Class Diagram: Proposal 1 - 0..* PenugasanReviewer 1 - 0..1 Penilaian,
// J-05b Rincian Proposal (ringkasan hasil, urutan tampil, status penilaian).
import { describe, expect, it } from "vitest";
import { ringkasHasil, statusPenilaian, statusPenilaianDariLabel, urutkanHasil } from "@/lib/pemantauan/rincian-proposal";

describe("ringkasHasil", () => {
  it("KH-ringkasHasil-01: daftar kosong menghasilkan semua hitungan nol", () => {
    const r = ringkasHasil([]);
    expect(r.deterministik).toEqual({ jumlah: 0, lolos: 0, gagal: 0, memenuhi: 0, tidakMemenuhi: 0, perluManual: 0, belumAda: 0 });
    expect(r.semantik.jumlah).toBe(0);
  });

  it("KH-ringkasHasil-02: menghitung deterministik dan semantik terpisah", () => {
    const r = ringkasHasil([
      { butirKode: "A", jenis: "deterministik", status: "Lolos" },
      { butirKode: "B", jenis: "deterministik", status: "Gagal" },
      { butirKode: "C", jenis: "deterministik", status: "Gagal" },
      { butirKode: "D", jenis: "semantik", status: "Memenuhi" },
      { butirKode: "E", jenis: "semantik", status: "Tidak memenuhi" },
      { butirKode: "F", jenis: "semantik", status: "Perlu diperiksa manual" },
      { butirKode: "G", jenis: "semantik", status: "Belum ada rekomendasi" },
    ]);
    expect(r.deterministik).toMatchObject({ jumlah: 3, lolos: 1, gagal: 2 });
    expect(r.semantik).toMatchObject({ jumlah: 4, memenuhi: 1, tidakMemenuhi: 1, perluManual: 1, belumAda: 1 });
  });

  it("KH-ringkasHasil-03: status tak dikenal (nilai janggal) hanya menambah jumlah total", () => {
    const r = ringkasHasil([{ butirKode: "A", jenis: "semantik", status: "Entah" }]);
    expect(r.semantik).toMatchObject({ jumlah: 1, memenuhi: 0, tidakMemenuhi: 0, perluManual: 0, belumAda: 0 });
  });
});

describe("urutkanHasil", () => {
  it("KH-urutkanHasil-01: Gagal/Tidak memenuhi di atas, lalu perlu manual, belum ada, lalu lolos; seri menurut kode", () => {
    const urut = urutkanHasil([
      { butirKode: "B", status: "Lolos" },
      { butirKode: "A", status: "Lolos" },
      { butirKode: "D", status: "Belum ada rekomendasi" },
      { butirKode: "C", status: "Perlu diperiksa manual" },
      { butirKode: "E", status: "Tidak memenuhi" },
      { butirKode: "F", status: "Gagal" },
    ]);
    expect(urut.map((h) => h.butirKode)).toEqual(["E", "F", "C", "D", "A", "B"]);
  });

  it("KH-urutkanHasil-02: tidak mengubah larik masukan", () => {
    const masukan = [{ butirKode: "B", status: "Lolos" }, { butirKode: "A", status: "Gagal" }];
    urutkanHasil(masukan);
    expect(masukan.map((h) => h.butirKode)).toEqual(["B", "A"]);
  });
});

describe("statusPenilaian", () => {
  it("KH-statusPenilaian-01: penugasan masih Diusulkan = Belum ditetapkan, apa pun penilaiannya", () => {
    expect(statusPenilaian(null, "Diusulkan")).toBe("Belum ditetapkan");
  });

  it("KH-statusPenilaian-02: ditetapkan tanpa baris penilaian = Belum dimulai", () => {
    expect(statusPenilaian(null, "Ditetapkan")).toBe("Belum dimulai");
    expect(statusPenilaian(undefined, "Ditetapkan")).toBe("Belum dimulai");
  });

  it("KH-statusPenilaian-03: penilaian Draf dan Final diteruskan", () => {
    expect(statusPenilaian({ status: "Draf" }, "Ditetapkan")).toBe("Draf");
    expect(statusPenilaian({ status: "Final" }, "Selesai")).toBe("Final");
  });
});

describe("statusPenilaianDariLabel", () => {
  it("KH-statusPenilaianDariLabel-01: label J-07 Baru = Belum dimulai (baris penilaian yang baru dibuka bukan Draf)", () => {
    expect(statusPenilaianDariLabel("Baru", "Ditetapkan")).toBe("Belum dimulai");
  });

  it("KH-statusPenilaianDariLabel-02: label Draf dan Selesai mengikuti J-07", () => {
    expect(statusPenilaianDariLabel("Draf", "Ditetapkan")).toBe("Draf");
    expect(statusPenilaianDariLabel("Selesai", "Selesai")).toBe("Final");
  });

  it("KH-statusPenilaianDariLabel-03: penugasan Diusulkan = Belum ditetapkan, apa pun labelnya", () => {
    expect(statusPenilaianDariLabel("Draf", "Diusulkan")).toBe("Belum ditetapkan");
  });
});
