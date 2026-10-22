"use client";

import { useRouter } from "next/navigation";
import { Pilihan } from "@/components/ui";
import type { SkemaPilihan } from "@/lib/templat/layanan";

/** Pilihan "Skema Pendanaan": tersimpan di URL (?skema=), sehingga tombol Back dan tautan langsung bekerja. */
export function PilihSkema({ skema, skemaId }: { skema: SkemaPilihan[]; skemaId: string }) {
  const router = useRouter();
  return (
    <Pilihan label="Skema Pendanaan" className="w-full max-w-sm" value={skemaId} onChange={(e) => router.push(`/tim-kerja/templat?skema=${e.target.value}`)}>
      {skema.map((s) => (
        <option key={s.id} value={s.id}>
          {s.namaSkema}
        </option>
      ))}
    </Pilihan>
  );
}
