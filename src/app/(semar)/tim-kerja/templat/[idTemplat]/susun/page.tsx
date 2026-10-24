import { notFound, redirect } from "next/navigation";
import { wajibPengelola } from "@/lib/auth";
import { ambilTemplatPerId } from "@/lib/templat/layanan";

export const dynamic = "force-dynamic";

/** Tautan lama J-02b (`/susun`): penyusunan kini ada di J-02a Rincian Templat; tautan ini dialihkan ke sana. */
export default async function Halaman({ params }: { params: Promise<{ idTemplat: string }> }) {
  await wajibPengelola();
  const { idTemplat } = await params;
  if (!(await ambilTemplatPerId(idTemplat))) notFound();
  redirect(`/tim-kerja/templat/${idTemplat}`);
}
