const GAYA: Record<string, string> = {
  Draf: "bg-slate-100 text-slate-700",
  "Diajukan ke SEMAR": "bg-blue-50 text-blue-800",
  Terkirim: "bg-emerald-50 text-emerald-800",
  Ditahan: "bg-amber-50 text-amber-900",
  Ditolak: "bg-red-50 text-red-800",
};

/** Lencana status usulan BIMA tiruan (status selalu tertulis, warna hanya penegas). */
export function LencanaStatusBima({ status }: { status: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${GAYA[status] ?? GAYA.Draf}`}>{status}</span>;
}
