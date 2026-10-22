# Desain sistem SEMAR: "Sogan tenang"

Sumber: arahan Arsy 22 Okt 2026 (`docs/arah-perbaikan-2026-10-22.md`), dikerjakan dengan skill `ui-ux-pro-max` (`--design-system "internal government research grant administration tool, document review, Indonesian"`) lalu disesuaikan. Rekomendasi mentah skill: gaya *Accessible & Ethical* (cocok untuk pemerintahan, kontras tinggi, fokus terlihat, 16px+), pola alat kerja berpusat tabel, tanpa dekorasi. Yang diambil: gaya aksesibel dan larangan "tenggat tersembunyi/berkas terkubur". Yang diganti: palet biru-hijau generik diganti palet sogan; pasangan huruf EB Garamond/Lato diganti Outfit.

Aplikasi ini **alat kerja kantor**, bukan halaman pamer. Identitas Semar ada di area merek (sidebar atas), bukan di area kerja.

## 1. Warna

Token ada di `src/app/globals.css` (`@theme`). Kelas Tailwind: `bg-sogan-700`, `text-sogan-900`, dst. Warna tidak pernah satu-satunya pembawa makna: status selalu berupa teks (dan ikon kecil).

| Peran | Token | Nilai | Dipakai untuk |
|---|---|---|---|
| Latar halaman | `krem` | `#faf7f1` | permukaan netral hangat |
| Permukaan | `white` | `#ffffff` | tabel, modal, isian |
| Latar bagian lembut | `sogan-50` / `abu-50` | `#f7f0e6` / `#f4f1eb` | kepala tabel, ringkasan |
| Garis | `sogan-200` | `#dcc3a0` | pemisah dan bingkai tabel |
| Teks utama | `sogan-900` | `#2b190e` | isi |
| Teks judul | `sogan-800` | `#3f2616` | judul dan label |
| Teks redup | `sogan-700` / `abu-600` | `#573620` / `#6b6357` | keterangan, breadcrumb |
| **Primer** | `sogan-700` (hover `sogan-800`) | `#573620` | tombol utama, sidebar (`sogan-800`) |
| **Aksen emas** | `emas-400` / `emas-500` | `#d4a63a` / `#b8892a` | penanda menu aktif, tab aktif, sorotan baris; **tidak** untuk tombol besar atau latar |
| Fokus | `emas-700` | `#6f5013` | cincin fokus 3 px + halo krem |
| Lolos / Memenuhi | `daun-700` di `daun-100` | `#234d2c` / `#ddebdd` | status berhasil |
| Gagal / Tidak memenuhi | `bata-700` di `bata-100` | `#7a2d1d` / `#f6ddd5` | status gagal, galat |
| Perlu ditinjau / sedang | `emas-700` di `emas-50` | `#6f5013` / `#fbf3dc` | peringatan |
| Netral | `abu-700` di `abu-100` | `#4a4339` / `#ebe7df` | Draf, Arsip, Nonaktif, Belum ada rekomendasi |

### Kontras (diukur dengan rumus WCAG 2.x, minimum teks 4,5 : 1)

| Pasangan | Rasio |
|---|---:|
| teks utama `sogan-900` / `krem` | 15,7 |
| teks redup `sogan-700` / `krem` | 10,1 |
| tombol utama `krem` / `sogan-700` | 10,1 |
| menu `krem-200` / `sogan-800` (sidebar) | 10,6 |
| `emas-300` / `sogan-800` | 7,9 |
| Lolos `daun-700` / `daun-100` | 7,8 |
| Gagal `bata-700` / `bata-100` | 7,3 |
| Perlu ditinjau `emas-700` / `emas-50` | 6,7 |
| Netral `abu-700` / `abu-100` | 7,9 |
| galat `bata-600` / `krem` | 6,5 |
| tombol bahaya putih / `bata-600` | 7,0 |
| cincin fokus `emas-700` / putih | 7,4 (syarat 3 : 1) |
| placeholder `sogan-500` / putih | 5,6 |

Mode gelap tidak dibuat (prototipe alat kerja siang hari; dicatat sebagai batasan).

### Motif kawung
Hanya di area merek: blok logo sidebar (`.latar-kawung`) dan layar masuk J-01 (`.latar-kawung-terang`). Area kerja tanpa motif.

