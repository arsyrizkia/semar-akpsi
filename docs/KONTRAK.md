# KONTRAK bersama agen paralel (putaran 22 Okt 2026: A, B, C, D)

Fondasi (agen Fondasi) sudah membangun semua yang tercantum di bagian "Berkas fondasi". Berkas itu adalah kontrak: **jangan diubah**.
Bila butuh perubahan, tuliskan kebutuhannya di laporan akhir Anda (jangan edit sendiri), dan cari jalan memutar di folder milik Anda.
Acuan: `docs/arah-perbaikan-2026-10-22.md` (inventaris layar dan modal), `docs/desain-sistem.md` (tampilan "Sogan tenang"), `docs/spesifikasi-ui.md` (label persis).

## Aturan

1. **Tidak menambah paket.** Semua dependensi sudah terpasang (`package.json`, termasuk `docx` dan `@vitest/coverage-v8`).
2. **Tidak mengubah berkas fondasi/kontrak** (daftar di bawah). Boleh menambah berkas baru di folder milik sendiri.
3. **Tidak menjalankan `next build` atau `next dev`.** Cukup `npx tsc --noEmit`, `npm run lint`, dan `npx vitest run <berkas tes sendiri>`.
4. **Tidak commit, tidak push.** Orkestrator yang melakukannya.
5. Bahasa antarmuka Bahasa Indonesia; label tombol, isian, dan pesan **persis** seperti `docs/spesifikasi-ui.md` (sumber: `docs/sumber/bab10-use-scenario-real-use-case.md`).
6. Nama fungsi servis sama dengan metode di `docs/sumber/sequence/seq-ucXX.puml` (keputusan 5).
7. Tambahan atau penyimpangan model data dicatat di `docs/perubahan-model.md` (tambah baris, jangan hapus). Skema tabel sendiri dilarang: kebutuhan kolom/tabel baru dilaporkan.
8. Impor lintas agen hanya lewat `@/lib/kontrak`. Server component memakai guard dari `@/lib/auth`. SEMAR memanggil BIMA hanya lewat `@/lib/bima/client` (jangan impor `@/lib/bima/servis` dari kode SEMAR).
9. Semua tindakan penting dicatat dengan `catatLogAudit` (append-only).
10. Kode harus jalan tanpa `BLOB_READ_WRITE_TOKEN` dan `ANTHROPIC_API_KEY` (lihat `src/lib/berkas.ts`, `src/lib/llm/konfigurasi.ts`).
11. **Antarmuka:** pakai komponen `@/components/ui` dan token `docs/desain-sistem.md`; jangan membuat kartu berbingkai, banner penjelas, atau font serif. Setiap layar: `KepalaHalaman` (kode, judul, remah, aksi), `export const metadata = { title: "J-xx Nama" }`. Form pendek dan konfirmasi = `Modal`/`ModalKonfirmasi` (kode M-xx); rincian samping = `Sheet`; hasil aksi = `beriTahu`. Pilihan (skema, periode, tab, halaman) disimpan di URL. Pakai skill `.claude/skills/ui-ux-pro-max`, `design-system`, `ui-styling`, `vercel-react-best-practices`, `vercel-composition-patterns`; audit akhir `web-design-guidelines`.
12. **Tes:** setiap fungsi baru punya uji *black box* dan *white box* (Dennis dkk., 2015, hlm. 469-475). Berkas di `tests/unit/kotak-hitam/` (ID `KH-<kelas>-<nn>`) dan `tests/unit/kotak-putih/` (ID `KP-<metode>-<nn>`), nama berkas diawali nama area (`templat-`, `aturan-`, `penugasan-`, `pemantauan-`, `penilaian-`, `semantik-`, `pengajuan-`, `deterministik-`). Judul `it(...)` **diawali ID** (contoh: `it("KH-hitungKata-04: tepat pada batas lolos", ...)`); ID berurutan per kelas dan tidak dipakai ulang. Pakai stub `tests/unit/stub/bima.ts` dan `tests/unit/stub/llm.ts` untuk BIMA dan LLM. Uji yang butuh basis data nyata ke `tests/integrasi/` (ID `IT-...`, `describe.skipIf(!ada)`). Cakupan cabang `src/lib/**` minimal 80% (`npm run test:coverage`; pengecualian di `vitest.config.mts`). Jalankan `npm run laporan-uji` untuk membangkitkan `docs/laporan-uji.md`.

