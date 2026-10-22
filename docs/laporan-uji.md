# Laporan uji SEMAR

Dibangkitkan otomatis oleh `npm run laporan-uji` pada 23 Oktober 2026 pukul 04.56 WIB. Jangan disunting tangan.

Pendekatan: uji unit dua jenis menurut Dennis dkk. (2015, hlm. 471-475). *Black box* (KH, `tests/unit/kotak-hitam/`) diturunkan dari kontrak, kartu CRC, *state machine*, dan *real use case*; *white box* (KP, `tests/unit/kotak-putih/`) diturunkan dari spesifikasi metode dan menjalankan setiap cabang; tes integrasi (IT, `tests/integrasi/`) berjalan pada basis data uji dan dilewati bila tidak tersedia. Stub BIMA dan LLM ada di `tests/unit/stub/`.

## Ringkasan

| Jenis | Lulus | Gagal | Dilewati |
|---|---:|---:|---:|
| Kotak hitam (KH) | 272 | 0 | 1 |
| Kotak putih (KP) | 174 | 0 | 0 |
| Integrasi (IT) | 28 | 0 | 0 |
| Tanpa ID | 32 | 0 | 0 |

Cakupan cabang `src/lib/**` (kecuali pengecualian di `vitest.config.mts`): **91,3%** (850 dari 931 cabang); ambang minimum 80% (terpenuhi). Pernyataan 97,1%, fungsi 97,2%, baris 97,2%.

## Cakupan cabang per modul

| Modul | Cabang tercakup | Persen |
|---|---:|---:|
| `src/lib/(berkas langsung)` | 38 / 43 | 88,4% |
| `src/lib/aturan` | 98 / 99 | 99,0% |
| `src/lib/bima` | 22 / 33 | 66,7% |
| `src/lib/pemantauan` | 71 / 94 | 75,5% |
| `src/lib/pemeriksa` | 246 / 276 | 89,1% |
| `src/lib/pengajuan` | 222 / 228 | 97,4% |
| `src/lib/penilaian` | 30 / 30 | 100,0% |
| `src/lib/penugasan` | 58 / 62 | 93,5% |
| `src/lib/templat` | 65 / 66 | 98,5% |

## Hasil aktual per ID

### Kotak hitam (KH)

