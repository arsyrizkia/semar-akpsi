"use client";

import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui";

/** Pesan umum dari parameter ?galat= (mis. akses ditolak oleh guard peran). */
export function PesanGalat() {
  const galat = useSearchParams().get("galat");
  if (galat === "akses") {
    return <Alert jenis="peringatan" judul="Akses ditolak" className="mb-6">Menu tersebut tidak tersedia untuk peran Anda. Anda dialihkan ke halaman yang sesuai.</Alert>;
  }
  return null;
}
