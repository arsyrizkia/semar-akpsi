"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button, Modal, Pilihan } from "@/components/ui";
import type { PeriodePilihan, SkemaPilihan } from "@/lib/templat/layanan";
import { aksiSusunVersiBaru } from "./aksi";

/**
 * Tombol "Templat Baru" (M-14): memilih Skema Pendanaan, lalu "Susun Versi Baru" membuat Draf (versi berikutnya disalin dari
 * templat aktif, atau versi 1 bila skema belum punya templat, S-1) dan langsung membuka rinciannya (J-02a).
 */
export function TemplatBaru({ skema, periode, periodeAwal, skemaAwal, label = "Templat Baru", varian = "utama" }: { skema: SkemaPilihan[]; periode: PeriodePilihan[]; periodeAwal?: string | null; skemaAwal?: string | null; label?: string; varian?: "utama" | "sekunder" }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [skemaId, setSkemaId] = useState(skemaAwal ?? skema[0]?.id ?? "");
  const [periodeId, setPeriodeId] = useState(periodeAwal ?? periode[0]?.id ?? "");
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, mulai] = useTransition();

  function susun() {
    setGalat(null);
    mulai(async () => {
      const r = await aksiSusunVersiBaru(skemaId, periodeId || null);
      if (!r.ok) return setGalat(r.pesan);
      router.push(`/tim-kerja/templat/${r.templat.id}`);
    });
  }

  return (
    <>
      <Button varian={varian} onClick={() => (setGalat(null), setBuka(true))} disabled={skema.length === 0}>
        <Plus aria-hidden className="size-4" /> {label}
      </Button>
      <Modal
        kode="M-14"
        ukuran="sm"
        buka={buka}
        saatUbah={(b) => !sibuk && setBuka(b)}
        judul="Templat Baru"
        kaki={
          <>
            <Button varian="sekunder" onClick={() => setBuka(false)} disabled={sibuk}>
              Batal
            </Button>
            <Button onClick={susun} memuat={sibuk} disabled={!skemaId}>
              Susun Versi Baru
            </Button>
          </>
        }
      >
        <Pilihan label="Skema Pendanaan" name="skema-baru" value={skemaId} galat={galat} onChange={(e) => setSkemaId(e.target.value)}>
          {skema.map((s) => (
            <option key={s.id} value={s.id}>
              {s.namaSkema}
            </option>
          ))}
        </Pilihan>
        <Pilihan label="Periode Berlaku" name="periode-baru" className="mt-4" value={periodeId} onChange={(e) => setPeriodeId(e.target.value)}>
          {periode.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Pilihan>
      </Modal>
    </>
  );
}
