import { LabelBima, NavBima } from "@/components/layout/header-bima";
import { ambilSesiBima } from "@/lib/bima/sesi";

export const dynamic = "force-dynamic";

/** Semua halaman BIMA tiruan memuat label tetap "Simulasi BIMA – bukan sistem resmi". */
export default async function LayoutBima({ children }: { children: React.ReactNode }) {
  const akun = await ambilSesiBima();
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <LabelBima />
      <NavBima nama={akun?.nama} />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-500">
        Halaman ini hanya simulasi untuk prototipe SEMAR. Tidak ada kaitan dengan sistem, logo, atau domain resmi.
      </footer>
    </div>
  );
}
