import type { Metadata } from "next";
import Link from "next/link";
import { LogoSemar } from "@/components/merek";
import { Alert, Badge, JudulHalaman, Panel } from "@/components/ui";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { logAudit } from "@/db/schema";
import { formatWaktu } from "@/lib/utils";
import { ambilPengaturanDemo } from "@/lib/waktu";
import { modeLlm } from "@/lib/llm/konfigurasi";
import { KontrolDemo } from "./kontrol-demo";

export const metadata: Metadata = { title: "Demo" };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface Kartu {
  kode: string;
  judul: string;
  peran: string;
  jendela: string;
  catatan?: string;
}

const UC: Kartu[] = [
  { kode: "UC-01", judul: "Mengelola templat proposal", peran: "Tim Kerja (pengelola)", jendela: "J-02" },
  { kode: "UC-01-S1", judul: "Mengelola templat proposal: skema belum punya templat (S-1)", peran: "Tim Kerja (pengelola)", jendela: "J-02", catatan: "Skema contoh tanpa templat" },
  { kode: "UC-02", judul: "Mengelola aturan pemeriksaan", peran: "Tim Kerja (pengelola)", jendela: "J-03" },
  { kode: "UC-03", judul: "Menugaskan reviewer", peran: "Tim Kerja DPPM", jendela: "J-04" },
  { kode: "UC-04", judul: "Memantau kesesuaian penilaian", peran: "Tim Kerja DPPM", jendela: "J-05" },
  { kode: "UC-05", judul: "Mengajukan proposal", peran: "Pengusul", jendela: "BIMA tiruan, J-06" },
  { kode: "UC-06", judul: "Memeriksa butir deterministik", peran: "Sistem (di dalam UC-05)", jendela: "J-06", catatan: "Memakai proposal yang gagal jumlah kata" },
  { kode: "UC-07", judul: "Melakukan pemeriksaan akhir", peran: "Reviewer", jendela: "J-07, J-08" },
  { kode: "UC-08", judul: "Mengoreksi rekomendasi sistem", peran: "Reviewer (di dalam UC-07)", jendela: "J-08" },
  { kode: "UC-09", judul: "Memeriksa butir semantik", peran: "Sistem (latar belakang); pendukung: Layanan LLM", jendela: "J-08", catatan: "Hasil LLM mode tiruan" },
  { kode: "UC-09-S1", judul: "Memeriksa butir semantik: kutipan LLM tidak ditemukan (S-1)", peran: "Sistem (latar belakang); pendukung: Layanan LLM", jendela: "J-08", catatan: "Perlu diperiksa manual" },
  { kode: "UC-09-S2", judul: "Memeriksa butir semantik: LLM tidak merespons (S-2)", peran: "Sistem (latar belakang); pendukung: Layanan LLM", jendela: "J-08", catatan: "Belum ada rekomendasi" },
];

/** Judul dan kondisi mengikuti Tabel use scenario Bab 10.1 (us-05a..us-07c). */
const SKENARIO: Kartu[] = [
  { kode: "UC-05a", judul: "Proposal terkirim pada pengajuan pertama", peran: "Pengusul", jendela: "BIMA, J-06", catatan: "Semua butir lolos (Terkirim)" },
  { kode: "UC-05b", judul: "Proposal ditahan lalu terkirim setelah diperbaiki", peran: "Pengusul", jendela: "BIMA, J-06", catatan: "Ditahan (Metode melebihi batas), lalu Ajukan ulang dengan naskah perbaikan (Terkirim V2)" },
  { kode: "UC-05c", judul: "Proposal ditahan lalu ditolak karena masa pengusulan ditutup", peran: "Pengusul", jendela: "BIMA, J-06", catatan: "Ditahan, tutup masa di BIMA, Ajukan ulang (Ditolak, 3a)" },
  { kode: "UC-07a", judul: "Menyetujui seluruh rekomendasi", peran: "Reviewer", jendela: "J-07, J-08", catatan: "Tanpa koreksi, lalu Simpan Permanen" },
  { kode: "UC-07b", judul: "Mengoreksi rekomendasi yang keliru", peran: "Reviewer", jendela: "J-08", catatan: "Tidak Setuju pada satu butir (UC-08)" },
  { kode: "UC-07c", judul: "Menyimpan sementara lalu melanjutkan", peran: "Reviewer", jendela: "J-07, J-08", catatan: "Penilaian berstatus Draf sudah sebagian terisi" },
];

