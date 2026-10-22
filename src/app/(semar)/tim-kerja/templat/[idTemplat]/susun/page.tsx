import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { wajibPengelola } from "@/lib/auth";
import { ambilTemplatPerId, daftarPeriode, daftarSkema } from "@/lib/templat/layanan";
import { dapatDisusun } from "@/lib/templat/status";
import { masaPengusulanBerjalan } from "@/lib/waktu";
import { FormSusun } from "./form-susun";

export const metadata: Metadata = { title: "J-02b Penyusunan Templat" };
export const dynamic = "force-dynamic";

/** J-02b Penyusunan Templat (UC-01 langkah 4 sampai 7). Draf yang tersimpan dapat dibuka lagi lewat URL ini. */
export default async function Halaman({ params }: { params: Promise<{ idTemplat: string }> }) {
  await wajibPengelola();
  const { idTemplat } = await params;
  const ada = await ambilTemplatPerId(idTemplat);
  if (!ada) notFound();
  // hanya Draf yang dapat disusun; Terbit dan Arsip dilihat (hanya-baca) di J-02
  if (!dapatDisusun(ada.templat.status)) redirect(`/tim-kerja/templat?skema=${ada.skemaId}&versi=${idTemplat}`);

  const [skema, periode, masaBerjalan] = await Promise.all([daftarSkema(), daftarPeriode(), masaPengusulanBerjalan()]);
  return (
    <FormSusun
      // kunci ikut id draf: isian dimuat ulang bila draf berganti
      key={ada.templat.id}
      skemaId={ada.skemaId}
      namaSkema={skema.find((s) => s.id === ada.skemaId)?.namaSkema ?? ""}
      templat={ada.templat}
      periode={periode}
      masaBerjalan={masaBerjalan}
    />
  );
}
