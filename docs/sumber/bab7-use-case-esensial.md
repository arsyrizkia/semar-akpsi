## 7.2 Use Case Description
Setiap use case diuraikan dengan templat Dennis, Wixom & Tegarden (2015). Pre-condition adalah keadaan yang sudah harus benar sebelum use case dimulai, berbeda dengan trigger yang memulainya. SubFlows berisi cabang yang tetap mencapai post-condition, sedangkan Alternate/Exceptional Flows berisi alur yang berhenti sebelum post-condition tercapai. Langkah ditulis pada tingkat essential, tanpa menyebut layar atau tombol.
## UC-01 Mengelola templat proposal
Tabel 7.2 Deskripsi UC-01 Mengelola templat proposal
| Bagian | Isi |
| Use Case Name | Mengelola templat proposal |
| ID | UC-01 |
| Importance Level | Tinggi. Gerbang deterministik bergantung pada templat. |
| Primary Actor | Tim Kerja DPPM |
| Use Case Type | Detail, Essential |
| Stakeholders and Interests | Tim Kerja DPPM: templat sesuai panduan tahun berjalan. / Pengusul: tahu sejak awal bagian apa saja yang wajib dan batas kata tiap bagian. / Reviewer: struktur proposal seragam sehingga cepat dibaca. |
| Brief Description | Tim Kerja DPPM menyusun dan memperbarui templat proposal per skema: daftar bagian, batas kata tiap bagian, dan lampiran wajib, beserta periode berlakunya. Saat templat diterbitkan, sistem otomatis membuat butir cek deterministik yang lahir dari templat sebagai draf di basis aturan, sehingga batas kata cukup ditetapkan sekali. |
| Trigger | Panduan penelitian tahun berjalan terbit, atau ketentuan suatu skema berubah. |
| Type | External |
| Pre-condition | Tim Kerja DPPM sudah masuk ke sistem dengan hak pengelola. Daftar skema pendanaan periode berjalan sudah tersedia. |
| Post-condition | Templat versi baru tersimpan dengan periode berlakunya dan dapat dipakai pengusul. Butir cek deterministik turunannya tersedia sebagai draf di basis aturan. Versi lama tersimpan sebagai arsip. |
| Relationships | Association: Tim Kerja DPPM / Include: — / Extend: — / Generalization: — |
| Normal Flow of Events | 1. Tim Kerja DPPM memilih skema yang templatnya akan disusun. / 2. Sistem menampilkan templat yang berlaku untuk skema itu. / 3. Tim Kerja DPPM menetapkan daftar bagian proposal, batas jumlah kata tiap bagian, dan lampiran yang wajib. / 4. Tim Kerja DPPM menetapkan periode berlaku templat. / 5. Sistem memeriksa kelengkapan isian templat. / 6. Sistem menyimpan templat sebagai versi baru dan menerbitkannya untuk pengusul. / 7. Sistem membuat butir cek deterministik turunan templat (bagian wajib, batas kata tiap bagian, lampiran wajib) sebagai draf di basis aturan, untuk ditinjau di UC-02. |
| SubFlows | S-1 (langkah 2) Skema belum punya templat: sistem menyediakan templat kosong, lalu lanjut ke langkah 3. / S-2 (langkah 5) Isian belum lengkap: sistem menunjukkan bagian yang belum diisi, Tim Kerja DPPM melengkapinya, lalu kembali ke langkah 5. |
| Alternate/Exceptional Flows | 6a. Masa pengusulan skema itu sedang berjalan: sistem tidak menerbitkan perubahan, supaya semua pengusul dinilai dengan templat yang sama. Templat disimpan sebagai draf untuk periode berikutnya, dan use case berhenti. |

