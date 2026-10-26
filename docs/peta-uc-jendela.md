# Peta use case ke jendela

Sumber langkah: `docs/sumber/bab10-use-scenario-real-use-case.md` (real use case). Nomor langkah di tabel adalah nomor real use case; S- adalah *SubFlow*, Nx adalah *Alternate Flow*. Jalan pintas: halaman `/demo` (kartu UC dan skenario) atau alamat `/demo/mulai?k=<kode>` (tambahkan `&j08=1` pada UC-07a/b/c untuk membuka J-08 langsung; UC-08 dan UC-09-S1/S2 selalu membuka J-08, UC-07a/b/c tanpa `j08=1` mendarat di J-07). Setiap jalan pintas menyiapkan data, memasang sesi peran yang sesuai, lalu membuka jendela awal. **Navigator demo** (pil di kiri bawah setiap halaman SEMAR dan BIMA tiruan, bawaan ciut, sengaja di sisi kiri supaya tidak menutupi kolom aksi tabel; Alt+Shift+N membuka, Esc menciutkan) menggantikan panel langkah real use case: ia berpindah antar-jendela dan antar-skenario keadaan (katalog di bawah) lewat `/demo/mulai?j=<jendela>&s=<skenario>`. Data langkah real use case tetap di `src/lib/demo/pemandu/` sebagai dokumentasi, tidak lagi ditampilkan.

## Jendela (layar)

Layar adalah halaman sendiri: punya alamat, dapat dibuka lewat tautan langsung, dan tombol Back peramban bekerja (pilihan skema, periode, versi, tab, butir, dan halaman tabel ada di URL). Judul tab memuat kode, misalnya "J-02 Templat Proposal". Kode jendela kecil di *breadcrumb* menjaga ketertelusuran ke Bab 10.

| Kode | Layar | Peran | Rute | UC |
|---|---|---|---|---|
| J-01 | Masuk | Tim Kerja DPPM, Reviewer | `/masuk` (`/` diarahkan ke sini; SSO tiruan lewat `/bima/masuk` lalu `/api/sso/callback`) | - |
| J-02 | Templat Proposal (daftar) | Tim Kerja (pengelola) | `/tim-kerja/templat?tahun=&skema=&status=` | UC-01 s.1-3 |
| J-02a | Rincian Templat (tab Bagian, Aturan Pemeriksaan, Lampiran, Halaman Depan) | Tim Kerja (pengelola) | `/tim-kerja/templat/[idTemplat]?tab=&periode=&sorot=&hasil=` (`/susun` mengalihkan) | UC-01 s.4-10 |
| J-03 | Aturan Pemeriksaan (tab di J-02a, tanpa menu sendiri) | Tim Kerja (pengelola) | `/tim-kerja/templat/[idTemplat]?tab=aturan`; `/tim-kerja/aturan?skema=&periode=&sorot=` (juga `butir=`) mengalihkan ke sini | UC-02 |
| J-03b | Hasil Uji pada Contoh | Tim Kerja (pengelola) | `/tim-kerja/aturan/uji?skema=&periode=&templat=&uji=` (hasil tersimpan) | UC-02 s.6 |
| J-04 | Penugasan Reviewer | Tim Kerja | `/tim-kerja/penugasan` (tautan lama `?susun=1` dialihkan ke J-04b periode aktif) | UC-03 s.1 |
| J-04b | Usulan Penugasan | Tim Kerja | `/tim-kerja/penugasan/[idPeriode]?tab=usulan\|sebaran\|ditetapkan&q=&rev=&inst=&skema=&syarat=melanggar&urut=&per=&hal=` (`?susun=1` hanya dari skenario S-1; `?tetap=n` pesan sesudah Tetapkan) | UC-03 s.2-8 |
| J-05 | Pemantauan Kesesuaian | Tim Kerja | `/tim-kerja/pemantauan?periode=&skema=&tab=&urut=&butir=` (tab: kosong = Butir Semantik, `deterministik`, `tren`) | UC-04 |
| J-05b | Rincian Proposal | Tim Kerja | `/tim-kerja/proposal/[idProposal]` (id BIMA atau uuid) | UC-04, penunjang |
| J-06 | Hasil Pemeriksaan Pengajuan | Pengusul (dibuka dari BIMA) | `/pengusul/hasil/[idProposal]` (diawali `/pengusul/mulai`) | UC-05/06 |
| J-07 | Daftar Penugasan | Reviewer | `/reviewer/penugasan` | UC-07 |
| J-08 | Pemeriksaan Proposal | Reviewer | `/reviewer/pemeriksaan/[penugasanId]?tab=&butir=` (data JSON: `.../data`) | UC-07/08/09 |
| J-08b | Keputusan Penilaian | Reviewer | `/reviewer/pemeriksaan/[penugasanId]/keputusan` | UC-07 s.9-12 |
| BIMA | Halaman BIMA tiruan | Semua (simulasi) | `/bima/masuk`, `/bima/pengajuan` (Unduh Templat), `/bima/kotak-masuk` (ID proposal menaut ke J-05b) | UC-05, API |

Unduhan (rute): `/api/semar/templat/[idTemplat]/unduh` (J-02 per versi, J-02b pratinjau), `/api/semar/contoh/[kode]/unduh` (M-15 dan J-03b: PDF asli BIMA `pdf-asli-NN` dikirim apa adanya dari tabel `contoh_asli`; contoh rekaan dibangkitkan ulang sebagai .docx berformat templat resmi; unggahan tidak disimpan berkasnya, 404; hanya pengelola), `/api/semar/templat/berlaku/[idSkema]/unduh` (BIMA pengajuan dan Tim Kerja), `/api/semar/proposal/[idProposal]/berkas/[idBerkas]` (J-05b dan J-08; reviewer hanya penugasannya, selain itu 403; tanpa sesi 401). Gambar naskah per bagian: `/api/semar/proposal/[idProposal]/gambar/[idGambar]` (J-08, hak akses sama dengan unduh berkas; gambar harus milik versi proposal itu).

## WND prototipe: layar, modal, transisi, pemicu

