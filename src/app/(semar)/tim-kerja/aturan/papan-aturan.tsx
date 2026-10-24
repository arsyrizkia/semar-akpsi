"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState, useTransition } from "react";
import { Lock, Plus } from "lucide-react";
import { Alert, Badge, Button, Isian, LencanaStatus, Modal, ModalKonfirmasi, Pilihan, Table, TBody, TD, TH, THead, TR, beriTahu, kelasTombol } from "@/components/ui";
import { CONTOH_ATURAN_HITUNG, MASUKAN_BUTIR_KOSONG, type GalatButir, type MasukanButir } from "@/lib/aturan/parameter";
import { butirTerkunci, PESAN_TERKUNCI } from "@/lib/aturan/status";
import type { ButirTampil, TampilanAturan } from "@/lib/aturan/layanan";
import type { PeriodePilihan } from "@/lib/templat/layanan";
import { formatTanggal } from "@/lib/utils";
import { aksiNonaktifkan, aksiSimpanButir, aksiSimpanVersi } from "./aksi";

interface Props {
  skemaId: string;
  namaSkema: string;
  /** templat yang sedang dibuka di J-02a; ikut di tautan Uji pada Contoh supaya "kembali" mendarat di templat yang sama */
  templatId: string;
  /** periode templat ini; basis aturan yang ditampilkan adalah basis skema untuk periode itu */
  periode: PeriodePilihan;
  /** Arsip: hanya-baca (tanpa Ubah, Nonaktifkan, Tambah Butir, Simpan Versi) */
  hanyaBaca?: boolean;
  /** 4a: butir turunan templat dibuka dari modal M-04; J-02a mengalihkan ke tab Bagian/Lampiran asal butir */
  saatBukaAsal: (b: ButirTampil) => void;
  tampilan: TampilanAturan;
  bagianPilihan: string[];
  lampiranPilihan: string[];
  masaBerjalan: boolean;
  /** kode butir yang disorot lewat ?sorot=; boleh beberapa kode dipisah koma (butir turunan baru sesudah templat terbit) */
  sorotAwal: string | null;
}

type FilterStatusButir = "" | "Aktif" | "Draf" | "Perlu ditinjau" | "Nonaktif";
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