function DaftarKartu({ daftar }: { daftar: Kartu[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {daftar.map((k) => (
        <li key={k.kode}>
          <a
            href={`/demo/mulai?k=${k.kode}`}
            data-kode={k.kode}
            className="block h-full rounded-lg border border-sogan-200 bg-krem p-4 hover:border-emas-500 hover:bg-emas-50 focus-visible:outline-3 focus-visible:outline-emas-500"
          >
            <span className="flex items-center justify-between gap-2">
              <Badge warna="emas">{k.kode}</Badge>
              <span className="text-xs text-sogan-600">{k.jendela}</span>
            </span>
            <span className="mt-2 block font-semibold text-sogan-900">{k.judul}</span>
            <span className="mt-1 block text-xs text-sogan-600">
              {k.peran}
              {k.catatan ? ` - ${k.catatan}` : ""}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function Demo({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const { galat } = await searchParams;
  const pengaturan = await ambilPengaturanDemo();
  const log = await getDb().select().from(logAudit).orderBy(desc(logAudit.id)).limit(20);
  return (
    <>
      <header className="latar-kawung text-krem">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" aria-label="SEMAR, ke halaman awal"><LogoSemar /></Link>
          <Link href="/masuk" className="text-sm font-semibold text-emas-100 underline underline-offset-2">Masuk sebagai Tim Kerja atau Reviewer</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <JudulHalaman
          kode="DEMO"
          judul="Pusat Demo"
          deskripsi="Siapkan data, atur masa pengusulan, lalu lompat ke jendela mana pun dengan sesi peran yang sesuai. Panel pemandu di setiap jendela menampilkan langkah real use case."
        />
        {galat ? <Alert jenis="galat" judul="Jalan pintas gagal" className="mb-5">{galat === "kode" ? "Kode jalan pintas tidak dikenal." : galat}</Alert> : null}
        <div className="space-y-6">
          <Panel judul="Kendali demo">
            <KontrolDemo masa={pengaturan.masaPengusulan} />
            <p className="mt-4 text-xs text-sogan-600">
              Mode LLM: <strong>{modeLlm()}</strong>. Data, akun, dan institusi adalah rekaan. BIMA adalah simulasi, bukan sistem resmi.
            </p>
          </Panel>
          <Panel judul="Jalan pintas use case">
            <p className="mb-3 text-sm text-sogan-700">Setiap kartu menyiapkan data yang diperlukan, memasang sesi peran, dan membuka jendela awalnya.</p>
            <DaftarKartu daftar={UC} />
          </Panel>
          <Panel judul="Enam skenario">
            <p className="mb-3 text-sm text-sogan-700">
              Keenam kartu mengikuti use scenario Bab 10.1: UC-05 a/b/c (terkirim; ditahan lalu terkirim; ditahan lalu ditolak) dan UC-07 a/b/c (menyetujui seluruh rekomendasi; mengoreksi rekomendasi yang keliru; menyimpan sementara lalu melanjutkan). Varian hasil semantik ada pada kartu UC-09 S-1 dan S-2.
            </p>
            <DaftarKartu daftar={SKENARIO} />
          </Panel>
          <Panel judul="Log audit (hanya baca)">
            <p className="mb-3 text-sm text-sogan-700">
              20 entri terakhir. Tidak ada tombol ubah atau hapus: basis data menolak UPDATE dan DELETE pada tabel ini lewat pemicu (NFR 3.3).
            </p>
            {log.length === 0 ? (
              <p className="text-sm text-sogan-600">Belum ada entri.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-sogan-200 text-sogan-700">
                      <th className="py-1 pr-3">Waktu</th>
                      <th className="py-1 pr-3">Aktor</th>
                      <th className="py-1 pr-3">Aksi</th>
                      <th className="py-1">Objek</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.map((l) => (
                      <tr key={l.id} className="border-b border-sogan-100">
                        <td className="whitespace-nowrap py-1 pr-3">{formatWaktu(l.waktu)}</td>
                        <td className="py-1 pr-3">{l.aktor}</td>
                        <td className="py-1 pr-3 font-mono">{l.aksi}</td>
                        <td className="py-1 font-mono">{l.objek}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <p className="text-xs text-sogan-600">
            Akun demo: dppm-pengelola, dppm-anggota, pengusul-1..3, reviewer-1..6. Pemetaan lengkap: docs/peta-uc-jendela.md.
          </p>
        </div>
      </main>
    </>
  );
}
