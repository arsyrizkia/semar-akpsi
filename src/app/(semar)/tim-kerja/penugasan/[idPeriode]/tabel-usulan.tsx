"use client";

import { useRef, useState } from "react";
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
 * kolom Status). Bilah pilihan berada DI ATAS tabel (lengket, selalu ada sehingga pembaca layar mengumumkan perubahan, dan dapat
 * dijangkau di ponsel tempat kepala tabel disembunyikan): centang halaman ini, jumlah dipilih, "Pilih semua n hasil filter" /
 * "Hanya halaman ini", Pindahkan, Batal pilih. Pilihan bertahan antarhalaman dan diatur ulang bila filter atau susunan berubah (key).
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
  const [nomorModal, setNomorModal] = useState(0);
  const centangHalaman = useRef<HTMLButtonElement>(null);
  const ringkasan = useRef<HTMLParagraphElement>(null);
  const bisaPilih = mode === "usulan";

  const idHalaman = baris.map((u) => u.penugasanId);
  const terpilihDiHalaman = idHalaman.filter((id) => semuaFilter || dipilih.has(id)).length;
  const jumlahDipilih = semuaFilter ? total : dipilih.size;
  const kepala: boolean | "indeterminate" = terpilihDiHalaman === 0 ? false : terpilihDiHalaman === idHalaman.length ? true : "indeterminate";

  function bukaModal(t: TargetPindah) {
    setNomorModal((n) => n + 1);
    setTarget(t);
  }
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
    centangHalaman.current?.focus();
  }
  function selesai(h: HasilPindahBanyak) {
    setTarget(null);
    setSemuaFilter(false);
    setDipilih(new Set());
    beriTahu.sukses(h.ditolak ? `${angka.format(h.dipindahkan)} proposal dipindahkan; ${angka.format(h.ditolak)} tetap pada reviewer semula.` : `${angka.format(h.dipindahkan)} proposal dipindahkan.`);
    // pemicu (tombol baris atau bilah) bisa hilang sesudah data segar: fokus ke ringkasan tabel
    requestAnimationFrame(() => ringkasan.current?.focus());
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
      <p ref={ringkasan} tabIndex={-1} className="mb-2 text-sm text-teks-redup outline-none" data-testid="ringkasan-usulan">
        Menampilkan <span className="angka">{angka.format(mulai)}</span>–<span className="angka">{angka.format(mulai + baris.length - 1)}</span> dari{" "}
        <strong className="angka text-primer-900">{angka.format(total)}</strong> {mode === "usulan" ? "usulan menunggu penetapan" : "penugasan ditetapkan"}.
      </p>

      {bisaPilih ? (
        <div role="region" aria-label="Pilihan baris" className="sticky top-0 z-20 mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-primer-200 bg-latar px-3 py-2">
          <span className="inline-flex items-center gap-2">
            <Checkbox id="centang-halaman" ref={centangHalaman} checked={kepala} onCheckedChange={(c) => ubahHalaman(c === true)} />
            <label htmlFor="centang-halaman" className="cursor-pointer text-sm text-primer-900">
              Pilih semua di halaman ini
            </label>
          </span>
          <p role="status" className="text-sm font-semibold text-primer-900">
            {jumlahDipilih ? `${angka.format(jumlahDipilih)} dipilih${semuaFilter ? " (semua hasil filter)" : ""}` : "Belum ada yang dipilih"}
          </p>
          {total > idHalaman.length && (semuaFilter || terpilihDiHalaman === idHalaman.length) ? (
            <button type="button" onClick={() => setSemuaFilter((v) => !v)} className="cursor-pointer text-sm font-semibold text-primer-800 underline underline-offset-2">
              {semuaFilter ? "Hanya pilih halaman ini" : `Pilih semua ${angka.format(total)} hasil filter`}
            </button>
          ) : null}
          <span className="ml-auto flex gap-2">
            <Button ukuran="sm" varian="hantu" onClick={batalPilih} disabled={!jumlahDipilih}>
              Batal pilih
            </Button>
            <Button ukuran="sm" varian="sekunder" disabled={!jumlahDipilih} onClick={() => bukaModal({ pilihan: semuaFilter ? { filter } : { ids: [...dipilih] }, jumlah: jumlahDipilih })}>
              Pindahkan {jumlahDipilih ? `${angka.format(jumlahDipilih)} ` : ""}proposal
            </Button>
          </span>
        </div>
      ) : null}

      <Table aria-label={mode === "usulan" ? "Usulan Penugasan" : "Penugasan yang sudah ditetapkan"}>
        <THead>
          <TR>
            {bisaPilih ? (
              <TH className="w-10">
                <span className="sr-only">Pilih</span>
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
              <TR key={u.penugasanId} className={bisaPilih && pilih ? "bg-primer-50 shadow-[inset_3px_0_0_var(--color-primer-400)]" : undefined}>
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
                        bukaModal({
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

      <ModalPindah key={nomorModal} target={target} saatTutup={() => setTarget(null)} saatSelesai={selesai} periodeId={periodeId} kandidat={kandidat} batas={batas} />
    </>
  );
}
