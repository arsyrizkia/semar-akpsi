# Laporan uji ujung ke ujung SEMAR

Dijalankan: 2026-10-21T18:44:50.978Z. Mode LLM: tiruan. Hasil: 19 dari 19 skenario lulus.

| Skenario | Hasil | Catatan |
|---|---|---|
| Beranda dan J-01 Masuk | lulus | beranda memuat tautan Buka Pusat Demo dan Masuk; J-01 memuat Masuk dengan akun BIMA; tanpa galat konsol (0.4 dtk) |
| /demo: Reset & isi data demo | lulus | seed berhasil lewat tombol; sakelar masa pengusulan berpindah ke berjalan; tanpa galat konsol (0.6 dtk) |
| SSO J-01 dan guard peran | lulus | anggota Tim Kerja masuk ke J-04; anggota diarahkan dengan ?galat=akses saat membuka J-02; tanpa galat konsol (0.4 dtk) |
| UC-05a: proposal lolos semua butir (Terkirim) | lulus | J-06 menampilkan Terkirim, daftar butir Lolos, Bukti Pengiriman, Kembali ke BIMA; tanpa galat konsol (2.6 dtk) |
| UC-05b / UC-06: ada butir gagal (Ditahan) | lulus | butir Gagal paling atas: Bagian "Metode" tidak melebihi 1200 kata KTA-04 Metode Gagal 1.321 kata dari batas 1.200 (lebih 121 kata) Batas yang dil; J-06 menampilkan Ditahan, butir Gagal dengan batas dan angka pembukti, tanpa bukti pengiriman; tombol Kembali ke BIMA berfungsi; S-1.3/S-1.4: ajukan ulang dengan naskah perbaikan menghasilkan Terkirim, kode versi V2, bukti pengiriman; tanpa galat konsol (4.6 dtk) |
| UC-05c: ditahan lalu ditolak karena masa pengusulan ditutup (3a) | lulus | Ditahan lebih dulu, lalu Ditolak setelah masa ditutup; pesan 3a.2 memuat tanggal tutup (22 Oktober 2026); tanpa galat konsol (2.6 dtk) |
| UC-01: menyusun templat (jalur utama, S-2) | lulus | S-2: pesan Lengkapi isian yang ditandai dan isian bertanda; jalur utama: templat versi baru terbit, jumlah butir draf dan tombol Buka Aturan Pemeriksaan tampil; tanpa galat konsol (0.5 dtk) |
| UC-01 9a: masa pengusulan berjalan, templat disimpan sebagai draf | lulus | pesan 9a persis; templat berlaku tidak berubah; tanpa galat konsol (0.3 dtk) |
| UC-01 S-1: skema belum punya templat | lulus | S-1: keterangan Skema ini belum memiliki templat; Susun Versi Baru membuat versi 1; tanpa galat konsol (0.2 dtk) |
| UC-02: aturan pemeriksaan (jalur utama, 4a, 8a) | lulus | 4a: pesan penolakan dan tombol Buka Templat Proposal, panel tidak dibuka; butir manual semantik ditambahkan; Uji pada Contoh menampilkan panel Hasil Uji; 8a: tanggal berlaku di tengah masa pengusulan ditolak; jalur utama: Simpan Versi menampilkan pesan basis aturan versi baru tersimpan; tanpa galat konsol (1.5 dtk) |
| UC-03: menugaskan reviewer (jalur utama, S-1, S-2) | lulus | S-1: panel Kekurangan Reviewer tampil; tabel Usulan Penugasan (6 baris) dan Sebaran Beban tampil; baris pertama usulan: pengusul=Universitas Nusantara Contoh; reviewer=Prof. Wahyu Setiaji; S-2: pemindahan ke reviewer sealmamater ditolak dengan syarat yang dilanggar; S-2: pemindahan yang memenuhi syarat mengganti reviewer; pesan penugasan ditetapkan dan tercatat di BIMA; kotak masuk BIMA tiruan menerima penugasan; tanpa galat konsol (1.3 dtk) |
| UC-04: memantau kesesuaian (jalur utama, S-1, tandai butir) | lulus | tiga bagian laporan tampil; S-1: panel Rincian Butir terbuka dan ditutup dengan Tutup; butir yang ditandai berlabel Perlu ditinjau dan tampil di J-03; tanpa galat konsol (0.8 dtk) |
| UC-07a: menyetujui seluruh rekomendasi (tanpa koreksi) | lulus | rekomendasi tidak dikoreksi (dihitung disetujui), Simpan Permanen berhasil dan terkirim ke BIMA; tanpa galat konsol (0.4 dtk) |
| UC-07c: menyimpan sementara lalu melanjutkan (Draf sudah terisi) | lulus | J-07 berlabel Draf; J-08 memuat ulang umpan balik dan keputusan komponen tersimpan; tanpa galat konsol (0.2 dtk) |
| UC-07b/UC-08: pemeriksaan reviewer (jalur utama, S-1 alasan kosong, 4a Batal, simpan sementara dan permanen) | lulus | J-08 terbuka dalam 0.1 dtk; mengklik butir menyorot kutipan (mark) di panel kiri; S-1: pesan Alasan koreksi wajib diisi dengan bingkai merah; 4a: Batal menutup panel koreksi; koreksi tersimpan dan butir berlabel Dikoreksi reviewer; S-1 UC-07: Simpan Sementara menghasilkan label Draf di J-07; draf dan koreksi dimuat ulang saat Periksa lagi; Simpan Permanen: pesan Penilaian tersimpan dan terkirim ke BIMA, isian hanya-baca; tanpa galat konsol (1.4 dtk) |
| UC-09 S-1: kutipan LLM tidak ditemukan (Perlu diperiksa manual) | lulus | label Perlu diperiksa manual tampil pada butir yang kutipannya tidak ditemukan; tanpa galat konsol (0.3 dtk) |
| UC-09 S-2: LLM tidak merespons (Belum ada rekomendasi) | lulus | label Belum ada rekomendasi tampil; reviewer tetap dapat menilai; tanpa galat konsol (0.7 dtk) |
| Reviewer lain mendapat 403 di J-08 | lulus | halaman J-08 milik reviewer lain menampilkan 403 Akses ditolak; route data J-08 mengembalikan HTTP 403; tanpa galat konsol (0.1 dtk) |
| Jalan pintas UC-06, UC-08, UC-09 membuka jendela yang benar | lulus | UC-06 membuka halaman pengajuan BIMA (proposal gagal jumlah kata); UC-08 dan UC-09 membuka J-08 langsung; PanelPemandu tampil di J-08; tanpa galat konsol (0.4 dtk) |

