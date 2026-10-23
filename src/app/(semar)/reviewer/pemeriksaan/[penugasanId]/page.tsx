import type { Metadata } from "next";
import { wajibReviewer } from "@/lib/auth";
import { muatPemeriksaan, periksaAkses } from "@/lib/penilaian/layanan";
import { AksesDitolak } from "./akses-ditolak";
import { PemeriksaanKlien } from "./pemeriksaan-klien";

export const metadata: Metadata = { title: "J-08 Pemeriksaan Proposal" };
export const dynamic = "force-dynamic";

const REMAH_DAFTAR = { label: "Daftar Penugasan", href: "/reviewer/penugasan" };

/**
 * J-08 Pemeriksaan Proposal. Hanya untuk penugasan milik reviewer yang masuk (NFR 3.1).
 * Tidak memanggil LLM saat membuka (NFR 2.3): hanya membaca hasil_pemeriksaan yang sudah tersimpan.
 * Tab dan butir terpilih tersimpan di URL (?tab=&butir=).
 */
export default async function Halaman({ params, searchParams }: { params: Promise<{ penugasanId: string }>; searchParams: Promise<{ tab?: string; butir?: string }> }) {
  const { penugasanId } = await params;
  const { tab, butir } = await searchParams;
  const { akun } = await wajibReviewer();
  const akses = await periksaAkses(penugasanId, akun);

  if (!akses.ok) {
    return <AksesDitolak kode="J-08" judul="Pemeriksaan Proposal" kodeAkses={akses.kode} remah={[REMAH_DAFTAR, { label: "Pemeriksaan Proposal" }]} />;
  }

  const data = await muatPemeriksaan(akses.penugasan);
  return <PemeriksaanKlien data={data} tabAwal={tab} butirAwal={butir} />;
}