## Kepemilikan

| Agen | Cakupan | Folder/berkas milik |
|---|---|---|
| **A** | UC-01 Templat (J-02, J-02b), UC-02 Aturan (J-03, J-03b) | `src/app/(semar)/tim-kerja/templat/**` (termasuk `[idTemplat]/susun`, J-02b), `src/app/(semar)/tim-kerja/aturan/**` (termasuk `uji`, J-03b), `src/lib/templat/**` **kecuali `dokumen.ts`**, `src/lib/aturan/**`; tes berawalan `templat-`, `aturan-` |
| **B** | UC-03 Penugasan (J-04, J-04b), UC-04 Pemantauan (J-05, J-05b) | `src/app/(semar)/tim-kerja/penugasan/**` (termasuk `[idPeriode]`, J-04b), `src/app/(semar)/tim-kerja/proposal/**` (J-05b), `src/app/(semar)/tim-kerja/pemantauan/**`, `src/lib/penugasan/**`, `src/lib/pemantauan/**`; tes berawalan `penugasan-`, `pemantauan-`. Entri kontrak: `src/lib/penugasan/index.ts` |
| **C** | UC-07 Daftar & pemeriksaan (J-07, J-08, J-08b), UC-08 Koreksi, UC-09 Pemeriksa semantik | `src/app/(semar)/reviewer/**` (termasuk `pemeriksaan/[penugasanId]/keputusan`, J-08b), `src/lib/pemeriksa/semantik/**`, `src/lib/penilaian/**`; tes berawalan `penilaian-`, `semantik-`. Entri kontrak: `src/lib/pemeriksa/semantik/index.ts` |
| **D** | UC-05 Pengajuan (BIMA tiruan), UC-06 Pemeriksa deterministik, J-01, demo | `src/app/bima/**` (kecuali `src/app/api/**` dan berkas BIMA fondasi di bawah), `src/app/masuk/**`, `src/app/(semar)/pengusul/**`, `src/app/demo/**`, `src/components/layout/navigator-demo.tsx`, `src/lib/demo/**`, `src/lib/pemeriksa/deterministik/**`, `src/lib/pengajuan/**`; tes berawalan `pengajuan-`, `deterministik-`. Entri kontrak: `src/lib/pemeriksa/deterministik/index.ts` |

Berkas **entri** (`.../index.ts` bertanda "ENTRI AGEN X") dan stub `page.tsx` bertanda "MILIK AGEN X" di folder milik Anda adalah **milik Anda**: ganti isinya.
Nama dan tanda tangan ekspor entri tidak boleh berubah (tipe ada di `src/lib/kontrak/layanan.ts`).
Tombol unduh dipasang oleh pemilik layar: J-02 dan J-02b (A: `/api/semar/templat/[idTemplat]/unduh`), J-05b (B) dan J-08 (C) ("Unduh Berkas": `/api/semar/proposal/[idProposal]/berkas/[idBerkas]`), BIMA pengajuan (D: `/api/semar/templat/berlaku/[idSkema]/unduh`). Pakai `<TombolUnduh href=...>`.

## Berkas fondasi (dibekukan)