Modal memakai Dialog `radix-ui` (fokus terjebak, Esc menutup, `aria-labelledby`). Karena modal dibuka lewat state (tanpa `Dialog.Trigger`), Radix tidak tahu pemicunya; `useKembalikanFokus` di `src/components/ui/modal.tsx` mengingat elemen yang fokus saat modal dibuka dan mengembalikannya saat ditutup (diuji e2e untuk M-reset, M-06, M-10). M-10 tetap terpasang antar pembukaan; M-08 berbentuk *sheet* dari kanan. Modal ditutup kembali ke layar yang sama. Label tombol, isian, dan pesan real use case ditulis persis (`docs/spesifikasi-ui.md`).

| Dari | Pemicu (tombol/tautan) | Ke | Jenis | Catatan |
|---|---|---|---|---|
| J-01 | "Masuk dengan akun BIMA" | BIMA masuk lalu J-02 (pengelola), J-04 (anggota), J-07 (reviewer) | layar | SSO tiruan |
| J-02 | "Susun Versi Baru" / "Buka Draf Versi N" / "Buka Draf" | J-02b | layar | S-3: draf tersimpan dibuka kembali |
| J-02 | "Unduh Templat (.docx)" (per versi), "Lihat" pada Riwayat Versi, nomor versi, "Lihat templat berlaku" | unduhan; J-02 `?versi=` | unduhan; layar | |
| J-02b | "Terbitkan" | M-01 Konfirmasi Terbitkan | modal | isian belum lengkap: S-2 "Lengkapi isian yang ditandai", modal tidak terbuka |
| M-01 | "Terbitkan" | J-02 `?hasil=terbit` (s.10) atau `?hasil=draf` (9a) | layar | "Buka Aturan Pemeriksaan" dan "Unduh Templat (.docx)" / "Buka Draf" dan "Unduh Pratinjau (.docx)" |
| J-02b | "Unduh Pratinjau (.docx)" | unduhan (draf disimpan dulu) | unduhan | hanya Isian Substansi A-H (halaman depan dan lampiran milik BIMA; 24 Okt 2026) |
| J-02b | "Atur Ketentuan" (per baris bagian) | M-12 Ketentuan Bagian | modal | dipakai untuk "Tambah Bagian" dan "Atur Ketentuan"; ukuran lg dengan isi bergulir; empat kelompok: Tipe Isian (teks, daftar, tabel, daftar pustaka), Batas Kata (minimal dan maksimal), Wajib Memuat (gambar berketerangan, tabel, sitasi bernomor, frasa wajib, unsur isi), Petunjuk Pengisian (disusun otomatis, "Susun ulang petunjuk", boleh disunting); tiap pilihan berlabel Deterministik atau Semantik; pratinjau "Butir cek yang akan lahir dari bagian ini"; validasi di dekat isian, "Terapkan" nonaktif bila tidak sah; Batal pada bagian baru membuang barisnya |
| J-02b | "Simpan Draf" | J-02b (toast) | - | Back membuka J-02 |
| J-03 | "Tambah Butir" / "Ubah" (butir manual) | M-02 Form Butir | modal | galat tampil di dekat isian |
| J-03 | "Ubah" (butir turunan templat) | M-04 Butir Turunan Templat | modal | pesan 4a; "Buka Templat Proposal" ke J-02, "Tutup" |
| J-03 | "Nonaktifkan" | M-03 Konfirmasi Nonaktifkan | modal | |
| J-03 | "Simpan Versi" | M-05 Simpan Versi | modal | 8a ditolak di dalam modal |
| J-03 | "Uji pada Contoh" | M-15 Uji pada Contoh (pilih contoh tersedia: empat PDF asli BIMA lebih dulu, lalu contoh rekaan A/B/C/F, masing-masing dengan "Unduh .pdf"/"Unduh .docx"; yang diuji hanya Isian Substansi A-H, dan/atau unggah .docx/.pdf maks. 3,5 MB; "Jalankan Uji" menampilkan kemajuan: glif berdenyut + kata kerja + detik + persen, bilah persen, butir yang sedang dinilai, log langkah selesai; "Hentikan") lalu J-03b | modal ke layar | |
| J-03b | kode butir; "Kembali ke Aturan Pemeriksaan"; "Uji Ulang"; "Unduh .docx" (Ringkasan per Contoh, contoh bawaan) | J-03 (baris tersorot); J-03; M-15 lalu J-03b; unduhan | layar; layar; modal; unduhan | |
| J-03 | "Templat Proposal {skema}"; gembok "templat" pada butir turunan | J-02 (skema yang sama) | layar | |
| J-03 | "ditandai di Pemantauan" (butir berlabel Perlu ditinjau) | J-05 `?periode=&skema=&butir=` (M-08 butir itu terbuka) | layar + modal | |
| M-02 | "Simpan Butir" | J-03 (baris butir tersorot, toast) | modal ke layar | papan tidak dipasang ulang saat id basis berganti, sorotan bertahan |
| M-03 | "Nonaktifkan" | J-03 (butir hilang dari daftar, toast) | modal ke layar | |
| M-04 | "Buka Templat Proposal" / "Tutup" | J-02 / J-03 | layar / modal | |
| M-05 | "Simpan Versi" | J-03 (pesan versi tersimpan bersama kepala tabel versi baru) | modal ke layar | |
| J-04 | nama periode / "Buka Usulan" | J-04b | layar | |
| J-04b | "Pindahkan" (baris) atau "Pindahkan n proposal" (bilah aksi baris terpilih, termasuk "Pilih semua n hasil filter") | M-06 Pindahkan Proposal | modal | Reviewer Pengganti dipilih (combobox) atau "Pilihkan otomatis"; pratinjau syarat sebelum simpan; syarat yang dilanggar tampil di dalam modal (S-2) |
| J-04b | "Tetapkan Penugasan" (satu-satunya tombol utama, di kepala) | M-07 Tetapkan n penugasan? | modal | ditolak bila ada usulan melanggar syarat; gagal dari BIMA: tombol menjadi "Kirim ulang" |
| J-04b | tab Usulan Penugasan, Sebaran Beban, Sudah Ditetapkan; "Lihat proposal" (Sebaran Beban); nama reviewer di baris | tab yang sama dengan `?tab=`; tab Usulan dengan `?rev=` | layar | |
| J-04b | judul proposal; "Pantau Kesesuaian"; "Kotak Masuk BIMA (simulasi)" (tab Sudah Ditetapkan) | J-05b; J-05 `?periode=` (periode J-04b itu); kotak masuk BIMA | layar | |
| M-06 | "Simpan Pemindahan" | J-04b (reviewer baris berganti, toast) | modal ke layar | ditolak: tetap di modal |
| M-07 | "Tetapkan Penugasan" | J-04b (pesan ditetapkan, "Buka Pemantauan Kesesuaian" ke J-05 periode ini, "Lihat di Kotak Masuk BIMA (simulasi)") | modal ke layar | pesan susun lama disembunyikan |
| J-05 | "Rincian" (daftar Perlu perhatian); nama butir (tab Butir Semantik dan Gagal Deterministik) | M-08 Rincian Butir (sheet, `?butir=`) | modal | "Tutup"; "Tandai butir ini" (butir Aktif) ke M-09; judul proposal di sheet ke J-05b |
| J-05 | "Buka di Aturan Pemeriksaan" (butir yang sudah ditandai di Perlu perhatian) | J-03 baris butir (`&butir=`), periode simulasi ikut | layar | hanya pengelola |
| J-05 | Periode Seleksi, Skema Pendanaan; tab; kepala kolom tabel Butir Semantik | J-05 dengan `?periode=&skema=`, `?tab=`, `?urut=` | layar | berganti langsung tanpa tombol; Back mengembalikan pilihan |
| J-05 | centang "Perlu Diperbaiki" lalu "Tandai Butir (n)" | M-09 Konfirmasi Tandai Butir | modal | tanpa centang: pesan "Pilih minimal satu butir" |
| J-05b | "Unduh Berkas"; "Kembali ke Pemantauan"; periode; skema; "vN" templat; "vN" aturan | unduhan; J-05; J-04b; J-02 (pengelola); J-02 `?versi=` (pengelola); J-03 `?skema=&periode=` (pengelola) | unduhan; layar | status Penilaian mengikuti label J-07 (Baru, Draf, Selesai) |
| M-08 | "Tutup" / Esc | J-05 (tanpa `?butir=`) | modal ke layar | dibuka dengan `replace`: satu Back keluar dari J-05 |
| M-09 | "Tandai Butir" | J-05 (baris berlabel Perlu ditinjau, "Sudah ditandai", dengan "Buka di Aturan Pemeriksaan" ke J-03 `&butir=`) | modal ke layar | satu toast singkat |
| J-06 | "Kembali ke BIMA" | BIMA pengajuan | layar | satu-satunya tombol |
| J-07 | "Periksa" / judul proposal | J-08 | layar | |
| J-08 | "Tidak Setuju" / "Ubah Koreksi" | M-10 Koreksi Rekomendasi | modal | S-1 alasan kosong di dalam modal; "Batal" menutup |
| J-08 | "Unduh Berkas" | unduhan | unduhan | 403 bila bukan penugasannya |
| J-08 | "Lanjut ke Keputusan" / "Lihat Keputusan"; "Kembali ke Daftar Penugasan"; breadcrumb "Daftar Penugasan" | J-08b; J-07 | layar | |
| M-10 | "Simpan Koreksi" / "Batal" | J-08 (butir berlabel Dikoreksi reviewer, toast) | modal ke layar | fokus kembali ke "Tidak Setuju" / "Ubah Koreksi" |
| J-08b | "Simpan Permanen" | M-11 Simpan Permanen | modal | komponen kosong ditandai dan modal tidak terbuka |
| J-08b | "Simpan Sementara"; "Kembali ke Pemeriksaan"; "Tinjau butir semantik"; breadcrumb "Daftar Penugasan" dan "Pemeriksaan Proposal" | J-08b (toast); J-08 (`router.back()` bila datang dari J-08, tab dan butir terakhir terbawa); J-08; J-07 | - ; layar | isian belum disimpan dijaga `CegatTinggalkan` (modal "Tinggalkan tanpa menyimpan?"): Simpan Sementara lalu pindah, Tinggalkan, Batal |
| M-11 | "Simpan Permanen" | J-08b hanya-baca ("Penilaian tersimpan dan terkirim ke BIMA", "Kembali ke Daftar Penugasan" ke J-07) | modal ke layar | judul "Konfirmasi Simpan Permanen" |
| J-02b | breadcrumb "Templat Proposal"; menu sidebar | J-02; layar lain | layar | isian belum disimpan dijaga `CegatTinggalkan` (Simpan Draf lalu pindah, Tinggalkan, Batal) |
| BIMA pengajuan | "Unduh Templat" | unduhan templat Terbit skema itu | unduhan | |
| BIMA pengajuan | "Ajukan Usulan" | J-06 | layar | |
| BIMA kotak masuk | ID proposal | J-05b | layar | khusus demo |
| Pusat Demo | "Reset & isi data demo" | modal konfirmasi lalu data direset | modal | satu-satunya selain "Pasang skenario" yang mengubah data |
| Navigator | "Pindah layar/peran" | layar pilihan (`/demo/pindah`) | layar | tidak mengubah data demo yang tampil; hanya memasang sesi peran bila perlu. Satu kekecualian tak terlihat: membuka J-08/J-08b membuat baris penilaian kosong (UC-07 s.5 «create»); statusnya tidak tampil sebagai Draf (J-05b mengikuti label J-07) |
| Tautan langsung tanpa sesi | layar SEMAR mana pun | `/masuk?lanjut=<jalur>` lalu BIMA lalu `/api/sso/callback?lanjut=` | layar | tujuan semula dipulihkan sesudah masuk; peran tidak cocok: `?galat=akses` |
| Navigator | "Pasang skenario" | layar skenario (`/demo/mulai`) | layar | menyiapkan data dan menyatakannya di catatan skenario |

