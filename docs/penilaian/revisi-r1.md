# Revisi putaran 1

Dasar: temuan tiga penilai per sisi (Telusur median 77, Desain 82, Teknis 82). Aturan konsensus: temuan yang diangkat minimal dua dari tiga penilai pada sisi yang sama, temuan "kritis" yang terbukti benar, dan temuan "sedang" tunggal hanya bila terbukti dan murah. Rujukan "T", "D", "K" adalah sisi Telusur, Desain, Teknis.

## Diterapkan

**Telusur**
- T1.1/T2.1/T3.1 (kritis): enam kartu skenario /demo memakai judul Tabel us-05a..us-07c Bab 10.1. UC-07b menyiapkan J-08 untuk mengoreksi (UC-08); UC-07c menyiapkan penilaian Draf sebagian terisi (J-07 berlabel Draf, J-08 memuat ulang isian); varian kutipan-salah dan tidak-merespons pindah ke kartu `UC-09-S1` dan `UC-09-S2`. Peta UC-jendela dan nama skenario e2e disesuaikan.
- T1.2/T2.2/T3.2 (kritis): UC-05b dapat dituntaskan. Varian contoh `e` (topik dan judul sama dengan b, Metode dalam batas) dan kotak centang "Pakai naskah perbaikan (contoh)" pada formulir BIMA tiruan; ajukan ulang menghasilkan Terkirim V2 dengan V1 tetap tersimpan.
- T1.2/T2.3/T3.3: UC-05c kini Ditahan lebih dulu (masa berjalan), lalu "Tutup masa pengusulan" (alat simulasi di BIMA tiruan) dan Ajukan ulang menghasilkan Ditolak (3a).
- T1.3/T2.7/D1.4: sakelar masa menggeser `tanggalTutup` periode (kemarin saat ditutup, dua pekan lagi saat berjalan); `cekMasaPengusulan` membandingkan jam demo dengan tanggalBuka/tanggalTutup dan tetap menghormati sakelar. Pesan 3a.2 dan J-04 konsisten.
- T1.4/T2.8/T3.5: fungsi bernama sama dengan metode sequence (bukaProposal, bukaVersiDinilai, ambilHasilPemeriksaan, simpanNilai, terima, tandaiSelesai, mencatatPenilaian, kirimKeputusan, catatKoreksi, ambilRekomendasi, gantiRekomendasi, gantiTemplatBerlaku, arsipkan, turunkanButirCek, cekPengusulanBerjalan, ambilDaftarReviewer, kirimPenugasan, dan alias lain). Sebagian benar-benar dipanggil di alur (UC-07, UC-08, UC-01 terbitkan, UC-03). Tabel "metode sequence ke berkas dan fungsi" ditambahkan di docs/peta-uc-jendela.md. Komentar header pengajuan/layanan.ts diperbaiki dan dua ambilTemplatBerlaku/ambilAturanBerlaku diberi keterangan.
- T1.5/T2.4/T3.4: nama UC-01 menjadi "Mengelola templat proposal" (demo, peta, contoh komentar).
- T1.6/T2.5/T3.6: UC-01 S-1 dapat diperagakan lewat kartu `UC-01-S1` yang membuat skema contoh "PK" tanpa templat (dibuat saat diperlukan agar skema contoh lain tidak berubah).
- T1.8/T2.10/T3.11: langkah UC-06 tampil di J-06 (berawalan "6.") dan langkah UC-09 di J-08 (berawalan "9.").
- T1.9/T2.11/T3.8: Jenis Kekeliruan opsional (hanya Alasan Koreksi wajib); tes validasi ditambah. Validasi komponen lengkap dipertahankan dan dicatat di catatan-inkonsistensi no. 8 (usulan Exceptional Flow 7a).
- T1.10/T3.9/D1.10: header tanpa tombol "Keluar" dan logo tanpa tautan untuk peran pengusul; logo peran lain menuju jendela awal perannya.
- T1.11/T3.12: dicatat sebagai penyimpangan yang diterima di docs/perubahan-model.md (tidak diubah, lihat Ditolak).
- T1.12/T2.12: label peran kartu UC-06/08/09 sesuai Bab 7 dan Bab 10.
- T1.13/T3.10/T2.6: pilihan S-3 UC-01 dicatat (catatan no. 7), jalan pintas UC-01 dan UC-01-S1 membuang draf sisa demo; klaim tombol "Jalankan ulang" dihapus dari catatan no. 5.
- T1.7/T2.9/T3.7/D2.14/K1.4/K2.6/K3.6: run e2e terfilter tidak lagi menghapus run penuh (menulis ke `e2e/hasil/filter-*/`).

