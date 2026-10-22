// Uji kotak hitam (Dennis dkk., 2015, hlm. 471-475): diturunkan dari kontrak, spesifikasi, dan real use case, tanpa melihat isi metode.
import { describe, expect, it } from "vitest";
import { AMBANG_KEYAKINAN } from "@/lib/kontrak/tipe";
import { tingkatKeyakinan } from "@/components/ui/bar-keyakinan";
import { buatTokenSso, verifikasiTokenSso, buatSesiSemar, verifikasiSesiBima, verifikasiSesiSemar, jalurAman } from "@/lib/sesi";
import { buatDocx, hitungKataContoh, susunContoh } from "@/lib/contoh/proposal";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";

describe("tingkat keyakinan (ambang contoh)", () => {
  it("KH-tingkatKeyakinan-01: memetakan ambang 0,8 dan 0,5", () => {
    expect(AMBANG_KEYAKINAN).toEqual({ tinggi: 0.8, sedang: 0.5 });
    expect(tingkatKeyakinan(0.8)).toBe("Tinggi");
    expect(tingkatKeyakinan(0.79)).toBe("Sedang");
    expect(tingkatKeyakinan(0.5)).toBe("Sedang");
    expect(tingkatKeyakinan(0.49)).toBe("Rendah");
  });
});

describe("sesi dan token", () => {
  it("KH-sesiToken-01: token SSO dan sesi memiliki audiens berbeda", async () => {
    const sso = await buatTokenSso("reviewer-1");
    expect((await verifikasiTokenSso(sso))?.idBima).toBe("reviewer-1");
    expect(await verifikasiSesiSemar(sso)).toBeNull();
    const sesi = await buatSesiSemar("reviewer-1");
    expect(await verifikasiTokenSso(sesi)).toBeNull();
    expect(await verifikasiSesiBima(sesi)).toBeNull();
    expect(await verifikasiTokenSso("sampah")).toBeNull();
  });
  it("KH-sesiToken-02: jalurAman menolak open redirect", () => {
    expect(jalurAman("//evil.com")).toBe("/");
    expect(jalurAman("https://evil.com")).toBe("/");
    expect(jalurAman("/tim-kerja/templat")).toBe("/tim-kerja/templat");
  });
});

describe("proposal contoh", () => {
  const batas: Record<string, number> = { Ringkasan: 300, Pendahuluan: 1000, "Tinjauan Pustaka": 1000, Metode: 1200, "Hasil yang Diharapkan": 500 };
  const kata = (v: "a" | "b" | "c" | "d") => {
    const d = susunContoh(v);
    return { d, lewat: Object.entries(batas).filter(([b, m]) => hitungKataContoh(d.bagian[b]) > m).map(([b]) => b) };
  };
  it("KH-proposalContoh-01: a dan d lolos semua batas kata, kata kunci tepat lima", () => {
    for (const v of ["a", "d"] as const) {
      const { d, lewat } = kata(v);
      expect(lewat).toEqual([]);
      expect(d.kataKunci.split(";")).toHaveLength(5);
      expect(d.jumlahPustaka).toBe(d.jumlahDikutip);
    }
  });
  it("KH-proposalContoh-02: b gagal jumlah kata hanya di Metode", () => {
    expect(kata("b").lewat).toEqual(["Metode"]);
  });
  it("KH-proposalContoh-03: c gagal kata kunci (4) dan sitasi (9 referensi, 7 dikutip)", () => {
    const { d } = kata("c");
    expect(d.kataKunci.split(";")).toHaveLength(4);
    expect(d.jumlahPustaka).toBe(9);
    const teks = Object.entries(d.bagian).filter(([k]) => k !== "Daftar Pustaka").map((x) => x[1]).join(" ");
    expect(new Set([...teks.matchAll(/\[(\d+)\]/g)].map((m) => m[1])).size).toBe(7);
  });
  it("KH-proposalContoh-04: DOCX terbentuk", async () => {
    const buf = await buatDocx(susunContoh("a"));
    expect(buf.subarray(0, 2).toString()).toBe("PK");
  });
});

describe("turunan butir dari templat", () => {
  it("KH-turunkanButir-01: membuat butir bagian wajib, batas kata, dan lampiran", () => {
    const b = turunkanButirDariTemplat([{ nama: "Ringkasan", batasKata: 300, wajib: true }, { nama: "Kata Kunci", batasKata: null, wajib: true }], ["Surat Pernyataan Mitra"]);
    expect(b.map((x) => x.parameter.tipe)).toEqual(["bagian_wajib", "batas_kata", "bagian_wajib", "lampiran_wajib"]);
    expect(b.every((x) => x.asal === "templat" && x.jenis === "deterministik")).toBe(true);
  });
});
