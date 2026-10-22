# Peta use case ke jendela

Sumber langkah: `docs/sumber/bab10-use-scenario-real-use-case.md` (real use case). Nomor langkah di tabel adalah nomor real use case; S- adalah *SubFlow*, Nx adalah *Alternate Flow*. Jalan pintas: halaman `/demo` (kartu UC dan skenario) atau alamat `/demo/mulai?k=<kode>` (tambahkan `&j08=1` pada UC-07a/c untuk membuka J-08 langsung; UC-07b, UC-08, dan UC-09-S1/S2 selalu membuka J-08). Setiap jalan pintas menyiapkan data, memasang sesi peran yang sesuai, lalu membuka jendela awal. **Navigator demo** (tombol mengambang kiri bawah di setiap halaman SEMAR dan BIMA tiruan, bawaan ciut; Alt+Shift+N membuka, Esc menciutkan) menggantikan panel langkah real use case: ia berpindah antar-jendela dan antar-skenario keadaan (katalog di bawah) lewat `/demo/mulai?j=<jendela>&s=<skenario>`. Data langkah real use case tetap di `src/lib/demo/pemandu/` sebagai dokumentasi, tidak lagi ditampilkan.

## Jendela

| Kode | Jendela | Peran | Rute |
|---|---|---|---|
| J-01 | Masuk | Tim Kerja DPPM, Reviewer | `/masuk` (SSO tiruan lewat `/bima/masuk` lalu `/api/sso/callback`) |
| J-02 | Templat Proposal | Tim Kerja (pengelola) | `/tim-kerja/templat` |
| J-03 | Aturan Pemeriksaan | Tim Kerja (pengelola) | `/tim-kerja/aturan` (pilih skema dan periode, tekan Tampilkan) |
| J-04 | Penugasan Reviewer | Tim Kerja | `/tim-kerja/penugasan` |
| J-05 | Pemantauan Kesesuaian | Tim Kerja | `/tim-kerja/pemantauan` (pilih periode dan skema, tekan Tampilkan) |
| J-06 | Hasil Pemeriksaan Pengajuan | Pengusul (dibuka dari BIMA) | `/pengusul/hasil/[idProposal]` (diawali `/pengusul/mulai`) |
| J-07 | Daftar Penugasan | Reviewer | `/reviewer/penugasan` |
| J-08 | Pemeriksaan Proposal | Reviewer | `/reviewer/pemeriksaan/[penugasanId]` (data JSON: `.../data`) |
| BIMA | Halaman BIMA tiruan | Semua (simulasi) | `/bima/masuk`, `/bima/pengajuan`, `/bima/kotak-masuk` |

## Katalog skenario per jendela (Navigator demo)

Alamat: `/demo/mulai?j=<kode jendela>&s=<id skenario>`; tanpa `s` (berpindah jendela dari navigator) dipakai skenario bawaan: `siap-kecil` untuk J-04, `contoh` untuk J-05, `baru` untuk J-07, selain itu skenario pertama. Setiap skenario menyiapkan data (idempoten, tanpa reset), memasang sesi peran yang sesuai (SEMAR dan BIMA), mencatat skenario aktif di cookie `semar_skenario` (ditampilkan di pil dan panel navigator), lalu membuka jendela. Kode di `src/lib/demo/katalog.ts` (daftar) dan `src/lib/demo/skenario.ts:siapkanSkenario` (penyiap). Sakelar masa pengusulan juga ada di navigator. Daftar yang sama tampil di `/demo` ("Skenario keadaan per jendela").

