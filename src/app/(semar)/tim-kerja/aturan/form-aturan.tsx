"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Isian, Modal, Pilihan } from "@/components/ui";
import {
  JENIS_ATURAN,
  deskripsiOtomatis,
  infoJenis,
  kodeOtomatis,
  validasiFormAturan,
  type FormAturan,
  type GalatFormAturan,
  type JenisAturan,
} from "@/lib/aturan/terstruktur";
import { PETUNJUK_KOLOM_RENTANG } from "@/lib/templat/kolom-rentang";

export interface PropsFormAturan {
  mode: "tambah" | "ubah";
  awal: FormAturan;
  bagian: string[];
  /** kode butir yang sudah ada pada versi ini (untuk kode otomatis dan cek duplikat butir manual) */
  kodeTerpakai: string[];
  /** templat Aktif/Arsip: jenis aturan yang menempel pada isi bagian terkunci (4a) dan tidak dapat dipilih */
  kunciIsi: boolean;
  /** hanya Pertanyaan Pemeriksaan dan Contoh Jawaban yang dapat disunting (butir semantik turunan pada templat Aktif) */
  hanyaPertanyaan?: boolean;
  /** menulis ke ketentuan bagian (butir turunan, Draf) alih-alih butir manual: kode dan deskripsi mengikuti bagian */
  keKetentuan: (jenis: JenisAturan | "") => boolean;
  sibuk: boolean;
  galatServer: string | null;
  saatSimpan: (f: FormAturan) => void;
  saatBatal: () => void;
}

const baris = (t: string) => t.split(/\r?\n/);

/**
 * M-02 Form Butir (Tambah Butir / Ubah): Bagian, Jenis Aturan, parameter sesuai jenis (berlabel Deterministik atau Semantik), lalu
 * Kode dan Deskripsi yang terisi otomatis. Isian teks bebas "Aturan Hitung" diganti formulir ini (catatan inkonsistensi no. 36).
 */
export function FormAturanModal(props: PropsFormAturan) {
  return <IsiForm key={`${props.mode}:${props.awal.kode}:${props.awal.jenisAturan}:${props.awal.unsur}:${props.awal.frasa}:${props.awal.bagian}`} {...props} />;
}

