"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState, useTransition } from "react";
import { Lock, Plus } from "lucide-react";
import { Alert, Badge, Bagian, Button, Isian, KepalaHalaman, KotakCentang, LencanaStatus, Modal, ModalKonfirmasi, Pilihan, Table, TBody, TD, TH, THead, TR, beriTahu, kelasTombol } from "@/components/ui";
import { CONTOH_ATURAN_HITUNG, MASUKAN_BUTIR_KOSONG, type GalatButir, type MasukanButir } from "@/lib/aturan/parameter";
import { butirTerkunci, PESAN_TERKUNCI } from "@/lib/aturan/status";
import type { ButirTampil, TampilanAturan } from "@/lib/aturan/layanan";
import type { PeriodePilihan, SkemaPilihan } from "@/lib/templat/layanan";
import { formatTanggal } from "@/lib/utils";
import { aksiNonaktifkan, aksiSimpanButir, aksiSimpanVersi } from "./aksi";

interface Props {
  skema: SkemaPilihan[];
  skemaId: string;
  periodeDaftar: PeriodePilihan[];
  periode: PeriodePilihan;
  tampilan: TampilanAturan;
  bagianPilihan: string[];
  lampiranPilihan: string[];
  masaBerjalan: boolean;
  /** kode butir yang disorot lewat ?sorot= */
  sorotAwal: string | null;
}

type ModalButir = { mode: "tambah" } | { mode: "ubah"; butir: ButirTampil } | null;

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

/** Setelah galat tampil, fokus ke isian bertanda pertama (menunggu render selesai). */
const fokusGalatPertama = (selektor: string) => setTimeout(() => document.querySelector<HTMLElement>(`${selektor} [aria-invalid="true"]`)?.focus(), 50);

const kodeDariHash = (h: string) => (h.startsWith("#butir-") ? decodeURIComponent(h.slice(7)) : null);

