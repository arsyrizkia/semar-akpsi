# Ringkasan penilaian prototipe SEMAR (22 Okt 2026)

Penilaian memakai 3 sisi × 3 penilai `opus`. Skor sisi adalah median tiga penilai, targetnya ≥ 90. Revisi konsensus dikerjakan `sonnet`, maksimal 3 putaran, dan sisi yang sudah lulus dibekukan.

| Putaran | Ketertelusuran ke *real use case* | Desain antarmuka (Dennis + NFR) | Teknis dan kesiapan demo | Revisi sesudahnya |
|---|---|---|---|---|
| 1 | 77 | 82 | 82 | r1: 9 temuan diterapkan (`revisi-r1.md`) |
| 2 | 85 | 87 | 81 | r2: 18 temuan diterapkan (`revisi-r2.md`) |
| 3 | **90 (lulus)** | 87 | 88 | batas putaran tercapai |

## Perbaikan manual sesudah putaran 3

Perbaikan ini mengikuti temuan yang disepakati ketiga penilai.

**Desain.** Dua masalah di J-08 dibetulkan (commit 38695da):

- Bilah tab J-08 sebelumnya dipaksa satu baris, sehingga tab Kata Kunci, Daftar Pustaka, dan Lampiran tersembunyi. Sekarang tab boleh turun baris.
- Hitungan "rekomendasi akan dianggap disetujui" tidak lagi memasukkan butir "Belum ada rekomendasi" dan "Perlu diperiksa manual". Butir-butir itu kini disebut terpisah.

**Teknis.** Jalur runtime produksi diverifikasi di https://semar-akpsi.vercel.app dengan UC-05a, hasilnya lulus:

- Naskah dan tiga lampiran tersimpan di Vercel Blob private.
- `after()` menjalankan job semantik sampai Selesai.
- Panggilan BIMA tiruan lewat `BIMA_BASE_URL` produksi berhasil, terlihat dari log audit `pengajuan.diterima`, `proposal.terkirim`, dan `penilaian.terkirim_bima`.

## Yang masih terbuka

- **LLM nyata belum berfungsi di produksi.** `ANTHROPIC_API_KEY` belum terikat ke workspace, jadi permintaan ditolak dengan galat 400 "must include the anthropic-workspace-id header".
  - Kode sudah mendukung `ANTHROPIC_WORKSPACE_ID` (commit cbd1998).
  - Isi env itu, atau ganti key dengan key milik sebuah workspace.
  - Sampai itu dilakukan, butir semantik jatuh ke "Belum ada rekomendasi" (UC-09 S-2). Jalan pintas UC-07/UC-09 di /demo memakai mode tiruan.
- **Basis data Neon dipakai bersama oleh lingkungan lokal dan produksi.** Tekan "Reset & isi data demo" sebelum presentasi.
