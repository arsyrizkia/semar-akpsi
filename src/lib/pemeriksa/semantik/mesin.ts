/**
 * Mesin penilaian semantik (UC-09) tanpa basis data: kirimPermintaan dengan ulang, cocokkanKutipan, bentuk hasil.
 * Dipakai nilaiSemantikTeks (UC-09 dan "Uji pada Contoh" J-03) dan jalankanPemeriksaanSemantik.
 */
import type { ButirCek, DokumenPeriksa, HasilButirSemantik, ParameterButir } from "@/lib/kontrak/tipe";
import { PERCOBAAN_ULANG_LLM, modeLlm } from "@/lib/llm/konfigurasi";
import { penyediaBawaan, type JawabanLlm, type PenyediaLlm } from "./llm";
import { ambilBerdasarkanNama, cocokkanKutipan } from "./teks";

export interface OpsiNilai {
  penyedia?: PenyediaLlm;
  /** jumlah butir yang diproses bersamaan */
  paralel?: number;
  /** jeda antarpercobaan (ms) */
  jedaMs?: number;
  /** paksa label tiruan (bawaan: menurut modeLlm()) */
  tiruan?: boolean;
  /** skenario paksa mode tiruan pada butir pertama (menggantikan pembacaan env global yang tidak aman untuk permintaan serentak) */
  skenario?: "kutipan-salah" | "tidak-merespons";
}

interface Sasaran {
  utama: string;
  pendukung: string;
  nama: string;
}

function parameterSemantik(b: ButirCek): { bagian: string | null; lampiran: string | null } {
  const p = b.parameter as ParameterButir | null;
  if (p && p.tipe === "semantik") return { bagian: p.bagian ?? null, lampiran: p.lampiran ?? null };
  return { bagian: null, lampiran: null };
}

/** Teks sasaran butir: bagian proposal, atau lampiran (dengan bagian sebagai pembanding). */
export function tentukanSasaran(dokumen: Pick<DokumenPeriksa, "teksPerBagian" | "teksLampiran">, b: ButirCek): Sasaran {
  const { bagian, lampiran } = parameterSemantik(b);
  const teksBagian = ambilBerdasarkanNama(dokumen.teksPerBagian, bagian);
  if (lampiran) {
    const teksLampiran = ambilBerdasarkanNama(dokumen.teksLampiran, lampiran);
    return { utama: teksLampiran, pendukung: teksBagian, nama: `Lampiran: ${lampiran}` };
  }
  return { utama: teksBagian, pendukung: "", nama: bagian ?? "Proposal" };
}

const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** kirimPermintaan dengan batas percobaan (UC-09 loop (1,2); NFR 4.4). Mengembalikan null bila semua gagal (S-2). */
export async function mintaJawaban(
  penyedia: PenyediaLlm,
  permintaan: Parameters<PenyediaLlm>[0],
  opsi: Pick<OpsiNilai, "jedaMs"> = {},
): Promise<{ jawaban: JawabanLlm | null; percobaan: number; galat: string | null }> {
  let galat: string | null = null;
  for (let ke = 1; ke <= PERCOBAAN_ULANG_LLM; ke++) {
    try {
      return { jawaban: await penyedia(permintaan), percobaan: ke, galat: null };
    } catch (e) {
      galat = e instanceof Error ? e.message : String(e);
      if (ke < PERCOBAAN_ULANG_LLM) await tidur(opsi.jedaMs ?? 400);
    }
  }
  return { jawaban: null, percobaan: PERCOBAAN_ULANG_LLM, galat };
}

function dasar(b: ButirCek, bagian: string | null, tiruan: boolean): HasilButirSemantik {
  return {
    butirId: b.id,
    kode: b.kode,
    bagian,
    status: "Belum ada rekomendasi",
    rekomendasi: null,
    kutipan: null,
    tingkatKeyakinan: null,
    alasanSistem: null,
    tiruan,
  };
}

/** Menyusun hasil satu butir dari jawaban LLM: cocokkanKutipan (S-1) atau tanpa jawaban (S-2). */
export function bentukHasil(
  b: ButirCek,
  jawaban: JawabanLlm | null,
  teksVerifikasi: string,
  tiruan: boolean,
  galat?: string | null,
): HasilButirSemantik {
  const { bagian } = parameterSemantik(b);
  const h = dasar(b, bagian, tiruan);
  if (!jawaban) {
    return { ...h, alasanSistem: `Layanan LLM tidak memberi jawaban setelah ${PERCOBAAN_ULANG_LLM} percobaan${galat ? ` (${galat})` : ""}.` };
  }
  const kutipan = jawaban.kutipan.trim();
  const dasarHasil = { ...h, rekomendasi: jawaban.rekomendasi, tingkatKeyakinan: jawaban.keyakinan, alasanSistem: jawaban.alasan };
  if (kutipan && cocokkanKutipan(teksVerifikasi, kutipan)) {
    return { ...dasarHasil, status: jawaban.rekomendasi, kutipan };
  }
  if (!kutipan && jawaban.rekomendasi === "Tidak memenuhi") {
    // tidak ada penggalan yang bisa dikutip (mis. unsur memang tidak ada): bukan kutipan palsu
    return { ...dasarHasil, status: "Tidak memenuhi", kutipan: null };
  }
  const catatan = kutipan ? `Kutipan dari Layanan LLM tidak ditemukan di teks: "${kutipan.slice(0, 200)}". ` : "Layanan LLM tidak menyertakan kutipan. ";
  return { ...dasarHasil, status: "Perlu diperiksa manual", kutipan: null, alasanSistem: `${catatan}${jawaban.alasan}` };
}

