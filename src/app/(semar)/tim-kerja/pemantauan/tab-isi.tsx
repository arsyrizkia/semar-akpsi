import { AlertTriangle } from "lucide-react";
import { BatangMendatar, BatangPersen, Dumbbell } from "@/components/grafik/batang";
import { GarisHarian } from "@/components/grafik/garis-harian";
import { StatusBadge, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import type { AmbangPemantauan } from "@/lib/pemantauan/ambang";
import { formatPersen, type BandingVersi, type BarisDeterministik, type BarisKalibrasi, type TafsirKalibrasi, type TitikTren } from "@/lib/pemantauan/rekap";
import { cn, formatAngka } from "@/lib/utils";
import { TautanRincian } from "./navigasi";

const tautanButir = "text-left text-primer-800 underline decoration-dashed decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2";
const LABEL_TINGKAT = { tinggi: "Keyakinan tinggi", sedang: "Keyakinan sedang", rendah: "Keyakinan rendah" } as const;

/* ------------------------------ Gagal Deterministik ------------------------------ */

export function TabDeterministik({ baris, ambang, pengajuan }: { baris: BarisDeterministik[]; ambang: AmbangPemantauan; pengajuan: number }) {
  const pernah = baris.filter((b) => b.proposalGagal > 0);
  const tidakPernah = baris.filter((b) => b.proposalGagal === 0);
  if (!pernah.length) {
    return <p className="text-sm text-teks-redup">Tidak ada butir deterministik yang gagal pada pengajuan di periode dan skema ini.</p>;
  }
  return (
    <>
      <Table aria-label="Gagal deterministik saat pengajuan">
        <THead>
          <TR>
            <TH>Butir</TH>
            <TH>Proposal gagal</TH>
            <TH>Institusi tertinggi</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {pernah.map((b) => (
            <TR key={b.kode}>
              <TD className="min-w-56 max-w-sm">
                <span className="font-mono text-xs font-semibold text-primer-800">{b.kode}</span>
                <p>
                  <TautanRincian kode={b.kode} className={tautanButir} labelAria={`${b.deskripsi} (rincian butir ${b.kode})`}>
                    {b.deskripsi}
                  </TautanRincian>
                </p>
              </TD>
              <TD>
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                  <BatangPersen persen={b.persen} ambang={ambang.gagal} className="w-20" />
                  <span className={cn("angka font-semibold", b.sebab === "keseluruhan" ? "text-peringatan-700" : "text-primer-900")}>{formatPersen(b.persen)}</span>
                  <span className="angka text-xs text-teks-redup">({formatAngka(b.proposalGagal)} dari {formatAngka(pengajuan)} proposal)</span>
                  {b.sebab === "keseluruhan" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-peringatan-700">
                      <AlertTriangle aria-hidden className="size-3.5" />
                      sekurangnya {ambang.gagal}%
                    </span>
                  ) : null}
                </span>
              </TD>
              <TD className="text-sm">
                {b.tertinggi ? (
                  <>
                    {b.tertinggi.institusi}{" "}
                    <span className={cn("angka", b.sebab === "terpusat" ? "font-semibold text-peringatan-700" : "text-teks-redup")}>
                      {formatPersen(b.tertinggi.persen)} ({formatAngka(b.tertinggi.gagal)} dari {formatAngka(b.tertinggi.pengajuan)})
                    </span>
                    {b.tertinggi.persen >= ambang.gagalInstitusi ? (
                      <span className="ml-1 inline-flex items-center gap-1 text-xs text-peringatan-700">
                        <AlertTriangle aria-hidden className="size-3.5" />
                        sekurangnya {ambang.gagalInstitusi}%
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-teks-redup">-</span>
                )}
              </TD>
              <TD>{b.status ? <StatusBadge status={b.status} /> : null}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <p className="mt-2 text-xs text-teks-redup">
        Dihitung per proposal yang pernah Ditahan karena butir itu. Institusi tertinggi hanya di antara institusi dengan sekurangnya {ambang.minPengajuanInstitusi} pengajuan; sebaran ke
        semua institusi ada di Rincian.
      </p>
      {tidakPernah.length ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-primer-800">{formatAngka(tidakPernah.length)} butir tidak pernah gagal</summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {tidakPernah.map((b) => (
              <li key={b.kode} className="text-xs">
                <span className="font-mono font-semibold text-primer-800">{b.kode}</span> {b.deskripsi}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

/* ------------------------------ Tren dan Kalibrasi ------------------------------ */

export function TabTren({
  tren,
  kalibrasi,
  tafsir,
  banding,
  penanda,
  ambang,
  jumlahHari,
}: {
  jumlahHari: number;
  tren: TitikTren[];
  kalibrasi: BarisKalibrasi[];
  tafsir: TafsirKalibrasi;
  banding: BandingVersi[];
  penanda: { versi: number; hari: number }[];
  ambang: AmbangPemantauan;
}) {
  if (!tren.length) return <p className="text-sm text-teks-redup">Belum ada penilaian final untuk periode dan skema ini.</p>;
  const awal = tren[0];
  const akhir = tren.at(-1)!;
  return (
    <div className="space-y-10">
      <section aria-labelledby="judul-tren">
        <h3 id="judul-tren" className="mb-3 text-sm font-semibold text-primer-900">
          Rekomendasi disetujui per hari masa penilaian
        </h3>
        <GarisHarian
          judul="% rekomendasi semantik yang disetujui reviewer, semua butir"
          titik={tren}
          ambang={ambang.disetujui}
          penanda={penanda.map((p) => ({ hari: p.hari, label: `v${p.versi} berlaku` }))}
          jumlahHari={jumlahHari}
          ringkasan={
            tren.length > 1
              ? `Hari ${awal.hari}: ${formatPersen(awal.persen)} dari ${formatAngka(awal.jumlah)} hasil; hari ${akhir.hari}: ${formatPersen(akhir.persen)} dari ${formatAngka(akhir.jumlah)} hasil.`
              : `Baru satu hari penilaian: ${formatPersen(awal.persen)} dari ${formatAngka(awal.jumlah)} hasil.`
          }
        />
      </section>

      <section aria-labelledby="judul-kalibrasi">
        <h3 id="judul-kalibrasi" className="mb-1 text-sm font-semibold text-primer-900">
          Dikoreksi menurut tingkat keyakinan sistem
        </h3>
        <p className="mb-3 text-xs text-teks-redup">Tinggi ≥ 0,8; sedang 0,5 sampai &lt; 0,8; rendah &lt; 0,5.</p>
        {kalibrasi.length ? (
          <BatangMendatar
            baris={kalibrasi.map((k) => ({ kunci: k.tingkat, label: LABEL_TINGKAT[k.tingkat], nilai: k.persenDikoreksi, teks: `${formatPersen(k.persenDikoreksi)} dikoreksi (${formatAngka(k.dikoreksi)} dari ${formatAngka(k.jumlah)})` }))}
            maks={Math.max(...kalibrasi.map((k) => k.persenDikoreksi), 10)}
            lebarLabel="8rem"
          />
        ) : null}
        <p className={cn("mt-3 max-w-2xl text-sm", tafsir.bermakna === false ? "font-semibold text-peringatan-700" : "text-primer-900")}>{tafsir.kalimat}</p>
      </section>

      <section aria-labelledby="judul-banding">
        <h3 id="judul-banding" className="mb-3 text-sm font-semibold text-primer-900">
          Sebelum dan sesudah butir diubah
        </h3>
        {banding.length ? (
          <Dumbbell
            judul="% disetujui pada deskripsi lama (berongga) dan deskripsi baru (isi)"
            ambang={ambang.disetujui}
            baris={banding.map((b) => ({
              kunci: b.kode,
              label: `${b.kode} ${b.baru.deskripsi}`,
              lama: { persen: b.lama.persen, teks: `v${b.lama.versi}: ${formatPersen(b.lama.persen)} (${formatAngka(b.lama.jumlah)} hasil)` },
              baru: { persen: b.baru.persen, teks: `v${b.baru.versi}: ${formatPersen(b.baru.persen)} (${formatAngka(b.baru.jumlah)} hasil)` },
            }))}
          />
        ) : (
          <p className="text-sm text-teks-redup">Belum ada butir yang deskripsinya diubah di tengah periode ini. Sesudah butir yang ditandai diperbaiki lewat Aturan Pemeriksaan, perbandingannya muncul di sini.</p>
        )}
      </section>
    </div>
  );
}
