import { wajibPengusulBima } from "@/lib/bima/sesi";

/**
 * RUTE KOSONG (milik agen C): halaman pengajuan proposal di BIMA tiruan.
 * Ganti seluruh isi berkas ini. Layanan yang tersedia: src/lib/bima/servis.ts (ambilProposalBima, perbaruiStatusProposalBima),
 * src/lib/bima/sso.ts (urlSsoSemar untuk meneruskan pengusul ke J-06).
 */
export default async function Pengajuan() {
  const akun = await wajibPengusulBima();
  return (
    <section>
      <h1 className="text-2xl font-bold">Pengajuan proposal</h1>
      <p className="mt-2 text-slate-600">Halaman ini belum dibangun (dikerjakan agen C). Masuk sebagai {akun.nama}.</p>
    </section>
  );
}
