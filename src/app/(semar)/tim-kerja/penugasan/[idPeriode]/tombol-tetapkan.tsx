"use client";

import { startTransition, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Modal } from "@/components/ui";
import { aksiTetapkan } from "../aksi";
import type { HasilTetapkanAksi } from "../tipe";

const angka = new Intl.NumberFormat("id-ID");

/**
 * Satu-satunya tombol utama J-04b: "Tetapkan Penugasan" (UC-03 s.7) dan konfirmasinya (M-07). Penetapan ditolak bila ada usulan yang
 * melanggar syarat (mis. reviewer berubah menjadi tidak bersedia sesudah usulan disusun). Sesudah berhasil, halaman pindah ke tab
 * "Sudah Ditetapkan" dengan satu pesan sukses (?tetap=n), tanpa notifikasi kembar.
 */
export function TombolTetapkan({
  periodeId,
  jumlahUsulan,
  jumlahReviewer,
  bebanMin,
  bebanMaks,
  batas,
  melanggar,
  ditutup,
}: {
  periodeId: string;
  jumlahUsulan: number;
  jumlahReviewer: number;
  bebanMin: number;
  bebanMaks: number;
  batas: number;
  melanggar: number;
  ditutup: boolean;
}) {
  const [buka, setBuka] = useState(false);
  const [hasil, setHasil] = useState<HasilTetapkanAksi | null>(null);
  const [sibuk, mulai] = useTransition();
  const router = useRouter();
  const jalur = usePathname();

  function tetapkan() {
    mulai(async () => {
      const h = await aksiTetapkan(periodeId);
      startTransition(() => {
        setHasil(h);
        if (h.berhasil) {
          setBuka(false);
          router.replace(`${jalur}?tab=ditetapkan&tetap=${h.jumlah ?? 0}`, { scroll: false });
        }
      });
    });
  }

  const terhalang = melanggar > 0;
  return (
    <>
      <Button
        onClick={() => {
          setHasil(null);
          setBuka(true);
        }}
        disabled={!ditutup || jumlahUsulan === 0}
      >
        Tetapkan Penugasan
      </Button>
      <Modal
        buka={buka}
        saatUbah={(b) => !sibuk && setBuka(b)}
        kode="M-07"
        judul={`Tetapkan ${angka.format(jumlahUsulan)} penugasan?`}
        ukuran="sm"
        kaki={
          <>
            <Button varian="sekunder" onClick={() => setBuka(false)} disabled={sibuk}>
              Batal
            </Button>
            <Button onClick={tetapkan} memuat={sibuk} disabled={terhalang}>
              {hasil?.gagalBima ? "Kirim ulang" : "Tetapkan Penugasan"}
            </Button>
          </>
        }
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt className="text-teks-redup">Proposal</dt>
          <dd className="angka font-semibold text-primer-900">{angka.format(jumlahUsulan)}</dd>
          <dt className="text-teks-redup">Reviewer</dt>
          <dd className="angka font-semibold text-primer-900">{angka.format(jumlahReviewer)}</dd>
          <dt className="text-teks-redup">Beban per reviewer</dt>
          <dd className="angka font-semibold text-primer-900">
            {bebanMin === bebanMaks ? bebanMin : `${bebanMin}–${bebanMaks}`} dari batas {batas}
          </dd>
        </dl>
        <p className="mt-3 text-teks-redup">
          Penugasan dikirim ke BIMA dan muncul di Daftar Penugasan reviewer (J-07) dengan tanda &ldquo;Baru&rdquo;. Sesudah ditetapkan, usulan tidak dapat dipindahkan lagi.
        </p>
        {sibuk ? (
          <p role="status" className="mt-3 font-semibold text-primer-800">
            Mengirim {angka.format(jumlahUsulan)} penugasan ke BIMA…
          </p>
        ) : null}
        {terhalang ? (
          <div role="alert" className="mt-3 rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 text-bata-700">
            <p className="font-semibold">{angka.format(melanggar)} usulan melanggar syarat penugasan.</p>
            <p className="mt-1">
              Pindahkan usulan itu dulu.{" "}
              <Link href={`${jalur}?tab=usulan&syarat=melanggar`} onClick={() => setBuka(false)} className="font-semibold underline underline-offset-2">
                Tampilkan yang melanggar
              </Link>
            </p>
          </div>
        ) : null}
        {hasil && !hasil.berhasil ? (
          <p role="alert" className="mt-3 rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 font-medium text-bata-700">
            {hasil.galat ?? "Penugasan gagal ditetapkan."}
            {hasil.gagalBima ? ' Penugasan yang belum terkirim tetap berstatus Diusulkan; tekan "Kirim ulang" untuk mencoba lagi.' : ""}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