| ID | Kasus | Berkas | Hasil aktual |
|---|---|---|---|
| KH-alamatDemo-01 | pindah layar memakai /demo/pindah, pasang skenario memakai /demo/mulai | `pengajuan-katalog-demo.test.ts` | Lulus |
| KH-alamatDemo-02 | setiap layar punya alamat pindah, kode unik, dan layar turunan menyebut induk yang ada | `pengajuan-katalog-demo.test.ts` | Lulus |
| KH-alamatDemo-03 | skenario layar turunan dikenal (siap dipasang lewat /demo/mulai) | `pengajuan-katalog-demo.test.ts` | Lulus |
| KH-bentukNamaBerkas-01 | aksen dihilangkan, spasi menjadi garis bawah, karakter terlarang diganti | `unduhan-akses.test.ts` | Lulus |
| KH-bentukNamaBerkas-02 | nama kosong atau semua simbol memakai cadangan | `unduhan-akses.test.ts` | Lulus |
| KH-bersihkanIsianDraf-01 | isian lengkap disimpan apa adanya (nilai sah) dan tetap lolos periksaKelengkapan | `templat-draf.test.ts` | Lulus |
| KH-bersihkanIsianDraf-02 | baris bagian tanpa nama dan lampiran kosong dibuang; draf kosong sah | `templat-draf.test.ts` | Lulus |
| KH-bersihkanIsianDraf-03 | batas kata tidak sah (di bawah batas, huruf, desimal) menjadi tanpa batas | `templat-draf.test.ts` | Lulus |
| KH-bersihkanIsianDraf-04 | spasi di nama dan batas dipangkas; batas tepat 1 sah (batas bawah) | `templat-draf.test.ts` | Lulus |
| KH-bolehUnduhBerkasProposal-01 | Tim Kerja selalu boleh | `unduhan-akses.test.ts` | Lulus |
| KH-bolehUnduhBerkasProposal-02 | reviewer hanya bila ditugaskan pada proposal itu | `unduhan-akses.test.ts` | Lulus |
| KH-bolehUnduhBerkasProposal-03 | pengusul tidak boleh walau punya penugasan palsu | `unduhan-akses.test.ts` | Lulus |
| KH-buatDokumenTemplat-01 | hasilnya .docx yang valid (ZIP berkepala PK) dan tidak kosong | `templat-dokumen.test.ts` | Lulus |
| KH-buatDokumenTemplat-02 | terbaca balik, bagian sama dan urutan sama; judul berhuruf A. JUDUL dst.; tempat isian kosong | `templat-dokumen.test.ts` | Lulus |
| KH-buatDokumenTemplat-03 | berkas memuat kalimat petunjuk resmi (batas dari templat), tempat isian [ … ], judul skema dan lampiran | `templat-dokumen.test.ts` | Lulus |
| KH-buatDokumenTemplat-04 | bagian Kata Kunci dan Daftar Pustaka ditambahkan bila templat belum memuatnya | `templat-dokumen.test.ts` | Lulus |
| KH-buatDokumenTemplat-05 | urutan bagian mengikuti nomor urutan, bukan urutan larik masukan | `templat-dokumen.test.ts` | Lulus |
| KH-buatDokumenTemplat-06 | isian pengusul di bawah petunjuk terbaca balik tanpa petunjuk dan tanpa tanda [ ] | `templat-dokumen.test.ts` | Lulus |
| KH-butirTerkunci-01 | butir berasal dari templat terkunci, butir manual tidak | `aturan-status.test.ts` | Lulus |
| KH-butirTerkunci-02 | pesan 4a persis seperti spesifikasi UI | `aturan-status.test.ts` | Lulus |
| KH-cekKataKunci-01 | tepat lima dipisah titik koma, boleh frasa | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekKataKunci-02 | enam gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekKataKunci-03 | dipisah koma dikenali sebagai pemisah salah | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekKataKunci-04 | kosong gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekKataKunci-05 | empat kata kunci gagal (satu di bawah) dengan angka pembukti | `deterministik-batas.test.ts` | Lulus |
| KH-cekKataKunci-06 | lima kata kunci lolos | `deterministik-batas.test.ts` | Lulus |
| KH-cekKataKunci-07 | enam kata kunci gagal (satu di atas) dan batas dilanggar menyebut 6 | `deterministik-batas.test.ts` | Lulus |
| KH-cekKataKunci-08 | pemisah salah (garis tegak) terbaca satu kata kunci dan gagal | `deterministik-batas.test.ts` | Lulus |
| KH-cekKataKunci-09 | hanya spasi atau null dianggap tidak ditemukan | `deterministik-batas.test.ts` | Lulus |
| KH-cekKataKunci-10 | pemisah berlebih di ujung dan segmen kosong tidak dihitung (nilai janggal tetapi sah) | `deterministik-batas.test.ts` | Lulus |
| KH-cekKataKunci-11 | jumlah diminta lain (tiga, pemisah koma) mengikuti parameter butir | `deterministik-batas.test.ts` | Lulus |
| KH-cekLampiran-01 | lampiran ada lolos tanpa membedakan huruf besar dan spasi ganda | `deterministik-batas.test.ts` | Lulus |
| KH-cekLampiran-02 | tanpa lampiran terunggah gagal dan menyebut 0 dari 2 | `deterministik-batas.test.ts` | Lulus |
| KH-cekLampiran-03 | daftar lampiran wajib templat kosong memakai nama butir sebagai satu-satunya wajib | `deterministik-batas.test.ts` | Lulus |
| KH-cekLampiran-04 | lampiran yang diunggah bernama lain tidak memenuhi | `deterministik-batas.test.ts` | Lulus |
| KH-cekLampiranStruktur-01 | lampiran belum ada disebut dengan nama | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-02 | judul bagian berhuruf Isian Substansi (A. JUDUL ... H. DAFTAR PUSTAKA) dikenali | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-03 | bagian hilang dan urutan salah gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-04 | judul beda dari BIMA gagal, perbedaan huruf besar dan tanda baca lolos | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-05 | diagram alir butuh keterangan gambar yang menyebutnya | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-06 | butir tanpa parameter gagal tertutup | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekMasaPengusulan-01 | di tengah masa dengan sakelar berjalan | `deterministik-batas.test.ts` | Lulus |
| KH-cekMasaPengusulan-02 | tepat pada tanggal tutup masih berjalan (inklusif) | `deterministik-batas.test.ts` | Lulus |
| KH-cekMasaPengusulan-03 | satu milidetik sesudah tanggal tutup ditutup | `deterministik-batas.test.ts` | Lulus |
| KH-cekMasaPengusulan-04 | tepat pada tanggal buka berjalan, satu milidetik sebelumnya belum | `deterministik-batas.test.ts` | Lulus |
| KH-cekMasaPengusulan-05 | sakelar ditutup menang walau tanggal di dalam rentang | `deterministik-batas.test.ts` | Lulus |
| KH-cekMasaPengusulan-06 | tanggal tidak sah (Invalid Date) tidak pernah dianggap berjalan | `deterministik-batas.test.ts` | Lulus |
| KH-cn-01 | menggabungkan kelas dan membuang nilai palsu | `utils.test.ts` | Lulus |
| KH-cn-02 | kelas Tailwind yang bentrok: yang terakhir menang | `utils.test.ts` | Lulus |
| KH-cn-03 | masukan bersyarat berbentuk objek dan larik | `utils.test.ts` | Lulus |
| KH-cn-04 | tanpa masukan menghasilkan string kosong | `utils.test.ts` | Lulus |
| KH-cocokkanKutipan-01 | abaikan perbedaan spasi dan baris baru, tetapi persis pada kata | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanKutipan-02 | mengembalikan rentang di teks asli | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanKutipan-03 | karakter regex dalam kutipan tidak merusak pencarian | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanKutipan-04 | tanda kutip lengkung di teks cocok dengan tanda kutip lurus dari LLM, dan sebaliknya | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanKutipan-05 | rentang yang dikembalikan menunjuk teks asli (tanda kutip lengkung tetap ada) | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanKutipan-06 | batas bawah dan tipe salah: kosong, spasi saja, null, undefined tidak cocok | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanKutipan-07 | nilai janggal: tanda kutip yang hilang atau beda jenis (apostrof vs kutip ganda) tidak cocok | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanKutipan-08 | kutipan lebih panjang dari teks tidak cocok; kutipan sama persis dengan seluruh teks cocok | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanSitasi-01 | sitasi gaya nama-tahun gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-02 | rentang dan daftar nomor diperluas | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-03 | urutan pengutipan pertama yang melompat gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-04 | nomor entri daftar pustaka loncat gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-05 | nomor dikutip tanpa entri dilaporkan | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-06 | tanpa Daftar Pustaka gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-07 | sitasi bernomor saja lolos | `deterministik-batas.test.ts` | Lulus |
| KH-cocokkanSitasi-08 | naskah tanpa satu pun sitasi bernomor gagal | `deterministik-batas.test.ts` | Lulus |
| KH-cocokkanSitasi-09 | nama-tahun dengan 'dkk.' dan 'et al.' terdeteksi | `deterministik-batas.test.ts` | Lulus |
| KH-cocokkanSitasi-10 | jumlah entri sama dengan jumlah nomor dikutip lolos; entri tidak dikutip gagal | `deterministik-batas.test.ts` | Lulus |
| KH-cocokkanSitasi-11 | Daftar Pustaka kosong gagal pada jumlah_referensi_sama dan pustaka_berurutan | `deterministik-batas.test.ts` | Lulus |
| KH-cocokkanSitasi-12 | entri pustaka berformat '1.' dan '1)' dikenali, baris lanjutan digabung | `deterministik-batas.test.ts` | Lulus |
| KH-cocokkanStrukturJudul-01 | bagian_wajib ada lolos, tidak ada gagal dengan nama bagian | `deterministik-batas.test.ts` | Lulus |
| KH-cocokkanStrukturJudul-02 | judul naskah kosong gagal pada judul_sama | `deterministik-batas.test.ts` | Lulus |
| KH-cocokkanStrukturJudul-03 | struktur sama persis lolos; judul di luar templat dicatat tetapi tidak menggagalkan | `deterministik-batas.test.ts` | Lulus |
| KH-cocokkanStrukturJudul-04 | bagian opsional yang tidak ada tidak mengurangi bagian wajib | `deterministik-batas.test.ts` | Lulus |
| KH-dispositionUnduhan-01 | lampiran dengan filename ASCII dan filename* UTF-8 | `unduhan-akses.test.ts` | Lulus |
| KH-dispositionUnduhan-02 | tanda kutip dan pemisah baris tidak lolos ke header (pencegahan injeksi header) | `unduhan-akses.test.ts` | Lulus |
| KH-formatAngka-01 | pemisah ribuan titik | `utils.test.ts` | Lulus |
| KH-formatPersen-01 | memakai koma desimal | `pemantauan-rekap.test.ts` | Lulus |
| KH-formatTanggal-01 | tanggal valid ditulis hari bulan tahun menurut WIB; kosong menjadi tanda hubung | `utils.test.ts` | Lulus |
| KH-formatWaktu-01 | waktu ditutup dengan WIB; kosong menjadi tanda hubung | `utils.test.ts` | Lulus |
| KH-halamanDariUrl-01 | nilai sah dipakai apa adanya | `penugasan-periode.test.ts` | Lulus |
| KH-halamanDariUrl-02 | nol, negatif, dan bukan angka menjadi halaman 1 | `penugasan-periode.test.ts` | Lulus |
| KH-halamanDariUrl-03 | melampaui jumlah halaman dijepit ke halaman terakhir | `penugasan-periode.test.ts` | Lulus |
| KH-halamanDariUrl-04 | parameter berulang memakai nilai pertama; jumlah halaman 0 tetap halaman 1 | `penugasan-periode.test.ts` | Lulus |
| KH-hitungKata-01 | tidak menghitung tabel, gambar, dan keterangannya | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-hitungKata-02 | selaras dengan penghitung pembangkit contoh bila tanpa keterangan | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-hitungKata-03 | tanpa toleransi: tepat pada batas lolos, satu lebih gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-hitungKata-04 | teks kosong dan hanya spasi menghasilkan 0 kata | `deterministik-batas.test.ts` | Lulus |
| KH-hitungKata-05 | batas tepat lolos, satu di atas gagal, satu di bawah lolos (batas 100) | `deterministik-batas.test.ts` | Lulus |
| KH-hitungKata-06 | tabel dan gambar dalam bentuk penanda atau keterangan tidak dihitung | `deterministik-batas.test.ts` | Lulus |
| KH-hitungKata-07 | spasi ganda, tab, dan baris kosong tidak menambah hitungan | `deterministik-batas.test.ts` | Lulus |
| KH-hitungKata-08 | bagian yang tidak ditemukan dihitung 0 kata dan lolos dengan catatan | `deterministik-batas.test.ts` | Lulus |
| KH-hitungKata-09 | kata berangka dan tanda baca tetap satu kata per token | `deterministik-batas.test.ts` | Lulus |
| KH-hitungTingkatKoreksi-01 | tingkat koreksi = koreksi / hasil pada penilaian final per butir | `pemantauan-rekap.test.ts` | Lulus |
| KH-hitungTingkatKoreksi-02 | tingkat koreksi sama diurutkan menurut jumlah koreksi lalu kode | `pemantauan-rekap.test.ts` | Lulus |
| KH-isianSubstansi-01 | delapan bagian A-H berurutan dengan judul berhuruf besar | `templat-isian-substansi.test.ts` | Lulus |
| KH-isianSubstansi-02 | batas kata: Judul 20, Ringkasan 300, Pendahuluan 1000 (Dasar) atau 1500 (Terapan), Metode 1000, sisanya tanpa batas | `templat-isian-substansi.test.ts` | Lulus |
| KH-isianSubstansi-03 | seed data/contoh/templat.json sama persis dengan struktur Isian Substansi (Dasar dan Terapan) dan berlabel struktur Isian Substansi | `templat-isian-substansi.test.ts` | Lulus |
| KH-isianSubstansi-04 | kalimat petunjuk resmi per bagian, angka batas diisi dari batas kata bagian | `templat-isian-substansi.test.ts` | Lulus |
| KH-isianSubstansi-05 | batas kata null memakai batas resmi bawaan; bagian di luar Isian Substansi tanpa petunjuk resmi (null) | `templat-isian-substansi.test.ts` | Lulus |
| KH-isianSubstansi-06 | turunan templat Dasar: delapan butir bagian wajib, empat butir batas kata (Judul 20, Ringkasan 300, Pendahuluan 1000, Metode 1000), tiga lampiran | `templat-isian-substansi.test.ts` | Lulus |
| KH-isianSubstansi-07 | turunan templat Terapan: batas Pendahuluan 1500 | `templat-isian-substansi.test.ts` | Lulus |
| KH-isianSubstansi-08 | setiap bagian yang dirujuk butir katalog ada di templat Dasar dan Terapan; kata kunci tepat 5 dipisah titik koma | `templat-isian-substansi.test.ts` | Lulus |
| KH-itemAktif-01 | jalur layar dan layar turunannya menandai menu induk | `menu-peran.test.ts` | Lulus |
| KH-itemAktif-02 | J-05b (rincian proposal) menandai Pemantauan Kesesuaian | `menu-peran.test.ts` | Lulus |
| KH-itemAktif-03 | awalan serupa tetapi bukan segmen yang sama tidak cocok; jalur asing tidak menandai apa pun | `menu-peran.test.ts` | Lulus |
| KH-jendelaDariJalur-01 | layar induk dan layar turunan dibedakan | `pengajuan-katalog-demo.test.ts` | Lulus |
| KH-jendelaDariJalur-02 | layar lain dikenali, alamat tak dikenal tidak cocok dengan jendela mana pun | `pengajuan-katalog-demo.test.ts` | Lulus |
| KH-jumlahHalaman-01 | pembulatan ke atas, kosong = 1 halaman, ukuran tidak sah = 1 | `penugasan-periode.test.ts` | Lulus |
| KH-kepalaUnduhan-01 | memuat tipe, panjang, no-store, dan nosniff | `unduhan-akses.test.ts` | Lulus |
| KH-komponenBorang-01 | hanya komponen baku dengan keputusan sah | `penilaian-validasi.test.ts` | Lulus |
| KH-komponenBorang-02 | lengkap bila keenam komponen terisi | `penilaian-validasi.test.ts` | Lulus |
| KH-menuUntukPeran-01 | Tim Kerja pengelola melihat empat menu berurutan | `menu-peran.test.ts` | Lulus |
| KH-menuUntukPeran-02 | Tim Kerja non-pengelola hanya Penugasan dan Pemantauan | `menu-peran.test.ts` | Lulus |
| KH-menuUntukPeran-03 | reviewer hanya Daftar Penugasan | `menu-peran.test.ts` | Lulus |
| KH-menuUntukPeran-04 | pengusul tanpa menu | `menu-peran.test.ts` | Lulus |
| KH-namaBerkasTemplat-01 | nama bermakna memuat kode skema, versi, dan status | `templat-dokumen.test.ts` | Lulus |
| KH-namaBerkasTemplat-02 | kode skema dengan karakter janggal dibersihkan; kode kosong memakai cadangan | `templat-dokumen.test.ts` | Lulus |
| KH-namaBerkasTemplat-03 | tipe media DOCX baku | `templat-dokumen.test.ts` | Lulus |
| KH-penilaianStatus-01 | Draf dapat tetap Draf (Simpan Sementara) dan dapat menjadi Final (Simpan Permanen) | `penilaian-status.test.ts` | Lulus |
| KH-penilaianStatus-02 | Final tidak dapat diubah ke keadaan mana pun, termasuk kembali ke Draf | `penilaian-status.test.ts` | Lulus |
| KH-penilaianStatus-03 | isian (komponen, umpan balik, koreksi) hanya dapat diubah saat Draf | `penilaian-status.test.ts` | Lulus |
| KH-penilaianStatus-04 | nilai janggal (keadaan tidak dikenal) tidak pernah diizinkan bertransisi atau diubah | `penilaian-status.test.ts` | Lulus |
| KH-periksaDeterministikTeks-01 | contoh A: semua butir deterministik lolos | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-periksaDeterministikTeks-02 | contoh B: hanya jumlah kata bagian Metode yang gagal, dengan angka pembukti | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-periksaDeterministikTeks-03 | contoh C: kata kunci (4 dari 5) dan jumlah referensi (9 entri, 7 dikutip) gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-periksaDeterministikTeks-04 | butir nonaktif/semantik tidak ikut dalam hasil murni | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-periksaKelengkapan-01 | isian lengkap lolos | `templat-kelengkapan.test.ts` | Lulus |
| KH-periksaKelengkapan-02 | menandai nama kosong, batas kata tidak valid, lampiran kosong, dan periode kosong | `templat-kelengkapan.test.ts` | Lulus |
| KH-periksaKelengkapan-03 | menandai nama bagian ganda dan templat tanpa bagian | `templat-kelengkapan.test.ts` | Lulus |
| KH-periksaKelengkapan-04 | batas kata dan nilai tersimpan | `templat-kelengkapan.test.ts` | Lulus |
| KH-periksaSyarat-01 | meloloskan reviewer beda institusi dengan beban di bawah batas | `penugasan-pilih-reviewer.test.ts` | Lulus |
| KH-periksaSyarat-02 | menolak institusi sama | `penugasan-pilih-reviewer.test.ts` | Lulus |
| KH-periksaSyarat-03 | menolak beban melampaui batas | `penugasan-pilih-reviewer.test.ts` | Lulus |
| KH-periksaSyarat-04 | melaporkan semua syarat yang dilanggar | `penugasan-pilih-reviewer.test.ts` | Lulus |
| KH-periksaSyarat-05 | beban tepat satu di bawah batas masih sah (batas bawah sah) | `penugasan-pilih-reviewer.test.ts` | Lulus |
| KH-periksaSyarat-06 | beban tepat pada batas ditolak karena pemindahan menambah satu (batas atas tidak sah) | `penugasan-pilih-reviewer.test.ts` | Lulus |
| KH-periksaSyarat-07 | reviewer yang tidak bersedia ditolak walau institusi dan beban sah | `penugasan-pilih-reviewer.test.ts` | Lulus |
| KH-periksaSyarat-08 | institusi dibandingkan tanpa peduli huruf besar dan spasi tepi (nilai janggal tetapi sama) | `penugasan-pilih-reviewer.test.ts` | Lulus |
| KH-periksaSyarat-09 | batas 0 (janggal) menolak semua pemindahan | `penugasan-pilih-reviewer.test.ts` | Lulus |
| KH-periodeDitutup-01 | tepat pada tanggal tutup dan sakelar ditutup = ditutup (batas sah) | `penugasan-periode.test.ts` | Lulus |
| KH-periodeDitutup-02 | satu detik sebelum tanggal tutup = belum ditutup (batas bawah tidak sah) | `penugasan-periode.test.ts` | Lulus |
| KH-periodeDitutup-03 | satu detik sesudah tanggal tutup = ditutup | `penugasan-periode.test.ts` | Lulus |
| KH-periodeDitutup-04 | sakelar masa pengusulan berjalan menang walau tanggal sudah lewat (penentu tunggal) | `penugasan-periode.test.ts` | Lulus |
| KH-potongTeks-01 | memotong naskah contoh menjadi delapan bagian bertemplat (A-H) dengan judul dan kata kunci | `pengajuan-ekstraksi.test.ts` | Lulus |
| KH-potongTeks-02 | A lolos semua; B hanya KTA-04; C hanya KAT-01 dan SIT-03 (hasil sama dengan jalur murni) | `pengajuan-ekstraksi.test.ts` | Lulus |
| KH-potongTeks-03 | lampiran yang tidak diunggah membuat butir lampiran gagal | `pengajuan-ekstraksi.test.ts` | Lulus |
| KH-potongTeks-04 | tabel dan gambar dibuang dari hitungan: HTML dengan tabel dan gambar | `pengajuan-ekstraksi.test.ts` | Lulus |
| KH-potongTeks-05 | judul tingkat 1 di luar templat mengakhiri bagian dan tercatat | `pengajuan-ekstraksi.test.ts` | Lulus |
| KH-proposalContoh-01 | a dan d lolos semua batas kata, kata kunci tepat lima | `fondasi.test.ts` | Lulus |
| KH-proposalContoh-02 | b gagal jumlah kata hanya di Metode | `fondasi.test.ts` | Lulus |
| KH-proposalContoh-03 | c gagal kata kunci (4) dan sitasi (9 referensi, 7 dikutip) | `fondasi.test.ts` | Lulus |
| KH-proposalContoh-04 | DOCX terbentuk | `fondasi.test.ts` | Lulus |
| KH-rekapKesesuaian-01 | menghitung tabel silang gagal per butir dan institusi, urut terbanyak | `pemantauan-rekap.test.ts` | Lulus |
| KH-rekapKesesuaian-02 | % disetujui = hasil tanpa koreksi dibagi semua hasil pada penilaian final | `pemantauan-rekap.test.ts` | Lulus |
| KH-rekapKesesuaian-03 | mengurutkan butir koreksi tertinggi dan menyertakan alasan serta jenis kekeliruan | `pemantauan-rekap.test.ts` | Lulus |
| KH-rekapKesesuaian-04 | butir tanpa koreksi tidak masuk daftar koreksi tertinggi | `pemantauan-rekap.test.ts` | Lulus |
| KH-rekapKesesuaian-05 | rincian butir (S-1) memuat contoh, mendahulukan yang dikoreksi | `pemantauan-rekap.test.ts` | Lulus |
| KH-rekapKesesuaian-06 | laporan kosong tidak error | `pemantauan-rekap.test.ts` | Lulus |
| KH-rekapKesesuaian-07 | tanpa koreksi = 100% disetujui; semua dikoreksi = 0% (batas atas dan bawah) | `pemantauan-rekap.test.ts` | Lulus |
| KH-rekapKesesuaian-08 | kesesuaian diurutkan dari persen disetujui terendah | `pemantauan-rekap.test.ts` | Lulus |
| KH-rekapKesesuaian-09 | rincian menyertakan id proposal untuk tautan ke J-05b | `pemantauan-rekap.test.ts` | Lulus |
| KH-ringkasHasil-01 | daftar kosong menghasilkan semua hitungan nol | `pemantauan-rincian-proposal.test.ts` | Lulus |
| KH-ringkasHasil-02 | menghitung deterministik dan semantik terpisah | `pemantauan-rincian-proposal.test.ts` | Lulus |
| KH-ringkasHasil-03 | status tak dikenal (nilai janggal) hanya menambah jumlah total | `pemantauan-rincian-proposal.test.ts` | Lulus |
| KH-ringkasKeputusan-01 | nilai sah, keenam komponen Memenuhi | `penilaian-status.test.ts` | Lulus |
| KH-ringkasKeputusan-02 | batas bawah, tidak ada komponen terisi: keenamnya kosong dan tidak lengkap | `penilaian-status.test.ts` | Lulus |
| KH-ringkasKeputusan-03 | batas atas, lima dari enam terisi: tepat satu komponen kosong menurut urutan borang | `penilaian-status.test.ts` | Lulus |
| KH-ringkasKeputusan-04 | tipe salah dan nilai janggal (teks bebas, kosong, huruf kecil) dihitung kosong, bukan Memenuhi | `penilaian-status.test.ts` | Lulus |
| KH-ringkasKeputusan-05 | campuran Memenuhi dan Tidak memenuhi dijumlahkan benar | `penilaian-status.test.ts` | Lulus |
| KH-ringkasLabelPenugasan-01 | daftar kosong | `penilaian-status.test.ts` | Lulus |
| KH-ringkasLabelPenugasan-02 | rincian per label dalam urutan Baru, Draf, Selesai; label yang tidak ada dihilangkan | `penilaian-status.test.ts` | Lulus |
| KH-ringkasPerContoh-01 | menghitung Lolos, Gagal, dan rekomendasi semantik per contoh | `aturan-uji.test.ts` | Lulus |
| KH-ringkasPerContoh-02 | tanpa contoh menghasilkan daftar kosong; contoh tanpa hasil menghasilkan nol | `aturan-uji.test.ts` | Lulus |
| KH-ringkasRekomendasi-01 | tanpa butir semua nol | `penilaian-status.test.ts` | Lulus |
| KH-ringkasRekomendasi-02 | tiga golongan dipisahkan: disetujui, dikoreksi, dan tanpa rekomendasi | `penilaian-status.test.ts` | Lulus |
| KH-ringkasRekomendasi-03 | butir tanpa rekomendasi yang sudah dikoreksi dihitung dikoreksi, bukan tanpa rekomendasi | `penilaian-status.test.ts` | Lulus |
| KH-ringkasStatusPenetapan-01 | tanpa proposal Terkirim | `penugasan-periode.test.ts` | Lulus |
| KH-ringkasStatusPenetapan-02 | ada proposal tetapi belum ada usulan maupun penetapan | `penugasan-periode.test.ts` | Lulus |
| KH-ringkasStatusPenetapan-03 | usulan sudah disusun, belum ditetapkan | `penugasan-periode.test.ts` | Lulus |
| KH-ringkasStatusPenetapan-04 | sebagian ditetapkan, sisanya belum punya usulan | `penugasan-periode.test.ts` | Lulus |
| KH-ringkasStatusPenetapan-05 | seluruh proposal sudah punya penugasan tetap | `penugasan-periode.test.ts` | Lulus |
| KH-sesiToken-01 | token SSO dan sesi memiliki audiens berbeda | `fondasi.test.ts` | Lulus |
| KH-sesiToken-02 | jalurAman menolak open redirect | `fondasi.test.ts` | Lulus |
| KH-siapkanTeksTanpaIdentitas-01 | tidak membedakan huruf besar-kecil dan spasi ganda pada nama | `semantik-kutipan.test.ts` | Lulus |
| KH-siapkanTeksTanpaIdentitas-02 | karakter regex pada nama institusi tidak merusak pencarian | `semantik-kutipan.test.ts` | Lulus |
| KH-siapkanTeksTanpaIdentitas-03 | batas bawah, identitas dua huruf atau kosong tidak dibuang (agar teks tidak rusak) | `semantik-kutipan.test.ts` | Lulus |
| KH-siapkanTeksTanpaIdentitas-04 | teks kosong tetap kosong | `semantik-kutipan.test.ts` | Lulus |
| KH-statusButir-01 | Draf menjadi Aktif saat versi disimpan (simpanVersi) | `aturan-status.test.ts` | Lulus |
| KH-statusButir-02 | Aktif menjadi Perlu ditinjau saat ditandai pemantauan, lalu kembali Aktif saat versi disimpan | `aturan-status.test.ts` | Lulus |
| KH-statusButir-03 | butir manual Draf, Aktif, dan Perlu ditinjau dapat dinonaktifkan | `aturan-status.test.ts` | Lulus |
| KH-statusButir-04 | Nonaktif adalah keadaan akhir: tidak ada aksi yang diizinkan | `aturan-status.test.ts` | Lulus |
| KH-statusButir-05 | transisi lain yang tidak didefinisikan ditolak (Draf tidak dapat ditandai, Perlu ditinjau tidak dapat ditandai ulang) | `aturan-status.test.ts` | Lulus |
| KH-statusButir-06 | tepat empat keadaan | `aturan-status.test.ts` | Lulus |
| KH-statusPenilaian-01 | penugasan masih Diusulkan = Belum ditetapkan, apa pun penilaiannya | `pemantauan-rincian-proposal.test.ts` | Lulus |
| KH-statusPenilaian-02 | ditetapkan tanpa baris penilaian = Belum dimulai | `pemantauan-rincian-proposal.test.ts` | Lulus |
| KH-statusPenilaian-03 | penilaian Draf dan Final diteruskan | `pemantauan-rincian-proposal.test.ts` | Lulus |
| KH-StatusPenugasan-01 | Diusulkan -> Ditetapkan diizinkan | `penugasan-status.test.ts` | Lulus |
| KH-StatusPenugasan-02 | Ditetapkan -> Selesai diizinkan | `penugasan-status.test.ts` | Lulus |
| KH-StatusPenugasan-03 | melompat Diusulkan -> Selesai ditolak | `penugasan-status.test.ts` | Lulus |
| KH-StatusPenugasan-04 | mundur (Ditetapkan -> Diusulkan, Selesai -> Ditetapkan) ditolak | `penugasan-status.test.ts` | Lulus |
| KH-StatusPenugasan-05 | Selesai adalah keadaan akhir tanpa transisi keluar | `penugasan-status.test.ts` | Lulus |
| KH-StatusPenugasan-06 | transisi ke keadaan yang sama ditolak | `penugasan-status.test.ts` | Lulus |
| KH-StatusPenugasan-07 | keadaan tak dikenal (tipe salah) ditolak tanpa galat tak terduga | `penugasan-status.test.ts` | Lulus |
| KH-StatusPenugasan-08 | setiap keadaan dapat dicapai dari Diusulkan lewat transisi sah berurutan | `penugasan-status.test.ts` | Lulus |
| KH-StatusPenugasan-09 | hanya usulan (Diusulkan) yang boleh dipindahkan (S-2) | `penugasan-status.test.ts` | Lulus |
| KH-statusProposal-01 | semua transisi yang didefinisikan menghasilkan status berikutnya yang benar | `deterministik-batas.test.ts` | Lulus |
| KH-statusProposal-02 | Terkirim adalah keadaan akhir, semua peristiwa ditolak | `deterministik-batas.test.ts` | Lulus |
| KH-statusProposal-03 | transisi yang tidak didefinisikan ditolak (Ditahan tidak bisa langsung Terkirim) | `deterministik-batas.test.ts` | Lulus |
| KH-statusProposal-04 | statusSetelahPemeriksaan: 0 gagal Terkirim, 1 gagal Ditahan | `deterministik-batas.test.ts` | Lulus |
| KH-statusProposal-05 | jumlah gagal negatif atau pecahan ditolak (tipe salah) | `deterministik-batas.test.ts` | Lulus |
| KH-statusTemplat-01 | Draf menjadi Terbit lewat terbitkan | `templat-status.test.ts` | Lulus |
| KH-statusTemplat-02 | Terbit menjadi Arsip lewat arsipkan | `templat-status.test.ts` | Lulus |
| KH-statusTemplat-03 | hanya transisi yang didefinisikan yang diizinkan (empat pasangan lain ditolak dengan pesan) | `templat-status.test.ts` | Lulus |
| KH-statusTemplat-04 | setiap keadaan dapat dicapai dari Draf dan Arsip tidak punya jalan keluar | `templat-status.test.ts` | Lulus |
| KH-statusTemplat-05 | tepat tiga keadaan: Draf, Terbit, Arsip | `templat-status.test.ts` | Lulus |
| KH-statusTemplat-06 | hanya Draf yang dapat disusun di J-02b; Terbit dan Arsip hanya-baca | `templat-status.test.ts` | Lulus |
| KH-susunBarisUji-01 | satu baris per butir, satu sel per contoh, urutan butir dipertahankan | `aturan-uji.test.ts` | Lulus |
| KH-susunBarisUji-02 | butir Nonaktif tidak ditampilkan | `aturan-uji.test.ts` | Lulus |
| KH-susunBarisUji-03 | tanpa contoh atau tanpa butir menghasilkan daftar kosong (batas bawah) | `aturan-uji.test.ts` | Lulus |
| KH-susunBarisUji-04 | butir tanpa satu pun hasil dilewati (nilai janggal: kode tidak dikenal) | `aturan-uji.test.ts` | Lulus |
| KH-tandaiPerluDitinjau-01 | butir Aktif menjadi Perlu ditinjau | `pemantauan-status-butir.test.ts` | Lulus |
| KH-tandaiPerluDitinjau-02 | butir Draf tidak berubah (belum dipakai pemeriksa) | `pemantauan-status-butir.test.ts` | Lulus |
| KH-tandaiPerluDitinjau-03 | butir Nonaktif tidak dihidupkan kembali oleh penandaan | `pemantauan-status-butir.test.ts` | Lulus |
| KH-tandaiPerluDitinjau-04 | menandai butir yang sudah Perlu ditinjau idempoten | `pemantauan-status-butir.test.ts` | Lulus |
| KH-tandaiPerluDitinjau-05 | status tak dikenal (tipe salah) dikembalikan apa adanya | `pemantauan-status-butir.test.ts` | Lulus |
| KH-terbitkan-01 | isian lengkap dan masa ditutup menghasilkan terbit | `templat-status.test.ts` | Lulus |
| KH-terbitkan-02 | isian lengkap dan masa pengusulan berjalan menghasilkan draf tersimpan (9a) | `templat-status.test.ts` | Lulus |
| KH-terbitkan-03 | isian tidak lengkap menghasilkan S-2 walau masa berjalan atau ditutup (kelengkapan didahulukan) | `templat-status.test.ts` | Lulus |
| KH-terbitkan-04 | pesan S-2 dan 9a persis seperti spesifikasi UI | `templat-status.test.ts` | Lulus |
| KH-tingkatKeyakinan-01 | memetakan ambang 0,8 dan 0,5 | `fondasi.test.ts` | Lulus |
| KH-tokenPengajuan-01 | membawa idProposal dan identitas pengusul; token rusak ditolak | `pengajuan-ekstraksi.test.ts` | Lulus |
| KH-tokenPengajuan-02 | dua token untuk proposal yang sama memiliki jti berbeda | `deterministik-batas.test.ts` | Lulus |
| KH-tokenPengajuan-03 | hanya entri audit pertama untuk sebuah jti yang diterima, sisanya duplikat | `deterministik-batas.test.ts` | Lulus |
| KH-tokenPengajuan-04 | tidak ada entri pembanding (null atau undefined) tidak pernah dianggap pertama | `deterministik-batas.test.ts` | Lulus |
| KH-tokenPengajuan-05 | token berstring kosong, bertanda tangan kunci lain, atau tanpa klaim wajib ditolak | `deterministik-batas.test.ts` | Lulus |
| KH-tokenPengajuan-06 | token dengan audiens lain ditolak | `deterministik-batas.test.ts` | Lulus |
| KH-turunkanButir-01 | membuat butir bagian wajib, batas kata, dan lampiran | `fondasi.test.ts` | Lulus |
| KH-turunkanButirCek-01 | templat kosong dan tanpa lampiran tidak menurunkan butir (Q5) | `templat-turunan.test.ts` | Lulus |
| KH-turunkanButirCek-02 | bagian wajib menjadi BGN-nn dan bagian opsional tanpa batas kata tidak menghasilkan apa pun (Q1) | `templat-turunan.test.ts` | Lulus |
| KH-turunkanButirCek-03 | batas kata tepat 0 tetap menghasilkan KTA-nn, bagian tanpa batas tidak (Q2, batas bawah) | `templat-turunan.test.ts` | Lulus |
| KH-turunkanButirCek-04 | setiap lampiran menjadi LMP-nn (Q3) | `templat-turunan.test.ts` | Lulus |
| KH-turunkanButirCek-05 | penomoran dua digit terpisah per awalan dan urutan keluaran per bagian lalu lampiran (Q4) | `templat-turunan.test.ts` | Lulus |
| KH-turunkanButirCek-06 | jumlah keluaran sama dengan bagian wajib ditambah bagian berbatas kata ditambah lampiran (Q5) | `templat-turunan.test.ts` | Lulus |
| KH-turunkanButirCek-07 | semua butir deterministik dan berasal dari templat (Q6); 12 butir menghasilkan nomor dua digit sampai 12 | `templat-turunan.test.ts` | Lulus |
| KH-turunkanButirCek-08 | nama bagian dengan tanda kutip tetap utuh pada parameter dan deskripsi (nilai janggal) | `templat-turunan.test.ts` | Lulus |
| KH-ujiNyata-00 | bila data/uji-nyata tidak ada, uji PDF asli dilewati (bukan gagal) | `uji-nyata-isian-substansi.test.ts` | Dilewati |
| KH-uraikanAturanHitung-01 | kata kunci tepat lima, dipisah titik koma | `aturan-parameter.test.ts` | Lulus |
| KH-uraikanAturanHitung-02 | sitasi dan daftar pustaka | `aturan-parameter.test.ts` | Lulus |
| KH-uraikanAturanHitung-03 | aturan yang butuh bagian | `aturan-parameter.test.ts` | Lulus |
| KH-uraikanAturanHitung-04 | aturan tak dikenali ditolak dengan petunjuk | `aturan-parameter.test.ts` | Lulus |
| KH-urutkanHasil-01 | Gagal/Tidak memenuhi di atas, lalu perlu manual, belum ada, lalu lolos; seri menurut kode | `pemantauan-rincian-proposal.test.ts` | Lulus |
| KH-urutkanHasil-02 | tidak mengubah larik masukan | `pemantauan-rincian-proposal.test.ts` | Lulus |
| KH-validasiButir-01 | menandai isian wajib yang kosong | `aturan-parameter.test.ts` | Lulus |
| KH-validasiButir-02 | butir deterministik: parameter, pemeriksa, dan komponen diturunkan | `aturan-parameter.test.ts` | Lulus |
| KH-validasiButir-03 | butir semantik wajib pertanyaan dan bagian; lampiran menentukan komponen | `aturan-parameter.test.ts` | Lulus |
| KH-validasiButir-04 | kode dengan karakter tidak sah ditolak | `aturan-parameter.test.ts` | Lulus |
| KH-validasiButir-05 | ringkasan parameter | `aturan-parameter.test.ts` | Lulus |
| KH-validasiKoreksi-01 | alasan kosong atau spasi ditolak dengan pesan baku | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-02 | masukan lengkap valid | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-03 | keputusan dan jenis di luar daftar ditolak | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-04 | kosong diterima; hanya alasan yang wajib | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-05 | batas bawah, alasan satu karakter sah | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-06 | alasan kosong, tab, dan baris baru saja ditolak (batas bawah tidak sah) | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-07 | alasan sangat panjang (batas atas tidak dibatasi kontrak) tetap sah | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-08 | tipe salah (undefined/null pada alasan, keputusan kosong) ditolak tanpa melempar galat | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-09 | nilai janggal tetapi mungkin sah: alasan berisi hanya tanda baca atau angka diterima | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-10 | huruf besar-kecil keputusan dibedakan; hanya dua nilai baku diterima | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiTanggalBerlaku-01 | menolak tanggal di antara buka dan tutup (batas ikut) bila masa pengusulan berjalan | `aturan-parameter.test.ts` | Lulus |
| KH-validasiTanggalBerlaku-02 | menerima tanggal di luar rentang, atau bila masa pengusulan ditutup | `aturan-parameter.test.ts` | Lulus |
| KH-validasiTanggalBerlaku-03 | tanggal kosong atau tidak valid ditolak; harus lebih akhir dari versi sebelumnya | `aturan-parameter.test.ts` | Lulus |
| KH-validasiTanggalBerlaku-04 | hari menurut WIB | `aturan-parameter.test.ts` | Lulus |

