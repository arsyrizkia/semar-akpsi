"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, ChevronRight, FileText, Loader2, Lock, XCircle } from "lucide-react";
import { Alert, Button, KepalaHalaman, StatusBadge, TombolUnduh, beriTahu, kelasTombol } from "@/components/ui";
import { TinjauanNaskah } from "@/components/penilaian/tinjauan-naskah";
import type { ButirTampil, DataPemeriksaan, KoreksiTampil } from "@/lib/penilaian/tipe";
import { ringkasRekomendasi } from "@/lib/penilaian/status";
import { aksiJalankanUlangSemantik } from "./actions";
import { ModalKoreksi } from "./modal-koreksi";

const MAKS_POLLING = 40;

/** Potong teks panjang untuk notifikasi (deskripsi butir menggantikan kode butir). */
const potong = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

const ukuranBerkas = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function PemeriksaanKlien({ data, tabAwal, butirAwal }: { data: DataPemeriksaan; tabAwal?: string; butirAwal?: string }) {
  const router = useRouter();
  const [koreksiLokal, setKoreksiLokal] = useState<Record<string, KoreksiTampil>>({});
  const [butirKoreksi, setButirKoreksi] = useState<string | null>(null); // M-10 terbuka untuk butir ini
  const final = data.penilaian.status === "Final";
  const naskah = data.berkas.find((f) => f.peran === "naskah") ?? data.berkas[0] ?? null;
  const lampiran = data.berkas.filter((f) => f !== naskah);
  const unduhBerkas = (id: string) => `/api/semar/proposal/${encodeURIComponent(data.proposal.idProposal)}/berkas/${id}`;

  const butir: ButirTampil[] = useMemo(() => data.butir.map((b) => ({ ...b, koreksi: koreksiLokal[b.hasilId] ?? b.koreksi })), [data.butir, koreksiLokal]);
  const butirDimodal = butir.find((b) => b.hasilId === butirKoreksi) ?? null;
  // M-10 tetap terpasang sesudah ditutup (supaya fokus dapat kembali ke tombol pemicu); `nomorBuka` memberi isian segar tiap dibuka
  const [terakhir, setTerakhir] = useState<{ id: string; nomor: number } | null>(null);
  const butirModalTerakhir = terakhir ? (butir.find((b) => b.hasilId === terakhir.id) ?? null) : null;
  const bukaKoreksi = (id: string) => {
    setTerakhir((t) => ({ id, nomor: (t?.nomor ?? 0) + 1 }));
    setButirKoreksi(id);
  };
  const ringkas = ringkasRekomendasi(butir.map((b) => ({ status: b.status, dikoreksi: b.koreksi !== null })));

  // Rekomendasi belum tersedia: perbarui halaman berkala (tanpa memanggil LLM dari halaman ini)
  const [kali, setKali] = useState(0);
  useEffect(() => {
    if (data.semantik.siap || kali >= MAKS_POLLING) return;
    const t = setTimeout(() => {
      setKali((k) => k + 1);
      router.refresh();
    }, 4000);
    return () => clearTimeout(t);
  }, [data.semantik.siap, kali, router]);

  // Jalankan ulang pemeriksaan semantik (job Gagal atau macet); penghitung muat ulang mulai dari nol bila berhasil
  const [sibukUlang, mulaiUlang] = useTransition();
  const [galatUlang, setGalatUlang] = useState<string | null>(null);
  function jalankanUlang() {
    setGalatUlang(null);
    mulaiUlang(async () => {
      const r = await aksiJalankanUlangSemantik(data.penugasanId);
      if (r.ok) {
        setKali(0);
        router.refresh();
      } else setGalatUlang(r.galat);
    });
  }
  const tombolUlang = final ? null : (
    <div className="mt-2">
      <Button varian="sekunder" ukuran="sm" memuat={sibukUlang} onClick={jalankanUlang}>
        Jalankan Ulang Pemeriksaan Semantik
      </Button>
      {galatUlang ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-bata-700">
          {galatUlang}
        </p>
      ) : null}
    </div>
  );

  const lanjut = (
    <Link href={`/reviewer/pemeriksaan/${data.penugasanId}/keputusan`} className={kelasTombol("utama", "md")}>
      {final ? "Lihat Keputusan" : "Lanjut ke Keputusan"}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  );

  return (
    <>
      <KepalaHalaman
        kode="J-08"
        judul="Pemeriksaan Proposal"
        keterangan={data.proposal.judul}
        remah={[{ label: "Daftar Penugasan", href: "/reviewer/penugasan" }, { label: "Pemeriksaan Proposal" }]}
        aksi={
          <>
            <Link href="/reviewer/penugasan" className={kelasTombol("hantu", "md")}>
              Kembali ke Daftar Penugasan
            </Link>
            {lanjut}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-teks-redup">
        <span className="font-mono text-xs">{data.proposal.idProposal}</span>
        <span>{data.proposal.skema}</span>
        <span>Versi {data.proposal.kodeVersi}</span>
        <StatusBadge status={final ? "Selesai" : data.label} />
        {data.tenggat ? (
          <span className={data.tenggat.lewat && !final ? "inline-flex items-center gap-1.5 font-semibold text-bata-700" : "inline-flex items-center gap-1.5"} title={data.tenggat.teks}>
            <CalendarClock aria-hidden className="size-4" />
            Tenggat {data.tenggat.teks} ({data.tenggat.sisa})
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          {data.deterministik.total > 0 && data.deterministik.gagal === 0 ? <CheckCircle2 aria-hidden className="size-4 text-daun-600" /> : <XCircle aria-hidden className="size-4 text-bata-600" />}
          {data.deterministik.total === 0
            ? "Belum ada hasil pemeriksaan butir deterministik"
            : data.deterministik.gagal === 0
              ? `Semua ${data.deterministik.total} butir deterministik lolos`
              : `${data.deterministik.lolos} dari ${data.deterministik.total} butir deterministik lolos, ${data.deterministik.gagal} gagal`}
        </span>
      </div>

      {naskah ? (
        <section aria-labelledby="judul-berkas" className="mb-4 rounded-md border border-primer-200 bg-white text-sm">
          <h2 id="judul-berkas" className="sr-only">Berkas Proposal</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
            <FileText aria-hidden className="size-4 shrink-0 text-teks-redup" />
            <span className="min-w-0 break-words">
              <span className="font-medium text-primer-900">{naskah.nama}</span>
              <span className="ml-2 text-xs text-teks-redup">
                {naskah.peran === "naskah" ? "Naskah" : "Berkas"} · {ukuranBerkas(naskah.ukuran)}
              </span>
            </span>
            <TombolUnduh href={unduhBerkas(naskah.id)} ukuran="sm" className="ml-auto">
              Unduh Berkas<span className="sr-only"> {naskah.nama}</span>
            </TombolUnduh>
          </div>
          {lampiran.length > 0 ? (
            <details className="group border-t border-primer-100">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teks-redup hover:text-primer-900 [&::-webkit-details-marker]:hidden">
                <ChevronRight aria-hidden className="size-4 transition-transform duration-150 group-open:rotate-90" />
                Lampiran ({lampiran.length})
              </summary>
              <ul className="divide-y divide-primer-100 border-t border-primer-100">
                {lampiran.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="min-w-0 break-words">
                      <span className="font-medium text-primer-900">{f.nama}</span>
                      <span className="ml-2 text-xs text-teks-redup">
                        {f.namaLampiran ? `Lampiran: ${f.namaLampiran}` : "Lampiran"} · {ukuranBerkas(f.ukuran)}
                      </span>
                    </span>
                    <TombolUnduh href={unduhBerkas(f.id)} ukuran="sm">
                      Unduh Berkas<span className="sr-only"> {f.nama}</span>
                    </TombolUnduh>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      {!data.semantik.siap ? (
        <Alert jenis="info" className="mb-6" judul="Rekomendasi sedang disiapkan">
          <span className="inline-flex items-center gap-2">
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {kali >= MAKS_POLLING ? "Pemeriksaan semantik belum selesai. Muat ulang halaman beberapa saat lagi." : "Halaman diperbarui otomatis begitu rekomendasi tersedia."}
          </span>
          {kali >= MAKS_POLLING ? tombolUlang : null}
        </Alert>
      ) : null}
      {data.semantik.status === "Gagal" ? (
        <Alert jenis="peringatan" className="mb-6" judul="Pemeriksaan semantik gagal dijalankan">
          Butir semantik belum memiliki rekomendasi. Anda tetap dapat memeriksa teks secara manual.
          {tombolUlang}
        </Alert>
      ) : null}
      {final ? (
        <p className="mb-6 flex items-center gap-2 text-sm font-semibold text-teks-redup">
          <Lock aria-hidden className="size-4" /> Penilaian final: koreksi tidak dapat diubah lagi.
        </p>
      ) : null}

      <TinjauanNaskah
        tab={data.tab}
        butir={butir}
        alamatGambar={`/api/semar/proposal/${encodeURIComponent(data.proposal.idProposal)}/gambar`}
        tabAwal={tabAwal}
        butirAwal={butirAwal}
        menunggu={!data.semantik.siap}
        ringkasPanel={
          <span className="text-xs text-teks-redup angka">
            {ringkas.total} butir, {ringkas.dikoreksi} dikoreksi
          </span>
        }
        aksiButir={
          final
            ? undefined
            : (b) => (
                <Button varian="sekunder" ukuran="sm" onClick={() => bukaKoreksi(b.hasilId)} aria-haspopup="dialog">
                  {b.koreksi ? "Ubah Koreksi" : "Tidak Setuju"}
                </Button>
              )
        }
        catatanPanel={
          <p>
            Butir yang tidak Anda koreksi dianggap disetujui. <span className="angka">{ringkas.disetujui}</span> disetujui, <span className="angka">{ringkas.dikoreksi}</span> dikoreksi
            {ringkas.tanpaRekomendasi ? (
              <>
                , <span className="angka">{ringkas.tanpaRekomendasi}</span> perlu dibaca sendiri
              </>
            ) : null}
            .
          </p>
        }
      />

      {butirModalTerakhir ? (
        <ModalKoreksi
          key={`${butirModalTerakhir.hasilId}-${terakhir?.nomor ?? 0}`}
          buka={butirDimodal !== null}
          penugasanId={data.penugasanId}
          butir={butirModalTerakhir}
          saatTutup={() => setButirKoreksi(null)}
          saatTersimpan={(id, k) => {
            setKoreksiLokal((s) => ({ ...s, [id]: k }));
            setButirKoreksi(null);
            beriTahu.sukses(`Koreksi tersimpan: “${potong(butirModalTerakhir.deskripsi, 70)}”`);
          }}
        />
      ) : null}
    </>
  );
}
