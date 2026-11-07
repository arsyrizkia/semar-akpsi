# Rencana uji SEMAR

Disusun otomatis oleh `npm run rencana-uji` pada 23 Oktober 2026 pukul 04.56 WIB dari berkas uji dan hasil terakhir (`npm run laporan-uji`, `npm run e2e`). Jangan disunting tangan; ubah komentar kepala atau judul uji pada berkasnya.

Gaya dan istilah mengikuti Dennis, Wixom, dan Tegarden (2015) hlm. 469-475: uji unit *black box* dan *white box*, uji integrasi, dan uji kinerja. Sumber rencana uji persis Gambar 12-4 (hlm. 472).

## 1. Pendekatan dan sumber rencana uji

| Tingkat | Pendekatan | Sumber rencana uji (Gambar 12-4) | Letak |
|---|---|---|---|
| Unit | *Black box* (KH-) | CRC Cards, *Class Diagrams*, *Contracts* (Gambar 8-22, hlm. 309); *behavioral state machine* untuk kasus keadaan (hlm. 473), selalu dicatat bersama CRC atau *class diagram* kelas pemiliknya | `tests/unit/kotak-hitam/` |
| Unit | *White box* (KP-) | *Method Specifications* (Gambar 8-26, hlm. 315): setiap cabang dan jalur metode yang kompleks | `tests/unit/kotak-putih/` |
| Integrasi | *Use-case testing* | *Real use case* dan *use scenario* (e2e per UC dan alur bolak-balik) | `e2e/jalankan.ts`; basis data: `tests/integrasi/` |
| Kinerja | *Stress/volume test* | Persyaratan kinerja (NFR 2.x) | KP-susunUsulanMurniSkala dan e2e skala nyata |

*Real use case* bukan sumber unit test. Kelas yang belum siap atau eksternal diganti *stub* (hlm. 471): klien BIMA dan Layanan LLM (`tests/unit/stub/`). Kontrak dan spesifikasi metode ada di `docs/kontrak-dan-spesifikasi-metode.md`.

Jenis kasus pada tiap baris mengikuti hlm. 473 (nilai sah; tidak sah di bawah atau di atas batas; tipe salah; nilai janggal tetapi mungkin sah; keadaan dan transisi; cabang). Kolom itu ditebak dari kata kunci judul uji, jadi bersifat petunjuk; kasus sebenarnya adalah isi tes.

## 2. Ringkasan

| Jenis | Jumlah uji | Lulus | Gagal | Dilewati |
|---|---:|---:|---:|---:|
| Unit *black box* (KH) | 272 | 272 | 0 | 0 |
| Unit *white box* (KP) | 174 | 174 | 0 | 0 |
| Integrasi basis data (IT) | 28 | 28 | 0 | 0 |
| Integrasi e2e (skenario) | 29 | 29 | 0 | 0 |


## 3. Uji unit *black box* (KH)

Setiap butir sumber menjadi satu uji dengan beberapa kasus. Setiap keadaan *state machine* diuji dapat dicapai, dan hanya transisi yang didefinisikan yang diizinkan.

#### `aturan-parameter.test.ts`

- **Unit yang diuji:** uraikanAturanHitung; validasiButir; validasiTanggalBerlaku (8a)
- **Sumber rencana uji:** Sumber: Contract C-06 ButirCek.aturParameter/ubahParameter (uraikanAturanHitung, validasiButir), Contract C-08 BasisAturan.validasiTanggalBerlaku (8a); CRC ButirCek dan BasisAturan.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-uraikanAturanHitung-01 | nilai sah | kata kunci tepat lima, dipisah titik koma | sesuai harapan (2 ms) | Lulus |
| KH-uraikanAturanHitung-02 | nilai sah | sitasi dan daftar pustaka | sesuai harapan (0 ms) | Lulus |
| KH-uraikanAturanHitung-03 | nilai sah | aturan yang butuh bagian | sesuai harapan (0 ms) | Lulus |
| KH-uraikanAturanHitung-04 | nilai tidak sah | aturan tak dikenali ditolak dengan petunjuk | sesuai harapan (0 ms) | Lulus |
| KH-validasiButir-01 | nilai tidak sah | menandai isian wajib yang kosong | sesuai harapan (0 ms) | Lulus |
| KH-validasiButir-02 | nilai sah | butir deterministik: parameter, pemeriksa, dan komponen diturunkan | sesuai harapan (0 ms) | Lulus |
| KH-validasiButir-03 | nilai sah | butir semantik wajib pertanyaan dan bagian; lampiran menentukan komponen | sesuai harapan (0 ms) | Lulus |
| KH-validasiButir-04 | nilai tidak sah | kode dengan karakter tidak sah ditolak | sesuai harapan (0 ms) | Lulus |
| KH-validasiButir-05 | nilai sah | ringkasan parameter | sesuai harapan (0 ms) | Lulus |
| KH-validasiTanggalBerlaku-01 | batas bawah / atas | menolak tanggal di antara buka dan tutup (batas ikut) bila masa pengusulan berjalan | sesuai harapan (1 ms) | Lulus |
| KH-validasiTanggalBerlaku-02 | nilai sah | menerima tanggal di luar rentang, atau bila masa pengusulan ditutup | sesuai harapan (0 ms) | Lulus |
| KH-validasiTanggalBerlaku-03 | nilai tidak sah | tanggal kosong atau tidak valid ditolak; harus lebih akhir dari versi sebelumnya | sesuai harapan (0 ms) | Lulus |
| KH-validasiTanggalBerlaku-04 | nilai sah | hari menurut WIB | sesuai harapan (0 ms) | Lulus |

#### `aturan-status.test.ts`

- **Unit yang diuji:** state machine ButirCek (CRC ButirCek; Contract C-07); penguncian butir turunan templat (Contract C-06 dan C-07 pra-kondisi; label pesan tetap dari docs/spesifikasi-ui.md)
- **Sumber rencana uji:** Sumber: CRC ButirCek, Contract C-06 (aturParameter/ubahParameter) dan C-07 (nonaktifkan), behavioral state machine butir (Draf, Aktif, Perlu ditinjau, Nonaktif; hlm. 473).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-statusButir-01 | nilai sah | Draf menjadi Aktif saat versi disimpan (simpanVersi) | sesuai harapan (1 ms) | Lulus |
| KH-statusButir-02 | nilai sah | Aktif menjadi Perlu ditinjau saat ditandai pemantauan, lalu kembali Aktif saat versi disimpan | sesuai harapan (0 ms) | Lulus |
| KH-statusButir-03 | nilai sah | butir manual Draf, Aktif, dan Perlu ditinjau dapat dinonaktifkan | sesuai harapan (0 ms) | Lulus |
| KH-statusButir-04 | keadaan dan transisi | Nonaktif adalah keadaan akhir: tidak ada aksi yang diizinkan | sesuai harapan (0 ms) | Lulus |
| KH-statusButir-05 | keadaan dan transisi | transisi lain yang tidak didefinisikan ditolak (Draf tidak dapat ditandai, Perlu ditinjau tidak dapat ditandai ulang) | sesuai harapan (0 ms) | Lulus |
| KH-statusButir-06 | keadaan dan transisi | tepat empat keadaan | sesuai harapan (0 ms) | Lulus |
| KH-butirTerkunci-01 | nilai sah | butir berasal dari templat terkunci, butir manual tidak | sesuai harapan (0 ms) | Lulus |
| KH-butirTerkunci-02 | nilai sah | pesan 4a persis seperti spesifikasi UI | sesuai harapan (0 ms) | Lulus |

#### `aturan-uji.test.ts`

- **Unit yang diuji:** susunBarisUji (laporan per butir per contoh); ringkasPerContoh
- **Sumber rencana uji:** Sumber: Contract C-10 (ujiPadaContoh: laporan per butir per contoh), Class Diagram: BasisAturan — ButirCek.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-susunBarisUji-01 | nilai sah | satu baris per butir, satu sel per contoh, urutan butir dipertahankan | sesuai harapan (1 ms) | Lulus |
| KH-susunBarisUji-02 | nilai sah | butir Nonaktif tidak ditampilkan | sesuai harapan (0 ms) | Lulus |
| KH-susunBarisUji-03 | batas bawah / atas | tanpa contoh atau tanpa butir menghasilkan daftar kosong (batas bawah) | sesuai harapan (0 ms) | Lulus |
| KH-susunBarisUji-04 | tipe salah / nilai janggal | butir tanpa satu pun hasil dilewati (nilai janggal: kode tidak dikenal) | sesuai harapan (0 ms) | Lulus |
| KH-ringkasPerContoh-01 | nilai tidak sah | menghitung Lolos, Gagal, dan rekomendasi semantik per contoh | sesuai harapan (0 ms) | Lulus |
| KH-ringkasPerContoh-02 | nilai tidak sah | tanpa contoh menghasilkan daftar kosong; contoh tanpa hasil menghasilkan nol | sesuai harapan (0 ms) | Lulus |

#### `deterministik-batas.test.ts`

- **Unit yang diuji:** hitungKata (Contract C-16, MS-02); cekKataKunci (Contract C-17, MS-13); cocokkanSitasi (Contract C-18, MS-03); cekLampiran (Contract C-19); cocokkanStrukturJudul (Contract C-20); cekMasaPengusulan (Contract C-11); state machine status Proposal (CRC Proposal; Contract C-22); token pengajuan (CRC Proposal; satu token satu pengajuan)
- **Sumber rencana uji:** Uji kotak hitam UC-05 dan UC-06 (Dennis dkk., 2015, hlm. 471-475): diturunkan dari Contract C-11, C-16..C-22 dan state machine status Proposal (docs/kontrak-dan-spesifikasi-metode.md), tanpa melihat isi metode. Kasus: nilai sah, batas bawah/atas, tipe salah, nilai janggal.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-hitungKata-04 | nilai tidak sah | teks kosong dan hanya spasi menghasilkan 0 kata | sesuai harapan (1 ms) | Lulus |
| KH-hitungKata-05 | batas bawah / atas | batas tepat lolos, satu di atas gagal, satu di bawah lolos (batas 100) | sesuai harapan (1 ms) | Lulus |
| KH-hitungKata-06 | nilai sah | tabel dan gambar dalam bentuk penanda atau keterangan tidak dihitung | sesuai harapan (0 ms) | Lulus |
| KH-hitungKata-07 | nilai tidak sah | spasi ganda, tab, dan baris kosong tidak menambah hitungan | sesuai harapan (0 ms) | Lulus |
| KH-hitungKata-08 | nilai sah | bagian yang tidak ditemukan dihitung 0 kata dan lolos dengan catatan | sesuai harapan (0 ms) | Lulus |
| KH-hitungKata-09 | nilai sah | kata berangka dan tanda baca tetap satu kata per token | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-05 | batas bawah / atas | empat kata kunci gagal (satu di bawah) dengan angka pembukti | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-06 | nilai sah | lima kata kunci lolos | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-07 | batas bawah / atas | enam kata kunci gagal (satu di atas) dan batas dilanggar menyebut 6 | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-08 | nilai tidak sah | pemisah salah (garis tegak) terbaca satu kata kunci dan gagal | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-09 | tipe salah / nilai janggal | hanya spasi atau null dianggap tidak ditemukan | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-10 | tipe salah / nilai janggal | pemisah berlebih di ujung dan segmen kosong tidak dihitung (nilai janggal tetapi sah) | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-11 | nilai sah | jumlah diminta lain (tiga, pemisah koma) mengikuti parameter butir | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-07 | nilai sah | sitasi bernomor saja lolos | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-08 | nilai tidak sah | naskah tanpa satu pun sitasi bernomor gagal | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-09 | nilai sah | nama-tahun dengan 'dkk.' dan 'et al.' terdeteksi | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-10 | nilai tidak sah | jumlah entri sama dengan jumlah nomor dikutip lolos; entri tidak dikutip gagal | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-11 | nilai tidak sah | Daftar Pustaka kosong gagal pada jumlah_referensi_sama dan pustaka_berurutan | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-12 | nilai sah | entri pustaka berformat '1.' dan '1)' dikenali, baris lanjutan digabung | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiran-01 | nilai tidak sah | lampiran ada lolos tanpa membedakan huruf besar dan spasi ganda | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiran-02 | nilai tidak sah | tanpa lampiran terunggah gagal dan menyebut 0 dari 2 | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiran-03 | nilai tidak sah | daftar lampiran wajib templat kosong memakai nama butir sebagai satu-satunya wajib | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiran-04 | nilai sah | lampiran yang diunggah bernama lain tidak memenuhi | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanStrukturJudul-01 | nilai tidak sah | bagian_wajib ada lolos, tidak ada gagal dengan nama bagian | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanStrukturJudul-02 | nilai tidak sah | judul naskah kosong gagal pada judul_sama | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanStrukturJudul-03 | nilai tidak sah | struktur sama persis lolos; judul di luar templat dicatat tetapi tidak menggagalkan | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanStrukturJudul-04 | nilai sah | bagian opsional yang tidak ada tidak mengurangi bagian wajib | sesuai harapan (0 ms) | Lulus |
| KH-cekMasaPengusulan-01 | nilai sah | di tengah masa dengan sakelar berjalan | sesuai harapan (0 ms) | Lulus |
| KH-cekMasaPengusulan-02 | batas bawah / atas | tepat pada tanggal tutup masih berjalan (inklusif) | sesuai harapan (0 ms) | Lulus |
| KH-cekMasaPengusulan-03 | nilai sah | satu milidetik sesudah tanggal tutup ditutup | sesuai harapan (0 ms) | Lulus |
| KH-cekMasaPengusulan-04 | batas bawah / atas | tepat pada tanggal buka berjalan, satu milidetik sebelumnya belum | sesuai harapan (0 ms) | Lulus |
| KH-cekMasaPengusulan-05 | nilai sah | sakelar ditutup menang walau tanggal di dalam rentang | sesuai harapan (0 ms) | Lulus |
| KH-cekMasaPengusulan-06 | nilai tidak sah | tanggal tidak sah (Invalid Date) tidak pernah dianggap berjalan | sesuai harapan (0 ms) | Lulus |
| KH-statusProposal-01 | keadaan dan transisi | semua transisi yang didefinisikan menghasilkan status berikutnya yang benar | sesuai harapan (0 ms) | Lulus |
| KH-statusProposal-02 | keadaan dan transisi | Terkirim adalah keadaan akhir, semua peristiwa ditolak | sesuai harapan (1 ms) | Lulus |
| KH-statusProposal-03 | keadaan dan transisi | transisi yang tidak didefinisikan ditolak (Ditahan tidak bisa langsung Terkirim) | sesuai harapan (0 ms) | Lulus |
| KH-statusProposal-04 | nilai tidak sah | statusSetelahPemeriksaan: 0 gagal Terkirim, 1 gagal Ditahan | sesuai harapan (0 ms) | Lulus |
| KH-statusProposal-05 | tipe salah / nilai janggal | jumlah gagal negatif atau pecahan ditolak (tipe salah) | sesuai harapan (0 ms) | Lulus |
| KH-tokenPengajuan-02 | nilai sah | dua token untuk proposal yang sama memiliki jti berbeda | sesuai harapan (5 ms) | Lulus |
| KH-tokenPengajuan-03 | nilai sah | hanya entri audit pertama untuk sebuah jti yang diterima, sisanya duplikat | sesuai harapan (0 ms) | Lulus |
| KH-tokenPengajuan-04 | tipe salah / nilai janggal | tidak ada entri pembanding (null atau undefined) tidak pernah dianggap pertama | sesuai harapan (0 ms) | Lulus |
| KH-tokenPengajuan-05 | nilai tidak sah | token berstring kosong, bertanda tangan kunci lain, atau tanpa klaim wajib ditolak | sesuai harapan (0 ms) | Lulus |
| KH-tokenPengajuan-06 | nilai tidak sah | token dengan audiens lain ditolak | sesuai harapan (0 ms) | Lulus |

