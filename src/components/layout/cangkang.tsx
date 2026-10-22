"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as RDialog } from "radix-ui";
import { LogOut, Menu, X } from "lucide-react";
import { LogoSemar } from "@/components/merek";
import { cn } from "@/lib/utils";
import { NAMA_PERAN, itemAktif, type ItemMenu } from "@/lib/menu";

export interface PropsCangkang {
  menu: ItemMenu[];
  nama: string;
  peran: keyof typeof NAMA_PERAN;
  pengelola: boolean;
  institusi: string;
  /** tautan merek: jendela awal peran; null = tanpa tautan (pengusul) */
  beranda: string | null;
  /** pengusul masuk dari BIMA dan tidak memakai Keluar SEMAR */
  bisaKeluar: boolean;
  children: React.ReactNode;
}

function IsiSidebar({ menu, nama, peran, pengelola, institusi, beranda, bisaKeluar, saatPilih }: Omit<PropsCangkang, "children"> & { saatPilih?: () => void }) {
  const jalur = usePathname();
  const aktif = itemAktif(menu, jalur);
  return (
    <div className="flex h-full flex-col bg-sogan-800 text-krem">
      {/* area merek: satu-satunya tempat motif kawung */}
      <div className="latar-kawung px-4 py-4">
        {beranda ? (
          <Link href={beranda} aria-label="SEMAR, ke jendela awal" onClick={saatPilih} className="inline-block rounded-md">
            <LogoSemar />
          </Link>
        ) : (
          <LogoSemar />
        )}
      </div>

      {menu.length ? (
        <nav aria-label={`Menu ${NAMA_PERAN[peran]}`} className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
          <ul className="space-y-0.5">
            {menu.map((m) => {
              const sekarang = aktif?.href === m.href;
              return (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    onClick={saatPilih}
                    aria-current={sekarang ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center rounded-md border-l-4 px-3 py-2 text-sm font-medium transition-colors duration-150",
                      sekarang ? "border-emas-400 bg-sogan-700 text-white" : "border-transparent text-krem-200 hover:bg-sogan-700/60 hover:text-white",
                    )}
                  >
                    {m.nama}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : (
        <div className="flex-1" />
      )}

      <div className="border-t border-sogan-600/70 px-4 pb-16 pt-3 text-sm">
        <p className="font-semibold text-white">{nama}</p>
        <p className="text-xs text-krem-200">
          {NAMA_PERAN[peran]}
          {pengelola ? " (pengelola)" : ""}
        </p>
        <p className="text-xs text-krem-200">{institusi}</p>
        {bisaKeluar ? (
          <form action="/api/sso/keluar" method="post" className="mt-2">
            <button
              type="submit"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-sogan-300/60 px-3 text-sm font-semibold text-krem hover:bg-sogan-700"
            >
              <LogOut aria-hidden className="size-4" /> Keluar
            </button>
          </form>
        ) : null}
        <p className="mt-3 text-[11px] leading-snug text-krem-200/90">Nama dan institusi: contoh sementara (rekaan).</p>
      </div>
    </div>
  );
}

/**
 * Cangkang aplikasi SEMAR: sidebar per peran di layar lebar, laci (drawer) di layar sempit.
 * Peran tanpa menu (pengusul) tetap mendapat sidebar ramping berisi merek dan identitas, tanpa daftar menu.
 */
export function CangkangSemar({ children, ...p }: PropsCangkang) {
  const [laci, setLaci] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#isi-utama" className="sr-only-fokus fixed left-2 top-2 z-[60] rounded-md bg-white px-3 py-2 text-sm font-semibold text-sogan-900 focus:not-sr-only">
        Lewati ke isi
      </a>

      <aside className="sticky top-0 hidden h-screen lg:block">
        <IsiSidebar {...p} />
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-sogan-200 bg-krem/95 px-4 py-2 backdrop-blur lg:hidden">
          <RDialog.Root open={laci} onOpenChange={setLaci}>
            <RDialog.Trigger asChild>
              <button type="button" aria-label="Buka menu" className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-sogan-800 hover:bg-sogan-100">
                <Menu aria-hidden className="size-5" />
              </button>
            </RDialog.Trigger>
            <RDialog.Portal>
              <RDialog.Overlay className="fixed inset-0 z-50 bg-sogan-900/50" />
              <RDialog.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-[var(--shadow-overlay)]">
                <RDialog.Title className="sr-only">Menu SEMAR</RDialog.Title>
                <RDialog.Description className="sr-only">Navigasi sesuai peran Anda</RDialog.Description>
                <IsiSidebar {...p} saatPilih={() => setLaci(false)} />
                <RDialog.Close aria-label="Tutup menu" className="absolute right-2 top-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-krem hover:bg-sogan-700">
                  <X aria-hidden className="size-5" />
                </RDialog.Close>
              </RDialog.Content>
            </RDialog.Portal>
          </RDialog.Root>
          <span className="text-base font-semibold text-sogan-800">SEMAR</span>
        </div>

        <main id="isi-utama" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-40 pt-6 outline-none sm:px-6 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