| Jendela (peran) | Skenario (id) dan keadaan yang disiapkan |
|---|---|
| J-01 Masuk | `belum-masuk` sesi dihapus, halaman Masuk; `pengelola` sesi pengelola, mendarat di J-02; `anggota` sesi anggota, mendarat di J-04 (menu J-04 dan J-05); `reviewer` sesi reviewer-2, mendarat di J-07 |
| J-02 Templat Proposal (pengelola) | `normal` templat PD berlaku, masa ditutup; `tanpa-templat` skema PK tanpa templat (S-1); `masa-berjalan` Terbitkan menyimpan draf (9a); `draf-tersimpan` draf versi berikutnya sudah ada |
| J-03 Aturan Pemeriksaan (pengelola) | `normal` tabel butir PD, masa ditutup; `perlu-ditinjau` satu butir manual berstatus Perlu ditinjau (dari UC-04); `uji-tanggal` masa berjalan, tanggal berlaku di tengah masa ditolak (8a). Mendarat langsung di tabel butir (skema dan periode terpilih) |
| J-04 Penugasan Reviewer (Tim Kerja) | `kosong` tidak ada proposal Terkirim yang perlu ditugaskan dan tidak ada usulan ("Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini." dan "Tidak ada usulan yang menunggu penetapan."); `siap-kecil` enam proposal Terkirim, batas beban 3; `menunggu` usulan sudah disusun (batas 3) dan belum ditetapkan; `kekurangan` batas beban 1, Susun ditekan otomatis (`?susun=1`) sehingga panel Kekurangan Reviewer (S-1) tampil; `ditetapkan` usulan sudah ditetapkan dan ada di kotak masuk BIMA; `skala` **10.000 proposal Terkirim** (lihat di bawah) |
| J-05 Pemantauan (Tim Kerja) | `belum-final` penilaian Final dihapus (hanya butir deterministik gagal tampil); `contoh` proposal Ditahan dan penilaian Final dengan koreksi reviewer |
| J-06 Hasil Pemeriksaan (pengusul) | `terkirim` semua butir lolos, bukti pengiriman; `ditahan` Metode melebihi batas; `ditolak` masa ditutup (3a); `diperiksa` pemeriksaan sedang berjalan (lewat 2 menit berubah menjadi galat batas waktu NFR 2.1) |
| J-07 Daftar Penugasan (reviewer) | `kosong` reviewer-6 tanpa penugasan; `baru` PRP-2026-0004 berlabel Baru; `draf` penilaian sebagian tersimpan; `selesai` penilaian final terkirim ke BIMA |
| J-08 Pemeriksaan Proposal (reviewer-2) | `normal` hasil semantik normal; `perlu-manual` kutipan tidak ditemukan (S-1); `belum-rekomendasi` LLM tidak merespons (S-2); `draf` tiga komponen dan umpan balik terisi; `final` Simpan Permanen sudah dilakukan, isian hanya-baca |
| BIMA Pengajuan (pengusul) | `lolos` PRP-2026-0001; `ditahan` PRP-2026-0002 (Metode melebihi batas); `ditolak` PRP-2026-0003 (tutup masa lalu ajukan ulang) |
| BIMA Kotak masuk | `normal` ringkasan (jumlah penugasan, penerima, penerima terbanyak) dan 100 pesan terbaru |

### J-04 skala nyata (10.000 proposal)

- **Data** (`src/lib/demo/skala.ts`): periode tersendiri "Skala Nyata 2026 (10.000 proposal)" dengan masa pengusulan ditutup; 10.000 proposal Terkirim (`SKL-2026-NNNNN`, satu versi V1 tiap proposal) dari 400 pengusul di 40 institusi rekaan; 130 reviewer rekaan (setiap reviewer ke-11 tidak bersedia, sisanya 119 ditambah 5 reviewer contoh = ±124 bersedia). Dibuat set-based sekali (±5 dtk); pemakaian berikutnya hanya mengosongkan penugasan dan kotak masuk hasil percobaan sebelumnya. Reset menghapusnya.
- **Isolasi**: J-04 membuka periode ini hanya bila `pengaturan_demo.periode_aktif_id` menunjuknya. Semua skenario lain mengosongkan penunjuk itu dan menonaktifkan reviewer massal (dua UPDATE murah), sehingga skenario kecil tidak melihat data skala.
- **Batas beban bawaan 100** (rentang naskah 30-200): ±124 reviewer x 100 = ±12.400 kapasitas, cukup untuk 10.000 (beban merata 80-81 per reviewer). Batas 60 memicu S-1 (kapasitas 7.440 < 10.000).
- **Antarmuka**: Usulan Penugasan dan Penugasan yang Sudah Ditetapkan berhalaman 50 baris (parameter `hal` dan `halT`, penomoran di server) dengan ringkasan total; Sebaran Beban memuat semua reviewer (tabel dapat digulir) dengan ringkasan terendah/tertinggi/rata-rata; pesan hasil menyebut waktu proses di server.
- **Kinerja**: algoritma `susunUsulanMurni` menghitung reviewer layak sekali per institusi dan melewati jalur penambah bila kapasitas kurang; penyimpanan usulan satu `INSERT ... SELECT` dari array JSON per 5.000 baris; `tetapkanPenugasan` mengklaim dengan satu `UPDATE ... RETURNING` lalu mengirim ke BIMA per kelompok 500 (lima kelompok serentak, ulang otomatis maksimal 2 kali per kelompok oleh klien; kunci = id penugasan sehingga BIMA membuang duplikat). Kelompok yang gagal dikembalikan ke Diusulkan ("Kirim ulang"), kelompok yang sudah diterima tetap Ditetapkan. J-04 `maxDuration` 300 dtk.

