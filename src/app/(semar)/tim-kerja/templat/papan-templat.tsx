"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Alert, Badge, Button, Checkbox, Field, Input, Panel, Select, StatusBadge, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PanelPemandu } from "@/components/layout/panel-pemandu";
import { LANGKAH_UC01 } from "@/lib/demo/pemandu/uc-01";
import { periksaKelengkapan, type BarisBagianMentah } from "@/lib/templat/kelengkapan";
import type { PeriodePilihan, SkemaPilihan, TemplatTampil } from "@/lib/templat/layanan";
import { aksiSusunVersiBaru, aksiTerbitkan } from "./aksi";

interface Props {
  skema: SkemaPilihan[];
  skemaId: string;
  periode: PeriodePilihan[];
  berlaku: TemplatTampil | null;
  draf: TemplatTampil | null;
  masaBerjalan: boolean;
}

type Pesan =
  | { jenis: "terbit"; versi: number; jumlahButir: number }
  | { jenis: "draf"; versi: number }
  | { jenis: "galat"; teks: string }
  | null;

const dariTemplat = (t: TemplatTampil): BarisBagianMentah[] =>
  t.bagian.map((b) => ({ nama: b.nama, batas: b.batasKata == null ? "" : String(b.batasKata), tanpaBatas: b.batasKata == null, wajib: b.wajib }));