#### `deterministik-pemeriksa.test.ts`

- **Unit yang diuji:** UC-06 pada tiga proposal contoh; hitungKata; cekKataKunci; cocokkanSitasi; cekLampiran dan struktur judul
- **Sumber rencana uji:** Sumber: Contract C-16 hitungKata, C-17 cekKataKunci, C-18 cocokkanSitasi, C-19 cekLampiran, C-20 cocokkanStrukturJudul; CRC ButirCek.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-periksaDeterministikTeks-01 | nilai sah | contoh A: semua butir deterministik lolos | sesuai harapan (4 ms) | Lulus |
| KH-periksaDeterministikTeks-02 | nilai tidak sah | contoh B: hanya jumlah kata bagian Metode yang gagal, dengan angka pembukti | sesuai harapan (2 ms) | Lulus |
| KH-periksaDeterministikTeks-03 | nilai tidak sah | contoh C: kata kunci (4 dari 5) dan jumlah referensi (9 entri, 7 dikutip) gagal | sesuai harapan (1 ms) | Lulus |
| KH-periksaDeterministikTeks-04 | nilai sah | butir nonaktif/semantik tidak ikut dalam hasil murni | sesuai harapan (1 ms) | Lulus |
| KH-hitungKata-01 | nilai sah | tidak menghitung tabel, gambar, dan keterangannya | sesuai harapan (0 ms) | Lulus |
| KH-hitungKata-02 | nilai tidak sah | selaras dengan penghitung pembangkit contoh bila tanpa keterangan | sesuai harapan (0 ms) | Lulus |
| KH-hitungKata-03 | batas bawah / atas | tanpa toleransi: tepat pada batas lolos, satu lebih gagal | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-01 | nilai sah | tepat lima dipisah titik koma, boleh frasa | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-02 | nilai tidak sah | enam gagal | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-03 | nilai sah | dipisah koma dikenali sebagai pemisah salah | sesuai harapan (0 ms) | Lulus |
| KH-cekKataKunci-04 | nilai tidak sah | kosong gagal | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-01 | nilai tidak sah | sitasi gaya nama-tahun gagal | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-02 | nilai sah | rentang dan daftar nomor diperluas | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-03 | nilai tidak sah | urutan pengutipan pertama yang melompat gagal | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-04 | nilai tidak sah | nomor entri daftar pustaka loncat gagal | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-05 | nilai tidak sah | nomor dikutip tanpa entri dilaporkan | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanSitasi-06 | nilai tidak sah | tanpa Daftar Pustaka gagal | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiranStruktur-01 | nilai sah | lampiran belum ada disebut dengan nama | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiranStruktur-02 | nilai sah | judul bagian berhuruf Isian Substansi (A. JUDUL ... H. DAFTAR PUSTAKA) dikenali | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiranStruktur-03 | nilai tidak sah | bagian hilang dan urutan salah gagal | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiranStruktur-04 | nilai tidak sah | judul beda dari BIMA gagal, perbedaan huruf besar dan tanda baca lolos | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiranStruktur-05 | nilai sah | diagram alir butuh keterangan gambar yang menyebutnya | sesuai harapan (0 ms) | Lulus |
| KH-cekLampiranStruktur-06 | nilai tidak sah | butir tanpa parameter gagal tertutup | sesuai harapan (0 ms) | Lulus |

#### `fondasi.test.ts`

- **Unit yang diuji:** tingkat keyakinan (ambang contoh); sesi dan token; proposal contoh; turunan butir dari templat
- **Sumber rencana uji:** Sumber: Contract C-03 TemplatProposal.turunkanButirCek (turunkanButirDariTemplat), Contract C-25 (ambang keyakinan butir semantik), CRC Penilaian/VersiProposal untuk pembangkit contoh; sesi SSO menurut docs/KONTRAK.md (tambahan prototipe).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-tingkatKeyakinan-01 | nilai sah | memetakan ambang 0,8 dan 0,5 | sesuai harapan (1 ms) | Lulus |
| KH-sesiToken-01 | nilai sah | token SSO dan sesi memiliki audiens berbeda | sesuai harapan (4 ms) | Lulus |
| KH-sesiToken-02 | nilai sah | jalurAman menolak open redirect | sesuai harapan (0 ms) | Lulus |
| KH-proposalContoh-01 | batas bawah / atas | a dan d lolos semua batas kata, kata kunci tepat lima | sesuai harapan (1 ms) | Lulus |
| KH-proposalContoh-02 | nilai tidak sah | b gagal jumlah kata hanya di Metode | sesuai harapan (0 ms) | Lulus |
| KH-proposalContoh-03 | nilai tidak sah | c gagal kata kunci (4) dan sitasi (9 referensi, 7 dikutip) | sesuai harapan (0 ms) | Lulus |
| KH-proposalContoh-04 | nilai sah | DOCX terbentuk | sesuai harapan (33 ms) | Lulus |
| KH-turunkanButir-01 | batas bawah / atas | membuat butir bagian wajib, batas kata, dan lampiran | sesuai harapan (0 ms) | Lulus |

#### `menu-peran.test.ts`

- **Unit yang diuji:** menuUntukPeran; itemAktif
- **Sumber rencana uji:** Sumber: Class Diagram Akun (peran Tim Kerja, Reviewer, Pengusul) dan NFR 5.1; menu sidebar per peran (tambahan prototipe).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-menuUntukPeran-01 | nilai sah | Tim Kerja pengelola melihat empat menu berurutan | sesuai harapan (1 ms) | Lulus |
| KH-menuUntukPeran-02 | nilai sah | Tim Kerja non-pengelola hanya Penugasan dan Pemantauan | sesuai harapan (0 ms) | Lulus |
| KH-menuUntukPeran-03 | nilai sah | reviewer hanya Daftar Penugasan | sesuai harapan (0 ms) | Lulus |
| KH-menuUntukPeran-04 | nilai tidak sah | pengusul tanpa menu | sesuai harapan (0 ms) | Lulus |
| KH-itemAktif-01 | nilai sah | jalur layar dan layar turunannya menandai menu induk | sesuai harapan (0 ms) | Lulus |
| KH-itemAktif-02 | nilai sah | J-05b (rincian proposal) menandai Pemantauan Kesesuaian | sesuai harapan (0 ms) | Lulus |
| KH-itemAktif-03 | nilai sah | awalan serupa tetapi bukan segmen yang sama tidak cocok; jalur asing tidak menandai apa pun | sesuai harapan (0 ms) | Lulus |

#### `pemantauan-rekap.test.ts`

- **Unit yang diuji:** rekapKesesuaian (UC-04); formatPersen; rekapKesesuaian: batas dan urutan (Contract C-29)
- **Sumber rencana uji:** Sumber: Contract C-29 BasisAturan.rekapKesesuaian / ButirCek.hitungTingkatKoreksi, CRC BasisAturan.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-rekapKesesuaian-01 | nilai tidak sah | menghitung tabel silang gagal per butir dan institusi, urut terbanyak | sesuai harapan (8 ms) | Lulus |
| KH-rekapKesesuaian-02 | nilai tidak sah | % disetujui = hasil tanpa koreksi dibagi semua hasil pada penilaian final | sesuai harapan (0 ms) | Lulus |
| KH-rekapKesesuaian-03 | nilai sah | mengurutkan butir koreksi tertinggi dan menyertakan alasan serta jenis kekeliruan | sesuai harapan (0 ms) | Lulus |
| KH-rekapKesesuaian-04 | nilai tidak sah | butir tanpa koreksi tidak masuk daftar koreksi tertinggi | sesuai harapan (0 ms) | Lulus |
| KH-rekapKesesuaian-05 | nilai sah | rincian butir (S-1) memuat contoh, mendahulukan yang dikoreksi | sesuai harapan (0 ms) | Lulus |
| KH-rekapKesesuaian-06 | nilai tidak sah | laporan kosong tidak error | sesuai harapan (0 ms) | Lulus |
| KH-formatPersen-01 | nilai sah | memakai koma desimal | sesuai harapan (0 ms) | Lulus |
| KH-rekapKesesuaian-07 | batas bawah / atas | tanpa koreksi = 100% disetujui; semua dikoreksi = 0% (batas atas dan bawah) | sesuai harapan (0 ms) | Lulus |
| KH-rekapKesesuaian-08 | nilai sah | kesesuaian diurutkan dari persen disetujui terendah | sesuai harapan (0 ms) | Lulus |
| KH-hitungTingkatKoreksi-01 | nilai sah | tingkat koreksi = koreksi / hasil pada penilaian final per butir | sesuai harapan (0 ms) | Lulus |
| KH-hitungTingkatKoreksi-02 | nilai sah | tingkat koreksi sama diurutkan menurut jumlah koreksi lalu kode | sesuai harapan (0 ms) | Lulus |
| KH-rekapKesesuaian-09 | nilai sah | rincian menyertakan id proposal untuk tautan ke J-05b | sesuai harapan (0 ms) | Lulus |

#### `pemantauan-rincian-proposal.test.ts`

- **Unit yang diuji:** ringkasHasil; urutkanHasil; statusPenilaian
- **Sumber rencana uji:** Sumber: CRC VersiProposal / HasilPemeriksaan, Class Diagram: Proposal 1 - 0..* PenugasanReviewer 1 - 0..1 Penilaian, J-05b Rincian Proposal (ringkasan hasil, urutan tampil, status penilaian).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-ringkasHasil-01 | nilai tidak sah | daftar kosong menghasilkan semua hitungan nol | sesuai harapan (1 ms) | Lulus |
| KH-ringkasHasil-02 | nilai sah | menghitung deterministik dan semantik terpisah | sesuai harapan (0 ms) | Lulus |
| KH-ringkasHasil-03 | tipe salah / nilai janggal | status tak dikenal (nilai janggal) hanya menambah jumlah total | sesuai harapan (0 ms) | Lulus |
| KH-urutkanHasil-01 | nilai tidak sah | Gagal/Tidak memenuhi di atas, lalu perlu manual, belum ada, lalu lolos; seri menurut kode | sesuai harapan (7 ms) | Lulus |
| KH-urutkanHasil-02 | nilai sah | tidak mengubah larik masukan | sesuai harapan (0 ms) | Lulus |
| KH-statusPenilaian-01 | nilai sah | penugasan masih Diusulkan = Belum ditetapkan, apa pun penilaiannya | sesuai harapan (0 ms) | Lulus |
| KH-statusPenilaian-02 | nilai tidak sah | ditetapkan tanpa baris penilaian = Belum dimulai | sesuai harapan (0 ms) | Lulus |
| KH-statusPenilaian-03 | nilai sah | penilaian Draf dan Final diteruskan | sesuai harapan (0 ms) | Lulus |

#### `pemantauan-status-butir.test.ts`

- **Unit yang diuji:** tandaiPerluDitinjau (C-30)
- **Sumber rencana uji:** Sumber: Contract C-30 BasisAturan.tandaiButir / ButirCek.tandaiPerluDitinjau, state machine ButirCek (Draf -> Aktif -> Perlu ditinjau -> Nonaktif), CRC ButirCek.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-tandaiPerluDitinjau-01 | nilai sah | butir Aktif menjadi Perlu ditinjau | sesuai harapan (1 ms) | Lulus |
| KH-tandaiPerluDitinjau-02 | nilai sah | butir Draf tidak berubah (belum dipakai pemeriksa) | sesuai harapan (0 ms) | Lulus |
| KH-tandaiPerluDitinjau-03 | nilai sah | butir Nonaktif tidak dihidupkan kembali oleh penandaan | sesuai harapan (0 ms) | Lulus |
| KH-tandaiPerluDitinjau-04 | nilai sah | menandai butir yang sudah Perlu ditinjau idempoten | sesuai harapan (0 ms) | Lulus |
| KH-tandaiPerluDitinjau-05 | tipe salah / nilai janggal | status tak dikenal (tipe salah) dikembalikan apa adanya | sesuai harapan (0 ms) | Lulus |

#### `pengajuan-ekstraksi.test.ts`

- **Unit yang diuji:** UC-05 ekstraksi dan pemotongan DOCX; token pengajuan
- **Sumber rencana uji:** Sumber: Contract C-21 TemplatProposal.potongPerBagian dan C-16 sampai C-20 atas naskah DOCX/PDF contoh; CRC VersiProposal.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-potongTeks-01 | nilai sah | memotong naskah contoh menjadi delapan bagian bertemplat (A-H) dengan judul dan kata kunci | sesuai harapan (65 ms) | Lulus |
| KH-potongTeks-02 | nilai sah | A lolos semua; B hanya KTA-04; C hanya KAT-01 dan SIT-03 (hasil sama dengan jalur murni) | sesuai harapan (84 ms) | Lulus |
| KH-potongTeks-03 | nilai tidak sah | lampiran yang tidak diunggah membuat butir lampiran gagal | sesuai harapan (24 ms) | Lulus |
| KH-potongTeks-04 | nilai sah | tabel dan gambar dibuang dari hitungan: HTML dengan tabel dan gambar | sesuai harapan (0 ms) | Lulus |
| KH-potongTeks-05 | nilai sah | judul tingkat 1 di luar templat mengakhiri bagian dan tercatat | sesuai harapan (0 ms) | Lulus |
| KH-tokenPengajuan-01 | nilai tidak sah | membawa idProposal dan identitas pengusul; token rusak ditolak | sesuai harapan (4 ms) | Lulus |

#### `pengajuan-katalog-demo.test.ts`

- **Unit yang diuji:** jendelaDariJalur; alamat Pindah layar dan Pasang skenario
- **Sumber rencana uji:** Uji kotak hitam katalog Navigator demo (CRC NavigatorDemo; pemisahan "Pindah layar" dan "Pasang skenario"): pencocokan alamat ke layar.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-jendelaDariJalur-01 | nilai sah | layar induk dan layar turunan dibedakan | sesuai harapan (1 ms) | Lulus |
| KH-jendelaDariJalur-02 | nilai sah | layar lain dikenali, alamat tak dikenal tidak cocok dengan jendela mana pun | sesuai harapan (0 ms) | Lulus |
| KH-alamatDemo-01 | nilai sah | pindah layar memakai /demo/pindah, pasang skenario memakai /demo/mulai | sesuai harapan (0 ms) | Lulus |
| KH-alamatDemo-02 | nilai sah | setiap layar punya alamat pindah, kode unik, dan layar turunan menyebut induk yang ada | sesuai harapan (1 ms) | Lulus |
| KH-alamatDemo-03 | nilai sah | skenario layar turunan dikenal (siap dipasang lewat /demo/mulai) | sesuai harapan (0 ms) | Lulus |

#### `penilaian-status.test.ts`

