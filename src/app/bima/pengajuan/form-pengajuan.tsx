"use client";

import { useEffect, useRef, useState } from "react";
import type { OpsiSkemaBima } from "@/lib/bima/servis-pengajuan";

interface Props {
  skema: OpsiSkemaBima[];
  awal?: {
    idProposal: string;
    judul: string;
    skemaKode: string;
    naskah: string | null;
    lampiran: Record<string, string>;
  };
  /** demo: tersedia naskah perbaikan contoh untuk usulan ini (UC-05b) */
  perbaikanTersedia?: boolean;
}

interface Galat {
  judul?: string;
  skema?: string;
  naskah?: string;
  umum?: string;
  lampiran?: Record<string, string>;
}

const kelasInput =
  "w-full border border-slate-500 bg-white px-3 py-2 text-slate-900 aria-[invalid=true]:border-2 aria-[invalid=true]:border-red-700 focus-visible:outline-slate-800";

/** Formulir pengajuan di BIMA tiruan (tampilan netral, bukan tema SEMAR). */
export function FormPengajuan({ skema, awal, perbaikanTersedia }: Props) {
  const [skemaKode, setSkemaKode] = useState(awal?.skemaKode ?? skema[0]?.kode ?? "");
  const [galat, setGalat] = useState<Galat>({});
  const [mengirim, setMengirim] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // galat inline: fokus ke isian pertama yang bermasalah (atau pesan umum) sesudah pengajuan ditolak
  useEffect(() => {
    const pertama = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-galat-umum]');
    pertama?.focus();
  }, [galat]);
  const skemaTerpilih = skema.find((s) => s.kode === skemaKode);
  const lampiran = skemaTerpilih?.lampiranWajib ?? [];

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMengirim(true);
    setGalat({});
    try {
      const res = await fetch("/bima/pengajuan/kirim", { method: "POST", body: new FormData(e.currentTarget) });
      const data = (await res.json()) as { ok?: boolean; lanjut?: string; galat?: Galat };
      if (res.ok && data.lanjut) {
        window.location.assign(data.lanjut);
        return;
      }
      setGalat(data.galat ?? { umum: "Pengajuan gagal. Coba lagi." });
    } catch {
      setGalat({ umum: "Pengajuan gagal. Periksa sambungan Anda lalu coba lagi." });
    }
    setMengirim(false);
  }

  return (
    <form ref={formRef} onSubmit={kirim} className="space-y-5 border border-slate-300 bg-white p-5" noValidate>
      {awal ? <input type="hidden" name="idProposal" value={awal.idProposal} /> : null}
      {galat.umum ? (
        <p role="alert" tabIndex={-1} data-galat-umum className="border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-900">
          {galat.umum}
        </p>
      ) : null}

      <div>
        <label htmlFor="judul" className="mb-1 block text-sm font-semibold">
          Judul Usulan
        </label>
        <input id="judul" name="judul" type="text" autoComplete="off" defaultValue={awal?.judul ?? ""} aria-invalid={galat.judul ? true : undefined} className={kelasInput} />
        {galat.judul ? <p role="alert" className="mt-1 text-sm text-red-800">{galat.judul}</p> : null}
      </div>

      <div>
        <label htmlFor="skema" className="mb-1 block text-sm font-semibold">
          Skema Pendanaan
        </label>
        <select
          id="skema"
          name="skema"
          value={skemaKode}
          onChange={(e) => setSkemaKode(e.target.value)}
          aria-invalid={galat.skema ? true : undefined}
          className={kelasInput}
        >
          {skema.map((s) => (
            <option key={s.kode} value={s.kode}>
              {s.nama}
            </option>
          ))}
        </select>
        {galat.skema ? <p role="alert" className="mt-1 text-sm text-red-800">{galat.skema}</p> : null}
        {skemaTerpilih?.adaTemplat ? (
          <p className="mt-2 text-sm">
            <a
              href={`/api/semar/templat/berlaku/${encodeURIComponent(skemaKode)}/unduh`}
              download
              className="font-semibold text-slate-900 underline underline-offset-2"
            >
              Unduh Templat
            </a>
            <span className="text-slate-600"> (.docx, templat yang berlaku untuk skema ini)</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Skema ini belum memiliki templat yang terbit.</p>
        )}
      </div>

      <div>
        <label htmlFor="naskah" className="mb-1 block text-sm font-semibold">
          Berkas Proposal (DOCX atau PDF)
        </label>
        <input
          id="naskah"
          name="naskah"
          type="file"
          accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-invalid={galat.naskah ? true : undefined}
          className={kelasInput}
        />
        {awal?.naskah ? <p className="mt-1 text-xs text-slate-600">Berkas saat ini: {awal.naskah}. Unggah berkas baru untuk menggantinya.</p> : null}
        {galat.naskah ? <p role="alert" className="mt-1 text-sm text-red-800">{galat.naskah}</p> : null}
        {perbaikanTersedia ? (
          <label className="mt-2 flex items-start gap-2 text-sm">
            <input type="checkbox" name="naskahPerbaikan" value="1" className="mt-1" />
            <span>Pakai naskah perbaikan (contoh) - khusus simulasi: bagian Metode sudah dalam batas kata, judul tetap sama.</span>
          </label>
        ) : null}
      </div>

      {lampiran.length ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Lampiran (PDF atau DOCX)</legend>
          {lampiran.map((nama) => (
            <div key={`${skemaKode}:${nama}`}>
              <label htmlFor={`lampiran:${nama}`} className="mb-1 block text-sm">
                {nama}
              </label>
              <input
                id={`lampiran:${nama}`}
                name={`lampiran:${nama}`}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                aria-invalid={galat.lampiran?.[nama] ? true : undefined}
                className={kelasInput}
              />
              {awal?.lampiran[nama] ? <p className="mt-1 text-xs text-slate-600">Berkas saat ini: {awal.lampiran[nama]}.</p> : null}
              {galat.lampiran?.[nama] ? <p role="alert" className="mt-1 text-sm text-red-800">{galat.lampiran[nama]}</p> : null}
            </div>
          ))}
        </fieldset>
      ) : null}

      <button
        type="submit"
        disabled={mengirim}
        className="min-h-11 bg-slate-800 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-wait disabled:bg-slate-500"
      >
        {mengirim ? "Mengajukan Usulan…" : "Ajukan Usulan"}
      </button>
    </form>
  );
}
