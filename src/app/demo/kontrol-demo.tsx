"use client";

import { useState, useTransition } from "react";
import { Button, ModalKonfirmasi, beriTahu } from "@/components/ui";
import { resetDemo, setSakelarMasa } from "./aksi";

/** Kendali data demo: Reset & isi data demo (lewat modal konfirmasi) dan sakelar masa pengusulan. Hasil aksi lewat notifikasi. */
export function KontrolDemo({ masa }: { masa: "berjalan" | "ditutup" }) {
  const [saatIni, setSaatIni] = useState(masa);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [sibuk, mulai] = useTransition();

  function jalankan(kerja: () => Promise<{ ok: boolean; pesan: string }>, sesudah?: () => void) {
    mulai(async () => {
      const r = await kerja();
      (r.ok ? beriTahu.sukses : beriTahu.galat)(r.pesan);
      if (r.ok) sesudah?.();
      setKonfirmasi(false);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button varian="bahaya" disabled={sibuk} onClick={() => setKonfirmasi(true)}>
            Reset &amp; isi data demo
          </Button>
          <span className="text-xs text-abu-600">Mengosongkan semua data kecuali log audit, lalu mengisi ulang data contoh.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sakelar masa pengusulan">
          <span className="text-sm font-semibold text-primer-800">Masa pengusulan</span>
          {(["berjalan", "ditutup"] as const).map((m) => (
            <Button
              key={m}
              ukuran="sm"
              varian={saatIni === m ? "utama" : "sekunder"}
              disabled={sibuk}
              aria-pressed={saatIni === m}
              onClick={() => jalankan(() => setSakelarMasa(m), () => setSaatIni(m))}
            >
              {m}
            </Button>
          ))}
          <span className="text-xs text-abu-600">
            Saat ini: <strong data-testid="masa-saat-ini" className="font-semibold text-primer-800">{saatIni}</strong>
          </span>
        </div>
      </div>

      <ModalKonfirmasi
        buka={konfirmasi}
        saatUbah={(b) => !sibuk && setKonfirmasi(b)}
        judul="Reset & isi data demo"
        kode="DEMO"
        labelKonfirmasi="Reset sekarang"
        bahaya
        memuat={sibuk}
        saatKonfirmasi={() => jalankan(resetDemo)}
      >
        <p>Semua data demo kecuali log audit akan dihapus lalu diisi ulang. Basis data ini dipakai bersama oleh lokal dan produksi.</p>
      </ModalKonfirmasi>
    </div>
  );
}
