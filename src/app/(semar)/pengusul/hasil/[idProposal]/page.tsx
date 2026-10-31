import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, Bagian, Button, KepalaHalaman, LencanaStatus, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { wajibPengusul } from "@/lib/auth";
import { ambilStatusPengajuan, type BarisHasilPengajuan } from "@/lib/pengajuan/layanan";
import { formatTanggal, formatWaktu } from "@/lib/utils";
import { kirimUlang } from "./aksi";
import { PemantauPemeriksaan } from "./pemantau";

export const metadata: Metadata = { title: "J-06 Hasil Pemeriksaan Pengajuan" };
export const dynamic = "force-dynamic";

function NamaButir({ h }: { h: BarisHasilPengajuan }) {
  return <span className="font-medium">{h.nama}</span>;
}

/**
 * J-06 Hasil Pemeriksaan Pengajuan (UC-05; hasil UC-06). Hanya baca; hanya pemilik proposal yang dapat membukanya.
 * Satu-satunya tombol: "Kembali ke BIMA" (ditambah "Kirim ulang" hanya bila pemeriksaan berhenti karena galat atau batas waktu).
 * Butir Gagal di atas bersama bagian dan batas yang dilanggar (S-1.2); butir Lolos di bawahnya.
 */
export default async function HasilPengajuan({ params }: { params: Promise<{ idProposal: string }> }) {
  const { idProposal } = await params;
  const { akun } = await wajibPengusul();
  const d = await ambilStatusPengajuan(decodeURIComponent(idProposal), akun.id);
  if (!d) notFound();

  const p = d.proposal;
  const diperiksa = d.sedangDiperiksa && !d.gagal;
  const status = p.status;
  const adaHasil = !diperiksa && !d.gagal && status !== "Ditolak" && d.hasil.length > 0;
  const gagalButir = d.hasil.filter((h) => h.status === "Gagal");
  const lolosButir = d.hasil.filter((h) => h.status === "Lolos");

  return (
    <>
      <KepalaHalaman
        kode="J-06"
        judul="Hasil Pemeriksaan Pengajuan"
        keterangan={`${p.idProposal} · ${p.judul}`}
        remah={[{ label: "Pengusul" }, { label: "Hasil Pemeriksaan Pengajuan" }]}
        aksi={
          <Button asChild>
            <a href="/bima/pengajuan">Kembali ke BIMA</a>
          </Button>
        }
      />
      <PemantauPemeriksaan aktif={diperiksa} />

      {diperiksa ? (
        <Alert jenis="info" judul="Pemeriksaan sedang berjalan">
          <span className="mt-1 inline-flex items-center gap-2">
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Proposal diambil dari BIMA, dipotong per bagian, lalu diperiksa. Halaman ini diperbarui otomatis.
          </span>
        </Alert>
      ) : null}

      {d.gagal ? (
        <Alert jenis="galat" judul="Pengajuan belum dapat diperiksa">
          <p>{d.gagal.pesan}</p>
          <form action={kirimUlang} className="mt-3">
            <input type="hidden" name="proposalId" value={p.id} />
            <Button type="submit" varian="sekunder" ukuran="sm">
              Kirim ulang
            </Button>
          </form>
        </Alert>
      ) : null}

      {!diperiksa && !d.gagal ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-semibold text-primer-800">Status pengajuan</span>
          <LencanaStatus status={status} className="text-sm" />
          <span className="text-sm text-teks-redup">
            {status === "Terkirim" ? "Proposal tercatat terkirim. Semua butir pemeriksaan administratif lolos." : null}
            {status === "Ditahan" ? `${gagalButir.length} butir belum terpenuhi. Perbaiki naskah pada bagian yang ditunjukkan, lalu ajukan kembali dari BIMA.` : null}
          </span>
        </div>
      ) : null}

      {!diperiksa && !d.gagal && status === "Ditolak" ? (
        <Alert jenis="galat" judul="Pengajuan ditolak" className="mt-4">
          Masa pengusulan telah ditutup pada {formatTanggal(d.tanggalTutup)}.
        </Alert>
      ) : null}

      {adaHasil && gagalButir.length ? (
        <Bagian judul={`Perlu diperbaiki (${gagalButir.length})`} className="mt-6">
          <Table aria-label="Butir yang gagal">
            <THead>
              <TR>
                <TH>Butir</TH>
                <TH>Bagian</TH>
                <TH>Angka pembukti</TH>
                <TH>Batas yang dilanggar</TH>
              </TR>
            </THead>
            <TBody>
              {gagalButir.map((h) => (
                <TR key={h.butirId} className="bg-bata-100/40">
                  <TD>
                    <NamaButir h={h} />
                    <LencanaStatus status="Gagal" className="mt-1" />
                  </TD>
                  <TD>{h.bagian ?? "-"}</TD>
                  <TD>{h.angkaPembukti}</TD>
                  <TD className="text-bata-700">{h.batasDilanggar ?? "-"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Bagian>
      ) : null}

      {adaHasil && lolosButir.length ? (
        <Bagian judul={`Lolos (${lolosButir.length})`}>
          <Table aria-label="Butir yang lolos">
            <THead>
              <TR>
                <TH>Butir</TH>
                <TH>Bagian</TH>
                <TH>Status</TH>
                <TH>Angka pembukti</TH>
              </TR>
            </THead>
            <TBody>
              {lolosButir.map((h) => (
                <TR key={h.butirId}>
                  <TD>
                    <NamaButir h={h} />
                  </TD>
                  <TD>{h.bagian ?? "-"}</TD>
                  <TD>
                    <LencanaStatus status="Lolos" />
                  </TD>
                  <TD>{h.angkaPembukti}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Bagian>
      ) : null}

      {status === "Terkirim" && !diperiksa ? (
        <Bagian judul="Bukti pengiriman">
          <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[11rem_1fr]">
            <dt className="font-semibold text-primer-800">ID Proposal</dt>
            <dd>{p.idProposal}</dd>
            <dt className="font-semibold text-primer-800">Judul</dt>
            <dd>{p.judul}</dd>
            <dt className="font-semibold text-primer-800">Skema</dt>
            <dd>{d.namaSkema}</dd>
            <dt className="font-semibold text-primer-800">Kode versi</dt>
            <dd>{d.versi?.kode ?? "-"}</dd>
            <dt className="font-semibold text-primer-800">Waktu pencatatan</dt>
            <dd className="angka">{formatWaktu(p.waktuTerkirim)}</dd>
          </dl>
        </Bagian>
      ) : null}
    </>
  );
}
