# Desain sistem SEMAR: "Sogan tenang" (tata letak) dengan palet Kemdiktisaintek

Sumber: arahan Arsy 22 Okt 2026 (`docs/arah-perbaikan-2026-10-22.md`), dikerjakan dengan skill `ui-ux-pro-max` (`--design-system "internal government research grant administration tool, document review, Indonesian"`) lalu disesuaikan. Rekomendasi mentah skill: gaya *Accessible & Ethical* (cocok untuk pemerintahan, kontras tinggi, fokus terlihat, 16px+), pola alat kerja berpusat tabel, tanpa dekorasi. Yang diambil: gaya aksesibel dan larangan "tenggat tersembunyi/berkas terkubur". Yang diganti: palet biru-hijau generik semula diganti palet sogan, lalu (22 Okt 2026, sesudah arah lanjutan) warna utama diganti palet Kemdiktisaintek dengan sogan/emas sebagai aksen merek (bagian 1); pasangan huruf EB Garamond/Lato diganti Outfit.

Aplikasi ini **alat kerja kantor**, bukan halaman pamer. Identitas Semar ada di area merek (sidebar atas), bukan di area kerja.

## 1. Warna

Keputusan Arsy 22 Okt 2026 (`docs/arah-lanjutan-2026-10-22.md` bagian A): **warna utama diambil dari palet situs Kemdiktisaintek** (hex dibaca dari CSS situs resmi; yang dipinjam hanya warnanya, tanpa logo atau nama), sedangkan **Sogan dan emas menjadi aksen identitas Semar** di area merek. Tata letak "Sogan tenang" dan font Outfit tidak berubah.

Token ada di `src/app/globals.css` (`@theme`). Kelas Tailwind memakai nama semantik: `bg-primer-700`, `text-primer-900`, `border-aksen-300`, dan seterusnya. Nama lama `sogan-*`, `emas-*`, `krem*` sudah dihapus (dulu `sogan-*` berisi cokelat dan dipakai sebagai primer; kini cokelat hanya `merek-semar-*`).

### 1.1 Skala token

| Kelompok | Token → nilai | Peran |
|---|---|---|
| `primer` (biru Kemdiktisaintek) | 50 `#E7EDFA` · 100 `#D3E1F6` · 200 `#BED8FF` · 300 `#7FB2F0` · 400 `#1F86FF` · 500 `#1A75E0` · 600 `#0A5FC6` · 700 `#0050AD` · 800 `#003366` · 850 `#002550` · 900 `#00162F` | 50 latar lembut (baris tersorot, kepala tabel, info); 200 garis; 400 elemen besar, ikon, cincin fokus, garis tab aktif; 500 batas kontrol sekunder; 600 placeholder dan hover tautan; **700 tombol utama dan tautan (bergaris bawah)**; 800 judul, hover tombol utama, penanda menu aktif; 850 sidebar dan area merek; 900 teks isi |
| `aksen` (emas) | 100 `#FDE9C4` · 300 `#FBBD61` · 400 `#F2A93B` · 500 `#B8892A` · 700 `#6F5013` | **hanya area merek**: wordmark SEMAR, tagline J-01, penanda menu aktif di sidebar, cincin medali ilustrasi, ikon pil navigator. Bukan warna status |
| `merek-semar` (sogan) | 100 `#EEDFCB` · 300 `#C6A073` · 500 `#8A5E36` · 600 `#6F4727` · 700 `#573620` · 900 `#2B190E` · kulit `#E8C98A` · kulit-tua `#D9A35F` | ilustrasi dan lambang Semar (SVG memakai kelas `fill-merek-semar-*`), wordmark di latar terang |
| `latar` | `#F4F7FC` · 100 `#EAF0F9` · 200 `#D6E4F7` | latar halaman, permukaan lembut, teks pada navy |
| `abu` (netral dingin) | 50 `#F1F4F8` · 100 `#E6EBF1` · 200 `#D3DAE4` · 600 `#5A6577` · 700 `#3F4A5A` | status netral (Draf, Arsip, Nonaktif, Baru, Sedang diperiksa), **teks redup**: keterangan, meta, label `dt`, petunjuk isian, deskripsi modal (token semantik `teks-redup` = `abu-600`) |
| `daun` | 100 `#DDEBDD` · 500 `#3E7A47` · 600 `#2F6439` · 700 `#234D2C` | Lolos / Memenuhi |
| `bata` | 100 `#F6DDD5` · 500 `#B5472F` · 600 `#9A3A25` · 700 `#7A2D1D` | Gagal / Tidak memenuhi, galat, aksi merusak |
| `peringatan` (kuning/oranye) | 50 `#FFF4DC` · 100 `#FDE7B8` · 300 `#FBBD61` · 500 `#B8700A` · 700 `#6B4700` | Perlu ditinjau, peringatan, sorotan kutipan di teks |

