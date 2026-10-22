# Arah perbaikan SEMAR (22 Okt 2026)

Permintaan Arsy, ditulis apa adanya:

1. "install this skill ... so updates need to trigger this skills cuz currently too ai slops"
2. "we can go back and forth real usecases not fixed flow, like example when create template the dppm also can download
   the template to see the result of the template created"
3. "yang mana harusnya ada modal tidak ada modal harusnya beda screen screennya sama itu harus diperbaiki"
4. "jangan lupa harus ada unit test bisa black box bisa whitebox"
5. "text bisa pake outfit untuk brand fontnya"

Keputusan Arsy pada hari yang sama: inventaris layar dan modal di bawah disetujui, dan arah tampilan yang dipilih adalah
"Sogan tenang".

## 1. Tampilan "Sogan tenang" (anti AI slop)

Identitas Semar tetap ada, tetapi aplikasinya berbentuk alat kerja kantor, bukan halaman pamer.

- **Font merek: Outfit** (Google Fonts, lewat `next/font`). Dipakai untuk wordmark, judul halaman, dan teks antarmuka.
  Font serif Cormorant dihapus seluruhnya. Angka di tabel memakai `font-variant-numeric: tabular-nums`. Bila Outfit tidak
  punya angka tabular, angka tabel memakai font sekunder yang tetap rapi; catat pilihannya di `docs/desain-sistem.md`.
- **Warna:** palet sogan (cokelat) sebagai warna primer dan emas hanya sebagai aksen kecil (fokus, penanda aktif).
  Permukaan berwarna netral hangat. Kontras teks minimal 4,5:1. Warna status konsisten:
  - Lolos/Memenuhi: hijau daun;
  - Gagal/Tidak memenuhi: merah bata;
  - Perlu ditinjau/sedang: emas;
  - netral: abu hangat.
- **Motif kawung:** hanya di area merek (sidebar atau J-01), tipis. Area kerja bersih dari motif.
- **Tata letak:**
  - *app shell* dengan sidebar per peran; isi menu per peran seperti sekarang;
  - kepala halaman: *breadcrumb*, judul, dan maksimal satu baris keterangan, lalu tombol aksi utama di kanan;
  - tabel padat dan tidak dibungkus kartu ganda;
  - pemisah antarbagian cukup jarak dan judul bagian kecil, bukan kartu berjudul serif.
- **Kode jendela** (J-02, M-01, dst.) tetap terlihat demi ketertelusuran ke Bab 10, tetapi kecil: di *breadcrumb* atau
  chip abu, plus judul tab browser "J-02 Templat Proposal · SEMAR".
- **Catatan skenario demo** keluar dari badan halaman dan pindah ke panel navigator demo.
- **Label "contoh sementara"** (data rekaan) tetap ada, tetapi tidak sebagai banner lebar: cukup di kaki sidebar atau footer.
- **Halaman BIMA tiruan:** label "Simulasi BIMA – bukan sistem resmi" tetap jelas. Gaya visualnya berbeda dari SEMAR
  supaya terlihat sebagai sistem lain, tetap tanpa logo atau identitas Kemdiktisaintek.
- **`/` (beranda):** spesifikasi tidak punya beranda, jadi `/` menuju J-01. J-01 boleh memuat merek Semar (ilustrasi SVG
  sendiri, kecil) dan tautan ke Pusat Demo, tanpa judul ganda.
- Desain sistem lengkap (token warna, skala jarak, tipografi, komponen, status) disusun dengan skill `ui-ux-pro-max`
  (`--design-system`) lalu disesuaikan dengan arah ini dan ditulis ke `docs/desain-sistem.md`.

## 2. Inventaris layar dan modal (WND prototipe)

Layar adalah halaman sendiri: punya URL, bisa dibuka lewat tautan langsung, dan tombol Back browser berfungsi. Modal muncul
di atas layar dan ditutup kembali ke layar yang sama. Modal wajib memakai fokus terjebak (*focus trap*), bisa ditutup dengan
Esc, mengembalikan fokus ke pemicu, dan memakai `aria-labelledby`. Pakai Dialog dari `radix-ui` yang sudah terpasang.

### Layar

