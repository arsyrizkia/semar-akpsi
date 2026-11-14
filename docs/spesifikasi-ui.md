# Spesifikasi UI SEMAR (ringkasan dari `docs/sumber/bab10-use-scenario-real-use-case.md`)

Label dalam "tanda petik" dikutip persis dari sumber. Rujukan "UC-xx s.N" berarti langkah *real use case*; S- adalah
*SubFlow* dan Nx adalah *Alternate Flow*. Bila ringkasan ini dan sumber berbeda, ikuti sumber.

## Jendela

Semua jendela adalah halaman web (NFR 1.1). Tidak ada beranda. J-02..J-05 memakai satu menu bersama untuk Tim Kerja
DPPM.

### J-01 Masuk (Tim Kerja DPPM, Reviewer)

- Fungsi: memeriksa akun dan peran pengguna, lalu membuka menu Tim Kerja DPPM atau J-07.
- Sumber tidak memberi label isian. Prototipe memakai tombol **"Masuk dengan akun BIMA"** (SSO tiruan) yang diarahkan ke
  halaman login BIMA tiruan, tempat pengguna masuk dengan username (atau email, atau idBima lama) dan kata sandi akun prototipe, lalu kembali ke SEMAR. Daftar akun ada di
  dialog **Bantuan** ("Kesulitan login? Bantuan", judul "Akun prototipe SEMAR": nama, peran, username, email, kata sandi).
- Tujuan sesudah masuk:
  - pengelola: J-02;
  - Tim Kerja non-pengelola: J-04, dengan menu J-04 dan J-05 saja;
  - reviewer: J-07.
- Pengusul tidak memakai J-01. Ia masuk dari BIMA langsung ke J-06.

### J-02 Templat Proposal (Tim Kerja DPPM dengan hak pengelola) — UC-01

- Daftar pilihan "Skema Pendanaan" (dari skema_pendanaan periode berjalan, s.2).
- Tampilan templat (s.3):
  - nomor versi dan periode berlaku;
  - tabel bagian dengan kolom "Urutan", "Nama Bagian", "Batas Kata", "Wajib";
  - daftar lampiran wajib.
- Tombol "Susun Versi Baru" (s.4): membuat Draf bernomor versi berikutnya, disalin dari templat berlaku, lalu membuka
  isian.
- Tombol "Tambah Bagian" (s.5) menambah baris. Setiap baris berisi isian "Nama Bagian", isian "Batas Kata", kotak centang
  "Wajib", dan tombol "Hapus".
- Tombol "Tambah Lampiran" (s.5) menambah nama lampiran wajib.
- Pilihan "Periode Berlaku" (s.6).
- Tombol "Terbitkan" (s.7).
- Tombol "Hapus Draf" (tambahan prototipe, hanya pada templat berstatus Draf; gaya sekunder dengan teks bata, di kelompok
  tombol kepala bersama "Lihat Pratinjau", "Unduh Pratinjau (.docx)", dan "Terbitkan"). Membuka modal M-13 berjudul
  "Hapus Draf?" yang menyebut Skema, Versi, dan Periode Berlaku draf, dengan teks "Bagian dan butir cek draf ini ikut
  terhapus dan tidak dapat dibatalkan." dan "Templat yang sedang berlaku tidak berubah." Tombol modal: "Batal" dan
  "Hapus Draf" (bahaya). Sesudah berhasil menuju J-02 dengan pesan "Draf versi N skema X dihapus." (`?hasil=hapus`).
  Templat Aktif dan Arsip tidak punya tombol ini dan ditolak server dengan pesan "Hanya templat berstatus Draf yang
  dapat dihapus. Templat ini berstatus Aktif." (atau Arsip).
- Sesudah terbit (s.10):
  - pesan bahwa templat versi baru telah terbit, beserta jumlah butir draf yang dibuat;
  - tombol "Buka Aturan Pemeriksaan" menuju J-03.
- S-1 (skema belum punya templat): tabel kosong dengan teks "Skema ini belum memiliki templat". "Susun Versi Baru" lalu
  membuat versi 1.
- S-2 (isian belum lengkap): isian yang kosong ditandai, dengan pesan "Lengkapi isian yang ditandai".
- 9a (masa pengusulan sedang berjalan): templat disimpan sebagai Draf dengan pesan "Masa pengusulan skema ini sedang
  berjalan. Templat disimpan sebagai draf untuk periode berikutnya." *Use case* berhenti.

