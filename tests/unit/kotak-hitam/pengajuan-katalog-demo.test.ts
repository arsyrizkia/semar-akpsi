// Uji kotak hitam katalog Navigator demo (CRC NavigatorDemo; pemisahan "Pindah layar" dan "Pasang skenario"): pencocokan alamat ke layar.
import { describe, expect, it } from "vitest";
import { KATALOG_JENDELA, alamatPindah, alamatSkenario, cariSkenario, jendelaDariJalur } from "@/lib/demo/katalog";

describe("jendelaDariJalur", () => {
  const kode = (jalur: string) => jendelaDariJalur(jalur)?.kode;
  it("KH-jendelaDariJalur-01: layar induk dan layar turunan dibedakan", () => {
    expect(kode("/tim-kerja/templat")).toBe("J-02");
    expect(kode("/tim-kerja/templat/abc-123/susun")).toBe("J-02b");
    expect(kode("/tim-kerja/aturan")).toBe("J-03");
    expect(kode("/tim-kerja/aturan/uji")).toBe("J-03b");
    expect(kode("/tim-kerja/penugasan")).toBe("J-04");
    expect(kode("/tim-kerja/penugasan/per-1")).toBe("J-04b");
    expect(kode("/tim-kerja/pemantauan")).toBe("J-05");
    expect(kode("/tim-kerja/proposal/PRP-2026-0004")).toBe("J-05b");
    expect(kode("/reviewer/pemeriksaan/pn-1")).toBe("J-08");
    expect(kode("/reviewer/pemeriksaan/pn-1/keputusan")).toBe("J-08b");
  });
  it("KH-jendelaDariJalur-02: layar lain dikenali, alamat tak dikenal tidak cocok dengan jendela mana pun", () => {
    expect(kode("/masuk")).toBe("J-01");
    expect(kode("/pengusul/hasil/PRP-2026-0001")).toBe("J-06");
    expect(kode("/reviewer/penugasan")).toBe("J-07");
    expect(kode("/bima/pengajuan")).toBe("BIMA-1");
    expect(kode("/bima/kotak-masuk")).toBe("BIMA-2");
    expect(kode("/tidak-ada")).toBeUndefined();
    expect(kode("/tim-kerja/templatx")).toBeUndefined();
  });
});

describe("alamat Pindah layar dan Pasang skenario", () => {
  it("KH-alamatDemo-01: pindah layar memakai /demo/pindah, pasang skenario memakai /demo/mulai", () => {
    expect(alamatPindah("J-05b", "PRP-2026-0004")).toBe("/demo/pindah?j=J-05b&p=PRP-2026-0004");
    expect(alamatPindah("J-02")).toBe("/demo/pindah?j=J-02");
    expect(alamatSkenario("J-04", "skala")).toBe("/demo/mulai?j=J-04&s=skala");
  });
  it("KH-alamatDemo-02: setiap layar punya alamat pindah, kode unik, dan layar turunan menyebut induk yang ada", () => {
    const kodeSemua = KATALOG_JENDELA.map((j) => j.kode);
    expect(new Set(kodeSemua).size).toBe(kodeSemua.length);
    for (const j of KATALOG_JENDELA) {
      expect(j.alamatPindah.startsWith("/"), j.kode).toBe(true);
      if (j.induk) expect(kodeSemua, j.kode).toContain(j.induk);
    }
    for (const k of ["J-02b", "J-03b", "J-04b", "J-05b", "J-08b"]) expect(kodeSemua).toContain(k);
  });
  it("KH-alamatDemo-03: skenario layar turunan dikenal (siap dipasang lewat /demo/mulai)", () => {
    expect(cariSkenario("J-02b", "draf")).toBeDefined();
    expect(cariSkenario("J-04b", "kekurangan")).toBeDefined();
    expect(cariSkenario("J-08b", "draf")).toBeDefined();
    expect(cariSkenario("J-08b", "tidak-ada")).toBeUndefined();
  });
});
