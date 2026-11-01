"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { PERISTIWA_BUKA_MASUK_CEPAT } from "@/components/layout/masuk-cepat";

const KELAS_ISIAN =
  "block h-11 w-full rounded-md border border-[#d0d5dd] bg-white px-3.5 text-[15px] text-slate-900 placeholder:text-slate-500 transition-colors focus:border-[#3651b0] focus:outline-none focus:ring-2 focus:ring-[#3651b0]/25 aria-invalid:border-red-700";

/**
 * Formulir masuk BIMA tiruan, tata letaknya mengikuti halaman masuk BIMA (Username, Password dengan tombol lihat, Remember me,
 * Log In, Kesulitan login? Bantuan). Dikirim POST biasa ke /api/bima/sesi/masuk sehingga cookie dan pengalihan SSO berjalan sebagai
 * navigasi penuh. "Bantuan" membuka popup Masuk cepat (demo) yang berisi akun demo dan kata sandinya.
 */
export function FormMasukBima({ kembali, lanjut, pengguna, galatSandi }: { kembali: string; lanjut: string; pengguna: string; galatSandi: string | null }) {
  const [lihat, setLihat] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const isianSandi = useRef<HTMLInputElement>(null);

  // kembali dari login gagal: pesan galat sudah ada saat halaman dimuat, jadi fokus dipindah ke Password supaya galatnya dibacakan
  useEffect(() => {
    if (galatSandi) isianSandi.current?.focus();
  }, [galatSandi]);

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
    <form action="/api/bima/sesi/masuk" method="post" onSubmit={() => setSibuk(true)} className="space-y-5">
      <input type="hidden" name="kembali" value={kembali} />
      {lanjut ? <input type="hidden" name="lanjut" value={lanjut} /> : null}
      <div>
        <label htmlFor="namaPengguna" className="mb-2 block text-[15px] font-medium text-slate-700">
          Username
        </label>
        <input
          id="namaPengguna"
          name="namaPengguna"
          type="text"
          required
          placeholder="Masukan Username"
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
        <label htmlFor="kataSandi" className="mb-2 block text-[15px] font-medium text-slate-700">
          Password
        </label>
        <div className="flex">
          <input
            ref={isianSandi}
            id="kataSandi"
            name="kataSandi"
            type={lihat ? "text" : "password"}
            required
            placeholder="Masukan Password"
            autoComplete="current-password"
            aria-invalid={galatSandi ? true : undefined}
            aria-describedby={keterangan}
            className={`${KELAS_ISIAN} rounded-r-none`}
          />
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            aria-pressed={lihat}
            aria-controls="kataSandi"
            aria-label="Tampilkan password"
            className="flex h-11 w-12 shrink-0 items-center justify-center rounded-r-md border border-l-0 border-[#d0d5dd] bg-[#f2f4f7] text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#3651b0]"
          >
            {lihat ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          </button>
        </div>
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-[15px] text-slate-700">
        <input type="checkbox" name="ingat" value="1" className="size-4 rounded border-slate-400 accent-[#3651b0]" />
        Remember me
      </label>
      {galatSandi ? (
        <p id="galat-masuk" role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {galatSandi}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={sibuk}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#3651b0] px-4 text-[15px] font-medium text-white transition-colors hover:bg-[#2b4294] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3651b0] disabled:cursor-wait disabled:opacity-70"
      >
        {sibuk ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" /> Memeriksa…
          </>
        ) : (
          "Log In"
        )}
      </button>
      <p className="pt-2 text-center text-[15px]">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => window.dispatchEvent(new Event(PERISTIWA_BUKA_MASUK_CEPAT))}
          className="cursor-pointer text-[#3651b0] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#3651b0]"
        >
          Kesulitan login? Bantuan
        </button>
      </p>
    </form>
  );
}
