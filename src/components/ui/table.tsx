import { cn } from "@/lib/utils";

/**
 * Tabel padat. `tinggiMaks` (mis. "28rem") membuat badan tabel menggulir dengan kepala lengket.
 * Kolom angka memakai `<TH angka>` dan `<TD angka>` (rata kanan, angka tabular).
 */
export function Table({ className, tinggiMaks, ...props }: React.TableHTMLAttributes<HTMLTableElement> & { tinggiMaks?: string }) {
  return (
    <div className="overflow-auto rounded-md border border-sogan-200 bg-white" style={tinggiMaks ? { maxHeight: tinggiMaks } : undefined}>
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}
export const THead = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("sticky top-0 z-10 bg-sogan-50 text-sogan-800 shadow-[0_1px_0_var(--color-sogan-200)]", className)} {...p} />
);
export const TBody = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("divide-y divide-sogan-100", className)} {...p} />
);
export function TR({ className, tersorot, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { tersorot?: boolean }) {
  return <tr aria-current={tersorot ? "true" : undefined} className={cn("hover:bg-krem", tersorot && "bg-emas-50 shadow-[inset_3px_0_0_var(--color-emas-500)]", className)} {...props} />;
}
export function TH({ className, angka, ...props }: React.ThHTMLAttributes<HTMLTableCellElement> & { angka?: boolean }) {
  return <th scope="col" className={cn("px-3 py-2 text-xs font-semibold uppercase tracking-wide", angka && "text-right", className)} {...props} />;
}
export function TD({ className, angka, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { angka?: boolean }) {
  return <td className={cn("px-3 py-2 align-top", angka && "angka text-right", className)} {...props} />;
}
