"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setSakelarMasa } from "@/app/demo/aksi";

/** Alat bantu simulasi di BIMA tiruan: menutup/membuka masa pengusulan (UC-05c: ditahan lalu ditolak karena masa ditutup). */
export function SakelarMasaBima({ masa }: { masa: "berjalan" | "ditutup" }) {
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  const [saatIni, setSaatIni] = useState(masa);
  const ubah = (nilai: "berjalan" | "ditutup") =>
    mulai(async () => {
      const r = await setSakelarMasa(nilai);
      if (r.ok) setSaatIni(nilai);
      router.refresh();
    });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600">
      <span>
        Alat simulasi · masa pengusulan: <strong data-testid="masa-bima">{saatIni}</strong>
      </span>
      {saatIni === "berjalan" ? (
        <button type="button" disabled={sibuk} onClick={() => ubah("ditutup")} className="min-h-9 rounded-md border border-slate-300 px-3 py-1 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60">
          Tutup masa pengusulan
        </button>
      ) : (
        <button type="button" disabled={sibuk} onClick={() => ubah("berjalan")} className="min-h-9 rounded-md border border-slate-300 px-3 py-1 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60">
          Buka masa pengusulan
        </button>
      )}
    </div>
  );
}
