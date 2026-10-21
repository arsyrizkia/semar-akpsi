# Inkonsistensi di draf kelompok yang ditemukan saat membangun prototipe

Hal-hal berikut perlu diselaraskan kelompok di naskah. Rujukan baris memakai `docs/sumber/draf-kumulatif-teks.md` (DK).

| No | Inkonsistensi | Yang dipakai prototipe | Bagian naskah yang perlu disesuaikan |
|---|---|---|---|
| 1 | Ringkasan dan Bab 5 (BPR; DK 454–457, 496–497, 1176–1180) menyebut **dua token** pengajuan dan status "gagal submisi". UC-05 Bab 7 dan *real use case* membolehkan perbaikan berulang tanpa batas sampai masa pengusulan ditutup. | Tanpa batas token (keputusan Arsy, 21 Okt 2026) | Ringkasan Eksekutif, Bab 5 (to-be), Glosarium "Token submisi" |
| 2 | Ringkasan (DK 461) menyebut "sepuluh use case", padahal Bab 7 memuat sembilan (UC-01..UC-09). | Sembilan | Ringkasan Eksekutif |
| 3 | NFR 1.1 (DK 1229) menyebut "server milik DPPM", sedangkan System Request (DK 519) menyebut "aplikasi di cloud". | Prototipe di Vercel (demo). Lokasi produksi diputuskan di Bab 11. | Bab 2, Bab 6.2, Bab 11 |
| 4 | Bab 5 (DK 1178) menyebut pengusul melihat hasil butir semantik, sedangkan Bab 7 UC-05 hanya menyebut butir deterministik. UC-09 berlaku untuk reviewer. | Pengusul hanya melihat butir deterministik (J-06), reviewer melihat butir semantik (J-08) | Bab 5 |
| 5 | Bab 7 menulis UC-09 di-*include* UC-07 (dipanggil saat reviewer membuka proposal), sedangkan *real use case* menjalankan UC-09 di latar belakang sesudah `catatTerkirim`. | Latar belakang sesudah `catatTerkirim`, dengan tombol "Jalankan ulang" untuk demo | Bab 7 UC-07/UC-09, *sequence* UC-07 |
| 6 | Pengantar *state machine* Bab 9.3 (DK 3973) masih berisi kelas proyek lain (Tiket, RekomendasiAI). | Status dari *real use case*: templat Draf/Terbit/Arsip; butir Draf/Aktif/Perlu ditinjau/Nonaktif | Bab 9.3 |
