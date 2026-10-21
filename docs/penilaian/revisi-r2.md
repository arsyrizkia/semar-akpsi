# Revisi putaran 2 (sisi Telusur 85, Desain 87, Teknis 81)

Aturan: temuan yang diangkat minimal dua dari tiga penilai (atau kritis dan terbukti), temuan sedang tunggal hanya bila murah dan benar. Sisi yang sudah lulus tidak diubah.

## Diterapkan

Bukti dan uji
- Bukti visual: run e2e penuh pada kode r2 terhadap PostgreSQL lokal (branch Neon uji tidak dapat dibuat: tidak ada neonctl atau kunci API Neon, Docker tidak berjalan). 19 dari 19 skenario lulus, 43 tangkapan layar, laporan di `docs/bukti-e2e/` (salinan `e2e/hasil/` yang di-.gitignore) dan peta bukti di `docs/peta-uc-jendela.md`. Produksi tidak disentuh.
- Jembatan uji lokal: `scripts/jembatan-ws-pg.mjs` (WebSocket ke TCP) dan `pasangProxyLokal()` di `src/db/index.ts` (aktif hanya bila `SEMAR_DB_WS_PROXY` diisi). Tanpa paket baru (`ws` sudah ada; `pg` hanya dipasang `--no-save` untuk drizzle-kit di mesin uji).
- Tes baru `tests/revisi-r2.test.ts` (idempotensi kotak masuk BIMA dan pemulihan naskah UC-05b berulang).
- `tsc` kini bersih di salinan iCloud: `tsconfig.json` mengecualikan berkas duplikat "* 2.ts".

Teknis
- Jalan pintas UC-05/05a/05b/05c/06 idempoten: `pulihkanDrafBima` menulis ulang naskah dan lampiran seed BIMA (K1.2, K3.2, T3.2).
- Pengiriman ke BIMA idempoten: `kunci` (id penugasan/penilaian) di payload, BIMA tiruan melewati duplikat; kirim ulang dan ulang otomatis tidak menggandakan kotak masuk (K1.4, K2.2, K3.4).
- Simpan Permanen satu transaksi dengan klaim atomik `status <> 'Final'` (nilai, Final, Selesai, log audit); kirim ke BIMA sesudah commit (K1.5, K2.2, K3.4).
- `tetapkanPenugasan` mengklaim baris Diusulkan secara atomik; komentar "satu transaksi" dikoreksi (K2.3, K3.4).
- Aktor log audit seragam `idBima` (penugasan, pindah, tandai butir); `pilihReviewer` menerima parameter opsional `aktor` (K1.6, K2.6, K3.5, T1.8).
- Timeout 10 dtk per percobaan klien BIMA (K2.10, K3.11).
- "Uji pada Contoh": bila semua butir semantik "Belum ada rekomendasi" (LLM nyata tidak berfungsi), diulang dengan mode tiruan berlabel (T1.3, K1.3, K2.4, K3.3). Konfigurasi `SEMAR_LLM_MODE` di Vercel tetap keputusan pemilik.
- Jalan pintas UC-04: butir "Perlu ditinjau" dikembalikan ke Aktif dan data koreksi dibuat bila belum ada koreksi pada penilaian Final (K2.5, T1.7).

Telusur
- UC-03 S-1: usulan lama dibuang sehingga tidak dapat ditetapkan melanggar batas (T1.2).
- Pesan 3a.2: tutup masa menetapkan tanggalTutup semenit lalu (hari ini), bukan kemarin (T3.6).
- UC-07b mendarat di J-07; UC-07c diberi catatan dan kartu UC-07c-awal (mulai dari Baru); tanggal penugasan skenario diperbarui agar di atas daftar J-07 (T1.5, T2.8, T3.7).
- Catatan jalan pintas tampil sebagai banner di jendela tujuan, juga di BIMA tiruan (T1.5, T3.9).
- Penomoran pemandu tidak bentrok: "UC-06·n", "UC-08·n", "UC-09·n"; teks UC-08 langkah 2-3 dan UC-05 langkah 3-4 mengikuti kode (T2.3, T2.4, T1.4, T2.5).
- Peta: ambilBerkas diarahkan ke `bima/client.ts`, alias ditandai, bukti ditautkan; catatan-inkonsistensi no. 12-16; perubahan-model diperbarui (T1.4, T1.8, T2.7, T3.3).

