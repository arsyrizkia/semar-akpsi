// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475).
// Sumber rencana uji: Method Specification MS-06 periksaSemantik (batas waktu, percobaan ulang, status), MS-07 cocokkanKutipan, MS-08 siapkanTeksTanpaIdentitas.
// Layanan LLM diganti stub (hlm. 471): tests/unit/stub/llm.ts.
import { describe, expect, it } from "vitest";
import type { ButirCek, DokumenPeriksa } from "@/lib/kontrak/tipe";
import { PERCOBAAN_ULANG_LLM } from "@/lib/llm/konfigurasi";
import { nilaiSemantikDenganOpsi } from "@/lib/pemeriksa/semantik/mesin";
import { PENANDA_IDENTITAS, cariKutipan, siapkanTeksTanpaIdentitas } from "@/lib/pemeriksa/semantik/teks";
import { buatStubLlm, jawabanMemenuhi, jawabanTidakMemenuhi } from "./../stub/llm";

const butir = (kode: string, bagian: string): ButirCek => ({
  id: `id-${kode}`,
  kode,
  deskripsi: `Butir ${kode}`,
  jenis: "semantik",
  asal: "manual",
  komponen: "1. Kesesuaian isi per bagian",
  pemeriksa: "nilaiSemantik",
  parameter: { tipe: "semantik", bagian },
  aturanHitung: null,
  pertanyaan: `Apakah ${bagian} memuat tujuan?`,
  contohJawaban: null,
  status: "Aktif",
});
const dokumen: Pick<DokumenPeriksa, "teksPerBagian" | "teksLampiran"> = {
  teksPerBagian: { Ringkasan: "Penelitian ini penting.\nTujuan penelitian adalah membangun model prediksi curah hujan." },
  teksLampiran: {},
};
const KUTIPAN = "Tujuan penelitian adalah membangun model prediksi curah hujan.";
const opsi = (p: ReturnType<typeof buatStubLlm>["penyedia"]) => ({ penyedia: p, tiruan: false, jedaMs: 0 });

describe("MS-06 periksaSemantik: alur status dengan stub LLM", () => {
  it("KP-periksaSemantik-01: sukses pada percobaan pertama: Memenuhi dengan kutipan dan keyakinan, satu panggilan", async () => {
    const s = buatStubLlm([jawabanMemenuhi(KUTIPAN, 0.93)]);
    const [r] = await nilaiSemantikDenganOpsi(dokumen, [butir("ISI-01", "Ringkasan")], opsi(s.penyedia));
    expect(r.percobaan).toBe(1);
    expect(r.hasil).toMatchObject({ status: "Memenuhi", kutipan: KUTIPAN, tingkatKeyakinan: 0.93, rekomendasi: "Memenuhi" });
    expect(s.permintaan).toHaveLength(1);
  });
  it("KP-periksaSemantik-02: batas waktu pada percobaan pertama lalu sukses: percobaan 2, hasil normal", async () => {
    const s = buatStubLlm([new Error("batas waktu 15 detik terlampaui"), jawabanMemenuhi(KUTIPAN)]);
    const [r] = await nilaiSemantikDenganOpsi(dokumen, [butir("ISI-01", "Ringkasan")], opsi(s.penyedia));
    expect(r.percobaan).toBe(2);
    expect(r.hasil.status).toBe("Memenuhi");
    expect(s.permintaan).toHaveLength(2);
  });
  it("KP-periksaSemantik-03: batas waktu dua kali: Belum ada rekomendasi tanpa rekomendasi, kutipan, dan keyakinan; alasan memuat galat terakhir", async () => {
    const s = buatStubLlm([new Error("batas waktu 15 detik terlampaui")]);
    const [r] = await nilaiSemantikDenganOpsi(dokumen, [butir("ISI-01", "Ringkasan")], opsi(s.penyedia));
    expect(s.permintaan).toHaveLength(PERCOBAAN_ULANG_LLM);
    expect(r.hasil).toMatchObject({ status: "Belum ada rekomendasi", rekomendasi: null, kutipan: null, tingkatKeyakinan: null });
    expect(r.hasil.alasanSistem).toContain("batas waktu");
  });
  it("KP-periksaSemantik-04: kutipan palsu: Perlu diperiksa manual, kutipan dibuang, rekomendasi semula tetap tercatat", async () => {
    const s = buatStubLlm([jawabanMemenuhi("Kalimat yang tidak pernah ada di naskah.")]);
    const [r] = await nilaiSemantikDenganOpsi(dokumen, [butir("ISI-01", "Ringkasan")], opsi(s.penyedia));
    expect(r.hasil).toMatchObject({ status: "Perlu diperiksa manual", kutipan: null, rekomendasi: "Memenuhi" });
  });
  it("KP-periksaSemantik-05: kutipan dengan tanda kutip lurus dan spasi berbeda tetap dikenali (tidak jatuh ke Perlu diperiksa manual)", async () => {
    const teks = { teksPerBagian: { Ringkasan: "Penulis menyebut “model prediksi”\nsebagai inti." }, teksLampiran: {} };
    const s = buatStubLlm([jawabanMemenuhi('menyebut "model prediksi" sebagai inti.')]);
    const [r] = await nilaiSemantikDenganOpsi(teks, [butir("ISI-01", "Ringkasan")], opsi(s.penyedia));
    expect(r.hasil.status).toBe("Memenuhi");
  });
  it("KP-periksaSemantik-06: Tidak memenuhi tanpa kutipan diterima; satu butir gagal tidak menggagalkan butir lain (pekerja bersamaan)", async () => {
    const s = buatStubLlm([jawabanTidakMemenuhi(0.8), new Error("galat"), new Error("galat")]);
    const hasil = await nilaiSemantikDenganOpsi(dokumen, [butir("A", "Ringkasan"), butir("B", "Ringkasan")], { ...opsi(s.penyedia), paralel: 1 });
    expect(hasil.map((h) => h.hasil.status)).toEqual(["Tidak memenuhi", "Belum ada rekomendasi"]);
  });
  it("KP-periksaSemantik-07: skenario paksa tiruan 'kutipan-salah' berlaku pada butir pertama saja", async () => {
    const s = buatStubLlm([jawabanMemenuhi(KUTIPAN)]);
    const hasil = await nilaiSemantikDenganOpsi(dokumen, [butir("A", "Ringkasan"), butir("B", "Ringkasan")], { penyedia: s.penyedia, tiruan: true, jedaMs: 0, skenario: "kutipan-salah" });
    expect(hasil[0].hasil.status).toBe("Perlu diperiksa manual");
    expect(hasil[1].hasil.status).toBe("Memenuhi");
  });
  it("KP-periksaSemantik-08: skenario paksa tiruan 'tidak-merespons' menghasilkan Belum ada rekomendasi dan label tiruan", async () => {
    const s = buatStubLlm([jawabanMemenuhi(KUTIPAN)]);
    const [r] = await nilaiSemantikDenganOpsi(dokumen, [butir("A", "Ringkasan")], { penyedia: s.penyedia, tiruan: true, jedaMs: 0, skenario: "tidak-merespons" });
    expect(r.hasil).toMatchObject({ status: "Belum ada rekomendasi", tiruan: true });
    expect(s.permintaan).toHaveLength(0);
  });
});