Aturan pemakaian:

- **Teks dan tombol berlabel putih memakai `primer-700` atau lebih tua** (`#0050AD` 7,63 : 1 di atas putih). `#1F86FF` (`primer-400`) hanya 3,55 : 1 di atas putih, jadi tidak pernah dipakai untuk teks normal; ia untuk elemen besar, ikon, batas isian, cincin fokus, dan garis tab aktif (syarat 3 : 1).
- **Biru hanya untuk yang dapat diklik atau berstatus aktif**: tautan (`primer-700`/`800`, bergaris bawah), tombol, penanda tab dan menu aktif. Teks biasa (keterangan, meta, label, petunjuk) memakai `text-teks-redup` (abu-600, 5,49 : 1 di atas `latar`, 5,89 : 1 di atas putih), sehingga tautan tidak tersamar sebagai teks biasa (Dennis dkk., 2015, hlm. 370 dan 371: warna hemat dan konsisten).
- **Status terpisah dari biru merek.** Lolos hijau, Gagal merah, Perlu ditinjau kuning/oranye, netral abu. Biru tidak pernah menjadi warna status supaya tidak tertukar dengan aksi. Status selalu berupa teks dan ikon kecil (centang, silang, segitiga, strip), tidak hanya warna.
- **Sogan/emas hanya aksen.** Kawung tipis berwarna emas transparan di atas navy (`.latar-kawung`: blok merek sidebar, J-01, kepala Pusat Demo). Area kerja tanpa motif dan tanpa emas, dengan satu pengecualian data-viz: `aksen-500` menjadi warna seri "terlalu longgar" pada batang arah koreksi J-05 (berpasangan dengan `primer-500` untuk "terlalu ketat"; pasangan ini lolos validator palet dataviz untuk buta warna dan kontras, dan selalu disertai teks), karena warna status (bata, peringatan, daun) tidak boleh dipakai sebagai warna seri.
- **BIMA tiruan tetap sistem lain**: abu-slate netral, font sistem, sudut tegas, tanpa komponen dan token SEMAR, tanpa logo atau nama kementerian; label tetap "Simulasi BIMA – bukan sistem resmi".
- Komponen memakai token semantik, bukan hex mentah (satu-satunya hex di luar `globals.css` adalah `themeColor` di `layout.tsx` dan halo fokus putih).

### 1.2 Kontras (rumus WCAG 2.x; teks normal ≥ 4,5 : 1, elemen besar/ikon/batas kontrol ≥ 3 : 1)

