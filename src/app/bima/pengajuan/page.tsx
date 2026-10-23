import type { Metadata } from "next";
import Link from "next/link";
import { wajibPengusulBima } from "@/lib/bima/sesi";
import { ambilUsulanPengusul, daftarSkemaBima, daftarUsulanPengusul } from "@/lib/bima/servis-pengajuan";
import { susunContoh } from "@/lib/contoh/proposal";
import { ambilPengaturanDemo } from "@/lib/waktu";
import { FormPengajuan } from "./form-pengajuan";
import { SakelarMasaBima } from "./sakelar-masa";

export const metadata: Metadata = { title: "Pengajuan proposal (simulasi BIMA)" };
export const dynamic = "force-dynamic";

const PUNYA_HASIL = new Set(["Diajukan ke SEMAR", "Terkirim", "Ditahan", "Ditolak"]);

/**
 * Halaman pengajuan di BIMA tiruan (UC-05 langkah 1): pengusul mengunggah proposal beserta lampiran lalu menekan
 * "Ajukan Usulan". BIMA meneruskan pengusul ke J-06 di SEMAR membawa idProposal dan identitas pengusul.
 * Gaya sengaja netral (abu-abu, font sistem), berbeda dari SEMAR.
 */
export default async function Pengajuan({ searchParams }: { searchParams: Promise<{ proposal?: string; baru?: string; galat?: string }> }) {
  const akun = await wajibPengusulBima();
  const q = await searchParams;
  const [usulan, skema] = await Promise.all([daftarUsulanPengusul(akun.idBima), daftarSkemaBima()]);
  const terpilih = q.proposal ? await ambilUsulanPengusul(akun.idBima, q.proposal) : null;
  const pengaturan = await ambilPengaturanDemo();
  const judulPerbaikan = susunContoh("e").judul;
  const tampilForm = terpilih ? terpilih.statusBima !== "Terkirim" : q.baru === "1" || usulan.length === 0;

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900!">Pengajuan proposal</h1>
        <p className="mt-1 text-sm text-slate-600">
          Masuk sebagai {akun.nama} ({akun.institusi}).
        </p>
      </div>

      <SakelarMasaBima masa={pengaturan.masaPengusulan} />

      {q.galat ? (
        <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-900">
          {q.galat === "token" ? "Pengajuan tidak dapat dilanjutkan. Silakan ajukan kembali." : "Usulan tidak ditemukan."}
        </p>
      ) : null}

      {usulan.length ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900!">Usulan Anda</h2>
            {!tampilForm ? (
              <Link href="/bima/pengajuan?baru=1" className="text-sm font-semibold text-slate-900 underline underline-offset-2">
                Buat usulan baru
              </Link>
            ) : null}
          </div>
          <div className="overflow-x-auto border border-slate-300 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-200 text-slate-800">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">ID Proposal</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Judul</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {usulan.map((u) => (
                  <tr key={u.id} className={terpilih?.id === u.id ? "bg-slate-50" : undefined}>
                    <td className="whitespace-nowrap px-3 py-2 align-top font-mono text-xs">{u.id}</td>
                    <td className="px-3 py-2 align-top">{u.judul}</td>
                    <td className="px-3 py-2 align-top">
                      <span className="border border-slate-400 bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">{u.statusBima}</span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {u.statusBima !== "Terkirim" ? (
                          <Link href={`/bima/pengajuan?proposal=${encodeURIComponent(u.id)}`} className="font-medium text-slate-900 underline underline-offset-2">
                            {u.statusBima === "Draf" ? "Ajukan" : "Ajukan ulang"}
                          </Link>
                        ) : null}
                        {PUNYA_HASIL.has(u.statusBima) ? (
                          <a href={`/bima/pengajuan/hasil/${encodeURIComponent(u.id)}`} className="font-medium text-slate-900 underline underline-offset-2">
                            Lihat hasil pemeriksaan
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tampilForm ? (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900!">{terpilih ? `Ajukan: ${terpilih.id}` : "Usulan baru"}</h2>
          <FormPengajuan
            key={terpilih?.id ?? "baru"}
            skema={skema}
            perbaikanTersedia={Boolean(terpilih && terpilih.statusBima === "Ditahan" && terpilih.judul === judulPerbaikan)}
            awal={
              terpilih
                ? {
                    idProposal: terpilih.id,
                    judul: terpilih.judul,
                    skemaKode: terpilih.skemaKode,
                    naskah: terpilih.naskah?.nama ?? null,
                    lampiran: Object.fromEntries(terpilih.lampiran.map((l) => [l.namaLampiran, l.nama])),
                  }
                : undefined
            }
          />
        </div>
      ) : null}
    </section>
  );
}