- **Unit yang diuji:** State machine Penilaian: Draf -> Final (C-27, C-28); ringkasKeputusan: enam komponen borang (C-27, UC-07 langkah 9); ringkasRekomendasi: butir tanpa koreksi dianggap disetujui (UC-07/UC-08); ringkasLabelPenugasan: keterangan J-07 (label Baru, Draf, Selesai)
- **Sumber rencana uji:** Sumber rencana uji: Behavioral State Machine Penilaian (Draf -> Final) bersama CRC Penilaian (hlm. 473: setiap keadaan dapat dicapai, hanya transisi yang didefinisikan yang diizinkan), Contract C-27 Penilaian.simpanNilai dan C-28 Penilaian.terima / PenugasanReviewer.tandaiSelesai.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-penilaianStatus-01 | nilai sah | Draf dapat tetap Draf (Simpan Sementara) dan dapat menjadi Final (Simpan Permanen) | sesuai harapan (1 ms) | Lulus |
| KH-penilaianStatus-02 | keadaan dan transisi | Final tidak dapat diubah ke keadaan mana pun, termasuk kembali ke Draf | sesuai harapan (0 ms) | Lulus |
| KH-penilaianStatus-03 | nilai sah | isian (komponen, umpan balik, koreksi) hanya dapat diubah saat Draf | sesuai harapan (0 ms) | Lulus |
| KH-penilaianStatus-04 | tipe salah / nilai janggal | nilai janggal (keadaan tidak dikenal) tidak pernah diizinkan bertransisi atau diubah | sesuai harapan (0 ms) | Lulus |
| KH-ringkasKeputusan-01 | nilai sah | nilai sah, keenam komponen Memenuhi | sesuai harapan (0 ms) | Lulus |
| KH-ringkasKeputusan-02 | batas bawah / atas | batas bawah, tidak ada komponen terisi: keenamnya kosong dan tidak lengkap | sesuai harapan (0 ms) | Lulus |
| KH-ringkasKeputusan-03 | batas bawah / atas | batas atas, lima dari enam terisi: tepat satu komponen kosong menurut urutan borang | sesuai harapan (0 ms) | Lulus |
| KH-ringkasKeputusan-04 | tipe salah / nilai janggal | tipe salah dan nilai janggal (teks bebas, kosong, huruf kecil) dihitung kosong, bukan Memenuhi | sesuai harapan (0 ms) | Lulus |
| KH-ringkasKeputusan-05 | nilai sah | campuran Memenuhi dan Tidak memenuhi dijumlahkan benar | sesuai harapan (0 ms) | Lulus |
| KH-ringkasRekomendasi-01 | nilai tidak sah | tanpa butir semua nol | sesuai harapan (0 ms) | Lulus |
| KH-ringkasRekomendasi-02 | nilai tidak sah | tiga golongan dipisahkan: disetujui, dikoreksi, dan tanpa rekomendasi | sesuai harapan (0 ms) | Lulus |
| KH-ringkasRekomendasi-03 | nilai tidak sah | butir tanpa rekomendasi yang sudah dikoreksi dihitung dikoreksi, bukan tanpa rekomendasi | sesuai harapan (0 ms) | Lulus |
| KH-ringkasLabelPenugasan-01 | nilai tidak sah | daftar kosong | sesuai harapan (0 ms) | Lulus |
| KH-ringkasLabelPenugasan-02 | nilai sah | rincian per label dalam urutan Baru, Draf, Selesai; label yang tidak ada dihilangkan | sesuai harapan (0 ms) | Lulus |

#### `penilaian-validasi.test.ts`

- **Unit yang diuji:** validasiKoreksi (UC-08 S-1); jenis kekeliruan opsional (Bab 10); validasiKoreksi: batas dan nilai janggal (Contract C-26 KoreksiRekomendasi.simpanKoreksi); komponen borang
- **Sumber rencana uji:** Sumber: Contract C-26 KoreksiRekomendasi.simpanKoreksi dan C-27 Penilaian.simpanNilai; CRC KoreksiRekomendasi dan Penilaian.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-validasiKoreksi-01 | nilai tidak sah | alasan kosong atau spasi ditolak dengan pesan baku | sesuai harapan (1 ms) | Lulus |
| KH-validasiKoreksi-02 | nilai sah | masukan lengkap valid | sesuai harapan (0 ms) | Lulus |
| KH-validasiKoreksi-03 | nilai tidak sah | keputusan dan jenis di luar daftar ditolak | sesuai harapan (0 ms) | Lulus |
| KH-validasiKoreksi-04 | nilai tidak sah | kosong diterima; hanya alasan yang wajib | sesuai harapan (0 ms) | Lulus |
| KH-validasiKoreksi-05 | batas bawah / atas | batas bawah, alasan satu karakter sah | sesuai harapan (0 ms) | Lulus |
| KH-validasiKoreksi-06 | batas bawah / atas | alasan kosong, tab, dan baris baru saja ditolak (batas bawah tidak sah) | sesuai harapan (0 ms) | Lulus |
| KH-validasiKoreksi-07 | batas bawah / atas | alasan sangat panjang (batas atas tidak dibatasi kontrak) tetap sah | sesuai harapan (0 ms) | Lulus |
| KH-validasiKoreksi-08 | tipe salah / nilai janggal | tipe salah (undefined/null pada alasan, keputusan kosong) ditolak tanpa melempar galat | sesuai harapan (0 ms) | Lulus |
| KH-validasiKoreksi-09 | tipe salah / nilai janggal | nilai janggal tetapi mungkin sah: alasan berisi hanya tanda baca atau angka diterima | sesuai harapan (0 ms) | Lulus |
| KH-validasiKoreksi-10 | nilai sah | huruf besar-kecil keputusan dibedakan; hanya dua nilai baku diterima | sesuai harapan (0 ms) | Lulus |
| KH-komponenBorang-01 | nilai sah | hanya komponen baku dengan keputusan sah | sesuai harapan (0 ms) | Lulus |
| KH-komponenBorang-02 | nilai sah | lengkap bila keenam komponen terisi | sesuai harapan (0 ms) | Lulus |

#### `penugasan-periode.test.ts`

- **Unit yang diuji:** periodeDitutup (C-11); ringkasStatusPenetapan (J-04); penomoran halaman (pilihan di URL)
- **Sumber rencana uji:** Sumber: Contract C-11 PeriodeSeleksi.cekMasaPengusulan, CRC PeriodeSeleksi, Class Diagram PeriodeSeleksi 1 - 0..* Proposal; ringkasan J-04 (UC-03 langkah 1).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-periodeDitutup-01 | batas bawah / atas | tepat pada tanggal tutup dan sakelar ditutup = ditutup (batas sah) | sesuai harapan (1 ms) | Lulus |
| KH-periodeDitutup-02 | batas bawah / atas | satu detik sebelum tanggal tutup = belum ditutup (batas bawah tidak sah) | sesuai harapan (0 ms) | Lulus |
| KH-periodeDitutup-03 | nilai sah | satu detik sesudah tanggal tutup = ditutup | sesuai harapan (0 ms) | Lulus |
| KH-periodeDitutup-04 | nilai sah | sakelar masa pengusulan berjalan menang walau tanggal sudah lewat (penentu tunggal) | sesuai harapan (0 ms) | Lulus |
| KH-ringkasStatusPenetapan-01 | nilai tidak sah | tanpa proposal Terkirim | sesuai harapan (0 ms) | Lulus |
| KH-ringkasStatusPenetapan-02 | nilai sah | ada proposal tetapi belum ada usulan maupun penetapan | sesuai harapan (0 ms) | Lulus |
| KH-ringkasStatusPenetapan-03 | nilai sah | usulan sudah disusun, belum ditetapkan | sesuai harapan (0 ms) | Lulus |
| KH-ringkasStatusPenetapan-04 | nilai sah | sebagian ditetapkan, sisanya belum punya usulan | sesuai harapan (0 ms) | Lulus |
| KH-ringkasStatusPenetapan-05 | nilai sah | seluruh proposal sudah punya penugasan tetap | sesuai harapan (0 ms) | Lulus |
| KH-halamanDariUrl-01 | nilai sah | nilai sah dipakai apa adanya | sesuai harapan (0 ms) | Lulus |
| KH-halamanDariUrl-02 | tipe salah / nilai janggal | nol, negatif, dan bukan angka menjadi halaman 1 | sesuai harapan (0 ms) | Lulus |
| KH-halamanDariUrl-03 | nilai sah | melampaui jumlah halaman dijepit ke halaman terakhir | sesuai harapan (0 ms) | Lulus |
| KH-halamanDariUrl-04 | nilai sah | parameter berulang memakai nilai pertama; jumlah halaman 0 tetap halaman 1 | sesuai harapan (0 ms) | Lulus |
| KH-jumlahHalaman-01 | nilai tidak sah | pembulatan ke atas, kosong = 1 halaman, ukuran tidak sah = 1 | sesuai harapan (0 ms) | Lulus |

#### `penugasan-pilih-reviewer.test.ts`

- **Unit yang diuji:** periksaSyarat (S-2.2); periksaSyarat: batas dan nilai janggal (Contract C-14)
- **Sumber rencana uji:** Sumber: Contract C-14 PenugasanReviewer.pilihReviewer (pra/pascakondisi), CRC PenugasanReviewer, Class Diagram: PenugasanReviewer 0..* - 1 Reviewer.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-periksaSyarat-01 | batas bawah / atas | meloloskan reviewer beda institusi dengan beban di bawah batas | sesuai harapan (1 ms) | Lulus |
| KH-periksaSyarat-02 | nilai sah | menolak institusi sama | sesuai harapan (0 ms) | Lulus |
| KH-periksaSyarat-03 | batas bawah / atas | menolak beban melampaui batas | sesuai harapan (0 ms) | Lulus |
| KH-periksaSyarat-04 | nilai sah | melaporkan semua syarat yang dilanggar | sesuai harapan (0 ms) | Lulus |
| KH-periksaSyarat-05 | batas bawah / atas | beban tepat satu di bawah batas masih sah (batas bawah sah) | sesuai harapan (0 ms) | Lulus |
| KH-periksaSyarat-06 | batas bawah / atas | beban tepat pada batas ditolak karena pemindahan menambah satu (batas atas tidak sah) | sesuai harapan (0 ms) | Lulus |
| KH-periksaSyarat-07 | nilai tidak sah | reviewer yang tidak bersedia ditolak walau institusi dan beban sah | sesuai harapan (0 ms) | Lulus |
| KH-periksaSyarat-08 | tipe salah / nilai janggal | institusi dibandingkan tanpa peduli huruf besar dan spasi tepi (nilai janggal tetapi sama) | sesuai harapan (0 ms) | Lulus |
| KH-periksaSyarat-09 | tipe salah / nilai janggal | batas 0 (janggal) menolak semua pemindahan | sesuai harapan (0 ms) | Lulus |

#### `penugasan-status.test.ts`

- **Unit yang diuji:** state machine PenugasanReviewer
- **Sumber rencana uji:** Sumber: state machine PenugasanReviewer (Diusulkan -> Ditetapkan -> Selesai), CRC PenugasanReviewer, Contract C-15 PenugasanReviewer.tetapkan (prakondisi status Diusulkan).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-StatusPenugasan-01 | nilai sah | Diusulkan -> Ditetapkan diizinkan | sesuai harapan (1 ms) | Lulus |
| KH-StatusPenugasan-02 | nilai sah | Ditetapkan -> Selesai diizinkan | sesuai harapan (0 ms) | Lulus |
| KH-StatusPenugasan-03 | nilai tidak sah | melompat Diusulkan -> Selesai ditolak | sesuai harapan (0 ms) | Lulus |
| KH-StatusPenugasan-04 | nilai tidak sah | mundur (Ditetapkan -> Diusulkan, Selesai -> Ditetapkan) ditolak | sesuai harapan (0 ms) | Lulus |
| KH-StatusPenugasan-05 | keadaan dan transisi | Selesai adalah keadaan akhir tanpa transisi keluar | sesuai harapan (0 ms) | Lulus |
| KH-StatusPenugasan-06 | keadaan dan transisi | transisi ke keadaan yang sama ditolak | sesuai harapan (0 ms) | Lulus |
| KH-StatusPenugasan-07 | tipe salah / nilai janggal | keadaan tak dikenal (tipe salah) ditolak tanpa galat tak terduga | sesuai harapan (0 ms) | Lulus |
| KH-StatusPenugasan-08 | keadaan dan transisi | setiap keadaan dapat dicapai dari Diusulkan lewat transisi sah berurutan | sesuai harapan (0 ms) | Lulus |
| KH-StatusPenugasan-09 | nilai sah | hanya usulan (Diusulkan) yang boleh dipindahkan (S-2) | sesuai harapan (0 ms) | Lulus |

#### `semantik-kutipan.test.ts`

- **Unit yang diuji:** cocokkanKutipan; cocokkanKutipan: normalisasi tanda kutip (Contract C-24 ButirCek.cocokkanKutipan); siapkanTeksTanpaIdentitas: nilai sah dan janggal (Contract C-23 VersiProposal.siapkanTeksTanpaIdentitas)
- **Sumber rencana uji:** Sumber: Contract C-24 ButirCek.cocokkanKutipan dan Contract C-23 VersiProposal.siapkanTeksTanpaIdentitas; CRC ButirCek dan VersiProposal.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-cocokkanKutipan-01 | nilai sah | abaikan perbedaan spasi dan baris baru, tetapi persis pada kata | sesuai harapan (1 ms) | Lulus |
| KH-cocokkanKutipan-02 | nilai sah | mengembalikan rentang di teks asli | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanKutipan-03 | tipe salah / nilai janggal | karakter regex dalam kutipan tidak merusak pencarian | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanKutipan-04 | nilai sah | tanda kutip lengkung di teks cocok dengan tanda kutip lurus dari LLM, dan sebaliknya | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanKutipan-05 | nilai sah | rentang yang dikembalikan menunjuk teks asli (tanda kutip lengkung tetap ada) | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanKutipan-06 | tipe salah / nilai janggal | batas bawah dan tipe salah: kosong, spasi saja, null, undefined tidak cocok | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanKutipan-07 | tipe salah / nilai janggal | nilai janggal: tanda kutip yang hilang atau beda jenis (apostrof vs kutip ganda) tidak cocok | sesuai harapan (0 ms) | Lulus |
| KH-cocokkanKutipan-08 | nilai sah | kutipan lebih panjang dari teks tidak cocok; kutipan sama persis dengan seluruh teks cocok | sesuai harapan (0 ms) | Lulus |
| KH-siapkanTeksTanpaIdentitas-01 | nilai sah | tidak membedakan huruf besar-kecil dan spasi ganda pada nama | sesuai harapan (0 ms) | Lulus |
| KH-siapkanTeksTanpaIdentitas-02 | tipe salah / nilai janggal | karakter regex pada nama institusi tidak merusak pencarian | sesuai harapan (0 ms) | Lulus |
| KH-siapkanTeksTanpaIdentitas-03 | batas bawah / atas | batas bawah, identitas dua huruf atau kosong tidak dibuang (agar teks tidak rusak) | sesuai harapan (0 ms) | Lulus |
| KH-siapkanTeksTanpaIdentitas-04 | nilai tidak sah | teks kosong tetap kosong | sesuai harapan (0 ms) | Lulus |

#### `templat-dokumen.test.ts`

- **Unit yang diuji:** buatDokumenTemplat (round-trip dengan potongPerBagian); namaBerkasTemplat
- **Sumber rencana uji:** Sumber: Contract C-31 TemplatProposal.buatDokumenTemplat (uji round-trip dengan Contract C-21 potongPerBagian); CRC TemplatProposal.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-buatDokumenTemplat-01 | nilai tidak sah | hasilnya .docx yang valid (ZIP berkepala PK) dan tidak kosong | sesuai harapan (30 ms) | Lulus |
| KH-buatDokumenTemplat-02 | nilai tidak sah | terbaca balik, bagian sama dan urutan sama; judul berhuruf A. JUDUL dst.; tempat isian kosong | sesuai harapan (39 ms) | Lulus |
| KH-buatDokumenTemplat-03 | batas bawah / atas | berkas memuat kalimat petunjuk resmi (batas dari templat), tempat isian [ … ], judul skema dan lampiran | sesuai harapan (20 ms) | Lulus |
| KH-buatDokumenTemplat-04 | nilai sah | bagian Kata Kunci dan Daftar Pustaka ditambahkan bila templat belum memuatnya | sesuai harapan (22 ms) | Lulus |
| KH-buatDokumenTemplat-05 | nilai sah | urutan bagian mengikuti nomor urutan, bukan urutan larik masukan | sesuai harapan (22 ms) | Lulus |
| KH-buatDokumenTemplat-06 | nilai tidak sah | isian pengusul di bawah petunjuk terbaca balik tanpa petunjuk dan tanpa tanda [ ] | sesuai harapan (23 ms) | Lulus |
| KH-namaBerkasTemplat-01 | nilai sah | nama bermakna memuat kode skema, versi, dan status | sesuai harapan (0 ms) | Lulus |
| KH-namaBerkasTemplat-02 | tipe salah / nilai janggal | kode skema dengan karakter janggal dibersihkan; kode kosong memakai cadangan | sesuai harapan (0 ms) | Lulus |
| KH-namaBerkasTemplat-03 | tipe salah / nilai janggal | tipe media DOCX baku | sesuai harapan (0 ms) | Lulus |

