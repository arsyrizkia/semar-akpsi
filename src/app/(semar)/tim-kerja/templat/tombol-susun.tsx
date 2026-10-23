"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, beriTahu } from "@/components/ui";
import { aksiSusunVersiBaru } from "./aksi";

/** Tombol "Susun Versi Baru" (UC-01 langkah 4): membuat draf lalu membuka J-02b. */
export function TombolSusunVersi({ skemaId, labelBerikut, sekunder }: { skemaId: string; labelBerikut?: string; sekunder?: boolean }) {
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  return (
    <Button
      varian={sekunder ? "sekunder" : "utama"}
      memuat={sibuk}
      onClick={() =>
        mulai(async () => {
          const r = await aksiSusunVersiBaru(skemaId);
          if (!r.ok) {
            beriTahu.galat(r.pesan);
            return;
          }
          router.push(`/tim-kerja/templat/${r.templat.id}/susun`);
        })
      }
    >
      {labelBerikut ?? "Susun Versi Baru"}
    </Button>
  );
}
