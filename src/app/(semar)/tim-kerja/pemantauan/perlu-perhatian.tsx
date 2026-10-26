"use client";

import Link from "next/link";
import { AlertTriangle, CircleCheck, Flag } from "lucide-react";
import { ArahKoreksi, BatangPersen } from "@/components/grafik/batang";
import { Button, KotakCentang } from "@/components/ui";
import type { AmbangPemantauan } from "@/lib/pemantauan/ambang";
import { STATUS_DITANDAI, formatPersen, type ItemPerhatian } from "@/lib/pemantauan/rekap";
import { formatAngka } from "@/lib/utils";
import { TautanRincian } from "./navigasi";
import { useTandai } from "./tandai";

const tautan = "font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2";

/**
 * Daftar "Perlu perhatian" J-05 (triase): butir yang menyala, paling jauh dari ambang lebih dulu; di bawahnya butir yang sudah
 * berlabel Perlu ditinjau. Centang "Perlu Diperbaiki" lalu "Tandai Butir" (bilah lengket di dasar daftar) membuka M-09 (UC-04 s.6-7);
 * "Rincian" membuka M-08 (S-1).
 */
export function PerluPerhatian({
  item,
  ambang,
  keadaan,
  pengelola,
  tautanAturan,
}: {
  item: ItemPerhatian[];
  ambang: AmbangPemantauan;
  /** keadaan data untuk pesan kosong */
  keadaan: { hasilDinilai: number; hasilTerbanyakPerButir: number };
  pengelola: boolean;
  /** awal alamat J-03 (skema dan periode terpilih) */
  tautanAturan: string;
}) {
  const { dipilih, alih, mintaTandai, galatPilih, bolehDitandai } = useTandai();
  const menyala = item.filter((i) => i.baris.status !== STATUS_DITANDAI);
  const ditandai = item.filter((i) => i.baris.status === STATUS_DITANDAI);
  const bisaDitandai = menyala.some((i) => bolehDitandai(i.baris.kode));
  const jumlahDipilih = menyala.filter((i) => dipilih.has(i.baris.kode) && bolehDitandai(i.baris.kode)).length;

  return (
    <section aria-labelledby="judul-perhatian" className="mt-8">
      <h2 id="judul-perhatian" className="mb-3 text-lg font-semibold text-primer-900">
        Perlu perhatian <span className="angka text-base font-normal text-teks-redup">({formatAngka(menyala.length)})</span>
      </h2>

      {menyala.length === 0 ? (
        <PesanKosong ambang={ambang} keadaan={keadaan} />
      ) : (
        <ul className="divide-y divide-primer-100 border-y border-primer-100">
          {menyala.map((i) => (
            <BarisPerhatian key={`${i.jenis}:${i.baris.kode}`} item={i} ambang={ambang}>
              {bolehDitandai(i.baris.kode) ? (
                <KotakCentang
                  id={`perbaiki-${i.baris.kode}`}
                  label="Perlu Diperbaiki"
                  aria-describedby={`butir-perhatian-${i.baris.kode}`}
                  checked={dipilih.has(i.baris.kode)}
                  onCheckedChange={(v) => alih(i.baris.kode, v === true)}
                  className="flex items-center pointer-coarse:min-h-11"
                />
              ) : (
                <span className="text-xs text-teks-redup">Tidak dapat ditandai (status {i.baris.status ?? "tidak dikenal"})</span>
              )}
            </BarisPerhatian>
          ))}
        </ul>
      )}

      {bisaDitandai ? (
        <div className="sticky bottom-0 z-20 -mx-1 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-primer-200 bg-white px-1 py-3">
          <Button onClick={() => mintaTandai()}>Tandai Butir{jumlahDipilih ? ` (${jumlahDipilih})` : ""}</Button>
          <p aria-live="polite" className="text-sm">
            {galatPilih ? (
              <span role="alert" className="font-medium text-bata-600">
                {galatPilih}
              </span>
            ) : (
              <span className="text-teks-redup">{jumlahDipilih ? `${jumlahDipilih} butir dipilih.` : "Centang “Perlu Diperbaiki” pada butir yang aturannya perlu ditinjau."}</span>
            )}
          </p>
        </div>
      ) : null}

      {ditandai.length ? (
        <section aria-labelledby="judul-ditandai" className="mt-6">
          <h3 id="judul-ditandai" className="mb-2 text-sm font-semibold text-primer-900">
            Sudah ditandai <span className="angka font-normal text-teks-redup">({formatAngka(ditandai.length)})</span>
          </h3>
          <ul className="divide-y divide-primer-100 border-y border-primer-100">
            {ditandai.map((i) => (
              <BarisPerhatian
                key={`${i.jenis}:${i.baris.kode}`}
                item={i}
                ambang={ambang}
                aksi={
                  pengelola ? (
                    <Link href={`${tautanAturan}&butir=${encodeURIComponent(i.baris.kode)}`} className={tautan}>
                      Buka di Aturan Pemeriksaan
                    </Link>
                  ) : null
                }
              >
                <span className="inline-flex items-center gap-1.5 text-sm text-peringatan-700">
                  <Flag aria-hidden className="size-4" />
                  {STATUS_DITANDAI}
                </span>
              </BarisPerhatian>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function BarisPerhatian({ item: i, ambang, children, aksi }: { item: ItemPerhatian; ambang: AmbangPemantauan; children: React.ReactNode; aksi?: React.ReactNode }) {
  const b = i.baris;
  return (
    <li className="grid gap-x-4 gap-y-2 py-4 sm:grid-cols-[10rem_1fr_auto]">
      <div className="pt-0.5">{children}</div>
      <div className="min-w-0">
        <p id={`butir-perhatian-${b.kode}`}>
          <span className="flex flex-wrap items-center gap-2 text-xs text-teks-redup">
            <span className="font-mono font-semibold text-primer-800">{b.kode}</span>
            <span>{i.jenis === "semantik" ? "Semantik" : "Deterministik"}</span>
          </span>
          <span className="mt-0.5 block font-semibold text-primer-900">{b.deskripsi}</span>
        </p>
        {i.jenis === "semantik" ? (
          <>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <BatangPersen persen={i.baris.persen} ambang={ambang.disetujui} />
              <span className="angka font-semibold text-primer-900">{formatPersen(i.baris.persen)} disetujui</span>
              {i.baris.perhatian ? (
                <span className="inline-flex items-center gap-1 text-peringatan-700">
                  <AlertTriangle aria-hidden className="size-3.5" />
                  di bawah ambang {ambang.disetujui}%
                </span>
              ) : null}
              <span className="angka text-teks-redup">{formatAngka(i.baris.jumlah)} hasil</span>
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <ArahKoreksi longgar={i.baris.longgar} ketat={i.baris.ketat} ringkas />
              {i.baris.jenis[0] ? (
                <span className="text-xs text-primer-900">
                  jenis kekeliruan terbanyak: {i.baris.jenis[0].jenis} <span className="angka">{formatPersen(i.baris.jenis[0].persen)}</span>
                </span>
              ) : null}
              {i.baris.terlaluYakin ? <span className="text-xs font-semibold text-peringatan-700">keyakinan tinggi tetap sering dikoreksi</span> : null}
            </p>
          </>
        ) : (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="angka font-semibold text-primer-900">
              gagal pada {formatPersen(i.baris.persen)} pengajuan ({formatAngka(i.baris.proposalGagal)} proposal)
            </span>
            {i.baris.tertinggi ? (
              <span className={i.baris.sebab === "terpusat" ? "inline-flex items-center gap-1 text-peringatan-700" : "text-teks-redup"}>
                {i.baris.sebab === "terpusat" ? <AlertTriangle aria-hidden className="size-3.5" /> : null}
                tertinggi di {i.baris.tertinggi.institusi}{" "}
                <span className="angka">
                  {formatPersen(i.baris.tertinggi.persen)} ({formatAngka(i.baris.tertinggi.gagal)} dari {formatAngka(i.baris.tertinggi.pengajuan)} proposal)
                </span>
              </span>
            ) : null}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2 text-sm sm:flex-col sm:items-end">
        <TautanRincian kode={b.kode} className={`${tautan} pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center`} labelAria={`Rincian butir ${b.kode}`}>
          Rincian
        </TautanRincian>
        {aksi}
      </div>
    </li>
  );
}

function PesanKosong({ ambang, keadaan }: { ambang: AmbangPemantauan; keadaan: { hasilDinilai: number; hasilTerbanyakPerButir: number } }) {
  if (keadaan.hasilDinilai === 0) {
    return <p className="text-sm text-teks-redup">Belum ada penilaian final. Daftar ini terisi sesudah reviewer mengirim penilaian; gagal saat pengajuan sudah dapat dibaca di tab Gagal Deterministik.</p>;
  }
  if (keadaan.hasilTerbanyakPerButir < ambang.minHasil) {
    return (
      <p className="text-sm text-teks-redup">
        Belum ada butir semantik yang dapat dinilai: setiap butir baru punya paling banyak <span className="angka">{formatAngka(keadaan.hasilTerbanyakPerButir)}</span> hasil, sedangkan
        penilaian butir dimulai pada <span className="angka">{ambang.minHasil}</span> hasil.
      </p>
    );
  }
  return (
    <p className="flex items-start gap-2 text-sm text-primer-900">
      <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-daun-600" />
      <span>
        Tidak ada butir di bawah ambang. Semua butir semantik dengan cukup data disetujui sekurangnya {ambang.disetujui}%, dan tidak ada butir deterministik yang gagal pada{" "}
        {ambang.gagal}% pengajuan atau lebih.
      </span>
    </p>
  );
}
