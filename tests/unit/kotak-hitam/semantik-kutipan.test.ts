// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475): diturunkan dari kontrak, spesifikasi, dan real use case, tanpa melihat isi metode.
import { describe, expect, it } from "vitest";
import { cariKutipan, cocokkanKutipan } from "@/lib/pemeriksa/semantik/teks";

describe("cocokkanKutipan", () => {
  const teks = "Kalimat pertama.\n  Tujuan   penelitian adalah\nmembangun model.";
  it("KH-cocokkanKutipan-01: abaikan perbedaan spasi dan baris baru, tetapi persis pada kata", () => {
    expect(cocokkanKutipan(teks, "Tujuan penelitian adalah membangun model.")).toBe(true);
    expect(cocokkanKutipan(teks, "tujuan penelitian adalah membangun model.")).toBe(false);
    expect(cocokkanKutipan(teks, "Tujuan penelitian ialah membangun model.")).toBe(false);
    expect(cocokkanKutipan(teks, "")).toBe(false);
  });
  it("KH-cocokkanKutipan-02: mengembalikan rentang di teks asli", () => {
    const r = cariKutipan(teks, "Tujuan penelitian adalah");
    expect(r && teks.slice(r.mulai, r.akhir)).toBe("Tujuan   penelitian adalah");
  });
  it("KH-cocokkanKutipan-03: karakter regex dalam kutipan tidak merusak pencarian", () => {
    expect(cocokkanKutipan("Biaya (Rp 1.000) [3] + pajak?", "(Rp 1.000) [3] + pajak?")).toBe(true);
  });
});
