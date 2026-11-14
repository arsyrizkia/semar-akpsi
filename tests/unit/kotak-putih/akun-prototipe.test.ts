// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): setiap cabang idBimaDariMasukan, kataSandiBenar, dan cocokkanAkun
// (src/lib/bima/akun-prototipe.ts; Method Specification pencocokan akun masuk BIMA tiruan).
import { describe, expect, it } from "vitest";
import { cocokkanAkun, idBimaDariMasukan, kataSandiBenar, type AkunPrototipe } from "@/lib/bima/akun-prototipe";
import { KATA_SANDI_LAMA_DITERIMA, KATA_SANDI_PROTOTIPE } from "@/lib/bima/akun-demo";

const DAFTAR: AkunPrototipe[] = [
  { idBima: "a-1", nama: "Budi Santoso", username: "budi.santoso", email: "budi.santoso@semar.id" },
  { idBima: "b-2", nama: "Sari Dewi", username: "sari.dewi", email: "sari.dewi@semar.id" },
];

describe("idBimaDariMasukan (cabang)", () => {
  it("KP-idBimaDariMasukan-01: masukan kosong -> null (cabang !k)", () => {
    expect(idBimaDariMasukan("", DAFTAR)).toBeNull();
    expect(idBimaDariMasukan(" \t ", DAFTAR)).toBeNull();
  });
  it("KP-idBimaDariMasukan-02: cocok username (cabang username)", () => {
    expect(idBimaDariMasukan("BUDI.santoso", DAFTAR)).toBe("a-1");
  });
  it("KP-idBimaDariMasukan-03: cocok email (cabang email, username tidak cocok)", () => {
    expect(idBimaDariMasukan("sari.dewi@semar.id", DAFTAR)).toBe("b-2");
  });
  it("KP-idBimaDariMasukan-04: cocok idBima lama (cabang idBima)", () => {
    expect(idBimaDariMasukan("B-2", DAFTAR)).toBe("b-2");
  });
  it("KP-idBimaDariMasukan-05: tidak cocok apa pun -> masukan huruf kecil dikembalikan (akun massal di basis data)", () => {
    expect(idBimaDariMasukan("RVW-Skala-0007", DAFTAR)).toBe("rvw-skala-0007");
  });
});

describe("kataSandiBenar (cabang)", () => {
  it("KP-kataSandiBenar-01: kata sandi prototipe", () => {
    expect(kataSandiBenar(KATA_SANDI_PROTOTIPE)).toBe(true);
  });
  it("KP-kataSandiBenar-02: kata sandi lama (cabang kedua ||)", () => {
    expect(kataSandiBenar(KATA_SANDI_LAMA_DITERIMA)).toBe(true);
  });
  it("KP-kataSandiBenar-03: selain keduanya, termasuk awalan dan akhiran spasi", () => {
    expect(kataSandiBenar(` ${KATA_SANDI_PROTOTIPE}`)).toBe(false);
    expect(kataSandiBenar("Semar2026")).toBe(false);
  });
});

describe("cocokkanAkun (cabang)", () => {
  it("KP-cocokkanAkun-01: id kosong -> null walau kata sandi benar", () => {
    expect(cocokkanAkun("", KATA_SANDI_PROTOTIPE, DAFTAR)).toBeNull();
  });
  it("KP-cocokkanAkun-02: kata sandi salah -> null walau akun cocok", () => {
    expect(cocokkanAkun("budi.santoso", "x", DAFTAR)).toBeNull();
  });
  it("KP-cocokkanAkun-03: akun dan kata sandi cocok -> idBima", () => {
    expect(cocokkanAkun("budi.santoso@semar.id", KATA_SANDI_PROTOTIPE, DAFTAR)).toBe("a-1");
  });
});
