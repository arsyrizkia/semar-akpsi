import type { Metadata } from "next";
import Link from "next/link";
import { LogoSemar } from "@/components/merek";
import { Alert, Badge, JudulHalaman, Panel } from "@/components/ui";
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
  { kode: "UC-01", judul: "Menyusun templat proposal", peran: "Tim Kerja (pengelola)", jendela: "J-02" },
  { kode: "UC-02", judul: "Mengelola aturan pemeriksaan", peran: "Tim Kerja (pengelola)", jendela: "J-03" },
  { kode: "UC-03", judul: "Menugaskan reviewer", peran: "Tim Kerja DPPM", jendela: "J-04" },
  { kode: "UC-04", judul: "Memantau kesesuaian penilaian", peran: "Tim Kerja DPPM", jendela: "J-05" },
  { kode: "UC-05", judul: "Mengajukan proposal", peran: "Pengusul", jendela: "BIMA tiruan, J-06" },
  { kode: "UC-06", judul: "Memeriksa butir deterministik", peran: "Pengusul", jendela: "J-06", catatan: "Memakai proposal yang gagal jumlah kata" },
  { kode: "UC-07", judul: "Melakukan pemeriksaan akhir", peran: "Reviewer", jendela: "J-07, J-08" },
  { kode: "UC-08", judul: "Mengoreksi rekomendasi sistem", peran: "Reviewer", jendela: "J-08" },
  { kode: "UC-09", judul: "Memeriksa butir semantik", peran: "Reviewer", jendela: "J-08", catatan: "Hasil LLM mode tiruan" },
];

const SKENARIO: Kartu[] = [
  { kode: "UC-05a", judul: "Proposal lolos semua butir", peran: "Pengusul", jendela: "BIMA, J-06", catatan: "Terkirim" },
  { kode: "UC-05b", judul: "Ada butir gagal (jumlah kata Metode)", peran: "Pengusul", jendela: "BIMA, J-06", catatan: "Ditahan (S-1)" },
  { kode: "UC-05c", judul: "Masa pengusulan sudah ditutup", peran: "Pengusul", jendela: "BIMA, J-06", catatan: "Ditolak (3a)" },
  { kode: "UC-07a", judul: "Rekomendasi sistem normal", peran: "Reviewer", jendela: "J-07, J-08", catatan: "UC-09 jalur utama" },
  { kode: "UC-07b", judul: "Kutipan LLM tidak ditemukan", peran: "Reviewer", jendela: "J-07, J-08", catatan: "Perlu diperiksa manual (UC-09 S-1)" },
  { kode: "UC-07c", judul: "LLM tidak merespons", peran: "Reviewer", jendela: "J-07, J-08", catatan: "Belum ada rekomendasi (UC-09 S-2)" },
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
              UC-05 a/b/c memperagakan hasil pengajuan (Terkirim, Ditahan, Ditolak). UC-07 a/b/c memperagakan hasil pemeriksaan semantik (normal, kutipan tidak ditemukan, LLM tidak merespons).
            </p>
            <DaftarKartu daftar={SKENARIO} />
          </Panel>
          <p className="text-xs text-sogan-600">
            Akun demo: dppm-pengelola, dppm-anggota, pengusul-1..3, reviewer-1..6. Pemetaan lengkap: docs/peta-uc-jendela.md.
          </p>
        </div>
      </main>
    </>
  );
}