- **Data dan konfigurasi:** `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`, `scripts/**`, `package.json`, `vercel.json`, `vitest.config.mts`, `eslint.config.mjs`
- **Kontrak dan pustaka:** `src/lib/kontrak/**` (`tipe.ts`, `layanan.ts`, `index.ts`), `src/lib/auth.ts`, `src/lib/sesi.ts`, `src/lib/berkas.ts`, `src/lib/audit.ts`, `src/lib/waktu.ts`, `src/lib/utils.ts`, `src/lib/menu.ts`, `src/lib/unduhan.ts`, `src/lib/unduhan-db.ts`, `src/lib/seed.ts`, `src/lib/seed-butir.ts`, `src/lib/contoh/**`, `data/contoh/**`, `src/lib/llm/konfigurasi.ts`, `src/lib/bima/**` (`client.ts`, `servis.ts`, `api.ts`, `sso.ts`, `sesi.ts`; D boleh menambah `servis-pengajuan.ts`)
- **Generator unduhan:** `src/lib/templat/dokumen.ts` (`buatDokumenTemplat`, `bagianDokumen`, `namaBerkasTemplat`, `panduanBagian`; dikecualikan dari kepemilikan A)
- **Tampilan:** `src/components/ui/**` (button, form, modal, notifikasi, paginasi, panel, table, tampilan, badge, unduh, bar-keyakinan), `src/components/merek/**`, `src/components/layout/**` (`cangkang.tsx`, `pesan-galat.tsx`; `navigator-demo.tsx` dan `header-bima.tsx` milik D sejak putaran 22 Okt), `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx` (`/` mengarah ke `/masuk`)
- **Rute:** `src/app/(semar)/layout.tsx` dan `layout.tsx` per peran (`tim-kerja`, `reviewer`, `pengusul`), `src/app/bima/page.tsx`, `src/app/api/**` di bawah (`src/app/bima/layout.tsx`, `src/app/bima/masuk/**`, `src/app/bima/kotak-masuk/**` dan `header-bima.tsx` dialihkan ke D pada putaran 22 Okt karena tampilan BIMA tiruan sengaja berbeda dari SEMAR), `src/app/api/**` (termasuk `api/semar/templat/[idTemplat]/unduh`, `api/semar/templat/berlaku/[idSkema]/unduh`, `api/semar/proposal/[idProposal]/berkas/[idBerkas]`), `src/proxy.ts`
- **Infrastruktur uji:** `tests/unit/stub/bima.ts`, `tests/unit/stub/llm.ts`, `scripts/laporan-uji.ts`, konfigurasi cakupan di `vitest.config.mts`. Tes lama sudah dipindah dan diberi ID: lihat `tests/unit/kotak-hitam/`, `tests/unit/kotak-putih/`, `tests/integrasi/` (agen boleh memperluas tes di berkas berawalan areanya).
- **Desain:** `docs/desain-sistem.md`

## Peta folder

```
src/
  app/
    masuk/                      J-01 (fondasi)
    (semar)/                    cangkang SEMAR: header, menu per peran, guard sesi
      tim-kerja/templat/ (+ [idTemplat]/susun)   J-02, J-02b (A; hanya pengelola)
      tim-kerja/aturan/ (+ uji)                  J-03, J-03b (A; hanya pengelola)
      tim-kerja/penugasan/ (+ [idPeriode])       J-04, J-04b (B)
      tim-kerja/pemantauan/, tim-kerja/proposal/[idProposal]   J-05, J-05b (B)
      pengusul/hasil/[idProposal]/  J-06 (D)
      reviewer/penugasan/           J-07 (C)
      reviewer/pemeriksaan/[penugasanId]/ (+ keputusan)  J-08, J-08b (C)
    bima/                       BIMA tiruan: masuk, kotak-masuk (fondasi); pengajuan (D)
    api/bima/*                  API BIMA tiruan (x-bima-key); api/sso/*  SSO SEMAR
    api/semar/*                 unduhan: templat (.docx) dan berkas proposal (fondasi)
    demo/                       Pusat Demo (D)
  components/ui|merek|layout    komponen bertema (lihat di bawah)
  db/                           schema.ts, index.ts (getDb lazy)
  lib/
    kontrak/                    tipe + tanda tangan lintas agen
    bima/client.ts              satu-satunya pintu SEMAR ke BIMA (HTTP, ulang maks 2x)
    pemeriksa/{deterministik,semantik}/  entri D (deterministik) dan C (semantik)
    penugasan/                  entri B
    templat/, aturan/           A (buat sendiri)
    pemantauan/                 B (buat sendiri)
    pengajuan/ (D), penilaian/ (C)  (buat sendiri)
data/contoh/                    data contoh sementara (JSON)
```

## Kontrak fungsi lintas agen (`@/lib/kontrak`)

