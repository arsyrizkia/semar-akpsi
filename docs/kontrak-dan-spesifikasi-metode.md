# Kontrak (*Contract*) dan Spesifikasi Metode (*Method Specification*) SEMAR

## 1. Pendahuluan

Dokumen ini melengkapi model berorientasi objek naskah kelompok (kartu CRC, *class diagram*, *sequence diagram*, *state machine*) dengan dua artefak yang belum ada di naskah: kontrak (formulir Gambar 8-22, Dennis, Wixom, dan Tegarden, 2015, hlm. 309) dan spesifikasi metode (formulir Gambar 8-26, hlm. 315, dengan algoritma dalam *Structured English*, hlm. 316). Nama kelas dan metode mengikuti naskah, sedangkan tanda tangan, tipe data, dan batas nilai ditulis dari kode prototipe di `src/lib/**` (keadaan 22 Okt 2026). Dokumen ini menjadi sumber rencana uji unit pada `docs/rencana-uji.md` sesuai Gambar 12-4 (hlm. 472): uji *black box* diturunkan dari CRC, *class diagram*, dan kontrak (pra- dan pascakondisi), sedangkan uji *white box* diturunkan dari spesifikasi metode (setiap jalur `[J…]`). Pra-kondisi dan pascakondisi diberi nomor `[P…]` dan `[Q…]` agar tiap butir dapat menjadi satu kasus uji. Bila kode dan naskah berbeda, yang ditulis di butir kontrak adalah perilaku kode, dan perbedaannya dicatat pada baris "Catatan" serta dirangkum di bagian 6.

Konvensi: "Clients" memakai nama objek pada `docs/sumber/sequence/seq-ucXX.puml`; `berkas:fungsi` relatif terhadap `src/lib/`; "Galat" berarti `throw`; "ditolak" berarti nilai kembalian berstatus gagal tanpa efek samping pada basis data. Kolom "ID uji" pada tabel ringkas diisi perakit uji.

## 2. Tabel ringkas

| ID | Kelas.metode | Berkas:fungsi implementasi | UC terkait | ID uji |
|---|---|---|---|---|
| C-01 | TemplatProposal.periksaKelengkapan | `templat/kelengkapan.ts:periksaKelengkapan` | UC-01 | — |
| C-02 | TemplatProposal.terbitkan | `templat/layanan.ts:terbitkan` | UC-01 | — |
| C-03 | TemplatProposal.turunkanButirCek | `seed-butir.ts:turunkanButirDariTemplat` (alias `templat/layanan.ts:turunkanButirCek`) | UC-01 | — |
| C-04 | TemplatProposal.arsipkan | `templat/layanan.ts:arsipkan` (privat, lewat `gantiTemplatBerlaku`) | UC-01 | — |
| C-05 | SkemaPendanaan.cekPengusulanBerjalan | `waktu.ts:masaPengusulanBerjalan` (alias `templat/layanan.ts:cekPengusulanBerjalan`) | UC-01 | — |
| C-06 | ButirCek.aturParameter / ubahParameter | `aturan/parameter.ts:validasiButir`, `aturan/parameter.ts:uraikanAturanHitung`, `aturan/layanan.ts:simpanButir` | UC-02, UC-01 | — |
| C-07 | ButirCek.nonaktifkan | `aturan/layanan.ts:nonaktifkanButir` (alias `nonaktifkan`), `templat/layanan.ts:nonaktifkanTurunanLama` | UC-02, UC-01 | — |
| C-08 | BasisAturan.validasiTanggalBerlaku | `aturan/tanggal.ts:validasiTanggalBerlaku` | UC-02 | — |
| C-09 | BasisAturan.simpanVersiBaru | `aturan/layanan.ts:simpanVersiBaru` | UC-02 | — |
| C-10 | BasisAturan.ujiPadaContoh | `aturan/layanan.ts:ujiPadaContoh` | UC-02 | — |
| C-10a | Uji pada Contoh bertahap | `aturan/uji-jalan.ts` | UC-02 | — |
| C-11 | PeriodeSeleksi.cekMasaPengusulan | `pengajuan/layanan.ts:cekMasaPengusulan` | UC-05 | — |
| C-12 | PeriodeSeleksi.tetapkanBatasBeban | `penugasan/layanan.ts:tetapkanBatasBeban` | UC-03 | — |
| C-13 | PeriodeSeleksi.susunPenugasan | `penugasan/layanan.ts:susunPenugasan`, `penugasan/aturan.ts:susunUsulanMurni` | UC-03 | — |
| C-14 | PenugasanReviewer.pilihReviewer | `penugasan/layanan.ts:pilihReviewer`, `penugasan/aturan.ts:periksaSyarat` | UC-03 | — |
| C-15 | PenugasanReviewer.tetapkan | `penugasan/layanan.ts:tetapkanPenugasan` (alias `tetapkan`) | UC-03 | — |
| C-16 | ButirCek.hitungKata | `pemeriksa/deterministik/teks.ts:hitungKata`, `pemeriksa/deterministik/pemeriksa.ts:periksaBatasKata` | UC-06, UC-02 | — |
| C-17 | ButirCek.cekKataKunci | `pemeriksa/deterministik/pemeriksa.ts:cekKataKunci` | UC-06 | — |
| C-18 | ButirCek.cocokkanSitasi | `pemeriksa/deterministik/pemeriksa.ts:cocokkanSitasi` | UC-06 | — |
| C-19 | ButirCek.cekLampiran | `pemeriksa/deterministik/pemeriksa.ts:cekLampiran` | UC-06 | — |
| C-20 | ButirCek.cocokkanStrukturJudul | `pemeriksa/deterministik/pemeriksa.ts:cocokkanStrukturJudul` | UC-06 | — |
| C-21 | TemplatProposal.potongPerBagian | `pengajuan/potong.ts:potongPerBagian` (alias `potongTeks`) | UC-05 | — |
| C-22 | Proposal.catatTerkirim | `pengajuan/layanan.ts:catatTerkirim` | UC-05 | — |
| C-23 | VersiProposal.siapkanTeksTanpaIdentitas | `pemeriksa/semantik/teks.ts:siapkanTeksTanpaIdentitas` (+ `buangIdentitasBima`, `kumpulkanIdentitasBima`) | UC-09 | — |
| C-24 | ButirCek.cocokkanKutipan | `pemeriksa/semantik/teks.ts:cocokkanKutipan` (memakai `cariKutipan`) | UC-09 | — |
| C-25 | BasisAturan.periksaSemantik / ButirCek.nilaiSemantik | `pemeriksa/semantik/mesin.ts:nilaiSemantikDenganOpsi` (alias `nilaiSemantik`, `periksaSemantik`; entri `semantik/index.ts:nilaiSemantikTeks`), `pemeriksa/semantik/jalankan.ts:jalankan` | UC-09 | — |
| C-26 | KoreksiRekomendasi.simpanKoreksi | `penilaian/layanan.ts:simpanKoreksi`, `penilaian/validasi.ts:validasiKoreksi` | UC-08 | — |
| C-27 | Penilaian.simpanNilai | `penilaian/layanan.ts:simpanNilai` (dipanggil `simpanSementara`, `simpanPermanen`) | UC-07 | — |
| C-28 | Penilaian.terima / PenugasanReviewer.tandaiSelesai | `penilaian/layanan.ts:simpanPermanen`, `penilaian/layanan.ts:terima`, `penilaian/layanan.ts:tandaiSelesai` | UC-07 | — |
| C-29 | BasisAturan.rekapKesesuaian / ButirCek.hitungTingkatKoreksi | `pemantauan/rekap.ts:rekapKesesuaian`, `pemantauan/layanan.ts:susunLaporan` | UC-04 | — |
| C-30 | BasisAturan.tandaiButir / ButirCek.tandaiPerluDitinjau | `pemantauan/layanan.ts:tandaiButir` | UC-04 | — |
| C-31 | TemplatProposal.buatDokumenTemplat | `templat/dokumen.ts:buatDokumenTemplat`, `templat/isian-substansi.ts` | UC-01 (tambahan prototipe: unduh .docx) | — |

| ID | Metode | Kontrak | Berkas:fungsi | ID uji |
|---|---|---|---|---|
| MS-01 | potongPerBagian | C-21 | `pengajuan/potong.ts:potongPerBagian` | — |
| MS-02 | hitungKata | C-16 | `pemeriksa/deterministik/teks.ts:hitungKata` | — |
| MS-03 | cocokkanSitasi | C-18 | `pemeriksa/deterministik/pemeriksa.ts:cocokkanSitasi` | — |
| MS-04 | susunPenugasan | C-13 | `penugasan/layanan.ts:susunPenugasan`, `penugasan/aturan.ts:susunUsulanMurni` | — |
| MS-05 | pilihReviewer | C-14 | `penugasan/layanan.ts:pilihReviewer`, `penugasan/aturan.ts:periksaSyarat` | — |
| MS-04a | cekKelayakan | C-13 | `penugasan/aturan.ts:cekKelayakan` | KP-cekKelayakan-* |
| MS-04b | batasTerkecilCukup | C-13 | `penugasan/aturan.ts:batasTerkecilCukup` | KP-batasTerkecilCukup-* |
| MS-04c | susunUsulan | C-13 | `penugasan/aturan.ts:susunUsulan` | KP-susunUsulan-* |
| MS-05a | rencanakanPindah | C-14a | `penugasan/aturan.ts:rencanakanPindah`, `penugasan/layanan.ts:pindahkanBanyak` | KP-rencanakanPindah-* |
| MS-20 | ringkasBeban | — | `penugasan/periode.ts:ringkasBeban` | KP-ringkasBeban-* |
| MS-06 | periksaSemantik: batas waktu, percobaan ulang, status | C-25 | `pemeriksa/semantik/mesin.ts:{mintaJawaban, periksaSatu, bentukHasil}`, `pemeriksa/semantik/jalankan.ts:{klaimJob, jalankan}` | — |
| MS-07 | cocokkanKutipan | C-24 | `pemeriksa/semantik/teks.ts:cocokkanKutipan` | — |
| MS-08 | siapkanTeksTanpaIdentitas | C-23 | `pemeriksa/semantik/teks.ts:siapkanTeksTanpaIdentitas` | — |
| MS-09 | rekapKesesuaian / hitungTingkatKoreksi | C-29 | `pemantauan/rekap.ts:rekapKesesuaian` | — |
| MS-10 | buatDokumenTemplat | C-31 | `templat/dokumen.ts:buatDokumenTemplat`, `bagianDokumen`, `panduanBagian` | — |
| MS-11 | terbitkan (9a, arsipkan, turunkanButirCek) | C-02 | `templat/layanan.ts:{terbitkan, gantiTemplatBerlaku, arsipkan, nonaktifkanTurunanLama}`, `seed-butir.ts:turunkanButirDariTemplat` | — |
| MS-12 | validasiTanggalBerlaku | C-08 | `aturan/tanggal.ts:validasiTanggalBerlaku` | — |
| MS-13 | cekKataKunci | C-17 | `pemeriksa/deterministik/pemeriksa.ts:cekKataKunci` | — |
| MS-15 | cekTabel, periksaDiagramAlir, periksaBagianTerisi | C-03 | `pemeriksa/deterministik/pemeriksa.ts` | — |
| MS-16 | turunkanButirCek | C-03 | `seed-butir.ts:turunkanButirDariTemplat` | — |
| MS-17 | cekFormatLampiran | C-19 | `pemeriksa/deterministik/pemeriksa.ts:cekFormatLampiran` | — |
| MS-14 | uraikanAturanHitung / validasiButir | C-06 | `aturan/parameter.ts:{uraikanAturanHitung, validasiButir}` | — |

## 3. Contracts

Tipe yang dirujuk berada di `kontrak/tipe.ts` (`ButirCek`, `DokumenPeriksa`, `KonteksPeriksa`, `HasilButirDeterministik`, `HasilButirSemantik`, `HasilSusunPenugasan`, `HasilPilihReviewer`, `BagianTemplatDto`, `ParameterButir`). `HasilPeriksa` = `{ status: "Lolos"|"Gagal"; angkaPembukti: string; bagian: string|null; batasDilanggar: string|null }` (`pemeriksa/deterministik/pemeriksa.ts`). Angka pada `angkaPembukti` berformat Indonesia (titik pemisah ribuan, mis. `1.240`).

### C-01 TemplatProposal.periksaKelengkapan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `periksaKelengkapan` / TemplatProposal / C-01 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc01, langkah `periksaKelengkapan()`); dalam kode dipanggil `TemplatProposal.terbitkan` (C-02) dan formulir J-02b di peramban |
| Associated Use Cases | UC-01 langkah 7, SubFlow S-2 |
| Description of Responsibilities | Menentukan apakah isian templat (bagian, lampiran wajib, periode berlaku) sudah lengkap untuk diterbitkan, dan menandai isian yang masih salah. Tidak menyimpan apa pun. |
| Arguments Received | `m: MasukanKelengkapan` = `{ bagian: { nama: string; batas: string; tanpaBatas: boolean; wajib: boolean }[]; lampiran: string[]; periodeBerlakuId: string \| null }` |
| Type of Value Returned | `HasilKelengkapan` = `{ lengkap: boolean; bagian: { nama: boolean; batas: boolean }[]; lampiran: boolean[]; periode: boolean; tanpaBagian: boolean }` (nilai `true` pada penanda berarti isian itu perlu diperbaiki) |
| Pre-Conditions | [P1] `m.bagian`, `m.lampiran` adalah larik (boleh kosong). Tidak ada akses basis data. |
| Post-Conditions | [Q1] `tanpaBagian = (m.bagian.length = 0)`; larik `hasil.bagian` dan `hasil.lampiran` sepanjang masukannya.<br>[Q2] `periode = true` bila `periodeBerlakuId` null atau string kosong.<br>[Q3] `hasil.bagian[i].nama = true` bila nama kosong setelah `trim`, atau nama (tanpa membedakan huruf besar-kecil, setelah `trim`) muncul lebih dari satu kali.<br>[Q4] `hasil.bagian[i].batas = true` bila `tanpaBatas = false` dan `batas` bukan bilangan bulat positif (`/^\d{1,6}$/` setelah `trim` dan nilai > 0). Batas: `"1"` sah; `"999999"` sah; `"0"`, `"-5"`, `"12.5"`, `"1000000"` (7 digit), `""`, `"abc"` tidak sah. Bila `tanpaBatas = true`, `batas` apa pun diabaikan.<br>[Q5] `hasil.lampiran[i] = true` bila nama lampiran kosong setelah `trim`.<br>[Q6] `lengkap = true` jika dan hanya jika `tanpaBagian = false`, `periode = false`, tidak ada penanda `nama`/`batas` aktif, dan tidak ada penanda lampiran aktif.<br>[Q7] Tidak mengubah `m`. |
| Catatan | Bab 10 UC-01 langkah 7 hanya menyebut nama, batas kata, dan periode terisi. Kode menambah: nama bagian tidak boleh ganda, minimal satu bagian, dan nama lampiran tidak boleh kosong. `lampiran` ganda tidak diperiksa. |

### C-02 TemplatProposal.terbitkan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `terbitkan` / TemplatProposal / C-02 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc01, `terbitkan()`) |
| Associated Use Cases | UC-01 langkah 7 sampai 10, S-2, alur 9a (6a Bab 7) |
| Description of Responsibilities | Menerbitkan draf templat menjadi templat berlaku skema: memeriksa kelengkapan, menolak bila masa pengusulan berjalan (disimpan sebagai draf), mengarsipkan templat lama beserta butir turunannya, lalu menurunkan butir cek baru. |
| Arguments Received | `m: MasukanTerbitkan` = `{ skemaId: string; templatId: string; isian: MasukanKelengkapan; pelaku: { id: string \| null; idBima: string }; masaBerjalan?: boolean }` (`masaBerjalan` hanya untuk uji, menggantikan C-05) |
| Type of Value Returned | `Promise<HasilTerbitkan>` = `{hasil:"tidak-ditemukan"; pesan}` \| `{hasil:"tidak-lengkap"; kelengkapan: HasilKelengkapan}` \| `{hasil:"draf-disimpan"; versi}` \| `{hasil:"terbit"; versi; jumlahButir}` |
| Pre-Conditions | [P1] Pemanggil memiliki hak pengelola (dijaga `aturan/akses.ts:pelakuPengelola` di lapisan aksi, NFR 3.2).<br>[P2] Basis data tersedia. |
| Post-Conditions | [Q1] Bila templat `templatId` tidak ada, `skemaId` tidak cocok, atau statusnya bukan `Draf` (mis. sudah Terbit): hasil `tidak-ditemukan`, tidak ada perubahan.<br>[Q2] Bila `periksaKelengkapan(isian).lengkap = false`: hasil `tidak-lengkap` membawa penanda isian; tidak ada perubahan pada basis data.<br>[Q3] Bila lengkap dan masa pengusulan berjalan (9a): isian disimpan ke templat (bagian diganti, lampiran, periode), status tetap `Draf`, templat Terbit lama tidak berubah, tidak ada butir diturunkan; hasil `draf-disimpan` dengan `versi` templat itu; log `templat.simpan-draf`.<br>[Q4] Bila lengkap dan masa tidak berjalan: templat menjadi `Terbit` dengan `diterbitkanPada` = jam demo; semua templat `Terbit` sebelumnya skema itu menjadi `Arsip`; butir turunan (`asal = templat`) milik templat lama pada draf basis aturan menjadi `Nonaktif`; butir turunan baru dibuat berstatus `Draf` pada draf basis aturan (lihat C-03); hasil `terbit` dengan `jumlahButir` = jumlah butir baru; log `templat.terbit`.<br>[Q5] Setelah [Q4], paling banyak satu templat `Terbit` untuk skema itu.<br>[Q6] Urutan bagian tersimpan 1..n sesuai urutan isian. |
| Catatan | Pada [Q3] isian tersimpan sebelum cabang 9a (templat draf berisi isian terakhir). Penggantian templat berjalan dalam satu transaksi; penyimpanan isian (`simpanIsian`) berada di luar transaksi itu. |

### C-03 TemplatProposal.turunkanButirCek

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `turunkanButirCek` / TemplatProposal / C-03 |
| Clients (Consumers) | `templat : TemplatProposal` (pesan ke diri sendiri, seq-uc01 langkah 10); `seed.ts` untuk data awal |
| Associated Use Cases | UC-01 langkah 10; hasilnya ditinjau di UC-02 |
| Description of Responsibilities | Menurunkan butir cek deterministik terkunci dari bagian wajib, batas kata, dan lampiran wajib sebuah templat, sehingga batas kata cukup ditetapkan sekali. |
| Arguments Received | `bagian: BagianSeed[]` = `{ nama; batasKata; wajib; jenisIsian?; jumlahButir?; pemisah?; wajibGambar?; sitasiBernomor?; daftarPustaka? }[]` (berurutan); `lampiranWajib: string[]`; `lampiranTemplat: LampiranTemplat[]` (opsional) |
| Type of Value Returned | `ButirSeed[]` (`kode, deskripsi, jenis:"deterministik", asal:"templat", komponen, pemeriksa, parameter: ParameterButir, aturanHitung`) |
| Pre-Conditions | [P1] Masukan sudah lolos C-01 (nama tidak kosong). Fungsi murni, tanpa basis data. |
| Post-Conditions | [Q1] Untuk setiap bagian dengan `wajib = true`: tepat satu butir `BGN-nn` (`parameter = {tipe:"bagian_terisi", bagian}`, pemeriksa `periksaBagianTerisi`, komponen `Screening`); bagian terisi bila berisi kata atau penanda tabel/gambar.<br>[Q2] Untuk setiap bagian dengan `batasKata != null` (termasuk 0): tepat satu butir `KTA-nn` (`{tipe:"batas_kata", bagian, batas}`, pemeriksa `hitungKata`, komponen `2. Jumlah kata per bagian`).<br>[Q2a] Bagian `jenisIsian = "daftar"` dengan `jumlahButir >= 1` dan `pemisah`: butir `KAT-nn` (`{tipe:"kata_kunci", jumlah, pemisah}`, `cekKataKunci`, deskripsi "Kata kunci tepat 5, dipisahkan titik koma (;)"). Bagian `wajibGambar`: `GBR-nn` (`{tipe:"diagram_alir", bagian}`, `periksaDiagramAlir`). Bagian `jenisIsian = "tabel"`: `TBL-nn` (`{tipe:"tabel_wajib", bagian}`, `cekTabel`).<br>[Q2b] Bila ada bagian `sitasiBernomor`: `SIT-01` (`sitasi_bernomor`); bila ada bagian `daftarPustaka` (nama masuk parameter `pustaka`): `SIT-02` (`pustaka_berurutan`) dan `SIT-03` (`jumlah_referensi_sama`), semuanya `cocokkanSitasi`.<br>[Q3] Untuk setiap lampiran: tepat satu butir `LMP-nn` (`{tipe:"lampiran_wajib", nama}`, `cekLampiran`, komponen `Lampiran`); untuk lampiran berjenis formulir dengan kalimat kunci: tambahan `FMT-nn` (`{tipe:"lampiran_format", nama, kunci[]}`).<br>[Q4] Penomoran `nn` dua digit terpisah per awalan (BGN, KTA, KAT, GBR, TBL, LMP, FMT), mengikuti urutan masukan; urutan keluaran: per bagian (BGN, KTA, KAT, GBR, TBL), lalu SIT, lalu LMP, lalu FMT.<br>[Q5] Jumlah keluaran = bagian wajib + bagian berbatas kata + butir ketentuan + butir sitasi + lampiran + butir format.<br>[Q6] Semua butir `jenis = "deterministik"`, `asal = "templat"`; status `Draf` diberikan oleh pemanggil (C-02). |
| Catatan | Daftar Pustaka dan Kata Kunci hanya menghasilkan butir bila ditandai wajib atau berbatas kata. Butir sitasi dan kata kunci tidak berasal dari templat (manual, UC-02). **Diperluas pada putaran 3 (24 Okt 2026): butir semantik dan ketentuan baru, lihat bagian "Putaran 3 UC-01" di akhir berkas.** |

### C-04 TemplatProposal.arsipkan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `arsipkan` / TemplatProposal / C-04 |
| Clients (Consumers) | `skema : SkemaPendanaan` (seq-uc01, `S -> L : arsipkan()`); dalam kode `gantiTemplatBerlaku` |
| Associated Use Cases | UC-01 langkah 9 |
| Description of Responsibilities | Mengubah templat berlaku yang digantikan menjadi arsip, supaya riwayat versi tetap tersimpan dan tidak lagi dipakai pengusul. |
| Arguments Received | `tx` (transaksi basis data), `lamaIds: string[]` (id templat berstatus Terbit milik skema yang sama) |
| Type of Value Returned | `Promise<void>` |
| Pre-Conditions | [P1] Dipanggil di dalam transaksi `terbitkan` (C-02) sesudah [Q4] sah.<br>[P2] `lamaIds` hanya berisi templat Terbit skema yang sama. |
| Post-Conditions | [Q1] Setiap templat pada `lamaIds` berstatus `Arsip`.<br>[Q2] Bila `lamaIds` kosong, tidak ada perubahan (skema belum punya templat, S-1).<br>[Q3] Templat lain tidak berubah.<br>[Q4] Satu-satunya jalur menuju `Arsip` pada state machine templat adalah `Terbit → Arsip`. |
| Catatan | Fungsi privat (tidak diekspor): diuji lewat C-02. Tidak memeriksa status asal tiap id. |

### C-05 SkemaPendanaan.cekPengusulanBerjalan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `cekPengusulanBerjalan` / SkemaPendanaan / C-05 |
| Clients (Consumers) | `templat : TemplatProposal` (seq-uc01, `T -> S : cekPengusulanBerjalan()`) |
| Associated Use Cases | UC-01 langkah 8, alur 9a |
| Description of Responsibilities | Menyatakan apakah masa pengusulan sedang berjalan sehingga templat tidak boleh diganti. |
| Arguments Received | Tidak ada (naskah tidak menyebut argumen; kode tidak menerima skema atau periode) |
| Type of Value Returned | `Promise<boolean>` (`true` = berjalan) |
| Pre-Conditions | [P1] Basis data tersedia. Baris `pengaturan_demo` id 1 boleh belum ada. |
| Post-Conditions | [Q1] Hasil = `pengaturan_demo.masaPengusulan === "berjalan"`.<br>[Q2] Tidak ada efek lain selain membuat baris `pengaturan_demo` id 1 bila belum ada.<br>[Q3] Hasil sama untuk semua skema (tidak bergantung skema atau tanggal). |
| Catatan | Selisih dengan naskah: naskah menyiratkan pembandingan tanggal skema; kode hanya membaca sakelar demo (catatan inkonsistensi no. 16). Alias `masaPengusulanBerjalan` (seq-uc02 langkah `periode -> masaPengusulanBerjalan()`) berperilaku sama. Pembandingan tanggal sungguhan hanya di C-11. |