### J-03 Aturan Pemeriksaan (Tim Kerja DPPM dengan hak pengelola) — UC-02

- Daftar pilihan "Skema Pendanaan" dan "Periode Seleksi", lalu tombol "Tampilkan" (s.2).
- Tabel butir (s.3):
  - kolom "Kode", "Deskripsi", "Jenis" (deterministik/semantik), "Asal" (templat/manual), "Parameter", "Status" (Draf,
    Aktif, Perlu ditinjau, Nonaktif);
  - baris turunan templat diberi ikon gembok dan tidak punya tombol "Nonaktifkan";
  - baris berstatus Perlu ditinjau diberi warna penanda.
- Tombol "Tambah Butir", lalu per baris manual tombol "Ubah" dan "Nonaktifkan" (s.4).
- Panel butir (s.4–5):
  - isian "Kode", "Deskripsi", "Jenis";
  - untuk butir deterministik: isian "Aturan Hitung" (contoh: kata kunci tepat lima, dipisah titik koma);
  - untuk butir semantik: isian "Pertanyaan Pemeriksaan" dan "Contoh Jawaban";
  - tombol "Simpan Butir".
- Tombol "Uji pada Contoh" (s.6) membuka panel "Hasil Uji". Panel ini menampilkan Lolos/Gagal beserta angka pembukti per
  butir per contoh, atau rekomendasi beserta kutipan.
- Isian "Tanggal Berlaku" dan tombol "Simpan Versi" (s.7).
- Sesudah tersimpan (s.8): pesan bahwa basis aturan versi baru tersimpan beserta tanggal berlakunya.
- 4a (mengubah nilai butir turunan templat): pesan "Nilai butir ini berasal dari templat dan hanya dapat diubah melalui
  jendela J-02 Templat Proposal" dengan tombol "Buka Templat Proposal". Panel butir tidak dibuka.
- 8a (tanggal berlaku jatuh di antara tanggal buka dan tanggal tutup): ditolak, karena proposal dalam satu periode harus
  dinilai dengan aturan yang sama. Basis aturan tidak berubah.

### J-04 Penugasan Reviewer (Tim Kerja DPPM) — UC-03

- Menampilkan periode yang masa pengusulannya sudah ditutup (s.1).
- Isian "Batas Beban per Reviewer" (s.2).
- Tombol "Susun Usulan Penugasan", yang hanya aktif untuk periode yang sudah ditutup.
- Tabel "Usulan Penugasan" (s.5) dengan kolom "Judul Proposal", "Skema", "Institusi Pengusul", "Reviewer", "Institusi
  Reviewer".
- Tabel "Sebaran Beban": jumlah proposal per reviewer dibandingkan batasnya.
- Tombol "Tetapkan Penugasan" (s.7).
- Pesan sesudah ditetapkan (s.8): penugasan telah ditetapkan dan tercatat di BIMA.
- S-1 (reviewer kurang):
  - panel "Kekurangan Reviewer" berisi jumlah proposal yang belum dapat ditugaskan;
  - pengguna mengubah "Batas Beban per Reviewer" lalu menekan "Susun Usulan Penugasan" lagi.
- S-2 (memindahkan proposal):
  - per baris: tombol "Pindahkan", daftar pilihan "Reviewer Pengganti", tombol "Simpan Pemindahan";
  - `pilihReviewer` memeriksa ulang syarat institusi dan beban;
  - bila syarat dilanggar, syarat yang dilanggar ditampilkan dan reviewer semula tetap dipakai.

### J-05 Pemantauan Kesesuaian (Tim Kerja DPPM) — UC-04

- Daftar pilihan "Periode Seleksi" dan "Skema Pendanaan", lalu tombol "Tampilkan" (s.2).
- Bagian "Butir Deterministik Paling Sering Gagal" (s.3): tabel silang butir × institusi pengusul, berisi jumlah gagal,
  diurutkan dari yang terbanyak.
- Bagian "Kesesuaian per Butir" dengan kolom "% Disetujui" (s.4).
- Bagian "Butir dengan Koreksi Tertinggi" (s.5): diurutkan menurut tingkat koreksi, lengkap dengan alasan koreksi dan
  jenis kekeliruan. Nama butir bisa diklik.
- Kotak centang "Perlu Diperbaiki" per butir dan tombol "Tandai Butir" (s.6). Butir yang ditandai berlabel "Perlu
  ditinjau" (s.7) dan tampil ditandai di J-03.