/** Skenario paksa untuk mode tiruan: SEMAR_LLM_TIRUAN_SKENARIO = kutipan-salah | tidak-merespons (berlaku pada butir pertama). */
function skenarioTiruan(indeks: number, opsiSkenario?: OpsiNilai["skenario"]): "kutipan-salah" | "tidak-merespons" | null {
  if (indeks !== 0) return null;
  if (opsiSkenario) return opsiSkenario;
  const s = process.env.SEMAR_LLM_TIRUAN_SKENARIO;
  return s === "kutipan-salah" || s === "tidak-merespons" ? s : null;
}

async function periksaSatu(
  dokumen: Pick<DokumenPeriksa, "teksPerBagian" | "teksLampiran">,
  b: ButirCek,
  indeks: number,
  penyedia: PenyediaLlm,
  tiruan: boolean,
  jedaMs?: number,
  skenario?: OpsiNilai["skenario"],
): Promise<{ hasil: HasilButirSemantik; percobaan: number }> {
  const sasaran = tentukanSasaran(dokumen, b);
  const { bagian } = parameterSemantik(b);
  if (!sasaran.utama.trim()) {
    // sasaran tidak ada di proposal: tidak perlu memanggil LLM
    return {
      percobaan: 0,
      hasil: {
        ...dasar(b, bagian, tiruan),
        status: "Tidak memenuhi",
        rekomendasi: "Tidak memenuhi",
        tingkatKeyakinan: 0.9,
        alasanSistem: `Teks "${sasaran.nama}" tidak ditemukan pada proposal.`,
      },
    };
  }
  const paksa = tiruan ? skenarioTiruan(indeks, skenario) : null;
  let pakaiPenyedia = penyedia;
  if (paksa === "tidak-merespons") pakaiPenyedia = async () => { throw new Error("waktu tunggu 15 detik terlampaui (skenario tiruan)"); };
  if (paksa === "kutipan-salah") {
    pakaiPenyedia = async (p) => ({ ...(await penyedia(p)), kutipan: "Kalimat ini sengaja tidak ada di dalam naskah proposal." });
  }
  const { jawaban, percobaan, galat } = await mintaJawaban(
    pakaiPenyedia,
    {
      teksUtama: sasaran.utama,
      teksPendukung: sasaran.pendukung || undefined,
      pertanyaan: b.pertanyaan ?? b.deskripsi,
      contohJawaban: b.contohJawaban,
      deskripsi: b.deskripsi,
      namaSasaran: sasaran.nama,
    },
    { jedaMs },
  );
  return { hasil: bentukHasil(b, jawaban, `${sasaran.utama}\n${sasaran.pendukung}`, tiruan, galat), percobaan };
}

/** Inti nilaiSemantikTeks dengan opsi (tes memasang penyedia sendiri). */
export async function nilaiSemantikDenganOpsi(
  dokumen: Pick<DokumenPeriksa, "teksPerBagian" | "teksLampiran">,
  butir: ButirCek[],
  opsi: OpsiNilai = {},
): Promise<{ hasil: HasilButirSemantik; percobaan: number }[]> {
  const semantik = butir.filter((b) => b.jenis === "semantik");
  const tiruan = opsi.tiruan ?? modeLlm() === "tiruan";
  const penyedia = opsi.penyedia ?? penyediaBawaan();
  const keluaran: { hasil: HasilButirSemantik; percobaan: number }[] = new Array(semantik.length);
  const paralel = Math.max(1, opsi.paralel ?? 4);
  let berikut = 0;
  async function pekerja() {
    while (berikut < semantik.length) {
      const i = berikut++;
      keluaran[i] = await periksaSatu(dokumen, semantik[i], i, penyedia, tiruan, opsi.jedaMs, opsi.skenario);
    }
  }
  await Promise.all(Array.from({ length: Math.min(paralel, semantik.length) }, pekerja));
  return keluaran;
}

/* ------------------------------ metode seq-uc09 ------------------------------ */

/** nilaiSemantik(teksBagian) dan periksaSemantik(teksTanpaIdentitas): penilaian semantik semua butir atas dokumen. */
export const nilaiSemantik = nilaiSemantikDenganOpsi;
export const periksaSemantik = nilaiSemantikDenganOpsi;
