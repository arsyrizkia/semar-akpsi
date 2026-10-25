import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, KeadaanKosong, KepalaHalaman, Table, TBody, TD, TH, THead, TR, kelasTombol } from "@/components/ui";
import { wajibTimKerja } from "@/lib/auth";
import { daftarPeriodeDitutup } from "@/lib/penugasan/layanan";
import { ringkasStatusPenetapan, type StatusPenetapan } from "@/lib/penugasan/periode";
import { ambilPeriodeAktif } from "@/lib/waktu";
import { formatAngka, formatTanggal } from "@/lib/utils";

export const metadata: Metadata = { title: "J-04 Penugasan Reviewer" };
export const dynamic = "force-dynamic";

const warnaPenetapan: Record<StatusPenetapan, "netral" | "peringatan" | "daun"> = {
  "Tidak ada proposal": "netral",
  "Belum disusun": "netral",
  "Usulan menunggu penetapan": "peringatan",
  "Sebagian ditetapkan": "peringatan",
  "Seluruhnya ditetapkan": "daun",
};

/** J-04 Penugasan Reviewer (UC-03 s.1): periode yang masa pengusulannya ditutup. Susun, pindah, dan tetapkan ada di J-04b. */
export default async function Halaman({ searchParams }: { searchParams: Promise<{ susun?: string }> }) {
  await wajibTimKerja();
  const sp = await searchParams;
  // Tautan skenario demo lama (?susun=1) langsung membuka J-04b periode aktif dengan penyusunan otomatis.
  if (sp.susun === "1") {
    const aktif = await ambilPeriodeAktif();
    if (aktif) redirect(`/tim-kerja/penugasan/${aktif.id}?susun=1`);
  }
  const { periode, jumlahBerjalan } = await daftarPeriodeDitutup();

  return (
    <>
      <KepalaHalaman
        kode="J-04"
        judul="Penugasan Reviewer"
        keterangan="Pilih periode yang masa pengusulannya sudah ditutup untuk menyusun dan menetapkan penugasan."
        remah={[{ label: "Penugasan Reviewer" }]}
      />
      {periode.length === 0 ? (
        <KeadaanKosong judul="Belum ada periode yang masa pengusulannya ditutup">
          {jumlahBerjalan > 0
            ? `${jumlahBerjalan} periode masih menerima pengusulan. Penugasan dapat disusun sesudah masa pengusulan ditutup.`
            : "Belum ada periode seleksi."}
        </KeadaanKosong>
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Periode Seleksi</TH>
                <TH>Tanggal Tutup</TH>
                <TH angka>Terkirim</TH>
                <TH angka>Belum Ditugaskan</TH>
                <TH angka>Reviewer Bersedia</TH>
                <TH>Status Penetapan</TH>
                <TH>
                  <span className="sr-only">Aksi</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {periode.map((p) => {
                const status = ringkasStatusPenetapan(p);
                return (
                  <TR key={p.id}>
                    <TD>
                      <Link href={`/tim-kerja/penugasan/${p.id}`} className="font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-600">
                        {p.nama}
                      </Link>
                    </TD>
                    <TD>{formatTanggal(p.tanggalTutup)}</TD>
                    <TD angka>{formatAngka(p.terkirim)}</TD>
                    <TD angka>{formatAngka(p.belumDitugaskan)}</TD>
                    <TD angka>{formatAngka(p.reviewerBersedia ?? 0)}</TD>
                    <TD>
                      <Badge warna={warnaPenetapan[status]}>{status}</Badge>
                      {p.diusulkan > 0 ? <span className="ml-2 text-xs text-teks-redup">{formatAngka(p.diusulkan)} usulan</span> : null}
                    </TD>
                    <TD className="text-right">
                      <Link href={`/tim-kerja/penugasan/${p.id}`} className={kelasTombol("sekunder", "sm")}>
                        Buka Usulan
                      </Link>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          {jumlahBerjalan > 0 ? <p className="mt-3 text-xs text-teks-redup">{jumlahBerjalan} periode lain masih menerima pengusulan dan belum tampil di sini.</p> : null}
        </>
      )}
    </>
  );
}
