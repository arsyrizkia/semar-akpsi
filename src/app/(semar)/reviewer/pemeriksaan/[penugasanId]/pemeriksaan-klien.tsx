"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, FileText, Loader2, Lock, XCircle } from "lucide-react";
import {
  Alert,
  BarKeyakinan,
  Bagian,
  Button,
  Select,
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

/** Jumlah butir semantik per bagian; tanda seru (dengan teks bantu) bila ada butir yang harus dibaca sendiri. */
function LencanaJumlah({ butir, tab }: { butir: ButirTampil[]; tab: string }) {
  const jumlah = butir.filter((b) => b.tab === tab);
  if (!jumlah.length) return null;
  const manual = jumlah.some((b) => perluBacaSendiri(b.status));
  return (
    <span className="ml-1 text-xs font-normal angka">
      ({jumlah.length}
      {manual ? (
        <>
          <span aria-hidden className="ml-0.5 text-bata-700">!</span>
          <span className="sr-only">, ada butir yang harus dibaca sendiri</span>
        </>
      ) : null})
    </span>
  );
}

export function PemeriksaanKlien({ data, tabAwal, butirAwal }: { data: DataPemeriksaan; tabAwal?: string; butirAwal?: string }) {
  const router = useRouter();
  const butirDariUrl = data.butir.find((b) => b.kode === butirAwal) ?? null;
  const [tabAktif, setTabAktif] = useState(() => {
    if (butirDariUrl) return butirDariUrl.tab;
    if (data.tab.some((t) => t.nama === tabAwal)) return tabAwal as string;
    // Bagian pertama yang punya butir semantik (Judul biasanya tidak punya), supaya daftar butir tidak kosong saat dibuka.
    const berButir = data.tab.find((t) => data.butir.some((b) => b.tab === t.nama));
    return (berButir ?? data.tab[0])?.nama ?? "";
  });
  const [terpilih, setTerpilih] = useState<string | null>(butirDariUrl?.hasilId ?? null);
  const [koreksiLokal, setKoreksiLokal] = useState<Record<string, KoreksiTampil>>({});
  const [butirKoreksi, setButirKoreksi] = useState<string | null>(null); // M-10 terbuka untuk butir ini
  const tandaRef = useRef<HTMLElement | null>(null);
  const final = data.penilaian.status === "Final";
  const naskah = data.berkas.find((f) => f.peran === "naskah") ?? data.berkas[0] ?? null;
  const lampiran = data.berkas.filter((f) => f !== naskah);
  const unduhBerkas = (id: string) => `/api/semar/proposal/${encodeURIComponent(data.proposal.idProposal)}/berkas/${id}`;

  const butir: ButirTampil[] = useMemo(() => data.butir.map((b) => ({ ...b, koreksi: koreksiLokal[b.hasilId] ?? b.koreksi })), [data.butir, koreksiLokal]);
  const butirTab = butir.filter((b) => b.tab === tabAktif);
  const butirTerpilih = butir.find((b) => b.hasilId === terpilih) ?? null;
  const butirDimodal = butir.find((b) => b.hasilId === butirKoreksi) ?? null;
  // M-10 tetap terpasang sesudah ditutup (supaya fokus dapat kembali ke tombol pemicu); `nomorBuka` memberi isian segar tiap dibuka
  const [terakhir, setTerakhir] = useState<{ id: string; nomor: number } | null>(null);
  const butirModalTerakhir = terakhir ? (butir.find((b) => b.hasilId === terakhir.id) ?? null) : null;
  const bukaKoreksi = (id: string) => {
    setTerakhir((t) => ({ id, nomor: (t?.nomor ?? 0) + 1 }));
    setButirKoreksi(id);
  };
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
        aksi={
          <>
            <Link href="/reviewer/penugasan" className={kelasTombol("hantu", "md")}>
              Kembali ke Daftar Penugasan
            </Link>
            {lanjut}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-teks-redup">
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

      {naskah ? (
        <section aria-labelledby="judul-berkas" className="mb-4 rounded-md border border-primer-200 bg-white text-sm">
          <h2 id="judul-berkas" className="sr-only">Berkas Proposal</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
            <FileText aria-hidden className="size-4 shrink-0 text-teks-redup" />
            <span className="min-w-0 break-words">
              <span className="font-medium text-primer-900">{naskah.nama}</span>
              <span className="ml-2 text-xs text-teks-redup">
                {naskah.peran === "naskah" ? "Naskah" : "Berkas"} · {ukuranBerkas(naskah.ukuran)}
              </span>
            </span>
            <TombolUnduh href={unduhBerkas(naskah.id)} ukuran="sm" className="ml-auto">
              Unduh Berkas<span className="sr-only"> {naskah.nama}</span>
            </TombolUnduh>
          </div>
          {lampiran.length > 0 ? (
            <details className="group border-t border-primer-100">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teks-redup hover:text-primer-900 [&::-webkit-details-marker]:hidden">
                <ChevronRight aria-hidden className="size-4 transition-transform duration-150 group-open:rotate-90" />
                Lampiran ({lampiran.length})
              </summary>
              <ul className="divide-y divide-primer-100 border-t border-primer-100">
                {lampiran.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="min-w-0 break-words">
                      <span className="font-medium text-primer-900">{f.nama}</span>
                      <span className="ml-2 text-xs text-teks-redup">
                        {f.namaLampiran ? `Lampiran: ${f.namaLampiran}` : "Lampiran"} · {ukuranBerkas(f.ukuran)}
                      </span>
                    </span>
                    <TombolUnduh href={unduhBerkas(f.id)} ukuran="sm">
                      Unduh Berkas<span className="sr-only"> {f.nama}</span>
                    </TombolUnduh>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
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
        <p className="mb-6 flex items-center gap-2 text-sm font-semibold text-teks-redup">
          <Lock aria-hidden className="size-4" /> Penilaian final: koreksi tidak dapat diubah lagi.
        </p>
      ) : null}

      <Tabs value={tabAktif} onValueChange={ubahTab} orientation="vertical" className="grid gap-6 lg:grid-cols-[3fr_2fr] xl:grid-cols-[11rem_minmax(0,1fr)_22rem]">
        {/* navigasi bagian: daftar vertikal lengket di layar lebar (tidak melipat), pilihan di layar sempit */}
        <TabsList aria-label="Bagian proposal" className="hidden flex-col flex-nowrap gap-0 border-b-0 border-l border-primer-200 xl:sticky xl:top-4 xl:flex xl:self-start">
          {data.tab.map((t) => (
            <TabsTrigger key={t.nama} value={t.nama} className="-ml-px mb-0 w-full whitespace-normal border-b-0 border-l-2 py-2 pl-3 pr-2 text-left leading-snug data-[state=active]:border-primer-400 data-[state=active]:bg-primer-50">
              {t.nama}
              <LencanaJumlah butir={butir} tab={t.nama} />
            </TabsTrigger>
          ))}
        </TabsList>

        <Bagian judul="Teks Proposal" className="min-w-0">
          <div className="mb-3 xl:hidden">
            <label htmlFor="pilih-bagian" className="mb-1 block text-xs font-semibold text-teks-redup">Bagian proposal</label>
            <Select id="pilih-bagian" value={tabAktif} onChange={(e) => ubahTab(e.target.value)}>
              {data.tab.map((t) => {
                const jumlah = butir.filter((b) => b.tab === t.nama).length;
                return (
                  <option key={t.nama} value={t.nama}>
                    {t.nama}
                    {jumlah ? ` (${jumlah} butir)` : ""}
                  </option>
                );
              })}
            </Select>
          </div>
          {butirTab.length > 0 ? (
            <div className="mb-3 rounded-md border border-primer-200 bg-latar px-3 py-2 lg:hidden">
              <p className="text-xs font-semibold text-teks-redup">Butir semantik untuk bagian ini ({butirTab.length})</p>
              <ul className="mt-1 space-y-1">
                {butirTab.map((b) => (
                  <li key={b.hasilId} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-mono text-xs text-teks-redup">{b.kode}</span>
                    <StatusBadge status={b.status} />
                    <button type="button" onClick={() => pilihButir(b)} className="cursor-pointer text-xs font-semibold text-primer-800 underline underline-offset-2">
                      Lihat kutipan di teks
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-teks-redup">Rincian dan koreksi ada di bagian Butir Semantik di bawah teks.</p>
            </div>
          ) : null}
          <div>
            {data.tab.map((t) => {
              const rentang = butirTerpilih?.tab === t.nama ? cariKutipan(t.teks, butirTerpilih.kutipan) : null;
              return (
                <TabsContent key={t.nama} value={t.nama} className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap lg:max-h-[65vh] lg:overscroll-contain break-words text-[15px] leading-relaxed text-primer-900">
                  {t.teks.trim() === "" ? (
                    <span className="italic text-teks-redup">Bagian ini tidak ditemukan pada naskah.</span>
                  ) : rentang ? (
                    <>
                      {t.teks.slice(0, rentang.mulai)}
                      <mark
                        ref={(el) => {
                          tandaRef.current = el;
                        }}
                        className="rounded bg-peringatan-300 px-0.5 text-primer-900 ring-2 ring-peringatan-500"
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
          </div>
        </Bagian>

        <Bagian
          judul="Butir Semantik"
          className="min-w-0 self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overscroll-contain"
          aksi={
            <span className="text-xs text-teks-redup angka">
              {ringkas.total} butir, {ringkas.dikoreksi} dikoreksi
            </span>
          }
        >
          {butirTab.length > 0 ? <p className="mb-2 text-xs text-teks-redup">Tingkat keyakinan memakai ambang contoh: tinggi {"≥"} 0,8; sedang 0,5 sampai 0,8; rendah {"<"} 0,5.</p> : null}
          {butirTab.length === 0 ? (
            <p className="rounded-md border border-dashed border-primer-300 px-4 py-6 text-center text-sm text-teks-redup">
              {data.butir.length === 0 && !data.semantik.siap ? "Menunggu rekomendasi…" : "Tidak ada butir semantik pada tab ini."}
            </p>
          ) : (
            <ul className="divide-y divide-primer-100 rounded-md border border-primer-200 bg-white">
              {butirTab.map((b) => {
                const sendiri = perluBacaSendiri(b.status);
                const dipilih = terpilih === b.hasilId;
                return (
                  <li key={b.hasilId} className={dipilih ? "bg-primer-50 shadow-[inset_3px_0_0_var(--color-primer-400)]" : undefined}>
                    <article aria-labelledby={`judul-butir-${b.hasilId}`} className="space-y-2 px-3 pb-2 pt-3">
                      {/* tombol semantik: menyorot kutipan di teks; isi butir tetap terbaca pembaca layar */}
                      <button
                        type="button"
                        id={`judul-butir-${b.hasilId}`}
                        aria-pressed={dipilih}
                        title="Sorot kutipan di teks"
                        onClick={() => pilihButir(b)}
                        className="block w-full cursor-pointer touch-manipulation text-left text-sm font-semibold text-primer-900 hover:text-primer-700"
                      >
                        <span className="mr-1.5 font-mono text-xs font-medium text-teks-redup">{b.kode}</span>
                        {b.deskripsi}
                      </button>
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-xs font-semibold text-teks-redup">{b.koreksi ? "Rekomendasi semula" : "Rekomendasi"}</span>
                        <span className={b.koreksi ? "opacity-60" : undefined}>
                          <StatusBadge status={b.status} />
                        </span>
                        {b.tiruan ? <StatusBadge status="tiruan" /> : null}
                        {sendiri ? <span className="text-xs font-semibold text-bata-700">Baca bagian ini sendiri</span> : null}
                      </p>
                      {b.status === "Perlu diperiksa manual" && b.rekomendasi ? (
                        <p className="text-xs text-teks-redup">Sistem merekomendasikan “{b.rekomendasi}”, tetapi kutipannya belum dapat dipastikan ada di teks.</p>
                      ) : null}
                      {b.kutipan ? (
                        <blockquote className="border-l-4 border-primer-400 pl-3 text-sm text-primer-900">“{b.kutipan}”</blockquote>
                      ) : sendiri ? null : (
                        <p className="text-xs text-teks-redup">Tidak ada kutipan pendukung.</p>
                      )}
                      {b.tingkatKeyakinan !== null ? <BarKeyakinan nilai={b.tingkatKeyakinan} /> : null}
                      {b.alasanSistem ? <p className="text-xs text-teks-redup">Alasan sistem: {b.alasanSistem}</p> : null}
                      {b.koreksi ? (
                        <div className="rounded-md bg-primer-50 p-2 text-sm">
                          <p className="flex flex-wrap items-center gap-2">
                            <StatusBadge status="Dikoreksi reviewer" />
                            <StatusBadge status={b.koreksi.keputusan} />
                          </p>
                          <p className="mt-1 text-xs text-teks-redup">
                            {b.koreksi.jenisKekeliruan ? `${b.koreksi.jenisKekeliruan}: ` : ""}
                            {b.koreksi.alasan}
                          </p>
                        </div>
                      ) : null}
                    </article>
                    {!final ? (
                      <div className="px-3 pb-3">
                        <Button varian="sekunder" ukuran="sm" onClick={() => bukaKoreksi(b.hasilId)} aria-haspopup="dialog">
                          {b.koreksi ? "Ubah Koreksi" : "Tidak Setuju"}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-teks-redup">
            Butir yang tidak Anda koreksi dianggap disetujui. <span className="angka">{ringkas.disetujui}</span> disetujui, <span className="angka">{ringkas.dikoreksi}</span> dikoreksi
            {ringkas.tanpaRekomendasi ? <>, <span className="angka">{ringkas.tanpaRekomendasi}</span> perlu dibaca sendiri</> : null}.
          </p>
        </Bagian>
      </Tabs>

      {butirModalTerakhir ? (
        <ModalKoreksi
          key={`${butirModalTerakhir.hasilId}-${terakhir?.nomor ?? 0}`}
          buka={butirDimodal !== null}
          penugasanId={data.penugasanId}
          butir={butirModalTerakhir}
          saatTutup={() => setButirKoreksi(null)}
          saatTersimpan={(id, k) => {
            setKoreksiLokal((s) => ({ ...s, [id]: k }));
            setButirKoreksi(null);
            beriTahu.sukses(`Koreksi butir ${butirModalTerakhir.kode} tersimpan`);
          }}
        />
      ) : null}
    </>
  );
}
