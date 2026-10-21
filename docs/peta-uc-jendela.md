# Peta use case ke jendela

Sumber langkah: `docs/sumber/bab10-use-scenario-real-use-case.md` (real use case). Nomor langkah di tabel adalah nomor real use case; S- adalah *SubFlow*, Nx adalah *Alternate Flow*. Jalan pintas: halaman `/demo` (kartu UC dan skenario) atau alamat `/demo/mulai?k=<kode>` (tambahkan `&j08=1` pada UC-07a/b/c untuk membuka J-08 langsung). Setiap jalan pintas menyiapkan data, memasang sesi peran yang sesuai, lalu membuka jendela awal. PanelPemandu di setiap jendela memuat langkah real use case (`src/lib/demo/pemandu/`).

## Jendela

| Kode | Jendela | Peran | Rute |
|---|---|---|---|
| J-01 | Masuk | Tim Kerja DPPM, Reviewer | `/masuk` (SSO tiruan lewat `/bima/masuk` lalu `/api/sso/callback`) |
| J-02 | Templat Proposal | Tim Kerja (pengelola) | `/tim-kerja/templat` |
| J-03 | Aturan Pemeriksaan | Tim Kerja (pengelola) | `/tim-kerja/aturan` (pilih skema dan periode, tekan Tampilkan) |
| J-04 | Penugasan Reviewer | Tim Kerja | `/tim-kerja/penugasan` |
| J-05 | Pemantauan Kesesuaian | Tim Kerja | `/tim-kerja/pemantauan` (pilih periode dan skema, tekan Tampilkan) |
| J-06 | Hasil Pemeriksaan Pengajuan | Pengusul (dibuka dari BIMA) | `/pengusul/hasil/[idProposal]` (diawali `/pengusul/mulai`) |
| J-07 | Daftar Penugasan | Reviewer | `/reviewer/penugasan` |
| J-08 | Pemeriksaan Proposal | Reviewer | `/reviewer/pemeriksaan/[penugasanId]` (data JSON: `.../data`) |
| BIMA | Halaman BIMA tiruan | Semua (simulasi) | `/bima/masuk`, `/bima/pengajuan`, `/bima/kotak-masuk` |

## UC ke jendela, langkah, dan rute