## Katalog skenario per jendela (Navigator demo)

Alamat: `/demo/mulai?j=<kode jendela>&s=<id skenario>`; tanpa `s` (berpindah jendela dari navigator) dipakai skenario bawaan: `siap-kecil` untuk J-04, `bermasalah` untuk J-05, `baru` untuk J-07, selain itu skenario pertama. Setiap skenario menyiapkan data (idempoten, tanpa reset), memasang sesi peran yang sesuai (SEMAR dan BIMA), mencatat skenario aktif di cookie `semar_skenario` (ditampilkan di pil dan panel navigator), lalu membuka jendela. Panel navigator otomatis menciut sebelum berpindah (kemajuan tampil di pil), supaya jendela tujuan tidak tertutup; pil ringkas ("J-04 · Kosong") hanya menyebut skenario bila kodenya sama dengan jendela yang sedang dibuka (selain itu "skenario belum dipilih"). Bagian skenario jendela yang dibuka ada di atas deretan chip jendela (J-01..J-08, B-1, B-2; nama dan skenario bawaan di tooltip). `/demo/mulai` mengubah data, jadi menolak prefetch, permintaan non-navigasi, dan perayap/pratinjau tautan (405); `/demo` bermeta noindex, tautannya `rel=nofollow`, `robots.txt` melarang `/demo`. Kode di `src/lib/demo/katalog.ts` (daftar) dan `src/lib/demo/skenario.ts:siapkanSkenario` (penyiap). Sakelar masa pengusulan juga ada di navigator. Daftar yang sama tampil di `/demo` ("Skenario keadaan per jendela").