| Pasangan (teks / latar) | Rasio | Syarat |
|---|---:|---|
| isi `primer-900` / `latar` | 16,9 | 4,5 |
| judul `primer-800` / `latar` | 11,7 | 4,5 |
| tautan `primer-700` bergaris bawah / `latar` | 7,1 | 4,5 |
| teks redup `teks-redup` (`abu-600`) / `latar` dan / putih | 5,5 dan 5,9 | 4,5 |
| `primer-700` / putih | 7,6 | 4,5 |
| keterangan `abu-600` / `latar` | 5,5 | 4,5 |
| placeholder `primer-600` / putih | 6,1 | 4,5 |
| tombol utama putih / `primer-700` | 7,6 | 4,5 |
| tombol utama hover putih / `primer-800` | 12,6 | 4,5 |
| tombol sekunder `primer-800` / putih | 12,6 | 4,5 |
| tombol bahaya putih / `bata-600` | 7,0 | 4,5 |
| galat `bata-600` / `latar` | 6,5 | 4,5 |
| kode butir `primer-700` / `primer-50` | 6,5 | 4,5 |
| baris tersorot `primer-900` / `primer-50` | 15,5 | 4,5 |
| sorotan kutipan `primer-900` / `peringatan-300` | 10,9 | 4,5 |
| sidebar: menu `latar-200` / `primer-850` | 11,8 | 4,5 |
| sidebar: menu aktif putih / `primer-800` | 12,6 | 4,5 |
| sidebar: nama putih / `primer-850` | 15,2 | 4,5 |
| wordmark dan tagline `aksen-300` / `primer-850` | 9,1 | 4,5 |
| pil navigator `latar` / `primer-850` | 14,2 | 4,5 |
| label "catatan" `primer-900` / `aksen-300` | 10,9 | 4,5 |
| Lolos `daun-700` / `daun-100` | 7,8 | 4,5 |
| Gagal `bata-700` / `bata-100` | 7,3 | 4,5 |
| Perlu ditinjau `peringatan-700` / `peringatan-50` | 7,6 | 4,5 |
| Netral `abu-700` / `abu-100` | 7,5 | 4,5 |
| wordmark di latar terang `merek-semar-700` / `latar` | 10,0 | 4,5 |
| batas isian `primer-400` / putih | 3,55 | 3 |
| batas isian `primer-400` / `latar` | 3,3 | 3 |
| garis tab aktif `primer-400` / putih | 3,55 | 3 |
| cincin fokus `primer-400` / putih | 3,55 | 3 |
| cincin fokus `primer-400` / `primer-850` (sidebar) | 4,3 | 3 |
| penanda menu aktif `aksen-300` / `primer-850` | 9,1 | 3 |

Mode gelap tidak dibuat (prototipe alat kerja siang hari; dicatat sebagai batasan).

### 1.3 Motif kawung
Hanya di area merek: blok logo sidebar, panel kiri layar masuk J-01, dan kepala Pusat Demo (`.latar-kawung`, navy `primer-850` dengan garis emas `#FBBD61` ber-opasitas 0,28). Area kerja tanpa motif.

## 2. Tipografi

- **Outfit** (Google Fonts, `next/font/google`, huruf variabel, subset latin) untuk wordmark, judul, dan teks UI. Cormorant Garamond dan Plus Jakarta Sans **dihapus**. Tidak ada font serif sama sekali.
- **Angka tabel:** Outfit memiliki fitur OpenType `tnum` (diperiksa pada berkas sumber dan pada subset latin hasil `next/font`: `tnum` dan `pnum` ada). Maka angka tabel memakai `font-variant-numeric: tabular-nums` (kelas `.angka`, atau `<TD angka>`/`<TH angka>`). Tidak perlu font angka sekunder. Bila di kemudian hari subset kehilangan `tnum`, cadangannya `ui-monospace` untuk sel angka.
- Skala (rem): isi 1 (16 px) tinggi baris 1,55; tabel dan modal 0,875; keterangan 0,75; judul halaman 1,5 (600); judul bagian 1 (600); wordmark 1,5 (700). Judul memakai `text-wrap: balance`.
- Kode jendela (J-xx, M-xx): `font-mono`, 12 px, abu dingin. **Ukuran terkecil 12 px** (`text-xs`); tidak ada `text-[10px]`/`text-[11px]` (Dennis dkk., 2015, hlm. 370: huruf tidak lebih kecil dari 8 pt, 10 pt lebih baik).
- Kepala tabel berhuruf kalimat (`text-xs font-semibold`), **tanpa huruf kapital semua** dan tanpa `italic` untuk kutipan (Dennis dkk., 2015, hlm. 370). Kutipan memakai garis kiri dan tanda kutip lengkung.

