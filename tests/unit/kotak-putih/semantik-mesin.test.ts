// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-06 periksaSemantik, MS-07 cocokkanKutipan, MS-08 siapkanTeksTanpaIdentitas; Layanan LLM diganti stub.
import { describe, expect, it } from "vitest";
import type { ButirCek, DokumenPeriksa, GambarNaskah } from "@/lib/kontrak/tipe";
import { kirimPermintaanTiruan, susunKonten, type JawabanLlm, type PenyediaLlm, type PermintaanLlm } from "@/lib/pemeriksa/semantik/llm";
import { bentukHasil, mintaJawaban, nilaiSemantikDenganOpsi, tentukanSasaran } from "@/lib/pemeriksa/semantik/mesin";
import { PENANDA_IDENTITAS, cocokkanKutipan, siapkanTeksTanpaIdentitas } from "@/lib/pemeriksa/semantik/teks";

const butir = (kode: string, bagian: string, lampiran?: string): ButirCek => ({
  id: `id-${kode}`,
  kode,
  deskripsi: `Butir ${kode}: ${bagian} memuat urgensi dan tujuan`,
  jenis: "semantik",
  asal: "manual",
  komponen: "1. Kesesuaian isi per bagian",
  pemeriksa: "nilaiSemantik",
  parameter: { tipe: "semantik", bagian, ...(lampiran ? { lampiran } : {}) },
  aturanHitung: null,
  pertanyaan: `Apakah ${bagian} memuat urgensi dan tujuan penelitian?`,
  contohJawaban: null,
  status: "Aktif",
});

const dokumen: Pick<DokumenPeriksa, "teksPerBagian" | "teksLampiran"> = {
  teksPerBagian: {
    Ringkasan: "Penelitian ini penting karena urgensi banjir pesisir meningkat.\nTujuan penelitian adalah membangun model prediksi curah hujan harian.",
    Metode: "Metode memakai jaringan saraf tiruan.",
  },
  teksLampiran: { "Surat Pernyataan Mitra": "Dengan ini mitra menyatakan bersedia bekerja sama." },
};

const jawabanBaik: JawabanLlm = { rekomendasi: "Memenuhi", kutipan: "Tujuan penelitian adalah membangun model prediksi curah hujan harian.", alasan: "Ada.", keyakinan: 0.9 };

describe("siapkanTeksTanpaIdentitas", () => {
  it("KP-siapkanTeksTanpaIdentitas-01: membuang nama (dengan dan tanpa gelar), institusi, dan nomor induk", () => {
    const teks = "Diusulkan oleh Dr. Sekar Anindita, M.Sc. dari Universitas Contoh Nusantara (NIDN 0012345678). Sekar Anindita memimpin tim.";
    const hasil = siapkanTeksTanpaIdentitas(teks, { nama: "Dr. Sekar Anindita, M.Sc.", institusi: "Universitas Contoh Nusantara", nomorInduk: "0012345678" });
    expect(hasil).not.toMatch(/Sekar|Anindita|Universitas Contoh|0012345678/i);
    expect(hasil).toContain(PENANDA_IDENTITAS);
  });
  it("KP-siapkanTeksTanpaIdentitas-02: tanpa identitas, teks tidak berubah", () => {
    expect(siapkanTeksTanpaIdentitas("Teks biasa.", {})).toBe("Teks biasa.");
  });
});

describe("tentukanSasaran", () => {
  it("KP-tentukanSasaran-01: butir atas lampiran memakai teks lampiran sebagai sasaran utama", () => {
    const s = tentukanSasaran(dokumen, butir("MIT", "Metode", "Surat Pernyataan Mitra"));
    expect(s.utama).toContain("mitra menyatakan");
    expect(s.pendukung).toContain("jaringan saraf");
  });
});

