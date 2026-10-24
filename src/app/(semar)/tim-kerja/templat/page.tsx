import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { KeadaanKosong, KepalaHalaman, LencanaStatus, TombolUnduh } from "@/components/ui";
import { wajibPengelola } from "@/lib/auth";
import { adaPenyaring, bacaPenyaring, daftarTahun, saringDaftar, statusTampil, urutkanDaftar } from "@/lib/templat/daftar";
import { daftarPeriode, daftarSemuaTemplat, daftarSkema } from "@/lib/templat/layanan";
import { ambilPeriodeBerjalanId } from "@/lib/waktu";
import { formatAngka, formatTanggal } from "@/lib/utils";
import { PenyaringDaftarTemplat } from "./penyaring-daftar";
import { TemplatBaru } from "./templat-baru";

export const metadata: Metadata = { title: "J-02 Templat Proposal" };
export const dynamic = "force-dynamic";

type Param = { tahun?: string; skema?: string; status?: string };

/** Kolom daftar di layar lebar; di layar sempit tiap baris menjadi kartu ringkas. */
const KOLOM = "md:grid md:grid-cols-[minmax(0,2.2fr)_3.5rem_minmax(0,1.4fr)_6.5rem_4.5rem_7rem_7rem_9rem] md:items-center md:gap-x-3";

/** J-02 Daftar Templat (UC-01 langkah 1-3). Hanya Tim Kerja DPPM dengan hak pengelola (NFR 3.2). Penyaring tersimpan di URL; baris menuju J-02a. */
export default async function Halaman({ searchParams }: { searchParams: Promise<Param> }) {
  await wajibPengelola();
  const penyaring = bacaPenyaring(await searchParams);
  const [semua, skema, periode, periodeBerjalan] = await Promise.all([daftarSemuaTemplat(), daftarSkema(), daftarPeriode(), ambilPeriodeBerjalanId()]);
  const baris = urutkanDaftar(saringDaftar(semua, penyaring));
  const namaSkemaFilter = skema.find((s) => s.id === penyaring.skema)?.namaSkema;

  return (
    <>
      <KepalaHalaman kode="J-02" judul="Templat Proposal" remah={[{ label: "Templat Proposal" }]} aksi={<TemplatBaru skema={skema} periode={periode} periodeAwal={periodeBerjalan} skemaAwal={penyaring.skema} />} />
      <PenyaringDaftarTemplat skema={skema} tahun={daftarTahun([...semua, ...periode])} nilai={penyaring} />

      {baris.length === 0 ? (
        <KeadaanKosong
          judul={penyaring.tahun !== null ? "Belum ada templat untuk tahun ini" : adaPenyaring(penyaring) ? "Tidak ada templat yang cocok dengan penyaring" : "Belum ada templat"}
          ikon={FileText}
          aksi={<TemplatBaru skema={skema} periode={periode} periodeAwal={periodeBerjalan} skemaAwal={penyaring.skema} />}
        >
          {namaSkemaFilter ? namaSkemaFilter : null}
        </KeadaanKosong>
      ) : (
        <section aria-label="Daftar templat">
          <div className={`${KOLOM} hidden border-b border-primer-200 px-3 pb-2 text-xs font-semibold text-primer-800`} aria-hidden>
            <span>Skema</span>
            <span className="text-right">Versi</span>
            <span>Periode Berlaku</span>
            <span>Status</span>
            <span className="text-right">Bagian</span>
            <span className="text-right">Butir Cek (Det./Sem.)</span>
            <span>Diperbarui</span>
            <span />
          </div>
          <ul className="divide-y divide-primer-100 rounded-md border border-primer-200 bg-white md:rounded-t-none md:border-t-0">
            {baris.map((b) => (
              <li key={b.id} className={`relative px-3 py-3 hover:bg-latar ${KOLOM}`}>
                <div className="flex items-start justify-between gap-2 md:contents">
                  <Link
                    href={`/tim-kerja/templat/${b.id}`}
                    className="min-w-0 font-semibold text-primer-900 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                  >
                    {b.namaSkema}
                    <span className="sr-only"> versi {b.versi}</span>
                  </Link>
                  <span className="angka shrink-0 text-sm text-teks-redup md:text-right md:text-teks">
                    <span className="md:hidden">Versi </span>
                    {b.versi}
                  </span>
                </div>
                <p className="mt-1 text-sm text-teks-redup md:mt-0 md:text-teks">
                  <span className="md:hidden">Periode: </span>
                  {b.periodeNama ?? "Belum ditetapkan"}
                </p>
                <div className="mt-2 md:mt-0">
                  <LencanaStatus status={statusTampil(b.status)} />
                </div>
                <p className="angka mt-1 text-sm md:mt-0 md:text-right">
                  <span className="text-teks-redup md:hidden">Bagian </span>
                  {formatAngka(b.jumlahBagian)}
                </p>
                <p className="angka text-sm md:text-right">
                  <span className="text-teks-redup md:hidden">Butir cek </span>
                  {formatAngka(b.jumlahDeterministik)} / {formatAngka(b.jumlahSemantik)}
                </p>
                <p className="text-sm text-teks-redup md:text-teks">
                  <span className="md:hidden">Diperbarui </span>
                  {formatTanggal(b.diperbarui)}
                </p>
                <div className="relative z-10 mt-2 md:mt-0 md:text-right">
                  <TombolUnduh href={`/api/semar/templat/${b.id}/unduh`} ukuran="sm">
                    Unduh (.docx)
                    <span className="sr-only"> {b.namaSkema} versi {b.versi}</span>
                  </TombolUnduh>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
