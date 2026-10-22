// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-29 BasisAturan.rekapKesesuaian / ButirCek.hitungTingkatKoreksi, CRC BasisAturan.
import { describe, expect, it } from "vitest";
import { formatPersen, rekapKesesuaian, type BarisNilai, type InfoButir } from "@/lib/pemantauan/rekap";

const butir: InfoButir[] = [
  { id: "b1", kode: "ISI-01", deskripsi: "Ringkasan memuat urgensi", status: "Aktif" },
  { id: "b2", kode: "ISI-02", deskripsi: "Pendahuluan lengkap", status: "Aktif" },
  { id: "b3", kode: "KTA-01", deskripsi: "Kata kunci tepat lima", status: "Aktif" },
];

const nilai = (hasilId: string, kode: string, koreksi: BarisNilai["koreksi"] = null): BarisNilai => ({
  hasilId,
  butirKode: kode,
  judulProposal: `Judul ${hasilId}`,
  rekomendasi: "Memenuhi",
  status: "Memenuhi",
  kutipan: "kutipan",
  alasanSistem: null,
  tiruan: true,
  koreksi,
});
const kor = (alasan: string, jenis = "Salah tafsir isi") => ({ keputusanReviewer: "Tidak memenuhi" as const, alasan, jenisKekeliruan: jenis });

describe("rekapKesesuaian (UC-04)", () => {
  it("KH-rekapKesesuaian-01: menghitung tabel silang gagal per butir dan institusi, urut terbanyak", () => {
    const h = rekapKesesuaian(
      [
        { butirKode: "KTA-01", institusiPengusul: "U1" },
        { butirKode: "KTA-01", institusiPengusul: "U2" },
        { butirKode: "KTA-01", institusiPengusul: "U1" },
        { butirKode: "ISI-01", institusiPengusul: "U2" },
      ],
      [],
      butir,
    );
    expect(h.institusi).toEqual(["U1", "U2"]);
    expect(h.gagalPerButir.map((b) => [b.kode, b.total])).toEqual([["KTA-01", 3], ["ISI-01", 1]]);
    expect(h.gagalPerButir[0].perInstitusi).toEqual({ U1: 2, U2: 1 });
  });

  it("KH-rekapKesesuaian-02: % disetujui = hasil tanpa koreksi dibagi semua hasil pada penilaian final", () => {
    const h = rekapKesesuaian([], [nilai("1", "ISI-01"), nilai("2", "ISI-01"), nilai("3", "ISI-01", kor("x")), nilai("4", "ISI-01")], butir);
    const b = h.kesesuaian.find((x) => x.kode === "ISI-01")!;
    expect(b.jumlah).toBe(4);
    expect(b.disetujui).toBe(3);
    expect(b.persenDisetujui).toBe(75);
  });

  it("KH-rekapKesesuaian-03: mengurutkan butir koreksi tertinggi dan menyertakan alasan serta jenis kekeliruan", () => {
    const h = rekapKesesuaian(
      [],
      [
        nilai("1", "ISI-01", kor("alasan a")),
        nilai("2", "ISI-01"),
        nilai("3", "ISI-02", kor("alasan b", "Kutipan salah tempat")),
        nilai("4", "ISI-02", kor("alasan c")),
      ],
      butir,
    );
    expect(h.koreksiTertinggi.map((b) => b.kode)).toEqual(["ISI-02", "ISI-01"]);
    expect(h.koreksiTertinggi[0].tingkatKoreksi).toBe(1);
    expect(h.koreksiTertinggi[0].alasan.map((a) => a.jenisKekeliruan)).toContain("Kutipan salah tempat");
    expect(h.koreksiTertinggi[0].butirId).toBe("b2");
  });

  it("KH-rekapKesesuaian-04: butir tanpa koreksi tidak masuk daftar koreksi tertinggi", () => {
    const h = rekapKesesuaian([], [nilai("1", "ISI-01"), nilai("2", "ISI-01")], butir);
    expect(h.koreksiTertinggi).toEqual([]);
    expect(h.kesesuaian[0].persenDisetujui).toBe(100);
  });

  it("KH-rekapKesesuaian-05: rincian butir (S-1) memuat contoh, mendahulukan yang dikoreksi", () => {
    const h = rekapKesesuaian([], [nilai("1", "ISI-01"), nilai("2", "ISI-01", kor("tidak sesuai"))], butir);
    expect(h.rincian["ISI-01"][0].dikoreksi).toBe(true);
    expect(h.rincian["ISI-01"][0].alasanKoreksi).toBe("tidak sesuai");
    expect(h.rincian["ISI-01"][1].keputusanReviewer).toBe("Memenuhi");
  });

  it("KH-rekapKesesuaian-06: laporan kosong tidak error", () => {
    const h = rekapKesesuaian([], [], []);
    expect(h).toEqual({ institusi: [], gagalPerButir: [], kesesuaian: [], koreksiTertinggi: [], rincian: {} });
  });
});

