"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState, useTransition } from "react";
import { Lock, Plus, X } from "lucide-react";
import { Alert, Badge, Button, Isian, LencanaStatus, Modal, ModalKonfirmasi, Pilihan, Table, TBody, TD, TH, THead, TR, beriTahu, kelasTombol } from "@/components/ui";
import { ringkasParameter } from "@/lib/aturan/parameter";
import { butirTerkunci, KETERANGAN_TERKUNCI, PESAN_TERKUNCI } from "@/lib/aturan/status";
import type { ButirTampil, TampilanAturan } from "@/lib/aturan/layanan";
import {
  FORM_ATURAN_KOSONG,
  KELOMPOK_LAMPIRAN,
  KELOMPOK_UMUM,
  asalAturanButir,
  bangunNilaiButir,
  dapatDiubahDiBagian,
  formDariAsal,
  formDariButir,
  hapusDariBagian,
  infoJenis,
  kelompokkanAturan,
  terapkanKeBagian,
  type AsalAturan,
  type BarisAturan,
  type FormAturan,
} from "@/lib/aturan/terstruktur";
import { dapatSusunVersiBaru } from "@/lib/templat/daftar";
import { mentahKeBagian, type BarisBagianMentah } from "@/lib/templat/kelengkapan";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";
import type { LampiranTemplat } from "@/lib/templat/paket";
import type { StatusTemplat } from "@/lib/templat/status";
import type { PeriodePilihan } from "@/lib/templat/layanan";
import { formatTanggal } from "@/lib/utils";
import { aksiNonaktifkan, aksiSimpanButirTerstruktur, aksiSimpanVersi, aksiUbahPertanyaan } from "./aksi";
import { FormAturanModal } from "./form-aturan";

interface Props {
  skemaId: string;
  namaSkema: string;
  /** templat yang sedang dibuka di J-02a; ikut di tautan Uji pada Contoh supaya "kembali" mendarat di templat yang sama */
  templatId: string;
  statusTemplat: StatusTemplat;
  /** skema sudah punya draf menunggu: Susun Versi Baru tidak ditawarkan */
  adaDraf: boolean;
  /** periode templat ini; basis aturan yang ditampilkan adalah basis skema untuk periode itu */
  periode: PeriodePilihan;
  tampilan: TampilanAturan;
  /** nama bagian dan lampiran templat ini (urutan templat) untuk templat Aktif/Arsip; untuk Draf dipakai isian terkini */
  bagianPilihan: string[];
  lampiranPilihan: string[];
  masaBerjalan: boolean;
  /** kode butir yang disorot lewat ?sorot=; boleh beberapa kode dipisah koma (butir turunan baru sesudah templat terbit) */
  sorotAwal: string | null;
  /** hanya Draf: isian bagian dan lampiran terkini, serta penulis ketentuan bagian (satu sumber data) */
  bagianMentah: BarisBagianMentah[];
  lampiranDef: LampiranTemplat[];
  saatUbahBagian: (indeks: number, baris: BarisBagianMentah) => void;
  saatBukaBagian: (nama: string) => void;
  saatBukaLampiran: (nama: string) => void;
  saatSusunVersiBaru: () => void;
  /** bagian yang difokuskan dari tautan "Atur aturan bagian ini" di M-12 */
  fokusBagian: string | null;
}

/** Satu baris di daftar aturan: butir tersimpan (basis aturan) atau butir turunan yang dihitung dari isian templat Draf. */
interface BarisTampil extends BarisAturan {
  key: string;
  deskripsi: string;
  jenis: "deterministik" | "semantik";
  asal: "templat" | "manual";
  status: ButirTampil["status"];
  ringkasan: string;
  butir: ButirTampil | null;
  asalAturan: AsalAturan | null;
  ditandaiPemantauan: boolean;
  /** hasil hitung dari isian Draf (belum terbit) */
  pratinjau: boolean;
}

type ModalForm = { mode: "tambah" | "ubah"; awal: FormAturan; butir: ButirTampil | null; asal: AsalAturan | null; hanyaPertanyaan: boolean } | null;
type FilterStatusButir = "" | "Aktif" | "Draf" | "Perlu ditinjau" | "Nonaktif";

