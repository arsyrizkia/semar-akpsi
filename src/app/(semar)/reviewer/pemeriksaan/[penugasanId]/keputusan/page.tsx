// MILIK AGEN C: ganti seluruh isi berkas ini (J-08b Keputusan Penilaian, UC-07 langkah 9-12).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KepalaHalaman, Bagian, KeadaanKosong } from "@/components/ui";
import { wajibReviewer } from "@/lib/auth";
import { periksaAkses } from "@/lib/penilaian/layanan";

export const metadata: Metadata = { title: "J-08b Keputusan Penilaian" };
export const dynamic = "force-dynamic";

export default async function Halaman({ params }: { params: Promise<{ penugasanId: string }> }) {
  const { penugasanId } = await params;
  const { akun } = await wajibReviewer();
  const akses = await periksaAkses(penugasanId, akun); // NFR 3.1: hanya penugasan milik reviewer ini
  if (!akses.ok) notFound();
  return (
    <>
      <KepalaHalaman
        kode="J-08b"
        judul="Keputusan Penilaian"
        remah={[
          { label: "Daftar Penugasan", href: "/reviewer/penugasan" },
          { label: "Pemeriksaan Proposal", href: `/reviewer/pemeriksaan/${penugasanId}` },
          { label: "Keputusan" },
        ]}
      />
      <Bagian>
        <KeadaanKosong judul="Layar ini belum dibangun">Kerangka J-08b; isi dikerjakan Agen C.</KeadaanKosong>
      </Bagian>
    </>
  );
}
