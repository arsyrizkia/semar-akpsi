import { describe, expect, it } from "vitest";
import { AMBANG_KEYAKINAN } from "@/lib/kontrak/tipe";
import { tingkatKeyakinan } from "@/components/ui/bar-keyakinan";
import { buatTokenSso, verifikasiTokenSso, buatSesiSemar, verifikasiSesiBima, verifikasiSesiSemar, jalurAman } from "@/lib/sesi";
import { BimaGagalError, buatKlienBima } from "@/lib/bima/client";
import { buatDocx, hitungKataContoh, susunContoh } from "@/lib/contoh/proposal";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";

describe("tingkat keyakinan (ambang contoh)", () => {
  it("memetakan ambang 0,8 dan 0,5", () => {
    expect(AMBANG_KEYAKINAN).toEqual({ tinggi: 0.8, sedang: 0.5 });
    expect(tingkatKeyakinan(0.8)).toBe("Tinggi");
    expect(tingkatKeyakinan(0.79)).toBe("Sedang");
    expect(tingkatKeyakinan(0.5)).toBe("Sedang");
    expect(tingkatKeyakinan(0.49)).toBe("Rendah");
  });
});

describe("sesi dan token", () => {
  it("token SSO dan sesi memiliki audiens berbeda", async () => {
    const sso = await buatTokenSso("reviewer-1");
    expect((await verifikasiTokenSso(sso))?.idBima).toBe("reviewer-1");
    expect(await verifikasiSesiSemar(sso)).toBeNull();
    const sesi = await buatSesiSemar("reviewer-1");
    expect(await verifikasiTokenSso(sesi)).toBeNull();
    expect(await verifikasiSesiBima(sesi)).toBeNull();
    expect(await verifikasiTokenSso("sampah")).toBeNull();
  });
  it("jalurAman menolak open redirect", () => {
    expect(jalurAman("//evil.com")).toBe("/");
    expect(jalurAman("https://evil.com")).toBe("/");
    expect(jalurAman("/tim-kerja/templat")).toBe("/tim-kerja/templat");
  });
});

describe("klien BIMA: ulang otomatis maksimal 2 kali (NFR 4.4)", () => {
  const ok = () => new Response(JSON.stringify({ reviewer: [] }), { status: 200 });
  it("berhasil pada percobaan ketiga", async () => {
    let n = 0;
    const k = buatKlienBima({ baseUrl: "http://x", jedaMs: 0, fetchImpl: (async () => (++n < 3 ? new Response("", { status: 503 }) : ok())) as typeof fetch });
    await expect(k.ambilDaftarReviewer()).resolves.toEqual([]);
    expect(n).toBe(3);
  });
  it("gagal setelah 3 percobaan total", async () => {
    let n = 0;
    const k = buatKlienBima({ baseUrl: "http://x", jedaMs: 0, fetchImpl: (async () => (++n, new Response("", { status: 500 }))) as typeof fetch });
    await expect(k.ambilDaftarReviewer()).rejects.toBeInstanceOf(BimaGagalError);
    expect(n).toBe(3);
  });
  it("tidak mengulang galat 4xx", async () => {
    let n = 0;
    const k = buatKlienBima({ baseUrl: "http://x", jedaMs: 0, fetchImpl: (async () => (++n, new Response("", { status: 404 }))) as typeof fetch });
    await expect(k.ambilProposal("PRP-X")).rejects.toBeInstanceOf(BimaGagalError);
    expect(n).toBe(1);
  });
  it("mengulang galat jaringan", async () => {
    let n = 0;
    const k = buatKlienBima({
      baseUrl: "http://x",
      jedaMs: 0,
      fetchImpl: (async () => {
        if (++n < 2) throw new Error("ECONNRESET");
        return ok();
      }) as typeof fetch,
    });
    await k.ambilDaftarReviewer();
    expect(n).toBe(2);
  });
});

describe("proposal contoh", () => {
  const batas: Record<string, number> = { Ringkasan: 300, Pendahuluan: 1000, "Tinjauan Pustaka": 1000, Metode: 1200, "Hasil yang Diharapkan": 500 };
  const kata = (v: "a" | "b" | "c" | "d") => {
    const d = susunContoh(v);
    return { d, lewat: Object.entries(batas).filter(([b, m]) => hitungKataContoh(d.bagian[b]) > m).map(([b]) => b) };
  };
  it("a dan d lolos semua batas kata, kata kunci tepat lima", () => {
    for (const v of ["a", "d"] as const) {
      const { d, lewat } = kata(v);
      expect(lewat).toEqual([]);
      expect(d.kataKunci.split(";")).toHaveLength(5);
      expect(d.jumlahPustaka).toBe(d.jumlahDikutip);
    }
  });
  it("b gagal jumlah kata hanya di Metode", () => {
    expect(kata("b").lewat).toEqual(["Metode"]);
  });
  it("c gagal kata kunci (4) dan sitasi (9 referensi, 7 dikutip)", () => {
    const { d } = kata("c");
    expect(d.kataKunci.split(";")).toHaveLength(4);
    expect(d.jumlahPustaka).toBe(9);
    const teks = Object.entries(d.bagian).filter(([k]) => k !== "Daftar Pustaka").map((x) => x[1]).join(" ");
    expect(new Set([...teks.matchAll(/\[(\d+)\]/g)].map((m) => m[1])).size).toBe(7);
  });
  it("DOCX terbentuk", async () => {
    const buf = await buatDocx(susunContoh("a"));
    expect(buf.subarray(0, 2).toString()).toBe("PK");
  });
});

describe("turunan butir dari templat", () => {
  it("membuat butir bagian wajib, batas kata, dan lampiran", () => {
    const b = turunkanButirDariTemplat([{ nama: "Ringkasan", batasKata: 300, wajib: true }, { nama: "Kata Kunci", batasKata: null, wajib: true }], ["Surat Pernyataan Mitra"]);
    expect(b.map((x) => x.parameter.tipe)).toEqual(["bagian_wajib", "batas_kata", "bagian_wajib", "lampiran_wajib"]);
    expect(b.every((x) => x.asal === "templat" && x.jenis === "deterministik")).toBe(true);
  });
});
