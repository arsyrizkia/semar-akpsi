// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-14 PenugasanReviewer.pilihReviewer (pra/pascakondisi), CRC PenugasanReviewer, Class Diagram: PenugasanReviewer 0..* - 1 Reviewer.
import { describe, expect, it } from "vitest";
import { periksaSyarat } from "@/lib/penugasan/aturan";

describe("periksaSyarat (S-2.2)", () => {
  it("KH-periksaSyarat-01: meloloskan reviewer beda institusi dengan beban di bawah batas", () => {
    expect(periksaSyarat({ institusiPengusul: "A", reviewer: { institusi: "B", bersedia: true }, bebanSaatIni: 2, batas: 3 })).toEqual([]);
  });

  it("KH-periksaSyarat-02: menolak institusi sama", () => {
    const s = periksaSyarat({ institusiPengusul: "A", reviewer: { institusi: "a", bersedia: true }, bebanSaatIni: 0, batas: 3 });
    expect(s).toHaveLength(1);
    expect(s[0]).toMatch(/institusi/i);
  });

  it("KH-periksaSyarat-03: menolak beban melampaui batas", () => {
    const s = periksaSyarat({ institusiPengusul: "A", reviewer: { institusi: "B", bersedia: true }, bebanSaatIni: 3, batas: 3 });
    expect(s[0]).toMatch(/beban/i);
  });

  it("KH-periksaSyarat-04: melaporkan semua syarat yang dilanggar", () => {
    const s = periksaSyarat({ institusiPengusul: "A", reviewer: { institusi: "A", bersedia: false }, bebanSaatIni: 5, batas: 5 });
    expect(s).toHaveLength(3);
  });
});

describe("periksaSyarat: batas dan nilai janggal (Contract C-14)", () => {
  const dasar = { institusiPengusul: "Universitas A", reviewer: { institusi: "Universitas B", bersedia: true }, batas: 3 };

  it("KH-periksaSyarat-05: beban tepat satu di bawah batas masih sah (batas bawah sah)", () => {
    expect(periksaSyarat({ ...dasar, bebanSaatIni: 2 })).toEqual([]);
  });

  it("KH-periksaSyarat-06: beban tepat pada batas ditolak karena pemindahan menambah satu (batas atas tidak sah)", () => {
    const s = periksaSyarat({ ...dasar, bebanSaatIni: 3 });
    expect(s).toHaveLength(1);
    expect(s[0]).toContain("4 dari batas 3");
  });

  it("KH-periksaSyarat-07: reviewer yang tidak bersedia ditolak walau institusi dan beban sah", () => {
    const s = periksaSyarat({ ...dasar, reviewer: { institusi: "Universitas B", bersedia: false }, bebanSaatIni: 0 });
    expect(s).toHaveLength(1);
    expect(s[0]).toMatch(/tidak bersedia/i);
  });

  it("KH-periksaSyarat-08: institusi dibandingkan tanpa peduli huruf besar dan spasi tepi (nilai janggal tetapi sama)", () => {
    const s = periksaSyarat({ ...dasar, reviewer: { institusi: "  universitas a ", bersedia: true }, bebanSaatIni: 0 });
    expect(s).toHaveLength(1);
    expect(s[0]).toMatch(/institusi/i);
  });

  it("KH-periksaSyarat-09: batas 0 (janggal) menolak semua pemindahan", () => {
    expect(periksaSyarat({ ...dasar, batas: 0, bebanSaatIni: 0 })).toHaveLength(1);
  });
});
