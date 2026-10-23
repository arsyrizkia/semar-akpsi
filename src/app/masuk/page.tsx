import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoSemar, SemarIlustrasi } from "@/components/merek";
import { Alert, Button } from "@/components/ui";
import { ambilSesi, targetSetelahMasuk } from "@/lib/auth";
import { jalurAman } from "@/lib/sesi";

export const metadata: Metadata = { title: "J-01 Masuk" };
export const dynamic = "force-dynamic";

/**
 * J-01 Masuk: Tim Kerja DPPM dan Reviewer. Pengusul tidak memakai jendela ini (mereka masuk dari BIMA langsung ke J-06).
 * Merek dan ilustrasi hanya di panel kiri (area merek, berkawung); sisi kanan bersih: satu judul, satu tombol, satu tautan demo.
 */
export default async function Masuk({ searchParams }: { searchParams: Promise<{ galat?: string; lanjut?: string }> }) {
  const { galat, lanjut: lanjutMentah } = await searchParams;
  const lanjut = jalurAman(lanjutMentah, "");
  const sesi = await ambilSesi();
  if (sesi) redirect(lanjut || targetSetelahMasuk(sesi.akun));

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-[minmax(22rem,30rem)_1fr]">
      <a href="#isi" className="sr-only-fokus fixed left-2 top-2 z-[60] rounded-md bg-white px-3 py-2 text-sm font-semibold text-primer-900 focus:not-sr-only">Lewati ke isi</a>
      <aside className="latar-kawung flex flex-col gap-8 px-6 py-5 text-white lg:px-10 lg:py-10">
        <LogoSemar />
        {/* area merek: ilustrasi di medali terang agar sogan tetap terbaca di atas navy; tagline di bawahnya, satu kelompok di tengah panel */}
        <div className="hidden flex-1 flex-col items-center justify-center gap-6 pb-10 lg:flex">
          <div className="flex size-64 items-center justify-center rounded-full bg-latar-100 ring-4 ring-aksen-300">
            <SemarIlustrasi className="h-52 w-auto" judul="Ilustrasi Semar menunjuk jalan" />
          </div>
          <p className="max-w-xs text-center text-xl font-medium text-aksen-300 text-pretty">Semar menunjuk jalan, reviewer yang memutuskan.</p>
        </div>
      </aside>
      <main id="isi" className="flex items-center justify-center px-6 pb-28 pt-12">
        <div className="w-full max-w-sm">
          <p className="mb-1 font-mono text-xs font-semibold text-abu-600">J-01</p>
          <h1 className="text-3xl font-semibold">Masuk</h1>
          <p className="mt-2 text-teks-redup text-pretty">Untuk Tim Kerja DPPM dan Reviewer. Anda diarahkan ke BIMA, lalu kembali ke SEMAR.</p>
          {galat ? (
            <Alert jenis="galat" judul="Gagal masuk" className="mt-5">
              Token masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi.
            </Alert>
          ) : null}
          <Button asChild ukuran="lg" className="mt-6 w-full">
            <Link href={lanjut ? `/bima/masuk?kembali=/api/sso/callback&lanjut=${encodeURIComponent(lanjut)}` : "/bima/masuk?kembali=/api/sso/callback"}>Masuk dengan akun BIMA</Link>
          </Button>
          <p className="mt-6 text-sm text-teks-redup">
            Ingin mencoba tanpa akun?{" "}
            <Link href="/demo" className="font-semibold text-primer-800 underline underline-offset-2">
              Buka Pusat Demo
            </Link>
          </p>
          <p className="mt-10 border-t border-primer-200 pt-4 text-xs text-abu-600">
            BIMA pada prototipe ini adalah simulasi, bukan sistem resmi. Pengusul tidak masuk dari sini; pengusul membuka SEMAR dari halaman proposal di BIMA.
          </p>
        </div>
      </main>
    </div>
  );
}
