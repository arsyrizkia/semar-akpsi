import Link from "next/link";
import { LogOut } from "lucide-react";
import { LogoSemar } from "@/components/merek";
import { targetSetelahMasuk, type Akun } from "@/lib/auth";

const namaPeran = { tim_kerja: "Tim Kerja DPPM", reviewer: "Reviewer", pengusul: "Pengusul" } as const;

export function HeaderSemar({ akun, pengelola, children }: { akun: Akun; pengelola: boolean; children?: React.ReactNode }) {
  return (
    <>
      <header className="latar-kawung text-krem">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          {akun.peran === "pengusul" ? (
            <LogoSemar />
          ) : (
            <Link href={targetSetelahMasuk(akun)} aria-label="SEMAR, ke jendela awal">
              <LogoSemar />
            </Link>
          )}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right leading-tight">
              <p className="font-semibold">{akun.nama}</p>
              <p className="text-xs text-krem-200">
                {namaPeran[akun.peran]}
                {pengelola ? " (pengelola)" : ""} - {akun.institusi}
              </p>
            </div>
            {akun.peran === "pengusul" ? null : (
            <form action="/api/sso/keluar" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md border border-emas-400 px-3 py-1.5 font-semibold text-emas-100 hover:bg-sogan-700"
              >
                <LogOut aria-hidden className="size-4" /> Keluar
              </button>
            </form>
            )}
          </div>
        </div>
        {children}
      </header>
      <p className="bg-emas-50 px-4 py-1 text-center text-xs text-sogan-800">
        Prototipe: seluruh nama orang dan institusi adalah <strong>contoh sementara</strong> (rekaan).
      </p>
    </>
  );
}
