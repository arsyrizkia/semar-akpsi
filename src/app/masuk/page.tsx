import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoSemar, SemarIlustrasi } from "@/components/merek";
import { Alert, Button } from "@/components/ui";
import { ambilSesi, targetSetelahMasuk } from "@/lib/auth";

export const metadata: Metadata = { title: "J-01 Masuk" };
export const dynamic = "force-dynamic";

/**
 * J-01 Masuk: Tim Kerja DPPM dan Reviewer. Pengusul tidak memakai jendela ini (mereka masuk dari BIMA langsung ke J-06).
 * Merek dan ilustrasi hanya di panel kiri (area merek, berkawung); sisi kanan bersih: satu judul, satu tombol, satu tautan demo.
 */
export default async function Masuk({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const { galat } = await searchParams;
  const sesi = await ambilSesi();
  if (sesi) redirect(targetSetelahMasuk(sesi.akun));

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(22rem,30rem)_1fr]">
      <a href="#isi" className="sr-only-fokus fixed left-2 top-2 z-[60] rounded-md bg-white px-3 py-2 text-sm font-semibold text-sogan-900 focus:not-sr-only">Lewati ke isi</a>
      <aside className="latar-kawung flex flex-col justify-between gap-8 px-6 py-6 text-krem lg:px-10 lg:py-10">
        <LogoSemar />
        <div className="hidden flex-col items-start gap-5 lg:flex">
          <SemarIlustrasi className="max-w-44" judul="Ilustrasi Semar menunjuk jalan" />
          <p className="max-w-xs text-lg font-medium text-emas-100 text-pretty">Semar menunjuk jalan, reviewer yang memutuskan.</p>
        </div>
      </aside>
      <main id="isi" className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold">Masuk</h1>
          <p className="mt-2 text-sogan-700 text-pretty">Untuk Tim Kerja DPPM dan Reviewer. Anda diarahkan ke BIMA, lalu kembali ke SEMAR.</p>
          {galat ? (
            <Alert jenis="galat" judul="Gagal masuk" className="mt-5">
              Token masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi.
            </Alert>
          ) : null}
          <Button asChild ukuran="lg" className="mt-6 w-full">
            <Link href="/bima/masuk?kembali=/api/sso/callback">Masuk dengan akun BIMA</Link>
          </Button>
          <p className="mt-6 text-sm text-sogan-700">
            Ingin mencoba tanpa akun?{" "}
            <Link href="/demo" className="font-semibold text-sogan-800 underline underline-offset-2">
              Buka Pusat Demo
            </Link>
          </p>
          <p className="mt-10 border-t border-sogan-200 pt-4 text-xs text-abu-600">
            BIMA pada prototipe ini adalah simulasi, bukan sistem resmi. Pengusul tidak masuk dari sini; pengusul membuka SEMAR dari halaman proposal di BIMA.
          </p>
        </div>
      </main>
    </div>
  );
}