- S-1: mengklik nama butir membuka panel "Rincian Butir" (contoh rekomendasi, kutipan, dan keputusan reviewer). Tombol
  "Tutup" kembali ke s.5.

### J-06 Hasil Pemeriksaan Pengajuan (Pengusul, hanya baca, dibuka dari BIMA) — UC-05 (+ hasil UC-06)

- Penanda "Pemeriksaan sedang berjalan" selama pemeriksaan berlangsung (NFR 2.1, maks 2 menit).
- Status pengajuan: "Terkirim", "Ditahan", atau "Ditolak".
- Daftar butir (s.9):
  - setiap butir menampilkan nama butir, bagian, status Lolos/Gagal, dan angka pembukti;
  - butir Gagal ditaruh paling atas bersama bagian dan batas yang dilanggar (S-1.2);
  - butir Lolos di bawahnya.
- Bukti pengiriman (s.11): idProposal, judul, skema, kode versi, waktu pencatatan.
- Satu-satunya tombol: "Kembali ke BIMA". Tidak ada unduh atau cetak.
- Ditolak (3a.2): pemberitahuan bahwa masa pengusulan sudah ditutup pada tanggal tutup periode. Tanpa daftar butir.

### J-07 Daftar Penugasan (Reviewer) — UC-03 (notifikasi), UC-07

- Hanya menampilkan proposal yang ditugaskan kepada reviewer yang sedang masuk (NFR 3.1).
- Status per proposal: "Baru" (UC-03 s.8), "Draf" (UC-07 S-1), "Selesai" (UC-07 s.12).
- Tombol "Periksa" per baris. Tidak ada pencarian atau penyaring.

### J-08 Pemeriksaan Proposal (Reviewer; terbuka ≤3 detik, hanya untuk penugasannya sendiri) — UC-07, UC-08, hasil UC-09

- Panel kiri: teks proposal dengan satu tab per bagian.
- Panel kanan: butir semantik untuk bagian yang sedang dibuka. Setiap butir menampilkan:
  - rekomendasi "Memenuhi" atau "Tidak memenuhi";
  - kutipan pendukung;
  - bar tingkat keyakinan berwarna;
  - label "Perlu diperiksa manual" (UC-09 S-1) atau "Belum ada rekomendasi" (UC-09 S-2).
- Mengklik butir menggulir panel kiri ke kutipannya dan menyorot kutipan itu.
- Tombol "Tidak Setuju" per butir (titik ekstensi UC-08). Tidak ada tombol "Setuju": butir yang tidak dikoreksi dianggap
  disetujui.
- Panel koreksi (UC-08), terbuka di bawah butir:
  - menampilkan rekomendasi, kutipan, dan alasan sistem;
  - pilihan "Keputusan Reviewer" (Memenuhi/Tidak memenuhi);
  - kotak teks "Alasan Koreksi";
  - daftar pilihan "Jenis Kekeliruan" ("Kutipan salah tempat", "Salah tafsir isi", ditambah opsi lain yang wajar);
  - tombol "Simpan Koreksi" dan "Batal".
  - Bila alasan kosong (S-1): bingkai merah dan pesan "Alasan koreksi wajib diisi".
  - Sesudah tersimpan: panel ditutup, dan butir menampilkan keputusan reviewer dengan label "Dikoreksi reviewer".
- Panel "Keputusan Komponen Borang": "Memenuhi"/"Tidak memenuhi" per komponen. Komponennya: Kesesuaian isi per bagian,
  Jumlah kata per bagian, Sitasi dan daftar pustaka, Lampiran surat mahasiswa bimbingan, Artikel ketua pengusul, Surat
  pernyataan mitra.
