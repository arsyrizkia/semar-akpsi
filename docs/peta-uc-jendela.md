# Peta use case ke jendela

Sumber langkah: `docs/sumber/bab10-use-scenario-real-use-case.md` (real use case). Nomor langkah di tabel adalah nomor real use case; S- adalah *SubFlow*, Nx adalah *Alternate Flow*. Jalan pintas: halaman `/demo` (kartu UC dan skenario) atau alamat `/demo/mulai?k=<kode>` (tambahkan `&j08=1` pada UC-07a/c untuk membuka J-08 langsung; UC-07b, UC-08, dan UC-09-S1/S2 selalu membuka J-08). Setiap jalan pintas menyiapkan data, memasang sesi peran yang sesuai, lalu membuka jendela awal. PanelPemandu di setiap jendela memuat langkah real use case (`src/lib/demo/pemandu/`).

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
| UC-01 Mengelola templat proposal | J-02 | 1-10: pilih Skema Pendanaan; lihat versi, periode, bagian, lampiran; Susun Versi Baru; Tambah Bagian/Lampiran; Periode Berlaku; Terbitkan; pesan terbit dan jumlah butir draf; Buka Aturan Pemeriksaan | S-1 skema belum punya templat (kartu `UC-01-S1`, skema contoh "PK"); S-2 Lengkapi isian yang ditandai; 9a masa pengusulan berjalan (draf tersimpan) | `/demo/mulai?k=UC-01` -> `/tim-kerja/templat` (masa ditutup, draf sisa demo dibuang; nyalakan sakelar "berjalan" untuk 9a); `k=UC-01-S1` -> J-02 pada skema tanpa templat |
| UC-02 Mengelola aturan pemeriksaan | J-03 (tautan ke J-02) | 1-8: pilih skema dan periode; tabel butir; Tambah Butir/Ubah/Nonaktifkan; panel butir; Simpan Butir; Uji pada Contoh (Hasil Uji); Tanggal Berlaku dan Simpan Versi | S-1 ubah lalu uji ulang; 4a butir turunan templat (terkunci); 8a tanggal berlaku di tengah masa pengusulan | `/demo/mulai?k=UC-02` -> `/tim-kerja/aturan` |
| UC-03 Menugaskan reviewer | J-04 (pesan penetapan terlihat di kotak masuk BIMA dan J-07) | 1-8: Batas Beban per Reviewer; Susun Usulan Penugasan; tabel Usulan Penugasan dan Sebaran Beban; Tetapkan Penugasan | S-1 Kekurangan Reviewer (batas beban 1); S-2 Pindahkan, Reviewer Pengganti, Simpan Pemindahan (syarat dilanggar ditampilkan) | `/demo/mulai?k=UC-03` -> `/tim-kerja/penugasan` (enam proposal Terkirim siap ditugaskan, masa ditutup) |
| UC-04 Memantau kesesuaian penilaian | J-05 (butir yang ditandai tampil di J-03) | 1-7: Periode Seleksi dan Skema Pendanaan; Butir Deterministik Paling Sering Gagal; Kesesuaian per Butir (% Disetujui); Butir dengan Koreksi Tertinggi; Perlu Diperbaiki dan Tandai Butir | S-1 panel Rincian Butir dan Tutup | `/demo/mulai?k=UC-04` -> `/tim-kerja/pemantauan` (data proposal Ditahan dan penilaian Final tersedia) |
| UC-05 Mengajukan proposal | BIMA tiruan `/bima/pengajuan` lalu J-06 | 1-11: Ajukan Usulan di BIMA; penerusan SSO ke J-06; tarikDariBima dan cekMasaPengusulan; ambilBerkas; templat dan aturan berlaku; versi baru; potongTeks; jalankanPemeriksaan; status dan bukti pengiriman | S-1.1-S-1.4 Ditahan lalu ajukan ulang; 3a.1-3a.2 Ditolak (masa ditutup); NFR 4.4 Kirim ulang | skenario a: `/demo/mulai?k=UC-05a` "Proposal terkirim pada pengajuan pertama"; b: `k=UC-05b` "Proposal ditahan lalu terkirim setelah diperbaiki" (Ditahan, lalu Ajukan ulang dengan kotak centang "Pakai naskah perbaikan (contoh)" -> Terkirim V2); c: `k=UC-05c` "Proposal ditahan lalu ditolak karena masa pengusulan ditutup" (Ditahan, tombol "Tutup masa pengusulan" di BIMA, Ajukan ulang -> Ditolak) -> `/bima/pengajuan?proposal=PRP-2026-000N` |
| UC-06 Memeriksa butir deterministik (tanpa aktor utama; di dalam UC-05) | J-06 (hasil; pemandu UC-05 diikuti langkah UC-06 berawalan "6.") | 1-8: cocokkan struktur judul, hitung kata, diagram alir, kata kunci, sitasi, lampiran; angka pembukti per butir | S-1.2 butir Gagal paling atas dengan bagian dan batas | `/demo/mulai?k=UC-06` (= skenario UC-05b) |
| UC-07 Melakukan pemeriksaan akhir | J-07, J-08 | 1-12: Periksa; teks per bagian dan butir semantik; keputusan komponen borang; umpan balik; Simpan Permanen; pesan Penilaian tersimpan dan terkirim ke BIMA | S-1 Simpan Sementara (label Draf di J-07, dimuat lagi saat Periksa) | a "Menyetujui seluruh rekomendasi": `k=UC-07a` -> J-07; b "Mengoreksi rekomendasi yang keliru": `k=UC-07b` -> J-08 (UC-08); c "Menyimpan sementara lalu melanjutkan": `k=UC-07c` -> J-07 berlabel Draf, J-08 memuat ulang isian |
| UC-08 Mengoreksi rekomendasi sistem | J-08 | 1-8: Tidak Setuju; panel koreksi; Keputusan Reviewer, Alasan Koreksi, Jenis Kekeliruan; Simpan Koreksi; label Dikoreksi reviewer | S-1 Alasan koreksi wajib diisi (bingkai merah); 4a Batal | `/demo/mulai?k=UC-08` -> `/reviewer/pemeriksaan/[penugasanId]` |
| UC-09 Memeriksa butir semantik (tanpa aktor utama; pendukung Layanan LLM) | Dijalankan sistem; hasil di J-08 (pemandu J-08 memuat langkah UC-09 berawalan "9.") | 1-8: kutipan per butir, tingkat keyakinan, rekomendasi Memenuhi/Tidak memenuhi | S-1 kutipan tidak ditemukan (Perlu diperiksa manual); S-2 LLM tidak merespons dua kali (Belum ada rekomendasi) | `/demo/mulai?k=UC-09` (normal), `k=UC-09-S1` (S-1), `k=UC-09-S2` (S-2) |