| Jendela (peran) | Skenario (id) dan keadaan yang disiapkan |
|---|---|
| J-01 Masuk | `belum-masuk` sesi dihapus, halaman Masuk; `pengelola` sesi pengelola, mendarat di J-02; `anggota` sesi anggota, mendarat di J-04 (menu J-04 dan J-05); `reviewer` sesi reviewer-2, mendarat di J-07 |
| J-02 Templat Proposal (pengelola) | `normal` templat PD berlaku, masa ditutup; `tanpa-templat` skema PK tanpa templat (S-1); `masa-berjalan` Terbitkan menyimpan draf (9a); `draf-tersimpan` draf versi berikutnya sudah ada |
| J-03 Aturan Pemeriksaan (pengelola) | `normal` tabel butir PD, masa ditutup; `perlu-ditinjau` satu butir manual berstatus Perlu ditinjau (dari UC-04); `uji-tanggal` masa berjalan, tanggal berlaku di tengah masa ditolak (8a). Mendarat langsung di tabel butir (skema dan periode terpilih) |
| J-02b Penyusunan Templat (pengelola) | `draf` draf versi berikutnya skema PD dibuka di layar penyusunan |
| J-03b Hasil Uji pada Contoh (pengelola) | `hasil` basis aturan PD normal; uji tersimpan atas contoh A, B, C (dijalankan langsung di server, semantik tiruan) |
| J-04 Penugasan Reviewer (Tim Kerja) | `kosong` tidak ada proposal Terkirim yang perlu ditugaskan dan tidak ada usulan ("Tidak ada proposal Terkirim yang masih perlu ditugaskan pada periode ini." dan "Tidak ada usulan yang menunggu penetapan."); `siap-kecil` tepat enam proposal Terkirim (kelebihan dibuang, kekurangan dibuat; cermin klon di BIMA ikut dibersihkan), batas beban 3; `menunggu` usulan sudah disusun (batas 3) dan belum ditetapkan; `kekurangan` batas beban 1, Susun ditekan otomatis (`?susun=1`) sehingga panel Kekurangan Reviewer (S-1) tampil; `ditetapkan` usulan sudah ditetapkan dan ada di kotak masuk BIMA; `skala` **10.000 proposal Terkirim** (lihat di bawah). Sejak 25 Okt 2026 `siap`, `menunggu`, `kekurangan` (batas 35), `ditetapkan` memakai periode **Simulasi Contoh 2026 (1.200 proposal)**: 1.200 proposal PD/PT dari 14 institusi timpang, 30 reviewer bersedia (reviewer-1..6 + rvw-c12-*), batas 45; `siap-kecil` tetap enam proposal |
| J-04b Usulan Penugasan (Tim Kerja) | `siap` 1.200 proposal, batas 45; `menunggu` 1.200 usulan disusun, belum ditetapkan; `kekurangan` batas 35 dan Susun otomatis (S-1, saran batas terkecil yang cukup); `ditetapkan` sudah ditetapkan dan tercatat di BIMA; `siap-kecil` enam proposal, batas 3 |
| J-05 Pemantauan (Tim Kerja) | Periode Simulasi Contoh 2026 (1.200 proposal; data dari `src/lib/demo/pemantauan-skenario.ts`, ditulis `pemantauan.ts`): masa penilaian 7 hari, hari ini = hari ke-n skenario. `bermasalah` (hari ke-5, sesuai jadwal) UNS-10 ±58% disetujui, terlalu longgar, kutipan salah tempat, memburuk tiap hari; `terlalu-ketat` (hari ke-6) KTA-04 gagal ±26% pengajuan dan >40% di Universitas Nusantara Contoh, UNS-09 dibalik ke Memenuhi; `sesudah-perbaikan` (hari ke-7, semua final) UNS-10 ditandai hari 3, basis versi baru berlaku hari 4 (±59% menjadi ±92%); `terlambat` (hari ke-6) baru ±48% final, lima reviewer belum menilai, proyeksi ±500 penugasan belum final pada tenggat; `sehat` (hari ke-7) semua final tepat waktu, semua butir >= 90%; `awal` (hari ke-1) 24 penilaian final, semua butir belum cukup data. Periode 2026 contoh: `contoh` data kecil (dua Ditahan, satu Final dengan tiga koreksi); `belum-final` tanpa penilaian final |
| J-05b Rincian Proposal (Tim Kerja) | `contoh` rincian PRP-2026-0004 dengan penilaian dan koreksi |
| J-06 Hasil Pemeriksaan (pengusul) | `terkirim` semua butir lolos, bukti pengiriman; `ditahan` Metode melebihi batas; `ditolak` masa ditutup (3a); `diperiksa` pemeriksaan sedang berjalan (lewat 2 menit berubah menjadi galat batas waktu NFR 2.1) |
| J-07 Daftar Penugasan (reviewer) | `kosong` reviewer-6 tanpa penugasan; `baru` PRP-2026-0004 berlabel Baru; `draf` penilaian sebagian tersimpan; `selesai` penilaian final terkirim ke BIMA |
| J-08 Pemeriksaan Proposal (reviewer-2) | `normal` hasil semantik normal; `perlu-manual` kutipan tidak ditemukan (S-1); `belum-rekomendasi` LLM tidak merespons (S-2); `draf` tiga komponen dan umpan balik terisi; `final` Simpan Permanen sudah dilakukan, isian hanya-baca |
| J-08b Keputusan Penilaian (reviewer-2) | `draf` tiga komponen dan umpan balik terisi, Simpan Permanen belum ditekan |
| BIMA Pengajuan (pengusul) | `lolos` PRP-2026-0001; `ditahan` PRP-2026-0002 (Metode melebihi batas); `ditolak` PRP-2026-0003 (tutup masa lalu ajukan ulang) |
| BIMA Kotak masuk | `normal` ringkasan (jumlah penugasan, penerima, penerima terbanyak) dan 100 pesan terbaru |

