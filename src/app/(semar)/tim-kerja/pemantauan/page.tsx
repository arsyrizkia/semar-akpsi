import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Sparkline } from "@/components/grafik/batang";
import { KeadaanKosong, KepalaHalaman } from "@/components/ui";
import { wajibTimKerja } from "@/lib/auth";
import type { TabPemantauan } from "@/lib/pemantauan/alamat";
import { daftarPeriode, daftarSkema, periodeBawaan, susunKemajuan, susunLaporan } from "@/lib/pemantauan/layanan";
import { waktuDemo } from "@/lib/waktu";
import { formatPersen } from "@/lib/pemantauan/rekap";
import { cn, formatAngka } from "@/lib/utils";
import { BilahPilihan } from "./bilah-pilihan";
import { PerluPerhatian } from "./perlu-perhatian";
import { RincianButir } from "./rincian-butir";
import { PanelTab } from "./navigasi";
import { TabDeterministik, TabTren } from "./tab-isi";
import { TabSemantik } from "./tab-semantik";
import { TabKemajuan, kalimatMasa } from "./tab-kemajuan";
import { PenyediaTandai } from "./tandai";

export const metadata: Metadata = { title: "J-05 Pemantauan Kesesuaian" };
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;
const satu = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * J-05 Pemantauan Kesesuaian (UC-04), tata letak "triase dulu": angka ringkas, daftar Perlu perhatian (butir di bawah ambang, bisa
 * langsung ditandai lewat M-09), lalu tiga tab ber-URL (Butir Semantik, Gagal Deterministik, Tren dan Kalibrasi). Nama butir dan
 * "Rincian" membuka M-08 (`?butir=`). Laporan dihitung sekali per periode dan skema; tab, urutan, dan M-08 hanya mengganti URL di klien
 * (navigasi.tsx), jadi tidak memuat ulang laporan.
 */
