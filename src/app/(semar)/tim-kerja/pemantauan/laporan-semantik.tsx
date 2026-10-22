"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, Bagian, Button, KotakCentang, ModalKonfirmasi, Sheet, StatusBadge, Table, TBody, TD, TH, THead, TR, beriTahu, kelasTombol } from "@/components/ui";
import { formatPersen, type BarisKesesuaian, type BarisKoreksiTertinggi, type ContohRincian } from "@/lib/pemantauan/rekap";
import { aksiTandaiButir, type HasilTandaiAksi } from "./aksi";

const persen = (n: number) => `${String(Math.round(n * 1000) / 10).replace(".", ",")}%`;
const STATUS_DITANDAI = "Perlu ditinjau";

/**
 * Bagian "Kesesuaian per Butir" dan "Butir dengan Koreksi Tertinggi" (UC-04 s.4-7, S-1).
 * Nama butir membuka M-08 Rincian Butir (sheet; pilihan butir ada di URL `?butir=`). Kotak "Perlu Diperbaiki" + "Tandai Butir" membuka M-09.
 * Kode butir menaut ke baris butir di J-03 (hanya Tim Kerja pengelola yang dapat membuka J-03).
 */
export function LaporanSemantik({
  periodeId,
  skemaId,
  kesesuaian,
  koreksi,
  rincian,
  pengelola,
}: {
  periodeId: string;
  skemaId: string;
  kesesuaian: BarisKesesuaian[];
  koreksi: BarisKoreksiTertinggi[];
  rincian: Record<string, ContohRincian[]>;
  pengelola: boolean;
}) {
  const router = useRouter();
  const jalur = usePathname();
  const cari = useSearchParams();
  const kodeTerbuka = cari.get("butir");
  const butirTerbuka = kodeTerbuka && rincian[kodeTerbuka] ? kodeTerbuka : null;
  const deskripsiTerbuka = kesesuaian.find((b) => b.kode === butirTerbuka)?.deskripsi ?? koreksi.find((b) => b.kode === butirTerbuka)?.deskripsi ?? "";

  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [hasil, setHasil] = useState<HasilTandaiAksi | null>(null);
  const [galatPilih, setGalatPilih] = useState<string | null>(null);
  const [sibuk, mulai] = useTransition();

  const alamat = (kode: string | null) => {
    const p = new URLSearchParams(cari.toString());
    if (kode) p.set("butir", kode);
    else p.delete("butir");
    const q = p.toString();
    return q ? `${jalur}?${q}` : jalur;
  };
  const tautanJ03 = (kode: string) => `/tim-kerja/aturan?skema=${skemaId}&periode=${periodeId}&butir=${encodeURIComponent(kode)}`;

  function alih(kode: string, nilai: boolean) {
    setGalatPilih(null);
    setDipilih((s) => {
      const baru = new Set(s);
      if (nilai) baru.add(kode);
      else baru.delete(kode);
      return baru;
    });
  }

  function mintaTandai() {
    if (dipilih.size === 0) {
      setGalatPilih("Pilih minimal satu butir dengan mencentang “Perlu Diperbaiki”.");
      return;
    }
    setHasil(null);
    setKonfirmasi(true);
  }

  function tandai() {
    mulai(async () => {
      const h = await aksiTandaiButir(periodeId, skemaId, [...dipilih]);
      setHasil(h);
      if (h.galat) return;
      setKonfirmasi(false);
      setDipilih(new Set());
      beriTahu.sukses(h.ditandai.length ? `Butir ${h.ditandai.join(", ")} sekarang berlabel “${STATUS_DITANDAI}”.` : "Tidak ada butir Aktif yang perlu ditandai.");
    });
  }

  const namaButir = (kode: string, deskripsi: string) => (
    <>
      <Link
        href={alamat(kode)}
        scroll={false}
        className="text-left text-sogan-800 underline decoration-emas-500 underline-offset-2 hover:text-sogan-600"
        aria-label={`Rincian butir ${kode}: ${deskripsi}`}
      >
        {deskripsi}
      </Link>
    </>
  );
  const kodeButir = (kode: string) =>
    pengelola ? (
      <Link href={tautanJ03(kode)} className="font-mono text-xs font-semibold text-sogan-700 underline-offset-2 hover:underline" title="Buka butir ini di Aturan Pemeriksaan (J-03)">
        {kode}
      </Link>
    ) : (
      <span className="font-mono text-xs font-semibold text-sogan-700">{kode}</span>
    );

  return (
    <>
      <Bagian judul="Kesesuaian per Butir">
        {kesesuaian.length === 0 ? (
          <p className="text-sm text-sogan-700">Belum ada penilaian final untuk periode dan skema ini.</p>
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Butir</TH>
                  <TH angka>Hasil Dinilai</TH>
                  <TH angka>Dikoreksi</TH>
                  <TH angka>% Disetujui</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {kesesuaian.map((b) => (
                  <TR key={b.kode}>
                    <TD className="max-w-sm">
                      {kodeButir(b.kode)}
                      <p>{namaButir(b.kode, b.deskripsi)}</p>
                    </TD>
                    <TD angka>{b.jumlah}</TD>
                    <TD angka>{b.jumlahKoreksi}</TD>
                    <TD angka className="font-semibold">
                      {formatPersen(b.persenDisetujui)}
                    </TD>
                    <TD>{b.status ? <StatusBadge status={b.status} /> : null}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <p className="mt-2 text-xs text-sogan-700">
              Rekomendasi yang tidak dikoreksi dihitung disetujui. Butir deterministik tidak muncul di sini karena reviewer tidak mengoreksinya.
            </p>
          </>
        )}
      </Bagian>

      <Bagian
        judul="Butir dengan Koreksi Tertinggi"
        aksi={
          koreksi.length ? (
            <Button onClick={mintaTandai}>Tandai Butir</Button>
          ) : null
        }
      >
        {koreksi.length === 0 ? (
          <p className="text-sm text-sogan-700">Belum ada koreksi reviewer pada penilaian final untuk periode dan skema ini.</p>
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Butir</TH>
                  <TH angka>Tingkat Koreksi</TH>
                  <TH>Alasan Koreksi dan Jenis Kekeliruan</TH>
                  <TH>Status</TH>
                  <TH>Perlu Diperbaiki</TH>
                </TR>
              </THead>
              <TBody>
                {koreksi.map((b) => {
                  const sudahDitandai = b.status === STATUS_DITANDAI;
                  return (
                    <TR key={b.kode} tersorot={sudahDitandai}>
                      <TD className="min-w-52 max-w-xs">
                        {kodeButir(b.kode)}
                        <p>{namaButir(b.kode, b.deskripsi)}</p>
                      </TD>
                      <TD angka>
                        {persen(b.tingkatKoreksi)}
                        <p className="text-xs text-sogan-700">
                          {b.jumlahKoreksi} dari {b.jumlah} hasil
                        </p>
                      </TD>
                      <TD className="min-w-64 max-w-md">
                        <ul className="space-y-1.5">
                          {b.alasan.map((a, i) => (
                            <li key={i} className="text-xs">
                              <Badge warna="netral">{a.jenisKekeliruan || "Tanpa jenis"}</Badge> <span className="text-sogan-700">menjadi {a.keputusanReviewer}:</span> {a.alasan}
                            </li>
                          ))}
                        </ul>
                      </TD>
                      <TD>{b.status ? <StatusBadge status={b.status} /> : null}</TD>
                      <TD>
                        {b.butirId && b.status === "Aktif" ? (
                          <KotakCentang id={`perbaiki-${b.kode}`} label="Perlu Diperbaiki" checked={dipilih.has(b.kode)} onCheckedChange={(v) => alih(b.kode, v === true)} />
                        ) : sudahDitandai ? (
                          <span className="text-xs text-sogan-700">Sudah ditandai</span>
                        ) : (
                          <span className="text-xs text-sogan-600">-</span>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <div aria-live="polite">
              {galatPilih ? (
                <p role="alert" className="mt-3 text-sm font-medium text-bata-600">
                  {galatPilih}
                </p>
              ) : null}
              {hasil?.ditandai.length && pengelola ? (
                <p className="mt-3 text-sm text-sogan-800">
                  Butir ditandai tampil disorot di J-03.{" "}
                  <Link href={`/tim-kerja/aturan?skema=${skemaId}&periode=${periodeId}`} className={kelasTombol("hantu", "sm")}>
                    Buka Aturan Pemeriksaan
                  </Link>
                </p>
              ) : null}
            </div>
          </>
        )}
      </Bagian>

      <Sheet
        buka={butirTerbuka !== null}
        saatUbah={(b) => !b && router.replace(alamat(null), { scroll: false })}
        kode="M-08"
        judul={butirTerbuka ? `Rincian Butir ${butirTerbuka}` : "Rincian Butir"}
        deskripsi={deskripsiTerbuka}
        kaki={
          <Button varian="sekunder" onClick={() => router.replace(alamat(null), { scroll: false })}>
            Tutup
          </Button>
        }
      >
        <ul className="space-y-4">
          {(butirTerbuka ? rincian[butirTerbuka] : []).map((c, i) => (
            <li key={i} className="border-b border-sogan-100 pb-4 last:border-0">
              {c.proposalId ? (
                <Link href={`/tim-kerja/proposal/${c.proposalId}`} className="font-semibold text-sogan-800 underline decoration-emas-500 underline-offset-2 hover:text-sogan-600">
                  {c.judulProposal}
                </Link>
              ) : (
                <p className="font-semibold text-sogan-800">{c.judulProposal}</p>
              )}
              <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[9rem_1fr]">
                <dt className="text-sogan-700">Rekomendasi sistem</dt>
                <dd>
                  {c.rekomendasi ?? c.statusSistem} {c.tiruan ? <Badge>tiruan</Badge> : null}
                </dd>
                <dt className="text-sogan-700">Kutipan</dt>
                <dd>{c.kutipan ? <q>{c.kutipan}</q> : "-"}</dd>
                <dt className="text-sogan-700">Keputusan reviewer</dt>
                <dd>
                  {c.keputusanReviewer} {c.dikoreksi ? <StatusBadge status="Dikoreksi reviewer" /> : null}
                </dd>
                {c.alasanKoreksi ? (
                  <>
                    <dt className="text-sogan-700">Alasan koreksi</dt>
                    <dd>{c.alasanKoreksi}</dd>
                  </>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      </Sheet>

      <ModalKonfirmasi
        buka={konfirmasi}
        saatUbah={setKonfirmasi}
        kode="M-09"
        judul="Konfirmasi Tandai Butir"
        labelKonfirmasi="Tandai Butir"
        memuat={sibuk}
        saatKonfirmasi={tandai}
        galat={hasil?.galat ?? null}
      >
        <p>Butir berikut akan berlabel &ldquo;{STATUS_DITANDAI}&rdquo; dan tampil disorot di J-03. Butir tetap dipakai pemeriksa sampai basis aturan versi baru disimpan.</p>
        <ul className="mt-3 space-y-1">
          {[...dipilih].map((k) => (
            <li key={k}>
              <span className="font-mono text-xs font-semibold">{k}</span> {koreksi.find((b) => b.kode === k)?.deskripsi}
            </li>
          ))}
        </ul>
      </ModalKonfirmasi>
    </>
  );
}