### Kotak putih (KP)

| ID | Kasus | Berkas | Hasil aktual |
|---|---|---|---|
| KP-bagianDokumen-01 | tanpa bagian sama sekali hanya berisi dua bagian wajib dengan urutan 1 dan 2 | `templat-dokumen.test.ts` | Lulus |
| KP-bagianDokumen-02 | hanya satu yang kurang: hanya itu yang ditambahkan, nomor urut melanjutkan yang terbesar | `templat-dokumen.test.ts` | Lulus |
| KP-bagianDokumen-03 | masukan tidak diubah (tidak ada efek samping) | `templat-dokumen.test.ts` | Lulus |
| KP-bentukHasil-01 | kutipan ditemukan: status mengikuti rekomendasi | `semantik-mesin.test.ts` | Lulus |
| KP-bentukHasil-02 | S-1: kutipan tidak ditemukan -> Perlu diperiksa manual, rekomendasi tetap disimpan, kutipan tidak ditampilkan | `semantik-mesin.test.ts` | Lulus |
| KP-bentukHasil-03 | S-2: tanpa jawaban -> Belum ada rekomendasi, tanpa rekomendasi, kutipan, keyakinan | `semantik-mesin.test.ts` | Lulus |
| KP-bentukHasil-04 | Tidak memenuhi tanpa kutipan sah (unsur memang tidak ada) | `semantik-mesin.test.ts` | Lulus |
| KP-bentukHasil-05 | Memenuhi tanpa kutipan -> Perlu diperiksa manual | `semantik-mesin.test.ts` | Lulus |
| KP-blokDariHtml-01 | judul h1..h6 membawa tingkat; paragraf dengan <br> dipecah per baris | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-blokDariHtml-02 | tabel menjadi satu penanda dan isinya dibuang | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-blokDariHtml-03 | daftar ul/ol dipecah per item; item kosong dilewati | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-blokDariHtml-04 | paragraf bergambar menghasilkan penanda gambar lalu teksnya; paragraf hanya gambar tanpa teks | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-blokDariHtml-05 | entitas bernama, desimal, dan heksadesimal didekode; entitas tidak dikenal dibiarkan | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-blokDariHtml-06 | judul multibaris digabung satu baris; paragraf kosong tidak menghasilkan blok | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-buangPetunjuk-01 | baris kosong dan baris 'Panduan: ...' di awal dibuang meski tanpa petunjuk resmi | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-buangPetunjuk-02 | petunjuk kosong (tanpa kata) tidak membuang apa pun | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-buangPetunjuk-03 | baris tanpa kata (mis. tanda baca saja) menghentikan pencocokan; baris yang berbeda juga | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-buangPetunjuk-04 | baris lebih panjang daripada sisa petunjuk (isi menempel pada petunjuk) menghentikan pencocokan | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-buangPetunjuk-05 | angka batas boleh berbeda; salah ketik satu huruf pada kata panjang dimaafkan; kata pendek harus sama | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-buangPetunjuk-06 | petunjuk terbaca sebagian: >= 80% kalimat dibuang; kurang dari itu dibiarkan | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-buangPetunjuk-07 | kata pendek yang berbeda satu huruf bukan salah ketik (panjang kurang dari 5) | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-buatDokumenTemplat-01 | periode null menulis 'belum ditetapkan'; tanpa lampiran menulis 'Tidak ada lampiran wajib' | `templat-dokumen.test.ts` | Lulus |
| KP-buatDokumenTemplat-02 | periode terisi menulis nama dan tahun; lampiran bernomor | `templat-dokumen.test.ts` | Lulus |
| KP-buatDokumenTemplat-03 | periode tanpa tahun tidak menulis tanda kurung | `templat-dokumen.test.ts` | Lulus |
| KP-cariKutipan-01 | cabang token kosong (null, undefined, spasi) dan teks kosong mengembalikan null | `semantik-alur.test.ts` | Lulus |
| KP-cariKutipan-02 | cabang cocok mengembalikan mulai dan akhir; tanda kutip tunggal lengkung kiri/kanan setara apostrof | `semantik-alur.test.ts` | Lulus |
| KP-cariKutipan-03 | cabang tidak cocok: huruf besar-kecil dibedakan | `semantik-alur.test.ts` | Lulus |
| KP-cekKataKunci-01 | null -> cabang kosong, pesan memakai nama pemisah dikenal | `deterministik-cabang.test.ts` | Lulus |
| KP-cekKataKunci-02 | pemisah tidak dikenal dipetik apa adanya pada pesan | `deterministik-cabang.test.ts` | Lulus |
| KP-cekKataKunci-03 | petunjuk 'pemisah salah' muncul hanya bila satu kata kunci mengandung koma/baris baru dan pemisah bukan koma | `deterministik-cabang.test.ts` | Lulus |
| KP-cekKataKunci-04 | jumlah sama lolos tanpa batas dilanggar | `deterministik-cabang.test.ts` | Lulus |
| KP-cekLampiran-01 | daftar wajib kosong memakai nama butir; daftar wajib berisi dibandingkan dua arah | `deterministik-cabang.test.ts` | Lulus |
| KP-cocokkanSitasi-01 | nomorSitasi memperluas rentang, daftar titik koma, dan menolak rentang terbalik atau terlalu lebar | `deterministik-cabang.test.ts` | Lulus |
| KP-cocokkanSitasi-02 | sitasi_bernomor: tiga hasil (lolos, tanpa sitasi, nama-tahun) | `deterministik-cabang.test.ts` | Lulus |
| KP-cocokkanSitasi-03 | pustaka_berurutan: bagian Daftar Pustaka tidak ada versus ada tanpa entri | `deterministik-cabang.test.ts` | Lulus |
| KP-cocokkanSitasi-04 | pustaka_berurutan: salah nomor saja, lompat saja, keduanya, dan lolos | `deterministik-cabang.test.ts` | Lulus |
| KP-cocokkanSitasi-05 | jumlah_referensi_sama: lolos, kosong, tidak dikutip, dikutip tanpa entri, dan keduanya | `deterministik-cabang.test.ts` | Lulus |
| KP-cocokkanSitasi-06 | sitasi di bagian Kata Kunci dan Daftar Pustaka tidak dihitung sebagai sitasi isi | `deterministik-cabang.test.ts` | Lulus |
| KP-cocokkanSitasi-07 | bagian di luar templat tetap dihitung setelah bagian bertemplat; Referensi dikenali sebagai pustaka | `deterministik-cabang.test.ts` | Lulus |
| KP-cocokkanSitasi-08 | entriPustaka menggabungkan baris lanjutan dan mengabaikan baris sebelum entri pertama | `deterministik-cabang.test.ts` | Lulus |
| KP-ekstrakNaskah-01 | PDF: judul bagian dikenali dari nama templat | `pengajuan-ekstraksi.test.ts` | Lulus |
| KP-ekstrakNaskah-02 | format tidak dikenal ditolak | `pengajuan-ekstraksi.test.ts` | Lulus |
| KP-ekstrakNaskah-03 | teks lampiran PDF terbaca; berkas rusak menghasilkan teks kosong | `pengajuan-ekstraksi.test.ts` | Lulus |
| KP-ekstrakTeksLampiran-01 | format tidak dikenal menghasilkan teks kosong, bukan galat | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-ekstrakTeksLampiran-02 | DOCX rusak ditelan menjadi teks kosong | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-entriPustaka-01 | baris lanjutan berawalan DOI ('10.1016/...') atau tahun ('2016. doi') bukan entri baru; '[1]teks' rapat tetap entri | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-hitungKata-01 | baris kosong dilewati (cabang barisTeks menyaring) | `deterministik-cabang.test.ts` | Lulus |
| KP-hitungKata-02 | baris keterangan Gambar/Tabel/Diagram/Grafik/Bagan/Skema/Foto dilewati | `deterministik-cabang.test.ts` | Lulus |
| KP-hitungKata-03 | penanda [tabel]/[gambar]/[diagram] dilewati, penanda lain dihitung | `deterministik-cabang.test.ts` | Lulus |
| KP-hitungKata-04 | kata 'gambar' tanpa nomor di awal baris adalah teks biasa (cabang pola tidak cocok) | `deterministik-cabang.test.ts` | Lulus |
| KP-hitungKata-05 | fmt memberi titik ribuan dan membulatkan ke bawah | `deterministik-cabang.test.ts` | Lulus |
| KP-hitungKata-06 | normalisasiJudul membuang penomoran bab, angka, romawi, dan tanda baca di ujung | `deterministik-cabang.test.ts` | Lulus |
| KP-identitasBima-01 | blok identitas diganti satu penanda sampai judul bagian bernomor berikutnya; NO. DOKUMEN dibuang | `semantik-identitas-bima.test.ts` | Lulus |
| KP-identitasBima-02 | tanpa blok identitas, hanya baris NO. DOKUMEN yang dibuang; teks lain tidak berubah | `semantik-identitas-bima.test.ts` | Lulus |
| KP-identitasBima-03 | blok identitas tanpa judul bagian penutup: dibuang sampai akhir teks; A. JUDUL juga menutup blok | `semantik-identitas-bima.test.ts` | Lulus |
| KP-identitasBima-04 | nomor induk panjang dan nama di atasnya dikumpulkan; baris peran, angka, dan nama pendek diabaikan; tanpa blok: kosong | `semantik-identitas-bima.test.ts` | Lulus |
| KP-identitasBima-05 | seluruh identitas anggota tim ikut dibuang dari teks lain (pembagian tugas pada Metode), tanpa memberi identitas pengusul | `semantik-identitas-bima.test.ts` | Lulus |
| KP-jenisBerkas-01 | PDF dikenali dari tanda %PDF; nama .pdf tanpa tanda %PDF ditolak | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-jenisBerkas-02 | DOCX butuh tanda PK dan tipe atau ekstensi docx | `pengajuan-html-berkas.test.ts` | Lulus |
| KP-klienBima-01 | berhasil pada percobaan ketiga | `bima-client.test.ts` | Lulus |
| KP-klienBima-02 | gagal setelah 3 percobaan total | `bima-client.test.ts` | Lulus |
| KP-klienBima-03 | tidak mengulang galat 4xx | `bima-client.test.ts` | Lulus |
| KP-klienBima-04 | mengulang galat jaringan | `bima-client.test.ts` | Lulus |
| KP-klienBima-05 | stub BIMA memuat reviewer, mengirim penugasan, dan mencatat panggilan | `bima-client.test.ts` | Lulus |
| KP-klienBima-06 | ambilBerkas mengembalikan bytes dan tipe; berkas tak ada gagal 404 tanpa ulang | `bima-client.test.ts` | Lulus |
| KP-klienBima-07 | setiap metode memanggil jalur dan metode HTTP yang benar | `bima-client.test.ts` | Lulus |
| KP-klienBima-08 | ambilProposal mengodekan id pada URL | `bima-client.test.ts` | Lulus |
| KP-lampiranEkspor-01 | tanpa judul surat, baris tidak berubah | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-lampiranEkspor-02 | dipotong pada judul surat berikut kop suratnya (huruf kapital, alamat, baris pendek); pustaka bernomor dan tautan dipertahankan | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-lampiranEkspor-03 | kurang dari tiga entri berurutan: daftar tidak dipotong | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-lampiranEkspor-04 | entri terakhir dibawa sampai baris penutup (titik, bukan inisial) atau tautan; artikel sesudahnya dibuang | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-lampiranEkspor-05 | entri terakhir tanpa penutup dibatasi delapan baris; nomor yang melompat tidak masuk rantai | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-lengkapiBagian-01 | atribut huruf dari urutan dan petunjuk dari nama; atribut petunjuk yang sudah ada dipertahankan | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-lepasTandaIsian-01 | masukan kosong atau hanya baris kosong menghasilkan larik kosong | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-lepasTandaIsian-02 | '[' dan ']' di baris sendiri di awal/akhir dibuang walau pasangannya tidak terbaca; hanya '[' atau ']' menjadi kosong | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-lepasTandaIsian-03 | pembuka inline dan penutup seimbang: '[isi' ... 'akhir]' dilepas; penutup yang seimbang ('[4]') dipertahankan | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-lepasTandaIsian-04 | baris pertama berupa sitasi '[1] ...' bukan tanda isian; placeholder '[ … ]' dan '[...]' menjadi kosong | `pengajuan-potong-isian.test.ts` | Lulus |
| KP-mintaJawaban-01 | berhasil pada percobaan kedua | `semantik-mesin.test.ts` | Lulus |
| KP-mintaJawaban-02 | gagal dua kali menghasilkan null (S-2) | `semantik-mesin.test.ts` | Lulus |
| KP-nilaiSemantikDenganOpsi-01 | hanya butir semantik, urutan terjaga, bagian kosong tanpa memanggil LLM | `semantik-mesin.test.ts` | Lulus |
| KP-nilaiSemantikDenganOpsi-02 | mode tiruan: kutipan salinan persis dari teks, tiruan true | `semantik-mesin.test.ts` | Lulus |
| KP-panduanBagian-01 | bagian Isian Substansi memakai kalimat petunjuk resmi; Kata Kunci menyebut titik koma | `templat-dokumen.test.ts` | Lulus |
| KP-panduanBagian-02 | nama dinormalisasi (penomoran/huruf diabaikan) dan angka batas diisi dari batas kata bagian | `templat-dokumen.test.ts` | Lulus |
| KP-panduanBagian-03 | bagian di luar Isian Substansi: batas kata null menjadi tanpa batas; angka diformat Indonesia | `templat-dokumen.test.ts` | Lulus |
| KP-periksaSatuButir-01 | parameter null gagal tertutup | `deterministik-cabang.test.ts` | Lulus |
| KP-periksaSatuButir-02 | setiap tipe parameter diarahkan ke pemeriksa yang sesuai | `deterministik-cabang.test.ts` | Lulus |
| KP-periksaSatuButir-03 | tipe parameter tidak dikenal gagal dengan nama tipenya | `deterministik-cabang.test.ts` | Lulus |
| KP-periksaSatuButir-04 | periksaBanyakButir membuang butir semantik dan menyaring batas dilanggar pada butir lolos | `deterministik-cabang.test.ts` | Lulus |
| KP-periksaSemantik-01 | sukses pada percobaan pertama: Memenuhi dengan kutipan dan keyakinan, satu panggilan | `semantik-alur.test.ts` | Lulus |
| KP-periksaSemantik-02 | batas waktu pada percobaan pertama lalu sukses: percobaan 2, hasil normal | `semantik-alur.test.ts` | Lulus |
| KP-periksaSemantik-03 | batas waktu dua kali: Belum ada rekomendasi tanpa rekomendasi, kutipan, dan keyakinan; alasan memuat galat terakhir | `semantik-alur.test.ts` | Lulus |
| KP-periksaSemantik-04 | kutipan palsu: Perlu diperiksa manual, kutipan dibuang, rekomendasi semula tetap tercatat | `semantik-alur.test.ts` | Lulus |
| KP-periksaSemantik-05 | kutipan dengan tanda kutip lurus dan spasi berbeda tetap dikenali (tidak jatuh ke Perlu diperiksa manual) | `semantik-alur.test.ts` | Lulus |
| KP-periksaSemantik-06 | Tidak memenuhi tanpa kutipan diterima; satu butir gagal tidak menggagalkan butir lain (pekerja bersamaan) | `semantik-alur.test.ts` | Lulus |
| KP-periksaSemantik-07 | skenario paksa tiruan 'kutipan-salah' berlaku pada butir pertama saja | `semantik-alur.test.ts` | Lulus |
| KP-periksaSemantik-08 | skenario paksa tiruan 'tidak-merespons' menghasilkan Belum ada rekomendasi dan label tiruan | `semantik-alur.test.ts` | Lulus |
| KP-pilahButirDitandai-01 | butir Aktif menjadi target | `pemantauan-rekap.test.ts` | Lulus |
| KP-pilahButirDitandai-02 | butir bukan Aktif dilewati beserta alasan statusnya | `pemantauan-rekap.test.ts` | Lulus |
| KP-pilahButirDitandai-03 | kode yang tidak ada pada basis aturan dilewati | `pemantauan-rekap.test.ts` | Lulus |
| KP-pilahButirDitandai-04 | kode ganda dihitung sekali; pilihan kosong tidak menghasilkan apa-apa | `pemantauan-rekap.test.ts` | Lulus |
| KP-potongPerBagian-01 | blok sebelum judul bagian pertama menjadi judul dokumen (baris kosong dilewati) | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-02 | tanpa satu pun judul bagian, hasil kosong dan judul dokumen dari blok pertama | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-03 | paragraf pendek yang isinya nama bagian (mis. PDF) dikenali sebagai judul | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-04 | paragraf lebih dari 80 karakter bernama sama dengan bagian bukan judul | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-05 | judul bagian ganda: yang kedua menjadi isi, bukan bagian baru | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-06 | judul tingkat 1 di luar templat mengakhiri bagian dan isinya dibuang; tingkat 2 tidak mengakhiri | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-07 | judul tanpa tingkat dianggap tingkat 1 | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-08 | penomoran judul diabaikan saat mencocokkan nama | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-09 | dari bagian 'Kata Kunci' (awalan dibuang; baris kosong pertama dilewati) | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-10 | bagian 'Kata Kunci' ada tetapi kosong -> null | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-11 | tanpa bagian Kata Kunci di templat, baris 'Kata kunci: ...' di mana pun dipakai | `pengajuan-potong.test.ts` | Lulus |
| KP-potongPerBagian-12 | tidak ada sama sekali -> null | `pengajuan-potong.test.ts` | Lulus |
| KP-putuskanTerbitkan-01 | cabang tidak lengkap (kondisi pertama benar), masa tidak dievaluasi | `templat-status.test.ts` | Lulus |
| KP-putuskanTerbitkan-02 | cabang lengkap dan masa berjalan (9a) | `templat-status.test.ts` | Lulus |
| KP-putuskanTerbitkan-03 | cabang lengkap dan masa tidak berjalan (jalur terbit) | `templat-status.test.ts` | Lulus |
| KP-rekapKesesuaian-01 | butir tanpa info memakai kode sebagai deskripsi, status dan butirId null | `pemantauan-rekap.test.ts` | Lulus |
| KP-rekapKesesuaian-02 | rincian dibatasi BATAS_CONTOH_RINCIAN dengan koreksi lebih dulu | `pemantauan-rekap.test.ts` | Lulus |
| KP-rekapKesesuaian-03 | rekomendasi kosong tanpa koreksi tampil sebagai 'Disetujui (tanpa koreksi)' | `pemantauan-rekap.test.ts` | Lulus |
| KP-rekapKesesuaian-04 | institusi unik terurut abjad, jumlah gagal per institusi bertambah per kejadian | `pemantauan-rekap.test.ts` | Lulus |
| KP-rekapKesesuaian-05 | persen disetujui seri diurutkan menurut kode | `pemantauan-rekap.test.ts` | Lulus |
| KP-ringkasPerContoh-01 | setiap status pada setiap filter dihitung tepat satu kali | `aturan-status.test.ts` | Lulus |
| KP-siapkanTeksTanpaIdentitas-01 | membuang nama (dengan dan tanpa gelar), institusi, dan nomor induk | `semantik-mesin.test.ts` | Lulus |
| KP-siapkanTeksTanpaIdentitas-02 | tanpa identitas, teks tidak berubah | `semantik-mesin.test.ts` | Lulus |
| KP-siapkanTeksTanpaIdentitas-03 | identitas lain (mis. email) dibuang; nilai kosong, null, dan lebih pendek dari tiga huruf dilewati | `semantik-alur.test.ts` | Lulus |
| KP-siapkanTeksTanpaIdentitas-04 | varian nama: tanpa gelar depan dan belakang dibuang walau teks hanya memuat varian itu; yang terpanjang diganti lebih dulu | `semantik-alur.test.ts` | Lulus |
| KP-siapkanTeksTanpaIdentitas-05 | nama tanpa koma dan tanpa gelar menghasilkan satu varian | `semantik-alur.test.ts` | Lulus |
| KP-susunBarisUji-01 | cabang deterministik ditemukan lebih dulu daripada semantik untuk kode yang sama | `aturan-status.test.ts` | Lulus |
| KP-susunBarisUji-02 | cabang semantik dipakai bila tidak ada hasil deterministik | `aturan-status.test.ts` | Lulus |
| KP-susunBarisUji-03 | sel null pada sebagian contoh tidak membuang baris selama ada satu hasil | `aturan-status.test.ts` | Lulus |
| KP-susunBarisUji-04 | cabang Nonaktif dan cabang tanpa hasil sama-sama membuang baris | `aturan-status.test.ts` | Lulus |
| KP-susunBarisUji-05 | penjaga tipe adalahDeterministik membedakan bentuk hasil | `aturan-status.test.ts` | Lulus |
| KP-susunUsulanMurni-01 | tidak pernah memilih reviewer dari institusi pengusul | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-02 | meratakan beban dan tidak melampaui batas | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-03 | memperhitungkan beban awal (penugasan yang sudah ditetapkan) | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-04 | S-1: melaporkan proposal yang belum dapat ditugaskan bila reviewer kurang | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-05 | S-1: proposal tanpa reviewer berinstitusi berbeda tidak dapat ditugaskan | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-06 | menggeser proposal lain bila greedy buntu (jalur penambah) | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-07 | hasil deterministik untuk masukan yang sama | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-08 | tanpa proposal tidak menghasilkan penugasan maupun kekurangan | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-09 | tanpa reviewer semua proposal belum ditugaskan | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-10 | institusi dinormalisasi (huruf besar dan spasi tepi) saat memilih reviewer layak | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-11 | kapasitas sisa nol (semua reviewer penuh oleh beban awal) melewati jalur penambah | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-12 | setelah 25 kegagalan jalur penambah beruntun sisa proposal langsung dilaporkan kekurangan | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-13 | beban akhir memuat beban awal reviewer yang tidak mendapat proposal baru | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurniSkala-01 | membagi seluruh proposal dengan beda institusi, beban rata, dan cepat (< 3 dtk) | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurniSkala-02 | S-1 cepat bila batas diturunkan di bawah kapasitas (60 x 130 < 10.000) | `penugasan-susun.test.ts` | Lulus |
| KP-tentukanSasaran-01 | butir atas lampiran memakai teks lampiran sebagai sasaran utama | `semantik-mesin.test.ts` | Lulus |
| KP-transisiButir-01 | aksi dan keadaan asal terdefinisi menghasilkan keadaan tujuan | `aturan-status.test.ts` | Lulus |
| KP-transisiButir-02 | aksi terdefinisi tetapi keadaan asal tidak terdaftar pada aksi itu | `aturan-status.test.ts` | Lulus |
| KP-transisiButir-03 | aksi tidak dikenal (di luar tipe) ditolak tanpa melempar galat | `aturan-status.test.ts` | Lulus |
| KP-transisiProposal-01 | galat memberi Ditahan bila ada versi selesai, selain itu Belum diajukan | `deterministik-cabang.test.ts` | Lulus |
| KP-transisiProposal-02 | galat pada status selain Sedang diperiksa ditolak | `deterministik-cabang.test.ts` | Lulus |
| KP-transisiTemplat-01 | aksi terdefinisi dan keadaan asal cocok | `templat-status.test.ts` | Lulus |
| KP-transisiTemplat-02 | aksi terdefinisi tetapi keadaan asal tidak cocok | `templat-status.test.ts` | Lulus |
| KP-transisiTemplat-03 | aksi tidak dikenal (di luar tipe) ditolak tanpa melempar galat | `templat-status.test.ts` | Lulus |
| KP-uraikanAturanHitung-01 | kata kunci dengan angka numerik dan pemisah koma | `aturan-parameter.test.ts` | Lulus |
| KP-uraikanAturanHitung-02 | kata kunci dengan angka huruf dan pemisah bawaan titik koma | `aturan-parameter.test.ts` | Lulus |
| KP-uraikanAturanHitung-03 | kata kunci tanpa jumlah ditolak | `aturan-parameter.test.ts` | Lulus |
| KP-uraikanAturanHitung-04 | jumlah referensi, pustaka berurutan, dan sitasi memakai cabang masing-masing | `aturan-parameter.test.ts` | Lulus |
| KP-uraikanAturanHitung-05 | judul sama, struktur, dan terisi; terisi tanpa bagian ditolak | `aturan-parameter.test.ts` | Lulus |
| KP-validasiButir-01 | kode kosong, kode tidak sah, kode 20 karakter sah, 21 karakter tidak sah | `aturan-parameter.test.ts` | Lulus |
| KP-validasiButir-02 | deterministik tanpa Aturan Hitung dan dengan aturan tak dikenal ditandai pada isian aturan | `aturan-parameter.test.ts` | Lulus |
| KP-validasiButir-03 | deterministik valid tetapi kode kosong tetap gagal (galat lain mencegah hasil sah) | `aturan-parameter.test.ts` | Lulus |
| KP-validasiButir-04 | semantik tanpa lampiran memakai komponen kesesuaian isi dan contoh jawaban kosong menjadi null | `aturan-parameter.test.ts` | Lulus |
| KP-validasiButir-05 | semantik dengan lampiran yang tidak ada di peta komponen memakai komponen bawaan | `aturan-parameter.test.ts` | Lulus |
| KP-validasiButir-06 | jenis tidak dipilih ditandai; semantik tanpa pertanyaan dan bagian ditandai keduanya | `aturan-parameter.test.ts` | Lulus |
| KP-validasiButir-07 | ringkasParameter semantik tanpa bagian dan tanpa pertanyaan memakai tanda hubung | `aturan-parameter.test.ts` | Lulus |
| KP-validasiTanggalBerlaku-01 | format tidak sah (cabang uraiTanggalIsian null) | `aturan-tanggal.test.ts` | Lulus |
| KP-validasiTanggalBerlaku-02 | masa berjalan dan tepat pada hari buka ditolak (batas bawah ikut, 8a) | `aturan-tanggal.test.ts` | Lulus |
| KP-validasiTanggalBerlaku-03 | masa berjalan dan tepat pada hari tutup ditolak (batas atas ikut, 8a) | `aturan-tanggal.test.ts` | Lulus |
| KP-validasiTanggalBerlaku-04 | masa berjalan, sehari sebelum buka dan sehari sesudah tutup diterima (kedua sisi kondisi majemuk) | `aturan-tanggal.test.ts` | Lulus |
| KP-validasiTanggalBerlaku-05 | masa tidak berjalan melewati pemeriksaan rentang | `aturan-tanggal.test.ts` | Lulus |
| KP-validasiTanggalBerlaku-06 | tanggal tepat sama dengan versi sebelumnya ditolak; sehari sesudahnya diterima; tanpa versi sebelumnya dilewati | `aturan-tanggal.test.ts` | Lulus |
| KP-validasiTanggalBerlaku-07 | bila ditolak 8a sekaligus lebih awal dari versi sebelumnya, pesan 8a didahulukan | `aturan-tanggal.test.ts` | Lulus |

