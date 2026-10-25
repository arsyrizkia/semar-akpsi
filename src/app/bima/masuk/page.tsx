import type { Metadata } from "next";
import { MasukCepat } from "@/components/layout/masuk-cepat";
import { kelompokMasukCepat } from "@/lib/bima/sesi";
import { jalurAman } from "@/lib/sesi";
import { FormMasukBima } from "./form-masuk";

export const metadata: Metadata = { title: "Masuk" };
export const dynamic = "force-dynamic";

const PESAN_GALAT: Record<string, string> = {
  sandi: "Nama pengguna atau kata sandi salah. Periksa lagi, atau pilih akun lewat Masuk cepat (demo) di kanan bawah.",
  akun: "Akun tidak ditemukan. Masuk dengan akun lain.",
  peran: "Akun ini tidak dapat membuka halaman tersebut. Masuk dengan akun lain.",
};

/**
 * Masuk BIMA tiruan: formulir nama pengguna dan kata sandi seperti sistem masuk sungguhan; akun demo dipilih cepat lewat popup
 * "Masuk cepat (demo)" di kanan bawah. Parameter:
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
    <section className="mx-auto w-full max-w-sm">
      <div className="border border-slate-300 bg-white px-6 py-7">
        <h1 className="text-2xl font-bold text-slate-900!">Masuk</h1>
        <p className="mt-1 text-sm text-slate-600">{keSemar ? "Gunakan akun BIMA Anda. Sesudah masuk, Anda dikembalikan ke SEMAR." : "Gunakan akun BIMA Anda."}</p>
        {galat && q.galat !== "sandi" ? (
          <p role="alert" className="mt-4 border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-900">
            {galat}
          </p>
        ) : null}
        <FormMasukBima kembali={kembali} lanjut={lanjut} pengguna={q.pengguna ?? ""} galatSandi={q.galat === "sandi" ? galat : null} />
        <p className="mt-5 text-xs text-slate-600">Halaman simulasi: jangan memasukkan nama pengguna atau kata sandi BIMA asli.</p>
      </div>
      <MasukCepat kelompok={kelompok} tersembunyi={tersembunyi} />
    </section>
  );
}
