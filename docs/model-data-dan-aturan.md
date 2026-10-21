# Model data dan aturan SEMAR (dari draf kumulatif; DK = `docs/sumber/draf-kumulatif-teks.md`)

## Katalog butir cek seleksi administrasi (Tabel 5.5, DK 1137–1160)

D = deterministik (aturan), S = semantik (LLM).

| Komponen borang | Ketentuan | Jenis | Pemeriksa (*sequence* UC-06/UC-09) |
|---|---|---|---|
| Screening | Templat sesuai skema yang diajukan | D | cocokkanStrukturJudul |
| Screening | Judul di templat sama dengan judul di sistem BIMA | D | cocokkanStrukturJudul |
| 1. Kesesuaian isi per bagian | Ringkasan memuat urgensi, tujuan, metode, luaran | S | nilaiSemantik |
| 1. Kesesuaian isi per bagian | Pendahuluan memuat latar belakang, rumusan masalah, pendekatan pemecahan masalah, *state of the art* dan kebaruan, peta jalan | S | nilaiSemantik |
| 1. Kesesuaian isi per bagian | Metode memuat diagram alir | D+S | cekLampiran/gambar + nilaiSemantik |
| 1. Kesesuaian isi per bagian | Metode memuat pembagian tugas anggota peneliti dan mitra (boleh tersirat) | S | nilaiSemantik |
| 1. Kesesuaian isi per bagian | Hasil yang diharapkan terisi | D+S | hitungKata (>0) + nilaiSemantik |
| 2. Jumlah kata per bagian | Setiap bagian tidak melebihi batas templat skema; diagram, tabel, dan gambar tidak dihitung; tanpa toleransi | D | hitungKata |
| 2. Jumlah kata per bagian | Kata kunci tepat lima, dipisah titik koma, boleh berupa frasa | D | cekKataKunci |
| 3. Sitasi dan daftar pustaka | Sitasi dalam paragraf memakai penomoran | D | cocokkanSitasi |
| 3. Sitasi dan daftar pustaka | Daftar pustaka bernomor dan berurutan sesuai pengutipan | D | cocokkanSitasi |
| 3. Sitasi dan daftar pustaka | Jumlah referensi sama dengan jumlah yang dikutip | D | cocokkanSitasi |
| 4. Lampiran surat mahasiswa bimbingan | Surat keterangan/tugas dilampirkan | D | cekLampiran |
| 4. Lampiran surat mahasiswa bimbingan | Nama promotor dan mahasiswa sesuai proposal; ditandatangani minimal pimpinan program studi | S | nilaiSemantik |
| 5. Artikel ketua pengusul | Artikel dan tautan jurnal dilampirkan; ketua sebagai *first* atau *corresponding author* | D+S | cekLampiran + nilaiSemantik |
| 5. Artikel ketua pengusul | Artikel hasil penelitian (bukan *review*), jurnal bereputasi internasional, berstatus *published*, relevan, disitasi di proposal | S | nilaiSemantik |
| 6. Surat pernyataan mitra | Identitas mitra dan judul sesuai; tidak berafiliasi dengan pengusul; bermeterai dan ditandatangani pimpinan mitra | D+S | cekLampiran + nilaiSemantik |

Aturan lain:
- Butir turunan templat (lahir saat UC-01 terbit) mencakup bagian wajib, batas kata tiap bagian, dan lampiran wajib.
  Nilainya terkunci dan hanya bisa diubah lewat J-02.
- Butir sitasi dan kata kunci adalah butir manual (UC-02).
- Kebutuhan 1.6: kalimat petunjuk templat dibuang sebelum menghitung kata. Ini opsional di prototipe; bila dibuat, catat.

## Kelas (CRC C01–C15) — atribut minimum, boleh ditambah (catat di `docs/perubahan-model.md`)

| Kelas | Atribut CRC | Metode |
|---|---|---|
| TimKerjaDPPM | nip, nama, hakAkses | — |
| Pengusul | nidn, nama, institusi | ajukanProposal |
| Reviewer | kode, namaReviewer (+ institusi diperlukan untuk aturan beda institusi) | bukaProposal, catatKoreksi |
| PeriodeSeleksi | idPeriode, tahun, tanggalBuka, tanggalTutup, batasBebanReviewer | masaPengusulanBerjalan/cekMasaPengusulan, tetapkanBatasBeban, susunPenugasan |
| SkemaPendanaan | idSkema, namaSkema, deskripsi | ambilTemplatBerlaku, ambilAturanBerlaku/basisAturanBerlaku, gantiTemplatBerlaku, cekPengusulanBerjalan |
| TemplatProposal | versi, status, periodeBerlaku, lampiranWajib[] | aturBagian, tetapkanPeriodeBerlaku, periksaKelengkapan, terbitkan, turunkanButirCek, arsipkan, potongPerBagian |
| BagianTemplat | nama, urutan, batasKata, wajib | aturKetentuan, ambilTeksBagian |
| BasisAturan | kode, nama (+ versi, tanggalBerlaku: belum ada di CRC) | daftarButirBerlaku, ujiPadaContoh, validasiTanggalBerlaku, simpanVersiBaru, rekapKesesuaian, tandaiButir, periksaDeterministik, periksaSemantik |
| ButirCek | kode, deskripsi, jenis, parameter, pertanyaan, asalTemplat, status | aturParameter, ubahParameter, periksa, nilaiSemantik, hitungTingkatKoreksi, tandaiPerluDitinjau, nonaktifkan, ambilRincian |
| Proposal | id, judul, status (+ waktuTerkirim) | tarikDariBima, catatTerkirim, bukaVersiDinilai, jalankanPemeriksaan, mencatatPenugasan, mencatatPenilaian |
| VersiProposal | kode, nama (+ waktu, rujukan berkas, teks per bagian) | potongTeks, ambilTeksBagian, jalankanPemeriksaan, siapkanTeksTanpaIdentitas, ambilHasilPemeriksaan |
| HasilPemeriksaan | jenisButir, status, angkaPembukti, rekomendasi, kutipan, tingkatKeyakinan (+ alasanSistem) | ambilStatus, gantiRekomendasi, ambilContoh |
| PenugasanReviewer | tanggal, status | pilihReviewer, tetapkan, bukaProposal, tandaiSelesai |
| Penilaian | nilai, komentar (+ status draf/final) | simpanNilai, terima, catatKoreksi |
| KoreksiRekomendasi | idRekomendasi, alasan, waktuKoreksi, keputusan (+ jenisKekeliruan) | simpanKoreksi, ambilAlasan |
| LogAudit (belum ada di CRC) | waktu, aktor, aksi, objek, rincian | hanya bisa ditambah |

