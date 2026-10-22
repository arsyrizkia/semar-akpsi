"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
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

const angka = new Intl.NumberFormat("id-ID");
const desimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const detik = (ms?: number) => (ms === undefined ? "" : ` Waktu proses di server: ${desimal.format(ms / 1000)} detik.`);

/** Penomoran halaman tabel (parameter alamat `kunci`); tombol Sebelumnya/Berikutnya dan keterangan baris. */
function Halaman({ kunci, halaman, jumlahHalaman, ukuran, total, nama }: { kunci: "hal" | "halT"; halaman: number; jumlahHalaman: number; ukuran: number; total: number; nama: string }) {
  const jalur = usePathname();
  const parameter = useSearchParams();
  if (total <= ukuran) return null;
  const alamat = (h: number) => {
    const p = new URLSearchParams(parameter.toString());
    p.set(kunci, String(h));
    return `${jalur}?${p.toString()}`;
  };
  const awal = (halaman - 1) * ukuran + 1;
  const akhir = Math.min(total, halaman * ukuran);
  return (
    <nav aria-label={`Halaman tabel ${nama}`} className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p data-testid={`keterangan-${kunci}`} className="text-sogan-700">
        Baris {angka.format(awal)}-{angka.format(akhir)} dari {angka.format(total)} (halaman {halaman} dari {angka.format(jumlahHalaman)})
      </p>
      <div className="flex gap-2">
        {halaman > 1 ? (
          <Button asChild ukuran="sm" varian="garis">
            <Link href={alamat(halaman - 1)} scroll={false}>Sebelumnya</Link>
          </Button>
        ) : null}
        {halaman < jumlahHalaman ? (
          <Button asChild ukuran="sm" varian="garis">
            <Link href={alamat(halaman + 1)} scroll={false}>Berikutnya</Link>
          </Button>
        ) : null}
      </div>
    </nav>
  );
}