| Fungsi | Pemilik | Tanda tangan (lihat `layanan.ts`) |
|---|---|---|
| `jalankanPemeriksaanDeterministik(versiId)` | D | simpan hasil_pemeriksaan jenis deterministik; kembalikan `RingkasanPemeriksaanDeterministik` |
| `periksaDeterministikTeks(dokumen, butir[], konteks)` | D | murni (tanpa DB); dipakai UC-06 dan Uji pada Contoh (A) |
| `antrekanPemeriksaanSemantik(versiId)` | C | buat baris `job_semantik`; dipanggil D setelah `catatTerkirim` |
| `jalankanPemeriksaanSemantik(versiId)` | C | UC-09; simpan hasil semantik |
| `nilaiSemantikTeks(dokumen, butir[])` | C | tanpa DB; dipakai UC-09 dan Uji pada Contoh (A) |
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

- Halaman `/bima/*` memuat label tetap "Simulasi BIMA – bukan sistem resmi" (layout). Rute `/bima/pengajuan` dikerjakan D.
- API (butuh header `x-bima-key`): `GET /api/bima/proposal/:id`, `GET /api/bima/berkas/:id`, `GET /api/bima/reviewer`, `POST /api/bima/penugasan`, `POST /api/bima/keputusan`, `POST /api/bima/status`, `GET /api/bima/kotak-masuk`.
- Klien: `bima.ambilProposal(id)`, `bima.ambilBerkas(berkasId)`, `bima.ambilDaftarReviewer()`, `bima.kirimPenugasan(...)`, `bima.kirimKeputusan(...)`, `bima.kirimStatusProposal(id, status)`, `bima.ambilKotakMasuk()`. Kegagalan setelah 3 percobaan (1 + 2 ulang) → `BimaGagalError`; UI menampilkan pesan gagal kirim dan tombol "Kirim ulang".
- Sisi data BIMA diubah hanya dari `src/lib/bima/servis.ts`. Agen D yang membangun halaman pengajuan boleh **menambah** fungsi servis di berkas baru `src/lib/bima/servis-pengajuan.ts` (bukan mengubah `servis.ts`) untuk menyimpan unggahan ke `bima_proposal` dan `bima_berkas` (gunakan `simpanBerkas({ruang:"bima", ...})`).

## Berkas, waktu demo, LLM

- `simpanBerkas({ruang:"semar"|"bima", nama, tipe, bytes, ...})` / `ambilBerkas(ruang, id)` (`@/lib/berkas`): Vercel Blob private bila `BLOB_READ_WRITE_TOKEN`/`BLOB_STORE_ID` ada, selain itu kolom bytea.
- `masaPengusulanBerjalan()`, `waktuDemo()`, `ambilPengaturanDemo()`, `ubahPengaturanDemo()` (`@/lib/waktu`). Sakelar `masaPengusulan` adalah penentu tunggal berjalan/ditutup.
- LLM: `modeLlm()` ("tiruan" bila `SEMAR_LLM_MODE=tiruan` atau key kosong), `modelLlm()` (bawaan `claude-opus-5-5`), `getAnthropic()`, `BATAS_WAKTU_LLM_MS = 15000`, `PERCOBAAN_ULANG_LLM = 2` (`@/lib/llm/konfigurasi`). Hasil mode tiruan wajib `tiruan: true` dan ditampilkan berlabel "tiruan".

## Komponen UI bertema

Rincian dan aturan pakai: `docs/desain-sistem.md`. Semua dari `@/components/ui`:

