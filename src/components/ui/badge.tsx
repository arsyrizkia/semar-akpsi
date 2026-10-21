import { cn } from "@/lib/utils";

const warna = {
  netral: "bg-sogan-100 text-sogan-800 border-sogan-200",
  emas: "bg-emas-50 text-emas-700 border-emas-300",
  daun: "bg-daun-100 text-daun-700 border-daun-500",
  bata: "bg-bata-100 text-bata-700 border-bata-500",
  sogan: "bg-sogan-700 text-krem border-sogan-800",
} as const;

export type WarnaBadge = keyof typeof warna;

export function Badge({ warna: w = "netral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { warna?: WarnaBadge }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", warna[w], className)}
      {...props}
    />
  );
}

/** Pemetaan status baku (docs/spesifikasi-ui.md, bagian Status) ke warna. Status selalu ditulis sebagai teks, bukan hanya warna. */
const petaStatus: Record<string, WarnaBadge> = {
  Draf: "netral",
  Terbit: "daun",
  Arsip: "netral",
  Aktif: "daun",
  "Perlu ditinjau": "emas",
  Nonaktif: "netral",
  "Belum diajukan": "netral",
  "Sedang diperiksa": "emas",
  Terkirim: "daun",
  Ditahan: "emas",
  Ditolak: "bata",
  Lolos: "daun",
  Gagal: "bata",
  Memenuhi: "daun",
  "Tidak memenuhi": "bata",
  "Perlu diperiksa manual": "emas",
  "Belum ada rekomendasi": "netral",
  Diusulkan: "netral",
  Ditetapkan: "sogan",
  Selesai: "daun",
  Baru: "emas",
  "Dikoreksi reviewer": "sogan",
  tiruan: "netral",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge warna={petaStatus[status] ?? "netral"} className={className}>
      {status}
    </Badge>
  );
}
