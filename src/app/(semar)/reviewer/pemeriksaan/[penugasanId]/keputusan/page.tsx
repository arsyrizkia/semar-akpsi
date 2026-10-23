import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KepalaHalaman } from "@/components/ui";
import { AksesDitolak } from "../akses-ditolak";
import { wajibReviewer } from "@/lib/auth";
import { muatKeputusan, periksaAkses } from "@/lib/penilaian/layanan";
import { KeputusanKlien } from "./keputusan-klien";

export const metadata: Metadata = { title: "J-08b Keputusan Penilaian" };
export const dynamic = "force-dynamic";

/** J-08b Keputusan Penilaian (UC-07 langkah 9-12). Hanya untuk penugasan milik reviewer yang masuk (NFR 3.1). */
export default async function Halaman({ params }: { params: Promise<{ penugasanId: string }> }) {
  const { penugasanId } = await params;
  const { akun } = await wajibReviewer();
  const akses = await periksaAkses(penugasanId, akun);
  if (!akses.ok) {
    if (akses.kode === 404) notFound();
    // 403 tampil sama dengan J-08 (NFR 3.1), percobaannya sudah dicatat oleh periksaAkses
    return <AksesDitolak kode="J-08b" judul="Keputusan Penilaian" remah={[{ label: "Daftar Penugasan", href: "/reviewer/penugasan" }, { label: "Keputusan" }]} />;
  }
  const data = await muatKeputusan(akses.penugasan);
  return (
    <>
      <KepalaHalaman
        kode="J-08b"
        judul="Keputusan Penilaian"
        keterangan={data.proposal.judul}
        remah={[
          { label: "Daftar Penugasan", href: "/reviewer/penugasan" },
          { label: "Pemeriksaan Proposal", href: `/reviewer/pemeriksaan/${penugasanId}` },
          { label: "Keputusan" },
        ]}
      />
      <KeputusanKlien data={data} />
    </>
  );
}
