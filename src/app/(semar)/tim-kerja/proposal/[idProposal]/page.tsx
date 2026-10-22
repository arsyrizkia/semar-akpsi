// MILIK AGEN B: ganti seluruh isi berkas ini (J-05b Rincian Proposal; tombol "Unduh Berkas" memakai
// /api/semar/proposal/[idProposal]/berkas/[idBerkas], lihat <TombolUnduh>).
import type { Metadata } from "next";
import { KepalaHalaman, Bagian, KeadaanKosong } from "@/components/ui";
import { wajibTimKerja } from "@/lib/auth";

export const metadata: Metadata = { title: "J-05b Rincian Proposal" };
export const dynamic = "force-dynamic";

export default async function Halaman({ params }: { params: Promise<{ idProposal: string }> }) {
  await wajibTimKerja();
  const { idProposal } = await params;
  return (
    <>
      <KepalaHalaman
        kode="J-05b"
        judul="Rincian Proposal"
        remah={[{ label: "Pemantauan Kesesuaian", href: "/tim-kerja/pemantauan" }, { label: "Rincian Proposal" }]}
      />
      <Bagian>
        <KeadaanKosong judul="Layar ini belum dibangun">Kerangka J-05b untuk proposal {idProposal}; isi dikerjakan Agen B.</KeadaanKosong>
      </Bagian>
    </>
  );
}
