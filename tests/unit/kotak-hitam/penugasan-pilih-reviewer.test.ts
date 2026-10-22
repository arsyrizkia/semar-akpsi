// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475): diturunkan dari kontrak, spesifikasi, dan real use case, tanpa melihat isi metode.
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