#### `templat-draf.test.ts`

- **Unit yang diuji:** bersihkanIsianDraf (simpan draf yang belum lengkap)
- **Sumber rencana uji:** Sumber: CRC TemplatProposal (tanggung jawab: menyimpan bagian dan lampiran sebagai Draf), Contract C-01 (periksaKelengkapan, isian yang tidak lengkap hanya boleh disimpan sebagai Draf), Class Diagram: TemplatProposal 1 — 0..* BagianTemplat.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-bersihkanIsianDraf-01 | nilai sah | isian lengkap disimpan apa adanya (nilai sah) dan tetap lolos periksaKelengkapan | sesuai harapan (2 ms) | Lulus |
| KH-bersihkanIsianDraf-02 | nilai tidak sah | baris bagian tanpa nama dan lampiran kosong dibuang; draf kosong sah | sesuai harapan (0 ms) | Lulus |
| KH-bersihkanIsianDraf-03 | batas bawah / atas | batas kata tidak sah (di bawah batas, huruf, desimal) menjadi tanpa batas | sesuai harapan (0 ms) | Lulus |
| KH-bersihkanIsianDraf-04 | batas bawah / atas | spasi di nama dan batas dipangkas; batas tepat 1 sah (batas bawah) | sesuai harapan (0 ms) | Lulus |

#### `templat-hapus-draf.test.ts`

- **Unit yang diuji:** putuskanHapusDraf (hapus draf templat); pesan hasil hapus di J-02 (?hasil=hapus)
- **Sumber rencana uji:** Sumber: behavioral state machine TemplatProposal (Draf, Terbit, Arsip; hapus hanya dari Draf), CRC TemplatProposal, Contract C-33 (hapusDraf). Hak pengelola dan keberadaan templat diputuskan oleh fungsi murni yang sama dengan layanan.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-hapusDraf-01 | nilai sah | nilai sah: pengelola menghapus templat berstatus Draf | sesuai harapan (2 ms) | Lulus |
| KH-hapusDraf-02 | keadaan dan transisi | keadaan dan transisi: Terbit (Aktif) ditolak dengan pesan yang jelas | sesuai harapan (0 ms) | Lulus |
| KH-hapusDraf-03 | keadaan dan transisi | keadaan dan transisi: Arsip ditolak dengan pesan yang jelas | sesuai harapan (0 ms) | Lulus |
| KH-hapusDraf-04 | tipe salah / nilai janggal | nilai janggal: templat tidak ada ditolak | sesuai harapan (0 ms) | Lulus |
| KH-hapusDraf-05 | nilai tidak sah | bukan pengelola ditolak walau templat berstatus Draf | sesuai harapan (0 ms) | Lulus |
| KH-bacaHasilHapus-01 | nilai sah | nilai sah: url dari urlHasilHapus terbaca kembali dan pesannya persis | sesuai harapan (0 ms) | Lulus |
| KH-bacaHasilHapus-02 | tipe salah / nilai janggal | nilai tidak sah: hasil lain, versi bukan angka atau nol, nama kosong menjadi null | sesuai harapan (0 ms) | Lulus |

#### `templat-isian-substansi.test.ts`

- **Unit yang diuji:** Isian Substansi Proposal: struktur templat; Isian Substansi Proposal: butir cek turunan dan katalog
- **Sumber rencana uji:** Sumber: Class Diagram TemplatProposal 1 — 0..* BagianTemplat, Contract C-01/C-31 (struktur Isian Substansi), Contract C-16 hitungKata dan C-17 cekKataKunci (butir turunan); data templat seed data/contoh/templat.json.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-isianSubstansi-01 | nilai sah | delapan bagian A-H berurutan dengan judul berhuruf besar | sesuai harapan (1 ms) | Lulus |
| KH-isianSubstansi-02 | batas bawah / atas | batas kata: Judul 20, Ringkasan 300, Pendahuluan 1000 (Dasar) atau 1500 (Terapan), Metode 1000, sisanya tanpa batas | sesuai harapan (0 ms) | Lulus |
| KH-isianSubstansi-03 | nilai sah | seed data/contoh/templat.json sama persis dengan struktur Isian Substansi (Dasar dan Terapan) dan berlabel struktur Isian Substansi | sesuai harapan (0 ms) | Lulus |
| KH-isianSubstansi-04 | batas bawah / atas | kalimat petunjuk resmi per bagian, angka batas diisi dari batas kata bagian | sesuai harapan (1 ms) | Lulus |
| KH-isianSubstansi-05 | tipe salah / nilai janggal | batas kata null memakai batas resmi bawaan; bagian di luar Isian Substansi tanpa petunjuk resmi (null) | sesuai harapan (0 ms) | Lulus |
| KH-isianSubstansi-06 | batas bawah / atas | turunan templat Dasar: delapan butir bagian wajib, empat butir batas kata (Judul 20, Ringkasan 300, Pendahuluan 1000, Metode 1000), tiga lampiran | sesuai harapan (1 ms) | Lulus |
| KH-isianSubstansi-07 | batas bawah / atas | turunan templat Terapan: batas Pendahuluan 1500 | sesuai harapan (0 ms) | Lulus |
| KH-isianSubstansi-08 | nilai sah | setiap bagian yang dirujuk butir katalog ada di templat Dasar dan Terapan; kata kunci tepat 5 dipisah titik koma | sesuai harapan (0 ms) | Lulus |

#### `templat-kelengkapan.test.ts`

- **Unit yang diuji:** periksaKelengkapan (UC-01 S-2)
- **Sumber rencana uji:** Sumber: Contract C-01 TemplatProposal.periksaKelengkapan (S-2 isian ditandai); CRC TemplatProposal.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-periksaKelengkapan-01 | nilai sah | isian lengkap lolos | sesuai harapan (1 ms) | Lulus |
| KH-periksaKelengkapan-02 | batas bawah / atas | menandai nama kosong, batas kata tidak valid, lampiran kosong, dan periode kosong | sesuai harapan (0 ms) | Lulus |
| KH-periksaKelengkapan-03 | nilai tidak sah | menandai nama bagian ganda dan templat tanpa bagian | sesuai harapan (0 ms) | Lulus |
| KH-periksaKelengkapan-04 | batas bawah / atas | batas kata dan nilai tersimpan | sesuai harapan (0 ms) | Lulus |

#### `templat-status.test.ts`

- **Unit yang diuji:** state machine TemplatProposal (CRC TemplatProposal; Contract C-02, C-04); keputusan Terbitkan (Contract C-02 pascakondisi Q2, Q3, Q4; label pesan tetap dari docs/spesifikasi-ui.md)
- **Sumber rencana uji:** Sumber: CRC TemplatProposal, Contract C-02 (terbitkan) dan C-04 (arsipkan), behavioral state machine templat (Draf, Terbit, Arsip; hlm. 473). Tidak melihat isi metode.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-statusTemplat-01 | nilai sah | Draf menjadi Terbit lewat terbitkan | sesuai harapan (1 ms) | Lulus |
| KH-statusTemplat-02 | nilai sah | Terbit menjadi Arsip lewat arsipkan | sesuai harapan (0 ms) | Lulus |
| KH-statusTemplat-03 | keadaan dan transisi | hanya transisi yang didefinisikan yang diizinkan (empat pasangan lain ditolak dengan pesan) | sesuai harapan (0 ms) | Lulus |
| KH-statusTemplat-04 | keadaan dan transisi | setiap keadaan dapat dicapai dari Draf dan Arsip tidak punya jalan keluar | sesuai harapan (0 ms) | Lulus |
| KH-statusTemplat-05 | keadaan dan transisi | tepat tiga keadaan: Draf, Terbit, Arsip | sesuai harapan (0 ms) | Lulus |
| KH-statusTemplat-06 | keadaan dan transisi | hanya Draf yang dapat disusun di J-02b; Terbit dan Arsip hanya-baca | sesuai harapan (0 ms) | Lulus |
| KH-terbitkan-01 | nilai sah | isian lengkap dan masa ditutup menghasilkan terbit | sesuai harapan (0 ms) | Lulus |
| KH-terbitkan-02 | nilai sah | isian lengkap dan masa pengusulan berjalan menghasilkan draf tersimpan (9a) | sesuai harapan (0 ms) | Lulus |
| KH-terbitkan-03 | nilai sah | isian tidak lengkap menghasilkan S-2 walau masa berjalan atau ditutup (kelengkapan didahulukan) | sesuai harapan (0 ms) | Lulus |
| KH-terbitkan-04 | nilai sah | pesan S-2 dan 9a persis seperti spesifikasi UI | sesuai harapan (0 ms) | Lulus |

#### `templat-turunan.test.ts`

- **Unit yang diuji:** turunkanButirCek (Contract C-03)
- **Sumber rencana uji:** Sumber: Contract C-03 (turunkanButirCek), pascakondisi Q1 sampai Q6. Dipanggil lewat alias seq-uc01 `turunkanButirCek` dari templat/layanan.ts (nilai sama dengan turunkanButirDariTemplat).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-turunkanButirCek-01 | nilai tidak sah | templat kosong dan tanpa lampiran tidak menurunkan butir (Q5) | sesuai harapan (1 ms) | Lulus |
| KH-turunkanButirCek-02 | batas bawah / atas | bagian wajib menjadi BGN-nn dan bagian opsional tanpa batas kata tidak menghasilkan apa pun (Q1) | sesuai harapan (1 ms) | Lulus |
| KH-turunkanButirCek-03 | batas bawah / atas | batas kata tepat 0 tetap menghasilkan KTA-nn, bagian tanpa batas tidak (Q2, batas bawah) | sesuai harapan (0 ms) | Lulus |
| KH-turunkanButirCek-04 | nilai sah | setiap lampiran menjadi LMP-nn (Q3) | sesuai harapan (0 ms) | Lulus |
| KH-turunkanButirCek-05 | nilai sah | penomoran dua digit terpisah per awalan dan urutan keluaran per bagian lalu lampiran (Q4) | sesuai harapan (0 ms) | Lulus |
| KH-turunkanButirCek-06 | batas bawah / atas | jumlah keluaran sama dengan bagian wajib ditambah bagian berbatas kata ditambah lampiran (Q5) | sesuai harapan (0 ms) | Lulus |
| KH-turunkanButirCek-07 | nilai sah | semua butir deterministik dan berasal dari templat (Q6); 12 butir menghasilkan nomor dua digit sampai 12 | sesuai harapan (0 ms) | Lulus |
| KH-turunkanButirCek-08 | tipe salah / nilai janggal | nama bagian dengan tanda kutip tetap utuh pada parameter dan deskripsi (nilai janggal) | sesuai harapan (0 ms) | Lulus |


#### `unduhan-akses.test.ts`

- **Unit yang diuji:** bolehUnduhBerkasProposal; dispositionUnduhan dan kepalaUnduhan; bentukNamaBerkas
- **Sumber rencana uji:** Sumber: Class Diagram Proposal 1 - 0..* PenugasanReviewer dan CRC Proposal (hanya reviewer penugasan dan Tim Kerja boleh mengunduh berkas); unduhan berkas adalah tambahan prototipe.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-bolehUnduhBerkasProposal-01 | nilai sah | Tim Kerja selalu boleh | sesuai harapan (1 ms) | Lulus |
| KH-bolehUnduhBerkasProposal-02 | nilai sah | reviewer hanya bila ditugaskan pada proposal itu | sesuai harapan (0 ms) | Lulus |
| KH-bolehUnduhBerkasProposal-03 | nilai sah | pengusul tidak boleh walau punya penugasan palsu | sesuai harapan (0 ms) | Lulus |
| KH-dispositionUnduhan-01 | nilai sah | lampiran dengan filename ASCII dan filename* UTF-8 | sesuai harapan (0 ms) | Lulus |
| KH-dispositionUnduhan-02 | nilai sah | tanda kutip dan pemisah baris tidak lolos ke header (pencegahan injeksi header) | sesuai harapan (0 ms) | Lulus |
| KH-kepalaUnduhan-01 | tipe salah / nilai janggal | memuat tipe, panjang, no-store, dan nosniff | sesuai harapan (0 ms) | Lulus |
| KH-bentukNamaBerkas-01 | nilai sah | aksen dihilangkan, spasi menjadi garis bawah, karakter terlarang diganti | sesuai harapan (0 ms) | Lulus |
| KH-bentukNamaBerkas-02 | nilai tidak sah | nama kosong atau semua simbol memakai cadangan | sesuai harapan (0 ms) | Lulus |

#### `utils.test.ts`

- **Unit yang diuji:** cn; format tanggal dan angka (WIB, id-ID)
- **Sumber rencana uji:** Sumber: fungsi bantu antarmuka (cn, format tanggal WIB dan angka id-ID); tanpa CRC, diuji sebagai unit tambahan prototipe.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KH-cn-01 | nilai sah | menggabungkan kelas dan membuang nilai palsu | sesuai harapan (4 ms) | Lulus |
| KH-cn-02 | nilai sah | kelas Tailwind yang bentrok: yang terakhir menang | sesuai harapan (0 ms) | Lulus |
| KH-cn-03 | nilai sah | masukan bersyarat berbentuk objek dan larik | sesuai harapan (0 ms) | Lulus |
| KH-cn-04 | nilai tidak sah | tanpa masukan menghasilkan string kosong | sesuai harapan (0 ms) | Lulus |
| KH-formatTanggal-01 | nilai tidak sah | tanggal valid ditulis hari bulan tahun menurut WIB; kosong menjadi tanda hubung | sesuai harapan (0 ms) | Lulus |
| KH-formatWaktu-01 | nilai tidak sah | waktu ditutup dengan WIB; kosong menjadi tanda hubung | sesuai harapan (0 ms) | Lulus |
| KH-formatAngka-01 | nilai sah | pemisah ribuan titik | sesuai harapan (2 ms) | Lulus |

## 4. Uji unit *white box* (KP)

Setiap cabang atau jalur metode yang kompleks diuji menurut *Method Specification*-nya.

#### `aturan-parameter.test.ts`

- **Unit yang diuji:** uraikanAturanHitung (cabang); validasiButir (cabang)
- **Sumber rencana uji:** cabang uraikanAturanHitung dan validasiButir (aturParameter, Contract C-06). Sumber: struktur algoritma pada aturan/parameter.ts (Method Specification MS-06 usulan: belum tercantum di tabel MS naskah).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-uraikanAturanHitung-01 | cabang / jalur | kata kunci dengan angka numerik dan pemisah koma | sesuai harapan (2 ms) | Lulus |
| KP-uraikanAturanHitung-02 | cabang / jalur | kata kunci dengan angka huruf dan pemisah bawaan titik koma | sesuai harapan (0 ms) | Lulus |
| KP-uraikanAturanHitung-03 | nilai tidak sah | kata kunci tanpa jumlah ditolak | sesuai harapan (0 ms) | Lulus |
| KP-uraikanAturanHitung-04 | cabang / jalur | jumlah referensi, pustaka berurutan, dan sitasi memakai cabang masing-masing | sesuai harapan (0 ms) | Lulus |
| KP-uraikanAturanHitung-05 | nilai tidak sah | judul sama, struktur, dan terisi; terisi tanpa bagian ditolak | sesuai harapan (0 ms) | Lulus |
| KP-validasiButir-01 | nilai tidak sah | kode kosong, kode tidak sah, kode 20 karakter sah, 21 karakter tidak sah | sesuai harapan (0 ms) | Lulus |
| KP-validasiButir-02 | nilai tidak sah | deterministik tanpa Aturan Hitung dan dengan aturan tak dikenal ditandai pada isian aturan | sesuai harapan (0 ms) | Lulus |
| KP-validasiButir-03 | nilai tidak sah | deterministik valid tetapi kode kosong tetap gagal (galat lain mencegah hasil sah) | sesuai harapan (0 ms) | Lulus |
| KP-validasiButir-04 | tipe salah / nilai janggal | semantik tanpa lampiran memakai komponen kesesuaian isi dan contoh jawaban kosong menjadi null | sesuai harapan (0 ms) | Lulus |
| KP-validasiButir-05 | cabang / jalur | semantik dengan lampiran yang tidak ada di peta komponen memakai komponen bawaan | sesuai harapan (0 ms) | Lulus |
| KP-validasiButir-06 | nilai tidak sah | jenis tidak dipilih ditandai; semantik tanpa pertanyaan dan bagian ditandai keduanya | sesuai harapan (0 ms) | Lulus |
| KP-validasiButir-07 | nilai tidak sah | ringkasParameter semantik tanpa bagian dan tanpa pertanyaan memakai tanda hubung | sesuai harapan (0 ms) | Lulus |

