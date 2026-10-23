"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState, useTransition } from "react";
import { AlertCircle, ArrowLeft, Lock } from "lucide-react";
import { Alert, Bagian, Button, CegatTinggalkan, Isian, ModalKonfirmasi, RadioGroup, RadioItem, StatusBadge, TBody, TD, TH, THead, TR, Table, beriTahu, kelasTombol } from "@/components/ui";
import { KOMPONEN_BORANG, type Keputusan } from "@/lib/kontrak/tipe";
import type { DataKeputusan } from "@/lib/penilaian/tipe";
import { PESAN_KOMPONEN_BELUM_LENGKAP } from "@/lib/penilaian/validasi";
import { ringkasKeputusan, ringkasRekomendasi } from "@/lib/penilaian/status";
import { aksiKirimUlang, aksiSimpanPermanen, aksiSimpanSementara } from "./../actions";

const PESAN_TERKIRIM = "Penilaian tersimpan dan terkirim ke BIMA";
const PESAN_GAGAL_KIRIM = "Penilaian tersimpan, tetapi gagal terkirim ke BIMA. Tekan \"Kirim ulang\".";
const potret = (k: Record<string, Keputusan | undefined>, u: string) => JSON.stringify([KOMPONEN_BORANG.map((n) => k[n] ?? null), u]);

