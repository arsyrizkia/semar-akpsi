"use client";

import { TombolLihatTemplat } from "@/components/templat/pratinjau-templat";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Download } from "lucide-react";
import { Alert, Button, CegatTinggalkan, KepalaHalaman, LencanaStatus, ModalKonfirmasi, Pilihan, Tabs, TabsContent, TabsList, TabsTrigger, TombolUnduh, beriTahu } from "@/components/ui";
import { mentahKeBagian, periksaKelengkapan } from "@/lib/templat/kelengkapan";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import { dapatDisunting, dapatSusunVersiBaru, masaBerjalanUntuk, statusTampil, TAB_TEMPLAT, urlTabAturan, type TabTemplat } from "@/lib/templat/daftar";
import { PESAN_DRAF_9A, PESAN_LENGKAPI } from "@/lib/templat/status";
import type { PeriodePilihan, TemplatTampil } from "@/lib/templat/layanan";
import type { TampilanAturan } from "@/lib/aturan/layanan";
import { formatAngka, formatTanggal } from "@/lib/utils";
import { PapanAturan } from "../../aturan/papan-aturan";
import type { ContohUji } from "../../aturan/uji-contoh";
import { aksiSimpanDraf, aksiSusunVersiBaru, aksiTerbitkan } from "../aksi";
import { BAGIAN_BARU, dariTemplat, sidikIsian, type IsianForm } from "./isian";
import { ModalKetentuan } from "./modal-ketentuan";
import { TabBagian } from "./tab-bagian";

interface Props {
  skemaId: string;
  namaSkema: string;
  templat: TemplatTampil;
  periode: PeriodePilihan[];
  periodeBerjalanId: string | null;
  sakelarBerjalan: boolean;
  adaDraf: boolean;
  tabAwal: TabTemplat;
  aturan: { periode: PeriodePilihan; tampilan: TampilanAturan; bagianPilihan: string[]; contohUji: ContohUji[] } | null;
  sorotAwal: string | null;
  hasil: { jenis: "terbit" | "draf"; jumlah: number | null; det: number | null; sem: number | null; baru: string | null } | null;
}

/**
 * J-02a Rincian Templat: kepala (breadcrumb, status, periode, tombol menurut status) dan dua tab (Bagian, Aturan Pemeriksaan). Halaman depan dan lampiran milik BIMA. Isian disunting hanya saat Draf;
 * Aktif dan Arsip hanya-baca, perubahan lewat versi baru. Keadaan isian dipegang di sini supaya bersama bagi tab dan kepala.
 */
