// Uji kotak hitam: cn() menggabungkan kelas dan menyelesaikan bentrok Tailwind.
import { describe, expect, it } from "vitest";
import { cn, formatAngka, formatTanggal, formatWaktu } from "@/lib/utils";

describe("cn", () => {
  it("KH-cn-01: menggabungkan kelas dan membuang nilai palsu", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
  it("KH-cn-02: kelas Tailwind yang bentrok: yang terakhir menang", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
  it("KH-cn-03: masukan bersyarat berbentuk objek dan larik", () => {
    expect(cn(["a", { b: true, c: false }])).toBe("a b");
  });
  it("KH-cn-04: tanpa masukan menghasilkan string kosong", () => {
    expect(cn()).toBe("");
  });
});

describe("format tanggal dan angka (WIB, id-ID)", () => {
  it("KH-formatTanggal-01: tanggal valid ditulis hari bulan tahun menurut WIB; kosong menjadi tanda hubung", () => {
    expect(formatTanggal("2026-10-21T17:30:00Z")).toBe("22 Oktober 2026"); // 00.30 WIB hari berikutnya
    expect(formatTanggal(null)).toBe("-");
    expect(formatTanggal(undefined)).toBe("-");
  });
  it("KH-formatWaktu-01: waktu ditutup dengan WIB; kosong menjadi tanda hubung", () => {
    expect(formatWaktu("2026-10-22T03:05:00Z")).toMatch(/22 Okt 2026.*10.05 WIB/);
    expect(formatWaktu(null)).toBe("-");
  });
  it("KH-formatAngka-01: pemisah ribuan titik", () => {
    expect(formatAngka(10000)).toBe("10.000");
  });
});
