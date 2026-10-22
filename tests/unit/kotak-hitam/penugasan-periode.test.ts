// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Contract C-11 PeriodeSeleksi.cekMasaPengusulan, CRC PeriodeSeleksi,
// Class Diagram PeriodeSeleksi 1 - 0..* Proposal; ringkasan J-04 (UC-03 langkah 1).
import { describe, expect, it } from "vitest";
import { halamanDariUrl, jumlahHalaman, periodeDitutup, ringkasStatusPenetapan } from "@/lib/penugasan/periode";

const tutup = new Date("2026-10-20T10:00:00Z");

describe("periodeDitutup (C-11)", () => {
  it("KH-periodeDitutup-01: tepat pada tanggal tutup dan sakelar ditutup = ditutup (batas sah)", () => {
    expect(periodeDitutup({ tanggalTutup: tutup, sekarang: tutup, masaBerjalan: false })).toBe(true);
  });

  it("KH-periodeDitutup-02: satu detik sebelum tanggal tutup = belum ditutup (batas bawah tidak sah)", () => {
    expect(periodeDitutup({ tanggalTutup: tutup, sekarang: new Date(tutup.getTime() - 1000), masaBerjalan: false })).toBe(false);
  });

  it("KH-periodeDitutup-03: satu detik sesudah tanggal tutup = ditutup", () => {
    expect(periodeDitutup({ tanggalTutup: tutup, sekarang: new Date(tutup.getTime() + 1000), masaBerjalan: false })).toBe(true);
  });

  it("KH-periodeDitutup-04: sakelar masa pengusulan berjalan menang walau tanggal sudah lewat (penentu tunggal)", () => {
    expect(periodeDitutup({ tanggalTutup: tutup, sekarang: new Date(tutup.getTime() + 86_400_000), masaBerjalan: true })).toBe(false);
  });
});

describe("ringkasStatusPenetapan (J-04)", () => {
  it("KH-ringkasStatusPenetapan-01: tanpa proposal Terkirim", () => {
    expect(ringkasStatusPenetapan({ terkirim: 0, belumDitugaskan: 0, diusulkan: 0, ditetapkan: 0 })).toBe("Tidak ada proposal");
  });

  it("KH-ringkasStatusPenetapan-02: ada proposal tetapi belum ada usulan maupun penetapan", () => {
    expect(ringkasStatusPenetapan({ terkirim: 6, belumDitugaskan: 6, diusulkan: 0, ditetapkan: 0 })).toBe("Belum disusun");
  });

  it("KH-ringkasStatusPenetapan-03: usulan sudah disusun, belum ditetapkan", () => {
    expect(ringkasStatusPenetapan({ terkirim: 6, belumDitugaskan: 6, diusulkan: 6, ditetapkan: 0 })).toBe("Usulan menunggu penetapan");
  });

  it("KH-ringkasStatusPenetapan-04: sebagian ditetapkan, sisanya belum punya usulan", () => {
    expect(ringkasStatusPenetapan({ terkirim: 6, belumDitugaskan: 2, diusulkan: 0, ditetapkan: 4 })).toBe("Sebagian ditetapkan");
  });

  it("KH-ringkasStatusPenetapan-05: seluruh proposal sudah punya penugasan tetap", () => {
    expect(ringkasStatusPenetapan({ terkirim: 6, belumDitugaskan: 0, diusulkan: 0, ditetapkan: 6 })).toBe("Seluruhnya ditetapkan");
  });
});

describe("penomoran halaman (pilihan di URL)", () => {
  it("KH-halamanDariUrl-01: nilai sah dipakai apa adanya", () => {
    expect(halamanDariUrl("3", 10)).toBe(3);
  });

  it("KH-halamanDariUrl-02: nol, negatif, dan bukan angka menjadi halaman 1", () => {
    expect(halamanDariUrl("0", 10)).toBe(1);
    expect(halamanDariUrl("-4", 10)).toBe(1);
    expect(halamanDariUrl("abc", 10)).toBe(1);
    expect(halamanDariUrl(undefined, 10)).toBe(1);
  });

  it("KH-halamanDariUrl-03: melampaui jumlah halaman dijepit ke halaman terakhir", () => {
    expect(halamanDariUrl("99", 4)).toBe(4);
  });

  it("KH-halamanDariUrl-04: parameter berulang memakai nilai pertama; jumlah halaman 0 tetap halaman 1", () => {
    expect(halamanDariUrl(["2", "5"], 10)).toBe(2);
    expect(halamanDariUrl("5", 0)).toBe(1);
  });

  it("KH-jumlahHalaman-01: pembulatan ke atas, kosong = 1 halaman, ukuran tidak sah = 1", () => {
    expect(jumlahHalaman(0, 50)).toBe(1);
    expect(jumlahHalaman(50, 50)).toBe(1);
    expect(jumlahHalaman(51, 50)).toBe(2);
    expect(jumlahHalaman(10_000, 50)).toBe(200);
    expect(jumlahHalaman(10, 0)).toBe(1);
    expect(jumlahHalaman(Number.NaN, 50)).toBe(1);
  });
});
