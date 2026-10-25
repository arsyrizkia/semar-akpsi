"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Label tetap sisi BIMA tiruan (keputusan 1). Tanpa logo atau identitas resmi. */
export function LabelBima() {
  return (
    <div className="sticky top-0 z-30 bg-slate-800 px-4 py-1.5 text-center text-sm font-semibold text-slate-100" role="note">
      Simulasi BIMA – bukan sistem resmi
    </div>
  );
}

const MENU = [
  { href: "/bima/pengajuan", nama: "Pengajuan proposal" },
  { href: "/bima/kotak-masuk", nama: "Kotak masuk" },
];

/** Navigasi BIMA tiruan: gaya sistem lain (abu-abu netral, sudut tegas), sengaja berbeda dari tema Semar. */
export function NavBima({ nama }: { nama?: string | null }) {
  const jalur = usePathname();
  // halaman masuk berdiri sendiri seperti halaman masuk BIMA: tanpa menu
  if (jalur === "/bima/masuk") return null;
  return (
    <header className="border-b border-slate-300 bg-white text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5">
        <p className="text-base font-bold tracking-tight text-slate-800">Layanan Pengusulan (simulasi)</p>
        <nav aria-label="Menu BIMA tiruan" className="flex flex-wrap items-center gap-x-1 text-sm">
          {MENU.map((m) => {
            const aktif = jalur === m.href || jalur.startsWith(`${m.href}/`);
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={
                  aktif
                    ? "border-b-2 border-slate-800 px-3 py-2 font-semibold text-slate-900"
                    : "border-b-2 border-transparent px-3 py-2 text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
                }
              >
                {m.nama}
              </Link>
            );
          })}
          {nama ? (
            <form action="/api/bima/sesi/keluar" method="post" className="ml-0 flex items-center gap-2 sm:ml-2 sm:border-l sm:border-slate-300 sm:pl-3">
              <span className="text-slate-600">{nama}</span>
              <button type="submit" className="min-h-9 border border-slate-500 px-3 py-1 text-slate-800 transition-colors hover:bg-slate-100">
                Keluar
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
