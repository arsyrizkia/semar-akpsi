"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button, Checkbox, StatusBadge, Table, TBody, TD, TH, THead, TR, beriTahu } from "@/components/ui";
import type { BarisUsulanPenugasan } from "@/lib/kontrak/tipe";
import type { HasilPindahBanyak } from "@/lib/penugasan/layanan";
import type { FilterUsulan } from "@/lib/penugasan/periode";
import { ModalPindah, type KandidatUi, type TargetPindah } from "./modal-pindah";

const angka = new Intl.NumberFormat("id-ID");

/** Periksa ulang syarat satu baris (bukti deterministik): kosong berarti memenuhi. */
function pelanggaran(u: BarisUsulanPenugasan, batas: number): string[] {
  const x: string[] = [];
  if (u.samaInstitusi) x.push("institusi sama dengan pengusul");
  if (u.tidakBersedia) x.push("reviewer tidak bersedia");
  if ((u.bebanReviewer ?? 0) > batas) x.push(`beban ${u.bebanReviewer}/${batas}`);
  return x;
}

function SelSyarat({ u, batas }: { u: BarisUsulanPenugasan; batas: number }) {
  const x = pelanggaran(u, batas);
  if (!x.length) {
    return (
      <span className="inline-flex items-center gap-1 text-daun-700" title={`Institusi berbeda, reviewer bersedia, beban ${u.bebanReviewer ?? 0}/${batas}`}>
        <Check aria-hidden className="size-4" /> Memenuhi
        <span className="sr-only">: institusi berbeda, reviewer bersedia, beban {u.bebanReviewer ?? 0} dari batas {batas}</span>
      </span>
    );
  }
  return (
    <span className="text-bata-700">
      <span className="inline-flex items-center gap-1 font-semibold">
        <X aria-hidden className="size-4" /> Melanggar
      </span>
      <span className="block text-xs">{x.join("; ")}</span>
    </span>
  );
}

/**
 * Tabel Usulan Penugasan (mode "usulan": centang, kolom Syarat, Pindahkan) atau Sudah Ditetapkan (mode "ditetapkan": hanya baca,
 * kolom Status). Pilihan baris bertahan saat berpindah halaman dan diatur ulang bila filter berubah (komponen diberi key filter).
 * "Pilih semua N hasil filter" mengirim filter ke server alih-alih ribuan id.
 */
