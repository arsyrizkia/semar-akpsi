import type { Metadata } from "next";
import { Alert, Button, Field, JudulHalaman, Panel, Select } from "@/components/ui";
import { wajibPengelola } from "@/lib/auth";
import { daftarButirBerlaku, pilihanBagianLampiran } from "@/lib/aturan/layanan";
import { daftarPeriode, daftarSkema } from "@/lib/templat/layanan";
import { masaPengusulanBerjalan } from "@/lib/waktu";
import { PapanAturan } from "./papan-aturan";

export const metadata: Metadata = { title: "Aturan Pemeriksaan (J-03)" };
export const dynamic = "force-dynamic";
// "Uji pada Contoh" ikut memanggil layanan LLM untuk butir semantik (15 detik per bagian)
export const maxDuration = 60;

/** J-03 Aturan Pemeriksaan (UC-02). Hanya Tim Kerja DPPM dengan hak pengelola (NFR 3.2). */
export default async function Halaman({ searchParams }: { searchParams: Promise<{ skema?: string; periode?: string }> }) {
  await wajibPengelola();
  const { skema: skemaParam, periode: periodeParam } = await searchParams;
  const [skema, periode, masaBerjalan] = await Promise.all([daftarSkema(), daftarPeriode(), masaPengusulanBerjalan()]);

  if (skema.length === 0 || periode.length === 0) {
    return <JudulHalaman kode="J-03" judul="Aturan Pemeriksaan" deskripsi="Belum ada skema atau periode seleksi. Jalankan reset data contoh di /demo." />;
  }
  const skemaTerpilih = skema.find((s) => s.id === skemaParam);
  const periodeTerpilih = periode.find((p) => p.id === periodeParam) ?? periode[0];

  const tampil = skemaTerpilih
    ? await Promise.all([daftarButirBerlaku(skemaTerpilih.id, periodeTerpilih.id), pilihanBagianLampiran(skemaTerpilih.id)])
    : null;

  return (
    <>
      <JudulHalaman
        kode="J-03"
        judul="Aturan Pemeriksaan"
        deskripsi="Tinjau butir cek turunan templat, susun butir manual (sitasi, kata kunci, dan butir semantik), uji pada contoh, lalu simpan sebagai basis aturan versi baru."
      />
      <Panel className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-4">
          <Field label="Skema Pendanaan" htmlFor="skema" className="w-full max-w-xs">
            <Select id="skema" name="skema" defaultValue={skemaTerpilih?.id ?? skema[0].id}>
              {skema.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.namaSkema}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Periode Seleksi" htmlFor="periode" className="w-full max-w-xs">
            <Select id="periode" name="periode" defaultValue={periodeTerpilih.id}>
              {periode.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" varian="utama">
            Tampilkan
          </Button>
        </form>
      </Panel>

      {skemaTerpilih && tampil ? (
        <PapanAturan
          // kunci ikut draf dan versi sehingga isian dimuat ulang saat skema, periode, atau versi berganti
          key={`${skemaTerpilih.id}:${periodeTerpilih.id}:${tampil[0].draf?.id ?? tampil[0].nyata?.id ?? "kosong"}`}
          skemaId={skemaTerpilih.id}
          namaSkema={skemaTerpilih.namaSkema}
          periode={periodeTerpilih}
          tampilan={tampil[0]}
          bagianPilihan={tampil[1].bagian}
          lampiranPilihan={tampil[1].lampiran}
          masaBerjalan={masaBerjalan}
        />
      ) : (
        <Alert jenis="info">Pilih skema dan periode, lalu tekan &quot;Tampilkan&quot; untuk melihat butir cek.</Alert>
      )}
    </>
  );
}
