"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Isi `data-label` setiap sel dari kepala kolomnya (dipakai tampilan bertumpuk di layar sempit). Sel dengan colSpan tidak diberi label. */
function pasangLabelKolom(tabel: HTMLTableElement) {
  const kepala = [...(tabel.tHead?.rows[0]?.cells ?? [])].flatMap((th) => Array<string>(Math.max(1, th.colSpan)).fill(th.firstElementChild?.classList.contains("sr-only") ? "" : (th.textContent ?? "").trim()));
  if (kepala.length === 0) return;
  for (const baris of tabel.tBodies[0]?.rows ?? []) {
    let i = 0;
    for (const sel of baris.cells) {
      const label = sel.colSpan > 1 ? "" : (kepala[i] ?? "");
      if (sel.getAttribute("data-label") !== label) sel.setAttribute("data-label", label);
      i += Math.max(1, sel.colSpan);
    }
  }
}

/**
 * Tabel padat. `tinggiMaks` (mis. "28rem") membuat badan tabel menggulir dengan kepala lengket.
 * Kolom angka memakai `<TH angka>` dan `<TD angka>` (rata kanan, angka tabular).
 * Di bawah 48rem (tablet kecil dan ponsel) setiap baris menjadi blok bertumpuk berlabel kolom (kelas `tumpuk` di globals.css),
 * jadi aksi utama dan pesan galat tidak pernah tersembunyi di balik gulir ke samping. `tumpuk={false}` mematikannya.
 */
export function Table({ className, tinggiMaks, tumpuk = true, ...props }: React.TableHTMLAttributes<HTMLTableElement> & { tinggiMaks?: string; tumpuk?: boolean }) {
  const pembungkus = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tabel = pembungkus.current?.querySelector("table");
    if (!tabel || !tumpuk) return;
    pasangLabelKolom(tabel);
    const pengamat = new MutationObserver(() => pasangLabelKolom(tabel));
    pengamat.observe(tabel, { childList: true, subtree: true });
    return () => pengamat.disconnect();
  }, [tumpuk]);
  return (
    <div
      ref={pembungkus}
      tabIndex={tinggiMaks ? 0 : undefined}
      role={tinggiMaks ? "region" : undefined}
      aria-label={tinggiMaks ? (props["aria-label"] ?? "Tabel") : undefined}
      className="overflow-auto rounded-md border border-primer-200 bg-white"
      style={tinggiMaks ? { maxHeight: tinggiMaks } : undefined}
    >
      <table className={cn("w-full border-collapse text-left text-sm", tumpuk && "tumpuk", className)} {...props} />
    </div>
  );
}
export const THead = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("sticky top-0 z-10 bg-primer-50 text-primer-800 shadow-[0_1px_0_var(--color-primer-200)]", className)} {...p} />
);
export const TBody = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("divide-y divide-primer-100", className)} {...p} />
);
export function TR({ className, tersorot, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { tersorot?: boolean }) {
  return <tr aria-current={tersorot ? "true" : undefined} className={cn("hover:bg-latar", tersorot && "bg-primer-50 shadow-[inset_3px_0_0_var(--color-primer-400)]", className)} {...props} />;
}
export function TH({ className, angka, ...props }: React.ThHTMLAttributes<HTMLTableCellElement> & { angka?: boolean }) {
  return <th scope="col" className={cn("px-3 py-2 text-xs font-semibold", angka && "text-right", className)} {...props} />;
}
export function TD({ className, angka, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { angka?: boolean }) {
  return <td className={cn("px-3 py-2 align-top", angka && "angka text-right", className)} {...props} />;
}