### Integrasi (IT)

| ID | Kasus | Berkas | Hasil aktual |
|---|---|---|---|
| IT-basisData-01 | berkas: simpan dan ambil (adaptor bytea bila tanpa token Blob) | `basis-data.test.ts` | Lulus |
| IT-basisData-02 | log_audit: hanya bisa ditambah | `basis-data.test.ts` | Lulus |
| IT-idempotensi-01 | kotak masuk BIMA: kunci yang sama tidak menambah baris ganda (keputusan dan penugasan) | `idempotensi.test.ts` | Lulus |
| IT-idempotensi-02 | kotak masuk BIMA: dua permintaan serentak untuk kelompok yang sama menghasilkan satu baris per kunci | `idempotensi.test.ts` | Lulus |
| IT-idempotensi-03 | jalan pintas UC-05b: naskah BIMA dipulihkan ke seed pada pemakaian berulang | `idempotensi.test.ts` | Lulus |
| IT-pemantauanDb-01 | rincian proposal yang tidak ada menghasilkan null | `penugasan-pemantauan-db.test.ts` | Lulus |
| IT-pemantauanDb-02 | rincian proposal contoh dapat dibuka lewat idProposal BIMA maupun id baris | `penugasan-pemantauan-db.test.ts` | Lulus |
| IT-pengajuan-01 | contoh A: semua butir lolos, proposal Terkirim dengan bukti pengiriman | `pengajuan-db.test.ts` | Lulus |
| IT-pengajuan-02 | token yang sama tidak membuat versi ganda | `pengajuan-db.test.ts` | Lulus |
| IT-pengajuan-03 | contoh B: Ditahan, butir gagal paling atas dengan bagian dan batas; diajukan ulang tanpa batas token membuat versi baru | `pengajuan-db.test.ts` | Lulus |
| IT-pengajuan-04 | contoh C lalu masa ditutup: Ditahan, kemudian Ditolak tanpa versi baru (3a) | `pengajuan-db.test.ts` | Lulus |
| IT-pengajuan-05 | proposal milik pengusul lain tidak dapat dibuka atau diajukan | `pengajuan-db.test.ts` | Lulus |
| IT-penilaian-01 | UC-09: jalankanPemeriksaanSemantik menyimpan hasil per butir semantik, kutipan sah, berlabel tiruan | `penilaian-reviewer.test.ts` | Lulus |
| IT-penilaian-02 | NFR 3.1: reviewer lain mendapat 403; reviewer pemilik lolos | `penilaian-reviewer.test.ts` | Lulus |
| IT-penilaian-03 | J-07 hanya memuat penugasan milik sendiri | `penilaian-reviewer.test.ts` | Lulus |
| IT-penilaian-04 | J-08 memuat tab, butir, dan membuka cepat tanpa LLM (NFR 2.3) | `penilaian-reviewer.test.ts` | Lulus |
| IT-penilaian-05 | UC-08: koreksi tanpa alasan ditolak; dengan alasan tersimpan dan rekomendasi semula tidak berubah | `penilaian-reviewer.test.ts` | Lulus |
| IT-penilaian-06 | S-1: simpan sementara memberi label Draf tanpa log audit dan tanpa kirim ke BIMA | `penilaian-reviewer.test.ts` | Lulus |
| IT-penilaian-07 | simpan permanen menolak komponen belum lengkap; lengkap -> Final, Selesai, log audit, terkirim ke BIMA | `penilaian-reviewer.test.ts` | Lulus |
| IT-penugasanDb-01 | daftar periode ditutup hanya memuat periode ditutup dengan hitungan tak negatif | `penugasan-pemantauan-db.test.ts` | Lulus |
| IT-penugasanDb-02 | id periode tidak sah atau tidak ada menghasilkan null | `penugasan-pemantauan-db.test.ts` | Lulus |
| IT-templatAturan-01 | S-1: skema baru belum punya templat; Susun Versi Baru membuat versi 1 | `templat-aturan-db.test.ts` | Lulus |
| IT-templatAturan-02 | S-2, 9a, lalu terbit: butir turunan berstatus Draf dan terkunci | `templat-aturan-db.test.ts` | Lulus |
| IT-templatAturan-03 | 4a: butir turunan templat ditolak diubah dan tidak dapat dinonaktifkan | `templat-aturan-db.test.ts` | Lulus |
| IT-templatAturan-04 | menambah, mengubah, dan menonaktifkan butir manual; kode ganda ditolak | `templat-aturan-db.test.ts` | Lulus |
| IT-templatAturan-05 | Uji pada Contoh tidak melempar galat walau pemeriksa belum tersedia | `templat-aturan-db.test.ts` | Lulus |
| IT-templatAturan-06 | 8a: tanggal berlaku di tengah masa pengusulan ditolak; di luar rentang disimpan dan semua butir Aktif | `templat-aturan-db.test.ts` | Lulus |
| IT-templatAturan-07 | templat versi 2: versi lama Arsip, butir turunan lama Nonaktif pada draf, butir baru Draf | `templat-aturan-db.test.ts` | Lulus |

