"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BarKeyakinan, Bagian, Checkbox, Select, StatusBadge, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { cariKutipan } from "@/lib/pemeriksa/semantik/teks";
import { nomorButirPerTab, type RentangSorot } from "@/lib/penilaian/sorotan";
import type { ButirTampil, TabTeks } from "@/lib/penilaian/tipe";
import { perluBacaSendiri } from "@/lib/penilaian/status";
import { TeksBersorot, idDomPenggalan, idPenggalan } from "./teks-bersorot";

/** Simpan pilihan tampilan di URL tanpa menambah riwayat (tombol Back tetap keluar dari layar ini). Kode butir hanya dipakai di URL. */
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

/** Semua kutipan bukti butir (utama lalu yang lain). */
const kutipanButir = (b: ButirTampil) => (b.kutipan ? [b.kutipan, ...b.kutipanLain] : []);

/** Kutipan "[gambar n]" ditampilkan sebagai nama gambarnya. */
const tampilKutipan = (k: string) => {
  const m = /^\[gambar (\d+)\]$/i.exec(k.trim());
  return m ? `Isi gambar ${m[1]} di bagian ini` : `“${k}”`;
};

/**
 * Rentang kutipan bukti di teks satu tab: setiap kutipan butir yang tampil di tab itu, atau hanya butir terpilih bila sorotan semua
 * butir dimatikan. Butir tanpa kutipan sah (mis. Perlu diperiksa manual) tidak menyorot apa pun.
 */
function rentangTab(t: TabTeks, butir: ButirTampil[], semua: boolean, terpilih: string | null): RentangSorot[] {
  const hasil: RentangSorot[] = [];
  for (const b of butir) {
    if (b.tab !== t.nama || (!semua && b.hasilId !== terpilih)) continue;
    kutipanButir(b).forEach((k, i) => {
      const r = cariKutipan(t.teks, k);
      if (r) hasil.push({ id: idPenggalan(b.hasilId, i), mulai: r.mulai, akhir: r.akhir });
    });
  }
  return hasil;
}

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

/** Nomor tampil butir (pengganti kode butir); pembaca layar mendengar "Butir n". */
function NomorButir({ n }: { n: number | undefined }) {
  return (
    <span className="mr-2 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primer-100 align-text-bottom text-xs font-semibold tabular-nums text-primer-800">
      <span className="sr-only">Butir </span>
      {n}
      <span className="sr-only">: </span>
    </span>
  );
}

/**
 * Naskah per bagian dengan sorotan kutipan bukti dan panel butir semantik, dipakai bersama J-08 (reviewer; `aksiButir` mengisi tombol
 * koreksi) dan tampilan cek penilaian Tim Kerja J-05b dan J-03b (hanya baca). Butir dikenali dengan nomor urut per bagian dan
 * deskripsinya; kode butir hanya dipakai di URL (?tab=&butir=).
 */
