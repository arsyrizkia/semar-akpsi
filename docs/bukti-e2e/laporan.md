# Laporan uji ujung ke ujung SEMAR

Dijalankan: 2026-10-22T20:05:58.249Z. Sasaran: server lokal (next start). Mode LLM: tiruan. Hasil: 29 dari 29 skenario lulus.

| Skenario | Hasil | Catatan |
|---|---|---|
| Beranda diarahkan ke J-01 Masuk | lulus | / menuju J-01; J-01 memuat Masuk dengan akun BIMA dan tautan Buka Pusat Demo; tanpa galat konsol (0.7 dtk) |
| /demo: Reset & isi data demo lewat modal konfirmasi | lulus | modal konfirmasi Reset & isi data demo, seed berhasil; sakelar masa pengusulan berpindah ke berjalan; tanpa galat konsol (22.9 dtk) |
| SSO J-01 dan guard peran | lulus | anggota Tim Kerja masuk ke J-04; anggota diarahkan dengan ?galat=akses saat membuka J-02; tanpa galat konsol (5.2 dtk) |
| UC-05a: proposal lolos semua butir (Terkirim) dan unduh templat di BIMA | lulus | BIMA Unduh Templat: 200, document, 10076 byte; J-06 menampilkan Terkirim, daftar butir Lolos, Bukti pengiriman, Kembali ke BIMA; tanpa galat konsol (43.1 dtk) |
| UC-05b / UC-06: ada butir gagal (Ditahan), diperbaiki lalu Terkirim V2 | lulus | butir Gagal paling atas: Bagian "Metode" tidak melebihi 1200 kata KTA-04 Gagal Metode 1.321 kata dari batas 1.200 (lebih 121 kata) Bagian "Metode; tombol Kembali ke BIMA berfungsi; S-1.3/S-1.4: ajukan ulang dengan naskah perbaikan menghasilkan Terkirim, kode versi V2, bukti pengiriman; tanpa galat konsol (162.8 dtk) |
| UC-05c: ditahan lalu ditolak karena masa pengusulan ditutup (3a) | lulus | Ditahan lebih dulu, lalu Ditolak setelah masa ditutup; pesan 3a.2 memuat tanggal tutup (23 Oktober 2026); tanpa galat konsol (51.1 dtk) |
| UC-01: menyusun templat (J-02, J-02b, S-2, M-01, jalur utama) | lulus | J-02: Unduh Templat (.docx) menghasilkan 200 dan tipe .docx; S-2: pesan Lengkapi isian yang ditandai, isian bertanda mendapat fokus, M-01 tidak terbuka; J-02b: Unduh Pratinjau (.docx) menyimpan draf lalu mengunduh; M-01: ringkasan versi, Batal menutup modal tanpa menerbitkan; jalur utama: M-01 Terbitkan, hasil s.10 tampil di J-02 dengan jumlah butir draf, Buka Aturan Pemeriksaan, Unduh Templat (.docx); tanpa galat konsol (28.9 dtk) |
| UC-01 9a: masa berjalan, draf disimpan, Buka Draf, Back | lulus | pesan 9a persis, Buka Draf dan Unduh Pratinjau (.docx); templat berlaku tidak berubah; Simpan Draf di J-02b, tombol Back kembali ke J-02 dengan pesan 9a (hasil ada di URL); tanpa galat konsol (23.3 dtk) |
| UC-01 S-1: skema belum punya templat | lulus | S-1: keterangan Skema ini belum memiliki templat; Susun Versi Baru membuka J-02b untuk versi 1; tanpa galat konsol (10.3 dtk) |
| UC-02: aturan pemeriksaan (J-03, M-02 galat, M-04 4a, J-03b, M-03, M-05 8a) | lulus | 4a: M-04 memuat pesan penolakan dan Buka Templat Proposal; form butir tidak dibuka; Tutup menutup modal; M-02: isian wajib kosong ditandai di dekat isiannya, modal tetap terbuka; butir manual semantik ditambahkan lewat M-02; J-03b: layar sendiri dengan ringkasan per contoh, tabel butir x contoh, Uji Ulang dan Kembali ke Aturan Pemeriksaan; kode butir di J-03b menaut ke baris J-03 yang tergulir ke layar; Back dari J-03 kembali ke J-03b; M-03: Nonaktifkan butir manual; butir nonaktif tersembunyi dengan pilihan Tampilkan butir nonaktif; 8a: tanggal berlaku di tengah masa pengusulan ditolak di dalam M-05; jalur utama: M-05 Simpan Versi menampilkan basis aturan versi baru tersimpan; tanpa galat konsol (35.1 dtk) |
| UC-03: menugaskan reviewer (J-04, J-04b, S-1, M-06 S-2, M-07, Back) | lulus | S-1: panel Kekurangan Reviewer tampil; tabel Usulan Penugasan (6 baris), Sebaran Beban, judul proposal menaut ke J-05b; S-2: pemindahan ke reviewer sealmamater ditolak, syarat tampil di dalam M-06; pemindahan yang memenuhi syarat mengganti reviewer dan menutup M-06; M-07: pesan ditetapkan dan tercatat di BIMA dengan tautan ke J-05 dan kotak masuk BIMA; kotak masuk BIMA tiruan menerima penugasan; Back dari kotak masuk BIMA kembali ke J-04b yang memuat penugasan ditetapkan; tanpa galat konsol (73.9 dtk) |
| UC-04: memantau kesesuaian (J-05, M-08, M-09, tautan ke J-03 dan J-05b) | lulus | tiga bagian laporan tampil; M-08 (sheet) terbuka, butir di URL; judul proposal di sheet menaut ke /tim-kerja/proposal/572f1a07-3282-4e91-a367-00acace2644f; M-09: butir yang ditandai berlabel Perlu ditinjau dan tampil di J-03 lewat tautan Buka Aturan Pemeriksaan; tanpa galat konsol (45.9 dtk) |
| J-05b: rincian proposal, tautan antarentitas, unduh berkas | lulus | Unduh Berkas: 4 berkas, semua status 200; Kembali ke Pemantauan membuka J-05; Back kembali ke J-05b; periode menaut ke J-04b; tanpa galat konsol (16.7 dtk) |
| UC-07a: menyetujui seluruh rekomendasi, J-08b dan M-11 Simpan Permanen | lulus | komponen belum diputuskan ditandai dengan teks, M-11 tidak terbuka; rekomendasi tidak dikoreksi dihitung disetujui; Simpan Permanen terkirim ke BIMA, isian hanya-baca; tanpa galat konsol (23.0 dtk) |
| UC-07c: menyimpan sementara lalu melanjutkan (Draf sudah terisi) | lulus | J-07 berlabel Draf; J-08b memuat ulang umpan balik dan keputusan komponen tersimpan; tanpa galat konsol (13.2 dtk) |
| UC-07b/UC-08: pemeriksaan reviewer (J-08, M-10 S-1 dan 4a, J-08b Simpan Sementara dan Permanen) | lulus | J-08 terbuka dalam 1.8 dtk; Unduh Berkas di J-08: 200 (application/vnd.openxmlformats-officedocument.wordprocessingml.document); butir menyorot kutipan (mark); butir dan tab tersimpan di URL sehingga muat ulang mempertahankannya; S-1: pesan Alasan koreksi wajib diisi dengan bingkai merah di dalam M-10; 4a: Batal menutup M-10; koreksi tersimpan dan butir berlabel Dikoreksi reviewer; Simpan Sementara menghasilkan label Draf di J-07; draf dan koreksi dimuat ulang saat Periksa lagi (J-07 ke J-08 ke J-08b); Simpan Permanen (M-11): terkirim ke BIMA, isian hanya-baca; tanpa galat konsol (43.8 dtk) |
| UC-09 S-1: kutipan LLM tidak ditemukan (Perlu diperiksa manual) | lulus | label Perlu diperiksa manual tampil pada butir yang kutipannya tidak ditemukan; tanpa galat konsol (11.2 dtk) |
| UC-09 S-2: LLM tidak merespons (Belum ada rekomendasi) | lulus | label Belum ada rekomendasi tampil; reviewer tetap dapat menilai; tanpa galat konsol (8.9 dtk) |
| Hak akses: 403 reviewer lain di J-08, J-08b, berkas; Tim Kerja boleh | lulus | halaman J-08 milik reviewer lain menampilkan 403 Akses ditolak; route data 403; J-08b 404; unduh berkas proposal 403; reviewer tidak dapat membuka J-05b (diarahkan dengan ?galat=akses); Tim Kerja mengunduh berkas (200); tanpa sesi tidak dapat; tanpa galat konsol (9.7 dtk) |
| Jalan pintas UC-06, UC-08, UC-09 membuka jendela yang benar | lulus | UC-06 membuka halaman pengajuan BIMA (proposal gagal jumlah kata); UC-08 dan UC-09 membuka J-08 langsung; panel langkah lama tidak ada lagi; navigator menggantikannya; tanpa galat konsol (27.8 dtk) |
| Alur bolak-balik: J-02, J-02b, M-01, unduh .docx, J-03, BIMA, J-06, kembali ke J-02 | lulus | J-02b: pratinjau .docx dari draf yang baru disimpan memuat judul bagian baru; J-02: Unduh Templat (.docx) memuat "Dampak Sosial E2E" sebagai judul bagian; J-03: butir turunan templat baru muncul; BIMA pengajuan: Unduh Templat memuat bagian baru; J-06: butir bagian baru diperiksa dan Gagal (naskah lama tidak memuat bagian itu), status Ditahan; J-02: Riwayat Versi memuat Terbit dan Arsip; versi Arsip dapat dibuka dan diunduh tanpa bagian baru; tanpa galat konsol (111.2 dtk) |
| Reset data demo sesudah alur bolak-balik | lulus | data demo dipulihkan; tanpa galat konsol (19.7 dtk) |
| Navigator demo: pindah layar/peran tidak mengubah data; 15 layar dapat dibuka | lulus | navigator memuat 15 layar dan menandai J-03 sebagai layar yang dibuka; pindah layar/peran (J-04b ke J-07 ke J-04b) tidak mengubah data usulan; J-01..J-08b dan dua halaman BIMA dapat dibuka dari navigator lewat Pindah layar; tanpa galat konsol (104.4 dtk) |
| Navigator demo: skenario J-04 dan J-04b, aktif ditampilkan, Pasang skenario menyiapkan data | lulus | J-04 Kosong: daftar periode tampil, pil dan panel menyebut skenario aktif, 6 skenario; J-04 siap-kecil: daftar periode menampilkan enam proposal belum ditugaskan; J-04b siap: enam proposal; navigator ciut tidak menutupi isian Batas Beban; pil di jendela yang dibuka lewat menu tidak menyebut skenario jendela lain (J-05 · skenario belum dipilih); J-04b menunggu: tabel Usulan Penugasan terisi; J-04b kekurangan: Susun otomatis dan panel Kekurangan Reviewer tampil; J-04b ditetapkan: penugasan tampil dan tercatat di kotak masuk BIMA; tanpa galat konsol (128.7 dtk) |
| Navigator demo: skenario di J-01, J-02, J-03, J-05, J-06, J-07, J-08, BIMA | lulus | J-01: belum masuk, masuk sebagai anggota (menu J-04/J-05 saja), masuk sebagai reviewer (J-07); J-02: tanpa templat (S-1), masa berjalan (9a), draf tersimpan; J-02b membuka draf di layar penyusunan; J-03: butir Perlu ditinjau muncul pada skenario khusus dan hilang pada normal; J-03b membuka laporan uji; J-05: belum ada penilaian final lalu data pemantauan contoh; J-06: Terkirim, Ditahan, Ditolak, dan Sedang diperiksa; J-07: kosong, Baru, Draf, Selesai; J-08: final hanya-baca, perlu diperiksa manual, belum ada rekomendasi, draf, normal; BIMA tiruan: halaman pengajuan membuka draf siap diajukan; tanpa galat konsol (288.0 dtk) |
| Navigator demo: sakelar masa pengusulan, papan ketik, dan ciut | lulus | sakelar masa pengusulan di navigator mengganti keadaan J-04b (berjalan lalu ditutup); papan ketik: Esc menciutkan, Alt+Shift+N membuka, fokus pindah ke panel, Tab menjangkau tombol; navigator ciut tidak menutupi tombol utama di J-04b (viewport 1440x900); tanpa galat konsol (16.9 dtk) |
| J-04 skala nyata: 10.000 proposal (S-1, susun, halaman dan Back, sebaran, M-07 tetapkan, kotak masuk BIMA) | lulus | menyiapkan skenario skala nyata (buka J-04): 15.2 dtk; S-1 batas 60: panel Kekurangan Reviewer tampil (11.0 dtk); Susun Usulan Penugasan 10.000 proposal: 24.9 dtk dari klik sampai pesan (Waktu proses di server: 20,5 detik); tabel Usulan Penugasan 50 baris dari 10.000 (halaman 1 dari 200); Sebaran Beban 119 reviewer, 119 reviewer bersedia; proposal per reviewer terendah 84, tertinggi 85, rata-rata 84, batas 100.; halaman 2 usulan terbuka dalam 1.8 dtk; hal=2 di URL; Back kembali ke halaman 1; Tetapkan Penugasan 10.000 proposal: 5.2 dtk dari klik sampai pesan (Waktu proses di server: 4,8 detik); kotak masuk BIMA: 10.000 penugasan diterima tanpa ganda, ringkasan + 100 pesan terbaru; CATATAN WAKTU: susun 24.9 dtk, tetapkan 5.2 dtk (klik sampai pesan, lokal ke Neon); tanpa galat konsol (68.1 dtk) |
| Skenario kecil tidak terpengaruh data skala nyata | lulus | skenario J-04b siap sesudah skala nyata: 7.0 dtk; 5 reviewer bersedia; proposal per review; J-07 Semua Selesai dan Baru tepat 1 baris; kotak masuk B-2 tetap memuat 10000 penugasan; /bima/masuk menyembunyikan akun skala (11 akun tampil); tanpa galat konsol (28.8 dtk) |
| Akhir: Reset & isi data demo (basis data bersih) | lulus | reset selesai; /demo memuat 44 kartu skenario per jendela dan tanpa navigator mengambang; tanpa galat konsol (20.2 dtk) |

