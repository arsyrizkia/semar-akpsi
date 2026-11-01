"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Button, Modal, TombolUnduh, type ButtonProps } from "@/components/ui";

/** Isi modal: templat .docx dirender di peramban dengan docx-preview. Dipasang ulang (key) setiap kali modal dibuka. */
function IsiPratinjau({ alamat }: { alamat: string }) {
  const [keadaan, setKeadaan] = useState<"memuat" | "siap" | "galat">("memuat");
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let batal = false;
    const muat = async () => {
      try {
        const [res, { renderAsync }] = await Promise.all([fetch(alamat, { cache: "no-store" }), import("docx-preview")]);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.blob();
        if (batal || !wadah.current) return;
        await renderAsync(data, wadah.current, undefined, { inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: false, useBase64URL: true });
        if (!batal) setKeadaan("siap");
      } catch {
        if (!batal) setKeadaan("galat");
      }
    };
    void muat();
    return () => {
      batal = true;
    };
  }, [alamat]);
  return (
    <div className="relative -mx-5 -my-4 min-h-72 bg-abu-100">
      {keadaan === "memuat" ? (
        <p role="status" className="absolute inset-x-0 top-10 flex items-center justify-center gap-2 text-sm text-teks-redup">
          <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          Menyiapkan pratinjau…
        </p>
      ) : null}
      {keadaan === "galat" ? (
        <p role="alert" className="px-5 py-10 text-center text-sm font-medium text-bata-700">
          Pratinjau tidak dapat ditampilkan. Unduh berkas .docx untuk melihatnya.
        </p>
      ) : null}
      <div ref={wadah} className="relative overflow-x-auto" />
    </div>
  );
}

/**
 * "Lihat Templat" (UC-01, J-02 dan J-02a): templat Isian Substansi .docx dari rute unduh yang sama ditampilkan di modal tanpa harus
 * diunduh. Berkas templat terkunci: di Word hanya baris isian putih yang dapat diketik. `sebelumBuka` (mis. menyimpan draf lebih dulu,
 * seperti "Unduh Pratinjau") dijalankan sebelum modal terbuka; false membatalkan.
 */
export function TombolLihatTemplat({
  alamat,
  judul,
  label = "Lihat Templat",
  sebelumBuka,
  varian = "sekunder",
  ukuran = "md",
  disabled,
}: {
  alamat: string;
  judul: string;
  label?: string;
  sebelumBuka?: () => Promise<boolean>;
  varian?: ButtonProps["varian"];
  ukuran?: ButtonProps["ukuran"];
  disabled?: boolean;
}) {
  const [buka, setBuka] = useState(false);
  const [nomor, setNomor] = useState(0);
  const [menyiapkan, setMenyiapkan] = useState(false);

  async function bukaPratinjau() {
    if (sebelumBuka) {
      setMenyiapkan(true);
      const ok = await sebelumBuka();
      setMenyiapkan(false);
      if (!ok) return;
    }
    setNomor((n) => n + 1);
    setBuka(true);
  }

  // nomor pembukaan ikut di alamat supaya pratinjau draf selalu dari isian yang baru disimpan (bukan tembolok)
  const alamatSegar = `${alamat}${alamat.includes("?") ? "&" : "?"}lihat=${nomor}`;
  return (
    <>
      <Button varian={varian} ukuran={ukuran} onClick={bukaPratinjau} memuat={menyiapkan} disabled={disabled} aria-haspopup="dialog">
        <Eye aria-hidden className="size-4" />
        {label}
      </Button>
      <Modal
        buka={buka}
        saatUbah={setBuka}
        judul={judul}
        deskripsi="Pratinjau templat seperti yang diunduh pengusul. Di Word, hanya kotak isian putih yang dapat diketik; judul dan petunjuk terkunci."
        ukuran="xl"
        kaki={
          <TombolUnduh href={alamat} ukuran="sm">
            Unduh (.docx)
          </TombolUnduh>
        }
      >
        {buka ? <IsiPratinjau key={nomor} alamat={alamatSegar} /> : null}
      </Modal>
    </>
  );
}
