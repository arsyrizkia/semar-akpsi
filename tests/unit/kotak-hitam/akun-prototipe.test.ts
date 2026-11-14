// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475). Sumber: Class Diagram AkunBima (idBima, nama, peran) dan Contract masuk BIMA tiruan:
// masuk dengan username, email, atau idBima lama (tidak peka huruf besar) beserta kata sandi prototipe.
import { describe, expect, it } from "vitest";
import { AKUN_PROTOTIPE, cocokkanAkun } from "@/lib/bima/akun-prototipe";
import { KATA_SANDI_PROTOTIPE } from "@/lib/bima/akun-demo";

describe("cocokkanAkun", () => {
  it("KH-cocokkanAkun-01: username + kata sandi benar -> idBima akun itu (nilai sah)", () => {
    expect(cocokkanAkun("ratna.wulandari", KATA_SANDI_PROTOTIPE)).toBe("dppm-pengelola");
  });
  it("KH-cocokkanAkun-02: email + kata sandi benar -> idBima akun itu", () => {
    expect(cocokkanAkun("ratna.wulandari@semar.id", KATA_SANDI_PROTOTIPE)).toBe("dppm-pengelola");
  });
  it("KH-cocokkanAkun-03: idBima lama + kata sandi benar tetap diterima", () => {
    expect(cocokkanAkun("reviewer-3", KATA_SANDI_PROTOTIPE)).toBe("reviewer-3");
  });
  it("KH-cocokkanAkun-04: huruf besar dan spasi tepi tidak berpengaruh pada isian akun", () => {
    expect(cocokkanAkun("  Ratna.Wulandari@SEMAR.id ", KATA_SANDI_PROTOTIPE)).toBe("dppm-pengelola");
    expect(cocokkanAkun("PENGUSUL-2", KATA_SANDI_PROTOTIPE)).toBe("pengusul-2");
  });
  it("KH-cocokkanAkun-05: kata sandi salah, kosong, atau beda huruf besar -> null (batas tidak sah)", () => {
    expect(cocokkanAkun("ratna.wulandari", "salah")).toBeNull();
    expect(cocokkanAkun("ratna.wulandari", "")).toBeNull();
    expect(cocokkanAkun("ratna.wulandari", KATA_SANDI_PROTOTIPE.toLowerCase())).toBeNull();
  });
  it("KH-cocokkanAkun-06: isian akun kosong atau hanya spasi -> null", () => {
    expect(cocokkanAkun("", KATA_SANDI_PROTOTIPE)).toBeNull();
    expect(cocokkanAkun("   ", KATA_SANDI_PROTOTIPE)).toBeNull();
  });
  it("KH-cocokkanAkun-07: kata sandi lama \"simulasi\" tetap diterima sementara (kompatibilitas skrip)", () => {
    expect(cocokkanAkun("dppm-pengelola", "simulasi")).toBe("dppm-pengelola");
  });
});

describe("AKUN_PROTOTIPE (data)", () => {
  it("KH-AKUN_PROTOTIPE-01: username berformat namadepan.namabelakang huruf kecil tanpa gelar, email username@semar.id", () => {
    for (const a of AKUN_PROTOTIPE) {
      expect(a.username).toMatch(/^[a-z]+\.[a-z]+$/);
      expect(a.email).toBe(`${a.username}@semar.id`);
      expect(a.nama.toLowerCase()).toContain(a.username.split(".")[0]);
    }
  });
  it("KH-AKUN_PROTOTIPE-02: username, email, dan idBima unik; idBima lama tidak berubah", () => {
    expect(new Set(AKUN_PROTOTIPE.map((a) => a.username)).size).toBe(AKUN_PROTOTIPE.length);
    expect(new Set(AKUN_PROTOTIPE.map((a) => a.idBima)).size).toBe(AKUN_PROTOTIPE.length);
    expect(AKUN_PROTOTIPE.map((a) => a.idBima)).toEqual(
      expect.arrayContaining(["dppm-pengelola", "dppm-anggota", "pengusul-1", "pengusul-2", "pengusul-3", "reviewer-1", "reviewer-2", "reviewer-3", "reviewer-4", "reviewer-5", "reviewer-6"]),
    );
  });
});