- Kotak teks "Umpan Balik untuk Pengusul".
- Tombol "Simpan Sementara" (S-1) dan "Simpan Permanen".
- Sesudah simpan permanen: pesan "Penilaian tersimpan dan terkirim ke BIMA", lalu semua isian hanya-baca.
- Butir deterministik hanya ditampilkan sebagai catatan bahwa semuanya sudah lolos.
- Tombol sekunder "Jalankan Ulang Pemeriksaan Semantik" (tambahan prototipe, UC-07 dan UC-09):
  - tampil di dalam Alert "Pemeriksaan semantik gagal dijalankan", dan di dalam Alert "Rekomendasi sedang disiapkan" sesudah pembaruan otomatis berhenti ("Pemeriksaan semantik belum selesai. Muat ulang halaman beberapa saat lagi.");
  - tidak tampil bila penilaian sudah final; tanpa modal konfirmasi karena tindakannya tidak merusak data;
  - selama berjalan tombol nonaktif dengan ikon memuat; sesudah berhasil J-08 kembali ke "Rekomendasi sedang disiapkan" dan penghitung pembaruan mulai dari nol;
  - galat tampil di bawah tombol dengan `role="alert"`: "Hanya reviewer yang ditugaskan pada proposal ini yang dapat menjalankan ulang pemeriksaan semantik.", "Penilaian sudah final, pemeriksaan semantik tidak dapat dijalankan ulang.", "Hasil pemeriksaan semantik sudah tersedia. Muat ulang halaman untuk melihatnya.", "Pemeriksaan semantik masih berjalan. Tunggu beberapa saat, lalu coba lagi bila belum selesai.", "Akses ditolak".

## Alat peragaan (tersembunyi bawaan)

Prototipe tampil seperti sistem sungguhan. Alat yang hanya untuk peragaan dan pengujian tersembunyi sampai ditampilkan.

- **Alt+Shift+D** (Mac: Option+Shift+D) menampilkan atau menyembunyikan alat peragaan di halaman mana pun, termasuk BIMA tiruan.
  Keadaannya disimpan di `localStorage` peramban (kunci `semar:alat-peragaan`, nilai `tampil` atau `tersembunyi`); bawaan tersembunyi.
  Pembaca layar diberi kabar lewat wilayah status tersembunyi.
- Pintasan dikenali lewat `e.code === "KeyD"` (di Mac `e.key` berisi karakter Option, bukan "d"). Tetap berlaku saat fokus di isian
  teks: kombinasi Alt+Shift tidak mengetik di Windows/Linux, dan di Mac karakternya dibatalkan (`preventDefault`), jadi tidak ada
  ketikan yang hilang. Tidak berlaku bila tombol ditahan (repeat), saat komposisi IME, atau bersama Ctrl/Cmd.
- Saat tersembunyi, unsur berikut tidak dirender sama sekali (tidak ikut urutan tab, tidak terbaca pembaca layar):
  - pil dan panel Navigator (Alt+Shift+N hanya bekerja saat alat ditampilkan);
  - pil dan popup Masuk cepat (J-01 dan masuk BIMA tiruan);
  - panel "Berkas contoh" di langkah Substansi Usulan BIMA;
  - sakelar "Alat simulasi · masa pengusulan" di Daftar Usulan BIMA;
  - tautan "Buka Pusat Demo" di J-01, dan tautan ID proposal ke J-05b di Kotak Masuk BIMA (ID tetap tampil sebagai teks).
- Rute `/demo` dan `/demo/mulai` tetap ada lewat alamat langsung (dipakai skrip tangkap layar dan peragaan); navigator memang tidak
  tampil di rute itu. Skrip e2e menampilkan alat dengan mengisi `localStorage` sebelum dokumen dimuat.
- Yang TETAP tampil karena menandai tiruan: judul dan bilah "Simulasi BIMA – bukan sistem resmi", kaki halaman "Simulasi BIMA untuk
  prototipe SEMAR. Bukan layanan resmi.", peringatan di masuk BIMA "Simulasi: jangan memasukkan username atau password BIMA asli.",
  dan lencana "tiruan" pada hasil semantik mode LLM tiruan.
- Akun prototipe: kata sandi `Semar2026!` (konstanta `KATA_SANDI_PROTOTIPE`); "simulasi" masih diterima sementara agar skrip lama jalan,
  tidak ditampilkan di UI. Username `namadepan.namabelakang`, email `username@semar.id` (fiktif; tidak ada email dikirim).

## Navigasi

| Dari | Ke | Pemicu |
|---|---|---|
| BIMA tiruan (halaman pengajuan) | J-06 | Pengusul mengunggah lalu menekan tombol pengajuan di BIMA. BIMA meneruskan idProposal dan identitas pengusul tanpa masuk ulang. |
| BIMA tiruan | J-06 | Tautan "Lihat hasil pemeriksaan" pada halaman proposal di BIMA |
| J-06 | BIMA tiruan | Tombol "Kembali ke BIMA" |
| J-01 | J-02 / J-04 / J-07 | Sesudah masuk, sesuai peran |
| J-02..J-05 | sesamanya | Menu Tim Kerja DPPM (non-pengelola hanya J-04 dan J-05) |
| J-02 | J-03 | Tombol "Buka Aturan Pemeriksaan" |
| J-03 | J-02 | Tombol "Buka Templat Proposal" (pesan 4a) |
| J-07 | J-08 | Tombol "Periksa" |
| J-08 | J-07 | Tautan "Kembali ke Daftar Penugasan" (tambahan prototipe) |

