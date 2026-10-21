"use client";

import { useActionState, useState, useTransition } from "react";
import { Alert, Badge, Button, Field, Input, Panel, Select, StatusBadge, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import type { BarisUsulanPenugasan, SebaranBeban } from "@/lib/kontrak/tipe";
import { aksiPindah, aksiSusun, aksiTetapkan } from "./aksi";
import type { HasilPindahAksi, HasilSusunAksi, HasilTetapkanAksi } from "./tipe";

export interface KandidatUi {
  id: string;
  nama: string;
  institusi: string;
  beban: number;
}

export interface PeriodeUi {
  id: string;
  nama: string;
  tanggalTutup: string;
  batas: number;
  ditutup: boolean;
}

export function PapanPenugasan({
  periode,
  usulan,
  ditetapkan,
  sebaran,
  kandidat,
}: {
  periode: PeriodeUi;
  usulan: BarisUsulanPenugasan[];
  ditetapkan: BarisUsulanPenugasan[];
  sebaran: SebaranBeban[];
  kandidat: KandidatUi[];
}) {
  const [hasilSusun, aksiSusunForm, sedangMenyusun] = useActionState<HasilSusunAksi, FormData>(aksiSusun, {});
  const [batas, setBatas] = useState(String(periode.batas));
  const [pindah, setPindah] = useState<{ penugasanId: string; reviewerId: string } | null>(null);
  const [hasilPindah, setHasilPindah] = useState<Record<string, HasilPindahAksi>>({});
  const [hasilTetapkan, setHasilTetapkan] = useState<HasilTetapkanAksi | null>(null);
  const [sibuk, mulai] = useTransition();

  const bisaSusun = periode.ditutup;

  function simpanPemindahan() {
    if (!pindah) return;
    const { penugasanId, reviewerId } = pindah;
    mulai(async () => {
      const h = await aksiPindah(penugasanId, reviewerId);
      setHasilPindah((s) => ({ ...s, [penugasanId]: h }));
      if (h.diterima) setPindah(null);
    });
  }

  function tetapkan() {
    mulai(async () => {
      setHasilTetapkan(await aksiTetapkan(periode.id));
    });
  }

  const adaUsulan = usulan.length > 0;

  return (
    <div className="space-y-6">
      <Panel judul="Periode Seleksi">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold text-sogan-800">{periode.nama}</span>
          <span className="text-sogan-600">tanggal tutup pengusulan: {periode.tanggalTutup}</span>
          {periode.ditutup ? <Badge warna="daun">Masa pengusulan ditutup</Badge> : <Badge warna="emas">Masa pengusulan berjalan</Badge>}
        </div>
        {!periode.ditutup ? (
          <Alert jenis="info" className="mt-4">
            Tombol &quot;Susun Usulan Penugasan&quot; baru aktif sesudah masa pengusulan periode ini ditutup (di prototipe: sakelar masa pengusulan pada
            halaman /demo).
          </Alert>
        ) : null}

        <form action={aksiSusunForm} className="mt-5 flex flex-wrap items-end gap-4">
          <input type="hidden" name="periodeId" value={periode.id} />
          <Field label="Batas Beban per Reviewer" htmlFor="batas" petunjuk="Jumlah proposal maksimal untuk satu reviewer." className="w-64">
            <Input
              id="batas"
              name="batas"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={batas}
              onChange={(e) => setBatas(e.target.value)}
              disabled={!bisaSusun}
            />
          </Field>
          <Button type="submit" disabled={!bisaSusun || sedangMenyusun}>
            Susun Usulan Penugasan
          </Button>
        </form>
        {hasilSusun.galat ? (
          <Alert jenis="galat" className="mt-4">
            {hasilSusun.galat}
          </Alert>
        ) : null}
        {hasilSusun.berhasil && !hasilSusun.kekurangan ? (
          <Alert jenis="sukses" className="mt-4">
            {hasilSusun.jumlahUsulan
              ? `Usulan penugasan disusun untuk ${hasilSusun.jumlahUsulan} proposal. Tinjau tabel di bawah, lalu tetapkan.`
              : "Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini."}
          </Alert>
        ) : null}
      </Panel>

      {hasilSusun.kekurangan ? (
        <Panel judul="Kekurangan Reviewer">
          <Alert jenis="peringatan">
            <p>
              Reviewer yang bersedia tidak cukup untuk batas beban {batas}. Sebanyak <strong>{hasilSusun.kekurangan}</strong> proposal terkirim belum
              dapat ditugaskan, sehingga usulan tidak disusun.
            </p>
            <p className="mt-1">
              Ubah isian &quot;Batas Beban per Reviewer&quot; lalu tekan &quot;Susun Usulan Penugasan&quot; lagi, atau tambahkan reviewer di BIMA (di luar
              sistem ini).
            </p>
          </Alert>
        </Panel>
      ) : null}

      <Panel judul="Usulan Penugasan">
        {adaUsulan ? (
          <Table>
            <THead>
              <TR>
                <TH>Judul Proposal</TH>
                <TH>Skema</TH>
                <TH>Institusi Pengusul</TH>
                <TH>Reviewer</TH>
                <TH>Institusi Reviewer</TH>
                <TH>
                  <span className="sr-only">Aksi</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {usulan.map((u) => {
                const sedangPindah = pindah?.penugasanId === u.penugasanId;
                const h = hasilPindah[u.penugasanId];
                return (
                  <TR key={u.penugasanId}>
                    <TD className="max-w-xs">{u.judulProposal}</TD>
                    <TD>{u.skema}</TD>
                    <TD>{u.institusiPengusul}</TD>
                    <TD>{u.namaReviewer}</TD>
                    <TD>{u.institusiReviewer}</TD>
                    <TD className="min-w-64">
                      {sedangPindah ? (
                        <div className="space-y-2">
                          <Field label="Reviewer Pengganti" htmlFor={`pengganti-${u.penugasanId}`}>
                            <Select
                              id={`pengganti-${u.penugasanId}`}
                              value={pindah.reviewerId}
                              onChange={(e) => setPindah({ penugasanId: u.penugasanId, reviewerId: e.target.value })}
                            >
                              <option value="">Pilih reviewer</option>
                              {kandidat
                                .filter((k) => k.id !== u.reviewerId)
                                .map((k) => (
                                  <option key={k.id} value={k.id}>
                                    {k.nama} ({k.institusi}), beban {k.beban}
                                  </option>
                                ))}
                            </Select>
                          </Field>
                          <div className="flex gap-2">
                            <Button ukuran="sm" onClick={simpanPemindahan} disabled={sibuk || !pindah.reviewerId}>
                              Simpan Pemindahan
                            </Button>
                            <Button ukuran="sm" varian="hantu" onClick={() => setPindah(null)}>
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          ukuran="sm"
                          varian="garis"
                          onClick={() => {
                            setPindah({ penugasanId: u.penugasanId, reviewerId: "" });
                            setHasilPindah((s) => {
                              const { [u.penugasanId]: _dibuang, ...sisa } = s;
                              void _dibuang;
                              return sisa;
                            });
                          }}
                        >
                          Pindahkan
                        </Button>
                      )}
                      {h && !h.diterima ? (
                        <Alert jenis="galat" className="mt-2">
                          <p className="font-semibold">Pemindahan ditolak, reviewer semula tetap dipakai.</p>
                          <ul className="list-disc pl-4">
                            {h.galat ? <li>{h.galat}</li> : null}
                            {h.syaratDilanggar.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </Alert>
                      ) : null}
                      {h?.diterima && !sedangPindah ? (
                        <p className="mt-2 text-xs font-semibold text-daun-700">Pemindahan tersimpan.</p>
                      ) : null}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        ) : (
          <p className="text-sm text-sogan-700">
            {ditetapkan.length
              ? "Tidak ada usulan yang menunggu penetapan."
              : "Belum ada usulan penugasan. Isi batas beban lalu tekan \"Susun Usulan Penugasan\"."}
          </p>
        )}
      </Panel>

      <Panel judul="Sebaran Beban">
        {sebaran.length ? (
          <Table>
            <THead>
              <TR>
                <TH>Reviewer</TH>
                <TH>Jumlah Proposal</TH>
                <TH>Batas</TH>
                <TH>
                  <span className="sr-only">Perbandingan</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {sebaran.map((s) => {
                const persen = Math.min(100, s.batas ? (s.jumlah / s.batas) * 100 : 0);
                return (
                  <TR key={s.reviewerId}>
                    <TD>{s.namaReviewer}</TD>
                    <TD>{s.jumlah}</TD>
                    <TD>{s.batas}</TD>
                    <TD className="w-1/3">
                      <div
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={s.batas}
                        aria-valuenow={s.jumlah}
                        aria-label={`Beban ${s.namaReviewer}`}
                        className="h-2.5 w-full overflow-hidden rounded-full bg-sogan-100"
                      >
                        <div className={s.jumlah >= s.batas ? "h-full bg-bata-600" : "h-full bg-daun-500"} style={{ width: `${persen}%` }} />
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        ) : (
          <p className="text-sm text-sogan-700">Belum ada reviewer yang bersedia di data BIMA.</p>
        )}
      </Panel>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={tetapkan} disabled={sibuk || !adaUsulan}>
            Tetapkan Penugasan
          </Button>
          {hasilTetapkan?.gagalBima ? (
            <Button varian="emas" onClick={tetapkan} disabled={sibuk}>
              Kirim ulang
            </Button>
          ) : null}
        </div>
        {hasilTetapkan?.berhasil ? (
          <Alert jenis="sukses">Penugasan telah ditetapkan dan tercatat di BIMA ({hasilTetapkan.jumlah} proposal). Reviewer menerimanya dengan tanda &quot;Baru&quot; di J-07.</Alert>
        ) : null}
        {hasilTetapkan && !hasilTetapkan.berhasil && hasilTetapkan.galat ? (
          <Alert jenis={hasilTetapkan.gagalBima ? "galat" : "peringatan"}>
            {hasilTetapkan.galat}
            {hasilTetapkan.gagalBima ? " Usulan tetap berstatus Diusulkan; tekan \"Kirim ulang\" untuk mencoba lagi." : ""}
          </Alert>
        ) : null}
      </div>

      {ditetapkan.length ? (
        <Panel judul="Penugasan yang Sudah Ditetapkan">
          <Table>
            <THead>
              <TR>
                <TH>Judul Proposal</TH>
                <TH>Skema</TH>
                <TH>Institusi Pengusul</TH>
                <TH>Reviewer</TH>
                <TH>Institusi Reviewer</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {ditetapkan.map((u) => (
                <TR key={u.penugasanId}>
                  <TD className="max-w-xs">{u.judulProposal}</TD>
                  <TD>{u.skema}</TD>
                  <TD>{u.institusiPengusul}</TD>
                  <TD>{u.namaReviewer}</TD>
                  <TD>{u.institusiReviewer}</TD>
                  <TD>
                    <StatusBadge status="Ditetapkan" />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Panel>
      ) : null}
    </div>
  );
}
