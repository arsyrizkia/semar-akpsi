"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Lock, Plus } from "lucide-react";
import { Alert, Badge, BarKeyakinan, Button, Field, Input, Panel, Select, StatusBadge, Table, TBody, TD, TH, Textarea, THead, TR } from "@/components/ui";
import { PanelPemandu } from "@/components/layout/panel-pemandu";
import { LANGKAH_UC02 } from "@/lib/demo/pemandu/uc-02";
import { CONTOH_ATURAN_HITUNG, MASUKAN_BUTIR_KOSONG, type GalatButir, type MasukanButir } from "@/lib/aturan/parameter";
import type { ButirTampil, HasilUji, TampilanAturan } from "@/lib/aturan/layanan";
import type { PeriodePilihan } from "@/lib/templat/layanan";
import { formatTanggal } from "@/lib/utils";
import { aksiNonaktifkan, aksiPeriksaKunci, aksiSimpanButir, aksiSimpanVersi, aksiUji } from "./aksi";

interface Props {
  skemaId: string;
  namaSkema: string;
  periode: PeriodePilihan;
  tampilan: TampilanAturan;
  bagianPilihan: string[];
  lampiranPilihan: string[];
  masaBerjalan: boolean;
}

type Panelbutir = { mode: "tambah" } | { mode: "ubah"; butir: ButirTampil } | null;
type Uji = ({ ok: true } & HasilUji) | null;

const dariButir = (b: ButirTampil): MasukanButir => ({
  jenis: b.jenis,
  kode: b.kode,
  deskripsi: b.deskripsi,
  aturanHitung: b.aturanHitung ?? "",
  pertanyaan: b.pertanyaan ?? "",
  contohJawaban: b.contohJawaban ?? "",
  bagian: b.bagian ?? "",
  lampiran: b.lampiran ?? "",
});