### C-06 ButirCek.aturParameter / ubahParameter

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `aturParameter` (turunan templat, di C-02/C-03) dan `ubahParameter` (butir manual) / ButirCek / C-06 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc02, `create(jenis, parameter)` dan `ubahParameter(parameter)`); `templat : TemplatProposal` (seq-uc01, `aturParameter`) |
| Associated Use Cases | UC-02 langkah 4 sampai 5 dan 6 (S-1), alur 4a (3a Bab 7); UC-01 langkah 10 |
| Description of Responsibilities | Menerjemahkan isian panel butir (kode, deskripsi, jenis, aturan hitung atau pertanyaan) menjadi parameter terstruktur, menolak isian tidak sah, menolak perubahan butir turunan templat (terkunci), dan menyimpan butir pada basis aturan yang sedang disusun. |
| Arguments Received | `validasiButir(m: MasukanButir)` dengan `MasukanButir = { jenis: "deterministik"\|"semantik"\|""; kode; deskripsi; aturanHitung; pertanyaan; contohJawaban; bagian; lampiran: string }`.<br>`simpanButir(m: MasukanSimpanButir)` dengan `{ skemaId: string; butirId?: string; masukan: MasukanButir; pelaku: {id: string\|null; idBima: string} }` |
| Type of Value Returned | `validasiButir`: `{ok:true; nilai: NilaiButir} \| {ok:false; galat: Partial<Record<keyof MasukanButir,string>>}`.<br>`simpanButir`: `Promise<{ok:true; butirId; kode; baru:boolean} \| {ok:false; terkunci?:boolean; galat; pesan?:string}>` |
| Pre-Conditions | [P1] Pemanggil pengelola (NFR 3.2).<br>[P2] Untuk ubah: `butirId` merujuk butir yang ada. |
| Post-Conditions | [Q1] `kode` sah bila cocok `/^[A-Za-z0-9][A-Za-z0-9._-]{0,19}$/`: 1 sampai 20 karakter (20 sah, 21 tidak sah), karakter pertama huruf atau angka; kosong: galat "Kode wajib diisi".<br>[Q2] `deskripsi` kosong (setelah `trim`): galat "Deskripsi wajib diisi". `jenis` selain dua nilai baku: galat "Pilih jenis butir".<br>[Q3] Jenis deterministik: `aturanHitung` kosong: galat "Aturan Hitung wajib diisi". Aturan diurai berurutan (huruf kecil): memuat "kata kunci" → `kata_kunci` dengan jumlah dari angka 1 sampai 2 digit pertama atau kata satu..sepuluh (tanpa jumlah atau jumlah 0: galat "Sebutkan jumlah kata kunci…"), pemisah `;` bila memuat "titik koma", `,` bila memuat "koma", selain itu `;`; memuat "jumlah referensi|pustaka|rujukan" → `jumlah_referensi_sama`; "pustaka" dan "urut" → `pustaka_berurutan`; "sitasi" atau "kutipan" → `sitasi_bernomor`; "diagram alir" → `diagram_alir` (wajib memilih bagian); "judul" dan ("sama" atau "identik") → `judul_sama`; "struktur", "templat sesuai", atau "urutan bagian" → `struktur_judul`; "terisi" atau "tidak kosong" → `bagian_terisi` (wajib memilih bagian); selain itu galat "Aturan Hitung belum dikenali sistem…". Urutan pengujian menentukan hasil bila beberapa kata muncul.<br>[Q4] Jenis semantik: `pertanyaan` kosong: galat "Pertanyaan Pemeriksaan wajib diisi"; `bagian` kosong: galat "Pilih bagian yang diperiksa"; `lampiran` opsional (disimpan di parameter; menentukan komponen borang 4, 5, atau 6, selain itu komponen 1).<br>[Q5] `simpanButir` pada `butirId` yang butirnya `asal = templat`: `{ok:false, terkunci:true, pesan:"Nilai butir ini berasal dari templat dan hanya dapat diubah melalui jendela J-02 Templat Proposal"}` tanpa perubahan apa pun, dan diperiksa sebelum validasi isian.<br>[Q6] `butirId` tidak ditemukan: `{ok:false, pesan:"Butir tidak ditemukan. Muat ulang halaman."}`.<br>[Q7] Kode sudah dipakai butir lain berstatus bukan `Nonaktif` pada draf basis: `{ok:false, galat:{kode:"Kode sudah dipakai butir lain pada versi ini"}}`.<br>[Q8] Berhasil tanpa `butirId`: butir baru `asal = manual`, status `Draf`, `urutan` = tertinggi + 1, pada basis aturan draf (dibuat bila belum ada); `baru = true`. Berhasil dengan `butirId`: parameter diperbarui pada salinan butir di draf basis; `baru = false`; basis yang berlaku tidak berubah.<br>[Q9] Setiap keberhasilan menambah satu entri log audit (`aturan.butir-tambah` atau `aturan.butir-ubah`). |
| Catatan | Penyimpangan prototipe: isian "Bagian yang Diperiksa" dan "Lampiran yang Diperiksa" ditambahkan (`docs/perubahan-model.md`). `aturParameter` pada penurunan templat dilakukan C-02 dengan `parameter` yang sudah terstruktur, tanpa penguraian teks. |

### C-07 ButirCek.nonaktifkan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `nonaktifkan` / ButirCek / C-07 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc02, `nonaktifkan()`); `lama : TemplatProposal` (seq-uc01, `L -> CL : nonaktifkan()`) |
| Associated Use Cases | UC-02 langkah 4; UC-01 langkah 9 |
| Description of Responsibilities | Menjadikan butir tidak dipakai pada versi aturan yang sedang disusun. Butir turunan templat hanya dinonaktifkan oleh penggantian templat, tidak oleh pengguna. |
| Arguments Received | `nonaktifkanButir(m: { skemaId: string; butirId: string; pelaku: {id: string\|null; idBima: string} })`; `nonaktifkanTurunanLama(tx, drafBasisId: string, lamaIds: string[])` |
| Type of Value Returned | `Promise<{ok:true; kode:string} \| {ok:false; terkunci?:boolean; pesan:string}>`; `nonaktifkanTurunanLama`: `Promise<void>` |
| Pre-Conditions | [P1] Pemanggil pengelola (NFR 3.2). [P2] Basis data tersedia. |
| Post-Conditions | [Q1] `butirId` tidak ada: `{ok:false}` dengan pesan "Butir tidak ditemukan. Muat ulang halaman."; tanpa perubahan.<br>[Q2] Butir `asal = templat`: `{ok:false, terkunci:true}` dengan pesan terkunci; tanpa perubahan.<br>[Q3] Butir manual: pada draf basis aturan (dibuat bila belum ada) salinan butir itu berstatus `Nonaktif`; hasil `{ok:true, kode}`; log `aturan.butir-nonaktifkan`. Butir pada basis yang berlaku tidak berubah.<br>[Q4] `nonaktifkanTurunanLama`: butir `asal = templat` pada draf basis dengan `templatId` termasuk `lamaIds` menjadi `Nonaktif`; `lamaIds` kosong tidak mengubah apa pun. |
| Catatan | State machine butir: `Draf/Aktif/Perlu ditinjau → Nonaktif`. Tidak ada transisi keluar dari `Nonaktif`. |

### C-08 BasisAturan.validasiTanggalBerlaku

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `validasiTanggalBerlaku` / BasisAturan / C-08 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc02, `validasiTanggalBerlaku(tanggal)`); dalam kode `simpanVersiBaru` (C-09) dan formulir M-05 |
| Associated Use Cases | UC-02 langkah 7, alur 8a (6a Bab 7) |
| Description of Responsibilities | Memastikan tanggal berlaku basis aturan sah dan tidak jatuh di tengah masa pengusulan yang sedang berjalan, serta lebih akhir daripada versi sebelumnya. |
| Arguments Received | `isian: string` (`yyyy-mm-dd`); `periode: {tanggalBuka: Date; tanggalTutup: Date}`; `masaBerjalan: boolean`; `tanggalVersiSebelumnya?: Date \| null` |
| Type of Value Returned | `{ok:true; tanggal: Date} \| {ok:false; pesan: string}` |
| Pre-Conditions | [P1] Fungsi murni; `periode` terisi dua tanggal sah. |
| Post-Conditions | [Q1] Tanggal dibaca sebagai awal hari WIB (`T00:00:00+07:00`). Isian yang tidak cocok `^\d{4}-\d{2}-\d{2}$` (mis. `"2026-1-5"`, `""`, `"05/01/2026"`) atau tidak dapat menjadi tanggal (mis. bulan 13): `{ok:false, pesan:"Tanggal Berlaku wajib diisi dengan tanggal yang valid."}`. Isian di-`trim` lebih dulu.<br>[Q2] Bila `masaBerjalan = true` dan hari WIB tanggal itu berada pada `[hariWIB(tanggalBuka), hariWIB(tanggalTutup)]` dengan KEDUA ujung termasuk (inklusif): ditolak dengan pesan "Tanggal berlaku tidak boleh jatuh di antara tanggal buka dan tanggal tutup masa pengusulan, karena proposal dalam satu periode harus dinilai dengan aturan yang sama." Satu hari sebelum buka dan satu hari sesudah tutup: diterima.<br>[Q3] Bila `masaBerjalan = false`: rentang buka-tutup tidak diperiksa (tanggal apa pun sah, termasuk di dalam rentang).<br>[Q4] Bila `tanggalVersiSebelumnya` ada dan hari WIB tanggal itu ≤ hari WIB versi sebelumnya (sama atau lebih awal): ditolak dengan pesan "Tanggal Berlaku harus lebih akhir daripada tanggal berlaku versi sebelumnya." Satu hari sesudahnya: diterima. Pemeriksaan [Q2] mendahului [Q4].<br>[Q5] Selain itu `{ok:true, tanggal}` dengan `tanggal` = awal hari WIB. |
| Catatan | Selisih dengan naskah: (1) naskah menulis "di tengah masa pengusulan", kode menolak juga pada hari buka dan hari tutup; (2) syarat "lebih akhir daripada versi sebelumnya" ([Q4]) tidak ada di Bab 7 maupun Bab 10 (tercatat di `docs/perubahan-model.md`); (3) `masaBerjalan` berasal dari sakelar demo (C-05), bukan dari periode. |

### C-09 BasisAturan.simpanVersiBaru

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `simpanVersiBaru` / BasisAturan / C-09 |
| Clients (Consumers) | `basis : BasisAturan` (pesan ke diri sendiri sesudah `validasiTanggalBerlaku`, seq-uc02); tombol "Simpan Versi" (M-05) |
| Associated Use Cases | UC-02 langkah 7 (6 sampai 7 Bab 10) |
| Description of Responsibilities | Menetapkan basis aturan yang sedang disusun menjadi versi berlaku pada periode dan tanggal berlaku tertentu, mengaktifkan butirnya, dan mencatat di log audit. |
| Arguments Received | `m: { skemaId: string; periodeId: string; tanggalBerlaku: string (yyyy-mm-dd); pelaku: {id; idBima}; masaBerjalan?: boolean }` |
| Type of Value Returned | `Promise<{ok:true; versi:number; tanggalBerlaku:string (ISO); jumlahAktif:number} \| {ok:false; alasan:"tidak-ada-perubahan"\|"tanggal"\|"periode"; pesan:string}>` |
| Pre-Conditions | [P1] Pemanggil pengelola.<br>[P2] Ada draf basis aturan untuk skema (hasil C-06/C-07/C-02). |
| Post-Conditions | [Q1] Tidak ada draf: `{ok:false, alasan:"tidak-ada-perubahan"}`; tanpa perubahan.<br>[Q2] `periodeId` tidak ada: `{ok:false, alasan:"periode"}`.<br>[Q3] `validasiTanggalBerlaku` (C-08) gagal terhadap periode itu dan basis nyata versi tertinggi sebelumnya: `{ok:false, alasan:"tanggal", pesan}`; basis dan butir tidak berubah (8a).<br>[Q4] Berhasil: pada basis draf, butir berstatus `Draf` atau `Perlu ditinjau` menjadi `Aktif` (penanda UC-04 dihapus); butir `Nonaktif` tetap; `periodeId`, `tanggalBerlaku`, `dibuatOleh`, `dibuatPada` diisi; `kode` menjadi `BA-<kodeSkema>`; basis berhenti dikenali sebagai draf.<br>[Q5] `jumlahAktif` = jumlah butir `Aktif` pada basis itu; `versi` = nomor versi basis itu.<br>[Q6] Tepat satu entri log `aturan.simpan-versi` untuk keberhasilan; nol untuk penolakan. |
| Catatan | Draf basis dikenali dari `tanggalBerlaku` tahun 9999, `periodeId` kosong, dan kode berakhiran `-DRAF` (penyimpangan prototipe). |

### C-10 BasisAturan.ujiPadaContoh

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `ujiPadaContoh` / BasisAturan / C-10 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc02, loop S-1) |
| Associated Use Cases | UC-02 langkah 5 sampai 6 (S-1), J-03b |
| Description of Responsibilities | Menerapkan butir pada versi yang sedang disusun (atau yang berlaku) terhadap contoh proposal, dan melaporkan hasil per butir per contoh tanpa mengubah data. |
| Arguments Received | `skemaId: string`, `periodeId: string \| null` |
| Type of Value Returned | `Promise<HasilUji>` = `{ contoh: HasilUjiContoh[]; semuaContoh: boolean; peringatan: string[]; jumlahButir: number }`; `HasilUjiContoh = {dokumenKode; dokumenNama; deterministik: HasilButirDeterministik[]; semantik: HasilButirSemantik[]}` |
| Pre-Conditions | [P1] Basis data tersedia. [P2] Layanan LLM boleh tidak tersedia (mode tiruan). |
| Post-Conditions | [Q1] Tidak menulis ke basis data (hanya membaca).<br>[Q2] Bahan: draf basis bila ada, selain itu basis nyata (C-09 `pilihBasisNyata`). Tidak ada basis: `contoh = []`, `jumlahButir = 0`, `peringatan = ["Skema ini belum memiliki basis aturan untuk diuji."]`.<br>[Q3] Butir yang diuji: semua berstatus bukan `Nonaktif` (termasuk `Draf` dan `Perlu ditinjau`); `jumlahButir` = jumlah itu (deterministik + semantik).<br>[Q4] Contoh: `dokumen_contoh` milik skema; bila tidak ada, semua contoh dan `semuaContoh = true`; tidak ada contoh sama sekali: `contoh = []` dan peringatan "Belum ada contoh proposal yang tersimpan di sistem.". Urutan contoh menurut `kode`.<br>[Q5] Per contoh: `deterministik` = `periksaDeterministikTeks` atas butir deterministik (C-16 sampai C-20), `semantik` = `nilaiSemantikTeks` atas butir semantik (C-25). Bila semua butir semantik mendapat "Belum ada rekomendasi", dihitung ulang dengan penyedia tiruan berlabel `tiruan = true`.<br>[Q6] Galat pada satu pemeriksa tidak membatalkan hasil lain: dicatat di `peringatan` (tanpa duplikat). |
| Catatan | Butir tanpa `parameter` terstruktur Gagal di pemeriksa deterministik (cabang bawaan `periksaSatuButir`, lihat bagian 5). Sejak 25 Okt 2026 layar memakai jalur bertahap C-10a; `ujiPadaContoh` tetap ada sebagai satu panggilan baca-saja (uji integrasi). |

### C-10a Uji pada Contoh bertahap (M-15, J-03b)

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `mulaiUji`, `ujiDeterministik`, `ujiSemantikSatu`, `selesaikanUji`, `ambilHasilUji` / BasisAturan / C-10a (`aturan/uji-jalan.ts`) |
| Clients (Consumers) | M-15 "Uji pada Contoh" (server action untuk langkah 1, 2, 4; `POST /api/semar/uji-contoh/[idUji]/semantik` untuk langkah 3, empat sekaligus); J-03b membaca `ambilHasilUji` |
| Associated Use Cases | UC-02 langkah 6 (S-1: ubah lalu uji ulang) |
| Description of Responsibilities | Menjalankan C-10 dalam langkah kecil supaya kemajuan nyata dapat ditampilkan, menerima naskah unggahan sebagai contoh, dan menyimpan hasil agar J-03b tidak menguji ulang setiap dibuka. |
| Arguments Received | `mulaiUji({skemaId, periodeId, templatId, kodeContoh: string[], unggahan: {nama, tipe, bytes}[], pelaku})`; `ujiDeterministik(ujiId)`; `ujiSemantikSatu(ujiId, dokumenKode, butirKode)`; `selesaikanUji(ujiId, dihentikan, pelaku)` |
| Type of Value Returned | `RencanaUji = {ujiId; dokumen: {kode; nama; unggahan; bagianDitemukan; bagianTemplat}[]; deterministik: number; semantik: {kode; deskripsi}[]; peringatan: string[]}`; `{lolos; gagal}`; `HasilButirSemantik`; `void`; `HasilUjiTersimpan` |
| Pre-Conditions | [P1] Pemanggil pengelola. [P2] Unggahan .docx/.pdf, maks. 3,5 MB per berkas (badan server action dibatasi 4 MB). |
| Post-Conditions | [Q1] `mulaiUji` membekukan butir (C-10 [Q2]-[Q3], termasuk templat Draf) dan bagian templat pada baris `uji_contoh` berstatus `Berjalan`; tiap unggahan diekstrak, dipotong per bagian templat, dan disimpan sebagai `dokumen_contoh` berlabel `unggahan`; tidak ada bagian dikenali menghasilkan peringatan, bukan penolakan. Tanpa dokumen atau tanpa basis aturan: `UjiDitolakError`.<br>[Q2] `ujiDeterministik` menulis satu baris `uji_contoh_hasil` per dokumen × butir deterministik.<br>[Q3] `ujiSemantikSatu` menulis atau memperbarui tepat satu baris (unik: uji, dokumen, butir); butir/dokumen di luar uji ditolak.<br>[Q4] `selesaikanUji` mengubah status menjadi `Selesai` atau `Dihentikan` dan mencatat log audit; `ambilHasilUji.belumDinilai` = butir semantik × dokumen dikurangi hasil semantik tersimpan.<br>[Q5] Tidak mengubah basis aturan, butir, atau proposal. |
| Catatan | Server action dijalankan peramban satu per satu, karena itu langkah 3 lewat route handler. Reset demo mengosongkan `uji_contoh`, `uji_contoh_hasil`, dan contoh unggahan. |

### C-11 PeriodeSeleksi.cekMasaPengusulan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `cekMasaPengusulan` / PeriodeSeleksi / C-11 |
| Clients (Consumers) | `proposal : Proposal` (seq-uc05, `proposal -> periode : cekMasaPengusulan()`); dalam kode `mulaiPengajuan` dan `kirimUlangPengajuan` |
| Associated Use Cases | UC-05 langkah 3, alur 3a (1a Bab 7) |
| Description of Responsibilities | Menyatakan apakah masa pengusulan periode itu sedang berjalan pada saat ini (menurut jam demo), supaya pengajuan yang terlambat ditolak. |
| Arguments Received | `periode: Periode` (baris `periode_seleksi`, memuat `tanggalBuka: Date`, `tanggalTutup: Date`) |
| Type of Value Returned | `Promise<{ berjalan: boolean; tanggalTutup: Date }>` |
| Pre-Conditions | [P1] `periode.tanggalBuka ≤ periode.tanggalTutup`.<br>[P2] Jam demo `waktuDemo()` = waktu nyata + `geserHari` hari, dapat dikendalikan uji. |
| Post-Conditions | [Q1] `berjalan = true` jika dan hanya jika `tanggalBuka ≤ sekarang ≤ tanggalTutup` (KEDUA ujung inklusif, tingkat milidetik) DAN sakelar `pengaturan_demo.masaPengusulan = "berjalan"`.<br>[Q2] Tepat pada `tanggalTutup`: berjalan (bila sakelar berjalan); satu milidetik sesudahnya: tidak berjalan; satu detik sesudahnya: tidak berjalan. Tepat pada `tanggalBuka`: berjalan.<br>[Q3] Sakelar "ditutup": `berjalan = false` walau tanggal dalam rentang.<br>[Q4] `tanggalTutup` pada hasil = `periode.tanggalTutup`.<br>[Q5] Tidak menulis ke basis data. |
| Catatan | Sakelar demo menggeser `tanggalTutup` (kemarin saat ditutup, dua pekan lagi saat berjalan) sehingga tanggal dan sakelar searah. Naskah menyebut "tanggalTutup terlampaui" sebagai pemicu penutupan; kode konsisten (tutup inklusif). |

### C-12 PeriodeSeleksi.tetapkanBatasBeban

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `tetapkanBatasBeban` / PeriodeSeleksi / C-12 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc03, loop S-1); dalam kode `susunPenugasan` |
| Associated Use Cases | UC-03 langkah 2 |
| Description of Responsibilities | Menyimpan batas jumlah proposal per reviewer pada sebuah periode. |
| Arguments Received | `periodeId: string`, `batas: number` |
| Type of Value Returned | `Promise<void>` (melempar galat bila batas tidak sah) |
| Pre-Conditions | [P1] `batas` bilangan bulat ≥ 1. |
| Post-Conditions | [Q1] `batas = 1` diterima; `batas = 0`, negatif, `1.5`, `NaN`, `Infinity` melempar `Error("Batas Beban per Reviewer harus bilangan bulat minimal 1.")` tanpa mengubah data.<br>[Q2] Setelah berhasil, `periode_seleksi.batasBebanReviewer = batas` untuk `periodeId`.<br>[Q3] `periodeId` yang tidak ada tidak menimbulkan galat dan tidak mengubah baris mana pun. |
| Catatan | Tidak ada batas atas. |

### C-13 PeriodeSeleksi.susunPenugasan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `susunPenugasan` / PeriodeSeleksi / C-13 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc03, loop S-1) |
| Associated Use Cases | UC-03 langkah 3 sampai 5, S-1 |
| Description of Responsibilities | Membagi proposal terkirim yang belum ditugaskan kepada reviewer bersedia dari institusi berbeda dengan beban rata dan tidak melampaui batas, menyimpannya sebagai usulan, atau melaporkan kekurangan reviewer. |
| Arguments Received | `periodeId: string`, `batasBeban: number` |
| Type of Value Returned | `Promise<HasilSusunPenugasan>` = `{ periodeId; usulan: BarisUsulanPenugasan[] (halaman pertama, 50 baris); jumlahUsulan: number; sebaran: SebaranBeban[]; jumlahBelumDitugaskan: number }` |
| Pre-Conditions | [P1] Masa pengusulan tidak berjalan (sakelar "ditutup"); bila berjalan melempar `MasaBelumDitutupError`.<br>[P2] `batasBeban` bilangan bulat ≥ 1 (C-12).<br>[P3] API BIMA daftar reviewer terjangkau (klien mengulang otomatis; gagal tetap melempar `BimaGagalError`). |
| Post-Conditions | [Q1] `periode.batasBebanReviewer = batasBeban`.<br>[Q2] Kandidat = reviewer BIMA yang `bersedia = true` (pada periode skala nyata hanya reviewer `rvw-skala-*`, pada periode lain tidak pernah).<br>[Q3] Bahan = proposal `Terkirim` pada periode yang belum punya penugasan berstatus bukan `Diusulkan`; proposal berpenugasan `Ditetapkan` atau `Selesai` tidak diusulkan ulang.<br>[Q4] Bila semua proposal dapat ditempatkan (`jumlahBelumDitugaskan = 0`): usulan lama berstatus `Diusulkan` dihapus dan diganti tepat satu baris `Diusulkan` per proposal bahan; `jumlahUsulan` = jumlah proposal bahan; untuk setiap baris, institusi reviewer ≠ institusi pengusul (tanpa membedakan huruf besar-kecil dan spasi tepi); beban akhir tiap reviewer (penugasan `Ditetapkan`/`Selesai` ditambah usulan baru) ≤ `batasBeban`.<br>[Q5] Bila ada proposal yang tidak dapat ditempatkan (S-1): `jumlahBelumDitugaskan > 0`, `usulan = []`, `jumlahUsulan = 0`, usulan lama berstatus `Diusulkan` dihapus, tidak ada usulan baru; log `susun_penugasan_kekurangan_reviewer`.<br>[Q6] Bahan kosong: `jumlahUsulan = 0` dan `jumlahBelumDitugaskan = 0`.<br>[Q7] Batas tepat: total kapasitas = `jumlah reviewer × batasBeban` sama dengan jumlah proposal dan semua syarat institusi terpenuhi → berhasil; kapasitas kurang satu → `jumlahBelumDitugaskan ≥ 1`.<br>[Q8] Pemilihan reviewer per proposal: beban paling sedikit saat itu, seri diputus menurut nama (`localeCompare`).<br>[Q9] `sebaran` memuat semua reviewer bersedia (bukan hanya yang mendapat usulan), terurut beban turun lalu nama. |
| Catatan | Selisih dengan naskah: naskah menulis pemanggilan `pilihReviewer(daftarReviewer, batasBeban)` pada objek penugasan per proposal; kode menjalankan seluruh pembagian sekaligus di fungsi murni `susunUsulanMurni` (lihat MS-04), termasuk penataan ulang (jalur penambah) sebelum menyatakan kekurangan. |

