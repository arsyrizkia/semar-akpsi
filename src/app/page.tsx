import Link from "next/link";
import { SemarIlustrasi, LogoSemar } from "@/components/merek";
import { Button } from "@/components/ui";

/** Halaman depan: penjelasan singkat SEMAR dan dua pintu masuk (demo dan masuk). */
export default function Awal() {
  return (
    <main className="latar-kawung-terang flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-sogan-300 bg-krem shadow-xl md:grid-cols-[1fr_1.2fr]">
        <div className="latar-kawung flex flex-col items-center justify-center gap-4 p-8">
          <SemarIlustrasi className="max-w-[260px]" />
          <p className="text-center font-serif text-lg text-emas-100">Semar menunjuk jalan, reviewer yang memutuskan.</p>
        </div>
        <div className="flex flex-col justify-center gap-5 p-8">
          <LogoSemar terang={false} />
          <div>
            <h1 className="text-3xl font-bold">SEMAR</h1>
            <p className="mt-1 font-semibold text-sogan-800">Sistem Evaluasi Mandiri dan Asisten Reviewer</p>
            <p className="mt-2 text-sogan-700">
              Prototipe pemeriksaan administratif proposal penelitian. Pengusul mendapat hasil pemeriksaan butir yang dapat dihitung, sedangkan reviewer
              menerima rekomendasi butir semantik beserta kutipan pendukung dan tetap memegang keputusan akhir. Tim Kerja DPPM mengelola templat, aturan,
              penugasan, dan memantau kesesuaian penilaian.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild ukuran="lg" varian="emas">
              <Link href="/demo">Buka Pusat Demo</Link>
            </Button>
            <Button asChild ukuran="lg" varian="garis">
              <Link href="/masuk">Masuk</Link>
            </Button>
          </div>
          <p className="text-xs text-sogan-600">Seluruh data dan akun adalah rekaan. BIMA pada prototipe ini adalah simulasi, bukan sistem resmi.</p>
        </div>
      </div>
    </main>
  );
}
