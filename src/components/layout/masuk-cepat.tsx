"use client";

import { useEffect, useRef, useState } from "react";
import { Popover as RPopover } from "radix-ui";
import { LogIn, X } from "lucide-react";
import { KATA_SANDI_DEMO, type KelompokCepat } from "@/lib/bima/akun-demo";

/** Peristiwa jendela untuk membuka popup dari luar (mis. "Kesulitan login? Bantuan" di formulir masuk BIMA). */
export const PERISTIWA_BUKA_MASUK_CEPAT = "semar:buka-masuk-cepat";

/**
 * Pintasan demo di halaman masuk (J-01 dan Masuk BIMA tiruan): popup kanan bawah untuk langsung masuk sebagai akun demo tanpa
 * mengetik. Formulir masuk tetap seperti aslinya; pintasan ini lapisan demo (gaya navigator, font merek), bukan bagian BIMA.
 * Di layar sempit pil dinaikkan agar tidak bertumpuk dengan pil navigator di kiri bawah.
 */
export function MasukCepat({ kelompok, tersembunyi = 0 }: { kelompok: KelompokCepat[]; tersembunyi?: number }) {
  const [buka, setBuka] = useState(false);
  // dibuka dari luar (mis. "Bantuan"): fokus kembali ke pembukanya saat popup ditutup, bukan ke pil
  const pembuka = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const bukaDariLuar = () => {
      pembuka.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setBuka(true);
    };
    window.addEventListener(PERISTIWA_BUKA_MASUK_CEPAT, bukaDariLuar);
    return () => window.removeEventListener(PERISTIWA_BUKA_MASUK_CEPAT, bukaDariLuar);
  }, []);
  return (
    <RPopover.Root open={buka} onOpenChange={setBuka}>
      <RPopover.Trigger asChild>
        <button
          type="button"
          data-testid="masuk-cepat-pil"
          className="fixed bottom-16 right-4 z-40 inline-flex min-h-9 items-center gap-2 rounded-full border border-aksen-300 bg-primer-850 px-3 py-1.5 font-sans text-xs font-semibold text-latar shadow-[var(--shadow-overlay)] transition-colors hover:bg-primer-700 pointer-coarse:min-h-11 sm:bottom-4"
        >
          <LogIn aria-hidden className="size-4 shrink-0 text-aksen-300" />
          Masuk cepat (demo)
        </button>
      </RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content
          side="top"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          aria-label="Masuk cepat (demo)"
          data-testid="masuk-cepat-panel"
          onCloseAutoFocus={(e) => {
            if (pembuka.current?.isConnected) {
              e.preventDefault();
              pembuka.current.focus();
            }
            pembuka.current = null;
          }}
          className="z-50 flex max-h-[min(34rem,calc(100dvh-6rem))] w-[23rem] max-w-[calc(100vw-2rem)] flex-col overscroll-contain rounded-lg border border-primer-300 bg-latar font-sans shadow-[var(--shadow-overlay)] outline-none"
        >
          <header className="flex items-center justify-between gap-2 rounded-t-lg bg-primer-800 px-3 py-2 text-latar">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <LogIn aria-hidden className="size-4 text-aksen-300" /> Masuk cepat (demo)
            </p>
            <RPopover.Close aria-label="Tutup Masuk cepat" className="inline-flex size-9 items-center justify-center rounded transition-colors hover:bg-primer-700">
              <X aria-hidden className="size-4" />
            </RPopover.Close>
          </header>
          <div className="space-y-4 overflow-y-auto overscroll-contain p-3 text-sm">
            <p className="text-xs text-teks-redup">
              Pilih akun untuk langsung masuk. Untuk mengetik sendiri, nama pengguna ada di kanan nama, kata sandinya{" "}
              <code className="rounded-sm bg-primer-100 px-1 font-mono font-semibold text-primer-900">{KATA_SANDI_DEMO}</code>.
            </p>
            {kelompok.map((k, i) => (
              <section key={k.judul} aria-labelledby={`cepat-${i}`}>
                <h2 id={`cepat-${i}`} className="text-xs font-semibold text-primer-800">
                  {k.judul}
                </h2>
                {k.catatan ? <p className="text-xs text-teks-redup">{k.catatan}</p> : null}
                <ul className="mt-1.5 space-y-1">
                  {k.akun.map((a) => (
                    <li key={a.idBima}>
                      <a
                        href={a.href}
                        rel="nofollow"
                        className="flex min-h-11 items-center justify-between gap-3 rounded border border-primer-200 bg-white px-2.5 py-1.5 transition-colors hover:border-primer-400 hover:bg-primer-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-primer-900">{a.nama}</span>
                          <span className="block truncate text-xs text-teks-redup">{a.keterangan}</span>
                        </span>
                        <span className="shrink-0 font-mono text-xs text-teks-redup">{a.idBima}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {tersembunyi > 0 ? (
              <p data-testid="akun-skala-tersembunyi" className="border-t border-primer-200 pt-2 text-xs text-teks-redup">
                {tersembunyi} akun reviewer data simulasi (10.000 dan 1.200 proposal) disembunyikan.
              </p>
            ) : null}
          </div>
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}