## UC-02 Mengelola aturan pemeriksaan
Tabel 7.3 Deskripsi UC-02 Mengelola aturan pemeriksaan
| Bagian | Isi |
| Use Case Name | Mengelola aturan pemeriksaan |
| ID | UC-02 |
| Importance Level | Tinggi |
| Primary Actor | Tim Kerja DPPM |
| Use Case Type | Detail, Essential |
| Stakeholders and Interests | Tim Kerja DPPM: aturan sesuai borang dan review points tahun berjalan. / Reviewer: rekomendasi sistem konsisten antarproposal. / Pengusul: hasil pemeriksaan bisa dijelaskan. |
| Brief Description | Tim Kerja DPPM meninjau butir cek turunan templat yang dibuat otomatis oleh UC-01, lalu menyusun butir yang tidak berasal dari templat: aturan sitasi dan kata kunci (deterministik), serta seluruh butir semantik beserta pertanyaan pemeriksaannya. Nilai butir turunan templat terkunci dan hanya bisa diubah lewat templat, supaya batasnya tidak ditetapkan dua kali. |
| Trigger | Butir turunan templat baru dibuat karena templat diterbitkan (UC-01), atau hasil pemantauan (UC-04) menandai butir yang sering dikoreksi. |
| Type | External |
| Pre-condition | Templat skema sudah diterbitkan dan butir turunannya tersedia (UC-01). Tim Kerja DPPM sudah masuk ke sistem dengan hak pengelola. |
| Post-condition | Basis aturan versi baru tersimpan dengan tanggal berlakunya dan tercatat di log audit. |
| Relationships | Association: Tim Kerja DPPM / Include: — / Extend: — / Generalization: — |
| Normal Flow of Events | 1. Tim Kerja DPPM memilih skema dan periode seleksi. / 2. Sistem menampilkan butir cek yang berlaku beserta jenisnya, termasuk butir turunan templat yang nilainya terkunci. / 3. Tim Kerja DPPM menambah, mengubah, atau menonaktifkan butir cek yang tidak berasal dari templat. / 4. Tim Kerja DPPM menetapkan parameter tiap butir tersebut: aturan hitung untuk butir deterministik (sitasi, kata kunci), atau pertanyaan pemeriksaan dan contoh jawaban untuk butir semantik. / 5. Sistem menguji aturan pada contoh proposal periode sebelumnya dan menampilkan hasilnya. / 6. Tim Kerja DPPM menetapkan tanggal berlaku. / 7. Sistem menyimpan basis aturan sebagai versi baru dan mencatatnya di log audit. |
| SubFlows | S-1 (langkah 5) Hasil uji belum sesuai harapan: Tim Kerja DPPM memperbaiki parameter, lalu kembali ke langkah 5. |
| Alternate/Exceptional Flows | 3a. Tim Kerja DPPM mencoba mengubah nilai butir turunan templat, misalnya batas kata: sistem menolak dan mengarahkan ke UC-01. Use case berhenti. / 6a. Tanggal berlaku jatuh di tengah masa pengusulan yang sedang berjalan: sistem menolak, karena proposal dalam satu periode harus dinilai dengan aturan yang sama. Use case berhenti. |