### C-14 PenugasanReviewer.pilihReviewer

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `pilihReviewer` / PenugasanReviewer / C-14 |
| Clients (Consumers) | `periode : PeriodeSeleksi` (seq-uc03, pemilihan awal di dalam `susunPenugasan`, lihat C-13/MS-04); `tim : TimKerjaDPPM` (seq-uc03, loop S-2, pemindahan) |
| Associated Use Cases | UC-03 langkah 4 dan SubFlow S-2 |
| Description of Responsibilities | Memeriksa ulang dan menerapkan penggantian reviewer sebuah usulan penugasan: reviewer baru harus bersedia, berinstitusi berbeda dari pengusul, dan tidak melampaui batas beban; bila tidak, reviewer semula tetap. |
| Arguments Received | `pilihReviewer(penugasanId: string, reviewerBaruId: string, aktor: string = "sistem")`; murni: `periksaSyarat(m: { institusiPengusul: string; reviewer: {institusi: string; bersedia: boolean; nama?: string}; bebanSaatIni: number; batas: number })` |
| Type of Value Returned | `Promise<HasilPilihReviewer>` = `{ reviewerId: string; diterima: boolean; syaratDilanggar: string[] }`; `periksaSyarat`: `string[]` |
| Pre-Conditions | [P1] Penugasan `penugasanId` ada (bila tidak, galat `Error("Penugasan tidak ditemukan.")`).<br>[P2] `periode.batasBebanReviewer` sudah ditetapkan (C-12). |
| Post-Conditions | [Q1] Penugasan berstatus bukan `Diusulkan` (sudah ditetapkan): `diterima = false`, `syaratDilanggar = ["Penugasan sudah ditetapkan dan tidak dapat dipindahkan."]`, reviewer tetap.<br>[Q2] `reviewerBaruId` tidak ditemukan, bukan peran reviewer, atau bukan kumpulan periode itu: `diterima = false`, `["Reviewer pengganti tidak ditemukan."]`.<br>[Q3] Reviewer baru sama dengan reviewer saat ini: `diterima = true`, tanpa perubahan dan tanpa log.<br>[Q4] `periksaSyarat` mengembalikan, berurutan, hingga tiga pesan: tidak bersedia; institusi sama (tanpa membedakan huruf besar-kecil dan spasi tepi); `bebanSaatIni + 1 > batas`. Beban dihitung dari semua status penugasan reviewer baru pada periode, tidak termasuk penugasan yang dipindahkan.<br>[Q5] Batas: `bebanSaatIni = batas - 1` → diterima; `bebanSaatIni = batas` → ditolak dengan pesan "Beban reviewer pengganti akan melampaui batas (…)".<br>[Q6] Daftar syarat kosong: `reviewerId` penugasan diganti reviewer baru, `diterima = true`, log `pindah_penugasan`. Daftar tidak kosong: reviewer semula tetap, `diterima = false`, `syaratDilanggar` memuat semua pelanggaran, log `pindah_penugasan_ditolak`. |
| Catatan | Selisih dengan naskah: tanda tangan naskah `pilihReviewer(daftarReviewer, batasBeban)` mengembalikan "reviewer beda institusi, beban rata" untuk pemilihan awal; kode memisahkan pemilihan awal (`susunUsulanMurni`) dan pemindahan (fungsi ini). Syarat kesediaan reviewer ditambahkan di kode (naskah menyebut institusi dan beban). |

### C-15 PenugasanReviewer.tetapkan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `tetapkan` / PenugasanReviewer / C-15 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc03, loop "setiap penugasan yang ditetapkan"); tombol "Tetapkan Penugasan" (M-07) |
| Associated Use Cases | UC-03 langkah 7 sampai 8 |
| Description of Responsibilities | Menetapkan semua usulan penugasan sebuah periode, mengirimnya ke BIMA, dan memunculkannya sebagai penugasan baru bagi reviewer. |
| Arguments Received | `periodeId: string`, `aktor: string` (idBima pelaku) |
| Type of Value Returned | `Promise<{ jumlah: number }>` (melempar `BimaGagalError` bila ada kelompok gagal) |
| Pre-Conditions | [P1] Pemanggil Tim Kerja DPPM.<br>[P2] Ada usulan berstatus `Diusulkan` untuk `periodeId` (bila tidak, hasil `jumlah = 0`). |
| Post-Conditions | [Q1] Tidak ada usulan `Diusulkan`: `{jumlah: 0}`, tanpa panggilan ke BIMA dan tanpa log.<br>[Q2] Klaim atomik: semua baris `Diusulkan` periode itu menjadi `Ditetapkan`, `label = "Baru"`, `tanggal` = waktu penetapan; dua pemanggilan serentak tidak menetapkan baris yang sama dua kali.<br>[Q3] Penugasan dikirim ke BIMA per kelompok maksimum 500 (lima kelompok serentak) dengan kunci idempoten = id penugasan; pengiriman ulang tidak menggandakan baris di BIMA.<br>[Q4] Semua kelompok berhasil: `{jumlah}` = jumlah baris yang diklaim; log `tetapkan_penugasan`; penugasan tampil di daftar reviewer terkait (J-07) berlabel "Baru".<br>[Q5] Sebagian kelompok gagal: baris kelompok yang gagal kembali ke `Diusulkan`; baris kelompok berhasil tetap `Ditetapkan`; log `tetapkan_penugasan_gagal_kirim`; melempar `BimaGagalError`.<br>[Q6] Tepat 500 baris: satu kelompok; 501 baris: dua kelompok. |
| Catatan | Selisih dengan naskah: naskah menetapkan satu penugasan per pesan `tetapkan()` lalu `mencatatPenugasan` pada Proposal dan `terimaProposal` pada Reviewer; kode melakukan ketiganya dalam satu fungsi batch (alias `tetapkan`, `mencatatPenugasan`, `terimaProposal`). Kode tidak memeriksa lagi bahwa masa pengusulan sudah ditutup (hanya `susunPenugasan` yang memeriksa). |

### C-16 ButirCek.hitungKata

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `hitungKata` / ButirCek / C-16 |
| Clients (Consumers) | `butir : ButirCek` (pesan ke diri sendiri, seq-uc06 cabang "batas kata tiap bagian"); `periksaDeterministikTeks` pada "Uji pada Contoh" (UC-02) |
| Associated Use Cases | UC-06 langkah 4 (Bab 10); UC-02 langkah 5 |
| Description of Responsibilities | Menghitung kata pada teks sebuah bagian tanpa menghitung keterangan gambar dan tabel, lalu menilai Lolos atau Gagal terhadap batas kata bagian, tanpa toleransi. |
| Arguments Received | `hitungKata(teks: string)`; `periksaBatasKata(dokumen: DokumenPeriksa, bagian: string, batas: number)`; `periksaBagianTerisi(dokumen, bagian)` |
| Type of Value Returned | `hitungKata`: `number`; `periksaBatasKata`, `periksaBagianTerisi`: `HasilPeriksa` |
| Pre-Conditions | [P1] Fungsi murni. [P2] `batas` bilangan bulat tidak negatif. |
| Post-Conditions | [Q1] `hitungKata("")` = 0; teks hanya spasi atau baris kosong = 0.<br>[Q2] Kata = potongan teks tak kosong yang dipisah spasi, tab, atau baris baru (`\s+`); tanda baca menempel pada kata sebelahnya (`"state-of-the-art"` = 1 kata); angka dan simbol berdiri sendiri dihitung sebagai kata.<br>[Q3] Baris yang tidak dihitung: baris yang diawali (setelah spasi) `gambar|tabel|diagram|grafik|bagan|skema|foto` + nomor (`1`, `2.1`, `2-1`) + salah satu tanda `. : ) - –` (keterangan), dan baris yang hanya berisi `[tabel]`, `[gambar]`, atau `[diagram]`. Kata di baris lain tetap dihitung.<br>[Q4] `periksaBatasKata`: `n ≤ batas` → `Lolos` (n tepat sama dengan batas = Lolos); `n = batas + 1` → `Gagal` (tanpa toleransi), `angkaPembukti` berbentuk "1.001 kata dari batas 1.000 (lebih 1 kata)", `batasDilanggar` = `Bagian "<nama>": batas 1.000 kata, ditemukan 1.001 kata`.<br>[Q5] Bagian tidak ada di `teksPerBagian`: dihitung 0 kata dan hasilnya `Lolos` dengan catatan "(bagian tidak ditemukan)".<br>[Q6] Pencocokan nama bagian dengan kunci `teksPerBagian` memakai normalisasi judul (huruf kecil, penomoran di depan dibuang).<br>[Q7] `periksaBagianTerisi`: `n > 0` → `Lolos`; `n = 0` → `Gagal`, `angkaPembukti = "0 kata"`. |
| Catatan | Kalimat petunjuk templat (kebutuhan 1.6) dibuang sebelum menghitung: `hitungKata` tetap murni menghitung semua baris naratif yang diterimanya, tetapi teks bagian yang diberikan pemotong (`potongPerBagian`, C-21 [Q9]) sudah tanpa kalimat petunjuk resmi, tanpa tanda `[ ]` isian, dan tanpa lampiran ekspor BIMA, sehingga selisih dengan naskah tertutup. Teks yang masih memuat petunjuk (mis. dibangkitkan tangan) tetap menghitungnya. Isi tabel tidak ada di teks karena dibuang saat ekstraksi (`[tabel]`). Batas kata per bagian mengikuti Isian Substansi: Judul 20, Ringkasan 300, Pendahuluan 1.000 (Penelitian Dasar) atau 1.500 (Terapan), Metode 1.000. Lihat MS-02. |

### C-17 ButirCek.cekKataKunci

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `cekKataKunci` / ButirCek / C-17 |
| Clients (Consumers) | `butir : ButirCek` (pesan ke diri sendiri, seq-uc06 cabang "kata kunci") |
| Associated Use Cases | UC-06 langkah 5 (Bab 10); UC-02 langkah 5 (butir manual) |
| Description of Responsibilities | Memastikan baris kata kunci memuat tepat sejumlah kata kunci (bawaan lima) yang dipisah dengan pemisah tertentu (bawaan titik koma); frasa boleh. |
| Arguments Received | `dokumen: DokumenPeriksa` (memakai `kataKunci: string \| null`), `jumlah: number`, `pemisah: string` |
| Type of Value Returned | `HasilPeriksa` (`bagian = "Kata Kunci"`) |
| Pre-Conditions | [P1] Fungsi murni. [P2] `jumlah ≥ 1`, `pemisah` satu karakter (`;`, `,`, atau `\|` punya nama tampilan, selain itu dikutip apa adanya). |
| Post-Conditions | [Q1] `kataKunci` null, kosong, hanya spasi, atau hanya kurung siku: `Gagal`, `angkaPembukti = "kata kunci tidak ditemukan di naskah"`.<br>[Q2] Kurung siku pembuka dan penutup pengusul dibuang; baris baru disambung spasi (frasa boleh terpotong baris); satu pemisah penutup diabaikan dan disebut di angka pembukti.<br>[Q3] Pemisah diminta tidak ada tetapi pemisah lain ada (koma, titik koma, garis miring, garis tegak): `Gagal`, "pemisah yang dipakai koma (,), bukan titik koma (;)", butir dibaca dengan pemisah yang dipakai. Banyak baris tanpa pemisah apa pun: `Gagal`, "pemisah yang dipakai baris baru".<br>[Q4] Pemisah diminta ada dan pemisah lain juga ada (koma atau titik koma, garis miring/tegak berspasi): `Gagal`, "pemisah bercampur". Garis miring tanpa spasi dalam frasa (TCP/IP) sah.<br>[Q5] Butir kosong di tengah (`a;; b`): `Gagal`, "ada butir kosong (butir ke-n)".<br>[Q6] Jumlah butir tidak kosong sama dengan `jumlah`: `Lolos`; selain itu (4 atau 6 untuk lima) `Gagal`, "diminta tepat n".<br>[Q7] `angkaPembukti` menyebut butir yang terbaca: `5 kata kunci: A \| B \| ... (pemisah ;)` (butir dipotong 40 karakter, maksimal 8 butir lalu "..."); `batasDilanggar` terisi hanya pada `Gagal` ("Kata kunci harus tepat 5, dipisah titik koma; <sebab>"). |
| Catatan | Bagian "Kata Kunci" tidak dihitung oleh sitasi (C-18) dan tidak dibatasi kata. Lihat MS-13. |

### C-18 ButirCek.cocokkanSitasi

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `cocokkanSitasi` / ButirCek / C-18 |
| Clients (Consumers) | `butir : ButirCek` (pesan ke diri sendiri, seq-uc06 cabang "sitasi dan daftar pustaka") |
| Associated Use Cases | UC-06 langkah 6 (Bab 10) |
| Description of Responsibilities | Memeriksa tiga ketentuan sitasi: sitasi dalam paragraf bernomor, daftar pustaka bernomor dan berurutan sesuai pengutipan, dan jumlah entri sama dengan jumlah referensi yang dikutip. |
| Arguments Received | `dokumen: DokumenPeriksa`, `konteks: KonteksPeriksa`, `tipe: "sitasi_bernomor" \| "pustaka_berurutan" \| "jumlah_referensi_sama"` |
| Type of Value Returned | `HasilPeriksa` (`bagian` = "Isi naskah" untuk `sitasi_bernomor`, "Daftar Pustaka" untuk dua lainnya) |
| Pre-Conditions | [P1] Fungsi murni. [P2] Bagian daftar pustaka dikenali dari nama (setelah normalisasi) `daftar pustaka`, `referensi`, atau `daftar referensi`. |
| Post-Conditions | [Q1] Teks sitasi dikumpulkan dari semua bagian kecuali daftar pustaka dan Kata Kunci. Sitasi bernomor = `[n]`, `[n, m]`, `[n; m]`, `[a-b]` (rentang diperluas bila b ≥ a dan b − a < 200). Sitasi nama-tahun = pola `(Nama, 2020)`, `(Nama dkk., 2020)`, `(Nama et al. 2020)`, `(Nama dan Lain, 2020)`.<br>[Q2] `sitasi_bernomor` `Lolos` jika dan hanya jika ada ≥ 1 sitasi bernomor dan 0 sitasi nama-tahun; tanpa sitasi bernomor: `Gagal` ("tidak ada sitasi bernomor [n]"); ada satu sitasi nama-tahun saja: `Gagal`.<br>[Q3] Entri pustaka = baris yang diawali `[n]`, `n.`, atau `n)`; baris tanpa awalan digabung ke entri sebelumnya.<br>[Q4] `pustaka_berurutan`: tanpa entri → `Gagal` (pesan berbeda untuk "bagian tidak ditemukan" dan "tidak ada entri bernomor"). Dengan entri: `Lolos` jika dan hanya jika entri bernomor 1, 2, …, N berurutan DAN nomor sitasi baru pertama kali muncul berurutan 1, 2, 3, … tanpa lompat (kemunculan pertama nomor > nomor tertinggi sebelumnya harus tepat tertinggi + 1). Entri bernomor 1, 3 → `Gagal`; sitasi pertama `[2]` sebelum `[1]` → `Gagal`.<br>[Q5] `jumlah_referensi_sama`: `Lolos` jika dan hanya jika ada ≥ 1 entri, jumlah entri = jumlah nomor sitasi berbeda, setiap entri dikutip, dan setiap nomor yang dikutip punya entri. Entri tak dikutip atau nomor tanpa entri → `Gagal` dengan daftar nomor tidak cocok.<br>[Q6] Daftar pustaka kosong dengan 0 sitasi pada `jumlah_referensi_sama` → `Gagal` (butuh ≥ 1 entri). |
| Catatan | Baris lanjutan entri yang kebetulan diawali angka dan titik (mis. `2020. Judul`) dibaca sebagai entri baru. Lihat MS-03. |

### C-19 ButirCek.cekLampiran

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `cekLampiran` / ButirCek / C-19 |
| Clients (Consumers) | `butir : ButirCek` (pesan ke diri sendiri, seq-uc06 cabang "lampiran wajib") |
| Associated Use Cases | UC-06 langkah 7 (Bab 10) |
| Description of Responsibilities | Memastikan sebuah lampiran wajib (menurut parameter butir) ada pada pengajuan, dan memberi angka pembukti jumlah lampiran wajib templat yang ada. |
| Arguments Received | `dokumen: DokumenPeriksa` (memakai `lampiranAda: string[]`), `konteks: KonteksPeriksa` (memakai `lampiranWajib: string[]`), `nama: string` (nama lampiran yang diperiksa butir ini) |
| Type of Value Returned | `HasilPeriksa` (`bagian = null`) |
| Pre-Conditions | [P1] Fungsi murni. |
| Post-Conditions | [Q1] `Lolos` jika dan hanya jika `nama` ada di `lampiranAda` setelah normalisasi (huruf kecil, spasi ganda dan tepi dibuang). `"surat  pernyataan mitra"` = `"Surat Pernyataan Mitra"`.<br>[Q2] `lampiranAda` kosong → `Gagal` ("belum ada"), `batasDilanggar = Lampiran wajib "<nama>" belum diunggah`.<br>[Q3] `angkaPembukti` berbentuk "x dari y lampiran wajib ada", y = `konteks.lampiranWajib.length`, atau 1 bila daftar itu kosong (daftar diganti `[nama]`); `Gagal` menyebut daftar lampiran yang belum ada.<br>[Q4] Hasil butir ini hanya bergantung pada `nama`; keberadaan lampiran wajib lain tidak mengubah status butir ini. |
| Catatan | Naskah menulis pencocokan "dengan daftar lampiranWajib pada templat"; kode memeriksa satu nama per butir (butir `LMP-nn` hasil C-03), dan daftar templat hanya untuk angka pembukti. |

### C-20 ButirCek.cocokkanStrukturJudul

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `cocokkanStrukturJudul` / ButirCek / C-20 |
| Clients (Consumers) | `butir : ButirCek` (pesan ke diri sendiri, seq-uc06 cabang "kesesuaian templat dan judul") |
| Associated Use Cases | UC-06 langkah 3 (Bab 10) |
| Description of Responsibilities | Mencocokkan judul bagian naskah dengan bagian wajib templat (keberadaan dan urutan), satu bagian wajib tertentu, atau judul proposal di naskah dengan judul di BIMA. |
| Arguments Received | `dokumen: DokumenPeriksa` (`judul`, `judulBima`, `judulBagianDitemukan`), `konteks: KonteksPeriksa` (`bagianTemplat`), `parameter: {tipe:"bagian_wajib"; bagian} \| {tipe:"struktur_judul"} \| {tipe:"judul_sama"}` |
| Type of Value Returned | `HasilPeriksa` |
| Pre-Conditions | [P1] Fungsi murni. [P2] `judulBagianDitemukan` berurutan sesuai naskah. |
| Post-Conditions | [Q1] Judul dibandingkan setelah normalisasi: huruf kecil; penomoran di depan (`1.`, `2.1)`, `BAB II`, `II.`) dan tanda baca atau spasi di ujung dibuang.<br>[Q2] `bagian_wajib`: `Lolos` jika dan hanya jika judul bagian itu ada di `judulBagianDitemukan`; selain itu `Gagal`.<br>[Q3] `judul_sama`: `judul` kosong atau spasi → `Gagal` ("judul proposal tidak ditemukan"); selain itu `Lolos` jika dan hanya jika kedua judul sama setelah normalisasi proposal (huruf kecil, tanda kutip dibuang, semua karakter bukan huruf/angka menjadi spasi, spasi ganda dilipat). Perbedaan huruf besar-kecil, tanda baca, dan spasi ganda tidak membuat `Gagal`; perbedaan kata membuatnya `Gagal`.<br>[Q4] `struktur_judul`: `Gagal` bila ada bagian `wajib = true` yang tidak ditemukan, atau bagian wajib yang ditemukan tidak berurutan menurut `urutan` templat; selain itu `Lolos`. Judul di luar templat tidak menggagalkan, hanya dicatat pada `angkaPembukti`.<br>[Q5] `angkaPembukti` memuat "x dari y bagian wajib templat ditemukan", y = jumlah bagian `wajib` templat. |
| Catatan | Pencocokan hanya melihat judul, bukan isi. |

### C-21 TemplatProposal.potongPerBagian

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `potongPerBagian` / TemplatProposal / C-21 |
| Clients (Consumers) | `versi : VersiProposal` (seq-uc05, `versi -> templat : potongPerBagian(teks)`); dalam kode `prosesPengajuan` lewat alias `potongTeks` |
| Associated Use Cases | UC-05 langkah 4 (Bab 10, langkah "memotong teks") |
| Description of Responsibilities | Memecah naskah proposal menjadi teks per bagian menurut nama bagian templat, mengenali judul dokumen, daftar judul bagian yang ditemukan, dan baris kata kunci. Untuk naskah Isian Substansi BIMA (judul berhuruf "A. JUDUL" sampai "H. DAFTAR PUSTAKA"), pemotong melewati sampul dan halaman identitas ekspor BIMA, memisahkan kalimat petunjuk resmi dari isian pengusul, dan membuang tanda `[ ]` serta lampiran yang ikut diekspor. |
| Arguments Received | `blok: BlokTeks[]` (`{jenis: "judul"\|"paragraf"\|"gambar"\|"tabel"; teks: string; tingkat?: number}`), `bagian: BagianTemplatDto[]` (`{urutan; nama; batasKata; wajib; huruf?; petunjuk?}`; `petunjuk` bila kosong diturunkan dari nama bagian: `templat/isian-substansi.ts:petunjukResmi`) |
| Type of Value Returned | `HasilPotong` = `{ judulDokumen: string; teksPerBagian: Record<string,string>; judulBagianDitemukan: string[]; kataKunci: string \| null }` |
| Pre-Conditions | [P1] Fungsi murni (tanpa basis data). [P2] `bagian` memuat nama yang unik. |
| Post-Conditions | [Q1] Sebuah blok dikenali sebagai judul bagian bila namanya (setelah normalisasi judul, yang juga membuang huruf bagian "A. ") sama dengan nama sebuah bagian templat dan blok itu `jenis = "judul"` atau paragraf berpanjang ≤ 80 karakter (≤ 100 karakter bila berhuruf); hanya kemunculan pertama tiap bagian yang dipakai (judul kedua dengan nama sama menjadi isi).<br>[Q2] Kunci `teksPerBagian` = nama bagian templat (bukan tulisan naskah), hanya untuk bagian yang ditemukan; isi = teks blok berikutnya dipisah `\n` sampai judul bagian templat berikutnya atau judul tingkat 1 di luar templat.<br>[Q3] Judul tingkat 1 di luar templat (setelah bagian pertama) mengakhiri bagian sebelumnya; isi di bawahnya dibuang; judulnya dicatat di `judulBagianDitemukan`. Judul tingkat lebih dalam di luar templat menjadi isi bagian aktif.<br>[Q4] `judulDokumen`: mode berhuruf = isi bagian "Judul" (baris digabung spasi; `""` bila templat tanpa bagian Judul); mode polos = blok tak kosong pertama sebelum judul bagian templat pertama; `""` bila tidak ada.<br>[Q5] Blok sebelum judul bagian pertama tidak masuk bagian mana pun (pada ekspor BIMA: sampul, "PROTEKSI ISI PROPOSAL", bagian bernomor 1 sampai 6 termasuk identitas pengusul dan anggaran).<br>[Q6] `kataKunci`: bila ada bagian bernama "Kata Kunci", semua baris tak kosongnya digabung dengan spasi (isian dapat terpecah baris) tanpa awalan `Kata kunci:`; selain itu paragraf mana pun berawalan `Kata kunci:`/`Kata kunci -`/`Kata kunci –` (tanpa membedakan huruf besar-kecil) tanpa awalannya; tidak ada → `null`; hasil kosong → `null`.<br>[Q7] Masukan kosong: `judulDokumen = ""`, `teksPerBagian = {}`, `judulBagianDitemukan = []`, `kataKunci = null`.<br>[Q8] Naskah yang dibangkitkan dari C-31 untuk templat yang sama menghasilkan himpunan kunci `teksPerBagian` yang sama dengan nama bagian templat (round-trip, lihat C-31); isian "[ … ]" kosong terbaca sebagai teks kosong.<br>[Q9] Mode berhuruf berlaku bila sekurang-kurangnya dua bagian templat berbeda muncul sebagai judul berhuruf (`A.`, `b)`, `A.JUDUL`; huruf besar atau kecil, spasi bebas; teks judul dibakukan menjadi "A. JUDUL"). Di mode ini paragraf polos bernama bagian bukan judul; hanya judul bergaya Heading yang boleh tanpa huruf.<br>[Q10] Kalimat petunjuk resmi bagian (atribut `petunjuk`; angka batas kata boleh berbeda, salah ketik satu huruf pada kata ≥ 5 huruf dimaafkan, ≥ 80% kalimat terbaca) dibuang dari awal isi, juga bila terpecah beberapa baris; begitu pula baris "Panduan: ..." buatan generator.<br>[Q11] Tanda isian pengusul dilepas: "[" pada awal baris isi pertama dan "]" pada akhir baris isi terakhir (hanya bila "]" melebihi "[" pada baris itu), baris yang hanya "[" di awal atau "]" di akhir selalu dibuang, placeholder "[ … ]" menjadi kosong; "[1] ..." di awal isi adalah nomor pustaka, bukan tanda isian.<br>[Q12] Pada bagian templat yang muncul paling akhir (Daftar Pustaka), halaman lampiran dan persetujuan yang ikut diekspor BIMA (judul "SURAT PERNYATAAN", "PERSETUJUAN PENGUSUL", berikut kop suratnya) dan teks sesudah entri pustaka bernomor berurutan terakhir dibuang.<br>[Q13] Tabel bagian pada berkas DOCX (putaran 2, 23 Okt 2026): `ekstrakDocx` (`blokDariHtml`) membuka tabel yang sel pertamanya berawal judul berhuruf ("A. JUDUL"): paragraf judul, petunjuk, dan isi selnya menjadi blok sendiri berurutan sehingga Q1 sampai Q12 berlaku seperti pada naskah tanpa tabel; tabel bersarang di dalam sel isian (Jadwal) tetap satu blok `[tabel]`; tabel lain (sel pertama bukan judul berhuruf) tetap satu blok `[tabel]` dan isinya dibuang. |
| Catatan | Selisih dengan naskah: naskah memberi argumen `teks` dan memanggil `ambilTeksBagian(teks)` pada tiap `BagianTemplat`; kode menerima blok terstruktur (dari ekstraksi DOCX atau PDF) dan melakukan ketiganya di satu fungsi. Struktur judul berhuruf, petunjuk resmi, dan halaman ekspor BIMA bersumber empat PDF contoh proposal BIMA (bagian A sampai H; lihat `docs/perubahan-model.md`). Lihat MS-01. |