| Kode | Layar | Rute (usulan) | UC | Isi |
|---|---|---|---|---|
| J-01 | Masuk | `/masuk` (`/` diarahkan ke sini) | — | "Masuk dengan akun BIMA" |
| J-02 | Templat Proposal | `/tim-kerja/templat?skema=` | UC-01 | Pilihan "Skema Pendanaan"; templat berlaku (versi, periode, tabel bagian, lampiran); riwayat versi (Terbit/Draf/Arsip); "Susun Versi Baru"; **"Unduh Templat (.docx)"** per versi |
| J-02b | Penyusunan Templat | `/tim-kerja/templat/[idTemplat]/susun` | UC-01 s.4–7 | Form draf: "Tambah Bagian", "Tambah Lampiran", "Periode Berlaku", S-2 isian ditandai; **"Unduh Pratinjau (.docx)"**; "Terbitkan" membuka M-01 |
| J-03 | Aturan Pemeriksaan | `/tim-kerja/aturan?skema=&periode=` | UC-02 | Tabel butir; "Tambah Butir"/"Ubah" (M-02); "Nonaktifkan" (M-03); 4a (M-04); "Uji pada Contoh" (ke J-03b); "Simpan Versi" (M-05) |
| J-03b | Hasil Uji pada Contoh | `/tim-kerja/aturan/uji?skema=&periode=` | UC-02 s.6 | Laporan Lolos/Gagal beserta angka pembukti per butir per contoh; rekomendasi beserta kutipan; kembali ke J-03 |
| J-04 | Penugasan Reviewer | `/tim-kerja/penugasan` | UC-03 s.1 | Daftar periode yang masa pengusulannya ditutup, dengan ringkasan (jumlah Terkirim, belum ditugaskan, status penetapan) |
| J-04b | Usulan Penugasan | `/tim-kerja/penugasan/[idPeriode]` | UC-03 s.2–8 | "Batas Beban per Reviewer"; "Susun Usulan Penugasan"; tabel "Usulan Penugasan" (berhalaman); "Sebaran Beban"; panel "Kekurangan Reviewer" (S-1); "Pindahkan" (M-06); "Tetapkan Penugasan" (M-07) |
| J-05 | Pemantauan Kesesuaian | `/tim-kerja/pemantauan?periode=&skema=` | UC-04 | Tiga bagian rekap; nama butir membuka M-08; "Tandai Butir" (M-09); judul proposal ke J-05b |
| J-05b | Rincian Proposal (BARU) | `/tim-kerja/proposal/[idProposal]` | UC-04, penunjang | Identitas proposal, versi pengajuan, hasil pemeriksaan deterministik dan semantik, penugasan, status penilaian beserta koreksi; **"Unduh Berkas"** naskah dan lampiran |
| J-06 | Hasil Pemeriksaan Pengajuan | `/pengusul/hasil/[idProposal]` | UC-05/06 | Tetap hanya-baca; satu-satunya tombol "Kembali ke BIMA" |
| J-07 | Daftar Penugasan | `/reviewer/penugasan` | UC-07 | Tetap; "Periksa" |
| J-08 | Pemeriksaan Proposal | `/reviewer/pemeriksaan/[penugasanId]` | UC-07/08/09 | Teks per tab dan butir semantik; "Tidak Setuju" membuka M-10; **"Unduh Berkas"**; "Lanjut ke Keputusan" ke J-08b |
| J-08b | Keputusan Penilaian | `/reviewer/pemeriksaan/[penugasanId]/keputusan` | UC-07 s.9–12 | "Keputusan Komponen Borang", "Umpan Balik untuk Pengusul", "Simpan Sementara", "Simpan Permanen" (M-11), kembali ke J-08 |
| BIMA | Masuk, Pengajuan, Kotak Masuk | `/bima/*` | UC-05, API | Pengajuan: **"Unduh Templat"** (templat Terbit skema itu, dari SEMAR); kotak masuk: entri ditautkan ke J-05b (khusus demo) |

### Modal

