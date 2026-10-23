import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, KepalaHalaman, kelasTombol } from "@/components/ui";

/** Tampilan penolakan akses bersama J-08 dan J-08b (NFR 3.1): 403 untuk penugasan milik reviewer lain, 404 untuk id yang tidak ada. */
export function AksesDitolak({ kode, judul, remah, kodeAkses = 403 }: { kode: string; judul: string; remah: { label: string; href?: string }[]; kodeAkses?: 403 | 404 }) {
  return (
    <>
      <KepalaHalaman kode={kode} judul={judul} remah={remah} />
      <Alert jenis="galat" judul={kodeAkses === 403 ? "403 Akses ditolak" : "Penugasan tidak ditemukan"}>
        {kodeAkses === 403 ? "Proposal ini tidak ditugaskan kepada Anda. Percobaan akses ini dicatat." : "Penugasan yang Anda buka tidak ada atau belum ditetapkan."}
      </Alert>
      <p className="mt-4">
        <Link href="/reviewer/penugasan" className={kelasTombol("sekunder", "md")}>
          <ArrowLeft aria-hidden className="size-4" /> Kembali ke Daftar Penugasan
        </Link>
      </p>
    </>
  );
}
