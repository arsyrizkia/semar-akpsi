import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Inbox, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bagian: pengelompokan isi layar dengan judul kecil. Tanpa kartu berbingkai dan tanpa judul serif;
 * pemisah antarbagian cukup jarak. `bingkai` hanya untuk isi yang memang perlu permukaan sendiri (mis. formulir dalam layar).
 */
export function Bagian({
  judul,
  aksi,
  children,
  className,
  id,
  bingkai = false,
}: {
  judul?: string;
  aksi?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
  bingkai?: boolean;
}) {
  return (
    <section id={id} className={cn("mt-8 first:mt-0", bingkai && "rounded-md border border-sogan-200 bg-white p-4", className)}>
      {judul || aksi ? (
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {judul ? <h2 className="text-base font-semibold text-sogan-800">{judul}</h2> : <span />}
          {aksi}
        </header>
      ) : null}
      <div>{children}</div>
    </section>
  );
}

/** Nama lama untuk halaman yang belum dirombak: sekarang berperilaku sebagai Bagian. */
export const Panel = Bagian;

export interface Remah {
  label: string;
  href?: string;
}

/**
 * Kepala halaman: breadcrumb dan chip kode jendela kecil (J-xx), judul, paling banyak satu baris keterangan, dan slot aksi di kanan.
 * Judul tab browser diatur lewat `export const metadata` di page.tsx ("J-xx Nama").
 */
export function KepalaHalaman({
  kode,
  judul,
  keterangan,
  remah,
  aksi,
  className,
}: {
  kode?: string;
  judul: string;
  keterangan?: string;
  remah?: Remah[];
  aksi?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 border-b border-sogan-200 pb-4", className)}>
      {remah?.length || kode ? (
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-abu-600">
          {kode ? (
            <span className="rounded-sm bg-abu-100 px-1.5 py-0.5 font-mono font-semibold text-abu-700" title="Kode jendela (Bab 10)">
              {kode}
            </span>
          ) : null}
          {remah?.length ? (
            <nav aria-label="Jejak halaman">
              <ol className="flex flex-wrap items-center gap-1">
                {remah.map((r, i) => (
                  <li key={`${r.label}-${i}`} className="flex items-center gap-1">
                    {i > 0 ? <ChevronRight aria-hidden className="size-3" /> : null}
                    {r.href && i < remah.length - 1 ? (
                      <Link href={r.href} className="underline-offset-2 hover:underline">
                        {r.label}
                      </Link>
                    ) : (
                      <span aria-current={i === remah.length - 1 ? "page" : undefined}>{r.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-sogan-800">{judul}</h1>
          {keterangan ? <p className="mt-0.5 text-sm text-sogan-700">{keterangan}</p> : null}
        </div>
        {aksi ? <div className="flex flex-wrap items-center gap-2">{aksi}</div> : null}
      </div>
    </header>
  );
}

/** Nama lama (kode, judul, deskripsi) untuk halaman yang belum dirombak: dipetakan ke KepalaHalaman. */
export function JudulHalaman({ kode, judul, deskripsi, remah, aksi }: { kode?: string; judul: string; deskripsi?: string; remah?: Remah[]; aksi?: React.ReactNode }) {
  return <KepalaHalaman kode={kode} judul={judul} keterangan={deskripsi} remah={remah} aksi={aksi} />;
}

const gayaAlert = {
  info: { kelas: "border-sogan-400 bg-sogan-50 text-sogan-900", Ikon: Info },
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
      className={cn("flex gap-3 rounded-md border-l-4 border-y border-r border-y-transparent border-r-transparent px-4 py-3 text-sm", kelas, className)}
    >
      <Ikon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        {judul ? <p className="font-semibold">{judul}</p> : null}
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}

/** Keadaan kosong: satu kalimat apa yang belum ada, dan (opsional) satu tindakan berikutnya. */
export function KeadaanKosong({
  judul,
  children,
  aksi,
  ikon: Ikon = Inbox,
  className,
}: {
  judul: string;
  children?: React.ReactNode;
  aksi?: React.ReactNode;
  ikon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-md border border-dashed border-sogan-300 px-6 py-10 text-center", className)}>
      <Ikon aria-hidden className="size-8 text-sogan-400" />
      <p className="font-semibold text-sogan-800">{judul}</p>
      {children ? <div className="max-w-md text-sm text-sogan-700">{children}</div> : null}
      {aksi ? <div className="mt-2">{aksi}</div> : null}
    </div>
  );
}