const kodeDariHash = (h: string) => (h.startsWith("#butir-") ? decodeURIComponent(h.slice(7)) : null);
const fokusGalatPertama = (selektor: string) => setTimeout(() => document.querySelector<HTMLElement>(`${selektor} [aria-invalid="true"]`)?.focus(), 50);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

function dariButir(b: ButirTampil): BarisTampil {
  const p = b.parameter;
  return {
    key: b.id,
    kode: b.kode,
    deskripsi: b.deskripsi,
    jenis: b.jenis,
    asal: b.asal,
    status: b.status,
    ringkasan: b.ringkasan,
    butir: b,
    asalAturan: b.asal === "templat" ? asalAturanButir({ kode: b.kode, deskripsi: b.deskripsi, parameter: p }) : null,
    ditandaiPemantauan: b.ditandaiPemantauan,
    pratinjau: false,
    bagian: b.bagian,
    tipe: str(p?.tipe),
    lampiran: str(p?.nama) ?? b.lampiran,
  };
}

export function PapanAturan({
  skemaId,
  namaSkema,
  templatId,
  statusTemplat,
  adaDraf,
  periode,
  tampilan,
  bagianPilihan,
  lampiranPilihan,
  masaBerjalan,
  sorotAwal,
  bagianMentah,
  lampiranDef,
  saatUbahBagian,
  saatBukaBagian,
  saatBukaLampiran,
  saatSusunVersiBaru,
  fokusBagian,
}: Props) {
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  const { nyata, draf, butir } = tampilan;
  const dasar = draf ?? nyata;
  const modeDraf = statusTemplat === "Draf";
  const hanyaBaca = statusTemplat === "Arsip";

  const [modalForm, setModalForm] = useState<ModalForm>(null); // M-02
  const [galatModal, setGalatModal] = useState<string | null>(null);
  const [nonaktif, setNonaktif] = useState<ButirTampil | null>(null); // M-03
  const [galatNonaktif, setGalatNonaktif] = useState<string | null>(null);
  const [hapusAturan, setHapusAturan] = useState<BarisTampil | null>(null); // konfirmasi Hapus (aturan isi bagian, Draf)
  const [terkunci, setTerkunci] = useState(false); // M-04
  const [modalVersi, setModalVersi] = useState(false); // M-05
  const [tanggal, setTanggal] = useState("");
  const [galatVersi, setGalatVersi] = useState<string | null>(null);
  const [berhasilVersi, setBerhasilVersi] = useState<{ versi: number; tanggal: string } | null>(null);
  const [sorot, setSorot] = useState<string | null>(sorotAwal);
  const [filterJenis, setFilterJenis] = useState<"" | "deterministik" | "semantik">("");
  const [filterStatus, setFilterStatus] = useState<FilterStatusButir>(() => (butir.some((b) => b.kode === sorotAwal && b.status === "Nonaktif") ? "Nonaktif" : ""));
  const [filterBagian, setFilterBagian] = useState<string>(fokusBagian ?? "");
  const sorotSet = useMemo(() => new Set((sorot ?? "").split(",").filter(Boolean)), [sorot]);
  const sorotBanyak = sorotSet.size > 1; // beberapa butir baru: butir nonaktif berkode sama (versi templat lama) tidak ikut tersorot

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

  const namaBagian = modeDraf ? bagianMentah.filter((b) => b.nama.trim() !== "").map((b) => b.nama.trim()) : bagianPilihan;
  const namaLampiran = modeDraf ? lampiranDef.map((l) => l.nama).filter((n) => n.trim() !== "") : lampiranPilihan;

  // baris: Draf = butir turunan dihitung dari isian terkini + butir manual tersimpan; Aktif/Arsip = semua butir tersimpan
  const baris: BarisTampil[] = useMemo(() => {
    const tersimpan = butir.filter((b) => !modeDraf || b.asal === "manual").map(dariButir);
    if (!modeDraf) return tersimpan;
    const lampiranNama = lampiranDef.map((l) => l.nama.trim()).filter(Boolean);
    const turunan = turunkanButirDariTemplat(
      bagianMentah.filter((b) => b.nama.trim() !== "").map(mentahKeBagian),
      lampiranNama,
      lampiranDef.filter((l) => l.nama.trim() !== ""),
    );
    const pratinjau: BarisTampil[] = turunan.map((t) => {
      const p = t.parameter as unknown as Record<string, unknown>;
      return {
        key: `p-${t.kode}`,
        kode: t.kode,
        deskripsi: t.deskripsi,
        jenis: t.jenis,
        asal: "templat",
        status: "Draf",
        ringkasan: ringkasParameter({ jenis: t.jenis, aturanHitung: t.aturanHitung, pertanyaan: t.pertanyaan, parameter: p }),
        butir: null,
        asalAturan: asalAturanButir({ kode: t.kode, deskripsi: t.deskripsi, parameter: p }),
        ditandaiPemantauan: false,
        pratinjau: true,
        bagian: t.bagian ?? str(p.bagian),
        tipe: str(p.tipe),
        lampiran: str(p.nama),
      };
    });
    return [...pratinjau, ...tersimpan];
  }, [butir, modeDraf, bagianMentah, lampiranDef]);

  const kelompok = useMemo(() => {
    const terlihat = baris.filter((b) => {
      if (sorotSet.has(b.kode) && !(sorotBanyak && b.status === "Nonaktif")) return true;
      if (filterJenis && b.jenis !== filterJenis) return false;
      return filterStatus ? b.status === filterStatus : b.status !== "Nonaktif";
    });
    const semua = kelompokkanAturan(terlihat, namaBagian, filterBagian !== "");
    return filterBagian ? semua.filter((k) => k.nama === filterBagian) : semua;
  }, [baris, sorotSet, sorotBanyak, filterJenis, filterStatus, filterBagian, namaBagian]);

  const kodeTerpakai = useMemo(() => baris.filter((b) => b.status !== "Nonaktif").map((b) => b.kode), [baris]);

  function bukaTambah() {
    setGalatModal(null);
    setModalForm({ mode: "tambah", awal: { ...FORM_ATURAN_KOSONG, bagian: filterBagian && namaBagian.includes(filterBagian) ? filterBagian : "" }, butir: null, asal: null, hanyaPertanyaan: false });
  }

  function klikUbah(b: BarisTampil) {
    setGalatModal(null);
    if (b.pratinjau) {
      const a = b.asalAturan;
      if (dapatDiubahDiBagian(a)) {
        const i = bagianMentah.findIndex((x) => x.nama.trim() === a.bagian);
        if (i >= 0) return setModalForm({ mode: "ubah", awal: { ...formDariAsal(a, bagianMentah[i]), kode: b.kode }, butir: null, asal: a, hanyaPertanyaan: false });
      }
      // wajib, pustaka, dan sitasi diatur di formulir bagian; lampiran di tab Lampiran
      if (a?.jenisAturan === "lampiran" && b.lampiran) return saatBukaLampiran(b.lampiran);
      if (a?.bagian) return saatBukaBagian(a.bagian);
      return;
    }
    const t = b.butir!;
    if (butirTerkunci(t.asal)) {
      // 4a: butir semantik turunan masih boleh diubah pertanyaan dan contohnya; selebihnya terkunci
      if (t.jenis === "semantik" && !hanyaBaca) {
        const f = formDariButir({ kode: t.kode, deskripsi: t.deskripsi, jenis: t.jenis, parameter: t.parameter, pertanyaan: t.pertanyaan, contohJawaban: t.contohJawaban });
        const a = b.asalAturan;
        const awal: FormAturan = {
          ...(f ?? FORM_ATURAN_KOSONG),
          jenisAturan: a?.jenisAturan === "unsur" || a?.jenisAturan === "gambar" ? "unsur" : "semantik_bebas",
          bagian: t.bagian ?? "",
          unsur: a?.unsur ?? "",
          pertanyaan: t.pertanyaan ?? "",
          contoh: t.contohJawaban ?? "",
        };
        return setModalForm({ mode: "ubah", awal, butir: t, asal: a, hanyaPertanyaan: true });
      }
      return setTerkunci(true);
    }
    const f = formDariButir({ kode: t.kode, deskripsi: t.deskripsi, jenis: t.jenis, parameter: t.parameter, pertanyaan: t.pertanyaan, contohJawaban: t.contohJawaban });
    if (!f) return beriTahu.galat(`Parameter butir ${t.kode} tidak dikenali formulir. Nonaktifkan lalu tambahkan butir baru.`);
    setModalForm({ mode: "ubah", awal: f, butir: t, asal: null, hanyaPertanyaan: false });
  }

  function tutupForm() {
    setModalForm(null);
    setGalatModal(null);
  }

  function simpanForm(f: FormAturan) {
    if (!modalForm) return;
    setGalatModal(null);
    const info = infoJenis(f.jenisAturan);
    // 1) aturan menempel pada isi bagian pada Draf: ditulis ke ketentuan bagian (satu sumber data)
    if (modeDraf && info?.terikatIsi && !modalForm.butir) {
      const i = bagianMentah.findIndex((x) => x.nama.trim() === f.bagian);
      if (i < 0) return setGalatModal("Bagian tidak ditemukan pada draf ini.");
      saatUbahBagian(i, terapkanKeBagian(bagianMentah[i], f, { frasa: modalForm.asal?.frasa, unsur: modalForm.asal?.unsur }));
      tutupForm();
      beriTahu.sukses(`Aturan ditulis ke ketentuan bagian "${f.bagian}". Simpan Draf untuk menyimpannya; butir turunannya ikut berubah.`);
      return;
    }
    mulai(async () => {
      // 2) butir semantik turunan pada templat Aktif: hanya pertanyaan dan contoh jawaban
      if (modalForm.hanyaPertanyaan && modalForm.butir) {
        const r = await aksiUbahPertanyaan(skemaId, modalForm.butir.id, f.pertanyaan, f.contoh);
        if (!r.ok) {
          if ("terkunci" in r && r.terkunci) {
            tutupForm();
            return setTerkunci(true);
          }
          return setGalatModal(("galat" in r && r.galat) || ("pesan" in r && r.pesan) || "Gagal menyimpan pertanyaan");
        }
        startTransition(() => {
          tutupForm();
          beriTahu.sukses(`Butir ${r.kode} diperbarui pada versi yang sedang disusun.`);
          setSorot(r.kode);
          router.refresh();
        });
        return;
      }
      // 3) butir manual
      const h = bangunNilaiButir(f, { kodeTerpakai, kodeAsal: modalForm.butir?.kode });
      if (!h.ok) return setGalatModal(Object.values(h.galat)[0] ?? "Isian belum lengkap");
      const r = await aksiSimpanButirTerstruktur(skemaId, modalForm.butir?.id ?? null, h.nilai);
      if (r.ok && "butirId" in r) {
        startTransition(() => {
          tutupForm();
          beriTahu.sukses(r.baru ? `Butir ${r.kode} ditambahkan pada versi yang sedang disusun.` : `Butir ${r.kode} diperbarui.`);
          setSorot(r.kode);
          router.refresh();
        });
        return;
      }
      if ("terkunci" in r && r.terkunci) {
        tutupForm();
        return setTerkunci(true);
      }
      if ("galat" in r && Object.keys(r.galat).length) setGalatModal(Object.values(r.galat)[0] ?? null);
      else if ("pesan" in r && r.pesan) setGalatModal(r.pesan);
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

  function konfirmasiHapusAturan() {
    const b = hapusAturan;
    const a = b?.asalAturan;
    if (!b || !dapatDiubahDiBagian(a)) return setHapusAturan(null);
    const i = bagianMentah.findIndex((x) => x.nama.trim() === a.bagian);
    if (i >= 0) saatUbahBagian(i, hapusDariBagian(bagianMentah[i], { jenisAturan: a.jenisAturan, frasa: a.frasa, unsur: a.unsur }));
    setHapusAturan(null);
    beriTahu.sukses(`Aturan ${b.kode} dihapus dari ketentuan bagian "${a.bagian}". Simpan Draf untuk menyimpannya.`);
  }

  function simpanVersi(e: React.FormEvent) {
    e.preventDefault();
    setGalatVersi(null);
    mulai(async () => {
      const r = await aksiSimpanVersi(skemaId, periode.id, tanggal);
      if (!r.ok) {
        setGalatVersi(r.pesan); // 8a: ditolak di dalam modal, basis aturan tidak berubah
        fokusGalatPertama("#form-versi");
        return;
      }
      if ("versi" in r) {
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
  const kelasBaris = (b: BarisTampil) => (b.status === "Perlu ditinjau" ? "bg-peringatan-50" : b.status === "Nonaktif" ? "text-abu-600" : undefined);
  const bolehSusunBaru = dapatSusunVersiBaru(statusTemplat, adaDraf);
  const bisaHapus = (b: BarisTampil) => b.pratinjau && dapatDiubahDiBagian(b.asalAturan);

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

      {modeDraf ? (
        <p className="mb-4 text-sm text-teks-redup">Aturan yang menempel pada isi bagian ditulis ke ketentuan bagian: simpan draf agar tersimpan dan ikut di .docx.</p>
      ) : statusTemplat === "Terbit" ? (
        <p className="mb-4 text-sm text-teks-redup">Templat Aktif: aturan isi bagian terkunci (ubah lewat versi baru). Pertanyaan semantik, contoh jawaban, status, dan butir di luar isi bagian tetap dapat diubah di sini.</p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Pilihan label="Bagian" name="filter-bagian" className="w-56" value={filterBagian} onChange={(e) => setFilterBagian(e.target.value)}>
          <option value="">Semua</option>
          {namaBagian.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          <option value={KELOMPOK_LAMPIRAN}>{KELOMPOK_LAMPIRAN}</option>
          <option value={KELOMPOK_UMUM}>{KELOMPOK_UMUM}</option>
        </Pilihan>
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
        {filterBagian ? (
          <Button varian="hantu" ukuran="sm" onClick={() => setFilterBagian("")}>
            <X aria-hidden className="size-4" /> Hapus penyaring bagian
          </Button>
        ) : null}
      </div>

      {berhasilVersi ? (
        <Alert jenis="sukses" judul="Basis aturan versi baru tersimpan" className="mb-4">
          Basis aturan versi {berhasilVersi.versi} tersimpan dan berlaku mulai {formatTanggal(berhasilVersi.tanggal)}.
        </Alert>
      ) : null}

      {kelompok.length === 0 ? (
        <p className="rounded-md border border-dashed border-primer-300 px-4 py-8 text-center text-sm text-teks-redup">
          {baris.length === 0 ? "Belum ada butir cek. Terbitkan templat atau tekan “Tambah Butir”." : "Tidak ada butir yang cocok dengan penyaring."}
        </p>
      ) : null}

      {kelompok.map((k) => (
        <section key={k.nama} aria-labelledby={`kel-${k.nama}`} className="mt-6 first:mt-0" data-kelompok={k.nama}>
          <h3 id={`kel-${k.nama}`} className="mb-2 flex items-center gap-2 text-sm font-semibold text-primer-800">
            {k.huruf ? <span className="rounded-sm bg-abu-100 px-1.5 py-0.5 font-mono text-xs text-abu-700">{k.huruf}</span> : null}
            {k.nama}
            <span className="angka text-xs font-normal text-teks-redup">{k.butir.length} aturan</span>
          </h3>
          <Table>
            <THead>
              <TR>
                <TH>Kode</TH>
                <TH>Deskripsi</TH>
                <TH>Jenis</TH>
                <TH>Asal</TH>
                <TH>Aturan</TH>
                <TH>Status</TH>
                <TH>
                  <span className="sr-only">Aksi</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {k.butir.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="py-4 text-center text-teks-redup">
                    Belum ada aturan untuk bagian ini.
                  </TD>
                </TR>
              ) : null}
              {k.butir.map((b) => (
                <TR key={b.key} id={`butir-${b.kode}`} tersorot={sorotSet.has(b.kode) && !(sorotBanyak && b.status === "Nonaktif")} className={`scroll-mt-24 ${kelasBaris(b) ?? ""}`}>
                  <TD className="whitespace-nowrap font-mono text-xs font-semibold">
                    <a href={`#butir-${b.kode}`} className="underline-offset-2 hover:underline" translate="no">
                      {b.kode}
                    </a>
                  </TD>
                  <TD className="min-w-48">{b.deskripsi}</TD>
                  <TD className="capitalize">{b.jenis}</TD>
                  <TD className="whitespace-nowrap">
                    {b.pratinjau ? (
                      <span title="Diturunkan dari ketentuan bagian templat">bagian</span>
                    ) : butirTerkunci(b.asal) ? (
                      <span className="inline-flex items-center gap-1" title="Nilai butir ini terkunci; ubah lewat versi baru templat">
                        <Lock aria-hidden className="size-4 text-teks-redup" /> templat<span className="sr-only"> (terkunci)</span>
                      </span>
                    ) : (
                      "manual"
                    )}
                  </TD>
                  <TD className="min-w-56 max-w-md text-xs text-primer-800">{b.ringkasan}</TD>
                  <TD>
                    <LencanaStatus status={b.status} />
                    {b.ditandaiPemantauan && b.butir ? (
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
                        {bisaHapus(b) ? (
                          <Button varian="hantu" ukuran="sm" className="text-bata-700 hover:bg-bata-100" onClick={() => setHapusAturan(b)} disabled={sibuk} aria-label={`Hapus aturan ${b.kode}`}>
                            Hapus
                          </Button>
                        ) : null}
                        {b.butir && (!butirTerkunci(b.asal) || b.jenis === "semantik") ? (
                          <Button varian="hantu" ukuran="sm" className="text-bata-700 hover:bg-bata-100" onClick={() => (setGalatNonaktif(null), setNonaktif(b.butir))} disabled={sibuk} aria-label={`Nonaktifkan butir ${b.kode}`}>
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
        </section>
      ))}

      {/* M-02 Form Butir (Tambah/Ubah), terstruktur */}
      {modalForm ? (
        <FormAturanModal
          mode={modalForm.mode}
          awal={modalForm.awal}
          bagian={namaBagian}
          lampiran={namaLampiran}
          kodeTerpakai={kodeTerpakai}
          kunciIsi={!modeDraf}
          hanyaPertanyaan={modalForm.hanyaPertanyaan}
          keKetentuan={(j) => modeDraf && infoJenis(j)?.terikatIsi === true && !modalForm.butir}
          sibuk={sibuk}
          galatServer={galatModal}
          saatSimpan={simpanForm}
          saatBatal={tutupForm}
        />
      ) : null}

      {/* Hapus aturan isi bagian (Draf) */}
      <ModalKonfirmasi kode="M-03" buka={hapusAturan !== null} saatUbah={(b) => !b && setHapusAturan(null)} judul="Konfirmasi Hapus Aturan" labelKonfirmasi="Hapus" bahaya saatKonfirmasi={konfirmasiHapusAturan}>
        {hapusAturan ? (
          <>
            <p>
              Aturan <span className="font-mono font-semibold" translate="no">{hapusAturan.kode}</span>: {hapusAturan.deskripsi}
            </p>
            <p className="mt-2 text-teks-redup">Aturan dihapus dari ketentuan bagian pada draf ini; petunjuk dan .docx ikut berubah setelah Simpan Draf.</p>
          </>
        ) : null}
      </ModalKonfirmasi>

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
            <p className="mt-2 text-teks-redup">Butir tidak lagi dipakai pada pemeriksaan sesudah versi yang sedang disusun disimpan. Versi yang berlaku sekarang tidak berubah.</p>
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
            {bolehSusunBaru ? (
              <Button
                onClick={() => {
                  setTerkunci(false);
                  saatSusunVersiBaru();
                }}
              >
                Susun Versi Baru
              </Button>
            ) : (
              <Link href="/tim-kerja/templat" className={kelasTombol("utama")}>
                Buka Templat Proposal
              </Link>
            )}
          </>
        }
      >
        <p>{PESAN_TERKUNCI}</p>
        <p className="mt-2 text-teks-redup">{KETERANGAN_TERKUNCI}</p>
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
            petunjuk={masaBerjalan ? `Masa pengusulan sedang berjalan (${formatTanggal(periode.tanggalBuka)} sampai ${formatTanggal(periode.tanggalTutup)}): pilih tanggal di luar rentang itu.` : undefined}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </form>
      </Modal>
    </>
  );
}