export function PapanTemplat(props: Props) {
  const { skema, skemaId, periode, berlaku, draf, masaBerjalan } = props;
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  const [pesan, setPesan] = useState<Pesan>(null);

  // Isian dikunci pada id draf: bila draf berganti (diterbitkan atau dibuat), isian dimuat ulang dari server.
  const kunciDraf = draf?.id ?? "tanpa-draf";
  const [isian, setIsian] = useState<{ kunci: string; bagian: BarisBagianMentah[]; lampiran: string[]; periodeId: string }>({
    kunci: kunciDraf,
    bagian: draf ? dariTemplat(draf) : [],
    lampiran: draf?.lampiranWajib ?? [],
    periodeId: draf?.periodeBerlakuId ?? "",
  });
  const [sudahCoba, setSudahCoba] = useState(false);
  if (isian.kunci !== kunciDraf) {
    setIsian({ kunci: kunciDraf, bagian: draf ? dariTemplat(draf) : [], lampiran: draf?.lampiranWajib ?? [], periodeId: draf?.periodeBerlakuId ?? "" });
    setSudahCoba(false);
  }

  const kelengkapan = useMemo(
    () => periksaKelengkapan({ bagian: isian.bagian, lampiran: isian.lampiran, periodeBerlakuId: isian.periodeId || null }),
    [isian],
  );
  const tandai = sudahCoba && !kelengkapan.lengkap;

  function ubahBaris(i: number, ubah: Partial<BarisBagianMentah>) {
    setIsian({ ...isian, bagian: isian.bagian.map((b, j) => (j === i ? { ...b, ...ubah } : b)) });
  }

  function susun() {
    setPesan(null);
    mulai(async () => {
      const r = await aksiSusunVersiBaru(skemaId);
      if (!r.ok) return setPesan({ jenis: "galat", teks: r.pesan });
      router.refresh();
    });
  }

  function terbitkan() {
    if (!draf) return;
    setPesan(null);
    setSudahCoba(true);
    mulai(async () => {
      const r = await aksiTerbitkan(skemaId, draf.id, { bagian: isian.bagian, lampiran: isian.lampiran, periodeBerlakuId: isian.periodeId || null });
      if (!r.ok) return setPesan({ jenis: "galat", teks: r.pesan });
      const h = r.hasil;
      if (h.hasil === "tidak-lengkap") return; // S-2: tanda sudah tampil dari pemeriksaan di peramban
      if (h.hasil === "tidak-ditemukan") return setPesan({ jenis: "galat", teks: h.pesan });
      if (h.hasil === "draf-disimpan") setPesan({ jenis: "draf", versi: h.versi });
      else setPesan({ jenis: "terbit", versi: h.versi, jumlahButir: h.jumlahButir });
      router.refresh();
    });
  }

  const namaSkema = skema.find((s) => s.id === skemaId)?.namaSkema ?? "";

  return (
    <>
      <Panel judul="Skema Pendanaan" className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Skema Pendanaan" htmlFor="skema" className="w-full max-w-sm">
            <Select
              id="skema"
              value={skemaId}
              onChange={(e) => {
                setPesan(null);
                router.push(`/tim-kerja/templat?skema=${e.target.value}`);
              }}
            >
              {skema.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.namaSkema}
                </option>
              ))}
            </Select>
          </Field>
          <p className="pb-2 text-sm text-sogan-700">
            Masa pengusulan (sakelar demo):{" "}
            <Badge warna={masaBerjalan ? "emas" : "daun"}>{masaBerjalan ? "berjalan" : "ditutup"}</Badge>
          </p>
        </div>
      </Panel>

      {pesan?.jenis === "terbit" ? (
        <Alert jenis="sukses" judul={`Templat versi ${pesan.versi} telah terbit`} className="mb-6">
          <p>
            {pesan.jumlahButir} butir cek draf dibuat dari templat ini. Tinjau butir itu di J-03 lalu simpan versi basis aturannya agar berlaku.
          </p>
          <Button asChild ukuran="sm" varian="emas" className="mt-3">
            <Link href={`/tim-kerja/aturan?skema=${skemaId}`}>Buka Aturan Pemeriksaan</Link>
          </Button>
        </Alert>
      ) : null}
      {pesan?.jenis === "draf" ? (
        <Alert jenis="peringatan" className="mb-6">
          Masa pengusulan skema ini sedang berjalan. Templat disimpan sebagai draf untuk periode berikutnya.
        </Alert>
      ) : null}
      {pesan?.jenis === "galat" ? (
        <Alert jenis="galat" className="mb-6">
          {pesan.teks}
        </Alert>
      ) : null}

      <Panel
        judul={berlaku ? `Templat Berlaku, Versi ${berlaku.versi}` : "Templat Berlaku"}
        className="mb-6"
        aksi={
          !draf ? (
            <Button varian="emas" onClick={susun} disabled={sibuk}>
              Susun Versi Baru
            </Button>
          ) : (
            <Badge warna="emas">Draf versi {draf.versi} sedang disusun</Badge>
          )
        }
      >
        {berlaku ? (
          <p className="mb-3 text-sm text-sogan-700">
            Periode berlaku: <strong>{berlaku.periodeBerlakuNama ?? "-"}</strong> · <StatusBadge status={berlaku.status} /> · {namaSkema}
          </p>
        ) : null}
        <Table>
          <THead>
            <TR>
              <TH>Urutan</TH>
              <TH>Nama Bagian</TH>
              <TH>Batas Kata</TH>
              <TH>Wajib</TH>
            </TR>
          </THead>
          <TBody>
            {berlaku && berlaku.bagian.length > 0 ? (
              berlaku.bagian.map((b) => (
                <TR key={b.urutan}>
                  <TD>{b.urutan}</TD>
                  <TD>{b.nama}</TD>
                  <TD>{b.batasKata ?? "Tanpa batas"}</TD>
                  <TD>{b.wajib ? "Ya" : "Tidak"}</TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={4} className="py-6 text-center text-sogan-600">
                  Skema ini belum memiliki templat
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
        {berlaku ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-sogan-800">Lampiran wajib</h3>
            {berlaku.lampiranWajib.length > 0 ? (
              <ul className="mt-1 list-inside list-disc text-sm">
                {berlaku.lampiranWajib.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-sogan-600">Tidak ada lampiran wajib.</p>
            )}
          </div>
        ) : null}
      </Panel>

      {draf ? (
        <Panel judul={`Isian Templat Versi ${draf.versi} (Draf)`} className="mb-6">
          {tandai ? (
            <Alert jenis="galat" className="mb-4">
              Lengkapi isian yang ditandai
            </Alert>
          ) : null}
          <Table>
            <THead>
              <TR>
                <TH>Urutan</TH>
                <TH>Nama Bagian</TH>
                <TH>Batas Kata</TH>
                <TH>Wajib</TH>
                <TH>
                  <span className="sr-only">Hapus</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {isian.bagian.length === 0 ? (
                <TR>
                  <TD colSpan={5} className={tandai && kelengkapan.tanpaBagian ? "py-4 text-center font-medium text-bata-600" : "py-4 text-center text-sogan-600"}>
                    Belum ada bagian. Tekan &quot;Tambah Bagian&quot;.
                  </TD>
                </TR>
              ) : null}
              {isian.bagian.map((b, i) => (
                <TR key={i}>
                  <TD>{i + 1}</TD>
                  <TD>
                    <Input
                      aria-label={`Nama Bagian baris ${i + 1}`}
                      value={b.nama}
                      aria-invalid={tandai && kelengkapan.bagian[i]?.nama ? true : undefined}
                      onChange={(e) => ubahBaris(i, { nama: e.target.value })}
                    />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Input
                        aria-label={`Batas Kata baris ${i + 1}`}
                        inputMode="numeric"
                        className="w-28"
                        value={b.tanpaBatas ? "" : b.batas}
                        disabled={b.tanpaBatas}
                        aria-invalid={tandai && kelengkapan.bagian[i]?.batas ? true : undefined}
                        onChange={(e) => ubahBaris(i, { batas: e.target.value })}
                      />
                      <Checkbox
                        id={`tb-${i}`}
                        label="Tanpa batas kata"
                        checked={b.tanpaBatas}
                        onCheckedChange={(v) => ubahBaris(i, { tanpaBatas: v === true })}
                      />
                    </div>
                  </TD>
                  <TD>
                    <Checkbox id={`wj-${i}`} label="Wajib" checked={b.wajib} onCheckedChange={(v) => ubahBaris(i, { wajib: v === true })} />
                  </TD>
                  <TD>
                    <Button varian="hantu" ukuran="sm" onClick={() => setIsian({ ...isian, bagian: isian.bagian.filter((_, j) => j !== i) })}>
                      <Trash2 aria-hidden className="size-4" /> Hapus
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Button
            varian="garis"
            ukuran="sm"
            className="mt-3"
            onClick={() => setIsian({ ...isian, bagian: [...isian.bagian, { nama: "", batas: "", tanpaBatas: false, wajib: true }] })}
          >
            <Plus aria-hidden className="size-4" /> Tambah Bagian
          </Button>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-sogan-800">Lampiran wajib</h3>
            <ul className="mt-2 space-y-2">
              {isian.lampiran.map((l, i) => (
                <li key={i} className="flex max-w-xl items-center gap-2">
                  <Input
                    aria-label={`Nama lampiran wajib ${i + 1}`}
                    value={l}
                    aria-invalid={tandai && kelengkapan.lampiran[i] ? true : undefined}
                    onChange={(e) => setIsian({ ...isian, lampiran: isian.lampiran.map((x, j) => (j === i ? e.target.value : x)) })}
                  />
                  <Button varian="hantu" ukuran="sm" onClick={() => setIsian({ ...isian, lampiran: isian.lampiran.filter((_, j) => j !== i) })}>
                    <Trash2 aria-hidden className="size-4" /> Hapus
                  </Button>
                </li>
              ))}
            </ul>
            <Button varian="garis" ukuran="sm" className="mt-3" onClick={() => setIsian({ ...isian, lampiran: [...isian.lampiran, ""] })}>
              <Plus aria-hidden className="size-4" /> Tambah Lampiran
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <Field
              label="Periode Berlaku"
              htmlFor="periode-berlaku"
              className="w-full max-w-sm"
              galat={tandai && kelengkapan.periode ? "Periode Berlaku wajib dipilih" : undefined}
            >
              <Select
                id="periode-berlaku"
                value={isian.periodeId}
                aria-invalid={tandai && kelengkapan.periode ? true : undefined}
                onChange={(e) => setIsian({ ...isian, periodeId: e.target.value })}
              >
                <option value="">Pilih periode</option>
                {periode.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </Select>
            </Field>
            <Button varian="utama" onClick={terbitkan} disabled={sibuk}>
              Terbitkan
            </Button>
          </div>
        </Panel>
      ) : null}

      <PanelPemandu kode="UC-01" judul="Mengelola templat proposal" langkah={LANGKAH_UC01} />
    </>
  );
}