export function TinjauanNaskah({
  tab,
  butir,
  alamatGambar,
  tabAwal,
  butirAwal,
  menunggu = false,
  aksiButir,
  ringkasPanel,
  catatanPanel,
  judulTeks = "Teks Proposal",
}: {
  tab: TabTeks[];
  butir: ButirTampil[];
  /** awalan URL gambar naskah; gambar n dimuat dari `${alamatGambar}/${idGambar}` (string supaya dapat dikirim dari halaman server) */
  alamatGambar: string;
  tabAwal?: string;
  /** kode butir dari URL */
  butirAwal?: string;
  /** rekomendasi semantik belum tersedia */
  menunggu?: boolean;
  /** tombol per kartu butir (reviewer: koreksi); tanpa ini panel hanya baca */
  aksiButir?: (b: ButirTampil) => ReactNode;
  ringkasPanel?: ReactNode;
  catatanPanel?: ReactNode;
  judulTeks?: string;
}) {
  const butirDariUrl = butir.find((b) => b.kode === butirAwal) ?? null;
  const urlGambar = (id: string) => `${alamatGambar}/${id}`;
  const [tabAktif, setTabAktif] = useState(() => {
    if (butirDariUrl) return butirDariUrl.tab;
    if (tab.some((t) => t.nama === tabAwal)) return tabAwal as string;
    // Bagian pertama yang punya butir semantik (Judul biasanya tidak punya), supaya daftar butir tidak kosong saat dibuka.
    const berButir = tab.find((t) => butir.some((b) => b.tab === t.nama));
    return (berButir ?? tab[0])?.nama ?? "";
  });
  const [terpilih, setTerpilih] = useState<string | null>(butirDariUrl?.hasilId ?? null);
  // penggalan yang dituju (k = urutan kutipan butir terpilih) dan asal pilihan: dari teks cukup digulir seperlunya
  const [fokus, setFokus] = useState<{ k: number; dariTeks: boolean; nomor: number }>({ k: 0, dariTeks: false, nomor: 0 });
  const [sorotSemua, setSorotSemua] = useState(true);

  const butirTab = butir.filter((b) => b.tab === tabAktif);
  const butirTerpilih = butir.find((b) => b.hasilId === terpilih) ?? null;
  const petaButir = useMemo(() => new Map(butir.map((b) => [b.hasilId, b])), [butir]);
  const nomor = useMemo(() => nomorButirPerTab(butir), [butir]);
  const rentangPerTab = useMemo(() => new Map(tab.map((t) => [t.nama, rentangTab(t, butir, sorotSemua, terpilih)])), [tab, butir, sorotSemua, terpilih]);

  // Pilih butir atau kutipan: gulir teks ke penggalannya (tanpa gulir halus bila pengguna meminta gerak dikurangi)
  useEffect(() => {
    if (!terpilih) return;
    const el = document.getElementById(idDomPenggalan(idPenggalan(terpilih, fokus.k)));
    if (!el) return;
    const kurang = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: kurang ? "auto" : "smooth", block: fokus.dariTeks ? "nearest" : "center" });
  }, [terpilih, tabAktif, fokus]);

  function ubahTab(t: string) {
    setTabAktif(t);
    simpanDiUrl(t, butirTerpilih?.tab === t ? butirTerpilih.kode : null);
  }

  function pilihButir(b: ButirTampil, k = 0) {
    setTerpilih(b.hasilId);
    setFokus((f) => ({ k, dariTeks: false, nomor: f.nomor + 1 }));
    if (b.tab !== tabAktif) setTabAktif(b.tab);
    simpanDiUrl(b.tab, b.kode);
  }

  // Penanda butir di teks: pilih butir itu dan tampilkan kartunya di panel Butir Semantik (layar lebar: panel berdampingan)
  function pilihDariTeks(id: string) {
    const i = id.lastIndexOf("#");
    const b = petaButir.get(id.slice(0, i));
    if (!b) return;
    setTerpilih(b.hasilId);
    setFokus((f) => ({ k: Number(id.slice(i + 1)), dariTeks: true, nomor: f.nomor + 1 }));
    simpanDiUrl(b.tab, b.kode);
    if (window.matchMedia("(min-width: 1024px)").matches) {
      document.querySelector(`li[data-hasil="${b.hasilId}"]`)?.scrollIntoView({ block: "nearest" });
    }
  }

  const jumlahSorot = rentangPerTab.get(tabAktif)?.length ?? 0;

  return (
    <Tabs value={tabAktif} onValueChange={ubahTab} orientation="vertical" className="grid gap-6 lg:grid-cols-[3fr_2fr] xl:grid-cols-[11rem_minmax(0,1fr)_22rem]">
      {/* navigasi bagian: daftar vertikal lengket di layar lebar (tidak melipat), pilihan di layar sempit */}
      <TabsList aria-label="Bagian proposal" className="hidden flex-col flex-nowrap gap-0 border-b-0 border-l border-primer-200 xl:sticky xl:top-4 xl:flex xl:self-start">
        {tab.map((t) => (
          <TabsTrigger key={t.nama} value={t.nama} className="-ml-px mb-0 w-full whitespace-normal border-b-0 border-l-2 py-2 pl-3 pr-2 text-left leading-snug data-[state=active]:border-primer-400 data-[state=active]:bg-primer-50">
            {t.nama}
            <LencanaJumlah butir={butir} tab={t.nama} />
          </TabsTrigger>
        ))}
      </TabsList>

      <Bagian
        judul={judulTeks}
        className="min-w-0"
        aksi={<Checkbox id="sorot-semua" label="Sorot bukti semua butir" checked={sorotSemua} onCheckedChange={(v) => setSorotSemua(v === true)} />}
      >
        <div className="mb-3 xl:hidden">
          <label htmlFor="pilih-bagian" className="mb-1 block text-xs font-semibold text-teks-redup">
            Bagian proposal
          </label>
          <Select id="pilih-bagian" value={tabAktif} onChange={(e) => ubahTab(e.target.value)}>
            {tab.map((t) => {
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
            <ul className="mt-1 space-y-2">
              {butirTab.map((b) => (
                <li key={b.hasilId} className="flex items-start text-sm">
                  <NomorButir n={nomor.get(b.hasilId)} />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-primer-900">{b.deskripsi}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <StatusBadge status={b.status} />
                      <button type="button" onClick={() => pilihButir(b)} className="cursor-pointer text-xs font-semibold text-primer-800 underline underline-offset-2">
                        Lihat kutipan di teks
                      </button>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-teks-redup">Rinciannya ada di bagian Butir Semantik di bawah teks.</p>
          </div>
        ) : null}
        {jumlahSorot > 0 ? (
          <p className="mb-2 text-xs text-teks-redup">
            <mark className="rounded-[2px] bg-peringatan-100 px-1 text-primer-900 shadow-[inset_0_-2px_0_var(--color-peringatan-300)]">Penggalan bersorot</mark> dikutip sistem sebagai bukti rekomendasi
            {sorotSemua ? (
              <>
                {" "}
                (<span className="angka">{jumlahSorot}</span> di bagian ini)
              </>
            ) : (
              " butir terpilih"
            )}
            . Nomor di ujungnya membuka rincian butirnya.
          </p>
        ) : null}
        <div>
          {tab.map((t) => (
            <TabsContent key={t.nama} value={t.nama} className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words text-[15px] leading-relaxed text-primer-900 lg:max-h-[65vh] lg:overscroll-contain">
              {t.teks.trim() === "" ? (
                <span className="italic text-teks-redup">Bagian ini tidak ditemukan pada naskah.</span>
              ) : (
                <TeksBersorot
                  teks={t.teks}
                  rentang={rentangPerTab.get(t.nama) ?? []}
                  butir={petaButir}
                  nomor={nomor}
                  terpilih={terpilih}
                  gambar={t.gambar}
                  urlGambar={urlGambar}
                  namaBagian={t.nama}
                  saatPilih={pilihDariTeks}
                />
              )}
            </TabsContent>
          ))}
        </div>
      </Bagian>

      <Bagian judul="Butir Semantik" className="min-w-0 self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overscroll-contain" aksi={ringkasPanel}>
        {butirTab.length > 0 ? <p className="mb-2 text-xs text-teks-redup">Tingkat keyakinan memakai ambang contoh: tinggi {"≥"} 0,8; sedang 0,5 sampai 0,8; rendah {"<"} 0,5.</p> : null}
        {butirTab.length === 0 ? (
          <p className="rounded-md border border-dashed border-primer-300 px-4 py-6 text-center text-sm text-teks-redup">
            {butir.length === 0 && menunggu ? "Menunggu rekomendasi…" : "Tidak ada butir semantik pada bagian ini."}
          </p>
        ) : (
          <ul className="divide-y divide-primer-100 rounded-md border border-primer-200 bg-white">
            {butirTab.map((b) => {
              const sendiri = perluBacaSendiri(b.status);
              const dipilih = terpilih === b.hasilId;
              const n = nomor.get(b.hasilId);
              const aksi = aksiButir?.(b);
              return (
                <li key={b.hasilId} data-hasil={b.hasilId} className={dipilih ? "scroll-my-2 bg-primer-50 shadow-[inset_3px_0_0_var(--color-primer-400)]" : "scroll-my-2"}>
                  <article aria-labelledby={`judul-butir-${b.hasilId}`} className="space-y-2 px-3 pb-2 pt-3">
                    {/* tombol semantik: menyorot kutipan di teks; isi butir tetap terbaca pembaca layar */}
                    <button
                      type="button"
                      id={`judul-butir-${b.hasilId}`}
                      aria-pressed={dipilih}
                      title="Sorot kutipan di teks"
                      onClick={() => pilihButir(b)}
                      className="flex w-full cursor-pointer touch-manipulation items-start text-left text-sm font-semibold text-primer-900 hover:text-primer-700"
                    >
                      <NomorButir n={n} />
                      <span>{b.deskripsi}</span>
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
                      <div className="space-y-2">
                        {kutipanButir(b).length > 1 ? <p className="text-xs font-semibold text-teks-redup">Kutipan bukti ({kutipanButir(b).length})</p> : null}
                        {kutipanButir(b).map((k, i) => (
                          <div key={i}>
                            <blockquote className="border-l-4 border-peringatan-300 pl-3 text-sm text-primer-900">{tampilKutipan(k)}</blockquote>
                            <button
                              type="button"
                              onClick={() => pilihButir(b, i)}
                              className="ml-4 mt-0.5 inline-flex min-h-6 cursor-pointer items-center text-xs font-semibold text-primer-700 underline underline-offset-2 hover:text-primer-800"
                            >
                              Tunjukkan di Teks
                              <span className="sr-only">{kutipanButir(b).length > 1 ? ` (kutipan ${i + 1} butir ${n})` : ` (butir ${n})`}</span>
                            </button>
                          </div>
                        ))}
                      </div>
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
                  {aksi ? <div className="px-3 pb-3">{aksi}</div> : null}
                </li>
              );
            })}
          </ul>
        )}
        {catatanPanel ? <div className="mt-3 text-xs text-teks-redup">{catatanPanel}</div> : null}
      </Bagian>
    </Tabs>
  );
}