export function PapanAturan({ skemaId, namaSkema, periode, tampilan, bagianPilihan, lampiranPilihan, masaBerjalan }: Props) {
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  const [panel, setPanel] = useState<Panelbutir>(null);
  const [masukan, setMasukan] = useState<MasukanButir>(MASUKAN_BUTIR_KOSONG);
  const [galat, setGalat] = useState<GalatButir>({});
  const [terkunci, setTerkunci] = useState<string | null>(null);
  const [uji, setUji] = useState<Uji>(null);
  const [sedangUji, setSedangUji] = useState(false);
  const [tanggal, setTanggal] = useState("");
  const [galatVersi, setGalatVersi] = useState<string | null>(null);
  const [berhasilVersi, setBerhasilVersi] = useState<{ versi: number; tanggal: string } | null>(null);
  const [galatUmum, setGalatUmum] = useState<string | null>(null);
  const [tampilNonaktif, setTampilNonaktif] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const terkunciRef = useRef<HTMLDivElement | null>(null);

  // Umpan balik harus terlihat di tempat aksi: gulir ke panel isian / pesan 4a begitu muncul, lalu fokuskan isian pertama.
  useEffect(() => {
    if (!panel) return;
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    panelRef.current?.querySelector<HTMLElement>("input:not([disabled]), textarea, select")?.focus({ preventScroll: true });
  }, [panel]);
  useEffect(() => {
    if (terkunci) terkunciRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [terkunci]);

  const { nyata, draf, butir } = tampilan;
  const dasar = draf ?? nyata;

  function ubahMasukan(ubah: Partial<MasukanButir>) {
    setMasukan((m) => ({ ...m, ...ubah }));
  }

  function bukaTambah() {
    setTerkunci(null);
    setGalat({});
    setMasukan(MASUKAN_BUTIR_KOSONG);
    setPanel({ mode: "tambah" });
  }

  function klikUbah(b: ButirTampil) {
    setGalatUmum(null);
    mulai(async () => {
      const r = await aksiPeriksaKunci(b.id);
      if (!r.ok) return setGalatUmum(r.pesan);
      if (r.terkunci) {
        // 4a: panel isian tidak dibuka
        setPanel(null);
        setTerkunci(r.pesan ?? "");
        return;
      }
      setTerkunci(null);
      setGalat({});
      setMasukan(dariButir(b));
      setPanel({ mode: "ubah", butir: b });
    });
  }

  function simpanButir() {
    setGalatUmum(null);
    mulai(async () => {
      const r = await aksiSimpanButir(skemaId, panel?.mode === "ubah" ? panel.butir.id : null, masukan);
      if (r.ok && "butirId" in r) {
        setGalat({});
        setPanel(null);
        toast.success(r.baru ? `Butir ${r.kode} ditambahkan pada versi yang sedang disusun.` : `Butir ${r.kode} diperbarui.`);
        setUji(null);
        router.refresh();
        return;
      }
      if ("terkunci" in r && r.terkunci) {
        setPanel(null);
        setTerkunci(r.pesan ?? "");
        return;
      }
      if ("galat" in r) setGalat(r.galat);
      const pesan = "pesan" in r ? r.pesan : undefined;
      if (pesan) setGalatUmum(pesan);
    });
  }

  function nonaktifkan(b: ButirTampil) {
    setGalatUmum(null);
    mulai(async () => {
      const r = await aksiNonaktifkan(skemaId, b.id);
      if (!r.ok) {
        if ("terkunci" in r && r.terkunci) return setTerkunci(r.pesan);
        return setGalatUmum(r.pesan);
      }
      toast.success(`Butir ${r.kode} dinonaktifkan pada versi yang sedang disusun.`);
      setUji(null);
      router.refresh();
    });
  }

  async function jalankanUji() {
    setGalatUmum(null);
    setSedangUji(true);
    try {
      const r = await aksiUji(skemaId, periode.id);
      if (!r.ok) setGalatUmum(r.pesan);
      else setUji(r);
    } finally {
      setSedangUji(false);
    }
  }

  function simpanVersi() {
    setGalatVersi(null);
    setBerhasilVersi(null);
    mulai(async () => {
      const r = await aksiSimpanVersi(skemaId, periode.id, tanggal);
      if (!r.ok) return setGalatVersi(r.pesan);
      if ("versi" in r) {
        setBerhasilVersi({ versi: r.versi, tanggal: r.tanggalBerlaku });
        setTanggal("");
        setUji(null);
        router.refresh();
      }
    });
  }

  // tabel hasil uji: butir (urut seperti tabel) x contoh
  const barisUji = uji
    ? butir
        .filter((b) => b.status !== "Nonaktif")
        .map((b) => ({ b, sel: uji.contoh.map((c) => c.deterministik.find((h) => h.kode === b.kode) ?? c.semantik.find((h) => h.kode === b.kode) ?? null) }))
        .filter((x) => x.sel.some(Boolean))
    : [];

  return (
    <>
      <Panel
        judul={`Butir Cek: ${namaSkema}`}
        className="mb-6"
        aksi={
          <Button varian="emas" onClick={bukaTambah} disabled={sibuk}>
            <Plus aria-hidden className="size-4" /> Tambah Butir
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-sogan-700">
          {nyata ? (
            <span>
              Basis aturan berlaku: versi {nyata.versi}, berlaku sejak {formatTanggal(nyata.tanggalBerlaku)}.
            </span>
          ) : (
            <span>Skema ini belum memiliki basis aturan.</span>
          )}
          {draf ? <Badge warna="emas">Versi {draf.versi} sedang disusun (belum berlaku)</Badge> : null}
        </div>

        {terkunci ? (
          <div ref={terkunciRef}>
          <Alert jenis="peringatan" className="mb-4">
            <p>{terkunci}</p>
            <Button asChild ukuran="sm" varian="emas" className="mt-3">
              <Link href={`/tim-kerja/templat?skema=${skemaId}`}>Buka Templat Proposal</Link>
            </Button>
          </Alert>
          </div>
        ) : null}
        {galatUmum ? (
          <Alert jenis="galat" className="mb-4">
            {galatUmum}
          </Alert>
        ) : null}

        {butir.some((b) => b.status === "Nonaktif") ? (
          <label className="mb-3 flex items-center gap-2 text-sm text-sogan-800">
            <input type="checkbox" checked={tampilNonaktif} onChange={(e) => setTampilNonaktif(e.target.checked)} />
            Tampilkan butir nonaktif ({butir.filter((b) => b.status === "Nonaktif").length})
          </label>
        ) : null}
        <Table>
          <THead>
            <TR>
              <TH>Kode</TH>
              <TH>Deskripsi</TH>
              <TH>Jenis</TH>
              <TH>Asal</TH>
              <TH>Parameter</TH>
              <TH>Status</TH>
              <TH>
                <span className="sr-only">Aksi</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {butir.length === 0 ? (
              <TR>
                <TD colSpan={7} className="py-6 text-center text-sogan-600">
                  Belum ada butir cek. Terbitkan templat di J-02 atau tekan &quot;Tambah Butir&quot;.
                </TD>
              </TR>
            ) : null}
            {butir.filter((b) => tampilNonaktif || b.status !== "Nonaktif").map((b) => (
              <TR key={b.id} className={b.status === "Perlu ditinjau" ? "bg-emas-100 hover:bg-emas-100" : b.status === "Nonaktif" ? "text-sogan-700" : undefined}>
                <TD className="whitespace-nowrap font-mono text-xs font-semibold">{b.kode}</TD>
                <TD className="min-w-48">{b.deskripsi}</TD>
                <TD className="capitalize">{b.jenis}</TD>
                <TD className="whitespace-nowrap">
                  {b.asal === "templat" ? (
                    <span className="inline-flex items-center gap-1" title="Nilai butir ini terkunci; ubah lewat J-02 Templat Proposal">
                      <Lock aria-label="Terkunci" className="size-4 text-sogan-600" /> templat
                    </span>
                  ) : (
                    "manual"
                  )}
                </TD>
                <TD className="min-w-56 max-w-md text-xs text-sogan-800">{b.ringkasan}</TD>
                <TD>
                  <StatusBadge status={b.status} />
                  {b.ditandaiPemantauan ? <span className="mt-1 block text-xs text-sogan-600">ditandai pemantauan</span> : null}
                </TD>
                <TD className="whitespace-nowrap">
                  {b.status !== "Nonaktif" ? (
                    <span className="flex gap-1">
                      <Button varian="garis" ukuran="sm" onClick={() => klikUbah(b)} disabled={sibuk}>
                        Ubah
                      </Button>
                      {b.asal === "manual" ? (
                        <Button varian="hantu" ukuran="sm" onClick={() => nonaktifkan(b)} disabled={sibuk}>
                          Nonaktifkan
                        </Button>
                      ) : null}
                    </span>
                  ) : null}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>

      {panel ? (
        <div ref={panelRef}>
        <Panel judul={panel.mode === "tambah" ? "Tambah Butir" : `Ubah Butir ${panel.butir.kode}`} className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Kode" htmlFor="b-kode" galat={galat.kode}>
              <Input id="b-kode" value={masukan.kode} disabled={panel.mode === "ubah"} aria-invalid={galat.kode ? true : undefined} onChange={(e) => ubahMasukan({ kode: e.target.value })} />
            </Field>
            <Field label="Jenis" htmlFor="b-jenis" galat={galat.jenis}>
              <Select id="b-jenis" value={masukan.jenis} disabled={panel.mode === "ubah"} aria-invalid={galat.jenis ? true : undefined} onChange={(e) => ubahMasukan({ jenis: e.target.value as MasukanButir["jenis"] })}>
                <option value="">Pilih jenis</option>
                <option value="deterministik">Deterministik</option>
                <option value="semantik">Semantik</option>
              </Select>
            </Field>
            <Field label="Deskripsi" htmlFor="b-deskripsi" galat={galat.deskripsi} className="md:col-span-2">
              <Input id="b-deskripsi" value={masukan.deskripsi} aria-invalid={galat.deskripsi ? true : undefined} onChange={(e) => ubahMasukan({ deskripsi: e.target.value })} />
            </Field>

            {masukan.jenis === "deterministik" ? (
              <>
                <Field label="Aturan Hitung" htmlFor="b-aturan" galat={galat.aturanHitung} petunjuk={CONTOH_ATURAN_HITUNG} className="md:col-span-2">
                  <Input id="b-aturan" value={masukan.aturanHitung} aria-invalid={galat.aturanHitung ? true : undefined} onChange={(e) => ubahMasukan({ aturanHitung: e.target.value })} />
                </Field>
                <Field label="Bagian yang Diperiksa" htmlFor="b-bagian-d" galat={galat.bagian} petunjuk="Hanya perlu untuk aturan yang bergantung pada satu bagian (mis. diagram alir, bagian terisi).">
                  <Select id="b-bagian-d" value={masukan.bagian} aria-invalid={galat.bagian ? true : undefined} onChange={(e) => ubahMasukan({ bagian: e.target.value })}>
                    <option value="">(tidak ada)</option>
                    {bagianPilihan.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : null}

            {masukan.jenis === "semantik" ? (
              <>
                <Field label="Pertanyaan Pemeriksaan" htmlFor="b-tanya" galat={galat.pertanyaan} className="md:col-span-2">
                  <Textarea id="b-tanya" value={masukan.pertanyaan} aria-invalid={galat.pertanyaan ? true : undefined} onChange={(e) => ubahMasukan({ pertanyaan: e.target.value })} />
                </Field>
                <Field label="Contoh Jawaban" htmlFor="b-contoh" className="md:col-span-2">
                  <Textarea id="b-contoh" value={masukan.contohJawaban} onChange={(e) => ubahMasukan({ contohJawaban: e.target.value })} />
                </Field>
                <Field label="Bagian yang Diperiksa" htmlFor="b-bagian-s" galat={galat.bagian}>
                  <Select id="b-bagian-s" value={masukan.bagian} aria-invalid={galat.bagian ? true : undefined} onChange={(e) => ubahMasukan({ bagian: e.target.value })}>
                    <option value="">Pilih bagian</option>
                    {bagianPilihan.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Lampiran yang Diperiksa" htmlFor="b-lampiran" petunjuk="Kosongkan bila yang diperiksa adalah teks bagian.">
                  <Select id="b-lampiran" value={masukan.lampiran} onChange={(e) => ubahMasukan({ lampiran: e.target.value })}>
                    <option value="">(tidak ada)</option>
                    {lampiranPilihan.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : null}
          </div>
          <div className="mt-5 flex gap-3">
            <Button onClick={simpanButir} disabled={sibuk}>
              Simpan Butir
            </Button>
            <Button varian="garis" onClick={() => setPanel(null)}>
              Batal
            </Button>
          </div>
        </Panel>
        </div>
      ) : null}

      <Panel judul="Uji dan Simpan" className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button varian="garis" onClick={jalankanUji} disabled={sedangUji || !dasar}>
            {sedangUji ? "Menguji..." : "Uji pada Contoh"}
          </Button>
          <p className="text-sm text-sogan-700">Menerapkan butir pada contoh proposal yang tersimpan di sistem (data contoh sementara).</p>
        </div>

        {uji ? (
          <div className="mt-5">
            <h3 className="font-serif text-lg font-semibold text-sogan-800">Hasil Uji</h3>
            {uji.semuaContoh ? <Alert jenis="info" className="my-2">Skema ini belum memiliki contoh sendiri, sehingga semua contoh proposal dipakai.</Alert> : null}
            {uji.peringatan.map((p) => (
              <Alert key={p} jenis="peringatan" className="my-2">
                {p}
              </Alert>
            ))}
            {barisUji.length === 0 ? (
              <p className="mt-2 text-sm text-sogan-600">Tidak ada hasil untuk ditampilkan.</p>
            ) : (
              <div className="mt-3">
                <Table>
                  <THead>
                    <TR>
                      <TH>Butir</TH>
                      {uji.contoh.map((c) => (
                        <TH key={c.dokumenKode}>{c.dokumenNama}</TH>
                      ))}
                    </TR>
                  </THead>
                  <TBody>
                    {barisUji.map(({ b, sel }) => (
                      <TR key={b.id}>
                        <TD className="min-w-44">
                          <span className="font-mono text-xs font-semibold">{b.kode}</span>
                          <span className="block text-xs text-sogan-700">{b.deskripsi}</span>
                        </TD>
                        {sel.map((h, i) => (
                          <TD key={uji.contoh[i].dokumenKode} className="min-w-48">
                            {h ? <SelHasil h={h} /> : <span className="text-sogan-400">-</span>}
                          </TD>
                        ))}
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </div>
        ) : null}

        <hr className="my-6 border-sogan-100" />
        {berhasilVersi ? (
          <Alert jenis="sukses" className="mb-4" judul="Basis aturan versi baru tersimpan">
            Basis aturan versi {berhasilVersi.versi} tersimpan dan berlaku mulai {formatTanggal(berhasilVersi.tanggal)}.
          </Alert>
        ) : null}
        {galatVersi ? (
          <Alert jenis="galat" className="mb-4">
            {galatVersi}
          </Alert>
        ) : null}
        <div className="flex flex-wrap items-end gap-4">
          <Field
            label="Tanggal Berlaku"
            htmlFor="tgl-berlaku"
            className="w-full max-w-xs"
            petunjuk={
              masaBerjalan
                ? `Masa pengusulan sedang berjalan (${formatTanggal(periode.tanggalBuka)} sampai ${formatTanggal(periode.tanggalTutup)}): pilih tanggal di luar rentang itu.`
                : undefined
            }
          >
            <Input id="tgl-berlaku" type="date" value={tanggal} aria-invalid={galatVersi ? true : undefined} onChange={(e) => setTanggal(e.target.value)} />
          </Field>
          <Button onClick={simpanVersi} disabled={sibuk || !draf}>
            Simpan Versi
          </Button>
          {!draf ? <p className="pb-2 text-sm text-sogan-600">Belum ada perubahan untuk disimpan sebagai versi baru.</p> : null}
        </div>
      </Panel>

      <PanelPemandu kode="UC-02" judul="Mengelola aturan pemeriksaan" langkah={LANGKAH_UC02} />
    </>
  );
}

type Sel = NonNullable<HasilUji["contoh"][number]["deterministik"][number] | HasilUji["contoh"][number]["semantik"][number]>;

function SelHasil({ h }: { h: Sel }) {
  if ("angkaPembukti" in h) {
    return (
      <div className="space-y-1">
        <StatusBadge status={h.status} />
        <p className="text-xs">{h.angkaPembukti}</p>
        {h.batasDilanggar ? <p className="text-xs text-bata-700">{h.batasDilanggar}</p> : null}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <span className="flex flex-wrap items-center gap-1">
        <StatusBadge status={h.status} />
        {h.tiruan ? <Badge>tiruan</Badge> : null}
      </span>
      {h.kutipan ? <p className="text-xs italic">&ldquo;{h.kutipan}&rdquo;</p> : null}
      {h.alasanSistem ? <p className="text-xs text-sogan-700">{h.alasanSistem}</p> : null}
      {h.tingkatKeyakinan != null ? <BarKeyakinan nilai={h.tingkatKeyakinan} /> : null}
    </div>
  );
}
