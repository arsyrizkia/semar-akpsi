import { Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import type { SebaranBeban } from "@/lib/kontrak/tipe";
import { formatAngka } from "@/lib/utils";

const desimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

/** Tabel "Sebaran Beban": jumlah proposal setiap reviewer yang bersedia terhadap batas (semua reviewer, bukan satu halaman). */
export function SebaranBebanTabel({ sebaran, batas }: { sebaran: SebaranBeban[]; batas: number }) {
  if (!sebaran.length) return <p className="text-sm text-teks-redup">Belum ada reviewer yang bersedia di data BIMA.</p>;
  const jumlah = sebaran.map((s) => s.jumlah);
  return (
    <>
      <p data-testid="ringkasan-sebaran" className="mb-3 text-sm text-teks-redup">
        {formatAngka(sebaran.length)} reviewer bersedia; proposal per reviewer terendah {Math.min(...jumlah)}, tertinggi {Math.max(...jumlah)}, rata-rata{" "}
        {desimal.format(jumlah.reduce((n, x) => n + x, 0) / sebaran.length)}, batas {batas}.
      </p>
      <Table tinggiMaks={sebaran.length > 12 ? "26rem" : undefined}>
        <THead>
          <TR>
            <TH>Reviewer</TH>
            <TH angka>Jumlah Proposal</TH>
            <TH angka>Batas</TH>
            <TH>Terhadap Batas</TH>
          </TR>
        </THead>
        <TBody>
          {sebaran.map((s) => {
            const persen = Math.min(100, s.batas ? (s.jumlah / s.batas) * 100 : 0);
            const keterangan = s.jumlah > s.batas ? "melebihi batas" : s.jumlah === s.batas ? "penuh" : "";
            return (
              <TR key={s.reviewerId}>
                <TD>{s.namaReviewer}</TD>
                <TD angka>{s.jumlah}</TD>
                <TD angka>{s.batas}</TD>
                <TD className="w-1/3 min-w-40">
                  <div
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={s.batas}
                    aria-valuenow={s.jumlah}
                    aria-label={`Beban ${s.namaReviewer}`}
                    className="h-2 w-full overflow-hidden rounded-sm bg-primer-100"
                  >
                    <div className={s.jumlah > s.batas ? "h-full bg-bata-600" : s.jumlah === s.batas ? "h-full bg-peringatan-700" : "h-full bg-daun-600"} style={{ width: `${persen}%` }} />
                  </div>
                  {keterangan ? <span className="text-xs text-teks-redup">{keterangan}</span> : null}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </>
  );
}
