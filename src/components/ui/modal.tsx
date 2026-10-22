"use client";

import { Dialog as RDialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const lebarModal = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;
export type UkuranModal = keyof typeof lebarModal;

export interface PropsModal {
  buka: boolean;
  saatUbah: (buka: boolean) => void;
  judul: string;
  deskripsi?: string;
  ukuran?: UkuranModal;
  /** isi tombol aksi di kaki modal (rata kanan) */
  kaki?: React.ReactNode;
  children?: React.ReactNode;
  /** kode modal kecil (M-xx) untuk ketertelusuran ke Bab 10 */
  kode?: string;
}

/**
 * Modal (Radix Dialog): fokus terjebak, Esc menutup, fokus kembali ke pemicu, `aria-labelledby` dari judul.
 * Dikendalikan lewat `buka` dan `saatUbah`. Bila modal berisi formulir, bungkus isi + kaki dengan <form> sendiri.
 */
export function Modal({ buka, saatUbah, judul, deskripsi, ukuran = "md", kaki, children, kode }: PropsModal) {
  return (
    <RDialog.Root open={buka} onOpenChange={saatUbah}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-primer-900/50" />
        <RDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-primer-200 bg-white shadow-[var(--shadow-overlay)]",
            lebarModal[ukuran],
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-primer-100 px-5 py-4">
            <div>
              {kode ? <p className="mb-0.5 font-mono text-[11px] font-semibold text-abu-600">{kode}</p> : null}
              <RDialog.Title className="text-lg font-semibold text-primer-800">{judul}</RDialog.Title>
              {deskripsi ? (
                <RDialog.Description className="mt-0.5 text-sm text-primer-700">{deskripsi}</RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{judul}</RDialog.Description>
              )}
            </div>
            <RDialog.Close aria-label="Tutup" className="-mr-1 -mt-1 inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-primer-700 hover:bg-primer-100">
              <X aria-hidden className="size-5" />
            </RDialog.Close>
          </header>
          <div className="overflow-y-auto overscroll-contain px-5 py-4 text-sm">{children}</div>
          {kaki ? <footer className="flex flex-wrap justify-end gap-2 border-t border-primer-100 bg-latar px-5 py-3">{kaki}</footer> : null}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/** Nama lama. `lebar` tidak lagi dipakai; pakai `ukuran`. */
export const Dialog = Modal;

export interface PropsModalKonfirmasi {
  buka: boolean;
  saatUbah: (buka: boolean) => void;
  judul: string;
  deskripsi?: string;
  children?: React.ReactNode;
  /** label tombol konfirmasi, mis. "Terbitkan" (persis spesifikasi) */
  labelKonfirmasi: string;
  labelBatal?: string;
  /** konfirmasi merusak: tombol berwarna bahaya */
  bahaya?: boolean;
  memuat?: boolean;
  saatKonfirmasi: () => void | Promise<void>;
  kode?: string;
  /** pesan galat yang ditampilkan di dalam modal (mis. penolakan alur alternatif) */
  galat?: string | null;
}

/** Modal konfirmasi: ringkasan + "Batal"/konfirmasi. Galat tampil di dalam modal, modal tidak menutup sendiri saat gagal. */
export function ModalKonfirmasi({ buka, saatUbah, judul, deskripsi, children, labelKonfirmasi, labelBatal = "Batal", bahaya, memuat, saatKonfirmasi, kode, galat }: PropsModalKonfirmasi) {
  return (
    <Modal
      buka={buka}
      saatUbah={saatUbah}
      judul={judul}
      deskripsi={deskripsi}
      ukuran="sm"
      kode={kode}
      kaki={
        <>
          <Button varian="sekunder" onClick={() => saatUbah(false)} disabled={memuat}>
            {labelBatal}
          </Button>
          <Button varian={bahaya ? "bahaya" : "utama"} memuat={memuat} onClick={() => void saatKonfirmasi()}>
            {labelKonfirmasi}
          </Button>
        </>
      }
    >
      {children}
      {galat ? (
        <p role="alert" className="mt-3 rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 font-medium text-bata-700">
          {galat}
        </p>
      ) : null}
    </Modal>
  );
}

/** Sheet: panel dari kanan untuk rincian sekunder (mis. M-08 Rincian Butir). Perilaku fokus sama dengan Modal. */
export function Sheet({ buka, saatUbah, judul, deskripsi, children, kaki, kode }: Omit<PropsModal, "ukuran">) {
  return (
    <RDialog.Root open={buka} onOpenChange={saatUbah}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-primer-900/40" />
        <RDialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-primer-200 bg-white shadow-[var(--shadow-overlay)]">
          <header className="flex items-start justify-between gap-3 border-b border-primer-100 px-5 py-4">
            <div>
              {kode ? <p className="mb-0.5 font-mono text-[11px] font-semibold text-abu-600">{kode}</p> : null}
              <RDialog.Title className="text-lg font-semibold text-primer-800">{judul}</RDialog.Title>
              {deskripsi ? (
                <RDialog.Description className="mt-0.5 text-sm text-primer-700">{deskripsi}</RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{judul}</RDialog.Description>
              )}
            </div>
            <RDialog.Close aria-label="Tutup" className="-mr-1 -mt-1 inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-primer-700 hover:bg-primer-100">
              <X aria-hidden className="size-5" />
            </RDialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm">{children}</div>
          {kaki ? <footer className="flex flex-wrap justify-end gap-2 border-t border-primer-100 bg-latar px-5 py-3">{kaki}</footer> : null}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