| UC | Jendela yang dipakai | Langkah real use case | Alternatif yang dapat diperagakan | Rute awal (jalan pintas) |
|---|---|---|---|---|
| UC-01 Menyusun templat proposal | J-02 | 1-10: pilih Skema Pendanaan; lihat versi, periode, bagian, lampiran; Susun Versi Baru; Tambah Bagian/Lampiran; Periode Berlaku; Terbitkan; pesan terbit dan jumlah butir draf; Buka Aturan Pemeriksaan | S-1 skema belum punya templat; S-2 Lengkapi isian yang ditandai; 9a masa pengusulan berjalan (draf tersimpan) | `/demo/mulai?k=UC-01` -> `/tim-kerja/templat` (masa ditutup; nyalakan sakelar "berjalan" untuk 9a) |
| UC-02 Mengelola aturan pemeriksaan | J-03 (tautan ke J-02) | 1-8: pilih skema dan periode; tabel butir; Tambah Butir/Ubah/Nonaktifkan; panel butir; Simpan Butir; Uji pada Contoh (Hasil Uji); Tanggal Berlaku dan Simpan Versi | S-1 ubah lalu uji ulang; 4a butir turunan templat (terkunci); 8a tanggal berlaku di tengah masa pengusulan | `/demo/mulai?k=UC-02` -> `/tim-kerja/aturan` |
| UC-03 Menugaskan reviewer | J-04 (pesan penetapan terlihat di kotak masuk BIMA dan J-07) | 1-8: Batas Beban per Reviewer; Susun Usulan Penugasan; tabel Usulan Penugasan dan Sebaran Beban; Tetapkan Penugasan | S-1 Kekurangan Reviewer (batas beban 1); S-2 Pindahkan, Reviewer Pengganti, Simpan Pemindahan (syarat dilanggar ditampilkan) | `/demo/mulai?k=UC-03` -> `/tim-kerja/penugasan` (enam proposal Terkirim siap ditugaskan, masa ditutup) |
| UC-04 Memantau kesesuaian penilaian | J-05 (butir yang ditandai tampil di J-03) | 1-7: Periode Seleksi dan Skema Pendanaan; Butir Deterministik Paling Sering Gagal; Kesesuaian per Butir (% Disetujui); Butir dengan Koreksi Tertinggi; Perlu Diperbaiki dan Tandai Butir | S-1 panel Rincian Butir dan Tutup | `/demo/mulai?k=UC-04` -> `/tim-kerja/pemantauan` (data proposal Ditahan dan penilaian Final tersedia) |
| UC-05 Mengajukan proposal | BIMA tiruan `/bima/pengajuan` lalu J-06 | 1-11: Ajukan Usulan di BIMA; penerusan SSO ke J-06; tarikDariBima dan cekMasaPengusulan; ambilBerkas; templat dan aturan berlaku; versi baru; potongTeks; jalankanPemeriksaan; status dan bukti pengiriman | S-1.1-S-1.4 Ditahan lalu ajukan ulang; 3a.1-3a.2 Ditolak (masa ditutup); NFR 4.4 Kirim ulang | skenario a: `/demo/mulai?k=UC-05a` (Terkirim); b: `k=UC-05b` (Ditahan); c: `k=UC-05c` (Ditolak) -> `/bima/pengajuan?proposal=PRP-2026-000N` |
| UC-06 Memeriksa butir deterministik | J-06 (hasil), dijalankan otomatis oleh UC-05 | 1-8: cocokkan struktur judul, hitung kata, diagram alir, kata kunci, sitasi, lampiran; angka pembukti per butir | S-1.2 butir Gagal paling atas dengan bagian dan batas | `/demo/mulai?k=UC-06` (= skenario UC-05b) |
| UC-07 Melakukan pemeriksaan akhir | J-07, J-08 | 1-12: Periksa; teks per bagian dan butir semantik; keputusan komponen borang; umpan balik; Simpan Permanen; pesan Penilaian tersimpan dan terkirim ke BIMA | S-1 Simpan Sementara (label Draf di J-07, dimuat lagi saat Periksa) | skenario a: `/demo/mulai?k=UC-07a`; b: `k=UC-07b`; c: `k=UC-07c` -> `/reviewer/penugasan` (a: hasil semantik normal; b dan c lihat UC-09) |
| UC-08 Mengoreksi rekomendasi sistem | J-08 | 1-8: Tidak Setuju; panel koreksi; Keputusan Reviewer, Alasan Koreksi, Jenis Kekeliruan; Simpan Koreksi; label Dikoreksi reviewer | S-1 Alasan koreksi wajib diisi (bingkai merah); 4a Batal | `/demo/mulai?k=UC-08` -> `/reviewer/pemeriksaan/[penugasanId]` |
| UC-09 Memeriksa butir semantik | Dijalankan sistem; hasil di J-08 | 1-8: kutipan per butir, tingkat keyakinan, rekomendasi Memenuhi/Tidak memenuhi | S-1 kutipan tidak ditemukan (Perlu diperiksa manual); S-2 LLM tidak merespons dua kali (Belum ada rekomendasi) | `/demo/mulai?k=UC-09` (normal), `k=UC-07b&j08=1` (S-1), `k=UC-07c&j08=1` (S-2) |

## Catatan

- Skenario UC-07 a/b/c adalah varian hasil semantik (UC-09): a normal, b kutipan tidak ditemukan pada butir pertama, c LLM tidak merespons pada butir pertama. Varian b dan c hanya bermakna pada mode LLM tiruan (`SEMAR_LLM_MODE=tiruan` atau tanpa `ANTHROPIC_API_KEY`); jalan pintas memasang mode itu sementara selama satu permintaan.
- Sakelar "Masa pengusulan" di `/demo` menentukan jalur UC-01 s.9 versus 9a, UC-02 8a, UC-03 (tombol Susun aktif hanya bila ditutup), dan UC-05 3a.
- "Reset & isi data demo" mengosongkan semua tabel kecuali `log_audit` (append-only), lalu mengisi ulang data contoh. Jalan pintas tidak mereset data.
- Pemeriksaan ujung ke ujung: `npm run build` lalu `npm run e2e` (tangkapan layar dan laporan di `e2e/hasil/`, tidak masuk git).
