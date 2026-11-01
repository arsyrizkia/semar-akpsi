"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

/** Label tetap sisi BIMA tiruan (keputusan 1): halaman ini tiruan untuk prototipe, bukan BIMA resmi. */
export function LabelBima() {
  return (
    <div className="bg-[#0f1b4d] px-4 py-1 text-center text-xs font-medium text-white" role="note">
      Simulasi BIMA – bukan sistem resmi
    </div>
  );
}

/** Logo bulat BIMA (wayang) dan kata "BIMA". */
export function MerekBima({ ukuran = 36 }: { ukuran?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG statis kecil; tidak perlu optimasi next/image */}
      <img src="/bima/logo-bima.svg" alt="" width={ukuran} height={ukuran} className="rounded-full bg-white" />
      <span className="text-xl font-bold leading-none tracking-wide">BIMA</span>
    </span>
  );
}

const MENU = [
  { href: "/bima/pengajuan", nama: "Usulan" },
  { href: "/bima/kotak-masuk", nama: "Kotak Masuk" },
];

/** Navbar BIMA tiruan: biru dengan logo BIMA, mengikuti tampilan situs BIMA. Halaman masuk berdiri sendiri tanpa navbar. */
export function NavBima({ nama }: { nama?: string | null }) {
  const jalur = usePathname();
  if (jalur === "/bima/masuk") return null;
  return (
    <header className="bg-[#3150b4] text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5">
        <Link href="/bima/pengajuan" aria-label="BIMA, ke daftar usulan" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <MerekBima />
        </Link>
        <nav aria-label="Menu BIMA" className="flex flex-wrap items-center gap-x-1 text-sm">
          {MENU.map((m) => {
            const aktif = jalur === m.href || jalur.startsWith(`${m.href}/`);
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={`rounded-md px-3 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-white ${aktif ? "text-[#f6a623]" : "text-white hover:bg-white/10"}`}
              >
                {m.nama}
              </Link>
            );
          })}
          {nama ? (
            <form action="/api/bima/sesi/keluar" method="post" className="flex items-center gap-3 sm:ml-3 sm:border-l sm:border-white/25 sm:pl-4">
              <span className="max-w-48 truncate text-white/90">{nama}</span>
              <button
                type="submit"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-white/70 px-3 text-white transition-colors hover:bg-white hover:text-[#3150b4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <LogOut aria-hidden className="size-4" />
                Keluar
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
