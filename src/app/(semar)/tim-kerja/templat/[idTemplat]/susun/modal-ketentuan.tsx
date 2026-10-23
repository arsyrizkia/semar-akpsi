"use client";

import { useState } from "react";
import { Badge, Button, Isian, KotakCentang, Modal } from "@/components/ui";
import { batasKataValid, periksaKetentuan, type BarisBagianMentah } from "@/lib/templat/kelengkapan";
import { ringkasKetentuan } from "@/lib/templat/isian-substansi";

/** Nilai M-12 yang boleh disunting per versi templat; format baku (jenis isian, pemisah, gambar, sitasi, pustaka) tidak berubah. */
export interface KetentuanBisaDiganti {
  petunjuk: string;
  batas: string;
  tanpaBatas: boolean;
  wajib: boolean;
  jumlahButir: string;
}

interface Props {
  buka: boolean;
  saatUbah: (buka: boolean) => void;
  indeks: number;
  bagian: BarisBagianMentah[];
  saatTerapkan: (k: KetentuanBisaDiganti) => void;
}

/** Aturan format baku bagian sebagai teks hanya-baca (chip). */
function formatBaku(b: BarisBagianMentah): string[] {
  return ringkasKetentuan({
    urutan: 0,
    nama: b.nama,
    wajib: b.wajib,
    batasKata: null,
    jenisIsian: b.jenisIsian ?? "teks",
    jumlahButir: b.jumlahButir ? Number(b.jumlahButir) : null,
    pemisah: b.pemisah ?? null,
    wajibGambar: b.wajibGambar,
    sitasiBernomor: b.sitasiBernomor,
    daftarPustaka: b.daftarPustaka,
  }).filter((c) => !c.startsWith("≤"));
}

/**
 * M-12 Ketentuan Bagian (UC-01): yang diganti per versi templat hanya petunjuk, batas kata, jumlah butir (bagian daftar), dan wajib.
 * Aturan format baku bagian ditampilkan hanya-baca.
 */
export function ModalKetentuan(props: Props) {
  // isi dimuat ulang tiap dibuka: komponen dalam dipasang hanya selama modal terbuka
  return props.buka ? <IsiModal {...props} /> : null;
}

function IsiModal({ buka, saatUbah, indeks, bagian, saatTerapkan }: Props) {
  const awal = bagian[indeks];
  const [k, setK] = useState<KetentuanBisaDiganti>({
    petunjuk: awal.petunjuk ?? "",
    batas: awal.batas,
    tanpaBatas: awal.tanpaBatas,
    wajib: awal.wajib,
    jumlahButir: awal.jumlahButir ?? "",
  });
  const ubah = (p: Partial<KetentuanBisaDiganti>) => setK((s) => ({ ...s, ...p }));
  const galat = periksaKetentuan(bagian.map((b, i) => (i === indeks ? { ...b, jumlahButir: k.jumlahButir } : b)))[indeks];
  const galatBatas = !k.tanpaBatas && !batasKataValid(k.batas) ? "Isi angka bulat lebih dari 0, atau centang Tanpa batas kata" : null;
  const daftar = awal.jenisIsian === "daftar";
  const baku = formatBaku(awal);

  return (
    <Modal
      kode="M-12"
      buka={buka}
      saatUbah={saatUbah}
      ukuran="md"
      judul="Ketentuan Bagian"
      deskripsi={`Bagian: ${awal.nama.trim() || `baris ${indeks + 1}`}`}
      kaki={
        <>
          <Button varian="sekunder" onClick={() => saatUbah(false)}>
            Batal
          </Button>
          <Button
            disabled={Boolean(galat) || Boolean(galatBatas)}
            onClick={() => {
              saatTerapkan(k);
              saatUbah(false);
            }}
          >
            Terapkan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Isian
          label="Petunjuk Pengisian"
          multibaris
          rows={4}
          name="petunjuk"
          autoComplete="off"
          value={k.petunjuk}
          petunjuk="Tulis {batas} agar diganti otomatis dengan Batas Kata bagian."
          onChange={(e) => ubah({ petunjuk: e.target.value })}
        />
        <div className="flex flex-wrap items-end gap-4">
          <Isian
            label="Batas Kata"
            name="batas-kata"
            inputMode="numeric"
            autoComplete="off"
            className="w-36"
            value={k.tanpaBatas ? "" : k.batas}
            disabled={k.tanpaBatas}
            galat={galatBatas}
            onChange={(e) => ubah({ batas: e.target.value })}
          />
          <KotakCentang id="k-tanpa-batas" label="Tanpa batas kata" checked={k.tanpaBatas} onCheckedChange={(v) => ubah({ tanpaBatas: v === true })} />
          <KotakCentang id="k-wajib" label="Wajib" checked={k.wajib} onCheckedChange={(v) => ubah({ wajib: v === true })} />
        </div>
        {daftar ? (
          <Isian
            label="Jumlah Butir"
            name="jumlah-butir"
            inputMode="numeric"
            autoComplete="off"
            className="w-36"
            value={k.jumlahButir}
            galat={galat?.jumlahButir}
            onChange={(e) => ubah({ jumlahButir: e.target.value })}
          />
        ) : null}
        <div>
          <p className="mb-1 text-sm font-semibold text-primer-800">Aturan format baku</p>
          <div className="flex flex-wrap gap-1">
            {baku.length > 0 ? baku.map((c) => <Badge key={c}>{c}</Badge>) : <Badge>teks biasa</Badge>}
          </div>
          <p className="mt-1 text-xs text-teks-redup">Format baku mengikuti contoh BIMA dan tidak dapat diubah per versi.</p>
        </div>
      </div>
    </Modal>
  );
}