## UC-03 Menugaskan reviewer
Tabel 7.4 Deskripsi UC-03 Menugaskan reviewer
| Bagian | Isi |
| Use Case Name | Menugaskan reviewer |
| ID | UC-03 |
| Importance Level | Sedang |
| Primary Actor | Tim Kerja DPPM |
| Use Case Type | Detail, Essential |
| Stakeholders and Interests | Tim Kerja DPPM: semua proposal tertugaskan cepat dan adil. / Reviewer: beban kerja rata dan sesuai kesediaan. / Pengusul: dinilai reviewer dari institusi lain. |
| Brief Description | Setelah masa pengusulan ditutup, sistem menyusun usulan penugasan otomatis (reviewer dari institusi berbeda, beban rata). Tim Kerja DPPM meninjau dan menetapkannya, lalu penugasan dikirim ke BIMA. |
| Trigger | Masa pengusulan ditutup. |
| Type | Temporal |
| Pre-condition | Daftar reviewer yang bersedia beserta institusinya tersedia di BIMA. Tim Kerja DPPM sudah masuk ke sistem. |
| Post-condition | Setiap proposal terkirim punya reviewer yang ditetapkan, dan penugasannya tercatat di BIMA. |
| Relationships | Association: Tim Kerja DPPM, «system» BIMA / Include: — / Extend: — / Generalization: — |
| Normal Flow of Events | 1. Tim Kerja DPPM menetapkan batas beban reviewer pada periode yang sedang berlangsung. / 2. Sistem menarik daftar reviewer yang bersedia beserta institusinya dari BIMA. / 3. Sistem membagi proposal terkirim ke reviewer dari institusi yang berbeda dengan pengusul, dengan beban rata. / 4. Sistem menampilkan usulan penugasan beserta sebaran beban tiap reviewer. / 5. Tim Kerja DPPM meninjau usulan penugasan. / 6. Tim Kerja DPPM menetapkan penugasan. / 7. Sistem mengirim penugasan ke BIMA dan memberi notifikasi kepada reviewer. |
| SubFlows | S-1 (langkah 2) Jumlah reviewer tidak cukup untuk batas beban, maka akan memperlihatkan kekurangannya dan Tim Kerja DPPM dapat mengubah batas beban sesuai kebutuhan atau menambahkan reviewer lain ke BIMA, lalu kembali ke langkah 2. / S-2 (langkah 5) Tim Kerja DPPM memindahkan sebagian proposal ke reviewer lain: sistem memeriksa ulang syarat institusi dan beban, lalu kembali ke langkah 4. |
| Alternate/Exceptional Flows | - |

## UC-04 Memantau kesesuaian penilaian
Tabel 7.5 Deskripsi UC-04 Memantau kesesuaian penilaian
| Bagian | Isi |
| Use Case Name | Memantau kesesuaian penilaian |
| ID | UC-04 |
| Importance Level | Rendah |
| Primary Actor | Tim Kerja DPPM |
| Use Case Type | Detail, Essential |
| Stakeholders and Interests | Tim Kerja DPPM: tahu seberapa sering rekomendasi sistem dikoreksi dan butir mana yang bermasalah. / Pimpinan DPPM: bukti akuntabilitas pemakaian AI. / Reviewer: koreksi mereka ditindaklanjuti. |
| Brief Description | Tim Kerja DPPM melihat tingkat kesesuaian rekomendasi sistem dengan keputusan reviewer per butir, skema, dan periode, beserta alasan koreksi dan butir deterministik yang paling sering gagal, sebagai dasar memperbaiki aturan. |
| Trigger | Tim Kerja DPPM ingin meninjau mutu pemeriksaan, misalnya di akhir periode seleksi. |
| Type | External |
| Pre-condition | Sudah ada penilaian reviewer yang final pada periode yang dipilih. |
| Post-condition | Laporan kesesuaian ditampilkan. Butir yang sering dikoreksi oleh reviewer ditandai sebagai bahan evaluasi UC-02. |
| Relationships | Association: Tim Kerja DPPM / Include: — / Extend: — / Generalization: — |
| Normal Flow of Events | 1. Tim Kerja DPPM memilih periode dan skema. / 2. Sistem menampilkan rekap butir deterministik yang paling sering gagal saat pengajuan, per institusi. / 3. Sistem menghitung persentase rekomendasi yang disetujui reviewer untuk setiap butir. / 4. Sistem menampilkan butir dengan tingkat koreksi tertinggi beserta alasan koreksi reviewer. / 5. Tim Kerja DPPM menandai butir yang aturannya perlu diperbaiki. / 6. Sistem menyimpan tanda tersebut sebagai bahan perbaikan aturan (UC-02). |
| SubFlows | S-1 (langkah 4) Tim Kerja DPPM membuka rincian satu butir: sistem menampilkan contoh rekomendasi, kutipan, dan keputusan reviewer, lalu kembali ke langkah 4. |
| Alternate/Exceptional Flows | — |