## Pemanggilan sistem per UC (nama dari *sequence diagram*)

- **UC-01:** ambilTemplatBerlaku, aturBagian, aturKetentuan, tetapkanPeriodeBerlaku, periksaKelengkapan, terbitkan, cekPengusulanBerjalan, gantiTemplatBerlaku, arsipkan, nonaktifkan, turunkanButirCek, aturParameter.
- **UC-02:** basisAturanBerlaku, daftarButirBerlaku, create, ubahParameter, nonaktifkan, ujiPadaContoh, validasiTanggalBerlaku, masaPengusulanBerjalan, simpanVersiBaru.
- **UC-03:** tetapkanBatasBeban, susunPenugasan, ambilDaftarReviewer (API BIMA), pilihReviewer, tetapkan, mencatatPenugasan, kirimPenugasan (API BIMA), terimaProposal.
- **UC-04:** ambilAturanBerlaku, rekapKesesuaian, hitungTingkatKoreksi, ambilStatus, ambilAlasan, tandaiButir, tandaiPerluDitinjau, ambilRincian, ambilContoh.
- **UC-05:** tarikDariBima, cekMasaPengusulan, ambilBerkas (API BIMA), ambilTemplatBerlaku, ambilAturanBerlaku, create VersiProposal, potongTeks, potongPerBagian, ambilTeksBagian, jalankanPemeriksaan(deterministik), catatTerkirim. Sesudah catatTerkirim, versi masuk antrean semantik.
- **UC-06:** periksaDeterministik, cocokkanStrukturJudul, hitungKata, cekKataKunci, cocokkanSitasi, cekLampiran.
- **UC-07:** bukaProposal, bukaVersiDinilai, ambilHasilPemeriksaan, simpanNilai, terima, tandaiSelesai, mencatatPenilaian, kirimKeputusan (API BIMA).
- **UC-08:** catatKoreksi, ambilRekomendasi, simpanKoreksi, gantiRekomendasi.
- **UC-09:** jalankanPemeriksaan(semantik), siapkanTeksTanpaIdentitas, periksaSemantik, nilaiSemantik, kirimPermintaan (Layanan LLM, 15 detik, 2 percobaan), cocokkanKutipan.

## Status

| Entitas | Nilai |
|---|---|
| templat_proposal | Draf, Terbit, Arsip |
| butir_cek | Draf, Aktif, Perlu ditinjau, Nonaktif |
| proposal | Terkirim. "Ditahan" diturunkan dari hasil yang gagal; "Ditolak" bila masa pengusulan sudah ditutup. |
| hasil_pemeriksaan deterministik | Lolos / Gagal |
| hasil_pemeriksaan semantik | Memenuhi / Tidak memenuhi; Perlu diperiksa manual; Belum ada rekomendasi |
| penugasan_reviewer | Diusulkan, Ditetapkan, Selesai |
| label di J-07 | Baru, Draf, Selesai |
| label koreksi | Dikoreksi reviewer |

## Use scenario (jalur demo)

- UC-05a: proposal terkirim pada pengajuan pertama.
- UC-05b: proposal ditahan, lalu terkirim setelah diperbaiki.
- UC-05c: proposal ditahan, lalu ditolak karena perbaikannya baru diajukan sesudah masa pengusulan ditutup.
- UC-07a: menyetujui seluruh rekomendasi.
- UC-07b: mengoreksi rekomendasi yang keliru (UC-08).
- UC-07c: menyimpan sementara lalu melanjutkan.

## Asumsi terbuka (pakai pilihan paling sederhana, tandai di UI bila perlu)

- J-01 memakai akun BIMA (SSO tiruan).
- Ambang warna keyakinan: tinggi ≥ 0,8 (hijau daun), sedang 0,5–0,8 (emas), rendah < 0,5 (merah bata), ditandai
  "ambang contoh".
- Notifikasi penugasan hanya berupa label "Baru" di J-07.
- "Uji pada Contoh" memakai `DokumenContoh` dari seed.
- Kegagalan API BIMA setelah 2 kali percobaan menampilkan pesan gagal kirim dan tombol "Kirim ulang" di jendela terkait.
