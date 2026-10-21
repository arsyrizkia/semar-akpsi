import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Panel/kartu bertema. */
export function Panel({
  judul,
  aksi,
  children,
  className,
  id,
}: {
  judul?: string;
  aksi?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("rounded-lg border border-sogan-200 bg-white shadow-sm", className)}>
      {judul || aksi ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-sogan-100 px-5 py-3">
          {judul ? <h2 className="font-serif text-xl font-semibold text-sogan-800">{judul}</h2> : <span />}
          {aksi}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function JudulHalaman({ kode, judul, deskripsi }: { kode?: string; judul: string; deskripsi?: string }) {
  return (
    <div className="mb-6">
      {kode ? <p className="text-xs font-bold uppercase tracking-widest text-emas-700">{kode}</p> : null}
      <h1 className="font-serif text-3xl font-bold text-sogan-800">{judul}</h1>
      {deskripsi ? <p className="mt-1 max-w-3xl text-sogan-700">{deskripsi}</p> : null}
    </div>
  );
}

const gayaAlert = {
  info: { kelas: "border-sogan-300 bg-sogan-50 text-sogan-900", Ikon: Info },
  sukses: { kelas: "border-daun-500 bg-daun-100 text-daun-700", Ikon: CheckCircle2 },
  peringatan: { kelas: "border-emas-500 bg-emas-50 text-sogan-900", Ikon: AlertTriangle },
  galat: { kelas: "border-bata-600 bg-bata-100 text-bata-700", Ikon: AlertCircle },
} as const;

/** Pesan sistem. `galat` dan `peringatan` diumumkan sebagai alert. */
export function Alert({
  jenis = "info",
  judul,
  children,
  className,
}: {
  jenis?: keyof typeof gayaAlert;
  judul?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { kelas, Ikon } = gayaAlert[jenis];
  return (
    <div
      role={jenis === "galat" || jenis === "peringatan" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-md border px-4 py-3 text-sm", kelas, className)}
    >
      <Ikon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        {judul ? <p className="font-semibold">{judul}</p> : null}
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}
