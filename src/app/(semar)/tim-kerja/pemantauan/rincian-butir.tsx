"use client";

import { useState } from "react";
import Link from "next/link";
import { ArahKoreksi, BatangMendatar } from "@/components/grafik/batang";
import { GarisHarian } from "@/components/grafik/garis-harian";
import { Badge, Button, Sheet, StatusBadge } from "@/components/ui";
import type { AmbangPemantauan } from "@/lib/pemantauan/ambang";
import {
  STATUS_DITANDAI,
  formatPersen,
  type BandingVersi,
  type BarisDeterministik,
  type BarisKalibrasi,
  type BarisSemantik,
  type ContohGagal,
  type ContohRincian,
  type TitikTren,
} from "@/lib/pemantauan/rekap";
import { formatAngka } from "@/lib/utils";
import { useUbahUrl } from "./navigasi";
import { useTandai } from "./tandai";

const tautan = "font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2";
const LABEL_TINGKAT = { tinggi: "Keyakinan tinggi", sedang: "Keyakinan sedang", rendah: "Keyakinan rendah" } as const;
type Saring = "semua" | "dikoreksi" | "disetujui";

export interface DataRincian {
  semantik: BarisSemantik[];
  deterministik: BarisDeterministik[];
  rincian: Record<string, ContohRincian[]>;
  rincianGagal: Record<string, ContohGagal[]>;
  trenButir: Record<string, TitikTren[]>;
  kalibrasiButir: Record<string, BarisKalibrasi[]>;
  bandingVersi: BandingVersi[];
  penandaVersi: { versi: number; hari: number }[];
  /** lama masa penilaian (lebar sumbu tren harian) */
  jumlahHari: number;
}

