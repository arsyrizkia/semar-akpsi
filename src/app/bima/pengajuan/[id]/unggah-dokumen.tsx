"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronRight, Circle, FileUp, Loader2, ShieldCheck, Upload } from "lucide-react";
import { LambangSemar } from "@/components/merek";
import { Button, Modal } from "@/components/ui";
import type { HasilPraPeriksa } from "@/lib/pengajuan/pra-periksa";

const BATAS_BYTE = 4 * 1024 * 1024;
const TAHAP_PERIKSA = ["Mengunggah dokumen ke SEMAR", "Membaca isi dokumen PDF", "Mengenali bagian Isian Substansi", "Memeriksa ketentuan templat dan aturan"];

type Keadaan =
  | { tahap: "pilih"; galat?: string }
  | { tahap: "memeriksa"; berkas: File; ke: number }
  | { tahap: "hasil"; berkas: File; hasil: HasilPraPeriksa; tiket: string | null; galat?: string }
  | { tahap: "menyimpan"; berkas: File; hasil: HasilPraPeriksa; tiket: string };

/**
 * Tombol "Unggah Dokumen Usulan" di langkah Substansi Usulan BIMA tiruan, yang membuka M-16 Pemeriksaan SEMAR. Dokumen diunggah ke
 * SEMAR (/api/semar/pra-periksa) dan diperiksa per ketentuan deterministik. Hanya dokumen yang lolos semua ketentuan yang dapat
 * disimpan ke BIMA ("Simpan ke BIMA" membawa tiket lolos dari SEMAR); dokumen yang belum lolos tidak tersimpan dan usulan belum dapat
 * dikirim. Modal memakai komponen dan gaya SEMAR karena ini layar SEMAR di dalam BIMA.
 */
