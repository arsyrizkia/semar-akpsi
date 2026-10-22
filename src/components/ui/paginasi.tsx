"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Paginasi berbasis URL (komponen klien: bungkus dengan Suspense) (parameter `halaman`, mulai 1) agar tombol Back peramban bekerja. Parameter lain dipertahankan.
 */
export function Paginasi({ halaman, jumlahHalaman, parameter = "halaman", className }: { halaman: number; jumlahHalaman: number; parameter?: string; className?: string }) {
  const jalur = usePathname();
  const cari = useSearchParams();
  if (jumlahHalaman <= 1) return null;
  const alamat = (h: number) => {
    const p = new URLSearchParams(cari.toString());
    p.set(parameter, String(h));
    return `${jalur}?${p.toString()}`;
  };
  const kelas = "inline-flex h-8 items-center gap-1 rounded-md border border-sogan-300 bg-white px-2.5 text-sm font-medium text-sogan-800 hover:bg-sogan-50";
  return (
    <nav aria-label="Halaman tabel" className={cn("mt-3 flex items-center justify-between gap-3 text-sm text-sogan-700", className)}>
      <p className="angka">
        Halaman {halaman} dari {jumlahHalaman}
      </p>
      <div className="flex gap-2">
        {halaman > 1 ? (
          <Link href={alamat(halaman - 1)} className={kelas} rel="prev">
            <ChevronLeft aria-hidden className="size-4" /> Sebelumnya
          </Link>
        ) : null}
        {halaman < jumlahHalaman ? (
          <Link href={alamat(halaman + 1)} className={kelas} rel="next">
            Berikutnya <ChevronRight aria-hidden className="size-4" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