export function PapanAturan({ skema, skemaId, periodeDaftar, periode, tampilan, bagianPilihan, lampiranPilihan, masaBerjalan, sorotAwal }: Props) {
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  const { nyata, draf, butir } = tampilan;
  const dasar = draf ?? nyata;
  const namaSkema = skema.find((s) => s.id === skemaId)?.namaSkema ?? "";

  const [modalButir, setModalButir] = useState<ModalButir>(null); // M-02
  const [masukan, setMasukan] = useState<MasukanButir>(MASUKAN_BUTIR_KOSONG);
  const [galat, setGalat] = useState<GalatButir>({});
  const [galatModal, setGalatModal] = useState<string | null>(null);
  const [nonaktif, setNonaktif] = useState<ButirTampil | null>(null); // M-03
  const [galatNonaktif, setGalatNonaktif] = useState<string | null>(null);
  const [terkunci, setTerkunci] = useState(false); // M-04
  const [modalVersi, setModalVersi] = useState(false); // M-05
  const [tanggal, setTanggal] = useState("");
  const [galatVersi, setGalatVersi] = useState<string | null>(null);
  const [berhasilVersi, setBerhasilVersi] = useState<{ versi: number; tanggal: string } | null>(null);
  const [sorot, setSorot] = useState<string | null>(sorotAwal);
  const [tampilNonaktif, setTampilNonaktif] = useState(() => butir.some((b) => b.kode === sorotAwal && b.status === "Nonaktif"));

  // kode butir dapat ditaut lewat #butir-KODE: sorot barisnya dan gulir ke sana
  useEffect(() => {
    const dariUrl = () => {
      const k = kodeDariHash(window.location.hash);
      if (k) setSorot(k);
    };
    dariUrl();
    window.addEventListener("hashchange", dariUrl);
    return () => window.removeEventListener("hashchange", dariUrl);
  }, []);
  useEffect(() => {
    if (sorot) document.getElementById(`butir-${sorot}`)?.scrollIntoView({ block: "center" });
  }, [sorot]);

  const ubahMasukan = (ubah: Partial<MasukanButir>) => setMasukan((m) => ({ ...m, ...ubah }));

  function bukaTambah() {
    setGalat({});
    setGalatModal(null);
    setMasukan(MASUKAN_BUTIR_KOSONG);
    setModalButir({ mode: "tambah" });
  }

  function klikUbah(b: ButirTampil) {
    if (butirTerkunci(b.asal)) return setTerkunci(true); // 4a: panel butir tidak dibuka
    setGalat({});
    setGalatModal(null);
    setMasukan(dariButir(b));
    setModalButir({ mode: "ubah", butir: b });
  }

  function simpanButir(e: React.FormEvent) {
    e.preventDefault();
    setGalatModal(null);
    mulai(async () => {
      const r = await aksiSimpanButir(skemaId, modalButir?.mode === "ubah" ? modalButir.butir.id : null, masukan);
      if (r.ok && "butirId" in r) {
        // setter dan refresh dalam satu transisi: pesan dan data segar tampil serentak
        startTransition(() => {
          setModalButir(null);
          beriTahu.sukses(r.baru ? `Butir ${r.kode} ditambahkan pada versi yang sedang disusun.` : `Butir ${r.kode} diperbarui.`);
          setSorot(r.kode);
          router.refresh();
        });
        return;
      }
      if ("terkunci" in r && r.terkunci) {
        setModalButir(null);
        setTerkunci(true);
        return;
      }
      if ("galat" in r) setGalat(r.galat);
      if ("pesan" in r && r.pesan) setGalatModal(r.pesan);
      fokusGalatPertama("#form-butir");
    });
  }

  function konfirmasiNonaktif() {
    if (!nonaktif) return;
    setGalatNonaktif(null);
    mulai(async () => {
      const r = await aksiNonaktifkan(skemaId, nonaktif.id);
      if (!r.ok) {
        if ("terkunci" in r && r.terkunci) {
          setNonaktif(null);
          return setTerkunci(true);
        }
        return setGalatNonaktif(r.pesan);
      }
      startTransition(() => {
        setNonaktif(null);
        beriTahu.sukses(`Butir ${r.kode} dinonaktifkan pada versi yang sedang disusun.`);
        router.refresh();
      });
    });
  }

  function simpanVersi(e: React.FormEvent) {
    e.preventDefault();
    setGalatVersi(null);
    mulai(async () => {
      const r = await aksiSimpanVersi(skemaId, periode.id, tanggal);
      if (!r.ok) {
        // 8a: ditolak di dalam modal, basis aturan tidak berubah
        setGalatVersi(r.pesan);
        fokusGalatPertama("#form-versi");
        return;
      }
      if ("versi" in r) {
        // pesan "tersimpan" dipasang bersama data segar (kepala tabel versi baru), bukan lebih dulu
        startTransition(() => {
          setModalVersi(false);
          setBerhasilVersi({ versi: r.versi, tanggal: r.tanggalBerlaku });
          setTanggal("");
          beriTahu.sukses(`Basis aturan versi ${r.versi} tersimpan.`);
          router.refresh();
        });
      }
    });
  }

  const urlTemplat = `/tim-kerja/templat?skema=${skemaId}`;
  const urlUji = `/tim-kerja/aturan/uji?skema=${skemaId}&periode=${periode.id}`;
  const jumlahNonaktif = butir.filter((b) => b.status === "Nonaktif").length;
  const kelasDaftar = (b: ButirTampil) => (b.status === "Perlu ditinjau" ? "bg-peringatan-50" : b.status === "Nonaktif" ? "text-abu-600" : undefined);

  return (
    <>
      <KepalaHalaman
        kode="J-03"
        judul="Aturan Pemeriksaan"
        keterangan="Butir cek per skema dan periode seleksi."
        remah={[{ label: "Aturan Pemeriksaan" }]}
        aksi={
          <>
            {dasar ? (
              <Link href={urlUji} className={kelasTombol("sekunder")}>
                Uji pada Contoh
              </Link>
            ) : (
              <Button varian="sekunder" disabled>
                Uji pada Contoh
              </Button>
            )}
            <Button varian="sekunder" onClick={bukaTambah} disabled={sibuk}>
              <Plus aria-hidden className="size-4" /> Tambah Butir
            </Button>
            <Button onClick={() => (setGalatVersi(null), setModalVersi(true))} disabled={sibuk || !draf} title={draf ? undefined : "Belum ada perubahan untuk disimpan sebagai versi baru"}>
              Simpan Versi
            </Button>
          </>
        }
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-4">
        <Pilihan label="Skema Pendanaan" name="skema" defaultValue={skemaId} className="w-full max-w-xs">
          {skema.map((s) => (
            <option key={s.id} value={s.id}>
              {s.namaSkema}
            </option>
          ))}
        </Pilihan>
        <Pilihan label="Periode Seleksi" name="periode" defaultValue={periode.id} className="w-full max-w-md">
          {periodeDaftar.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Pilihan>
        <Button type="submit" varian="sekunder">
          Tampilkan
        </Button>
      </form>

      {berhasilVersi ? (
        <Alert jenis="sukses" judul="Basis aturan versi baru tersimpan" className="mb-6">
          Basis aturan versi {berhasilVersi.versi} tersimpan dan berlaku mulai {formatTanggal(berhasilVersi.tanggal)}.
        </Alert>
      ) : null}

      <Bagian
        judul={`Butir Cek ${namaSkema}`}
        aksi={
          jumlahNonaktif > 0 ? (
            <KotakCentang id="tampil-nonaktif" label={`Tampilkan butir nonaktif (${jumlahNonaktif})`} checked={tampilNonaktif} onCheckedChange={(v) => setTampilNonaktif(v === true)} />
          ) : undefined
        }
      >
        <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-teks-redup">
          {nyata ? (
            <span>
              Basis aturan berlaku: versi {nyata.versi}, sejak {formatTanggal(nyata.tanggalBerlaku)}.
            </span>
          ) : (
            <span>Skema ini belum memiliki basis aturan.</span>
          )}
          {draf ? <Badge warna="netral">Versi {draf.versi} sedang disusun, belum berlaku</Badge> : null}
          <Link href={urlTemplat} className="font-semibold text-primer-800 underline underline-offset-2">
            Templat Proposal {namaSkema}
          </Link>
        </p>

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
                <TD colSpan={7} className="py-6 text-center text-teks-redup">
                  Belum ada butir cek. Terbitkan templat di Templat Proposal atau tekan &ldquo;Tambah Butir&rdquo;.
                </TD>
              </TR>
            ) : null}
            {butir
              .filter((b) => tampilNonaktif || b.status !== "Nonaktif" || b.kode === sorot)
              .map((b) => (
                <TR key={b.id} id={`butir-${b.kode}`} tersorot={sorot === b.kode} className={`scroll-mt-24 ${kelasDaftar(b) ?? ""}`}>
                  <TD className="whitespace-nowrap font-mono text-xs font-semibold">
                    <a href={`#butir-${b.kode}`} className="underline-offset-2 hover:underline" translate="no">
                      {b.kode}
                    </a>
                  </TD>
                  <TD className="min-w-48">{b.deskripsi}</TD>
                  <TD className="capitalize">{b.jenis}</TD>
                  <TD className="whitespace-nowrap">
                    {butirTerkunci(b.asal) ? (
                      <Link href={urlTemplat} className="inline-flex items-center gap-1 underline-offset-2 hover:underline" title="Nilai butir ini terkunci; ubah lewat Templat Proposal">
                        <Lock aria-hidden className="size-4 text-teks-redup" /> templat<span className="sr-only"> (terkunci)</span>
                      </Link>
                    ) : (
                      "manual"
                    )}
                  </TD>
                  <TD className="min-w-56 max-w-md text-xs text-primer-800">{b.ringkasan}</TD>
                  <TD>
                    <LencanaStatus status={b.status} />
                    {b.ditandaiPemantauan ? (
                      <Link href={`/tim-kerja/pemantauan?periode=${periode.id}&skema=${skemaId}&butir=${encodeURIComponent(b.kode)}`} className="mt-1 block text-xs text-primer-800 underline underline-offset-2">
                        ditandai di Pemantauan
                      </Link>
                    ) : null}
                  </TD>
                  <TD className="whitespace-nowrap">
                    {b.status !== "Nonaktif" ? (
                      <span className="flex justify-end gap-1">
                        <Button varian="sekunder" ukuran="sm" onClick={() => klikUbah(b)} disabled={sibuk} aria-label={`Ubah butir ${b.kode}`}>
                          Ubah
                        </Button>
                        {!butirTerkunci(b.asal) ? (
                          <Button
                            varian="hantu"
                            ukuran="sm"
                            className="text-bata-700 hover:bg-bata-100"
                            onClick={() => (setGalatNonaktif(null), setNonaktif(b))}
                            disabled={sibuk}
                            aria-label={`Nonaktifkan butir ${b.kode}`}
                          >
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
      </Bagian>

      {/* M-02 Form Butir (Tambah/Ubah) */}
      <Modal
        kode="M-02"
        ukuran="lg"
        buka={modalButir !== null}
        saatUbah={(b) => !sibuk && !b && setModalButir(null)}
        judul={modalButir?.mode === "ubah" ? `Ubah Butir ${modalButir.butir.kode}` : "Tambah Butir"}
        kaki={
          <>
            <Button varian="sekunder" onClick={() => setModalButir(null)} disabled={sibuk}>
              Batal
            </Button>
            <Button type="submit" form="form-butir" memuat={sibuk}>
              Simpan Butir
            </Button>
          </>
        }
      >
        <form id="form-butir" onSubmit={simpanButir} noValidate className="grid gap-4 md:grid-cols-2">
          {galatModal ? (
            <p role="alert" className="rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 font-medium text-bata-700 md:col-span-2">
              {galatModal}
            </p>
          ) : null}
          <Isian label="Kode" name="kode" autoComplete="off" spellCheck={false} wajib value={masukan.kode} disabled={modalButir?.mode === "ubah"} galat={galat.kode} onChange={(e) => ubahMasukan({ kode: e.target.value })} />
          <Pilihan label="Jenis" name="jenis" wajib value={masukan.jenis} disabled={modalButir?.mode === "ubah"} galat={galat.jenis} onChange={(e) => ubahMasukan({ jenis: e.target.value as MasukanButir["jenis"] })}>
            <option value="">Pilih jenis</option>
            <option value="deterministik">Deterministik</option>
            <option value="semantik">Semantik</option>
          </Pilihan>
          <Isian label="Deskripsi" name="deskripsi" autoComplete="off" wajib className="md:col-span-2" value={masukan.deskripsi} galat={galat.deskripsi} onChange={(e) => ubahMasukan({ deskripsi: e.target.value })} />

          {masukan.jenis === "deterministik" ? (
            <>
              <Isian
                label="Aturan Hitung"
                name="aturan-hitung"
                autoComplete="off"
                wajib
                className="md:col-span-2"
                value={masukan.aturanHitung}
                galat={galat.aturanHitung}
                petunjuk={CONTOH_ATURAN_HITUNG}
                onChange={(e) => ubahMasukan({ aturanHitung: e.target.value })}
              />
              <Pilihan
                label="Bagian yang Diperiksa"
                name="bagian"
                value={masukan.bagian}
                galat={galat.bagian}
                petunjuk="Hanya perlu untuk aturan yang bergantung pada satu bagian, misalnya diagram alir atau bagian terisi."
                onChange={(e) => ubahMasukan({ bagian: e.target.value })}
              >
                <option value="">(tidak ada)</option>
                {bagianPilihan.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Pilihan>
            </>
          ) : null}

          {masukan.jenis === "semantik" ? (
            <>
              <Isian label="Pertanyaan Pemeriksaan" name="pertanyaan" multibaris wajib className="md:col-span-2" value={masukan.pertanyaan} galat={galat.pertanyaan} onChange={(e) => ubahMasukan({ pertanyaan: e.target.value })} />
              <Isian label="Contoh Jawaban" name="contoh-jawaban" multibaris className="md:col-span-2" value={masukan.contohJawaban} onChange={(e) => ubahMasukan({ contohJawaban: e.target.value })} />
              <Pilihan label="Bagian yang Diperiksa" name="bagian" wajib value={masukan.bagian} galat={galat.bagian} onChange={(e) => ubahMasukan({ bagian: e.target.value })}>
                <option value="">Pilih bagian</option>
                {bagianPilihan.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Pilihan>
              <Pilihan label="Lampiran yang Diperiksa" name="lampiran" petunjuk="Kosongkan bila yang diperiksa adalah teks bagian." value={masukan.lampiran} onChange={(e) => ubahMasukan({ lampiran: e.target.value })}>
                <option value="">(tidak ada)</option>
                {lampiranPilihan.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Pilihan>
            </>
          ) : null}
        </form>
      </Modal>

      {/* M-03 Konfirmasi Nonaktifkan */}
      <ModalKonfirmasi
        kode="M-03"
        buka={nonaktif !== null}
        saatUbah={(b) => !sibuk && !b && setNonaktif(null)}
        judul="Konfirmasi Nonaktifkan"
        labelKonfirmasi="Nonaktifkan"
        bahaya
        memuat={sibuk}
        galat={galatNonaktif}
        saatKonfirmasi={konfirmasiNonaktif}
      >
        {nonaktif ? (
          <>
            <p>
              Butir <span className="font-mono font-semibold" translate="no">{nonaktif.kode}</span>: {nonaktif.deskripsi}
            </p>
            <p className="mt-2 text-teks-redup">
              Butir tidak lagi dipakai pada pemeriksaan sesudah versi yang sedang disusun disimpan. Versi yang berlaku sekarang tidak berubah.
            </p>
          </>
        ) : null}
      </ModalKonfirmasi>

      {/* M-04 Butir turunan templat (4a) */}
      <Modal
        kode="M-04"
        ukuran="sm"
        buka={terkunci}
        saatUbah={setTerkunci}
        judul="Butir Turunan Templat"
        kaki={
          <>
            <Button varian="sekunder" onClick={() => setTerkunci(false)}>
              Tutup
            </Button>
            <Link href={urlTemplat} className={kelasTombol("utama")}>
              Buka Templat Proposal
            </Link>
          </>
        }
      >
        <p>{PESAN_TERKUNCI}</p>
      </Modal>

      {/* M-05 Simpan Versi (8a ditolak di dalam modal) */}
      <Modal
        kode="M-05"
        buka={modalVersi}
        saatUbah={(b) => !sibuk && setModalVersi(b)}
        judul="Simpan Versi"
        kaki={
          <>
            <Button varian="sekunder" onClick={() => setModalVersi(false)} disabled={sibuk}>
              Batal
            </Button>
            <Button type="submit" form="form-versi" memuat={sibuk}>
              Simpan Versi
            </Button>
          </>
        }
      >
        <form id="form-versi" onSubmit={simpanVersi} noValidate className="space-y-4">
          <p className="text-teks-redup">
            Basis aturan versi {draf?.versi ?? "baru"} untuk {namaSkema}, periode {periode.nama}.
          </p>
          <Isian
            label="Tanggal Berlaku"
            name="tanggal-berlaku"
            type="date"
            wajib
            autoComplete="off"
            value={tanggal}
            galat={galatVersi}
            petunjuk={
              masaBerjalan
                ? `Masa pengusulan sedang berjalan (${formatTanggal(periode.tanggalBuka)} sampai ${formatTanggal(periode.tanggalTutup)}): pilih tanggal di luar rentang itu.`
                : undefined
            }
            onChange={(e) => setTanggal(e.target.value)}
          />
        </form>
      </Modal>
    </>
  );
}