## UC ke jendela, langkah, dan rute

| UC | Jendela yang dipakai | Langkah real use case | Alternatif yang dapat diperagakan | Rute awal (jalan pintas) |
|---|---|---|---|---|
| UC-01 Mengelola templat proposal | J-02 | 1-10: pilih Skema Pendanaan; lihat versi, periode, bagian, lampiran; Susun Versi Baru; Tambah Bagian/Lampiran; Periode Berlaku; Terbitkan; pesan terbit dan jumlah butir draf; Buka Aturan Pemeriksaan | S-1 skema belum punya templat (kartu `UC-01-S1`, skema contoh "PK"); S-2 Lengkapi isian yang ditandai; 9a masa pengusulan berjalan (draf tersimpan) | `/demo/mulai?k=UC-01` -> `/tim-kerja/templat` (masa ditutup, draf sisa demo dibuang; nyalakan sakelar "berjalan" untuk 9a); `k=UC-01-S1` -> J-02 pada skema tanpa templat |
| UC-02 Mengelola aturan pemeriksaan | J-03 (tautan ke J-02) | 1-8: pilih skema dan periode; tabel butir; Tambah Butir/Ubah/Nonaktifkan; panel butir; Simpan Butir; Uji pada Contoh (Hasil Uji); Tanggal Berlaku dan Simpan Versi | S-1 ubah lalu uji ulang; 4a butir turunan templat (terkunci); 8a tanggal berlaku di tengah masa pengusulan | `/demo/mulai?k=UC-02` -> `/tim-kerja/aturan` |
| UC-03 Menugaskan reviewer | J-04 (pesan penetapan terlihat di kotak masuk BIMA dan J-07) | 1-8: Batas Beban per Reviewer; Susun Usulan Penugasan; tabel Usulan Penugasan dan Sebaran Beban; Tetapkan Penugasan | S-1 Kekurangan Reviewer (batas beban 1); S-2 Pindahkan, Reviewer Pengganti, Simpan Pemindahan (syarat dilanggar ditampilkan) | `/demo/mulai?k=UC-03` -> `/tim-kerja/penugasan` (enam proposal Terkirim siap ditugaskan, masa ditutup) |
| UC-04 Memantau kesesuaian penilaian | J-05 (butir yang ditandai tampil di J-03) | 1-7: Periode Seleksi dan Skema Pendanaan; Butir Deterministik Paling Sering Gagal; Kesesuaian per Butir (% Disetujui); Butir dengan Koreksi Tertinggi; Perlu Diperbaiki dan Tandai Butir | S-1 panel Rincian Butir dan Tutup | `/demo/mulai?k=UC-04` -> `/tim-kerja/pemantauan` (data proposal Ditahan dan penilaian Final tersedia) |
| UC-05 Mengajukan proposal | BIMA tiruan `/bima/pengajuan` lalu J-06 | 1-11: Ajukan Usulan di BIMA; penerusan SSO ke J-06; tarikDariBima dan cekMasaPengusulan; ambilBerkas; templat dan aturan berlaku; versi baru; potongTeks; jalankanPemeriksaan; status dan bukti pengiriman | S-1.1-S-1.4 Ditahan lalu ajukan ulang; 3a.1-3a.2 Ditolak (masa ditutup); NFR 4.4 Kirim ulang | skenario a: `/demo/mulai?k=UC-05a` "Proposal terkirim pada pengajuan pertama"; b: `k=UC-05b` "Proposal ditahan lalu terkirim setelah diperbaiki" (Ditahan, lalu Ajukan ulang dengan kotak centang "Pakai naskah perbaikan (contoh)" -> Terkirim V2); c: `k=UC-05c` "Proposal ditahan lalu ditolak karena masa pengusulan ditutup" (Ditahan, tombol "Tutup masa pengusulan" di BIMA, Ajukan ulang -> Ditolak) -> `/bima/pengajuan?proposal=PRP-2026-000N` |
| UC-06 Memeriksa butir deterministik (tanpa aktor utama; di dalam UC-05) | J-06 (hasil; pemandu UC-05 diikuti langkah UC-06 berawalan "6.") | 1-8: cocokkan struktur judul, hitung kata, diagram alir, kata kunci, sitasi, lampiran; angka pembukti per butir | S-1.2 butir Gagal paling atas dengan bagian dan batas | `/demo/mulai?k=UC-06` (= skenario UC-05b) |
| UC-07 Melakukan pemeriksaan akhir | J-07, J-08 | 1-12: Periksa; teks per bagian dan butir semantik; keputusan komponen borang; umpan balik; Simpan Permanen; pesan Penilaian tersimpan dan terkirim ke BIMA | S-1 Simpan Sementara (label Draf di J-07, dimuat lagi saat Periksa) | a "Menyetujui seluruh rekomendasi": `k=UC-07a` -> J-07; b "Mengoreksi rekomendasi yang keliru": `k=UC-07b` -> J-08 (UC-08); c "Menyimpan sementara lalu melanjutkan": `k=UC-07c` -> J-07 berlabel Draf, J-08 memuat ulang isian |
| UC-08 Mengoreksi rekomendasi sistem | J-08 | 1-8: Tidak Setuju; panel koreksi; Keputusan Reviewer, Alasan Koreksi, Jenis Kekeliruan; Simpan Koreksi; label Dikoreksi reviewer | S-1 Alasan koreksi wajib diisi (bingkai merah); 4a Batal | `/demo/mulai?k=UC-08` -> `/reviewer/pemeriksaan/[penugasanId]` |
| UC-09 Memeriksa butir semantik (tanpa aktor utama; pendukung Layanan LLM) | Dijalankan sistem; hasil di J-08 (pemandu J-08 memuat langkah UC-09 berawalan "9.") | 1-8: kutipan per butir, tingkat keyakinan, rekomendasi Memenuhi/Tidak memenuhi | S-1 kutipan tidak ditemukan (Perlu diperiksa manual); S-2 LLM tidak merespons dua kali (Belum ada rekomendasi) | `/demo/mulai?k=UC-09` (normal), `k=UC-09-S1` (S-1), `k=UC-09-S2` (S-2) |