describe("mintaJawaban (dua percobaan)", () => {
  it("KP-mintaJawaban-01: berhasil pada percobaan kedua", async () => {
    let n = 0;
    const p: PenyediaLlm = async () => {
      if (++n === 1) throw new Error("timeout");
      return jawabanBaik;
    };
    const r = await mintaJawaban(p, { teksUtama: "x", pertanyaan: "q", deskripsi: "d", namaSasaran: "s" }, { jedaMs: 0 });
    expect(r.jawaban).toEqual(jawabanBaik);
    expect(r.percobaan).toBe(2);
  });
  it("KP-mintaJawaban-02: gagal dua kali menghasilkan null (S-2)", async () => {
    let n = 0;
    const p: PenyediaLlm = async () => {
      n++;
      throw new Error("timeout");
    };
    const r = await mintaJawaban(p, { teksUtama: "x", pertanyaan: "q", deskripsi: "d", namaSasaran: "s" }, { jedaMs: 0 });
    expect(r.jawaban).toBeNull();
    expect(n).toBe(2);
  });
});

describe("bentukHasil", () => {
  const b = butir("ISI-01", "Ringkasan");
  const teks = dokumen.teksPerBagian.Ringkasan;
  it("KP-bentukHasil-01: kutipan ditemukan: status mengikuti rekomendasi", () => {
    const h = bentukHasil(b, jawabanBaik, teks, false);
    expect(h.status).toBe("Memenuhi");
    expect(h.kutipan).toBe(jawabanBaik.kutipan);
    expect(h.tingkatKeyakinan).toBe(0.9);
  });
  it("KP-bentukHasil-02: S-1: kutipan tidak ditemukan -> Perlu diperiksa manual, rekomendasi tetap disimpan, kutipan tidak ditampilkan", () => {
    const h = bentukHasil(b, { ...jawabanBaik, kutipan: "Kalimat karangan yang tidak ada." }, teks, false);
    expect(h.status).toBe("Perlu diperiksa manual");
    expect(h.rekomendasi).toBe("Memenuhi");
    expect(h.kutipan).toBeNull();
    expect(h.alasanSistem).toContain("tidak ditemukan");
  });
  it("KP-bentukHasil-03: S-2: tanpa jawaban -> Belum ada rekomendasi, tanpa rekomendasi, kutipan, keyakinan", () => {
    const h = bentukHasil(b, null, teks, false, "timeout");
    expect(h.status).toBe("Belum ada rekomendasi");
    expect(h.rekomendasi).toBeNull();
    expect(h.kutipan).toBeNull();
    expect(h.tingkatKeyakinan).toBeNull();
  });
  it("KP-bentukHasil-04: Tidak memenuhi tanpa kutipan sah (unsur memang tidak ada)", () => {
    const h = bentukHasil(b, { rekomendasi: "Tidak memenuhi", kutipan: "", alasan: "Peta jalan tidak ada.", keyakinan: 0.7 }, teks, false);
    expect(h.status).toBe("Tidak memenuhi");
    expect(h.kutipan).toBeNull();
  });
  it("KP-bentukHasil-05: Memenuhi tanpa kutipan -> Perlu diperiksa manual", () => {
    const h = bentukHasil(b, { ...jawabanBaik, kutipan: "" }, teks, false);
    expect(h.status).toBe("Perlu diperiksa manual");
  });
  it("KP-bentukHasil-06: dapatDinilai false (bukti di gambar) -> Perlu diperiksa manual tanpa vonis, kutipan sah tetap disimpan", () => {
    const h = bentukHasil(b, { ...jawabanBaik, rekomendasi: "Tidak memenuhi", dapatDinilai: false, keyakinan: 0.4 }, teks, false);
    expect(h.status).toBe("Perlu diperiksa manual");
    expect(h.rekomendasi).toBeNull();
    expect(h.kutipan).toBe(jawabanBaik.kutipan);
    expect(h.alasanSistem).toContain("gambar atau diagram");
    expect(bentukHasil(b, { ...jawabanBaik, dapatDinilai: false, kutipan: "karangan" }, teks, false).kutipan).toBeNull();
  });
});

