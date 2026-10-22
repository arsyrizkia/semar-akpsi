// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-30 BasisAturan.tandaiButir / ButirCek.tandaiPerluDitinjau,
// state machine ButirCek (Draf -> Aktif -> Perlu ditinjau -> Nonaktif), CRC ButirCek.
import { describe, expect, it } from "vitest";
import { bolehDitandai, tandaiPerluDitinjau, type StatusButir } from "@/lib/pemantauan/status-butir";

describe("tandaiPerluDitinjau (C-30)", () => {
  it("KH-tandaiPerluDitinjau-01: butir Aktif menjadi Perlu ditinjau", () => {
    expect(tandaiPerluDitinjau("Aktif")).toBe("Perlu ditinjau");
    expect(bolehDitandai("Aktif")).toBe(true);
  });

  it("KH-tandaiPerluDitinjau-02: butir Draf tidak berubah (belum dipakai pemeriksa)", () => {
    expect(tandaiPerluDitinjau("Draf")).toBe("Draf");
    expect(bolehDitandai("Draf")).toBe(false);
  });

  it("KH-tandaiPerluDitinjau-03: butir Nonaktif tidak dihidupkan kembali oleh penandaan", () => {
    expect(tandaiPerluDitinjau("Nonaktif")).toBe("Nonaktif");
  });

  it("KH-tandaiPerluDitinjau-04: menandai butir yang sudah Perlu ditinjau idempoten", () => {
    expect(tandaiPerluDitinjau("Perlu ditinjau")).toBe("Perlu ditinjau");
    expect(tandaiPerluDitinjau(tandaiPerluDitinjau("Aktif"))).toBe("Perlu ditinjau");
  });

  it("KH-tandaiPerluDitinjau-05: status tak dikenal (tipe salah) dikembalikan apa adanya", () => {
    expect(tandaiPerluDitinjau("Rahasia" as StatusButir)).toBe("Rahasia");
  });
});
