import type { Metadata } from "next";
import { getDb } from "@/db";
import { bimaAkun } from "@/db/schema";
import { jalurAman } from "@/lib/sesi";

export const metadata: Metadata = { title: "Masuk BIMA tiruan" };
export const dynamic = "force-dynamic";

const kelompok = [
  { peran: "tim_kerja", judul: "Tim Kerja DPPM" },
  { peran: "reviewer", judul: "Reviewer" },
  { peran: "pengusul", judul: "Pengusul" },
] as const;

/**
 * Masuk BIMA tiruan: pilih akun demo per peran. Parameter:
 *  - kembali: "/api/sso/callback" (SSO ke SEMAR: BIMA menambahkan token bertanda tangan) atau jalur /bima/...
 *  - lanjut: jalur tujuan di SEMAR sesudah SSO (opsional)
 */
export default async function MasukBima({ searchParams }: { searchParams: Promise<{ kembali?: string; lanjut?: string; galat?: string }> }) {
  const q = await searchParams;
  const kembali = jalurAman(q.kembali, "/bima/pengajuan");
  const semua = await getDb().select().from(bimaAkun);
  // 130 akun reviewer skenario skala nyata (rvw-skala-*) tidak ditampilkan sebagai pilihan masuk
  const akun = semua.filter((a) => !a.idBima.startsWith("rvw-skala-"));
  const tersembunyi = semua.length - akun.length;
  return (
    <section>
      <h1 className="text-2xl font-bold">Masuk (simulasi)</h1>
      <p className="mt-1 text-slate-600">
        Pilih akun demo. {kembali.startsWith("/api/sso/callback") ? "Anda akan dikembalikan ke SEMAR sesudah masuk." : ""}
      </p>
      {q.galat ? <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-800">Akun ini tidak dapat membuka halaman tersebut. Pilih akun lain.</p> : null}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {kelompok.map((k) => (
          <div key={k.peran}>
            <h2 className="mb-2 text-lg font-semibold text-slate-800">{k.judul}</h2>
            <ul className="space-y-2">
              {akun
                .filter((a) => a.peran === k.peran)
                .map((a) => {
                  const href = `/api/bima/sesi/masuk?idBima=${encodeURIComponent(a.idBima)}&kembali=${encodeURIComponent(kembali)}${q.lanjut ? `&lanjut=${encodeURIComponent(q.lanjut)}` : ""}`;
                  return (
                    <li key={a.idBima}>
                      <a href={href} className="block rounded border border-slate-300 bg-white px-3 py-2 hover:border-slate-500 hover:bg-slate-100">
                        <span className="block font-medium">{a.nama}</span>
                        <span className="block text-xs text-slate-600">
                          {a.institusi}
                          {a.hakAkses === "pengelola" ? " - pengelola" : ""}
                        </span>
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
      {tersembunyi > 0 ? (
        <p data-testid="akun-skala-tersembunyi" className="mt-4 text-xs text-slate-500">
          {tersembunyi} akun reviewer skala nyata disembunyikan.
        </p>
      ) : null}
      <p className="mt-6 text-xs text-slate-500">Nama dan institusi adalah contoh sementara (rekaan).</p>
    </section>
  );
}
