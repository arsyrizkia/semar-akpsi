# Arah lanjutan SEMAR (22 Okt 2026, sesudah workflow rombak UI)

Berkas ini dikerjakan SESUDAH workflow "semar-rombak-ui" selesai. Agen rombak tidak membaca berkas ini.

## A. Palet: warna utama Kemdiktisaintek dengan aksen Sogan (keputusan Arsy)

Warna diambil dari CSS situs resmi https://kemdiktisaintek.go.id pada 22 Okt 2026. Isinya kelas arbitrer Tailwind di
halaman beranda dan berkas CSS `/_next/static/chunks/*.css`.

| Peran di situs | Hex | Pemakaian di situs |
|---|---|---|
| Biru utama | `#1F86FF` | Teks dan latar paling sering (13× `text-`, 5× `bg-`) |
| Biru hover | `#1A75E0` | Latar tombol hover |
| Biru tua | `#0050AD`, `#0137A6` | Gradien |
| Navy | `#003366`, `#002550`, `#00162F`, `#00070F` | Gradien dan latar gelap |
| Kuning emas | `#FBBD61` | Teks aksen |
| Toska | `#00A8BF` | Ujung gradien |
| Biru muda | `#E7EDFA`, `#BED8FF` | Latar lembut |

Penegasan Arsy: tampilan "Sogan tenang" tetap dipakai, yaitu tata letak alat kerja, font Outfit, dan kawung tipis di
area merek. **Yang diganti hanya palet warnanya.** Token bernama `sogan-*` atau `emas-*` yang isinya kini biru diganti
nama semantik, misalnya `primer-*`, `aksen-*`, dan `merek-semar-*`, supaya nama token tidak menyesatkan.

Aturan penerapan:

- **Warna utama SEMAR diambil dari palet Kemdiktisaintek.**
  - Teks tautan, tombol utama berlabel putih, dan penanda aktif memakai biru tua (`#0050AD`) atau navy (`#003366`).
    Biru utama `#1F86FF` di atas putih kontrasnya hanya sekitar 3,6:1, jadi tidak boleh untuk teks normal. Pakai untuk
    elemen besar, ikon, garis fokus, dan aksen.
  - Latar lembut memakai `#E7EDFA`. Sidebar boleh navy (`#00162F` atau `#002550`) dengan teks putih.
- **Sogan dan emas menjadi aksen identitas Semar:** wordmark dan ilustrasi Semar, garis atau penanda kecil di area merek,
  dan motif kawung tipis di area merek. Kuning `#FBBD61` dari palet Kemdiktisaintek boleh menggantikan emas aksen bila
  lebih serasi. Kontras tetap diperiksa.
- **Warna status tetap terpisah dari warna merek:**
  - Lolos/Memenuhi: hijau;
  - Gagal/Tidak memenuhi: merah;
  - Perlu ditinjau: kuning/oranye.
  Status selalu disertai teks atau ikon, tidak hanya warna. Hindari biru sebagai warna status supaya tidak tertukar
  dengan aksi.
- **Font tetap Outfit.**
- **Tanpa logo, nama, atau lambang Kemdiktisaintek** di SEMAR maupun BIMA tiruan. Yang dipinjam hanya warna. BIMA tiruan
  tetap berlabel "Simulasi BIMA – bukan sistem resmi". Gaya visual BIMA tiruan dibuat berbeda dari SEMAR (misalnya
  netral abu dengan aksen biru) supaya kedua sistem tetap terbedakan.
- **Dokumen yang diperbarui:** `docs/desain-sistem.md` (token beserta nilai kontrasnya) dan `docs/keputusan.md` butir 13.
  Semua komponen memakai token semantik, bukan hex mentah.

## B. Data nyata: struktur Isian Substansi dan PDF contoh sebagai berkas uji (keputusan Arsy)

Sumber: empat PDF contoh proposal dari Arsy. Salinan arsipnya ada di repo tesis
`kuliah/2026-gasal/akpsi/referensi/contoh-proposal-bima/`.

- `1. Contoh Proposal Soshum.pdf`: Isian Substansi, Penelitian Dasar.
- `5. Contoh Proposal Soshum.pdf`: Isian Substansi, Penelitian Terapan.
- `6. Contoh Proposal.pdf` dan `10. Contoh Proposal.pdf`: proposal lengkap ekspor BIMA. Berisi halaman identitas
  pengusul, luaran, anggaran, lalu Isian Substansi A–H. Bertanda "PROTEKSI ISI PROPOSAL".

Pekerjaannya:

1. **Templat seed mengikuti Isian Substansi persis**, dengan judul bagian berhuruf dan kalimat petunjuk resmi per bagian.

   | Bagian | Penelitian Dasar | Penelitian Terapan |
   |---|---|---|
   | A. JUDUL | ≤20 kata | ≤20 kata |
   | B. RINGKASAN | ≤300 kata (urgensi, tujuan, metode, luaran) | ≤300 kata |
   | C. KATA KUNCI | tepat 5, dipisah ";" | tepat 5, dipisah ";" |
   | D. PENDAHULUAN | ≤1000 kata | ≤1500 kata |
   | E. METODE | ≤1000 kata | ≤1000 kata |
   | F. HASIL YANG DIHARAPKAN | sesuai PDF | sesuai PDF |
   | G. JADWAL PENELITIAN | tanpa batas | tanpa batas |
   | H. DAFTAR PUSTAKA | tanpa batas | tanpa batas |

   Lampiran wajib tetap sesuai naskah kelompok. Label "contoh sementara" pada struktur templat diganti dengan keterangan
   "struktur mengikuti Isian Substansi Proposal".
2. **`potongPerBagian`** mengenali judul "A. JUDUL" … "H. DAFTAR PUSTAKA" (huruf besar, berawalan huruf). Pemotong juga
   melewati halaman sampul dan identitas ekspor BIMA (bagian bernomor 1–6 sebelum Isian Substansi) dan membuang kalimat
   petunjuk templat sebelum `hitungKata`. Ini menutup selisih C-16 di `docs/kontrak-dan-spesifikasi-metode.md`.
   Isi bertanda kurung siku `[ … ]` adalah isian pengusul.
3. **`siapkanTeksTanpaIdentitas`** juga membuang bagian identitas pengusul pada ekspor BIMA sebelum teks dikirim ke LLM.
4. **Unduhan templat .docx** mengikuti format Isian Substansi: judul berhuruf, kalimat petunjuk, dan tempat isian
   `[ … ]`. Hasilnya harus terbaca balik dengan bagian yang sama.
5. **Proposal demo fiktif** disusun ulang mengikuti struktur ini. Nama dan isinya tetap rekaan.
6. **Empat PDF asli menjadi berkas uji LOKAL.**
   - Disimpan di `data/uji-nyata/` (masuk `.gitignore`, tidak di-commit, tidak di-seed ke basis data/produksi).
   - Unit test kotak hitam (bersumber Contract C-21, C-16, C-17, C-23) melewati diri otomatis (`skipIf`) bila berkas
     tidak ada.
   - Yang diuji: bagian A–H terpotong benar, kata per bagian di bawah batas setelah petunjuk dibuang, kata kunci = 5,
     dan identitas pengusul tidak tersisa dalam teks untuk LLM.
   - Saat demo, Arsy boleh mengunggah PDF itu lewat halaman pengajuan BIMA tiruan. Data terhapus dengan Reset.
