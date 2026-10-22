# Laporan uji SEMAR

Dibangkitkan otomatis oleh `npm run laporan-uji` pada 22 Oktober 2026 pukul 20.29 WIB. Jangan disunting tangan.

Pendekatan: uji unit dua jenis menurut Dennis dkk. (2015, hlm. 471-475). *Black box* (KH, `tests/unit/kotak-hitam/`) diturunkan dari kontrak, kartu CRC, *state machine*, dan *real use case*; *white box* (KP, `tests/unit/kotak-putih/`) diturunkan dari spesifikasi metode dan menjalankan setiap cabang; tes integrasi (IT, `tests/integrasi/`) berjalan pada basis data uji dan dilewati bila tidak tersedia. Stub BIMA dan LLM ada di `tests/unit/stub/`.

## Ringkasan

| Jenis | Lulus | Gagal | Dilewati |
|---|---:|---:|---:|
| Kotak hitam (KH) | 104 | 0 | 0 |
| Kotak putih (KP) | 53 | 0 | 0 |
| Integrasi (IT) | 0 | 0 | 24 |
| Tanpa ID | 0 | 0 | 0 |

Cakupan cabang `src/lib/**` (kecuali pengecualian di `vitest.config.mts`): **80,7%** (513 dari 636 cabang); ambang minimum 80% (terpenuhi). Pernyataan 92,5%, fungsi 94,0%, baris 93,9%.

## Cakupan cabang per modul

| Modul | Cabang tercakup | Persen |
|---|---:|---:|
| `src/lib/(berkas langsung)` | 40 / 43 | 93,0% |
| `src/lib/aturan` | 75 / 92 | 81,5% |
| `src/lib/bima` | 22 / 33 | 66,7% |
| `src/lib/pemantauan` | 21 / 31 | 67,7% |
| `src/lib/pemeriksa` | 199 / 254 | 78,3% |
| `src/lib/pengajuan` | 77 / 94 | 81,9% |
| `src/lib/penilaian` | 16 / 16 | 100,0% |
| `src/lib/penugasan` | 26 / 35 | 74,3% |
| `src/lib/templat` | 37 / 38 | 97,4% |

## Hasil aktual per ID

### Kotak hitam (KH)

