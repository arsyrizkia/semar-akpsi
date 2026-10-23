"use client";

import { useState } from "react";
import { Button, Isian, KotakCentang, Modal, Pilihan } from "@/components/ui";
import { periksaTemplatLampiran, type JenisLampiran, type LampiranTemplat } from "@/lib/templat/paket";

interface Props {
  buka: boolean;
  saatUbah: (buka: boolean) => void;
  nilai: LampiranTemplat;
  saatTerapkan: (l: LampiranTemplat) => void;
}

const baris = (x: string) => x.split(/\r?\n/).map((y) => y.trim()).filter(Boolean);

/** M-13 Templat Lampiran (UC-01): unggahan bebas, atau formulir bertemplat dengan isi dan kalimat kunci untuk cekLampiran. */
export function ModalLampiran(props: Props) {
  return props.buka ? <IsiModal {...props} /> : null;
}

function IsiModal({ buka, saatUbah, nilai, saatTerapkan }: Props) {
  const [jenis, setJenis] = useState<JenisLampiran>(nilai.jenis);
  const [judul, setJudul] = useState(nilai.judul);
  const [kalimat, setKalimat] = useState(nilai.kalimat.join("\n"));
  const [kunci, setKunci] = useState(nilai.kunci.join("\n"));
  const [sertakan, setSertakan] = useState(nilai.sertakan !== false);
  const galat = periksaTemplatLampiran(jenis, judul, kalimat, kunci);

  return (
    <Modal
      kode="M-13"
      buka={buka}
      saatUbah={saatUbah}
      ukuran="lg"
      judul="Templat Lampiran"
      deskripsi={`Lampiran: ${nilai.nama.trim() || "(tanpa nama)"}`}
      kaki={
        <>
          <Button varian="sekunder" onClick={() => saatUbah(false)}>
            Batal
          </Button>
          <Button
            disabled={Boolean(galat)}
            onClick={() => {
              saatTerapkan({ nama: nilai.nama, jenis, judul: jenis === "formulir" ? judul.trim() : "", kalimat: jenis === "formulir" ? baris(kalimat) : [], kunci: jenis === "formulir" ? baris(kunci) : [], sertakan });
              saatUbah(false);
            }}
          >
            Terapkan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Pilihan label="Jenis Lampiran" name="jenis-lampiran" value={jenis} onChange={(e) => setJenis(e.target.value as JenisLampiran)}>
          <option value="unggahan">Unggahan bebas (mis. artikel)</option>
          <option value="formulir">Formulir bertemplat (mis. surat pernyataan)</option>
        </Pilihan>
        <KotakCentang id="m13-sertakan" label="Sertakan halaman lampiran di paket unduhan" checked={sertakan} onCheckedChange={(v) => setSertakan(v === true)} />
        {jenis === "formulir" ? (
          <>
            <Isian label="Judul Formulir" name="judul-formulir" autoComplete="off" value={judul} galat={galat?.judul} onChange={(e) => setJudul(e.target.value)} />
            <Isian
              label="Isi Templat"
              multibaris
              rows={9}
              name="isi-templat"
              autoComplete="off"
              value={kalimat}
              galat={galat?.kalimat}
              petunjuk="Satu kalimat per baris. Baris berbentuk &quot;Nama | NIDN | Alamat&quot; menjadi isian &quot;Nama : ....&quot;."
              onChange={(e) => setKalimat(e.target.value)}
            />
            <Isian
              label="Kalimat Kunci"
              multibaris
              rows={3}
              name="kalimat-kunci"
              autoComplete="off"
              value={kunci}
              galat={galat?.kunci}
              petunjuk="Satu frasa per baris. Berkas yang diunggah harus memuat frasa ini agar lolos pemeriksaan format."
              onChange={(e) => setKunci(e.target.value)}
            />
          </>
        ) : (
          <p className="text-teks-redup">Lampiran diunggah pengusul sebagai berkas terpisah; templat hanya memuat lembar penanda di paket unduhan.</p>
        )}
      </div>
    </Modal>
  );
}
