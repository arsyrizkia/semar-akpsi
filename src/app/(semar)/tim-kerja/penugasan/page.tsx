import type { Metadata } from "next";
import { Alert, JudulHalaman } from "@/components/ui";
import { wajibTimKerja } from "@/lib/auth";
import {
  UKURAN_HALAMAN_USULAN,
  ambilKandidatPengganti,
  ambilPeriodeTerbaru,
  ambilSebaranBeban,
  ambilUsulan,
  hitungPenugasan,
  hitungPerluDitugaskan,
} from "@/lib/penugasan/layanan";
import { masaPengusulanBerjalan } from "@/lib/waktu";
import { PapanPenugasan } from "./papan-penugasan";

export const metadata: Metadata = { title: "Penugasan Reviewer (J-04)" };
export const dynamic = "force-dynamic";
/** Susun dan Tetapkan pada skala 10.000 proposal berjalan sebagai server action halaman ini. */
export const maxDuration = 300;

const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" });

const angkaHalaman = (v: string | string[] | undefined) => {
  const n = Number.parseInt(Array.isArray(v) ? v[0] : (v ?? "1"), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

/** J-04 Penugasan Reviewer, UC-03. Semua Tim Kerja DPPM (pengelola dan anggota) dapat membukanya. */
export default async function Halaman({ searchParams }: { searchParams: Promise<{ hal?: string; halT?: string }> }) {
  await wajibTimKerja();
  const sp = await searchParams;
  const periode = await ambilPeriodeTerbaru();
  if (!periode) {
    return (
      <>
        <JudulHalaman kode="J-04" judul="Penugasan Reviewer" />
        <Alert jenis="info">Belum ada periode seleksi.</Alert>
      </>
    );
  }
  const ditutup = !(await masaPengusulanBerjalan());
  const [totalUsulan, totalDitetapkan, perluDitugaskan] = await Promise.all([
    hitungPenugasan(periode.id, "Diusulkan"),
    hitungPenugasan(periode.id, "Ditetapkan"),
    hitungPerluDitugaskan(periode.id),
  ]);
  const jumlahHalamanUsulan = Math.max(1, Math.ceil(totalUsulan / UKURAN_HALAMAN_USULAN));
  const jumlahHalamanDitetapkan = Math.max(1, Math.ceil(totalDitetapkan / UKURAN_HALAMAN_USULAN));
  const halaman = Math.min(angkaHalaman(sp.hal), jumlahHalamanUsulan);
  const halamanT = Math.min(angkaHalaman(sp.halT), jumlahHalamanDitetapkan);
  const [usulan, ditetapkan, sebaran, kandidat] = await Promise.all([
    ambilUsulan(periode.id, "Diusulkan", { halaman }),
    ambilUsulan(periode.id, "Ditetapkan", { halaman: halamanT }),
    ambilSebaranBeban(periode.id, periode.batasBebanReviewer),
    ambilKandidatPengganti(periode.id),
  ]);

  return (
    <>
      <JudulHalaman
        kode="J-04"
        judul="Penugasan Reviewer"
        deskripsi="Susun usulan penugasan sesudah masa pengusulan ditutup: reviewer dari institusi berbeda dengan beban merata. Tinjau, pindahkan bila perlu, lalu tetapkan."
      />
      <PapanPenugasan
        periode={{
          id: periode.id,
          nama: periode.nama,
          tanggalTutup: tanggal.format(periode.tanggalTutup),
          batas: periode.batasBebanReviewer,
          ditutup,
        }}
        usulan={usulan}
        totalUsulan={totalUsulan}
        halaman={halaman}
        jumlahHalaman={jumlahHalamanUsulan}
        ditetapkan={ditetapkan}
        totalDitetapkan={totalDitetapkan}
        halamanT={halamanT}
        jumlahHalamanT={jumlahHalamanDitetapkan}
        ukuranHalaman={UKURAN_HALAMAN_USULAN}
        perluDitugaskan={perluDitugaskan}
        sebaran={sebaran}
        kandidat={kandidat}
      />
    </>
  );
}