### J-04 skala nyata (10.000 proposal)

- **Data** (`src/lib/demo/skala.ts`): periode tersendiri "Skala Nyata 2026 (10.000 proposal)" dengan masa pengusulan ditutup; 10.000 proposal Terkirim (`SKL-2026-NNNNN`, satu versi V1 tiap proposal) dari 4.000 pengusul (2-3 proposal tiap pengusul) di 40 institusi rekaan, judul dari topik x pendekatan x wilayah (semua skema PD); 130 reviewer rekaan (setiap reviewer ke-11 tidak bersedia, sisanya 119 ditambah 5 reviewer contoh = ±124 bersedia; kesediaan hanya biner, belum per bidang). Tabel J-04 diurutkan menurut id proposal. Dibuat set-based sekali (±5 dtk); pemakaian berikutnya hanya mengosongkan penugasan dan kotak masuk hasil percobaan sebelumnya. Reset menghapusnya.
- **Isolasi**: J-04 membuka periode ini hanya bila `pengaturan_demo.periode_aktif_id` menunjuknya. Semua skenario lain hanya mengosongkan penunjuk itu; **data skala (penugasan periode skala dan pesan `SKL-2026-*` di kotak masuk BIMA) tidak dihapus** selain lewat "Reset & isi data demo" (keputusan 22 Okt, `docs/keputusan.md` "Data skala nyata"). Kumpulan reviewer periode skala hanya akun `rvw-skala-*`, sehingga reviewer contoh reviewer-1..5 tidak ikut dibagi dan tidak ada yang bocor ke J-07/J-01; skenario kecil tidak melihat data skala karena periodenya tidak aktif. Skenario J-07, J-08, dan J-01/reviewer juga mendaur ulang penugasan klon J-04. Sakelar masa di navigator ikut menggeser `tanggalTutup` periode skala.
- **Batas beban bawaan 100** (rentang naskah 30-200): ±124 reviewer x 100 = ±12.400 kapasitas, cukup untuk 10.000 (beban merata 80-81 per reviewer). Batas 60 memicu S-1 (kapasitas 7.440 < 10.000).
- **Antarmuka**: Usulan Penugasan dan Penugasan yang Sudah Ditetapkan berhalaman 50 baris (parameter `hal` dan `halT`, penomoran di server) dengan ringkasan total; Sebaran Beban memuat semua reviewer (tabel dapat digulir) dengan ringkasan terendah/tertinggi/rata-rata; pesan hasil menyebut waktu proses di server.
- **Kinerja**: algoritma `susunUsulanMurni` menghitung reviewer layak sekali per institusi dan melewati jalur penambah bila kapasitas kurang; penyimpanan usulan satu `INSERT ... SELECT` dari array JSON per 5.000 baris; `tetapkanPenugasan` mengklaim dengan satu `UPDATE ... RETURNING` lalu mengirim ke BIMA per kelompok 500 (lima kelompok serentak, ulang otomatis maksimal 2 kali per kelompok oleh klien; kunci = id penugasan; idempotensi dijamin indeks unik parsial `bima_kotak_masuk_kunci_uq` + `ON CONFLICT DO NOTHING`, sehingga percobaan ulang yang berjalan bersamaan tidak menggandakan baris. Batas yang diketahui: penugasan yang sudah diklaim Ditetapkan tetapi fungsi berhenti sebelum sempat dikirim tidak punya jalur kirim ulang otomatis). Kelompok yang gagal dikembalikan ke Diusulkan ("Kirim ulang"), kelompok yang sudah diterima tetap Ditetapkan. J-04 `maxDuration` 300 dtk.

## UC ke jendela, langkah, dan rute