## 3. Jarak, radius, bayangan

- Skala jarak Tailwind kelipatan 4 px: 4, 8, 12, 16, 24, 32. Antarbagian 32 px (`mt-8`), antarisian 16 px, padding sel tabel 12 × 8 px. Gutter halaman 16 px (24 px mulai `sm`), lebar isi maks 72 rem.
- Radius: `sm` 4 px (lencana, kotak centang), `md` 6 px (tombol, isian, tabel), `lg` 8 px (modal). Tidak ada radius besar atau pil kecuali pil navigator demo.
- Bayangan minimal: `--shadow-sm` hanya bila perlu; `--shadow-overlay` untuk modal, sheet, laci, dan navigator. Kartu biasa tidak berbayangan.

## 4. Komponen (`src/components/ui`)

| Komponen | Catatan |
|---|---|
| `Tombol` (`Button`) | Varian `utama` (satu per layar), `sekunder`, `hantu`, `bahaya`; `memuat` memutar ikon, menonaktifkan, dan `aria-busy`. Tinggi 32/40/44 px. |
| `Modal` | Radix Dialog: fokus terjebak, Esc, fokus kembali ke pemicu (hook `useKembalikanFokus`, karena modal dibuka lewat state tanpa `Dialog.Trigger`; cadangan `#isi` bila pemicu hilang), tanpa deskripsi ganda, `aria-labelledby` dari judul, ukuran `sm`/`md`/`lg`, slot `kaki`, `kode` M-xx kecil. Galat modal tampil di dalam modal. |
| `ModalKonfirmasi` | Ringkasan + "Batal" + tombol konfirmasi (label persis spesifikasi); `bahaya`, `memuat`, `galat`. |
| `Sheet` | Panel kanan (M-08), perilaku fokus sama dengan Modal. |
| `Notifikasi` / `beriTahu` | Sonner (wilayah `aria-live`), tema primer/status; muncul di **kanan atas** (di bawah bilah atas pada ponsel), sehingga tidak menutupi kolom aksi tabel maupun pil navigator di kiri bawah; galat bertahan 8 detik. Dipasang sekali di root. |
| `Table`, `THead`, `TBody`, `TR`, `TH`, `TD` | Padat; **di bawah 48 rem setiap baris menjadi blok bertumpuk** berlabel kolom (`data-label` dari kepala kolom, kelas `tumpuk`), sehingga aksi dan galat tidak tersembunyi di gulir ke samping (`tumpuk={false}` mematikannya); kepala lengket (`tinggiMaks` bila perlu menggulir); `angka` untuk kolom angka (rata kanan, tabular); `TR tersorot` (latar `primer-50` dengan garis `primer-400` di kiri, `aria-current`). Tanpa bingkai ganda. |
| `Paginasi` | Berbasis URL (`?halaman=`), pertahankan parameter lain; komponen klien, bungkus dengan `Suspense`. |
| `LencanaStatus` (`StatusBadge`) | Peta status baku → warna + ikon + teks. Hijau + centang: Lolos, Memenuhi, Terkirim, Ditetapkan, Selesai, Terbit, Aktif. Merah + silang: Gagal, Tidak memenuhi, Ditolak. Kuning + segitiga: Perlu ditinjau, Perlu diperiksa manual, Ditahan (benar-benar perlu perhatian). **Netral abu**: Draf, Arsip, Nonaktif, Diusulkan, Dikoreksi reviewer, tiruan (ikon strip); **Baru** (ikon titik) dan **Sedang diperiksa** (ikon jam) netral, bukan peringatan. Bar keyakinan: tinggi hijau, sedang `peringatan-500`, rendah merah. |
| `KeadaanKosong` | Satu kalimat yang belum ada + satu tindakan. |
| `Isian`, `Pilihan`, `KotakCentang` | Label terhubung, penanda wajib, petunjuk atau **galat tepat di bawah isian** (`aria-invalid`, `aria-describedby`, bingkai merah). `Field`/`Input`/`Select` lama tetap ada. |
| `TombolUnduh` | Tautan bergaya tombol dengan ikon unduh; nama berkas dari `Content-Disposition`. |
| `Tabs*` (`Tab`) | Garis bawah `primer-400` pada tab aktif, tanpa bingkai. Daftar bagian yang panjang (J-08) tidak memakai tab melipat: lihat bagian 5, butir 9. |
| `Bagian` (`Panel` lama) | Pengelompokan dengan judul kecil 16 px; tanpa kartu, tanpa bingkai ganda, tanpa judul serif. `bingkai` hanya bila isi memang perlu permukaan. |
| `KepalaHalaman` (`JudulHalaman` lama) | Breadcrumb + chip kode J-xx kecil, judul, ≤ 1 baris keterangan, slot `aksi` di kanan. |
| `Alert` | Garis kiri 4 px berwarna + ikon; galat/peringatan diumumkan (`role=alert`). |
| `CangkangSemar` (`components/layout`) | Sidebar per peran (lebar 16 rem) dengan blok merek berkawung, menu, identitas + "Keluar", label "contoh sementara" kecil di kaki. Di bawah 1024 px menjadi laci. Tautan "Lewati ke isi". Sidebar navy `primer-850`, penanda menu aktif `aksen-300`. Menu per peran dari `src/lib/menu.ts`. Peran tanpa menu (pengusul, J-06) mendapat bilah atas ramping tanpa sidebar dan tanpa tombol menu. |
| `CegatTinggalkan` | Menjaga isian belum disimpan saat klik tautan internal: modal "Tinggalkan tanpa menyimpan?" (simpan lalu pindah, tinggalkan, batal). Dipakai J-02b dan J-08b. |

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
9. **Navigasi bagian yang panjang tidak melipat** (J-08): mulai 1280 px daftar vertikal lengket di kolom kiri (peran `tab`, panah atas/bawah, bagian aktif bergaris `primer-400`); di bawah itu satu `<select>` berlabel "Bagian proposal" di atas teks. Daftar "Berkas Proposal" menjadi satu baris naskah (nama, ukuran, "Unduh Berkas") dengan menu `<details>` "Lampiran (N)", supaya teks proposal sudah terlihat di atas lipatan.
10. **Navigator demo** berada di kanan bawah (pil, `Alt+Shift+N`); setiap halaman menyisakan ruang cadangan di dasar isi (`pb-28`/`pb-40`) agar pil tidak menutupi tagline, isi BIMA, atau kaki sidebar (kaki sidebar kini di kiri, bebas pil).
11. **J-01**: panel kiri navy berkawung berisi merek di atas dan satu kelompok tengah (medali terang berisi ilustrasi Semar dengan cincin emas, tagline emas di bawahnya), bukan merek di atas dan ilustrasi di dasar dengan ruang kosong di tengah.

