"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Lock, XCircle } from "lucide-react";
import {
  Alert,
  BarKeyakinan,
  Bagian,
  Button,
  KepalaHalaman,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TombolUnduh,
  beriTahu,
  kelasTombol,
} from "@/components/ui";
import { cariKutipan } from "@/lib/pemeriksa/semantik/teks";
import type { ButirTampil, DataPemeriksaan, KoreksiTampil } from "@/lib/penilaian/tipe";
import { perluBacaSendiri, ringkasRekomendasi } from "@/lib/penilaian/status";
import { ModalKoreksi } from "./modal-koreksi";

const MAKS_POLLING = 40;

/** Simpan pilihan tampilan di URL tanpa menambah riwayat (tombol Back tetap keluar dari layar ini). */
function simpanDiUrl(tab: string, butirKode: string | null) {
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("tab", tab);
    if (butirKode) u.searchParams.set("butir", butirKode);
    else u.searchParams.delete("butir");
    window.history.replaceState(null, "", u);
  } catch {
    /* URL tidak dapat diubah: abaikan */
  }
}

const ukuranBerkas = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function PemeriksaanKlien({ data, tabAwal, butirAwal }: { data: DataPemeriksaan; tabAwal?: string; butirAwal?: string }) {
  const router = useRouter();
  const butirDariUrl = data.butir.find((b) => b.kode === butirAwal) ?? null;
  const [tabAktif, setTabAktif] = useState(() => {
    if (butirDariUrl) return butirDariUrl.tab;
    return data.tab.some((t) => t.nama === tabAwal) ? (tabAwal as string) : (data.tab[0]?.nama ?? "");
  });
  const [terpilih, setTerpilih] = useState<string | null>(butirDariUrl?.hasilId ?? null);
  const [koreksiLokal, setKoreksiLokal] = useState<Record<string, KoreksiTampil>>({});
  const [butirKoreksi, setButirKoreksi] = useState<string | null>(null); // M-10 terbuka untuk butir ini
  const tandaRef = useRef<HTMLElement | null>(null);
  const final = data.penilaian.status === "Final";

  const butir: ButirTampil[] = useMemo(() => data.butir.map((b) => ({ ...b, koreksi: koreksiLokal[b.hasilId] ?? b.koreksi })), [data.butir, koreksiLokal]);
  const butirTab = butir.filter((b) => b.tab === tabAktif);
  const butirTerpilih = butir.find((b) => b.hasilId === terpilih) ?? null;
  const butirDimodal = butir.find((b) => b.hasilId === butirKoreksi) ?? null;
  const ringkas = ringkasRekomendasi(butir.map((b) => ({ status: b.status, dikoreksi: b.koreksi !== null })));

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

  // Klik butir: gulir panel teks ke kutipan dan sorot (tanpa gulir halus bila pengguna meminta gerak dikurangi)
  useEffect(() => {
    if (!terpilih || !tandaRef.current) return;
    const kurang = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tandaRef.current.scrollIntoView({ behavior: kurang ? "auto" : "smooth", block: "center" });
  }, [terpilih, tabAktif]);

  function ubahTab(t: string) {
    setTabAktif(t);
    simpanDiUrl(t, butirTerpilih?.tab === t ? butirTerpilih.kode : null);
  }

  function pilihButir(b: ButirTampil) {
    setTerpilih(b.hasilId);
    if (b.tab !== tabAktif) setTabAktif(b.tab);
    simpanDiUrl(b.tab, b.kode);
  }

  const lanjut = (
    <Link href={`/reviewer/pemeriksaan/${data.penugasanId}/keputusan`} className={kelasTombol("utama", "md")}>
      {final ? "Lihat Keputusan" : "Lanjut ke Keputusan"}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  );

  return (
    <>
      <KepalaHalaman
        kode="J-08"
        judul="Pemeriksaan Proposal"
        keterangan={data.proposal.judul}
        remah={[{ label: "Daftar Penugasan", href: "/reviewer/penugasan" }, { label: "Pemeriksaan Proposal" }]}
        aksi={lanjut}
      />

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-sogan-700">
        <span className="font-mono text-xs">{data.proposal.idProposal}</span>
        <span>{data.proposal.skema}</span>
        <span>Versi {data.proposal.kodeVersi}</span>
        <StatusBadge status={final ? "Selesai" : data.label} />
        <span className="inline-flex items-center gap-1.5">
          {data.deterministik.total > 0 && data.deterministik.gagal === 0 ? <CheckCircle2 aria-hidden className="size-4 text-daun-600" /> : <XCircle aria-hidden className="size-4 text-bata-600" />}
          {data.deterministik.total === 0
            ? "Belum ada hasil pemeriksaan butir deterministik"
            : data.deterministik.gagal === 0
              ? `Semua ${data.deterministik.total} butir deterministik lolos`
              : `${data.deterministik.lolos} dari ${data.deterministik.total} butir deterministik lolos, ${data.deterministik.gagal} gagal`}
        </span>
      </div>

      {data.berkas.length > 0 ? (
        <Bagian judul="Berkas Proposal" className="mb-6">
          <ul className="divide-y divide-sogan-100 rounded-md border border-sogan-200 bg-white">
            {data.berkas.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 break-words">
                  <span className="font-medium text-sogan-900">{f.nama}</span>
                  <span className="ml-2 text-xs text-sogan-600">
                    {f.peran === "naskah" ? "Naskah" : f.namaLampiran ? `Lampiran: ${f.namaLampiran}` : "Lampiran"} · {ukuranBerkas(f.ukuran)}
                  </span>
                </span>
                <TombolUnduh href={`/api/semar/proposal/${encodeURIComponent(data.proposal.idProposal)}/berkas/${f.id}`} ukuran="sm">
                  Unduh Berkas<span className="sr-only"> {f.nama}</span>
                </TombolUnduh>
              </li>
            ))}
          </ul>
        </Bagian>
      ) : null}

      {!data.semantik.siap ? (
        <Alert jenis="info" className="mb-6" judul="Rekomendasi sedang disiapkan">
          <span className="inline-flex items-center gap-2">
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {kali >= MAKS_POLLING ? "Pemeriksaan semantik belum selesai. Muat ulang halaman beberapa saat lagi." : "Halaman diperbarui otomatis begitu rekomendasi tersedia."}
          </span>
        </Alert>
      ) : null}
      {data.semantik.status === "Gagal" ? (
        <Alert jenis="peringatan" className="mb-6" judul="Pemeriksaan semantik gagal dijalankan">
          Butir semantik belum memiliki rekomendasi. Anda tetap dapat memeriksa teks secara manual.
        </Alert>
      ) : null}
      {final ? (
        <p className="mb-6 flex items-center gap-2 text-sm font-semibold text-sogan-700">
          <Lock aria-hidden className="size-4" /> Penilaian final: koreksi tidak dapat diubah lagi.
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <Bagian judul="Teks Proposal" className="min-w-0">
          <Tabs value={tabAktif} onValueChange={ubahTab}>
            <TabsList aria-label="Bagian proposal">
              {data.tab.map((t) => {
                const jumlah = butir.filter((b) => b.tab === t.nama);
                const manual = jumlah.some((b) => perluBacaSendiri(b.status));
                return (
                  <TabsTrigger key={t.nama} value={t.nama}>
                    {t.nama}
                    {jumlah.length ? (
                      <span className="ml-1 text-xs font-normal angka">
                        ({jumlah.length}
                        {manual ? (
                          <>
                            <span aria-hidden className="ml-0.5 text-bata-700">!</span>
                            <span className="sr-only">, ada butir yang harus dibaca sendiri</span>
                          </>
                        ) : null})
                      </span>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {data.tab.map((t) => {
              const rentang = butirTerpilih?.tab === t.nama ? cariKutipan(t.teks, butirTerpilih.kutipan) : null;
              return (
                <TabsContent key={t.nama} value={t.nama} className="max-h-[65vh] overflow-y-auto overscroll-contain whitespace-pre-wrap break-words text-[15px] leading-relaxed text-sogan-900">
                  {t.teks.trim() === "" ? (
                    <span className="italic text-sogan-600">Bagian ini tidak ditemukan pada naskah.</span>
                  ) : rentang ? (
                    <>
                      {t.teks.slice(0, rentang.mulai)}
                      <mark
                        ref={(el) => {
                          tandaRef.current = el;
                        }}
                        className="rounded bg-emas-300 px-0.5 text-sogan-900 ring-2 ring-emas-500"
                      >
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
        </Bagian>

        <Bagian
          judul="Butir Semantik"
          className="min-w-0 self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overscroll-contain"
          aksi={
            <span className="text-xs text-sogan-700 angka">
              {ringkas.total} butir, {ringkas.dikoreksi} dikoreksi
            </span>
          }
        >
          {butirTab.length === 0 ? (
            <p className="rounded-md border border-dashed border-sogan-300 px-4 py-6 text-center text-sm text-sogan-700">
              {data.butir.length === 0 && !data.semantik.siap ? "Menunggu rekomendasi…" : "Tidak ada butir semantik pada tab ini."}
            </p>
          ) : (
            <ul className="divide-y divide-sogan-100 rounded-md border border-sogan-200 bg-white">
              {butirTab.map((b) => {
                const sendiri = perluBacaSendiri(b.status);
                const dipilih = terpilih === b.hasilId;
                return (
                  <li key={b.hasilId} className={dipilih ? "bg-emas-50 shadow-[inset_3px_0_0_var(--color-emas-500)]" : undefined}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-pressed={dipilih}
                      aria-label={`Butir ${b.kode}: sorot kutipan di teks`}
                      onClick={() => pilihButir(b)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pilihButir(b);
                        }
                      }}
                      className="cursor-pointer space-y-2 px-3 pb-2 pt-3 touch-manipulation"
                    >
                      <p className="text-sm font-semibold text-sogan-900">
                        <span className="mr-1.5 font-mono text-xs font-medium text-emas-700">{b.kode}</span>
                        {b.deskripsi}
                      </p>
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-xs font-semibold text-sogan-700">{b.koreksi ? "Rekomendasi semula" : "Rekomendasi"}</span>
                        <span className={b.koreksi ? "opacity-60" : undefined}>
                          <StatusBadge status={b.status} />
                        </span>
                        {b.tiruan ? <StatusBadge status="tiruan" /> : null}
                        {sendiri ? <span className="text-xs font-semibold text-bata-700">Baca bagian ini sendiri</span> : null}
                      </p>
                      {b.status === "Perlu diperiksa manual" && b.rekomendasi ? (
                        <p className="text-xs text-sogan-700">Sistem merekomendasikan “{b.rekomendasi}”, tetapi kutipannya belum dapat dipastikan ada di teks.</p>
                      ) : null}
                      {b.kutipan ? (
                        <blockquote className="border-l-4 border-emas-500 pl-3 text-sm italic text-sogan-900">“{b.kutipan}”</blockquote>
                      ) : sendiri ? null : (
                        <p className="text-xs text-sogan-600">Tidak ada kutipan pendukung.</p>
                      )}
                      {b.tingkatKeyakinan !== null ? <BarKeyakinan nilai={b.tingkatKeyakinan} /> : null}
                      {b.alasanSistem ? <p className="text-xs text-sogan-700">Alasan sistem: {b.alasanSistem}</p> : null}
                      {b.koreksi ? (
                        <div className="rounded-md bg-sogan-50 p-2 text-sm">
                          <p className="flex flex-wrap items-center gap-2">
                            <StatusBadge status="Dikoreksi reviewer" />
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
                      <div className="px-3 pb-3">
                        <Button varian="sekunder" ukuran="sm" onClick={() => setButirKoreksi(b.hasilId)} aria-haspopup="dialog">
                          {b.koreksi ? "Ubah Koreksi" : "Tidak Setuju"}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-sogan-700">
            Butir yang tidak Anda koreksi dianggap disetujui. <span className="angka">{ringkas.disetujui}</span> disetujui, <span className="angka">{ringkas.dikoreksi}</span> dikoreksi
            {ringkas.tanpaRekomendasi ? <>, <span className="angka">{ringkas.tanpaRekomendasi}</span> perlu dibaca sendiri</> : null}.
          </p>
        </Bagian>
      </div>

      {butirDimodal ? (
        <ModalKoreksi
          key={butirDimodal.hasilId}
          penugasanId={data.penugasanId}
          butir={butirDimodal}
          saatTutup={() => setButirKoreksi(null)}
          saatTersimpan={(id, k) => {
            setKoreksiLokal((s) => ({ ...s, [id]: k }));
            setButirKoreksi(null);
            beriTahu.sukses(`Koreksi butir ${butirDimodal.kode} tersimpan`);
          }}
        />
      ) : null}
    </>
  );
}