### Tanpa ID (harus nol)

| ID | Kasus | Berkas | Hasil aktual |
|---|---|---|---|
| (tanpa ID) | KH-ujiNyata-01 (C-21): bagian A sampai H terpotong, berurutan, dan semuanya berisi | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-02 (C-21, C-16): sampul, identitas, anggaran, dan lampiran ekspor BIMA tidak ikut; tanda [ ] dan kalimat petunjuk dibuang | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-03 (C-16): kata per bagian sesudah petunjuk dibuang tidak melebihi batas Isian Substansi | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-04 (C-17, C-21): kata kunci tepat lima; PDF 5 memakai koma (menyimpang dari petunjuk titik koma) | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-05 (C-23): teks untuk LLM tidak memuat identitas pengusul ekspor BIMA | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-01 (C-21): bagian A sampai H terpotong, berurutan, dan semuanya berisi | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-02 (C-21, C-16): sampul, identitas, anggaran, dan lampiran ekspor BIMA tidak ikut; tanda [ ] dan kalimat petunjuk dibuang | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-03 (C-16): kata per bagian sesudah petunjuk dibuang tidak melebihi batas Isian Substansi | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-04 (C-17, C-21): kata kunci tepat lima; PDF 5 memakai koma (menyimpang dari petunjuk titik koma) | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-05 (C-23): teks untuk LLM tidak memuat identitas pengusul ekspor BIMA | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-01 (C-21): bagian A sampai H terpotong, berurutan, dan semuanya berisi | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-02 (C-21, C-16): sampul, identitas, anggaran, dan lampiran ekspor BIMA tidak ikut; tanda [ ] dan kalimat petunjuk dibuang | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-03 (C-16): kata per bagian sesudah petunjuk dibuang tidak melebihi batas Isian Substansi | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-04 (C-17, C-21): kata kunci tepat lima; PDF 5 memakai koma (menyimpang dari petunjuk titik koma) | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-05 (C-23): teks untuk LLM tidak memuat identitas pengusul ekspor BIMA | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-01 (C-21): bagian A sampai H terpotong, berurutan, dan semuanya berisi | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-02 (C-21, C-16): sampul, identitas, anggaran, dan lampiran ekspor BIMA tidak ikut; tanda [ ] dan kalimat petunjuk dibuang | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-03 (C-16): kata per bagian sesudah petunjuk dibuang tidak melebihi batas Isian Substansi | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-04 (C-17, C-21): kata kunci tepat lima; PDF 5 memakai koma (menyimpang dari petunjuk titik koma) | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KH-ujiNyata-05 (C-23): teks untuk LLM tidak memuat identitas pengusul ekspor BIMA | `uji-nyata-isian-substansi.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-01 (J11): judul A. JUDUL ... H. DAFTAR PUSTAKA dikenali; sampul, identitas, anggaran dilewati; judul dokumen = isi bagian Judul | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-02 (J12): variasi spasi dan huruf besar-kecil: 'A.JUDUL', 'b) ringkasan'; teks judul dibakukan menjadi 'A. JUDUL' | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-03 (J13): cukup satu judul berhuruf: bukan mode berhuruf, jadi memakai cara lama (judul dokumen dari blok pertama) | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-04 (J14): mode berhuruf: paragraf bernama bagian tanpa huruf bukan judul; judul gaya Heading tanpa huruf tetap diakui | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-05 (J15): mode berhuruf tanpa bagian Judul pada templat: judul dokumen kosong (sampul tidak dipakai) | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-06 (J16): judul panjang (> 100 karakter) bukan judul bagian; blok bukan paragraf/judul (gambar) tidak dicocokkan | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-07 (J17): kalimat petunjuk terpecah beberapa baris dibuang; isian [ ... ] dilepas; kata kunci multibaris digabung | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-08 (J18): bagian Kata Kunci memakai awalan 'Kata kunci:' pada isian berhuruf | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-09 (J19): hanya bagian terakhir yang dipotong dari lampiran ekspor; bagian Daftar Pustaka dipotong sesudah entri terakhir | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-potongIsian-10 (J20): bagian templat tanpa petunjuk resmi atau kalimat petunjuk dari atribut bagian: atribut dipakai | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-normalisasiJudul-huruf: 'A. JUDUL' menjadi 'judul'; huruf tanpa jarak setelah titik tidak dihapus | `pengajuan-potong-isian.test.ts` | Lulus |
| (tanpa ID) | KP-panduanBagian-02b: atribut petunjuk pada bagian lebih diutamakan daripada petunjuk resmi turunan nama | `templat-dokumen.test.ts` | Lulus |

