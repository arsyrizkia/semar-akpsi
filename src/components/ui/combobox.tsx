"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Popover as RPopover } from "radix-ui";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OpsiCombobox {
  nilai: string;
  label: string;
  /** baris kedua kecil, mis. "Institut Bahari Contoh · beban 40/45" */
  keterangan?: string;
  /** alasan opsi tidak memenuhi syarat (tetap dapat dipilih; ditampilkan sebagai peringatan) */
  peringatan?: string;
}

const normal = (s: string) => s.toLocaleLowerCase("id-ID").normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Combobox ARIA 1.2 (input + listbox) yang dapat dicari: ketik untuk menyaring, panah atas/bawah untuk berpindah, Enter memilih,
 * Esc menutup. Daftar dirender di Popover (portal) supaya tidak terpotong wadah bergulir seperti isi modal. Dipakai untuk "Reviewer
 * Pengganti" (M-06) dan filter Reviewer di J-04b; daftar ratusan reviewer tetap ringan karena hanya 100 hasil teratas yang dirender.
 */
export function Combobox({
  label,
  opsi,
  nilai,
  saatUbah,
  placeholder = "Ketik untuk mencari",
  petunjuk,
  galat,
  wajib,
  bolehKosong,
  labelKosong = "Semua",
  className,
  id,
}: {
  label: string;
  opsi: OpsiCombobox[];
  nilai: string;
  saatUbah: (nilai: string) => void;
  placeholder?: string;
  petunjuk?: string;
  galat?: string | null;
  wajib?: boolean;
  /** tampilkan tombol hapus pilihan (filter) */
  bolehKosong?: boolean;
  labelKosong?: string;
  className?: string;
  id?: string;
}) {
  const otomatis = useId();
  const kunci = id ?? otomatis;
  const idDaftar = `${kunci}-daftar`;
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const [aktif, setAktif] = useState(0);
  const masukan = useRef<HTMLInputElement>(null);
  const terpilih = opsi.find((o) => o.nilai === nilai);

  const hasil = useMemo(() => {
    const q = normal(cari.trim());
    const cocok = q ? opsi.filter((o) => normal(`${o.label} ${o.keterangan ?? ""}`).includes(q)) : opsi;
    return cocok.slice(0, 100);
  }, [cari, opsi]);

  function pilih(o: OpsiCombobox) {
    saatUbah(o.nilai);
    setBuka(false);
    setCari("");
  }

  function tekan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!buka) setBuka(true);
      setAktif((a) => {
        const n = hasil.length;
        if (!n) return 0;
        return e.key === "ArrowDown" ? (a + 1) % n : (a - 1 + n) % n;
      });
    } else if (e.key === "Enter") {
      if (buka && hasil[aktif]) {
        e.preventDefault();
        pilih(hasil[aktif]);
      }
    } else if (e.key === "Escape") {
      if (buka) {
        e.preventDefault();
        e.stopPropagation(); // jangan ikut menutup modal
        setBuka(false);
        setCari("");
      }
    }
  }

  const deskripsi = galat ? `${kunci}-galat` : petunjuk ? `${kunci}-petunjuk` : undefined;
  const idOpsi = (i: number) => `${kunci}-opsi-${i}`;

  return (
    <div className={className}>
      <label htmlFor={kunci} className="mb-1 block text-sm font-semibold text-primer-800">
        {label}
        {wajib ? (
          <span aria-hidden className="ml-0.5 text-bata-600">
            *
          </span>
        ) : null}
      </label>
      <RPopover.Root open={buka} onOpenChange={setBuka}>
        <RPopover.Anchor asChild>
          <div className="relative">
            <input
              ref={masukan}
              id={kunci}
              role="combobox"
              aria-expanded={buka}
              aria-controls={idDaftar}
              aria-autocomplete="list"
              aria-activedescendant={buka && hasil[aktif] ? idOpsi(aktif) : undefined}
              aria-invalid={galat ? true : undefined}
              aria-describedby={deskripsi}
              aria-required={wajib || undefined}
              autoComplete="off"
              spellCheck={false}
              placeholder={terpilih ? terpilih.label : bolehKosong ? labelKosong : placeholder}
              value={buka ? cari : (terpilih?.label ?? "")}
              onChange={(e) => {
                setCari(e.target.value);
                setAktif(0);
                if (!buka) setBuka(true);
              }}
              onFocus={() => setAktif(Math.max(0, hasil.findIndex((o) => o.nilai === nilai)))}
              onClick={() => setBuka(true)}
              onKeyDown={tekan}
              className="h-10 w-full rounded-md border border-primer-400 bg-white pl-3 pr-16 text-primer-900 placeholder:text-primer-600 focus-visible:outline-primer-400 aria-[invalid=true]:border-2 aria-[invalid=true]:border-bata-600"
            />
            <span className="absolute inset-y-0 right-1 flex items-center">
              {bolehKosong && nilai ? (
                <button
                  type="button"
                  aria-label={`Hapus pilihan ${label}`}
                  onClick={() => {
                    saatUbah("");
                    masukan.current?.focus();
                  }}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded text-primer-700 hover:bg-primer-100"
                >
                  <X aria-hidden className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                tabIndex={-1}
                aria-label={buka ? `Tutup daftar ${label}` : `Buka daftar ${label}`}
                onClick={() => {
                  setBuka((b) => !b);
                  masukan.current?.focus();
                }}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded text-primer-600 hover:bg-primer-100"
              >
                <ChevronDown aria-hidden className={cn("size-4 transition-transform", buka && "rotate-180")} />
              </button>
            </span>
          </div>
        </RPopover.Anchor>
        <RPopover.Portal>
          <RPopover.Content
            align="start"
            sideOffset={4}
            collisionPadding={12}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (e.target instanceof Node && masukan.current?.parentElement?.contains(e.target)) e.preventDefault();
            }}
            className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-64 rounded-md border border-primer-200 bg-white shadow-[var(--shadow-overlay)]"
          >
            <ul id={idDaftar} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto overscroll-contain py-1 text-sm">
              {hasil.length === 0 ? (
                <li role="option" aria-selected={false} aria-disabled className="px-3 py-2 text-teks-redup">
                  Tidak ada yang cocok dengan &ldquo;{cari}&rdquo;.
                </li>
              ) : (
                hasil.map((o, i) => (
                  <li
                    key={o.nilai}
                    id={idOpsi(i)}
                    role="option"
                    aria-selected={o.nilai === nilai}
                    onMouseEnter={() => setAktif(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pilih(o)}
                    className={cn("flex cursor-pointer items-start gap-2 px-3 py-1.5", i === aktif && "bg-primer-50")}
                  >
                    <Check aria-hidden className={cn("mt-0.5 size-4 shrink-0 text-primer-700", o.nilai !== nilai && "invisible")} />
                    <span className="min-w-0">
                      <span className="block truncate text-primer-900">{o.label}</span>
                      {o.keterangan ? <span className="block truncate text-xs text-teks-redup">{o.keterangan}</span> : null}
                      {o.peringatan ? <span className="block text-xs font-medium text-peringatan-700">{o.peringatan}</span> : null}
                    </span>
                  </li>
                ))
              )}
            </ul>
            {opsi.length > hasil.length && !cari ? <p className="border-t border-primer-100 px-3 py-1.5 text-xs text-teks-redup">Ketik untuk mencari di antara {opsi.length} pilihan.</p> : null}
          </RPopover.Content>
        </RPopover.Portal>
      </RPopover.Root>
      {galat ? (
        <p id={`${kunci}-galat`} role="alert" className="mt-1 text-sm font-medium text-bata-600">
          {galat}
        </p>
      ) : petunjuk ? (
        <p id={`${kunci}-petunjuk`} className="mt-1 text-xs text-teks-redup">
          {petunjuk}
        </p>
      ) : null}
    </div>
  );
}
