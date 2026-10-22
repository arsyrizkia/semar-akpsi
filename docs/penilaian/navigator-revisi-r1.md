# Revisi navigator demo dan J-04 skala nyata, putaran 1 (penilai 84, 85, 84)

Aturan: temuan yang diangkat minimal dua dari tiga penilai atau kritis dan terbukti diterapkan; selera tunggal diabaikan. Nomor temuan mengikuti penilai (P1 = 1.x, P2 = 2.x, P3 = 3.x).

## Diterapkan

| Temuan (penilai) | Perubahan |
|---|---|
| Isolasi skala bocor ke J-07/J-01 reviewer (1.1, 2.1, 3.1; kritis, terbukti pada bukti 58) | `nonaktifkanReviewerSkala` (jalur semua skenario non-skala) kini menghapus penugasan periode "Skala Nyata" dan pesan `SKL-2026-*` di kotak masuk BIMA; J-07, J-08, dan J-01/reviewer juga memanggil `daurUlangPenugasanKlon` (sisa klon J-04 pada reviewer contoh). e2e baru: skala, Tetapkan, lalu J-07 Semua Selesai (tepat 1 baris, bukan Baru), J-07 Baru (1 baris), kotak masuk BIMA tanpa pesan SKL. |
| Panel tetap terbuka sesudah pindah dan menutupi isian (1.2, 2.2, 3.2) | `buka()` menciutkan panel sebelum berpindah; kemajuan ("Menyiapkan ...") tampil di pil. e2e: panel harus ciut sesudah tiap pilihan dan `#batas` tidak boleh tertutup (`elementFromPoint`). |
| Pil lebar, menyebut skenario jendela lain, kode BIMA-1/2 (1.9a, 2.4, 3.2, 3.6) | Pil ringkas (maks 15 rem, "J-04 · Kosong"); skenario hanya disebut bila kode cookie sama dengan jendela yang dibuka, selain itu "J-05 · skenario belum dipilih"; nama BIMA ditulis "BIMA Pengajuan"/"BIMA Kotak masuk"; judul pil memuat skenario terakhir. e2e: pindah lewat menu header ke J-05. |
| Idempotensi BIMA tanpa batasan unik (1.3, 2.3, 3.4) | Indeks unik parsial `bima_kotak_masuk_kunci_uq` (schema.ts + `scripts/pasang-trigger.ts`, sudah dipasang di Neon bersama) dan `ON CONFLICT DO NOTHING` untuk penugasan dan keputusan; tes baru: tiga permintaan serentak untuk 200 kunci yang sama menghasilkan 200 baris. Dicatat di `perubahan-model.md`. |
| Angka produksi tidak tercatat, label e2e keras (1.4, 2.5, 3.3) | Tabel Hasil ukur di `peta-uc-jendela.md` kini memuat kolom lokal dan produksi; laporan produksi disalin ke `docs/bukti-e2e/laporan-produksi-skala.md`; label e2e diturunkan dari `E2E_BASE_URL` (catatan waktu dan baris "Sasaran" laporan). |
| Realisme data (1.7, 2.6, 3.8) | 4.000 pengusul (2-3 proposal tiap pengusul, set-based), judul topik x pendekatan x wilayah, tabel J-04 diurutkan menurut id proposal (halaman 1 tidak lagi berisi judul identik). Kesediaan reviewer tetap biner (dicatat di peta). Skema tetap PD saja (selera 2 dari 3 penilai, tidak murah: butuh templat dan basis aturan per skema; ditunda). |
| Sakelar masa tidak sinkron dengan periode skala (1.9c, 2.7, 3.7) | `ubahPengaturanDemo` ikut menggeser `tanggalTutup` periode aktif; `ubahMasa` di navigator ditangkap galatnya dan tombol dinonaktifkan selama berjalan. |
| GET `/demo/mulai` mengubah data (1.8, 2.10) | Menolak (405) prefetch, `Sec-Fetch-Mode` bukan navigate, dan UA perayap/pratinjau tautan; `/demo` noindex+nofollow, tautan kartu `rel=nofollow`, `public/robots.txt` melarang `/demo`. Halaman konfirmasi untuk skala tidak dibuat (navigasi sengaja dari navigator). |
| Susunan panel (1.5) | Skenario jendela yang dibuka di atas; jendela jadi chip 5 kolom (nama dan skenario bawaan di tooltip dan `aria-label`). Bukti 44 menampilkan keenam skenario J-04. |
| "Enam proposal" menampilkan 7 (1.6, 3.9c) dan klon BIMA yatim (1.10) | `pastikanProposalBelumDitugaskan` kini tepat (buang kelebihan, buat kekurangan); proposal klon yang dihapus ikut menghapus cermin `bima_proposal` (nomor di atas 0004). e2e: tepat 6. |
| Pesan J-04 (3.9, 2.9, 1.9d) | "Belum ada usulan..." tampil bila masih ada proposal perlu ditugaskan, selain itu "Tidak ada usulan yang menunggu penetapan."; panel S-1 memakai batas yang dipakai saat Susun (`batasDipakai`); teks sakelar menyebut Navigator demo; komentar format cookie "/" dibetulkan. |
| "Menyiapkan" macet saat Back/bfcache (2.8) | Pendengar `pageshow` mengosongkan status. |

## Tidak diterapkan (dengan alasan)

- Tombol "buka dengan data saat ini" tanpa menyiapkan skenario (3.5, tunggal): perilaku sekarang dipertahankan; tooltip tombol jendela kini menyebut skenario bawaan yang akan disiapkan.
- Penanda terkirim per penugasan dan "Kirim ulang" otomatis untuk baris Ditetapkan yang tidak pernah sampai ke BIMA (bagian kedua 1.3 dan 3.4): butuh kolom baru dan menyentuh data seed; dicatat sebagai batas yang diketahui di `peta-uc-jendela.md`.
- Opsi sembunyi penuh navigator (2.4, tunggal, opsional): pil sudah ringkas dan dapat disingkirkan dengan menggulir; tidak ditambahkan.
- Sebaran skema PD/PT dan hasil_pemeriksaan per proposal skala (2.6c, 3.8): ditunda, lihat atas.

## Hasil verifikasi

- `npx tsc --noEmit`, `npm run lint`, `npm run build` bersih. `npm test` (dengan `SEMAR_IZINKAN_DB_PRODUKSI=1`): 124 lulus, 2 gagal pada `src/lib/pengajuan/integrasi.test.ts` (contoh A dan C, "Belum diajukan"); kedua kegagalan sudah ada sebelum revisi ini (terbukti dengan menjalankan tes yang sama pada commit b19c861) dan bukan bagian gerbang tanpa basis data; penyebabnya belum diselidiki.
- e2e penuh lokal: 26 dari 26 lulus (`docs/bukti-e2e/laporan.md`, 69 tangkapan layar termasuk navigator terbuka dan J-04 10.000).
- Produksi (22 Okt 2026): GET `/`, `/masuk`, `/bima/masuk`, `/demo` 200; run terfilter skala 2 dari 2 lulus (susun 0,7 dtk dan tetapkan 1,4 dtk di server).