## Multiplisitas (Tabel 8.16, DK 3636–3658)

**Komposisi:**
- Proposal 1–1..* VersiProposal
- VersiProposal 1–1..* HasilPemeriksaan
- TemplatProposal 1–0..* BagianTemplat
- Penilaian 1–0..* KoreksiRekomendasi

**Agregasi:**
- BasisAturan 1–1..* ButirCek

**Asosiasi:**
- Pengusul 1–0..* Proposal
- PeriodeSeleksi 1–1..* Proposal
- SkemaPendanaan 1–0..* Proposal
- Proposal 1–0..* PenugasanReviewer
- Reviewer 1–0..* PenugasanReviewer
- PenugasanReviewer 1–0..* Penilaian
- SkemaPendanaan 0..1–0..* BasisAturan
- SkemaPendanaan 1–0..* TemplatProposal
- TemplatProposal 1–0..* VersiProposal
- TemplatProposal 1–0..* ButirCek
- HasilPemeriksaan 1–0..1 KoreksiRekomendasi

## Kebutuhan non-fungsional (Tabel 6.2)

| Kelompok | No | Kebutuhan |
|---|---|---|
| Operasional | 1.1 | Peramban web tanpa instalasi |
| Operasional | 1.2 | Format berkas BIMA tanpa konversi manual |
| Operasional | 1.3 | Basis aturan diubah tanpa mengubah kode |
| Operasional | 1.4 | Pencadangan harian (cukup dicatat) |
| Performa | 2.1 | Satu proposal ≤ 2 menit |
| Performa | 2.2 | 4.000/hari (dicatat) |
| Performa | 2.3 | Halaman penilaian ≤ 3 detik |
| Performa | 2.4 | LLM ≤ 15 detik per bagian |
| Performa | 2.5 | Antrean LLM tanpa kehilangan permintaan |
| Keamanan | 3.1 | Hanya reviewer yang ditugaskan |
| Keamanan | 3.2 | Hanya pengelola yang mengubah basis aturan |
| Keamanan | 3.3 | Log audit hanya-baca |
| Keamanan | 3.4 | Isi proposal terenkripsi saat disimpan dan dikirim |
| Reliabilitas | 4.1 | Keputusan akhir di reviewer |
| Reliabilitas | 4.2 | UU PDP |
| Reliabilitas | 4.3 | Uptime 99% |
| Reliabilitas | 4.4 | Ulang otomatis maksimal 2 kali bila BIMA/LLM gagal |
| Usabilitas | 5.1 | Antarmuka reviewer sederhana |
| Usabilitas | 5.2 | Indikator visual tingkat keyakinan |

## Fakta domain untuk data demo

- Volume usulan per tahun: 38.605 (2024), 50.595 (2025), 79.210 (2026).
- Reviewer: 1.066–1.244 orang, dengan beban 30–200 proposal per orang.
- Siklus 2026:
  - pengusulan 3 Des 2025–5 Jan 2026;
  - penugasan 6–20 Jan;
  - seleksi administrasi 20–27 Jan (8 hari).
- Kegagalan komponen terbanyak: model sitasi (12.786) dan jumlah kata (10.354).
- Waktu pemeriksaan reviewer: 14,17 menit menjadi 5,17 menit per proposal.
- Skema demo: "Penelitian Dasar" dan "Penelitian Terapan". Bagian dan batas katanya rekaan dan diberi label "contoh
  sementara", misalnya:
  - Ringkasan 300 kata;
  - Pendahuluan 1.000 kata;
  - Tinjauan Pustaka 1.000 kata;
  - Metode 1.200 kata;
  - Hasil yang Diharapkan 500 kata;
  - Daftar Pustaka (tanpa batas kata);
  - kata kunci;
  - lampiran wajib: Surat Pernyataan Mitra, Artikel Ketua Pengusul, Surat Keterangan Mahasiswa Bimbingan.
- Semua nama orang dan institusi rekaan.
