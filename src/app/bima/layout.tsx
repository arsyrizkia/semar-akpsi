import type { Metadata } from "next";
import { LabelBima, NavBima } from "@/components/layout/header-bima";
import { ambilSesiBima } from "@/lib/bima/sesi";

export const dynamic = "force-dynamic";

/** Judul tab BIMA tiruan tidak ikut templat "· SEMAR": sistem lain. */
export const metadata: Metadata = { title: { template: "%s · Simulasi BIMA", default: "Simulasi BIMA" } };

/**
 * Semua halaman BIMA tiruan memuat label tetap "Simulasi BIMA – bukan sistem resmi". Tampilannya sengaja berbeda dari SEMAR:
 * font sistem (bukan Outfit, font merek Semar), abu-abu netral, sudut tegas, tanpa logo atau identitas Kemdiktisaintek.
 */
export default async function LayoutBima({ children }: { children: React.ReactNode }) {
  const akun = await ambilSesiBima();
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 [font-family:Arial,Helvetica,sans-serif]">
      <a href="#isi" className="sr-only-fokus fixed left-2 top-2 z-[60] bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:not-sr-only">Lewati ke isi</a>
      <LabelBima />
      <NavBima nama={akun?.nama} />
      <main id="isi" className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-24 text-xs text-slate-600">
        Halaman ini hanya simulasi untuk prototipe SEMAR. Tidak ada kaitan dengan sistem, logo, atau domain resmi.
      </footer>
    </div>
  );
}