export function UnggahDokumen({ idProposal, token, adaDokumen }: { idProposal: string; token: string; adaDokumen: boolean }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [k, setK] = useState<Keadaan>({ tahap: "pilih" });
  const isian = useRef<HTMLInputElement>(null);
  const sibuk = k.tahap === "memeriksa" || k.tahap === "menyimpan";

  // tahapan pemeriksaan maju bertahap selama menunggu jawaban SEMAR (tahap terakhir menunggu hasil)
  const memeriksa = k.tahap === "memeriksa";
  useEffect(() => {
    if (!memeriksa) return;
    const t = setInterval(() => setK((s) => (s.tahap === "memeriksa" && s.ke < TAHAP_PERIKSA.length - 1 ? { ...s, ke: s.ke + 1 } : s)), 700);
    return () => clearInterval(t);
  }, [memeriksa]);

  async function periksa(berkas: File) {
    if (!/\.pdf$/i.test(berkas.name) && berkas.type !== "application/pdf") return setK({ tahap: "pilih", galat: "Dokumen usulan harus berformat PDF." });
    if (berkas.size > BATAS_BYTE) return setK({ tahap: "pilih", galat: "Ukuran dokumen melebihi 4 MB." });
    setK({ tahap: "memeriksa", berkas, ke: 0 });
    const fd = new FormData();
    fd.set("token", token);
    fd.set("berkas", berkas);
    try {
      const res = await fetch("/api/semar/pra-periksa", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { hasil?: HasilPraPeriksa; tiket?: string | null; galat?: string };
      if (!res.ok || !data.hasil) return setK({ tahap: "pilih", galat: data.galat ?? "Pemeriksaan gagal. Coba lagi." });
      setK({ tahap: "hasil", berkas, hasil: data.hasil, tiket: data.tiket ?? null });
    } catch {
      setK({ tahap: "pilih", galat: "Tidak dapat terhubung ke SEMAR. Periksa sambungan lalu coba lagi." });
    }
  }

  async function simpan() {
    if (k.tahap !== "hasil" || !k.tiket) return;
    const { berkas, hasil, tiket } = k;
    setK({ tahap: "menyimpan", berkas, hasil, tiket });
    const fd = new FormData();
    fd.set("berkas", berkas);
    fd.set("tiket", tiket);
    try {
      const res = await fetch(`/bima/pengajuan/${encodeURIComponent(idProposal)}/naskah`, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; galat?: string };
      if (!res.ok || !data.ok) return setK({ tahap: "hasil", berkas, hasil, tiket, galat: data.galat ?? "Dokumen gagal disimpan ke BIMA." });
      setBuka(false);
      setK({ tahap: "pilih" });
      router.refresh();
    } catch {
      setK({ tahap: "hasil", berkas, hasil, tiket, galat: "Dokumen gagal disimpan ke BIMA. Coba lagi." });
    }
  }

  const pilihUlang = () => {
    setK({ tahap: "pilih" });
    requestAnimationFrame(() => isian.current?.click());
  };

  const gagal = k.tahap === "hasil" || k.tahap === "menyimpan" ? k.hasil.baris.filter((b) => b.status === "Gagal") : [];
  const lolos = k.tahap === "hasil" || k.tahap === "menyimpan" ? k.hasil.baris.filter((b) => b.status === "Lolos") : [];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setK({ tahap: "pilih" });
          setBuka(true);
        }}
        aria-haspopup="dialog"
        className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#3651b0] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2b4294] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3651b0]"
      >
        <Upload aria-hidden className="size-4" />
        {adaDokumen ? "Ganti Dokumen Usulan" : "Unggah Dokumen Usulan"}
      </button>

      <Modal
        buka={buka}
        saatUbah={(b) => !sibuk && setBuka(b)}
        kode="M-16"
        judul="Pemeriksaan Dokumen Usulan"
        deskripsi="SEMAR memeriksa dokumen sebelum tersimpan di BIMA. Hanya dokumen yang lolos yang dapat disimpan dan dikirim."
        ukuran="lg"
        kaki={
          k.tahap === "hasil" || k.tahap === "menyimpan" ? (
            k.hasil.lolos ? (
              <>
                <Button varian="sekunder" onClick={pilihUlang} disabled={k.tahap === "menyimpan"}>
                  Pilih Dokumen Lain
                </Button>
                <Button onClick={simpan} memuat={k.tahap === "menyimpan"}>
                  Simpan ke BIMA
                </Button>
              </>
            ) : (
              <>
                <Button varian="sekunder" onClick={() => setBuka(false)}>
                  Tutup
                </Button>
                <Button onClick={pilihUlang}>Unggah Ulang</Button>
              </>
            )
          ) : null
        }
      >
        <p className="mb-4 flex items-center gap-2 text-xs font-medium text-teks-redup">
          <LambangSemar className="size-6" judul="SEMAR" />
          SEMAR · Sistem Evaluasi Mandiri dan Asisten Reviewer
        </p>

        {k.tahap === "pilih" ? (
          <div>
            <label
              htmlFor="berkas-usulan"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primer-300 bg-primer-50/40 px-6 py-10 text-center transition-colors hover:border-primer-500 hover:bg-primer-50"
            >
              <FileUp aria-hidden className="size-8 text-primer-600" />
              <span className="text-base font-semibold text-primer-800">Pilih dokumen usulan (PDF)</span>
              <span className="text-xs text-teks-redup">Isian Substansi sesuai templat skema, maksimal 4 MB</span>
            </label>
            <input
              ref={isian}
              id="berkas-usulan"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void periksa(f);
              }}
            />
            {k.galat ? (
              <p role="alert" className="mt-3 rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 text-sm font-medium text-bata-700">
                {k.galat}
              </p>
            ) : null}
          </div>
        ) : null}

        {k.tahap === "memeriksa" ? (
          <div aria-live="polite">
            <p className="mb-4 break-all text-sm text-primer-900">
              <span className="font-semibold">{k.berkas.name}</span>
            </p>
            <ol className="space-y-2.5">
              {TAHAP_PERIKSA.map((t, i) => (
                <li key={t} className={`flex items-center gap-2.5 text-sm ${i <= k.ke ? "text-primer-900" : "text-teks-redup"}`}>
                  {i < k.ke ? (
                    <CheckCircle2 aria-hidden className="size-5 text-daun-600" />
                  ) : i === k.ke ? (
                    <Loader2 aria-hidden className="size-5 animate-spin text-primer-600 motion-reduce:animate-none" />
                  ) : (
                    <Circle aria-hidden className="size-5" />
                  )}
                  {t}
                  {i === k.ke ? "…" : ""}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {k.tahap === "hasil" || k.tahap === "menyimpan" ? (
          <div aria-live="polite">
            <div className={`flex items-start gap-3 rounded-lg px-4 py-3 ${k.hasil.lolos ? "bg-daun-100 text-daun-700" : "bg-peringatan-100 text-primer-900"}`}>
              {k.hasil.lolos ? <ShieldCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-daun-700" /> : <AlertTriangle aria-hidden className="mt-0.5 size-6 shrink-0 text-peringatan-700" />}
              <div>
                <p className="text-base font-semibold">{k.hasil.lolos ? "Lolos semua pemeriksaan" : "Belum lolos pemeriksaan"}</p>
                <p className="mt-0.5 text-sm">
                  {k.hasil.lolos
                    ? `${k.hasil.jumlahButir} dari ${k.hasil.jumlahButir} ketentuan terpenuhi. Dokumen dapat disimpan ke BIMA, lalu usulan dapat dikirim.`
                    : `${k.hasil.jumlahGagal} dari ${k.hasil.jumlahButir} ketentuan belum terpenuhi. Perbaiki dokumen lalu unggah ulang; dokumen ini tidak disimpan ke BIMA.`}
                </p>
                <p className="mt-1 text-xs opacity-80">
                  {k.berkas.name} · {k.hasil.bagianDikenali} dari {k.hasil.bagianTemplat} bagian Isian Substansi dikenali
                </p>
              </div>
            </div>

            {gagal.length ? (
              <ul className="mt-4 divide-y divide-primer-100 rounded-md border border-primer-200">
                {gagal.map((b) => (
                  <li key={b.kode} className="px-4 py-3">
                    <p className="flex items-start gap-2 font-medium text-primer-900">
                      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-bata-600" />
                      {b.deskripsi}
                    </p>
                    <p className="ml-6 mt-1 text-sm text-teks-redup">
                      {b.bagian ? `${b.bagian}: ` : ""}
                      {b.angkaPembukti}
                    </p>
                    {b.batasDilanggar ? <p className="ml-6 mt-0.5 text-sm font-medium text-bata-700">{b.batasDilanggar}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {lolos.length ? (
              <details className="group mt-4 rounded-md border border-primer-200">
                <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primer-800 [&::-webkit-details-marker]:hidden">
                  <ChevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90 motion-reduce:transition-none" />
                  Ketentuan yang terpenuhi ({lolos.length})
                </summary>
                <ul className="divide-y divide-primer-100 border-t border-primer-100">
                  {lolos.map((b) => (
                    <li key={b.kode} className="flex items-start gap-2 px-4 py-2 text-sm">
                      <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-daun-600" />
                      <span>
                        <span className="text-primer-900">{b.deskripsi}</span>
                        <span className="block text-xs text-teks-redup">{b.angkaPembukti}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {k.tahap === "hasil" && k.galat ? (
              <p role="alert" className="mt-3 rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 text-sm font-medium text-bata-700">
                {k.galat}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
