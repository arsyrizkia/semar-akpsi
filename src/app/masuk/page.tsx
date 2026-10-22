import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SemarIlustrasi, LogoSemar } from "@/components/merek";
import { Alert, Button } from "@/components/ui";
import { ambilSesi, targetSetelahMasuk } from "@/lib/auth";

export const metadata: Metadata = { title: "J-01 Masuk" };
export const dynamic = "force-dynamic";

/** J-01 Masuk: Tim Kerja DPPM dan Reviewer. Pengusul tidak memakai jendela ini. */
export default async function Masuk({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const { galat } = await searchParams;
  const sesi = await ambilSesi();
  if (sesi) redirect(targetSetelahMasuk(sesi.akun));

  return (
    <main className="latar-kawung-terang flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-sogan-300 bg-krem shadow-xl md:grid-cols-[1fr_1.2fr]">
        <div className="latar-kawung flex flex-col items-center justify-center gap-4 p-8">
          <SemarIlustrasi className="max-w-[260px]" />
          <p className="text-center text-lg text-emas-100">Semar menunjuk jalan, reviewer yang memutuskan.</p>
        </div>
        <div className="flex flex-col justify-center gap-5 p-8">
          <LogoSemar terang={false} />
          <div>
            <h1 className="text-3xl font-bold">Masuk</h1>
            <p className="mt-1 text-sogan-700">
              Untuk Tim Kerja DPPM dan Reviewer. Masuk memakai akun BIMA; Anda akan diarahkan ke BIMA lalu kembali ke SEMAR.
            </p>
          </div>
          {galat ? <Alert jenis="galat" judul="Gagal masuk">Token masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi.</Alert> : null}
          <Button asChild ukuran="lg" varian="emas">
            <Link href="/bima/masuk?kembali=/api/sso/callback">Masuk dengan akun BIMA</Link>
          </Button>
          <p className="text-xs text-sogan-600">
            BIMA pada prototipe ini adalah simulasi (bukan sistem resmi). Pengusul tidak masuk dari sini: pengusul membuka SEMAR dari
            halaman proposal di BIMA.
          </p>
        </div>
      </div>
    </main>
  );
}