**Desain**
- D1.1/D2.3/D3.2 (tiga penilai): PanelPemandu bawaan ciut (kepala dan langkah aktif), langkah aktif digulir ke pandangan saat dibuka.
- D1.2/D2.1/D3.1: J-03 menggulir dan memfokuskan panel Tambah/Ubah Butir dan pesan 4a; J-02 menggulir ke pesan hasil Terbitkan/9a; J-08 menaruh pesan hasil tepat di atas tombol simpan dan menampilkan toast sukses.
- D1.3/D2.2/D3.4: J-08 memvalidasi kelengkapan komponen di klien (bingkai merah, "Belum diputuskan", gulir ke komponen kosong pertama; teks pesan tetap seperti server).
- D1.5/D2.4/D3.3: tab J-08 menampilkan jumlah butir dan titik untuk butir yang harus dibaca sendiri; kartu butir manual bergaris kiri bata dengan teks "Baca bagian ini sendiri"; ringkasan butir; panel butir semantik sticky di layar lebar.
- D1.6/D2.6/D3.5: butir Nonaktif disembunyikan secara bawaan (sakelar "Tampilkan butir nonaktif (N)"); opasitas diganti warna teks.
- D1.7: butir yang dikoreksi menandai "rekomendasi semula; keputusan reviewer berlaku".
- D1.8/D2.8/D3.6/D3.7: legenda ambang keyakinan ("ambang contoh") di panel; isi bar Sedang emas-700; cincin fokus emas-700 dengan halo krem.
- D1.9/D2.11/D3.8: label "ID Proposal" menggantikan "idProposal".
- D1.12/D2.10/D3.8: pilihan periode di J-03 dan J-05 dilebarkan (max-w-md).
- D2.7/D3.10/K1.15/K3.7: Reset meminta konfirmasi.
- D1.13/D2.5/D3.11: panel "Log audit (hanya baca)" berisi 20 entri terakhir di /demo.
- D2.9/D3.12: bar beban emas saat penuh dan bata hanya saat melebihi batas, dengan teks "penuh"/"melebihi batas".

**Teknis**
- K1.1/K2.1/K3.1: vitest melewati tes basis data dan e2e menolak jalan kecuali `DATABASE_URL_UJI` diisi (atau `SEMAR_IZINKAN_DB_PRODUKSI=1`); peringatan di README.
- K1.2/K3.2: J-08 menampilkan status "tersimpan tetapi gagal terkirim" beserta tombol "Kirim ulang" juga setelah halaman dimuat ulang.
- K1.3/K2.2/K3.5: data UC-04 selalu dihitung dengan mode tiruan yang dipaksa lewat opsi fungsi.
- K1.5/K2.4/K3.9 (sebagian): pemilihan baris Penilaian kini deterministik (paling baru diperbarui) di ketiga tempat baca, sehingga draf tidak tampak hilang. Indeks unik tidak ditambahkan (lihat Ditolak).
- K1.6/K2.8/K3.3: kirim ulang J-06 memakai klaim bersyarat (CAS pada status, dan menolak bila pemeriksaan sebelumnya baru berjalan), halaman direvalidasi setelah aksi.
- K1.9/K2.11: skenario UC-07/08/09 tidak lagi mengubah `process.env`; mode tiruan dan skenario dilewatkan lewat opsi (`OpsiNilai.skenario`).
- K1.13/K2.13/K3.12: penyimpangan model dicatat di docs/perubahan-model.md.
- K1.14: batas pemeriksaan J-06 125 detik (NFR 2.1 plus jeda).
- K2.15/K3.14: batas unggah 4 MB per berkas dengan pesan jelas.

## Ditolak atau ditunda

