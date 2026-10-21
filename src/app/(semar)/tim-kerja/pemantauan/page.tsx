import type { Metadata } from "next";
import { Alert, Button, Field, JudulHalaman, Panel, Select, StatusBadge, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PanelPemandu } from "@/components/layout/panel-pemandu";
import { wajibTimKerja } from "@/lib/auth";
import { judulUc04, kodeUc04, langkahUc04 } from "@/lib/demo/pemandu/uc04";
import { daftarPeriode, daftarSkema, susunLaporan } from "@/lib/pemantauan/layanan";
import { formatPersen } from "@/lib/pemantauan/rekap";
import { LaporanKoreksi } from "./laporan-koreksi";

export const metadata: Metadata = { title: "Pemantauan Kesesuaian (J-05)" };
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;
const satu = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** J-05 Pemantauan Kesesuaian, UC-04. Semua Tim Kerja DPPM dapat membukanya (pengelola dan anggota). */
export default async function Halaman({ searchParams }: { searchParams: Params }) {
  await wajibTimKerja();
  const sp = await searchParams;
  const [periodeAda, skemaAda] = await Promise.all([daftarPeriode(), daftarSkema()]);
  const periodeId = satu(sp.periode);
  const skemaId = satu(sp.skema);
  const periode = periodeAda.find((p) => p.id === periodeId);
  const skema = skemaAda.find((s) => s.id === skemaId);
  const laporan = periode && skema ? await susunLaporan(periode.id, skema.id) : null;

  return (
    <>
      <JudulHalaman
        kode="J-05"
        judul="Pemantauan Kesesuaian"
        deskripsi="Lihat seberapa sering rekomendasi sistem dikoreksi reviewer dan butir deterministik mana yang paling sering gagal, sebagai dasar memperbaiki aturan."
      />

      <Panel className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-4">
          <Field label="Periode Seleksi" htmlFor="periode" className="w-full max-w-md">
            <Select id="periode" name="periode" defaultValue={periode?.id ?? periodeAda[0]?.id} required>
              {periodeAda.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Skema Pendanaan" htmlFor="skema" className="w-64">
            <Select id="skema" name="skema" defaultValue={skema?.id ?? skemaAda[0]?.id} required>
              {skemaAda.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.namaSkema}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">Tampilkan</Button>
        </form>
      </Panel>

      {!laporan || !periode || !skema ? (
        <Alert jenis="info">Pilih periode dan skema, lalu tekan &quot;Tampilkan&quot;.</Alert>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-sogan-700">
            {periode.nama}, {skema.namaSkema}
            {laporan.basis ? ` (basis aturan versi ${laporan.basis.versi})` : " (belum ada basis aturan)"}. Dihitung dari {laporan.jumlahPenilaianFinal} hasil pemeriksaan semantik
            pada penilaian final.
          </p>

          <Panel judul="Butir Deterministik Paling Sering Gagal">
            {laporan.gagalPerButir.length === 0 ? (
              <p className="text-sm text-sogan-700">Tidak ada butir deterministik yang gagal pada pengajuan di periode dan skema ini.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Butir</TH>
                    {laporan.institusi.map((i) => (
                      <TH key={i}>{i}</TH>
                    ))}
                    <TH>Jumlah</TH>
                  </TR>
                </THead>
                <TBody>
                  {laporan.gagalPerButir.map((b) => (
                    <TR key={b.kode}>
                      <TD className="max-w-xs">
                        <span className="font-semibold">{b.kode}</span>
                        <p className="text-xs text-sogan-600">{b.deskripsi}</p>
                      </TD>
                      {laporan.institusi.map((i) => (
                        <TD key={i}>{b.perInstitusi[i] ?? 0}</TD>
                      ))}
                      <TD className="font-bold">{b.total}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Panel>

          <Panel judul="Kesesuaian per Butir">
            {laporan.kesesuaian.length === 0 ? (
              <p className="text-sm text-sogan-700">Belum ada penilaian final untuk periode dan skema ini.</p>
            ) : (
              <>
                <Table>
                  <THead>
                    <TR>
                      <TH>Butir</TH>
                      <TH>Hasil Dinilai</TH>
                      <TH>Dikoreksi</TH>
                      <TH>% Disetujui</TH>
                      <TH>Status</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {laporan.kesesuaian.map((b) => (
                      <TR key={b.kode}>
                        <TD className="max-w-xs">
                          <span className="font-semibold">{b.kode}</span>
                          <p className="text-xs text-sogan-600">{b.deskripsi}</p>
                        </TD>
                        <TD>{b.jumlah}</TD>
                        <TD>{b.jumlahKoreksi}</TD>
                        <TD className="font-semibold">{formatPersen(b.persenDisetujui)}</TD>
                        <TD>{b.status ? <StatusBadge status={b.status} /> : null}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <p className="mt-2 text-xs text-sogan-600">
                  Rekomendasi yang tidak dikoreksi dihitung disetujui (J-08 tidak memiliki tombol &quot;Setuju&quot;). Butir deterministik tidak muncul di sini
                  karena reviewer tidak mengoreksinya.
                </p>
              </>
            )}
          </Panel>

          <LaporanKoreksi periodeId={periode.id} skemaId={skema.id} baris={laporan.koreksiTertinggi} rincian={laporan.rincian} />
        </div>
      )}
      <PanelPemandu kode={kodeUc04} judul={judulUc04} langkah={langkahUc04} aktifNomor={laporan ? "3" : "2"} />
    </>
  );
}
