"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  KUNCI_ALAT_PERAGAAN,
  PERISTIWA_ALAT_PERAGAAN,
  adalahPintasanAlatPeragaan,
  alatTampilDariNilai,
  nilaiDariAlatTampil,
} from "@/lib/demo/alat-peragaan";

function langganan(cb: () => void) {
  window.addEventListener(PERISTIWA_ALAT_PERAGAAN, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(PERISTIWA_ALAT_PERAGAAN, cb);
    window.removeEventListener("storage", cb);
  };
}
/** Keadaan saat ini, dibaca langsung (untuk pendengar papan tombol). */
export function alatPeragaanTampil(): boolean {
  try {
    return alatTampilDariNilai(localStorage.getItem(KUNCI_ALAT_PERAGAAN));
  } catch {
    return false;
  }
}
function atur(tampil: boolean) {
  try {
    localStorage.setItem(KUNCI_ALAT_PERAGAAN, nilaiDariAlatTampil(tampil));
  } catch {
    /* penyimpanan tidak tersedia: alat tetap tersembunyi */
  }
  window.dispatchEvent(new Event(PERISTIWA_ALAT_PERAGAAN));
}

/** Apakah alat peragaan sedang ditampilkan. Di server dan saat hidrasi selalu false (tersembunyi). */
export function useAlatPeragaan(): boolean {
  return useSyncExternalStore(langganan, alatPeragaanTampil, () => false);
}

/** Membungkus unsur peragaan: tidak dirender sama sekali saat tersembunyi (atau diganti `cadangan` bila ada), jadi tidak ikut urutan tab dan tidak terbaca pembaca layar. */
export function AlatPeragaan({ children, cadangan = null }: { children: ReactNode; cadangan?: ReactNode }) {
  return useAlatPeragaan() ? <>{children}</> : <>{cadangan}</>;
}

/** Pasang sekali di layout akar: pintasan Alt+Shift+D menampilkan atau menyembunyikan alat peragaan di halaman mana pun. */
export function PintasanAlatPeragaan() {
  const [kabar, setKabar] = useState("");
  useEffect(() => {
    function tekan(e: KeyboardEvent) {
      if (!adalahPintasanAlatPeragaan(e)) return;
      e.preventDefault();
      const tampil = !alatPeragaanTampil();
      atur(tampil);
      setKabar(tampil ? "Alat peragaan ditampilkan." : "Alat peragaan disembunyikan.");
    }
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, []);
  return (
    <p role="status" className="sr-only">
      {kabar}
    </p>
  );
}
