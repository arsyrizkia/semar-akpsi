import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { LogoSemar } from "@/components/merek";
import { Alert, Bagian, KepalaHalaman, KeadaanKosong, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { getDb } from "@/db";
import { logAudit } from "@/db/schema";
import { formatWaktu } from "@/lib/utils";
import { ambilPengaturanDemo } from "@/lib/waktu";
import { modeLlm } from "@/lib/llm/konfigurasi";
import { KATALOG_UC, alamatPindah, alamatSkenario, layarUsecase } from "@/lib/demo/katalog";
import { KontrolDemo } from "./kontrol-demo";

export const metadata: Metadata = { title: "Pusat Demo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface BarisUc {
  kode: string;
  judul: string;
  peran: string;
  layar: string;
  catatan?: string;
}

const UC: BarisUc[] = [
  { kode: "UC-01", judul: "Mengelola templat proposal", peran: "Tim Kerja (pengelola)", layar: "J-02, J-02a, J-03" },
  { kode: "UC-01-S1", judul: "Mengelola templat: skema belum punya templat (S-1)", peran: "Tim Kerja (pengelola)", layar: "J-02", catatan: "Skema contoh tanpa templat" },
  { kode: "UC-02", judul: "Mengelola aturan pemeriksaan", peran: "Tim Kerja (pengelola)", layar: "J-03, J-03b" },
  { kode: "UC-03", judul: "Menugaskan reviewer", peran: "Tim Kerja DPPM", layar: "J-04, J-04b" },
  { kode: "UC-04", judul: "Memantau kesesuaian penilaian", peran: "Tim Kerja DPPM", layar: "J-05, J-05b" },
  { kode: "UC-05", judul: "Mengajukan proposal", peran: "Pengusul", layar: "BIMA, J-06" },
  { kode: "UC-06", judul: "Memeriksa butir deterministik", peran: "Sistem (di dalam UC-05)", layar: "J-06", catatan: "Proposal yang gagal jumlah kata" },
  { kode: "UC-07", judul: "Melakukan pemeriksaan akhir", peran: "Reviewer", layar: "J-07, J-08, J-08b" },
  { kode: "UC-08", judul: "Mengoreksi rekomendasi sistem", peran: "Reviewer (di dalam UC-07)", layar: "J-08" },
  { kode: "UC-09", judul: "Memeriksa butir semantik", peran: "Sistem; pendukung: Layanan LLM", layar: "J-08", catatan: "Hasil LLM mode tiruan" },
  { kode: "UC-09-S1", judul: "Semantik: kutipan LLM tidak ditemukan (S-1)", peran: "Sistem; pendukung: Layanan LLM", layar: "J-08", catatan: "Perlu diperiksa manual" },
  { kode: "UC-09-S2", judul: "Semantik: LLM tidak merespons (S-2)", peran: "Sistem; pendukung: Layanan LLM", layar: "J-08", catatan: "Belum ada rekomendasi" },
];

/** Judul dan kondisi mengikuti Tabel use scenario Bab 10.1 (us-05a..us-07c). */
const SKENARIO: BarisUc[] = [
  { kode: "UC-05a", judul: "Proposal terkirim pada pengajuan pertama", peran: "Pengusul", layar: "BIMA, J-06", catatan: "Semua butir lolos (Terkirim)" },
  { kode: "UC-05b", judul: "Proposal ditahan lalu terkirim setelah diperbaiki", peran: "Pengusul", layar: "BIMA, J-06", catatan: "Ditahan (Metode melebihi batas), lalu Ajukan ulang dengan naskah perbaikan (Terkirim V2)" },
  { kode: "UC-06-koma", judul: "Kata kunci dipisah koma", peran: "Sistem (di dalam UC-05)", layar: "BIMA, J-06", catatan: "Butir kata kunci Gagal: pemisah koma, bukan titik koma" },
  { kode: "UC-05c", judul: "Proposal ditahan lalu ditolak karena masa pengusulan ditutup", peran: "Pengusul", layar: "BIMA, J-06", catatan: "Ditahan, tutup masa di BIMA, Ajukan ulang (Ditolak, 3a)" },
  { kode: "UC-07a", judul: "Menyetujui seluruh rekomendasi", peran: "Reviewer", layar: "J-07, J-08", catatan: "Tanpa koreksi, lalu Simpan Permanen" },
  { kode: "UC-07b", judul: "Mengoreksi rekomendasi yang keliru", peran: "Reviewer", layar: "J-07, J-08", catatan: "Mulai dari J-07 (Periksa), lalu Tidak Setuju pada satu butir (UC-08)" },
  { kode: "UC-07c", judul: "Menyimpan sementara lalu melanjutkan", peran: "Reviewer", layar: "J-07, J-08", catatan: "Draf sudah terisi (langkah 3-4 disiapkan otomatis)" },
  { kode: "UC-07c-awal", judul: "Menyimpan sementara lalu melanjutkan: dari awal", peran: "Reviewer", layar: "J-07, J-08", catatan: "Mulai dari label Baru; Simpan Sementara diperagakan sendiri" },
];

const kelasTautanKecil = "inline-flex min-h-8 items-center rounded-md border border-primer-300 bg-white px-2.5 text-xs font-medium text-primer-800 transition-colors hover:bg-primer-50";

function TabelUc({ judul, daftar }: { judul: string; daftar: BarisUc[] }) {
  return (
    <Table aria-label={judul}>
      <THead>
        <TR>
          <TH>Kode</TH>
          <TH>Use case</TH>
          <TH className="hidden md:table-cell">Peran</TH>
          <TH className="hidden sm:table-cell">Layar</TH>
          <TH>
            <span className="sr-only">Tindakan</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {daftar.map((k) => (
          <TR key={k.kode}>
            <TD className="whitespace-nowrap font-mono text-xs font-semibold text-teks-redup">{k.kode}</TD>
            <TD>
              {k.judul}
              {k.catatan ? <span className="block text-xs text-abu-600">{k.catatan}</span> : null}
            </TD>
            <TD className="hidden text-xs text-abu-700 md:table-cell">{k.peran}</TD>
            <TD className="hidden whitespace-nowrap text-xs text-abu-700 sm:table-cell">{k.layar}</TD>
            <TD className="text-right">
              <a href={`/demo/mulai?k=${k.kode}`} rel="nofollow" data-kode={k.kode} className={kelasTautanKecil} aria-label={`Pasang skenario ${k.kode}: ${k.judul}`}>
                Pasang
              </a>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export default async function Demo({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const { galat } = await searchParams;
  const pengaturan = await ambilPengaturanDemo();
  const log = await getDb().select().from(logAudit).orderBy(desc(logAudit.id)).limit(20);
  return (
    <>
      <a href="#isi" className="sr-only-fokus fixed left-2 top-2 z-[60] rounded-md bg-white px-3 py-2 text-sm font-semibold text-primer-900 focus:not-sr-only">Lewati ke isi</a>
      <header className="latar-kawung text-latar">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/masuk" aria-label="SEMAR, ke halaman masuk">
            <LogoSemar />
          </Link>
          <Link href="/masuk" className="text-sm font-semibold text-aksen-300 underline underline-offset-2">
            Masuk sebagai Tim Kerja atau Reviewer
          </Link>
        </div>
      </header>
      <main id="isi" className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6">
        <KepalaHalaman
          judul="Pusat Demo"
          keterangan="Pindah layar tidak mengubah data. Pasang skenario menyiapkan data, lalu membuka layarnya."
          aksi={
            <span className="text-xs text-abu-600">
              Mode LLM: <strong className="font-semibold text-primer-800">{modeLlm()}</strong>
            </span>
          }
        />
        {galat ? (
          <Alert jenis="galat" judul="Jalan pintas gagal" className="mb-6">
            {galat === "kode" ? "Kode jalan pintas tidak dikenal." : galat}
          </Alert>
        ) : null}

        <Bagian judul="Kendali data demo">
          <KontrolDemo masa={pengaturan.masaPengusulan} />
        </Bagian>

        <Bagian judul="Use case, layar, dan keadaan">
          <p className="mb-3 max-w-3xl text-sm text-teks-redup">
            Setiap use case berisi layar-layarnya. &ldquo;Buka layar&rdquo; hanya berpindah (data tetap); memilih keadaan menyiapkan data lalu membuka layarnya.
            Periode 2026 dipakai untuk penugasan, pemantauan, dan penilaian berskala; periode 2027 untuk alur pengajuan sampai hasil.
          </p>
          <Table aria-label="Use case, layar, dan keadaan">
            <THead>
              <TR>
                <TH>Layar</TH>
                <TH>Pindah layar (data tetap)</TH>
                <TH>Keadaan (menyiapkan data)</TH>
              </TR>
            </THead>
            <TBody>
              {KATALOG_UC.flatMap((u) => [
                <TR key={u.kode} className="bg-primer-50">
                  <TD colSpan={3} className="font-semibold text-primer-900">
                    <span className="mr-2 font-mono text-xs text-teks-redup">{u.kode}</span>
                    {u.nama}
                    <span className="ml-2 text-xs font-normal text-abu-700">{u.peran}</span>
                  </TD>
                </TR>,
                ...layarUsecase(u).map(({ jendela: j, skenario }) => (
                  <TR key={`${u.kode}:${j.kode}`}>
                    <TD className="whitespace-nowrap pl-6">
                      <span className="font-mono text-xs font-semibold text-teks-redup">{j.kode}</span> {j.nama.replace("BIMA: ", "BIMA ")}
                    </TD>
                    <TD>
                      <a href={alamatPindah(j.kode)} rel="nofollow" data-pindah={j.kode} className={kelasTautanKecil}>
                        Buka layar
                      </a>
                    </TD>
                    <TD>
                      {skenario.length ? (
                        <ul className="flex flex-wrap gap-1.5">
                          {skenario.map((sk) => (
                            <li key={sk.id}>
                              <a href={alamatSkenario(j.kode, sk.id)} rel="nofollow" data-skenario-kartu={`${j.kode}/${sk.id}`} title={sk.ringkas} className={kelasTautanKecil}>
                                {sk.nama}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-abu-600">Keadaan disiapkan lewat layar berikutnya.</span>
                      )}
                    </TD>
                  </TR>
                )),
              ])}
            </TBody>
          </Table>
        </Bagian>

        <Bagian judul="Jalan pintas alur utama">
          <TabelUc judul="Jalan pintas alur utama use case" daftar={UC} />
        </Bagian>

        <Bagian judul="Enam skenario Bab 10.1">
          <TabelUc judul="Skenario use scenario" daftar={SKENARIO} />
        </Bagian>

        <Bagian judul="Log audit (hanya baca)">
          {log.length === 0 ? (
            <KeadaanKosong judul="Belum ada entri log audit" />
          ) : (
            <Table aria-label="20 entri log audit terakhir" tinggiMaks="22rem">
              <THead>
                <TR>
                  <TH>Waktu</TH>
                  <TH>Aktor</TH>
                  <TH>Aksi</TH>
                  <TH>Objek</TH>
                </TR>
              </THead>
              <TBody>
                {log.map((l) => (
                  <TR key={l.id}>
                    <TD className="angka whitespace-nowrap text-xs">{formatWaktu(l.waktu)}</TD>
                    <TD className="text-xs">{l.aktor}</TD>
                    <TD className="font-mono text-xs">{l.aksi}</TD>
                    <TD className="font-mono text-xs break-all">{l.objek}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
          <p className="mt-2 text-xs text-abu-600">20 entri terakhir; basis data menolak UPDATE dan DELETE pada tabel ini (NFR 3.3).</p>
        </Bagian>

        <p className="mt-8 border-t border-primer-200 pt-4 text-xs text-abu-600">
          Akun demo: dppm-pengelola, dppm-anggota, pengusul-1..3, reviewer-1..6. Data, akun, dan institusi adalah rekaan; BIMA adalah simulasi, bukan sistem resmi.
        </p>
      </main>
    </>
  );
}
