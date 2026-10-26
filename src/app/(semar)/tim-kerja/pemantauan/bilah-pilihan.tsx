"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Pilihan } from "@/components/ui";

/**
 * Pilihan Periode Seleksi dan Skema Pendanaan J-05: berganti langsung (tanpa tombol Tampilkan) dan tersimpan di URL (replace); tab
 * tetap, urutan dan butir M-08 dibuang karena isinya berbeda. Tanpa JavaScript, formulir GET biasa tetap bekerja lewat tombol cadangan.
 */
export function BilahPilihan({ periode, skema, periodeId, skemaId }: { periode: { id: string; nama: string }[]; skema: { id: string; nama: string }[]; periodeId: string; skemaId: string }) {
  const router = useRouter();
  const jalur = usePathname();
  const cari = useSearchParams();
  const [memuat, mulai] = useTransition();

  function ganti(kunci: "periode" | "skema", nilai: string) {
    const p = new URLSearchParams(cari.toString());
    p.set(kunci, nilai);
    p.delete("butir");
    p.delete("urut");
    // replace: tombol panah pada select tertutup (Windows) memicu change di setiap langkah; riwayat tidak menumpuk
    mulai(() => router.replace(`${jalur}?${p.toString()}`, { scroll: false }));
  }

  return (
    <form method="get" role="search" aria-label="Pilih periode dan skema" className="flex flex-wrap items-end gap-3" onSubmit={(e) => e.preventDefault()}>
      <Pilihan label="Periode Seleksi" name="periode" value={periodeId} onChange={(e) => ganti("periode", e.target.value)} className="w-full max-w-sm">
        {periode.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nama}
          </option>
        ))}
      </Pilihan>
      <Pilihan label="Skema Pendanaan" name="skema" value={skemaId} onChange={(e) => ganti("skema", e.target.value)} className="w-full max-w-64">
        {skema.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nama}
          </option>
        ))}
      </Pilihan>
      <noscript>
        <button type="submit" className="h-10 rounded-md border border-primer-400 px-4 text-sm font-semibold text-primer-800">
          Tampilkan
        </button>
      </noscript>
      <p aria-live="polite" className="flex items-center text-sm text-teks-redup [&:not(:empty)]:h-10">
        {memuat ? (
          <>
            <Loader2 aria-hidden className="mr-1.5 size-4 animate-spin" />
            Memuat laporan…
          </>
        ) : null}
      </p>
    </form>
  );
}
