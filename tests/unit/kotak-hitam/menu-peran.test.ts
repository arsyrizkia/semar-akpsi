// Uji kotak hitam: menu sidebar per peran (NFR 5.1, docs/arah-perbaikan-2026-10-22.md).
import { describe, expect, it } from "vitest";
import { itemAktif, menuUntukPeran } from "@/lib/menu";

const nama = (m: { nama: string }[]) => m.map((x) => x.nama);

describe("menuUntukPeran", () => {
  it("KH-menuUntukPeran-01: Tim Kerja pengelola melihat empat menu berurutan", () => {
    expect(nama(menuUntukPeran({ peran: "tim_kerja", pengelola: true }))).toEqual(["Templat Proposal", "Aturan Pemeriksaan", "Penugasan Reviewer", "Pemantauan Kesesuaian"]);
  });
  it("KH-menuUntukPeran-02: Tim Kerja non-pengelola hanya Penugasan dan Pemantauan", () => {
    expect(nama(menuUntukPeran({ peran: "tim_kerja", pengelola: false }))).toEqual(["Penugasan Reviewer", "Pemantauan Kesesuaian"]);
  });
  it("KH-menuUntukPeran-03: reviewer hanya Daftar Penugasan", () => {
    expect(nama(menuUntukPeran({ peran: "reviewer", pengelola: false }))).toEqual(["Daftar Penugasan"]);
  });
  it("KH-menuUntukPeran-04: pengusul tanpa menu", () => {
    expect(menuUntukPeran({ peran: "pengusul", pengelola: false })).toEqual([]);
  });
});

describe("itemAktif", () => {
  const menu = menuUntukPeran({ peran: "tim_kerja", pengelola: true });
  it("KH-itemAktif-01: jalur layar dan layar turunannya menandai menu induk", () => {
    expect(itemAktif(menu, "/tim-kerja/templat")?.kode).toBe("J-02");
    expect(itemAktif(menu, "/tim-kerja/templat/abc/susun")?.kode).toBe("J-02");
    expect(itemAktif(menu, "/tim-kerja/aturan/uji")?.kode).toBe("J-03");
    expect(itemAktif(menu, "/tim-kerja/penugasan/periode-1")?.kode).toBe("J-04");
  });
  it("KH-itemAktif-02: J-05b (rincian proposal) menandai Pemantauan Kesesuaian", () => {
    expect(itemAktif(menu, "/tim-kerja/proposal/PRP-2026-0001")?.kode).toBe("J-05");
  });
  it("KH-itemAktif-03: awalan serupa tetapi bukan segmen yang sama tidak cocok; jalur asing tidak menandai apa pun", () => {
    expect(itemAktif(menu, "/tim-kerja/templatbaru")).toBeUndefined();
    expect(itemAktif(menu, "/demo")).toBeUndefined();
  });
});
