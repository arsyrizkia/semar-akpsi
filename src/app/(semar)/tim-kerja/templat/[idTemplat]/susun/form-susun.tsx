"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Download, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Alert, Badge, Bagian, Button, CegatTinggalkan, Input, KepalaHalaman, KotakCentang, ModalKonfirmasi, Pilihan, Table, TBody, TD, TH, THead, TR, beriTahu } from "@/components/ui";
import { periksaKelengkapan, type BarisBagianMentah } from "@/lib/templat/kelengkapan";
import { petunjukResmi, ringkasKetentuan } from "@/lib/templat/isian-substansi";
import { BAGIAN_DEPAN, lampiranBawaan, type KopTemplat, type LampiranTemplat } from "@/lib/templat/paket";
import { PESAN_LENGKAPI } from "@/lib/templat/status";
import type { PeriodePilihan, TemplatTampil } from "@/lib/templat/layanan";
import { aksiSimpanDraf, aksiTerbitkan } from "../../aksi";
import { ModalKetentuan, type KetentuanBisaDiganti } from "./modal-ketentuan";
import { ModalLampiran } from "./modal-lampiran";

interface Props {
  skemaId: string;
  namaSkema: string;
  templat: TemplatTampil;
  periode: PeriodePilihan[];
  masaBerjalan: boolean;
}

interface IsianForm {
  bagian: BarisBagianMentah[];
  lampiran: string[];
  /** templat lampiran, sejajar `lampiran` (nama disinkronkan saat dikirim) */
  lampiranDef: LampiranTemplat[];
  periodeId: string;
  kepala: { judulDokumen: string; subjudul: string; pengantar: string };
  kop: KopTemplat;
}

const dariTemplat = (t: TemplatTampil): IsianForm => ({
  bagian: t.bagian.map((b) => ({
    nama: b.nama,
    batas: b.batasKata == null ? "" : String(b.batasKata),
    tanpaBatas: b.batasKata == null,
    wajib: b.wajib,
    petunjuk: b.petunjuk ?? petunjukResmi(b.nama, b.batasKata) ?? "",
    jenisIsian: b.jenisIsian ?? "teks",
    jumlahButir: b.jumlahButir == null ? "" : String(b.jumlahButir),
    pemisah: b.pemisah ?? "",
    wajibGambar: b.wajibGambar ?? false,
    sitasiBernomor: b.sitasiBernomor ?? false,
    daftarPustaka: b.daftarPustaka ?? false,
  })),
  lampiran: [...t.lampiranWajib],
  lampiranDef: t.lampiranTemplat.map((l) => ({ ...l })),
  periodeId: t.periodeBerlakuId ?? "",
  kepala: { judulDokumen: t.kepala.judulDokumen, subjudul: t.kepala.subjudul ?? "", pengantar: t.kepala.pengantar ?? "" },
  kop: t.kop,
});

/** Chip ringkasan ketentuan satu baris isian (sama dengan kolom Ketentuan di J-02). */
function chipBaris(b: BarisBagianMentah): string[] {
  return ringkasKetentuan({
    urutan: 0,
    nama: b.nama,
    wajib: b.wajib,
    batasKata: b.tanpaBatas || !/^\d+$/.test(b.batas.trim()) ? null : Number(b.batas),
    jenisIsian: b.jenisIsian ?? "teks",
    jumlahButir: b.jumlahButir ? Number(b.jumlahButir) : null,
    pemisah: b.pemisah ?? null,
    wajibGambar: b.wajibGambar,
    sitasiBernomor: b.sitasiBernomor,
    daftarPustaka: b.daftarPustaka,
  });
}

const sidikIsian = (i: IsianForm) => JSON.stringify(i);