## Catatan

- Enam use scenario Bab 10.1 (Tabel us-05a..us-07c) ada di kartu "Enam skenario" pada /demo dengan judul yang sama. Varian hasil semantik (kutipan tidak ditemukan, LLM tidak merespons) kini kartu UC-09 S-1 dan S-2. Varian itu dan seluruh jalan pintas UC-07/08/09 memaksa mode tiruan lewat opsi fungsi (bukan `process.env`), sehingga aman walau produksi bermode LLM "nyata".
- Sakelar "Masa pengusulan" di `/demo` (juga alat simulasi di halaman pengajuan BIMA tiruan) menentukan jalur UC-01 s.9 versus 9a, UC-02 8a, UC-03 (tombol Susun aktif hanya bila ditutup), dan UC-05 3a. Sakelar juga menggeser `tanggalTutup` periode supaya tanggal yang tampil searah dengan statusnya.
- "Reset & isi data demo" (meminta konfirmasi) mengosongkan semua tabel kecuali `log_audit` (append-only), lalu mengisi ulang data contoh. Jalan pintas tidak mereset data.
- Pemeriksaan ujung ke ujung: `npm run build` lalu `npm run e2e` dengan `DATABASE_URL_UJI` (branch Neon uji; e2e menolak jalan terhadap basis data produksi). Tangkapan layar dan laporan di `e2e/hasil/` (run terfilter menulis ke `e2e/hasil/filter-*/`).

## Metode sequence ke berkas dan fungsi

Nama fungsi servis sama dengan metode sequence (keputusan 5). Alias (`export const x = y`) ditandai "=".