## UC-05 Mengajukan proposal
Tabel 7.6 Deskripsi UC-05 Mengajukan proposal
| Bagian | Isi |
| Use Case Name | Mengajukan proposal |
| ID | UC-05 |
| Importance Level | Tinggi |
| Primary Actor | Pengusul |
| Use Case Type | Detail, Essential |
| Stakeholders and Interests | Pengusul: tahu kesalahan administratif saat itu juga dan bisa memperbaikinya sebelum tenggat. / Tim Kerja DPPM: hanya proposal yang lolos semua butir deterministik yang masuk seleksi. / Reviewer: tidak perlu lagi memeriksa butir deterministik. |
| Brief Description | Pengusul mengajukan proposal yang disusun dengan templat. Sistem menarik berkas dari BIMA dan memeriksa butir deterministik. Proposal baru tercatat terkirim bila semua butir deterministik lolos. |
| Trigger | Pengusul mengajukan proposal di BIMA dalam masa pengusulan. |
| Type | External |
| Pre-condition | Pengusul sudah masuk ke BIMA. Masa pengusulan sedang berjalan. Proposal disusun dengan templat skema yang berlaku (UC-01). |
| Post-condition | Proposal tercatat terkirim dengan semua butir deterministik lolos. Hasil pemeriksaan per butir tersimpan, dan pengusul menerima bukti pengiriman. |
| Relationships | Association: Pengusul, «system» BIMA / Include: UC-06 Memeriksa butir deterministik / Extend: — / Generalization: — |
| Normal Flow of Events | 1. Pengusul mengajukan proposal beserta lampirannya di BIMA. / 2. Sistem menarik berkas proposal dan metadatanya dari BIMA. / 3. Sistem memotong teks proposal per bagian sesuai templat skema. / 4. Sistem menjalankan UC-06 Memeriksa butir deterministik. / 5. Sistem menampilkan hasil setiap butir beserta angka pembuktinya. / 6. Sistem mencatat proposal terkirim dan memberikan bukti pengiriman kepada pengusul. |
| SubFlows | S-1 (langkah 5) Ada butir deterministik yang gagal: sistem menahan pengiriman dan menunjukkan butir, bagian, serta batas yang dilanggar, pengusul memperbaiki proposal lalu kembali ke langkah 1. |
| Alternate/Exceptional Flows | 1a. Masa pengusulan sudah ditutup: sistem menolak pengajuan, dan use case berhenti. |

## UC-06 Memeriksa butir deterministik
Tabel 7.7 Deskripsi UC-06 Memeriksa butir deterministik
| Bagian | Isi |
| Use Case Name | Memeriksa butir deterministik |
| ID | UC-06 |
| Importance Level | Tinggi |
| Primary Actor | — (dijalankan sistem di dalam UC-05) |
| Use Case Type | Detail, Essential |
| Stakeholders and Interests | Pengusul: hasil pasti dan bisa dibuktikan dengan angka. / Tim Kerja DPPM: aturan diterapkan sama untuk semua proposal. |
| Brief Description | Sistem memeriksa butir yang bisa dihitung pasti pada setiap bagian proposal dengan basis aturan yang berlaku. |
| Trigger | Dipanggil oleh UC-05. |
| Type | Internal |
| Pre-condition | Teks proposal sudah dipotong per bagian. Basis aturan skema yang berlaku tersedia (UC-02). |
| Post-condition | Status lolos atau gagal setiap butir deterministik beserta angka pembuktinya tersimpan. |
| Relationships | Association: — / Include: — / Extend: — / Generalization: — |
| Normal Flow of Events | 1. Sistem mengambil butir deterministik yang berlaku untuk skema proposal. / 2. Sistem mencocokkan berkas dengan templat skema dan judul di BIMA. / 3. Sistem menghitung jumlah kata tiap bagian (diagram, tabel, dan gambar tidak dihitung) dan membandingkannya dengan batas. / 4. Sistem memeriksa kata kunci: tepat lima dan dipisahkan titik koma. / 5. Sistem memeriksa sitasi bernomor, urutan daftar pustaka, dan kesamaan jumlah referensi dengan yang dikutip. / 6. Sistem memeriksa keberadaan lampiran wajib. / 7. Sistem menyimpan status setiap butir beserta angka pembuktinya. |
| SubFlows | — |
| Alternate/Exceptional Flows | — |