## Tangkapan layar (1440x900)

- e2e/hasil/01-beranda.png
- e2e/hasil/02-j01-masuk.png
- e2e/hasil/03-demo.png
- e2e/hasil/04-bima-masuk.png
- e2e/hasil/05-bima-pengajuan.png
- e2e/hasil/06-j06-pemandu-uc05.png
- e2e/hasil/07-j06-terkirim.png
- e2e/hasil/08-j06-ditahan.png
- e2e/hasil/09-j06-05b-terkirim-v2.png
- e2e/hasil/10-j06-05c-ditahan.png
- e2e/hasil/11-j06-ditolak.png
- e2e/hasil/12-j02-templat.png
- e2e/hasil/13-j02-isian-ditandai.png
- e2e/hasil/14-j02-terbit.png
- e2e/hasil/15-j02-9a-draf.png
- e2e/hasil/16-j02-s1-belum-ada-templat.png
- e2e/hasil/17-j03-aturan.png
- e2e/hasil/18-j03-4a.png
- e2e/hasil/19-j03-hasil-uji.png
- e2e/hasil/20-j03-8a.png
- e2e/hasil/21-j03-versi-tersimpan.png
- e2e/hasil/22-j04-awal.png
- e2e/hasil/23-j04-s1-kekurangan.png
- e2e/hasil/24-j04-usulan.png
- e2e/hasil/25-j04-s2-ditolak.png
- e2e/hasil/26-j04-ditetapkan.png
- e2e/hasil/27-bima-kotak-masuk.png
- e2e/hasil/28-j05-pemantauan.png
- e2e/hasil/29-j05-rincian-butir.png
- e2e/hasil/30-j03-perlu-ditinjau.png
- e2e/hasil/31-j08-07a-final-tanpa-koreksi.png
- e2e/hasil/32-j07-07c-draf.png
- e2e/hasil/33-j08-07c-draf-dimuat.png
- e2e/hasil/34-j07-daftar-penugasan.png
- e2e/hasil/35-j08-pemeriksaan.png
- e2e/hasil/36-j08-s1-alasan-kosong.png
- e2e/hasil/37-j08-dikoreksi.png
- e2e/hasil/38-j07-draf.png
- e2e/hasil/39-j08-final.png
- e2e/hasil/40-j08-s1-perlu-manual.png
- e2e/hasil/41-j08-s2-belum-ada.png
- e2e/hasil/42-j08-403.png
- e2e/hasil/43-j08-pemandu.png

## Masalah

- tidak ada