export function PapanAturan({ skemaId, namaSkema, templatId, periode, hanyaBaca = false, saatBukaAsal, tampilan, bagianPilihan, lampiranPilihan, masaBerjalan, sorotAwal }: Props) {
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  const { nyata, draf, butir } = tampilan;
  const dasar = draf ?? nyata;

  const [modalButir, setModalButir] = useState<ModalButir>(null); // M-02
  const [masukan, setMasukan] = useState<MasukanButir>(MASUKAN_BUTIR_KOSONG);
  const [galat, setGalat] = useState<GalatButir>({});
  const [galatModal, setGalatModal] = useState<string | null>(null);
  const [nonaktif, setNonaktif] = useState<ButirTampil | null>(null); // M-03
  const [galatNonaktif, setGalatNonaktif] = useState<string | null>(null);
  const [terkunci, setTerkunci] = useState<ButirTampil | null>(null); // M-04
  const [modalVersi, setModalVersi] = useState(false); // M-05
  const [tanggal, setTanggal] = useState("");
  const [galatVersi, setGalatVersi] = useState<string | null>(null);
  const [berhasilVersi, setBerhasilVersi] = useState<{ versi: number; tanggal: string } | null>(null);
  const [sorot, setSorot] = useState<string | null>(sorotAwal);
  const [filterJenis, setFilterJenis] = useState<"" | "deterministik" | "semantik">("");
  const [filterStatus, setFilterStatus] = useState<FilterStatusButir>(() => (butir.some((b) => b.kode === sorotAwal && b.status === "Nonaktif") ? "Nonaktif" : ""));
  const sorotSet = useMemo(() => new Set((sorot ?? "").split(",").filter(Boolean)), [sorot]);
  const sorotBanyak = sorotSet.size > 1; // beberapa butir baru: butir nonaktif berkode sama (versi templat lama) tidak ikut tersorot

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
    if (sorot) document.getElementById(`butir-${sorot.split(",")[0]}`)?.scrollIntoView({ block: "center" });
  }, [sorot]);

  const ubahMasukan = (ubah: Partial<MasukanButir>) => setMasukan((m) => ({ ...m, ...ubah }));

  function bukaTambah() {
    setGalat({});
    setGalatModal(null);
    setMasukan(MASUKAN_BUTIR_KOSONG);
    setModalButir({ mode: "tambah" });
  }

  function klikUbah(b: ButirTampil) {
    if (butirTerkunci(b.asal)) return setTerkunci(b); // 4a: panel butir tidak dibuka
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
        if (modalButir?.mode === "ubah") setTerkunci(modalButir.butir);
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
          const b = nonaktif;
          setNonaktif(null);
          return setTerkunci(b);
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

  const urlUji = `/tim-kerja/aturan/uji?skema=${skemaId}&periode=${periode.id}&templat=${templatId}`;
  const terlihat = butir.filter((b) => {
    const tersorot = sorotSet.has(b.kode) && !(sorotBanyak && b.status === "Nonaktif");
    if (tersorot) return true;
    if (filterJenis && b.jenis !== filterJenis) return false;
    return filterStatus ? b.status === filterStatus : b.status !== "Nonaktif";
  });
  const kelasDaftar = (b: ButirTampil) => (b.status === "Perlu ditinjau" ? "bg-peringatan-50" : b.status === "Nonaktif" ? "text-abu-600" : undefined);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-teks-redup">
          <span>
            {namaSkema}, {periode.nama}
          </span>
          {nyata ? <span>Basis aturan berlaku: versi {nyata.versi}, sejak {formatTanggal(nyata.tanggalBerlaku)}.</span> : <span>Belum ada basis aturan.</span>}
          {draf ? <Badge warna="netral">Versi {draf.versi} sedang disusun, belum berlaku</Badge> : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {dasar ? (
            <Link href={urlUji} className={kelasTombol("sekunder")}>
              Uji pada Contoh
            </Link>
          ) : (
            <Button varian="sekunder" disabled>
              Uji pada Contoh
            </Button>
          )}
          {hanyaBaca ? null : (
            <>
              <Button varian="sekunder" onClick={bukaTambah} disabled={sibuk}>
                <Plus aria-hidden className="size-4" /> Tambah Butir
              </Button>
              <Button onClick={() => (setGalatVersi(null), setModalVersi(true))} disabled={sibuk || !draf} title={draf ? undefined : "Belum ada perubahan untuk disimpan sebagai versi baru"}>
                Simpan Versi
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Pilihan label="Jenis" name="filter-jenis" className="w-44" value={filterJenis} onChange={(e) => setFilterJenis(e.target.value as typeof filterJenis)}>
          <option value="">Semua</option>
          <option value="deterministik">Deterministik</option>
          <option value="semantik">Semantik</option>
        </Pilihan>
        <Pilihan label="Status" name="filter-status" className="w-52" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterStatusButir)}>
          <option value="">Semua (tanpa Nonaktif)</option>
          <option value="Aktif">Aktif</option>
          <option value="Draf">Draf</option>
          <option value="Perlu ditinjau">Perlu ditinjau</option>
          <option value="Nonaktif">Nonaktif</option>
        </Pilihan>
      </div>

      {berhasilVersi ? (
        <Alert jenis="sukses" judul="Basis aturan versi baru tersimpan" className="mb-4">
          Basis aturan versi {berhasilVersi.versi} tersimpan dan berlaku mulai {formatTanggal(berhasilVersi.tanggal)}.
        </Alert>
      ) : null}

      <div>
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
            {terlihat.length === 0 ? (
              <TR>
                <TD colSpan={7} className="py-6 text-center text-teks-redup">
                  {butir.length === 0 ? "Belum ada butir cek. Terbitkan templat atau tekan \u201CTambah Butir\u201D." : "Tidak ada butir yang cocok dengan penyaring."}
                </TD>
              </TR>
            ) : null}
            {terlihat.map((b) => (
                <TR key={b.id} id={`butir-${b.kode}`} tersorot={sorotSet.has(b.kode) && !(sorotBanyak && b.status === "Nonaktif")} className={`scroll-mt-24 ${kelasDaftar(b) ?? ""}`}>
                  <TD className="whitespace-nowrap font-mono text-xs font-semibold">
                    <a href={`#butir-${b.kode}`} className="underline-offset-2 hover:underline" translate="no">
                      {b.kode}
                    </a>
                  </TD>
                  <TD className="min-w-48">{b.deskripsi}</TD>
                  <TD className="capitalize">{b.jenis}</TD>
                  <TD className="whitespace-nowrap">
                    {butirTerkunci(b.asal) ? (
                      <button type="button" onClick={() => saatBukaAsal(b)} className="inline-flex cursor-pointer items-center gap-1 underline-offset-2 hover:underline" title="Nilai butir ini terkunci; ubah lewat bagian asalnya di templat">
                        <Lock aria-hidden className="size-4 text-teks-redup" /> templat<span className="sr-only"> (terkunci)</span>
                      </button>
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
                    {b.status !== "Nonaktif" && !hanyaBaca ? (
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
      </div>

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
        buka={terkunci !== null}
        saatUbah={(b) => !b && setTerkunci(null)}
        judul="Butir Turunan Templat"
        kaki={
          <>
            <Button varian="sekunder" onClick={() => setTerkunci(null)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                const b = terkunci;
                setTerkunci(null);
                if (b) saatBukaAsal(b);
              }}
            >
              Buka Templat Proposal
            </Button>
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