## Catatan

- Enam use scenario Bab 10.1 (Tabel us-05a..us-07c) ada di kartu "Enam skenario" pada /demo dengan judul yang sama. Varian hasil semantik (kutipan tidak ditemukan, LLM tidak merespons) kini kartu UC-09 S-1 dan S-2. Varian itu dan seluruh jalan pintas UC-07/08/09 memaksa mode tiruan lewat opsi fungsi (bukan `process.env`), sehingga aman walau produksi bermode LLM "nyata".
- Sakelar "Masa pengusulan" di `/demo` (juga alat simulasi di halaman pengajuan BIMA tiruan) menentukan jalur UC-01 s.9 versus 9a, UC-02 8a, UC-03 (tombol Susun aktif hanya bila ditutup), dan UC-05 3a. Sakelar juga menggeser `tanggalTutup` periode supaya tanggal yang tampil searah dengan statusnya.
- "Reset & isi data demo" (meminta konfirmasi) mengosongkan semua tabel kecuali `log_audit` (append-only), lalu mengisi ulang data contoh. Jalan pintas tidak mereset data.
- Pemeriksaan ujung ke ujung: `npm run build` lalu `npm run e2e` dengan `DATABASE_URL_UJI` (branch Neon uji; e2e menolak jalan terhadap basis data produksi). Tangkapan layar dan laporan di `e2e/hasil/` (run terfilter menulis ke `e2e/hasil/filter-*/`).

## Metode sequence ke berkas dan fungsi

Nama fungsi servis sama dengan metode sequence (keputusan 5). Alias (`export const x = y`) ditandai "=".

