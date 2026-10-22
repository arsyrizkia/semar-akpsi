// MILIK AGEN B: ganti seluruh isi berkas ini (J-04b Usulan Penugasan, UC-03 langkah 2-8).
import type { Metadata } from "next";
import { KepalaHalaman, Bagian, KeadaanKosong } from "@/components/ui";
import { wajibTimKerja } from "@/lib/auth";

export const metadata: Metadata = { title: "J-04b Usulan Penugasan" };
export const dynamic = "force-dynamic";

export default async function Halaman({ params }: { params: Promise<{ idPeriode: string }> }) {
  await wajibTimKerja();
  const { idPeriode } = await params;
  return (
    <>
      <KepalaHalaman
        kode="J-04b"
        judul="Usulan Penugasan"
        remah={[{ label: "Penugasan Reviewer", href: "/tim-kerja/penugasan" }, { label: "Usulan Penugasan" }]}
      />
      <Bagian>
        <KeadaanKosong judul="Layar ini belum dibangun">Kerangka J-04b untuk periode {idPeriode}; isi dikerjakan Agen B.</KeadaanKosong>
      </Bagian>
    </>
  );
}
