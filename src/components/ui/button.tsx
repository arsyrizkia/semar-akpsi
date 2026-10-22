import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tombol. Varian: utama (satu per layar), sekunder (bergaris), hantu (aksi tersier), bahaya (aksi merusak).
 * `emas` dan `garis` dipertahankan untuk halaman lama (emas = utama, garis = sekunder).
 */
const varian = {
  utama: "bg-sogan-700 text-krem hover:bg-sogan-800 disabled:bg-sogan-300 disabled:text-sogan-50",
  sekunder: "border border-sogan-500 bg-white text-sogan-800 hover:bg-sogan-50 disabled:border-sogan-200 disabled:text-sogan-400",
  hantu: "bg-transparent text-sogan-700 hover:bg-sogan-100 disabled:text-sogan-300",
  bahaya: "bg-bata-600 text-white hover:bg-bata-700 disabled:bg-bata-100 disabled:text-bata-500",
  /** @deprecated pakai utama */
  emas: "bg-sogan-700 text-krem hover:bg-sogan-800 disabled:bg-sogan-300 disabled:text-sogan-50",
  /** @deprecated pakai sekunder */
  garis: "border border-sogan-500 bg-white text-sogan-800 hover:bg-sogan-50 disabled:border-sogan-200 disabled:text-sogan-400",
} as const;

/** Layar sentuh (pointer kasar) memakai target minimal 44 px; penunjuk halus tetap padat untuk tabel kerja. */
const ukuran = { sm: "h-8 pointer-coarse:h-11 px-3 text-sm", md: "h-10 pointer-coarse:h-11 px-4 text-sm", lg: "h-11 px-5 text-base" } as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: keyof typeof varian;
  ukuran?: keyof typeof ukuran;
  asChild?: boolean;
  /** status memuat: tombol nonaktif, memutar ikon, dan diumumkan sebagai sibuk */
  memuat?: boolean;
}

export const kelasTombol = (v: keyof typeof varian = "utama", u: keyof typeof ukuran = "md", tambahan?: string) =>
  cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed",
    varian[v],
    ukuran[u],
    tambahan,
  );

export function Button({ className, varian: v = "utama", ukuran: u = "md", asChild, type, memuat, disabled, children, ...props }: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root className={kelasTombol(v, u, className)} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type={type ?? "button"}
      className={kelasTombol(v, u, className)}
      disabled={disabled || memuat}
      aria-busy={memuat || undefined}
      {...props}
    >
      {memuat ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export { Button as Tombol };
