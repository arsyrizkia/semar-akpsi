import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { MasukCepat } from "@/components/layout/masuk-cepat";
import { kelompokMasukCepat } from "@/lib/bima/sesi";
import { jalurAman } from "@/lib/sesi";
import { FormMasukBima } from "./form-masuk";

export const metadata: Metadata = { title: "Masuk" };
export const dynamic = "force-dynamic";

const PESAN_GALAT: Record<string, string> = {
  sandi: "Username atau password salah. Periksa lagi, atau buka Bantuan untuk melihat akun demo.",
  akun: "Akun tidak ditemukan. Masuk dengan akun lain.",
  peran: "Akun ini tidak dapat membuka halaman tersebut. Masuk dengan akun lain.",
};

/**
 * Masuk BIMA tiruan: tata letak mengikuti halaman masuk BIMA (kartu bersambutan, Username, Password, Remember me, Log In, Bantuan)
 * tanpa logo, nama lembaga, atau kaki halaman resmi; label "Simulasi BIMA" tetap di atas. Akun demo dipilih cepat lewat popup
 * "Masuk cepat (demo)" di kanan bawah atau tombol Bantuan. Parameter:
 *  - kembali: "/api/sso/callback" (SSO ke SEMAR: BIMA menambahkan token bertanda tangan) atau jalur /bima/...
 *  - lanjut: jalur tujuan di SEMAR sesudah SSO (opsional)
 *  - galat: sandi | akun | peran; pengguna: nama pengguna yang diketik sebelumnya (galat sandi)
 */
export default async function MasukBima({ searchParams }: { searchParams: Promise<{ kembali?: string; lanjut?: string; galat?: string; pengguna?: string }> }) {
  const q = await searchParams;
  const kembali = jalurAman(q.kembali, "/bima/pengajuan");
  const lanjut = jalurAman(q.lanjut, "");
  const keSemar = kembali.startsWith("/api/sso/callback");
  const { kelompok, tersembunyi } = await kelompokMasukCepat({ kembali, lanjut });
  const galat = q.galat ? (PESAN_GALAT[q.galat] ?? PESAN_GALAT.akun) : null;

  return (
    <section className="mx-auto w-full max-w-md pt-6 [font-family:ui-sans-serif,system-ui,sans-serif]">
      <div className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
        <div className="bg-[#e3e8f7] px-6 pb-12 pt-6">
          <h1 className="text-lg font-medium text-[#1f2f6b]!">Selamat Datang di Simulasi BIMA</h1>
          <p className="mt-1 text-sm text-[#1f2f6b]">Tiruan halaman masuk untuk prototipe SEMAR (bukan sistem resmi).</p>
        </div>
        <div className="px-7 pb-7">
          {/* lencana bulat netral menggantikan lambang: halaman tiruan tidak memakai logo atau identitas resmi */}
          <span aria-hidden className="-mt-9 mb-5 flex size-[4.5rem] items-center justify-center rounded-full bg-white ring-4 ring-[#e3e8f7]">
            <GraduationCap className="size-9 text-[#2c4fb5]" />
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
      <p className="mt-6 text-center text-xs text-slate-600">Simulasi: jangan memasukkan username atau password BIMA asli. Akun demo ada di Bantuan.</p>
      <MasukCepat kelompok={kelompok} tersembunyi={tersembunyi} />
    </section>
  );
}
