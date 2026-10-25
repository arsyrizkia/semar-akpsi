"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Combobox, Modal, RadioGroup, RadioItem } from "@/components/ui";
import type { KodeSyarat, TujuanPindah } from "@/lib/penugasan/aturan";
import type { HasilPindahBanyak, PilihanPindah } from "@/lib/penugasan/layanan";
import { aksiPindah } from "../aksi";

const angka = new Intl.NumberFormat("id-ID");

export interface KandidatUi {
  id: string;
  nama: string;
  institusi: string;
  beban: number;
}

export interface TargetPindah {
  pilihan: PilihanPindah;
  jumlah: number;
  /** satu baris: judul proposal, institusi pengusul, dan reviewer sekarang (untuk tanda syarat di daftar pilihan) */
  tunggal?: { judul: string; institusiPengusul: string; reviewerId: string; namaReviewer: string };
}

const LABEL_ALASAN: Record<KodeSyarat, string> = {
  institusi: "Institusi reviewer sama dengan institusi pengusul",
  beban: "Beban reviewer akan melampaui batas",
  bersedia: "Reviewer tidak bersedia",
  sama: "Sudah ditangani reviewer tersebut",
  "tidak-ada": "Tidak ada reviewer lain yang memenuhi syarat dan masih di bawah batas beban",
};

const sama = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * M-06 Pindahkan Proposal (UC-03 S-2) untuk satu atau banyak baris. Reviewer Pengganti dipilih sendiri (combobox yang dapat dicari;
 * yang memenuhi syarat di atas) atau "Pilihkan otomatis" (reviewer memenuhi syarat dengan beban terendah). Setiap perubahan pilihan
 * menjalankan pratinjau di server (pemeriksaan syarat yang sama dengan penyimpanan, tanpa menulis). Hasil pratinjau disimpan bersama
 * kunci tujuannya, jadi jawaban untuk pilihan lama tidak pernah tampil di bawah pilihan baru. "Simpan Pemindahan" memindahkan yang
 * memenuhi; yang tidak tetap pada reviewer semula (S-2.3). Komponen dipasang ulang (key) untuk setiap sasaran baru.
 */
