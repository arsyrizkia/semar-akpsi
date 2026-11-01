import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { wajibPengusulBima } from "@/lib/bima/sesi";
import { daftarSkemaBima, daftarUsulanPengusul, hasilPenilaianUsulan } from "@/lib/bima/servis-pengajuan";
import { ambilPengaturanDemo } from "@/lib/waktu";
import { LencanaStatusBima } from "./lencana-status";
import { SakelarMasaBima } from "./sakelar-masa";

export const metadata: Metadata = { title: "Daftar Usulan" };
export const dynamic = "force-dynamic";

const PUNYA_HASIL = new Set(["Diajukan ke SEMAR", "Terkirim", "Ditahan", "Ditolak"]);

/**
 * Daftar Usulan di BIMA tiruan (UC-05 langkah 1): usulan pengusul pada periode berjalan. "Lanjutkan Usulan" membuka wizard lima langkah
 * (Identitas, Substansi, RAB, Dokumen Pendukung, Konfirmasi). Sesudah "Kirim Usulan", pengusul kembali ke sini dengan pesan terkirim.
 * Alamat lama ?proposal=ID diteruskan ke wizard.
 */
export default async function DaftarUsulan({ searchParams }: { searchParams: Promise<{ proposal?: string; galat?: string; terkirim?: string; tersimpan?: string }> }) {
  const akun = await wajibPengusulBima();
  const q = await searchParams;
  if (q.proposal) redirect(`/bima/pengajuan/${encodeURIComponent(q.proposal)}?langkah=substansi`);
  const [usulan, skema, pengaturan] = await Promise.all([daftarUsulanPengusul(akun.idBima), daftarSkemaBima(), ambilPengaturanDemo()]);
  const hasilPenilaian = await hasilPenilaianUsulan(usulan.map((u) => u.id));
  const namaSkema = new Map(skema.map((s) => [s.kode, s.nama]));
  const tanggal = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Beranda <ChevronRight aria-hidden className="inline size-3.5" /> Usulan
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#1e2a5e]">Daftar Usulan</h1>
          <p className="mt-1 text-sm text-slate-600">
            {akun.nama} · {akun.institusi}
          </p>
        </div>
        <SakelarMasaBima masa={pengaturan.masaPengusulan} />
      </div>

      {q.terkirim ? (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Usulan <strong>{q.terkirim}</strong> berhasil dikirim. SEMAR mencatat pengiriman dan menyiapkan rekomendasi untuk reviewer; status
            berubah menjadi Terkirim dalam beberapa detik.
          </span>
        </p>
      ) : q.tersimpan ? (
        <p role="status" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          Draf usulan <strong>{q.tersimpan}</strong> tersimpan.
        </p>
      ) : null}
      {q.galat ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {q.galat === "token" ? "Pengajuan tidak dapat dilanjutkan. Silakan kirim kembali." : "Usulan tidak ditemukan."}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg bg-white shadow-[0_4px_20px_rgba(30,42,94,0.06)]">
        {usulan.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-600">Belum ada usulan pada periode ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#f2f4fa] text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Judul Usulan</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Skema</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Hasil Penilaian</th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usulan.map((u) => {
                  const h = hasilPenilaian.get(u.id);
                  return (
                    <tr key={u.id} className="align-top">
                      <td className="min-w-64 px-5 py-4">
                        <p className="font-medium text-[#1e2a5e]">{u.judul}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {u.id} · diperbarui {tanggal.format(u.diperbaruiPada)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">{namaSkema.get(u.skemaKode) ?? u.skemaKode}</td>
                      <td className="px-5 py-4">
                        <LencanaStatusBima status={u.statusBima} />
                      </td>
                      <td className="min-w-48 px-5 py-4">
                        {!h ? (
                          <span className="text-slate-500">{u.statusBima === "Terkirim" ? "Menunggu penilaian reviewer" : "-"}</span>
                        ) : (
                          <details>
                            <summary className="cursor-pointer font-medium text-[#1e2a5e]">
                              {h.memenuhi} dari {h.jumlahKomponen} komponen Memenuhi
                            </summary>
                            <div className="mt-1 space-y-1 text-xs text-slate-700">
                              {h.tidakMemenuhi.length ? <p>Tidak memenuhi: {h.tidakMemenuhi.join("; ")}.</p> : null}
                              {h.umpanBalik ? <p>Umpan balik reviewer: {h.umpanBalik}</p> : null}
                              <p className="text-slate-500">Diterima dari SEMAR {tanggal.format(h.diterimaPada)}.</p>
                            </div>
                          </details>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          {u.statusBima !== "Terkirim" ? (
                            <Link
                              href={`/bima/pengajuan/${encodeURIComponent(u.id)}?langkah=identitas`}
                              className="inline-flex min-h-9 items-center rounded-md bg-[#3651b0] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2b4294] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3651b0]"
                            >
                              Lanjutkan Usulan
                            </Link>
                          ) : (
                            <Link
                              href={`/bima/pengajuan/${encodeURIComponent(u.id)}?langkah=konfirmasi`}
                              className="inline-flex min-h-9 items-center rounded-md border border-[#3651b0] px-4 text-sm font-medium text-[#3651b0] transition-colors hover:bg-[#eef1fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3651b0]"
                            >
                              Lihat Usulan
                            </Link>
                          )}
                          {PUNYA_HASIL.has(u.statusBima) ? (
                            <a href={`/bima/pengajuan/hasil/${encodeURIComponent(u.id)}`} className="text-xs font-medium text-[#3651b0] underline-offset-2 hover:underline">
                              Lihat hasil pemeriksaan SEMAR
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