export function KeputusanKlien({ data }: { data: DataKeputusan }) {
  const router = useRouter();
  const [komponen, setKomponen] = useState<Record<string, Keputusan | undefined>>(data.penilaian.komponen);
  const [umpanBalik, setUmpanBalik] = useState(data.penilaian.umpanBalik);
  const [final, setFinal] = useState(data.penilaian.status === "Final");
  const [terkirim, setTerkirim] = useState(data.penilaian.terkirimKeBima);
  const [tandaiKosong, setTandaiKosong] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [galatModal, setGalatModal] = useState<string | null>(null);
  const [sibuk, mulai] = useTransition();
  const [tersimpan, setTersimpan] = useState(() => potret(data.penilaian.komponen, data.penilaian.umpanBalik));

  const ringkas = ringkasKeputusan(komponen);
  const rek = ringkasRekomendasi(data.butir);
  const kotor = !final && potret(komponen, umpanBalik) !== tersimpan;
  const tampilKosong = (k: string) => tandaiKosong && !komponen[k];

  // Peringatan sebelum meninggalkan halaman dengan isian yang belum disimpan
  useEffect(() => {
    if (!kotor) return;
    const f = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [kotor]);

  const isian = () => ({ umpanBalik, komponen: komponen as Record<string, string | undefined> });

  /** Simpan Sementara; dipakai tombolnya dan CegatTinggalkan ("Simpan Sementara lalu pindah"). */
  async function simpan(): Promise<boolean> {
    setGalat(null);
    const r = await aksiSimpanSementara(data.penugasanId, isian());
    if (!r.ok) {
      setGalat(r.galat);
      return false;
    }
    setTersimpan(potret(komponen, umpanBalik));
    beriTahu.sukses("Draf penilaian tersimpan");
    return true;
  }

  function simpanSementara() {
    mulai(async () => {
      await simpan();
    });
  }

  /** "Kembali ke Pemeriksaan": bila datang dari J-08, kembali ke entri riwayat itu (tab dan butir terakhir ikut terbawa). */
  function kembaliKePemeriksaan(e: React.MouseEvent) {
    const asal = typeof document !== "undefined" ? document.referrer : "";
    if (kotor || !asal.includes(`/reviewer/pemeriksaan/${data.penugasanId}`) || asal.includes("/keputusan")) return;
    e.preventDefault();
    router.back();
  }

  function mintaPermanen() {
    setGalat(null);
    if (!ringkas.lengkap) {
      // komponen kosong ditandai; teks pesan sama dengan penolakan server
      setTandaiKosong(true);
      setGalat(PESAN_KOMPONEN_BELUM_LENGKAP);
      const i = KOMPONEN_BORANG.indexOf(ringkas.kosong[0] as (typeof KOMPONEN_BORANG)[number]);
      document.getElementById(`kb-baris-${i}`)?.scrollIntoView({ block: "center" });
      setTimeout(() => document.getElementById(`kb-m-${i}`)?.focus(), 0);
      return;
    }
    setGalatModal(null);
    setModal(true);
  }

  function simpanPermanen() {
    mulai(async () => {
      const r = await aksiSimpanPermanen(data.penugasanId, isian());
      if (!r.ok) {
        setGalatModal(r.galat);
        return;
      }
      startTransition(() => {
        setTersimpan(potret(komponen, umpanBalik));
        setFinal(true);
        setTerkirim(r.terkirim);
        setModal(false);
        if (r.terkirim) beriTahu.sukses(PESAN_TERKIRIM);
        else beriTahu.galat(r.pesanKirim ?? PESAN_GAGAL_KIRIM);
      });
    });
  }

  function kirimUlang() {
    mulai(async () => {
      const r = await aksiKirimUlang(data.penugasanId);
      if (r.ok) {
        setTerkirim(true);
        beriTahu.sukses(PESAN_TERKIRIM);
      } else setGalat(r.galat);
    });
  }

  return (
    <>
      {final ? (
        terkirim ? (
          <Alert jenis="sukses" className="mb-6" judul={PESAN_TERKIRIM}>
            <p>Penilaian ini hanya dapat dibaca.</p>
            <Link href="/reviewer/penugasan" className={`${kelasTombol("sekunder", "sm")} mt-2`}>
              Kembali ke Daftar Penugasan
            </Link>
          </Alert>
        ) : (
          <Alert jenis="galat" className="mb-6" judul={PESAN_GAGAL_KIRIM}>
            <Button ukuran="sm" className="mt-2" memuat={sibuk} onClick={kirimUlang}>
              Kirim ulang
            </Button>
          </Alert>
        )
      ) : null}

      <Bagian judul="Keputusan Komponen Borang">
        <Table aria-label="Keputusan Komponen Borang">
          <THead>
            <TR>
              <TH>Komponen</TH>
              <TH>Keputusan</TH>
            </TR>
          </THead>
          <TBody>
            {KOMPONEN_BORANG.map((k, i) => {
              const kosong = tampilKosong(k);
              return (
                <TR key={k} className={kosong ? "bg-bata-100/60" : undefined}>
                  <TD className="w-3/5">
                    <p id={`kb-baris-${i}`} className="font-medium text-primer-900">
                      {k}
                    </p>
                    {i === 0 ? (
                      <Link href={`/reviewer/pemeriksaan/${data.penugasanId}`} className="text-xs text-primer-800 underline underline-offset-2">
                        Tinjau butir semantik ({rek.dikoreksi} dari {rek.total} dikoreksi)
                      </Link>
                    ) : null}
                    {kosong ? (
                      <p role="alert" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-bata-700">
                        <AlertCircle aria-hidden className="size-3.5" /> Belum diputuskan
                      </p>
                    ) : null}
                  </TD>
                  <TD>
                    <RadioGroup
                      aria-labelledby={`kb-baris-${i}`}
                      aria-invalid={kosong ? true : undefined}
                      value={komponen[k] ?? ""}
                      disabled={final}
                      onValueChange={(v) => setKomponen((s) => ({ ...s, [k]: v as Keputusan }))}
                    >
                      <RadioItem id={`kb-m-${i}`} value="Memenuhi" label="Memenuhi" />
                      <RadioItem id={`kb-t-${i}`} value="Tidak memenuhi" label="Tidak memenuhi" />
                    </RadioGroup>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Bagian>

      <Bagian judul="Umpan Balik untuk Pengusul">
        <Isian
          label="Umpan Balik untuk Pengusul"
          className="[&>label]:sr-only"
          multibaris
          rows={6}
          name="umpan-balik"
          autoComplete="off"
          value={umpanBalik}
          disabled={final}
          onChange={(e) => setUmpanBalik(e.target.value)}
        />
      </Bagian>

      <div className="mt-6" aria-live="polite">
        {galat ? <Alert jenis="galat">{galat}</Alert> : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-primer-200 pt-4">
        <Link href={`/reviewer/pemeriksaan/${data.penugasanId}`} onClick={kembaliKePemeriksaan} className={kelasTombol("hantu", "md")}>
          <ArrowLeft aria-hidden className="size-4" /> Kembali ke Pemeriksaan
        </Link>
        {final ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-teks-redup">
            <Lock aria-hidden className="size-4" /> Hanya-baca
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {kotor ? <span className="text-xs text-teks-redup">Ada perubahan yang belum disimpan</span> : null}
            <Button varian="sekunder" onClick={simpanSementara} disabled={sibuk}>
              Simpan Sementara
            </Button>
            <Button onClick={mintaPermanen} disabled={sibuk}>
              Simpan Permanen
            </Button>
          </div>
        )}
      </div>

      <CegatTinggalkan kotor={kotor} labelSimpan="Simpan Sementara lalu pindah" saatSimpan={simpan} />

      <ModalKonfirmasi
        kode="M-11"
        buka={modal}
        saatUbah={(b) => {
          if (!sibuk) setModal(b);
        }}
        judul="Konfirmasi Simpan Permanen"
        deskripsi="Periksa ringkasan keputusan sebelum menyimpan."
        labelKonfirmasi="Simpan Permanen"
        memuat={sibuk}
        saatKonfirmasi={simpanPermanen}
        galat={galatModal}
      >
        <ul className="divide-y divide-primer-100 text-sm">
          {KOMPONEN_BORANG.map((k) => (
            <li key={k} className="flex items-center justify-between gap-3 py-1.5">
              <span>{k}</span>
              {komponen[k] ? <StatusBadge status={komponen[k] as string} /> : null}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm angka">
          {ringkas.memenuhi} Memenuhi, {ringkas.tidakMemenuhi} Tidak memenuhi, {rek.dikoreksi} koreksi rekomendasi.
        </p>
        <p className="mt-3 rounded-md border-l-4 border-peringatan-500 bg-peringatan-50 px-3 py-2 text-sm text-primer-900">
          Setelah disimpan permanen, penilaian menjadi hanya-baca dan dikirim ke BIMA.
        </p>
      </ModalKonfirmasi>
    </>
  );
}
