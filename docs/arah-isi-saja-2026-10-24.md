# SEMAR hanya untuk ISI proposal (24 Okt 2026)

Koreksi Arsy: "halaman depan itu di contoh pdf itu auto tergenerate lewat bima pas pengusul ngisi sebagai formulir, yg
template itu cuma isi, lalu yg lampiran juga itu dari bima kaya download template upload lagi untuk si lampirannya, jadi
semar ini harusnya bener-bener untuk isinya saja, templatenya gausah ada lampiran sama yg halaman awal". Arsy juga memilih
naskah Isian Substansi tetap **diunggah di BIMA**, sehingga arsitektur opsi B tetap berlaku.

Keputusan ini **membatalkan** `docs/arah-uc05-2026-10-24.md`; cabang `uc05-semar` tidak digabung. Bagian 3 ("kop, bagian
depan, dan templat lampiran") di `docs/arah-uc01-2026-10-23.md` juga dibatalkan.

## Pembagian tugas

**BIMA** (tiruan di prototipe):
- formulir pengusul (identitas, luaran, anggaran, dll.);
- halaman depan proposal, dibangkitkan otomatis dari formulir;
- **lampiran beserta templat lampirannya**: unduh, isi, unggah;
- unggahan naskah Isian Substansi;
- arsip.

**SEMAR**:
- **templat Isian Substansi A–H** (UC-01);
- **aturan pemeriksaan isi** (UC-02);
- pemeriksaan deterministik isi (UC-06): naskah ditarik dari BIMA lewat API, seperti yang tayang sekarang;
- semantik (UC-09);
- penugasan (UC-03), penilaian reviewer (UC-07/08), dan pemantauan (UC-04).

## Yang diubah (cabang baru `isi-saja` dari `main`)

1. **Templat (UC-01, J-02/J-02a)**
   - Hapus tab **Lampiran** dan **Halaman Depan**, modal **M-13**, serta isian lampiran wajib dan sakelar halaman depan
     dari templat.
   - Templat hanya berisi kepala Isian Substansi dan bagian A–H beserta ketentuannya.
   - Kolom data yang tidak dipakai lagi dibiarkan di DB (aditif) tetapi tidak dipakai kode, dan dicatat di
     perubahan-model.
2. **Unduhan .docx**
   - Hanya **Isian Substansi**: kepala berlogo, SKEMA, pengantar, lalu bagian A–H berupa tabel berlatar biru muda. Tanpa
     halaman depan dan tanpa halaman lampiran.
   - Satu tombol saja, "Unduh Templat (.docx)". "Unduh Isian Substansi" digabung karena isinya sama.
   - Unduhan di BIMA tiruan juga hanya Isian Substansi.
3. **Aturan pemeriksaan**
   - Hapus butir lampiran (kelengkapan lampiran LMP-xx dan kalimat kunci lampiran FMT-xx) dari turunan templat, katalog
     seed, dan pilihan "Jenis Aturan" di formulir Tambah Butir.
   - Kelompok "Lampiran" di tab Aturan hilang. Yang tersisa: aturan per bagian A–H, bagian tambahan, dan Umum (mis. judul
     sama dengan BIMA).
4. **BIMA tiruan**
   - Daftar lampiran wajib dan templat lampirannya menjadi **milik BIMA**: konfigurasi atau seed di sisi BIMA per skema.
     Halaman pengajuan BIMA tiruan tetap meminta unggahan lampiran dan menyediakan "Unduh Templat Lampiran" (format surat
     pernyataan mitra dan surat keterangan mahasiswa yang sudah ada boleh dipindah ke sisi BIMA).
   - SEMAR **tidak memeriksa** lampiran.
   - Reviewer tetap bisa **melihat dan mengunduh** lampiran dari BIMA di J-08 (hanya baca), karena komponen borang J-08b
     (artikel ketua, surat mitra, surat mahasiswa) diputuskan reviewer.
   - J-06 tidak lagi menampilkan butir lampiran.
5. **Pemotong naskah:** tetap mengabaikan halaman depan dan identitas bila naskah berupa ekspor BIMA (sudah ada).
6. **Dokumen yang diperbarui**
   - `docs/keputusan.md`: pembagian BIMA/SEMAR di atas.
   - `docs/catatan-inkonsistensi.md`:
     - templat SEMAR hanya isi;
     - lampiran milik BIMA;
     - butir lampiran dihapus dari katalog naskah Tabel 5.5 (selaraskan Bab 5/7/10);
     - M-13 dan tab halaman depan dihapus.
   - `docs/peta-uc-jendela.md` dan `docs/kontrak-dan-spesifikasi-metode.md`: C-31/MS-10 hanya Isian Substansi;
     `cekLampiran` tidak dipakai SEMAR.

## Cara kerja

- **Tanpa unit test, lint, build, atau e2e** (aturan Arsy). `tsc --noEmit` boleh. Perbaiki tes yang jelas rusak karena
  perubahan ini tanpa menjalankan seluruh suite.
- Reset & seed demo sesudahnya, lalu commit lokal di cabang `isi-saja`.