export function PapanPenugasan({
  periode,
  usulan,
  totalUsulan,
  halaman,
  jumlahHalaman,
  ditetapkan,
  totalDitetapkan,
  halamanT,
  jumlahHalamanT,
  ukuranHalaman,
  perluDitugaskan,
  sebaran,
  kandidat,
}: {
  periode: PeriodeUi;
  usulan: BarisUsulanPenugasan[];
  totalUsulan: number;
  halaman: number;
  jumlahHalaman: number;
  ditetapkan: BarisUsulanPenugasan[];
  totalDitetapkan: number;
  halamanT: number;
  jumlahHalamanT: number;
  ukuranHalaman: number;
  /** proposal Terkirim yang belum punya penugasan tetap */
  perluDitugaskan: number;
  sebaran: SebaranBeban[];
  kandidat: KandidatUi[];
}) {
  const [hasilSusun, aksiSusunForm, sedangMenyusun] = useActionState<HasilSusunAksi, FormData>(aksiSusun, {});
  const formSusun = useRef<HTMLFormElement>(null);
  const parameterAlamat = useSearchParams();
  const otomatis = useRef(false);
  // Skenario navigator "Kekurangan reviewer (S-1)" membuka J-04 dengan ?susun=1: Susun Usulan Penugasan ditekan otomatis sekali.
  useEffect(() => {
    if (otomatis.current || parameterAlamat.get("susun") !== "1" || !periode.ditutup) return;
    otomatis.current = true;
    formSusun.current?.requestSubmit();
  }, [parameterAlamat, periode.ditutup]);
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

  const [menetapkan, setMenetapkan] = useState(false);
  function tetapkan() {
    setMenetapkan(true);
    mulai(async () => {
      try {
        setHasilTetapkan(await aksiTetapkan(periode.id));
      } finally {
        setMenetapkan(false);
      }
    });
  }

  const adaUsulan = totalUsulan > 0;

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
            Tombol &quot;Susun Usulan Penugasan&quot; baru aktif sesudah masa pengusulan periode ini ditutup (di prototipe: sakelar masa pengusulan di Navigator demo atau
            halaman /demo).
          </Alert>
        ) : null}

        <form ref={formSusun} action={aksiSusunForm} className="mt-5 flex flex-wrap items-end gap-4">
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
        {sedangMenyusun ? (
          <p role="status" className="mt-4 flex items-center gap-2 text-sm font-semibold text-sogan-800">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Menyusun usulan penugasan... Untuk ribuan proposal ini memakan beberapa detik.
          </p>
        ) : null}
        {hasilSusun.galat ? (
          <Alert jenis="galat" className="mt-4">
            {hasilSusun.galat}
          </Alert>
        ) : null}
        {hasilSusun.berhasil && !hasilSusun.kekurangan ? (
          <Alert jenis="sukses" className="mt-4">
            {hasilSusun.jumlahUsulan
              ? `Usulan penugasan disusun untuk ${angka.format(hasilSusun.jumlahUsulan)} proposal. Tinjau tabel di bawah, lalu tetapkan.${detik(hasilSusun.durasiMs)}`
              : "Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini."}
          </Alert>
        ) : null}
      </Panel>

      {hasilSusun.kekurangan ? (
        <Panel id="panel-kekurangan" judul="Kekurangan Reviewer">
          <Alert jenis="peringatan">
            <p>
              Reviewer yang bersedia tidak cukup untuk batas beban {hasilSusun.batasDipakai ?? batas}. Sebanyak <strong>{angka.format(hasilSusun.kekurangan)}</strong> proposal terkirim belum
              dapat ditugaskan, sehingga usulan tidak disusun.{detik(hasilSusun.durasiMs)}
            </p>
            <p className="mt-1">
              Ubah isian &quot;Batas Beban per Reviewer&quot; lalu tekan &quot;Susun Usulan Penugasan&quot; lagi, atau tambahkan reviewer di BIMA (di luar
              sistem ini).
            </p>
          </Alert>
        </Panel>
      ) : null}

      <Panel judul="Usulan Penugasan">
        {perluDitugaskan === 0 && !adaUsulan ? (
          <Alert jenis="info" className="mb-4">
            Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini.
          </Alert>
        ) : (
          <p data-testid="ringkasan-usulan" className="mb-3 text-sm text-sogan-700">
            {adaUsulan ? (
              <>
                <strong>{angka.format(totalUsulan)}</strong> usulan menunggu penetapan.{" "}
              </>
            ) : null}
            {perluDitugaskan > 0 ? <>{angka.format(perluDitugaskan)} proposal Terkirim belum punya penugasan tetap.</> : null}
          </p>
        )}
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
            {perluDitugaskan > 0
              ? "Belum ada usulan penugasan. Isi batas beban lalu tekan \"Susun Usulan Penugasan\"."
              : "Tidak ada usulan yang menunggu penetapan."}
          </p>
        )}
        <Halaman kunci="hal" halaman={halaman} jumlahHalaman={jumlahHalaman} ukuran={ukuranHalaman} total={totalUsulan} nama="Usulan Penugasan" />
      </Panel>

      <Panel judul="Sebaran Beban">
        {sebaran.length ? (
          <>
            <p data-testid="ringkasan-sebaran" className="mb-3 text-sm text-sogan-700">
              {angka.format(sebaran.length)} reviewer bersedia; jumlah proposal per reviewer terendah {Math.min(...sebaran.map((x) => x.jumlah))}, tertinggi{" "}
              {Math.max(...sebaran.map((x) => x.jumlah))}, rata-rata {desimal.format(sebaran.reduce((n, x) => n + x.jumlah, 0) / sebaran.length)}, batas {periode.batas}.
            </p>
            <div className={sebaran.length > 12 ? "max-h-[28rem] overflow-y-auto rounded-md border border-sogan-200" : undefined} tabIndex={sebaran.length > 12 ? 0 : undefined} aria-label={sebaran.length > 12 ? "Tabel Sebaran Beban semua reviewer (dapat digulir)" : undefined}>
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
                        <div className={s.jumlah > s.batas ? "h-full bg-bata-600" : s.jumlah === s.batas ? "h-full bg-emas-700" : "h-full bg-daun-500"} style={{ width: `${persen}%` }} />
                      </div>
                      {s.jumlah >= s.batas ? <span className="text-xs text-sogan-700">{s.jumlah > s.batas ? "melebihi batas" : "penuh"}</span> : null}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
            </div>
          </>
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
        {menetapkan ? (
          <p role="status" className="flex items-center gap-2 text-sm font-semibold text-sogan-800">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Menetapkan penugasan dan mengirimnya ke BIMA per kelompok... Untuk ribuan proposal ini memakan beberapa detik.
          </p>
        ) : null}
        {hasilTetapkan?.berhasil ? (
          <Alert jenis="sukses">Penugasan telah ditetapkan dan tercatat di BIMA ({angka.format(hasilTetapkan.jumlah ?? 0)} proposal). Reviewer menerimanya dengan tanda &quot;Baru&quot; di J-07.{detik(hasilTetapkan.durasiMs)}</Alert>
        ) : null}
        {hasilTetapkan && !hasilTetapkan.berhasil && hasilTetapkan.galat ? (
          <Alert jenis={hasilTetapkan.gagalBima ? "galat" : "peringatan"}>
            {hasilTetapkan.galat}
            {hasilTetapkan.gagalBima ? " Usulan tetap berstatus Diusulkan; tekan \"Kirim ulang\" untuk mencoba lagi." : ""}
          </Alert>
        ) : null}
      </div>

      {totalDitetapkan > 0 ? (
        <Panel judul="Penugasan yang Sudah Ditetapkan">
          <p data-testid="ringkasan-ditetapkan" className="mb-3 text-sm text-sogan-700">
            <strong>{angka.format(totalDitetapkan)}</strong> penugasan sudah ditetapkan.
          </p>
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
          <Halaman kunci="halT" halaman={halamanT} jumlahHalaman={jumlahHalamanT} ukuran={ukuranHalaman} total={totalDitetapkan} nama="Penugasan yang Sudah Ditetapkan" />
        </Panel>
      ) : null}
    </div>
  );
}
