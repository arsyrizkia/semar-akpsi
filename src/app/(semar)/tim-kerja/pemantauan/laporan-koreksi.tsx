"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Alert, Badge, Button, Checkbox, Panel, StatusBadge, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import type { BarisKoreksiTertinggi, ContohRincian } from "@/lib/pemantauan/rekap";
import { aksiTandaiButir, type HasilTandaiAksi } from "./aksi";

const persen = (n: number) => `${String(Math.round(n * 1000) / 10).replace(".", ",")}%`;

/** Bagian "Butir dengan Koreksi Tertinggi" + panel "Rincian Butir" (S-1) + "Perlu Diperbaiki"/"Tandai Butir" (s.6). */
export function LaporanKoreksi({
  periodeId,
  skemaId,
  baris,
  rincian,
}: {
  periodeId: string;
  skemaId: string;
  baris: BarisKoreksiTertinggi[];
  rincian: Record<string, ContohRincian[]>;
}) {
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilTandaiAksi | null>(null);
  const [sibuk, mulai] = useTransition();

  function alih(kode: string, nilai: boolean) {
    setDipilih((s) => {
      const baru = new Set(s);
      if (nilai) baru.add(kode);
      else baru.delete(kode);
      return baru;
    });
  }

  function tandai() {
    mulai(async () => {
      const h = await aksiTandaiButir(periodeId, skemaId, [...dipilih]);
      setHasil(h);
      if (!h.galat) setDipilih(new Set());
    });
  }

  const butirTerbuka = baris.find((b) => b.kode === terbuka);
  const rincianRef = useRef<HTMLElement | null>(null);
  const judulRincianRef = useRef<HTMLHeadingElement | null>(null);
  const tombolAsalRef = useRef<HTMLButtonElement | null>(null);
  // UC-04 S-1: panel rincian muncul di bawah tabel, jadi gulir ke sana dan pindahkan fokus agar klik terlihat berdampak
  useEffect(() => {
    if (!terbuka) return;
    rincianRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    judulRincianRef.current?.focus({ preventScroll: true });
  }, [terbuka]);

  return (
    <Panel judul="Butir dengan Koreksi Tertinggi">
      {baris.length === 0 ? (
        <p className="text-sm text-sogan-700">Belum ada koreksi reviewer pada penilaian final untuk periode dan skema ini.</p>
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Butir</TH>
                <TH>Tingkat Koreksi</TH>
                <TH>Alasan Koreksi dan Jenis Kekeliruan</TH>
                <TH>Status</TH>
                <TH>Perlu Diperbaiki</TH>
              </TR>
            </THead>
            <TBody>
              {baris.map((b) => {
                const sudahDitandai = b.status === "Perlu ditinjau";
                return (
                  <TR key={b.kode} className={sudahDitandai ? "bg-emas-50" : undefined}>
                    <TD className="max-w-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          tombolAsalRef.current = e.currentTarget;
                          setTerbuka(b.kode);
                        }}
                        className="text-left font-semibold text-sogan-800 underline decoration-emas-500 underline-offset-2 hover:text-sogan-600"
                      >
                        {b.kode}
                      </button>
                      <p className="text-xs text-sogan-600">{b.deskripsi}</p>
                    </TD>
                    <TD>
                      {persen(b.tingkatKoreksi)}
                      <p className="text-xs text-sogan-600">
                        {b.jumlahKoreksi} dari {b.jumlah} hasil
                      </p>
                    </TD>
                    <TD className="max-w-md">
                      <ul className="space-y-1.5">
                        {b.alasan.map((a, i) => (
                          <li key={i} className="text-xs">
                            <Badge warna="netral">{a.jenisKekeliruan || "Tanpa jenis"}</Badge> <span className="text-sogan-600">menjadi {a.keputusanReviewer}:</span> {a.alasan}
                          </li>
                        ))}
                      </ul>
                    </TD>
                    <TD>{b.status ? <StatusBadge status={b.status} /> : null}</TD>
                    <TD>
                      {b.butirId && b.status === "Aktif" ? (
                        <Checkbox
                          id={`perbaiki-${b.kode}`}
                          label="Perlu Diperbaiki"
                          checked={dipilih.has(b.kode)}
                          onCheckedChange={(v) => alih(b.kode, v === true)}
                        />
                      ) : sudahDitandai ? (
                        <span className="text-xs text-sogan-600">Sudah ditandai</span>
                      ) : (
                        <span className="text-xs text-sogan-500">-</span>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={tandai} disabled={sibuk || dipilih.size === 0}>
              Tandai Butir
            </Button>
            {hasil?.ditandai.length ? (
              <Alert jenis="sukses">
                Butir {hasil.ditandai.join(", ")} sekarang berlabel &quot;Perlu ditinjau&quot; dan tampil disorot di J-03 Aturan Pemeriksaan.
              </Alert>
            ) : null}
            {hasil?.galat ? <Alert jenis="peringatan">{hasil.galat}</Alert> : null}
          </div>
        </>
      )}

      {butirTerbuka ? (
        <section ref={rincianRef} aria-label="Rincian Butir" className="mt-6 scroll-mt-4 rounded-md border border-emas-500 bg-krem p-4">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 ref={judulRincianRef} tabIndex={-1} className="font-sans text-lg font-semibold text-sogan-800 outline-none">
              Rincian Butir: {butirTerbuka.kode}
            </h3>
            <Button ukuran="sm" varian="garis" onClick={() => {
                setTerbuka(null);
                tombolAsalRef.current?.focus();
              }}
            >
              Tutup
            </Button>
          </header>
          <p className="mb-3 text-sm text-sogan-700">{butirTerbuka.deskripsi}</p>
          <ul className="space-y-3">
            {(rincian[butirTerbuka.kode] ?? []).map((c, i) => (
              <li key={i} className="rounded-md border border-sogan-200 bg-white p-3 text-sm">
                <p className="font-semibold text-sogan-800">{c.judulProposal}</p>
                <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-sogan-600">Rekomendasi sistem</dt>
                  <dd>
                    {c.rekomendasi ?? c.statusSistem} {c.tiruan ? <Badge>tiruan</Badge> : null}
                  </dd>
                  <dt className="text-sogan-600">Kutipan</dt>
                  <dd>{c.kutipan ? <q>{c.kutipan}</q> : "-"}</dd>
                  <dt className="text-sogan-600">Keputusan reviewer</dt>
                  <dd>
                    {c.keputusanReviewer} {c.dikoreksi ? <StatusBadge status="Dikoreksi reviewer" /> : null}
                  </dd>
                  {c.alasanKoreksi ? (
                    <>
                      <dt className="text-sogan-600">Alasan koreksi</dt>
                      <dd>{c.alasanKoreksi}</dd>
                    </>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Panel>
  );
}
