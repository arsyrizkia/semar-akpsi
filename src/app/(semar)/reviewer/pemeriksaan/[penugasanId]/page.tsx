import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, KepalaHalaman, kelasTombol } from "@/components/ui";
import { wajibReviewer } from "@/lib/auth";
import { muatPemeriksaan, periksaAkses } from "@/lib/penilaian/layanan";
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
    return (
      <>
        <KepalaHalaman kode="J-08" judul="Pemeriksaan Proposal" remah={[REMAH_DAFTAR, { label: "Pemeriksaan Proposal" }]} />
        <Alert jenis="galat" judul={akses.kode === 403 ? "403 Akses ditolak" : "Penugasan tidak ditemukan"}>
          {akses.kode === 403 ? "Proposal ini tidak ditugaskan kepada Anda. Percobaan akses ini dicatat." : "Penugasan yang Anda buka tidak ada atau belum ditetapkan."}
        </Alert>
        <p className="mt-4">
          <Link href="/reviewer/penugasan" className={kelasTombol("sekunder", "md")}>
            <ArrowLeft aria-hidden className="size-4" /> Kembali ke Daftar Penugasan
          </Link>
        </p>
      </>
    );
  }

  const data = await muatPemeriksaan(akses.penugasan);
  return <PemeriksaanKlien data={data} tabAwal={tab} butirAwal={butir} />;
}
