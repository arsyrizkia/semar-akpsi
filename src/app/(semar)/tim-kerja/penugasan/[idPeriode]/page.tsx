import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Alert, Bagian, KepalaHalaman, Paginasi, StatusBadge, Table, TBody, TD, TH, THead, TR, kelasTombol } from "@/components/ui";
import { wajibTimKerja } from "@/lib/auth";
import {
  UKURAN_HALAMAN_USULAN,
  ambilKandidatPengganti,
  ambilRingkasanPeriode,
  ambilSebaranBeban,
  ambilUsulan,
  hitungReviewerUsulan,
} from "@/lib/penugasan/layanan";
import { halamanDariUrl, jumlahHalaman, ringkasStatusPenetapan } from "@/lib/penugasan/periode";
import { formatAngka, formatTanggal } from "@/lib/utils";
import { PapanUsulan } from "./papan-usulan";
import { SebaranBebanTabel } from "./sebaran-beban";

export const metadata: Metadata = { title: "J-04b Usulan Penugasan" };
export const dynamic = "force-dynamic";
/** Susun dan Tetapkan pada skala 10.000 proposal berjalan sebagai server action halaman ini. */
export const maxDuration = 300;

type Param = Promise<{ idPeriode: string }>;
type Cari = Promise<{ hal?: string; halT?: string; susun?: string }>;

/** J-04b Usulan Penugasan (UC-03 s.2-8): batas beban, susun, tinjau/pindahkan, tetapkan. Pilihan halaman ada di URL. */
export default async function Halaman({ params, searchParams }: { params: Param; searchParams: Cari }) {
  await wajibTimKerja();
  const { idPeriode } = await params;
  const sp = await searchParams;
  const periode = await ambilRingkasanPeriode(idPeriode);
  if (!periode) notFound();

  const halamanUsulan = halamanDariUrl(sp.hal, jumlahHalaman(periode.diusulkan, UKURAN_HALAMAN_USULAN));
  const halamanTetap = halamanDariUrl(sp.halT, jumlahHalaman(periode.ditetapkan, UKURAN_HALAMAN_USULAN));
  const [usulan, ditetapkan, sebaran, kandidat, jumlahReviewer] = await Promise.all([
    ambilUsulan(periode.id, "Diusulkan", { halaman: halamanUsulan }),
    ambilUsulan(periode.id, "Ditetapkan", { halaman: halamanTetap }),
    ambilSebaranBeban(periode.id, periode.batasBeban),
    ambilKandidatPengganti(periode.id),
    hitungReviewerUsulan(periode.id),
  ]);
  const status = ringkasStatusPenetapan(periode);

  return (
    <>
      <KepalaHalaman
        kode="J-04b"
        judul="Usulan Penugasan"
        keterangan={`${periode.nama}, ditutup ${formatTanggal(periode.tanggalTutup)}`}
        remah={[{ label: "Penugasan Reviewer", href: "/tim-kerja/penugasan" }, { label: periode.nama }]}
      />

      <dl className="mb-6 flex flex-wrap gap-x-8 gap-y-2 text-sm" data-testid="ringkasan-periode">
        {[
          ["Terkirim", formatAngka(periode.terkirim)],
          ["Belum ditugaskan", formatAngka(periode.belumDitugaskan)],
          ["Usulan", formatAngka(periode.diusulkan)],
          ["Ditetapkan", formatAngka(periode.ditetapkan)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-primer-700">{k}</dt>
            <dd className="angka text-lg font-semibold text-primer-900">{v}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs text-primer-700">Status penetapan</dt>
          <dd className="mt-1 text-sm font-semibold text-primer-900">{status}</dd>
        </div>
      </dl>

      {!periode.ditutup ? (
        <Alert jenis="info" className="mb-6">
          Masa pengusulan periode ini belum ditutup, jadi usulan belum dapat disusun. Di prototipe, tutup masa pengusulan lewat Pusat Demo atau navigator demo.
        </Alert>
      ) : null}

      <PapanUsulan
        periodeId={periode.id}
        batasAwal={periode.batasBeban}
        ditutup={periode.ditutup}
        susunOtomatis={sp.susun === "1"}
        usulan={usulan}
        totalUsulan={periode.diusulkan}
        jumlahReviewerUsulan={jumlahReviewer}
        perluDitugaskan={periode.belumDitugaskan}
        kandidat={kandidat}
        paginasi={
          <Suspense fallback={null}>
            <Paginasi halaman={halamanUsulan} jumlahHalaman={jumlahHalaman(periode.diusulkan, UKURAN_HALAMAN_USULAN)} parameter="hal" />
          </Suspense>
        }
      />

      <Bagian judul="Sebaran Beban">
        <SebaranBebanTabel sebaran={sebaran} batas={periode.batasBeban} />
      </Bagian>

      {periode.ditetapkan > 0 ? (
        <Bagian
          judul={`Penugasan yang Sudah Ditetapkan (${formatAngka(periode.ditetapkan)})`}
          aksi={
            <div className="flex flex-wrap gap-2">
              <Link href="/tim-kerja/pemantauan" className={kelasTombol("sekunder", "sm")}>
                Pantau Kesesuaian (J-05)
              </Link>
              <Link href="/bima/kotak-masuk" className={kelasTombol("hantu", "sm")}>
                Kotak Masuk BIMA (simulasi)
              </Link>
            </div>
          }
        >
          <Table>
            <THead>
              <TR>
                <TH>Judul Proposal</TH>
                <TH>Skema</TH>
                <TH>Institusi Pengusul</TH>
                <TH>Reviewer</TH>
                <TH>Institusi Reviewer</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {ditetapkan.map((u) => (
                <TR key={u.penugasanId}>
                  <TD className="min-w-56 max-w-sm">
                    <Link href={`/tim-kerja/proposal/${u.proposalId}`} className="text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-600">
                      {u.judulProposal}
                    </Link>
                  </TD>
                  <TD>{u.skema}</TD>
                  <TD>{u.institusiPengusul}</TD>
                  <TD>{u.namaReviewer}</TD>
                  <TD>{u.institusiReviewer}</TD>
                  <TD>
                    <StatusBadge status="Ditetapkan" />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Suspense fallback={null}>
            <Paginasi halaman={halamanTetap} jumlahHalaman={jumlahHalaman(periode.ditetapkan, UKURAN_HALAMAN_USULAN)} parameter="halT" />
          </Suspense>
        </Bagian>
      ) : null}
    </>
  );
}
