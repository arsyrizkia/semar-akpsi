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
    - Navigator demo mengambang di semua halaman SEMAR dan BIMA tiruan (kiri bawah, bawaan ciut, Alt+Shift+N): pindah
      antar-jendela J-01..J-08 dan halaman BIMA tiruan, pindah antar-skenario keadaan jendela yang dibuka, dan mengganti
      masa pengusulan. Menggantikan panel pemandu langkah *real use case* (data langkah tetap di `src/lib/demo/pemandu/`).
11. Bahasa antarmuka: Bahasa Indonesia.
12. Commit tanpa atribusi AI (tanpa baris Co-Authored-By atau Generated-with).