- **Tombol** `Button`/`Tombol` (`varian`: utama, sekunder, hantu, bahaya; `emas` dan `garis` alias lama; `memuat`, `asChild`), `TombolUnduh` (`href`, tautan unduhan), `kelasTombol()`.
- **Isian:** `Isian` (`label`, `petunjuk`, `galat`, `wajib`, `multibaris`), `Pilihan`, `KotakCentang` (galat tepat di bawah isian; `aria-invalid`), serta `Input`, `Textarea`, `Select` (native), `Field`, `Checkbox`, `RadioGroup`/`RadioItem`.
- **Lapisan:** `Modal` (`buka`, `saatUbah`, `judul`, `deskripsi`, `ukuran` sm/md/lg, `kaki`, `kode`), `ModalKonfirmasi` (`labelKonfirmasi`, `bahaya`, `memuat`, `saatKonfirmasi`, `galat`), `Sheet` (panel kanan), `Dialog` (= `Modal`), `Tooltip`. Notifikasi: `beriTahu.sukses|galat|peringatan|info` (atau `toast` dari `sonner`); `<Notifikasi />` sudah di root layout.
- **Tabel:** `Table` (`tinggiMaks` untuk kepala lengket), `THead`, `TBody`, `TR` (`tersorot`), `TH`/`TD` (`angka` = rata kanan tabular), `Paginasi` (`halaman`, `jumlahHalaman`; berbasis URL, bungkus `Suspense`).
- **Status:** `LencanaStatus` (= `StatusBadge`; peta status baku → warna + ikon + teks), `Badge`, `warnaStatus()`, `BarKeyakinan` + `tingkatKeyakinan`.
- **Struktur:** `KepalaHalaman` (`kode`, `judul`, `keterangan` maks satu baris, `remah`, `aksi`) dan `JudulHalaman` lama (`kode`, `judul`, `deskripsi`); `Bagian` (judul kecil tanpa kartu; `Panel` lama = `Bagian`); `KeadaanKosong`; `Alert`; `Tabs*`/`Tab`.
- **Cangkang:** `@/components/layout/cangkang` (`CangkangSemar`) dirakit di `(semar)/layout.tsx`; menu per peran dari `@/lib/menu` (`menuUntukPeran`, `itemAktif`). Layar tidak membuat header/menu sendiri.
- **Navigator demo:** `@/components/layout/navigator-demo` (`NavigatorDemo`, dipasang sekali di root layout; katalog di `@/lib/demo/katalog`). Catatan skenario (`?catatan=`) tampil di panel navigator, bukan di badan halaman; komponen `CatatanSkenario` dihapus. Tipe `LangkahPemandu` ada di `@/lib/demo/pemandu/tipe`.
- **Merek:** `@/components/merek`: `SemarIlustrasi`, `LambangSemar`, `LogoSemar`. Kelas CSS `latar-kawung` dan `latar-kawung-terang` **hanya** untuk area merek. Token warna Tailwind: `sogan-*`, `emas-*`, `krem`, `abu-*`, `daun-*`, `bata-*`. Font: Outfit (`--font-outfit`); tidak ada font serif.

## Unduhan (rute fondasi)

| Rute | Siapa | Hasil |
|---|---|---|
| `GET /api/semar/templat/[idTemplat]/unduh` | Tim Kerja pengelola (selain itu 401/403) | `.docx` templat versi itu (Draf/Terbit/Arsip), nama `Templat-<kode>-v<n>-<status>.docx` |
| `GET /api/semar/templat/berlaku/[idSkema]/unduh` | sesi SEMAR atau sesi BIMA mana pun; `idSkema` = id atau kode skema | `.docx` templat Terbit terbaru skema; 404 bila belum ada |
| `GET /api/semar/proposal/[idProposal]/berkas/[idBerkas]` | Tim Kerja; reviewer hanya bila ditugaskan pada proposal itu; selain itu 403 (dicatat) | berkas naskah/lampiran dari Blob atau basis data; `idProposal` = id BIMA (mis. PRP-2026-0004) atau id baris |

Semua mengirim `Content-Disposition: attachment` (filename ASCII + `filename*` UTF-8), `Cache-Control: private, no-store`, dan mencatat `catatLogAudit` (`templat.unduh`, `berkas.unduh`, `akses.ditolak`). `idBerkas` adalah `berkas_versi.id` (naskah versi SEMAR) atau `bima_berkas.id` milik proposal itu (naskah/lampiran).
Generator: `buatDokumenTemplat(templat, bagian, lampiran, skema, periode)` di `src/lib/templat/dokumen.ts`; hasilnya terbaca balik oleh `potongPerBagian` dengan bagian yang sama (`bagianDokumen()` memberi daftar efektif, termasuk "Kata Kunci" dan "Daftar Pustaka" bila belum ada).

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
