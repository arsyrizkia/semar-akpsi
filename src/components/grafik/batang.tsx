import { cn } from "@/lib/utils";

/**
 * Bagan batang kecil untuk J-05 (dataviz): satu warna sekuensial `primer-700`, batang <= 12 px berujung bulat 4 px, nilai berwarna
 * teks di ujung batang, status selalu disertai tulisan (tidak hanya warna). Semua angka tertulis, jadi daftar ini sekaligus tampilan
 * tabelnya; `title` memberi angka persis saat diarahkan.
 */

export interface BarisBatang {
  kunci: string;
  label: React.ReactNode;
  /** nilai pada skala 0..maks */
  nilai: number;
  /** teks nilai di ujung batang, mis. "64% (163)" */
  teks: string;
  /** keterangan pendek setelah teks (mis. "di atas ambang") */
  catatan?: string;
  /** penekanan: batang lain dibuat redup (pola emphasis) */
  sorot?: boolean;
}

export function BatangMendatar({ judul, baris, maks, lebarLabel = "10rem", className, redupkanLain = false }: { judul?: string; baris: BarisBatang[]; maks: number; lebarLabel?: string; className?: string; redupkanLain?: boolean }) {
  const puncak = Math.max(maks, 1e-9);
  // container query: label di samping batang hanya bila wadah >= 36rem (tab J-05); di sheet M-08 dan ponsel label di atas batang
  return (
    <figure className={cn("@container max-w-2xl", className)}>
      {judul ? <figcaption className="mb-2 text-sm font-semibold text-primer-800">{judul}</figcaption> : null}
      <ul className="space-y-1.5" aria-label={judul}>
        {baris.map((b) => (
          <li
            key={b.kunci}
            title={`${typeof b.label === "string" ? b.label : b.kunci}: ${b.teks}${b.catatan ? `, ${b.catatan}` : ""}`}
            className="grid items-center gap-x-3 gap-y-0.5 @xl:grid-cols-[var(--lebar-label)_minmax(0,1fr)]"
            style={{ "--lebar-label": lebarLabel } as React.CSSProperties}
          >
            <span className="text-xs text-primer-900 @xl:text-right">{b.label}</span>
            <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <span aria-hidden className="block h-3">
                <span
                  className={cn("block h-3 rounded-r-[4px]", redupkanLain && !b.sorot ? "bg-abu-200" : "bg-primer-700")}
                  style={{ width: `${Math.min(1, b.nilai / puncak) * 100}%`, minWidth: b.nilai > 0 ? 4 : 1 }}
                />
              </span>
              <span className="angka text-right text-xs text-primer-900">
                {b.teks}
                {b.catatan ? <span className="ml-1 font-semibold text-peringatan-700">{b.catatan}</span> : null}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Batang persen dengan penanda ambang (dekoratif; angka dan statusnya ditulis di sebelahnya oleh pemanggil). */
export function BatangPersen({ persen, ambang, className }: { persen: number; ambang?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-block h-2 w-28 rounded-full bg-abu-100 align-middle", className)}>
      <span className="absolute inset-y-0 left-0 rounded-full bg-primer-700" style={{ width: `${Math.max(0, Math.min(100, persen))}%` }} />
      {ambang !== undefined ? <span className="absolute -inset-y-1 w-0.5 bg-abu-700" style={{ left: `calc(${ambang}% - 1px)` }} /> : null}
    </span>
  );
}

/**
 * Arah koreksi: berapa koreksi yang membalik Memenuhi menjadi Tidak memenuhi (sistem terlalu longgar, aksen-500) dan sebaliknya
 * (terlalu ketat, primer-500). Pasangan warna lolos validator dataviz (CVD dan kontras); teks selalu menyertai warna. Emas aksen di area
 * kerja adalah pengecualian data-viz yang tercatat di docs/desain-sistem.md bagian 1.
 */
export function ArahKoreksi({ longgar, ketat, ringkas = false }: { longgar: number; ketat: number; ringkas?: boolean }) {
  const total = longgar + ketat;
  if (!total) return <span className="text-xs text-teks-redup">tanpa koreksi</span>;
  const pLonggar = Math.round((longgar / total) * 100);
  const dominan = pLonggar >= 50 ? `${pLonggar}% koreksi: terlalu longgar` : `${100 - pLonggar}% koreksi: terlalu ketat`;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span aria-hidden className="inline-flex h-2 w-16 gap-0.5 overflow-hidden rounded-full">
        {longgar ? <span className="h-full bg-aksen-500" style={{ width: `${pLonggar}%` }} /> : null}
        {ketat ? <span className="h-full bg-primer-500" style={{ width: `${100 - pLonggar}%` }} /> : null}
      </span>
      <span className="text-xs text-primer-900">{ringkas ? dominan : `terlalu longgar ${pLonggar}% · terlalu ketat ${100 - pLonggar}% dari ${total.toLocaleString("id-ID")} koreksi`}</span>
    </span>
  );
}

/** Garis kecil tren (dekoratif, aria-hidden); angkanya ada di grafik lengkap tab Tren dan Kalibrasi. */
export function Sparkline({ nilai, className }: { nilai: number[]; className?: string }) {
  if (nilai.length < 2) return null;
  const w = 88;
  const h = 24;
  const lo = Math.min(...nilai);
  const hi = Math.max(...nilai);
  const rentang = Math.max(hi - lo, 4);
  const titik = nilai.map((v, i) => `${(i / (nilai.length - 1)) * (w - 4) + 2},${h - 3 - ((v - lo) / rentang) * (h - 6)}`);
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} className={cn("h-6 w-[88px]", className)}>
      <polyline points={titik.join(" ")} fill="none" className="stroke-primer-700" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={titik.at(-1)!.split(",")[0]} cy={titik.at(-1)!.split(",")[1]} r={2.5} className="fill-primer-700" />
    </svg>
  );
}

/**
 * Sebelum-sesudah per butir (dumbbell): titik berongga = definisi lama, titik isi = definisi baru, pada skala 0-100% dengan garis
 * ambang. Kedua angka tertulis di bawahnya.
 */
export function Dumbbell({ judul, baris, ambang }: { judul: string; baris: { kunci: string; label: string; lama: { persen: number; teks: string }; baru: { persen: number; teks: string } }[]; ambang?: number }) {
  return (
    <figure className="max-w-2xl">
      <figcaption className="mb-2 text-sm font-semibold text-primer-800">{judul}</figcaption>
      <ul className="space-y-4">
        {baris.map((b) => {
          const kiri = Math.min(b.lama.persen, b.baru.persen);
          const kanan = Math.max(b.lama.persen, b.baru.persen);
          return (
            <li key={b.kunci}>
              <p className="text-sm font-semibold text-primer-900">{b.label}</p>
              <div aria-hidden className="relative mt-2 h-4 max-w-md">
                <span className="absolute inset-x-0 top-1/2 h-px bg-abu-200" />
                {ambang !== undefined ? <span className="absolute -inset-y-1 w-px bg-abu-600" style={{ left: `${ambang}%` }} /> : null}
                <span className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-primer-300" style={{ left: `${kiri}%`, width: `${kanan - kiri}%` }} />
                <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-abu-600 bg-white" style={{ left: `${b.lama.persen}%` }} />
                <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primer-700" style={{ left: `${b.baru.persen}%` }} />
              </div>
              <p className="mt-1 flex flex-wrap gap-x-4 text-xs">
                <span className="text-teks-redup">
                  <span aria-hidden className="mr-1 inline-block size-2 rounded-full border-2 border-abu-600 align-middle" />
                  {b.lama.teks}
                </span>
                <span className="text-primer-900">
                  <span aria-hidden className="mr-1 inline-block size-2 rounded-full bg-primer-700 align-middle" />
                  {b.baru.teks}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
