import Link from "next/link";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import type { ReviewerPeriode } from "@/lib/penugasan/layanan";
import type { RingkasanBeban } from "@/lib/penugasan/periode";
import { formatAngka } from "@/lib/utils";

const desimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

/**
 * Histogram jumlah reviewer per rentang beban (satu seri: tanpa legenda; batang <= 16 px berujung bulat 4 px, jarak 2 px; nilai di
 * ujung batang memakai warna teks). Kelompok yang seluruhnya di atas batas memakai warna status bata beserta tulisan "di atas batas".
 * Tabel reviewer di bawahnya adalah tampilan tabel grafik ini.
 */
function Histogram({ ringkas, batas }: { ringkas: RingkasanBeban; batas: number }) {
  const puncak = Math.max(1, ...ringkas.kelompok.map((k) => k.jumlah));
  return (
    <figure className="max-w-2xl">
      <figcaption className="mb-2 text-sm font-semibold text-primer-800">Jumlah reviewer menurut beban (proposal per reviewer)</figcaption>
      <ul className="space-y-0.5" aria-label="Histogram sebaran beban">
        {ringkas.kelompok.map((k) => {
          const melampaui = k.dari > batas;
          const label = k.dari === k.sampai ? `${k.dari}` : `${k.dari}–${k.sampai}`;
          const teks = `${label} proposal: ${formatAngka(k.jumlah)} reviewer${melampaui ? ", di atas batas" : ""}`;
          return (
            <li key={k.dari} title={teks} className="grid grid-cols-[5.5rem_1fr] items-center gap-3 rounded-sm py-0.5 hover:bg-primer-50">
              <span className="angka text-right text-xs text-teks-redup">{label}</span>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={k.jumlah ? `h-4 rounded-r-[4px] ${melampaui ? "bg-bata-600" : "bg-primer-700"}` : "h-4 w-px bg-primer-200"}
                  style={k.jumlah ? { width: `calc(${(k.jumlah / puncak) * 100}% - 4rem)`, minWidth: "4px" } : undefined}
                />
                <span className="angka shrink-0 text-xs text-primer-900">
                  <span className="sr-only">{teks}</span>
                  <span aria-hidden>
                    {formatAngka(k.jumlah)}
                    {melampaui && k.jumlah ? <span className="ml-1 font-semibold text-bata-700">di atas batas</span> : null}
                  </span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/**
 * Tab "Sebaran Beban" J-04b (UC-03 s.4): ringkasan, histogram, dan tabel semua reviewer bersedia dalam kumpulan periode.
 * "Lihat proposal" membuka tab Usulan Penugasan dengan filter reviewer tersebut.
 */
export function SebaranBeban({ reviewer, ringkas, batas, alamatUsulan }: { reviewer: ReviewerPeriode[]; ringkas: RingkasanBeban; batas: number; alamatUsulan: (reviewerId: string) => string }) {
  if (!reviewer.length) return <p className="text-sm text-teks-redup">Belum ada reviewer yang bersedia di data BIMA untuk periode ini.</p>;
  const urut = [...reviewer].sort((a, b) => b.beban - a.beban || a.nama.localeCompare(b.nama));
  return (
    <div className="space-y-6">
      <p data-testid="ringkasan-sebaran" className="text-sm text-teks-redup">
        {formatAngka(ringkas.jumlahReviewer)} reviewer bersedia; proposal per reviewer terendah <span className="angka">{ringkas.min}</span>, median{" "}
        <span className="angka">{desimal.format(ringkas.median)}</span>, tertinggi <span className="angka">{ringkas.maks}</span>; batas <span className="angka">{batas}</span>.
        {ringkas.melampaui ? <strong className="ml-1 text-bata-700">{formatAngka(ringkas.melampaui)} reviewer di atas batas.</strong> : null}
      </p>
      <Histogram ringkas={ringkas} batas={batas} />
      <Table tinggiMaks={urut.length > 12 ? "28rem" : undefined} aria-label="Sebaran beban per reviewer">
        <THead>
          <TR>
            <TH>Reviewer</TH>
            <TH>Institusi</TH>
            <TH angka>Jumlah Proposal</TH>
            <TH angka>Batas</TH>
            <TH>Terhadap Batas</TH>
            <TH>
              <span className="sr-only">Aksi</span>
            </TH>
          </TR>
        </THead>
        <TBody>
          {urut.map((r) => {
            const persen = Math.min(100, batas ? (r.beban / batas) * 100 : 0);
            const keterangan = r.beban > batas ? "di atas batas" : r.beban === batas ? "penuh" : "";
            return (
              <TR key={r.id}>
                <TD className="font-medium text-primer-900">{r.nama}</TD>
                <TD>{r.institusi}</TD>
                <TD angka>{formatAngka(r.beban)}</TD>
                <TD angka>{batas}</TD>
                <TD className="w-1/4 min-w-36">
                  <div role="meter" aria-valuemin={0} aria-valuemax={batas} aria-valuenow={r.beban} aria-label={`Beban ${r.nama}`} className="h-2 w-full overflow-hidden rounded-sm bg-primer-100">
                    <div className={r.beban > batas ? "h-full bg-bata-600" : r.beban === batas ? "h-full bg-peringatan-500" : "h-full bg-primer-700"} style={{ width: `${persen}%` }} />
                  </div>
                  {keterangan ? <span className={r.beban > batas ? "text-xs font-semibold text-bata-700" : "text-xs text-teks-redup"}>{keterangan}</span> : null}
                </TD>
                <TD className="text-right">
                  {r.beban > 0 ? (
                    <Link href={alamatUsulan(r.id)} className="whitespace-nowrap text-sm text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900">
                      Lihat proposal<span className="sr-only"> {r.nama}</span>
                    </Link>
                  ) : null}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
