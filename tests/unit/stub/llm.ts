/**
 * Stub layanan LLM untuk uji kotak putih (UC-09): jawaban terskrip per panggilan, tanpa jaringan.
 * Setiap elemen skrip adalah jawaban, atau Error yang dilempar (menguji percobaan ulang dan "Belum ada rekomendasi").
 */
import type { JawabanLlm, PenyediaLlm, PermintaanLlm } from "@/lib/pemeriksa/semantik/llm";

export function buatStubLlm(skrip: (JawabanLlm | Error)[]) {
  const permintaan: PermintaanLlm[] = [];
  const penyedia: PenyediaLlm = async (p) => {
    permintaan.push(p);
    const langkah = skrip[Math.min(permintaan.length - 1, skrip.length - 1)];
    if (!langkah) throw new Error("stub LLM: skrip kosong");
    if (langkah instanceof Error) throw langkah;
    return langkah;
  };
  return { penyedia, permintaan };
}

export const jawabanMemenuhi = (kutipan: string, keyakinan = 0.9): JawabanLlm => ({ rekomendasi: "Memenuhi", kutipan, alasan: "Stub: unsur ada.", keyakinan });
export const jawabanTidakMemenuhi = (keyakinan = 0.8): JawabanLlm => ({ rekomendasi: "Tidak memenuhi", kutipan: "", alasan: "Stub: unsur tidak ada.", keyakinan });
