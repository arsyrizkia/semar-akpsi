import { cn } from "@/lib/utils";
import { AMBANG_KEYAKINAN } from "@/lib/kontrak/tipe";

/** Tingkat keyakinan (NFR 5.2). Ambang contoh: tinggi >= 0,8; sedang 0,5 sampai < 0,8; rendah < 0,5. Tidak hanya warna: ada teks tingkat dan angka. */
export function tingkatKeyakinan(nilai: number): "Tinggi" | "Sedang" | "Rendah" {
  if (nilai >= AMBANG_KEYAKINAN.tinggi) return "Tinggi";
  if (nilai >= AMBANG_KEYAKINAN.sedang) return "Sedang";
  return "Rendah";
}

const gaya = {
  Tinggi: { isi: "bg-daun-600", teks: "text-daun-700" },
  Sedang: { isi: "bg-peringatan-500", teks: "text-peringatan-700" },
  Rendah: { isi: "bg-bata-600", teks: "text-bata-700" },
} as const;

export function BarKeyakinan({ nilai, className, tampilkanCatatan = false }: { nilai: number; className?: string; tampilkanCatatan?: boolean }) {
  const n = Math.min(1, Math.max(0, nilai));
  const tingkat = tingkatKeyakinan(n);
  const angka = n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className={cn("w-full max-w-xs", className)}>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-teks-redup">Tingkat keyakinan</span>
        <span className={cn("font-bold", gaya[tingkat].teks)}>
          {tingkat} ({angka})
        </span>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={n}
        aria-valuetext={`${tingkat}, ${angka}`}
        aria-label="Tingkat keyakinan"
        className="h-2.5 w-full overflow-hidden rounded-full bg-primer-100"
      >
        <div className={cn("h-full rounded-full", gaya[tingkat].isi)} style={{ width: `${n * 100}%` }} />
      </div>
      {tampilkanCatatan ? <p className="mt-1 text-xs text-teks-redup">Ambang contoh: tinggi {"≥"} 0,8; sedang 0,5 sampai 0,8; rendah {"<"} 0,5.</p> : null}
    </div>
  );
}