## Tangkapan layar (1440 dan 390 px)

- e2e/hasil/01-j01-masuk-1440.png
- e2e/hasil/01-j01-masuk-390.png
- e2e/hasil/02-demo-1440.png
- e2e/hasil/02-demo-390.png
- e2e/hasil/03-m-reset-konfirmasi-1440.png
- e2e/hasil/03-m-reset-konfirmasi-390.png
- e2e/hasil/04-bima-masuk-1440.png
- e2e/hasil/04-bima-masuk-390.png
- e2e/hasil/05-bima-pengajuan-1440.png
- e2e/hasil/05-bima-pengajuan-390.png
- e2e/hasil/06-j06-terkirim-1440.png
- e2e/hasil/06-j06-terkirim-390.png
- e2e/hasil/07-j06-ditahan-1440.png
- e2e/hasil/07-j06-ditahan-390.png
- e2e/hasil/08-j06-05b-terkirim-v2-1440.png
- e2e/hasil/08-j06-05b-terkirim-v2-390.png
- e2e/hasil/09-j06-05c-ditahan-1440.png
- e2e/hasil/09-j06-05c-ditahan-390.png
- e2e/hasil/10-j06-ditolak-1440.png
- e2e/hasil/10-j06-ditolak-390.png
- e2e/hasil/11-j02-templat-1440.png
- e2e/hasil/11-j02-templat-390.png
- e2e/hasil/12-j02b-draf-1440.png
- e2e/hasil/12-j02b-draf-390.png
- e2e/hasil/13-j02b-isian-ditandai-1440.png
- e2e/hasil/13-j02b-isian-ditandai-390.png
- e2e/hasil/14-m01-konfirmasi-terbitkan-1440.png
- e2e/hasil/14-m01-konfirmasi-terbitkan-390.png
- e2e/hasil/15-j02-terbit-1440.png
- e2e/hasil/15-j02-terbit-390.png
- e2e/hasil/16-j02-9a-draf-1440.png
- e2e/hasil/16-j02-9a-draf-390.png
- e2e/hasil/17-j02-9a-kembali-1440.png
- e2e/hasil/17-j02-9a-kembali-390.png
- e2e/hasil/18-j02-s1-belum-ada-templat-1440.png
- e2e/hasil/18-j02-s1-belum-ada-templat-390.png
- e2e/hasil/19-j02b-versi-1-1440.png
- e2e/hasil/19-j02b-versi-1-390.png
- e2e/hasil/20-j03-aturan-1440.png
- e2e/hasil/20-j03-aturan-390.png
- e2e/hasil/21-j03-m04-4a-1440.png
- e2e/hasil/21-j03-m04-4a-390.png
- e2e/hasil/22-j03-m02-galat-1440.png
- e2e/hasil/22-j03-m02-galat-390.png
- e2e/hasil/23-j03-m02-form-1440.png
- e2e/hasil/23-j03-m02-form-390.png
- e2e/hasil/24-j03b-hasil-uji-1440.png
- e2e/hasil/24-j03b-hasil-uji-390.png
- e2e/hasil/25-j03-m03-nonaktifkan-1440.png
- e2e/hasil/25-j03-m03-nonaktifkan-390.png
- e2e/hasil/26-j03-m05-8a-1440.png
- e2e/hasil/26-j03-m05-8a-390.png
- e2e/hasil/27-j03-versi-tersimpan-1440.png
- e2e/hasil/27-j03-versi-tersimpan-390.png
- e2e/hasil/28-j04-daftar-periode-1440.png
- e2e/hasil/28-j04-daftar-periode-390.png
- e2e/hasil/29-j04b-awal-1440.png
- e2e/hasil/29-j04b-awal-390.png
- e2e/hasil/30-j04b-s1-kekurangan-1440.png
- e2e/hasil/30-j04b-s1-kekurangan-390.png
- e2e/hasil/31-j04b-usulan-1440.png
- e2e/hasil/31-j04b-usulan-390.png
- e2e/hasil/32-j04b-m06-s2-ditolak-1440.png
- e2e/hasil/32-j04b-m06-s2-ditolak-390.png
- e2e/hasil/33-j04b-m07-tetapkan-1440.png
- e2e/hasil/33-j04b-m07-tetapkan-390.png
- e2e/hasil/34-j04b-ditetapkan-1440.png
- e2e/hasil/34-j04b-ditetapkan-390.png
- e2e/hasil/35-bima-kotak-masuk-1440.png
- e2e/hasil/35-bima-kotak-masuk-390.png
- e2e/hasil/36-j05-pemantauan-1440.png
- e2e/hasil/36-j05-pemantauan-390.png
- e2e/hasil/37-j05-m08-rincian-butir-1440.png
- e2e/hasil/37-j05-m08-rincian-butir-390.png
- e2e/hasil/38-j05-m09-tandai-1440.png
- e2e/hasil/38-j05-m09-tandai-390.png
- e2e/hasil/39-j05-ditandai-1440.png
- e2e/hasil/39-j05-ditandai-390.png
- e2e/hasil/40-j03-perlu-ditinjau-1440.png
- e2e/hasil/40-j03-perlu-ditinjau-390.png
- e2e/hasil/41-j05b-rincian-proposal-1440.png
- e2e/hasil/41-j05b-rincian-proposal-390.png
- e2e/hasil/42-j08b-keputusan-1440.png
- e2e/hasil/42-j08b-keputusan-390.png
- e2e/hasil/43-j08b-s1-komponen-kosong-1440.png
- e2e/hasil/43-j08b-s1-komponen-kosong-390.png
- e2e/hasil/44-j08b-m11-simpan-permanen-1440.png
- e2e/hasil/44-j08b-m11-simpan-permanen-390.png
- e2e/hasil/45-j08b-final-1440.png
- e2e/hasil/45-j08b-final-390.png
- e2e/hasil/46-j07-07c-draf-1440.png
- e2e/hasil/46-j07-07c-draf-390.png
- e2e/hasil/47-j08b-07c-draf-dimuat-1440.png
- e2e/hasil/47-j08b-07c-draf-dimuat-390.png
- e2e/hasil/48-j07-daftar-penugasan-1440.png
- e2e/hasil/48-j07-daftar-penugasan-390.png
- e2e/hasil/49-j08-pemeriksaan-1440.png
- e2e/hasil/49-j08-pemeriksaan-390.png
- e2e/hasil/50-j08-m10-s1-alasan-kosong-1440.png
- e2e/hasil/50-j08-m10-s1-alasan-kosong-390.png
- e2e/hasil/51-j08-m10-form-1440.png
- e2e/hasil/51-j08-m10-form-390.png
- e2e/hasil/52-j08-dikoreksi-1440.png
- e2e/hasil/52-j08-dikoreksi-390.png
- e2e/hasil/53-j07-draf-1440.png
- e2e/hasil/53-j07-draf-390.png
- e2e/hasil/54-j08b-final-sesudah-koreksi-1440.png
- e2e/hasil/54-j08b-final-sesudah-koreksi-390.png
- e2e/hasil/55-j08-s1-perlu-manual-1440.png
- e2e/hasil/55-j08-s1-perlu-manual-390.png
- e2e/hasil/56-j08-s2-belum-ada-1440.png
- e2e/hasil/56-j08-s2-belum-ada-390.png
- e2e/hasil/57-j08-403-1440.png
- e2e/hasil/57-j08-403-390.png
- e2e/hasil/58-m-reset-konfirmasi-1440.png
- e2e/hasil/58-m-reset-konfirmasi-390.png
- e2e/hasil/59-bolak-balik-j02-terbit-1440.png
- e2e/hasil/59-bolak-balik-j02-terbit-390.png
- e2e/hasil/60-bolak-balik-j03-butir-baru-1440.png
- e2e/hasil/60-bolak-balik-j03-butir-baru-390.png
- e2e/hasil/61-bolak-balik-bima-unduh-templat-1440.png
- e2e/hasil/61-bolak-balik-bima-unduh-templat-390.png
- e2e/hasil/62-bolak-balik-j06-bagian-baru-1440.png
- e2e/hasil/62-bolak-balik-j06-bagian-baru-390.png
- e2e/hasil/63-bolak-balik-j02-riwayat-1440.png
- e2e/hasil/63-bolak-balik-j02-riwayat-390.png
- e2e/hasil/64-m-reset-konfirmasi-1440.png
- e2e/hasil/64-m-reset-konfirmasi-390.png
- e2e/hasil/65-navigator-terbuka-j03-1440.png
- e2e/hasil/65-navigator-terbuka-j03-390.png
- e2e/hasil/66-j04-kosong-1440.png
- e2e/hasil/66-j04-kosong-390.png
- e2e/hasil/67-navigator-skenario-j04-1440.png
- e2e/hasil/67-navigator-skenario-j04-390.png
- e2e/hasil/68-j04b-menunggu-1440.png
- e2e/hasil/68-j04b-menunggu-390.png
- e2e/hasil/69-j04b-kekurangan-navigator-1440.png
- e2e/hasil/69-j04b-kekurangan-navigator-390.png
- e2e/hasil/70-j04b-ditetapkan-navigator-1440.png
- e2e/hasil/70-j04b-ditetapkan-navigator-390.png
- e2e/hasil/71-j03-perlu-ditinjau-navigator-1440.png
- e2e/hasil/71-j03-perlu-ditinjau-navigator-390.png
- e2e/hasil/72-j05-belum-final-1440.png
- e2e/hasil/72-j05-belum-final-390.png
- e2e/hasil/73-j06-ditahan-navigator-1440.png
- e2e/hasil/73-j06-ditahan-navigator-390.png
- e2e/hasil/74-j08-final-navigator-1440.png
- e2e/hasil/74-j08-final-navigator-390.png
- e2e/hasil/75-navigator-ciut-1440.png
- e2e/hasil/75-navigator-ciut-390.png
- e2e/hasil/76-j04b-skala-awal-1440.png
- e2e/hasil/76-j04b-skala-awal-390.png
- e2e/hasil/77-j04b-skala-s1-1440.png
- e2e/hasil/77-j04b-skala-s1-390.png
- e2e/hasil/78-j04b-skala-usulan-1440.png
- e2e/hasil/78-j04b-skala-usulan-390.png
- e2e/hasil/79-j04b-skala-halaman-2-1440.png
- e2e/hasil/79-j04b-skala-halaman-2-390.png
- e2e/hasil/80-j04b-skala-ditetapkan-1440.png
- e2e/hasil/80-j04b-skala-ditetapkan-390.png
- e2e/hasil/81-bima-kotak-masuk-skala-1440.png
- e2e/hasil/81-bima-kotak-masuk-skala-390.png
- e2e/hasil/82-j04b-siap-sesudah-skala-1440.png
- e2e/hasil/82-j04b-siap-sesudah-skala-390.png
- e2e/hasil/83-m-reset-konfirmasi-1440.png
- e2e/hasil/83-m-reset-konfirmasi-390.png

## Masalah

- tidak ada
