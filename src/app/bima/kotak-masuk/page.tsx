import type { Metadata } from "next";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { daftarKotakMasuk, ringkasanKotakMasuk } from "@/lib/bima/servis";
import { formatWaktu } from "@/lib/utils";

export const metadata: Metadata = { title: "Kotak masuk BIMA tiruan" };
export const dynamic = "force-dynamic";

/** Data yang diterima BIMA dari SEMAR (penugasan dan keputusan reviewer). */
export default async function KotakMasuk() {
  const [pesan, ringkasan] = await Promise.all([daftarKotakMasuk(100), ringkasanKotakMasuk()]);
  const total = ringkasan.totalPenugasan + ringkasan.totalKeputusan;
  const angka = new Intl.NumberFormat("id-ID");
  return (
    <section>
      <h1 className="text-2xl font-bold">Kotak masuk</h1>
      <p className="mt-1 text-slate-600">Penugasan dan keputusan yang diterima dari SEMAR.</p>
      {total > 0 ? (
        <div data-testid="ringkasan-kotak-masuk" className="mt-4 rounded border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold">Ringkasan</h2>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[14rem_1fr]">
            <dt className="font-semibold text-slate-700">Penugasan reviewer diterima</dt>
            <dd data-testid="total-penugasan">{angka.format(ringkasan.totalPenugasan)}</dd>
            <dt className="font-semibold text-slate-700">Reviewer penerima penugasan</dt>
            <dd>{angka.format(ringkasan.jumlahPenerima)}</dd>
            <dt className="font-semibold text-slate-700">Keputusan reviewer diterima</dt>
            <dd>{angka.format(ringkasan.totalKeputusan)}</dd>
            {ringkasan.penerimaTeratas.length ? (
              <>
                <dt className="font-semibold text-slate-700">Penerima terbanyak</dt>
                <dd>{ringkasan.penerimaTeratas.map((t) => `${t.nama ?? t.penerimaIdBima} (${angka.format(t.jumlah)})`).join(", ")}</dd>
              </>
            ) : null}
          </dl>
          <p className="mt-2 text-xs text-slate-600">
            Tabel di bawah menampilkan {angka.format(pesan.length)} pesan terbaru dari {angka.format(total)}.
          </p>
        </div>
      ) : null}
      <div className="mt-4">
        {pesan.length === 0 ? (
          <p className="rounded border border-slate-300 bg-white px-4 py-6 text-slate-600">Belum ada data yang diterima dari SEMAR.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Waktu</TH>
                <TH>Jenis</TH>
                <TH>ID Proposal</TH>
                <TH>Penerima</TH>
                <TH>Isi</TH>
              </TR>
            </THead>
            <TBody>
              {pesan.map((p) => (
                <TR key={p.id}>
                  <TD>{formatWaktu(p.diterimaPada)}</TD>
                  <TD>{p.jenis === "penugasan" ? "Penugasan reviewer" : "Keputusan reviewer"}</TD>
                  <TD>{p.idProposal}</TD>
                  <TD>{p.penerimaIdBima}</TD>
                  <TD>
                    <code className="text-xs break-all">{JSON.stringify(p.payload)}</code>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </section>
  );
}
