import type { Metadata } from "next";
import { daftarKotakMasuk, ringkasanKotakMasuk } from "@/lib/bima/servis";
import { alamatPindah } from "@/lib/demo/katalog";
import { formatWaktu } from "@/lib/utils";

export const metadata: Metadata = { title: "Kotak masuk (simulasi BIMA)" };
export const dynamic = "force-dynamic";

/**
 * Data yang diterima BIMA dari SEMAR (penugasan dan keputusan reviewer). Khusus demo: ID proposal menaut ke J-05b (Rincian Proposal)
 * di SEMAR lewat "Pindah layar" (data tidak berubah; sesi Tim Kerja dipasang bila belum ada).
 */
export default async function KotakMasuk() {
  const [pesan, ringkasan] = await Promise.all([daftarKotakMasuk(100), ringkasanKotakMasuk()]);
  const total = ringkasan.totalPenugasan + ringkasan.totalKeputusan;
  const angka = new Intl.NumberFormat("id-ID");
  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900!">Kotak masuk</h1>
      <p className="mt-1 text-sm text-slate-600">Penugasan dan keputusan yang diterima dari SEMAR.</p>
      {total > 0 ? (
        <div data-testid="ringkasan-kotak-masuk" className="mt-4 border border-slate-300 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900!">Ringkasan</h2>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[14rem_1fr]">
            <dt className="font-semibold text-slate-700">Penugasan reviewer diterima</dt>
            <dd data-testid="total-penugasan" className="tabular-nums">{angka.format(ringkasan.totalPenugasan)}</dd>
            <dt className="font-semibold text-slate-700">Reviewer penerima penugasan</dt>
            <dd className="tabular-nums">{angka.format(ringkasan.jumlahPenerima)}</dd>
            <dt className="font-semibold text-slate-700">Keputusan reviewer diterima</dt>
            <dd className="tabular-nums">{angka.format(ringkasan.totalKeputusan)}</dd>
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
          <p className="border border-slate-300 bg-white px-4 py-6 text-slate-700">Belum ada data yang diterima dari SEMAR.</p>
        ) : (
          <div className="relative overflow-x-auto border border-slate-300 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-200 text-slate-800">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Waktu</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Jenis</th>
                  <th scope="col" className="px-3 py-2 font-semibold">ID Proposal</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Penerima</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Isi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pesan.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-3 py-2 align-top tabular-nums">{formatWaktu(p.diterimaPada)}</td>
                    <td className="px-3 py-2 align-top">{p.jenis === "penugasan" ? "Penugasan reviewer" : "Keputusan reviewer"}</td>
                    <td className="px-3 py-2 align-top">
                      {p.idProposal ? (
                        <a
                          href={alamatPindah("J-05b", p.idProposal)}
                          rel="nofollow"
                          data-rincian-semar={p.idProposal}
                          className="font-mono text-xs font-semibold text-slate-900 underline underline-offset-2"
                          title="Khusus demo: buka rincian proposal ini di SEMAR (J-05b)"
                        >
                          {p.idProposal}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">{p.penerimaIdBima}</td>
                    <td className="px-3 py-2 align-top">
                      <code className="text-xs break-all">{JSON.stringify(p.payload)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-600">Demo: ID proposal membuka rincian proposal itu di SEMAR (J-05b) tanpa mengubah data.</p>
      </div>
    </section>
  );
}
