import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { Suspense } from "react";
import { Button, KeadaanKosong, KepalaHalaman, Paginasi, StatusBadge, TBody, TD, TH, THead, TR, Table } from "@/components/ui";
import { wajibReviewer } from "@/lib/auth";
import { daftarPenugasanReviewer } from "@/lib/penilaian/layanan";
import { ringkasLabelPenugasan } from "@/lib/penilaian/status";
import { halamanDariUrl, jumlahHalaman } from "@/lib/penugasan/periode";
import { cn } from "@/lib/utils";

const UKURAN = 25;
const TANDA = ["Baru", "Draf", "Selesai"] as const;

export const metadata: Metadata = { title: "J-07 Daftar Penugasan" };
export const dynamic = "force-dynamic";

/**
 * J-07 Daftar Penugasan: hanya proposal yang ditugaskan kepada reviewer yang sedang masuk (NFR 3.1). Seorang reviewer bisa menerima
 * puluhan sampai ratusan proposal (UC-03 skala besar), jadi daftar berhalaman 25 baris dengan saringan tanda (Semua, Baru, Draf,
 * Selesai) di URL; tanpa pencarian supaya tetap sederhana (NFR 5.1).
 */
export default async function Halaman({ searchParams }: { searchParams: Promise<{ tanda?: string; hal?: string }> }) {
  const { akun } = await wajibReviewer();
  const sp = await searchParams;
  const semua = await daftarPenugasanReviewer(akun.id);
  const tanda = TANDA.find((t) => t === sp.tanda) ?? null;
  const tersaring = tanda ? semua.filter((b) => b.label === tanda) : semua;
  const jh = jumlahHalaman(tersaring.length, UKURAN);
  const halaman = halamanDariUrl(sp.hal, jh);
  const baris = tersaring.slice((halaman - 1) * UKURAN, halaman * UKURAN);
  const hitung = (t: (typeof TANDA)[number]) => semua.filter((b) => b.label === t).length;
  const pilihan = [{ nilai: null, label: "Semua", jumlah: semua.length }, ...TANDA.map((t) => ({ nilai: t, label: t, jumlah: hitung(t) }))];

  return (
    <>
      <KepalaHalaman kode="J-07" judul="Daftar Penugasan" keterangan={ringkasLabelPenugasan(semua.map((b) => b.label))} remah={[{ label: "Reviewer" }, { label: "Daftar Penugasan" }]} />
      {semua.length > UKURAN || tanda ? (
        <nav aria-label="Saring menurut tanda" className="mb-3 flex flex-wrap gap-2">
          {pilihan.map((p) => (
            <Link
              key={p.label}
              href={p.nilai ? `/reviewer/penugasan?tanda=${p.nilai}` : "/reviewer/penugasan"}
              aria-current={tanda === p.nilai ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-sm font-semibold transition-colors",
                tanda === p.nilai ? "border-primer-700 bg-primer-700 text-white" : "border-primer-300 bg-white text-primer-800 hover:bg-primer-50",
              )}
            >
              {p.label} <span className="angka ml-1 font-normal">({p.jumlah})</span>
            </Link>
          ))}
        </nav>
      ) : null}
      {baris.length === 0 ? (
        <KeadaanKosong ikon={Inbox} judul={tanda ? `Tidak ada proposal bertanda ${tanda}.` : "Belum ada proposal yang ditugaskan kepada Anda."}>
          {tanda ? "Pilih Semua untuk melihat seluruh penugasan." : "Penugasan muncul di sini setelah Tim Kerja DPPM menetapkannya."}
        </KeadaanKosong>
      ) : (
        <Table aria-label="Proposal yang ditugaskan kepada Anda">
          <THead>
            <TR>
              <TH>Judul Proposal</TH>
              <TH>Skema</TH>
              <TH>Tanggal Penugasan</TH>
              <TH>Status</TH>
              <TH>
                <span className="sr-only">Tindakan</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {baris.map((b) => (
              <TR key={b.penugasanId}>
                <TD className="max-w-md font-medium">
                  <Link href={`/reviewer/pemeriksaan/${b.penugasanId}`} className="text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2">
                    {b.judul}
                  </Link>
                </TD>
                <TD>{b.skema}</TD>
                <TD className="whitespace-nowrap">{b.tanggal}</TD>
                <TD>
                  <StatusBadge status={b.label} />
                </TD>
                <TD className="text-right">
                  <Button asChild ukuran="sm" varian="sekunder">
                    <Link href={`/reviewer/pemeriksaan/${b.penugasanId}`} aria-label={`Periksa ${b.judul}`}>
                      Periksa
                    </Link>
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Suspense fallback={null}>
        <Paginasi halaman={halaman} jumlahHalaman={jh} parameter="hal" />
      </Suspense>
    </>
  );
}
