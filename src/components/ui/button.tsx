import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const varian = {
  utama: "bg-sogan-700 text-krem hover:bg-sogan-800 focus-visible:outline-emas-500 disabled:bg-sogan-300 disabled:text-sogan-50",
  emas: "bg-emas-400 text-sogan-900 hover:bg-emas-300 disabled:bg-emas-100 disabled:text-sogan-400",
  garis: "border border-sogan-500 bg-transparent text-sogan-800 hover:bg-sogan-100 disabled:border-sogan-200 disabled:text-sogan-300",
  hantu: "bg-transparent text-sogan-700 hover:bg-sogan-100 disabled:text-sogan-300",
  bahaya: "bg-bata-600 text-white hover:bg-bata-700 disabled:bg-bata-100 disabled:text-bata-500",
} as const;

const ukuran = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" } as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: keyof typeof varian;
  ukuran?: keyof typeof ukuran;
  asChild?: boolean;
}

export function Button({ className, varian: v = "utama", ukuran: u = "md", asChild, type, ...props }: ButtonProps) {
  const Komponen = asChild ? Slot.Root : "button";
  return (
    <Komponen
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed",
        varian[v],
        ukuran[u],
        className,
      )}
      {...props}
    />
  );
}