| Temuan | Alasan |
|---|---|
| T1.11/T3.12: hapus pembacaan `bima_akun` oleh `pastikanAkunDariBima` | Perlu endpoint profil baru atau token SSO yang diperluas pada alur yang sudah lulus uji; dicatat sebagai penyimpangan prototipe di perubahan-model. |
| K1.5/K2.4/K3.9: indeks unik `penilaian.penugasan_id` | Perubahan skema fondasi lewat `db:push` pada basis data bersama yang tidak dapat diuji aman di sini; risiko gagal bila sudah ada duplikat. Dipitigasi dengan pemilihan baris deterministik. |
| K1.8/K2.5/K3.11: `forbidden()` untuk 403 nyata di halaman J-08 | Memerlukan `experimental.authInterrupts` dan tidak dapat diuji tanpa e2e; 403 nyata sudah ada di rute `.../data` dan dicatat. |
| K1.7/K2.9/K3.10: idempotensi API BIMA dan transaksi tetapkanPenugasan | Perubahan skema `bima_kotak_masuk`; tetapkanPenugasan sudah mengembalikan status bila kirim gagal. Ditunda. |
| K1.10/K2.12: `effort`/`max_tokens` LLM | Tidak dapat diukur tanpa key yang berfungsi; satu penilai per butir, tanpa bukti. |
| K1.11: ulang job semantik Gagal | Satu penilai, sedang tetapi tidak murah; klaim "Jalankan ulang" yang keliru sudah dihapus dari catatan. |
| K1.12/K3.13: aktor log audit pindah_penugasan | Tanda tangan `pilihReviewer` dibekukan oleh KONTRAK; ditunda. |
| K1.15/K2.10/K3.7: kunci DEMO_PIN pada /demo | Selera; konfirmasi Reset diterapkan sebagai langkah murah. |
| K2.7: TRUNCATE log_audit dan seed dalam transaksi | Satu penilai, perubahan pemicu pada basis data bersama. |
| D1.13/D2.2/D3.4: dialog konfirmasi Simpan Permanen/Tetapkan/Terbitkan | Sebagian (validasi dan pesan terlihat) diterapkan; dialog tambahan akan mengubah alur langkah real use case (UC-07 s.11-12) dan e2e. |
| D1.11: padatkan kepala J-08 dan tab satu baris | Selera tunggal. |
| D2.12: peringatan beforeunload J-02; D2.13: gaya h3 dan duplikasi nama di beranda | Satu penilai, ringan. |
| D1.9: istilah teknis di pemandu, "asumsi terbuka", "403" | Satu penilai; sebagian istilah ("403 Akses ditolak") dipertahankan karena dipakai e2e dan Bab 10. |
| D1.10: ringkas Bukti Pengiriman dan lipat butir Lolos | Satu penilai; mengubah isi J-06 yang sudah lulus. |
| K2.14: unik koreksi per (penilaianId, hasilId) | Perubahan skema; prototipe memakai satu penugasan per proposal. |
| SEMAR_LLM_MODE=tiruan di Vercel Production | Mengubah lingkungan produksi bersama; tidak dilakukan oleh revisi ini. Rekomendasi ke pemilik proyek. |

## Hasil uji

Dijalankan lokal pada /Users/arsyrizkia/Documents/GitHub/semar-akpsi.

| Uji | Hasil |
|---|---|
| `npx tsc --noEmit` | lulus |
| `npm run lint` | lulus |
| `npm test` | 9 berkas lulus, 3 berkas dilewati (tes basis data; 100 tes lulus, 21 dilewati) |
| `npm run build` | lulus |
| `npm run e2e` | TIDAK dijalankan |

Mengapa e2e dan tes basis data tidak dijalankan: `.env.local` hanya memuat DATABASE_URL produksi (branch Neon yang sama dengan https://semar-akpsi.vercel.app), tidak ada kredensial Neon/neonctl untuk membuat branch uji, dan e2e menekan "Reset & isi data demo" (TRUNCATE) yang dilarang pada basis data bersama. Karena itu tangkapan layar `e2e/hasil` tidak diperbarui, dan skenario e2e baru (UC-05b V2, UC-05c Ditahan lalu Ditolak, UC-01 S-1, UC-07a tanpa koreksi, UC-07c Draf, UC-09 S-1/S-2) belum terbukti jalan. Untuk menjalankannya: buat branch Neon uji, isi `DATABASE_URL_UJI`, lalu `npm run build && npm run e2e`.
