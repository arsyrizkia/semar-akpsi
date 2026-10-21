import type { Metadata } from "next";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { daftarKotakMasuk } from "@/lib/bima/servis";
import { formatWaktu } from "@/lib/utils";

export const metadata: Metadata = { title: "Kotak masuk BIMA tiruan" };
export const dynamic = "force-dynamic";

/** Data yang diterima BIMA dari SEMAR (penugasan dan keputusan reviewer). */
export default async function KotakMasuk() {
  const pesan = await daftarKotakMasuk();
  return (
    <section>
      <h1 className="text-2xl font-bold">Kotak masuk</h1>
      <p className="mt-1 text-slate-600">Penugasan dan keputusan yang diterima dari SEMAR.</p>
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
