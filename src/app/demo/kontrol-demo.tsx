"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { resetDemo, setSakelarMasa } from "./aksi";

export function KontrolDemo({ masa }: { masa: "berjalan" | "ditutup" }) {
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [sibuk, mulai] = useTransition();

  function jalankan(kerja: () => Promise<{ ok: boolean; pesan: string }>) {
    setPesan(null);
    mulai(async () => {
      const r = await kerja();
      setPesan({ ok: r.ok, teks: r.pesan });
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          varian="bahaya"
          disabled={sibuk}
          onClick={() => {
            if (window.confirm("Semua data demo (kecuali log audit) akan dihapus dan diisi ulang. Basis data ini dipakai bersama. Lanjutkan?")) jalankan(resetDemo);
          }}
        >
          Reset &amp; isi data demo
        </Button>
        <span className="text-sm text-sogan-700">Mengosongkan semua data kecuali log audit, lalu mengisi ulang data contoh.</span>
      </div>
      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Sakelar masa pengusulan">
        <span className="font-semibold text-sogan-800">Masa pengusulan:</span>
        <Button varian={masa === "berjalan" ? "utama" : "garis"} disabled={sibuk} aria-pressed={masa === "berjalan"} onClick={() => jalankan(() => setSakelarMasa("berjalan"))}>
          berjalan
        </Button>
        <Button varian={masa === "ditutup" ? "utama" : "garis"} disabled={sibuk} aria-pressed={masa === "ditutup"} onClick={() => jalankan(() => setSakelarMasa("ditutup"))}>
          ditutup
        </Button>
        <span className="text-sm text-sogan-700">Saat ini: <strong data-testid="masa-saat-ini">{masa}</strong></span>
      </div>
      {sibuk ? <p role="status" className="text-sm text-sogan-700">Memproses...</p> : null}
      {pesan ? (
        <p role={pesan.ok ? "status" : "alert"} className={pesan.ok ? "text-sm font-semibold text-daun-700" : "text-sm font-semibold text-bata-700"}>
          {pesan.teks}
        </p>
      ) : null}
    </div>
  );
}
