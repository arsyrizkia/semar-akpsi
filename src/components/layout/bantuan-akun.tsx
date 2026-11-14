"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { KATA_SANDI_PROTOTIPE, type BarisAkunBantuan } from "@/lib/bima/akun-demo";

/** Peristiwa jendela untuk membuka dialog dari luar ("Kesulitan login? Bantuan" di formulir masuk BIMA). */
export const PERISTIWA_BUKA_BANTUAN_AKUN = "semar:buka-bantuan-akun";

/**
 * Dialog Bantuan di halaman masuk BIMA: tabel akun prototipe SEMAR (nama, peran, username, email) dan kata sandinya. Bagian prototipe
 * yang selalu tampil: halaman masuk ini terbuka untuk publik, jadi penguji perlu tahu cara masuk. Bukan alat peragaan.
 */
export function BantuanAkun({ akun }: { akun: BarisAkunBantuan[] }) {
  const [buka, setBuka] = useState(false);
  useEffect(() => {
    const bukaDariLuar = () => setBuka(true);
    window.addEventListener(PERISTIWA_BUKA_BANTUAN_AKUN, bukaDariLuar);
    return () => window.removeEventListener(PERISTIWA_BUKA_BANTUAN_AKUN, bukaDariLuar);
  }, []);
  return (
    <Modal
      buka={buka}
      saatUbah={setBuka}
      ukuran="xl"
      judul="Akun prototipe SEMAR"
      deskripsi="Masuk dengan username atau email, dengan kata sandi yang sama untuk semua akun. Tidak ada email yang dikirim."
    >
      <p className="mb-3">
        Kata sandi: <code translate="no" className="rounded-sm bg-primer-100 px-1.5 py-0.5 font-mono font-semibold text-primer-900">{KATA_SANDI_PROTOTIPE}</code>
      </p>
      <div className="overflow-x-auto rounded-md border border-primer-200">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <caption className="sr-only">Akun prototipe SEMAR</caption>
          <thead className="bg-primer-50 text-primer-800">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">Nama</th>
              <th scope="col" className="px-3 py-2 font-semibold">Peran</th>
              <th scope="col" className="px-3 py-2 font-semibold">Username</th>
              <th scope="col" className="px-3 py-2 font-semibold">Email</th>
              <th scope="col" className="px-3 py-2 font-semibold">Kata sandi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primer-100">
            {akun.map((a) => (
              <tr key={a.username}>
                <td className="px-3 py-2 align-top font-medium text-primer-900">{a.nama}</td>
                <td className="px-3 py-2 align-top">{a.peran}</td>
                <td translate="no" className="px-3 py-2 align-top font-mono text-xs">{a.username}</td>
                <td translate="no" className="px-3 py-2 align-top font-mono text-xs">{a.email}</td>
                <td translate="no" className="px-3 py-2 align-top font-mono text-xs">{KATA_SANDI_PROTOTIPE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
