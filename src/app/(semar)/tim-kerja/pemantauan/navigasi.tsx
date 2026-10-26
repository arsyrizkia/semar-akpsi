"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TAB_PEMANTAUAN, bacaTabPemantauan, type TabPemantauan } from "@/lib/pemantauan/alamat";

/**
 * Navigasi J-05 di sisi klien. Laporan dihitung sekali per periode dan skema; tab, urutan, dan M-08 hanya mengganti URL lewat
 * history.pushState/replaceState (diikuti useSearchParams di Next.js), jadi tidak menghitung ulang laporan di server. Tautan tetap
 * ber-href sehingga dapat dibuka di tab baru dan bekerja tanpa JavaScript.
 */
export function useUbahUrl() {
  const jalur = usePathname();
  const cari = useSearchParams();
  const alamat = (ubah: Record<string, string | null>) => {
    const p = new URLSearchParams(cari.toString());
    for (const [k, v] of Object.entries(ubah)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const q = p.toString();
    return q ? `${jalur}?${q}` : jalur;
  };
  const ganti = (ubah: Record<string, string | null>, cara: "replace" | "push" = "replace") => {
    const url = alamat(ubah);
    if (cara === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };
  return { alamat, ganti, cari };
}

const klikBiasa = (e: React.MouseEvent) => !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** Tautan pembuka M-08 Rincian Butir (`?butir=`, replace: satu Back tetap keluar dari J-05). */
export function TautanRincian({ kode, children, className, labelAria }: { kode: string; children: React.ReactNode; className?: string; labelAria?: string }) {
  const { alamat, ganti } = useUbahUrl();
  return (
    <a
      href={alamat({ butir: kode })}
      aria-label={labelAria}
      className={className}
      onClick={(e) => {
        if (!klikBiasa(e)) return;
        e.preventDefault();
        ganti({ butir: kode });
      }}
    >
      {children}
    </a>
  );
}

/** Tab ber-URL (push: Back kembali ke tab sebelumnya). Ketiga panel sudah dirender server; hanya yang aktif ditampilkan. */
export function PanelTab({ label, jumlah, panel }: { label: Record<TabPemantauan, string>; jumlah: Partial<Record<TabPemantauan, number>>; panel: Record<TabPemantauan, React.ReactNode> }) {
  const { alamat, ganti, cari } = useUbahUrl();
  const tab = bacaTabPemantauan(cari.get("tab") ?? undefined);
  return (
    <section aria-labelledby="judul-tab-pemantauan" className="mt-10">
      <h2 id="judul-tab-pemantauan" className="sr-only">
        {label[tab]}
      </h2>
      <nav aria-label="Bagian pemantauan" className="flex flex-wrap gap-1 border-b border-primer-200">
        {TAB_PEMANTAUAN.map((t) => (
          <a
            key={t}
            href={alamat({ tab: t === "semantik" ? null : t, butir: null })}
            aria-current={tab === t ? "page" : undefined}
            onClick={(e) => {
              if (!klikBiasa(e)) return;
              e.preventDefault();
              if (t !== tab) ganti({ tab: t === "semantik" ? null : t, butir: null }, "push");
            }}
            className={cn(
              "-mb-px inline-flex items-center whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors pointer-coarse:min-h-11",
              tab === t ? "border-primer-400 text-primer-900" : "border-transparent text-primer-700 hover:text-primer-900",
            )}
          >
            {label[t]}
            {jumlah[t] !== undefined ? <span className="angka ml-1 font-normal text-teks-redup">({jumlah[t]?.toLocaleString("id-ID")})</span> : null}
          </a>
        ))}
      </nav>
      <div className="pt-4">{panel[tab]}</div>
    </section>
  );
}