| Sequence | Metode -> berkas:fungsi |
|---|---|
| seq-uc01 | ambilTemplatBerlaku -> `templat/layanan.ts:ambilTemplatBerlaku`; periksaKelengkapan -> `templat/kelengkapan.ts`; terbitkan -> `templat/layanan.ts:terbitkan`; cekPengusulanBerjalan = masaPengusulanBerjalan (dipanggil di terbitkan); gantiTemplatBerlaku, arsipkan, nonaktifkan -> `templat/layanan.ts` (dipanggil di terbitkan); turunkanButirCek = turunkanButirDariTemplat (dipanggil di terbitkan); aturBagian, aturKetentuan, tetapkanPeriodeBerlaku = simpanIsian; aturParameter -> isian `parameter` pada insert butir turunan |
| seq-uc02 | daftarButirBerlaku, basisAturanBerlaku = daftarButirBerlaku; ubahParameter = simpanButir; nonaktifkan = nonaktifkanButir; ujiPadaContoh; validasiTanggalBerlaku (`aturan/tanggal.ts`); simpanVersiBaru; masaPengusulanBerjalan (`waktu.ts`); create -> insert Drizzle |
| seq-uc03 | tetapkanBatasBeban, susunPenugasan, pilihReviewer, tetapkanPenugasan di `penugasan/layanan.ts`; ambilDaftarReviewer dan kirimPenugasan (pembungkus klien BIMA, dipanggil di alur); tetapkan, mencatatPenugasan, terimaProposal = tetapkanPenugasan |
| seq-uc04 | ambilAturanBerlaku, rekapKesesuaian (`pemantauan/rekap.ts`), tandaiButir di `pemantauan/layanan.ts`; hitungTingkatKoreksi, ambilStatus, ambilAlasan, ambilRincian, ambilContoh = susunLaporan; tandaiPerluDitinjau = tandaiButir |
| seq-uc05 | (catatan r2: `ambilBerkas` sequence = `bima.ambilBerkas` di `lib/bima/client.ts` dengan argumen berkasId, didahului `bima.ambilProposal`; bukan `berkas.ts`) tarikDariBima, cekMasaPengusulan (membandingkan jam demo dengan tanggalBuka/tanggalTutup), ambilTemplatBerlaku, ambilAturanBerlaku, catatTerkirim di `pengajuan/layanan.ts`; potongTeks, potongPerBagian (`pengajuan/potong.ts`); ambilBerkas (`berkas.ts`); jalankanPemeriksaan = jalankanPemeriksaanDeterministik (`pemeriksa/deterministik/index.ts`) |
| seq-uc06 | periksaDeterministik = jalankanPemeriksaanDeterministik; periksa = periksaDeterministikTeks; ambilTeksBagian = teksBagian; cocokkanStrukturJudul, hitungKata, cekKataKunci, cocokkanSitasi, cekLampiran di `pemeriksa/deterministik/` |
| seq-uc07 | bukaProposal (dan periksaAkses), bukaVersiDinilai, ambilHasilPemeriksaan, muatPemeriksaan, simpanNilai, terima, tandaiSelesai, mencatatPenilaian, kirimKeputusan = kirimKeBima di `penilaian/layanan.ts`, semuanya dipanggil oleh muatPemeriksaan dan simpanPermanen |
| seq-uc08 | catatKoreksi, ambilRekomendasi, gantiRekomendasi, simpanKoreksi di `penilaian/layanan.ts` (simpanKoreksi memanggil ketiganya) |
| seq-uc09 | jalankanPemeriksaan(semantik) -> `semantik/jalankan.ts:jalankan`; periksaSemantik, nilaiSemantik = nilaiSemantikDenganOpsi (`semantik/mesin.ts`); kirimPermintaan (`semantik/llm.ts`) dan mintaJawaban (batas percobaan); cocokkanKutipan, siapkanTeksTanpaIdentitas (`semantik/teks.ts`) |


Catatan r2: alias nominal yang tidak pernah dipanggil dengan namanya sendiri (satu fungsi memikul beberapa pesan sequence): aturBagian, aturKetentuan, tetapkanPeriodeBerlaku (= simpanIsian); basisAturanBerlaku, ubahParameter; tetapkan, mencatatPenugasan, terimaProposal (= tetapkanPenugasan); hitungTingkatKoreksi, ambilStatus, ambilAlasan, ambilRincian, ambilContoh (= susunLaporan); tandaiPerluDitinjau; periksaDeterministik, periksa, ambilTeksBagian; nilaiSemantik, periksaSemantik. `aturParameter` hanya komentar. `pilihReviewer` hanya melayani S-2 (susunPenugasan memakai `susunUsulanMurni`). Penolakan 4a UC-02 berjalan lewat `periksaKunciButir`. Kartu jalan pintas: UC-07b kini mendarat di J-07, UC-07c-awal mulai dari label Baru.