describe("cocokkanKutipan: naskah PDF BIMA", () => {
  const teksPdf = "Adapun luaran yang dijanjikan Tahun ke-1:\n\uf071 Publikasi jurnal internasional (Scopus Q2)\n\u2022 HKI Desain Industri.";
  it("KP-cocokkanKutipan-B1: tanda butir (glyph Private Use atau •) di teks dilewati walau tidak ikut dikutip", () => {
    expect(cocokkanKutipan(teksPdf, "Tahun ke-1: Publikasi jurnal internasional (Scopus Q2) HKI Desain Industri.")).toBe(true);
  });
  it("KP-cocokkanKutipan-B2: tanda butir yang ikut dikutip juga diterima; kata yang berbeda tetap ditolak", () => {
    expect(cocokkanKutipan(teksPdf, "Tahun ke-1: \u2022 Publikasi jurnal")).toBe(true);
    expect(cocokkanKutipan(teksPdf, "Tahun ke-1: Publikasi buku")).toBe(false);
  });
});

describe("nilaiSemantikDenganOpsi", () => {
  it("KP-nilaiSemantikDenganOpsi-01: hanya butir semantik, urutan terjaga, bagian kosong tanpa memanggil LLM", async () => {
    let panggilan = 0;
    const p: PenyediaLlm = async () => {
      panggilan++;
      return jawabanBaik;
    };
    const deter = { ...butir("D-1", "Ringkasan"), jenis: "deterministik" as const };
    const hasil = await nilaiSemantikDenganOpsi(dokumen, [deter, butir("ISI-01", "Ringkasan"), butir("ISI-99", "Peta Jalan")], { penyedia: p, tiruan: false, jedaMs: 0 });
    expect(hasil.map((x) => x.hasil.kode)).toEqual(["ISI-01", "ISI-99"]);
    expect(hasil[0].hasil.status).toBe("Memenuhi");
    expect(hasil[1].hasil.status).toBe("Tidak memenuhi");
    expect(panggilan).toBe(1);
  });
  it("KP-nilaiSemantikDenganOpsi-02: mode tiruan: kutipan salinan persis dari teks, tiruan true", async () => {
    const hasil = await nilaiSemantikDenganOpsi(dokumen, [butir("ISI-01", "Ringkasan")], { penyedia: kirimPermintaanTiruan, tiruan: true });
    const h = hasil[0].hasil;
    expect(h.tiruan).toBe(true);
    expect(["Memenuhi", "Tidak memenuhi"]).toContain(h.status);
    if (h.kutipan) expect(cocokkanKutipan(dokumen.teksPerBagian.Ringkasan, h.kutipan)).toBe(true);
    expect(h.tingkatKeyakinan).not.toBeNull();
  });
});

