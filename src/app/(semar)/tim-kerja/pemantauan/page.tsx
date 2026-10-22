import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bagian, Button, KeadaanKosong, KepalaHalaman, Pilihan, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { wajibTimKerja } from "@/lib/auth";
import { daftarPeriode, daftarSkema, susunLaporan } from "@/lib/pemantauan/layanan";
import { formatAngka } from "@/lib/utils";
import { LaporanSemantik } from "./laporan-semantik";

export const metadata: Metadata = { title: "J-05 Pemantauan Kesesuaian" };
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;
const satu = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** J-05 Pemantauan Kesesuaian (UC-04). Pilihan periode dan skema ada di URL; nama butir membuka M-08, kode butir menaut ke J-03. */
export default async function Halaman({ searchParams }: { searchParams: Params }) {
  const sesi = await wajibTimKerja();
  const sp = await searchParams;
  const [periodeAda, skemaAda] = await Promise.all([daftarPeriode(), daftarSkema()]);
  const periode = periodeAda.find((p) => p.id === satu(sp.periode)) ?? periodeAda[0];
  const skema = skemaAda.find((s) => s.id === satu(sp.skema)) ?? skemaAda[0];
  const laporan = periode && skema ? await susunLaporan(periode.id, skema.id) : null;
  const tautanButir = (kode: string) => `/tim-kerja/aturan?skema=${skema?.id}&periode=${periode?.id}&butir=${encodeURIComponent(kode)}`;

  return (
    <>
      <KepalaHalaman
        kode="J-05"
        judul="Pemantauan Kesesuaian"
        keterangan="Seberapa sering rekomendasi sistem dikoreksi reviewer dan butir mana yang paling sering gagal."
        remah={[{ label: "Pemantauan Kesesuaian" }]}
      />

      <form method="get" className="mb-8 flex flex-wrap items-end gap-3">
        <Pilihan label="Periode Seleksi" name="periode" defaultValue={periode?.id} className="w-full max-w-sm">
          {periodeAda.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Pilihan>
        <Pilihan label="Skema Pendanaan" name="skema" defaultValue={skema?.id} className="w-64">
          {skemaAda.map((s) => (
            <option key={s.id} value={s.id}>
              {s.namaSkema}
            </option>
          ))}
        </Pilihan>
        <Button type="submit" className="mb-[1.375rem]">
          Tampilkan
        </Button>
      </form>

      {!laporan || !periode || !skema ? (
        <KeadaanKosong judul="Belum ada periode atau skema">Pemantauan muncul sesudah ada periode seleksi dan skema pendanaan.</KeadaanKosong>
      ) : (
        <>
          <p className="mb-6 text-sm text-primer-700">
            {periode.nama}, {skema.namaSkema}
            {laporan.basis ? ` (basis aturan versi ${laporan.basis.versi})` : " (belum ada basis aturan)"}. Dihitung dari{" "}
            <span className="angka">{formatAngka(laporan.jumlahPenilaianFinal)}</span> hasil pemeriksaan semantik pada penilaian final.
          </p>

          <Bagian judul="Butir Deterministik Paling Sering Gagal">
            {laporan.gagalPerButir.length === 0 ? (
              <p className="text-sm text-primer-700">Tidak ada butir deterministik yang gagal pada pengajuan di periode dan skema ini.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Butir</TH>
                    {laporan.institusi.map((i) => (
                      <TH key={i} angka>
                        {i}
                      </TH>
                    ))}
                    <TH angka>Jumlah</TH>
                  </TR>
                </THead>
                <TBody>
                  {laporan.gagalPerButir.map((b) => (
                    <TR key={b.kode}>
                      <TD className="max-w-xs">
                        {sesi.pengelola ? (
                          <Link href={tautanButir(b.kode)} className="font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-600">
                            {b.kode}
                          </Link>
                        ) : (
                          <span className="font-semibold">{b.kode}</span>
                        )}
                        <p className="text-xs text-primer-700">{b.deskripsi}</p>
                      </TD>
                      {laporan.institusi.map((i) => (
                        <TD key={i} angka>
                          {b.perInstitusi[i] ?? 0}
                        </TD>
                      ))}
                      <TD angka className="font-semibold">
                        {b.total}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Bagian>

          <Suspense fallback={null}>
            <LaporanSemantik
              periodeId={periode.id}
              skemaId={skema.id}
              kesesuaian={laporan.kesesuaian}
              koreksi={laporan.koreksiTertinggi}
              rincian={laporan.rincian}
              pengelola={sesi.pengelola}
            />
          </Suspense>
        </>
      )}
    </>
  );
}