| Kode | Modal | Di layar | Isi dan perilaku |
|---|---|---|---|
| M-01 | Konfirmasi Terbitkan | J-02b | Ringkasan versi, periode berlaku, jumlah bagian dan lampiran; "Terbitkan"/"Batal". Hasil s.10 atau 9a tampil di J-02 sesudah modal ditutup. |
| M-02 | Form Butir (Tambah/Ubah) | J-03 | "Kode", "Deskripsi", "Jenis"; "Aturan Hitung" atau "Pertanyaan Pemeriksaan" + "Contoh Jawaban"; "Simpan Butir". Galat ditampilkan di dekat isiannya. |
| M-03 | Konfirmasi Nonaktifkan | J-03 | Nama butir dan akibatnya; "Nonaktifkan"/"Batal" |
| M-04 | Butir turunan templat (4a) | J-03 | Pesan 4a persis; "Buka Templat Proposal" (ke J-02 dengan skema terpilih) dan "Tutup" |
| M-05 | Simpan Versi | J-03 | "Tanggal Berlaku" lalu "Simpan Versi"; 8a ditolak di dalam modal |
| M-06 | Pindahkan Proposal | J-04b | "Reviewer Pengganti"; "Simpan Pemindahan"; syarat yang dilanggar ditampilkan di dalam modal |
| M-07 | Konfirmasi Tetapkan Penugasan | J-04b | Jumlah proposal dan reviewer, pemberitahuan bahwa penugasan dikirim ke BIMA; "Tetapkan Penugasan"/"Batal" |
| M-08 | Rincian Butir | J-05 | Contoh rekomendasi, kutipan, dan keputusan reviewer; "Tutup" (S-1). Boleh berbentuk *sheet* dari kanan. |
| M-09 | Konfirmasi Tandai Butir | J-05 | Daftar butir yang dicentang; "Tandai Butir"/"Batal" |
| M-10 | Koreksi Rekomendasi (UC-08) | J-08 | Rekomendasi, kutipan, alasan sistem; "Keputusan Reviewer", "Alasan Koreksi" (S-1: bingkai merah + "Alasan koreksi wajib diisi"), "Jenis Kekeliruan"; "Simpan Koreksi"/"Batal" |
| M-11 | Konfirmasi Simpan Permanen | J-08b | Ringkasan keputusan per komponen dan jumlah koreksi; peringatan bahwa penilaian menjadi hanya-baca dan dikirim ke BIMA |

Label tombol, isian, dan pesan dari *real use case* tetap ditulis **persis** (`docs/spesifikasi-ui.md`). Label tambahan
(unduh, "Lanjut ke Keputusan", dan modal konfirmasi) dicatat sebagai tambahan prototipe di `docs/catatan-inkonsistensi.md`
untuk diselaraskan ke Bab 10 (tabel jendela dan WND 10.3).

## 3. Alur bolak-balik, bukan alur tetap

- **Satu dunia data.** Pindah layar atau pindah peran tidak pernah mengubah data. Hanya "Reset & isi data demo" dan pilihan
  skenario di navigator yang menyiapkan data, dan keduanya menyatakannya dengan jelas. Hasil satu UC langsung terlihat di
  UC lain:
  - templat yang baru terbit menjadi templat yang diunduh pengusul di BIMA dan dipakai UC-06;
  - butir turunan baru muncul di J-03;
  - koreksi reviewer muncul di J-05 dan J-05b;
  - butir yang ditandai muncul "Perlu ditinjau" di J-03.
- **Semua layar bisa dicapai** dari sidebar sesuai peran dan lewat tautan langsung. Pilihan (skema, periode, tab, halaman
  tabel) disimpan di URL, dan tombol Back browser bekerja.
- **Tautan antarentitas:**
  - judul proposal ke J-05b (Tim Kerja) atau J-08 (reviewer, hanya penugasannya);
  - kode butir ke baris J-03 yang disorot, atau ke M-08 dari J-05;
  - nama skema ke J-02;
  - versi templat ke tampilan versi itu;
  - entri kotak masuk BIMA ke J-05b (demo).
- **Sesudah aksi, tawarkan langkah berikut yang masuk akal:**
  - sesudah terbit: "Buka Aturan Pemeriksaan" (sesuai spesifikasi) dan "Unduh Templat (.docx)";
  - sesudah ditetapkan: tautan ke J-05 dan, dalam mode demo, ke kotak masuk BIMA.
- **Unduhan:**
  - **Templat (.docx)** dibangun dari bagian templat:
    - judul dan identitas skema/periode/versi;
    - satu judul (Heading 1) per bagian sesuai urutan, dengan panduan batas kata dan tanda wajib/opsional;
    - bagian "Kata Kunci" dan "Daftar Pustaka";
    - daftar lampiran wajib.
    Berkas ini harus bisa dibaca balik oleh `potongPerBagian` dengan hasil bagian yang sama (uji *round-trip*). Tersedia di
    J-02 (per versi), J-02b (pratinjau draf), dan BIMA pengajuan (templat Terbit).
  - **Berkas proposal** (naskah dan lampiran dari Blob) untuk Tim Kerja (J-05b) dan reviewer (J-08, hanya penugasannya;
    selain itu 403).
- **Navigator demo** tetap ada. Isinya:
  - katalog layar diperbarui dengan J-02b, J-03b, J-04b, J-05b, dan J-08b;
  - "pindah layar/peran" dibedakan tegas dari "pasang skenario";
  - catatan skenario pindah ke sini.

## 4. Unit test *black box* dan *white box* (Dennis dkk., 2015, hlm. 469–475)