## 2. Tipografi

- **Outfit** (Google Fonts, `next/font/google`, huruf variabel, subset latin) untuk wordmark, judul, dan teks UI. Cormorant Garamond dan Plus Jakarta Sans **dihapus**. Tidak ada font serif sama sekali.
- **Angka tabel:** Outfit memiliki fitur OpenType `tnum` (diperiksa pada berkas sumber dan pada subset latin hasil `next/font`: `tnum` dan `pnum` ada). Maka angka tabel memakai `font-variant-numeric: tabular-nums` (kelas `.angka`, atau `<TD angka>`/`<TH angka>`). Tidak perlu font angka sekunder. Bila di kemudian hari subset kehilangan `tnum`, cadangannya `ui-monospace` untuk sel angka.
- Skala (rem): isi 1 (16 px) tinggi baris 1,55; tabel dan modal 0,875; keterangan 0,75; judul halaman 1,5 (600); judul bagian 1 (600); wordmark 1,5 (700). Judul memakai `text-wrap: balance`.
- Kode jendela (J-xx, M-xx): `font-mono`, 11–12 px, abu hangat.

## 3. Jarak, radius, bayangan

- Skala jarak Tailwind kelipatan 4 px: 4, 8, 12, 16, 24, 32. Antarbagian 32 px (`mt-8`), antarisian 16 px, padding sel tabel 12 × 8 px. Gutter halaman 16 px (24 px mulai `sm`), lebar isi maks 72 rem.
- Radius: `sm` 4 px (lencana, kotak centang), `md` 6 px (tombol, isian, tabel), `lg` 8 px (modal). Tidak ada radius besar atau pil kecuali pil navigator demo.
- Bayangan minimal: `--shadow-sm` hanya bila perlu; `--shadow-overlay` untuk modal, sheet, laci, dan navigator. Kartu biasa tidak berbayangan.

## 4. Komponen (`src/components/ui`)

| Komponen | Catatan |
|---|---|
| `Tombol` (`Button`) | Varian `utama` (satu per layar), `sekunder`, `hantu`, `bahaya`; `memuat` memutar ikon, menonaktifkan, dan `aria-busy`. `emas` dan `garis` tinggal alias (utama, sekunder). Tinggi 32/40/44 px. |
| `Modal` | Radix Dialog: fokus terjebak, Esc, fokus kembali ke pemicu, `aria-labelledby` dari judul, ukuran `sm`/`md`/`lg`, slot `kaki`, `kode` M-xx kecil. Galat modal tampil di dalam modal. |
| `ModalKonfirmasi` | Ringkasan + "Batal" + tombol konfirmasi (label persis spesifikasi); `bahaya`, `memuat`, `galat`. |
| `Sheet` | Panel kanan (M-08), perilaku fokus sama dengan Modal. |
| `Notifikasi` / `beriTahu` | Sonner (wilayah `aria-live`), tema sogan; galat bertahan 8 detik. Dipasang sekali di root. |
| `Table`, `THead`, `TBody`, `TR`, `TH`, `TD` | Padat; kepala lengket (`tinggiMaks` bila perlu menggulir); `angka` untuk kolom angka (rata kanan, tabular); `TR tersorot` (garis emas di kiri, `aria-current`). Tanpa bingkai ganda. |
| `Paginasi` | Berbasis URL (`?halaman=`), pertahankan parameter lain; komponen klien, bungkus dengan `Suspense`. |
| `LencanaStatus` (`StatusBadge`) | Peta status baku → warna + ikon (centang, silang, segitiga, strip) + teks. |
| `KeadaanKosong` | Satu kalimat yang belum ada + satu tindakan. |
| `Isian`, `Pilihan`, `KotakCentang` | Label terhubung, penanda wajib, petunjuk atau **galat tepat di bawah isian** (`aria-invalid`, `aria-describedby`, bingkai merah). `Field`/`Input`/`Select` lama tetap ada. |
| `TombolUnduh` | Tautan bergaya tombol dengan ikon unduh; nama berkas dari `Content-Disposition`. |
| `Tabs*` (`Tab`) | Garis bawah emas pada tab aktif, tanpa bingkai. |
| `Bagian` (`Panel` lama) | Pengelompokan dengan judul kecil 16 px; tanpa kartu, tanpa bingkai ganda, tanpa judul serif. `bingkai` hanya bila isi memang perlu permukaan. |
| `KepalaHalaman` (`JudulHalaman` lama) | Breadcrumb + chip kode J-xx kecil, judul, ≤ 1 baris keterangan, slot `aksi` di kanan. |
| `Alert` | Garis kiri 4 px berwarna + ikon; galat/peringatan diumumkan (`role=alert`). |
| `CangkangSemar` (`components/layout`) | Sidebar per peran (lebar 16 rem) dengan blok merek berkawung, menu, identitas + "Keluar", label "contoh sementara" kecil di kaki. Di bawah 1024 px menjadi laci. Tautan "Lewati ke isi". Menu per peran dari `src/lib/menu.ts`. |

