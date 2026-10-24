# Audit antarmuka UC-01 rancangan ulang (24 Okt 2026)

Aturan: Web Interface Guidelines (vercel-labs, command.md), diterapkan pada berkas yang diubah:
`templat/page.tsx`, `penyaring-daftar.tsx`, `templat-baru.tsx`, `[idTemplat]/rincian-templat.tsx`, `tab-bagian.tsx`, `tab-lampiran.tsx`,
`tab-depan.tsx`, `modal-ketentuan.tsx`, `modal-lampiran.tsx`, `aturan/papan-aturan.tsx`, `aturan/form-aturan.tsx`, `aturan/uji/page.tsx`,
`navigator-demo.tsx`. Pemeriksaan manual atas kode dan tangkapan `docs/bukti-e2e/uc01ui-*.png` (1440 dan 390 px); skill dijalankan sebagai daftar periksa, bukan agen.

## Lulus
- Tombol ikon dan aksi baris punya `aria-label` ("Naikkan bagian A", "Hapus aturan FRS-01"); ikon dekoratif `aria-hidden`.
- Semua isian berlabel (`Isian`/`Pilihan`), `name` bermakna, `autoComplete="off"`, `spellCheck={false}` pada kode, `inputMode="numeric"` pada angka; galat di dekat isian dan fokus ke isian bertanda pertama (S-2 memindah ke tab yang memuat tanda).
- Tombol untuk aksi, `Link` untuk navigasi; baris daftar J-02 memakai tautan nama dengan area klik seluruh baris, tombol Unduh tetap terpisah (`z-10`).
- URL memuat keadaan: penyaring Tahun/Skema/Status (J-02), `?tab=`, `?periode=`, `?sorot=` (J-02a); tombol Back bekerja.
- Peringatan sebelum meninggalkan draf yang kotor (`CegatTinggalkan`, `beforeunload`); aksi merusak (Hapus aturan, Nonaktifkan) lewat modal konfirmasi.
- Angka memakai `.angka` (tabular-nums) dan rata kanan; target sentuh 44 px pada layar sentuh (ukuran tombol bersama); keadaan kosong tersedia ("Belum ada templat untuk tahun ini").
- Tata letak 390 px: daftar menjadi kartu, tabel aturan memakai mode bertumpuk; tanpa gulir horizontal pada halaman.
- Fokus terlihat (`:focus-visible` global); tanpa `outline: none`; tanpa `transition: all`.

## Temuan dan keputusan
1. **Hapus bagian/lampiran di tab Bagian dan Lampiran tanpa konfirmasi.** Berlaku hanya pada draf yang belum disimpan dan dapat dibatalkan dengan tidak menyimpan; dibiarkan, dicatat.
2. **Penyaring Bagian/Jenis/Status di tab Aturan belum di URL.** Sebagian (bagian dari "Atur aturan bagian ini") sudah lewat keadaan; sinkron URL ditunda.
3. **Toast tidak hilang sendiri di Chrome tanpa kepala** (Sonner menjeda saat tab tersembunyi); e2e menutupnya lewat tombol tutup. Perilaku produksi normal (5 dtk).
4. **Tab Radix memuat ulang panel Aturan setiap berpindah tab** (penyaring kembali ke bawaan). Dapat diterima; `key` panel memuat fokus bagian dan sorotan supaya tautan "Atur aturan bagian ini" bekerja.
5. Tidak ada gambar, animasi, atau pemutaran media baru; aturan terkait tidak berlaku.