| UC | Jendela yang dipakai | Langkah real use case | Alternatif yang dapat diperagakan | Rute awal (jalan pintas) |
|---|---|---|---|---|
| UC-01 Mengelola templat proposal | J-02, J-02b, M-01, M-12 | s.1-3 J-02 (pilih Skema Pendanaan; lihat versi, periode, bagian); s.4-7 J-02b (Susun Versi Baru; Tambah Bagian; Periode Berlaku); s.7 M-01 (Terbitkan; menyebut jumlah butir deterministik dan semantik yang akan dibuat); s.10 dan 9a J-02 `?hasil=` (jumlah butir per jenis; Buka Aturan Pemeriksaan membuka J-03 dengan butir turunan baru tersorot) (pesan terbit dan jumlah butir draf; Buka Aturan Pemeriksaan). Semula: 1-10: lihat versi, periode, bagian, lampiran; Susun Versi Baru; Tambah Bagian/Lampiran; Periode Berlaku; Terbitkan; pesan terbit dan jumlah butir draf; Buka Aturan Pemeriksaan | S-1 skema belum punya templat (kartu `UC-01-S1`, skema contoh "PK"); S-2 Lengkapi isian yang ditandai (J-02b, modal tidak terbuka); 9a masa pengusulan berjalan (draf tersimpan) | `/demo/mulai?k=UC-01` -> `/tim-kerja/templat` (masa ditutup, draf sisa demo dibuang; nyalakan sakelar "berjalan" untuk 9a); `k=UC-01-S1` -> J-02 pada skema tanpa templat |
| UC-02 Mengelola aturan pemeriksaan | J-03, J-03b, M-02..M-05 (tautan ke J-02) | s.1-2 J-03 (pilih skema dan periode; tabel butir); s.3-4 M-02 (Tambah Butir/Ubah), M-03 (Nonaktifkan), M-04 (4a butir turunan templat); s.5 M-02 (Simpan Butir); s.6 M-15 (Uji pada Contoh: pilih/unggah contoh, kemajuan) lalu J-03b (Hasil Uji); s.7-8 M-05 (Tanggal Berlaku, Simpan Versi). Semula: 1-8: pilih skema dan periode; tabel butir; Tambah Butir/Ubah/Nonaktifkan; panel butir; Simpan Butir; Uji pada Contoh (Hasil Uji); Tanggal Berlaku dan Simpan Versi | S-1 ubah lalu uji ulang; 4a butir turunan templat (terkunci); 8a tanggal berlaku di tengah masa pengusulan | `/demo/mulai?k=UC-02` -> `/tim-kerja/aturan` |
| UC-03 Menugaskan reviewer | J-04 (s.1), J-04b (s.2-8), M-06 (S-2), M-07 (s.7); pesan penetapan terlihat di kotak masuk BIMA dan J-07 | s.1 J-04 (periode ditutup); s.2-6 J-04b (Batas Beban per Reviewer; Susun Usulan Penugasan; tabel Usulan Penugasan dan Sebaran Beban); S-2 M-06; s.7 M-07 (Tetapkan Penugasan); s.8 J-04b (pesan ditetapkan). Semula: 1-8: Batas Beban per Reviewer; Susun Usulan Penugasan; tabel Usulan Penugasan dan Sebaran Beban; Tetapkan Penugasan | S-1 Kekurangan Reviewer (batas beban 1); S-2 Pindahkan, Reviewer Pengganti, Simpan Pemindahan (syarat dilanggar ditampilkan) | `/demo/mulai?k=UC-03` -> J-04b periode 1.200 proposal (masa ditutup, batas 45; batas 35 memicu S-1) |
| UC-04 Memantau kesesuaian penilaian | J-05, M-08, M-09, J-05b (butir yang ditandai tampil di J-03) | s.1-5 J-05 (angka ringkas, Perlu perhatian, tab Butir Semantik dan Gagal Deterministik; tambahan prototipe: arah dan jenis koreksi, kalibrasi keyakinan, tren harian, sebelum-sesudah antarversi, tab Kemajuan Penilaian terhadap tenggat); s.4-5 rincian di M-08; s.6-7 M-09 (Tandai Butir) lalu J-03; J-05b untuk rincian proposal. Semula: 1-7: Periode Seleksi dan Skema Pendanaan; Butir Deterministik Paling Sering Gagal; Kesesuaian per Butir (% Disetujui); Butir dengan Koreksi Tertinggi; Perlu Diperbaiki dan Tandai Butir | S-1 M-08 Rincian Butir dan Tutup | `/demo/mulai?k=UC-04` -> `/tim-kerja/pemantauan?periode=<Simulasi Contoh>&skema=<PD>` (skenario J-05 `bermasalah`) |
| UC-05 Mengajukan proposal | BIMA tiruan `/bima/pengajuan` lalu J-06 | 1-11: Ajukan Usulan di BIMA; penerusan SSO ke J-06; tarikDariBima dan cekMasaPengusulan; ambilBerkas; templat dan aturan berlaku; versi baru; potongTeks; jalankanPemeriksaan; status dan bukti pengiriman | S-1.1-S-1.4 Ditahan lalu ajukan ulang; 3a.1-3a.2 Ditolak (masa ditutup); NFR 4.4 Kirim ulang | skenario a: `/demo/mulai?k=UC-05a` "Proposal terkirim pada pengajuan pertama"; b: `k=UC-05b` "Proposal ditahan lalu terkirim setelah diperbaiki" (Ditahan, lalu Ajukan ulang dengan kotak centang "Pakai naskah perbaikan (contoh)" -> Terkirim V2); c: `k=UC-05c` "Proposal ditahan lalu ditolak karena masa pengusulan ditutup" (Ditahan, tombol "Tutup masa pengusulan" di BIMA, Ajukan ulang -> Ditolak) -> `/bima/pengajuan?proposal=PRP-2026-000N` |
| UC-06 Memeriksa butir deterministik (tanpa aktor utama; di dalam UC-05) | J-06 (hasil; langkah UC-06 berawalan "6." didokumentasikan di `src/lib/demo/pemandu/`) | 1-8: cocokkan struktur judul, hitung kata, diagram alir, kata kunci, sitasi (lampiran milik BIMA, tidak diperiksa); angka pembukti per butir | S-1.2 butir Gagal paling atas dengan bagian dan batas | `/demo/mulai?k=UC-06` (= skenario UC-05b) |
| UC-07 Melakukan pemeriksaan akhir | J-07, J-08, J-08b, M-11 | s.1 J-07 (Periksa); s.2-8 J-08 (teks per bagian, butir semantik); s.9-12 J-08b (keputusan komponen borang, umpan balik, Simpan Permanen) dengan M-11; pesan Penilaian tersimpan dan terkirim ke BIMA. Semula: 1-12: Periksa; teks per bagian dan butir semantik; keputusan komponen borang; umpan balik; Simpan Permanen; pesan Penilaian tersimpan dan terkirim ke BIMA | S-1 Simpan Sementara (label Draf di J-07, dimuat lagi saat Periksa) | a "Menyetujui seluruh rekomendasi": `k=UC-07a` -> J-07; b "Mengoreksi rekomendasi yang keliru": `k=UC-07b` -> J-07 (tambahkan `&j08=1` untuk J-08; koreksi = UC-08); c "Menyimpan sementara lalu melanjutkan": `k=UC-07c` -> J-07 berlabel Draf, J-08 memuat ulang isian |
| UC-08 Mengoreksi rekomendasi sistem | J-08, M-10 | 1-8: Tidak Setuju; M-10 Koreksi Rekomendasi (bukan panel inline); Keputusan Reviewer, Alasan Koreksi, Jenis Kekeliruan; Simpan Koreksi; label Dikoreksi reviewer | S-1 Alasan koreksi wajib diisi (bingkai merah); 4a Batal | `/demo/mulai?k=UC-08` -> `/reviewer/pemeriksaan/[penugasanId]` |
| UC-09 Memeriksa butir semantik (tanpa aktor utama; pendukung Layanan LLM) | Dijalankan sistem; hasil di J-08 (langkah UC-09 berawalan "9." didokumentasikan di `src/lib/demo/pemandu/`) | 1-8: kutipan per butir, tingkat keyakinan, rekomendasi Memenuhi/Tidak memenuhi | S-1 kutipan tidak ditemukan (Perlu diperiksa manual); S-2 LLM tidak merespons dua kali (Belum ada rekomendasi) | `/demo/mulai?k=UC-09` (normal), `k=UC-09-S1` (S-1), `k=UC-09-S2` (S-2) |

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

