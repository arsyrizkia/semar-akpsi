// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-09 rekapKesesuaian / hitungTingkatKoreksi (Contract C-29)
// dan pilahButirDitandai (Contract C-30); setiap cabang/jalur.
import { describe, expect, it } from "vitest";
import { BATAS_CONTOH_RINCIAN, rekapKesesuaian, type BarisNilai } from "@/lib/pemantauan/rekap";
import { pilahButirDitandai } from "@/lib/pemantauan/status-butir";

const nilai = (hasilId: string, kode: string, koreksi: BarisNilai["koreksi"] = null): BarisNilai => ({
  hasilId,
  butirKode: kode,
  judulProposal: `Judul ${hasilId}`,
  rekomendasi: "Memenuhi",
  status: "Memenuhi",
  kutipan: null,
  alasanSistem: null,
  tiruan: false,
  koreksi,
});
const kor = { keputusanReviewer: "Tidak memenuhi" as const, alasan: "alasan", jenisKekeliruan: "" };

describe("rekapKesesuaian: cabang (MS-09)", () => {
  it("KP-rekapKesesuaian-01: butir tanpa info memakai kode sebagai deskripsi, status dan butirId null", () => {
    const h = rekapKesesuaian([{ butirKode: "X-9", institusiPengusul: "U1" }], [nilai("1", "X-9", kor)], []);
    expect(h.gagalPerButir[0].deskripsi).toBe("X-9");
    expect(h.kesesuaian[0].status).toBeNull();
    expect(h.koreksiTertinggi[0].butirId).toBeNull();
    expect(h.koreksiTertinggi[0].status).toBeNull();
  });

  it("KP-rekapKesesuaian-02: rincian dibatasi BATAS_CONTOH_RINCIAN dengan koreksi lebih dulu", () => {
    const banyak = [...Array.from({ length: BATAS_CONTOH_RINCIAN + 3 }, (_, i) => nilai(`s${i}`, "A")), nilai("k", "A", kor)];
    const rincian = rekapKesesuaian([], banyak, []).rincian["A"];
    expect(rincian).toHaveLength(BATAS_CONTOH_RINCIAN);
    expect(rincian[0].dikoreksi).toBe(true);
    expect(rincian.slice(1).every((c) => !c.dikoreksi)).toBe(true);
  });

  it("KP-rekapKesesuaian-03: rekomendasi kosong tanpa koreksi tampil sebagai 'Disetujui (tanpa koreksi)'", () => {
    const n = { ...nilai("1", "A"), rekomendasi: null };
    expect(rekapKesesuaian([], [n], []).rincian["A"][0].keputusanReviewer).toBe("Disetujui (tanpa koreksi)");
  });

  it("KP-rekapKesesuaian-04: institusi unik terurut abjad, jumlah gagal per institusi bertambah per kejadian", () => {
    const h = rekapKesesuaian(
      [
        { butirKode: "A", institusiPengusul: "Zeta" },
        { butirKode: "A", institusiPengusul: "Alfa" },
        { butirKode: "B", institusiPengusul: "Alfa" },
        { butirKode: "B", institusiPengusul: "Alfa" },
      ],
      [],
      [],
    );
    expect(h.institusi).toEqual(["Alfa", "Zeta"]);
    expect(h.gagalPerButir.map((b) => [b.kode, b.total])).toEqual([["A", 2], ["B", 2]]);
  });

  it("KP-rekapKesesuaian-05: persen disetujui seri diurutkan menurut kode", () => {
    const h = rekapKesesuaian([], [nilai("1", "B"), nilai("2", "A")], []);
    expect(h.kesesuaian.map((b) => b.kode)).toEqual(["A", "B"]);
  });
});

describe("pilahButirDitandai: cabang (C-30)", () => {
  const butir = [
    { id: "1", kode: "A", status: "Aktif" as const },
    { id: "2", kode: "B", status: "Draf" as const },
    { id: "3", kode: "C", status: "Perlu ditinjau" as const },
  ];

  it("KP-pilahButirDitandai-01: butir Aktif menjadi target", () => {
    const h = pilahButirDitandai(butir, ["A"]);
    expect(h.target.map((b) => b.kode)).toEqual(["A"]);
    expect(h.dilewati).toEqual([]);
  });

  it("KP-pilahButirDitandai-02: butir bukan Aktif dilewati beserta alasan statusnya", () => {
    const h = pilahButirDitandai(butir, ["B", "C"]);
    expect(h.target).toEqual([]);
    expect(h.dilewati.map((d) => d.kode)).toEqual(["B", "C"]);
    expect(h.dilewati[0].alasan).toContain("Draf");
  });

  it("KP-pilahButirDitandai-03: kode yang tidak ada pada basis aturan dilewati", () => {
    const h = pilahButirDitandai(butir, ["Z"]);
    expect(h.dilewati).toEqual([{ kode: "Z", alasan: "Butir tidak ada pada basis aturan berlaku." }]);
  });

  it("KP-pilahButirDitandai-04: kode ganda dihitung sekali; pilihan kosong tidak menghasilkan apa-apa", () => {
    expect(pilahButirDitandai(butir, ["A", "A", "A"]).target).toHaveLength(1);
    expect(pilahButirDitandai(butir, [])).toEqual({ target: [], dilewati: [] });
  });
});
