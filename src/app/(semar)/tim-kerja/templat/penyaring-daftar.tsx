"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pilihan } from "@/components/ui";
import { FILTER_STATUS, kueriPenyaring, type PenyaringDaftar } from "@/lib/templat/daftar";
import type { SkemaPilihan } from "@/lib/templat/layanan";
import { cn } from "@/lib/utils";

/** Penyaring J-02: Tahun, Skema, dan Status. Semuanya tersimpan di URL, jadi tombol Back dan tautan langsung bekerja. */
export function PenyaringDaftarTemplat({ skema, tahun, nilai }: { skema: SkemaPilihan[]; tahun: number[]; nilai: PenyaringDaftar }) {
  const router = useRouter();
  const pindah = (ubah: Partial<PenyaringDaftar>) => router.replace(`/tim-kerja/templat${kueriPenyaring({ ...nilai, ...ubah })}`, { scroll: false });
  return (
    <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-3">
      <Pilihan label="Tahun" name="tahun" className="w-32" value={nilai.tahun === null ? "" : String(nilai.tahun)} onChange={(e) => pindah({ tahun: e.target.value ? Number(e.target.value) : null })}>
        <option value="">Semua</option>
        {tahun.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Pilihan>
      <Pilihan label="Skema" name="skema" className="w-full sm:w-72" value={nilai.skema ?? ""} onChange={(e) => pindah({ skema: e.target.value || null })}>
        <option value="">Semua</option>
        {skema.map((s) => (
          <option key={s.id} value={s.id}>
            {s.namaSkema}
          </option>
        ))}
      </Pilihan>
      <nav aria-label="Status templat" className="flex flex-wrap gap-1 pb-0.5">
        {FILTER_STATUS.map((s) => {
          const aktif = nilai.status === s;
          return (
            <Link
              key={s}
              href={`/tim-kerja/templat${kueriPenyaring({ ...nilai, status: s })}`}
              replace
              scroll={false}
              aria-current={aktif ? "true" : undefined}
              className={cn(
                "inline-flex h-10 items-center rounded-md border px-3 text-sm font-semibold",
                aktif ? "border-primer-700 bg-primer-700 text-white" : "border-primer-300 bg-white text-primer-800 hover:bg-primer-50",
              )}
            >
              {s}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