### C-22 Proposal.catatTerkirim

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `catatTerkirim` / Proposal / C-22 |
| Clients (Consumers) | `proposal : Proposal` (pesan ke diri sendiri, seq-uc05 cabang "semua butir lolos"); dalam kode `prosesPengajuan` |
| Associated Use Cases | UC-05 langkah 6 (Bab 7) dan 10 (Bab 10); memicu UC-09 |
| Description of Responsibilities | Mencatat proposal sebagai terkirim (bukti pengiriman), memasukkan versinya ke antrean pemeriksaan semantik, dan mencerminkan status ke BIMA. |
| Arguments Received | `proposalId: string`, `versiId: string` |
| Type of Value Returned | `Promise<{ waktuTerkirim: Date }>` |
| Pre-Conditions | [P1] Seluruh butir deterministik versi itu `Lolos` (dijaga pemanggil, tidak diperiksa fungsi ini).<br>[P2] `proposalId` ada (bila tidak, galat saat membaca baris hasil). |
| Post-Conditions | [Q1] `proposal.status = "Terkirim"` dan `waktuTerkirim` = waktu nyata saat pencatatan.<br>[Q2] Log `proposal.terkirim` dengan kode versi.<br>[Q3] Satu baris `job_semantik` berstatus `Menunggu` (atau job `Menunggu`/`Berjalan` yang sudah ada dipakai ulang) untuk `versiId`; kegagalan mengantre tidak menggagalkan pencatatan, hanya dicatat sebagai `semantik.antre_gagal`.<br>[Q4] Status `Terkirim` dikirim ke BIMA (`kirimStatusProposal`); kegagalan hanya dicatat `bima.status_gagal` dan tidak melempar galat.<br>[Q5] Fungsi dapat dipanggil dua kali tanpa menggandakan job aktif. |
| Catatan | Selisih dengan naskah: `catatTerkirim()` naskah tanpa argumen dan hanya mencatat status di SEMAR; kode menerima id, juga mengantre UC-09 dan menyalin status ke BIMA. Status "Ditahan" disimpan sebagai `proposal.status` (catatan inkonsistensi no. 11). |

### C-23 VersiProposal.siapkanTeksTanpaIdentitas

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `siapkanTeksTanpaIdentitas` / VersiProposal / C-23 |
| Clients (Consumers) | `versi : VersiProposal` (pesan ke diri sendiri, seq-uc09 langkah 2) |
| Associated Use Cases | UC-09 langkah 3 (Bab 10) |
| Description of Responsibilities | Membuang identitas pengusul (nama, institusi, nomor induk) dari teks sebelum dikirim ke Layanan LLM. |
| Arguments Received | `teks: string`, `identitas: { nama?: string\|null; institusi?: string\|null; nomorInduk?: string\|null; lain?: (string\|null\|undefined)[] }` |
| Type of Value Returned | `string` |
| Pre-Conditions | [P1] Fungsi murni. |
| Post-Conditions | [Q1] Setiap kemunculan nama (lengkap; tanpa gelar belakang setelah koma pertama; tanpa gelar depan `prof/dr/drs/dra/ir/h/hj` dengan titik opsional), institusi, nomor induk, dan isian `lain` diganti `[identitas dihapus]`.<br>[Q2] Pencocokan tanpa membedakan huruf besar-kecil; spasi pada target cocok dengan satu atau lebih spasi atau baris baru pada teks; varian terpanjang diganti lebih dulu.<br>[Q3] Target yang kosong, `null`, `undefined`, atau berpanjang < 3 karakter setelah `trim` diabaikan: tepat 3 karakter dihapus, 2 karakter tidak.<br>[Q4] Tidak ada batas kata: target yang muncul di dalam kata lain tetap diganti (substring).<br>[Q5] `identitas` kosong dan teks tanpa blok identitas ekspor BIMA: keluaran = masukan.<br>[Q6] Panjang teks yang bukan identitas tidak berubah (selain Q7); keluaran tidak memuat lagi target mana pun (tanpa membedakan huruf besar-kecil), kecuali teks penanda itu sendiri.<br>[Q7] Ekspor BIMA: seluruh bagian "2. IDENTITAS PENGUSUL" (sampai judul bernomor 3 sampai 9 berhuruf kapital berikutnya, atau "A. JUDUL"; bila tidak ada penutup, sampai akhir teks) diganti satu baris `[identitas dihapus]`; baris "NO. DOKUMEN: ..." dibuang.<br>[Q8] Nomor induk panjang (≥ 8 angka: NIDN, NIM, NIK) di blok identitas dan nama pada baris tepat di atasnya (bukan baris peran seperti "Ketua Pengusul", "Anggota", "Mahasiswa") ikut menjadi target, sehingga identitas anggota tim yang tertulis lagi di bagian lain (mis. pembagian tugas pada Metode) turut dibuang. |
| Catatan | Selisih dengan naskah: naskah menyebut "identitas pengusul yang tercatat pada metadata proposal dari BIMA"; kode (`semantik/jalankan.ts`) memasukkan nama, institusi, dan nomor induk akun pengusul di SEMAR, ditambah blok identitas yang terbaca langsung dari teks ekspor BIMA (Q7, Q8); `lain` (mis. surel) tidak pernah diisi pemanggil. Lihat MS-08. |

### C-24 ButirCek.cocokkanKutipan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `cocokkanKutipan` / ButirCek / C-24 |
| Clients (Consumers) | `butir : ButirCek` (pesan ke diri sendiri, seq-uc09 cabang "Layanan LLM merespons") |
| Associated Use Cases | UC-09 langkah 7, SubFlow S-1 |
| Description of Responsibilities | Memastikan kutipan dari Layanan LLM benar-benar ada di teks bagian, supaya kutipan yang dikarang tidak dipercaya. |
| Arguments Received | `teksBagian: string`, `kutipan: string \| null \| undefined` |
| Type of Value Returned | `boolean` (`cariKutipan` mengembalikan `{mulai; akhir} \| null`) |
| Pre-Conditions | [P1] Fungsi murni. |
| Post-Conditions | [Q1] `kutipan` null, `undefined`, kosong, atau hanya spasi → `false`; `teksBagian` kosong → `false`.<br>[Q2] `true` jika dan hanya jika deretan kata kutipan (dipisah spasi) muncul berurutan di teks, dengan spasi, tab, dan baris baru di antaranya dianggap setara.<br>[Q3] Huruf besar-kecil dan tanda baca dibedakan: `"Metode"` tidak cocok `"metode"`; `"kata,"` tidak cocok `"kata"` di tengah kalimat tanpa koma.<br>[Q4] Spasi di tepi kutipan diabaikan.<br>[Q5] Kutipan sebagian kata tetap cocok (substring): `"metod"` cocok di dalam `"metode"`.<br>[Q6] Kutipan yang menggabungkan dua penggalan tak berdekatan → `false`. |
| Catatan | Karakter khusus ekspresi reguler pada kutipan dilepas (escape), sehingga `"(1+1)"` dicocokkan apa adanya. Lihat MS-07. |

### C-25 BasisAturan.periksaSemantik / ButirCek.nilaiSemantik

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `periksaSemantik` (BasisAturan) dan `nilaiSemantik` (ButirCek) / C-25 |
| Clients (Consumers) | `versi : VersiProposal` (seq-uc09 `periksaSemantik(teksTanpaIdentitas)`), `basis : BasisAturan` (`nilaiSemantik(teksBagian)`); `ujiPadaContoh` (C-10) |
| Associated Use Cases | UC-09 langkah 4 sampai 8, S-1, S-2; UC-02 langkah 5 |
| Description of Responsibilities | Menilai setiap butir semantik atas teks yang sudah tanpa identitas lewat Layanan LLM (maksimum dua percobaan, batas 15 detik per percobaan), memverifikasi kutipan, dan menghasilkan rekomendasi atau status pengganti ("Perlu diperiksa manual", "Belum ada rekomendasi"). Sisi basis data (`jalankan`) menyimpan hasil per butir dan mengelola status antrean. |
| Arguments Received | `nilaiSemantikDenganOpsi(dokumen: {teksPerBagian: Record<string,string>; teksLampiran: Record<string,string>; gambarPerBagian?: Record<string, GambarNaskah[]>}, butir: ButirCek[], opsi?: {penyedia?; paralel?: number (bawaan 4); jedaMs?: number; tiruan?: boolean; skenario?: "kutipan-salah"\|"tidak-merespons"})`; `jalankan(versiId: string, opsi?: OpsiNilai)` |
| Type of Value Returned | `Promise<{ hasil: HasilButirSemantik; percobaan: number }[]>`; `jalankan`: `Promise<RingkasanPemeriksaanSemantik>` (`{versiId; jumlahButir; jumlahMemenuhi; jumlahPerluManual; jumlahBelumAda; tiruan}`) |
| Pre-Conditions | [P1] Teks sudah tanpa identitas (C-23). [P2] Penyedia LLM dapat diganti stub pada uji; tanpa kunci API atau `SEMAR_LLM_MODE=tiruan` dipakai mode tiruan (hasil `tiruan = true`).<br>[P3] `jalankan`: versi proposal ada dan tercatat terkirim. |
| Post-Conditions | [Q1] Panjang keluaran = jumlah butir `jenis = "semantik"` pada masukan, urutan sama; butir deterministik diabaikan.<br>[Q2] Sasaran butir = teks bagian pada parameter `bagian` (atau teks lampiran bila ada `lampiran`, dengan bagian sebagai pendukung). Sasaran kosong atau hanya spasi: status `Tidak memenuhi`, rekomendasi `Tidak memenuhi`, keyakinan 0,9, alasan "Teks \"<sasaran>\" tidak ditemukan pada proposal.", `percobaan = 0`, tanpa memanggil LLM.<br>[Q3] Permintaan ke LLM dicoba paling banyak 2 kali (`PERCOBAAN_ULANG_LLM = 2` adalah jumlah percobaan total, bukan jumlah ulangan); jeda 400 ms (bawaan) antarpercobaan; berhasil pada percobaan ke-k → `percobaan = k`.<br>[Q4] Kedua percobaan gagal (galat atau batas 15 detik terlampaui): status `Belum ada rekomendasi`, `rekomendasi`, `kutipan`, `tingkatKeyakinan` = null, `alasanSistem` menyebut dua percobaan dan galat terakhir (S-2).<br>[Q5] Ada jawaban dan `kutipan` (setelah `trim`) tidak kosong dan ditemukan di teks sasaran + pendukung (C-24): `status = rekomendasi`, `kutipan` terisi; `kutipanLain` = kutipan tambahan dari jawaban yang juga ditemukan di teks, bukan duplikat, paling banyak 2 (`saringKutipanLain`). Selain kasus ini `kutipanLain` kosong.<br>[Q6] Ada jawaban, kutipan kosong, rekomendasi `Tidak memenuhi`: `status = "Tidak memenuhi"`, `kutipan = null` (bukan kutipan palsu).<br>[Q7] Ada jawaban, kutipan tidak ditemukan di teks (S-1), atau kutipan kosong dengan rekomendasi `Memenuhi`: `status = "Perlu diperiksa manual"`, `kutipan = null`, `rekomendasi` dan `tingkatKeyakinan` tetap dari jawaban, `alasanSistem` diawali catatan kutipan tidak ditemukan.<br>[Q8] `tiruan` pada hasil = `opsi.tiruan` atau (mode LLM = tiruan).<br>[Q9] `jalankan`: tepat satu baris `hasil_pemeriksaan` jenis semantik per butir aktif (upsert menurut (versi, butir): id baris dan koreksi yang menempel tetap); job menjadi `Selesai` atau, bila ada galat tak tertangani, `Gagal` lalu galat dilempar ulang (lihat MS-06).<br>[Q10] Gambar: butir atas bagian membawa gambar bagian itu (`gambarPerBagian`, nama bagian tanpa membedakan huruf; maks. 10, dari tabel `gambar_naskah` yang diisi saat naskah dibaca) ke Layanan LLM sebagai blok gambar berpenanda `[gambar n]`, sama dengan penanda di teks bagian; butir atas lampiran dan mode tiruan tanpa gambar; `SEMAR_LLM_GAMBAR=0` mematikan pengiriman. Batas waktu permintaan bergambar 40 detik. Penanda gambar yang dilampirkan sah sebagai kutipan (Q5). |
| Catatan | Selisih dengan naskah: (1) naskah S-1 hanya menyebut "kutipan tidak ditemukan → Perlu diperiksa manual"; kode menambah tiga cabang ([Q2], [Q6], [Q7] bagian kutipan kosong). (2) NFR 4.4 menyebut ulang maksimum 2 kali (tiga panggilan) sedangkan UC-09 S-2 dan kode memakai dua percobaan total; klien BIMA memakai tiga panggilan. (3) `mintaJawaban` sendiri tidak memasang pewaktu; batas 15 detik dipasang pada klien Anthropic (`timeout`), sehingga di mode tiruan "tidak merespons" disimulasikan dengan galat. |

### C-26 KoreksiRekomendasi.simpanKoreksi

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `simpanKoreksi` / KoreksiRekomendasi / C-26 |
| Clients (Consumers) | `rev : Reviewer` (seq-uc08, `simpanKoreksi(keputusan, alasan, jenisKekeliruan)`); tombol "Simpan Koreksi" (M-10) |
| Associated Use Cases | UC-08 langkah 6 sampai 8, S-1 (alasan kosong) |
| Description of Responsibilities | Menyimpan koreksi reviewer atas rekomendasi sistem (keputusan, alasan, jenis kekeliruan) sehingga keputusan reviewer berlaku, sementara rekomendasi semula tetap tersimpan; menolak alasan kosong. |
| Arguments Received | `penugasanId: string`, `akun: {id: string; idBima: string}`, `hasilId: string`, `masukan: { keputusan: string; alasan: string; jenisKekeliruan: string }` |
| Type of Value Returned | `Promise<{ok:true; koreksi:{keputusan; alasan; jenisKekeliruan}} \| {ok:false; galat:string; kolom?: Record<string,string>}>` |
| Pre-Conditions | [P1] Pemanggil reviewer yang ditugaskan pada `penugasanId` (NFR 3.1).<br>[P2] Penilaian belum final.<br>[P3] `hasilId` adalah hasil semantik pada versi yang dinilai penugasan itu. |
| Post-Conditions | [Q1] `keputusan` selain "Memenuhi" dan "Tidak memenuhi": galat kolom `keputusan` "Pilih keputusan reviewer".<br>[Q2] `alasan` kosong atau hanya spasi (setelah `trim`): galat kolom `alasan` "Alasan koreksi wajib diisi"; satu karakter bukan spasi = sah.<br>[Q3] `jenisKekeliruan` opsional: kosong sah; bila terisi harus salah satu dari lima nilai baku ("Kutipan salah tempat", "Salah tafsir isi", "Bagian tidak ditemukan padahal ada", "Rekomendasi tidak relevan dengan butir", "Lainnya"), selain itu galat kolom `jenisKekeliruan`.<br>[Q4] Bila ada galat validasi: `{ok:false, galat = kolom.alasan ?? "Masukan koreksi tidak valid", kolom}`; tidak ada tulisan ke basis data.<br>[Q5] Penugasan tidak ditemukan atau berstatus `Diusulkan`, atau id bukan UUID: `{ok:false, galat:"Penugasan tidak ditemukan"}`; penugasan reviewer lain: `{ok:false, galat:"Akses ditolak"}` dengan log `akses.ditolak`.<br>[Q6] Penilaian berstatus `Final`: `{ok:false, galat:"Penilaian sudah final dan tidak dapat diubah"}`.<br>[Q7] `hasilId` bukan UUID, tidak ada, bukan jenis semantik, atau milik versi lain: `{ok:false, galat:"Butir tidak ditemukan pada proposal ini"}` (bukan UUID: "Butir tidak ditemukan").<br>[Q8] Berhasil: tepat satu baris `koreksi_rekomendasi` untuk `hasilId` (simpan kedua pada butir yang sama menimpa baris itu, bukan menambah); `alasan` disimpan setelah `trim`; `hasil_pemeriksaan.rekomendasi` dan `status` tidak berubah; `penilaian.diperbaruiPada` diperbarui; log `koreksi.simpan` memuat rekomendasi dan status semula. |
| Catatan | Selisih dengan naskah: naskah memanggil `catatKoreksi` dan `ambilRekomendasi` saat "Tidak Setuju" ditekan; kode menjalankannya saat "Simpan Koreksi" supaya Batal (3a) tidak menulis apa pun (catatan inkonsistensi no. 15). `gantiRekomendasi` tidak menimpa rekomendasi, melainkan menyimpan keputusan reviewer di baris koreksi (`docs/perubahan-model.md`). |

### C-27 Penilaian.simpanNilai

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `simpanNilai` / Penilaian / C-27 |
| Clients (Consumers) | `rev : Reviewer` (seq-uc07, `simpanNilai(nilai, komentar)` pada cabang simpan sementara dan simpan permanen) |
| Associated Use Cases | UC-07 langkah 7 dan S-1 (simpan sementara) |
| Description of Responsibilities | Menyimpan keputusan enam komponen borang dan umpan balik sebuah penilaian dalam satu kesatuan. Pembungkus `simpanSementara` menyimpan berstatus Draf tanpa pengiriman. |
| Arguments Received | `simpanNilai(penilaianId: string, umpanBalik: string, komponen: Record<string, "Memenuhi"\|"Tidak memenuhi">, status: "Draf"\|"Final", ex?)`; `simpanSementara(penugasanId, akun, isian: {umpanBalik: string; komponen: Record<string,string\|undefined>})` |
| Type of Value Returned | `simpanNilai`: `Promise<void>`; `simpanSementara`: `Promise<{ok:true} \| {ok:false; galat:string}>` |
| Pre-Conditions | [P1] Penilaian ada. [P2] Untuk `simpanSementara`: akses reviewer sah dan penilaian belum final. |
| Post-Conditions | [Q1] `keputusan_komponen` penilaian itu digantikan seluruhnya oleh `komponen` (hapus lalu sisip) dalam satu transaksi (atau transaksi pemanggil bila `ex` diberikan).<br>[Q2] `penilaian.komentar = umpanBalik`, `status` sesuai argumen, `nilai = "<m> dari 6 komponen Memenuhi"` dengan m = jumlah komponen baku bernilai "Memenuhi" (0 sampai 6).<br>[Q3] `bersihkanKomponen` hanya meneruskan enam nama komponen baku dengan nilai sah; nama lain atau nilai lain dibuang.<br>[Q4] `simpanSementara`: komponen boleh belum lengkap (0 sampai 6 terisi); penugasan berlabel `Draf`; tanpa log audit dan tanpa pengiriman ke BIMA; penilaian `Final` → `{ok:false, galat:"Penilaian sudah final dan tidak dapat diubah"}`; akses tidak sah seperti C-26 [Q5]. |
| Catatan | Penyimpanan sementara berulang menimpa isi sebelumnya. Penyimpanan permanen dijelaskan di C-28. |

### C-28 Penilaian.terima / PenugasanReviewer.tandaiSelesai

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `terima` (Penilaian) dan `tandaiSelesai` (PenugasanReviewer), diorkestrasi `simpanPermanen` / C-28 |
| Clients (Consumers) | `rev : Reviewer` (seq-uc07, cabang "simpan permanen": `terima()`); `penilaian : Penilaian` (`tandaiSelesai()`); tombol "Simpan Permanen" (M-11) |
| Associated Use Cases | UC-07 langkah 7 sampai 8 (Bab 10), Bab 7 langkah 7 dan 8 |
| Description of Responsibilities | Menjadikan penilaian final dan hanya-baca, menandai penugasan selesai, mencatat di log audit, dan mengirim keputusan ke BIMA; hanya dapat dilakukan bila keenam komponen borang telah diputuskan. |
| Arguments Received | `simpanPermanen(penugasanId: string, akun: {id; idBima}, isian: {umpanBalik: string; komponen: Record<string,string\|undefined>})`; `terima(penilaianId: string, ex?)`; `tandaiSelesai(penugasanId: string, ex?)` |
| Type of Value Returned | `simpanPermanen`: `Promise<{ok:true; terkirim:boolean; pesanKirim?:string} \| {ok:false; galat:string}>`; `terima`, `tandaiSelesai`: `Promise<void>` |
| Pre-Conditions | [P1] Pemanggil reviewer yang ditugaskan (NFR 3.1).<br>[P2] Penilaian belum final.<br>[P3] Keenam komponen borang baku memiliki keputusan sah. |
| Post-Conditions | [Q1] Akses tidak sah dan penilaian sudah final: seperti C-27 [Q4].<br>[Q2] Kurang dari enam komponen terisi sah: `{ok:false, galat:"Tetapkan keputusan untuk semua komponen borang sebelum menyimpan permanen"}`; tanpa perubahan. Tepat enam: diterima.<br>[Q3] Berhasil (dalam satu transaksi): `penilaian.status = "Final"` (klaim atomik: dua permintaan serentak, hanya satu yang berhasil, yang lain mendapat "Penilaian sudah final dan tidak dapat diubah"); komponen dan umpan balik tersimpan (C-27); `penugasan.status = "Selesai"` dan `label = "Selesai"`; log `penilaian.simpan_permanen` memuat komponen dan jumlah koreksi.<br>[Q4] Sesudah transaksi, keputusan dikirim ke BIMA (`kirimKeputusan`, kunci idempoten = id penilaian). Berhasil: `{ok:true, terkirim:true}`, `dikirimKeBimaPada` terisi, log `penilaian.terkirim_bima`. Gagal: `{ok:true, terkirim:false, pesanKirim}` dengan pesan "Penilaian tersimpan, tetapi gagal terkirim ke BIMA. Tekan \"Kirim ulang\"."; log `penilaian.kirim_bima_gagal`; penilaian tetap final.<br>[Q5] Sesudah final, `simpanNilai` lewat `simpanSementara` atau `simpanKoreksi` ditolak (hanya-baca).<br>[Q6] `terima(id)`: `penilaian.status = "Final"`. `tandaiSelesai(id)`: penugasan berstatus dan berlabel `Selesai`. Keduanya menurut state machine penugasan `Ditetapkan → Selesai`. |
| Catatan | Selisih dengan naskah: urutan naskah `simpanNilai → terima → tandaiSelesai → mencatatPenilaian → kirimKeputusan`; kode mengklaim `Final` lebih dulu secara atomik, lalu `simpanNilai`, `tandaiSelesai`, `mencatatPenilaian` (satu transaksi), dan baru `kirimKeputusan`. Fungsi `terima` diekspor tetapi tidak dipanggil `simpanPermanen` (klaim `Final` ditulis langsung di dalam transaksi). Penolakan komponen belum lengkap tidak ada di Bab 7 (catatan inkonsistensi no. 8). |

