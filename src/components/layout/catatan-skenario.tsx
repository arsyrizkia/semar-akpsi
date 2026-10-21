"use client";

import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui";

/** Banner catatan jalan pintas /demo (parameter ?catatan=): langkah yang perlu dilakukan penyaji pada skenario ini. */
export function CatatanSkenario({ netral = false }: { netral?: boolean }) {
  const catatan = useSearchParams().get("catatan");
  if (!catatan) return null;
  if (netral) {
    return (
      <p role="note" className="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <strong>Catatan skenario demo:</strong> {catatan}
      </p>
    );
  }
  return (
    <Alert jenis="info" judul="Catatan skenario demo" className="mb-6">
      {catatan}
    </Alert>
  );
}
