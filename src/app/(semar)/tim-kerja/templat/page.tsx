import type { Metadata } from "next";
import { JudulHalaman } from "@/components/ui";
import { wajibPengelola } from "@/lib/auth";
import { ambilDrafTemplat, ambilTemplatBerlaku, daftarPeriode, daftarSkema } from "@/lib/templat/layanan";
import { masaPengusulanBerjalan } from "@/lib/waktu";
import { PapanTemplat } from "./papan-templat";

export const metadata: Metadata = { title: "Templat Proposal (J-02)" };
export const dynamic = "force-dynamic";

/** J-02 Templat Proposal (UC-01). Hanya Tim Kerja DPPM dengan hak pengelola (NFR 3.2). */
export default async function Halaman({ searchParams }: { searchParams: Promise<{ skema?: string }> }) {
  await wajibPengelola();
  const { skema: skemaParam } = await searchParams;
  const [skema, periode, masaBerjalan] = await Promise.all([daftarSkema(), daftarPeriode(), masaPengusulanBerjalan()]);

  if (skema.length === 0) {
    return <JudulHalaman kode="J-02" judul="Templat Proposal" deskripsi="Belum ada skema pendanaan. Jalankan reset data contoh di /demo." />;
  }
  const skemaId = skema.find((s) => s.id === skemaParam)?.id ?? skema[0].id;
  const [berlaku, draf] = await Promise.all([ambilTemplatBerlaku(skemaId), ambilDrafTemplat(skemaId)]);

  return (
    <>
      <JudulHalaman
        kode="J-02"
        judul="Templat Proposal"
        deskripsi="Susun daftar bagian, batas kata, dan lampiran wajib per skema. Butir cek turunan templat dibuat otomatis saat templat terbit."
      />
      <PapanTemplat skema={skema} skemaId={skemaId} periode={periode} berlaku={berlaku} draf={draf} masaBerjalan={masaBerjalan} />
    </>
  );
}