## Bukti (tangkapan layar e2e, run penuh 23 Okt 2026)

Run penuh `npm run e2e` (`SEMAR_IZINKAN_DB_PRODUKSI=1`, tanpa `DATABASE_URL_UJI`), 29 dari 29 skenario lulus (`docs/bukti-e2e/laporan.md`; salinan dari `e2e/hasil/` yang di-.gitignore). Setiap layar dan modal difoto pada lebar 1440 dan 390 px: berkas `docs/bukti-e2e/NN-<nama>-<lebar>.png`. Skenario yang dicakup: reset lewat modal, SSO dan guard peran, sembilan UC dengan alternatifnya, J-05b, hak akses 403, alur bolak-balik, navigator demo (pindah layar/peran dan pasang skenario), dan skala nyata 10.000 proposal.

| No | Layar atau modal | Lebar |
|---|---|---|
| 01 | `j01-masuk` | 1440 dan 390 px |
| 02 | `demo` | 1440 dan 390 px |
| 03 | `m-reset-konfirmasi` | 1440 dan 390 px |
| 04 | `bima-masuk` | 1440 dan 390 px |
| 05 | `bima-pengajuan` | 1440 dan 390 px |
| 06 | `j06-terkirim` | 1440 dan 390 px |
| 07 | `j06-ditahan` | 1440 dan 390 px |
| 08 | `j06-05b-terkirim-v2` | 1440 dan 390 px |
| 09 | `j06-05c-ditahan` | 1440 dan 390 px |
| 10 | `j06-ditolak` | 1440 dan 390 px |
| 11 | `j02-templat` | 1440 dan 390 px |
| 12 | `j02b-draf` | 1440 dan 390 px |
| 13 | `j02b-isian-ditandai` | 1440 dan 390 px |
| 14 | `m01-konfirmasi-terbitkan` | 1440 dan 390 px |
| 15 | `j02-terbit` | 1440 dan 390 px |
| 16 | `j02-9a-draf` | 1440 dan 390 px |
| 17 | `j02-9a-kembali` | 1440 dan 390 px |
| 18 | `j02-s1-belum-ada-templat` | 1440 dan 390 px |
| 19 | `j02b-versi-1` | 1440 dan 390 px |
| 20 | `j03-aturan` | 1440 dan 390 px |
| 21 | `j03-m04-4a` | 1440 dan 390 px |
| 22 | `j03-m02-galat` | 1440 dan 390 px |
| 23 | `j03-m02-form` | 1440 dan 390 px |
| 24 | `j03b-hasil-uji` | 1440 dan 390 px |
| 25 | `j03-m03-nonaktifkan` | 1440 dan 390 px |
| 26 | `j03-m05-8a` | 1440 dan 390 px |
| 27 | `j03-versi-tersimpan` | 1440 dan 390 px |
| 28 | `j04-daftar-periode` | 1440 dan 390 px |
| 29 | `j04b-awal` | 1440 dan 390 px |
| 30 | `j04b-s1-kekurangan` | 1440 dan 390 px |
| 31 | `j04b-usulan` | 1440 dan 390 px |
| 32 | `j04b-m06-s2-ditolak` | 1440 dan 390 px |
| 33 | `j04b-m07-tetapkan` | 1440 dan 390 px |
| 34 | `j04b-ditetapkan` | 1440 dan 390 px |
| 35 | `bima-kotak-masuk` | 1440 dan 390 px |
| 36 | `j05-pemantauan` | 1440 dan 390 px |
| 37 | `j05-m08-rincian-butir` | 1440 dan 390 px |
| 38 | `j05-m09-tandai` | 1440 dan 390 px |
| 39 | `j05-ditandai` | 1440 dan 390 px |
| 40 | `j03-perlu-ditinjau` | 1440 dan 390 px |
| 41 | `j05b-rincian-proposal` | 1440 dan 390 px |
| 42 | `j08b-keputusan` | 1440 dan 390 px |
| 43 | `j08b-s1-komponen-kosong` | 1440 dan 390 px |
| 44 | `j08b-m11-simpan-permanen` | 1440 dan 390 px |
| 45 | `j08b-final` | 1440 dan 390 px |
| 46 | `j07-07c-draf` | 1440 dan 390 px |
| 47 | `j08b-07c-draf-dimuat` | 1440 dan 390 px |
| 48 | `j07-daftar-penugasan` | 1440 dan 390 px |
| 49 | `j08-pemeriksaan` | 1440 dan 390 px |
| 50 | `j08-m10-s1-alasan-kosong` | 1440 dan 390 px |
| 51 | `j08-m10-form` | 1440 dan 390 px |
| 52 | `j08-dikoreksi` | 1440 dan 390 px |
| 53 | `j07-draf` | 1440 dan 390 px |
| 54 | `j08b-final-sesudah-koreksi` | 1440 dan 390 px |
| 55 | `j08-s1-perlu-manual` | 1440 dan 390 px |
| 56 | `j08-s2-belum-ada` | 1440 dan 390 px |
| 57 | `j08-403` | 1440 dan 390 px |
| 58 | `m-reset-konfirmasi` | 1440 dan 390 px |
| 59 | `bolak-balik-j02-terbit` | 1440 dan 390 px |
| 60 | `bolak-balik-j03-butir-baru` | 1440 dan 390 px |
| 61 | `bolak-balik-bima-unduh-templat` | 1440 dan 390 px |
| 62 | `bolak-balik-j06-bagian-baru` | 1440 dan 390 px |
| 63 | `bolak-balik-j02-riwayat` | 1440 dan 390 px |
| 64 | `m-reset-konfirmasi` | 1440 dan 390 px |
| 65 | `navigator-terbuka-j03` | 1440 dan 390 px |
| 66 | `j04-kosong` | 1440 dan 390 px |
| 67 | `navigator-skenario-j04` | 1440 dan 390 px |
| 68 | `j04b-menunggu` | 1440 dan 390 px |
| 69 | `j04b-kekurangan-navigator` | 1440 dan 390 px |
| 70 | `j04b-ditetapkan-navigator` | 1440 dan 390 px |
| 71 | `j03-perlu-ditinjau-navigator` | 1440 dan 390 px |
| 72 | `j05-belum-final` | 1440 dan 390 px |
| 73 | `j06-ditahan-navigator` | 1440 dan 390 px |
| 74 | `j08-final-navigator` | 1440 dan 390 px |
| 75 | `navigator-ciut` | 1440 dan 390 px |
| 76 | `j04b-skala-awal` | 1440 dan 390 px |
| 77 | `j04b-skala-s1` | 1440 dan 390 px |
| 78 | `j04b-skala-usulan` | 1440 dan 390 px |
| 79 | `j04b-skala-halaman-2` | 1440 dan 390 px |
| 80 | `j04b-skala-ditetapkan` | 1440 dan 390 px |
| 81 | `bima-kotak-masuk-skala` | 1440 dan 390 px |
| 82 | `j04b-siap-sesudah-skala` | 1440 dan 390 px |
| 83 | `m-reset-konfirmasi` | 1440 dan 390 px |