## UC-07 Melakukan pemeriksaan akhir
Tabel 7.8 Deskripsi UC-07 Melakukan pemeriksaan akhir
| Bagian | Isi |
| Use Case Name | Melakukan pemeriksaan akhir |
| ID | UC-07 |
| Importance Level | Tinggi |
| Primary Actor | Reviewer |
| Use Case Type | Detail, Essential |
| Stakeholders and Interests | Reviewer: waktu periksa singkat, dan keputusan tetap di tangannya. / Pengusul: keputusan beralasan dan umpan balik jelas. / Tim Kerja DPPM: keputusan terekam utuh untuk audit. |
| Brief Description | Reviewer memeriksa isi per bagian proposal yang ditugaskan dengan bantuan rekomendasi sistem dan kutipan, memutuskan setiap komponen borang, dan menulis umpan balik. Keputusan dikirim ke BIMA. |
| Trigger | Reviewer membuka proposal yang ditugaskan kepadanya. |
| Type | External |
| Pre-condition | Proposal sudah ditugaskan kepada reviewer (UC-03). Reviewer sudah masuk ke sistem. |
| Post-condition | Keputusan setiap komponen dan umpan balik tersimpan permanen, tercatat di log audit, dan terkirim ke BIMA. |
| Relationships | Association: Reviewer, «system» BIMA / Include: UC-09 Memeriksa butir semantik / Extend: diperluas oleh UC-08 Mengoreksi rekomendasi sistem (extension point: langkah 4, reviewer tidak setuju dengan rekomendasi) / Generalization: — |
| Normal Flow of Events | 1. Sistem menjalankan UC-09 Memeriksa butir semantik. / 2. Reviewer membuka proposal yang ditugaskan. / 3. Sistem menampilkan rekomendasi setiap butir isi beserta kutipan dari proposal, per bagian. / 4. Reviewer memverifikasi setiap rekomendasi terhadap kutipan dan isi bagian. / 5. Reviewer menetapkan keputusan setiap komponen borang. / 6. Reviewer menulis umpan balik untuk pengusul. / 7. Reviewer menyimpan penilaian secara permanen. / 8. Sistem mencatat penilaian di log audit dan mengirim keputusan serta umpan balik ke BIMA. |
| SubFlows | S-1 (langkah 6) Reviewer menyimpan sementara untuk dilanjutkan nanti: sistem menyimpan draf penilaian. Saat proposal dibuka lagi, alur kembali ke langkah 4. |
| Alternate/Exceptional Flows | — |

