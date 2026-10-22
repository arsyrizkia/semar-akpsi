# KONTRAK bersama agen paralel (A, B, C, D)

Fondasi (agen 0) sudah membangun semua yang tercantum di bagian "Berkas fondasi". Berkas itu adalah kontrak: **jangan diubah**.
Bila butuh perubahan, tuliskan kebutuhannya di laporan akhir Anda (jangan edit sendiri), dan cari jalan memutar di folder milik Anda.

## Aturan

1. **Tidak menambah paket.** Semua dependensi sudah terpasang (`package.json`).
2. **Tidak mengubah berkas fondasi/kontrak** (daftar di bawah). Boleh menambah berkas baru di folder milik sendiri.
3. **Tidak menjalankan `next build` atau `next dev`.** Cukup `npx tsc --noEmit`, `npm run lint`, dan `npx vitest run <berkas tes sendiri>`.
4. **Tidak commit, tidak push.** Orkestrator yang melakukannya.
5. Bahasa antarmuka Bahasa Indonesia; label tombol, isian, dan pesan **persis** seperti `docs/spesifikasi-ui.md` (sumber: `docs/sumber/bab10-use-scenario-real-use-case.md`).
6. Nama fungsi servis sama dengan metode di `docs/sumber/sequence/seq-ucXX.puml` (keputusan 5).
7. Tambahan atau penyimpangan model data dicatat di `docs/perubahan-model.md` (tambah baris, jangan hapus). Skema tabel sendiri dilarang: kebutuhan kolom/tabel baru dilaporkan.
8. Impor lintas agen hanya lewat `@/lib/kontrak`. Server component memakai guard dari `@/lib/auth`. SEMAR memanggil BIMA hanya lewat `@/lib/bima/client` (jangan impor `@/lib/bima/servis` dari kode SEMAR).
9. Semua tindakan penting dicatat dengan `catatLogAudit` (append-only).
10. Kode harus jalan tanpa `BLOB_READ_WRITE_TOKEN` dan `ANTHROPIC_API_KEY` (lihat `src/lib/berkas.ts`, `src/lib/llm/konfigurasi.ts`).

## Kepemilikan

| Agen | Cakupan | Folder/berkas milik |
|---|---|---|
| **A** | UC-01 Templat (J-02), UC-02 Aturan (J-03) | `src/app/(semar)/tim-kerja/templat/**`, `src/app/(semar)/tim-kerja/aturan/**`, `src/lib/templat/**`, `src/lib/aturan/**` (+ tesnya) |
| **B** | UC-03 Penugasan (J-04), UC-04 Pemantauan (J-05) | `src/app/(semar)/tim-kerja/penugasan/**`, `src/app/(semar)/tim-kerja/pemantauan/**`, `src/lib/penugasan/**`, `src/lib/pemantauan/**` (+ tesnya). Entri kontrak: `src/lib/penugasan/index.ts` |
| **C** | UC-05 Pengajuan (BIMA tiruan + J-06), UC-06 Pemeriksa deterministik | `src/app/bima/pengajuan/**`, `src/app/(semar)/pengusul/**`, `src/lib/pemeriksa/deterministik/**`, `src/lib/pengajuan/**` (+ tes vitest). Entri kontrak: `src/lib/pemeriksa/deterministik/index.ts` |
| **D** | UC-07 Daftar & pemeriksaan (J-07, J-08), UC-08 Koreksi, UC-09 Pemeriksa semantik | `src/app/(semar)/reviewer/**`, `src/lib/pemeriksa/semantik/**`, `src/lib/penilaian/**` (+ tesnya). Entri kontrak: `src/lib/pemeriksa/semantik/index.ts` |
| belum ditetapkan | `/demo` (reset/seed, jalan pintas UC-01..09, 6 skenario, sakelar masa pengusulan) | `src/app/demo/**` (stub dari fondasi; dikerjakan setelah A-D) |

Berkas **entri** (`.../index.ts` bertanda "ENTRI AGEN X") dan stub `page.tsx` di folder milik Anda adalah **milik Anda**: ganti isinya.
Nama dan tanda tangan ekspor entri tidak boleh berubah (tipe ada di `src/lib/kontrak/layanan.ts`).

## Berkas fondasi (dibekukan)

