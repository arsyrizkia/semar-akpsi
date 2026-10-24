import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { wajibPengelola } from "@/lib/auth";
import { pilihTemplatAturan, urlTabAturan } from "@/lib/templat/daftar";
import { daftarSemuaTemplat, daftarSkema } from "@/lib/templat/layanan";

export const metadata: Metadata = { title: "J-03 Aturan Pemeriksaan" };
export const dynamic = "force-dynamic";

/**
 * J-03 Aturan Pemeriksaan kini berupa tab "Aturan Pemeriksaan" di J-02a Rincian Templat. Rute lama (tautan dari J-05, J-05b,
 * navigator demo) dialihkan ke tab itu pada templat Aktif untuk skema dan periode yang diminta, dengan butir yang disorot.
 */
export default async function Halaman({ searchParams }: { searchParams: Promise<{ skema?: string; periode?: string; sorot?: string; butir?: string }> }) {
  await wajibPengelola();
  const { skema: skemaParam, periode: periodeParam, sorot, butir } = await searchParams;
  const [skema, semua] = await Promise.all([daftarSkema(), daftarSemuaTemplat()]);
  const skemaTerpilih = skema.find((s) => s.id === skemaParam) ?? skema[0];
  if (!skemaTerpilih) redirect("/tim-kerja/templat");
  const tujuan = pilihTemplatAturan(
    semua.filter((t) => t.skemaId === skemaTerpilih.id).map((t) => ({ id: t.id, versi: t.versi, status: t.status, periodeId: t.periodeId })),
    periodeParam ?? null,
  );
  if (!tujuan) redirect(`/tim-kerja/templat?skema=${skemaTerpilih.id}`);
  redirect(urlTabAturan(tujuan.id, { periodeId: periodeParam, sorot: sorot ?? butir }));
}