function IsiForm({ mode, awal, bagian, kodeTerpakai, kunciIsi, hanyaPertanyaan, keKetentuan, sibuk, galatServer, saatSimpan, saatBatal }: PropsFormAturan) {
  const [f, setF] = useState<FormAturan>(awal);
  const [kodeSunting, setKodeSunting] = useState(mode === "ubah");
  const [deskSunting, setDeskSunting] = useState(false);
  const [coba, setCoba] = useState(false);
  const info = infoJenis(f.jenisAturan);
  const ikatIsi = keKetentuan(f.jenisAturan);

  /** Mengubah isian lalu menyelaraskan kode dan deskripsi otomatis selama belum disunting tangan. */
  const ubah = (p: Partial<FormAturan>) =>
    setF((s) => {
      const n = { ...s, ...p };
      if (!deskSunting && mode === "tambah") n.deskripsi = deskripsiOtomatis(n);
      if (!kodeSunting && p.jenisAturan !== undefined) n.kode = kodeOtomatis(n.jenisAturan, kodeTerpakai);
      return n;
    });

  const galat: GalatFormAturan = useMemo(() => validasiFormAturan(f, { manual: !ikatIsi, kodeTerpakai, kodeAsal: awal.kode }), [f, ikatIsi, kodeTerpakai, awal.kode]);
  const tampil = (k: keyof FormAturan) => (coba ? galat[k] : undefined);
  const adaGalat = Object.keys(galat).length > 0;
  const tampilIsiSemantik = f.jenisAturan === "unsur" || f.jenisAturan === "semantik_bebas";
  const beku = Boolean(hanyaPertanyaan);

  return (
    <Modal
      kode="M-02"
      ukuran="lg"
      buka
      saatUbah={(b) => !sibuk && !b && saatBatal()}
      judul={mode === "ubah" ? `Ubah Butir ${awal.kode}`.trim() : "Tambah Butir"}
      kaki={
        <>
          <Button varian="sekunder" onClick={saatBatal} disabled={sibuk}>
            Batal
          </Button>
          <Button
            memuat={sibuk}
            onClick={() => {
              setCoba(true);
              if (!adaGalat) saatSimpan(f);
            }}
          >
            Simpan Butir
          </Button>
        </>
      }
    >
      <form
        id="form-butir"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setCoba(true);
          if (!adaGalat) saatSimpan(f);
        }}
        className="space-y-4"
      >
        {galatServer ? (
          <p role="alert" className="rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 font-medium text-bata-700">
            {galatServer}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Pilihan label="Bagian" name="bagian" wajib value={f.bagian} disabled={beku || mode === "ubah"} galat={tampil("bagian")} onChange={(e) => ubah({ bagian: e.target.value })}>
            <option value="">Pilih bagian</option>
            {bagian.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Pilihan>
          <Pilihan label="Jenis Aturan" name="jenis-aturan" wajib value={f.jenisAturan} disabled={beku || mode === "ubah"} galat={tampil("jenisAturan")} onChange={(e) => ubah({ jenisAturan: e.target.value as JenisAturan })}>
            <option value="">Pilih jenis aturan</option>
            {JENIS_ATURAN.map((j) => {
              const terkunci = kunciIsi && j.terikatIsi;
              return (
                <option key={j.nilai} value={j.nilai} disabled={terkunci}>
                  {j.label} ({j.jenis === "semantik" ? "Semantik" : "Deterministik"}){terkunci ? " — terkunci, perlu versi baru" : ""}
                </option>
              );
            })}
          </Pilihan>
        </div>

        {info ? (
          <p className="flex items-center gap-2 text-sm text-teks-redup">
            {info.jenis === "semantik" ? <Badge className="border-primer-200 bg-primer-100 text-primer-800">Semantik</Badge> : <Badge>Deterministik</Badge>}
            {ikatIsi ? "Aturan ini ditulis ke ketentuan bagian templat; butirnya diturunkan otomatis." : "Aturan ini menjadi butir tersendiri di luar isi bagian."}
          </p>
        ) : null}

        {(f.jenisAturan === "batas_kata" || f.jenisAturan === "batas_kata_min") && (
          <Isian label={f.jenisAturan === "batas_kata" ? "Batas Kata Maksimal" : "Batas Kata Minimal"} name="batas" inputMode="numeric" autoComplete="off" className="max-w-xs" value={f.batas} galat={tampil("batas")} onChange={(e) => ubah({ batas: e.target.value })} />
        )}
        {f.jenisAturan === "daftar" && (
          <div className="flex flex-wrap gap-4">
            <Isian label="Jumlah Butir" name="jumlah-butir" inputMode="numeric" autoComplete="off" className="w-36" value={f.jumlahButir} galat={tampil("jumlahButir")} onChange={(e) => ubah({ jumlahButir: e.target.value })} />
            <Pilihan label="Pemisah" name="pemisah" className="w-48" value={f.pemisah} galat={tampil("pemisah")} onChange={(e) => ubah({ pemisah: e.target.value })}>
              <option value=";">Titik koma (;)</option>
              <option value=",">Koma (,)</option>
              <option value="/">Garis miring (/)</option>
            </Pilihan>
          </div>
        )}
        {f.jenisAturan === "tabel" && (
          <div className="space-y-3">
            <Isian label="Kolom Wajib" multibaris rows={4} name="kolom" autoComplete="off" value={f.kolom.join("\n")} galat={tampil("kolom")} petunjuk={`Satu kolom per baris. ${PETUNJUK_KOLOM_RENTANG}`} onChange={(e) => ubah({ kolom: baris(e.target.value) })} />
            <Isian label="Judul Blok (opsional)" name="judul-tabel" autoComplete="off" className="max-w-xs" placeholder="mis. Tahun ke-1" value={f.judulTabel} onChange={(e) => ubah({ judulTabel: e.target.value })} />
          </div>
        )}
        {f.jenisAturan === "gambar" && (
          <Isian label="Keterangan Gambar" name="ket-gambar" autoComplete="off" className="max-w-md" placeholder="mis. diagram alir penelitian" value={f.ketGambar} onChange={(e) => ubah({ ketGambar: e.target.value })} />
        )}
        {f.jenisAturan === "frasa" && <Isian label="Frasa Wajib" name="frasa" autoComplete="off" value={f.frasa} galat={tampil("frasa")} onChange={(e) => ubah({ frasa: e.target.value })} />}
        {f.jenisAturan === "unsur" && <Isian label="Unsur Isi" name="unsur" autoComplete="off" value={f.unsur} galat={tampil("unsur")} disabled={beku} onChange={(e) => ubah({ unsur: e.target.value })} />}
        {tampilIsiSemantik && (
          <div className="space-y-3">
            <Isian label="Pertanyaan Pemeriksaan" multibaris rows={3} name="pertanyaan" autoComplete="off" wajib={f.jenisAturan === "semantik_bebas"} value={f.pertanyaan} galat={tampil("pertanyaan")} petunjuk={f.jenisAturan === "unsur" ? "Kosongkan agar disusun otomatis dari unsur isi." : undefined} onChange={(e) => ubah({ pertanyaan: e.target.value })} />
            <Isian label="Contoh Jawaban" multibaris rows={2} name="contoh-jawaban" autoComplete="off" value={f.contoh} onChange={(e) => ubah({ contoh: e.target.value })} />
          </div>
        )}

        {info && !beku ? (
          <div className="grid gap-4 border-t border-primer-100 pt-4 md:grid-cols-2">
            {ikatIsi ? (
              <>
                <div>
                  <p className="text-sm font-medium text-primer-900">Kode</p>
                  <p className="text-sm text-teks-redup">Diberikan otomatis saat templat terbit.</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primer-900">Deskripsi</p>
                  <p className="text-sm">{deskripsiOtomatis(f) || "-"}</p>
                </div>
              </>
            ) : (
              <>
                <Isian
                  label="Kode"
                  name="kode"
                  autoComplete="off"
                  spellCheck={false}
                  wajib
                  value={f.kode}
                  disabled={mode === "ubah"}
                  galat={tampil("kode")}
                  onChange={(e) => (setKodeSunting(true), setF((s) => ({ ...s, kode: e.target.value })))}
                />
                <Isian label="Deskripsi" name="deskripsi" autoComplete="off" wajib value={f.deskripsi} galat={tampil("deskripsi")} onChange={(e) => (setDeskSunting(true), setF((s) => ({ ...s, deskripsi: e.target.value })))} />
              </>
            )}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