| Sequence | Metode -> berkas:fungsi |
|---|---|
| seq-uc01 | ambilTemplatBerlaku -> `templat/layanan.ts:ambilTemplatBerlaku`; periksaKelengkapan -> `templat/kelengkapan.ts`; terbitkan -> `templat/layanan.ts:terbitkan`; cekPengusulanBerjalan = masaPengusulanBerjalan (dipanggil di terbitkan); gantiTemplatBerlaku, arsipkan, nonaktifkan -> `templat/layanan.ts` (dipanggil di terbitkan); turunkanButirCek = turunkanButirDariTemplat (dipanggil di terbitkan); aturBagian, aturKetentuan, tetapkanPeriodeBerlaku = simpanIsian; aturParameter -> isian `parameter` pada insert butir turunan |
| seq-uc02 | daftarButirBerlaku, basisAturanBerlaku = daftarButirBerlaku; ubahParameter = simpanButir; nonaktifkan = nonaktifkanButir; ujiPadaContoh; validasiTanggalBerlaku (`aturan/tanggal.ts`); simpanVersiBaru; masaPengusulanBerjalan (`waktu.ts`); create -> insert Drizzle |
| seq-uc03 | tetapkanBatasBeban, susunPenugasan, pilihReviewer, tetapkanPenugasan di `penugasan/layanan.ts`; ambilDaftarReviewer dan kirimPenugasan (pembungkus klien BIMA, dipanggil di alur); tetapkan, mencatatPenugasan, terimaProposal = tetapkanPenugasan |
| seq-uc04 | ambilAturanBerlaku, rekapKesesuaian (`pemantauan/rekap.ts`), tandaiButir di `pemantauan/layanan.ts`; hitungTingkatKoreksi, ambilStatus, ambilAlasan, ambilRincian, ambilContoh = susunLaporan; tandaiPerluDitinjau = tandaiButir |
| seq-uc05 | (catatan r2: `ambilBerkas` sequence = `bima.ambilBerkas` di `lib/bima/client.ts` dengan argumen berkasId, didahului `bima.ambilProposal`; bukan `berkas.ts`) tarikDariBima, cekMasaPengusulan (membandingkan jam demo dengan tanggalBuka/tanggalTutup), ambilTemplatBerlaku, ambilAturanBerlaku, catatTerkirim di `pengajuan/layanan.ts`; potongTeks, potongPerBagian (`pengajuan/potong.ts`); ambilBerkas (`berkas.ts`); jalankanPemeriksaan = jalankanPemeriksaanDeterministik (`pemeriksa/deterministik/index.ts`) |
| seq-uc06 | periksaDeterministik = jalankanPemeriksaanDeterministik; periksa = periksaDeterministikTeks; ambilTeksBagian = teksBagian; cocokkanStrukturJudul, hitungKata, cekKataKunci, cocokkanSitasi, cekLampiran di `pemeriksa/deterministik/` |
| seq-uc07 | bukaProposal (dan periksaAkses), bukaVersiDinilai, ambilHasilPemeriksaan, muatPemeriksaan, simpanNilai, terima, tandaiSelesai, mencatatPenilaian, kirimKeputusan = kirimKeBima di `penilaian/layanan.ts`, semuanya dipanggil oleh muatPemeriksaan dan simpanPermanen |
| seq-uc08 | catatKoreksi, ambilRekomendasi, gantiRekomendasi, simpanKoreksi di `penilaian/layanan.ts` (simpanKoreksi memanggil ketiganya) |
| seq-uc09 | jalankanPemeriksaan(semantik) -> `semantik/jalankan.ts:jalankan`; periksaSemantik, nilaiSemantik = nilaiSemantikDenganOpsi (`semantik/mesin.ts`); kirimPermintaan (`semantik/llm.ts`) dan mintaJawaban (batas percobaan); cocokkanKutipan, siapkanTeksTanpaIdentitas (`semantik/teks.ts`) |


Catatan r2: alias nominal yang tidak pernah dipanggil dengan namanya sendiri (satu fungsi memikul beberapa pesan sequence): aturBagian, aturKetentuan, tetapkanPeriodeBerlaku (= simpanIsian); basisAturanBerlaku, ubahParameter; tetapkan, mencatatPenugasan, terimaProposal (= tetapkanPenugasan); hitungTingkatKoreksi, ambilStatus, ambilAlasan, ambilRincian, ambilContoh (= susunLaporan); tandaiPerluDitinjau; periksaDeterministik, periksa, ambilTeksBagian; nilaiSemantik, periksaSemantik. `aturParameter` hanya komentar. `pilihReviewer` hanya melayani S-2 (susunPenugasan memakai `susunUsulanMurni`). Penolakan 4a UC-02 berjalan lewat `periksaKunciButir`. Kartu jalan pintas: UC-07b kini mendarat di J-07, UC-07c-awal mulai dari label Baru.

## Bukti (tangkapan layar e2e, run penuh r2)

Run penuh `npm run e2e` pada kode r2, 19 dari 19 skenario lulus (`docs/bukti-e2e/laporan.md`; salinan dari `e2e/hasil/` yang di-.gitignore). Nomor = awalan berkas PNG di `docs/bukti-e2e/`.

| UC / langkah atau alternatif | PNG |
|---|---|
| UC-05 langkah 1 (BIMA), 2 (J-06 sedang diperiksa), 11 (Terkirim, bukti pengiriman) | 05, 06, 07 |
| UC-05 S-1.2 (Ditahan), S-1.3/S-1.4 (ajukan ulang menjadi Terkirim V2) | 08, 09 |
| UC-05 3a (Ditahan lalu Ditolak, pesan 3a.2) | 10, 11 |
| UC-01 langkah 3-10, S-2, 9a, S-1 | 12, 13, 14, 15, 16 |
| UC-02 langkah 3-8, 4a, 8a | 17, 18, 19, 20, 21 |
| UC-03 langkah 2-8, S-1, S-2 | 22, 23, 24, 25, 26, 27 |
| UC-04 langkah 3-7, S-1, label di J-03 | 28, 29, 30 |
| UC-07a (tanpa koreksi, Simpan Permanen) | 31, 34 |
| UC-07c (Draf, dimuat ulang) | 32, 33, 38 |
| UC-07b / UC-08 (koreksi, S-1 alasan kosong, 4a) | 35, 36, 37, 39 |
| UC-09 S-1, S-2 | 40, 41 |
| NFR 3.1 (403 reviewer lain) | 42 |
| PanelPemandu di J-08 | 43 |