- `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`, `scripts/**`, `package.json`, `vercel.json`, `vitest.config.mts`
- `src/lib/kontrak/**` (`tipe.ts`, `layanan.ts`, `index.ts`)
- `src/lib/auth.ts`, `src/lib/sesi.ts`, `src/lib/berkas.ts`, `src/lib/audit.ts`, `src/lib/waktu.ts`, `src/lib/utils.ts`
- `src/lib/seed.ts`, `src/lib/seed-butir.ts`, `src/lib/contoh/**`, `data/contoh/**`
- `src/lib/llm/konfigurasi.ts`
- `src/lib/bima/**` (`client.ts`, `servis.ts`, `api.ts`, `sso.ts`, `sesi.ts`)
- `src/components/ui/**`, `src/components/merek/**`, `src/components/layout/**`
- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/masuk/**`, `src/proxy.ts`
- `src/app/(semar)/layout.tsx` dan `layout.tsx` per peran (`tim-kerja`, `reviewer`, `pengusul`)
- `src/app/bima/layout.tsx`, `src/app/bima/page.tsx`, `src/app/bima/masuk/**`, `src/app/bima/kotak-masuk/**`, `src/app/api/**`

## Peta folder

```
src/
  app/
    masuk/                      J-01 (fondasi)
    (semar)/                    cangkang SEMAR: header, menu per peran, guard sesi
      tim-kerja/{templat,aturan}/   J-02, J-03 (A; hanya pengelola)
      tim-kerja/{penugasan,pemantauan}/  J-04, J-05 (B)
      pengusul/hasil/[idProposal]/  J-06 (C)
      reviewer/penugasan/           J-07 (D)
      reviewer/pemeriksaan/[penugasanId]/  J-08 (D)
    bima/                       BIMA tiruan: masuk, kotak-masuk (fondasi); pengajuan (C)
    api/bima/*                  API BIMA tiruan (x-bima-key); api/sso/*  SSO SEMAR
    demo/                       stub
  components/ui|merek|layout    komponen bertema (lihat di bawah)
  db/                           schema.ts, index.ts (getDb lazy)
  lib/
    kontrak/                    tipe + tanda tangan lintas agen
    bima/client.ts              satu-satunya pintu SEMAR ke BIMA (HTTP, ulang maks 2x)
    pemeriksa/{deterministik,semantik}/  entri C dan D
    penugasan/                  entri B
    templat/, aturan/           A (buat sendiri)
    pemantauan/                 B (buat sendiri)
    pengajuan/, penilaian/      C, D (buat sendiri)
data/contoh/                    data contoh sementara (JSON)
```

## Kontrak fungsi lintas agen (`@/lib/kontrak`)

| Fungsi | Pemilik | Tanda tangan (lihat `layanan.ts`) |
|---|---|---|
| `jalankanPemeriksaanDeterministik(versiId)` | C | simpan hasil_pemeriksaan jenis deterministik; kembalikan `RingkasanPemeriksaanDeterministik` |
| `periksaDeterministikTeks(dokumen, butir[], konteks)` | C | murni (tanpa DB); dipakai UC-06 dan Uji pada Contoh (A) |
| `antrekanPemeriksaanSemantik(versiId)` | D | buat baris `job_semantik`; dipanggil C setelah `catatTerkirim` |
| `jalankanPemeriksaanSemantik(versiId)` | D | UC-09; simpan hasil semantik |
| `nilaiSemantikTeks(dokumen, butir[])` | D | tanpa DB; dipakai UC-09 dan Uji pada Contoh (A) |
| `susunPenugasan(periodeId, batasBeban)` (hasil memuat `jumlahUsulan`; `usulan` hanya halaman pertama, sisanya lewat `ambilUsulan(periodeId, status, { halaman })`) / `pilihReviewer(penugasanId, reviewerBaruId)` | B | UC-03 |
| `catatLogAudit({aktor, aksi, objek?, rincian?})` | fondasi (nyata) | append-only |

Stub awal melempar `Error("belum diimplementasi: <nama>")`.

Skema parameter butir (`butir_cek.parameter`): `ParameterButir` di `tipe.ts` (bagian_wajib, batas_kata, lampiran_wajib, kata_kunci, sitasi_bernomor, pustaka_berurutan, jumlah_referensi_sama, struktur_judul, judul_sama, bagian_terisi, diagram_alir, semantik). Butir turunan templat (`asal = templat`) terkunci: hanya berubah lewat J-02.

## Sesi, peran, dan guard (`@/lib/auth`)

- `ambilSesi()` → `{ akun, pengelola } | null`; `wajibMasuk()`, `wajibPeran(...)`, `wajibTimKerja()`, `wajibPengelola()` (J-02, J-03; NFR 3.2), `wajibReviewer()`, `wajibPengusul()`. Guard melakukan `redirect`.
- Reviewer hanya boleh membuka penugasannya sendiri (NFR 3.1): periksa `penugasan_reviewer.reviewerId === sesi.akun.id` di halaman dan route.
- Alur SSO: `/masuk` (J-01) → `/bima/masuk?kembali=/api/sso/callback` → pilih akun → `/api/sso/callback?token=...` (jose, 2 menit) → cookie `semar_sesi` → halaman awal peran. Pengusul: BIMA tiruan memanggil `urlSsoSemar(idBima, "/pengusul/hasil/<idProposal>")` dari `@/lib/bima/sso`.
- Sisi BIMA: cookie `bima_sesi`; `wajibPengusulBima()` dari `@/lib/bima/sesi`. `proxy.ts` hanya penjaga cepat.

## BIMA tiruan

- Halaman `/bima/*` memuat label tetap "Simulasi BIMA – bukan sistem resmi" (layout). Rute `/bima/pengajuan` kosong untuk C.
- API (butuh header `x-bima-key`): `GET /api/bima/proposal/:id`, `GET /api/bima/berkas/:id`, `GET /api/bima/reviewer`, `POST /api/bima/penugasan`, `POST /api/bima/keputusan`, `POST /api/bima/status`, `GET /api/bima/kotak-masuk`.
- Klien: `bima.ambilProposal(id)`, `bima.ambilBerkas(berkasId)`, `bima.ambilDaftarReviewer()`, `bima.kirimPenugasan(...)`, `bima.kirimKeputusan(...)`, `bima.kirimStatusProposal(id, status)`, `bima.ambilKotakMasuk()`. Kegagalan setelah 3 percobaan (1 + 2 ulang) → `BimaGagalError`; UI menampilkan pesan gagal kirim dan tombol "Kirim ulang".
- Sisi data BIMA diubah hanya dari `src/lib/bima/servis.ts`. Agen C yang membangun halaman pengajuan boleh **menambah** fungsi servis di berkas baru `src/lib/bima/servis-pengajuan.ts` (bukan mengubah `servis.ts`) untuk menyimpan unggahan ke `bima_proposal` dan `bima_berkas` (gunakan `simpanBerkas({ruang:"bima", ...})`).

## Berkas, waktu demo, LLM

- `simpanBerkas({ruang:"semar"|"bima", nama, tipe, bytes, ...})` / `ambilBerkas(ruang, id)` (`@/lib/berkas`): Vercel Blob private bila `BLOB_READ_WRITE_TOKEN`/`BLOB_STORE_ID` ada, selain itu kolom bytea.
- `masaPengusulanBerjalan()`, `waktuDemo()`, `ambilPengaturanDemo()`, `ubahPengaturanDemo()` (`@/lib/waktu`). Sakelar `masaPengusulan` adalah penentu tunggal berjalan/ditutup.
- LLM: `modeLlm()` ("tiruan" bila `SEMAR_LLM_MODE=tiruan` atau key kosong), `modelLlm()` (bawaan `claude-opus-5-5`), `getAnthropic()`, `BATAS_WAKTU_LLM_MS = 15000`, `PERCOBAAN_ULANG_LLM = 2` (`@/lib/llm/konfigurasi`). Hasil mode tiruan wajib `tiruan: true` dan ditampilkan berlabel "tiruan".

## Komponen UI bertema

`@/components/ui`: `Button` (varian utama/emas/garis/hantu/bahaya, `asChild`), `Input`, `Textarea`, `Select` (native), `Field` (label + galat; isian invalid memakai `aria-invalid="true"` → bingkai merah), `Checkbox`, `RadioGroup`/`RadioItem`, `Tabs*`, `Dialog`, `Tooltip`, `Panel`, `JudulHalaman`, `Alert` (info/sukses/peringatan/galat), `Table/THead/TBody/TR/TH/TD`, `Badge`, `StatusBadge` (peta semua status baku), `BarKeyakinan` + `tingkatKeyakinan` (ambang contoh 0,8/0,5). Toast: `import { toast } from "sonner"` (Toaster sudah di layout root).
`@/components/layout/navigator-demo`: `NavigatorDemo` (dipasang sekali di root layout; katalog di `@/lib/demo/katalog`). Panel pemandu langkah lama (`PanelPemandu`) sudah dihapus; tipe `LangkahPemandu` ada di `@/lib/demo/pemandu/tipe`. `@/components/merek`: `SemarIlustrasi`, `LambangSemar`, `LogoSemar`. Kelas CSS `latar-kawung` dan `latar-kawung-terang` untuk motif kawung. Token warna Tailwind: `sogan-*`, `emas-*`, `krem`, `daun-*`, `bata-*`.

## Data contoh (seed)

`npm run seed` (atau `jalankanSeed()` dari `@/lib/seed`, untuk tombol reset di /demo): 2 skema (PD, PT), periode 2026 (buka 21 hari lalu, tutup 14 hari lagi), templat terbit + bagian + butir (turunan templat + katalog Tabel 5.5), akun rekaan, `dokumen_contoh` contoh-a/b/c, tiga proposal Draf di BIMA tiruan (PRP-2026-0001 lolos semua; -0002 gagal jumlah kata Metode; -0003 gagal kata kunci dan sitasi) milik pengusul-1/2/3, dan skenario siap-reviewer: PRP-2026-0004 sudah Terkirim (hasil deterministik Lolos, `job_semantik` Menunggu) dengan penugasan Ditetapkan ke `reviewer-2`.
`jalankanSeed` mengosongkan semua tabel **kecuali `log_audit`**. Akun demo: `dppm-pengelola`, `dppm-anggota`, `pengusul-1..3`, `reviewer-1..6` (reviewer-6 tidak bersedia).
Berkas contoh dapat dibuat ulang ke disk: `npm run contoh:proposal` → `data/contoh/proposal/<varian>/`.

## Perintah penting

```bash
npx tsc --noEmit        # tipe
npm run lint
npx vitest run tests/<berkas>.test.ts
npm run db:push         # hanya fondasi
npm run seed            # reset + isi data contoh
```
