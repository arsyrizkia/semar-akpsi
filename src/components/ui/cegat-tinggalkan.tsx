"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Modal } from "./modal";

/**
 * Menjaga isian yang belum disimpan saat pengguna berpindah lewat tautan di dalam aplikasi (breadcrumb, sidebar, tautan antarlayar).
 * `beforeunload` hanya menjaga penutupan tab dan muat ulang; navigasi klien Next tidak memicunya.
 * Selagi `kotor`, klik tautan internal dicegat dan modal konfirmasi tampil: simpan lalu pindah, tinggalkan, atau batal.
 * (Tambahan prototipe: tidak ada di Bab 10; dicatat di docs/catatan-inkonsistensi.md.)
 */
export function CegatTinggalkan({ kotor, labelSimpan, saatSimpan }: { kotor: boolean; labelSimpan: string; saatSimpan: () => Promise<boolean> }) {
  const router = useRouter();
  const [tujuan, setTujuan] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    if (!kotor) return;
    const saatKlik = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const u = new URL(a.href, window.location.href);
      if (u.origin !== window.location.origin) return;
      if (u.pathname === window.location.pathname && u.search === window.location.search) return; // hanya pindah jangkar di layar yang sama
      if (u.pathname.startsWith("/api/")) return; // unduhan
      e.preventDefault();
      e.stopPropagation();
      setTujuan(u.pathname + u.search + u.hash);
    };
    document.addEventListener("click", saatKlik, true);
    return () => document.removeEventListener("click", saatKlik, true);
  }, [kotor]);

  async function simpanLaluPindah() {
    if (!tujuan) return;
    setSibuk(true);
    const ok = await saatSimpan();
    setSibuk(false);
    if (ok) {
      const t = tujuan;
      setTujuan(null);
      router.push(t);
    } else setTujuan(null); // galat tampil di layar; pengguna tetap di sini
  }

  function tinggalkan() {
    const t = tujuan;
    setTujuan(null);
    if (t) router.push(t);
  }

  return (
    <Modal
      buka={tujuan !== null}
      saatUbah={(b) => !b && !sibuk && setTujuan(null)}
      judul="Tinggalkan tanpa menyimpan?"
      deskripsi="Ada perubahan yang belum disimpan di layar ini."
      ukuran="sm"
      kaki={
        <>
          <Button varian="sekunder" onClick={() => setTujuan(null)} disabled={sibuk}>
            Batal
          </Button>
          <Button varian="bahaya" onClick={tinggalkan} disabled={sibuk}>
            Tinggalkan
          </Button>
          <Button memuat={sibuk} onClick={() => void simpanLaluPindah()}>
            {labelSimpan}
          </Button>
        </>
      }
    >
      <p>Pilih {`"`}{labelSimpan}{`"`} untuk menyimpan isian lalu berpindah, atau {`"`}Tinggalkan{`"`} untuk membuangnya.</p>
    </Modal>
  );
}
