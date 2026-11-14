import { AlatPeragaan } from "@/components/layout/alat-peragaan";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Download, FileText, Lock, ShieldCheck } from "lucide-react";
import { VARIAN_DEMO } from "@/lib/bima/contoh-demo";
import { identitasDemo, totalRab } from "@/lib/bima/identitas-demo";
import { wajibPengusulBima } from "@/lib/bima/sesi";
import { ambilUsulanPengusul, daftarSkemaBima } from "@/lib/bima/servis-pengajuan";
import { buatTokenPraPeriksa } from "@/lib/pengajuan/tiket";
import { ambilPengaturanDemo } from "@/lib/waktu";
import { LencanaStatusBima } from "../lencana-status";
import { TombolKirim } from "./tombol-kirim";
import { UnggahDokumen } from "./unggah-dokumen";

export const metadata: Metadata = { title: "Usulan Penelitian" };
export const dynamic = "force-dynamic";

const LANGKAH = [
  { id: "identitas", nama: "Identitas Usulan" },
  { id: "substansi", nama: "Substansi Usulan" },
  { id: "rab", nama: "RAB" },
  { id: "pendukung", nama: "Dokumen Pendukung" },
  { id: "konfirmasi", nama: "Konfirmasi Usulan" },
] as const;
type IdLangkah = (typeof LANGKAH)[number]["id"];

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const angka = new Intl.NumberFormat("id-ID");
const ukuranBerkas = (b: number) => (b >= 1_048_576 ? `${(b / 1_048_576).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Isian BIMA yang sudah terisi (hanya baca), tampil seperti isian formulir BIMA. */
function Isian({ label, nilai, lebar }: { label: string; nilai: React.ReactNode; lebar?: boolean }) {
  return (
    <div className={lebar ? "sm:col-span-2" : undefined}>
      <dt className="mb-1.5 text-sm font-medium text-slate-700">{label}</dt>
      <dd className="min-h-11 rounded-md border border-[#d0d5dd] bg-[#f9fafb] px-3.5 py-2.5 text-[15px] text-slate-900">{nilai}</dd>
    </div>
  );
}

function JudulBagian({ children, keterangan }: { children: React.ReactNode; keterangan?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-[#1e2a5e]">{children}</h2>
      {keterangan ? <p className="mt-1 text-sm text-slate-600">{keterangan}</p> : null}
    </div>
  );
}

/**
 * Wizard usulan BIMA tiruan (UC-05), mengikuti langkah pengusulan BIMA: Identitas Usulan, Substansi Usulan, RAB, Dokumen Pendukung,
 * Konfirmasi Usulan. Untuk demo semua isian sudah terisi (identitasDemo, hanya baca), kecuali dokumen usulan: unggahannya membuka M-16
 * Pemeriksaan SEMAR (pemeriksaan deterministik), dan hanya dokumen yang lolos yang tersimpan di BIMA. "Kirim Usulan" di langkah 5
 * terkunci sampai dokumen usulan lolos. Langkah aktif di URL (?langkah=).
 */
export default async function UsulanPenelitian({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ langkah?: string }> }) {
  const akun = await wajibPengusulBima();
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const usulan = await ambilUsulanPengusul(akun.idBima, decodeURIComponent(id));
  if (!usulan) notFound();
  const [skema, pengaturan] = await Promise.all([daftarSkemaBima(), ambilPengaturanDemo()]);
  const langkah: IdLangkah = LANGKAH.some((l) => l.id === q.langkah) ? (q.langkah as IdLangkah) : "identitas";
  const indeks = LANGKAH.findIndex((l) => l.id === langkah);
  const tahun = Number(usulan.id.split("-")[1]) || new Date().getFullYear();
  const isi = identitasDemo({ id: usulan.id, skemaKode: usulan.skemaKode, judul: usulan.judul, ketua: { nama: akun.nama, institusi: akun.institusi, nomorInduk: akun.nomorInduk }, tahun });
  const namaSkema = skema.find((s) => s.kode === usulan.skemaKode)?.nama ?? usulan.skemaKode;
  const terkirim = usulan.statusBima === "Terkirim" || usulan.statusBima === "Diajukan ke SEMAR";
  const lolos = usulan.praPeriksa !== null;
  const token = terkirim ? null : await buatTokenPraPeriksa({ idProposal: usulan.id, idBima: akun.idBima, judul: usulan.judul, skemaKode: usulan.skemaKode });
  const href = (l: IdLangkah) => `/bima/pengajuan/${encodeURIComponent(usulan.id)}?langkah=${l}`;
  const selesai = (l: IdLangkah) => (l === "substansi" ? lolos : l === "konfirmasi" ? terkirim : true);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">
            <Link href="/bima/pengajuan" className="hover:text-[#3651b0] hover:underline">
              Usulan
            </Link>{" "}
            <ChevronRight aria-hidden className="inline size-3.5" /> {usulan.id}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#1e2a5e]">Usulan Penelitian</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">{usulan.judul}</p>
        </div>
        <LencanaStatusBima status={usulan.statusBima} />
      </div>

      <nav aria-label="Langkah pengusulan" className="relative overflow-x-auto rounded-lg bg-white px-4 py-4 shadow-[0_4px_20px_rgba(30,42,94,0.06)]">
        <ol className="flex min-w-max items-center gap-2">
          {LANGKAH.map((l, i) => {
            const aktif = l.id === langkah;
            const sudah = selesai(l.id);
            return (
              <li key={l.id} className="flex items-center gap-2">
                <Link
                  href={href(l.id)}
                  aria-current={aktif ? "step" : undefined}
                  className={`flex min-h-10 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#3651b0] ${aktif ? "bg-[#eef1fb] font-semibold text-[#3651b0]" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${aktif ? "bg-[#3651b0] text-white" : sudah ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {sudah && !aktif ? <Check aria-hidden className="size-4" /> : i + 1}
                    <span className="sr-only">{sudah ? " (lengkap)" : " (belum lengkap)"}</span>
                  </span>
                  {l.nama}
                </Link>
                {i < LANGKAH.length - 1 ? <span aria-hidden className="h-px w-6 bg-slate-200" /> : null}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="rounded-lg bg-white p-5 shadow-[0_4px_20px_rgba(30,42,94,0.06)] sm:p-7">
        {langkah === "identitas" ? (
          <>
            <JudulBagian>Identitas Usulan</JudulBagian>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Isian label="Judul Penelitian" nilai={usulan.judul} lebar />
              <Isian label="Skema" nilai={namaSkema} />
              <Isian label="Kelompok Skema" nilai={isi.kelompokSkema} />
              <Isian label="TKT Saat Ini" nilai={`TKT ${isi.tktSaatIni}`} />
              <Isian label="Target Akhir TKT" nilai={`TKT ${isi.tktTarget}`} />
              <Isian label="Ruang Lingkup" nilai={isi.ruangLingkup} />
              <Isian label="Besaran Dana Penelitian Maksimal" nilai={`${rupiah.format(isi.danaMaksimalPerTahun)} per tahun`} />
              <Isian label="Bidang Fokus" nilai={isi.bidangFokus} />
              <Isian label="Tema Penelitian" nilai={isi.tema} />
              <Isian label="Topik Penelitian" nilai={isi.topik} lebar />
              <Isian label="Rumpun Ilmu Level 1" nilai={isi.rumpunIlmu[0]} />
              <Isian label="Rumpun Ilmu Level 2" nilai={isi.rumpunIlmu[1]} />
              <Isian label="Rumpun Ilmu Level 3" nilai={isi.rumpunIlmu[2]} />
              <Isian label="Prioritas Riset" nilai={isi.prioritasRiset} />
              <Isian label="Tahun Pertama Usulan" nilai={String(isi.tahunPertama)} />
              <Isian label="Lama Kegiatan" nilai={`${isi.lamaKegiatan} tahun`} />
            </dl>
            <h3 className="mb-3 mt-8 text-base font-semibold text-[#1e2a5e]">Anggota Peneliti</h3>
            <div className="relative overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f2f4fa] text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Peran</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Nama</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">NIDN/NIM</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Tugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isi.anggota.map((a) => (
                    <tr key={`${a.peran}-${a.nama}`}>
                      <td className="px-4 py-2.5">{a.peran}</td>
                      <td className="px-4 py-2.5 font-medium">
                        {a.nama}
                        <span className="block text-xs font-normal text-slate-500">{a.institusi}</span>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{a.nomorInduk}</td>
                      <td className="px-4 py-2.5 text-slate-600">{a.tugas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {langkah === "substansi" ? (
          <>
            <JudulBagian keterangan="Dokumen usulan diperiksa SEMAR sebelum tersimpan di BIMA. Usulan baru dapat dikirim bila dokumen lolos pemeriksaan.">
              Substansi Usulan
            </JudulBagian>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Isian label="Kelompok Makro Riset" nilai={isi.kelompokMakroRiset} lebar />
            </dl>

            <div className="mt-6 rounded-lg border border-[#d0d5dd] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#1e2a5e]">Dokumen Usulan</h3>
                  <p className="mt-0.5 text-sm text-slate-600">Isian Substansi sesuai templat skema, format PDF, maksimal 4 MB.</p>
                </div>
                <a
                  href={`/api/semar/templat/berlaku/${encodeURIComponent(usulan.skemaKode)}/unduh`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#3651b0] px-3 text-sm font-medium text-[#3651b0] transition-colors hover:bg-[#eef1fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3651b0]"
                >
                  <Download aria-hidden className="size-4" />
                  Template
                </a>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#f9fafb] px-4 py-3">
                {usulan.naskah ? (
                  <p className="flex min-w-0 items-center gap-2 text-sm">
                    <FileText aria-hidden className="size-5 shrink-0 text-slate-500" />
                    <span className="min-w-0 break-all font-medium text-slate-900">{usulan.naskah.nama}</span>
                    <span className="text-slate-500">{ukuranBerkas(usulan.naskah.ukuran)}</span>
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">Belum ada dokumen usulan.</p>
                )}
                {lolos ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    <ShieldCheck aria-hidden className="size-4" />
                    Lolos pemeriksaan SEMAR ({usulan.praPeriksa?.jumlahButir} ketentuan)
                  </span>
                ) : usulan.naskah ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">Belum diperiksa SEMAR</span>
                ) : null}
              </div>
              {token ? (
                <div className="mt-4">
                  <UnggahDokumen idProposal={usulan.id} token={token} adaDokumen={Boolean(usulan.naskah)} />
                </div>
              ) : null}
            </div>

            <h3 className="mb-3 mt-8 text-base font-semibold text-[#1e2a5e]">Luaran Wajib Setiap Tahun</h3>
            <div className="relative overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f2f4fa] text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Tahun ke-</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Luaran</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Target Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isi.luaranWajib.map((l) => (
                    <tr key={l.tahun}>
                      <td className="px-4 py-2.5 tabular-nums">{l.tahun}</td>
                      <td className="px-4 py-2.5">{l.luaran}</td>
                      <td className="px-4 py-2.5">{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {token ? (
              <AlatPeragaan>
                <aside aria-labelledby="judul-contoh-demo" className="mt-8 rounded-lg border border-dashed border-slate-300 px-5 py-4">
                  <h3 id="judul-contoh-demo" className="text-sm font-semibold text-slate-700">
                    Berkas contoh (demo)
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">Naskah rekaan dengan judul usulan ini, untuk dicoba diunggah.</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(VARIAN_DEMO).map(([kunci, v]) => (
                      <li key={kunci}>
                        <a
                          href={`/bima/pengajuan/${encodeURIComponent(usulan.id)}/contoh/${kunci}`}
                          download
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-slate-100 px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-[#3651b0]"
                        >
                          <Download aria-hidden className="size-3.5" />
                          {v.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </aside>
              </AlatPeragaan>
            ) : null}
          </>
        ) : null}

        {langkah === "rab" ? (
          <>
            <JudulBagian>Rencana Anggaran Biaya</JudulBagian>
            {Array.from({ length: isi.lamaKegiatan }, (_, t) => t + 1).map((tahunKe) => (
              <div key={tahunKe} className="mb-6 last:mb-0">
                <h3 className="mb-2 text-base font-semibold text-[#1e2a5e]">Tahun ke-{tahunKe}</h3>
                <div className="relative overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f2f4fa] text-xs uppercase tracking-wide text-slate-600">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Kelompok RAB</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Komponen</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Keterangan</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">Harga Satuan</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">Volume</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isi.rab
                        .filter((r) => r.tahun === tahunKe)
                        .map((r) => (
                          <tr key={r.komponen}>
                            <td className="px-4 py-2.5">{r.kelompok}</td>
                            <td className="px-4 py-2.5">{r.komponen}</td>
                            <td className="px-4 py-2.5 text-slate-600">{r.keterangan}</td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{rupiah.format(r.hargaSatuan)}</td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                              {angka.format(r.volume)} {r.satuan}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{rupiah.format(r.hargaSatuan * r.volume)}</td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 font-semibold">
                        <td colSpan={5} className="px-4 py-2.5 text-right">
                          Total tahun ke-{tahunKe}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{rupiah.format(totalRab(isi.rab, tahunKe))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </>
        ) : null}

        {langkah === "pendukung" ? (
          <>
            <JudulBagian keterangan="Dokumen pendukung yang diwajibkan skema.">Dokumen Pendukung</JudulBagian>
            {usulan.lampiran.length ? (
              <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                {usulan.lampiran.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900">{l.namaLampiran}</span>
                      <span className="block break-all text-xs text-slate-500">
                        {l.nama} · {ukuranBerkas(l.ukuran)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      <Check aria-hidden className="size-3.5" />
                      Terunggah
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">Tidak ada dokumen pendukung.</p>
            )}
          </>
        ) : null}

        {langkah === "konfirmasi" ? (
          <>
            <JudulBagian keterangan="Periksa kelengkapan usulan sebelum dikirim. Usulan yang sudah dikirim tidak dapat diubah.">Konfirmasi Usulan</JudulBagian>
            <ul className="space-y-2">
              {[
                { nama: "Identitas usulan dan anggota peneliti", ok: true, l: "identitas" as const },
                { nama: "Dokumen usulan lolos pemeriksaan SEMAR", ok: lolos, l: "substansi" as const },
                { nama: "Rencana anggaran biaya", ok: true, l: "rab" as const },
                { nama: "Dokumen pendukung", ok: usulan.lampiran.length > 0, l: "pendukung" as const },
              ].map((c) => (
                <li key={c.nama} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2.5">
                    <span className={`flex size-6 items-center justify-center rounded-full ${c.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                      {c.ok ? <Check aria-hidden className="size-4" /> : <Lock aria-hidden className="size-3.5" />}
                    </span>
                    {c.nama}
                    <span className="sr-only">{c.ok ? ": lengkap" : ": belum"}</span>
                  </span>
                  {!c.ok ? (
                    <Link href={href(c.l)} className="text-sm font-medium text-[#3651b0] underline-offset-2 hover:underline">
                      Lengkapi
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
            {terkirim ? (
              <p className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Usulan sudah dikirim pada periode ini.</p>
            ) : (
              <div className="mt-6">
                <TombolKirim idProposal={usulan.id} siap={lolos} masaDitutup={pengaturan.masaPengusulan === "ditutup"} />
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/bima/pengajuan?tersimpan=${encodeURIComponent(usulan.id)}`}
          className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#3651b0]"
        >
          Simpan sebagai Draft
        </Link>
        <div className="flex gap-2">
          {indeks > 0 ? (
            <Link
              href={href(LANGKAH[indeks - 1].id)}
              className="inline-flex min-h-10 items-center rounded-md border border-[#3651b0] bg-white px-4 text-sm font-medium text-[#3651b0] transition-colors hover:bg-[#eef1fb] focus-visible:outline-2 focus-visible:outline-[#3651b0]"
            >
              Sebelumnya
            </Link>
          ) : null}
          {indeks < LANGKAH.length - 1 ? (
            <Link
              href={href(LANGKAH[indeks + 1].id)}
              className="inline-flex min-h-10 items-center rounded-md bg-[#3651b0] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2b4294] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3651b0]"
            >
              Selanjutnya
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