## UC-08 Mengoreksi rekomendasi sistem
Tabel 7.9 Deskripsi UC-08 Mengoreksi rekomendasi sistem
| Bagian | Isi |
| Use Case Name | Mengoreksi rekomendasi sistem |
| ID | UC-08 |
| Importance Level | Sedang |
| Primary Actor | - |
| Use Case Type | Detail, Essential |
| Stakeholders and Interests | Reviewer: bisa menolak rekomendasi yang keliru. / Tim Kerja DPPM: alasan koreksi menjadi bahan perbaikan aturan (UC-04, UC-02). / Pengusul: keputusan akhir tetap dibuat manusia. |
| Brief Description | Saat reviewer tidak setuju dengan rekomendasi suatu butir, ia mengganti rekomendasi itu dengan keputusannya sendiri dan wajib menuliskan alasannya. |
| Trigger | Reviewer menyatakan tidak setuju dengan rekomendasi pada langkah verifikasi UC-07. |
| Type | External |
| Pre-condition | UC-07 sedang berjalan, dan rekomendasi butir sudah ditampilkan. |
| Post-condition | Keputusan reviewer menggantikan rekomendasi pada butir itu. Koreksi beserta alasannya tersimpan untuk pemantauan. |
| Relationships | Association: — / Include: — / Extend: memperluas UC-07 Melakukan pemeriksaan akhir (extension point: langkah 4) / Generalization: — |
| Normal Flow of Events | 1. Reviewer memilih butir yang rekomendasinya tidak ia setujui. / 2. Sistem menampilkan rekomendasi, kutipan, dan alasan sistem untuk butir itu. / 3. Reviewer menetapkan keputusannya sendiri untuk butir itu. / 4. Reviewer menulis alasan koreksi dan memilih jenis kekeliruan sistem, misalnya kutipan salah tempat atau salah tafsir isi. / 5. Sistem menyimpan koreksi beserta alasannya, lalu kembali ke UC-07 langkah 5. |
| SubFlows | S-1 (langkah 4) Alasan belum diisi: sistem meminta alasan karena wajib, lalu kembali ke langkah 4. |
| Alternate/Exceptional Flows | 3a. Reviewer membatalkan koreksi: rekomendasi semula tetap berlaku. Use case berhenti, dan reviewer kembali ke UC-07 langkah 4. |

## UC-09 Memeriksa butir semantik
Tabel 7.10 Deskripsi UC-09 Memeriksa butir semantik
| Bagian | Isi |
| Use Case Name | Memeriksa butir semantik |
| ID | UC-09 |
| Importance Level | Tinggi |
| Primary Actor | — (dijalankan sistem di dalam UC-07). Aktor pendukung: «system» Layanan LLM |
| Use Case Type | Detail, Essential |
| Stakeholders and Interests | Reviewer: rekomendasi disertai kutipan yang bisa dicek. / Tim Kerja DPPM: kerahasiaan isi proposal terjaga. / Pengusul: identitasnya tidak ikut dikirim keluar. |
| Brief Description | Sistem mengirim teks bagian yang relevan ke Layanan LLM bersama pertanyaan pemeriksaan setiap butir semantik, lalu menerima rekomendasi beserta kutipan dan tingkat keyakinan. |
| Trigger | Dipanggil oleh UC-07. |
| Type | Internal |
| Pre-condition | Proposal sudah terkirim dengan semua butir deterministik lolos. Aturan semantik skema tersedia (UC-02). |
| Post-condition | Rekomendasi, kutipan, dan tingkat keyakinan setiap butir semantik tersimpan, atau butir ditandai "belum ada rekomendasi". |
| Relationships | Association: «system» Layanan LLM / Include: — / Extend: — / Generalization: — |
| Normal Flow of Events | 1. Sistem mengambil butir semantik yang berlaku untuk skema proposal. / 2. Sistem menyiapkan teks bagian yang relevan untuk setiap butir, tanpa identitas pengusul. / 3. Sistem mengirim teks dan pertanyaan pemeriksaan ke Layanan LLM. / 4. Layanan LLM mengembalikan rekomendasi (memenuhi atau tidak memenuhi), kutipan pendukung, dan tingkat keyakinan. / 5. Sistem memastikan kutipan benar-benar ada di teks proposal. / 6. Sistem menyimpan rekomendasi setiap butir. |
| SubFlows | S-1 (langkah 5) Kutipan tidak ditemukan di teks: sistem menandai rekomendasi butir itu "perlu diperiksa manual", lalu lanjut ke langkah 6. / S-2 (langkah 4) Layanan LLM tidak merespons setelah dua kali percobaan: sistem menandai butir "belum ada rekomendasi", lalu lanjut ke langkah 6. |
| Alternate/Exceptional Flows | — |
