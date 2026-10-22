import type { Metadata } from "next";
import { KeadaanKosong, KepalaHalaman } from "@/components/ui";
import { wajibPengelola } from "@/lib/auth";
import { daftarButirBerlaku, pilihanBagianLampiran } from "@/lib/aturan/layanan";
import { daftarPeriode, daftarSkema } from "@/lib/templat/layanan";
import { masaPengusulanBerjalan } from "@/lib/waktu";
import { PapanAturan } from "./papan-aturan";

export const metadata: Metadata = { title: "J-03 Aturan Pemeriksaan" };
export const dynamic = "force-dynamic";

/** J-03 Aturan Pemeriksaan (UC-02). Hanya Tim Kerja DPPM dengan hak pengelola (NFR 3.2). Skema, periode, dan butir yang disorot ada di URL. */
export default async function Halaman({ searchParams }: { searchParams: Promise<{ skema?: string; periode?: string; sorot?: string; butir?: string }> }) {
  await wajibPengelola();
  const { skema: skemaParam, periode: periodeParam, sorot: sorotParam, butir: butirParam } = await searchParams;
  const sorot = sorotParam ?? butirParam; // ?butir= dikirim J-05/J-05b, ?sorot= tautan sesama J-03
  const [skema, periode, masaBerjalan] = await Promise.all([daftarSkema(), daftarPeriode(), masaPengusulanBerjalan()]);

  if (skema.length === 0 || periode.length === 0) {
    return (
      <>
        <KepalaHalaman kode="J-03" judul="Aturan Pemeriksaan" remah={[{ label: "Aturan Pemeriksaan" }]} />
        <KeadaanKosong judul="Belum ada skema atau periode seleksi">Jalankan &ldquo;Reset &amp; isi data demo&rdquo; di Pusat Demo.</KeadaanKosong>
      </>
    );
  }
  const skemaTerpilih = skema.find((s) => s.id === skemaParam) ?? skema[0];
  const periodeTerpilih = periode.find((p) => p.id === periodeParam) ?? periode[0];
  const [tampilan, pilihan] = await Promise.all([daftarButirBerlaku(skemaTerpilih.id, periodeTerpilih.id), pilihanBagianLampiran(skemaTerpilih.id)]);

  return (
    <PapanAturan
      // kunci ikut draf dan versi sehingga isian dimuat ulang saat skema, periode, atau versi berganti
      key={`${skemaTerpilih.id}:${periodeTerpilih.id}:${tampilan.draf?.id ?? tampilan.nyata?.id ?? "kosong"}`}
      skema={skema}
      skemaId={skemaTerpilih.id}
      periodeDaftar={periode}
      periode={periodeTerpilih}
      tampilan={tampilan}
      bagianPilihan={pilihan.bagian}
      lampiranPilihan={pilihan.lampiran}
      masaBerjalan={masaBerjalan}
      sorotAwal={sorot ?? null}
    />
  );
}
