import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, JudulHalaman, Panel } from "@/components/ui";
import { wajibReviewer } from "@/lib/auth";
import { muatPemeriksaan, periksaAkses } from "@/lib/penilaian/layanan";
import { PemeriksaanKlien } from "./pemeriksaan-klien";

export const metadata: Metadata = { title: "Pemeriksaan Proposal (J-08)" };
export const dynamic = "force-dynamic";

/**
 * J-08 Pemeriksaan Proposal. Hanya untuk penugasan milik reviewer yang masuk (NFR 3.1).
 * Tidak memanggil LLM saat membuka (NFR 2.3): hanya membaca hasil_pemeriksaan yang sudah tersimpan.
 */
export default async function Halaman({ params }: { params: Promise<{ penugasanId: string }> }) {
  const { penugasanId } = await params;
  const { akun } = await wajibReviewer();
  const akses = await periksaAkses(penugasanId, akun);

  if (!akses.ok) {
    return (
      <>
        <JudulHalaman kode="J-08" judul="Pemeriksaan Proposal" />
        <Panel>
          <Alert jenis="galat" judul={akses.kode === 403 ? "403 Akses ditolak" : "Penugasan tidak ditemukan"}>
            {akses.kode === 403 ? "Proposal ini tidak ditugaskan kepada Anda. Percobaan akses ini dicatat." : "Penugasan yang Anda buka tidak ada atau belum ditetapkan."}
          </Alert>
          <p className="mt-4">
            <Link href="/reviewer/penugasan" className="inline-flex items-center gap-1 font-semibold text-sogan-700 underline">
              <ArrowLeft aria-hidden className="size-4" /> Kembali ke Daftar Penugasan
            </Link>
          </p>
        </Panel>
      </>
    );
  }

  const data = await muatPemeriksaan(akses.penugasan);
  return <PemeriksaanKlien data={data} />;
}
