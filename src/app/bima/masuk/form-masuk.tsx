"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const KELAS_ISIAN =
  "block min-h-11 w-full border border-slate-400 bg-white px-3 py-2 text-base text-slate-900 transition-colors focus:border-slate-800 focus:outline-2 focus:outline-offset-1 focus:outline-slate-800 aria-invalid:border-red-700";

/**
 * Formulir masuk BIMA tiruan (nama pengguna + kata sandi), dikirim POST biasa ke /api/bima/sesi/masuk sehingga cookie dan
 * pengalihan SSO berjalan sebagai navigasi penuh, sama seperti sistem masuk sungguhan.
 */
export function FormMasukBima({ kembali, lanjut, pengguna, galatSandi }: { kembali: string; lanjut: string; pengguna: string; galatSandi: string | null }) {
  const [lihat, setLihat] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  // halaman dipulihkan dari bfcache (tombol Back): tombol tidak boleh tetap "Memeriksa…"
  useEffect(() => {
    const pulih = (e: PageTransitionEvent) => {
      if (e.persisted) setSibuk(false);
    };
    window.addEventListener("pageshow", pulih);
    return () => window.removeEventListener("pageshow", pulih);
  }, []);

  const keterangan = galatSandi ? "galat-masuk" : undefined;
  return (
    <form action="/api/bima/sesi/masuk" method="post" onSubmit={() => setSibuk(true)} className="mt-6 space-y-4">
      <input type="hidden" name="kembali" value={kembali} />
      {lanjut ? <input type="hidden" name="lanjut" value={lanjut} /> : null}
      <div>
        <label htmlFor="namaPengguna" className="mb-1 block text-sm font-semibold text-slate-800">
          Nama pengguna
        </label>
        <input
          id="namaPengguna"
          name="namaPengguna"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={pengguna}
          aria-invalid={galatSandi ? true : undefined}
          aria-describedby={keterangan}
          className={KELAS_ISIAN}
        />
      </div>
      <div>
        <label htmlFor="kataSandi" className="mb-1 block text-sm font-semibold text-slate-800">
          Kata sandi
        </label>
        <div className="relative">
          <input
            id="kataSandi"
            name="kataSandi"
            type={lihat ? "text" : "password"}
            required
            autoComplete="current-password"
            aria-invalid={galatSandi ? true : undefined}
            aria-describedby={keterangan}
            className={`${KELAS_ISIAN} pr-12`}
          />
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            aria-pressed={lihat}
            aria-controls="kataSandi"
            aria-label="Tampilkan kata sandi"
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-800"
          >
            {lihat ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </div>
      </div>
      {galatSandi ? (
        <p id="galat-masuk" role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-900">
          {galatSandi}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={sibuk}
        className="flex min-h-11 w-full items-center justify-center gap-2 bg-slate-800 px-4 py-2 font-semibold text-white transition-colors hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:cursor-wait disabled:opacity-60"
      >
        {sibuk ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" /> Memeriksa…
          </>
        ) : (
          "Masuk"
        )}
      </button>
    </form>
  );
}