describe("gambar per bagian ke Layanan LLM", () => {
  const diagram: GambarNaskah = { tipe: "image/png", data: Buffer.from("png-diagram"), lebar: 800, tinggi: 400 };
  const bergambar: Pick<DokumenPeriksa, "teksPerBagian" | "teksLampiran" | "gambarPerBagian"> = {
    teksPerBagian: { Metode: "Tahapan penelitian disajikan berikut.\n[gambar 1]\nGambar 1. Diagram alir penelitian" },
    teksLampiran: { "Surat Pernyataan Mitra": "Mitra bersedia." },
    gambarPerBagian: { metode: [diagram] },
  };
  const permintaan = (gambar?: GambarNaskah[]): PermintaanLlm => ({
    teksUtama: bergambar.teksPerBagian.Metode,
    pertanyaan: "Apakah diagram alir sesuai?",
    deskripsi: "Diagram alir sesuai isi Metode",
    namaSasaran: "Metode",
    gambar,
  });

  it("KP-tentukanSasaran-02: gambar bagian sasaran ikut (nama bagian tanpa membedakan huruf); butir atas lampiran tanpa gambar", () => {
    expect(tentukanSasaran(bergambar, butir("UNS-10", "Metode")).gambar).toEqual([diagram]);
    expect(tentukanSasaran(bergambar, butir("UNS-11", "Metode", "Surat Pernyataan Mitra")).gambar).toEqual([]);
    expect(tentukanSasaran(bergambar, butir("UNS-12", "Ringkasan")).gambar).toEqual([]);
  });
  it("KP-susunKonten-01: tanpa gambar berupa teks; dengan gambar: pengantar, lalu penanda dan gambar base64 berpasangan, teks paling akhir", () => {
    expect(typeof susunKonten(permintaan())).toBe("string");
    const k = susunKonten(permintaan([diagram, diagram]));
    if (typeof k === "string") throw new Error("harus berupa blok");
    expect(k.map((b) => b.type)).toEqual(["text", "text", "image", "text", "image", "text"]);
    expect(k[1]).toEqual({ type: "text", text: "[gambar 1]" });
    expect(k[2]).toEqual({ type: "image", source: { type: "base64", media_type: "image/png", data: diagram.data.toString("base64") } });
    expect(k[3]).toEqual({ type: "text", text: "[gambar 2]" });
    expect((k.at(-1) as { text: string }).text).toContain("<teks_utama sasaran=\"Metode\">");
  });
  it("KP-susunKonten-02: SEMAR_LLM_GAMBAR=0 mematikan pengiriman gambar", () => {
    const lama = process.env.SEMAR_LLM_GAMBAR;
    process.env.SEMAR_LLM_GAMBAR = "0";
    try {
      expect(typeof susunKonten(permintaan([diagram]))).toBe("string");
    } finally {
      if (lama === undefined) delete process.env.SEMAR_LLM_GAMBAR;
      else process.env.SEMAR_LLM_GAMBAR = lama;
    }
  });
  it("KP-nilaiSemantikDenganOpsi-03: penyedia menerima gambar bagian sasaran; kutipan penanda gambar diterima sebagai bukti", async () => {
    let diterima: GambarNaskah[] | undefined;
    const penyedia: PenyediaLlm = async (p) => {
      diterima = p.gambar;
      return { rekomendasi: "Memenuhi", kutipan: "[gambar 1]", alasan: "Diagram memuat tahapan yang sama dengan uraian.", keyakinan: 0.85 };
    };
    const [{ hasil }] = await nilaiSemantikDenganOpsi(bergambar, [butir("UNS-10", "Metode")], { penyedia, tiruan: false, jedaMs: 0 });
    expect(diterima).toEqual([diagram]);
    expect(hasil.status).toBe("Memenuhi");
    expect(hasil.kutipan).toBe("[gambar 1]");
  });
  it("KP-nilaiSemantikDenganOpsi-04: penanda gambar yang dilampirkan sah sebagai kutipan walau teks bagian tidak memuatnya; nomor di luar lampiran ditolak", async () => {
    const tanpaPenanda = { ...bergambar, teksPerBagian: { Metode: "Tahapan penelitian.\nGambar 1. Diagram alir penelitian" } };
    const jawab = (kutipan: string): PenyediaLlm => async () => ({ rekomendasi: "Memenuhi", kutipan, alasan: "Ada.", keyakinan: 0.8 });
    const [{ hasil: sah }] = await nilaiSemantikDenganOpsi(tanpaPenanda, [butir("UNS-10", "Metode")], { penyedia: jawab("[gambar 1]"), tiruan: false, jedaMs: 0 });
    expect(sah.status).toBe("Memenuhi");
    const [{ hasil: salah }] = await nilaiSemantikDenganOpsi(tanpaPenanda, [butir("UNS-10", "Metode")], { penyedia: jawab("[gambar 2]"), tiruan: false, jedaMs: 0 });
    expect(salah.status).toBe("Perlu diperiksa manual");
  });
});