#### `aturan-status.test.ts`

- **Unit yang diuji:** transisiButir (cabang); susunBarisUji (cabang); ringkasPerContoh (cabang filter)
- **Sumber rencana uji:** cabang transisi status butir dan susunan tabel J-03b. Sumber: Method Specification MS-11 (nonaktifkanTurunanLama, nonaktifkan) dan Contract C-10 (susunBarisUji) pada aturan/status.ts dan aturan/uji.ts.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-transisiButir-01 | keadaan dan transisi | aksi dan keadaan asal terdefinisi menghasilkan keadaan tujuan | sesuai harapan (1 ms) | Lulus |
| KP-transisiButir-02 | keadaan dan transisi | aksi terdefinisi tetapi keadaan asal tidak terdaftar pada aksi itu | sesuai harapan (0 ms) | Lulus |
| KP-transisiButir-03 | tipe salah / nilai janggal | aksi tidak dikenal (di luar tipe) ditolak tanpa melempar galat | sesuai harapan (0 ms) | Lulus |
| KP-susunBarisUji-01 | cabang / jalur | cabang deterministik ditemukan lebih dulu daripada semantik untuk kode yang sama | sesuai harapan (0 ms) | Lulus |
| KP-susunBarisUji-02 | cabang / jalur | cabang semantik dipakai bila tidak ada hasil deterministik | sesuai harapan (0 ms) | Lulus |
| KP-susunBarisUji-03 | tipe salah / nilai janggal | sel null pada sebagian contoh tidak membuang baris selama ada satu hasil | sesuai harapan (0 ms) | Lulus |
| KP-susunBarisUji-04 | nilai tidak sah | cabang Nonaktif dan cabang tanpa hasil sama-sama membuang baris | sesuai harapan (0 ms) | Lulus |
| KP-susunBarisUji-05 | tipe salah / nilai janggal | penjaga tipe adalahDeterministik membedakan bentuk hasil | sesuai harapan (0 ms) | Lulus |
| KP-ringkasPerContoh-01 | cabang / jalur | setiap status pada setiap filter dihitung tepat satu kali | sesuai harapan (0 ms) | Lulus |

#### `aturan-tanggal.test.ts`

- **Unit yang diuji:** validasiTanggalBerlaku (MS-12, cabang)
- **Sumber rencana uji:** setiap cabang validasiTanggalBerlaku. Sumber: Method Specification MS-12 (Contract C-08).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-validasiTanggalBerlaku-01 | tipe salah / nilai janggal | format tidak sah (cabang uraiTanggalIsian null) | sesuai harapan (1 ms) | Lulus |
| KP-validasiTanggalBerlaku-02 | batas bawah / atas | masa berjalan dan tepat pada hari buka ditolak (batas bawah ikut, 8a) | sesuai harapan (1 ms) | Lulus |
| KP-validasiTanggalBerlaku-03 | batas bawah / atas | masa berjalan dan tepat pada hari tutup ditolak (batas atas ikut, 8a) | sesuai harapan (0 ms) | Lulus |
| KP-validasiTanggalBerlaku-04 | cabang / jalur | masa berjalan, sehari sebelum buka dan sehari sesudah tutup diterima (kedua sisi kondisi majemuk) | sesuai harapan (0 ms) | Lulus |
| KP-validasiTanggalBerlaku-05 | cabang / jalur | masa tidak berjalan melewati pemeriksaan rentang | sesuai harapan (0 ms) | Lulus |
| KP-validasiTanggalBerlaku-06 | nilai tidak sah | tanggal tepat sama dengan versi sebelumnya ditolak; sehari sesudahnya diterima; tanpa versi sebelumnya dilewati | sesuai harapan (0 ms) | Lulus |
| KP-validasiTanggalBerlaku-07 | nilai tidak sah | bila ditolak 8a sekaligus lebih awal dari versi sebelumnya, pesan 8a didahulukan | sesuai harapan (0 ms) | Lulus |

#### `bima-client.test.ts`

- **Unit yang diuji:** klien BIMA: ulang otomatis maksimal 2 kali (NFR 4.4)
- **Sumber rencana uji:** Sumber: klien BIMA tiruan (percobaan ulang otomatis maksimal 2 kali, NFR 4.4) yang dipanggil Method Specification MS-01 pada tarikDariBima; dijalankan terhadap stub.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-klienBima-01 | cabang / jalur | berhasil pada percobaan ketiga | sesuai harapan (25 ms) | Lulus |
| KP-klienBima-02 | nilai tidak sah | gagal setelah 3 percobaan total | sesuai harapan (3 ms) | Lulus |
| KP-klienBima-03 | cabang / jalur | tidak mengulang galat 4xx | sesuai harapan (0 ms) | Lulus |
| KP-klienBima-04 | cabang / jalur | mengulang galat jaringan | sesuai harapan (2 ms) | Lulus |
| KP-klienBima-05 | cabang / jalur | stub BIMA memuat reviewer, mengirim penugasan, dan mencatat panggilan | sesuai harapan (2 ms) | Lulus |
| KP-klienBima-06 | tipe salah / nilai janggal | ambilBerkas mengembalikan bytes dan tipe; berkas tak ada gagal 404 tanpa ulang | sesuai harapan (1 ms) | Lulus |
| KP-klienBima-07 | cabang / jalur | setiap metode memanggil jalur dan metode HTTP yang benar | sesuai harapan (0 ms) | Lulus |
| KP-klienBima-08 | cabang / jalur | ambilProposal mengodekan id pada URL | sesuai harapan (0 ms) | Lulus |

#### `deterministik-cabang.test.ts`

- **Unit yang diuji:** hitungKata (MS-02): cabang; cekKataKunci (MS-13): cabang; cocokkanSitasi (MS-03): cabang; cekLampiran dan pengarah periksaSatuButir: cabang; transisiProposal: cabang 'galat'
- **Sumber rencana uji:** Uji kotak putih UC-05 dan UC-06 (Dennis dkk., 2015, hlm. 471-475): setiap cabang metode kompleks menurut Method Specification MS-02 hitungKata, MS-03 cocokkanSitasi, MS-13 cekKataKunci, serta pengarah periksaSatuButir dan state machine status Proposal.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-hitungKata-01 | nilai tidak sah | baris kosong dilewati (cabang barisTeks menyaring) | sesuai harapan (1 ms) | Lulus |
| KP-hitungKata-02 | cabang / jalur | baris keterangan Gambar/Tabel/Diagram/Grafik/Bagan/Skema/Foto dilewati | sesuai harapan (0 ms) | Lulus |
| KP-hitungKata-03 | cabang / jalur | penanda [tabel]/[gambar]/[diagram] dilewati, penanda lain dihitung | sesuai harapan (0 ms) | Lulus |
| KP-hitungKata-04 | nilai tidak sah | kata 'gambar' tanpa nomor di awal baris adalah teks biasa (cabang pola tidak cocok) | sesuai harapan (0 ms) | Lulus |
| KP-hitungKata-05 | cabang / jalur | fmt memberi titik ribuan dan membulatkan ke bawah | sesuai harapan (0 ms) | Lulus |
| KP-hitungKata-06 | cabang / jalur | normalisasiJudul membuang penomoran bab, angka, romawi, dan tanda baca di ujung | sesuai harapan (0 ms) | Lulus |
| KP-cekKataKunci-01 | tipe salah / nilai janggal | null -> cabang kosong, pesan memakai nama pemisah dikenal | sesuai harapan (0 ms) | Lulus |
| KP-cekKataKunci-02 | tipe salah / nilai janggal | pemisah tidak dikenal dipetik apa adanya pada pesan | sesuai harapan (0 ms) | Lulus |
| KP-cekKataKunci-03 | cabang / jalur | petunjuk 'pemisah salah' muncul hanya bila satu kata kunci mengandung koma/baris baru dan pemisah bukan koma | sesuai harapan (0 ms) | Lulus |
| KP-cekKataKunci-04 | batas bawah / atas | jumlah sama lolos tanpa batas dilanggar | sesuai harapan (1 ms) | Lulus |
| KP-cocokkanSitasi-01 | cabang / jalur | nomorSitasi memperluas rentang, daftar titik koma, dan menolak rentang terbalik atau terlalu lebar | sesuai harapan (0 ms) | Lulus |
| KP-cocokkanSitasi-02 | nilai tidak sah | sitasi_bernomor: tiga hasil (lolos, tanpa sitasi, nama-tahun) | sesuai harapan (0 ms) | Lulus |
| KP-cocokkanSitasi-03 | nilai tidak sah | pustaka_berurutan: bagian Daftar Pustaka tidak ada versus ada tanpa entri | sesuai harapan (0 ms) | Lulus |
| KP-cocokkanSitasi-04 | cabang / jalur | pustaka_berurutan: salah nomor saja, lompat saja, keduanya, dan lolos | sesuai harapan (0 ms) | Lulus |
| KP-cocokkanSitasi-05 | nilai tidak sah | jumlah_referensi_sama: lolos, kosong, tidak dikutip, dikutip tanpa entri, dan keduanya | sesuai harapan (0 ms) | Lulus |
| KP-cocokkanSitasi-06 | cabang / jalur | sitasi di bagian Kata Kunci dan Daftar Pustaka tidak dihitung sebagai sitasi isi | sesuai harapan (0 ms) | Lulus |
| KP-cocokkanSitasi-07 | cabang / jalur | bagian di luar templat tetap dihitung setelah bagian bertemplat; Referensi dikenali sebagai pustaka | sesuai harapan (0 ms) | Lulus |
| KP-cocokkanSitasi-08 | cabang / jalur | entriPustaka menggabungkan baris lanjutan dan mengabaikan baris sebelum entri pertama | sesuai harapan (0 ms) | Lulus |
| KP-periksaSatuButir-01 | tipe salah / nilai janggal | parameter null gagal tertutup | sesuai harapan (0 ms) | Lulus |
| KP-periksaSatuButir-02 | tipe salah / nilai janggal | setiap tipe parameter diarahkan ke pemeriksa yang sesuai | sesuai harapan (1 ms) | Lulus |
| KP-periksaSatuButir-03 | tipe salah / nilai janggal | tipe parameter tidak dikenal gagal dengan nama tipenya | sesuai harapan (0 ms) | Lulus |
| KP-periksaSatuButir-04 | batas bawah / atas | periksaBanyakButir membuang butir semantik dan menyaring batas dilanggar pada butir lolos | sesuai harapan (0 ms) | Lulus |
| KP-cekLampiran-01 | nilai tidak sah | daftar wajib kosong memakai nama butir; daftar wajib berisi dibandingkan dua arah | sesuai harapan (0 ms) | Lulus |
| KP-transisiProposal-01 | cabang / jalur | galat memberi Ditahan bila ada versi selesai, selain itu Belum diajukan | sesuai harapan (0 ms) | Lulus |
| KP-transisiProposal-02 | nilai tidak sah | galat pada status selain Sedang diperiksa ditolak | sesuai harapan (0 ms) | Lulus |

#### `pemantauan-rekap.test.ts`

- **Unit yang diuji:** rekapKesesuaian: cabang (MS-09); pilahButirDitandai: cabang (C-30)
- **Sumber rencana uji:** Sumber: Method Specification MS-09 rekapKesesuaian / hitungTingkatKoreksi (Contract C-29) dan pilahButirDitandai (Contract C-30); setiap cabang/jalur.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-rekapKesesuaian-01 | tipe salah / nilai janggal | butir tanpa info memakai kode sebagai deskripsi, status dan butirId null | sesuai harapan (1 ms) | Lulus |
| KP-rekapKesesuaian-02 | batas bawah / atas | rincian dibatasi BATAS_CONTOH_RINCIAN dengan koreksi lebih dulu | sesuai harapan (0 ms) | Lulus |
| KP-rekapKesesuaian-03 | nilai tidak sah | rekomendasi kosong tanpa koreksi tampil sebagai 'Disetujui (tanpa koreksi)' | sesuai harapan (0 ms) | Lulus |
| KP-rekapKesesuaian-04 | nilai tidak sah | institusi unik terurut abjad, jumlah gagal per institusi bertambah per kejadian | sesuai harapan (7 ms) | Lulus |
| KP-rekapKesesuaian-05 | cabang / jalur | persen disetujui seri diurutkan menurut kode | sesuai harapan (0 ms) | Lulus |
| KP-pilahButirDitandai-01 | cabang / jalur | butir Aktif menjadi target | sesuai harapan (0 ms) | Lulus |
| KP-pilahButirDitandai-02 | cabang / jalur | butir bukan Aktif dilewati beserta alasan statusnya | sesuai harapan (0 ms) | Lulus |
| KP-pilahButirDitandai-03 | cabang / jalur | kode yang tidak ada pada basis aturan dilewati | sesuai harapan (0 ms) | Lulus |
| KP-pilahButirDitandai-04 | nilai tidak sah | kode ganda dihitung sekali; pilihan kosong tidak menghasilkan apa-apa | sesuai harapan (0 ms) | Lulus |

#### `pengajuan-ekstraksi.test.ts`

- **Unit yang diuji:** naskah PDF dan lampiran
- **Sumber rencana uji:** Sumber: Method Specification MS-01 potongPerBagian (tahap ekstraksi teks naskah PDF dan lampiran); setiap cabang ekstraksi.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-ekstrakNaskah-01 | cabang / jalur | PDF: judul bagian dikenali dari nama templat | sesuai harapan (68 ms) | Lulus |
| KP-ekstrakNaskah-02 | tipe salah / nilai janggal | format tidak dikenal ditolak | sesuai harapan (1 ms) | Lulus |
| KP-ekstrakNaskah-03 | nilai tidak sah | teks lampiran PDF terbaca; berkas rusak menghasilkan teks kosong | sesuai harapan (18 ms) | Lulus |

#### `pengajuan-html-berkas.test.ts`

- **Unit yang diuji:** blokDariHtml (cabang); jenisBerkas dan ekstrakTeksLampiran (cabang)
- **Sumber rencana uji:** Sumber: Method Specification MS-01 potongPerBagian (tahap ambilTeksBagian untuk DOCX); cabang blokDariHtml dan jenisBerkas/ekstrakTeksLampiran.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-blokDariHtml-01 | cabang / jalur | judul h1..h6 membawa tingkat; paragraf dengan <br> dipecah per baris | sesuai harapan (2 ms) | Lulus |
| KP-blokDariHtml-02 | cabang / jalur | tabel menjadi satu penanda dan isinya dibuang | sesuai harapan (0 ms) | Lulus |
| KP-blokDariHtml-03 | nilai tidak sah | daftar ul/ol dipecah per item; item kosong dilewati | sesuai harapan (0 ms) | Lulus |
| KP-blokDariHtml-04 | nilai tidak sah | paragraf bergambar menghasilkan penanda gambar lalu teksnya; paragraf hanya gambar tanpa teks | sesuai harapan (0 ms) | Lulus |
| KP-blokDariHtml-05 | tipe salah / nilai janggal | entitas bernama, desimal, dan heksadesimal didekode; entitas tidak dikenal dibiarkan | sesuai harapan (0 ms) | Lulus |
| KP-blokDariHtml-06 | nilai tidak sah | judul multibaris digabung satu baris; paragraf kosong tidak menghasilkan blok | sesuai harapan (0 ms) | Lulus |
| KP-jenisBerkas-01 | nilai tidak sah | PDF dikenali dari tanda %PDF; nama .pdf tanpa tanda %PDF ditolak | sesuai harapan (0 ms) | Lulus |
| KP-jenisBerkas-02 | tipe salah / nilai janggal | DOCX butuh tanda PK dan tipe atau ekstensi docx | sesuai harapan (0 ms) | Lulus |
| KP-ekstrakTeksLampiran-01 | tipe salah / nilai janggal | format tidak dikenal menghasilkan teks kosong, bukan galat | sesuai harapan (0 ms) | Lulus |
| KP-ekstrakTeksLampiran-02 | nilai tidak sah | DOCX rusak ditelan menjadi teks kosong | sesuai harapan (1 ms) | Lulus |