### C-29 BasisAturan.rekapKesesuaian / ButirCek.hitungTingkatKoreksi

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `rekapKesesuaian` (BasisAturan) dan `hitungTingkatKoreksi` (ButirCek) / C-29 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc04, `rekapKesesuaian(periode)` dan `rekapKesesuaian(periode, butir)` untuk rincian) |
| Associated Use Cases | UC-04 langkah 2 sampai 5 dan S-1 (rincian butir) |
| Description of Responsibilities | Menyusun laporan J-05 "triase dulu": angka ringkas, daftar butir yang perlu perhatian, % rekomendasi semantik yang disetujui reviewer per butir beserta arah dan jenis koreksi, gagal saat pengajuan per butir dan institusi pengusul, tren mingguan, kalibrasi tingkat keyakinan, perbandingan sebelum-sesudah antarversi basis aturan, dan contoh rincian per butir. |
| Arguments Received | `rekapKesesuaian(m: MasukanRekap)` dengan `MasukanRekap = {sel: SelSemantik[]; gagal: SelGagal[]; pengajuan: {institusi; proposal}[]; butir: InfoButir[]; contoh: ContohRincian[]; contohGagal: ContohGagal[]; proposalPernahGagal; penilaianFinal; ambang?}`. `SelSemantik = {butirKode; versi; deskripsi; tingkat: tinggi\|sedang\|rendah\|null; minggu; arah: longgar\|ketat\|null; jenis; jumlah}` (agregat SQL). `susunLaporan(periodeId, skemaId, ambang?)` membaca agregat dari basis data. |
| Type of Value Returned | `HasilRekap` = `{ringkas; perluPerhatian: ItemPerhatian[]; semantik: BarisSemantik[]; deterministik: BarisDeterministik[]; tren; trenButir; kalibrasi; kalibrasiButir; tafsirKalibrasi; bandingVersi; rincian; rincianGagal}`; `susunLaporan`: `Promise<LaporanKesesuaian>` (`HasilRekap` + `basis`, `penandaVersi`, `ambang`) |
| Pre-Conditions | [P1] `rekapKesesuaian` murni. [P2] `sel` hanya hasil semantik pada penilaian berstatus Final; `minggu` >= 1 dihitung dari penetapan penugasan pertama periode (tanggal tutup bila belum ada); `gagal` = jumlah proposal (bukan baris) yang pernah berstatus Gagal pada butir deterministik itu di versi mana pun.<br>[P3] `susunLaporan`: tanpa penilaian final, laporan tetap tersusun (bagian semantik kosong) tanpa galat. |
| Post-Conditions | [Q1] % disetujui = (jumlah - dikoreksi) x 100 / jumlah; rekomendasi yang tidak dikoreksi dihitung disetujui (persetujuan bersifat diam).<br>[Q2] Hasil semantik sebuah butir digabung lintas versi selama deskripsinya sama dengan deskripsi pada basis berlaku; hasil berdeskripsi lama masuk `bandingVersi` (kelompok lama = versi tertinggi di antara deskripsi lama), bukan ke % berlaku.<br>[Q3] `cukup` bila jumlah >= ambang.minHasil (30); butir semantik `perhatian` bila cukup dan % disetujui < ambang.disetujui (80).<br>[Q4] Arah: `longgar` = keputusan reviewer Tidak memenuhi (sistem Memenuhi), `ketat` = sebaliknya; `jenis` dirangkum per jenis kekeliruan (kosong = "Tanpa jenis"), urut terbanyak.<br>[Q5] Butir deterministik `perhatian` bila gagal pada >= ambang.gagal (25%) pengajuan (`sebab` keseluruhan) atau >= ambang.gagalInstitusi (40%) di institusi tertinggi yang pengajuannya >= ambang.minPengajuanInstitusi (20) (`sebab` terpusat).<br>[Q6] `perluPerhatian`: butir yang menyala, urut paling jauh dari ambangnya (poin persen), lalu butir berstatus Perlu ditinjau walau tidak menyala; `ringkas.perluPerhatian` hanya menghitung yang menyala dan belum ditandai.<br>[Q7] Kalibrasi per tingkat keyakinan (tinggi >= 0,8; sedang 0,5 sampai < 0,8; rendah < 0,5); `terlaluYakin` bila keyakinan tinggi cukup data dan dikoreksi >= ambang.terlaluYakin (20%); `tafsirKalibrasi` null bila data kurang.<br>[Q8] `rincian[kode]`: yang dikoreksi lebih dulu (SQL membatasi <= 3 per jenis kekeliruan dan 4 yang disetujui); `rincianGagal[kode]` <= 6 proposal.<br>[Q9] Masukan kosong: semua larik kosong, `ringkas.persen` null. |
| Catatan | Selisih dengan naskah: `ambilStatus`, `ambilAlasan`, `ambilRincian`, `ambilContoh` dan `hitungTingkatKoreksi` pada seq-uc04 merupakan alias `susunLaporan`, bukan metode berpenerima terpisah. Arah koreksi, kalibrasi, tren, sebelum-sesudah, dan ambang adalah tambahan prototipe (catatan-inkonsistensi #57). Lihat MS-09. |

### C-30 BasisAturan.tandaiButir / ButirCek.tandaiPerluDitinjau

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `tandaiButir` (BasisAturan) dan `tandaiPerluDitinjau` (ButirCek) / C-30 |
| Clients (Consumers) | `tim : TimKerjaDPPM` (seq-uc04, loop "setiap butir yang aturannya perlu diperbaiki") |
| Associated Use Cases | UC-04 langkah 5 sampai 6 (bahan UC-02) |
| Description of Responsibilities | Menandai butir yang sering dikoreksi sebagai "Perlu ditinjau" sebagai bahan perbaikan aturan, tanpa mengubah aturan yang sedang dipakai. |
| Arguments Received | `skemaId: string`, `periodeId: string`, `kodeButir: string[]`, `aktorId: string`, `aktorIdBima: string` |
| Type of Value Returned | `Promise<{ ditandai: string[] }>` |
| Pre-Conditions | [P1] Pemanggil Tim Kerja DPPM (hak anggota cukup). [P2] Ada basis aturan berlaku untuk skema dan periode (bila tidak, hasil kosong). |
| Post-Conditions | [Q1] Tidak ada basis berlaku atau `kodeButir` kosong: `{ditandai: []}` tanpa perubahan.<br>[Q2] Hanya butir pada basis berlaku dengan `kode` termasuk `kodeButir` DAN status `Aktif` menjadi `Perlu ditinjau`, dengan `ditandaiOleh = aktorId` dan `ditandaiPada` = sekarang; `ditandai` memuat kode butir yang berubah.<br>[Q3] Butir berstatus `Draf`, `Nonaktif`, atau sudah `Perlu ditinjau` tidak berubah dan tidak masuk `ditandai`; kode yang tidak ada diabaikan tanpa galat.<br>[Q4] Satu entri log `tandai_butir_perlu_ditinjau` per butir yang berubah; tidak ada log untuk yang tidak berubah.<br>[Q5] Butir `Perlu ditinjau` tetap dipakai pemeriksa UC-06 dan UC-09 sampai basis versi baru disimpan (C-09 mengembalikannya ke `Aktif`). |
| Catatan | State machine butir: `Aktif → Perlu ditinjau → Aktif` (saat Simpan Versi) atau `→ Nonaktif`. Tabel `rincian` UC-04 tidak diubah. |

### C-31 TemplatProposal.buatDokumenTemplat

Tambahan prototipe (unduh .docx), tidak ada di naskah. Implementasi `src/lib/templat/dokumen.ts` sudah ada saat dokumen ini difinalkan; tanda tangan di bawah diambil dari kode itu.

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID | `buatDokumenTemplat` / TemplatProposal / C-31 (tambahan prototipe) |
| Clients (Consumers) | Tidak ada di *sequence diagram* naskah. Pemanggil di kode: rute `/api/semar/templat/[idTemplat]/unduh` (tombol "Unduh Templat (.docx)" di J-02 oleh `tim : TimKerjaDPPM`, dan pratinjau draf di J-02b) serta `/api/semar/templat/berlaku/[idSkema]/unduh` (templat Terbit untuk `peng : Pengusul` di BIMA pengajuan) |
| Associated Use Cases | UC-01 (J-02, J-02b); UC-05 (BIMA pengajuan); pembaca balik: `potongPerBagian` (C-21) |
| Description of Responsibilities | Menyusun berkas Word dari sebuah versi templat sehingga tim dapat melihat hasil templat dan pengusul dapat mengisinya, dengan struktur yang dapat dibaca balik oleh `potongPerBagian`. |
| Arguments Received | `templat: {versi: number; status: "Draf"\|"Terbit"\|"Arsip"}`, `bagian: BagianTemplatDto[]`, `lampiran: string[]`, `skema: {kode: string; namaSkema: string}`, `periode: {nama: string; tahun?: number} \| null`, `paket?: {kepala?, kop?, lampiranTemplat?, mode?: "paket" \| "isian"}` |
| Type of Value Returned | `Promise<Buffer>` (isi berkas .docx). Pembantu: `bagianDokumen(bagian): BagianTemplatDto[]`, `panduanBagian(b): string`, `namaBerkasTemplat(skema, templat): string` (mis. `Templat-PD-v3-Terbit.docx`) |
| Pre-Conditions | [P1] Pemanggil berhak: Tim Kerja DPPM untuk semua versi, pengusul hanya templat Terbit (dijaga rute).<br>[P2] Fungsi murni, tanpa basis data; `bagian` boleh kosong dan templat boleh berstatus Draf yang belum lengkap. |
| Post-Conditions | [Q1] Berkas adalah .docx sah (diawali `PK`), dapat dibaca `ekstrakDocx`.<br>[Q2] Mode `paket` (bawaan) terdiri atas tiga bagian dokumen (section) berurutan: halaman depan, Isian Substansi, lalu satu halaman per templat lampiran yang disertakan. Mode `isian`: hanya Isian Substansi.<br>[Q3] Halaman depan (Roboto, margin lebar): kop berlogo (tiga baris dari data templat; alamat dan laman kosong dilewati) dan garis; "PROTEKSI ISI PROPOSAL" dan kalimat proteksi persis contoh BIMA; "PROPOSAL PENELITIAN" putih di atas latar hitam; "Rencana Pelaksanaan Penelitian" dan "NO. DOKUMEN"; lalu bagian bernomor menurut sakelar: Judul (kotak judul dan tiga tabel klasifikasi), Identitas, Mitra (kalimat contoh dan tabel), Luaran (Luaran Wajib dan Luaran Tambahan), Bidang Strategis, Anggaran (kalimat acuan, Total RAB, tabel), semuanya tabel kosong berkepala persis contoh.<br>[Q4] Isian Substansi (Avenir Next LT Pro dan Calibri): kepala berlogo (judul dokumen, subjudul skema tebal, pengantar miring rata kiri-kanan) dan garis tebal; setiap bagian menjadi satu tabel satu kolom dengan dua baris: baris kepala berlatar biru muda (BDD6EE) berisi judul berhuruf besar tebal ("A. JUDUL" ... "H. DAFTAR PUSTAKA", berurutan menurut `urutan`, paragraf biasa, bukan Heading) dan kalimat petunjuk miring (petunjuk tersimpan, `{batas}` diganti; tanpa kalimat bila kosong atau tidak ada), dan baris isian berbingkai berisi tempat isian menurut jenis: `[ ]` (teks), `[kata kunci 1; ...; kata kunci n]` memakai jumlah dan pemisah (daftar), tabel "Tahun ke-1" dengan kolom No, Nama Kegiatan, Bulan 1-12 di dalam sel (tabel), `[1] ` (daftar pustaka); bagian wajib gambar menambah baris `[Sisipkan diagram alir penelitian (JPG/PNG)]`.<br>[Q5] "Kata Kunci" dan "Daftar Pustaka" selalu ada (ditambahkan bila belum ada).<br>[Q6] Halaman lampiran (Times New Roman), masing-masing diawali pemisah halaman: unggahan = Heading 1 "LAMPIRAN n. NAMA" dan satu kalimat; formulir = Heading 1 kop ("KOP INSTANSI MITRA" dan tab kanan "Alamat, telepon, dan laman instansi", garis bawah), Heading 1 judul formulir di tengah, kalimat templat rata kiri-kanan, baris "A \| B" menjadi tabel tanpa bingkai tiga kolom (label \| ":" \| "....") dengan titik dua sejajar, lalu blok tempat/tanggal, ruang tanda tangan, dan "Nama : ...." menjorok ke kanan.<br>[Q7] Metadata (skema, periode berlaku, versi dan status templat) tidak ada di badan: ditulis di kaki halaman setiap bagian dokumen dan di properti dokumen (deskripsi).<br>[Q8] Round-trip: `potongPerBagian(ekstrakDocx(hasil), bagianDokumen(bagian))` memiliki kunci untuk setiap bagian (judul di dalam sel tabel terbaca lewat C-21 [Q13]), semua teks kosong kecuali bagian bertabel (hanya `[tabel]`); halaman depan dan lampiran tidak ikut terpotong dan tidak dicatat sebagai judul asing; `kataKunci = null`; `hitungKata` seluruh isian 0. |
| Catatan | Kalimat petunjuk resmi dan "[ … ]" tidak dihitung `hitungKata` karena dibuang `potongPerBagian` (C-21 [Q10], [Q11]); selisih kebutuhan 1.6 tertutup. Bagian "Kata Kunci" dan "Daftar Pustaka" yang ditambahkan generator tidak ada di baris `bagian_templat`, sehingga butir turunan C-03 tidak memuatnya. Kalimat petunjuk adalah atribut bagian templat yang diturunkan dari nama bagian (`templat/isian-substansi.ts`), bukan kolom basis data. Putaran 2 (23 Okt 2026): tampilan meniru contoh BIMA diverifikasi dengan `npm run pratinjau-docx` (docx-preview di Chrome); tangkapan perbandingan di `docs/bukti-e2e/uc01-docx-*-templat.png`. Font contoh tidak terpasang di mesin uji, jadi tangkapan memetakan Avenir Next LT Pro, Calibri, dan Roboto ke font sistem terdekat; tab kanan pada kop surat tidak digambar docx-preview tetapi ada di berkas. |

## 4. Method Specifications

Semua spesifikasi: Programmer "Kelompok AKPSI (prototipe)", Date Due 2026-10-22, Programming Language TypeScript. Nomor jalur `[Jn]` dipakai uji *white box* sebagai penanda cabang. Notasi *Structured English*: IF/THEN/ELSE, FOR EACH, WHILE, CASE, RETURN.

### MS-01 potongPerBagian

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `potongPerBagian` / TemplatProposal / MS-01 / C-21 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | `prosesPengajuan` (UC-05 langkah memotong teks) sesudah ekstraksi naskah; "Pratinjau" uji unit |
| Arguments Received | `blok: BlokTeks[]` (Data Type: array objek; Notes: urutan naskah); `bagian: BagianTemplatDto[]` (Notes: nama unik, `urutan` menentukan keluaran, bukan posisi di naskah) |
| Messages Sent & Arguments Passed | `normalisasiJudul(teks: string)` (string; Notes: `pemeriksa/deterministik/teks.ts`, membuang penomoran dan huruf bagian di depan); `petunjukResmi(nama, batasKata)` (`templat/isian-substansi.ts`); `buangPetunjuk(baris, petunjuk)`, `lepasTandaIsian(baris)`, `buangLampiranEkspor(baris)`, `potongDaftarPustakaEkspor(baris)` (fungsi pembantu di `pengajuan/potong.ts`) |
| Arguments Returned | `HasilPotong` `{judulDokumen, teksPerBagian, judulBagianDitemukan, kataKunci}` |
| Algorithm Specification | SET peta nama-ternormalisasi → nama bagian; petunjuk[nama] = bagian.petunjuk ATAU petunjukResmi(nama, batasKata)<br>SET berhuruf = (jumlah bagian templat berbeda yang muncul sebagai judul berhuruf ≥ 2) [J11]<br>SET `aktif` = tak ada; `diLuarTemplat` = false; `mulai` = false<br>FOR EACH blok b DALAM urutan naskah:<br>&emsp;SET k = cocokkan(b): CASE<br>&emsp;&emsp;b.jenis bukan judul/paragraf, teks kosong, atau teks > 100 karakter → tak cocok [J16]<br>&emsp;&emsp;teks berpola huruf+penanda+sisa ("A. JUDUL", "b) ringkasan", "A.JUDUL") dan sisa ternormalisasi ada di peta → cocok berhuruf; teks dibakukan "A. JUDUL" [J12]<br>&emsp;&emsp;[J14] ELSE IF berhuruf THEN cocok hanya bila b.jenis = judul dan teksnya ternormalisasi ada di peta (paragraf polos bukan judul)<br>&emsp;&emsp;[J1] ELSE cocok bila ternormalisasi ada di peta DAN (b.jenis = judul ATAU panjang teks ≤ 80)<br>&emsp;[J1] IF k cocok DAN bagian itu belum pernah dimulai THEN catat teks judul ke daftar judul ditemukan; aktif = bagian itu; diLuarTemplat = false; mulai = true; siapkan teks kosong; LANJUT<br>&emsp;[J2] ELSE IF b.jenis = judul DAN (b.tingkat bawaan 1) ≤ 1 DAN mulai THEN catat b.teks ke daftar judul ditemukan; aktif = tak ada; diLuarTemplat = true; LANJUT<br>&emsp;[J3] ELSE IF mulai = false THEN simpan b.teks ke daftar "sebelum" (sampul, identitas ekspor BIMA, judul dokumen lama); LANJUT<br>&emsp;[J4] ELSE IF aktif ada DAN diLuarTemplat = false THEN tambahkan b.teks ke bagian aktif (termasuk penanda [gambar] dan [tabel])<br>&emsp;[J5] ELSE abaikan blok<br>SET terakhir = bagian templat yang dimulai paling akhir<br>FOR EACH bagian templat berurutan: IF punya teks THEN [J7]<br>&emsp;SET baris = buangPetunjuk(teks, petunjuk[nama]): buang baris kosong dan "Panduan: ..." di awal [J20]; cocokkan kata demi kata dengan kalimat petunjuk (angka sama-sama angka dianggap sama; kata ≥ 5 huruf berbeda satu huruf dianggap sama); IF ≥ 80% kata kalimat terbaca THEN buang baris-baris itu [J17]<br>&emsp;IF berhuruf DAN bagian = terakhir THEN baris = buangLampiranEkspor(baris) [J19]; IF bagian = Daftar Pustaka THEN baris = potongDaftarPustakaEkspor(baris) [J19]<br>&emsp;SET baris = lepasTandaIsian(baris) [J17]<br>&emsp;hasil[nama] = baris dipisah "\n"<br>SET judulDokumen: IF berhuruf THEN (isi bagian Judul digabung spasi, atau "" bila tak ada) [J15] ELSE teks tak kosong pertama pada "sebelum", atau "" bila tidak ada [J6]<br>CASE kata kunci:<br>&emsp;[J8] IF ada bagian bernama "Kata Kunci" (ternormalisasi) THEN gabungkan semua barisnya dengan spasi [J17]; buang awalan "Kata kunci:" (juga "-" atau "–") [J18]<br>&emsp;[J9] ELSE cari blok paragraf pertama berawalan "Kata kunci:/-/–"; kataKunci = teks tanpa awalan, atau null bila tidak ada<br>&emsp;[J10] IF hasil akhir string kosong THEN kataKunci = null<br>RETURN {judulDokumen, teksPerBagian = hasil, judulBagianDitemukan, kataKunci}<br><br>**lepasTandaIsian(baris)**: buang baris kosong; IF baris terakhir = "]" THEN buang; IF baris pertama = "[" THEN buang; IF baris pertama diawali "[" dan bukan "[n]" THEN lepas "[" dan, bila "]" melebihi "[" pada baris terakhir, lepas "]" terakhir; buang baris "…" atau "..." (placeholder)<br>**buangLampiranEkspor(baris)**: IF ada baris berjudul surat ("SURAT PERNYATAAN/KETERANGAN/KESEDIAAN/DUKUNGAN ...", "PERSETUJUAN PENGUSUL", "LEMBAR PENGESAHAN/PERSETUJUAN") THEN potong di baris itu dan mundur melewati baris kop (huruf kapital semua, berawalan Jalan/Telepon/Laman/Pos-el/Fax, atau baris alamat pendek ≤ 45 karakter tanpa tautan, DOI, atau titik akhir)<br>**potongDaftarPustakaEkspor(baris)**: cari rantai entri bernomor 1, 2, 3, ...; IF kurang dari 3 entri THEN tak berubah; ELSE potong sesudah entri terakhir rantai dan baris lanjutannya sampai baris penutup (berakhir titik selain inisial nama, atau tautan) atau paling banyak 8 baris |
| Misc. Notes | Jalur J2 menghilangkan isi di bawah judul tingkat 1 di luar templat (mis. "Lampiran") dari semua bagian. Pada naskah PDF semua blok berjenis paragraf, sehingga judul polos dikenali hanya lewat panjang ≤ 80 karakter (J1) dan J2 tidak pernah tercapai; judul berhuruf (J12) tidak bergantung pada jenis blok. Judul tingkat 2 atau lebih dalam yang bukan nama bagian: bila ada bagian aktif menjadi isinya (J4), bila tidak (sesudah J2) diabaikan (J5). Bagian templat tanpa judul di naskah tidak muncul di `teksPerBagian` (dibaca kosong oleh C-16 dan dilaporkan oleh C-20). Sub-judul berhuruf-angka ("D1. Latar Belakang") menjadi isi bagian, bukan judul bagian. Kasus uji putih minimal: satu kasus per J1 sampai J20 (`pengajuan-potong.test.ts` dan `pengajuan-potong-isian.test.ts`). |

### MS-02 hitungKata

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `hitungKata` / ButirCek / MS-02 / C-16 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | `periksaBatasKata` dan `periksaBagianTerisi` ketika `periksaSatuButir` memproses butir `batas_kata` atau `bagian_terisi` |
| Arguments Received | `teks: string` (Data Type: string; Notes: teks satu bagian, baris dipisah `\n`) |
| Messages Sent & Arguments Passed | `barisTeks(teks: string)` → `string[]` (Notes: pecah pada `\r?\n`, `trim`, buang yang kosong); `barisBukanNaratif(baris: string)` → `boolean` (Notes: keterangan atau penanda gambar/tabel) |
| Arguments Returned | `number` (jumlah kata) |
| Algorithm Specification | SET n = 0<br>FOR EACH baris DALAM barisTeks(teks):<br>&emsp;[J1] IF barisBukanNaratif(baris) THEN LANJUT (tidak dihitung)<br>&emsp;[J2] ELSE n = n + jumlah potongan tak kosong dari baris yang dipisah pada `\s+`<br>[J3] IF teks tidak punya baris (kosong atau hanya spasi) THEN n tetap 0<br>RETURN n<br><br>`barisBukanNaratif`: CASE<br>&emsp;[J4] baris cocok `^\s*(gambar\|tabel\|diagram\|grafik\|bagan\|skema\|foto)\s*\d+(.\d+\|-\d+)*\s*[.:)\-–]` (tanpa membedakan huruf) → true<br>&emsp;[J5] baris cocok `^\s*\[(tabel\|gambar\|diagram)\]\s*$` → true<br>&emsp;[J6] selain itu false<br><br>Pembungkus `periksaBatasKata(dokumen, bagian, batas)`:<br>&emsp;SET ada = (bagian ditemukan di teksPerBagian, setelah normalisasi judul); n = hitungKata(teksBagian)<br>&emsp;[J7] IF n ≤ batas THEN Lolos (tambah catatan "bagian tidak ditemukan" bila ada = false)<br>&emsp;[J8] ELSE Gagal; lebih = n − batas<br>`periksaBagianTerisi`: [J9] IF n > 0 THEN Lolos ELSE [J10] Gagal "0 kata" |
| Misc. Notes | Hanya baris pertama keterangan yang dikecualikan; keterangan yang membungkus ke baris berikutnya (tanpa awalan) tetap dihitung. Kalimat petunjuk templat dibuang oleh `potongPerBagian` (MS-01 J17, J20) sebelum teks sampai ke `hitungKata`, jadi tidak dihitung pada naskah yang melewati pemotong. Bilangan pada `angkaPembukti` memakai titik ribuan (`fmt`). Batas tepat: n = batas → J7; n = batas + 1 → J8. |

### MS-03 cocokkanSitasi

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `cocokkanSitasi` / ButirCek / MS-03 / C-18 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | `periksaSatuButir` memproses butir bertipe `sitasi_bernomor`, `pustaka_berurutan`, atau `jumlah_referensi_sama` |
| Arguments Received | `dokumen: DokumenPeriksa`; `konteks: KonteksPeriksa` (Notes: urutan bagian templat); `tipe: "sitasi_bernomor"\|"pustaka_berurutan"\|"jumlah_referensi_sama"` |
| Messages Sent & Arguments Passed | `analisisSitasi(dokumen, konteks)` → `{sitasi: number[]; berbeda: number[]; namaTahun: number; pustaka: EntriPustaka[]; adaPustaka: boolean}`; di dalamnya `nomorSitasi(teks: string)` → `number[]` dan `entriPustaka(teks: string)` → `{nomor; teks}[]` |
| Arguments Returned | `HasilPeriksa` |
| Algorithm Specification | SET a = analisisSitasi(dokumen, konteks) (sitasi dari semua bagian selain pustaka dan Kata Kunci, berurutan menurut templat; pustaka = bagian "Daftar Pustaka/Referensi/Daftar Referensi")<br>CASE tipe:<br>**sitasi_bernomor**<br>&emsp;[J1] IF jumlah sitasi bernomor > 0 DAN namaTahun = 0 THEN Lolos<br>&emsp;[J2] ELSE IF jumlah sitasi bernomor = 0 THEN Gagal "tidak ada sitasi bernomor [n]"<br>&emsp;[J3] ELSE Gagal "ada sitasi gaya nama-tahun"<br>**pustaka_berurutan**<br>&emsp;[J4] IF jumlah entri pustaka = 0 THEN Gagal (pesan "bagian Daftar Pustaka tidak ditemukan" bila adaPustaka = false, selain itu "tidak ada entri bernomor")<br>&emsp;SET salahNomor = indeks pertama entri e[i] dengan e[i].nomor ≠ i + 1<br>&emsp;SET maks = 0; lompat = tak ada<br>&emsp;FOR EACH n DALAM sitasi berurutan kemunculan:<br>&emsp;&emsp;IF n > maks THEN [J5] IF n ≠ maks + 1 THEN lompat = (n, maks + 1); BERHENTI; [J6] ELSE maks = n<br>&emsp;[J7] IF salahNomor tidak ada DAN lompat tidak ada THEN Lolos<br>&emsp;[J8] ELSE Gagal (alasan gabungan: entri ke-k bernomor x; nomor y dikutip sebelum nomor z)<br>**jumlah_referensi_sama**<br>&emsp;SET tidakDikutip = nomor entri yang tak ada di berbeda; tanpaEntri = nomor berbeda yang tak punya entri<br>&emsp;[J9] IF jumlah entri = jumlah nomor berbeda DAN tidakDikutip kosong DAN tanpaEntri kosong DAN jumlah entri > 0 THEN Lolos<br>&emsp;[J10] ELSE Gagal (menyebut nomor tidak dikutip dan nomor tanpa entri)<br><br>`nomorSitasi(teks)`: FOR EACH kecocokan pola `[ ... ]`: pecah pada `,` atau `;`; [J11] IF potongan berbentuk a-b DAN b ≥ a DAN b − a < 200 THEN tambah a..b; [J12] ELSE IF angka sah THEN tambah angka<br>`entriPustaka(teks)`: FOR EACH baris: [J13] IF cocok `^\[?\s*(\d+)\s*[\].)]\s*(.*)$` THEN entri baru; [J14] ELSE IF sudah ada entri THEN gabung ke entri terakhir; [J15] ELSE abaikan |
| Misc. Notes | Sitasi nama-tahun dikenali pola `(Nama, 2020)` dan variannya (`dkk.`, `et al.`, `dan`, `&`). Baris lanjutan entri berawalan angka dan titik terbaca sebagai entri baru (J13). Rentang selebar 200 atau lebih tidak diperluas dan dilewati (J11 tidak terpenuhi, J12 tidak terpenuhi karena potongan bukan angka tunggal). Kasus batas: sitasi pertama `[1]` lalu `[3]` memicu J5; entri `1,3` memicu `salahNomor`. |

### MS-04 susunPenugasan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `susunPenugasan` (+ inti murni `susunUsulanMurni`) / PeriodeSeleksi / MS-04 / C-13 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | Tombol "Susun Usulan Penugasan" di J-04b (UC-03 langkah 2 sampai 3) |
| Arguments Received | `periodeId: string`; `batasBeban: number`. Inti murni: `proposal: {id; institusiPengusul}[]`, `reviewer: {id; nama; institusi}[]`, `bebanAwal: Record<string, number>`, `batas: number` |
| Messages Sent & Arguments Passed | `masaPengusulanBerjalan()` (boolean); `PeriodeSeleksi.tetapkanBatasBeban(periodeId, batas)` (C-12); `bima.ambilDaftarReviewer()` (`ReviewerBima[]`; Notes: klien mengulang otomatis); `pastikanAkunMassal(idBima[])` (akun SEMAR); `susunUsulanMurni(...)`; `catatLogAudit(entri)`; `ambilUsulan(periodeId, "Diusulkan", {halaman: 1})`; `ambilSebaranBeban(periodeId, batas)` |
| Arguments Returned | `HasilSusunPenugasan` |
| Algorithm Specification | [J1] IF masaPengusulanBerjalan() THEN lempar MasaBelumDitutupError<br>tetapkanBatasBeban(periodeId, batasBeban) (lempar galat bila bukan bilangan bulat ≥ 1)<br>SET daftar = reviewer BIMA dengan bersedia = true DAN dalam kumpulan periode (periode skala nyata: hanya idBima berawalan "rvw-skala-"; periode lain: tidak pernah)<br>SET perluDitugaskan = proposal Terkirim pada periode yang id-nya tidak punya penugasan berstatus bukan Diusulkan<br>SET bebanAwal = jumlah penugasan berstatus bukan Diusulkan per reviewer<br>SET hasil = susunUsulanMurni(perluDitugaskan, reviewerSemar, bebanAwal, batasBeban)<br>[J2] IF hasil.belumDitugaskan tidak kosong THEN hapus semua usulan Diusulkan periode itu; catat log kekurangan; RETURN {usulan: [], jumlahUsulan: 0, sebaran, jumlahBelumDitugaskan = jumlah belum}<br>[J3] ELSE dalam satu transaksi: hapus usulan Diusulkan lama; sisipkan usulan baru status Diusulkan, label "Baru", versi terbaru tiap proposal, per kelompok 5.000; catat log; RETURN {usulan = halaman 1, jumlahUsulan = jumlah pasangan, sebaran, jumlahBelumDitugaskan = 0}<br><br>**susunUsulanMurni**:<br>SET beban[r] = bebanAwal[r] ATAU 0; layak(p) = reviewer berinstitusi ≠ institusi pengusul p (dinormalisasi), terurut nama (di-cache per institusi) [J4]<br>SET urut = proposal diurut jumlah layak naik, lalu id [J5]<br>FOR EACH p DALAM urut:<br>&emsp;SET r = reviewer layak dengan beban < batas dan beban terkecil (seri: nama lebih awal)<br>&emsp;[J6] IF r ada THEN tetapkan p ke r; beban[r] = beban[r] + 1<br>&emsp;[J7] ELSE tambahkan p ke daftar belum<br>SET kapasitasSisa = jumlah dari max(0, batas − beban[r]) untuk semua reviewer; gagalBeruntun = 0<br>FOR EACH p DALAM belum:<br>&emsp;[J8] IF kapasitasSisa ≤ 0 ATAU gagalBeruntun ≥ 25 THEN p masuk masihBelum; gagalBeruntun = gagalBeruntun + 1<br>&emsp;[J9] ELSE IF usahakan(p, himpunan kosong) berhasil THEN gagalBeruntun = 0<br>&emsp;[J10] ELSE p masuk masihBelum; gagalBeruntun = gagalBeruntun + 1<br>RETURN {penugasan, belumDitugaskan = masihBelum, beban}<br><br>**usahakan(p, dikunjungi)** (jalur penambah): FOR EACH reviewer layak r yang belum dikunjungi: tandai r dikunjungi; [J11] IF beban[r] < batas THEN tetapkan p ke r; RETURN true; [J12] ELSE FOR EACH proposal q yang dipegang r: IF usahakan(q, dikunjungi) THEN lepaskan q dari r; beban[r] = beban[r] − 1; tetapkan p ke r; RETURN true. RETURN false [J13] |
| Misc. Notes | Jalur J8 memakai heuristik: setelah 25 kegagalan beruntun sisa proposal dinyatakan kekurangan tanpa dicoba, sehingga pada kasus yang sebenarnya dapat dipenuhi lewat penataan ulang, kode dapat melaporkan kekurangan (hasil tak mutlak). Jalur J2 menghapus usulan lama walau pengguna belum menetapkannya. Uji batas: kapasitas total tepat = jumlah proposal (J3) dan kurang satu (J2); satu reviewer dengan institusi sama dengan semua pengusul (J4 menghasilkan layak kosong, J7). Bagian I/O (basis data, BIMA) memakai stub pada uji unit. |

### MS-05 pilihReviewer

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `pilihReviewer` (pemindahan) dan `periksaSyarat` / PenugasanReviewer / MS-05 / C-14 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | Tombol "Simpan Pemindahan" di M-06 (UC-03 S-2.2) |
| Arguments Received | `penugasanId: string`; `reviewerBaruId: string`; `aktor: string` (bawaan "sistem"). `periksaSyarat`: `{institusiPengusul; reviewer: {institusi; bersedia}; bebanSaatIni: number; batas: number}` |
| Messages Sent & Arguments Passed | `periodeSkala(periodeId)` (boolean); `dalamKumpulan(idBima, skala)` (boolean); `bebanPerReviewer(periodeId, kecualiPenugasanId)` (`Record<string,number>`); `periksaSyarat(m)` (`string[]`); `catatLogAudit(entri)` |
| Arguments Returned | `HasilPilihReviewer` `{reviewerId, diterima, syaratDilanggar}` |
| Algorithm Specification | SET pn = penugasan `penugasanId`<br>[J1] IF pn tidak ada THEN lempar Error("Penugasan tidak ditemukan.")<br>[J2] IF pn.status ≠ Diusulkan THEN RETURN {reviewer semula, diterima = false, ["Penugasan sudah ditetapkan dan tidak dapat dipindahkan."]}<br>SET baru = akun `reviewerBaruId`<br>[J3] IF baru tidak ada ATAU peran ≠ reviewer THEN RETURN {semula, false, ["Reviewer pengganti tidak ditemukan."]}<br>[J4] IF baru tidak dalam kumpulan periode THEN RETURN {semula, false, ["Reviewer pengganti tidak ditemukan."]}<br>[J5] IF baru.id = reviewer semula THEN RETURN {semula, true, []}<br>SET beban = bebanPerReviewer(periode, kecuali penugasan ini)<br>SET dilanggar = periksaSyarat({pengusul.institusi, baru, beban[baru] ATAU 0, periode.batasBebanReviewer})<br>[J6] IF dilanggar tidak kosong THEN catat log pindah_penugasan_ditolak; RETURN {semula, false, dilanggar}<br>[J7] ELSE ubah pn.reviewerId = baru.id; catat log pindah_penugasan; RETURN {baru.id, true, []}<br><br>**periksaSyarat**: SET d = []<br>&emsp;[J8] IF reviewer.bersedia = false THEN tambah "Reviewer pengganti tidak bersedia menilai pada periode ini."<br>&emsp;[J9] IF institusi reviewer sama dengan institusi pengusul (tanpa huruf besar-kecil dan spasi tepi) THEN tambah pesan institusi sama<br>&emsp;[J10] IF bebanSaatIni + 1 > batas THEN tambah pesan beban melampaui batas<br>&emsp;RETURN d |
| Misc. Notes | Ketiga pesan `periksaSyarat` dapat muncul bersamaan dalam urutan J8, J9, J10. Pilihan "reviewer pengganti" pada UI hanya memuat reviewer bersedia, tetapi J8 tetap perlu diuji lewat panggilan langsung. Uji batas: `bebanSaatIni = batas − 1` (J10 tidak terpenuhi) dan `= batas` (terpenuhi). |

### MS-06 periksaSemantik: batas waktu, percobaan ulang, status

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `periksaSemantik` (rincian `mintaJawaban`, `periksaSatu`, `bentukHasil`, `klaimJob`, `jalankan`) / BasisAturan dan ButirCek / MS-06 / C-25 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | Pekerja latar belakang sesudah `catatTerkirim` (UC-05 langkah 10), atau J-08 yang memanggil `pastikanSemantikBerjalan` bila hasil belum siap; "Uji pada Contoh" (UC-02) |
| Arguments Received | `dokumen: {teksPerBagian; teksLampiran}`; `butir: ButirCek[]`; `opsi: OpsiNilai`; untuk sisi basis data `versiId: string` |
| Messages Sent & Arguments Passed | `penyedia(permintaan: PermintaanLlm)` → `JawabanLlm` (Notes: `kirimPermintaanNyata` dengan `timeout = 15.000 ms`, atau `kirimPermintaanTiruan`); `cocokkanKutipan(teksVerifikasi: string, kutipan: string)` (C-24); `siapkanTeksTanpaIdentitas(teks, identitas)` (C-23); `catatLogAudit(entri)` |
| Arguments Returned | `{hasil: HasilButirSemantik; percobaan: number}[]`; `RingkasanPemeriksaanSemantik` |
| Algorithm Specification | **A. mintaJawaban(penyedia, permintaan)**: FOR ke = 1 SAMPAI PERCOBAAN_ULANG_LLM (= 2):<br>&emsp;[J1] TRY jawaban = penyedia(permintaan); RETURN {jawaban, percobaan = ke, galat = null}<br>&emsp;[J2] CATCH galat → simpan pesan; IF ke < 2 THEN tunggu jedaMs (bawaan 400 ms)<br>[J3] RETURN {jawaban = null, percobaan = 2, galat}<br><br>**B. periksaSatu(butir)**: SET sasaran = bagian atau lampiran menurut parameter<br>&emsp;[J4] IF teks utama sasaran kosong (setelah trim) THEN RETURN hasil `Tidak memenuhi`, keyakinan 0,9, tanpa memanggil LLM, percobaan = 0<br>&emsp;[J5] IF mode tiruan DAN butir pertama DAN skenario "tidak-merespons" THEN penyedia = selalu galat<br>&emsp;[J6] IF mode tiruan DAN butir pertama DAN skenario "kutipan-salah" THEN penyedia mengganti kutipan dengan kalimat yang tidak ada di naskah<br>&emsp;panggil mintaJawaban (dengan gambar bagian sasaran bila ada) lalu bentukHasil dengan teks verifikasi = utama + "\n" + pendukung + penanda `[gambar 1..k]` gambar yang dilampirkan<br><br>**C. bentukHasil(butir, jawaban, teksVerifikasi)**:<br>&emsp;[J7] IF jawaban = null THEN status "Belum ada rekomendasi"; rekomendasi, kutipan, keyakinan = null; alasan menyebut dua percobaan<br>&emsp;SET kutipan = jawaban.kutipan (trim)<br>&emsp;[J8] ELSE IF kutipan tidak kosong DAN cocokkanKutipan(teksVerifikasi, kutipan) THEN status = rekomendasi; kutipan terisi; kutipanLain = saringKutipanLain(jawaban.kutipanLain) (sah, unik, maks. 2)<br>&emsp;[J9] ELSE IF kutipan kosong DAN rekomendasi = "Tidak memenuhi" THEN status "Tidak memenuhi"; kutipan null<br>&emsp;[J10] ELSE status "Perlu diperiksa manual"; kutipan null; alasan diawali catatan (kutipan tidak ditemukan, atau tidak menyertakan kutipan)<br><br>**D. nilaiSemantikDenganOpsi**: SET semantik = butir berjenis semantik; tiruan = opsi.tiruan ATAU mode LLM = tiruan; pekerja paralel = max(1, opsi.paralel ATAU 4) mengambil butir berikutnya sampai habis [J11]; keluaran sesuai urutan masukan; IF tidak ada butir semantik THEN RETURN [] [J12]<br><br>**E. klaimJob(versiId)**: SET job = job terbaru versi itu<br>&emsp;[J13] IF job tidak ada ATAU status Selesai ATAU Gagal THEN sisipkan job baru status Berjalan, percobaan 1; RETURN id<br>&emsp;SET macet = (status Berjalan DAN mulai > 3 menit lalu)<br>&emsp;[J14] IF status Berjalan DAN bukan macet THEN RETURN null (proses lain mengerjakan)<br>&emsp;[J15] ELSE perbarui job secara atomik (hanya bila status masih sama) menjadi Berjalan, percobaan + 1, galat dihapus; RETURN id bila 1 baris berubah, selain itu null<br><br>**F. jalankan(versiId)**: SET jobId = klaimJob<br>&emsp;[J16] IF jobId = null THEN RETURN ringkasan hasil yang sudah ada (tanpa memproses)<br>&emsp;TRY baca versi, proposal, pengusul; pilih butir semantik berstatus Aktif atau Perlu ditinjau pada basis aturan versi itu (atau basis nyata terbaru bila versi tidak merujuk basis)<br>&emsp;&emsp;[J17] IF basis tidak ada THEN daftar butir kosong<br>&emsp;&emsp;sanitasi teks per bagian dan lampiran; nilaiSemantikDenganOpsi; upsert hasil per (versi, butir); job = Selesai; log semantik.selesai; RETURN ringkasan<br>&emsp;[J18] CATCH galat → job = Gagal dengan pesan galat (maks 500 karakter); lempar ulang galat |
| Misc. Notes | `PERCOBAAN_ULANG_LLM = 2` berarti dua percobaan total (UC-09 S-2), berbeda dari NFR 4.4 dan dari klien BIMA yang memakai tiga panggilan. `mintaJawaban` tidak memasang pewaktu sendiri; batas 15 detik ada di klien Anthropic. Job yang Berjalan lebih dari 3 menit dianggap macet dan diambil ulang (J15). `antrekan` dan `pastikanSemantikBerjalan` (status `Menunggu`, `Berjalan`, `Selesai`, `Gagal`, `Belum ada`) memakai job yang sama; keduanya bukan cakupan MS ini kecuali sebagai pemicu. Uji batas percobaan: gagal sekali lalu berhasil (percobaan = 2, J1 pada ke = 2), gagal dua kali (J3). |

### MS-07 cocokkanKutipan

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `cocokkanKutipan` (memakai `cariKutipan`) / ButirCek / MS-07 / C-24 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | `bentukHasil` sesudah Layanan LLM menjawab (UC-09 langkah 7); `pilihTab` pada J-08 |
| Arguments Received | `teks: string` (teks sasaran); `kutipan: string \| null \| undefined` |
| Messages Sent & Arguments Passed | `escapeRegex(s: string)` → `string`; `RegExp.exec(teks)` |
| Arguments Returned | `cariKutipan`: `{mulai: number; akhir: number} \| null`; `cocokkanKutipan`: `boolean` |
| Algorithm Specification | SET token = kutipan (atau "") di-trim, dipecah pada `\s+`, buang token kosong<br>[J1] IF token kosong ATAU teks kosong THEN RETURN null (cocokkanKutipan: false)<br>SET pola = token yang masing-masing di-escape dan digabung dengan `\s+`<br>SET m = pola dicari di teks (peka huruf besar-kecil, tanpa penanda batas kata)<br>[J2] IF m ditemukan THEN RETURN {mulai = m.index, akhir = m.index + panjang m} (cocokkanKutipan: true)<br>[J3] ELSE RETURN null (cocokkanKutipan: false) |
| Misc. Notes | Tiga jalur saja: kosong, cocok, tidak cocok. Kasus pemisah antar-token: spasi ganda, tab, dan `\n` pada teks cocok dengan spasi tunggal pada kutipan. Kutipan yang diawali atau diakhiri spasi di-trim. Substring di dalam kata tetap cocok. |

### MS-08 siapkanTeksTanpaIdentitas

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `siapkanTeksTanpaIdentitas` (memakai `varianNama`) / VersiProposal / MS-08 / C-23 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | `jalankan` (UC-09 langkah 3), dipanggil per bagian dan per lampiran |
| Arguments Received | `teks: string`; `identitas: {nama?; institusi?; nomorInduk?; lain?}` |
| Messages Sent & Arguments Passed | `varianNama(nama: string)` → `string[]`; `escapeRegex(s: string)` → `string`; `buangIdentitasBima(teks)` → `string`; `kumpulkanIdentitasBima(teks)` → `string[]` |
| Arguments Returned | `string` |
| Algorithm Specification | SET target = himpunan kosong<br>[J1] IF identitas.nama ada THEN tambahkan semua varianNama(nama) ke target<br>FOR EACH x DALAM [institusi, nomorInduk, ...lain, ...kumpulkanIdentitasBima(teks)]:<br>&emsp;[J2] IF x ada DAN panjang trim(x) ≥ 3 THEN tambahkan trim(x) ke target<br>&emsp;[J3] ELSE lewati<br>SET urut = target diurut menurut panjang menurun<br>SET hasil = buangIdentitasBima(teks)<br>FOR EACH t DALAM urut: hasil = ganti semua kemunculan t (tanpa huruf besar-kecil, spasi pada t cocok dengan `\s+`) dengan "[identitas dihapus]" [J4]<br>[J5] IF target kosong DAN teks tanpa blok identitas ekspor BIMA THEN hasil = teks (tanpa perubahan)<br>RETURN hasil<br><br>**varianNama(nama)**: SET lengkap = trim(nama); IF panjang ≥ 3 THEN tambah lengkap [J6]; SET tanpaBelakang = bagian sebelum koma pertama; SET tanpaDepan = tanpaBelakang tanpa gelar depan (`prof, dr, drs, dra, ir, h, hj`, titik opsional, boleh berulang); FOR EACH v DALAM [tanpaBelakang, tanpaDepan]: IF panjang ≥ 3 THEN tambah v [J7]; RETURN himpunan<br><br>**buangIdentitasBima(teks)**: SET baris = teks dipecah per baris; cari baris berpola `2. IDENTITAS PENGUSUL`<br>&emsp;[J8] IF ditemukan THEN ganti baris itu sampai sebelum baris penutup (judul bernomor 3 sampai 9 berhuruf kapital, atau "A. JUDUL"; bila tak ada, sampai akhir) dengan satu baris penanda<br>&emsp;[J9] buang setiap baris berpola `NO. DOKUMEN:`<br>**kumpulkanIdentitasBima(teks)**: FOR EACH baris di dalam blok identitas: IF baris berisi hanya angka ≥ 8 digit THEN tambah angka itu [J10]; IF baris di atasnya bukan baris peran (Ketua Pengusul, Anggota, Mahasiswa, Dosen, Umum, ...), tanpa angka, dan ≥ 4 karakter THEN tambah baris itu sebagai nama [J11] |
| Misc. Notes | Tanpa pembatas kata: target pendek yang muncul di dalam kata lain ikut diganti. Sumber identitas yang dipakai pemanggil: nama, institusi, nomor induk akun pengusul (bukan metadata BIMA); blok identitas ekspor BIMA dan identitas anggota tim dibaca dari teksnya sendiri (J8, J10, J11). Uji batas: panjang target tepat 3 (diganti) dan 2 (tidak). Urutan terpanjang dahulu mencegah sisa nama pada "Dr. Sekar Anindita, M.T." (J4). Kasus uji putih minimal: J1 sampai J11 (`semantik-mesin.test.ts`, `semantik-alur.test.ts`, `semantik-identitas-bima.test.ts`). |

### MS-09 rekapKesesuaian / hitungTingkatKoreksi

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `rekapKesesuaian` / BasisAturan (menghimpun `hitungTingkatKoreksi` ButirCek) / MS-09 / C-29 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-26 / TypeScript |
| Triggers/Events | `susunLaporan` (J-05) setelah agregat dibaca dari basis data |
| Arguments Received | `m: MasukanRekap` (lihat C-29) |
| Messages Sent & Arguments Passed | Fungsi bantu murni di modul yang sama: `trenMingguan(sel)`, `kelompokKeyakinan(sel)`, `tafsirKalibrasi(kalibrasi, ambang)`, `ringkasGagalInstitusi(kode, gagal, pengajuan, info, ambang)`, `bandingkanVersi(kode, selLama, baru, versiBaru)`, `pilahPerluPerhatian(semantik, deterministik, ambang)` |
| Arguments Returned | `HasilRekap` |
| Algorithm Specification | SET ambang = m.ambang ATAU AMBANG_PEMANTAUAN; info = peta kode → butir<br>**Semantik**: kelompokkan m.sel per kode; FOR EACH kode, sel: deskripsi = info[kode].deskripsi ATAU deskripsi sel berversi tertinggi [J1]; berlaku = sel berdeskripsi sama [J2]; baris = jumlah, dikoreksi, persen = (jumlah - dikoreksi) x 100 / jumlah, cukup = jumlah >= minHasil [J3], perhatian = cukup DAN persen < disetujui [J4], longgar/ketat, jenis (kosong → "Tanpa jenis") urut terbanyak [J5], terlaluYakin; trenButir = trenMingguan(semua sel kode); kalibrasiButir = kelompokKeyakinan(berlaku); IF ada sel berdeskripsi lama DAN baris punya hasil THEN bandingVersi += bandingkanVersi [J11]<br>urutkan semantik: perhatian, cukup, persen naik, kode<br>**Deterministik** [J6]: FOR EACH kode deterministik basis ∪ kode di m.gagal: persen = proposalGagal x 100 / total pengajuan; perInstitusi urut persen menurun; tertinggi = institusi pertama dengan pengajuan >= minPengajuanInstitusi dan gagal > 0; sebab = keseluruhan IF persen >= gagal, ELSE terpusat IF tertinggi.persen >= gagalInstitusi, ELSE null<br>**Perlu perhatian** [J7]: butir menyala urut parah (semantik: disetujui - persen; deterministik: maks(persen - gagal, tertinggi - gagalInstitusi)) menurun, lalu butir Perlu ditinjau urut kode<br>**trenMingguan** [J8]: jumlahkan per minggu, urut minggu, persen per minggu. **kelompokKeyakinan** [J9]: tinggi, sedang, rendah; tingkat tanpa hasil dan null tidak ikut<br>**tafsirKalibrasi** [J10]: IF tinggi < minHasil ATAU tidak ada pembanding (tingkat lain terendah yang cukup) THEN null; ELSE IF tinggi dikoreksi >= terlaluYakin THEN false; ELSE IF pembanding / tinggi >= 1,5 THEN true; ELSE false<br>rincian dikelompokkan per kode, dikoreksi lebih dulu; rincianGagal per kode<br>RETURN {ringkas, perluPerhatian, semantik, deterministik, tren, trenButir, kalibrasi, kalibrasiButir, tafsirKalibrasi, bandingVersi, rincian, rincianGagal} |
| Misc. Notes | Persentase tidak dibulatkan (pembulatan `formatPersen` di tampilan). Batas uji: jumlah = minHasil - 1 / minHasil (J3); persen = 80 / 79 (J4); tinggi dikoreksi = 20% (J10). Uji: `tests/unit/kotak-putih/pemantauan-rekap.test.ts` (KP), `tests/unit/kotak-hitam/pemantauan-rekap.test.ts` (KH); angka cerita data tiruan: `tests/unit/kotak-putih/demo-pemantauan.test.ts`. |

### MS-10 buatDokumenTemplat

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `buatDokumenTemplat` (memakai `bagianDokumen`, `panduanBagian`) / TemplatProposal / MS-10 / C-31 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | Tombol "Unduh Templat (.docx)" (J-02), "Unduh Pratinjau (.docx)" (J-02b), "Unduh Templat" (BIMA pengajuan), semuanya lewat rute `/api/semar/templat/...` |
| Arguments Received | `templat: {versi: number; status}`; `bagian: BagianTemplatDto[]`; `lampiran: string[]`; `skema: {kode; namaSkema}`; `periode: {nama; tahun?} \| null` |
| Messages Sent & Arguments Passed | `normalisasiJudul(teks: string)` → `string` (pembanding nama bagian); `petunjukResmi(nama, batasKata)` → `string \| null`, `judulBerhuruf(indeks, nama)` → `string`, `PENGANTAR_ISIAN_SUBSTANSI`, `TEMPAT_ISIAN` (`templat/isian-substansi.ts`); `Packer.toBuffer(Document)` → `Promise<Buffer>` (paket `docx`); tidak ada pesan ke kelas domain lain |
| Arguments Returned | `Promise<Buffer>` |
| Algorithm Specification | SET mode = paket.mode ATAU "paket"; kop = paket.kop ATAU bawaan; kepala = paket.kepala ATAU {judul bawaan, "SKEMA <NAMA SKEMA HURUF BESAR>", pengantar resmi}<br>SET teksKaki = "Skema: <nama> (<kode>) \| Periode berlaku: <nama periode>[ (<tahun>)] \| Versi templat: <n> (<status>)"; [J2] IF periode ≠ null THEN tulis nama dan, bila tahun ada, " (<tahun>)" [J2b]; [J3] ELSE tulis "belum ditetapkan"<br>**bagianDokumen(bagian)**: SET urut = bagian diurut `urutan`; SET ada = himpunan nama ternormalisasi; FOR EACH nama DALAM ["Kata Kunci", "Daftar Pustaka"]: [J6] IF nama tidak ada di `ada` THEN tambah bagian {urutan = tertinggi + 1, nama, batasKata = null, wajib = true}; [J7] ELSE lewati<br>[J1] IF mode = paket THEN bagian dokumen 1 = halamanDepan(kop): tabel kop (logo \| tiga baris teks; baris kosong dilewati [J1b]), garis, proteksi, "PROPOSAL PENELITIAN" putih di atas hitam, rencana pelaksanaan, nomor dokumen; FOR EACH bagian depan yang disakelar aktif [J1c]: judul bernomor urut lalu CASE kunci: judul → kotak judul + tiga tabel klasifikasi; luaran → "Luaran Wajib" dan "Luaran Tambahan" masing-masing tabel; anggaran → kalimat acuan, "Total RAB", "Tahun 1 Total", tabel; identitas → tabel; lainnya → kalimat penjelas (bila ada) dan tabel<br>Bagian dokumen Isian = kepalaIsian(kepala) (tabel logo \| judul, subjudul bila ada [J4], pengantar bila ada [J5]; garis tebal)<br>FOR EACH b ke-i DALAM lengkapiBagian(bagianDokumen(bagian)) berurutan: [J8] tabel satu kolom dua baris: baris kepala berlatar biru muda berisi judulBerhuruf(i, b.nama) tebal dan, bila panduanBagian(b) ada, kalimat petunjuk miring [J9]; baris isian berbingkai berisi tempatIsian(b): CASE [J10] jenisIsian = daftar → "[kata kunci 1<pemisah> ... n]" (jumlah bawaan 5, pemisah bawaan ";"); [J11] jenisIsian = tabel → tabel isian menurut kolom wajib: [J11a] tanpa kolom rentang: kolom dibagi rata dan empat baris kosong; [J11b] kolom "Nama a-b" (a sampai b, en dash atau tanda hubung, maksimal 120 kotak): kepala dua tingkat (gridSpan pada kepala rentang, vMerge pada kolom lain) dan satu kotak per angka; [J11c] kotak lebih dari 12: satu tabel per 12 kotak berjudul "Tahun ke-n" (mengikuti pola judulTabel; judul lain diberi akhiran), sisa menjadi tabel terakhir (18 = 12 + 6); tabel dipisah paragraf tipis dan paragraf penutup sel; [J12] daftarPustaka → "[1] "; [J13] selain itu → "[ ]"; [J14] IF wajibGambar THEN tambah baris "[Sisipkan diagram alir penelitian (JPG/PNG)]" miring; tabel dipisah paragraf tipis<br>[J15] IF mode = paket THEN FOR EACH templat lampiran (lampiranDariBaris) dengan sertakan ≠ false: [J16] IF jenis = unggahan THEN Heading 1 "LAMPIRAN n. NAMA" (pemisah halaman) dan satu kalimat; [J17] ELSE Heading 1 kop dengan tab kanan, Heading 1 judul, dan FOR EACH kalimat: IF berbentuk "A \| B" THEN tabel label \| ":" \| "...." tanpa bingkai [J18] ELSE paragraf rata kiri-kanan; lalu blok tanggal, ruang tanda tangan, "Nama : ...." menjorok kanan; [J19] IF tidak ada lampiran yang disertakan THEN tidak ada bagian dokumen lampiran<br>Setiap bagian dokumen diberi kaki teksKaki; dokumen diberi properti description = teksKaki<br>RETURN Packer.toBuffer(dokumen) |
| Misc. Notes | Uji round-trip (`KH-buatDokumenTemplat-02`, `-02b`, `-04`, `-05`, `-06`, `-12`): `ekstrakDocx` lalu `potongPerBagian` (MS-01) dengan `bagianDokumen(bagian)`; judul bagian berada di dalam sel tabel dan dibuka oleh `blokDariHtml` (`KP-blokDariHtml-T1` sampai `-T4`); bandingkan kunci `teksPerBagian` dan `judulBagianDitemukan` (judul berhuruf). Struktur visual (latar BDD6EE sebanyak bagian, bingkai baris isian, font Avenir Next LT Pro/Calibri/Roboto/Times New Roman, logo, "PROPOSAL PENELITIAN" putih di atas hitam, kaki halaman, tiga bagian dokumen, pemisah halaman lampiran, tabel label tiga kolom tanpa bingkai) diperiksa `KH-buatDokumenTemplat-07` sampai `-11` pada XML berkas. Halaman depan dan lampiran terbaca sebagai blok sebelum bagian A atau di luar templat (MS-01 J2, J3), bukan isian. Dengan bagian berhuruf, `judulDokumen` hasil baca balik adalah isi bagian Judul (kosong pada templat kosong). Cabang lama yang menulis tiga baris identitas di badan dan "Panduan: ..." buatan dihapus (identitas pindah ke kaki halaman). `namaBerkasTemplat`: kode skema dibersihkan (`[^\w-]+` menjadi "-", tanda hubung tepi dibuang, kosong menjadi "skema"). Bukti visual: `npm run pratinjau-docx` menulis `docs/bukti-e2e/uc01-docx-{dasar,terapan,depan,lampiran}-templat.png`. |

### MS-11 terbitkan (9a, arsipkan, turunkanButirCek)

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `terbitkan` (+ `gantiTemplatBerlaku`, `arsipkan`, `nonaktifkanTurunanLama`, `turunkanButirCek`) / TemplatProposal / MS-11 / C-02 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | Tombol "Terbitkan" lalu "Terbitkan" pada M-01 (UC-01 langkah 7) |
| Arguments Received | `m: MasukanTerbitkan` (`skemaId`, `templatId`, `isian`, `pelaku`, `masaBerjalan?`) |
| Messages Sent & Arguments Passed | `periksaKelengkapan(isian: MasukanKelengkapan)` → `HasilKelengkapan` (C-01); `simpanIsian(db, templatId, isian)`; `cekPengusulanBerjalan()` → `boolean` (C-05); `waktuDemo()` → `Date`; `pastikanDrafBasis(tx, skemaId, pelakuId)` → baris basis aturan draf; `gantiTemplatBerlaku(tx, {baruId, lamaIds, drafBasisId, waktu})`; `turunkanButirCek(bagian, lampiran)` → `ButirSeed[]` (C-03); `catatLogAudit(entri)` |
| Arguments Returned | `HasilTerbitkan` |
| Algorithm Specification | SET t = templat `templatId`<br>[J1] IF t tidak ada ATAU t.skemaId ≠ skemaId ATAU t.status ≠ Draf THEN RETURN {hasil: "tidak-ditemukan"}<br>SET kelengkapan = periksaKelengkapan(isian)<br>[J2] IF kelengkapan.lengkap = false THEN RETURN {hasil: "tidak-lengkap", kelengkapan}<br>simpanIsian: hapus bagian lama; sisipkan bagian baru urutan 1..n; perbarui lampiranWajib dan periodeBerlakuId<br>SET berjalan = masaBerjalan (bila diberikan) ATAU cekPengusulanBerjalan()<br>[J3] IF berjalan THEN catat log templat.simpan-draf; RETURN {hasil: "draf-disimpan", versi}<br>SET waktu = waktuDemo()<br>DALAM satu transaksi:<br>&emsp;SET lama = templat berstatus Terbit milik skema<br>&emsp;SET drafBasis = pastikanDrafBasis(...)<br>&emsp;gantiTemplatBerlaku: [J4] IF lama tidak kosong THEN arsipkan(lama) (status Arsip) dan nonaktifkanTurunanLama (butir asal templat milik templat lama pada drafBasis menjadi Nonaktif); [J5] ELSE (tidak ada templat lama) lewati; terbitkan baru: status Terbit, diterbitkanPada = waktu<br>&emsp;SET turunan = turunkanButirCek(bagian, lampiran)<br>&emsp;[J6] IF turunan tidak kosong THEN sisipkan semua ke drafBasis: status Draf, urutan lanjut dari urutan tertinggi, templatId = t.id<br>&emsp;[J7] ELSE tidak ada butir (templat hanya bagian opsional tanpa batas kata dan tanpa lampiran)<br>catat log templat.terbit; RETURN {hasil: "terbit", versi, jumlahButir = jumlah turunan} |
| Misc. Notes | Tujuh jalur untuk uji putih; J4 dan J5 dibedakan oleh ada tidaknya templat Terbit sebelumnya (S-1 Bab 10: skema belum punya templat). Butir turunan lama yang disalin ke draf basis dari basis nyata dinonaktifkan hanya bila `templatId`-nya termasuk templat yang diarsipkan. Uji integrasi basis data memakai basis data uji; cabang J3 dapat diuji dengan `masaBerjalan: true`. |

### MS-12 validasiTanggalBerlaku

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `validasiTanggalBerlaku` (memakai `uraiTanggalIsian`, `hariWib`) / BasisAturan / MS-12 / C-08 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | `simpanVersiBaru` (UC-02 langkah 7) sesudah "Simpan Versi" |
| Arguments Received | `isian: string`; `periode: {tanggalBuka: Date; tanggalTutup: Date}`; `masaBerjalan: boolean`; `tanggalVersiSebelumnya?: Date \| null` |
| Messages Sent & Arguments Passed | `uraiTanggalIsian(s: string)` → `Date \| null`; `hariWib(d: Date)` → `string` (yyyy-mm-dd menurut WIB, UTC+7) |
| Arguments Returned | `{ok: true; tanggal: Date} \| {ok: false; pesan: string}` |
| Algorithm Specification | SET tanggal = uraiTanggalIsian(trim(isian)) (null bila tidak cocok `^\d{4}-\d{2}-\d{2}$` atau Date tidak sah)<br>[J1] IF tanggal = null THEN RETURN {ok: false, "Tanggal Berlaku wajib diisi dengan tanggal yang valid."}<br>SET hari = hariWib(tanggal)<br>[J2] IF masaBerjalan DAN hari ≥ hariWib(tanggalBuka) DAN hari ≤ hariWib(tanggalTutup) THEN RETURN {ok: false, PESAN_TANGGAL_DI_TENGAH_MASA}<br>[J3] IF tanggalVersiSebelumnya ada DAN hari ≤ hariWib(tanggalVersiSebelumnya) THEN RETURN {ok: false, "Tanggal Berlaku harus lebih akhir daripada tanggal berlaku versi sebelumnya."}<br>[J4] RETURN {ok: true, tanggal} |
| Misc. Notes | Pembandingan memakai string `yyyy-mm-dd` (urutan leksikografis sama dengan urutan kalender). Empat jalur dengan kombinasi kasus batas: hari = hari buka (J2), hari = hari tutup (J2), sehari sebelum buka dan sehari sesudah tutup (J4), `masaBerjalan = false` dengan tanggal di dalam rentang (J4), hari = hari versi sebelumnya (J3), sehari sesudahnya (J4). Bila J2 dan J3 sama-sama terpenuhi, J2 menang. |

### MS-13 cekKataKunci

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `cekKataKunci` / ButirCek / MS-13 / C-17 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-22 / TypeScript |
| Triggers/Events | `periksaSatuButir` memproses butir bertipe `kata_kunci` (UC-06 langkah 5) |
| Arguments Received | `dokumen: DokumenPeriksa`; `jumlah: number`; `pemisah: string` |
| Messages Sent & Arguments Passed | `fmt(n: number)` → `string` (format ribuan Indonesia); `String.split(pemisah)` |
| Arguments Returned | `HasilPeriksa` |
| Algorithm Specification | SET teks = trim(kataKunci ATAU ""); [J1] IF teks berkurung siku lengkap THEN buang kurung siku<br>[J2] IF teks kosong THEN RETURN Gagal "kata kunci tidak ditemukan di naskah"<br>SET satuBaris = baris baru disambung spasi; SET pemisahAda = satuBaris memuat pemisah; SET lain = pemisah selain diminta yang ada (bila pemisahAda: hanya koma, titik koma, atau garis miring/tegak berspasi)<br>[J3] IF NOT pemisahAda DAN lain tidak kosong THEN RETURN Gagal "pemisah yang dipakai <lain[0]>, bukan <pemisah>" (butir dibaca dengan pemisah itu)<br>[J4] IF NOT pemisahAda DAN ada baris baru DAN banyak baris >= 2 THEN RETURN Gagal "pemisah yang dipakai baris baru"<br>SET butir = satuBaris dipotong pada pemisah setelah membuang satu pemisah penutup [J5]; item di-trim<br>[J6] IF lain tidak kosong THEN RETURN Gagal "pemisah bercampur"<br>[J7] IF ada item kosong THEN RETURN Gagal "ada butir kosong (butir ke-n)"<br>[J8] IF jumlah butir = jumlah THEN RETURN Lolos<br>[J9] RETURN Gagal "diminta tepat <jumlah>" |
| Misc. Notes | Sembilan jalur (uji KP-cekKataKunci-J1..J9). Kasus uji nyata: no. 1 (kurung siku dan baris terpotong, Lolos), no. 5 (koma, Gagal, J3), no. 6 (Lolos), no. 10 (penutup, Lolos, J5). |
| Misc. Notes | Empat jalur. Uji batas: 4, 5 (J2), 6 item; pemisah tertinggal di ujung (tetap 5, J2); pemisah koma saat diminta titik koma (J3 lalu J4); spasi ganda dan item kosong antara dua pemisah (`"a;;b"`) dibuang sehingga dihitung dua item; duplikat dihitung terpisah. |

### MS-14 uraikanAturanHitung / validasiButir

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `uraikanAturanHitung` dan `validasiButir` / ButirCek / MS-14 / C-06 |
| Programmer / Date Due / Language | Kelompok AKPSI (prototipe) / 2026-10-23 / TypeScript |
| Triggers/Events | "Simpan Butir" pada M-02 (UC-02 langkah 4 sampai 5) |
| Arguments Received | `uraikanAturanHitung(teks: string, bagian: string)`; `validasiButir(m: MasukanButir)` |
| Messages Sent & Arguments Passed | `uraikanAturanHitung(aturan, m.bagian)` → `HasilUrai`; tabel `PEMERIKSA_PER_TIPE` dan `KOMPONEN_PER_TIPE` |
| Arguments Returned | `HasilUrai = {ok: true; parameter} \| {ok: false; pesan}`; `HasilValidasiButir = {ok: true; nilai} \| {ok: false; galat}` |
| Algorithm Specification | `uraikanAturanHitung`: SET t = huruf kecil(teks)<br>[J1] IF t memuat "kata kunci" THEN SET jumlah = angka 1 sampai 2 digit pertama ATAU kata satu..sepuluh ATAU 0; [J1a] IF jumlah = 0 THEN RETURN galat "Sebutkan jumlah kata kunci…"; SET pemisah = ";" bila memuat "titik koma", "," bila memuat "koma", selain itu ";"; RETURN kata_kunci<br>[J2] IF t memuat "jumlah referensi\|pustaka\|rujukan" THEN RETURN jumlah_referensi_sama<br>[J3] IF t memuat "pustaka" DAN "urut" THEN RETURN pustaka_berurutan<br>[J4] IF t memuat "sitasi" ATAU "kutipan" THEN RETURN sitasi_bernomor<br>[J5] IF t memuat "diagram alir" THEN RETURN (bagian kosong ? galat "Pilih bagian…" : diagram_alir)<br>[J6] IF t memuat "judul" DAN ("sama" ATAU "identik") THEN RETURN judul_sama<br>[J7] IF t memuat "struktur", "templat sesuai", atau "urutan bagian" THEN RETURN struktur_judul<br>[J8] IF t memuat "terisi" ATAU "tidak kosong" THEN RETURN (bagian kosong ? galat : bagian_terisi)<br>[J9] RETURN galat "Aturan Hitung belum dikenali sistem."<br>`validasiButir`: SET kode, deskripsi = trim<br>[K1] IF kode kosong THEN galat.kode ELSE [K2] IF kode tidak cocok `^[A-Za-z0-9][A-Za-z0-9._-]{0,19}$` THEN galat.kode<br>[K3] IF deskripsi kosong THEN galat.deskripsi; [K4] IF jenis bukan dua nilai baku THEN galat.jenis<br>[K5] IF jenis = deterministik: IF aturanHitung kosong THEN galat; ELSE uraikan; IF gagal THEN galat; ELSE IF tanpa galat lain THEN RETURN nilai (pemeriksa, komponen dari tabel tipe)<br>[K6] ELSE IF jenis = semantik: IF pertanyaan kosong THEN galat; IF bagian kosong THEN galat; IF tanpa galat THEN RETURN nilai (lampiran opsional)<br>[K7] RETURN {ok: false, galat} |
| Misc. Notes | Urutan pengujian J1 sampai J8 menentukan hasil bila beberapa kata kunci muncul bersamaan; uji putih memakai satu kasus per jalur dan kasus bentrok. Kode 20 karakter sah (K2), 21 tidak sah. Diuji `KP-uraikanAturanHitung-01..05` dan `KP-validasiButir-01..07`. |

## 5. Tambahan

Hanya MS-14 yang ditambahkan (C-06 sebelumnya tanpa spesifikasi metode); ID C-32 dan seterusnya tidak diperlukan: seluruh metode uji pada daftar tetap terpetakan ke fungsi implementasi, dan `buatDokumenTemplat` (C-31, MS-10) sudah ada di `templat/dokumen.ts`. Fungsi yang tidak punya kontrak sendiri karena merupakan pembantu: `normalisasiJudul`, `normalisasiJudulProposal`, `nomorSitasi`, `entriPustaka`, `periksaSatuButir` (pengarah per butir; cabang bawaan "butir tanpa parameter terstruktur" dan "tipe tidak dikenali" Gagal, layak diuji putih bersama C-16 sampai C-20), `bersihkanKomponen`, `komponenLengkap`, dan `validasiKoreksi` (termasuk dalam C-26). Bila perakit uji membutuhkan kontrak sendiri untuk `periksaSatuButir`, usulan ID: C-32 `ButirCek.periksa` (seq-uc06 `periksa(teksBagian)`).

Fungsi murni baru pada putaran 22 Okt 2026 dan kontrak induknya: `putuskanTerbitkan` dan `transisiTemplat` (`templat/status.ts`, bagian dari MS-11 dan C-02/C-04; state machine TemplatProposal Draf, Terbit, Arsip); `transisiButir` dan `butirTerkunci` (`aturan/status.ts`, C-07 dan C-06 Q5); `susunBarisUji` dan `ringkasPerContoh` (`aturan/uji.ts`, C-10); `bersihkanIsianDraf` (`templat/kelengkapan.ts`, C-01); `transisiPenugasan` dan `bolehDipindahkan` (`penugasan/status.ts`, C-14/C-15); `periodeDitutup`, `ringkasStatusPenetapan`, dan penomoran halaman (`penugasan/periode.ts`, C-11); `tandaiPerluDitinjau` dan `pilahButirDitandai` (`pemantauan/status-butir.ts`, C-30); `ringkasKeputusan`, `ringkasRekomendasi`, dan transisi penilaian (`penilaian/status.ts`, C-26 sampai C-28).

## 6. Selisih antara naskah dan kode yang ditemukan

1. **Batas tanggal 8a (C-08)**: kode menolak tanggal berlaku pada hari buka dan hari tutup juga (inklusif), dan menambah syarat "lebih akhir daripada versi sebelumnya"; naskah hanya menulis "di tengah masa pengusulan".
2. **Masa pengusulan (C-05, C-11)**: `cekPengusulanBerjalan` dan `masaPengusulanBerjalan` hanya membaca sakelar demo (tanpa argumen skema atau periode); hanya `cekMasaPengusulan` membandingkan tanggal (inklusif di kedua ujung) dan tetap tunduk pada sakelar.
3. **UC-09 (C-25)**: naskah memiliki dua jalur (S-1 kutipan tidak ditemukan, S-2 tidak merespons); kode menambah sasaran kosong (Tidak memenuhi tanpa memanggil LLM), kutipan kosong dengan "Tidak memenuhi" (tetap Tidak memenuhi), dan kutipan kosong dengan "Memenuhi" (Perlu diperiksa manual).
4. **Jumlah percobaan**: UC-09 dan kode memakai dua percobaan total; NFR 4.4 menyebut ulang maksimum dua kali (tiga panggilan), yang dipakai klien BIMA. Batas 15 detik dipasang di klien Anthropic, bukan di `mintaJawaban`.
5. **pilihReviewer (C-14, C-13)**: naskah `pilihReviewer(daftarReviewer, batasBeban)` per proposal; kode memisahkan pembagian massal (`susunUsulanMurni`, dengan penataan ulang dan heuristik berhenti setelah 25 kegagalan beruntun) dari pemindahan (`pilihReviewer(penugasanId, reviewerBaruId)`), dan menambah syarat kesediaan reviewer.
6. **tetapkan (C-15)**: naskah per penugasan (`tetapkan`, `mencatatPenugasan`, `terimaProposal`); kode satu fungsi batch per periode (kelompok 500, kompensasi per kelompok), tanpa memeriksa ulang bahwa masa pengusulan sudah ditutup.
7. **potongPerBagian (C-21)**: naskah menerima `teks` dan memanggil `ambilTeksBagian` per bagian; kode menerima blok terstruktur dan melakukan ketiganya dalam satu fungsi.
8. **catatTerkirim (C-22)**: naskah tanpa argumen; kode menerima `proposalId` dan `versiId`, juga mengantre UC-09 dan menyalin status ke BIMA.
9. **siapkanTeksTanpaIdentitas (C-23)**: naskah menyebut identitas dari metadata BIMA; kode memakai nama, institusi, dan nomor induk akun pengusul SEMAR, ditambah blok "2. IDENTITAS PENGUSUL" ekspor BIMA beserta identitas anggota tim yang dibaca dari teksnya.
10. **cocokkanKutipan (C-24)**: pencocokan peka huruf besar-kecil dan tanda baca, mengabaikan beda spasi, dan menerima substring di dalam kata.
11. **periksaKelengkapan (C-01)**: kode menambah nama bagian tidak boleh ganda, minimal satu bagian, dan nama lampiran tidak boleh kosong.
12. **cekLampiran (C-19)**: naskah mencocokkan dengan daftar lampiran wajib templat; kode memeriksa satu nama per butir (daftar templat hanya untuk angka pembukti). Butir `diagram_alir` dan `bagian_terisi` pada penentu pemeriksa (`PEMERIKSA_PER_TIPE`) tercatat `cekLampiran` dan `hitungKata`, padahal `diagram_alir` dijalankan `periksaDiagramAlir` (catatan inkonsistensi no. 14).
13. **hitungKata (C-16)**: kalimat petunjuk templat (kebutuhan 1.6) dibuang oleh `potongPerBagian` sebelum teks sampai ke `hitungKata` (selisih tertutup untuk naskah yang melewati pemotong); bagian yang tidak ditemukan dihitung 0 kata dan Lolos untuk batas kata.
14. **simpanPermanen (C-28)**: urutan dan pemecahan transaksi berbeda dari seq-uc07; `terima` diekspor tetapi tidak dipanggil; "Simpan Permanen" menolak komponen belum lengkap (tidak ada di Bab 7, catatan inkonsistensi no. 8).
15. **simpanKoreksi (C-26)**: `catatKoreksi`, `ambilRekomendasi`, dan `gantiRekomendasi` dijalankan saat "Simpan Koreksi", bukan saat "Tidak Setuju" (catatan inkonsistensi no. 15); `gantiRekomendasi` menyimpan keputusan di tabel koreksi tanpa menimpa rekomendasi sistem.
16. **Alias seq-uc04 (C-29)**: `ambilStatus`, `ambilAlasan`, `ambilRincian`, `ambilContoh`, `hitungTingkatKoreksi` adalah alias satu fungsi `susunLaporan`, bukan metode berpenerima terpisah; kegagalan deterministik dihitung dari semua versi proposal.
17. **tandaiButir (C-30)**: hanya butir berstatus Aktif yang berubah; status lain dibiarkan.
18. **terbitkan (C-02)**: `arsipkan`, `nonaktifkan`, dan `gantiTemplatBerlaku` adalah fungsi privat di dalam satu transaksi, tidak dapat dipanggil langsung oleh uji; isian disimpan sebelum cabang 9a.
19. **C-31 dan MS-10**: `buatDokumenTemplat` adalah tambahan prototipe di luar naskah. Tanda tangan kode (`templat, bagian, lampiran, skema, periode`) menerima identitas templat dan daftar bagian terpisah, bukan satu objek `TemplatTampil`; "Kata Kunci" dan "Daftar Pustaka" selalu ditambahkan di berkas walau tidak ada di baris `bagian_templat`; berkas bergaya Isian Substansi (judul berhuruf, petunjuk resmi, "[ … ]") dan kalimat petunjuk tidak dihitung `hitungKata` karena dibuang `potongPerBagian`.

### MS-15 cekTabel / periksaDiagramAlir / periksaBagianTerisi (butir turunan ketentuan)

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `cekTabel`, `periksaDiagramAlir`, `periksaBagianTerisi` / ButirCek / MS-15 / C-03 (butir turunan), C-16 |
| Triggers/Events | `periksaSatuButir` memproses `tabel_wajib`, `diagram_alir`, `bagian_terisi` |
| Algorithm Specification | **cekTabel:** [J1] IF ada baris "[tabel]" THEN Lolos (penanda tabel dari berkas); [J2] ELSE IF ada baris "Tabel n" THEN Lolos; [J3] ELSE IF ada baris kepala ("No ... kegiatan/aktivitas/tahapan/uraian/indikator/luaran") THEN Lolos; [J4] ELSE IF ada baris 6 angka atau lebih berurutan (nomor bulan hasil ekstraksi PDF) THEN Lolos; [J5] ELSE Gagal.<br>**periksaDiagramAlir:** [J1] IF ada keterangan "Gambar/Diagram/Bagan n ..." yang menyebut diagram alir THEN Lolos; [J2] ELSE IF ada "[gambar]" THEN Lolos; [J3] ELSE IF ada keterangan gambar atau "pada Gambar berikut" THEN Lolos; [J4] ELSE Gagal.<br>**periksaBagianTerisi:** [J1] IF hitungKata > 0 THEN Lolos; [J2] ELSE IF ada penanda "[tabel]" atau "[gambar]" THEN Lolos; [J3] ELSE Gagal "0 kata". |
| Misc. Notes | Batas: pemeriksa berbasis teks; gambar tanpa keterangan pada PDF tidak terdeteksi (contoh no. 5, lihat catatan-inkonsistensi 37). |

### MS-16 turunkanButirCek (ketentuan per bagian dan lampiran)

| Bagian formulir | Isi |
|---|---|
| Method Name / Class Name / ID / Contract ID | `turunkanButirDariTemplat` / TemplatProposal / MS-16 / C-03 |
| Algorithm Specification | FOR EACH bagian: [J1] IF wajib THEN BGN; [J2] IF batasKata != null THEN KTA; [J3] IF jenisIsian = daftar DAN jumlahButir >= 1 DAN pemisah THEN KAT (pemisah dinamai: titik koma, koma, garis tegak, garis miring, selain itu dikutip); [J4] IF wajibGambar THEN GBR; [J5] IF jenisIsian = tabel THEN TBL.<br>SET pustaka = nama bagian pertama bertanda daftarPustaka; [J6] IF ada bagian sitasiBernomor THEN SIT-01; [J7] IF pustaka ada THEN SIT-02 dan SIT-03.<br>FOR EACH lampiran: LMP-nn.<br>[J8] FOR EACH templat lampiran berjenis formulir dengan kunci tidak kosong DAN namanya ada di lampiran wajib: FMT-nn; [J9] ELSE lewati. |
| Misc. Notes | Sembilan jalur (uji KP/KH turunkanButirCek-20..23). |

### MS-17 cekFormatLampiran (C-19, format formulir)

| Bagian formulir | Isi |
|---|---|
| Algorithm Specification | [J1] IF lampiran belum ada THEN Gagal; SET teks = normalisasi isi lampiran; [J2] IF teks kosong (pindaian) THEN Lolos "format belum diperiksa"; SET hilang = kalimat kunci yang tidak ada di teks (huruf kecil, tanda baca dan spasi ganda dibuang); [J3] IF hilang kosong THEN Lolos "n dari n kalimat kunci"; [J4] ELSE Gagal dengan daftar yang belum ada. |

## Putaran 3 UC-01 (24 Okt 2026): ketentuan bagian komprehensif

Pembaruan C-01, C-03, C-17, C-31, MS-10, MS-13, MS-15, MS-16 serta MS baru MS-18 (periksaFrasa dan periksaBatasMin) dan MS-19 (susunPetunjuk). Sumber keputusan: `docs/arah-uc01-2026-10-23.md` bagian 6.

### Model ketentuan sebuah bagian (Class Diagram BagianTemplat)

Atribut: `nama`, `tipeIsian` (`teks` | `daftar` | `tabel` | `daftar_pustaka`), `batasMin` (opsional), `batasKata` (maksimal, opsional), `wajib`, `petunjuk`, dan **Wajib Memuat**: `wajibGambar` + `ketGambar`, `wajibTabel` (di dalam bagian teks) + `kolomTabel` + `judulTabel`, `sitasiBernomor`, `frasaWajib[]`, `unsurIsi[]` (`unsur`, `pertanyaan` opsional); untuk tipe daftar `jumlahButir` dan `pemisah` (`;` `,` `/`). Tipe `daftar_pustaka` disimpan sebagai `jenis_isian = teks` dengan `daftar_pustaka = true` supaya kode produksi lama tetap membaca baris yang sama.

### C-01 periksaKelengkapan (tambahan)

| Bagian formulir | Isi |
|---|---|
| Arguments Received (tambahan) | Tiap `BarisBagianMentah` memuat `batasMin: string`, `wajibTabel`, `kolomTabel: string[]`, `judulTabel`, `ketGambar`, `frasaWajib: string[]`, `unsurIsi: {unsur; pertanyaan}[]`, dan `jenisIsian` boleh `daftar_pustaka`. |
| Post-Conditions (tambahan) | [Q8] `ketentuan.batasMin` terisi bila `batasMin` tidak kosong dan bukan bilangan bulat > 0, atau melebihi `batas` (saat `tanpaBatas = false` dan `batas` sah).<br>[Q9] `ketentuan.kolomTabel` terisi bila tipe `tabel` tanpa kolom terisi, atau ada nama kolom kosong (tipe `tabel` atau `wajibTabel`).<br>[Q10] `ketentuan.frasaWajib` terisi bila ada frasa kosong; `ketentuan.unsurIsi` terisi bila ada unsur kosong.<br>[Q11] Tipe `daftar`: jumlah butir bilangan bulat >= 1 dan pemisah tepat satu karakter (seperti sebelumnya).<br>[Q12] Paling banyak satu bagian bertipe `daftar_pustaka` (atau berpenanda `daftarPustaka`); `sitasiBernomor` pada suatu bagian butuh satu bagian `daftar_pustaka`.<br>[Q13] `lengkap = false` bila ada `ketentuan` non-null pada baris mana pun. |

### C-03 turunkanButirCek (pengganti [Q1]-[Q6] untuk bagian)

| Bagian formulir | Isi |
|---|---|
| Arguments Received | `bagian: BagianSeed[]` memuat ketentuan penuh (atribut di atas); `lampiranWajib`; `lampiranTemplat` |
| Type of Value Returned | `ButirSeed[]` = `{kode, deskripsi, jenis: "deterministik" \| "semantik", asal: "templat", komponen, pemeriksa, parameter, aturanHitung, pertanyaan, contohJawaban, bagian}` |
| Post-Conditions | [Q1] `wajib` → `BGN-nn` (Deterministik, `periksaBagianTerisi`).<br>[Q2] `batasKata != null` → `KTA-nn` (`hitungKata`); `batasMin != null` → `KTM-nn` (`{tipe:"batas_kata_min"}`, `hitungKata` minimal).<br>[Q3] tipe `daftar` dengan jumlah dan pemisah → `KAT-nn` (`{tipe:"kata_kunci", jumlah, pemisah, bagian}`, `cekKataKunci`); deskripsi "Kata kunci tepat N, dipisahkan titik koma (;)" untuk bagian Kata Kunci, selain itu "<Nama>: tepat N butir, dipisahkan ...".<br>[Q4] `wajibGambar` → `GBR-nn` (Deterministik, `{tipe:"diagram_alir", bagian, keterangan}`, bawaan keterangan "diagram alir penelitian") **dan** satu `UNS-nn` Semantik (kesesuaian isi gambar dengan bagian; pemetaan ISI-03S).<br>[Q5] tipe `tabel` atau `wajibTabel` → `TBL-nn` (`cekTabel`, parameter memuat `kolom` bila ada).<br>[Q6] setiap frasa wajib terisi → `FRS-nn` (`{tipe:"frasa_wajib", bagian, frasa}`, `periksaFrasa`).<br>[Q7] setiap unsur isi terisi → satu `UNS-nn` Semantik (`nilaiSemantik`, `{tipe:"semantik", bagian}`, `pertanyaan` = hasil sunting atau "Apakah bagian {nama} memuat {unsur}?"). Butir ini berjalan di J-08/UC-09 seperti butir semantik manual (mesin membaca `parameter.bagian` dan `pertanyaan`).<br>[Q8] `sitasiBernomor` → `SIT-01`; bagian `daftar_pustaka` → `SIT-02`, `SIT-03` (`cocokkanSitasi`).<br>[Q9] lampiran seperti sebelumnya (`LMP-nn`, `FMT-nn`).<br>[Q10] Penomoran `nn` terpisah per awalan (BGN, KTA, KTM, KAT, GBR, TBL, FRS, UNS, LMP, FMT), mengikuti urutan bagian; urutan keluaran per bagian: BGN, KTA, KTM, KAT, GBR, UNS gambar, TBL, FRS, UNS unsur; lalu SIT; LMP; FMT.<br>[Q11] Butir tetap bergembok di J-03 (4a); status `Draf` diberikan C-02. |
| Catatan | Pemetaan butir semantik katalog lama: ISI-01 → UNS (4 unsur Ringkasan); ISI-02 → UNS (5 unsur Pendahuluan); ISI-04 → UNS (unsur "anggota tim/mitra ..." pada Metode); ISI-05S → UNS (Hasil yang Diharapkan); ISI-03S → UNS kesesuaian gambar (Metode); ISI-05D → BGN (Hasil yang Diharapkan wajib). Butir lampiran semantik (LMP-S1, ART-S1/S2, MIT-S1) tetap manual. |

### C-17 / MS-13 cekKataKunci (tambahan)

Argumen keempat `bagianDaftar?: string`. [J10] Bila bagian bernama "Kata Kunci" (atau tidak disebut) isian dibaca dari `dokumen.kataKunci`; [J11] bagian daftar lain dibaca dari `teksPerBagian[bagian]`, sebutan "butir" menggantikan "kata kunci" di angka pembukti dan nama bagian di `bagian`/`batasDilanggar`. Jalur J1-J9 tidak berubah.

### MS-15 cekTabel (tambahan) dan periksaDiagramAlir (tambahan)

`cekTabel(dokumen, bagian, kolom?)`: [J6] tanpa bukti tabel → Gagal; [J7] tanpa kolom wajib → Lolos seperti J1-J4; [J8] bukti hanya penanda "[tabel]" dari DOCX dan tak satu pun kolom terbaca → Lolos dengan catatan "isi kolom tidak terbaca ... belum dapat diperiksa" (isi tabel DOCX tidak diekstrak); sebagian kolom terbaca → Gagal; [J9] semua kolom terbaca → Lolos, selain itu Gagal "belum ada: ...". Kolom "Bulan a–b" cukup dengan kata "bulan". `periksaDiagramAlir(dokumen, bagian, keterangan?)`: [J5] keterangan khusus (bukan "diagram alir") dicari pada baris "Gambar n ..." yang memuatnya; [J6] bila tidak ada tetapi ada gambar lain tetap Lolos sebagai gambar; tanpa gambar Gagal dengan menyebut keterangan.

### MS-18 periksaFrasa dan periksaBatasMin

`periksaFrasa(dokumen, bagian, frasa)`: [J1] normalisasi (huruf kecil, tanda baca dan spasi ganda dibuang) teks bagian memuat frasa → Lolos; [J2] selain itu Gagal "Bagian X harus memuat kalimat ...". `periksaBatasMin(dokumen, bagian, batas)`: [J1] jumlah kata >= batas → Lolos; [J2] selain itu Gagal dengan selisih; [J3] bagian tidak ditemukan dicatat pada angka pembukti.

### MS-19 susunPetunjuk

Menyusun kalimat petunjuk dari ketentuan: [J1] daftar pustaka memakai kalimat resmi; [J2] daftar: "Isian N butir ... dipisahkan dengan tanda <nama pemisah>"; [J3] tabel: kolom dan judul blok; [J4] teks dengan minimal, maksimal (`{batas}`), keduanya, atau tanpa batas; [J5] unsur isi ("yang memuat a, b, dan c"; dua unsur "a dan b"); [J6] gambar, [J7] tabel wajib, [J8] sitasi bernomor, [J9] frasa wajib sebagai kalimat tambahan. Bagian A-H bawaan memakai petunjuk resmi dari contoh, bukan fungsi ini.

### C-31 / MS-10 buatDokumenTemplat (tambahan)

Tempat isian mengikuti ketentuan: [J12] daftar `[butir 1; butir 2; ...]` (bagian Kata Kunci memakai "kata kunci n") dengan pemisah bagian; [J15] tabel menurut `kolomTabel` (kolom "Bulan 1–12" diperluas dua belas nomor bulan; kolom "No" diberi nomor baris; judul blok bila ada, bawaan "Tahun ke-1" untuk baris lama tanpa kolom); [J16] bagian teks `wajibTabel` mencetak "[Sisipkan tabel]" dan tabel kosong; [J17] gambar mencetak "[Sisipkan {keterangan} (JPG/PNG)]". Kop dan kepala mengikuti ukuran terukur dari PDF contoh (lihat `docs/perubahan-model.md`, putaran 3).


## Pembaruan 24 Okt 2026: SEMAR hanya untuk isi proposal

Sumber keputusan: `docs/arah-isi-saja-2026-10-24.md`. Lampiran dan halaman depan milik BIMA; SEMAR tidak memeriksa lampiran.

- **C-31 / MS-10 `buatDokumenTemplat`:** hanya Isian Substansi (kepala berlogo, SKEMA, pengantar, bagian A-H). Tanda tangan baru:
  `buatDokumenTemplat(templat, bagian, skema, periode, paket?: {kepala?})`; argumen `lampiran`, `paket.kop`, `paket.lampiranTemplat`, dan
  `paket.mode` dihapus. `namaBerkasTemplat(skema, templat)` selalu `Isian-Substansi-<kode>-v<n>-<status>.docx`. Cabang halaman depan dan
  halaman lampiran (kop BIMA, "PROTEKSI ISI PROPOSAL", bagian 1-6, surat) dihapus dari algoritma MS-10.
- **C-03 / MS-13 `turunkanButirDariTemplat`:** `turunkanButirDariTemplat(bagian)`; Post-Condition [Q3], [Q9], [J8] (LMP-nn dan FMT-nn) dan
  penomoran LMP/FMT pada [Q4], [Q10] dihapus.
- **C-19 `cekLampiran` dan `cekFormatLampiran`:** dihapus dari SEMAR; tipe parameter `lampiran_wajib` dan `lampiran_format` dan
  `KonteksPeriksa.lampiranWajib` dihapus. `periksaSatuButir` tidak lagi mengenali kedua tipe itu (jatuh ke cabang "tidak dikenali").
- **Templat lampiran BIMA tiruan:** `src/lib/bima/lampiran.ts` (`lampiranWajibSkema`, `templatLampiran`) dan `lampiran-dokumen.ts`
  (`buatDokumenLampiran`) milik BIMA, bukan kontrak SEMAR.

## UC-03 untuk skala ribuan proposal (25 Okt 2026)

Tambahan dan perubahan atas C-13, C-14, C-15, MS-04, dan MS-05. Contoh demo: periode "Simulasi Contoh 2026 (1.200 proposal)", 30 reviewer bersedia (`demo/profil-skala.ts`).

### C-13 susunPenugasan (perubahan)

| Bagian | Isi |
|---|---|
| Post-Conditions | [Q1'] `batasBebanReviewer` disimpan **hanya bila** semua proposal tertampung. [Q2'] Kumpulan reviewer per periode menurut profil: periode 10.000 hanya `rvw-skala-*`; periode 1.200 `rvw-c12-*` ditambah `reviewer-1..6`; periode biasa tidak pernah memakai reviewer massal. [Q5'] S-1 ditentukan oleh `cekKelayakan` (pasti), bukan heuristik: `jumlahBelumDitugaskan` = jumlah proposal dikurangi aliran maksimum; **tidak ada data yang berubah** (usulan lama dan batas lama tetap); `kekurangan` = `{jumlahReviewer, kapasitas, batasCukup, hambatan (≤5 institusi)}`. [Q10] Pembacaan, keputusan, dan penulisan berjalan dalam satu transaksi dengan `pg_advisory_xact_lock(hashtext('penugasan:'+periodeId))`; daftar reviewer BIMA diambil sebelum transaksi. [Q11] Basis data menolak baris kedua untuk pasangan (proposal, periode) yang sama (`penugasan_proposal_periode_uq`). |

### C-14 pindahkanBanyak (tambahan, S-2 untuk satu atau banyak baris)

| Bagian | Isi |
|---|---|
| Method Name / Class Name / ID | `pindahkanBanyak` / PenugasanReviewer / C-14a |
| Arguments Received | `periodeId`; `pilihan: {ids: string[]} \| {filter: FilterUsulan}`; `tujuan: {jenis: "reviewer"; reviewerId} \| {jenis: "otomatis"}`; `opsi: {simpan: boolean; aktor}` |
| Type of Value Returned | `{dipilih; dipindahkan; ditolak; alasan: {kode; jumlah; contoh}[]; tujuan: {reviewerId; nama; jumlah}[]}` |
| Pre-Conditions | [P1] Hanya baris berstatus `Diusulkan` pada periode itu yang ikut; id lain diabaikan. |
| Post-Conditions | [Q1] `simpan = false` (pratinjau): tidak ada perubahan data dan tidak ada log. [Q2] `simpan = true`: setiap baris yang diterima `rencanakanPindah` dipindahkan dengan `UPDATE … WHERE status = 'Diusulkan'` dalam transaksi berkunci periode; yang ditolak tetap pada reviewer semula; satu log `pindah_penugasan` (atau `_ditolak` bila tak satu pun dipindahkan). [Q3] `alasan.contoh` adalah teks persis `periksaSyarat` (S-2.3). |

### C-15 tetapkan (perubahan)

[P3] Periode harus sudah ditutup (`periodeDitutup`); bila belum, `MasaBelumDitutupError`. Periode tidak dikenal: `PenugasanDitolakError("Periode tidak dikenali.")`.

### C-32 bacaFilterUsulan / bacaTabUsulan / ukuranDariUrl (J-04b, murni)

| Bagian | Isi |
|---|---|
| Arguments Received | parameter URL (`string \| string[] \| undefined`; nilai array memakai yang pertama) |
| Post-Conditions | [Q1] `q` dipangkas dan dipotong 100 huruf; `inst`, `skema` kosong menjadi `null`. [Q2] `rev` harus uuid, selain itu `null`. [Q3] `syarat=melanggar` menjadi `melanggar = true`, nilai lain `false`. [Q4] `urut` ∈ {id, judul, reviewer, institusi}, selain itu `id`. [Q5] `bacaTabUsulan`: `sebaran` dan `ditetapkan` dikenali, selain itu `usulan`. [Q6] `ukuranDariUrl`: hanya 25, 50, 100; selain itu 50. |

### MS-04a cekKelayakan

| Bagian | Isi |
|---|---|
| Arguments | `proposal: {id; institusiPengusul}[]`, `reviewer: {id; nama; institusi}[]`, `bebanAwal`, `batas` |
| Algorithm | Kelompokkan proposal per institusi (dinormalisasi) [J1]. Graf: sumber → institusi i (kapasitas jumlah proposal i) → reviewer r bila institusi r ≠ i DAN sisa(r) > 0 [J2] → muara (kapasitas sisa(r) = max(0, batas − bebanAwal[r])) [J3]. `tertampung` = aliran maksimum (Dinic). [J4] IF tertampung = jumlah proposal THEN layak, hambatan kosong. [J5] ELSE simpul institusi yang terjangkau dari sumber di graf sisa = sisi sumber potongan minimum; [J6] IF tidak semua institusi terjangkau THEN `hambatan` = institusi terjangkau (urut jumlah proposal turun) [J7] ELSE hambatan kosong (kapasitas total yang kurang). `alokasi` = aliran per (institusi, reviewer). |
| Notes | Monoton terhadap batas. Uji batas: kapasitas total = jumlah proposal (layak) dan kurang satu (tidak layak). |

### MS-04b batasTerkecilCukup

| Bagian | Isi |
|---|---|
| Algorithm | [J1] IF tidak ada proposal THEN 1. [J2] IF tidak ada reviewer THEN null. SET atas = jumlah proposal + beban awal terbesar. [J3] IF tidak layak pada `atas` THEN null (berapa pun batasnya tidak cukup). SET bawah = max(1, ceil(jumlah proposal / jumlah reviewer)) (sah karena kapasitas ≤ jumlah reviewer × batas; beban awal tak merata tidak menaikkan batas bawah). [J4] WHILE bawah < atas: tengah = floor((bawah+atas)/2); IF layak(tengah) THEN atas = tengah ELSE bawah = tengah + 1. RETURN bawah. |

### MS-04c susunUsulan

| Bagian | Isi |
|---|---|
| Algorithm | SET k = cekKelayakan(batas). [J1] IF tidak layak THEN RETURN {penugasan: [], kekurangan = k.kekurangan, batasCukup = batasTerkecilCukup}. SET g = susunUsulanMurni (MS-04). [J2] IF g tidak menyisakan proposal THEN RETURN penugasan g. [J3] ELSE (heuristik greedy gagal padahal layak) SET c = min(batasTerkecilCukup, batas); penempatan diambil dari `alokasi` cekKelayakan(c): proposal setiap institusi (urut id) dibagi ke reviewer sesuai jumlah aliran. |

### MS-05a rencanakanPindah

| Bagian | Isi |
|---|---|
| Arguments | `baris: {penugasanId; institusiPengusul; reviewerId}[]`, `tujuan`, `kandidat: {id; nama; institusi; bersedia}[]`, `bebanSaatIni`, `batas` |
| Algorithm | SET beban = salinan bebanSaatIni. FOR EACH b: **reviewer**: [J1] IF reviewer tujuan tidak ada THEN tolak `tidak-ada`; [J2] ELSE IF tujuan = reviewer b THEN tolak `sama`; [J3] ELSE IF `periksaSyaratRinci` tidak kosong THEN tolak dengan alasannya; [J4] ELSE terima. **otomatis**: pilih kandidat ≠ reviewer b, bersedia, institusi berbeda, beban < batas, dengan beban terkecil (seri: nama) [J5]; [J6] IF tidak ada THEN tolak `tidak-ada`. Setiap terima: beban[ke] + 1, beban[dari] − 1 (pemindahan sekaligus tidak melampaui batas). |

### MS-20 ringkasBeban (J-04b Sebaran Beban, murni)

| Bagian | Isi |
|---|---|
| Algorithm | [J1] IF daftar kosong THEN semua nol, kelompok kosong. SET atas = max(batas, beban tertinggi, 1); lebar = max(1, ceil((atas+1)/8)); kelompok [0..atas] selebar `lebar`. Setiap beban masuk kelompok floor(b/lebar) [J2]. median: nilai tengah (ganjil) atau rata-rata dua nilai tengah (genap) [J3]. `melampaui` = jumlah beban > batas. |
