# SEMAR — Sistem Evaluasi Mandiri dan Asisten Reviewer

Prototipe high-fidelity untuk Tugas 4 mata kuliah AKPSI (MTI UI). SEMAR membantu pemeriksaan administratif proposal
penelitian: pemeriksaan butir deterministik saat pengusul mengajukan, rekomendasi butir semantik oleh LLM untuk reviewer,
dan pemantauan kesesuaian oleh Tim Kerja. BIMA pada prototipe ini adalah **simulasi**, bukan sistem resmi.

Dokumen kerja ada di `docs/`: `keputusan.md`, `spesifikasi-ui.md`, `model-data-dan-aturan.md`, `perubahan-model.md`,
`KONTRAK.md` (peta folder dan kepemilikan), dan `sumber/` (naskah kelompok).

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi DATABASE_URL; lainnya opsional
npm run db:push              # skema ke Neon + pemicu log_audit append-only
npm run seed                 # data contoh sementara (mengosongkan tabel, kecuali log_audit)
# PERINGATAN: DATABASE_URL hasil `vercel env pull` adalah basis data PRODUKSI yang dipakai bersama. `npm test` melewati tes basis data
# dan `npm run e2e` menolak jalan kecuali DATABASE_URL_UJI diisi (branch Neon uji) atau SEMAR_IZINKAN_DB_PRODUKSI=1. `npm run seed` dan Reset menghapus data demo.
npm run dev
```

Akun demo dipilih di halaman BIMA tiruan (`/bima/masuk`); SEMAR J-01 ada di `/masuk`.
Tanpa `BLOB_READ_WRITE_TOKEN` berkas disimpan di basis data; tanpa `ANTHROPIC_API_KEY` LLM memakai mode tiruan.
