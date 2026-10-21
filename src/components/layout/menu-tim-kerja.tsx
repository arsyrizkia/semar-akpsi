"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const semua = [
  { href: "/tim-kerja/templat", kode: "J-02", nama: "Templat Proposal", pengelola: true },
  { href: "/tim-kerja/aturan", kode: "J-03", nama: "Aturan Pemeriksaan", pengelola: true },
  { href: "/tim-kerja/penugasan", kode: "J-04", nama: "Penugasan Reviewer", pengelola: false },
  { href: "/tim-kerja/pemantauan", kode: "J-05", nama: "Pemantauan Kesesuaian", pengelola: false },
];

/** Menu bersama Tim Kerja DPPM. Non-pengelola hanya melihat J-04 dan J-05. */
export function MenuTimKerja({ pengelola }: { pengelola: boolean }) {
  const jalur = usePathname();
  return (
    <nav aria-label="Menu Tim Kerja DPPM" className="border-t border-sogan-600/60 bg-sogan-900/40">
      <ul className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4">
        {semua
          .filter((m) => pengelola || !m.pengelola)
          .map((m) => {
            const aktif = jalur.startsWith(m.href);
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  aria-current={aktif ? "page" : undefined}
                  className={cn(
                    "block border-b-4 px-4 py-2.5 text-sm font-semibold",
                    aktif ? "border-emas-400 text-emas-100" : "border-transparent text-krem-200 hover:text-white",
                  )}
                >
                  <span className="mr-1.5 text-xs text-emas-300">{m.kode}</span>
                  {m.nama}
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
