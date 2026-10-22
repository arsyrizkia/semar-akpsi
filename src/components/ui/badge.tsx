import { AlertTriangle, Check, Minus, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const warna = {
  netral: "bg-abu-100 text-abu-700 border-abu-200",
  peringatan: "bg-peringatan-50 text-peringatan-700 border-peringatan-300",
  daun: "bg-daun-100 text-daun-700 border-daun-500/50",
  bata: "bg-bata-100 text-bata-700 border-bata-500/50",
} as const;

export type WarnaBadge = keyof typeof warna;

const ikonWarna: Partial<Record<WarnaBadge, LucideIcon>> = { daun: Check, bata: X, peringatan: AlertTriangle, netral: Minus };

export function Badge({ warna: w = "netral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { warna?: WarnaBadge }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-semibold whitespace-nowrap", warna[w], className)}
      {...props}
    />
  );
}

/** Pemetaan status baku (docs/spesifikasi-ui.md, bagian Status) ke warna. */
const petaStatus: Record<string, WarnaBadge> = {
  Draf: "netral",
  Terbit: "daun",
  Arsip: "netral",
  Aktif: "daun",
  "Perlu ditinjau": "peringatan",
  Nonaktif: "netral",
  "Belum diajukan": "netral",
  "Sedang diperiksa": "peringatan",
  Terkirim: "daun",
  Ditahan: "peringatan",
  Ditolak: "bata",
  Lolos: "daun",
  Gagal: "bata",
  Memenuhi: "daun",
  "Tidak memenuhi": "bata",
  "Perlu diperiksa manual": "peringatan",
  "Belum ada rekomendasi": "netral",
  Diusulkan: "netral",
  Ditetapkan: "daun",
  Selesai: "daun",
  Baru: "peringatan",
  "Dikoreksi reviewer": "netral",
  tiruan: "netral",
};

export const warnaStatus = (status: string): WarnaBadge => petaStatus[status] ?? "netral";

/**
 * Lencana status terpadu: warna + ikon kecil + teks (status tidak pernah hanya warna).
 * Lolos/Memenuhi hijau daun, Gagal/Tidak memenuhi merah bata, Perlu ditinjau kuning peringatan, selebihnya abu netral. Biru merek tidak dipakai sebagai warna status supaya tidak tertukar dengan aksi.
 */
export function LencanaStatus({ status, className }: { status: string; className?: string }) {
  const w = warnaStatus(status);
  const Ikon = ikonWarna[w];
  return (
    <Badge warna={w} className={className}>
      {Ikon ? <Ikon aria-hidden className="size-3" strokeWidth={3} /> : null}
      {status}
    </Badge>
  );
}

export { LencanaStatus as StatusBadge };
