import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button, KeadaanKosong, KepalaHalaman, StatusBadge, TBody, TD, TH, THead, TR, Table } from "@/components/ui";
import { wajibReviewer } from "@/lib/auth";
import { daftarPenugasanReviewer } from "@/lib/penilaian/layanan";
import { ringkasLabelPenugasan } from "@/lib/penilaian/status";

export const metadata: Metadata = { title: "J-07 Daftar Penugasan" };
export const dynamic = "force-dynamic";

/** J-07 Daftar Penugasan: hanya proposal yang ditugaskan kepada reviewer yang sedang masuk (NFR 3.1). Tanpa pencarian atau penyaring. */
export default async function Halaman() {
  const { akun } = await wajibReviewer();
  const baris = await daftarPenugasanReviewer(akun.id);

  return (
    <>
      <KepalaHalaman kode="J-07" judul="Daftar Penugasan" keterangan={ringkasLabelPenugasan(baris.map((b) => b.label))} remah={[{ label: "Reviewer" }, { label: "Daftar Penugasan" }]} />
      {baris.length === 0 ? (
        <KeadaanKosong ikon={Inbox} judul="Belum ada proposal yang ditugaskan kepada Anda.">
          Penugasan muncul di sini setelah Tim Kerja DPPM menetapkannya.
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
    </>
  );
}
