"use client";

import { useState, useTransition } from "react";
import { Button, Isian, Modal, Pilihan, RadioGroup, RadioItem } from "@/components/ui";
import { JENIS_KEKELIRUAN } from "@/lib/kontrak/tipe";
import type { ButirTampil, KoreksiTampil } from "@/lib/penilaian/tipe";
import { validasiKoreksi } from "@/lib/penilaian/validasi";
import { aksiSimpanKoreksi } from "./actions";

/** Keputusan awal: kebalikan rekomendasi sistem (reviewer membuka modal karena "Tidak Setuju"); koreksi yang sudah ada dimuat ulang. */
function formAwal(b: ButirTampil) {
  if (b.koreksi) return { keputusan: b.koreksi.keputusan as string, alasan: b.koreksi.alasan, jenisKekeliruan: b.koreksi.jenisKekeliruan };
  const balik = b.rekomendasi === "Memenuhi" ? "Tidak memenuhi" : b.rekomendasi === "Tidak memenuhi" ? "Memenuhi" : "";
  return { keputusan: balik, alasan: "", jenisKekeliruan: "" };
}

/**
 * M-10 Koreksi Rekomendasi (UC-08), di atas J-08. Render dengan `key` = id butir agar isian mulai segar tiap dibuka.
 * Batal (4a) menutup tanpa menulis apa pun; Simpan Koreksi menulis lewat server (S-1: alasan kosong ditolak).
 */
export function ModalKoreksi({
  penugasanId,
  butir,
  saatTutup,
  saatTersimpan,
}: {
  penugasanId: string;
  butir: ButirTampil;
  saatTutup: () => void;
  saatTersimpan: (hasilId: string, koreksi: KoreksiTampil) => void;
}) {
  const [form, setForm] = useState(() => formAwal(butir));
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [sibuk, mulai] = useTransition();
  const id = butir.hasilId;

  function simpan() {
    const kolom = validasiKoreksi(form);
    if (Object.keys(kolom).length) {
      setGalat(kolom); // S-1: bingkai merah + "Alasan koreksi wajib diisi" tepat di bawah isian
      setTimeout(() => document.getElementById(kolom.alasan ? `kr-alasan-${id}` : `kr-jenis-${id}`)?.focus(), 0);
      return;
    }
    mulai(async () => {
      const r = await aksiSimpanKoreksi(penugasanId, id, form);
      if (!r.ok) {
        setGalat(r.kolom ?? { umum: r.galat });
        return;
      }
      saatTersimpan(id, r.koreksi as KoreksiTampil);
    });
  }

  return (
    <Modal
      buka
      saatUbah={(b) => {
        if (!b && !sibuk) saatTutup();
      }}
      kode="M-10"
      judul="Koreksi Rekomendasi"
      deskripsi={`Butir ${butir.kode}: keputusan Anda menggantikan rekomendasi sistem.`}
      ukuran="md"
      kaki={
        <>
          <Button varian="sekunder" onClick={saatTutup} disabled={sibuk}>
            Batal
          </Button>
          <Button onClick={simpan} memuat={sibuk}>
            Simpan Koreksi
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <dl className="space-y-2 rounded-md bg-abu-50 p-3 text-sm">
          <div>
            <dt className="text-xs font-semibold text-sogan-700">Rekomendasi sistem</dt>
            <dd>{butir.rekomendasi ?? butir.status}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-sogan-700">Kutipan</dt>
            <dd>{butir.kutipan ? <q className="italic">{butir.kutipan}</q> : "Tidak ada kutipan."}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-sogan-700">Alasan sistem</dt>
            <dd>{butir.alasanSistem ?? "Tidak ada."}</dd>
          </div>
        </dl>

        <div role="group" aria-labelledby={`kr-label-${id}`}>
          <p id={`kr-label-${id}`} className="mb-1 text-sm font-semibold text-sogan-800">
            Keputusan Reviewer
          </p>
          <RadioGroup aria-labelledby={`kr-label-${id}`} value={form.keputusan} onValueChange={(v) => setForm((f) => ({ ...f, keputusan: v }))}>
            <RadioItem id={`kr-m-${id}`} value="Memenuhi" label="Memenuhi" />
            <RadioItem id={`kr-t-${id}`} value="Tidak memenuhi" label="Tidak memenuhi" />
          </RadioGroup>
          {galat.keputusan ? (
            <p role="alert" className="mt-1 text-sm font-medium text-bata-600">
              {galat.keputusan}
            </p>
          ) : null}
        </div>

        <Isian
          id={`kr-alasan-${id}`}
          label="Alasan Koreksi"
          wajib
          multibaris
          rows={4}
          name="alasan-koreksi"
          autoComplete="off"
          value={form.alasan}
          galat={galat.alasan}
          onChange={(e) => setForm((f) => ({ ...f, alasan: e.target.value }))}
        />

        <Pilihan
          id={`kr-jenis-${id}`}
          label="Jenis Kekeliruan"
          petunjuk="Opsional."
          name="jenis-kekeliruan"
          value={form.jenisKekeliruan}
          galat={galat.jenisKekeliruan}
          onChange={(e) => setForm((f) => ({ ...f, jenisKekeliruan: e.target.value }))}
        >
          <option value="">Tanpa jenis</option>
          {JENIS_KEKELIRUAN.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </Pilihan>

        {galat.umum ? (
          <p role="alert" className="rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 text-sm font-medium text-bata-700">
            {galat.umum}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