> **KOREKSI ARSY (22 Okt 2026). Bagian ini mengalahkan teks lain, termasuk prompt agen.** Kolom "sumber rencana uji" (*test
> plan source*) untuk unit test harus mengikuti Gambar 12-4 Dennis (hlm. 472) secara persis:
>
> - *Black box*: **CRC Cards**, ***Class Diagrams***, atau ***Contracts***. *Behavioral state machine* boleh dipakai untuk
>   menurunkan kasus uji keadaan (hlm. 473), tetapi tetap dicatat bersama CRC atau *class diagram* kelas pemiliknya.
> - *White box*: ***Method Specifications***.
> - ***Real use case* BUKAN sumber unit test.** Sumber itu milik *use-case testing* pada uji integrasi (Gambar 12-4) dan
>   dipakai oleh e2e.
>
> Kontrak dan spesifikasi metode belum ada di naskah, jadi disusun di **`docs/kontrak-dan-spesifikasi-metode.md`**:
>
> - ***Contract*** per metode yang diuji, dengan formulir Gambar 8-22 (hlm. 309):
>   - Method Name, Class Name, ID;
>   - Clients (Consumers), dari *sequence diagram*;
>   - Associated Use Cases;
>   - Description of Responsibilities;
>   - Arguments Received, Type of Value Returned;
>   - Pre-Conditions, Post-Conditions.
> - ***Method Specification*** untuk metode yang kompleks, dengan formulir Gambar 8-26 (hlm. 315):
>   - Method Name, Class Name, ID, Contract ID;
>   - Programming Language: TypeScript;
>   - Triggers/Events;
>   - Arguments Received;
>   - Messages Sent & Arguments Passed;
>   - Arguments Returned;
>   - Algorithm Specification dalam Structured English (hlm. 316);
>   - Misc. Notes.
>
> Nama kelas dan metode mengikuti *class diagram*, CRC, dan *sequence diagram* naskah (`docs/sumber/sequence/*.puml`,
> `docs/model-data-dan-aturan.md`). Setiap ID uji di `docs/rencana-uji.md` menyebut sumbernya secara tepat, misalnya
> "Contract C-06 `hitungKata`", "CRC VersiProposal", "Class Diagram: multiplisitas PenugasanReviewer", atau "Method
> Specification MS-03 `potongPerBagian`". Unit test *black box* tidak lagi merujuk ke *real use case*.
>
> **ID tetap** (dipakai semua agen; isi formulirnya disusun di `docs/kontrak-dan-spesifikasi-metode.md`):
>
> | ID kontrak | Kelas.metode | ID kontrak | Kelas.metode |
> |---|---|---|---|
> | C-01 | TemplatProposal.periksaKelengkapan | C-17 | ButirCek.cekKataKunci |
> | C-02 | TemplatProposal.terbitkan | C-18 | ButirCek.cocokkanSitasi |
> | C-03 | TemplatProposal.turunkanButirCek | C-19 | ButirCek.cekLampiran |
> | C-04 | TemplatProposal.arsipkan | C-20 | ButirCek.cocokkanStrukturJudul |
> | C-05 | SkemaPendanaan.cekPengusulanBerjalan | C-21 | TemplatProposal.potongPerBagian |
> | C-06 | ButirCek.aturParameter / ubahParameter | C-22 | Proposal.catatTerkirim |
> | C-07 | ButirCek.nonaktifkan | C-23 | VersiProposal.siapkanTeksTanpaIdentitas |
> | C-08 | BasisAturan.validasiTanggalBerlaku | C-24 | ButirCek.cocokkanKutipan |
> | C-09 | BasisAturan.simpanVersiBaru | C-25 | BasisAturan.periksaSemantik / ButirCek.nilaiSemantik |
> | C-10 | BasisAturan.ujiPadaContoh | C-26 | KoreksiRekomendasi.simpanKoreksi |
> | C-11 | PeriodeSeleksi.cekMasaPengusulan | C-27 | Penilaian.simpanNilai |
> | C-12 | PeriodeSeleksi.tetapkanBatasBeban | C-28 | Penilaian.terima / PenugasanReviewer.tandaiSelesai |
> | C-13 | PeriodeSeleksi.susunPenugasan | C-29 | BasisAturan.rekapKesesuaian / ButirCek.hitungTingkatKoreksi |
> | C-14 | PenugasanReviewer.pilihReviewer | C-30 | BasisAturan.tandaiButir / ButirCek.tandaiPerluDitinjau |
> | C-15 | PenugasanReviewer.tetapkan | C-31 | TemplatProposal.buatDokumenTemplat (tambahan prototipe: unduh .docx) |
> | C-16 | ButirCek.hitungKata | | |
>
> Spesifikasi metode (sumber *white box*):
>
> | ID | Metode | Kontrak |
> |---|---|---|
> | MS-01 | potongPerBagian | C-21 |
> | MS-02 | hitungKata | C-16 |
> | MS-03 | cocokkanSitasi | C-18 |
> | MS-04 | susunPenugasan | C-13 |
> | MS-05 | pilihReviewer | C-14 |
> | MS-06 | periksaSemantik: batas waktu, percobaan ulang, status | C-25 |
> | MS-07 | cocokkanKutipan | C-24 |
> | MS-08 | siapkanTeksTanpaIdentitas | C-23 |
> | MS-09 | rekapKesesuaian / hitungTingkatKoreksi | C-29 |
> | MS-10 | buatDokumenTemplat | C-31 |
> | MS-11 | terbitkan (9a, arsipkan, turunkanButirCek) | C-02 |
> | MS-12 | validasiTanggalBerlaku | C-08 |
> | MS-13 | cekKataKunci | C-17 |
>
> Contoh sumber: KH merujuk "Contract C-16", "CRC ButirCek", atau "Class Diagram: PenugasanReviewer 0..* — 1 Reviewer";
> KP merujuk "Method Specification MS-02".

