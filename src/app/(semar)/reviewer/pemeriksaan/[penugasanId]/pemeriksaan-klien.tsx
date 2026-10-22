"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  BarKeyakinan,
  Button,
  Field,
  JudulHalaman,
  Panel,
  RadioGroup,
  RadioItem,
  Select,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components/ui";
import { JENIS_KEKELIRUAN, KOMPONEN_BORANG, type Keputusan } from "@/lib/kontrak/tipe";
import { cariKutipan } from "@/lib/pemeriksa/semantik/teks";
import type { ButirTampil, DataPemeriksaan, KoreksiTampil } from "@/lib/penilaian/tipe";
import { PESAN_ALASAN_WAJIB, PESAN_KOMPONEN_BELUM_LENGKAP, validasiKoreksi } from "@/lib/penilaian/validasi";
import { aksiKirimUlang, aksiSimpanKoreksi, aksiSimpanPermanen, aksiSimpanSementara } from "./actions";

const MAKS_POLLING = 40;

export function PemeriksaanKlien({ data }: { data: DataPemeriksaan }) {
  const router = useRouter();
  const [tabAktif, setTabAktif] = useState(data.tab[0]?.nama ?? "");
  const [terpilih, setTerpilih] = useState<string | null>(null);
  const [koreksiLokal, setKoreksiLokal] = useState<Record<string, KoreksiTampil>>({});
  const [koreksiBuka, setKoreksiBuka] = useState<string | null>(null);
  const [formKoreksi, setFormKoreksi] = useState({ keputusan: "", alasan: "", jenisKekeliruan: "" });
  const [galatKoreksi, setGalatKoreksi] = useState<Record<string, string>>({});
  const [komponen, setKomponen] = useState<Record<string, Keputusan | undefined>>(data.penilaian.komponen);
  const [umpanBalik, setUmpanBalik] = useState(data.penilaian.umpanBalik);
  const [final, setFinal] = useState(data.penilaian.status === "Final");
  const [terkirim, setTerkirim] = useState(data.penilaian.terkirimKeBima);
  const [pesan, setPesan] = useState<{ jenis: "info" | "sukses" | "galat"; teks: string } | null>(null);
  const [sibuk, mulai] = useTransition();
  const tandaRef = useRef<HTMLElement | null>(null);
  const pesanBawahRef = useRef<HTMLDivElement | null>(null);
  const [komponenKosong, setKomponenKosong] = useState<string[]>([]);

  const butir: ButirTampil[] = useMemo(
    () => data.butir.map((b) => ({ ...b, koreksi: koreksiLokal[b.hasilId] ?? b.koreksi })),
    [data.butir, koreksiLokal],
  );
  const butirTab = butir.filter((b) => b.tab === tabAktif);
  const butirTerpilih = butir.find((b) => b.hasilId === terpilih) ?? null;

  // Rekomendasi belum tersedia: perbarui halaman berkala (tanpa memanggil LLM dari halaman ini)
  const [kali, setKali] = useState(0);
  useEffect(() => {
    if (data.semantik.siap || kali >= MAKS_POLLING) return;
    const t = setTimeout(() => {
      setKali((k) => k + 1);
      router.refresh();
    }, 4000);
    return () => clearTimeout(t);
  }, [data.semantik.siap, kali, router]);

  // Klik butir: gulir panel kiri ke kutipan dan sorot
  useEffect(() => {
    if (terpilih && tandaRef.current) tandaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [terpilih, tabAktif]);


  function pilihButir(id: string) {
    setTerpilih(id);
  }

  function bukaKoreksi(b: ButirTampil) {
    setTerpilih(b.hasilId);
    setKoreksiBuka(b.hasilId);
    setGalatKoreksi({});
    setFormKoreksi(
      b.koreksi
        ? { keputusan: b.koreksi.keputusan, alasan: b.koreksi.alasan, jenisKekeliruan: b.koreksi.jenisKekeliruan }
        : { keputusan: b.rekomendasi === "Memenuhi" ? "Tidak memenuhi" : b.rekomendasi === "Tidak memenuhi" ? "Memenuhi" : "", alasan: "", jenisKekeliruan: "" },
    );
  }

  function batalKoreksi() {
    // 4a: tutup tanpa menulis ke tabel koreksi
    setKoreksiBuka(null);
    setGalatKoreksi({});
  }

  function simpanKoreksi(b: ButirTampil) {
    const kolom = validasiKoreksi(formKoreksi);
    if (Object.keys(kolom).length) {
      setGalatKoreksi(kolom); // S-1: bingkai merah + pesan
      // fokus ke isian yang salah supaya pengguna papan ketik tidak mencarinya sendiri
      setTimeout(() => document.getElementById(kolom.alasan ? `kr-alasan-${b.hasilId}` : `kr-jenis-${b.hasilId}`)?.focus(), 0);
      return;
    }
    mulai(async () => {
      const r = await aksiSimpanKoreksi(data.penugasanId, b.hasilId, formKoreksi);
      if (!r.ok) {
        setGalatKoreksi(r.kolom ?? { umum: r.galat });
        return;
      }
      setKoreksiLokal((s) => ({ ...s, [b.hasilId]: r.koreksi as KoreksiTampil }));
      setKoreksiBuka(null);
      setGalatKoreksi({});
    });
  }

  const isian = () => ({ umpanBalik, komponen: komponen as Record<string, string | undefined> });

  function simpanSementara() {
    mulai(async () => {
      const r = await aksiSimpanSementara(data.penugasanId, isian());
      if (r.ok) {
        setPesan({ jenis: "info", teks: "Draf penilaian tersimpan. Anda dapat melanjutkannya dengan menekan \"Periksa\" lagi di Daftar Penugasan." });
        toast.success("Draf tersimpan");
      } else setPesan({ jenis: "galat", teks: r.galat });
    });
  }

  function simpanPermanen() {
    // validasi di klien lebih dulu: tandai komponen yang kosong, gulir ke komponen kosong pertama (teks pesan tetap sama dengan server)
    const kosong = KOMPONEN_BORANG.filter((k) => !komponen[k]);
    if (kosong.length) {
      setKomponenKosong([...kosong]);
      setPesan({ jenis: "galat", teks: PESAN_KOMPONEN_BELUM_LENGKAP });
      const i = KOMPONEN_BORANG.indexOf(kosong[0]);
      document.getElementById(`kb-label-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setKomponenKosong([]);
    mulai(async () => {
      const r = await aksiSimpanPermanen(data.penugasanId, isian());
      if (!r.ok) {
        setPesan({ jenis: "galat", teks: r.galat });
        return;
      }
      setFinal(true);
      setKoreksiBuka(null);
      if (r.terkirim) {
        setTerkirim(true);
        toast.success("Penilaian tersimpan dan terkirim ke BIMA");
        setPesan({ jenis: "sukses", teks: "Penilaian tersimpan dan terkirim ke BIMA" });
      } else {
        setTerkirim(false);
        setPesan({ jenis: "galat", teks: r.pesanKirim ?? "Penilaian tersimpan, tetapi gagal terkirim ke BIMA." });
      }
    });
  }

  function kirimUlang() {
    mulai(async () => {
      const r = await aksiKirimUlang(data.penugasanId);
      if (r.ok) {
        setTerkirim(true);
        setPesan({ jenis: "sukses", teks: "Penilaian tersimpan dan terkirim ke BIMA" });
      } else setPesan({ jenis: "galat", teks: r.galat });
    });
  }

  const gagalKirim = final && !terkirim;
  // keadaan menetap (juga setelah halaman dimuat ulang): final terkirim = sukses; final belum terkirim = galat dengan "Kirim ulang"
  const pesanMenetap: { jenis: "sukses" | "galat"; teks: string } | null = final
    ? terkirim
      ? { jenis: "sukses", teks: "Penilaian tersimpan dan terkirim ke BIMA" }
      : { jenis: "galat", teks: "Penilaian tersimpan, tetapi gagal terkirim ke BIMA. Tekan \"Kirim ulang\"." }
    : null;
  const tampilPesan = pesan ?? pesanMenetap;
  const alertPesan = (
    <div ref={pesanBawahRef}>
      {tampilPesan ? (
        <Alert jenis={tampilPesan.jenis === "galat" ? "galat" : tampilPesan.jenis} className="mb-4" judul={tampilPesan.jenis === "sukses" ? tampilPesan.teks : undefined}>
          {tampilPesan.jenis === "sukses" ? null : tampilPesan.teks}
          {gagalKirim ? (
            <div className="mt-2">
              <Button ukuran="sm" onClick={kirimUlang} disabled={sibuk}>
                Kirim ulang
              </Button>
            </div>
          ) : null}
        </Alert>
      ) : null}
    </div>
  );

  return (
    <>
      <p className="mb-2">
        <Link href="/reviewer/penugasan" className="inline-flex items-center gap-1 text-sm font-semibold text-sogan-700 underline">
          <ArrowLeft aria-hidden className="size-4" /> Kembali ke Daftar Penugasan
        </Link>
      </p>
      <JudulHalaman kode="J-08" judul="Pemeriksaan Proposal" />

      <Panel className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xl font-semibold text-sogan-900">{data.proposal.judul}</p>
            <p className="text-sm text-sogan-700">
              {data.proposal.idProposal} · {data.proposal.skema} · versi {data.proposal.kodeVersi}
            </p>
          </div>
          <StatusBadge status={final ? "Selesai" : data.label} />
        </div>
        <p className="mt-3 flex items-start gap-2 text-sm text-sogan-800">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-daun-600" />
          {data.deterministik.total === 0
            ? "Belum ada hasil pemeriksaan butir deterministik."
            : data.deterministik.gagal === 0
              ? `Semua ${data.deterministik.total} butir deterministik sudah lolos.`
              : `${data.deterministik.lolos} dari ${data.deterministik.total} butir deterministik lolos; ${data.deterministik.gagal} gagal.`}
        </p>
      </Panel>

      {!data.semantik.siap ? (
        <Alert jenis="info" className="mb-6" judul="Rekomendasi sedang disiapkan">
          <span className="inline-flex items-center gap-2">
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {kali >= MAKS_POLLING ? "Pemeriksaan semantik belum selesai. Muat ulang halaman beberapa saat lagi." : "Halaman ini diperbarui otomatis begitu rekomendasi tersedia."}
          </span>
        </Alert>
      ) : null}
      {data.semantik.status === "Gagal" ? (
        <Alert jenis="peringatan" className="mb-6" judul="Pemeriksaan semantik gagal dijalankan">
          Butir semantik belum memiliki rekomendasi. Anda tetap dapat memeriksa teks secara manual.
        </Alert>
      ) : null}
      {final ? (
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-sogan-700">
          <Lock aria-hidden className="size-4" /> Penilaian final: semua isian hanya dapat dibaca.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Panel kiri: teks proposal, satu tab per bagian */}
        <Panel judul="Teks Proposal" className="min-w-0">
          <Tabs value={tabAktif} onValueChange={setTabAktif}>
            <TabsList aria-label="Bagian proposal" className="flex-wrap">
              {data.tab.map((t) => (
                <TabsTrigger key={t.nama} value={t.nama} className={butir.some((b) => b.tab === t.nama) ? undefined : "opacity-70"}>
                  {t.nama}
                  {butir.some((b) => b.tab === t.nama) ? (
                    <span className="ml-1 text-xs font-normal">
                      ({butir.filter((b) => b.tab === t.nama).length}
                      {butir.some((b) => b.tab === t.nama && (b.status === "Perlu diperiksa manual" || b.status === "Belum ada rekomendasi")) ? <span className="ml-0.5 text-bata-700"><span aria-hidden>●</span><span className="sr-only">ada butir yang harus dibaca sendiri</span></span> : null})
                    </span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
            {data.tab.map((t) => {
              const rentang = butirTerpilih?.tab === t.nama ? cariKutipan(t.teks, butirTerpilih.kutipan) : null;
              return (
                <TabsContent key={t.nama} value={t.nama} className="max-h-[65vh] overflow-y-auto whitespace-pre-wrap text-[15px] leading-relaxed text-sogan-900">
                  {t.teks.trim() === "" ? (
                    <span className="italic text-sogan-600">Bagian ini tidak ditemukan pada naskah.</span>
                  ) : rentang ? (
                    <>
                      {t.teks.slice(0, rentang.mulai)}
                      <mark ref={(el) => { tandaRef.current = el; }} className="rounded bg-emas-300 px-0.5 text-sogan-900 ring-2 ring-emas-500">
                        {t.teks.slice(rentang.mulai, rentang.akhir)}
                      </mark>
                      {t.teks.slice(rentang.akhir)}
                    </>
                  ) : (
                    t.teks
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </Panel>

        {/* Panel kanan: butir semantik pada tab yang dibuka */}
        <Panel judul="Butir Semantik" className="min-w-0 self-start lg:sticky lg:top-4">
          <p className="mb-3 text-xs text-sogan-700">
            Total proposal: {butir.length} butir semantik
            {butir.filter((b) => b.koreksi).length ? `, ${butir.filter((b) => b.koreksi).length} dikoreksi` : ""}
            {butir.filter((b) => b.status === "Perlu diperiksa manual" || b.status === "Belum ada rekomendasi").length ? `, ${butir.filter((b) => b.status === "Perlu diperiksa manual" || b.status === "Belum ada rekomendasi").length} perlu dibaca sendiri` : ""}.
            
          </p>
          <p className="mb-3 text-xs text-sogan-700">Tingkat keyakinan (ambang contoh): tinggi ≥ 0,8; sedang 0,5 sampai 0,8; rendah &lt; 0,5.</p>
          <p className="mb-3 text-xs font-semibold text-sogan-800">Butir yang tidak Anda koreksi dianggap Anda setujui saat Simpan Permanen.</p>
          {butirTab.length === 0 ? (
            <p className="text-sm text-sogan-700">{data.butir.length === 0 && !data.semantik.siap ? "Menunggu rekomendasi." : "Tidak ada butir semantik pada tab ini."}</p>
          ) : (
            <ul className="space-y-4">
              {butirTab.map((b) => (
                <li key={b.hasilId}>
                  <article className={`rounded-md border ${terpilih === b.hasilId ? "border-emas-500 ring-2 ring-emas-300" : "border-sogan-200"} ${b.status === "Perlu diperiksa manual" || b.status === "Belum ada rekomendasi" ? "border-l-4 border-l-bata-600" : ""} bg-krem/50`}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-pressed={terpilih === b.hasilId}
                      onClick={() => pilihButir(b.hasilId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pilihButir(b.hasilId);
                        }
                      }}
                      className="cursor-pointer space-y-2 p-3 focus-visible:outline-2 focus-visible:outline-emas-500"
                    >
                      <p className="text-sm font-semibold text-sogan-900">
                        <span className="mr-1.5 font-mono text-xs text-emas-700">{b.kode}</span>
                        {b.deskripsi}
                      </p>
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-sogan-700">{b.koreksi ? "Rekomendasi sistem semula:" : "Rekomendasi:"}</span>
                        <span className={b.koreksi ? "opacity-60" : undefined}>
                          <StatusBadge status={b.status} />
                        </span>
                        {b.tiruan ? <StatusBadge status="tiruan" /> : null}
                        {b.koreksi ? <span className="text-xs text-sogan-600">(rekomendasi semula; keputusan reviewer berlaku)</span> : null}
                        {b.status === "Perlu diperiksa manual" || b.status === "Belum ada rekomendasi" ? <span className="text-xs font-semibold text-bata-700">Baca bagian ini sendiri</span> : null}
                      </p>
                      {b.status === "Perlu diperiksa manual" && b.rekomendasi ? (
                        <p className="text-xs text-sogan-700">Rekomendasi sistem: {b.rekomendasi} (kutipannya belum dapat dipastikan ada di teks).</p>
                      ) : null}
                      {b.kutipan ? (
                        <blockquote className="border-l-4 border-emas-500 bg-white px-3 py-2 text-sm italic text-sogan-900">&ldquo;{b.kutipan}&rdquo;</blockquote>
                      ) : b.status === "Belum ada rekomendasi" ? null : (
                        <p className="text-xs text-sogan-600">Tidak ada kutipan pendukung.</p>
                      )}
                      {b.tingkatKeyakinan !== null ? <BarKeyakinan nilai={b.tingkatKeyakinan} /> : null}
                      {b.alasanSistem ? <p className="text-xs text-sogan-700">Alasan sistem: {b.alasanSistem}</p> : null}
                      {b.koreksi ? (
                        <div className="rounded border border-sogan-300 bg-white p-2 text-sm">
                          <p className="flex flex-wrap items-center gap-2">
                            <StatusBadge status="Dikoreksi reviewer" />
                            <span className="font-semibold">Keputusan reviewer yang berlaku:</span>
                            <StatusBadge status={b.koreksi.keputusan} />
                          </p>
                          <p className="mt-1 text-xs text-sogan-700">
                            {b.koreksi.jenisKekeliruan ? `${b.koreksi.jenisKekeliruan}: ` : ""}
                            {b.koreksi.alasan}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    {!final ? (
                      <div className="border-t border-sogan-100 px-3 py-2">
                        <Button varian="garis" ukuran="sm" onClick={() => bukaKoreksi(b)} aria-expanded={koreksiBuka === b.hasilId}>
                          Tidak Setuju
                        </Button>
                      </div>
                    ) : null}
                    {koreksiBuka === b.hasilId ? (
                      <div className="space-y-3 border-t border-sogan-200 bg-white p-3" role="group" aria-label={`Koreksi butir ${b.kode}`}>
                        <div className="rounded bg-krem p-2 text-xs text-sogan-800">
                          <p>
                            <strong>Rekomendasi sistem:</strong> {b.rekomendasi ?? b.status}
                          </p>
                          <p>
                            <strong>Kutipan:</strong> {b.kutipan ?? "tidak ada"}
                          </p>
                          <p>
                            <strong>Alasan sistem:</strong> {b.alasanSistem ?? "tidak ada"}
                          </p>
                        </div>
                        <div>
                          <p id={`kr-label-${b.hasilId}`} className="mb-1 text-sm font-semibold text-sogan-800">
                            Keputusan Reviewer
                          </p>
                          <RadioGroup
                            aria-labelledby={`kr-label-${b.hasilId}`}
                            value={formKoreksi.keputusan}
                            onValueChange={(v) => setFormKoreksi((f) => ({ ...f, keputusan: v }))}
                          >
                            <RadioItem id={`kr-m-${b.hasilId}`} value="Memenuhi" label="Memenuhi" />
                            <RadioItem id={`kr-t-${b.hasilId}`} value="Tidak memenuhi" label="Tidak memenuhi" />
                          </RadioGroup>
                          {galatKoreksi.keputusan ? <p role="alert" className="mt-1 text-sm text-bata-600">{galatKoreksi.keputusan}</p> : null}
                        </div>
                        <Field label="Alasan Koreksi" htmlFor={`kr-alasan-${b.hasilId}`} galat={galatKoreksi.alasan ? PESAN_ALASAN_WAJIB : undefined}>
                          <Textarea
                            id={`kr-alasan-${b.hasilId}`}
                            value={formKoreksi.alasan}
                            aria-invalid={galatKoreksi.alasan ? true : undefined}
                            onChange={(e) => setFormKoreksi((f) => ({ ...f, alasan: e.target.value }))}
                          />
                        </Field>
                        <Field label="Jenis Kekeliruan" htmlFor={`kr-jenis-${b.hasilId}`} galat={galatKoreksi.jenisKekeliruan}>
                          <Select
                            id={`kr-jenis-${b.hasilId}`}
                            value={formKoreksi.jenisKekeliruan}
                            aria-invalid={galatKoreksi.jenisKekeliruan ? true : undefined}
                            onChange={(e) => setFormKoreksi((f) => ({ ...f, jenisKekeliruan: e.target.value }))}
                          >
                            <option value="">Pilih jenis kekeliruan (opsional)</option>
                            {JENIS_KEKELIRUAN.map((j) => (
                              <option key={j} value={j}>
                                {j}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        {galatKoreksi.umum ? <p role="alert" className="text-sm text-bata-600">{galatKoreksi.umum}</p> : null}
                        <div className="flex gap-2">
                          <Button ukuran="sm" onClick={() => simpanKoreksi(b)} disabled={sibuk}>
                            Simpan Koreksi
                          </Button>
                          <Button varian="hantu" ukuran="sm" onClick={batalKoreksi}>
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel judul="Keputusan Komponen Borang">
          <ul className="space-y-3">
            {KOMPONEN_BORANG.map((k, i) => (
              <li key={k}>
                <p id={`kb-label-${i}`} className="mb-1 text-sm font-semibold text-sogan-800">
                  {k}
                </p>
                <RadioGroup
                  aria-labelledby={`kb-label-${i}`}
                  aria-invalid={komponenKosong.includes(k) && !komponen[k] ? true : undefined}
                  className={komponenKosong.includes(k) && !komponen[k] ? "rounded border-2 border-bata-600 p-2" : undefined}
                  value={komponen[k] ?? ""}
                  disabled={final}
                  onValueChange={(v) => setKomponen((s) => ({ ...s, [k]: v as Keputusan }))}
                >
                  <RadioItem id={`kb-m-${i}`} value="Memenuhi" label="Memenuhi" />
                  <RadioItem id={`kb-t-${i}`} value="Tidak memenuhi" label="Tidak memenuhi" />
                </RadioGroup>
                {komponenKosong.includes(k) && !komponen[k] ? <p role="alert" className="mt-1 text-sm text-bata-700">Belum diputuskan</p> : null}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel judul="Umpan Balik untuk Pengusul">
          <Field label="Umpan Balik untuk Pengusul" htmlFor="umpan-balik">
            <Textarea id="umpan-balik" className="min-h-40" value={umpanBalik} disabled={final} onChange={(e) => setUmpanBalik(e.target.value)} />
          </Field>
          <div className="mt-4">{alertPesan}</div>
          {!final ? (
            <p className="mb-3 text-sm text-sogan-800">
              {butir.filter((b) => !b.koreksi && b.status !== "Belum ada rekomendasi" && b.status !== "Perlu diperiksa manual").length} rekomendasi akan dianggap disetujui, {butir.filter((b) => b.koreksi).length} dikoreksi reviewer
              {butir.filter((b) => !b.koreksi && (b.status === "Belum ada rekomendasi" || b.status === "Perlu diperiksa manual")).length
                ? `, ${butir.filter((b) => !b.koreksi && (b.status === "Belum ada rekomendasi" || b.status === "Perlu diperiksa manual")).length} butir tanpa rekomendasi yang dapat disetujui (perlu dibaca sendiri)`
                : ""}
              .
            </p>
          ) : null}
          {!final ? (
            <div className="flex flex-wrap gap-3">
              <Button varian="garis" onClick={simpanSementara} disabled={sibuk}>
                Simpan Sementara
              </Button>
              <Button onClick={simpanPermanen} disabled={sibuk}>
                Simpan Permanen
              </Button>
            </div>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
