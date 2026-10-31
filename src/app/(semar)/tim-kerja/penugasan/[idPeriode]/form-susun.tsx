"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, Button, Isian, ModalKonfirmasi } from "@/components/ui";
import { formatDurasi, formatTenggat, kapasitasReviewer, masaDariLama, menitPerHariDibutuhkan, periksaParamMasa, type ParamMasa } from "@/lib/penilaian/masa";
import { cn } from "@/lib/utils";
import { aksiSusun } from "../aksi";
import type { HasilSusunAksi } from "../tipe";

const angka = new Intl.NumberFormat("id-ID");
const desimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/**
 * J-04b langkah 1-4 dan S-1: isian "Batas Beban per Reviewer", tombol "Susun Usulan Penugasan", dan panel "Kekurangan Reviewer".
 * Panel S-1 memuat kapasitas, institusi pengusul penghambat (bila hambatannya institusi), dan saran batas terkecil yang cukup
 * dengan tombol "Susun dengan batas n". Saat S-1 tidak ada data yang berubah (usulan dan batas lama tetap). Menyusun ulang saat usulan
 * sudah ada meminta konfirmasi dulu karena usulan lama, termasuk pemindahan manual, akan diganti.
 * Tim Kerja hanya mengisi batas beban dan lama masa penilaian. Waktu menilai per hari dihitung otomatis dari menit per proposal
 * (standar sistem); kapasitas satu reviewer = batas jam menilai per hari sepanjang masa, dan batas beban tidak boleh melebihinya.
 * Sesudah penugasan pertama ditetapkan, lama masa terkunci dan tenggatnya ditampilkan.
 */