function Subjudul({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-6 text-sm font-semibold text-primer-900 first:mt-0">{children}</h3>;
}

/**
 * M-08 Rincian Butir (S-1 UC-04): sheet samping yang dibuka dari nama butir atau "Rincian"; butir terpilih ada di URL (`?butir=`,
 * dibuka dengan replace sehingga satu Back keluar dari J-05). Isi menurut jenis butir; kaki: "Tandai butir ini" (bila Aktif) dan Tutup.
 */
export function RincianButir({ data, ambang }: { data: DataRincian; ambang: AmbangPemantauan }) {
  const { ganti, cari } = useUbahUrl();
  const { mintaTandai, bolehDitandai } = useTandai();
  const kode = cari.get("butir");
  const sem = data.semantik.find((b) => b.kode === kode);
  const det = sem ? undefined : data.deterministik.find((b) => b.kode === kode);
  const baris = sem ?? det;

  const tutup = () => ganti({ butir: null });

  return (
    <Sheet
      buka={!!baris}
      saatUbah={(b) => !b && tutup()}
      kode="M-08"
      judul="Rincian Butir"
      deskripsi={baris?.deskripsi ?? ""}
      kaki={
        <div className="flex flex-wrap justify-end gap-2">
          {baris && bolehDitandai(baris.kode) ? (
            <Button varian="sekunder" onClick={() => mintaTandai(baris.kode)}>
              Tandai butir ini
            </Button>
          ) : null}
          <Button varian="sekunder" onClick={tutup}>
            Tutup
          </Button>
        </div>
      }
    >
      {sem ? <IsiSemantik key={sem.kode} baris={sem} data={data} ambang={ambang} /> : det ? <IsiDeterministik baris={det} contoh={data.rincianGagal[det.kode] ?? []} ambang={ambang} /> : null}
    </Sheet>
  );
}

function IsiSemantik({ baris, data, ambang }: { baris: BarisSemantik; data: DataRincian; ambang: AmbangPemantauan }) {
  const [saring, setSaring] = useState<Saring>("semua");
  const contoh = data.rincian[baris.kode] ?? [];
  const cocok = contoh.filter((c) => saring === "semua" || (saring === "dikoreksi") === c.dikoreksi);
  const tampil = cocok.slice(0, 10);
  const jumlahSaring = { semua: contoh.length, dikoreksi: contoh.filter((c) => c.dikoreksi).length, disetujui: contoh.filter((c) => !c.dikoreksi).length };
  const kalibrasi = data.kalibrasiButir[baris.kode] ?? [];
  const banding = data.bandingVersi.find((b) => b.kode === baris.kode);
  const tren = data.trenButir[baris.kode] ?? [];

  return (
    <div className="text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 [&>dt]:whitespace-nowrap">
        <dt className="text-teks-redup">Disetujui</dt>
        <dd>
          <span className="angka font-semibold text-primer-900">{formatPersen(baris.persen)}</span>{" "}
          <span className="angka text-teks-redup">
            ({formatAngka(baris.jumlah - baris.dikoreksi)} dari {formatAngka(baris.jumlah)} hasil{baris.versi.length ? `, basis v${baris.versi.join("–v")}` : ""})
          </span>
          {!baris.cukup ? <span className="ml-1 text-teks-redup">belum cukup data</span> : baris.perhatian ? <span className="ml-1 font-semibold text-peringatan-700">di bawah ambang {ambang.disetujui}%</span> : null}
        </dd>
        <dt className="text-teks-redup">Status butir</dt>
        <dd>{baris.status ? <StatusBadge status={baris.status} /> : "-"}</dd>
        <dt className="text-teks-redup">Arah koreksi</dt>
        <dd>
          <ArahKoreksi longgar={baris.longgar} ketat={baris.ketat} />
        </dd>
      </dl>

      {baris.jenis.length ? (
        <>
          <Subjudul>Jenis kekeliruan ({formatAngka(baris.dikoreksi)} koreksi)</Subjudul>
          <ul className="space-y-3">
            {baris.jenis.map((j) => {
              const alasan = [...new Set(contoh.filter((c) => c.dikoreksi && (c.jenis || "Tanpa jenis") === j.jenis).map((c) => c.alasanKoreksi).filter(Boolean))].slice(0, 3);
              return (
                <li key={j.jenis}>
                  <BatangMendatar baris={[{ kunci: j.jenis, label: j.jenis, nilai: j.persen, teks: `${formatPersen(j.persen)} (${formatAngka(j.jumlah)})` }]} maks={100} lebarLabel="11rem" />
                  {alasan.length ? (
                    <ul className="mt-1 space-y-0.5 border-l-2 border-primer-100 pl-3 text-xs text-teks-redup">
                      {alasan.map((a) => (
                        <li key={a}>&ldquo;{a}&rdquo;</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {banding ? (
        <>
          <Subjudul>Sebelum dan sesudah butir diubah</Subjudul>
          <p className="text-primer-900">
            <span className="angka">
              v{banding.lama.versi}: {formatPersen(banding.lama.persen)} ({formatAngka(banding.lama.jumlah)} hasil)
            </span>{" "}
            →{" "}
            <span className="angka font-semibold">
              v{banding.baru.versi}: {formatPersen(banding.baru.persen)} ({formatAngka(banding.baru.jumlah)} hasil)
            </span>
          </p>
          <p className="mt-1 text-xs text-teks-redup">Deskripsi lama: {banding.lama.deskripsi}</p>
        </>
      ) : null}

      {tren.length > 1 ? (
        <>
          <Subjudul>Tren harian</Subjudul>
          <GarisHarian
            judul="% disetujui per hari"
            titik={tren}
            ambang={ambang.disetujui}
            penanda={data.penandaVersi.map((p) => ({ hari: p.hari, label: `v${p.versi} berlaku` }))}
            jumlahHari={data.jumlahHari}
            ringkasan={`Hari ${tren[0].hari}: ${formatPersen(tren[0].persen)}; hari ${tren.at(-1)!.hari}: ${formatPersen(tren.at(-1)!.persen)}.`}
          />
        </>
      ) : null}

      {kalibrasi.length ? (
        <>
          <Subjudul>Dikoreksi menurut tingkat keyakinan sistem</Subjudul>
          <BatangMendatar
            baris={kalibrasi.map((k) => ({ kunci: k.tingkat, label: LABEL_TINGKAT[k.tingkat], nilai: k.persenDikoreksi, teks: `${formatPersen(k.persenDikoreksi)} dikoreksi (${formatAngka(k.jumlah)} hasil)` }))}
            maks={Math.max(...kalibrasi.map((k) => k.persenDikoreksi), 10)}
            lebarLabel="8rem"
          />
          {baris.terlaluYakin ? <p className="mt-1 text-xs font-semibold text-peringatan-700">Keyakinan tinggi tetap sering dikoreksi pada butir ini.</p> : null}
        </>
      ) : null}

      <Subjudul>Contoh proposal</Subjudul>
      <fieldset className="mb-3">
        <legend className="sr-only">Saring contoh proposal</legend>
        <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-primer-300">
          {(["semua", "dikoreksi", "disetujui"] as const).map((x) => (
            <label key={x} className="relative">
              <input type="radio" name={`saring-${baris.kode}`} value={x} checked={saring === x} onChange={() => setSaring(x)} className="peer sr-only" />
              <span className="inline-flex min-h-9 cursor-pointer items-center border-r border-primer-200 px-3 text-xs font-semibold text-primer-800 transition-colors hover:bg-primer-50 peer-checked:bg-primer-700 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-primer-400 pointer-coarse:min-h-11">
                {x === "semua" ? "Semua" : x === "dikoreksi" ? "Dikoreksi" : "Disetujui"} <span className="angka ml-1 font-normal">({jumlahSaring[x]})</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {cocok.length > tampil.length ? (
        <p className="mb-2 text-xs text-teks-redup">
          Menampilkan {tampil.length} dari {cocok.length} contoh terbaru.
        </p>
      ) : null}
      {tampil.length === 0 ? (
        <p className="text-teks-redup">Tidak ada contoh untuk saringan ini.</p>
      ) : (
        <ul className="space-y-4">
          {tampil.map((c, i) => (
            <li key={`${c.proposalId}-${i}`} className="border-b border-primer-100 pb-4 last:border-0">
              <Link href={`/tim-kerja/proposal/${c.proposalId}?butir=${encodeURIComponent(baris.kode)}`} className={tautan}>
                {c.judulProposal}
              </Link>
              <p className="angka text-xs text-teks-redup">
                {c.idProposal} · basis v{c.versi}
              </p>
              <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[9rem_1fr]">
                <dt className="text-teks-redup">Rekomendasi sistem</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={c.rekomendasi ?? c.statusSistem} />
                  {c.keyakinan !== null ? <span className="angka text-xs text-teks-redup">keyakinan {String(c.keyakinan).replace(".", ",")}</span> : null}
                  {c.tiruan ? <Badge>tiruan</Badge> : null}
                </dd>
                {c.kutipan ? (
                  <>
                    <dt className="text-teks-redup">Kutipan</dt>
                    <dd className="line-clamp-3">
                      <q>{c.kutipan}</q>
                    </dd>
                  </>
                ) : null}
                <dt className="text-teks-redup">Keputusan reviewer</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={c.keputusanReviewer} /> {c.dikoreksi ? <StatusBadge status="Dikoreksi reviewer" /> : null}
                </dd>
                {c.dikoreksi ? (
                  <>
                    <dt className="text-teks-redup">Alasan koreksi</dt>
                    <dd>
                      {c.jenis ? <span className="font-semibold">{c.jenis}: </span> : null}
                      {c.alasanKoreksi}
                    </dd>
                  </>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IsiDeterministik({ baris, contoh, ambang }: { baris: BarisDeterministik; contoh: ContohGagal[]; ambang: AmbangPemantauan }) {
  const berpengajuan = baris.perInstitusi.filter((i) => i.pengajuan > 0);
  return (
    <div className="text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 [&>dt]:whitespace-nowrap">
        <dt className="text-teks-redup">Gagal saat pengajuan</dt>
        <dd>
          <span className="angka font-semibold text-primer-900">{formatPersen(baris.persen)}</span>{" "}
          <span className="angka text-teks-redup">({formatAngka(baris.proposalGagal)} proposal)</span>
          {baris.sebab ? <span className="ml-1 font-semibold text-peringatan-700">{baris.sebab === "keseluruhan" ? `sekurangnya ${ambang.gagal}% pengajuan` : `terpusat di satu institusi`}</span> : null}
        </dd>
        <dt className="text-teks-redup">Status butir</dt>
        <dd>{baris.status ? <StatusBadge status={baris.status} /> : "-"}</dd>
      </dl>
      <p className="mt-2 text-xs text-teks-redup">Dihitung per proposal: proposal yang pernah Ditahan karena butir ini, walau sesudah diperbaiki lolos.</p>

      <Subjudul>Per institusi pengusul</Subjudul>
      <BatangMendatar
        baris={berpengajuan.map((i) => ({
          kunci: i.institusi,
          label: i.institusi,
          nilai: i.persen,
          teks: `${formatPersen(i.persen)} (${formatAngka(i.gagal)} dari ${formatAngka(i.pengajuan)})`,
          catatan: i.pengajuan >= ambang.minPengajuanInstitusi && i.persen >= ambang.gagalInstitusi ? `≥ ${ambang.gagalInstitusi}%` : undefined,
        }))}
        maks={Math.max(...berpengajuan.map((i) => i.persen), 10)}
        lebarLabel="13rem"
      />

      <Subjudul>Contoh proposal yang gagal</Subjudul>
      {contoh.length === 0 ? (
        <p className="text-teks-redup">Belum ada proposal yang gagal pada butir ini.</p>
      ) : (
        <ul className="space-y-3">
          {contoh.map((c) => (
            <li key={c.proposalId} className="border-b border-primer-100 pb-3 last:border-0">
              <Link href={`/tim-kerja/proposal/${c.proposalId}`} className={tautan}>
                {c.judulProposal}
              </Link>
              <p className="angka text-xs text-teks-redup">
                {c.idProposal} · {c.institusi}
              </p>
              {c.angka ? (
                <p className="mt-1 text-xs">
                  <StatusBadge status="Gagal" /> <span className="angka">{c.angka}</span>
                  {c.batas ? <span className="text-teks-redup"> (batas: {c.batas})</span> : null}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {baris.status === STATUS_DITANDAI ? <p className="mt-4 text-xs text-peringatan-700">Butir ini sudah berlabel Perlu ditinjau.</p> : null}
    </div>
  );
}
