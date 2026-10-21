"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Polling hasil pemeriksaan: menyegarkan halaman server tiap 2 detik selama pemeriksaan berjalan (NFR 2.1: maksimal 2 menit). */
export function PemantauPemeriksaan({ aktif }: { aktif: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!aktif) return;
    const t = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(t);
  }, [aktif, router]);
  return null;
}
