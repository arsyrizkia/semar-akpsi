// MILIK AGEN A: ganti seluruh isi berkas ini (J-02b Penyusunan Templat, UC-01 langkah 4-7).
import type { Metadata } from "next";
import { KepalaHalaman, Bagian, KeadaanKosong } from "@/components/ui";
import { wajibPengelola } from "@/lib/auth";

export const metadata: Metadata = { title: "J-02b Penyusunan Templat" };
export const dynamic = "force-dynamic";

export default async function Halaman({ params }: { params: Promise<{ idTemplat: string }> }) {
  await wajibPengelola();
  const { idTemplat } = await params;
  return (
    <>
      <KepalaHalaman
        kode="J-02b"
        judul="Penyusunan Templat"
        remah={[{ label: "Templat Proposal", href: "/tim-kerja/templat" }, { label: "Penyusunan" }]}
      />
      <Bagian>
        <KeadaanKosong judul="Layar ini belum dibangun">Kerangka J-02b untuk templat {idTemplat}; isi dikerjakan Agen A.</KeadaanKosong>
      </Bagian>
    </>
  );
}