export function ModalPindah({
  target,
  saatTutup,
  saatSelesai,
  periodeId,
  kandidat,
  batas,
}: {
  target: TargetPindah | null;
  saatTutup: () => void;
  saatSelesai: (h: HasilPindahBanyak) => void;
  periodeId: string;
  kandidat: KandidatUi[];
  batas: number;
}) {
  const [mode, setMode] = useState<"pilih" | "otomatis">("pilih");
  const [reviewerId, setReviewerId] = useState("");
  const [hasil, setHasil] = useState<{ kunci: string; h: HasilPindahBanyak } | null>(null);
  const [galatPratinjau, setGalatPratinjau] = useState<{ kunci: string; pesan: string } | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null);
  const permintaan = useRef(0);

  const tujuan: TujuanPindah | null = mode === "otomatis" ? { jenis: "otomatis" } : reviewerId ? { jenis: "reviewer", reviewerId } : null;
  const kunciTujuan = tujuan ? JSON.stringify(tujuan) : "";
  const pratinjau = hasil && hasil.kunci === kunciTujuan ? hasil.h : null;
  const galat = galatSimpan ?? (galatPratinjau && galatPratinjau.kunci === kunciTujuan ? galatPratinjau.pesan : null);
  const memeriksa = Boolean(target && tujuan) && !pratinjau && !(galatPratinjau && galatPratinjau.kunci === kunciTujuan);

  useEffect(() => {
    const nomor = ++permintaan.current;
    if (!target || !tujuan) return;
    const kunci = kunciTujuan;
    aksiPindah(periodeId, target.pilihan, tujuan, false)
      .then((h) => {
        if (nomor !== permintaan.current) return;
        if (h.ok) setHasil({ kunci, h });
        else setGalatPratinjau({ kunci, pesan: h.galat });
      })
      .catch(() => nomor === permintaan.current && setGalatPratinjau({ kunci, pesan: "Pemeriksaan syarat gagal; coba lagi." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, kunciTujuan, periodeId]);

  async function simpan() {
    if (!target || !tujuan) return;
    setMenyimpan(true);
    setGalatSimpan(null);
    try {
      const h = await aksiPindah(periodeId, target.pilihan, tujuan, true);
      if (!h.ok) setGalatSimpan(h.galat);
      else if (h.dipindahkan === 0) setHasil({ kunci: kunciTujuan, h });
      else saatSelesai(h);
    } catch {
      setGalatSimpan("Pemindahan gagal disimpan; coba lagi.");
    } finally {
      setMenyimpan(false);
    }
  }

  const t = target?.tunggal;
  const opsi = kandidat
    .filter((k) => !t || k.id !== t.reviewerId)
    .map((k) => {
      const peringatan = t && sama(k.institusi, t.institusiPengusul) ? "Institusi sama dengan pengusul" : k.beban >= batas ? "Sudah mencapai batas" : undefined;
      return { nilai: k.id, label: k.nama, keterangan: `${k.institusi} · beban ${k.beban}/${batas}`, peringatan };
    })
    // yang memenuhi syarat lebih dulu, lalu beban terendah
    .sort((a, b) => Number(Boolean(a.peringatan)) - Number(Boolean(b.peringatan)));

  const banyak = (target?.jumlah ?? 0) > 1;
  const ditolakSemua = pratinjau !== null && pratinjau.dipindahkan === 0;
  return (
    <Modal
      buka={target !== null}
      saatUbah={(b) => !b && !menyimpan && saatTutup()}
      kode="M-06"
      judul={banyak ? `Pindahkan ${angka.format(target!.jumlah)} Proposal` : "Pindahkan Proposal"}
      deskripsi={t ? `${t.judul} (sekarang: ${t.namaReviewer})` : `${angka.format(target?.jumlah ?? 0)} proposal terpilih akan diperiksa ulang syaratnya satu per satu.`}
      kaki={
        <>
          <Button varian="sekunder" onClick={saatTutup} disabled={menyimpan}>
            Batal
          </Button>
          <Button onClick={simpan} memuat={menyimpan} disabled={!pratinjau || memeriksa || pratinjau.dipindahkan === 0}>
            Simpan Pemindahan
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-primer-800">Reviewer Pengganti</legend>
        <RadioGroup
          value={mode}
          onValueChange={(v) => {
            setMode(v as "pilih" | "otomatis");
            setGalatSimpan(null);
          }}
          className="mb-3 flex-col gap-2"
        >
          <RadioItem id="pindah-pilih" value="pilih" label="Pilih reviewer" />
          <RadioItem id="pindah-otomatis" value="otomatis" label="Pilihkan otomatis: reviewer yang memenuhi syarat dengan beban terendah" />
        </RadioGroup>
        {mode === "pilih" ? (
          <Combobox
            label="Reviewer Pengganti"
            wajib
            nilai={reviewerId}
            saatUbah={(v) => {
              setReviewerId(v);
              setGalatSimpan(null);
            }}
            opsi={opsi}
            placeholder="Ketik nama atau institusi reviewer…"
            galat={ditolakSemua && !banyak ? "Reviewer ini tidak memenuhi syarat. Pilih reviewer lain atau gunakan Pilihkan otomatis." : null}
          />
        ) : null}
      </fieldset>

      <div aria-live="polite" className="mt-4 min-h-6">
        {memeriksa ? (
          <p role="status" className="flex items-center gap-2 text-primer-800">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Memeriksa syarat…
          </p>
        ) : pratinjau && !ditolakSemua ? (
          <div>
            <p className="text-primer-900">
              <strong className="angka">{angka.format(pratinjau.dipindahkan)}</strong> dari <span className="angka">{angka.format(pratinjau.dipilih)}</span> proposal dapat dipindahkan
              {pratinjau.tujuan.length === 1 ? ` ke ${pratinjau.tujuan[0].nama}` : pratinjau.tujuan.length > 1 ? ` ke ${pratinjau.tujuan.length} reviewer` : ""}.
            </p>
            {pratinjau.tujuan.length > 1 ? (
              <p className="mt-1 text-xs text-teks-redup">
                {pratinjau.tujuan
                  .slice(0, 6)
                  .map((x) => `${x.nama} (${x.jumlah} proposal)`)
                  .join(", ")}
                {pratinjau.tujuan.length > 6 ? `, dan ${pratinjau.tujuan.length - 6} reviewer lainnya` : ""}
              </p>
            ) : null}
            {pratinjau.ditolak ? (
              <div className="mt-2 rounded-md border-l-4 border-peringatan-500 bg-peringatan-50 px-3 py-2">
                <p className="font-semibold text-primer-900">{angka.format(pratinjau.ditolak)} tetap pada reviewer semula:</p>
                <ul className="mt-1 list-disc pl-5">
                  {pratinjau.alasan.map((a) => (
                    <li key={a.kode}>
                      {LABEL_ALASAN[a.kode]} ({angka.format(a.jumlah)}){!banyak ? `: ${a.contoh}` : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {ditolakSemua && !memeriksa ? (
        <div role="alert" className="mt-2 rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 text-bata-700">
          <p className="font-semibold">Pemindahan ditolak, reviewer semula tetap dipakai.</p>
          <ul className="mt-1 list-disc pl-5">
            {pratinjau.alasan.map((a) => (
              <li key={a.kode}>{banyak ? `${LABEL_ALASAN[a.kode]} (${angka.format(a.jumlah)})` : a.contoh}</li>
            ))}
          </ul>
          <p className="mt-1">{mode === "otomatis" ? "Naikkan batas beban lalu susun ulang, atau pilih proposal lain." : "Pilih reviewer lain atau gunakan Pilihkan otomatis."}</p>
        </div>
      ) : null}
      {galat ? (
        <p role="alert" className="mt-2 rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 font-medium text-bata-700">
          {galat}
        </p>
      ) : null}
    </Modal>
  );
}
