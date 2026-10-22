# CLAUDE.md — SEMAR (prototipe Tugas 4 AKPSI)

SEMAR = Sistem Evaluasi Mandiri dan Asisten Reviewer. Next.js 16 (App Router), Tailwind 4, Drizzle + Neon, Vercel Blob,
produksi https://semar-akpsi.vercel.app (push ke `main` = deploy otomatis). Aturan desain dan data: `docs/keputusan.md`.
Arah perbaikan terbaru: `docs/arah-perbaikan-2026-10-22.md`.

## Skill wajib untuk setiap perubahan antarmuka

Setiap perubahan pada `src/app/**`, `src/components/**`, berkas `.tsx` atau `.css` WAJIB memakai skill di `.claude/skills/`:

| Kapan | Skill |
|---|---|
| Sebelum mendesain/mengubah layar, komponen, warna, tipografi, tata letak, interaksi | `ui-ux-pro-max` (acuan token: `docs/desain-sistem.md`; jalankan pre-delivery checklist) |
| Token, komponen shadcn/Radix, Tailwind | `design-system`, `ui-styling` |
| Menulis atau merombak kode React/Next | `vercel-react-best-practices`, `vercel-composition-patterns` |
| Transisi antarlayar | `vercel-react-view-transitions` (opsional, hormati reduced motion) |
| Sebelum menyatakan selesai | audit berkas yang diubah dengan `web-design-guidelines` |

Hook `.claude/hooks/ingat-skill-ui.sh` (PreToolUse Edit/Write) mengingatkan aturan ini saat berkas antarmuka diubah.
Skill diperbarui dengan `npx skills update -p` (Vercel) dan `npx ui-ux-pro-max-cli init --ai claude` (UI/UX Pro Max).

## Yang dilarang (pola "AI slop")

- Semua isi dibungkus kartu berbingkai dengan baris judul serif; banner penjelas di badan halaman; paragraf deskripsi
  panjang di bawah setiap judul; label kode jendela besar di atas setiap judul.
- Gradien, glow, emoji sebagai ikon, lencana berlebihan, halaman muka bergaya *landing page*.
- Form pendek atau konfirmasi yang ditaruh inline padahal harus modal; isi yang seharusnya layar terpisah ditumpuk di
  satu layar. Inventaris layar (J-xx) dan modal (M-xx) ada di `docs/arah-perbaikan-2026-10-22.md` dan
  `docs/peta-uc-jendela.md`.

## Pengujian

- Unit test dua pendekatan (Dennis dkk., 2015, hlm. 471–475; sumber rencana uji persis Gambar 12-4 hlm. 472):
  - *black box* (`tests/unit/kotak-hitam/`, ID `KH-…`), bersumber dari **CRC Cards, Class Diagrams, Contracts**
    (*state machine* untuk kasus keadaan). Kasusnya: nilai sah, batas bawah/atas tidak sah, tipe salah, nilai janggal;
  - *white box* (`tests/unit/kotak-putih/`, ID `KP-…`), bersumber dari **Method Specifications** (setiap cabang/jalur).
- *Real use case* bukan sumber unit test; ia sumber *use-case testing* (integrasi/e2e). Kontrak (Gambar 8-22, hlm. 309)
  dan spesifikasi metode (Gambar 8-26, hlm. 315) ada di `docs/kontrak-dan-spesifikasi-metode.md`.
- Rencana dan laporan uji: `docs/rencana-uji.md`, `docs/laporan-uji.md`. Cakupan: `npm run test:coverage`.
- Sebelum commit: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## Lain-lain

- Git: `/Library/Developer/CommandLineTools/usr/bin/git`. Commit tanpa atribusi AI.
- Basis data Neon dipakai bersama lokal dan produksi; tekan "Reset & isi data demo" sesudah uji.
- Semua nama orang/institusi rekaan; halaman BIMA tiruan berlabel "Simulasi BIMA – bukan sistem resmi".
