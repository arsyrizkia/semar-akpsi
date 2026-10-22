// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475): diturunkan dari spesifikasi metode; menjalankan setiap cabang/jalur.
import { describe, expect, it } from "vitest";
import { BimaGagalError, buatKlienBima } from "@/lib/bima/client";
import { buatStubBima } from "../stub/bima";

describe("klien BIMA: ulang otomatis maksimal 2 kali (NFR 4.4)", () => {
  const ok = () => new Response(JSON.stringify({ reviewer: [] }), { status: 200 });
  it("KP-klienBima-01: berhasil pada percobaan ketiga", async () => {
    let n = 0;
    const k = buatKlienBima({ baseUrl: "http://x", jedaMs: 0, fetchImpl: (async () => (++n < 3 ? new Response("", { status: 503 }) : ok())) as typeof fetch });
    await expect(k.ambilDaftarReviewer()).resolves.toEqual([]);
    expect(n).toBe(3);
  });
  it("KP-klienBima-02: gagal setelah 3 percobaan total", async () => {
    let n = 0;
    const k = buatKlienBima({ baseUrl: "http://x", jedaMs: 0, fetchImpl: (async () => (++n, new Response("", { status: 500 }))) as typeof fetch });
    await expect(k.ambilDaftarReviewer()).rejects.toBeInstanceOf(BimaGagalError);
    expect(n).toBe(3);
  });
  it("KP-klienBima-03: tidak mengulang galat 4xx", async () => {
    let n = 0;
    const k = buatKlienBima({ baseUrl: "http://x", jedaMs: 0, fetchImpl: (async () => (++n, new Response("", { status: 404 }))) as typeof fetch });
    await expect(k.ambilProposal("PRP-X")).rejects.toBeInstanceOf(BimaGagalError);
    expect(n).toBe(1);
  });
  it("KP-klienBima-04: mengulang galat jaringan", async () => {
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
  it("KP-klienBima-05: stub BIMA memuat reviewer, mengirim penugasan, dan mencatat panggilan", async () => {
    const stub = buatStubBima({ gagalDulu: 1, reviewer: [{ idBima: "rvw-1", kode: "RVW-1", nama: "Reviewer Satu", institusi: "Universitas Contoh", bidang: "Informatika", bersedia: true }] });
    const k = buatKlienBima({ baseUrl: "http://bima.stub", jedaMs: 0, fetchImpl: stub.fetch });
    const daftar = await k.ambilDaftarReviewer();
    expect(daftar).toHaveLength(1);
    expect(stub.jumlahPanggilan()).toBe(2); // satu 503, lalu berhasil
    await k.kirimStatusProposal("PRP-X", "Terkirim");
    expect(stub.panggilan.at(-1)).toMatchObject({ jalur: "/api/bima/status", metode: "POST", badan: { idProposal: "PRP-X", statusBima: "Terkirim" } });
  });
  it("KP-klienBima-06: ambilBerkas mengembalikan bytes dan tipe; berkas tak ada gagal 404 tanpa ulang", async () => {
    const stub = buatStubBima({ berkas: { b1: { bytes: new Uint8Array([1, 2, 3]), tipe: "application/pdf" } } });
    const k = buatKlienBima({ baseUrl: "http://bima.stub", jedaMs: 0, fetchImpl: stub.fetch });
    const b = await k.ambilBerkas("b1");
    expect([...b.bytes]).toEqual([1, 2, 3]);
    expect(b.tipe).toBe("application/pdf");
    await expect(k.ambilBerkas("tidak-ada")).rejects.toBeInstanceOf(BimaGagalError);
  });
  it("KP-klienBima-07: setiap metode memanggil jalur dan metode HTTP yang benar", async () => {
    const stub = buatStubBima();
    const k = buatKlienBima({ baseUrl: "http://bima.stub", jedaMs: 0, fetchImpl: stub.fetch });
    await k.kirimPenugasan({ penugasan: [] } as never);
    await k.kirimKeputusan({ idProposal: "PRP-X" } as never);
    await k.ambilKotakMasuk();
    expect(stub.panggilan.map((p) => `${p.metode} ${p.jalur}`)).toEqual(["POST /api/bima/penugasan", "POST /api/bima/keputusan", "GET /api/bima/kotak-masuk"]);
  });
  it("KP-klienBima-08: ambilProposal mengodekan id pada URL", async () => {
    const stub = buatStubBima({ statusTetap: 404 });
    const k = buatKlienBima({ baseUrl: "http://bima.stub", jedaMs: 0, fetchImpl: stub.fetch });
    await expect(k.ambilProposal("PRP 1/2")).rejects.toBeInstanceOf(BimaGagalError);
    expect(stub.panggilan[0].jalur).toBe("/api/bima/proposal/PRP%201%2F2");
  });
});