export default async function Halaman({ searchParams }: { searchParams: Params }) {
  const sesi = await wajibTimKerja();
  const sp = await searchParams;
  const [periodeAda, skemaAda] = await Promise.all([daftarPeriode(), daftarSkema()]);
  const periode = periodeAda.find((p) => p.id === satu(sp.periode)) ?? (await periodeBawaan(periodeAda));
  const skema = skemaAda.find((s) => s.id === satu(sp.skema)) ?? skemaAda[0];

  const kepala = <KepalaHalaman kode="J-05" judul="Pemantauan Kesesuaian" keterangan="Butir mana yang rekomendasinya sering dikoreksi reviewer atau sering gagal saat pengajuan." remah={[{ label: "Pemantauan Kesesuaian" }]} />;
  if (!periode || !skema) {
    return (
      <>
        {kepala}
        <KeadaanKosong judul="Belum ada periode atau skema">Pemantauan muncul sesudah ada periode seleksi dan skema pendanaan.</KeadaanKosong>
      </>
    );
  }

  const [laporan, kemajuan, sekarang] = await Promise.all([susunLaporan(periode.id, skema.id), susunKemajuan(periode.id), waktuDemo()]);
  const masa = { lamaHari: periode.lamaPenilaianHari, jamPerHari: periode.jamReviewerPerHari, menitPerProposal: periode.menitPerProposal };
  const kalimat = kalimatMasa(kemajuan, sekarang);
  const alamatKemajuan = `/tim-kerja/pemantauan?periode=${periode.id}&skema=${skema.id}&tab=kemajuan`;
  const { ringkas, ambang } = laporan;
  const persenGagal = ringkas.pengajuan ? (ringkas.proposalPernahGagal / ringkas.pengajuan) * 100 : 0;
  const persenFinal = ringkas.pengajuan ? Math.min(100, (ringkas.penilaianFinal / ringkas.pengajuan) * 100) : 0;
  const butirTotal = ringkas.butirSemantik + ringkas.butirDeterministik;
  const LABEL_TAB: Record<TabPemantauan, string> = { semantik: "Butir Semantik", deterministik: "Gagal Deterministik", tren: "Tren dan Kalibrasi", kemajuan: "Kemajuan Penilaian" };

  return (
    <>
      {kepala}
      <BilahPilihan
        periode={periodeAda.map((p) => ({ id: p.id, nama: p.nama }))}
        skema={skemaAda.map((s) => ({ id: s.id, nama: s.namaSkema }))}
        periodeId={periode.id}
        skemaId={skema.id}
      />

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-primer-100 py-4 lg:grid-cols-4" data-testid="angka-ringkas">
        <div>
          <dt className="text-xs text-teks-redup">Rekomendasi disetujui</dt>
          <dd className="mt-1 flex items-end gap-3">
            <span className="angka text-xl font-semibold text-primer-900 sm:text-2xl">{ringkas.persen === null ? "-" : formatPersen(ringkas.persen)}</span>
            <Sparkline nilai={laporan.tren.map((t) => t.persen)} className="mb-1 max-sm:hidden" />
          </dd>
          <dd className="angka text-xs text-teks-redup">
            {formatAngka(ringkas.hasilDinilai - ringkas.dikoreksi)} dari {formatAngka(ringkas.hasilDinilai)} hasil tidak dikoreksi reviewer
          </dd>
        </div>
        <div>
          <dt className="text-xs text-teks-redup">Butir perlu perhatian</dt>
          <dd className={cn("angka mt-1 text-xl font-semibold sm:text-2xl", ringkas.perluPerhatian ? "text-peringatan-700" : "text-primer-900")}>{formatAngka(ringkas.perluPerhatian)}</dd>
          <dd className="angka text-xs text-teks-redup">dari {formatAngka(butirTotal)} butir</dd>
        </div>
        <div>
          <dt className="text-xs text-teks-redup">Pernah gagal saat pengajuan</dt>
          <dd className="angka mt-1 text-xl font-semibold text-primer-900 sm:text-2xl">{formatAngka(ringkas.proposalPernahGagal)}</dd>
          <dd className="angka text-xs text-teks-redup">
            {formatPersen(persenGagal)} dari {formatAngka(ringkas.pengajuan)} proposal
          </dd>
        </div>
        <div>
          <dt className="text-xs text-teks-redup">Penilaian final</dt>
          <dd className="angka mt-1 text-xl font-semibold text-primer-900 sm:text-2xl">{formatAngka(ringkas.penilaianFinal)}</dd>
          <dd className="flex items-center gap-2 text-xs text-teks-redup">
            <span aria-hidden className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-abu-100">
              <span className="block h-full bg-primer-700" style={{ width: `${persenFinal}%` }} />
            </span>
            <span className="angka">dari {formatAngka(ringkas.pengajuan)} proposal</span>
          </dd>
          {kemajuan.posisi && !kemajuan.posisi.lewat ? (
            <dd className="angka text-xs text-teks-redup">
              hari ke-{kemajuan.posisi.hariKe} dari {kemajuan.posisi.lama}
            </dd>
          ) : null}
        </div>
      </dl>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <p className="text-teks-redup">
          {kalimat ? <>{kalimat} · </> : null}
          {laporan.basis ? `Basis aturan v${laporan.basis.versi}` : "Belum ada basis aturan"} · <span className="angka">{formatAngka(ringkas.hasilDinilai)}</span> hasil semantik dari{" "}
          <span className="angka">{formatAngka(ringkas.penilaianFinal)}</span> penilaian final
        </p>
        <details className="max-w-3xl">
          <summary className="cursor-pointer font-semibold text-primer-800">Cara menghitung</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-teks-redup">
            <li>Disetujui: rekomendasi semantik pada penilaian final yang tidak dikoreksi reviewer.</li>
            <li>
              Butir semantik perlu perhatian bila disetujui di bawah {ambang.disetujui}% dan sudah punya sekurangnya {ambang.minHasil} hasil; di bawah itu ditulis &ldquo;belum cukup data&rdquo;.
            </li>
            <li>
              Butir deterministik perlu perhatian bila gagal pada sekurangnya {ambang.gagal}% pengajuan, atau {ambang.gagalInstitusi}% di satu institusi yang punya sekurangnya{" "}
              {ambang.minPengajuanInstitusi} pengajuan. Yang dihitung adalah proposal yang pernah Ditahan karena butir itu.
            </li>
            <li>Terlalu longgar: sistem menyatakan Memenuhi, reviewer menyatakan Tidak memenuhi. Terlalu ketat: sebaliknya.</li>
            <li>Hasil sebuah butir dihitung sejak deskripsinya terakhir diubah; angka sebelum perubahan ada di tab Tren dan Kalibrasi.</li>
            <li>
              Hari ke-n masa penilaian dihitung menurut kalender WIB sejak penugasan pertama ditetapkan; masa periode ini {masa.lamaHari} hari. Proyeksi meneruskan laju penilaian
              final sejauh ini sampai tenggat. Reviewer tertinggal bila sisa penugasannya melebihi kapasitas hari tersisa ({masa.jamPerHari.toLocaleString("id-ID")} jam per hari,{" "}
              {masa.menitPerProposal.toLocaleString("id-ID")} menit per proposal).
            </li>
          </ul>
        </details>
      </div>

      <Suspense fallback={null}>
        <PenyediaTandai
          key={`${periode.id}:${skema.id}`}
          periodeId={periode.id}
          skemaId={skema.id}
          butir={[...laporan.semantik, ...laporan.deterministik].map((b) => ({ kode: b.kode, deskripsi: b.deskripsi, status: b.status }))}
        >
          {kemajuan.perluPerhatian && kemajuan.proyeksi ? (
            <p className="mt-8 flex flex-wrap items-start gap-x-2 gap-y-1 border-y border-peringatan-300 bg-peringatan-50 px-3 py-3 text-sm text-primer-900">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-peringatan-700" />
              <span className="min-w-0 flex-1">
                <strong className="font-semibold">Kemajuan penilaian berisiko melewati tenggat.</strong>{" "}
                {kemajuan.proyeksi.tepatWaktu ? null : (
                  <>
                    Diperkirakan <span className="angka">{formatAngka(kemajuan.proyeksi.kurang)}</span> penugasan belum final pada tenggat.{" "}
                  </>
                )}
                {kemajuan.jumlahStatus.Tertinggal ? (
                  <>
                    <span className="angka">{formatAngka(kemajuan.jumlahStatus.Tertinggal)}</span> reviewer tertinggal.{" "}
                  </>
                ) : null}
                <Link href={alamatKemajuan} className="font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900">
                  Lihat Kemajuan Penilaian
                </Link>
              </span>
            </p>
          ) : null}
          <PerluPerhatian
            item={laporan.perluPerhatian}
            ambang={ambang}
            keadaan={{ hasilDinilai: ringkas.hasilDinilai, hasilTerbanyakPerButir: Math.max(0, ...laporan.semantik.map((b) => b.jumlah)) }}
            pengelola={sesi.pengelola}
            tautanAturan={`/tim-kerja/aturan?skema=${skema.id}&periode=${periode.id}`}
          />

          <PanelTab
            label={LABEL_TAB}
            jumlah={{ semantik: ringkas.butirSemantik, deterministik: laporan.deterministik.filter((b) => b.proposalGagal > 0).length, kemajuan: kemajuan.jumlahStatus.Tertinggal || undefined }}
            panel={{
              semantik: <TabSemantik baris={laporan.semantik} ambang={ambang} adaBanding={laporan.bandingVersi.length > 0} />,
              deterministik: <TabDeterministik baris={laporan.deterministik} ambang={ambang} pengajuan={ringkas.pengajuan} />,
              tren: (
                <TabTren
                  tren={laporan.tren}
                  kalibrasi={laporan.kalibrasi}
                  tafsir={laporan.tafsirKalibrasi}
                  banding={laporan.bandingVersi}
                  penanda={laporan.penandaVersi}
                  ambang={ambang}
                  jumlahHari={kemajuan.posisi?.lama ?? masa.lamaHari}
                />
              ),
              kemajuan: <TabKemajuan k={kemajuan} masa={masa} sekarang={sekarang} />,
            }}
          />

          <RincianButir
            ambang={ambang}
            data={{
              semantik: laporan.semantik,
              deterministik: laporan.deterministik,
              rincian: laporan.rincian,
              rincianGagal: laporan.rincianGagal,
              trenButir: laporan.trenButir,
              kalibrasiButir: laporan.kalibrasiButir,
              bandingVersi: laporan.bandingVersi,
              penandaVersi: laporan.penandaVersi,
              jumlahHari: kemajuan.posisi?.lama ?? masa.lamaHari,
            }}
          />
        </PenyediaTandai>
      </Suspense>
    </>
  );
}