| ID | Kasus | Berkas | Hasil aktual |
|---|---|---|---|
| KH-bentukNamaBerkas-01 | aksen dihilangkan, spasi menjadi garis bawah, karakter terlarang diganti | `unduhan-akses.test.ts` | Lulus |
| KH-bentukNamaBerkas-02 | nama kosong atau semua simbol memakai cadangan | `unduhan-akses.test.ts` | Lulus |
| KH-bolehUnduhBerkasProposal-01 | Tim Kerja selalu boleh | `unduhan-akses.test.ts` | Lulus |
| KH-bolehUnduhBerkasProposal-02 | reviewer hanya bila ditugaskan pada proposal itu | `unduhan-akses.test.ts` | Lulus |
| KH-bolehUnduhBerkasProposal-03 | pengusul tidak boleh walau punya penugasan palsu | `unduhan-akses.test.ts` | Lulus |
| KH-buatDokumenTemplat-01 | hasilnya .docx yang valid (ZIP berkepala PK) dan tidak kosong | `templat-dokumen.test.ts` | Lulus |
| KH-buatDokumenTemplat-02 | terbaca balik, bagian sama dan urutan sama dengan templat | `templat-dokumen.test.ts` | Lulus |
| KH-buatDokumenTemplat-03 | judul dokumen memuat nama skema; panduan batas kata dan wajib/opsional ada di bawah judul bagian | `templat-dokumen.test.ts` | Lulus |
| KH-buatDokumenTemplat-04 | bagian Kata Kunci dan Daftar Pustaka ditambahkan bila templat belum memuatnya | `templat-dokumen.test.ts` | Lulus |
| KH-buatDokumenTemplat-05 | urutan bagian mengikuti nomor urutan, bukan urutan larik masukan | `templat-dokumen.test.ts` | Lulus |
| KH-cekKataKunci-01 | tepat lima dipisah titik koma, boleh frasa | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekKataKunci-02 | enam gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekKataKunci-03 | dipisah koma dikenali sebagai pemisah salah | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekKataKunci-04 | kosong gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-01 | lampiran belum ada disebut dengan nama | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-02 | judul bagian dengan penomoran tetap dikenali | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-03 | bagian hilang dan urutan salah gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-04 | judul beda dari BIMA gagal, perbedaan huruf besar dan tanda baca lolos | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-05 | diagram alir butuh keterangan gambar yang menyebutnya | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cekLampiranStruktur-06 | butir tanpa parameter gagal tertutup | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cn-01 | menggabungkan kelas dan membuang nilai palsu | `utils.test.ts` | Lulus |
| KH-cn-02 | kelas Tailwind yang bentrok: yang terakhir menang | `utils.test.ts` | Lulus |
| KH-cn-03 | masukan bersyarat berbentuk objek dan larik | `utils.test.ts` | Lulus |
| KH-cn-04 | tanpa masukan menghasilkan string kosong | `utils.test.ts` | Lulus |
| KH-cocokkanKutipan-01 | abaikan perbedaan spasi dan baris baru, tetapi persis pada kata | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanKutipan-02 | mengembalikan rentang di teks asli | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanKutipan-03 | karakter regex dalam kutipan tidak merusak pencarian | `semantik-kutipan.test.ts` | Lulus |
| KH-cocokkanSitasi-01 | sitasi gaya nama-tahun gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-02 | rentang dan daftar nomor diperluas | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-03 | urutan pengutipan pertama yang melompat gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-04 | nomor entri daftar pustaka loncat gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-05 | nomor dikutip tanpa entri dilaporkan | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-cocokkanSitasi-06 | tanpa Daftar Pustaka gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-dispositionUnduhan-01 | lampiran dengan filename ASCII dan filename* UTF-8 | `unduhan-akses.test.ts` | Lulus |
| KH-dispositionUnduhan-02 | tanda kutip dan pemisah baris tidak lolos ke header (pencegahan injeksi header) | `unduhan-akses.test.ts` | Lulus |
| KH-formatAngka-01 | pemisah ribuan titik | `utils.test.ts` | Lulus |
| KH-formatPersen-01 | memakai koma desimal | `pemantauan-rekap.test.ts` | Lulus |
| KH-formatTanggal-01 | tanggal valid ditulis hari bulan tahun menurut WIB; kosong menjadi tanda hubung | `utils.test.ts` | Lulus |
| KH-formatWaktu-01 | waktu ditutup dengan WIB; kosong menjadi tanda hubung | `utils.test.ts` | Lulus |
| KH-hitungKata-01 | tidak menghitung tabel, gambar, dan keterangannya | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-hitungKata-02 | selaras dengan penghitung pembangkit contoh bila tanpa keterangan | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-hitungKata-03 | tanpa toleransi: tepat pada batas lolos, satu lebih gagal | `deterministik-pemeriksa.test.ts` | Lulus |
| KH-itemAktif-01 | jalur layar dan layar turunannya menandai menu induk | `menu-peran.test.ts` | Lulus |
| KH-itemAktif-02 | J-05b (rincian proposal) menandai Pemantauan Kesesuaian | `menu-peran.test.ts` | Lulus |
| KH-itemAktif-03 | awalan serupa tetapi bukan segmen yang sama tidak cocok; jalur asing tidak menandai apa pun | `menu-peran.test.ts` | Lulus |
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
| KH-potongTeks-01 | memotong naskah contoh menjadi tujuh bagian bertemplat dengan judul dan kata kunci | `pengajuan-ekstraksi.test.ts` | Lulus |
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
| KH-sesiToken-01 | token SSO dan sesi memiliki audiens berbeda | `fondasi.test.ts` | Lulus |
| KH-sesiToken-02 | jalurAman menolak open redirect | `fondasi.test.ts` | Lulus |
| KH-tingkatKeyakinan-01 | memetakan ambang 0,8 dan 0,5 | `fondasi.test.ts` | Lulus |
| KH-tokenPengajuan-01 | membawa idProposal dan identitas pengusul; token rusak ditolak | `pengajuan-ekstraksi.test.ts` | Lulus |
| KH-turunkanButir-01 | membuat butir bagian wajib, batas kata, dan lampiran | `fondasi.test.ts` | Lulus |
| KH-uraikanAturanHitung-01 | kata kunci tepat lima, dipisah titik koma | `aturan-parameter.test.ts` | Lulus |
| KH-uraikanAturanHitung-02 | sitasi dan daftar pustaka | `aturan-parameter.test.ts` | Lulus |
| KH-uraikanAturanHitung-03 | aturan yang butuh bagian | `aturan-parameter.test.ts` | Lulus |
| KH-uraikanAturanHitung-04 | aturan tak dikenali ditolak dengan petunjuk | `aturan-parameter.test.ts` | Lulus |
| KH-validasiButir-01 | menandai isian wajib yang kosong | `aturan-parameter.test.ts` | Lulus |
| KH-validasiButir-02 | butir deterministik: parameter, pemeriksa, dan komponen diturunkan | `aturan-parameter.test.ts` | Lulus |
| KH-validasiButir-03 | butir semantik wajib pertanyaan dan bagian; lampiran menentukan komponen | `aturan-parameter.test.ts` | Lulus |
| KH-validasiButir-04 | kode dengan karakter tidak sah ditolak | `aturan-parameter.test.ts` | Lulus |
| KH-validasiButir-05 | ringkasan parameter | `aturan-parameter.test.ts` | Lulus |
| KH-validasiKoreksi-01 | alasan kosong atau spasi ditolak dengan pesan baku | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-02 | masukan lengkap valid | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-03 | keputusan dan jenis di luar daftar ditolak | `penilaian-validasi.test.ts` | Lulus |
| KH-validasiKoreksi-04 | kosong diterima; hanya alasan yang wajib | `penilaian-validasi.test.ts` | Lulus |
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
| KP-buatDokumenTemplat-01 | periode null menulis 'belum ditetapkan'; tanpa lampiran menulis 'Tidak ada lampiran wajib' | `templat-dokumen.test.ts` | Lulus |
| KP-buatDokumenTemplat-02 | periode terisi menulis nama dan tahun; lampiran bernomor | `templat-dokumen.test.ts` | Lulus |
| KP-buatDokumenTemplat-03 | periode tanpa tahun tidak menulis tanda kurung | `templat-dokumen.test.ts` | Lulus |
| KP-ekstrakNaskah-01 | PDF: judul bagian dikenali dari nama templat | `pengajuan-ekstraksi.test.ts` | Lulus |
| KP-ekstrakNaskah-02 | format tidak dikenal ditolak | `pengajuan-ekstraksi.test.ts` | Lulus |
| KP-ekstrakNaskah-03 | teks lampiran PDF terbaca; berkas rusak menghasilkan teks kosong | `pengajuan-ekstraksi.test.ts` | Lulus |
| KP-klienBima-01 | berhasil pada percobaan ketiga | `bima-client.test.ts` | Lulus |
| KP-klienBima-02 | gagal setelah 3 percobaan total | `bima-client.test.ts` | Lulus |
| KP-klienBima-03 | tidak mengulang galat 4xx | `bima-client.test.ts` | Lulus |
| KP-klienBima-04 | mengulang galat jaringan | `bima-client.test.ts` | Lulus |
| KP-klienBima-05 | stub BIMA memuat reviewer, mengirim penugasan, dan mencatat panggilan | `bima-client.test.ts` | Lulus |
| KP-klienBima-06 | ambilBerkas mengembalikan bytes dan tipe; berkas tak ada gagal 404 tanpa ulang | `bima-client.test.ts` | Lulus |
| KP-klienBima-07 | setiap metode memanggil jalur dan metode HTTP yang benar | `bima-client.test.ts` | Lulus |
| KP-klienBima-08 | ambilProposal mengodekan id pada URL | `bima-client.test.ts` | Lulus |
| KP-mintaJawaban-01 | berhasil pada percobaan kedua | `semantik-mesin.test.ts` | Lulus |
| KP-mintaJawaban-02 | gagal dua kali menghasilkan null (S-2) | `semantik-mesin.test.ts` | Lulus |
| KP-nilaiSemantikDenganOpsi-01 | hanya butir semantik, urutan terjaga, bagian kosong tanpa memanggil LLM | `semantik-mesin.test.ts` | Lulus |
| KP-nilaiSemantikDenganOpsi-02 | mode tiruan: kutipan salinan persis dari teks, tiruan true | `semantik-mesin.test.ts` | Lulus |
| KP-panduanBagian-01 | Kata Kunci memakai panduan pemisah titik koma | `templat-dokumen.test.ts` | Lulus |
| KP-panduanBagian-02 | Daftar Pustaka memakai panduan urutan sitasi (nama dinormalisasi, penomoran diabaikan) | `templat-dokumen.test.ts` | Lulus |
| KP-panduanBagian-03 | batas kata null menjadi tanpa batas; angka diformat Indonesia | `templat-dokumen.test.ts` | Lulus |
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
| KP-siapkanTeksTanpaIdentitas-01 | membuang nama (dengan dan tanpa gelar), institusi, dan nomor induk | `semantik-mesin.test.ts` | Lulus |
| KP-siapkanTeksTanpaIdentitas-02 | tanpa identitas, teks tidak berubah | `semantik-mesin.test.ts` | Lulus |
| KP-susunUsulanMurni-01 | tidak pernah memilih reviewer dari institusi pengusul | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-02 | meratakan beban dan tidak melampaui batas | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-03 | memperhitungkan beban awal (penugasan yang sudah ditetapkan) | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-04 | S-1: melaporkan proposal yang belum dapat ditugaskan bila reviewer kurang | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-05 | S-1: proposal tanpa reviewer berinstitusi berbeda tidak dapat ditugaskan | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-06 | menggeser proposal lain bila greedy buntu (jalur penambah) | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurni-07 | hasil deterministik untuk masukan yang sama | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurniSkala-01 | membagi seluruh proposal dengan beda institusi, beban rata, dan cepat (< 3 dtk) | `penugasan-susun.test.ts` | Lulus |
| KP-susunUsulanMurniSkala-02 | S-1 cepat bila batas diturunkan di bawah kapasitas (60 x 130 < 10.000) | `penugasan-susun.test.ts` | Lulus |
| KP-tentukanSasaran-01 | butir atas lampiran memakai teks lampiran sebagai sasaran utama | `semantik-mesin.test.ts` | Lulus |

