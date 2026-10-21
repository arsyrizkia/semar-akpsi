import type { Metadata } from "next";
import { Alert, JudulHalaman } from "@/components/ui";
import { PanelPemandu } from "@/components/layout/panel-pemandu";
import { wajibTimKerja } from "@/lib/auth";
import { judulUc03, kodeUc03, langkahUc03 } from "@/lib/demo/pemandu/uc03";
import { ambilKandidatPengganti, ambilPeriodeTerbaru, ambilSebaranBeban, ambilUsulan } from "@/lib/penugasan/layanan";
import { masaPengusulanBerjalan } from "@/lib/waktu";
import { PapanPenugasan } from "./papan-penugasan";

export const metadata: Metadata = { title: "Penugasan Reviewer (J-04)" };
export const dynamic = "force-dynamic";

const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" });

/** J-04 Penugasan Reviewer, UC-03. Semua Tim Kerja DPPM (pengelola dan anggota) dapat membukanya. */
export default async function Halaman() {
  await wajibTimKerja();
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
  const [usulan, ditetapkan, sebaran, kandidat] = await Promise.all([
    ambilUsulan(periode.id, "Diusulkan"),
    ambilUsulan(periode.id, "Ditetapkan"),
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
        ditetapkan={ditetapkan}
        sebaran={sebaran}
        kandidat={kandidat}
      />
      <PanelPemandu kode={kodeUc03} judul={judulUc03} langkah={langkahUc03} />
    </>
  );
}
