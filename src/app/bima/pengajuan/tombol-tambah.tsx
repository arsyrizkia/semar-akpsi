"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { BATAS_JUDUL_USULAN } from "@/lib/bima/usulan-baru";

const kelasUtama =
  "inline-flex min-h-11 items-center gap-2 rounded-md bg-[#3651b0] px-5 text-sm font-medium text-white transition-colors hover:bg-[#2b4294] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3651b0] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600";
const kelasIsian =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:border-[#3651b0] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3651b0]";

/**
 * "Tambah Usulan" (Daftar Usulan): modal pendek berisi skema dan judul. Untuk demo judul sudah terisi judul naskah contoh (dapat diubah);
 * identitas, RAB, dan dokumen pendukung diisi BIMA tiruan, jadi pengusul langsung masuk ke wizard dan tinggal mengunggah dokumen usulan.
 */
export function TombolTambahUsulan({ skema, judulAwal, masaDitutup }: { skema: { kode: string; nama: string }[]; judulAwal: string; masaDitutup: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function buat(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSibuk(true);
    setGalat(null);
    try {
      const res = await fetch("/bima/pengajuan/baru", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ skemaKode: data.get("skema"), judul: data.get("judul") }),
      });
      const isi = (await res.json().catch(() => ({}))) as { lanjut?: string; galat?: string };
      if (res.ok && isi.lanjut) {
        window.location.assign(isi.lanjut);
        return;
      }
      setGalat(isi.galat ?? "Usulan gagal dibuat. Coba lagi.");
    } catch {
      setGalat("Usulan gagal dibuat. Periksa sambungan lalu coba lagi.");
    }
    setSibuk(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setGalat(null);
          dialog.current?.showModal();
        }}
        disabled={masaDitutup || skema.length === 0}
        className={kelasUtama}
      >
        <Plus aria-hidden className="size-4" />
        Tambah Usulan
      </button>
      {masaDitutup ? <p className="text-xs text-slate-500">Masa pengusulan ditutup</p> : null}

      <dialog
        ref={dialog}
        aria-labelledby="judul-tambah-usulan"
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-lg bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
      >
        <form onSubmit={buat} className="space-y-4 p-6">
          <div>
            <h2 id="judul-tambah-usulan" className="text-lg font-semibold text-[#1e2a5e]">
              Tambah Usulan
            </h2>
            <p className="mt-1 text-sm text-slate-600">Usulan dibuat sebagai draf. Identitas, RAB, dan dokumen pendukung sudah terisi data contoh; Anda tinggal mengunggah dokumen usulan.</p>
          </div>
          <div>
            <label htmlFor="tambah-skema" className="block text-sm font-medium text-slate-800">
              Skema
            </label>
            <select id="tambah-skema" name="skema" required defaultValue={skema[0]?.kode} className={`${kelasIsian} min-h-11`}>
              {skema.map((s) => (
                <option key={s.kode} value={s.kode}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tambah-judul" className="block text-sm font-medium text-slate-800">
              Judul Usulan
            </label>
            <textarea
              id="tambah-judul"
              name="judul"
              required
              minLength={BATAS_JUDUL_USULAN.min}
              maxLength={BATAS_JUDUL_USULAN.maks}
              rows={3}
              defaultValue={judulAwal}
              className={`${kelasIsian} py-2 leading-relaxed`}
            />
          </div>
          {galat ? (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {galat}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              disabled={sibuk}
              className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3651b0]"
            >
              Batal
            </button>
            <button type="submit" disabled={sibuk} aria-busy={sibuk || undefined} className={kelasUtama}>
              {sibuk ? <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" /> : null}
              {sibuk ? "Membuat…" : "Buat Usulan"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
