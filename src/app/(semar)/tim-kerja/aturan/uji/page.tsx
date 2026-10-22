// MILIK AGEN A: ganti seluruh isi berkas ini (J-03b Hasil Uji pada Contoh, UC-02 langkah 6).
import type { Metadata } from "next";
import { KepalaHalaman, Bagian, KeadaanKosong } from "@/components/ui";
import { wajibPengelola } from "@/lib/auth";

export const metadata: Metadata = { title: "J-03b Hasil Uji pada Contoh" };
export const dynamic = "force-dynamic";

export default async function Halaman() {
  await wajibPengelola();
  return (
    <>
      <KepalaHalaman
        kode="J-03b"
        judul="Hasil Uji pada Contoh"
        remah={[{ label: "Aturan Pemeriksaan", href: "/tim-kerja/aturan" }, { label: "Hasil Uji" }]}
      />
      <Bagian>
        <KeadaanKosong judul="Layar ini belum dibangun">Kerangka J-03b; isi dikerjakan Agen A.</KeadaanKosong>
      </Bagian>
    </>
  );
}
