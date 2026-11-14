import type { Metadata } from "next";
import { BantuanAkun } from "@/components/layout/bantuan-akun";
import { MasukCepat } from "@/components/layout/masuk-cepat";
import { kelompokMasukCepat } from "@/lib/bima/sesi";
import { jalurAman } from "@/lib/sesi";
import { FormMasukBima } from "./form-masuk";

export const metadata: Metadata = { title: "Masuk" };
export const dynamic = "force-dynamic";

const PESAN_GALAT: Record<string, string> = {
  sandi: "Username atau password salah. Periksa lagi, atau buka Bantuan untuk melihat akun prototipe.",
  akun: "Akun tidak ditemukan. Masuk dengan akun lain.",
  peran: "Akun ini tidak dapat membuka halaman tersebut. Masuk dengan akun lain.",
};

/**
 * Masuk BIMA tiruan, mengikuti halaman masuk BIMA (tangkapan layar Arsy, 1 Nov 2026): kartu bersambutan "Selamat Datang di Aplikasi
 * BIMA" dengan logo bulat menumpang di batas kepala, Username, Password, Remember me, Log In, dan "Kesulitan login? Bantuan". Pengaman
 * simulasi: label "Simulasi BIMA" tetap di atas, hanya akun prototipe yang dapat masuk, dan catatan untuk tidak memakai akun asli. Akun
 * prototipe tampil di dialog Bantuan; popup "Masuk cepat" adalah alat peragaan (tersembunyi bawaan). Parameter:
 *  - kembali: "/api/sso/callback" (SSO ke SEMAR: BIMA menambahkan token bertanda tangan) atau jalur /bima/...
 *  - lanjut: jalur tujuan di SEMAR sesudah SSO (opsional)
 *  - galat: sandi | akun | peran; pengguna: nama pengguna yang diketik sebelumnya (galat sandi)
 */
export default async function MasukBima({ searchParams }: { searchParams: Promise<{ kembali?: string; lanjut?: string; galat?: string; pengguna?: string }> }) {
  const q = await searchParams;
  const kembali = jalurAman(q.kembali, "/bima/pengajuan");
  const lanjut = jalurAman(q.lanjut, "");
  const keSemar = kembali.startsWith("/api/sso/callback");
  const { kelompok, tersembunyi, bantuan } = await kelompokMasukCepat({ kembali, lanjut });
  const galat = q.galat ? (PESAN_GALAT[q.galat] ?? PESAN_GALAT.akun) : null;

  return (
    <section className="mx-auto w-full max-w-[29rem] pt-2">
      <div className="overflow-hidden rounded-lg bg-white shadow-[0_8px_30px_rgba(30,42,94,0.08)]">
        <div className="bg-[#e1e6f4] px-6 pb-16 pt-7 sm:px-8">
          <h1 className="text-xl font-semibold text-[#1f2d6b]">Selamat Datang di Aplikasi BIMA</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#1f2d6b]">Basis informasi penelitian dan pengabdian kepada masyarakat</p>
        </div>
        <div className="px-6 pb-8 sm:px-8">
          <span aria-hidden className="-mt-12 mb-6 flex size-[4.75rem] items-center justify-center rounded-full bg-[#eef0f6] p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG statis kecil */}
            <img src="/bima/logo-bima.svg" alt="" width={64} height={64} className="size-16 rounded-full bg-white" />
          </span>
          {galat && q.galat !== "sandi" ? (
            <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {galat}
            </p>
          ) : null}
          {keSemar ? <p className="mb-4 text-sm text-slate-600">Sesudah masuk, Anda dikembalikan ke SEMAR.</p> : null}
          <FormMasukBima kembali={kembali} lanjut={lanjut} pengguna={q.pengguna ?? ""} galatSandi={q.galat === "sandi" ? galat : null} />
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-600">Simulasi: jangan memasukkan username atau password BIMA asli.</p>
      <BantuanAkun akun={bantuan} />
      <MasukCepat kelompok={kelompok} tersembunyi={tersembunyi} />
    </section>
  );
}
