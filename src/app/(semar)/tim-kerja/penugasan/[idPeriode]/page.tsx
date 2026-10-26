import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Alert, KeadaanKosong, KepalaHalaman, Paginasi, kelasTombol } from "@/components/ui";
import { wajibTimKerja } from "@/lib/auth";
import { ambilFasetUsulan, ambilReviewerPeriode, ambilRingkasanPeriode, ambilUsulanBerfilter, hitungReviewerUsulan } from "@/lib/penugasan/layanan";
import { adaFilter, bacaFilterUsulan, bacaTabUsulan, halamanDariUrl, jumlahHalaman, ringkasBeban, ringkasStatusPenetapan, ukuranDariUrl, type TabUsulan } from "@/lib/penugasan/periode";
import { hitungTenggat, kapasitasReviewer } from "@/lib/penilaian/masa";
import { cn, formatAngka, formatTanggal } from "@/lib/utils";
import { BilahFilter } from "./bilah-filter";
import { FormSusun } from "./form-susun";
import { SebaranBeban } from "./sebaran-beban";
import { TabelUsulan } from "./tabel-usulan";
import { TombolTetapkan } from "./tombol-tetapkan";

export const metadata: Metadata = { title: "J-04b Usulan Penugasan" };
export const dynamic = "force-dynamic";
/** Susun dan Tetapkan pada skala 10.000 proposal berjalan sebagai server action halaman ini. */
export const maxDuration = 300;

type Param = Promise<{ idPeriode: string }>;
type Cari = Promise<Record<string, string | string[] | undefined>>;

const desimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

/**
 * J-04b Usulan Penugasan (UC-03 s.2-8), dirancang untuk ribuan proposal: satu tombol utama "Tetapkan Penugasan" di kepala, isian
 * batas beban + "Susun Usulan Penugasan" (dengan panel S-1 bersaran batas), ringkasan, lalu tiga tab ber-URL: Usulan Penugasan
 * (filter di server, centang banyak baris, kolom Syarat, Pindahkan M-06), Sebaran Beban (histogram + tabel), Sudah Ditetapkan.
 * Tab, filter, urutan, dan halaman tersimpan di URL sehingga Back dan tautan langsung bekerja.
 */