#### `pengajuan-potong-isian.test.ts`

- **Unit yang diuji:** buangPetunjuk (cabang); lepasTandaIsian (cabang); buangLampiranEkspor dan potongDaftarPustakaEkspor (cabang); normalisasiJudul: huruf bagian (cabang); entriPustaka: baris lanjutan ekspor BIMA (cabang)
- **Sumber rencana uji:** Sumber: Method Specification MS-01 potongPerBagian (Contract C-21), cabang baru Isian Substansi: judul berhuruf, melewati sampul/identitas ekspor BIMA, membuang kalimat petunjuk dan tanda [ ], memotong lampiran ekspor, kata kunci multibaris.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-buangPetunjuk-01 | nilai tidak sah | baris kosong dan baris 'Panduan: ...' di awal dibuang meski tanpa petunjuk resmi | sesuai harapan (0 ms) | Lulus |
| KP-buangPetunjuk-02 | nilai tidak sah | petunjuk kosong (tanpa kata) tidak membuang apa pun | sesuai harapan (0 ms) | Lulus |
| KP-buangPetunjuk-03 | nilai tidak sah | baris tanpa kata (mis. tanda baca saja) menghentikan pencocokan; baris yang berbeda juga | sesuai harapan (0 ms) | Lulus |
| KP-buangPetunjuk-04 | cabang / jalur | baris lebih panjang daripada sisa petunjuk (isi menempel pada petunjuk) menghentikan pencocokan | sesuai harapan (0 ms) | Lulus |
| KP-buangPetunjuk-05 | batas bawah / atas | angka batas boleh berbeda; salah ketik satu huruf pada kata panjang dimaafkan; kata pendek harus sama | sesuai harapan (0 ms) | Lulus |
| KP-buangPetunjuk-06 | cabang / jalur | petunjuk terbaca sebagian: >= 80% kalimat dibuang; kurang dari itu dibiarkan | sesuai harapan (0 ms) | Lulus |
| KP-buangPetunjuk-07 | cabang / jalur | kata pendek yang berbeda satu huruf bukan salah ketik (panjang kurang dari 5) | sesuai harapan (0 ms) | Lulus |
| KP-lepasTandaIsian-01 | nilai tidak sah | masukan kosong atau hanya baris kosong menghasilkan larik kosong | sesuai harapan (0 ms) | Lulus |
| KP-lepasTandaIsian-02 | nilai tidak sah | '[' dan ']' di baris sendiri di awal/akhir dibuang walau pasangannya tidak terbaca; hanya '[' atau ']' menjadi kosong | sesuai harapan (0 ms) | Lulus |
| KP-lepasTandaIsian-03 | cabang / jalur | pembuka inline dan penutup seimbang: '[isi' ... 'akhir]' dilepas; penutup yang seimbang ('[4]') dipertahankan | sesuai harapan (0 ms) | Lulus |
| KP-lepasTandaIsian-04 | nilai tidak sah | baris pertama berupa sitasi '[1] ...' bukan tanda isian; placeholder '[ … ]' dan '[...]' menjadi kosong | sesuai harapan (0 ms) | Lulus |
| KP-lampiranEkspor-01 | nilai tidak sah | tanpa judul surat, baris tidak berubah | sesuai harapan (0 ms) | Lulus |
| KP-lampiranEkspor-02 | cabang / jalur | dipotong pada judul surat berikut kop suratnya (huruf kapital, alamat, baris pendek); pustaka bernomor dan tautan dipertahankan | sesuai harapan (0 ms) | Lulus |
| KP-lampiranEkspor-03 | cabang / jalur | kurang dari tiga entri berurutan: daftar tidak dipotong | sesuai harapan (0 ms) | Lulus |
| KP-lampiranEkspor-04 | cabang / jalur | entri terakhir dibawa sampai baris penutup (titik, bukan inisial) atau tautan; artikel sesudahnya dibuang | sesuai harapan (0 ms) | Lulus |
| KP-lampiranEkspor-05 | batas bawah / atas | entri terakhir tanpa penutup dibatasi delapan baris; nomor yang melompat tidak masuk rantai | sesuai harapan (0 ms) | Lulus |
| KP-lengkapiBagian-01 | cabang / jalur | atribut huruf dari urutan dan petunjuk dari nama; atribut petunjuk yang sudah ada dipertahankan | sesuai harapan (0 ms) | Lulus |
| KP-entriPustaka-01 | cabang / jalur | baris lanjutan berawalan DOI ('10.1016/...') atau tahun ('2016. doi') bukan entri baru; '[1]teks' rapat tetap entri | sesuai harapan (0 ms) | Lulus |

#### `pengajuan-potong.test.ts`

- **Unit yang diuji:** potongPerBagian (cabang); potongPerBagian kata kunci (cabang)
- **Sumber rencana uji:** Sumber: Method Specification MS-01 potongPerBagian (Contract C-21); setiap cabang.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-potongPerBagian-01 | nilai tidak sah | blok sebelum judul bagian pertama menjadi judul dokumen (baris kosong dilewati) | sesuai harapan (3 ms) | Lulus |
| KP-potongPerBagian-02 | nilai tidak sah | tanpa satu pun judul bagian, hasil kosong dan judul dokumen dari blok pertama | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-03 | cabang / jalur | paragraf pendek yang isinya nama bagian (mis. PDF) dikenali sebagai judul | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-04 | cabang / jalur | paragraf lebih dari 80 karakter bernama sama dengan bagian bukan judul | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-05 | cabang / jalur | judul bagian ganda: yang kedua menjadi isi, bukan bagian baru | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-06 | cabang / jalur | judul tingkat 1 di luar templat mengakhiri bagian dan isinya dibuang; tingkat 2 tidak mengakhiri | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-07 | nilai tidak sah | judul tanpa tingkat dianggap tingkat 1 | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-08 | cabang / jalur | penomoran judul diabaikan saat mencocokkan nama | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-09 | nilai tidak sah | dari bagian 'Kata Kunci' (awalan dibuang; baris kosong pertama dilewati) | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-10 | tipe salah / nilai janggal | bagian 'Kata Kunci' ada tetapi kosong -> null | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-11 | nilai tidak sah | tanpa bagian Kata Kunci di templat, baris 'Kata kunci: ...' di mana pun dipakai | sesuai harapan (0 ms) | Lulus |
| KP-potongPerBagian-12 | tipe salah / nilai janggal | tidak ada sama sekali -> null | sesuai harapan (0 ms) | Lulus |

#### `penugasan-susun.test.ts`

- **Unit yang diuji:** susunUsulanMurni (UC-03 langkah 4); susunUsulanMurni pada skala nyata (10.000 proposal); susunUsulanMurni: cabang tambahan (MS-04)
- **Sumber rencana uji:** Sumber: Method Specification MS-04 susunPenugasan (Contract C-13); setiap cabang/jalur.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-susunUsulanMurni-01 | cabang / jalur | tidak pernah memilih reviewer dari institusi pengusul | sesuai harapan (9 ms) | Lulus |
| KP-susunUsulanMurni-02 | batas bawah / atas | meratakan beban dan tidak melampaui batas | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-03 | cabang / jalur | memperhitungkan beban awal (penugasan yang sudah ditetapkan) | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-04 | cabang / jalur | S-1: melaporkan proposal yang belum dapat ditugaskan bila reviewer kurang | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-05 | nilai tidak sah | S-1: proposal tanpa reviewer berinstitusi berbeda tidak dapat ditugaskan | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-06 | cabang / jalur | menggeser proposal lain bila greedy buntu (jalur penambah) | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-07 | cabang / jalur | hasil deterministik untuk masukan yang sama | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurniSkala-01 | cabang / jalur | membagi seluruh proposal dengan beda institusi, beban rata, dan cepat (< 3 dtk) | sesuai harapan (98 ms) | Lulus |
| KP-susunUsulanMurniSkala-02 | batas bawah / atas | S-1 cepat bila batas diturunkan di bawah kapasitas (60 x 130 < 10.000) | sesuai harapan (42 ms) | Lulus |
| KP-susunUsulanMurni-08 | nilai tidak sah | tanpa proposal tidak menghasilkan penugasan maupun kekurangan | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-09 | nilai tidak sah | tanpa reviewer semua proposal belum ditugaskan | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-10 | cabang / jalur | institusi dinormalisasi (huruf besar dan spasi tepi) saat memilih reviewer layak | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-11 | cabang / jalur | kapasitas sisa nol (semua reviewer penuh oleh beban awal) melewati jalur penambah | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-12 | nilai tidak sah | setelah 25 kegagalan jalur penambah beruntun sisa proposal langsung dilaporkan kekurangan | sesuai harapan (0 ms) | Lulus |
| KP-susunUsulanMurni-13 | cabang / jalur | beban akhir memuat beban awal reviewer yang tidak mendapat proposal baru | sesuai harapan (0 ms) | Lulus |

#### `semantik-alur.test.ts`

- **Unit yang diuji:** MS-06 periksaSemantik: alur status dengan stub LLM; MS-07 cocokkanKutipan / cariKutipan: cabang; MS-08 siapkanTeksTanpaIdentitas: cabang
- **Sumber rencana uji:** Sumber rencana uji: Method Specification MS-06 periksaSemantik (batas waktu, percobaan ulang, status), MS-07 cocokkanKutipan, MS-08 siapkanTeksTanpaIdentitas. Layanan LLM diganti stub (hlm. 471): tests/unit/stub/llm.ts.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-periksaSemantik-01 | cabang / jalur | sukses pada percobaan pertama: Memenuhi dengan kutipan dan keyakinan, satu panggilan | sesuai harapan (2 ms) | Lulus |
| KP-periksaSemantik-02 | batas bawah / atas | batas waktu pada percobaan pertama lalu sukses: percobaan 2, hasil normal | sesuai harapan (2 ms) | Lulus |
| KP-periksaSemantik-03 | batas bawah / atas | batas waktu dua kali: Belum ada rekomendasi tanpa rekomendasi, kutipan, dan keyakinan; alasan memuat galat terakhir | sesuai harapan (2 ms) | Lulus |
| KP-periksaSemantik-04 | cabang / jalur | kutipan palsu: Perlu diperiksa manual, kutipan dibuang, rekomendasi semula tetap tercatat | sesuai harapan (0 ms) | Lulus |
| KP-periksaSemantik-05 | cabang / jalur | kutipan dengan tanda kutip lurus dan spasi berbeda tetap dikenali (tidak jatuh ke Perlu diperiksa manual) | sesuai harapan (0 ms) | Lulus |
| KP-periksaSemantik-06 | nilai tidak sah | Tidak memenuhi tanpa kutipan diterima; satu butir gagal tidak menggagalkan butir lain (pekerja bersamaan) | sesuai harapan (2 ms) | Lulus |
| KP-periksaSemantik-07 | cabang / jalur | skenario paksa tiruan 'kutipan-salah' berlaku pada butir pertama saja | sesuai harapan (0 ms) | Lulus |
| KP-periksaSemantik-08 | cabang / jalur | skenario paksa tiruan 'tidak-merespons' menghasilkan Belum ada rekomendasi dan label tiruan | sesuai harapan (2 ms) | Lulus |
| KP-cariKutipan-01 | tipe salah / nilai janggal | cabang token kosong (null, undefined, spasi) dan teks kosong mengembalikan null | sesuai harapan (0 ms) | Lulus |
| KP-cariKutipan-02 | cabang / jalur | cabang cocok mengembalikan mulai dan akhir; tanda kutip tunggal lengkung kiri/kanan setara apostrof | sesuai harapan (0 ms) | Lulus |
| KP-cariKutipan-03 | cabang / jalur | cabang tidak cocok: huruf besar-kecil dibedakan | sesuai harapan (0 ms) | Lulus |
| KP-siapkanTeksTanpaIdentitas-03 | tipe salah / nilai janggal | identitas lain (mis. email) dibuang; nilai kosong, null, dan lebih pendek dari tiga huruf dilewati | sesuai harapan (0 ms) | Lulus |
| KP-siapkanTeksTanpaIdentitas-04 | nilai tidak sah | varian nama: tanpa gelar depan dan belakang dibuang walau teks hanya memuat varian itu; yang terpanjang diganti lebih dulu | sesuai harapan (0 ms) | Lulus |
| KP-siapkanTeksTanpaIdentitas-05 | nilai tidak sah | nama tanpa koma dan tanpa gelar menghasilkan satu varian | sesuai harapan (0 ms) | Lulus |

#### `semantik-identitas-bima.test.ts`

- **Unit yang diuji:** buangIdentitasBima (cabang); kumpulkanIdentitasBima dan siapkanTeksTanpaIdentitas (cabang)
- **Sumber rencana uji:** Sumber: Method Specification MS-08 siapkanTeksTanpaIdentitas (Contract C-23), cabang ekspor BIMA: pembuangan bagian "2. IDENTITAS PENGUSUL", baris NO. DOKUMEN, dan pengumpulan identitas anggota tim.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-identitasBima-01 | cabang / jalur | blok identitas diganti satu penanda sampai judul bagian bernomor berikutnya; NO. DOKUMEN dibuang | sesuai harapan (2 ms) | Lulus |
| KP-identitasBima-02 | nilai tidak sah | tanpa blok identitas, hanya baris NO. DOKUMEN yang dibuang; teks lain tidak berubah | sesuai harapan (0 ms) | Lulus |
| KP-identitasBima-03 | nilai tidak sah | blok identitas tanpa judul bagian penutup: dibuang sampai akhir teks; A. JUDUL juga menutup blok | sesuai harapan (0 ms) | Lulus |
| KP-identitasBima-04 | nilai tidak sah | nomor induk panjang dan nama di atasnya dikumpulkan; baris peran, angka, dan nama pendek diabaikan; tanpa blok: kosong | sesuai harapan (1 ms) | Lulus |
| KP-identitasBima-05 | nilai tidak sah | seluruh identitas anggota tim ikut dibuang dari teks lain (pembagian tugas pada Metode), tanpa memberi identitas pengusul | sesuai harapan (1 ms) | Lulus |

#### `semantik-mesin.test.ts`

