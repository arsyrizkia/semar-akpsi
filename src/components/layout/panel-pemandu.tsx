"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BookOpen, ChevronDown, ChevronUp, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const KUNCI = "semar:pemandu";
const PERISTIWA = "semar:pemandu-ubah";

function langganan(cb: () => void) {
  window.addEventListener(PERISTIWA, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(PERISTIWA, cb);
    window.removeEventListener("storage", cb);
  };
}

function bacaSembunyi() {
  try {
    return localStorage.getItem(KUNCI) === "sembunyi";
  } catch {
    return false;
  }
}

export interface LangkahPemandu {
  /** nomor langkah real use case, mis. "1", "S-1.2", "4a" */
  nomor: string;
  teks: string;
  /** langkah alternatif / subflow */
  alternatif?: boolean;
}

/**
 * Panel pemandu langkah real use case (keputusan 10). Bisa disembunyikan; pilihan disimpan di localStorage.
 * Contoh: <PanelPemandu kode="UC-01" judul="Mengelola templat proposal" langkah={[{ nomor: "1", teks: "..." }]} />
 */
export function PanelPemandu({
  kode,
  judul,
  langkah,
  aktifNomor,
}: {
  kode: string;
  judul: string;
  langkah: LangkahPemandu[];
  /** sorot satu langkah yang sedang berlangsung */
  aktifNomor?: string;
}) {
  // Bawaan: ciut (hanya kepala panel + langkah aktif) agar tidak menutupi isi jendela; pengguna membukanya bila perlu.
  const [terbuka, setTerbuka] = useState(false);
  const aktifRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (terbuka) aktifRef.current?.scrollIntoView({ block: "nearest" });
  }, [terbuka, aktifNomor]);
  const tersembunyi = useSyncExternalStore(langganan, bacaSembunyi, () => false);

  function atur(sembunyi: boolean) {
    try {
      localStorage.setItem(KUNCI, sembunyi ? "sembunyi" : "tampil");
    } catch {
      /* penyimpanan tidak tersedia */
    }
    window.dispatchEvent(new Event(PERISTIWA));
  }

  if (tersembunyi) {
    return (
      <button
        type="button"
        onClick={() => atur(false)}
        className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-sogan-700 px-4 py-2 text-sm font-semibold text-krem shadow-lg hover:bg-sogan-800"
      >
        <BookOpen aria-hidden className="size-4" /> Tampilkan panduan
      </button>
    );
  }

  return (
    <aside
      aria-label={`Panduan langkah ${kode}`}
      className="fixed bottom-4 right-4 z-30 w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border border-emas-500 bg-krem shadow-xl"
    >
      <header className="flex items-center justify-between gap-2 rounded-t-lg bg-sogan-800 px-3 py-2 text-krem">
        <p className="text-sm font-semibold">
          <span className="text-emas-300">{kode}</span> {judul}
        </p>
        <span className="flex gap-1">
          <button type="button" aria-label={terbuka ? "Ciutkan panduan" : "Buka panduan"} onClick={() => setTerbuka(!terbuka)} className="rounded p-1 hover:bg-sogan-700">
            {terbuka ? <ChevronDown aria-hidden className="size-4" /> : <ChevronUp aria-hidden className="size-4" />}
          </button>
          <button type="button" aria-label="Sembunyikan panduan" onClick={() => atur(true)} className="rounded p-1 hover:bg-sogan-700">
            <EyeOff aria-hidden className="size-4" />
          </button>
        </span>
      </header>
      {!terbuka && aktifNomor ? (
        <p className="px-3 py-1.5 text-xs text-sogan-800">
          <span className="font-mono font-bold text-emas-700">{aktifNomor}</span>{" "}
          {langkah.find((l) => l.nomor === aktifNomor)?.teks.slice(0, 90)}
        </p>
      ) : null}
      {terbuka ? (
        <ol className="max-h-72 space-y-1.5 overflow-y-auto p-3 text-sm">
          {langkah.map((l) => (
            <li
              key={l.nomor + l.teks}
              ref={aktifNomor === l.nomor ? aktifRef : undefined}
              className={cn(
                "flex gap-2 rounded px-2 py-1",
                l.alternatif && "bg-emas-50",
                aktifNomor === l.nomor && "bg-emas-100 font-semibold ring-1 ring-emas-500",
              )}
            >
              <span className="w-9 shrink-0 font-mono text-xs font-bold text-emas-700">{l.nomor}</span>
              <span>{l.teks}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </aside>
  );
}