export default async function Halaman({ params, searchParams }: { params: Param; searchParams: Cari }) {
  await wajibTimKerja();
  const { idPeriode } = await params;
  const sp = await searchParams;
  const periode = await ambilRingkasanPeriode(idPeriode);
  if (!periode) notFound();

  const tab = bacaTabUsulan(sp.tab);
  const filter = bacaFilterUsulan(sp);
  const ukuran = ukuranDariUrl(sp.per);
  const statusTab = tab === "ditetapkan" ? "Ditetapkan" : "Diusulkan";

  const [reviewer, fasetUsulan, jumlahReviewerUsulan] = await Promise.all([
    ambilReviewerPeriode(periode.id),
    ambilFasetUsulan(periode.id, "Diusulkan"),
    hitungReviewerUsulan(periode.id),
  ]);
  const faset = tab === "ditetapkan" ? await ambilFasetUsulan(periode.id, "Ditetapkan") : fasetUsulan;
  const ringkas = ringkasBeban(
    reviewer.map((r) => r.beban),
    periode.batasBeban,
  );

  let daftar: { baris: Awaited<ReturnType<typeof ambilUsulanBerfilter>>["baris"]; total: number; halaman: number; jumlahHalaman: number } | null = null;
  if (tab !== "sebaran") {
    let halaman = halamanDariUrl(sp.hal, Number.MAX_SAFE_INTEGER);
    let h = await ambilUsulanBerfilter(periode.id, statusTab, filter, halaman, ukuran);
    const jh = jumlahHalaman(h.total, ukuran);
    if (halaman > jh) {
      halaman = jh;
      h = await ambilUsulanBerfilter(periode.id, statusTab, filter, halaman, ukuran);
    }
    daftar = { ...h, halaman, jumlahHalaman: jh };
  }

  const alamat = (t: TabUsulan, tambahan: Record<string, string> = {}) => {
    const p = new URLSearchParams({ ...(t === "usulan" ? {} : { tab: t }), ...tambahan });
    return `/tim-kerja/penugasan/${periode.id}${p.size ? `?${p.toString()}` : ""}`;
  };
  const tetap = Number.parseInt(String(sp.tetap ?? ""), 10);
  const kandidat = reviewer.map((r) => ({ id: r.id, nama: r.nama, institusi: r.institusi, beban: r.beban })).sort((a, b) => a.nama.localeCompare(b.nama));

  const TAB: { nilai: TabUsulan; label: string; jumlah: number }[] = [
    { nilai: "usulan", label: "Usulan Penugasan", jumlah: periode.diusulkan },
    { nilai: "sebaran", label: "Sebaran Beban", jumlah: reviewer.length },
    { nilai: "ditetapkan", label: "Sudah Ditetapkan", jumlah: periode.ditetapkan },
  ];

  return (
    <>
      <KepalaHalaman
        kode="J-04b"
        judul="Usulan Penugasan"
        keterangan={`${periode.nama} · ditutup ${formatTanggal(periode.tanggalTutup)}`}
        remah={[{ label: "Penugasan Reviewer", href: "/tim-kerja/penugasan" }, { label: periode.nama }]}
        aksi={
          <TombolTetapkan
            periodeId={periode.id}
            jumlahUsulan={periode.diusulkan}
            jumlahReviewer={jumlahReviewerUsulan}
            bebanMin={Math.min(...reviewer.filter((r) => r.beban > 0).map((r) => r.beban), ringkas.maks)}
            bebanMaks={ringkas.maks}
            batas={periode.batasBeban}
            melanggar={fasetUsulan.melanggar}
            ditutup={periode.ditutup}
            masa={periode.masa}
            tenggat={(periode.batasPenilaian ?? hitungTenggat(periode.sekarang, periode.masa.lamaHari)).toISOString()}
            masaDimulai={periode.mulaiPenilaian !== null}
          />
        }
      />

      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm" data-testid="ringkasan-periode">
        {[
          ["Proposal Terkirim", formatAngka(periode.terkirim)],
          ["Belum ditetapkan", formatAngka(periode.belumDitugaskan)],
          ["Usulan", formatAngka(periode.diusulkan)],
          ["Ditetapkan", formatAngka(periode.ditetapkan)],
          ["Reviewer bersedia", formatAngka(reviewer.length)],
          ["Beban per reviewer", ringkas.jumlahReviewer ? `${ringkas.min}–${ringkas.maks} (median ${desimal.format(ringkas.median)}) dari ${periode.batasBeban}` : "-"],
          ["Kapasitas per reviewer", `${formatAngka(kapasitasReviewer(periode.masa))} dalam ${periode.masa.lamaHari} hari`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-teks-redup">{k}</dt>
            <dd className="angka text-lg font-semibold text-primer-900">{v}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs text-teks-redup">Status penetapan</dt>
          <dd className="mt-1 text-sm font-semibold text-primer-900">{ringkasStatusPenetapan(periode)}</dd>
        </div>
      </dl>

      {!periode.ditutup ? (
        <Alert jenis="info" className="mt-6">
          Masa pengusulan periode ini belum ditutup, jadi usulan belum dapat disusun dan ditetapkan.
        </Alert>
      ) : null}

      <FormSusun
        periodeId={periode.id}
        batasAwal={periode.batasBeban}
        ditutup={periode.ditutup}
        jumlahUsulan={periode.diusulkan}
        perluDitugaskan={periode.belumDitugaskan}
        susunOtomatis={sp.susun === "1"}
        masaAwal={periode.masa}
        mulaiPenilaian={periode.mulaiPenilaian?.toISOString() ?? null}
        batasPenilaian={periode.batasPenilaian?.toISOString() ?? null}
      />

      {Number.isFinite(tetap) && tetap > 0 ? (
        <Alert jenis="sukses" className="mt-6">
          Penugasan telah ditetapkan dan tercatat di BIMA ({formatAngka(tetap)} proposal). Reviewer menerimanya dengan tanda &ldquo;Baru&rdquo; di Daftar Penugasan (J-07).
        </Alert>
      ) : null}

      <nav aria-label="Bagian usulan penugasan" className="mt-8 flex flex-wrap gap-1 border-b border-primer-200">
        {TAB.map((t) => (
          <Link
            key={t.nilai}
            href={alamat(t.nilai)}
            aria-current={tab === t.nilai ? "page" : undefined}
            scroll={false}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
              tab === t.nilai ? "border-primer-400 text-primer-900" : "border-transparent text-primer-700 hover:text-primer-900",
            )}
          >
            {t.label} <span className="angka font-normal text-teks-redup">({formatAngka(t.jumlah)})</span>
          </Link>
        ))}
      </nav>

      <div className="pt-4">
        {tab === "sebaran" ? (
          <SebaranBeban reviewer={reviewer} ringkas={ringkas} batas={periode.batasBeban} alamatUsulan={(id) => alamat("usulan", { rev: id })} />
        ) : daftar ? (
          <>
            {tab === "ditetapkan" && periode.ditetapkan > 0 ? (
              <p className="mb-3 flex flex-wrap gap-2">
                <Link href={`/tim-kerja/pemantauan?periode=${periode.id}`} className={kelasTombol("sekunder", "sm")}>
                  Pantau Kesesuaian
                </Link>
                <Link href="/bima/kotak-masuk" className={kelasTombol("hantu", "sm")}>
                  Kotak Masuk BIMA (simulasi)
                </Link>
              </p>
            ) : null}
            {(tab === "usulan" ? periode.diusulkan : periode.ditetapkan) > 0 ? <BilahFilter faset={faset} filter={filter} ukuran={ukuran} jenis={tab === "ditetapkan" ? "ditetapkan" : "usulan"} /> : null}
            {daftar.total > 0 ? (
              <>
                <TabelUsulan
                  key={`${tab}:${JSON.stringify(filter)}:${faset.stempel}`}
                  mode={tab === "ditetapkan" ? "ditetapkan" : "usulan"}
                  periodeId={periode.id}
                  baris={daftar.baris}
                  total={daftar.total}
                  filter={filter}
                  kandidat={kandidat}
                  batas={periode.batasBeban}
                  mulai={(daftar.halaman - 1) * ukuran + 1}
                />
                <Suspense fallback={null}>
                  <Paginasi halaman={daftar.halaman} jumlahHalaman={daftar.jumlahHalaman} parameter="hal" />
                </Suspense>
              </>
            ) : adaFilter(filter) ? (
              <KeadaanKosong
                judul="Tidak ada yang cocok dengan filter ini"
                aksi={
                  <Link href={alamat(tab)} className={kelasTombol("sekunder", "sm")}>
                    Hapus filter
                  </Link>
                }
              >
                Coba kata lain, pilih reviewer atau institusi lain, atau hapus filter untuk melihat semuanya.
              </KeadaanKosong>
            ) : tab === "usulan" ? (
              <KeadaanKosong judul={periode.belumDitugaskan > 0 ? "Belum ada usulan penugasan" : "Semua proposal sudah ditugaskan"}>
                {periode.belumDitugaskan > 0
                  ? `${formatAngka(periode.belumDitugaskan)} proposal Terkirim belum punya reviewer. Isi batas beban, lalu tekan "Susun Usulan Penugasan".`
                  : "Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini."}
              </KeadaanKosong>
            ) : (
              <KeadaanKosong judul="Belum ada penugasan yang ditetapkan">Usulan yang ditetapkan akan tampil di sini dan tercatat di BIMA.</KeadaanKosong>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