describe("MS-07 cocokkanKutipan / cariKutipan: cabang", () => {
  it("KP-cariKutipan-01: cabang token kosong (null, undefined, spasi) dan teks kosong mengembalikan null", () => {
    expect(cariKutipan("abc", null)).toBeNull();
    expect(cariKutipan("abc", undefined)).toBeNull();
    expect(cariKutipan("abc", "  ")).toBeNull();
    expect(cariKutipan("", "abc")).toBeNull();
  });
  it("KP-cariKutipan-02: cabang cocok mengembalikan mulai dan akhir; tanda kutip tunggal lengkung kiri/kanan setara apostrof", () => {
    const teks = "xx it’s fine";
    const r = cariKutipan(teks, "it's fine");
    expect(r).toEqual({ mulai: 3, akhir: teks.length });
  });
  it("KP-cariKutipan-03: cabang tidak cocok: huruf besar-kecil dibedakan", () => {
    expect(cariKutipan("Tujuan", "tujuan")).toBeNull();
  });
});

describe("MS-08 siapkanTeksTanpaIdentitas: cabang", () => {
  it("KP-siapkanTeksTanpaIdentitas-03: identitas lain (mis. email) dibuang; nilai kosong, null, dan lebih pendek dari tiga huruf dilewati", () => {
    const h = siapkanTeksTanpaIdentitas("Kontak: sekar@contoh.ac.id dan ab.", { lain: ["sekar@contoh.ac.id", "ab", null, undefined, "  "] });
    expect(h).toBe(`Kontak: ${PENANDA_IDENTITAS} dan ab.`);
  });
  it("KP-siapkanTeksTanpaIdentitas-04: varian nama: tanpa gelar depan dan belakang dibuang walau teks hanya memuat varian itu; yang terpanjang diganti lebih dulu", () => {
    const h = siapkanTeksTanpaIdentitas("Prof. Dr. Budi Santoso, M.T. menulis; Budi Santoso juga.", { nama: "Prof. Dr. Budi Santoso, M.T." });
    expect(h).not.toMatch(/Budi|Santoso/);
    // tidak ada penanda ganda berurutan akibat penggantian sebagian
    expect(h).not.toContain(`${PENANDA_IDENTITAS} ${PENANDA_IDENTITAS}`);
  });
  it("KP-siapkanTeksTanpaIdentitas-05: nama tanpa koma dan tanpa gelar menghasilkan satu varian", () => {
    expect(siapkanTeksTanpaIdentitas("Rani Wulan hadir.", { nama: "Rani Wulan" })).toBe(`${PENANDA_IDENTITAS} hadir.`);
  });
});
