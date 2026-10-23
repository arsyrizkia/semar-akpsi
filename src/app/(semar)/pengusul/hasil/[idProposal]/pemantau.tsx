"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Polling hasil pemeriksaan: menyegarkan halaman server selama pemeriksaan berjalan (NFR 2.1: maksimal 2 menit). Penyegaran berikutnya
 * dijadwalkan 2 detik SESUDAH penyegaran sebelumnya selesai (useTransition): interval tetap membatalkan permintaan yang belum selesai
 * bila render server lebih lama daripada 2 detik (mis. basis data jauh), sehingga halaman tidak pernah berubah.
 */
export function PemantauPemeriksaan({ aktif }: { aktif: boolean }) {
  const router = useRouter();
  const [menyegarkan, mulai] = useTransition();
  useEffect(() => {
    if (!aktif || menyegarkan) return;
    const t = setTimeout(() => mulai(() => router.refresh()), 2000);
    return () => clearTimeout(t);
  }, [aktif, menyegarkan, router]);
  return null;
}
