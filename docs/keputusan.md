# Keputusan desain prototipe SEMAR (21 Okt 2026)

SEMAR = **Sistem Evaluasi Mandiri dan Asisten Reviewer**. Prototipe high-fidelity untuk Tugas 4 AKPSI (MTI UI). Sistem ini
membantu DPPM memeriksa proposal penelitian secara administratif.

## Wajib diikuti semua agen

1. **Arsitektur opsi B.** SEMAR adalah aplikasi terpisah. BIMA adalah sistem eksternal yang menjadi backend dan sumber
   data lewat API. Login memakai akun BIMA (SSO tiruan). Dalam prototipe, BIMA disimulasikan di aplikasi yang sama:
   - `/bima/*` untuk halaman dan `/api/bima/*` untuk API.
   - Setiap halaman BIMA tiruan memuat label tetap **"Simulasi BIMA – bukan sistem resmi"**.
   - Tidak ada logo, nama domain, atau identitas visual Kemdiktisaintek/BIMA asli.
   - SEMAR memanggil BIMA hanya lewat `lib/bima/client.ts`, dengan retry maksimal 2 kali (NFR 4.4).
2. **Spesifikasi perilaku** ada di `docs/sumber/bab10-use-scenario-real-use-case.md`, yaitu *real use case* UC-01..09 dan
   jendela J-01..J-08. Ringkasannya ada di `docs/spesifikasi-ui.md`. Label tombol, isian, dan pesan sistem ditulis
   **persis** seperti di sana.
3. **Aturan pengajuan: tanpa batas token.** Pengusul boleh memperbaiki dan mengajukan ulang sampai masa pengusulan
   ditutup (UC-05 Bab 7). Kalimat "dua token" di Ringkasan dan Bab 5 draf dianggap usang (lihat
   `docs/catatan-inkonsistensi.md`).
4. **Model data** mengikuti class diagram (`docs/model-data-dan-aturan.md`), tetapi **boleh diperbaiki** bila aplikasi
   nyata butuh atribut atau tabel lain. Setiap tambahan atau penyimpangan WAJIB dicatat di `docs/perubahan-model.md`,
   dengan format: kelas/tabel, perubahan, alasan, dan bab naskah yang perlu disesuaikan.
5. **Nama fungsi servis** sama dengan metode di *sequence diagram* (`docs/sumber/sequence/*.puml`), misalnya
   `tarikDariBima`, `cekMasaPengusulan`, `potongPerBagian`, `hitungKata`, `cekKataKunci`, `cocokkanSitasi`, `cekLampiran`,
   `cocokkanStrukturJudul`, `siapkanTeksTanpaIdentitas`, `cocokkanKutipan`, `catatTerkirim`, `pilihReviewer`,
   `kirimPenugasan`, `kirimKeputusan`, `simpanKoreksi`. Tujuannya supaya kode bisa ditelusuri dari naskah.
6. **LLM (UC-09):** SDK resmi `@anthropic-ai/sdk`. Model dibaca dari env `SEMAR_LLM_MODEL` dengan bawaan `claude-opus-5-5`.
   - Pakai *structured outputs* dan *effort* eksplisit.
   - Batas waktu 15 detik dengan 2 percobaan. Bila tetap gagal, status butir "Belum ada rekomendasi".
   - Teks dikirim tanpa identitas pengusul.
   - Kutipan diverifikasi ada di teks. Bila tidak, status "Perlu diperiksa manual".
   - Key hanya di server (`ANTHROPIC_API_KEY`).
7. **Data:** Neon Postgres lewat Drizzle, dengan lazy `getDb()` (jangan memakai Proxy). Berkas disimpan di Vercel Blob
   (store private). `log_audit` hanya boleh ditambah: tidak ada update atau delete.
8. **Data contoh sementara:** semua nama orang dan institusi rekaan, diberi label "contoh sementara". Jangan memakai
   nama asli dari wawancara. Semua data contoh berada di `data/contoh/` supaya bisa ditukar dengan bahan kelompok.
