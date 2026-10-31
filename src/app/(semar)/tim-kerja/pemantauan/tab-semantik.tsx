"use client";

import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { ArahKoreksi, BatangPersen } from "@/components/grafik/batang";
import { Pilihan, StatusBadge, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { bacaUrut, URUT_BAWAAN, type KolomUrut } from "@/lib/pemantauan/alamat";
import type { AmbangPemantauan } from "@/lib/pemantauan/ambang";
import { formatPersen, type BarisSemantik } from "@/lib/pemantauan/rekap";
import { cn, formatAngka } from "@/lib/utils";
import { TautanRincian, useUbahUrl } from "./navigasi";

const tautanButir = "text-left text-primer-800 underline decoration-dashed decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2";

const PILIHAN_URUT: { nilai: string; label: string }[] = [
  { nilai: "disetujui", label: "Disetujui, terendah dulu" },
  { nilai: "-disetujui", label: "Disetujui, tertinggi dulu" },
  { nilai: "-hasil", label: "Hasil, terbanyak dulu" },
  { nilai: "-longgar", label: "Terlalu longgar, terbanyak dulu" },
  { nilai: "butir", label: "Urutan aturan" },
];

function urutkan(baris: BarisSemantik[], kolom: KolomUrut, turun: boolean): BarisSemantik[] {
  const nilai = (b: BarisSemantik): number | string =>
    kolom === "butir" ? b.kode : kolom === "hasil" ? b.jumlah : kolom === "longgar" ? (b.dikoreksi ? b.longgar / b.dikoreksi : -1) : b.cukup ? b.persen : 1000 + b.persen;
  return [...baris].sort((a, b) => {
    const x = nilai(a);
    const y = nilai(b);
    const beda = typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number);
    return (turun ? -beda : beda) || a.kode.localeCompare(b.kode);
  });
}

function KepalaUrut({ kolom, label, angka, urut, pasang }: { kolom: KolomUrut; label: string; angka?: boolean; urut: { kolom: KolomUrut; turun: boolean }; pasang: (u: string) => void }) {
  const aktif = urut.kolom === kolom;
  const Ikon = !aktif ? ArrowUpDown : urut.turun ? ArrowDown : ArrowUp;
  return (
    <TH angka={angka} aria-sort={aktif ? (urut.turun ? "descending" : "ascending") : "none"}>
      <button
        type="button"
        onClick={() => pasang(aktif && !urut.turun ? `-${kolom}` : kolom)}
        className={cn("-my-2 inline-flex cursor-pointer items-center gap-1 py-2 hover:text-primer-900 max-md:invisible", angka && "flex-row-reverse")}
      >
        {label}
        <Ikon aria-hidden className={cn("size-3.5", !aktif && "opacity-50")} />
      </button>
    </TH>
  );
}

/**
 * Tab Butir Semantik J-05: tabel yang dapat diurutkan (urutan di URL `?urut=`, diganti tanpa memuat ulang laporan). Di bawah 48 rem
 * baris tabel bertumpuk dan kepala kolom tersembunyi, jadi urutan dipilih lewat "Urutkan menurut".
 */
export function TabSemantik({ baris, ambang, adaBanding }: { baris: BarisSemantik[]; ambang: AmbangPemantauan; adaBanding: boolean }) {
  const { ganti, cari } = useUbahUrl();
  const urut = bacaUrut(cari.get("urut") ?? undefined);
  const nilaiUrut = `${urut.turun ? "-" : ""}${urut.kolom}`;
  const pasang = (u: string) => ganti({ urut: u === URUT_BAWAAN ? null : u });
  if (!baris.length) return <p className="text-sm text-teks-redup">Belum ada penilaian final untuk periode dan skema ini.</p>;

  return (
    <>
      <Pilihan label="Urutkan menurut" value={PILIHAN_URUT.some((p) => p.nilai === nilaiUrut) ? nilaiUrut : URUT_BAWAAN} onChange={(e) => pasang(e.target.value)} className="mb-3 w-full max-w-xs md:hidden">
        {PILIHAN_URUT.map((p) => (
          <option key={p.nilai} value={p.nilai}>
            {p.label}
          </option>
        ))}
      </Pilihan>
      <Table aria-label="Butir semantik">
        <THead>
          <TR>
            <KepalaUrut kolom="butir" label="Butir" urut={urut} pasang={pasang} />
            <KepalaUrut kolom="disetujui" label="Disetujui" urut={urut} pasang={pasang} />
            <KepalaUrut kolom="hasil" label="Hasil" angka urut={urut} pasang={pasang} />
            <KepalaUrut kolom="longgar" label="Arah koreksi" urut={urut} pasang={pasang} />
            <TH>Jenis kekeliruan terbanyak</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {urutkan(baris, urut.kolom, urut.turun).map((b) => (
            <TR key={b.kode}>
              <TD className="min-w-56 max-w-sm">
                <p>
                  <TautanRincian kode={b.kode} className={tautanButir} labelAria={`${b.deskripsi} (buka rincian butir)`}>
                    {b.deskripsi}
                  </TautanRincian>
                </p>
              </TD>
              <TD>
                {b.cukup ? (
                  <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                    <BatangPersen persen={b.persen} ambang={ambang.disetujui} className="w-20" />
                    <span className={cn("angka font-semibold", b.perhatian ? "text-peringatan-700" : "text-primer-900")}>{formatPersen(b.persen)}</span>
                    {b.perhatian ? (
                      <span className="inline-flex items-center gap-1 text-xs text-peringatan-700">
                        <AlertTriangle aria-hidden className="size-3.5" />
                        di bawah {ambang.disetujui}%
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-teks-redup">
                    <span className="angka">{formatPersen(b.persen)}</span> · belum cukup data
                  </span>
                )}
              </TD>
              <TD angka>{formatAngka(b.jumlah)}</TD>
              <TD>
                <ArahKoreksi longgar={b.longgar} ketat={b.ketat} ringkas />
              </TD>
              <TD className="text-xs">{b.jenis[0] ? `${b.jenis[0].jenis} (${formatPersen(b.jenis[0].persen)})` : "-"}</TD>
              <TD>{b.status ? <StatusBadge status={b.status} /> : null}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <p className="mt-2 text-xs text-teks-redup">
        Rekomendasi yang tidak dikoreksi reviewer dihitung disetujui. Persentase dinilai mulai {ambang.minHasil} hasil.
        {adaBanding ? " Hasil sebuah butir dihitung sejak deskripsinya terakhir diubah; angka sebelumnya ada di tab Tren dan Kalibrasi." : ""}
      </p>
    </>
  );
}
