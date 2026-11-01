import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { LabelBima, NavBima } from "@/components/layout/header-bima";
import { ambilSesiBima } from "@/lib/bima/sesi";

export const dynamic = "force-dynamic";

/** Fon BIMA (Poppins); hanya untuk halaman BIMA tiruan. Modal SEMAR (portal di body) tetap memakai Outfit, fon SEMAR. */
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

/** Judul tab BIMA tiruan tidak ikut templat "· SEMAR": sistem lain. Tidak untuk diindeks mesin pencari (tiruan sistem resmi). */
export const metadata: Metadata = {
  title: { template: "%s · Simulasi BIMA", default: "Simulasi BIMA" },
  robots: { index: false, follow: false },
};

/**
 * Halaman BIMA tiruan meniru tampilan BIMA (logo, warna, fon Poppins) supaya alur demo terasa seperti aslinya, dengan pengaman:
 * bilah tetap "Simulasi BIMA – bukan sistem resmi", hanya akun demo yang dapat masuk (kata sandi tidak disimpan), dan kaki halaman
 * menyebut simulasi, bukan nama lembaga.
 */
export default async function LayoutBima({ children }: { children: React.ReactNode }) {
  const akun = await ambilSesiBima();
  return (
    <div className={`${poppins.className} min-h-screen bg-[#f7f7f9] text-[#1e2a5e]`}>
      <a href="#isi" className="sr-only-fokus fixed left-2 top-2 z-[60] rounded bg-white px-3 py-2 text-sm font-semibold text-[#1e2a5e] focus:not-sr-only">
        Lewati ke isi
      </a>
      <div className="sticky top-0 z-30">
        <LabelBima />
        <NavBima nama={akun?.nama} />
      </div>
      <main id="isi" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-24 text-center text-xs text-slate-500">Simulasi BIMA untuk prototipe SEMAR (data rekaan). Bukan layanan resmi.</footer>
    </div>
  );
}
