"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, Bagian, Button, Isian, Modal, ModalKonfirmasi, Pilihan, Table, TBody, TD, TH, THead, TR, beriTahu, kelasTombol } from "@/components/ui";
import type { BarisUsulanPenugasan } from "@/lib/kontrak/tipe";
import { aksiPindah, aksiSusun, aksiTetapkan } from "../aksi";
import type { HasilSusunAksi, HasilTetapkanAksi } from "../tipe";

export interface KandidatUi {
  id: string;
  nama: string;
  institusi: string;
  beban: number;
}

const angka = new Intl.NumberFormat("id-ID");
const desimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const detik = (ms?: number) => (ms === undefined ? "" : ` Waktu proses di server: ${desimal.format(ms / 1000)} detik.`);

interface TargetPindah {
  penugasanId: string;
  judul: string;
  reviewerId: string;
  namaReviewer: string;
}

/**
 * Bagian interaktif J-04b: isian "Batas Beban per Reviewer" + "Susun Usulan Penugasan", panel S-1 "Kekurangan Reviewer",
 * tabel "Usulan Penugasan" dengan "Pindahkan" (M-06), dan "Tetapkan Penugasan" (M-07).
 * Penomoran halaman datang sebagai slot `paginasi` dari server.
 */
export function PapanUsulan({
  periodeId,
  batasAwal,
  ditutup,
  susunOtomatis,
  usulan,
  totalUsulan,
  jumlahReviewerUsulan,
  perluDitugaskan,
  kandidat,
  paginasi,
}: {
  periodeId: string;
  batasAwal: number;
  ditutup: boolean;
  susunOtomatis: boolean;
  usulan: BarisUsulanPenugasan[];
  totalUsulan: number;
  jumlahReviewerUsulan: number;
  perluDitugaskan: number;
  kandidat: KandidatUi[];
  paginasi: React.ReactNode;
}) {
  const [hasilSusun, aksiSusunForm, sedangMenyusun] = useActionState<HasilSusunAksi, FormData>(aksiSusun, {});
  const formSusun = useRef<HTMLFormElement>(null);
  const sudahOtomatis = useRef(false);
  const router = useRouter();
  const jalur = usePathname();
  const cari = useSearchParams();
  // Skenario navigator "Kekurangan reviewer (S-1)" membuka J-04b dengan ?susun=1: Susun Usulan Penugasan ditekan otomatis sekali.
  useEffect(() => {
    if (sudahOtomatis.current || !susunOtomatis || !ditutup) return;
    sudahOtomatis.current = true;
    formSusun.current?.requestSubmit();
    // parameter aksi dibuang dari URL: Back, muat ulang, atau paginasi tidak boleh menjalankan Susun lagi (navigasi tidak mengubah data)
    const p = new URLSearchParams(cari.toString());
    p.delete("susun");
    router.replace(p.size ? `${jalur}?${p.toString()}` : jalur, { scroll: false });
  }, [susunOtomatis, ditutup, cari, jalur, router]);
  const [batas, setBatas] = useState(String(batasAwal));

  const [sibuk, mulai] = useTransition();
  const [pindah, setPindah] = useState<TargetPindah | null>(null);
  const [pengganti, setPengganti] = useState("");
  const [galatPindah, setGalatPindah] = useState<{ pilihan?: string; syarat: string[] }>({ syarat: [] });

  const [tetapBuka, setTetapBuka] = useState(false);
  const [hasilTetapkan, setHasilTetapkan] = useState<HasilTetapkanAksi | null>(null);

  function bukaPindah(u: BarisUsulanPenugasan) {
    setPindah({ penugasanId: u.penugasanId, judul: u.judulProposal, reviewerId: u.reviewerId, namaReviewer: u.namaReviewer });
    setPengganti("");
    setGalatPindah({ syarat: [] });
  }

  function simpanPemindahan(e: React.FormEvent) {
    e.preventDefault();
    if (!pindah) return;
    if (!pengganti) {
      setGalatPindah({ pilihan: "Pilih Reviewer Pengganti terlebih dahulu.", syarat: [] });
      return;
    }
    mulai(async () => {
      const h = await aksiPindah(pindah.penugasanId, pengganti);
      // setter sesudah await dibungkus startTransition supaya ter-commit bersama data segar (revalidatePath)
      startTransition(() => {
        if (h.diterima) {
          const nama = kandidat.find((k) => k.id === pengganti)?.nama ?? "reviewer pengganti";
          setPindah(null);
          beriTahu.sukses(`Proposal dipindahkan ke ${nama}.`);
        } else {
          setGalatPindah({ syarat: h.galat ? [h.galat] : h.syaratDilanggar });
        }
      });
    });
  }

  function tetapkan() {
    mulai(async () => {
      const h = await aksiTetapkan(periodeId);
      startTransition(() => {
        setHasilTetapkan(h);
        if (h.berhasil) {
          setTetapBuka(false);
          beriTahu.sukses(`Penugasan ditetapkan untuk ${angka.format(h.jumlah ?? 0)} proposal.`);
        }
      });
    });
  }

  const adaUsulan = totalUsulan > 0;
  const kandidatPindah = pindah ? kandidat.filter((k) => k.id !== pindah.reviewerId) : [];
  const galatBatas = hasilSusun.galat?.includes("Batas Beban") ? hasilSusun.galat : undefined;

  return (
    <>
      <Bagian>
        <form ref={formSusun} action={aksiSusunForm} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="periodeId" value={periodeId} />
          <Isian
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
            galat={galatBatas}
            className="w-64"
          />
          <Button type="submit" varian={adaUsulan ? "sekunder" : "utama"} memuat={sedangMenyusun} disabled={!ditutup} className="mb-[1.375rem]">
            Susun Usulan Penugasan
          </Button>
        </form>
        <div aria-live="polite">
          {sedangMenyusun ? (
            <p role="status" className="mt-2 flex items-center gap-2 text-sm font-semibold text-primer-800">
              <Loader2 aria-hidden className="size-4 animate-spin" /> Menyusun usulan penugasan… Untuk ribuan proposal ini memakan beberapa detik.
            </p>
          ) : null}
          {hasilSusun.galat && !galatBatas ? (
            <Alert jenis="galat" className="mt-3">
              {hasilSusun.galat}
            </Alert>
          ) : null}
          {hasilSusun.berhasil && !hasilSusun.kekurangan && !hasilTetapkan?.berhasil ? (
            <Alert jenis="sukses" className="mt-3">
              {hasilSusun.jumlahUsulan
                ? `Usulan penugasan disusun untuk ${angka.format(hasilSusun.jumlahUsulan)} proposal. Tinjau tabel di bawah, lalu tetapkan.${detik(hasilSusun.durasiMs)}`
                : "Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini."}
            </Alert>
          ) : null}
        </div>
      </Bagian>

      {hasilSusun.kekurangan ? (
        <Bagian id="panel-kekurangan" judul="Kekurangan Reviewer">
          <Alert jenis="peringatan">
            <p>
              Reviewer yang bersedia tidak cukup untuk batas beban {hasilSusun.batasDipakai ?? batas}. Sebanyak <strong>{angka.format(hasilSusun.kekurangan)}</strong> proposal terkirim belum dapat
              ditugaskan, sehingga usulan tidak disusun.{detik(hasilSusun.durasiMs)}
            </p>
            <p className="mt-1">
              Ubah &ldquo;Batas Beban per Reviewer&rdquo; lalu tekan &ldquo;Susun Usulan Penugasan&rdquo; lagi, atau tambahkan reviewer di BIMA (di luar sistem ini).
            </p>
          </Alert>
        </Bagian>
      ) : null}

      {hasilTetapkan?.berhasil ? (
        <Alert jenis="sukses" className="mt-6">
          <p>
            Penugasan telah ditetapkan dan tercatat di BIMA ({angka.format(hasilTetapkan.jumlah ?? 0)} proposal). Reviewer menerimanya dengan tanda &ldquo;Baru&rdquo; di J-07.
            {detik(hasilTetapkan.durasiMs)}
          </p>
          <p className="mt-2 flex flex-wrap gap-2">
            <Link href={`/tim-kerja/pemantauan?periode=${periodeId}`} className={kelasTombol("sekunder", "sm")}>
              Buka Pemantauan Kesesuaian
            </Link>
            <Link href="/bima/kotak-masuk" className={kelasTombol("hantu", "sm")}>
              Lihat di Kotak Masuk BIMA (simulasi)
            </Link>
          </p>
        </Alert>
      ) : null}

      <Bagian
        judul="Usulan Penugasan"
        aksi={
          <Button onClick={() => { setHasilTetapkan(null); setTetapBuka(true); }} disabled={!adaUsulan || sibuk}>
            Tetapkan Penugasan
          </Button>
        }
      >
        <p data-testid="ringkasan-usulan" className="mb-3 text-sm text-teks-redup">
          {adaUsulan ? (
            <>
              <strong className="angka">{angka.format(totalUsulan)}</strong> usulan menunggu penetapan.{" "}
            </>
          ) : null}
          {perluDitugaskan > 0 ? <span className="angka">{angka.format(perluDitugaskan)}</span> : null}
          {perluDitugaskan > 0 ? " proposal Terkirim belum punya penugasan tetap." : null}
          {!adaUsulan && perluDitugaskan === 0 ? "Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini." : null}
        </p>
        {adaUsulan ? (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Judul Proposal</TH>
                  <TH>Skema</TH>
                  <TH>Institusi Pengusul</TH>
                  <TH>Reviewer</TH>
                  <TH>Institusi Reviewer</TH>
                  <TH>
                    <span className="sr-only">Aksi</span>
                  </TH>
                </TR>
              </THead>
              <TBody>
                {usulan.map((u) => (
                  <TR key={u.penugasanId}>
                    <TD className="min-w-56 max-w-sm">
                      <Link href={`/tim-kerja/proposal/${u.proposalId}`} className="text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2">
                        {u.judulProposal}
                      </Link>
                    </TD>
                    <TD>{u.skema}</TD>
                    <TD>{u.institusiPengusul}</TD>
                    <TD>{u.namaReviewer}</TD>
                    <TD>{u.institusiReviewer}</TD>
                    <TD className="text-right">
                      <Button ukuran="sm" varian="sekunder" onClick={() => bukaPindah(u)} aria-label={`Pindahkan ${u.judulProposal}`}>
                        Pindahkan
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {paginasi}
          </>
        ) : perluDitugaskan > 0 ? (
          <p className="text-sm text-teks-redup">Belum ada usulan penugasan. Isi batas beban lalu tekan &ldquo;Susun Usulan Penugasan&rdquo;.</p>
        ) : null}
      </Bagian>

      <Modal
        buka={pindah !== null}
        saatUbah={(b) => !b && setPindah(null)}
        kode="M-06"
        judul="Pindahkan Proposal"
        deskripsi={pindah ? `${pindah.judul} (sekarang: ${pindah.namaReviewer})` : undefined}
        kaki={
          <>
            <Button varian="sekunder" onClick={() => setPindah(null)} disabled={sibuk}>
              Batal
            </Button>
            <Button type="submit" form="form-pindah" memuat={sibuk}>
              Simpan Pemindahan
            </Button>
          </>
        }
      >
        <form id="form-pindah" onSubmit={simpanPemindahan} noValidate>
          <Pilihan
            label="Reviewer Pengganti"
            value={pengganti}
            onChange={(e) => {
              setPengganti(e.target.value);
              setGalatPindah({ syarat: [] });
            }}
            galat={galatPindah.pilihan}
            wajib
          >
            <option value="">Pilih reviewer</option>
            {kandidatPindah.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} ({k.institusi}), beban {k.beban}
              </option>
            ))}
          </Pilihan>
        </form>
        {galatPindah.syarat.length ? (
          <div role="alert" className="mt-3 rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 text-bata-700">
            <p className="font-semibold">Pemindahan ditolak, reviewer semula tetap dipakai.</p>
            <ul className="mt-1 list-disc pl-5">
              {galatPindah.syarat.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>

      <ModalKonfirmasi
        buka={tetapBuka}
        saatUbah={setTetapBuka}
        kode="M-07"
        judul="Konfirmasi Tetapkan Penugasan"
        labelKonfirmasi={hasilTetapkan?.gagalBima ? "Kirim ulang" : "Tetapkan Penugasan"}
        memuat={sibuk}
        saatKonfirmasi={tetapkan}
        galat={hasilTetapkan && !hasilTetapkan.berhasil ? `${hasilTetapkan.galat ?? "Penugasan gagal ditetapkan."}${hasilTetapkan.gagalBima ? ' Usulan tetap berstatus Diusulkan; tekan "Kirim ulang" untuk mencoba lagi.' : ""}` : null}
      >
        <p>
          <strong className="angka">{angka.format(totalUsulan)}</strong> proposal akan ditugaskan kepada <strong className="angka">{angka.format(jumlahReviewerUsulan)}</strong> reviewer.
        </p>
        <p className="mt-2 text-teks-redup">Penugasan dikirim ke BIMA. Sesudah ditetapkan, usulan tidak dapat dipindahkan lagi.</p>
      </ModalKonfirmasi>
    </>
  );
}