- **Unit yang diuji:** siapkanTeksTanpaIdentitas; tentukanSasaran; mintaJawaban (dua percobaan); bentukHasil; nilaiSemantikDenganOpsi
- **Sumber rencana uji:** Sumber: Method Specification MS-06 periksaSemantik, MS-07 cocokkanKutipan, MS-08 siapkanTeksTanpaIdentitas; Layanan LLM diganti stub.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-siapkanTeksTanpaIdentitas-01 | nilai tidak sah | membuang nama (dengan dan tanpa gelar), institusi, dan nomor induk | sesuai harapan (2 ms) | Lulus |
| KP-siapkanTeksTanpaIdentitas-02 | nilai tidak sah | tanpa identitas, teks tidak berubah | sesuai harapan (0 ms) | Lulus |
| KP-tentukanSasaran-01 | cabang / jalur | butir atas lampiran memakai teks lampiran sebagai sasaran utama | sesuai harapan (0 ms) | Lulus |
| KP-mintaJawaban-01 | cabang / jalur | berhasil pada percobaan kedua | sesuai harapan (2 ms) | Lulus |
| KP-mintaJawaban-02 | tipe salah / nilai janggal | gagal dua kali menghasilkan null (S-2) | sesuai harapan (2 ms) | Lulus |
| KP-bentukHasil-01 | cabang / jalur | kutipan ditemukan: status mengikuti rekomendasi | sesuai harapan (0 ms) | Lulus |
| KP-bentukHasil-02 | cabang / jalur | S-1: kutipan tidak ditemukan -> Perlu diperiksa manual, rekomendasi tetap disimpan, kutipan tidak ditampilkan | sesuai harapan (0 ms) | Lulus |
| KP-bentukHasil-03 | nilai tidak sah | S-2: tanpa jawaban -> Belum ada rekomendasi, tanpa rekomendasi, kutipan, keyakinan | sesuai harapan (0 ms) | Lulus |
| KP-bentukHasil-04 | nilai tidak sah | Tidak memenuhi tanpa kutipan sah (unsur memang tidak ada) | sesuai harapan (0 ms) | Lulus |
| KP-bentukHasil-05 | nilai tidak sah | Memenuhi tanpa kutipan -> Perlu diperiksa manual | sesuai harapan (0 ms) | Lulus |
| KP-nilaiSemantikDenganOpsi-01 | nilai tidak sah | hanya butir semantik, urutan terjaga, bagian kosong tanpa memanggil LLM | sesuai harapan (0 ms) | Lulus |
| KP-nilaiSemantikDenganOpsi-02 | cabang / jalur | mode tiruan: kutipan salinan persis dari teks, tiruan true | sesuai harapan (1 ms) | Lulus |

#### `templat-dokumen.test.ts`

- **Unit yang diuji:** panduanBagian (cabang); bagianDokumen (cabang); buatDokumenTemplat (cabang isi)
- **Sumber rencana uji:** Sumber: Method Specification MS-10 buatDokumenTemplat (Contract C-31); setiap cabang generator templat (.docx).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-panduanBagian-01 | cabang / jalur | bagian Isian Substansi memakai kalimat petunjuk resmi; Kata Kunci menyebut titik koma | sesuai harapan (1 ms) | Lulus |
| KP-panduanBagian-02 | batas bawah / atas | nama dinormalisasi (penomoran/huruf diabaikan) dan angka batas diisi dari batas kata bagian | sesuai harapan (0 ms) | Lulus |
| KP-panduanBagian-03 | tipe salah / nilai janggal | bagian di luar Isian Substansi: batas kata null menjadi tanpa batas; angka diformat Indonesia | sesuai harapan (0 ms) | Lulus |
| KP-bagianDokumen-01 | nilai tidak sah | tanpa bagian sama sekali hanya berisi dua bagian wajib dengan urutan 1 dan 2 | sesuai harapan (0 ms) | Lulus |
| KP-bagianDokumen-02 | cabang / jalur | hanya satu yang kurang: hanya itu yang ditambahkan, nomor urut melanjutkan yang terbesar | sesuai harapan (0 ms) | Lulus |
| KP-bagianDokumen-03 | cabang / jalur | masukan tidak diubah (tidak ada efek samping) | sesuai harapan (0 ms) | Lulus |
| KP-buatDokumenTemplat-01 | tipe salah / nilai janggal | periode null menulis 'belum ditetapkan'; tanpa lampiran menulis 'Tidak ada lampiran wajib' | sesuai harapan (41 ms) | Lulus |
| KP-buatDokumenTemplat-02 | cabang / jalur | periode terisi menulis nama dan tahun; lampiran bernomor | sesuai harapan (19 ms) | Lulus |
| KP-buatDokumenTemplat-03 | nilai tidak sah | periode tanpa tahun tidak menulis tanda kurung | sesuai harapan (17 ms) | Lulus |

#### `templat-hapus-draf.test.ts`

- **Unit yang diuji:** putuskanHapusDraf (MS-25, cabang); bacaHasilHapus (MS-25, cabang)
- **Sumber rencana uji:** setiap cabang keputusan hapus draf. Sumber: Method Specification MS-25 (hapusDraf) pada templat/status.ts:putuskanHapusDraf dan templat/daftar.ts:bacaHasilHapus.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-putuskanHapusDraf-01 | cabang / jalur | cabang bukan pengelola (kondisi pertama benar), status tidak dievaluasi | sesuai harapan (2 ms) | Lulus |
| KP-putuskanHapusDraf-02 | cabang / jalur | cabang pengelola dan templat tidak ada | sesuai harapan (0 ms) | Lulus |
| KP-putuskanHapusDraf-03 | cabang / jalur | cabang pengelola, ada, status Terbit (label Aktif pada pesan) | sesuai harapan (0 ms) | Lulus |
| KP-putuskanHapusDraf-04 | cabang / jalur | cabang pengelola, ada, status Arsip (label tetap Arsip) | sesuai harapan (0 ms) | Lulus |
| KP-putuskanHapusDraf-05 | cabang / jalur | cabang jalur sukses (Draf) | sesuai harapan (0 ms) | Lulus |
| KP-bacaHasilHapus-01 | cabang / jalur | cabang hasil bukan hapus | sesuai harapan (0 ms) | Lulus |
| KP-bacaHasilHapus-02 | nilai tidak sah | cabang versi tidak sah, lalu cabang nama kosong, lalu cabang sah dengan nilai larik dan nama dipangkas 120 | sesuai harapan (0 ms) | Lulus |

#### `templat-status.test.ts`

- **Unit yang diuji:** putuskanTerbitkan (MS-11, cabang); transisiTemplat (MS-11, cabang)
- **Sumber rencana uji:** setiap cabang keputusan Terbitkan dan transisi status templat. Sumber: Method Specification MS-11 (terbitkan: S-2, 9a, terbit; arsipkan) pada templat/status.ts.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| KP-putuskanTerbitkan-01 | cabang / jalur | cabang tidak lengkap (kondisi pertama benar), masa tidak dievaluasi | sesuai harapan (1 ms) | Lulus |
| KP-putuskanTerbitkan-02 | cabang / jalur | cabang lengkap dan masa berjalan (9a) | sesuai harapan (0 ms) | Lulus |
| KP-putuskanTerbitkan-03 | cabang / jalur | cabang lengkap dan masa tidak berjalan (jalur terbit) | sesuai harapan (0 ms) | Lulus |
| KP-transisiTemplat-01 | keadaan dan transisi | aksi terdefinisi dan keadaan asal cocok | sesuai harapan (0 ms) | Lulus |
| KP-transisiTemplat-02 | keadaan dan transisi | aksi terdefinisi tetapi keadaan asal tidak cocok | sesuai harapan (0 ms) | Lulus |
| KP-transisiTemplat-03 | tipe salah / nilai janggal | aksi tidak dikenal (di luar tipe) ditolak tanpa melempar galat | sesuai harapan (0 ms) | Lulus |

## 5. Uji integrasi

### 5.1 Integrasi dengan basis data (IT)

Berjalan pada basis data uji; dilewati bila `DATABASE_URL` tidak diizinkan (lihat `vitest.config.mts`).

#### `basis-data.test.ts`

- **Unit yang diuji:** -
- **Sumber rencana uji:** Uji integrasi pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| IT-basisData-01 | nilai tidak sah | berkas: simpan dan ambil (adaptor bytea bila tanpa token Blob) | sesuai harapan (2199 ms) | Lulus |
| IT-basisData-02 | nilai sah | log_audit: hanya bisa ditambah | sesuai harapan (3401 ms) | Lulus |

#### `idempotensi.test.ts`

- **Unit yang diuji:** -
- **Sumber rencana uji:** Uji integrasi pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| IT-idempotensi-01 | nilai sah | kotak masuk BIMA: kunci yang sama tidak menambah baris ganda (keputusan dan penugasan) | sesuai harapan (2937 ms) | Lulus |
| IT-idempotensi-02 | nilai sah | kotak masuk BIMA: dua permintaan serentak untuk kelompok yang sama menghasilkan satu baris per kunci | sesuai harapan (2613 ms) | Lulus |
| IT-idempotensi-03 | nilai sah | jalan pintas UC-05b: naskah BIMA dipulihkan ke seed pada pemakaian berulang | sesuai harapan (12955 ms) | Lulus |

#### `pengajuan-db.test.ts`

- **Unit yang diuji:** -
- **Sumber rencana uji:** Uji integrasi pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| IT-pengajuan-01 | nilai sah | contoh A: semua butir lolos, proposal Terkirim dengan bukti pengiriman | sesuai harapan (16907 ms) | Lulus |
| IT-pengajuan-02 | nilai sah | token yang sama tidak membuat versi ganda | sesuai harapan (15487 ms) | Lulus |
| IT-pengajuan-03 | batas bawah / atas | contoh B: Ditahan, butir gagal paling atas dengan bagian dan batas; diajukan ulang tanpa batas token membuat versi baru | sesuai harapan (29193 ms) | Lulus |
| IT-pengajuan-04 | nilai tidak sah | contoh C lalu masa ditutup: Ditahan, kemudian Ditolak tanpa versi baru (3a) | sesuai harapan (21042 ms) | Lulus |
| IT-pengajuan-05 | nilai sah | proposal milik pengusul lain tidak dapat dibuka atau diajukan | sesuai harapan (257 ms) | Lulus |

#### `penilaian-reviewer.test.ts`

- **Unit yang diuji:** -
- **Sumber rencana uji:** Uji integrasi pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| IT-penilaian-01 | nilai sah | UC-09: jalankanPemeriksaanSemantik menyimpan hasil per butir semantik, kutipan sah, berlabel tiruan | sesuai harapan (3936 ms) | Lulus |
| IT-penilaian-02 | nilai sah | NFR 3.1: reviewer lain mendapat 403; reviewer pemilik lolos | sesuai harapan (1355 ms) | Lulus |
| IT-penilaian-03 | nilai sah | J-07 hanya memuat penugasan milik sendiri | sesuai harapan (498 ms) | Lulus |
| IT-penilaian-04 | nilai tidak sah | J-08 memuat tab, butir, dan membuka cepat tanpa LLM (NFR 2.3) | sesuai harapan (5474 ms) | Lulus |
| IT-penilaian-05 | nilai tidak sah | UC-08: koreksi tanpa alasan ditolak; dengan alasan tersimpan dan rekomendasi semula tidak berubah | sesuai harapan (4988 ms) | Lulus |
| IT-penilaian-06 | nilai tidak sah | S-1: simpan sementara memberi label Draf tanpa log audit dan tanpa kirim ke BIMA | sesuai harapan (3437 ms) | Lulus |
| IT-penilaian-07 | nilai sah | simpan permanen menolak komponen belum lengkap; lengkap -> Final, Selesai, log audit, terkirim ke BIMA | sesuai harapan (8346 ms) | Lulus |

#### `penugasan-pemantauan-db.test.ts`

- **Unit yang diuji:** -
- **Sumber rencana uji:** Uji integrasi baca-saja pada basis data bersama (dilewati bila tidak ada basis data uji). Sumber: use-case testing UC-03 s.1 dan UC-04/J-05b.
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| IT-penugasanDb-01 | nilai sah | daftar periode ditutup hanya memuat periode ditutup dengan hitungan tak negatif | sesuai harapan (2042 ms) | Lulus |
| IT-penugasanDb-02 | tipe salah / nilai janggal | id periode tidak sah atau tidak ada menghasilkan null | sesuai harapan (299 ms) | Lulus |
| IT-pemantauanDb-01 | tipe salah / nilai janggal | rincian proposal yang tidak ada menghasilkan null | sesuai harapan (614 ms) | Lulus |
| IT-pemantauanDb-02 | nilai sah | rincian proposal contoh dapat dibuka lewat idProposal BIMA maupun id baris | sesuai harapan (3517 ms) | Lulus |

#### `templat-aturan-db.test.ts`

- **Unit yang diuji:** -
- **Sumber rencana uji:** Uji integrasi pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| IT-templatAturan-01 | nilai sah | S-1: skema baru belum punya templat; Susun Versi Baru membuat versi 1 | sesuai harapan (5146 ms) | Lulus |
| IT-templatAturan-02 | nilai sah | S-2, 9a, lalu terbit: butir turunan berstatus Draf dan terkunci | sesuai harapan (9216 ms) | Lulus |
| IT-templatAturan-03 | nilai tidak sah | 4a: butir turunan templat ditolak diubah dan tidak dapat dinonaktifkan | sesuai harapan (1215 ms) | Lulus |
| IT-templatAturan-04 | nilai tidak sah | menambah, mengubah, dan menonaktifkan butir manual; kode ganda ditolak | sesuai harapan (9958 ms) | Lulus |
| IT-templatAturan-05 | nilai sah | Uji pada Contoh tidak melempar galat walau pemeriksa belum tersedia | sesuai harapan (2871 ms) | Lulus |
| IT-templatAturan-06 | nilai tidak sah | 8a: tanggal berlaku di tengah masa pengusulan ditolak; di luar rentang disimpan dan semua butir Aktif | sesuai harapan (4998 ms) | Lulus |
| IT-templatAturan-07 | nilai sah | templat versi 2: versi lama Arsip, butir turunan lama Nonaktif pada draf, butir baru Draf | sesuai harapan (9834 ms) | Lulus |

#### `templat-hapus-draf-db.test.ts`

- **Unit yang diuji:** -
- **Sumber rencana uji:** Uji integrasi hapusDraf pada basis data (dilewati bila tidak ada basis data uji; lihat vitest.config.mts).
- **Tujuan:** menjalankan setiap butir sumber di atas sebagai satu uji dengan satu kasus atau lebih; tiap baris di bawah adalah satu uji.

| ID | Jenis kasus | Kasus uji dan hasil yang diharapkan | Hasil aktual | Lulus/Gagal |
|---|---|---|---|---|
| IT-hapusDraf-01 | nilai sah | siapkan skema dengan satu templat Arsip, Terbit, dan Draf | dilewati (butuh basis data uji) | Dilewati |
| IT-hapusDraf-02 | nilai tidak sah | bukan pengelola ditolak dan draf tetap ada | dilewati (butuh basis data uji) | Dilewati |
| IT-hapusDraf-03 | nilai tidak sah | Terbit dan Arsip ditolak dan tidak berubah | dilewati (butuh basis data uji) | Dilewati |
| IT-hapusDraf-04 | nilai tidak sah | id tidak ada dan id bukan uuid ditolak | dilewati (butuh basis data uji) | Dilewati |
| IT-hapusDraf-05 | nilai sah | Draf terhapus beserta bagiannya; templat Terbit dan Arsip tidak berubah | dilewati (butuh basis data uji) | Dilewati |

### 5.2 *Use-case testing* (e2e per UC dan alur bolak-balik)

Dijalankan dengan `npm run e2e` (puppeteer-core, Chrome lokal) terhadap `next start`, mode LLM tiruan. Sumber: *real use case* tiap UC dan *use scenario*. Dijalankan: 2026-10-22T21:48:21.954Z. Sasaran: server lokal (next start). Mode LLM: tiruan. Hasil: 29 dari 29 skenario lulus.

Tangkapan layar setiap layar dan modal pada lebar 1440 dan 390 px ada di `docs/bukti-e2e/`.