## Bukti (tangkapan layar e2e, run penuh 22 Okt 2026)

Run penuh `npm run e2e` (`SEMAR_IZINKAN_DB_PRODUKSI=1`, tanpa `DATABASE_URL_UJI`), 26 dari 26 skenario lulus (`docs/bukti-e2e/laporan.md`; salinan dari `e2e/hasil/` yang di-.gitignore). Nomor = awalan berkas PNG di `docs/bukti-e2e/`. Run diakhiri dengan "Reset & isi data demo".

| UC / langkah atau alternatif | PNG |
|---|---|
| UC-05 langkah 1 (BIMA), 11 (J-06 Terkirim, bukti pengiriman) | 05, 06 |
| UC-05 S-1.2 (Ditahan), S-1.3/S-1.4 (ajukan ulang menjadi Terkirim V2) | 07, 08 |
| UC-05 3a (Ditahan lalu Ditolak, pesan 3a.2) | 09, 10 |
| UC-01 langkah 3-10, S-2, 9a, S-1 | 11, 12, 13, 14, 15 |
| UC-02 langkah 3-8, 4a, 8a | 16, 17, 18, 19, 20 |
| UC-03 langkah 2-8, S-1, S-2, kotak masuk BIMA | 21, 22, 23, 24, 25, 26 |
| UC-04 langkah 3-7, S-1, label di J-03 | 27, 28, 29 |
| UC-07a (tanpa koreksi, Simpan Permanen) | 30, 33 |
| UC-07c (Draf, dimuat ulang) | 31, 32, 37 |
| UC-07b / UC-08 (koreksi, S-1 alasan kosong, 4a) | 34, 35, 36, 38 |
| UC-09 S-1, S-2 | 39, 40 |
| NFR 3.1 (403 reviewer lain) | 41 |
| Navigator demo terbuka (J-03), skenario J-04, navigator ciut tidak menutupi tombol | 42, 44, 52 |
| Skenario J-04: kosong, usulan menunggu, kekurangan reviewer (S-1), sudah ditetapkan | 43, 45, 46, 47 |
| Skenario J-03 butir Perlu ditinjau, J-05 belum ada penilaian final, J-06 Ditahan, J-08 final hanya-baca | 48, 49, 50, 51 |
| J-04 skala nyata 10.000: awal, S-1 (batas 60), usulan berhalaman + sebaran, halaman 2, sudah ditetapkan | 53, 54, 55, 56, 57 |
| Kotak masuk BIMA berisi 10.000 penugasan (ringkasan + 100 terbaru); skenario kecil sesudah skala nyata | 58, 59 |

## Hasil ukur J-04 skala nyata (10.000 proposal, 22 Okt 2026)

Lokal (`next start` di laptop) ke Neon `ap-southeast-1` dengan jeda jaringan laptop ke basis data ±250 ms per pernyataan; waktu server dari `log_audit` (`susun_penugasan`, `tetapkan_penugasan`) dan dari pesan di J-04. Rincian dan hasil produksi ada di ringkasan pekerjaan dan `docs/bukti-e2e/laporan.md`.

| Langkah | Waktu |
|---|---|
| Pembuatan data massal pertama (periode, 130 reviewer, 400 pengusul, 10.000 proposal + versi, VACUUM ANALYZE) | ±6 dtk di server (10-13 dtk dari buka J-04 di peramban) |
| Pemakaian berikutnya (kosongkan penugasan dan kotak masuk, VACUUM) | ±3,5 dtk |
| Susun Usulan Penugasan, 10.000 proposal, batas 100 | 6,3-8,3 dtk di server (langkah: daftar reviewer BIMA 0,7 dtk, salin akun 1,0-1,2 dtk, baca proposal 1,4 dtk, algoritma 0,3 dtk, simpan usulan 2,9-4,2 dtk); sekali terukur 16,6 dtk karena simpan usulan 13 dtk (jeda tulis Neon) |
| S-1 (batas 60: 2.560 proposal kekurangan) | 3-4 dtk di server |
| Tetapkan Penugasan, 10.000 proposal, 20 kelompok x 500 | 4,6-6,5 dtk di server (klaim 1,3 dtk, kirim ke BIMA 3,3-5,2 dtk) |
| Pindah ke halaman 2 usulan | ±2 dtk |