## 6. Larangan (anti "AI slop")

- Semua isi dibungkus kartu berbingkai dengan judul serif; kartu di dalam kartu.
- Banner penjelas di badan halaman; paragraf deskripsi panjang di bawah judul (maks 1 baris).
- Label kode jendela besar di atas judul (kode hanya chip kecil).
- Gradien, glow, bayangan tebal, emoji sebagai ikon, lencana berlebihan, halaman muka bergaya *landing page*.
- Warna sebagai satu-satunya penanda status; font serif; motif kawung di area kerja.
- Form pendek atau konfirmasi inline yang seharusnya modal; isi layar terpisah ditumpuk di satu layar.
- `transition: all`; animasi tanpa menghormati `prefers-reduced-motion` (sudah dimatikan global).

## 7. Pre-delivery checklist (ui-ux-pro-max + web-design-guidelines)

- [x] Kontras teks ≥ 4,5 : 1, ikon penting dan batas kontrol ≥ 3 : 1 (tabel di atas). Bukti: diperiksa ulang 23 Okt (rumus WCAG; tabel 1.2); token `teks-redup` ditambah.
- [x] Fokus terlihat di semua kontrol (`:focus-visible`, 3 px); tidak ada `outline: none` tanpa pengganti. Bukti: `globals.css` cincin `primer-400` + halo putih; tidak ada `outline-none` tanpa pengganti (grep).
- [x] Tombol ikon punya `aria-label`; ikon dekoratif `aria-hidden`. Bukti: `aria-label` pada tombol ikon (Tutup, Buka menu); ikon dekoratif `aria-hidden` (grep).
- [x] Label terhubung ke isian; galat tepat di dekat isian; `aria-invalid`/`aria-describedby`. Bukti: komponen `Isian`/`Pilihan`/`KotakCentang`; e2e M-10 S-1 dan J-02b S-2.
- [x] Modal: fokus terjebak, Esc, fokus kembali, judul sebagai `aria-labelledby`; `overscroll-behavior: contain`. Bukti: `modal.tsx` + `useKembalikanFokus`; e2e "Fokus kembali ke pemicu" (M-reset, M-06, M-10).
- [x] Hirarki judul h1 → h2 berurutan; tautan lewati ke isi. Bukti: e2e dan tangkapan layar; "Lewati ke isi" di semua cangkang.
- [x] Status = teks + ikon + warna. Bukti: `badge.tsx` peta status; bagian 4.
- [x] Angka tabel tabular dan rata kanan; tanggal/angka lewat `Intl` (id-ID, WIB). Bukti: `.angka` dan `Intl` id-ID (`utils.ts`).
- [x] Tidak ada gulir horizontal pada 375 px; laci menggantikan sidebar di bawah 1024 px. Bukti: tabel bertumpuk di < 48 rem (`table.tsx`, `globals.css`); tangkapan 390 px di `docs/bukti-e2e/`.
- [x] `prefers-reduced-motion` dihormati; transisi hanya `colors`/`opacity`. Bukti: `globals.css` aturan global.
- [x] Keadaan kosong, memuat, dan galat ada pada tiap tabel/daftar. Bukti: `KeadaanKosong` dan teks kosong per tabel; `loading.tsx` J-03b.
- [x] Aksi merusak lewat modal konfirmasi; unduhan lewat tautan (`TombolUnduh`). Bukti: M-03, M-07, M-11, Reset; unduhan lewat `TombolUnduh`.
- [x] Judul tab "J-xx Nama · SEMAR"; kode jendela hanya chip kecil. Bukti: `metadata` per `page.tsx` (BIMA: "· Simulasi BIMA").
- [x] `touch-action: manipulation`, target sentuh ≥ 40 px (tombol md) pada kontrol utama. Bukti: `globals.css`; tombol `pointer-coarse:h-11`; pil navigator `pointer-coarse:min-h-11`.

- [x] Elemen tetap (pil navigator kiri bawah, toast kanan atas) tidak menutupi kolom aksi; `scroll-padding-bottom` 6 rem agar kontrol terfokus tidak tertutup. Bukti: `globals.css`, e2e "navigator ciut".
- [x] Tidak ada tabel yang memecah kata per baris pada 390 px. Bukti: tangkapan layar 390 px (`docs/bukti-e2e/`).

Catatan: `.claude/skills/ui-ux-pro-max/references/pro-rules.md` tidak ada di repo; yang dipakai adalah Pre-Delivery Checklist dan Quick Reference 1 sampai 3 di `SKILL.md` serta aturan `web-design-guidelines` (audit di `docs/penilaian/audit-ui-2026-10-22.md`, diperbarui 23 Okt).