export function TabelUsulan({
  mode,
  periodeId,
  baris,
  total,
  filter,
  kandidat,
  batas,
  mulai,
}: {
  mode: "usulan" | "ditetapkan";
  periodeId: string;
  baris: BarisUsulanPenugasan[];
  total: number;
  filter: FilterUsulan;
  kandidat: KandidatUi[];
  batas: number;
  /** nomor baris pertama di halaman ini (1-based) */
  mulai: number;
}) {
  const jalur = usePathname();
  const cari = useSearchParams();
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [semuaFilter, setSemuaFilter] = useState(false);
  const [target, setTarget] = useState<TargetPindah | null>(null);
  const bisaPilih = mode === "usulan";

  const idHalaman = baris.map((u) => u.penugasanId);
  const terpilihDiHalaman = idHalaman.filter((id) => semuaFilter || dipilih.has(id)).length;
  const jumlahDipilih = semuaFilter ? total : dipilih.size;
  const kepala: boolean | "indeterminate" = terpilihDiHalaman === 0 ? false : terpilihDiHalaman === idHalaman.length ? true : "indeterminate";

  function ubahSatu(id: string, ya: boolean) {
    if (semuaFilter) {
      // keluar dari mode "semua hasil filter": pilihan menjadi baris halaman ini tanpa baris yang dilepas
      setSemuaFilter(false);
      setDipilih(new Set(idHalaman.filter((x) => x !== id)));
      return;
    }
    setDipilih((s) => {
      const n = new Set(s);
      if (ya) n.add(id);
      else n.delete(id);
      return n;
    });
  }
  function ubahHalaman(ya: boolean) {
    setSemuaFilter(false);
    setDipilih((s) => {
      const n = new Set(s);
      for (const id of idHalaman) {
        if (ya) n.add(id);
        else n.delete(id);
      }
      return n;
    });
  }
  function batalPilih() {
    setSemuaFilter(false);
    setDipilih(new Set());
  }
  function selesai(h: HasilPindahBanyak) {
    setTarget(null);
    batalPilih();
    beriTahu.sukses(h.ditolak ? `${angka.format(h.dipindahkan)} proposal dipindahkan; ${angka.format(h.ditolak)} tetap pada reviewer semula.` : `${angka.format(h.dipindahkan)} proposal dipindahkan.`);
  }
  const alamatReviewer = (id: string) => {
    const p = new URLSearchParams(cari.toString());
    p.set("rev", id);
    p.delete("hal");
    p.delete("tetap");
    return `${jalur}?${p.toString()}`;
  };

  return (
    <>
      <p className="mb-2 text-sm text-teks-redup" data-testid="ringkasan-usulan">
        Menampilkan <span className="angka">{angka.format(mulai)}</span>–<span className="angka">{angka.format(mulai + baris.length - 1)}</span> dari{" "}
        <strong className="angka text-primer-900">{angka.format(total)}</strong> {mode === "usulan" ? "usulan menunggu penetapan" : "penugasan ditetapkan"}.
      </p>
      <Table aria-label={mode === "usulan" ? "Usulan Penugasan" : "Penugasan yang sudah ditetapkan"}>
        <THead>
          <TR>
            {bisaPilih ? (
              <TH className="w-10">
                <Checkbox aria-label="Pilih semua baris di halaman ini" checked={kepala} onCheckedChange={(c) => ubahHalaman(c === true)} />
              </TH>
            ) : null}
            <TH>Judul Proposal</TH>
            <TH>Skema</TH>
            <TH>Institusi Pengusul</TH>
            <TH>Reviewer</TH>
            <TH>Institusi Reviewer</TH>
            {bisaPilih ? <TH>Syarat</TH> : <TH>Status</TH>}
            {bisaPilih ? (
              <TH>
                <span className="sr-only">Aksi</span>
              </TH>
            ) : null}
          </TR>
        </THead>
        <TBody>
          {baris.map((u) => {
            const pilih = semuaFilter || dipilih.has(u.penugasanId);
            return (
              <TR key={u.penugasanId} tersorot={bisaPilih && pilih}>
                {bisaPilih ? (
                  <TD>
                    <Checkbox aria-label={`Pilih ${u.judulProposal}`} checked={pilih} onCheckedChange={(c) => ubahSatu(u.penugasanId, c === true)} />
                  </TD>
                ) : null}
                <TD className="min-w-56 max-w-sm">
                  {u.idProposal ? (
                    <span className="block font-mono text-xs text-teks-redup" translate="no">
                      {u.idProposal}
                    </span>
                  ) : null}
                  <Link href={`/tim-kerja/proposal/${u.proposalId}`} className="text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2">
                    {u.judulProposal}
                  </Link>
                </TD>
                <TD>{u.skema}</TD>
                <TD>{u.institusiPengusul}</TD>
                <TD>
                  <Link href={alamatReviewer(u.reviewerId)} className="text-primer-800 underline decoration-primer-300 underline-offset-2 hover:decoration-primer-600" title={`Tampilkan semua proposal ${u.namaReviewer}`}>
                    {u.namaReviewer}
                  </Link>
                </TD>
                <TD>{u.institusiReviewer}</TD>
                <TD className="min-w-32">{bisaPilih ? <SelSyarat u={u} batas={batas} /> : <StatusBadge status={u.status ?? "Ditetapkan"} />}</TD>
                {bisaPilih ? (
                  <TD className="text-right">
                    <Button
                      ukuran="sm"
                      varian="sekunder"
                      aria-label={`Pindahkan ${u.judulProposal}`}
                      onClick={() =>
                        setTarget({
                          pilihan: { ids: [u.penugasanId] },
                          jumlah: 1,
                          tunggal: { judul: u.judulProposal, institusiPengusul: u.institusiPengusul, reviewerId: u.reviewerId, namaReviewer: u.namaReviewer },
                        })
                      }
                    >
                      Pindahkan
                    </Button>
                  </TD>
                ) : null}
              </TR>
            );
          })}
        </TBody>
      </Table>

      {bisaPilih && jumlahDipilih > 0 ? (
        <div role="region" aria-label="Aksi baris terpilih" className="sticky bottom-3 z-30 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-primer-300 bg-white px-4 py-2.5 shadow-[var(--shadow-overlay)]">
          <p className="text-sm font-semibold text-primer-900" aria-live="polite">
            {angka.format(jumlahDipilih)} dipilih{semuaFilter ? " (semua hasil filter)" : ""}
          </p>
          {!semuaFilter && total > dipilih.size && terpilihDiHalaman === idHalaman.length ? (
            <button type="button" onClick={() => setSemuaFilter(true)} className="cursor-pointer text-sm font-semibold text-primer-800 underline underline-offset-2">
              Pilih semua {angka.format(total)} hasil filter
            </button>
          ) : null}
          <span className="ml-auto flex gap-2">
            <Button ukuran="sm" varian="hantu" onClick={batalPilih}>
              Batal pilih
            </Button>
            <Button
              ukuran="sm"
              varian="sekunder"
              onClick={() => setTarget({ pilihan: semuaFilter ? { filter } : { ids: [...dipilih] }, jumlah: jumlahDipilih })}
            >
              Pindahkan {angka.format(jumlahDipilih)} proposal
            </Button>
          </span>
        </div>
      ) : null}

      <ModalPindah target={target} saatTutup={() => setTarget(null)} saatSelesai={selesai} periodeId={periodeId} kandidat={kandidat} batas={batas} />
    </>
  );
}