## Hasil ukur J-04 skala nyata (10.000 proposal, 22 Okt 2026)

Dua sasaran. Lokal: `next start` di laptop ke Neon `ap-southeast-1` (jeda laptop ke basis data ±250 ms per pernyataan; run penuh `docs/bukti-e2e/laporan.md`). Produksi: https://semar-akpsi.vercel.app (Vercel ke Neon; `docs/bukti-e2e/laporan-produksi-skala.md`, run terfilter `E2E_FILTER=skala`). Waktu server dari pesan di J-04 dan `log_audit`.

| Langkah | Lokal (laptop ke Neon) | Produksi (Vercel ke Neon) |
|---|---|---|
| Pembuatan data massal pertama (periode, 130 reviewer, 4.000 pengusul, 10.000 proposal + versi, VACUUM ANALYZE) | ±6-17 dtk dari buka J-04 di peramban | 3,3 dtk dari buka J-04 |
| Pemakaian berikutnya (buka J-04 skala; kosongkan penugasan dan kotak masuk) | ±3,5 dtk | 1,2 dtk |
| Susun Usulan Penugasan, 10.000 proposal, batas 100 | 6-12 dtk di server (bervariasi menurut jeda tulis Neon dari laptop; sekali 16,6 dtk) | 0,7 dtk di server, 1,3 dtk klik sampai pesan |
| S-1 (batas 60: 2.560 proposal kekurangan) | 3-7 dtk | 1,8 dtk klik sampai pesan |
| Tetapkan Penugasan, 10.000 proposal, 20 kelompok x 500 | 4,6-6,5 dtk di server | 1,4 dtk di server, 1,7 dtk klik sampai pesan |
| Pindah ke halaman 2 usulan | ±2 dtk | 0,7 dtk |

Pada run produksi yang sama: kotak masuk BIMA menerima tepat 10.000 penugasan (tanpa ganda), sebaran beban 80-81 per reviewer (124 reviewer bersedia), tabel 50 baris per halaman (200 halaman), dan sesudah meninggalkan skala nyata J-07 "Semua Selesai" dan "Baru" tepat satu baris. (Hasil ukur lama, run produksi sebelum keputusan 22 Okt; sejak itu data skala tetap ada di kotak masuk B-2 sampai Reset, dan e2e memeriksanya.)

### Rancangan ulang UC-01 (24 Okt 2026): WND ringkas

| Dari | Pemicu | Ke | Jenis |
|---|---|---|---|
| J-02 | "Templat Baru" | M-14 (Skema Pendanaan, Periode Berlaku) lalu "Susun Versi Baru" membuka J-02a Draf | modal ke layar |
| J-02 | ketuk baris; "Unduh (.docx)" | J-02a; unduhan | layar; unduhan |
| J-02a (Draf) | "Ubah" bagian / "Tambah Bagian" | M-12 ringkas / M-12 lengkap | modal |
| M-12 ringkas | "Atur aturan bagian ini" | tab Aturan tersaring untuk bagian itu | tab |
| J-02a tab Aturan | "Tambah Butir" / "Ubah" | M-02 terstruktur (Bagian, Jenis Aturan, parameter) | modal |
| J-02a tab Aturan (Aktif) | "Ubah" butir isi bagian | M-04 (4a) dengan "Susun Versi Baru" | modal |
| J-02a (Draf) | "Terbitkan" | M-01 lalu J-02a Aktif `?hasil=terbit` / Draf `?hasil=draf` (9a) | modal ke layar |
| J-02a (Aktif) | "Susun Versi Baru" | J-02a Draf versi berikutnya | layar |
| J-02a tab Aturan | "Uji pada Contoh" lalu "Kembali ke Aturan Pemeriksaan" | J-03b lalu tab Aturan | layar |