Desain
- Panel pemandu: keadaan ciut lebih sempit, teks langkah `line-clamp-2` dengan `title`, `<main>` diberi `pb-40` agar isi terakhir tidak tertutup (D1.3, D2.1, D3.2, D1.x, D2.12, D3.6).
- J-05 Rincian Butir: gulir, fokus ke judul, Tutup mengembalikan fokus (D1.1, D2.2, D3.3). Istilah "asumsi terbuka" dihapus dan kalimat dihitung diperbaiki (D1.11, D3.11).
- J-08: kalimat tetap "Butir yang tidak Anda koreksi dianggap Anda setujui", ringkasan dinamis dekat Simpan Permanen, label "Total proposal", rekomendasi semula diredam dan keputusan berlaku berlencana, jenis kekeliruan kosong tidak lagi ": alasan", fokus ke alasan saat validasi gagal, penanda tab untuk pembaca layar, TabsList satu baris (D1.2, D1.4, D1.8, D2.3, D2.4, D2.6, D3.1, D3.7-D3.9, T1.6).
- J-06: Bukti Pengiriman dan tombol "Kembali ke BIMA" dipindah ke atas tabel butir (D1.6, D2.10, D3.13).
- J-02: Terbitkan dengan isian belum lengkap menggulir dan memfokuskan isian bertanda (D1.7). aktifNomor untuk J-02 dan J-05 (D1.5, D3.5, sebagian).

## Ditolak atau ditunda

| Temuan | Alasan |
|---|---|
| Reset dan sakelar demo dilindungi PIN (K1.10, K2.11, K3.8) | Demo dipakai kelompok tanpa env baru di Vercel; PIN yang belum dikonfigurasi memutus peragaan. Dicatat sebagai risiko; konfirmasi Reset sudah ada. |
| Isolasi skema UC-01/UC-02 dari UC-05 (T2.2) | Satu penilai; perbaikan menyentuh seed dan semua jalan pintas. Urutan demo yang disarankan: UC-05 sebelum UC-01. |
| Pecah alias seq-uc03/04 menjadi fungsi berurutan (T2.6, T3.4) | Risiko regresi besar tanpa nilai uji; alias ditandai jujur di peta. |
| Memindah `tarikDariBima` jadi pintu UC-05 (T1.4, T2.5) | Arsitektur sinkron (3a tanpa API BIMA) dan latar belakang tetap; selisih dicatat (no. 13) dan teks pemandu disesuaikan. |
| `forbidden()` 403 pada halaman J-08 (K1.7, K2.9, K3.13) | Perlu `experimental.authInterrupts`; 403 nyata sudah ada di rute `.../data` dan dibuktikan e2e. |
| Endpoint API BIMA untuk profil akun (T2.9) | Penyimpangan sudah dicatat; di luar biaya murah. |
| Sakelar kegagalan BIMA (K3.14), env Preview (K3.12), efek LLM `effort` (K1.9) | Satu penilai, bukan cacat terbukti. |
| Warna bar Sedang (D2.5), konsistensi tombol/checkbox/urutan penyaring (D1.9, D2.9, D3.10), format angka seed (D2.8), h1-h3 global dan lining-nums (D1.10, D3.12), pencegahan keluar tanpa simpan (D1.8), kepala J-08 dipadatkan (D2.11) | Selera atau skala sedang; satu atau dua penilai, bukan cacat fungsi. |
| aktifNomor J-03 dan J-04, PanelPemandu J-03 sebelum Tampilkan (T3.8) | Tidak sempat; dicatat sebagai sisa. |
| Reset basis data produksi agar bersih dari "SEM-E2E" dan entri uji (D1.13, D2.7) | Keputusan pemilik proyek (basis data bersama); tidak dilakukan. |

## Hasil uji (lokal, PostgreSQL lokal, mode tiruan)

| Gerbang | Hasil |
|---|---|
| `npx tsc --noEmit` | bersih |
| `npm run lint` | bersih |
| `npm test` | 12 berkas lulus, 121 tes dasar plus 2 tes baru, tanpa yang dilewati |
| `npm run build` | berhasil |
| `npm run e2e` | 19 dari 19 skenario lulus, 43 tangkapan layar |
