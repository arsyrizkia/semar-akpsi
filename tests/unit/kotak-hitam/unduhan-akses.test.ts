// Uji kotak hitam: aturan akses unduhan berkas proposal dan kepala respons unduhan.
import { describe, expect, it } from "vitest";
import { bentukNamaBerkas, bolehUnduhBerkasProposal, dispositionUnduhan, kepalaUnduhan } from "@/lib/unduhan";

describe("bolehUnduhBerkasProposal", () => {
  it("KH-bolehUnduhBerkasProposal-01: Tim Kerja selalu boleh", () => {
    expect(bolehUnduhBerkasProposal("tim_kerja", false)).toBe(true);
  });
  it("KH-bolehUnduhBerkasProposal-02: reviewer hanya bila ditugaskan pada proposal itu", () => {
    expect(bolehUnduhBerkasProposal("reviewer", true)).toBe(true);
    expect(bolehUnduhBerkasProposal("reviewer", false)).toBe(false);
  });
  it("KH-bolehUnduhBerkasProposal-03: pengusul tidak boleh walau punya penugasan palsu", () => {
    expect(bolehUnduhBerkasProposal("pengusul", true)).toBe(false);
  });
});

describe("dispositionUnduhan dan kepalaUnduhan", () => {
  it("KH-dispositionUnduhan-01: lampiran dengan filename ASCII dan filename* UTF-8", () => {
    const d = dispositionUnduhan("Naskah Proposal (revisi).docx");
    expect(d.startsWith("attachment; filename=\"")).toBe(true);
    expect(d).toContain("filename*=UTF-8''Naskah%20Proposal%20%28revisi%29.docx");
  });
  it("KH-dispositionUnduhan-02: tanda kutip dan pemisah baris tidak lolos ke header (pencegahan injeksi header)", () => {
    const d = dispositionUnduhan('a"b\r\nSet-Cookie: x.docx');
    expect(d).not.toMatch(/[\r\n]/);
    expect(d.split('filename="')[1].split('"')[0]).not.toContain('"');
  });
  it("KH-kepalaUnduhan-01: memuat tipe, panjang, no-store, dan nosniff", () => {
    const h = kepalaUnduhan("a.pdf", "application/pdf", 42);
    expect(h["content-type"]).toBe("application/pdf");
    expect(h["content-length"]).toBe("42");
    expect(h["cache-control"]).toContain("no-store");
    expect(h["x-content-type-options"]).toBe("nosniff");
  });
});

describe("bentukNamaBerkas", () => {
  it("KH-bentukNamaBerkas-01: aksen dihilangkan, spasi menjadi garis bawah, karakter terlarang diganti", () => {
    expect(bentukNamaBerkas("Rencana Anggaran Biaya é.xlsx")).toBe("Rencana_Anggaran_Biaya_e.xlsx");
    expect(bentukNamaBerkas("a/b\\c.pdf")).toBe("a_b_c.pdf");
  });
  it("KH-bentukNamaBerkas-02: nama kosong atau semua simbol memakai cadangan", () => {
    expect(bentukNamaBerkas("")).toBe("berkas");
    expect(bentukNamaBerkas("???", "x")).toBe("x");
  });
});