export function RincianTemplat({ skemaId, namaSkema, templat, periode, periodeBerjalanId, sakelarBerjalan, adaDraf, tabAwal, aturan, sorotAwal, hasil }: Props) {
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  const bisaSunting = dapatDisunting(templat.status);
  const [tab, setTab] = useState<TabTemplat>(tabAwal);
  const [isian, setIsian] = useState<IsianForm>(() => dariTemplat(templat));
  const [tersimpan, setTersimpan] = useState(() => sidikIsian(dariTemplat(templat)));
  const [sudahCoba, setSudahCoba] = useState(false);
  const [modal, setModal] = useState(false);
  const [galatModal, setGalatModal] = useState<string | null>(null);
  const [ketentuanDi, setKetentuanDi] = useState<number | null>(null);
  const [bagianBaru, setBagianBaru] = useState(false);
  const [sorotAturan, setSorotAturan] = useState<string | null>(sorotAwal);
  const [fokusBagian, setFokusBagian] = useState<string | null>(null);
  const [ubahRingkas, setUbahRingkas] = useState(true);
  const ref = useRef<HTMLDivElement | null>(null);

  const kotor = bisaSunting && sidikIsian(isian) !== tersimpan;
  useEffect(() => {
    if (!kotor) return;
    const jaga = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", jaga);
    return () => window.removeEventListener("beforeunload", jaga);
  }, [kotor]);

  const masukan = useMemo(
    () => ({
      bagian: isian.bagian,
      periodeBerlakuId: isian.periodeId || null,
    }),
    [isian],
  );
  const kelengkapan = useMemo(() => periksaKelengkapan(masukan), [masukan]);
  const turunan = useMemo(() => turunkanButirDariTemplat(isian.bagian.filter((b) => b.nama.trim() !== "").map(mentahKeBagian)), [isian]);
  const jumlahSem = turunan.filter((b) => b.jenis === "semantik").length;
  const jumlahDet = turunan.length - jumlahSem;
  const tandai = sudahCoba && !kelengkapan.lengkap;
  // 9a berlaku hanya bila periode berlaku templat ini adalah periode yang sedang berjalan
  const masaBerjalan = masaBerjalanUntuk(sakelarBerjalan, isian.periodeId || null, periodeBerjalanId);

  function pilihTab(t: TabTemplat) {
    setTab(t);
    const u = new URL(window.location.href);
    u.searchParams.set("tab", t);
    window.history.replaceState(null, "", u);
  }

  const gantiBaris = (i: number, baris: IsianForm["bagian"][number]) => setIsian((s) => ({ ...s, bagian: s.bagian.map((b, j) => (j === i ? baris : b)) }));

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
      // S-2: tanda ada di isian; pindah ke tab yang memuat isian bertanda lalu gulir ke sana
      const perluBagian = kelengkapan.tanpaBagian || kelengkapan.bagian.some((b) => b?.nama || b?.batas || b?.ketentuan);
      if (perluBagian) setTab("bagian");
      setTimeout(() => (ref.current?.querySelector<HTMLElement>('[data-tanda="ya"]') ?? ref.current?.querySelector<HTMLElement>('[role="alert"]'))?.scrollIntoView({ block: "center" }), 80);
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
      // s.10 atau 9a tampil di rincian sesudah modal ditutup
      const dasar = `/tim-kerja/templat/${templat.id}?tab=bagian`;
      router.push(h.hasil === "terbit" ? `${dasar}&hasil=terbit&jumlah=${h.jumlahButir}&det=${h.jumlahDeterministik}&sem=${h.jumlahSemantik}&baru=${encodeURIComponent(h.kodeBaru.join(","))}` : `${dasar}&hasil=draf`);
    });
  }

  function susunVersiBaru() {
    mulai(async () => {
      const r = await aksiSusunVersiBaru(skemaId, templat.periodeBerlakuId);
      if (!r.ok) {
        beriTahu.galat(r.pesan);
        return;
      }
      router.push(`/tim-kerja/templat/${r.templat.id}`);
    });
  }

  /** "Atur aturan bagian ini" di M-12 ringkas: tab Aturan Pemeriksaan tersaring dan tersorot untuk bagian itu. */
  function aturAturanBagian(nama: string) {
    setFokusBagian(nama);
    pilihTab("aturan");
  }

  const namaPeriode = periode.find((p) => p.id === isian.periodeId)?.nama ?? "-";
  const urlUnduh = `/api/semar/templat/${templat.id}/unduh`;
  const status = statusTampil(templat.status);
  const galatPeriode = tandai && kelengkapan.periode ? "Periode Berlaku wajib dipilih" : null;

  return (
    <div ref={ref}>
      {bisaSunting ? <CegatTinggalkan kotor={kotor} labelSimpan="Simpan Draf" saatSimpan={simpan} /> : null}
      <KepalaHalaman
        kode="J-02a"
        judul={`${namaSkema} versi ${templat.versi}`}
        remah={[{ label: "Templat Proposal", href: "/tim-kerja/templat" }, { label: `${namaSkema} versi ${templat.versi}` }]}
        aksi={
          bisaSunting ? (
            <>
              <TombolLihatTemplat alamat={urlUnduh} judul={`Pratinjau ${namaSkema} versi ${templat.versi}`} label="Lihat Pratinjau" sebelumBuka={simpan} disabled={sibuk} />
              <Button varian="sekunder" onClick={unduhPratinjau} disabled={sibuk}>
                <Download aria-hidden className="size-4" />
                Unduh Pratinjau (.docx)
              </Button>
              {kotor ? (
                <Button varian="sekunder" onClick={simpanDraf} disabled={sibuk}>
                  Simpan Draf
                </Button>
              ) : null}
              <Button onClick={klikTerbitkan} disabled={sibuk}>
                Terbitkan
              </Button>
            </>
          ) : (
            <>
              <TombolLihatTemplat alamat={urlUnduh} judul={`${namaSkema} versi ${templat.versi}`} />
              <TombolUnduh href={urlUnduh}>Unduh Templat (.docx)</TombolUnduh>
              {dapatSusunVersiBaru(templat.status, adaDraf) ? (
                <Button onClick={susunVersiBaru} memuat={sibuk}>
                  Susun Versi Baru
                </Button>
              ) : null}
            </>
          )
        }
      />

      <div className="-mt-2 mb-5 flex flex-wrap items-end gap-x-5 gap-y-2 text-sm">
        <LencanaStatus status={status} />
        {bisaSunting ? (
          <Pilihan label="Periode Berlaku" name="periode-berlaku" className="w-full max-w-xs" value={isian.periodeId} galat={galatPeriode} onChange={(e) => setIsian((s) => ({ ...s, periodeId: e.target.value }))}>
            <option value="">Pilih periode</option>
            {periode.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </Pilihan>
        ) : (
          <span className="text-teks-redup">
            Periode berlaku: <strong className="font-semibold text-primer-900">{templat.periodeBerlakuNama ?? "belum ditetapkan"}</strong>
          </span>
        )}
        {templat.diterbitkanPada ? <span className="text-teks-redup">Terbit {formatTanggal(templat.diterbitkanPada)}</span> : null}
        {bisaSunting ? (
          <span aria-live="polite" className="text-teks-redup">
            {kotor ? "Ada perubahan yang belum disimpan." : "Sama dengan draf tersimpan."}
          </span>
        ) : null}
      </div>

      {tandai ? (
        <Alert jenis="galat" className="mb-4">
          {PESAN_LENGKAPI}
        </Alert>
      ) : null}
      {hasil?.jenis === "terbit" && templat.status === "Terbit" ? (
        <Alert jenis="sukses" judul={`Templat versi ${templat.versi} telah terbit`} className="mb-4">
          <p>
            {hasil.jumlah !== null
              ? hasil.det !== null && hasil.sem !== null
                ? `${formatAngka(hasil.det)} butir deterministik dan ${formatAngka(hasil.sem)} butir semantik dibuat sebagai draf dari templat ini. `
                : `${formatAngka(hasil.jumlah)} butir cek draf dibuat dari templat ini. `
              : ""}
            Kelola butir itu di tab Aturan Pemeriksaan, lalu simpan versi basis aturannya agar berlaku.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              ukuran="sm"
              onClick={() => {
                window.history.replaceState(null, "", urlTabAturan(templat.id, { sorot: hasil.baru }));
                setSorotAturan(hasil.baru);
                setTab("aturan");
              }}
            >
              Buka Aturan Pemeriksaan
            </Button>
          </div>
        </Alert>
      ) : null}
      {hasil?.jenis === "draf" && templat.status === "Draf" ? (
        <Alert jenis="peringatan" className="mb-4">
          <p>{PESAN_DRAF_9A}</p>
        </Alert>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => pilihTab(v as TabTemplat)}>
        <TabsList aria-label="Isi templat">
          {TAB_TEMPLAT.map((t) => (
            <TabsTrigger key={t.nilai} value={t.nilai}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="bagian">
          <TabBagian
            bagian={isian.bagian}
            bisaSunting={bisaSunting}
            tandai={tandai}
            kelengkapan={kelengkapan}
            saatUbah={(i) => (setBagianBaru(false), setUbahRingkas(true), setKetentuanDi(i))}
            saatHapus={(i) => setIsian((s) => ({ ...s, bagian: s.bagian.filter((_, j) => j !== i) }))}
            saatGeser={(i, arah) =>
              setIsian((s) => {
                const j = i + arah;
                if (j < 0 || j >= s.bagian.length) return s;
                const b = [...s.bagian];
                [b[i], b[j]] = [b[j], b[i]];
                return { ...s, bagian: b };
              })
            }
            saatTambah={() => {
              // "Tambah Bagian" membuka M-12 untuk baris baru; Batal di modal membuang baris itu lagi
              setKetentuanDi(isian.bagian.length);
              setBagianBaru(true);
              setUbahRingkas(false);
              setIsian((s) => ({ ...s, bagian: [...s.bagian, { ...BAGIAN_BARU }] }));
            }}
          />
        </TabsContent>

        <TabsContent value="aturan">
          {aturan ? (
            <PapanAturan
              key={`${skemaId}:${aturan.periode.id}:${fokusBagian ?? ""}:${sorotAturan ?? ""}`}
              skemaId={skemaId}
              namaSkema={namaSkema}
              templatId={templat.id}
              statusTemplat={templat.status}
              adaDraf={adaDraf}
              periode={aturan.periode}
              tampilan={aturan.tampilan}
              bagianPilihan={aturan.bagianPilihan.length ? aturan.bagianPilihan : templat.bagian.map((b) => b.nama)}
              masaBerjalan={masaBerjalanUntuk(sakelarBerjalan, aturan.periode.id, periodeBerjalanId)}
              sorotAwal={sorotAturan}
              bagianMentah={isian.bagian}
              saatUbahBagian={(i, b) => setIsian((s) => ({ ...s, bagian: s.bagian.map((x, j) => (j === i ? b : x)) }))}
              saatBukaBagian={(nama) => {
                pilihTab("bagian");
                const i = isian.bagian.findIndex((x) => x.nama.trim() === nama);
                if (bisaSunting && i >= 0) {
                  setBagianBaru(false);
                  setUbahRingkas(true);
                  setKetentuanDi(i);
                }
              }}
              saatSusunVersiBaru={susunVersiBaru}
              fokusBagian={fokusBagian}
              contohUji={aturan.contohUji}
              isianBelumTersimpan={kotor}
            />
          ) : (
            <p className="text-sm text-teks-redup">Belum ada periode seleksi.</p>
          )}
        </TabsContent>

      </Tabs>

      {ketentuanDi !== null && isian.bagian[ketentuanDi] ? (
        <ModalKetentuan
          buka
          indeks={ketentuanDi}
          bagian={isian.bagian}
          baru={bagianBaru}
          ringkas={ubahRingkas && !bagianBaru}
          saatAturAturan={aturAturanBagian}
          saatUbah={(b) => {
            if (!b) {
              setKetentuanDi(null);
              setBagianBaru(false);
            }
          }}
          saatBatalBaru={() => setIsian((s) => ({ ...s, bagian: s.bagian.filter((_, j) => j !== ketentuanDi) }))}
          saatTerapkan={(k) => gantiBaris(ketentuanDi, k)}
        />
      ) : null}

      <ModalKonfirmasi kode="M-01" buka={modal} saatUbah={(b) => !sibuk && setModal(b)} judul="Konfirmasi Terbitkan" labelKonfirmasi="Terbitkan" memuat={sibuk} galat={galatModal} saatKonfirmasi={konfirmasiTerbitkan}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-teks-redup">Skema</dt>
          <dd className="font-semibold">{namaSkema}</dd>
          <dt className="text-teks-redup">Versi</dt>
          <dd className="font-semibold">{templat.versi}</dd>
          <dt className="text-teks-redup">Periode Berlaku</dt>
          <dd className="font-semibold">{namaPeriode}</dd>
          <dt className="text-teks-redup">Bagian</dt>
          <dd className="angka font-semibold">{isian.bagian.length}</dd>
        </dl>
        <p className="mt-3 font-semibold">
          {masaBerjalan ? "Saat diterbitkan nanti akan" : "Akan"} membuat <span className="angka">{jumlahDet}</span> butir deterministik dan <span className="angka">{jumlahSem}</span> butir semantik (draf); kelola di tab Aturan Pemeriksaan.
        </p>
        <p className="mt-2 text-teks-redup">
          {masaBerjalan
            ? "Masa pengusulan periode ini sedang berjalan: templat akan disimpan sebagai draf untuk periode berikutnya; templat yang berlaku tidak berubah dan butir cek belum diturunkan."
            : `Templat versi ${templat.versi} menjadi Aktif untuk ${namaPeriode} dan menggantikan templat Aktif periode itu; butir cek turunannya dibuat sebagai draf.`}
        </p>
      </ModalKonfirmasi>
    </div>
  );
}