export function FormSusun({ skemaId, namaSkema, templat, periode, masaBerjalan }: Props) {
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  const [isian, setIsian] = useState<IsianForm>(() => dariTemplat(templat));
  const [tersimpan, setTersimpan] = useState(() => sidikIsian(dariTemplat(templat)));
  const [sudahCoba, setSudahCoba] = useState(false);
  const [modal, setModal] = useState(false);
  const [galatModal, setGalatModal] = useState<string | null>(null);
  const [ketentuanDi, setKetentuanDi] = useState<number | null>(null);
  const [lampiranDi, setLampiranDi] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const kotor = sidikIsian(isian) !== tersimpan;
  // peringatan sebelum meninggalkan halaman dengan perubahan yang belum disimpan
  useEffect(() => {
    if (!kotor) return;
    const jaga = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", jaga);
    return () => window.removeEventListener("beforeunload", jaga);
  }, [kotor]);

  const masukan = useMemo(
    () => ({
      bagian: isian.bagian,
      lampiran: isian.lampiran,
      periodeBerlakuId: isian.periodeId || null,
      kop: isian.kop,
      lampiranTemplat: isian.lampiran.map((nama, i) => ({ ...(isian.lampiranDef[i] ?? lampiranBawaan(nama)), nama: nama.trim() })),
    }),
    [isian],
  );
  const kelengkapan = useMemo(() => periksaKelengkapan(masukan), [masukan]);
  const tandai = sudahCoba && !kelengkapan.lengkap;

  const ubahKop = (ubah: Partial<KopTemplat>) => setIsian((s) => ({ ...s, kop: { ...s.kop, ...ubah } }));
  const ubahKetentuan = (i: number, k: KetentuanBisaDiganti) => ubahBaris(i, k);
  const ubahBaris = (i: number, ubah: Partial<BarisBagianMentah>) => setIsian((s) => ({ ...s, bagian: s.bagian.map((b, j) => (j === i ? { ...b, ...ubah } : b)) }));

  async function simpan(): Promise<boolean> {
    const r = await aksiSimpanDraf(skemaId, templat.id, masukan);
    if (!r.ok) {
      beriTahu.galat(r.pesan);
      return false;
    }
    setTersimpan(sidikIsian(isian));
    return true;
  }

  function simpanDraf() {
    mulai(async () => {
      if (await simpan()) beriTahu.sukses(`Draf versi ${templat.versi} tersimpan. Buka lagi kapan saja dari Templat Proposal.`);
    });
  }

  function unduhPratinjau() {
    mulai(async () => {
      if (!(await simpan())) return;
      // pratinjau dibangun dari draf yang baru disimpan; unduhan lewat tautan sementara agar nama berkas dari Content-Disposition dipakai
      const a = document.createElement("a");
      a.href = `/api/semar/templat/${templat.id}/unduh`;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      beriTahu.info("Pratinjau diunduh dari isian yang baru disimpan.");
    });
  }

  function klikTerbitkan() {
    setSudahCoba(true);
    if (!kelengkapan.lengkap) {
      // S-2: tanda ada di isian; fokus ke isian bertanda pertama
      setTimeout(() => {
        const el = ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        (el ?? ref.current?.querySelector<HTMLElement>('[role="alert"]'))?.scrollIntoView({ block: "center" });
        el?.focus({ preventScroll: true });
      }, 50);
      return;
    }
    setGalatModal(null);
    setModal(true);
  }

  function konfirmasiTerbitkan() {
    mulai(async () => {
      const r = await aksiTerbitkan(skemaId, templat.id, masukan);
      if (!r.ok) return setGalatModal(r.pesan);
      const h = r.hasil;
      if (h.hasil === "tidak-ditemukan") return setGalatModal(h.pesan);
      if (h.hasil === "tidak-lengkap") {
        setModal(false);
        return;
      }
      setTersimpan(sidikIsian(isian));
      setModal(false);
      // s.10 atau 9a tampil di J-02 sesudah modal ditutup
      const dasar = `/tim-kerja/templat?skema=${skemaId}&versi=${templat.id}`;
      router.push(h.hasil === "terbit" ? `${dasar}&hasil=terbit&jumlah=${h.jumlahButir}` : `${dasar}&hasil=draf`);
    });
  }

  const namaPeriode = periode.find((p) => p.id === isian.periodeId)?.nama ?? "-";

  return (
    <div ref={ref}>
      <CegatTinggalkan kotor={kotor} labelSimpan="Simpan Draf" saatSimpan={simpan} />
      <KepalaHalaman
        kode="J-02b"
        judul="Penyusunan Templat"
        keterangan={`${namaSkema} · Draf versi ${templat.versi}`}
        remah={[{ label: "Templat Proposal", href: `/tim-kerja/templat?skema=${skemaId}` }, { label: `Penyusunan Versi ${templat.versi}` }]}
        aksi={
          <>
            <Button varian="sekunder" onClick={unduhPratinjau} disabled={sibuk}>
              <Download aria-hidden className="size-4" />
              Unduh Pratinjau (.docx)
            </Button>
            <Button varian="sekunder" onClick={simpanDraf} disabled={sibuk || !kotor}>
              Simpan Draf
            </Button>
            <Button onClick={klikTerbitkan} disabled={sibuk}>
              Terbitkan
            </Button>
          </>
        }
      />

      <p aria-live="polite" className="-mt-3 mb-5 text-sm text-teks-redup">
        {kotor ? "Ada perubahan yang belum disimpan." : "Isian sama dengan draf yang tersimpan."}
      </p>

      {tandai ? (
        <Alert jenis="galat" className="mb-6">
          {PESAN_LENGKAPI}
        </Alert>
      ) : null}

      <Bagian judul="Kop dan Halaman yang Disertakan">
        <div className="text-sm">
          <p className="mb-1 text-xs font-semibold text-teks-redup">Format baku (hanya-baca)</p>
          <p className="font-semibold text-primer-900">{isian.kop.lembaga}</p>
          <p className="text-teks-redup">{isian.kop.alamat}</p>
          <p className="text-teks-redup">{isian.kop.laman}</p>
          <p className="mt-2 font-semibold text-primer-900">{isian.kepala.judulDokumen}</p>
          {isian.kepala.subjudul ? <p className="font-semibold text-primer-900">{isian.kepala.subjudul}</p> : null}
          <p className="mt-1 max-w-3xl text-teks-redup">Kotak &ldquo;{`PROTEKSI ISI PROPOSAL`}&rdquo;, judul &ldquo;{isian.kop.judulProposal}&rdquo;, kepala Isian Substansi, judul berhuruf A sampai H, dan tempat isian mengikuti contoh BIMA.</p>
        </div>
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-semibold text-primer-800">Bagian Depan yang Disertakan</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BAGIAN_DEPAN.map((d, i) => (
              <KotakCentang key={d.kunci} id={`depan-${d.kunci}`} label={`${i + 1}. ${d.judul}`} checked={isian.kop.depan[d.kunci]} onCheckedChange={(v) => ubahKop({ depan: { ...isian.kop.depan, [d.kunci]: v === true } })} />
            ))}
          </div>
        </fieldset>
      </Bagian>

      <Bagian judul="Bagian Templat">
        <Table>
          <THead>
            <TR>
              <TH angka>Urutan</TH>
              <TH>Nama Bagian</TH>
              <TH>Batas Kata</TH>
              <TH>Ketentuan</TH>
              <TH>Wajib</TH>
              <TH>
                <span className="sr-only">Aksi</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {isian.bagian.length === 0 ? (
              <TR>
                <TD colSpan={6} className={tandai && kelengkapan.tanpaBagian ? "py-4 text-center font-medium text-bata-600" : "py-4 text-center text-teks-redup"}>
                  Belum ada bagian. Tekan &ldquo;Tambah Bagian&rdquo;.
                </TD>
              </TR>
            ) : null}
            {isian.bagian.map((b, i) => {
              const galatNama = tandai && kelengkapan.bagian[i]?.nama;
              const galatBatas = tandai && kelengkapan.bagian[i]?.batas;
              return (
                <TR key={i}>
                  <TD angka>{i + 1}</TD>
                  <TD className="min-w-52">
                    <Input
                      aria-label={`Nama Bagian baris ${i + 1}`}
                      autoComplete="off"
                      name={`bagian-${i}`}
                      value={b.nama}
                      aria-invalid={galatNama ? true : undefined}
                      aria-describedby={galatNama ? `gn-${i}` : undefined}
                      onChange={(e) => ubahBaris(i, { nama: e.target.value })}
                    />
                    {galatNama ? (
                      <p id={`gn-${i}`} className="mt-1 text-xs font-medium text-bata-600">
                        {b.nama.trim() === "" ? "Nama bagian wajib diisi" : "Nama bagian sudah dipakai"}
                      </p>
                    ) : null}
                  </TD>
                  <TD className="min-w-56">
                    <div className="flex items-center gap-3">
                      <Input
                        aria-label={`Batas Kata baris ${i + 1}`}
                        autoComplete="off"
                        name={`batas-${i}`}
                        inputMode="numeric"
                        className="w-28"
                        value={b.tanpaBatas ? "" : b.batas}
                        disabled={b.tanpaBatas}
                        aria-invalid={galatBatas ? true : undefined}
                        aria-describedby={galatBatas ? `gb-${i}` : undefined}
                        onChange={(e) => ubahBaris(i, { batas: e.target.value })}
                      />
                      <KotakCentang id={`tb-${i}`} label="Tanpa batas kata" checked={b.tanpaBatas} onCheckedChange={(v) => ubahBaris(i, { tanpaBatas: v === true })} />
                    </div>
                    {galatBatas ? (
                      <p id={`gb-${i}`} className="mt-1 text-xs font-medium text-bata-600">
                        Isi angka bulat lebih dari 0, atau centang &ldquo;Tanpa batas kata&rdquo;
                      </p>
                    ) : null}
                  </TD>
                  <TD className="min-w-44">
                    <span className="flex flex-wrap gap-1">
                      {chipBaris(b).map((c) => (
                        <Badge key={c}>{c}</Badge>
                      ))}
                    </span>
                    {kelengkapan.bagian[i]?.ketentuan && tandai ? (
                      <p className="mt-1 text-xs font-medium text-bata-600">Ketentuan belum sah: buka Atur Ketentuan</p>
                    ) : null}
                  </TD>
                  <TD>
                    <KotakCentang id={`wj-${i}`} label="Wajib" checked={b.wajib} onCheckedChange={(v) => ubahBaris(i, { wajib: v === true })} />
                  </TD>
                  <TD>
                    <span className="flex flex-wrap justify-end gap-2">
                      <Button varian="sekunder" ukuran="sm" aria-label={`Atur Ketentuan baris ${i + 1}`} onClick={() => setKetentuanDi(i)}>
                        <SlidersHorizontal aria-hidden className="size-4" /> Atur Ketentuan
                      </Button>
                      <Button
                        varian="hantu"
                        ukuran="sm"
                        aria-label={`Hapus bagian baris ${i + 1}`}
                        onClick={() => setIsian((s) => ({ ...s, bagian: s.bagian.filter((_, j) => j !== i) }))}
                      >
                        <Trash2 aria-hidden className="size-4" /> Hapus
                      </Button>
                    </span>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
        <Button
          varian="sekunder"
          ukuran="sm"
          className="mt-3"
          onClick={() =>
            setIsian((s) => ({ ...s, bagian: [...s.bagian, { nama: "", batas: "", tanpaBatas: false, wajib: true, petunjuk: "", jenisIsian: "teks", jumlahButir: "", pemisah: "", wajibGambar: false, sitasiBernomor: false, daftarPustaka: false }] }))
          }
        >
          <Plus aria-hidden className="size-4" /> Tambah Bagian
        </Button>
      </Bagian>

      <Bagian judul="Lampiran Wajib">
        {isian.lampiran.length === 0 ? <p className="text-sm text-teks-redup">Belum ada lampiran wajib.</p> : null}
        <ul className="space-y-2">
          {isian.lampiran.map((l, i) => {
            const galat = tandai && kelengkapan.lampiran[i];
            return (
              <li key={i} className="max-w-3xl">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`Nama lampiran wajib ${i + 1}`}
                    autoComplete="off"
                    name={`lampiran-${i}`}
                    value={l}
                    aria-invalid={galat ? true : undefined}
                    aria-describedby={galat ? `gl-${i}` : undefined}
                    onChange={(e) => setIsian((s) => ({ ...s, lampiran: s.lampiran.map((x, j) => (j === i ? e.target.value : x)) }))}
                  />
                  <Badge className="shrink-0">{(isian.lampiranDef[i]?.jenis ?? "unggahan") === "formulir" ? "Formulir" : "Unggahan"}</Badge>
                  <Button varian="sekunder" ukuran="sm" aria-label={`Atur Templat Lampiran ${i + 1}`} onClick={() => setLampiranDi(i)}>
                    <SlidersHorizontal aria-hidden className="size-4" /> Atur Templat Lampiran
                  </Button>
                  <Button varian="hantu" ukuran="sm" aria-label={`Hapus lampiran ${i + 1}`} onClick={() => setIsian((s) => ({ ...s, lampiran: s.lampiran.filter((_, j) => j !== i), lampiranDef: s.lampiranDef.filter((_, j) => j !== i) }))}>
                    <Trash2 aria-hidden className="size-4" /> Hapus
                  </Button>
                </div>
                {galat ? (
                  <p id={`gl-${i}`} className="mt-1 text-xs font-medium text-bata-600">
                    Nama lampiran wajib diisi
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
        <Button varian="sekunder" ukuran="sm" className="mt-3" onClick={() => setIsian((s) => ({ ...s, lampiran: [...s.lampiran, ""], lampiranDef: [...s.lampiranDef, lampiranBawaan("")] }))}>
          <Plus aria-hidden className="size-4" /> Tambah Lampiran
        </Button>
      </Bagian>

      <Bagian judul="Periode Berlaku">
        <Pilihan
          label="Periode Berlaku"
          className="w-full max-w-sm"
          name="periode-berlaku"
          value={isian.periodeId}
          galat={tandai && kelengkapan.periode ? "Periode Berlaku wajib dipilih" : null}
          onChange={(e) => setIsian((s) => ({ ...s, periodeId: e.target.value }))}
        >
          <option value="">Pilih periode</option>
          {periode.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Pilihan>
      </Bagian>

      {ketentuanDi !== null && isian.bagian[ketentuanDi] ? (
        <ModalKetentuan buka indeks={ketentuanDi} bagian={isian.bagian} saatUbah={(b) => !b && setKetentuanDi(null)} saatTerapkan={(k) => ubahKetentuan(ketentuanDi, k)} />
      ) : null}
      {lampiranDi !== null && isian.lampiran[lampiranDi] !== undefined ? (
        <ModalLampiran
          buka
          nilai={{ ...(isian.lampiranDef[lampiranDi] ?? lampiranBawaan(isian.lampiran[lampiranDi])), nama: isian.lampiran[lampiranDi] }}
          saatUbah={(b) => !b && setLampiranDi(null)}
          saatTerapkan={(l) => setIsian((s) => ({ ...s, lampiranDef: s.lampiran.map((_, j) => (j === lampiranDi ? l : (s.lampiranDef[j] ?? lampiranBawaan(s.lampiran[j])))) }))}
        />
      ) : null}

      <ModalKonfirmasi
        kode="M-01"
        buka={modal}
        saatUbah={(b) => !sibuk && setModal(b)}
        judul="Konfirmasi Terbitkan"
        labelKonfirmasi="Terbitkan"
        memuat={sibuk}
        galat={galatModal}
        saatKonfirmasi={konfirmasiTerbitkan}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-teks-redup">Skema</dt>
          <dd className="font-semibold">{namaSkema}</dd>
          <dt className="text-teks-redup">Versi</dt>
          <dd className="font-semibold">{templat.versi}</dd>
          <dt className="text-teks-redup">Periode Berlaku</dt>
          <dd className="font-semibold">{namaPeriode}</dd>
          <dt className="text-teks-redup">Bagian</dt>
          <dd className="angka font-semibold">{isian.bagian.length}</dd>
          <dt className="text-teks-redup">Lampiran Wajib</dt>
          <dd className="angka font-semibold">{isian.lampiran.length}</dd>
        </dl>
        <p className="mt-3 text-teks-redup">
          {masaBerjalan
            ? "Masa pengusulan sedang berjalan: templat akan disimpan sebagai draf untuk periode berikutnya; templat yang berlaku tidak berubah dan butir cek belum diturunkan."
            : `Templat versi ${templat.versi} menggantikan templat yang berlaku dan butir cek turunannya dibuat sebagai draf.`}
        </p>
      </ModalKonfirmasi>
    </div>
  );
}
