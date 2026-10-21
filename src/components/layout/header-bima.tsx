import Link from "next/link";

/** Label tetap sisi BIMA tiruan (keputusan 1). Tanpa logo atau identitas resmi. */
export function LabelBima() {
  return (
    <div className="bg-slate-800 px-4 py-1.5 text-center text-sm font-semibold text-slate-100" role="note">
      Simulasi BIMA – bukan sistem resmi
    </div>
  );
}

export function NavBima({ nama }: { nama?: string | null }) {
  return (
    <header className="border-b border-slate-300 bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-lg font-bold tracking-tight">Simulasi layanan pengusulan</p>
        <nav aria-label="Menu BIMA tiruan" className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/bima/pengajuan" className="text-slate-800 underline-offset-4 hover:underline">
            Pengajuan proposal
          </Link>
          <Link href="/bima/kotak-masuk" className="text-slate-800 underline-offset-4 hover:underline">
            Kotak masuk
          </Link>
          {nama ? (
            <form action="/api/bima/sesi/keluar" method="post" className="flex items-center gap-2">
              <span className="text-slate-600">{nama}</span>
              <button type="submit" className="rounded border border-slate-500 px-2 py-1 hover:bg-slate-200">
                Keluar
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
