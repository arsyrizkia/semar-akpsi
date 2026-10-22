// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: state machine PenugasanReviewer (Diusulkan -> Ditetapkan -> Selesai),
// CRC PenugasanReviewer, Contract C-15 PenugasanReviewer.tetapkan (prakondisi status Diusulkan).
import { describe, expect, it } from "vitest";
import { URUTAN_STATUS_PENUGASAN, bolehDipindahkan, bolehTransisiPenugasan, transisiPenugasan, type StatusPenugasan } from "@/lib/penugasan/status";

describe("state machine PenugasanReviewer", () => {
  it("KH-StatusPenugasan-01: Diusulkan -> Ditetapkan diizinkan", () => {
    expect(bolehTransisiPenugasan("Diusulkan", "Ditetapkan")).toBe(true);
    expect(transisiPenugasan("Diusulkan", "Ditetapkan")).toBe("Ditetapkan");
  });

  it("KH-StatusPenugasan-02: Ditetapkan -> Selesai diizinkan", () => {
    expect(bolehTransisiPenugasan("Ditetapkan", "Selesai")).toBe(true);
    expect(transisiPenugasan("Ditetapkan", "Selesai")).toBe("Selesai");
  });

  it("KH-StatusPenugasan-03: melompat Diusulkan -> Selesai ditolak", () => {
    expect(bolehTransisiPenugasan("Diusulkan", "Selesai")).toBe(false);
    expect(() => transisiPenugasan("Diusulkan", "Selesai")).toThrow(/tidak diizinkan/);
  });

  it("KH-StatusPenugasan-04: mundur (Ditetapkan -> Diusulkan, Selesai -> Ditetapkan) ditolak", () => {
    expect(bolehTransisiPenugasan("Ditetapkan", "Diusulkan")).toBe(false);
    expect(bolehTransisiPenugasan("Selesai", "Ditetapkan")).toBe(false);
  });

  it("KH-StatusPenugasan-05: Selesai adalah keadaan akhir tanpa transisi keluar", () => {
    for (const ke of URUTAN_STATUS_PENUGASAN) expect(bolehTransisiPenugasan("Selesai", ke)).toBe(false);
  });

  it("KH-StatusPenugasan-06: transisi ke keadaan yang sama ditolak", () => {
    for (const s of URUTAN_STATUS_PENUGASAN) expect(bolehTransisiPenugasan(s, s)).toBe(false);
  });

  it("KH-StatusPenugasan-07: keadaan tak dikenal (tipe salah) ditolak tanpa galat tak terduga", () => {
    expect(bolehTransisiPenugasan("Dibatalkan" as StatusPenugasan, "Ditetapkan")).toBe(false);
  });

  it("KH-StatusPenugasan-08: setiap keadaan dapat dicapai dari Diusulkan lewat transisi sah berurutan", () => {
    let s = "Diusulkan" as StatusPenugasan;
    const dicapai = [s];
    for (const ke of ["Ditetapkan", "Selesai"] as const) {
      s = transisiPenugasan(s, ke);
      dicapai.push(s);
    }
    expect(dicapai).toEqual([...URUTAN_STATUS_PENUGASAN]);
  });

  it("KH-StatusPenugasan-09: hanya usulan (Diusulkan) yang boleh dipindahkan (S-2)", () => {
    expect(bolehDipindahkan("Diusulkan")).toBe(true);
    expect(bolehDipindahkan("Ditetapkan")).toBe(false);
    expect(bolehDipindahkan("Selesai")).toBe(false);
  });
});