### Integrasi (IT)

| ID | Kasus | Berkas | Hasil aktual |
|---|---|---|---|
| IT-basisData-01 | berkas: simpan dan ambil (adaptor bytea bila tanpa token Blob) | `basis-data.test.ts` | Dilewati |
| IT-basisData-02 | log_audit: hanya bisa ditambah | `basis-data.test.ts` | Dilewati |
| IT-idempotensi-01 | kotak masuk BIMA: kunci yang sama tidak menambah baris ganda (keputusan dan penugasan) | `idempotensi.test.ts` | Dilewati |
| IT-idempotensi-02 | kotak masuk BIMA: dua permintaan serentak untuk kelompok yang sama menghasilkan satu baris per kunci | `idempotensi.test.ts` | Dilewati |
| IT-idempotensi-03 | jalan pintas UC-05b: naskah BIMA dipulihkan ke seed pada pemakaian berulang | `idempotensi.test.ts` | Dilewati |
| IT-pengajuan-01 | contoh A: semua butir lolos, proposal Terkirim dengan bukti pengiriman | `pengajuan-db.test.ts` | Dilewati |
| IT-pengajuan-02 | token yang sama tidak membuat versi ganda | `pengajuan-db.test.ts` | Dilewati |
| IT-pengajuan-03 | contoh B: Ditahan, butir gagal paling atas dengan bagian dan batas; diajukan ulang tanpa batas token membuat versi baru | `pengajuan-db.test.ts` | Dilewati |
| IT-pengajuan-04 | contoh C lalu masa ditutup: Ditahan, kemudian Ditolak tanpa versi baru (3a) | `pengajuan-db.test.ts` | Dilewati |
| IT-pengajuan-05 | proposal milik pengusul lain tidak dapat dibuka atau diajukan | `pengajuan-db.test.ts` | Dilewati |
| IT-penilaian-01 | UC-09: jalankanPemeriksaanSemantik menyimpan hasil per butir semantik, kutipan sah, berlabel tiruan | `penilaian-reviewer.test.ts` | Dilewati |
| IT-penilaian-02 | NFR 3.1: reviewer lain mendapat 403; reviewer pemilik lolos | `penilaian-reviewer.test.ts` | Dilewati |
| IT-penilaian-03 | J-07 hanya memuat penugasan milik sendiri | `penilaian-reviewer.test.ts` | Dilewati |
| IT-penilaian-04 | J-08 memuat tab, butir, dan membuka cepat tanpa LLM (NFR 2.3) | `penilaian-reviewer.test.ts` | Dilewati |
| IT-penilaian-05 | UC-08: koreksi tanpa alasan ditolak; dengan alasan tersimpan dan rekomendasi semula tidak berubah | `penilaian-reviewer.test.ts` | Dilewati |
| IT-penilaian-06 | S-1: simpan sementara memberi label Draf tanpa log audit dan tanpa kirim ke BIMA | `penilaian-reviewer.test.ts` | Dilewati |
| IT-penilaian-07 | simpan permanen menolak komponen belum lengkap; lengkap -> Final, Selesai, log audit, terkirim ke BIMA | `penilaian-reviewer.test.ts` | Dilewati |
| IT-templatAturan-01 | S-1: skema baru belum punya templat; Susun Versi Baru membuat versi 1 | `templat-aturan-db.test.ts` | Dilewati |
| IT-templatAturan-02 | S-2, 9a, lalu terbit: butir turunan berstatus Draf dan terkunci | `templat-aturan-db.test.ts` | Dilewati |
| IT-templatAturan-03 | 4a: butir turunan templat ditolak diubah dan tidak dapat dinonaktifkan | `templat-aturan-db.test.ts` | Dilewati |
| IT-templatAturan-04 | menambah, mengubah, dan menonaktifkan butir manual; kode ganda ditolak | `templat-aturan-db.test.ts` | Dilewati |
| IT-templatAturan-05 | Uji pada Contoh tidak melempar galat walau pemeriksa belum tersedia | `templat-aturan-db.test.ts` | Dilewati |
| IT-templatAturan-06 | 8a: tanggal berlaku di tengah masa pengusulan ditolak; di luar rentang disimpan dan semua butir Aktif | `templat-aturan-db.test.ts` | Dilewati |
| IT-templatAturan-07 | templat versi 2: versi lama Arsip, butir turunan lama Nonaktif pada draf, butir baru Draf | `templat-aturan-db.test.ts` | Dilewati |