describe("formatPersen", () => {
  it("KH-formatPersen-01: memakai koma desimal", () => {
    expect(formatPersen(87.5)).toBe("87,5%");
    expect(formatPersen(100)).toBe("100%");
    expect(formatPersen(66.666)).toBe("66,7%");
  });
});

describe("rekapKesesuaian: batas dan urutan (Contract C-29)", () => {
  it("KH-rekapKesesuaian-07: tanpa koreksi = 100% disetujui; semua dikoreksi = 0% (batas atas dan bawah)", () => {
    const h = rekapKesesuaian([], [nilai("1", "ISI-01"), nilai("2", "ISI-02", kor("a")), nilai("3", "ISI-02", kor("b"))], butir);
    expect(h.kesesuaian.find((b) => b.kode === "ISI-01")!.persenDisetujui).toBe(100);
    expect(h.kesesuaian.find((b) => b.kode === "ISI-02")!.persenDisetujui).toBe(0);
  });

  it("KH-rekapKesesuaian-08: kesesuaian diurutkan dari persen disetujui terendah", () => {
    const h = rekapKesesuaian([], [nilai("1", "ISI-01"), nilai("2", "ISI-02", kor("a")), nilai("3", "ISI-02"), nilai("4", "KTA-01", kor("b"))], butir);
    expect(h.kesesuaian.map((b) => b.kode)).toEqual(["KTA-01", "ISI-02", "ISI-01"]);
  });

  it("KH-hitungTingkatKoreksi-01: tingkat koreksi = koreksi / hasil pada penilaian final per butir", () => {
    const h = rekapKesesuaian([], [nilai("1", "ISI-01", kor("a")), nilai("2", "ISI-01"), nilai("3", "ISI-01"), nilai("4", "ISI-01")], butir);
    expect(h.koreksiTertinggi[0]).toMatchObject({ kode: "ISI-01", jumlah: 4, jumlahKoreksi: 1, tingkatKoreksi: 0.25 });
  });

  it("KH-hitungTingkatKoreksi-02: tingkat koreksi sama diurutkan menurut jumlah koreksi lalu kode", () => {
    const h = rekapKesesuaian(
      [],
      [nilai("1", "ISI-02", kor("a")), nilai("2", "ISI-01", kor("b")), nilai("3", "ISI-01", kor("c")), nilai("4", "ISI-01"), nilai("5", "ISI-02")],
      butir,
    );
    // ISI-01 2/3 > ISI-02 1/2
    expect(h.koreksiTertinggi.map((b) => b.kode)).toEqual(["ISI-01", "ISI-02"]);
  });

  it("KH-rekapKesesuaian-09: rincian menyertakan id proposal untuk tautan ke J-05b", () => {
    const n = { ...nilai("1", "ISI-01"), proposalId: "uuid-1" };
    expect(rekapKesesuaian([], [n], butir).rincian["ISI-01"][0].proposalId).toBe("uuid-1");
  });
});
