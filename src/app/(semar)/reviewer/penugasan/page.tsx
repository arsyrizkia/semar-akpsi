import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Button, JudulHalaman, Panel, StatusBadge, TBody, TD, TH, THead, TR, Table } from "@/components/ui";
import { wajibReviewer } from "@/lib/auth";
import { daftarPenugasanReviewer } from "@/lib/penilaian/layanan";

export const metadata: Metadata = { title: "Daftar Penugasan (J-07)" };
export const dynamic = "force-dynamic";

/** J-07 Daftar Penugasan: hanya proposal yang ditugaskan kepada reviewer yang sedang masuk (NFR 3.1). Tanpa pencarian atau penyaring. */
export default async function Halaman() {
  const { akun } = await wajibReviewer();
  const baris = await daftarPenugasanReviewer(akun.id);

  return (
    <>
      <JudulHalaman kode="J-07" judul="Daftar Penugasan" deskripsi={`Proposal yang ditugaskan kepada ${akun.nama}.`} />
      <Panel>
        {baris.length === 0 ? (
          <Alert jenis="info">Belum ada proposal yang ditugaskan kepada Anda.</Alert>
        ) : (
          <Table>
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
                  <TD className="max-w-md font-medium">{b.judul}</TD>
                  <TD>{b.skema}</TD>
                  <TD className="whitespace-nowrap">{b.tanggal}</TD>
                  <TD>
                    <StatusBadge status={b.label} />
                  </TD>
                  <TD className="text-right">
                    <Button asChild ukuran="sm">
                      <Link href={`/reviewer/pemeriksaan/${b.penugasanId}`}>Periksa</Link>
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
