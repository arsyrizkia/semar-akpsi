import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { wajibPengelola } from "@/lib/auth";
import { daftarButirBerlaku, pilihanBagian } from "@/lib/aturan/layanan";
import { bacaTab } from "@/lib/templat/daftar";
import { ambilDrafTemplat, ambilTemplatPerId, daftarPeriode, daftarSkema } from "@/lib/templat/layanan";
import { ambilPeriodeBerjalanId, masaPengusulanBerjalan } from "@/lib/waktu";
import { RincianTemplat } from "./rincian-templat";

export const metadata: Metadata = { title: "J-02a Rincian Templat" };
export const dynamic = "force-dynamic";

type Param = { tab?: string; periode?: string; sorot?: string; hasil?: string; jumlah?: string; det?: string; sem?: string; baru?: string };

/**
 * J-02a Rincian Templat (UC-01 langkah 4-10 dan UC-02 sebagai tab). Menggantikan J-02 lama dan J-02b.
 * Tab (?tab=bagian|aturan), periode Aturan, butir yang disorot, dan pesan hasil Terbitkan tersimpan di URL.
 */
export default async function Halaman({ params, searchParams }: { params: Promise<{ idTemplat: string }>; searchParams: Promise<Param> }) {
  await wajibPengelola();
  const { idTemplat } = await params;
  const q = await searchParams;
  const ada = await ambilTemplatPerId(idTemplat);
  if (!ada) notFound();
  const { templat, skemaId } = ada;

  const [skema, periode, sakelarBerjalan, periodeBerjalanId, draf] = await Promise.all([daftarSkema(), daftarPeriode(), masaPengusulanBerjalan(), ambilPeriodeBerjalanId(), ambilDrafTemplat(skemaId)]);
  // Aturan Pemeriksaan: periode dari URL (tautan J-05), selain itu periode berlaku templat, selain itu periode berjalan
  const periodeAturan = periode.find((p) => p.id === q.periode) ?? periode.find((p) => p.id === templat.periodeBerlakuId) ?? periode.find((p) => p.id === periodeBerjalanId) ?? periode[0] ?? null;
  const [tampilan, pilihan] = periodeAturan ? await Promise.all([daftarButirBerlaku(skemaId, periodeAturan.id), pilihanBagian(skemaId, periodeAturan.id)]) : [null, null];

  const angka = (v?: string) => {
    const n = Number.parseInt(v ?? "", 10);
    return Number.isFinite(n) ? n : null;
  };
  return (
    <RincianTemplat
      // kunci ikut id dan status: isian dimuat ulang bila draf berganti atau baru terbit
      key={`${templat.id}:${templat.status}`}
      skemaId={skemaId}
      namaSkema={skema.find((s) => s.id === skemaId)?.namaSkema ?? ""}
      templat={templat}
      periode={periode}
      periodeBerjalanId={periodeBerjalanId}
      sakelarBerjalan={sakelarBerjalan}
      adaDraf={Boolean(draf)}
      tabAwal={bacaTab(q.tab)}
      aturan={tampilan && pilihan && periodeAturan ? { periode: periodeAturan, tampilan, bagianPilihan: pilihan.bagian } : null}
      sorotAwal={q.sorot ?? null}
      hasil={q.hasil === "terbit" || q.hasil === "draf" ? { jenis: q.hasil, jumlah: angka(q.jumlah), det: angka(q.det), sem: angka(q.sem), baru: q.baru ?? null } : null}
    />
  );
}