| Skenario | Sumber | Hasil | Catatan hasil aktual |
|---|---|---|---|
| Beranda diarahkan ke J-01 Masuk | Alur jendela (docs/peta-uc-jendela.md) | lulus | / menuju J-01; J-01 memuat Masuk dengan akun BIMA dan tautan Buka Pusat Demo; tanpa galat konsol (0.7 dtk) |
| /demo: Reset & isi data demo lewat modal konfirmasi | Alur jendela (docs/peta-uc-jendela.md) | lulus | modal konfirmasi Reset & isi data demo, seed berhasil; sakelar masa pengusulan berpindah ke berjalan; tanpa galat konsol (23.0 dtk) |
| SSO J-01 dan guard peran | Alur jendela (docs/peta-uc-jendela.md) | lulus | anggota Tim Kerja masuk ke J-04; anggota diarahkan dengan ?galat=akses saat membuka J-02; tanpa galat konsol (5.2 dtk) |
| UC-05a: proposal lolos semua butir (Terkirim) dan unduh templat di BIMA | Real use case UC-05 (use-case testing) | lulus | BIMA Unduh Templat: 200, document, 10807 byte; J-06 menampilkan Terkirim, daftar butir Lolos, Bukti pengiriman, Kembali ke BIMA; tanpa galat konsol (44.1 dtk) |
| UC-05b / UC-06: ada butir gagal (Ditahan), diperbaiki lalu Terkirim V2 | Real use case UC-05 (use-case testing) | lulus | butir Gagal paling atas: Bagian "Metode" tidak melebihi 1000 kata KTA-04 Gagal Metode 1.233 kata dari batas 1.000 (lebih 233 kata) Bagian "Metode; tombol Kembali ke BIMA berfungsi; S-1.3/S-1.4: ajukan ulang dengan naskah perbaikan menghasilkan Terkirim, kode versi V2, bukti pengiriman; tanpa galat konsol (123.4 dtk) |
| UC-05c: ditahan lalu ditolak karena masa pengusulan ditutup (3a) | Real use case UC-05 (use-case testing) | lulus | Ditahan lebih dulu, lalu Ditolak setelah masa ditutup; pesan 3a.2 memuat tanggal tutup (23 Oktober 2026); tanpa galat konsol (44.8 dtk) |
| UC-01: menyusun templat (J-02, J-02b, S-2, M-01, jalur utama) | Real use case UC-01 (use-case testing) | lulus | J-02: Unduh Templat (.docx) menghasilkan 200 dan tipe .docx; S-2: pesan Lengkapi isian yang ditandai, isian bertanda mendapat fokus, M-01 tidak terbuka; J-02b: Unduh Pratinjau (.docx) menyimpan draf lalu mengunduh; M-01: ringkasan versi, Batal menutup modal tanpa menerbitkan; jalur utama: M-01 Terbitkan, hasil s.10 tampil di J-02 dengan jumlah butir draf, Buka Aturan Pemeriksaan, Unduh Templat (.docx); tanpa galat konsol (31.5 dtk) |
| UC-01 9a: masa berjalan, draf disimpan, Buka Draf, Back | Real use case UC-01 (use-case testing) | lulus | pesan 9a persis, Buka Draf dan Unduh Pratinjau (.docx); templat berlaku tidak berubah; Simpan Draf di J-02b, tombol Back kembali ke J-02 dengan pesan 9a (hasil ada di URL); tanpa galat konsol (22.3 dtk) |
| UC-01 S-1: skema belum punya templat | Real use case UC-01 (use-case testing) | lulus | S-1: keterangan Skema ini belum memiliki templat; Susun Versi Baru membuka J-02b untuk versi 1; tanpa galat konsol (9.9 dtk) |
| UC-02: aturan pemeriksaan (J-03, M-02 galat, M-04 4a, J-03b, M-03, M-05 8a) | Real use case UC-02 (use-case testing) | lulus | 4a: M-04 memuat pesan penolakan dan Buka Templat Proposal; form butir tidak dibuka; Tutup menutup modal; M-02: isian wajib kosong ditandai di dekat isiannya, modal tetap terbuka; butir manual semantik ditambahkan lewat M-02; J-03b: layar sendiri dengan ringkasan per contoh, tabel butir x contoh, Uji Ulang dan Kembali ke Aturan Pemeriksaan; kode butir di J-03b menaut ke baris J-03 yang tergulir ke layar; Back dari J-03 kembali ke J-03b; M-03: Nonaktifkan butir manual; butir nonaktif tersembunyi dengan pilihan Tampilkan butir nonaktif; 8a: tanggal berlaku di tengah masa pengusulan ditolak di dalam M-05; jalur utama: M-05 Simpan Versi menampilkan basis aturan versi baru tersimpan; tanpa galat konsol (33.1 dtk) |
| UC-03: menugaskan reviewer (J-04, J-04b, S-1, M-06 S-2, M-07, Back) | Real use case UC-03 (use-case testing) | lulus | S-1: panel Kekurangan Reviewer tampil; tabel Usulan Penugasan (6 baris), Sebaran Beban, judul proposal menaut ke J-05b; S-2: pemindahan ke reviewer sealmamater ditolak, syarat tampil di dalam M-06; pemindahan yang memenuhi syarat mengganti reviewer dan menutup M-06; M-07: pesan ditetapkan dan tercatat di BIMA dengan tautan ke J-05 dan kotak masuk BIMA; kotak masuk BIMA tiruan menerima penugasan; Back dari kotak masuk BIMA kembali ke J-04b yang memuat penugasan ditetapkan; tanpa galat konsol (74.1 dtk) |
| UC-04: memantau kesesuaian (J-05, M-08, M-09, tautan ke J-03 dan J-05b) | Real use case UC-04 (use-case testing) | lulus | tiga bagian laporan tampil; M-08 (sheet) terbuka, butir di URL; judul proposal di sheet menaut ke /tim-kerja/proposal/b32e8cc8-d194-489a-a3bc-05ea4239703d; M-09: butir yang ditandai berlabel Perlu ditinjau dan tampil di J-03 lewat tautan Buka Aturan Pemeriksaan; tanpa galat konsol (48.5 dtk) |
| J-05b: rincian proposal, tautan antarentitas, unduh berkas | Alur jendela (docs/peta-uc-jendela.md) | lulus | Unduh Berkas: 4 berkas, semua status 200; Kembali ke Pemantauan membuka J-05; Back kembali ke J-05b; periode menaut ke J-04b; tanpa galat konsol (17.2 dtk) |
| UC-07a: menyetujui seluruh rekomendasi, J-08b dan M-11 Simpan Permanen | Real use case UC-07 (use-case testing) | lulus | komponen belum diputuskan ditandai dengan teks, M-11 tidak terbuka; rekomendasi tidak dikoreksi dihitung disetujui; Simpan Permanen terkirim ke BIMA, isian hanya-baca; tanpa galat konsol (24.1 dtk) |
| UC-07c: menyimpan sementara lalu melanjutkan (Draf sudah terisi) | Real use case UC-07 (use-case testing) | lulus | J-07 berlabel Draf; J-08b memuat ulang umpan balik dan keputusan komponen tersimpan; tanpa galat konsol (12.9 dtk) |
| UC-07b/UC-08: pemeriksaan reviewer (J-08, M-10 S-1 dan 4a, J-08b Simpan Sementara dan Permanen) | Real use case UC-07 (use-case testing) | lulus | J-08 terbuka dalam 2.6 dtk; Unduh Berkas di J-08: 200 (application/vnd.openxmlformats-officedocument.wordprocessingml.document); butir menyorot kutipan (mark); butir dan tab tersimpan di URL sehingga muat ulang mempertahankannya; S-1: pesan Alasan koreksi wajib diisi dengan bingkai merah di dalam M-10; 4a: Batal menutup M-10; koreksi tersimpan dan butir berlabel Dikoreksi reviewer; Simpan Sementara menghasilkan label Draf di J-07; draf dan koreksi dimuat ulang saat Periksa lagi (J-07 ke J-08 ke J-08b); Simpan Permanen (M-11): terkirim ke BIMA, isian hanya-baca; tanpa galat konsol (45.9 dtk) |
| UC-09 S-1: kutipan LLM tidak ditemukan (Perlu diperiksa manual) | Real use case UC-09 (use-case testing) | lulus | label Perlu diperiksa manual tampil pada butir yang kutipannya tidak ditemukan; tanpa galat konsol (11.0 dtk) |
| UC-09 S-2: LLM tidak merespons (Belum ada rekomendasi) | Real use case UC-09 (use-case testing) | lulus | label Belum ada rekomendasi tampil; reviewer tetap dapat menilai; tanpa galat konsol (11.3 dtk) |
| Hak akses: 403 reviewer lain di J-08, J-08b, berkas; Tim Kerja boleh | NFR 3.2 (hak akses) dan aturan unduhan berkas | lulus | halaman J-08 milik reviewer lain menampilkan 403 Akses ditolak; route data 403; J-08b 404; unduh berkas proposal 403; reviewer tidak dapat membuka J-05b (diarahkan dengan ?galat=akses); Tim Kerja mengunduh berkas (200); tanpa sesi tidak dapat; tanpa galat konsol (11.1 dtk) |
| Jalan pintas UC-06, UC-08, UC-09 membuka jendela yang benar | Real use case UC-06 (use-case testing) | lulus | UC-06 membuka halaman pengajuan BIMA (proposal gagal jumlah kata); UC-08 dan UC-09 membuka J-08 langsung; panel langkah lama tidak ada lagi; navigator menggantikannya; tanpa galat konsol (28.3 dtk) |
| Alur bolak-balik: J-02, J-02b, M-01, unduh .docx, J-03, BIMA, J-06, kembali ke J-02 | Use scenario lintas UC-01, UC-02, UC-05, UC-06 dan alur bolak-balik (docs/arah-perbaikan-2026-10-22.md bagian 3) | lulus | J-02b: pratinjau .docx dari draf yang baru disimpan memuat judul bagian baru; J-02: Unduh Templat (.docx) memuat "Dampak Sosial E2E" sebagai judul bagian; J-03: butir turunan templat baru muncul; BIMA pengajuan: Unduh Templat memuat bagian baru; J-06: butir bagian baru diperiksa dan Gagal (naskah lama tidak memuat bagian itu), status Ditahan; J-02: Riwayat Versi memuat Terbit dan Arsip; versi Arsip dapat dibuka dan diunduh tanpa bagian baru; tanpa galat konsol (98.8 dtk) |
| Reset data demo sesudah alur bolak-balik | Use scenario lintas UC-01, UC-02, UC-05, UC-06 dan alur bolak-balik (docs/arah-perbaikan-2026-10-22.md bagian 3) | lulus | data demo dipulihkan; tanpa galat konsol (19.8 dtk) |
| Navigator demo: pindah layar/peran tidak mengubah data; 15 layar dapat dibuka | Pusat Demo dan Navigator (docs/peta-uc-jendela.md) | lulus | navigator memuat 15 layar dan menandai J-03 sebagai layar yang dibuka; pindah layar/peran (J-04b ke J-07 ke J-04b) tidak mengubah data usulan; J-01..J-08b dan dua halaman BIMA dapat dibuka dari navigator lewat Pindah layar; tanpa galat konsol (107.8 dtk) |
| Navigator demo: skenario J-04 dan J-04b, aktif ditampilkan, Pasang skenario menyiapkan data | Pusat Demo dan Navigator (docs/peta-uc-jendela.md) | lulus | J-04 Kosong: daftar periode tampil, pil dan panel menyebut skenario aktif, 6 skenario; J-04 siap-kecil: daftar periode menampilkan enam proposal belum ditugaskan; J-04b siap: enam proposal; navigator ciut tidak menutupi isian Batas Beban; pil di jendela yang dibuka lewat menu tidak menyebut skenario jendela lain (J-05 · skenario belum dipilih); J-04b menunggu: tabel Usulan Penugasan terisi; J-04b kekurangan: Susun otomatis dan panel Kekurangan Reviewer tampil; J-04b ditetapkan: penugasan tampil dan tercatat di kotak masuk BIMA; tanpa galat konsol (134.0 dtk) |
| Navigator demo: skenario di J-01, J-02, J-03, J-05, J-06, J-07, J-08, BIMA | Pusat Demo dan Navigator (docs/peta-uc-jendela.md) | lulus | J-01: belum masuk, masuk sebagai anggota (menu J-04/J-05 saja), masuk sebagai reviewer (J-07); J-02: tanpa templat (S-1), masa berjalan (9a), draf tersimpan; J-02b membuka draf di layar penyusunan; J-03: butir Perlu ditinjau muncul pada skenario khusus dan hilang pada normal; J-03b membuka laporan uji; J-05: belum ada penilaian final lalu data pemantauan contoh; J-06: Terkirim, Ditahan, Ditolak, dan Sedang diperiksa; J-07: kosong, Baru, Draf, Selesai; J-08: final hanya-baca, perlu diperiksa manual, belum ada rekomendasi, draf, normal; BIMA tiruan: halaman pengajuan membuka draf siap diajukan; tanpa galat konsol (287.2 dtk) |
| Navigator demo: sakelar masa pengusulan, papan ketik, dan ciut | Pusat Demo dan Navigator (docs/peta-uc-jendela.md) | lulus | sakelar masa pengusulan di navigator mengganti keadaan J-04b (berjalan lalu ditutup); papan ketik: Esc menciutkan, Alt+Shift+N membuka, fokus pindah ke panel, Tab menjangkau tombol; navigator ciut tidak menutupi tombol utama di J-04b (viewport 1440x900); tanpa galat konsol (16.6 dtk) |
| J-04 skala nyata: 10.000 proposal (S-1, susun, halaman dan Back, sebaran, M-07 tetapkan, kotak masuk BIMA) | NFR kinerja: 10.000 proposal (UC-03) | lulus | menyiapkan skenario skala nyata (buka J-04): 15.1 dtk; S-1 batas 60: panel Kekurangan Reviewer tampil (12.9 dtk); Susun Usulan Penugasan 10.000 proposal: 15.4 dtk dari klik sampai pesan (Waktu proses di server: 11,7 detik); tabel Usulan Penugasan 50 baris dari 10.000 (halaman 1 dari 200); Sebaran Beban 119 reviewer, 119 reviewer bersedia; proposal per reviewer terendah 84, tertinggi 85, rata-rata 84, batas 100.; halaman 2 usulan terbuka dalam 1.8 dtk; hal=2 di URL; Back kembali ke halaman 1; Tetapkan Penugasan 10.000 proposal: 5.2 dtk dari klik sampai pesan (Waktu proses di server: 4,8 detik); kotak masuk BIMA: 10.000 penugasan diterima tanpa ganda, ringkasan + 100 pesan terbaru; CATATAN WAKTU: susun 15.4 dtk, tetapkan 5.2 dtk (klik sampai pesan, lokal ke Neon); tanpa galat konsol (60.0 dtk) |
| Skenario kecil tidak terpengaruh data skala nyata | NFR kinerja: 10.000 proposal (UC-03) | lulus | skenario J-04b siap sesudah skala nyata: 7.0 dtk; 5 reviewer bersedia; proposal per review; J-07 Semua Selesai dan Baru tepat 1 baris; kotak masuk B-2 tetap memuat 10000 penugasan; /bima/masuk menyembunyikan akun skala (11 akun tampil); tanpa galat konsol (27.3 dtk) |
| Akhir: Reset & isi data demo (basis data bersih) | Alur jendela (docs/peta-uc-jendela.md) | lulus | reset selesai; /demo memuat 44 kartu skenario per jendela dan tanpa navigator mengambang; tanpa galat konsol (19.9 dtk) |

## 6. Uji kinerja

- **Susun usulan 10.000 proposal:** KP-susunUsulanMurniSkala-01..02 (fungsi murni `susunPenugasan`, kurang dari 3 detik) pada bagian 4.
- **J-04b skala nyata:** skenario e2e "J-04 skala nyata" (10.000 proposal, sekitar 130 reviewer dari 40 institusi): Susun Usulan Penugasan, tabel berhalaman 50 baris, Tetapkan Penugasan, dan penerimaan di kotak masuk BIMA; catatan waktu ada pada baris skenarionya di bagian 5.2.
- **Pembukaan J-08 (NFR 2.3, batas 3 detik):** diukur di skenario e2e UC-07b/UC-08.

## 7. Cakupan

`npm run test:coverage` mengukur cakupan cabang untuk `src/lib/**` kecuali `src/lib/demo/**` dan pengecualian lain di `vitest.config.mts`; ambang minimum 80%. Angka per modul ada di `docs/laporan-uji.md`.