Judul tab: `export const metadata = { title: "J-xx Nama" }` di setiap `page.tsx`; templat root menambahkan " · SEMAR".

## 5. Pola layar

1. Cangkang: sidebar kiri, isi di kanan. Pengusul tanpa menu.
2. `KepalaHalaman` dengan breadcrumb; aksi utama (satu) di kanan atas.
3. Filter/pilihan (skema, periode, tab, halaman) tersimpan di URL (tombol Back bekerja).
4. Isi: `Bagian` dengan judul kecil; tabel padat langsung di permukaan tanpa kartu pembungkus.
5. Form pendek dan konfirmasi = **modal**; isi yang besar = **layar terpisah** (J-xx). Rincian samping = `Sheet`.
6. Sesudah aksi: `beriTahu` (toast) dan, bila ada langkah wajar berikutnya, tautannya.
7. Catatan skenario demo tidak ada di badan halaman: ada di panel Navigator Demo.
8. BIMA tiruan tetap bergaya abu-slate berbeda dari SEMAR dengan label "Simulasi BIMA – bukan sistem resmi".

## 6. Larangan (anti "AI slop")

- Semua isi dibungkus kartu berbingkai dengan judul serif; kartu di dalam kartu.
- Banner penjelas di badan halaman; paragraf deskripsi panjang di bawah judul (maks 1 baris).
- Label kode jendela besar di atas judul (kode hanya chip kecil).
- Gradien, glow, bayangan tebal, emoji sebagai ikon, lencana berlebihan, halaman muka bergaya *landing page*.
- Warna sebagai satu-satunya penanda status; font serif; motif kawung di area kerja.
- Form pendek atau konfirmasi inline yang seharusnya modal; isi layar terpisah ditumpuk di satu layar.
- `transition: all`; animasi tanpa menghormati `prefers-reduced-motion` (sudah dimatikan global).

## 7. Pre-delivery checklist (ui-ux-pro-max + web-design-guidelines)

- [ ] Kontras teks ≥ 4,5 : 1, ikon penting dan batas kontrol ≥ 3 : 1 (tabel di atas).
- [ ] Fokus terlihat di semua kontrol (`:focus-visible`, 3 px); tidak ada `outline: none` tanpa pengganti.
- [ ] Tombol ikon punya `aria-label`; ikon dekoratif `aria-hidden`.
- [ ] Label terhubung ke isian; galat tepat di dekat isian; `aria-invalid`/`aria-describedby`.
- [ ] Modal: fokus terjebak, Esc, fokus kembali, judul sebagai `aria-labelledby`; `overscroll-behavior: contain`.
- [ ] Hirarki judul h1 → h2 berurutan; tautan lewati ke isi.
- [ ] Status = teks + ikon + warna.
- [ ] Angka tabel tabular dan rata kanan; tanggal/angka lewat `Intl` (id-ID, WIB).
- [ ] Tidak ada gulir horizontal pada 375 px; laci menggantikan sidebar di bawah 1024 px.
- [ ] `prefers-reduced-motion` dihormati; transisi hanya `colors`/`opacity`.
- [ ] Keadaan kosong, memuat, dan galat ada pada tiap tabel/daftar.
- [ ] Aksi merusak lewat modal konfirmasi; unduhan lewat tautan (`TombolUnduh`).
- [ ] Judul tab "J-xx Nama · SEMAR"; kode jendela hanya chip kecil.
- [ ] `touch-action: manipulation`, target sentuh ≥ 40 px (tombol md) pada kontrol utama.
