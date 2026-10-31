"use client";

import { createContext, startTransition, use, useState, useTransition } from "react";
import { ModalKonfirmasi, beriTahu } from "@/components/ui";
import { STATUS_DITANDAI } from "@/lib/pemantauan/rekap";
import { aksiTandaiButir, type HasilTandaiAksi } from "./aksi";

interface KonteksTandai {
  dipilih: Set<string>;
  alih: (kode: string, nilai: boolean) => void;
  /** buka M-09 untuk butir yang dicentang, atau satu butir (dari M-08) */
  mintaTandai: (kode?: string) => void;
  galatPilih: string | null;
  /** butir yang boleh ditandai: Aktif pada basis aturan berlaku */
  bolehDitandai: (kode: string) => boolean;
}

const Konteks = createContext<KonteksTandai | null>(null);

export function useTandai(): KonteksTandai {
  const k = use(Konteks);
  if (!k) throw new Error("useTandai harus di dalam PenyediaTandai");
  return k;
}

/**
 * Status pilihan "Perlu Diperbaiki" dan M-09 Konfirmasi Tandai Butir (UC-04 s.6-7), dipakai bersama daftar Perlu perhatian dan
 * M-08 Rincian Butir. Sesudah ditandai, aksi server memvalidasi ulang J-05 sehingga butir tampil berlabel Perlu ditinjau. Halaman
 * memasang `key` periode:skema sehingga pilihan tidak terbawa ke periode atau skema lain.
 */
export function PenyediaTandai({
  periodeId,
  skemaId,
  butir,
  children,
}: {
  periodeId: string;
  skemaId: string;
  butir: { kode: string; deskripsi: string; status: string | null }[];
  children: React.ReactNode;
}) {
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [sasaran, setSasaran] = useState<string[] | null>(null);
  const [hasil, setHasil] = useState<HasilTandaiAksi | null>(null);
  const [galatPilih, setGalatPilih] = useState<string | null>(null);
  const [sibuk, mulai] = useTransition();
  const info = new Map(butir.map((b) => [b.kode, b]));
  const bolehDitandai = (kode: string) => info.get(kode)?.status === "Aktif";

  function alih(kode: string, nilai: boolean) {
    setGalatPilih(null);
    setDipilih((s) => {
      const baru = new Set(s);
      if (nilai) baru.add(kode);
      else baru.delete(kode);
      return baru;
    });
  }

  function mintaTandai(kode?: string) {
    // hanya butir yang masih boleh ditandai pada laporan ini (pilihan lama dari periode/skema lain tidak ikut)
    const daftar = (kode ? [kode] : [...dipilih]).filter(bolehDitandai);
    if (!daftar.length) {
      setGalatPilih("Pilih minimal satu butir dengan mencentang “Perlu Diperbaiki”.");
      return;
    }
    setHasil(null);
    setSasaran(daftar);
  }

  function tandai() {
    if (!sasaran) return;
    mulai(async () => {
      const h = await aksiTandaiButir(periodeId, skemaId, sasaran);
      // setter sesudah await dibungkus startTransition: pesan dan data segar (butir berlabel "Perlu ditinjau") tampil serentak
      startTransition(() => {
        setHasil(h);
        if (h.galat) return;
        setSasaran(null);
        setDipilih((s) => new Set([...s].filter((k) => !h.ditandai.includes(k))));
        if (!h.ditandai.length) {
          beriTahu.info("Tidak ada butir Aktif yang perlu ditandai.");
          return;
        }
        // langkah berikutnya (Buka di Aturan Pemeriksaan) sudah ada di baris butir yang ditandai, jadi cukup satu pesan singkat
        beriTahu.sukses(
          h.ditandai.length === 1
            ? `Butir “${info.get(h.ditandai[0])?.deskripsi ?? "terpilih"}” sekarang berlabel “${STATUS_DITANDAI}”.`
            : `${h.ditandai.length} butir sekarang berlabel “${STATUS_DITANDAI}”.`,
        );
      });
    });
  }

  return (
    <Konteks value={{ dipilih, alih, mintaTandai, galatPilih, bolehDitandai }}>
      {children}
      <ModalKonfirmasi
        buka={sasaran !== null}
        saatUbah={(b) => !b && setSasaran(null)}
        kode="M-09"
        judul="Konfirmasi Tandai Butir"
        labelKonfirmasi="Tandai Butir"
        memuat={sibuk}
        saatKonfirmasi={tandai}
        galat={hasil?.galat ?? null}
      >
        <p>
          Butir berikut akan berlabel &ldquo;{STATUS_DITANDAI}&rdquo; dan tampil disorot di Aturan Pemeriksaan. Pemeriksaan otomatis tetap memakai butir ini sampai basis aturan
          versi baru disimpan.
        </p>
        <ul className="mt-3 space-y-1">
          {(sasaran ?? []).map((k) => (
            <li key={k}>
              {info.get(k)?.deskripsi}
            </li>
          ))}
        </ul>
      </ModalKonfirmasi>
    </Konteks>
  );
}