Dennis membedakan dua pendekatan unit test kelas (Gambar 12-4, hlm. 472):

- ***Black box*** diturunkan dari kartu CRC, *class diagram*, kontrak (pra/pascakondisi), dan *state machine*.
  - Setiap butir spesifikasi menjadi satu uji dengan beberapa kasus.
  - Contoh hlm. 473: nilai sah, nilai tidak sah di bawah batas, nilai tidak sah di atas batas, tipe salah, dan nilai
    janggal tetapi mungkin sah.
  - Uji *state machine*: setiap keadaan dapat dicapai, dan hanya transisi yang didefinisikan yang diizinkan.
- ***White box*** diturunkan dari spesifikasi metode: melihat ke dalam kode untuk menguji setiap cabang/jalur metode yang
  kompleks.
- Kelas lain yang belum siap atau eksternal diganti *stub* (hlm. 471), misalnya klien BIMA dan Layanan LLM.

Yang wajib ada:

- `tests/unit/kotak-hitam/` (ID `KH-<kelas>-<nn>`) dan `tests/unit/kotak-putih/` (ID `KP-<metode>-<nn>`). Nama tes diawali
  ID supaya bisa ditelusuri dari rencana uji. Tes lama dipindah dan diklasifikasikan.
- Cakupan *black box* minimal:
  - aturan UC-06: `hitungKata` (batas tepat, satu di atas, satu di bawah, kosong), `cekKataKunci` (4/5/6 kata kunci,
    pemisah salah), `cocokkanSitasi`, `cekLampiran`, `cocokkanStrukturJudul`;
  - `cekMasaPengusulan` (tepat di tanggal tutup, satu detik sesudahnya);
  - validasi tanggal berlaku 8a;
  - kelengkapan templat S-2;
  - `pilihReviewer` (institusi sama, beban penuh);
  - koreksi UC-08 (alasan kosong);
  - `cocokkanKutipan`;
  - *state machine* templat (Draf→Terbit→Arsip), butir (Draf→Aktif→Perlu ditinjau→Nonaktif), penugasan
    (Diusulkan→Ditetapkan→Selesai), status proposal;
  - generator templat .docx (*round-trip*).
- Cakupan *white box*: setiap cabang metode yang kompleks, yaitu:
  - `potongPerBagian`, pemeriksa deterministik, `susunPenugasan`/`pilihReviewer`;
  - mesin semantik: batas waktu, percobaan ulang, "Belum ada rekomendasi", "Perlu diperiksa manual";
  - `siapkanTeksTanpaIdentitas`, rekap pemantauan, generator .docx.
  Pakai *stub* untuk BIMA dan LLM.
- `@vitest/coverage-v8` dan skrip `npm run test:coverage`. Ambang cakupan cabang untuk `src/lib/**` (kecuali
  `src/lib/demo/**`) minimal 80%; laporkan angka per modul.
- `docs/rencana-uji.md`: tabel rencana uji gaya Dennis berisi ID, unit/kelas, sumber (CRC/kontrak/state machine/spesifikasi
  metode/real use case), tujuan, kasus uji, hasil yang diharapkan, hasil aktual, dan lulus/gagal. Ditambah bagian uji
  integrasi (e2e per UC dan alur bolak-balik) dan uji kinerja (10.000 proposal).
- `docs/laporan-uji.md` dibangkitkan otomatis dari hasil vitest (reporter JSON), berisi hasil aktual per ID dan ringkasan
  cakupan.
