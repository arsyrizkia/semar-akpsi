// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-29 BasisAturan.rekapKesesuaian / ButirCek.hitungTingkatKoreksi, CRC BasisAturan.
import { describe, expect, it } from "vitest";
import { AMBANG_PEMANTAUAN } from "@/lib/pemantauan/ambang";
import { formatPersen, rekapKesesuaian, type InfoButir, type MasukanRekap, type SelSemantik } from "@/lib/pemantauan/rekap";

const butir: InfoButir[] = [
  { id: "b1", kode: "UNS-10", deskripsi: "Diagram alir sesuai isi Metode", status: "Aktif", jenis: "semantik" },
  { id: "b2", kode: "UNS-01", deskripsi: "Ringkasan memuat urgensi", status: "Aktif", jenis: "semantik" },
  { id: "b3", kode: "KTA-04", deskripsi: "Metode tidak melebihi 1.000 kata", status: "Aktif", jenis: "deterministik" },
  { id: "b4", kode: "KAT-01", deskripsi: "Kata kunci tepat lima", status: "Aktif", jenis: "deterministik" },
];
const sel = (kode: string, jumlah: number, o: Partial<SelSemantik> = {}): SelSemantik => ({
  butirKode: kode,
  versi: 3,
  deskripsi: butir.find((b) => b.kode === kode)?.deskripsi ?? kode,
  tingkat: "tinggi",
  hari: 1,
  arah: null,
  jenis: null,
  jumlah,
  ...o,
});
const rekap = (o: Partial<MasukanRekap>) =>
  rekapKesesuaian({ sel: [], gagal: [], pengajuan: [], butir, contoh: [], contohGagal: [], proposalPernahGagal: 0, penilaianFinal: 0, ...o });