export function FormSusun({
  periodeId,
  batasAwal,
  ditutup,
  jumlahUsulan,
  perluDitugaskan,
  susunOtomatis,
  masaAwal,
  mulaiPenilaian,
  batasPenilaian,
}: {
  periodeId: string;
  batasAwal: number;
  ditutup: boolean;
  jumlahUsulan: number;
  perluDitugaskan: number;
  susunOtomatis: boolean;
  masaAwal: ParamMasa;
  /** ISO; ada = masa penilaian sudah dimulai (isian masa terkunci) */
  mulaiPenilaian: string | null;
  batasPenilaian: string | null;
}) {
  const adaUsulan = jumlahUsulan > 0;
  const [tanyaUlang, setTanyaUlang] = useState(false);
  const sudahYakin = useRef(false);

  const [hasil, kirim, menyusun] = useActionState<HasilSusunAksi, FormData>(aksiSusun, {});
  const form = useRef<HTMLFormElement>(null);
  const [batas, setBatas] = useState(String(batasAwal));
  const [lama, setLama] = useState(String(masaAwal.lamaHari));
  const terkunci = mulaiPenilaian !== null;
  const masa: ParamMasa = terkunci ? masaAwal : masaDariLama(Number(lama.trim()));
  const galatMasaIsian = terkunci ? null : periksaParamMasa(masa);
  const kapasitas = galatMasaIsian ? null : kapasitasReviewer(masa);
  const nBatas = Number(batas);
  const batasSah = Number.isInteger(nBatas) && nBatas > 0;
  const lewatKapasitas = kapasitas !== null && batasSah && nBatas > kapasitas;
  // waktu menilai per hari dihitung dari batas beban dan lama masa (tidak diisi)
  const menitHarian = kapasitas !== null && batasSah ? menitPerHariDibutuhkan(nBatas, masa) : null;
  const idBatas = useId();
  const idLama = useId();
  const idWaktu = useId();
  const router = useRouter();
  const jalur = usePathname();
  const cari = useSearchParams();

  // Skenario navigator "Kekurangan reviewer (S-1)" membuka J-04b dengan ?susun=1: Susun ditekan otomatis sekali, lalu parameter dibuang
  // dari URL supaya Back, muat ulang, atau paginasi tidak menjalankan Susun lagi (navigasi tidak mengubah data).
  const sudahOtomatis = useRef(false);
  useEffect(() => {
    if (sudahOtomatis.current || !susunOtomatis || !ditutup) return;
    sudahOtomatis.current = true;
    form.current?.requestSubmit();
    const p = new URLSearchParams(cari.toString());
    p.delete("susun");
    router.replace(p.size ? `${jalur}?${p.toString()}` : jalur, { scroll: false });
  }, [susunOtomatis, ditutup, cari, jalur, router]);

  // usulan baru tersusun: tampilkan tab Usulan Penugasan halaman pertama tanpa filter lama
  const terakhir = useRef<HasilSusunAksi | null>(null);
  useEffect(() => {
    if (hasil === terakhir.current) return;
    terakhir.current = hasil;
    if (hasil.berhasil && hasil.jumlahUsulan) router.replace(`${jalur}?tab=usulan`, { scroll: false });
  }, [hasil, jalur, router]);

  function susunDengan(n: number) {
    setBatas(String(n));
    // isian terkendali: tunggu nilai baru terpasang sebelum formulir dikirim; fokus ke isian batas (panel S-1 akan hilang)
    requestAnimationFrame(() => {
      form.current?.querySelector<HTMLInputElement>("input[name=batas]")?.focus();
      form.current?.requestSubmit();
    });
  }

  const galatBatas = hasil.galat?.includes("Batas Beban") ? hasil.galat : undefined;
  const galatMasa = hasil.kolom === "masa" ? hasil.galat : undefined;
  const r = hasil.rincian;
  return (
    <section aria-label="Susun usulan penugasan" className="mt-6">
      <form
        ref={form}
        action={kirim}
        onSubmit={(e) => {
          if (adaUsulan && !sudahYakin.current) {
            e.preventDefault();
            setTanyaUlang(true);
            return;
          }
          sudahYakin.current = false;
        }}
        className="flex flex-wrap items-start gap-3"
      >
        <input type="hidden" name="periodeId" value={periodeId} />
        <Isian
          id={idBatas}
          label="Batas Beban per Reviewer"
          name="batas"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          autoComplete="off"
          value={batas}
          onChange={(e) => setBatas(e.target.value)}
          disabled={!ditutup}
          petunjuk="Jumlah proposal maksimal untuk satu reviewer."
          galat={galatBatas ?? (lewatKapasitas ? `Melebihi kapasitas satu reviewer (${kapasitas} proposal dalam ${masa.lamaHari} hari).` : undefined)}
          className="w-56"
        />
        <fieldset className="flex flex-wrap items-start gap-3" disabled={!ditutup || terkunci} aria-describedby="keterangan-masa">
          <legend className="sr-only">Masa penilaian</legend>
          <Isian
            id={idLama}
            label="Lama Penilaian (hari)"
            name="lamaHari"
            type="number"
            min={1}
            max={31}
            step={1}
            inputMode="numeric"
            autoComplete="off"
            value={lama}
            onChange={(e) => setLama(e.target.value)}
            galat={terkunci ? undefined : (galatMasaIsian ?? galatMasa)}
            className="w-44"
          />
        </fieldset>
        <div className="w-48">
          <span id={idWaktu} className="mb-1 block text-sm font-semibold text-primer-800">
            Waktu Menilai per Hari
          </span>
          <output
            htmlFor={`${idBatas} ${idLama}`}
            aria-labelledby={idWaktu}
            className={cn("angka flex h-10 items-center text-base font-semibold", lewatKapasitas ? "text-bata-700" : "text-primer-900")}
          >
            {menitHarian === null ? "-" : `±${formatDurasi(menitHarian)}`}
          </output>
          <p className="mt-1 text-xs text-teks-redup">per reviewer, paling lama {formatDurasi(masa.jamPerHari * 60)}</p>
        </div>
        <Button type="submit" varian={adaUsulan ? "sekunder" : "utama"} memuat={menyusun} disabled={!ditutup || perluDitugaskan === 0 || lewatKapasitas || !!galatMasaIsian} className="mt-6">
          Susun Usulan Penugasan
        </Button>
      </form>
      <p id="keterangan-masa" className="mt-2 max-w-3xl text-sm text-teks-redup">
        {terkunci && batasPenilaian ? (
          <>
            Masa penilaian sudah dimulai; tenggat <strong className="font-semibold text-primer-900">{formatTenggat(new Date(batasPenilaian))}</strong>. Masa tidak dapat diubah lagi.{" "}
          </>
        ) : (
          <>Masa penilaian dimulai saat penugasan ditetapkan dan berakhir pada akhir hari ke-{Number.isInteger(masa.lamaHari) ? masa.lamaHari : "-"}. </>
        )}
        {kapasitas !== null ? (
          <>
            Waktu menilai dihitung dari rata-rata ±{desimal.format(masa.menitPerProposal)} menit per proposal. Dengan waktu menilai paling lama{" "}
            {formatDurasi(masa.jamPerHari * 60)} per hari, kapasitas satu reviewer <strong className="angka font-semibold text-primer-900">{angka.format(kapasitas)}</strong> proposal
            dalam {masa.lamaHari} hari.
          </>
        ) : null}
      </p>

      <div aria-live="polite" className="empty:hidden">
        {menyusun ? (
          <p role="status" className="mt-2 flex items-center gap-2 text-sm font-semibold text-primer-800">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Menyusun usulan untuk {angka.format(perluDitugaskan)} proposal…
          </p>
        ) : null}
        {!menyusun && hasil.galat && !galatBatas && !galatMasa ? (
          <Alert jenis="galat" className="mt-3">
            {hasil.galat}
          </Alert>
        ) : null}
        {!menyusun && hasil.berhasil ? (
          <Alert jenis="sukses" className="mt-3">
            {hasil.jumlahUsulan
              ? `Usulan penugasan disusun untuk ${angka.format(hasil.jumlahUsulan)} proposal. Tinjau tabel di bawah, lalu tekan "Tetapkan Penugasan".`
              : "Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini."}
          </Alert>
        ) : null}
      </div>

      {!menyusun && hasil.kekurangan ? (
        <div id="panel-kekurangan" className="mt-3">
          <Alert jenis="peringatan" judul="Kekurangan Reviewer">
            <p>
              Usulan tidak disusun: <strong className="angka">{angka.format(hasil.kekurangan)}</strong> proposal tidak mendapat reviewer pada batas beban{" "}
              <span className="angka">{hasil.batasDipakai}</span>.
              {r ? (
                <>
                  {" "}
                  Sisa kapasitas {angka.format(r.jumlahReviewer)} reviewer bersedia hanya <span className="angka">{angka.format(r.kapasitas)}</span> proposal.
                </>
              ) : null}
            </p>
            {r?.hambatan.length ? (
              <>
                <p className="mt-2">Hambatannya institusi: proposal dari institusi berikut hanya dapat dinilai reviewer dari institusi lain.</p>
                <ul className="mt-1 list-disc pl-5">
                  {r.hambatan.map((h) => (
                    <li key={h.institusi}>
                      {h.institusi}: <span className="angka">{angka.format(h.jumlahProposal)}</span> proposal, <span className="angka">{angka.format(h.reviewerLayak)}</span> reviewer memenuhi syarat
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              {r?.batasCukup && kapasitas !== null && r.batasCukup > kapasitas ? (
                <span>
                  Batas terkecil yang cukup ({angka.format(r.batasCukup)}) melebihi kapasitas satu reviewer dalam masa penilaian ({angka.format(kapasitas)}); reviewer perlu
                  ditambah, atau masa penilaian diperpanjang.
                </span>
              ) : r?.batasCukup ? (
                <>
                  <span>
                    Batas beban terkecil yang cukup: <strong className="angka">{r.batasCukup}</strong>.
                  </span>
                  <Button ukuran="sm" varian="sekunder" onClick={() => susunDengan(r.batasCukup!)}>
                    Susun dengan batas {r.batasCukup}
                  </Button>
                </>
              ) : (
                <span>Berapa pun batasnya tidak cukup; reviewer dari institusi lain perlu ditambah.</span>
              )}
            </div>
            <p className="mt-2">Atau tambahkan reviewer di BIMA (di luar sistem ini). Usulan dan batas beban sebelumnya tidak berubah.</p>
          </Alert>
        </div>
      ) : null}
      <ModalKonfirmasi
        buka={tanyaUlang}
        saatUbah={setTanyaUlang}
        judul={`Susun ulang ${angka.format(jumlahUsulan)} usulan?`}
        labelKonfirmasi="Susun Ulang"
        saatKonfirmasi={() => {
          setTanyaUlang(false);
          sudahYakin.current = true;
          form.current?.requestSubmit();
        }}
      >
        <p>Usulan yang ada, termasuk pemindahan manual, akan diganti susunan baru dengan batas beban {batas || "-"}. Penugasan yang sudah ditetapkan tidak berubah.</p>
      </ModalKonfirmasi>
    </section>
  );
}
