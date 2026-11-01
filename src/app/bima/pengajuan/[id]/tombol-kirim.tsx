"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

/**
 * "Kirim Usulan" (langkah 5). Terkunci sampai dokumen usulan lolos pemeriksaan SEMAR (penjaga yang sama ada di server). Dua langkah:
 * tombol, lalu konfirmasi singkat karena usulan yang terkirim tidak dapat diubah.
 */
export function TombolKirim({ idProposal, siap, masaDitutup }: { idProposal: string; siap: boolean; masaDitutup: boolean }) {
  const [yakin, setYakin] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim() {
    setSibuk(true);
    setGalat(null);
    try {
      const res = await fetch(`/bima/pengajuan/${encodeURIComponent(idProposal)}/kirim`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { lanjut?: string; galat?: string };
      if (res.ok && data.lanjut) {
        window.location.assign(data.lanjut);
        return;
      }
      setGalat(data.galat ?? "Usulan gagal dikirim. Coba lagi.");
    } catch {
      setGalat("Usulan gagal dikirim. Periksa sambungan lalu coba lagi.");
    }
    setSibuk(false);
    setYakin(false);
  }

  const kelasUtama =
    "inline-flex min-h-11 items-center gap-2 rounded-md bg-[#3651b0] px-5 text-sm font-medium text-white transition-colors hover:bg-[#2b4294] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3651b0] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600";

  return (
    <div className="space-y-3">
      {!siap ? <p className="text-sm text-amber-900">Dokumen usulan belum lolos pemeriksaan SEMAR. Usulan belum dapat dikirim.</p> : null}
      {siap && masaDitutup ? <p className="text-sm text-slate-600">Alat simulasi: masa pengusulan sedang ditutup, jadi pengiriman akan ditolak SEMAR.</p> : null}
      {yakin ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-[#3651b0]/30 bg-[#eef1fb] px-4 py-3">
          <p className="text-sm text-[#1e2a5e]">Kirim usulan sekarang? Usulan yang sudah dikirim tidak dapat diubah.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setYakin(false)} disabled={sibuk} className="min-h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Batal
            </button>
            <button type="button" onClick={kirim} disabled={sibuk} aria-busy={sibuk || undefined} className={kelasUtama}>
              {sibuk ? <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" /> : <Send aria-hidden className="size-4" />}
              {sibuk ? "Mengirim…" : "Ya, Kirim Usulan"}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setYakin(true)} disabled={!siap} className={kelasUtama}>
          <Send aria-hidden className="size-4" />
          Kirim Usulan
        </button>
      )}
      {galat ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {galat}
        </p>
      ) : null}
    </div>
  );
}