describe("rekapKesesuaian (UC-04, J-05 triase)", () => {
  it("KH-rekapKesesuaian-01: % disetujui = hasil tanpa koreksi / semua hasil pada penilaian final; arah koreksi dipisah", () => {
    const h = rekap({ sel: [sel("UNS-10", 58), sel("UNS-10", 33, { arah: "longgar", jenis: "Kutipan salah tempat" }), sel("UNS-10", 9, { arah: "ketat", jenis: "Salah tafsir isi" })] });
    expect(h.semantik[0]).toMatchObject({ kode: "UNS-10", jumlah: 100, dikoreksi: 42, persen: 58, longgar: 33, ketat: 9, perhatian: true });
    expect(h.ringkas.persen).toBe(58);
  });

  it("KH-rekapKesesuaian-02: butir di bawah ambang masuk Perlu perhatian; butir 'belum cukup data' tidak, walau persennya rendah", () => {
    const h = rekap({ sel: [sel("UNS-10", 60), sel("UNS-10", 40, { arah: "longgar" }), sel("UNS-01", 10), sel("UNS-01", 10, { arah: "longgar" })] });
    expect(h.perluPerhatian.map((i) => i.baris.kode)).toEqual(["UNS-10"]);
    expect(h.semantik.find((b) => b.kode === "UNS-01")).toMatchObject({ persen: 50, cukup: false, perhatian: false });
  });

  it("KH-rekapKesesuaian-03: gagal saat pengajuan dihitung per proposal terhadap pengajuan, dengan institusi tertinggi", () => {
    const h = rekap({
      gagal: [
        { butirKode: "KTA-04", institusi: "Universitas Nusantara Contoh", proposal: 57 },
        { butirKode: "KTA-04", institusi: "Institut Bahari Contoh", proposal: 20 },
        { butirKode: "KAT-01", institusi: "Institut Bahari Contoh", proposal: 5 },
      ],
      pengajuan: [
        { institusi: "Universitas Nusantara Contoh", proposal: 127 },
        { institusi: "Institut Bahari Contoh", proposal: 173 },
      ],
      proposalPernahGagal: 80,
    });
    const kta = h.deterministik.find((b) => b.kode === "KTA-04")!;
    expect(kta.proposalGagal).toBe(77);
    expect(kta.persen).toBeCloseTo((77 / 300) * 100);
    expect(kta.tertinggi).toMatchObject({ institusi: "Universitas Nusantara Contoh", gagal: 57, pengajuan: 127 });
    expect(kta.perhatian).toBe(true);
    expect(h.deterministik.find((b) => b.kode === "KAT-01")!.perhatian).toBe(false);
    expect(h.ringkas).toMatchObject({ proposalPernahGagal: 80, pengajuan: 300 });
  });

  it("KH-rekapKesesuaian-04: tren harian dan kalibrasi keyakinan dari sel yang sama", () => {
    const h = rekap({
      sel: [
        sel("UNS-01", 90, { hari: 1 }),
        sel("UNS-01", 10, { hari: 1, arah: "ketat", tingkat: "rendah" }),
        sel("UNS-01", 80, { hari: 2, tingkat: "rendah" }),
        sel("UNS-01", 20, { hari: 2, arah: "ketat", tingkat: "rendah" }),
      ],
    });
    expect(h.tren.map((t) => [t.hari, t.persen])).toEqual([
      [1, 90],
      [2, 80],
    ]);
    expect(h.kalibrasi.map((k) => [k.tingkat, k.jumlah, k.persenDikoreksi])).toEqual([
      ["tinggi", 90, 0],
      ["rendah", 110, (30 * 100) / 110],
    ]);
    expect(h.tafsirKalibrasi.bermakna).toBe(true);
  });

  it("KH-rekapKesesuaian-05: sebelum-sesudah: deskripsi butir yang berubah dibandingkan, % berlaku hanya dari deskripsi baru", () => {
    const baru = { ...butir[0], deskripsi: "Tahapan diagram alir sama dengan uraian Metode" };
    const h = rekap({
      butir: [baru, ...butir.slice(1)],
      sel: [
        sel("UNS-10", 58, { versi: 3 }),
        sel("UNS-10", 42, { versi: 3, arah: "longgar" }),
        sel("UNS-10", 91, { versi: 4, deskripsi: baru.deskripsi }),
        sel("UNS-10", 9, { versi: 4, deskripsi: baru.deskripsi, arah: "ketat" }),
      ],
    });
    expect(h.semantik[0].persen).toBe(91);
    expect(h.bandingVersi[0]).toMatchObject({ kode: "UNS-10", lama: { versi: 3, persen: 58, jumlah: 100 }, baru: { versi: 4, persen: 91, jumlah: 100 } });
  });

  it("KH-rekapKesesuaian-06: laporan kosong tidak error", () => {
    const h = rekap({ butir: [] });
    expect(h.semantik).toEqual([]);
    expect(h.deterministik).toEqual([]);
    expect(h.perluPerhatian).toEqual([]);
    expect(h.ringkas.persen).toBeNull();
    expect(h.tafsirKalibrasi.bermakna).toBeNull();
  });

  it("KH-rekapKesesuaian-07: tanpa koreksi = 100% disetujui; semua dikoreksi = 0% (batas atas dan bawah)", () => {
    const h = rekap({ sel: [sel("UNS-01", AMBANG_PEMANTAUAN.minHasil), sel("UNS-10", AMBANG_PEMANTAUAN.minHasil, { arah: "longgar" })] });
    expect(h.semantik.find((b) => b.kode === "UNS-01")!.persen).toBe(100);
    expect(h.semantik.find((b) => b.kode === "UNS-10")!.persen).toBe(0);
  });
});

describe("formatPersen", () => {
  it("KH-formatPersen-01: memakai koma desimal", () => {
    expect(formatPersen(87.5)).toBe("87,5%");
    expect(formatPersen(100)).toBe("100%");
    expect(formatPersen(66.666)).toBe("66,7%");
  });
});
