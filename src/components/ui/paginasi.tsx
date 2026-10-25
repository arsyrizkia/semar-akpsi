"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
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
    p.delete("susun"); // parameter aksi tidak ikut terbawa ke tautan halaman
    p.set(parameter, String(h));
    return `${jalur}?${p.toString()}`;
  };
  const kelas = "inline-flex h-8 items-center gap-1 rounded-md border border-primer-300 bg-white px-2.5 text-sm font-medium text-primer-800 hover:bg-primer-50";
  return (
    <nav aria-label="Halaman tabel" className={cn("mt-3 flex items-center justify-between gap-3 text-sm text-teks-redup", className)}>
      <p className="angka">
        Halaman {halaman} dari {jumlahHalaman}
      </p>
      <div className="flex flex-wrap gap-2">
        {halaman > 2 ? (
          <Link href={alamat(1)} className={kelas} aria-label="Halaman pertama">
            <ChevronFirst aria-hidden className="size-4" /> Pertama
          </Link>
        ) : null}
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
        {halaman < jumlahHalaman - 1 ? (
          <Link href={alamat(jumlahHalaman)} className={kelas} aria-label={`Halaman terakhir (${jumlahHalaman})`}>
            Terakhir <ChevronLast aria-hidden className="size-4" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