9. **Tema wayang Semar:** palet sogan (cokelat), emas, dan krem, dengan motif kawung halus. Ilustrasi Semar dibuat
   sendiri dalam SVG, jangan menyalin gambar wayang yang sudah ada. Antarmuka reviewer harus sederhana (NFR 5.1),
   kontras WCAG AA, dan indikator keyakinan berwarna (NFR 5.2).
10. **Demo:**
    - `/demo` menyediakan reset dan seed, jalan pintas UC-01..UC-09, dan 6 skenario (UC-05 a/b/c, UC-07 a/b/c).
    - Ada sakelar "masa pengusulan berjalan/ditutup".
    - Navigator demo mengambang di semua halaman SEMAR dan BIMA tiruan (kanan bawah, bawaan ciut, Alt+Shift+N): pindah
      antar-jendela J-01..J-08 dan halaman BIMA tiruan, pindah antar-skenario keadaan jendela yang dibuka, dan mengganti
      masa pengusulan. Menggantikan panel pemandu langkah *real use case* (data langkah tetap di `src/lib/demo/pemandu/`).
11. Bahasa antarmuka: Bahasa Indonesia.
12. Commit tanpa atribusi AI (tanpa baris Co-Authored-By atau Generated-with).
13. **Tampilan "Sogan tenang" dengan palet Kemdiktisaintek (22 Okt 2026, menggantikan sebagian butir 9).** Tata letak alat
    kerja "Sogan tenang" dan font **Outfit** tetap; tanpa serif. **Warna utama dari palet situs Kemdiktisaintek** (token
    `primer-*`: teks dan tombol berlabel memakai `#0050AD`/`#003366`, `#1F86FF` hanya untuk elemen besar, ikon, dan garis
    fokus karena kontrasnya 3,55 : 1; latar lembut `#E7EDFA`; sidebar navy `#002550`). **Sogan dan emas menjadi aksen
    identitas Semar** (token `merek-semar-*`, `aksen-*`): wordmark, ilustrasi, penanda kecil dan kawung tipis hanya di area
    merek. Warna status (daun, bata, peringatan) terpisah dari biru merek dan selalu disertai teks atau ikon. Yang dipinjam
    dari Kemdiktisaintek hanya warna, tanpa logo atau nama; BIMA tiruan tetap abu-slate berlabel "Simulasi BIMA – bukan
    sistem resmi". Desain sistem dan tabel kontras: `docs/desain-sistem.md`.
    Setiap perubahan antarmuka wajib memakai skill di `.claude/skills/` (lihat `CLAUDE.md`).
14. **Layar dan modal** mengikuti inventaris J-01..J-08b dan M-01..M-11 di `docs/arah-perbaikan-2026-10-22.md`. Form
    pendek dan konfirmasi berupa modal; isi besar yang berdiri sendiri berupa layar dengan URL sendiri.
15. **Alur bolak-balik:** satu dunia data. Pindah layar atau peran tidak mengubah data, hanya Reset dan skenario
    navigator yang mengubahnya. Tautan antarentitas dan unduhan (templat .docx, berkas proposal) tersedia.
16. **Unit test** *black box* (`tests/unit/kotak-hitam/`, `KH-…`) dan *white box* (`tests/unit/kotak-putih/`, `KP-…`)
    mengikuti Dennis dkk. (2015, hlm. 469–475), dengan rencana di `docs/rencana-uji.md` dan laporan di
    `docs/laporan-uji.md`. Sumber rencana uji persis Gambar 12-4: *black box* dari CRC Cards / Class Diagrams /
    Contracts, *white box* dari Method Specifications (`docs/kontrak-dan-spesifikasi-metode.md`). *Real use case* hanya
    untuk uji integrasi.

## Data skala nyata (22 Okt 2026)

Data skenario J-04 "skala" (10.000 proposal, periode "Skala Nyata 2026", pesan SKL-2026-* di kotak masuk BIMA, penugasannya) tidak dihapus oleh skenario lain; hanya "Reset & isi data demo" yang menghapusnya. Kumpulan reviewer periode skala hanya akun `rvw-skala-*` (reviewer contoh reviewer-1..5 tidak ikut dibagi), dan periode lain tidak memakai akun `rvw-skala-*`. Akun `rvw-skala-*` disembunyikan dari /bima/masuk.
