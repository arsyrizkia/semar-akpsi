import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, Button, JudulHalaman, Panel, StatusBadge, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PanelPemandu } from "@/components/layout/panel-pemandu";
import { wajibPengusul } from "@/lib/auth";
import { LANGKAH_UC05 } from "@/lib/demo/pemandu/uc-05";
import { LANGKAH_UC06 } from "@/lib/demo/pemandu/uc-06";
import { ambilStatusPengajuan } from "@/lib/pengajuan/layanan";
import { cn, formatTanggal, formatWaktu } from "@/lib/utils";
import { kirimUlang } from "./aksi";
import { PemantauPemeriksaan } from "./pemantau";

export const metadata: Metadata = { title: "Hasil Pemeriksaan Pengajuan (J-06)" };
export const dynamic = "force-dynamic";

/**
 * J-06 Hasil Pemeriksaan Pengajuan (UC-05; hasil UC-06). Hanya baca. Hanya pemilik proposal yang dapat membukanya.
 * Satu-satunya tombol: "Kembali ke BIMA" (ditambah "Kirim ulang" hanya bila pemeriksaan gagal karena galat).
 */
export default async function HasilPengajuan({ params }: { params: Promise<{ idProposal: string }> }) {
  const { idProposal } = await params;
  const { akun } = await wajibPengusul();
  const d = await ambilStatusPengajuan(decodeURIComponent(idProposal), akun.id);
  if (!d) notFound();

  const p = d.proposal;
  const diperiksa = d.sedangDiperiksa && !d.gagal;
  const status = p.status;
  const gagalButir = d.hasil.filter((h) => h.status === "Gagal");
  const aktif = diperiksa ? "8" : status === "Terkirim" ? "11" : status === "Ditahan" ? "S-1.2" : status === "Ditolak" ? "3a.2" : "2";

  return (
    <>
      <JudulHalaman kode="J-06" judul="Hasil Pemeriksaan Pengajuan" deskripsi={`${p.idProposal} - ${p.judul}`} />
      <PemantauPemeriksaan aktif={diperiksa} />

      <div className="space-y-6">
        {diperiksa ? (
          <Alert jenis="info" judul="Pemeriksaan sedang berjalan">
            <span className="mt-1 inline-flex items-center gap-2">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Proposal Anda sedang diambil dari BIMA, dipotong per bagian, dan diperiksa. Halaman ini diperbarui otomatis.
            </span>
          </Alert>
        ) : null}

        {d.gagal ? (
          <Alert jenis="galat" judul="Pengajuan belum dapat diperiksa">
            <p>{d.gagal.pesan}</p>
            <form action={kirimUlang} className="mt-3">
              <input type="hidden" name="proposalId" value={p.id} />
              <Button type="submit" varian="garis" ukuran="sm">
                Kirim ulang
              </Button>
            </form>
          </Alert>
        ) : null}

        {!diperiksa && !d.gagal ? (
          <Panel>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-sogan-800">Status pengajuan</span>
              <StatusBadge status={status} className="text-sm" />
            </div>
            {status === "Ditolak" ? (
              <Alert jenis="galat" className="mt-4" judul="Pengajuan ditolak">
                Masa pengusulan telah ditutup pada {formatTanggal(d.tanggalTutup)}.
              </Alert>
            ) : null}
            {status === "Ditahan" ? (
              <Alert jenis="peringatan" className="mt-4" judul="Pengiriman ditahan">
                {gagalButir.length} butir belum terpenuhi. Perbaiki naskah pada bagian yang ditunjukkan di bawah, lalu ajukan kembali dari BIMA.
              </Alert>
            ) : null}
            {status === "Terkirim" ? (
              <Alert jenis="sukses" className="mt-4" judul="Proposal tercatat terkirim">
                Semua butir pemeriksaan administratif lolos.
              </Alert>
            ) : null}
          </Panel>
        ) : null}

        {!diperiksa && !d.gagal && status !== "Ditolak" && d.hasil.length ? (
          <Panel judul="Hasil Setiap Butir">
            <Table>
              <THead>
                <TR>
                  <TH>Butir</TH>
                  <TH>Bagian</TH>
                  <TH>Status</TH>
                  <TH>Angka Pembukti</TH>
                </TR>
              </THead>
              <TBody>
                {d.hasil.map((h) => (
                  <TR key={h.butirId} className={cn(h.status === "Gagal" && "bg-bata-100/50")}>
                    <TD>
                      <span className="font-medium">{h.nama}</span>
                      <span className="block font-mono text-xs text-sogan-600">{h.kode}</span>
                    </TD>
                    <TD>{h.bagian ?? "-"}</TD>
                    <TD>
                      <StatusBadge status={h.status} />
                    </TD>
                    <TD>
                      {h.angkaPembukti}
                      {h.status === "Gagal" && h.batasDilanggar ? (
                        <span className="mt-1 block text-bata-700">Batas yang dilanggar: {h.batasDilanggar}</span>
                      ) : null}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Panel>
        ) : null}

        {status === "Terkirim" && !diperiksa ? (
          <Panel judul="Bukti Pengiriman">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
              <dt className="font-semibold text-sogan-800">ID Proposal</dt>
              <dd>{p.idProposal}</dd>
              <dt className="font-semibold text-sogan-800">Judul</dt>
              <dd>{p.judul}</dd>
              <dt className="font-semibold text-sogan-800">Skema</dt>
              <dd>{d.namaSkema}</dd>
              <dt className="font-semibold text-sogan-800">Kode versi</dt>
              <dd>{d.versi?.kode ?? "-"}</dd>
              <dt className="font-semibold text-sogan-800">Waktu pencatatan</dt>
              <dd>{formatWaktu(p.waktuTerkirim)}</dd>
            </dl>
          </Panel>
        ) : null}

        <div>
          <Button asChild varian="utama">
            <a href="/bima/pengajuan">Kembali ke BIMA</a>
          </Button>
        </div>
      </div>

      <PanelPemandu kode="UC-05" judul="Mengajukan proposal" langkah={[...LANGKAH_UC05, ...LANGKAH_UC06.map((l) => ({ ...l, nomor: `6.${l.nomor}`, alternatif: true }))]} aktifNomor={aktif} />
    </>
  );
}
