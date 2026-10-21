**UNIVERSITAS INDONESIA**

**SYSTEM PROPOSAL**

**SISTEM REKOMENDASI PENILAIAN ADMINISTRASI PROPOSAL PENELITIAN BERBASIS AI**

**PADA BIMA, DIREKTORAT PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT, KEMDIKTISAINTEK**

**<span class="mark">SYSTEM PROPOSAL DAN DESAIN SISTEM</span>**

**CSIM801012 Requirements Analysis, Design and Implementation of Information Systems**

**Kelas AKPSI-2026SA, Dosen: Farisya Setiadi**

**KELOMPOK A1**

| Nama                        | NPM        |
|-----------------------------|------------|
| Muhammad Arsy Rizkia Ruslan | 2606769766 |
| Ibrahim Abdullah            | 2606769596 |
| Anita Kusumaningtyas        | 2606769375 |
| Muhammad Emir Ghiffari      | 2606845951 |
| Rohmad Atkha                | 2606846222 |

**FAKULTAS ILMU KOMPUTER**

**PROGRAM STUDI MAGISTER TEKNOLOGI INFORMASI**

**JAKARTA**

**Oktober 2026**

**DAFTAR ISI**

[1. RINGKASAN EKSEKUTIF [14](#ringkasan-eksekutif)](#ringkasan-eksekutif)

[2. SYSTEM REQUEST [15](#system-request)](#system-request)

[2.1 Project Sponsor [15](#project-sponsor)](#project-sponsor)

[2.2 Business Need [15](#business-need)](#business-need)

[2.3 Business Requirements [15](#business-requirements)](#business-requirements)

[2.4 Business Value [16](#business-value)](#business-value)

[2.5 Special Issues or Constraints [16](#special-issues-or-constraints)](#special-issues-or-constraints)

[3. ANALISIS KELAYAKAN [17](#analisis-kelayakan)](#analisis-kelayakan)

[3.1 Kerangka Analisis [17](#kerangka-analisis)](#kerangka-analisis)

[3.2 Kelayakan Teknis [17](#kelayakan-teknis)](#kelayakan-teknis)

[3.3 Kelayakan Ekonomi [18](#kelayakan-ekonomi)](#kelayakan-ekonomi)

[3.3.1 Parameter dan Asumsi [18](#parameter-dan-asumsi)](#parameter-dan-asumsi)

[3.3.2 Biaya [19](#biaya)](#biaya)

[3.3.3 Manfaat [20](#manfaat)](#manfaat)

[3.3.4 Arus Kas dan Ukuran Kelayakan [21](#arus-kas-dan-ukuran-kelayakan)](#arus-kas-dan-ukuran-kelayakan)

[3.3.5 Biaya Inkremental: Apa yang Dibeli dengan Selisihnya [22](#biaya-inkremental-apa-yang-dibeli-dengan-selisihnya)](#biaya-inkremental-apa-yang-dibeli-dengan-selisihnya)

[3.4 Kelayakan Organisasi [22](#kelayakan-organisasi)](#kelayakan-organisasi)

[3.4.1 Keselarasan Strategis [23](#keselarasan-strategis)](#keselarasan-strategis)

[3.4.2 Analisis Pemangku Kepentingan [23](#analisis-pemangku-kepentingan)](#analisis-pemangku-kepentingan)

[3.4.3 Hasil Kuesioner Reviewer [23](#hasil-kuesioner-reviewer)](#hasil-kuesioner-reviewer)

[4. DEFINISI KEBUTUHAN [25](#definisi-kebutuhan)](#definisi-kebutuhan)

[4.1 Kebutuhan Fungsional [25](#kebutuhan-fungsional)](#kebutuhan-fungsional)

[4.2 Kebutuhan Non-Fungsional [26](#kebutuhan-non-fungsional)](#kebutuhan-non-fungsional)

[5. STRATEGI ANALISIS KEBUTUHAN DAN HASIL *AS-IS* VERSUS *TO-BE* [28](#strategi-analisis-kebutuhan-dan-hasil-as-is-versus-to-be)](#strategi-analisis-kebutuhan-dan-hasil-as-is-versus-to-be)

[5.1 Strategi Analisis yang Dipilih [28](#strategi-analisis-yang-dipilih)](#strategi-analisis-yang-dipilih)

[5.2 Teknik Pengumpulan Kebutuhan [29](#teknik-pengumpulan-kebutuhan)](#teknik-pengumpulan-kebutuhan)

[5.3 Proses As-Is [30](#proses-as-is)](#proses-as-is)

[5.4 Proses To-Be [33](#proses-to-be)](#proses-to-be)

[6. MODEL FUNGSIONAL [36](#model-fungsional)](#model-fungsional)

[6.1 Use Case Diagram [36](#use-case-diagram)](#use-case-diagram)

[6.2 Use Case Description [37](#use-case-description)](#use-case-description)

[UC-01 Mengelola templat proposal [37](#uc-01-mengelola-templat-proposal)](#uc-01-mengelola-templat-proposal)

[UC-02 Mengelola aturan pemeriksaan [38](#uc-02-mengelola-aturan-pemeriksaan)](#uc-02-mengelola-aturan-pemeriksaan)

[UC-03 Menugaskan reviewer [39](#uc-03-menugaskan-reviewer)](#uc-03-menugaskan-reviewer)

[UC-04 Memantau kesesuaian penilaian [40](#uc-04-memantau-kesesuaian-penilaian)](#uc-04-memantau-kesesuaian-penilaian)

[UC-05 Mengajukan proposal [41](#uc-05-mengajukan-proposal)](#uc-05-mengajukan-proposal)

[UC-06 Memeriksa butir deterministik [42](#uc-06-memeriksa-butir-deterministik)](#uc-06-memeriksa-butir-deterministik)

[UC-07 Melakukan pemeriksaan akhir [43](#uc-07-melakukan-pemeriksaan-akhir)](#uc-07-melakukan-pemeriksaan-akhir)

[UC-08 Mengoreksi rekomendasi sistem [44](#uc-08-mengoreksi-rekomendasi-sistem)](#uc-08-mengoreksi-rekomendasi-sistem)

[UC-09 Memeriksa butir semantik [45](#uc-09-memeriksa-butir-semantik)](#uc-09-memeriksa-butir-semantik)

[6.3 Activity Diagram [46](#activity-diagram)](#activity-diagram)

[7. MODEL STRUKTURAL [47](#model-struktural)](#model-struktural)

[7.1 Kartu CRC [47](#kartu-crc)](#kartu-crc)

[Kartu C01 — TimKerjaDPPM [47](#kartu-c01-timkerjadppm)](#kartu-c01-timkerjadppm)

[Kartu C02 — Pengusul [47](#kartu-c02-pengusul)](#kartu-c02-pengusul)

[Kartu C03 — Reviewer [48](#kartu-c03-reviewer)](#kartu-c03-reviewer)

[Kartu C04 — PeriodeSeleksi [49](#kartu-c04-periodeseleksi)](#kartu-c04-periodeseleksi)

[Kartu C05 — SkemaPendanaan [50](#kartu-c05-skemapendanaan)](#kartu-c05-skemapendanaan)

[Kartu C06 — TemplatProposal [50](#kartu-c06-templatproposal)](#kartu-c06-templatproposal)

[Kartu C07 — BagianTemplat [51](#kartu-c07-bagiantemplat)](#kartu-c07-bagiantemplat)

[Kartu C08 — BasisAturan [52](#kartu-c08-basisaturan)](#kartu-c08-basisaturan)

[Kartu C09 — ButirCek [53](#kartu-c09-butircek)](#kartu-c09-butircek)

[Kartu C10 — Proposal [53](#kartu-c10-proposal)](#kartu-c10-proposal)

[Kartu C11 — VersiProposal [54](#kartu-c11-versiproposal)](#kartu-c11-versiproposal)

[Kartu C12 — HasilPemeriksaan [55](#kartu-c12-hasilpemeriksaan)](#kartu-c12-hasilpemeriksaan)

[Kartu C13 — PenugasanReviewer [56](#kartu-c13-penugasanreviewer)](#kartu-c13-penugasanreviewer)

[Kartu C14 — Penilaian [56](#kartu-c14-penilaian)](#kartu-c14-penilaian)

[Kartu C15 — KoreksiRekomendasi [57](#kartu-c15-koreksirekomendasi)](#kartu-c15-koreksirekomendasi)

[7.2 *Class Diagram* [59](#class-diagram)](#class-diagram)

[8. MODEL PERILAKU [62](#model-perilaku)](#model-perilaku)

[8.1 Sequence Diagram [62](#sequence-diagram)](#sequence-diagram)

[Sequence Diagram UC-01 Mengelola templat proposal [62](#sequence-diagram-uc-01-mengelola-templat-proposal)](#sequence-diagram-uc-01-mengelola-templat-proposal)

[Sequence Diagram UC-02 Mengelola Aturan Pemeriksaan [64](#sequence-diagram-uc-02-mengelola-aturan-pemeriksaan)](#sequence-diagram-uc-02-mengelola-aturan-pemeriksaan)

[Sequence Diagram UC-03 Menugaskan Reviewer [65](#sequence-diagram-uc-03-menugaskan-reviewer)](#sequence-diagram-uc-03-menugaskan-reviewer)

[Sequence Diagram UC-04 Memantau kesesuaian penilaian [65](#sequence-diagram-uc-04-memantau-kesesuaian-penilaian)](#sequence-diagram-uc-04-memantau-kesesuaian-penilaian)

[Sequence Diagram UC-05 Mengajukan Proposal [66](#sequence-diagram-uc-05-mengajukan-proposal)](#sequence-diagram-uc-05-mengajukan-proposal)

[Sequence Diagram UC-06 Memeriksa butir deterministik [67](#sequence-diagram-uc-06-memeriksa-butir-deterministik)](#sequence-diagram-uc-06-memeriksa-butir-deterministik)

[Sequence Diagram UC-07 Melakukan pemeriksaan akhir [67](#sequence-diagram-uc-07-melakukan-pemeriksaan-akhir)](#sequence-diagram-uc-07-melakukan-pemeriksaan-akhir)

[Sequence Diagram UC-08 Mengoreksi rekomendasi sistem [68](#sequence-diagram-uc-08-mengoreksi-rekomendasi-sistem)](#sequence-diagram-uc-08-mengoreksi-rekomendasi-sistem)

[Sequence Diagram UC-09 Memeriksa butir semantik [68](#sequence-diagram-uc-09-memeriksa-butir-semantik)](#sequence-diagram-uc-09-memeriksa-butir-semantik)

[8.2 *Communication Diagram* [68](#communication-diagram)](#communication-diagram)

[9.2.1 Communication Diagram UC-01 [70](#communication-diagram-uc-01)](#communication-diagram-uc-01)

[9.2.2 Communication Diagram UC-02 [72](#communication-diagram-uc-02)](#communication-diagram-uc-02)

[9.2.3 Communication Diagram UC-03 [73](#communication-diagram-uc-03)](#communication-diagram-uc-03)

[9.2.4 Communication Diagram UC-04 [75](#communication-diagram-uc-04)](#communication-diagram-uc-04)

[9.2.5 Communication Diagram UC-05 [76](#communication-diagram-uc-05)](#communication-diagram-uc-05)

[9.2.6 Communication Diagram UC-06 [77](#communication-diagram-uc-06)](#communication-diagram-uc-06)

[9.2.7 Communication Diagram UC-07 [78](#communication-diagram-uc-07)](#communication-diagram-uc-07)

[9.2.8 Communication Diagram UC-08 [80](#communication-diagram-uc-08)](#communication-diagram-uc-08)

[9.2.9 Communication Diagram UC-09 [80](#communication-diagram-uc-09)](#communication-diagram-uc-09)

[8.3 *Behavioral State Machine* [81](#behavioral-state-machine)](#behavioral-state-machine)

[9.3.1 Behavioral State Machine [82](#behavioral-state-machine-1)](#behavioral-state-machine-1)

[8.4 *Matriks CRUDE* [82](#matriks-crude)](#matriks-crude)

[9. WORKPLAN [84](#workplan)](#workplan)

[9.1 Metode Pengembangan Sistem [84](#metode-pengembangan-sistem)](#metode-pengembangan-sistem)

[9.2 Estimasi *Effort* [85](#estimasi-effort)](#estimasi-effort)

[9.3 *Work Breakdown Structure* [87](#work-breakdown-structure)](#work-breakdown-structure)

[9.4 Jadwal Proyek [89](#jadwal-proyek)](#jadwal-proyek)

[9.5 *Staffing Plan* [94](#staffing-plan)](#staffing-plan)

[10. DAFTAR PUSTAKA [97](#daftar-pustaka)](#daftar-pustaka)

[11. LAMPIRAN A: DAFTAR PERTANYAAN WAWANCARA PEMILIK KASUS DAN DPPM [100](#lampiran-b-daftar-pertanyaan-wawancara-pemilik-kasus-dan-dppm)](#lampiran-b-daftar-pertanyaan-wawancara-pemilik-kasus-dan-dppm)

[12. LAMPIRAN B: KUESIONER REVIEWER DAN REKAPITULASI JAWABAN [102](#lampiran-c-kuesioner-reviewer-dan-rekapitulasi-jawaban)](#lampiran-c-kuesioner-reviewer-dan-rekapitulasi-jawaban)

**DAFTAR GAMBAR**

[Gambar 5.1 Use Case As-is [28](#_Toc243182766)](#_Toc243182766)

[Gambar 5.2 Proses as-is seleksi administrasi [28](#_Toc243182767)](#_Toc243182767)

[Gambar 5.3 Use case diagram to - be [30](#_Toc243182768)](#_Toc243182768)

[Gambar 6.1 Use case diagram sistem rekomendasi penilaian administrasi [33](#_Toc243182769)](#_Toc243182769)

[Gambar 6.2 Activity diagram proses seleksi administrasi [43](#_Toc243182770)](#_Toc243182770)

[Gambar 7.1 Class Diagram [56](#_Toc243182771)](#_Toc243182771)

[Gambar 8.1 Sequence diagram UC-01 Mengelola templat proposal [60](#_Toc243182772)](#_Toc243182772)

[Gambar 8.2 Sequence diagram UC-02 Mengelola aturan pemeriksaan [62](#_Toc243182773)](#_Toc243182773)

[Gambar 8.3 Sequence diagram UC-04 Memantau kesesuaian penilaian [63](#_Toc243182774)](#_Toc243182774)

[Gambar 8.4 Sequence diagram UC-05 Mengajukan Proposal [63](#_Toc243182775)](#_Toc243182775)

[Gambar 8.5 Sequence Diagram UC-06 Memeriksa butir deterministik [64](#_Toc243182776)](#_Toc243182776)

[Gambar 8.6 Sequence Diagram UC-07 Melakukan pemeriksaan akhir [64](#_Toc243182777)](#_Toc243182777)

[Gambar 8.7 Sequence Diagram UC-08 Mengoreksi rekomendasi sistem [65](#_Toc243182778)](#_Toc243182778)

[Gambar 8.8 Sequence Diagram UC-09 Memeriksa butir semantik [65](#_Toc243182779)](#_Toc243182779)

[Gambar 8.9 Communication Diagram UC-01 Mengelola templat proposal [67](#_Toc243182780)](#_Toc243182780)

[Gambar 8.10 Communication diagram UC-02 Mengelola aturan pemeriksaan [69](#_Toc243182781)](#_Toc243182781)

[Gambar 8.11 Communication diagram UC-03 Menugaskan reviewer [71](#_Toc243182782)](#_Toc243182782)

[Gambar 8.12 Communication diagram UC-04 Memantau kesesuaian penilaian [72](#_Toc243182783)](#_Toc243182783)

[Gambar 8.13 Communication diagram UC-05 Mengajukan proposal [74](#_Toc243182784)](#_Toc243182784)

[Gambar 8.14 Communication diagram UC-06 Memeriksa butir deterministik [75](#_Toc243182785)](#_Toc243182785)

[Gambar 8.15 Communication diagram UC-07 Melakukan pemeriksaan akhir [76](#_Toc243182786)](#_Toc243182786)

[Gambar 8.16 Communication diagram UC-08 Mengoreksi rekomendasi sistem [77](#_Toc243182787)](#_Toc243182787)

[Gambar 8.17 Communication diagram UC-09 Memeriksa butir semantik [78](#_Toc243182788)](#_Toc243182788)

[Gambar 8.18 State machine TemplatProposal [79](#_Toc243182789)](#_Toc243182789)

[Gambar 8.19 State machine ButirCek [79](#_Toc243182790)](#_Toc243182790)

[Gambar 9.1 Struktur work breakdown structure proyek [84](#_Toc243182791)](#_Toc243182791)

[Gambar 9.2 Jaringan AON dan jalur kritis [88](#_Toc243182792)](#_Toc243182792)

[Gambar 9.3 Gantt chart proyek [89](#_Toc243182793)](#_Toc243182793)

[Gambar 9.4 Struktur tim proyek [91](#_Toc243182794)](#_Toc243182794)

**DAFTAR TABEL**

[Tabel 2.1 Business Requirements [12](#_Toc243182795)](#_Toc243182795)

[Tabel 3.1 Penilaian Kelayakan Teknis Per Skenario [14](#_Toc243182796)](#_Toc243182796)

[Tabel 3.2 Daftar Risiko Teknis [15](#_Toc243182797)](#_Toc243182797)

[Tabel 3.3 Parameter Analisis Ekonomi [16](#_Toc243182798)](#_Toc243182798)

[Tabel 3.4 Biaya Pengembangan (Juta Rupiah) [16](#_Toc243182799)](#_Toc243182799)

[Tabel 3.5 Biaya Operasional Tahunan (Juta Rupiah) [17](#_Toc243182800)](#_Toc243182800)

[Tabel 3.6 Manfaat Terukur [17](#_Toc243182801)](#_Toc243182801)

[Tabel 3.7 Arus Kas Lima Tahun (Juta Rupiah) [18](#_Toc243182802)](#_Toc243182802)

[Tabel 3.8 NPV, ROI, dan Break-even Point [18](#_Toc243182803)](#_Toc243182803)

[Tabel 3.9 Biaya Inkremental Antar Skenario [19](#_Toc243182804)](#_Toc243182804)

[Tabel 3.10 Analisis Pemangku Kepentingan [20](#_Toc243182805)](#_Toc243182805)

[Tabel 3.11 Hasil Kuesioner Reviewer (n = 6, skala 1–5) [20](#_Toc243182806)](#_Toc243182806)

[Tabel 4.1 Kebutuhan Fungsional [22](#_Toc243182807)](#_Toc243182807)

[Tabel 4.2 Kebutuhan non-fungsional [23](#_Toc243182808)](#_Toc243182808)

[Tabel 5.1 Duration analysis pemeriksaan reviewer [26](#_Toc243182809)](#_Toc243182809)

[Tabel 5.2 Aktivitas yang dihapus dan diubah [26](#_Toc243182810)](#_Toc243182810)

[Tabel 5.3 Perbandingan teknik pengumpulan kebutuhan [27](#_Toc243182811)](#_Toc243182811)

[Tabel 5.4 Langkah proses as-is [29](#_Toc243182812)](#_Toc243182812)

[Tabel 5.5 Katalog butir seleksi administrasi 2026 [29](#_Toc243182813)](#_Toc243182813)

[Tabel 5.6 Langkah proses to-be [31](#_Toc243182814)](#_Toc243182814)

[Tabel 6.1 Daftar use case dan jumlah transaksinya [33](#_Toc243182815)](#_Toc243182815)

[Tabel 6.2 Deskripsi UC-01 Mengelola templat proposal [34](#_Toc243182816)](#_Toc243182816)

[Tabel 6.3 Deskripsi UC-02 Mengelola aturan pemeriksaan [35](#_Toc243182817)](#_Toc243182817)

[Tabel 6.4 Deskripsi UC-03 Menugaskan reviewer [36](#_Toc243182818)](#_Toc243182818)

[Tabel 6.5 Deskripsi UC-04 Memantau kesesuaian penilaian [37](#_Toc243182819)](#_Toc243182819)

[Tabel 6.6 Deskripsi UC-05 Mengajukan proposal [38](#_Toc243182820)](#_Toc243182820)

[Tabel 6.7 Deskripsi UC-06 Memeriksa butir deterministik [39](#_Toc243182821)](#_Toc243182821)

[Tabel 6.8 Deskripsi UC-07 Melakukan pemeriksaan akhir [40](#_Toc243182822)](#_Toc243182822)

[Tabel 6.9 Deskripsi UC-08 Mengoreksi rekomendasi sistem [41](#_Toc243182823)](#_Toc243182823)

[Tabel 6.10 Deskripsi UC-09 Memeriksa butir semantik [42](#_Toc243182824)](#_Toc243182824)

[Tabel 7.1 Kartu C01 TimKerjaDPPM [44](#_Toc243182825)](#_Toc243182825)

[Tabel 7.2 Kartu C02 Pengusul [44](#_Toc243182826)](#_Toc243182826)

[Tabel 7.3 Kartu C03 Reviewer [45](#_Toc243182827)](#_Toc243182827)

[Tabel 7.4 Kartu C04 PeriodeSeleksi [46](#_Toc243182828)](#_Toc243182828)

[Tabel 7.5 Kartu C05 SkemaPendanaan [47](#_Toc243182829)](#_Toc243182829)

[Tabel 7.6 Kartu CRC C06 TemplatProposal [47](#_Toc243182830)](#_Toc243182830)

[Tabel 7.7 Kartu C08 BasisAturan [49](#_Toc243182831)](#_Toc243182831)

[Tabel 7.8 Kartu C09 ButirCek [50](#_Toc243182832)](#_Toc243182832)

[Tabel 7.9 Kartu C10 Proposal [51](#_Toc243182833)](#_Toc243182833)

[Tabel 7.10 Kartu C11 VersiProposal [51](#_Toc243182834)](#_Toc243182834)

[Tabel 7.11 Kartu C12 HasilPemeriksaan [52](#_Toc243182835)](#_Toc243182835)

[Tabel 7.12 Kartu C13 PenugasanReviewer [53](#_Toc243182836)](#_Toc243182836)

[Tabel 7.13 Kartu C14 Penilaian [54](#_Toc243182837)](#_Toc243182837)

[Tabel 7.14 Kartu C15 KoreksiRekomendasi [54](#_Toc243182838)](#_Toc243182838)

[Tabel 7.15 Relasi Class Diagram [57](#_Toc243182839)](#_Toc243182839)

[Tabel 8.1 Pesan UC-01 pada sequence dan communication diagram [68](#_Toc243182840)](#_Toc243182840)

[Tabel 8.2 Pesan UC-02 pada sequence dan communication diagram [70](#_Toc243182841)](#_Toc243182841)

[Tabel 8.3 Pesan UC-03 pada sequence dan communication diagram [71](#_Toc243182842)](#_Toc243182842)

[Tabel 8.4 Pesan UC-04 pada sequence dan communication diagram [73](#_Toc243182843)](#_Toc243182843)

[Tabel 8.5 Pesan UC-05 pada sequence dan communication diagram [74](#_Toc243182844)](#_Toc243182844)

[Tabel 8.6 Pesan UC-06 pada sequence dan communication diagram [75](#_Toc243182845)](#_Toc243182845)

[Tabel 8.7 Pesan UC-07 pada sequence dan communication diagram [76](#_Toc243182846)](#_Toc243182846)

[Tabel 8.8 Pesan UC-08 pada sequence dan communication diagram [77](#_Toc243182847)](#_Toc243182847)

[Tabel 8.9 Pesan UC-09 pada sequence dan communication diagram [78](#_Toc243182848)](#_Toc243182848)

[Tabel 8.10 Matriks CRUDE [79](#_Toc243182849)](#_Toc243182849)

[Tabel 9.1 Fase SDLC [81](#_Toc243182850)](#_Toc243182850)

[Tabel 9.2 Kriteria Pemilihan Metodologi [81](#_Toc243182851)](#_Toc243182851)

[Tabel 9.3 Karakterisasi Proyek Pada Enam Kriteria [82](#_Toc243182852)](#_Toc243182852)

[Tabel 9.4 Estimasi Effort [83](#_Toc243182853)](#_Toc243182853)

[Tabel 9.5 Faktor Lingkungan [83](#_Toc243182854)](#_Toc243182854)

[Tabel 9.6 Work Breakdown Structure [84](#_Toc243182855)](#_Toc243182855)

[Tabel 9.7 Jadwal Proyek [86](#_Toc243182856)](#_Toc243182856)

[Tabel 9.8 Enumerasi Jalur dan Jalur Kritis [88](#_Toc243182857)](#_Toc243182857)

[Tabel 9.9 Tabel Task Gantt Chart [90](#_Toc243182858)](#_Toc243182858)

[Tabel 9.10 Tonggak Proyek [91](#_Toc243182859)](#_Toc243182859)

[Tabel 9.11 Staffing Plan [92](#_Toc243182860)](#_Toc243182860)

[Tabel 9.12 Matriks RACI [92](#_Toc243182861)](#_Toc243182861)

**DAFTAR LAMPIRAN**

[Lampiran 11‑1 Daftar Pertanyaan Wawancara Pemilik Kasus [100](#_Toc240931778)](#_Toc240931778)

[Lampiran 11‑2 Daftar Pertanyaan Wawancara DPPM [101](#_Toc243182762)](#_Toc243182762)

[Lampiran 12‑1 Kuesioner Reviewer [102](#_Toc240931780)](#_Toc240931780)

[Lampiran 12‑2 Rekapitulasi Jawaban Kuesioner [104](#_Toc240931781)](#_Toc240931781)

**DAFTAR ISTILAH**

| **Istilah** | **Arti dalam dokumen ini** |
|----|----|
| *Use case* | Satu cara pengguna memakai sistem untuk menyelesaikan satu kegiatan (Dennis dkk., 2015) |
| *Use case point* (UCP) | Ukuran besar sistem yang dihitung dari jumlah dan kerumitan aktor serta *use case* |
| UAW | *Unadjusted Actor Weight*; bobot seluruh aktor sebelum penyesuaian |
| UUCW | *Unadjusted Use Case Weight*; bobot seluruh *use case* sebelum penyesuaian |
| TCF | *Technical Complexity Factor*; pengali dari 13 faktor teknis |
| EF | *Environmental Factor*; pengali dari 8 faktor lingkungan tim |
| PHM | *Person-Hours per use-case point*; jam kerja yang dibutuhkan tiap satu UCP |
| *Person-month* | Kerja satu orang selama satu bulan penuh; satuan *effort* |
| *Throwaway prototyping* | Metode: analisis menyeluruh dulu, lalu prototipe dibuat hanya untuk menjawab isu berisiko, kemudian dibuang sebelum sistem sebenarnya dibangun |
| *Work breakdown structure* (WBS) | Pemecahan seluruh pekerjaan proyek menjadi paket kerja berjenjang |
| AON | *Activity on Node*; diagram jaringan yang menempatkan kegiatan pada simpul |
| Jalur kritis | Rangkaian kegiatan terpanjang; keterlambatan di dalamnya menunda seluruh proyek |
| PERT | Penjadwalan dengan tiga taksiran durasi per kegiatan |
| NPV | *Net present value*; selisih nilai kini seluruh manfaat dan seluruh biaya |
| ROI | *Return on investment*; rasio manfaat bersih terhadap biaya |
| *Break-even point* | Titik waktu ketika manfaat kumulatif menyamai biaya kumulatif |
| Seleksi administrasi | Tahap pertama seleksi proposal di DPPM: pemeriksaan kelengkapan dan kesesuaian format sebelum seleksi substansi |
| BIMA | Basis Informasi Penelitian dan Pengabdian kepada Masyarakat; sistem informasi pengusulan proposal DPPM |
| DPPM | Direktorat Penelitian dan Pengabdian kepada Masyarakat, Ditjen Riset dan Pengembangan, Kemdiktisaintek |
| LLM | *Large language model*; model bahasa besar yang dipakai sebagai mesin rekomendasi |
| *Golden set* | Kumpulan proposal yang sudah dinilai reviewer, dipakai sebagai kunci jawaban untuk menguji mesin |
| *Human-in-the-loop* | Pola kerja: mesin memberi rekomendasi, manusia yang memutuskan |
| BPR | Business process reengineering: strategi analisis kebutuhan yang mengubah proses bisnis secara mendasar (Dennis dkk., 2015) |
| Activity diagram | Model fungsional yang menggambarkan urutan aktivitas, keputusan, dan pelakunya (swimlane) dalam satu proses |
| LPPM | Lembaga Penelitian dan Pengabdian kepada Masyarakat perguruan tinggi pengusul |
| <span class="mark">Token submisi</span> | Kesempatan pengusul mengajukan proposal; setiap proposal memiliki dua token |
| Butir deterministik | Ketentuan administrasi yang dapat diperiksa pasti dengan aturan, misalnya jumlah kata dan format sitasi |
| Butir semantik | Ketentuan administrasi yang menuntut pembacaan isi, misalnya kesesuaian isi per bagian |
| Gagal submisi | Status proposal yang setelah token terakhir masih gagal pada butir deterministik |

# RINGKASAN EKSEKUTIF

<span class="mark">Direktorat Penelitian dan Pengabdian kepada Masyarakat (DPPM) menyelenggarakan seleksi proposal penelitian kompetitif nasional melalui BIMA. Volume usulan naik tajam, dari 38.605 pada 2024 menjadi 50.595 pada 2025 dan 79.210 pada 2026. Pada periode 2026, 96.485 proposal masuk, 78.974 di antaranya disetujui LPPM, dan 78.818 masuk seleksi administrasi yang hanya berlangsung delapan hari. DPPM mencatat 41.098 kegagalan komponen administrasi, padahal LPPM meloloskan sekitar 95% proposal. Pemeriksaan manual oleh reviewer rata-rata memakan 14,17 menit per proposal, setara kurang lebih 18.610 jam kerja dalam satu periode. Dokumen ini adalah *system proposal*, yaitu keluaran fase analisis yang menyatukan permintaan sistem, rencana proyek dan analisis kelayakan, serta analisis kebutuhan lengkap. Sistem yang diusulkan adalah sistem rekomendasi penilaian administrasi *hybrid* rule-based dan AI. Lapis deterministik memeriksa butir yang dapat dihitung pasti, sedangkan lapis semantik berbasis model bahasa memeriksa butir yang menuntut pembacaan isi. Perubahan terpenting selama proses analisis adalah bergesernya strategi dari *business process improvement* ke *business process reengineering*. Riset tambahan berupa wawancara lanjutan DPPM, bahan Penyamaan Persepsi Reviewer 2026, data kegagalan komponen, dan kuesioner reviewer menunjukkan dua temuan: penyaring pertama tidak berjalan, dan pengusul tidak memiliki kesempatan memperbaiki kesalahan. Karena itu, verifikasi administratif LPPM dihapus dan pemeriksaan dipindahkan ke saat pengusul mengajukan proposal. Pengusul mendapat dua token submisi, sistem hanya menggagalkan submisi secara otomatis untuk butir deterministik, dan keputusan akhir tetap berada pada reviewer. Perubahan ini merevisi permintaan sistem (Bab 2), estimasi effort (Subbab 3.2), dan model fungsional (Bab 7). Sistem yang diusulkan mencakup sepuluh use case yang dijalankan tiga aktor manusia (Tim Kerja DPPM, Pengusul, dan Reviewer) serta dua sistem eksternal (BIMA dan Layanan LLM). Estimasi effort sebesar 93,13 use case point atau 11,64 person-month, yang membutuhkan empat orang inti pada jadwal tiga bulan. Secara ekonomi, sistem menghasilkan NPV lima tahun sebesar Rp 11,91 miliar dengan ROI 828,41% dan titik impas pada 0,21 tahun, pada tingkat diskonto 6 persen. Waktu pemeriksaan reviewer diperkirakan turun 63,5%, dari 14,17 menjadi 5,17 menit per proposal. Dengan demikian, sistem ini layak dikembangkan untuk mengatasi lonjakan volume usulan dalam jendela seleksi administrasi yang singkat, sekaligus memberi pengusul kesempatan memperbaiki proposal sebelum masuk penilaian reviewer.</span>

# SYSTEM REQUEST

## 2.1 Project Sponsor

Ketua Tim Kerja Penelitian, Direktorat Penelitian dan Pengabdian kepada Masyarakat (DPPM), Direktorat Jenderal Riset dan Pengembangan, Kementerian Pendidikan Tinggi, Sains, dan Teknologi, yaitu Erlin Puspaputi. Sponsor berperan sebagai project champion dan menyatakan pimpinan mendukung penuh pengembangan sistem.

## 2.2 Business Need

DPPM menyelenggarakan seleksi proposal penelitian kompetitif nasional melalui BIMA. Volume usulan naik tajam: 38.605 pada 2024, 50.595 pada 2025, dan 79.210 pada 2026 (wawancara sponsor). Pada periode 2026, 96.485 proposal masuk, 78.974 disetujui LPPM, dan 78.818 masuk seleksi administrasi yang hanya berlangsung delapan hari (20–27 Januari 2026).

Seleksi administrasi memiliki empat masalah utama:

1.  **Penyaring pertama tidak berjalan.** LPPM perguruan tinggi memverifikasi komponen yang sama dengan reviewer, tetapi meloloskan sekitar 95% proposal karena cenderung tidak menggugurkan institusinya sendiri. Akibatnya tercatat 41.098 kegagalan komponen di tahap DPPM.

2.  **Kesalahan administratif yang sebenarnya mudah diperbaiki menggugurkan proposal.** 56,3% kegagalan berasal dari model penulisan sitasi (12.786) dan jumlah kata (10.354), dua butir yang dapat dihitung pasti. Pengusul tidak memiliki kesempatan memperbaiki karena tidak ada masa sanggah setelah submit.

3.  **Beban pemeriksaan manual besar.** Rata-rata pemeriksaan satu proposal 14,17 menit, setara ±18.610 jam kerja reviewer per periode, dipikul 1.066–1.244 reviewer dengan beban 30–200 proposal per orang.

4.  **Penilaian bergantung pada satu reviewer.** Tafsiran berbeda terutama pada model sitasi dan komponen isi yang tersirat; DPPM tidak memiliki cara memantau konsistensi penilaian, dan keluhan pengusul yang gugur administrasi banyak.

Sistem yang dibutuhkan adalah sistem rekomendasi penilaian administrasi berbasis aturan dan AI yang memeriksa proposal saat diajukan, memberi pengusul kesempatan memperbaiki kesalahan, dan menyerahkan keputusan akhir kepada reviewer berdasarkan bukti yang dihasilkan sistem.

## 2.3 Business Requirements

<span id="_Toc243182795" class="anchor"></span>Tabel 2.1 Business Requirements

| **No** | **Kebutuhan bisnis** |
|----|----|
| 1 | Sistem menguasai ketentuan lolos dan tidak lolos administrasi per skema, dalam bentuk basis aturan yang dapat diperbarui Tim Kerja DPPM tanpa mengubah kode program. |
| 2 | Sistem dapat mengakses proposal dan metadatanya dari BIMA. |
| 3 | Sistem memproses pemeriksaan dalam waktu singkat sejak proposal diajukan, sehingga pengusul masih dapat memakai kesempatan revisinya. |
| 4 | Hasil pemeriksaan sistem menjadi rujukan reviewer dalam pemeriksaan akhir; keputusan akhir tetap pada reviewer. |
| 5 | Tampilan hasil informatif: setiap butir disertai bukti berupa angka atau kutipan. |
| 6 | <span class="mark">Pengusul menerima hasil pemeriksaan per butir dan dapat merevisi proposal satu kali (dua kesempatan submisi).</span> |
| 7 | Setelah kesempatan kedua, sistem menggagalkan submisi secara otomatis |
| 8 | Verifikasi administratif oleh LPPM dihapus; LPPM hanya memberi persetujuan institusi. |
| 9 | Tim Kerja DPPM dapat memantau kesesuaian penilaian dan jejak audit seluruh keputusan. |

## 2.4 Business Value

**Manfaat berwujud** (dihitung dari data 2026; nilai rupiah mengikuti revisi kelayakan ekonomi):

- <span class="mark">Waktu pemeriksaan reviewer turun dari 14,17 menjadi 5,17 menit per proposal (rata-rata perkiraan enam reviewer), atau dari ±18.610 menjadi ±6.787 jam per periode (−63,5%).</span>

- Kebutuhan reviewer pada kapasitas 15 jam per orang per periode turun dari ±1.241 menjadi ±453 orang; angka ±1.241 sejalan dengan jumlah reviewer aktual 2026 (1.066–1.244).

- Sampai 23.140 kegagalan komponen deterministik (sitasi dan jumlah kata) dapat diketahui pengusul saat submit dan diperbaiki sebelum seleksi.

- Beban verifikasi administratif LPPM di 2.040 perguruan tinggi peserta hilang.

**Manfaat tak berwujud:** konsistensi penilaian antarreviewer, transparansi alasan gugur bagi pengusul, berkurangnya keluhan, jejak audit yang dapat dipertanggungjawabkan, dan reviewer dapat lebih fokus pada seleksi substansi.

## 2.5 Special Issues or Constraints

- Sistem harus siap sebelum masa pengusulan berikutnya (penerimaan proposal 2026 yang lalu dimulai 3 Desember 2025).

- Pemrosesan isi proposal tunduk pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi; basis data BIMA berada on-premise, <span class="mark">aplikasi di cloud</span>.

- Penghapusan verifikasi LPPM <span class="mark">dan mekanisme token</span> memerlukan perubahan Panduan Penelitian dan PkM serta sosialisasi kepada LPPM dan pengusul.

- Keputusan akhir administrasi tetap pada reviewer; DPPM menilai hasil pemeriksaan isi oleh AI belum sepenuhnya dapat dipercaya.

- <span class="mark">Sistem harus menahan beban puncak menjelang tenggat pengusulan, karena token merupakan kesempatan pengusul dan dapat dipakai kapan pun dalam masa pengusulan.</span>

- Log audit disimpan lima tahun sesuai praktik BIMA.

# WORKPLAN

## 3.1 Metode Pengembangan Sistem

Dennis dkk. (2015) membagi pengembangan sistem informasi menjadi empat fase yang setiap keluarannya menjadi masukan fase berikutnya.

<span id="_Toc243182850" class="anchor"></span>Tabel 3.1 Fase SDLC

| **Fase** | **Pertanyaan yang dijawab** | **Keluaran utama** |
|----|----|----|
| *Planning* | Mengapa sistem ini dibangun, dan bagaimana cara membangunnya? | *Project plan* |
| *Analysis* | Siapa yang memakai, apa yang dikerjakan sistem, di mana dan kapan? | *System proposal* |
| *Design* | Bagaimana sistem akan beroperasi? | *System specification* |
| *Implementation* | — | Sistem yang berjalan dan rencana pemeliharaan |

Dokumen ini berada pada fase analysis. Metodologi yang ditetapkan pada fase planning tetap dipakai, dengan karakterisasi proyek dan alasan pemilihan sebagai berikut.

<span class="mark">Metodologi adalah pendekatan yang diformalkan untuk menjalankan SDLC yang meliputi daftar langkah dan keluaran. Dennis dkk. (2015) mengelompokkannya menjadi tiga keluaran.</span>

<span id="_Toc243182851" class="anchor"></span>Tabel 3.2 Kriteria Pemilihan Metodologi

| **Kegunaan untuk** | ***Waterfall*** | ***Parallel*** | ***Phased*** | ***Prototyping*** | ***Throwaway prototyping*** | ***Extreme programming*** |
|----|----|----|----|----|----|----|
| Kebutuhan pengguna belum jelas | Buruk | Buruk | Baik | Sangat baik | **Sangat baik** | Sangat baik |
| Teknologi belum dikenal | Buruk | Buruk | Baik | Buruk | **Sangat baik** | Buruk |
| Sistem kompleks | Baik | Baik | Baik | Buruk | **Sangat baik** | Buruk |
| Sistem harus andal | Baik | Baik | Baik | Buruk | **Sangat baik** | Baik |
| Jadwal pendek | Buruk | Baik | Sangat baik | Sangat baik | Baik | Sangat baik |
| Visibilitas jadwal | Buruk | Buruk | Sangat baik | Sangat baik | Baik | Baik |

Sumber: Dennis, Wixom & Tegarden (2015)

<span id="_Toc243182852" class="anchor"></span>Tabel 3.3 Karakterisasi Proyek Pada Enam Kriteria

| **Kriteria** | **Kondisi proyek ini** | **Bukti** |
|----|----|----|
| Kebutuhan pengguna belum jelas | **Ya, sangat** | Perilaku mesin semantik terhadap proposal belum pernah diukur dimana enam *reviewer* memberi jawaban berbeda-beda tentang berapa lama pemeriksaan masih dibutuhkan setelah sistem ada (0 sampai 15 menit) |
| Teknologi belum dikenal | **Ya** | Tim TI menilai pendekatan yang diusulkan “membutuhkan beberapa kompetensi atau teknologi tambahan”; lapis semantik berbasis model bahasa belum pernah dijalankan DPPM |
| Sistem kompleks | **Ya** | Integrasi BIMA, dua lapis pemeriksa, log audit, dasbor kesesuaian, dan basis aturan yang berubah tiap tahun |
| Sistem harus andal | **Ya, sangat** | Satu syarat tidak terpenuhi menggugurkan proposal; kesalahan menggugurkan proposal yang sebenarnya sah tidak dapat dipulihkan setelah tenggat |
| Jadwal pendek | **Ya** | Sistem harus siap sebelum jendela pengusulan berikutnya |
| Visibilitas jadwal | Diperlukan | Sponsor perlu memantau kemajuan untuk mengambil keputusan anggaran |

Berdasarkan kriteria pada Tabel 3.3, empat kriteria menempatkan proyek ini pada kondisi yang paling penting yaitu kebutuhan belum jelas, teknologi belum dikenal, sistem kompleks, dan sistem harus andal. Pada Tabel 3.2, hanya kolom *throwaway prototyping* yang bernilai sangat baik untuk keempatnya sekaligus. *Prototyping* biasa menunjukkan nilai buruk untuk tiga dari empat kriteria itu, dan *extreme programming* bernilai buruk untuk dua di antaranya.

Penerapannya pada proyek ini dapat dijelaskan sebagai berikut : isu yang berisiko dan belum jelas ada satu dan dapat dirumuskan dengan tepat yaitu seberapa akurat rekomendasi mesin pada butir yang menuntut pembacaan isi jika dibandingkan dengan penilaian *reviewer* manusia. Prototipe desain dibangun untuk menjawab pertanyaan itu, dengan langkah mengambil proposal tahun sebelumnya yang sudah dinilai *reviewer* sebagai *golden set*, kemudian menjalankan aturan dan *prompt* terhadapnya, lalu mengukur persentase akurasi per butir. Prototipe tersebut tidak memuat integrasi BIMA, tidak memuat log audit, dan tidak memuat antarmuka *reviewer*. Setelah angka kesesuaian diperoleh dan sponsor menetapkan ambangnya, prototipe tidak lagi digunakan karena yang dipakai ke tahap konstruksi hanya aturan dan *prompt* yang sudah terbukti.

## 3.2 Estimasi *Effort*

<span class="mark">Estimasi memakai use case point, dihitung dari sembilan use case pada Bab 7. Jumlah transaksi setiap use case diambil dari langkah normal flow pada use case description (Tabel 7.1): use case dengan maksimal 3 transaksi tergolong simple, 4–7 average, dan lebih dari 7 complex (Dennis dkk., 2015). Untuk sistem yang diusulkan:</span>

<span id="_Toc243182853" class="anchor"></span>Tabel 3.4 Estimasi Effort

| **Komponen** | **Nilai** | **Asal** |
|----|---:|----|
| UAW (*Unadjusted Actor Weight*) | 13 | 3 aktor manusia (Tim Kerja DPPM, Pengusul, Reviewer) × 3 + 2 sistem eksternal (BIMA, Layanan LLM) × 2 |
| UUCW (*Unadjusted Use Case Weight*) | 90 | 2 simple × 5 + 8 average × 10 |
| UUCP = UAW + UUCW | 103 |  |
| TCF = 0,6 + (0,01 × 47,0) | 1,070 | 13 faktor teknis |
| EF = 1,4 + (−0,03 × 18,5) | 0,845 | 8 faktor lingkungan |
| **UCP = UUCP × TCF × EF** | 93,13 |  |
| *Person-hours* = UCP × 20 | 1.863 | PHM 20 jam/UCP |
| ***Person-month*** = ÷ 160 jam | 11,64 | Asumsi 160 jam/bulan = 20 hari × 8 jam |
| Orang inti = PM ÷ 3 bulan | 4 |  |

<span class="mark">Kesembilan use case dan lima aktornya dirinci pada Bab 7. Dibandingkan Tugas 2 (UUCP 88; 90,86 UCP; 11,35 person-month), UUCP naik menjadi 103 karena tiga use case baru untuk pengusul (mengajukan, melihat hasil pemeriksaan, merevisi) dan satu use case pemantauan. Faktor kompleksitas teknis tidak berubah (ΣT = 47,0). Faktor lingkungan E6 (requirements stability) dinaikkan dari 2 menjadi 4 karena kebutuhan kini sudah stabil: katalog butir telah difinalkan mengikuti borang 2026, strategi BPR dan aturan token telah disepakati, dan model use case telah ditetapkan. Ketidakpastian yang tersisa hanya akurasi mesin semantik, yang tetap dijawab lewat prototipe. Akibatnya ΣE naik dari 14,5 menjadi 18,5 dan EF turun dari 0,965 menjadi 0,845 (Tabel 3.5). Rentang ketidakpastian pada tahap ini −25% sampai +75% (Dennis dkk., 2015), yakni 8,73 sampai 20,37 person-month.</span>

<span id="_Toc243182854" class="anchor"></span>Tabel 3.5 Faktor Lingkungan

| **Kode** | **Faktor** | **Bobot** | **Skor** | **Terbobot** | **Dasar penilaian** |
|----|----|----|----|----|----|
| E1 | Familiarity with development process | 1,5 | 3 | 4,5 | Tim mengenal SDLC, tetapi throwaway prototyping belum pernah dijalankan bersama |
| E2 | Application experience | 0,5 | 4 | 2,0 | Dua anggota tim kerja DPPM memegang BIMA dan paham proses seleksi administrasi |
| E3 | Object-oriented experience | 1,0 | 3 | 3,0 | Pengembang terbiasa berorientasi objek, tetapi belum pada sistem penilaian berbantuan model bahasa |
| E4 | Lead analyst capability | 0,5 | 4 | 2,0 | Analis utama menguasai domain penelitian sekaligus sistem informasi BIMA |
| E5 | Motivation | 1,0 | 4 | 4,0 | Sponsor jelas, masalahnya dirasakan langsung, tenggatnya berulang tiap tahun |
| E6 | Requirements stability | 2,0 | 4 | 8,0 | <span class="mark">Naik dari 2: katalog butir final mengikuti borang 2026, strategi BPR dan aturan token disepakati, model use case ditetapkan</span> |
| E7 | Part-time staff | −1,0 | 3 | −3,0 | Pemilik data DPPM dan wakil reviewer hanya terlibat paruh waktu |
| E8 | Difficulty of programming language | −1,0 | 2 | −2,0 | Bahasa dan pustaka yang dipakai umum |
|  | ΣE |  |  | 18,5 |  |
|  | EF = 1,4 + (−0,03 × ΣE) |  |  | 0,845 |  |

## 3.3 *Work Breakdown Structure*

<span class="mark">*Work Breakdown Structure* disusun untuk sistem yang diusulkan. Struktur fasenya mengikuti *throwaway prototyping* yang dipilih pada Subbab 3.1: *planning*, *analysis*, *design* (yang di dalamnya terdapat paket prototipe), *implementation*, dan *transition*. Setiap fase pekerjaan dipecah menjadi pekerjaan yang lebih detail dengan tingkat paket kerja yang durasinya dapat ditaksir dan penanggung jawabnya dapat ditunjuk, mengikuti aturan bahwa seluruh pekerjaan proyek dapat dilaksanakan dengan baik tanpa ada yang tertinggal.</span>

<img src="media/image26.png" style="width:5.51042in;height:1.79167in" />

<span id="_Toc243182791" class="anchor"></span>Gambar 3.1 Struktur work breakdown structure proyek

<span id="_Toc243182855" class="anchor"></span>Tabel 3.6 Work Breakdown Structure

| **Kode** | **Aktivitas** | **Output** | **Durasi** | **Depends On** | **PIC** | **Tonggak** |
|----|----|----|----|----|----|----|
| **1** | **Perencanaan (Planning)** | Rencana proyek | **5 hari** |  | **Project Manager** |  |
| 1.1 | Inisiasi Proyek | Project charter dan stakeholder list | 1 hari | \- | Project Manager |  |
| 1.2 | Analisis Strategi | Project plan | 2 hari | 1.1 | Project Manager |  |
| 1.3 | Pengumpulan Kebutuhan | Dokumen kebutuhan pengguna | 2 hari | 1.1 | Project Manager |  |
| 1.4 | Persetujuan Rencana Proyek | Project plan disetujui | 1 hari | 1.1, 1.2 | Project Manager | M1 |
| **2** | **Analisis (Analysis)** | Dokumen hasil analisis | **12 hari** |  | **System Analyst** |  |
| 2.1 | Analisis Proses Bisnis | Proses As-Is dan To-Be | 4 hari | 1.4 | System Analyst |  |
| 2.2 | Analisis Kebutuhan Sistem | Dokumen kebutuhan sistem | 4 hari | 2.1 | System Analyst |  |
| 2.3 | Analisis Aturan Seleksi | Matriks Rule-Based dan AI | 3 hari | 2.1 | System Analyst |  |
| 2.4 | Analisis dan Persiapan Data | Dataset siap digunakan | 3 hari | 2.1 | System Analyst | M2 |
| **3** | **Perancangan (Design)** | Dokumen desain sistem | **12 hari** |  | **Solution Architect** |  |
| 3.1 | Perancangan Arsitektur Sistem | Diagram arsitektur sistem | 4 hari | 2.2 | Solution Architect |  |
| 3.2 | Perancangan Rule-Based dan AI | Desain Rule-Based + AI | 2 hari | 3.1 | Solution Architect |  |
| 3.3 | Perancangan Database dan Integrasi | Desain database dan integrasi | 2 hari | 3.1 | Solution Architect |  |
| 3.4 | Perancangan Antarmuka | Desain Antarmuka | 2 hari | 3.1 | Fullstack Dev |  |
| 3.5 | Perancangan dan Pengujian Prototipe | Prototipe dan Laporan | 3 hari | 3.1, 3.4 | Solution Architect dan Fullstack Dev | M3 |
| **4** | **Implementasi (Implementation)** | Aplikasi Hybrid | **20 hari** |  | **Programmer** |  |
| 4.1 | Pengembangan Rule-Based Engine | Rule-Based Engine | 7 hari | 3.1, 3.5 | Fullstack Developer |  |
| 4.2 | Pengembangan Komponen AI | Komponen AI | 10 hari | 3.1, 3.5 | AI Engineer |  |
| 4.3 | Pengembangan Aplikasi | Aplikasi utama | 11 hari | 3.1, 3.5 | Fullstack Developer | M4 |
| 4.4 | Integrasi Sistem | Sistem Hybrid terintegrasi | 7 hari | 3.1, 3.5 | Fullstack Developer |  |
| 4.5 | Pengujian Fungsional dan Integrasi | Laporan functional & integration test | 5 hari | 4.4 | QA Engineer |  |
| 4.6 | Uji Penerimaan Pengguna (UAT) | Dokumen hasil dan persetujuan UAT | 5 hari | 4.5 | Reviewer/User Representative | M5 |
| **5** | **Transisi (Transition)** | Sistem operasional dan project closure | **6 hari** |  | **Project Manager** |  |
| 5.1 | Persiapan dan Implementasi Produksi | Sistem pada lingkungan produksi | 2 hari | 4.6 | Fullstack Developer |  |
| 5.2 | Dokumentasi dan Pelatihan | Dokumentasi dan pengguna terlatih | 2 hari | 4.6 | System Analyst |  |
| 5.3 | Go-Live dan Evaluasi Awal | Laporan monitoring awal | 2 hari | 5.1 | Project Manager | M6 |
| 5.4 | Serah Terima dan Penutupan | BAST dan laporan akhir proyek | 1 hari | 5.3 | Project Manager |  |

Pekerjaan 3.5 adalah paket prototipe yang menjadi ciri metode terpilih yaitu *throwaway prototyping,* dengan penanda milestone dengan keluarannya satu laporan. Jika pekerjaan ini telah disetujui maka akan menjadi gerbang bagi paket pekerjaan 4.1.

## 3.4 Jadwal Proyek

Proyek ini menggunakan kombinasi PERT dan GANTT chart karena karakteristik metode *throwaway prototyping* menghasilkan dua jenis pekerjaan dengan tingkat ketidakpastian berbeda. Pada fase awal seperti penyusunan skenario dan pembuatan prototipe throwaway akan memiliki durasi yang sulit dipastikan, karena bergantung bagaimana *feedback* yang diberikan setelah prototipe, sehingga PERT estimasi tiga titik tepat untuk menangkap rentang ketidakpastian.

<span class="mark">Durasi tiap paket kerja ditaksir dengan tiga titik, lalu dihitung durasi harapannya menggunakan rumus durasi harapan sama dengan optimis ditambah empat kali paling mungkin ditambah pesimis, dibagi enam.</span>

<span id="_Toc243182856" class="anchor"></span>Tabel 3.7 Jadwal Proyek

| **Kode** | **Paket kerja** | **Predecessor** | **Optimis (o)** | **Paling mungkin (m)** | **Pesimis (p)** | **Durasi harapan** | **Varians** |
|----|----|----|----|----|----|----|----|
| 1.1 | Inisiasi Proyek | — | 1 | 1 | 2 | 1.17 | 0.03 |
| 1.2 | Analisis Strategi | 1.1 | 1 | 2 | 3 | 2.00 | 0.11 |
| 1.3 | Pengumpulan Kebutuhan | 1.2 | 1 | 2 | 3 | 2.00 | 0.11 |
| 1.4 | Persetujuan Rencana Proyek | 1.3 | 1 | 1 | 2 | 1.17 | 0.03 |
| 2.1 | Analisis Proses Bisnis | 1.4 | 3 | 4 | 6 | 4.17 | 0.25 |
| 2.2 | Analisis Kebutuhan Sistem | 2.1 | 3 | 4 | 6 | 4.17 | 0.25 |
| 2.3 | Analisis Aturan Seleksi | 2.1 | 2 | 3 | 5 | 3.17 | 0.25 |
| 2.4 | Analisis dan Persiapan Data | 2.1 | 2 | 3 | 5 | 3.17 | 0.25 |
| 3.1 | Perancangan Arsitektur Sistem | 2.2 | 3 | 4 | 6 | 4.17 | 0.25 |
| 3.2 | Perancangan Rule-Based dan AI | 3.1 | 1 | 2 | 4 | 2.17 | 0.25 |
| 3.3 | Perancangan Database dan Integrasi | 3.1 | 1 | 2 | 3 | 2.00 | 0.11 |
| 3.4 | Perancangan Antarmuka | 3.1 | 1 | 2 | 3 | 2.00 | 0.11 |
| 3.5 | Perancangan dan Pengujian Prototipe | 3.1,3.4 | 2 | 3 | 5 | 3.17 | 0.25 |
| 4.1 | Pengembangan Rule-Based Engine | 3.1,3.5 | 5 | 7 | 10 | 7.17 | 0.69 |
| 4.2 | Pengembangan Komponen AI | 3.1,3.5 | 7 | 10 | 18 | 10.83 | 3.36 |
| 4.3 | Pengembangan Aplikasi | 3.1,3.5 | 8 | 11 | 20 | 12.00 | 4.00 |
| 4.4 | Integrasi Sistem | 3.1,3.5 | 5 | 7 | 10 | 7.17 | 0.69 |
| 4.5 | Pengujian Fungsional dan Integrasi | 4.4 | 4 | 5 | 9 | 5.50 | 0.69 |
| 4.6 | Uji Penerimaan Pengguna (UAT) | 4.5 | 4 | 5 | 8 | 5.33 | 0.44 |
| 5.1 | Persiapan dan Implementasi Produksi | 4.6 | 1 | 2 | 3 | 2.00 | 0.11 |
| 5.2 | Dokumentasi dan Pelatihan | 4.6 | 1 | 2 | 3 | 2.00 | 0.11 |
| 5.3 | Go-Live dan Evaluasi Awal | 5.1 | 1 | 2 | 3 | 2.00 | 0.11 |
| 5.4 | Serah Terima dan Penutupan | 5.3 | 1 | 1 | 2 | 1.17 | 0.03 |

<img src="media/image27.png" style="width:4.85417in;height:1.95451in" />

<span id="_Toc243182792" class="anchor"></span>Gambar 3.2 Jaringan AON dan jalur kritis

Jalur kritis ditentukan dengan menelusuri seluruh jalur yang mungkin pada jaringan, menjumlahkan durasi harapan tiap jalur, lalu memilih jalur terpanjang.

<span id="_Toc243182857" class="anchor"></span>Tabel 3.8 Enumerasi Jalur dan Jalur Kritis

| **Jalur** | **Rangkaian paket kerja** | **Total durasi harapan (hari)** | ***Slack* (hari)** | **Kritis?** |
|----|----|----|----|----|
| 1 | 1.1‑1.2‑1.4‑2.1‑2.2‑3.1‑3.4‑3.5‑4.4‑4.5‑4.6‑5.1‑5.3‑5.4 | 45,17 | 0 | Ya |
| 2 | 1.1‑1.2‑1.4‑2.1‑2.2‑3.1‑3.4‑3.5‑4.4‑4.5‑4.6‑5.1‑**5.2** | 42,00 | 3,17 | Tidak |
| 3 | 1.1‑1.2‑1.4‑2.1‑2.2‑3.1‑3.5‑**4.3** | 34,00 | 11,17 | Tidak |
| 4 | 1.1‑1.2‑1.4‑2.1‑2.2‑3.1‑3.5‑**4.2** | 32,83 | 12,33 | Tidak |
| 5 | 1.1‑1.2‑1.4‑2.1‑2.2‑3.1‑3.5‑**4.1** | 29,17 | 16,00 | Tidak |
| 6 | 1.1‑1.2‑1.4‑2.1‑2.2‑3.1‑**3.2** | 19,00 | 26,17 | Tidak |
| 7 | 1.1‑1.2‑1.4‑2.1‑2.2‑3.1‑**3.3** | 18,83 | 26,33 | Tidak |
| 8 | 1.1‑1.2‑1.4‑2.1‑**2.4** | 11,67 | 33,50 | Tidak |
| 9 | 1.1‑1.2‑1.4‑2.1‑**2.3** | 11,67 | 33,50 | Tidak |
| 10 | 1.1‑**1.3** | 3,17 | 42,00 | Tidak |

Jalur kritis adalah Jalur 1 dengan total durasi harapan 45,17 hari kerja**.**

Jalur kritis melewati inisiasi proyek, analisis strategi, persetujuan rencana, analisis proses bisnis dan kebutuhan sistem, perancangan arsitektur dan antarmuka, prototipe, integrasi sistem, pengujian fungsional, UAT, dan seluruh rangkaian transisi.

<img src="media/image28.png" style="width:9.32939in;height:3.36846in" />

<span id="_Toc243182793" class="anchor"></span>Gambar 3.3 Gantt chart proyek

<span id="_Toc243182858" class="anchor"></span>Tabel 3.9 Tabel Task Gantt Chart

| **TASK**                            | **START**     | **END**       |
|-------------------------------------|---------------|---------------|
| **Fase Perencanaan**                | **21-Sep-26** | **27-Sep-26** |
| Inisiasi Proyek                     | 21-Sep-26     | 23-Sep-26     |
| Analisis Strategi                   | 23-Sep-26     | 26-Sep-26     |
| Pengumpulan Kebutuhan               | 23-Sep-26     | 26-Sep-26     |
| Persetujuan Rencana Proyek          | 26-Sep-26     | 27-Sep-26     |
| **M1**                              | **27-Sep-26** | **27-Sep-26** |
| **Fase Analisis**                   | **27-Sep-26** | **10-Oct-26** |
| Analisis Proses Bisnis              | 27-Sep-26     | 4-Oct-26      |
| Analisis Kebutuhan Sistem           | 4-Oct-26      | 10-Oct-26     |
| Analisis Aturan Seleksi             | 4-Oct-26      | 9-Oct-26      |
| Analisis dan Persiapan Data         | 4-Oct-26      | 9-Oct-26      |
| **M2**                              | **10-Oct-26** | **10-Oct-26** |
| **Fase Perancangan**                | **10-Oct-26** | **24-Oct-26** |
| Perancangan Arsitektur Sistem       | 10-Oct-26     | 16-Oct-26     |
| Perancangan Rule-Based dan AI       | 16-Oct-26     | 19-Oct-26     |
| Perancangan Database dan Integrasi  | 16-Oct-26     | 19-Oct-26     |
| Perancangan Antarmuka               | 16-Oct-26     | 19-Oct-26     |
| Perancangan dan Pengujian Prototipe | 19-Oct-26     | 24-Oct-26     |
| **M3**                              | **24-Oct-26** | **24-Oct-26** |
| **Fase Implementasi**               | **24-Oct-26** | **20-Nov-26** |
| Pengembangan Rule-Based Engine      | 24-Oct-26     | 4-Nov-26      |
| Pengembangan Komponen AI            | 24-Oct-26     | 9-Nov-26      |
| Pengembangan Aplikasi               | 24-Oct-26     | 11-Nov-26     |
| **M4**                              | **11-Nov-26** | **11-Nov-26** |
| Integrasi Sistem                    | 24-Oct-26     | 4-Nov-26      |
| Pengujian Fungsional dan Integrasi  | 4-Nov-26      | 12-Nov-26     |
| Uji Penerimaan Pengguna (UAT)       | 12-Nov-26     | 20-Nov-26     |
| **M5**                              | **20-Nov-26** | **20-Nov-26** |
| **Fase Transisi**                   | **20-Nov-26** | **28-Nov-26** |
| Persiapan dan Implementasi Produksi | 20-Nov-26     | 23-Nov-26     |
| Dokumentasi dan Pelatihan           | 20-Nov-26     | 23-Nov-26     |
| Go-Live dan Evaluasi Awal           | 23-Nov-26     | 26-Nov-26     |
| **M6**                              | **26-Nov-26** | **26-Nov-26** |
| Serah Terima dan Penutupan          | 26-Nov-26     | 28-Nov-26     |

<span id="_Toc243182859" class="anchor"></span>Tabel 3.10 Tonggak Proyek

| **Tonggak** | **Keluaran** | **Tanggal** | **Arti bagi sponsor** |
|----|----|----|----|
| M1 | Persetujuan rencana proyek | 8/10/2026 | Anggaran dapat diusulkan |
| M2 | Analisis Kebutuhan | 20/10/2026 | Lingkup terkunci |
| M3 | Perancangan dan Pengujian Prototipe | **3**/11/2026 | Gerbang keputusan: lanjut ke lapis semantik, atau rilis lapis deterministik saja lebih dulu bila ambang kesesuaian belum tercapai |
| M4 | Pengembangan aplikasi | 21/11/2026 | Sistem siap diuji coba pengguna |
| M5 | Uji Penerimaan Pengguna | 30/11/2026 | Sistem siap digunakan |
| M6 | Transisi | 6/12/2026 | Sistem dioperasikan DPPM |

## 3.5 *Staffing Plan*

<span class="mark">Jumlah orang diturunkan dari rumus jumlah orang sama dengan person-month dibagi lama proyek dalam bulan. Untuk sistem yang diusulkan: 11,64 person-month dibagi 3 bulan menghasilkan 3,88, dibulatkan menjadi empat orang inti, sesuai jumlah anggota tim inti.</span>

<img src="media/image29.png" style="width:5.51181in;height:1.95069in" />

<span id="_Toc243182794" class="anchor"></span>Gambar 3.4 Struktur tim proyek

Peran baku yang dipakai mengikuti Dennis dkk. (2015) yaitu manajer proyek, analis bisnis, analis sistem, analis infrastruktur, dan analis manajemen perubahan dengan beberapa penyesuaian pada kasus ini. Terdapat dua peran yang ditambahkan yaitu AI Engineer yang bertanggung jawab atas lapis semantik dan uji kesesuaian, serta wakil *reviewer* dan wakil DPPM yang menjadi jembatan penerimaan. Peran kedua ini bukan formalitas karena data kuesioner menunjukkan penerimaan dan *reviewer* adalah faktor penentu.

<span id="_Toc243182860" class="anchor"></span>Tabel 3.11 Staffing Plan

| **Peran** | **Jumlah** | **Asal** | **Keahlian yang disyaratkan** | **Fase terlibat** | **Alokasi** |
|----|----|----|----|----|----|
| Manajer proyek | 1 | DPPM | Manajemen proyek TI, perencanaan, koordinasi tim, pengelolaan risiko | 1–5 | 100% |
| Analis sistem | 1 | DPPM/ vendor | Analisis proses bisnis, requirement analysis, pemodelan proses dan kebutuhan sistem | 2–3 | 100% |
| Arsitek | 1 | Vendor | Arsitektur aplikasi, database, API/integrasi, AI system architecture, keamanan sistem | 3 | 75% |
| *AI engineer* | 1 | Vendor | AI/ML, document processing, prompt/model configuration, evaluasi model | 3–4 | 100% |
| Programmer | 1 | Vendor | Backend, frontend, database, API, Rule Engine dan integrasi sistem | 4 | 100% |
| QA Engineer | 1 | Vendor | Uji integrasi, uji beban, uji kesesuaian | 4–5 | 75% |
| **Total** | **8** |  |  |  |  |

<span id="_Toc243182861" class="anchor"></span>Tabel 3.12 Matriks RACI

| **Kode** | **Aktivitas** | **PM** | **SA** | **SOArch** | **AIE** | **FD** | **QAE** | **DPPM** | **REV** | **Sponsor** |
|----|----|----|----|----|----|----|----|----|----|----|
| **1** | **Perencanaan** | R | C | C | I | I | I | I | I | A |
| 1.1 | Inisiasi Proyek | R | C | I | I | I | I | I | C | A |
| 1.2 | Analisis Strategi | R | C | C | I | I | I | I | C | A |
| 1.3 | Pengumpulan Kebutuhan | A | R | C | C | I | I | C | R | I |
| 1.4 | Persetujuan Rencana Proyek | R | C | I | I | I | I | I | I | A |
| **2** | **Analisis** | A | R | C | C | I | I | C | C | I |
| 2.1 | Analisis Proses Bisnis | A | R | C | I | I | I | I | C | I |
| 2.2 | Analisis Kebutuhan Sistem | A | R | C | C | C | I | C | C | I |
| 2.3 | Analisis Aturan Seleksi | A | R | C | C | I | I | I | C | I |
| 2.4 | Analisis dan Persiapan Data | I | A | C | R | C | I | R | C | I |
| **3** | **Perancangan** | I | C | A | C | C | I | I | C | I |
| 3.1 | Perancangan Arsitektur Sistem | I | C | A | C | C | I | I | I | I |
| 3.2 | Perancangan Rule-Based dan AI | I | C | A | R | C | I | I | C | I |
| 3.3 | Perancangan Database dan Integrasi | I | C | A | C | R | I | C | I | I |
| 3.4 | Perancangan Antarmuka | I | C | A | I | R | I | I | C | I |
| 3.5 | Perancangan dan Pengujian Prototipe | I | C | A | C | R | C | I | C | I |
| **4** | **Implementasi** | I | C | A | R | R | C | I | I | I |
| 4.1 | Pengembangan Rule-Based Engine | I | C | A | C | R | C | I | C | I |
| 4.2 | Pengembangan Komponen AI | I | C | A | R | C | C | C | C | I |
| 4.3 | Pengembangan Aplikasi | I | C | A | C | R | C | I | I | I |
| 4.4 | Integrasi Sistem | I | I | A | R | R | C | C | I | I |
| 4.5 | Pengujian Fungsional dan Integrasi | I | C | C | C | C | A | I | I | I |
| 4.6 | Uji Penerimaan Pengguna (UAT) | I | C | I | C | C | R | I | A | I |
| **5** | **Transisi** | A | C | C | C | R | R | I | C | I |
| 5.1 | Persiapan dan Implementasi Produksi | I | I | A | C | R | C | C | I | I |
| 5.2 | Dokumentasi dan Pelatihan | A | R | C | C | C | C | I | C | I |
| 5.3 | Go-Live dan Evaluasi Awal | A | C | C | C | R | R | C | C | I |
| 5.4 | Serah Terima dan Penutupan | R | C | I | I | I | I | I | C | A |

R = *responsible*, A = *accountable*, C = *consulted*, I = *informed*.

# ANALISIS KELAYAKAN

## 4.1 Kerangka Analisis

Kelayakan dinilai dari tiga sisi, yaitu kelayakan teknis, kelayakan ekonomi dan kelayakan organisasi.

## 4.2 Skenario Alternatif

<span class="mark">\[Diisi: tiga skenario infrastruktur untuk satu sistem yang sama.\]</span>

## 4.3 Kelayakan Teknis

<span class="mark">Risiko teknis dinilai dari empat faktor yaitu pengenalan terhadap bidang aplikasi, pengenalan terhadap teknologi, ukuran proyek, dan kesesuaian dengan sistem yang ada.</span>

**Pengenalan terhadap bidang aplikasi.** Tinggi dan sama untuk ketiga skenario. Dua anggota tim kerja DPPM bertanggung jawab atas sistem BIMA, dan proses seleksi administrasi dijalankan sendiri oleh direktorat. Tim TI menyatakan data proposal historis, hasil pemeriksaan reviewer, dan aturan administrasi tersedia; untuk Skenario 1 dan 2 “sebagian besar data tersedia dan hanya membutuhkan preprocessing minor”, sedangkan untuk Skenario 3 “data tersedia tetapi membutuhkan cleansing, labeling, atau persiapan yang cukup besar”.

**Pengenalan terhadap teknologi.** Menurun tajam dari Skenario 1 ke Skenario 3. Tim TI menilai Skenario 1 “relatif sederhana; sebagian besar teknologi sudah dikuasai”, Skenario 2 “kompleksitas sedang; membutuhkan beberapa kompetensi atau teknologi tambahan”, dan Skenario 3 “sangat kompleks; teknologi belum dikuasai dan membutuhkan keahlian atau teknologi baru secara signifikan”. Penilaian yang sama berlaku untuk kerumitan pengembangan, pengujian, dan penanganan gangguan.

<span class="mark">**Ukuran proyek.** Diambil dari Subbab 3.2: 8,3 person-month dengan 3 orang untuk Skenario 1; 11,64 person-month dengan 4 orang untuk Skenario 2; dan 9,5 person-month dengan 4 orang untuk Skenario 3.</span>

**Kesesuaian dengan sistem yang ada.** Ini pembeda paling tajam. Tim TI menilai integrasi dengan BIMA untuk Skenario 1 “memungkinkan dengan pengembangan antarmuka atau API tambahan”, Skenario 2 “memungkinkan tetapi membutuhkan modifikasi besar”, dan Skenario 3 “tidak tersedia mekanisme integrasi dan membutuhkan perubahan besar pada sistem existing”. Kesiapan infrastruktur mengikuti pola yang sama: Skenario 1 “sebagian besar tersedia dan hanya membutuhkan peningkatan minor”, Skenario 2 “infrastruktur dasar tersedia tetapi membutuhkan beberapa peningkatan signifikan”, Skenario 3 “hanya sebagian kecil tersedia dan membutuhkan peningkatan besar”.

<span id="_Toc243182796" class="anchor"></span>Tabel 4.1 Penilaian Kelayakan Teknis Per Skenario

| **Faktor**               | **S1** | **S2** | **S3** |
|--------------------------|--------|--------|--------|
| Kesiapan infrastruktur   | 4      | 3      | 2      |
| Ketersediaan data        | 4      | 4      | 3      |
| Kemudahan integrasi BIMA | 4      | 3      | 1      |
| Kompleksitas teknologi   | 5      | 3      | 1      |
| Keamanan data            | 5      | 3      | 1      |

Skor 1 sampai 5; makin tinggi makin layak. Sumber: wawancara tim TI (Lampiran B.2).

<span class="mark">**Catatan khusus Skenario 3.** Peniadaan lapis deterministik menimbulkan risiko teknis yang tidak dimiliki kedua skenario lain. Butir seperti “Ringkasan tidak lebih dari 300 kata”, “tepat lima kata kunci”, dan “komponen biaya APC (Article Processing Charge) tidak melebihi sepuluh persen” adalah pekerjaan menghitung, yang dengan aturan menghasilkan jawaban pasti beserta angka pembuktinya. Model bahasa mengerjakannya secara probabilistik: ia dapat keliru menghitung, dan kekeliruannya tidak selalu terlihat karena jawabannya tetap terbaca meyakinkan.</span>

Menyerahkan butir semacam itu kepada model bahasa berarti menukar hasil yang pasti dengan hasil yang berupa kemungkinan, pada proses yang menggugurkan proposal secara permanen. Pertukaran itu tidak menguntungkan dari sisi mana pun: akurasinya turun, biaya inferensinya naik (lihat 4.4.2), dan kemampuan menunjukkan angka pembukti kepada pengusul hilang. Skenario 1 dan Skenario 2 tidak menghadapi persoalan ini karena keduanya mempertahankan aturan untuk butir yang memang dapat dihitung.

<span id="_Toc243182797" class="anchor"></span>Tabel 4.2 Daftar Risiko Teknis

| **Risiko** | **Kemungkinan** | **Respons** |
|----|----|----|
| <span class="mark">Mesin semantik tidak mencapai ambang kesesuaian dengan reviewer</span> | Sedang | Mitigate - uji pada golden set di tahap prototipe sebelum konstruksi; bila gagal, turun ke Skenario 1 |
| Mesin menggugurkan proposal yang sebenarnya sah | Sedang | Mitigate - keputusan akhir tetap pada reviewer (kebutuhan 4.1); ambang keyakinan ditetapkan sponsor |
| BIMA tidak menyediakan mekanisme integrasi yang memadai | Tinggi | Mitigate - sepakati titik integrasi pada tahap analisis; sediakan jalur ekspor berkala sebagai cadangan |
| Isi proposal keluar dari kendali DPPM melalui layanan pihak ketiga | Sedang | Avoid - kebutuhan 4.4 melarangnya tanpa persetujuan tertulis; sediakan opsi server internal |
| Panduan berubah di tengah periode seleksi | Rendah | Accept - basis aturan berversi dan berlaku menurut tanggal (UC-01) |
| Volume proposal tumbuh melampaui kapasitas | Sedang | Transfer - kapasitas pemrosesan dinyatakan sebagai kebutuhan 2.2 dan diuji sebelum serah terima |
| Model bahasa keliru pada butir yang menuntut penghitungan (hanya S3) | Tinggi | Avoid - pertahankan lapis deterministik; inilah dasar tidak merekomendasikan S3 |

## 4.4 Kelayakan Ekonomi

### 4.4.1 Parameter dan Asumsi

Satu hal menentukan seluruh bab ini dan perlu dinyatakan lebih dulu: honorarium reviewer dibayar per berkas, bukan per jam. Artinya honorarium total = jumlah berkas yang dinilai reviewer × tarif per berkas.

Mempercepat pemeriksaan tidak menurunkan honorarium, karena jumlah berkas yang dibayar tetap sama. Namun honorarium bukan satu-satunya pos biaya yang terpengaruh: sebagian biaya melekat pada jumlah reviewer, bukan pada jumlah berkas, dan pos itu berkurang begitu kebutuhan reviewer berkurang. Pembedaan kedua pos inilah yang menjelaskan seluruh perbedaan hasil antar skenario pada 4.4.3.

<span id="_Toc243182798" class="anchor"></span>Tabel 4.3 Parameter Analisis Ekonomi

| **Parameter** | **Nilai** | **Sumber** |
|----|----|----|
| <span class="mark">Jumlah usulan per tahun</span> | 79.210 | Wawancara sponsor |
| Waktu pemeriksaan per proposal sebelum sistem | 14,17 menit | Rata-rata enam reviewer |
| Waktu pemeriksaan sesudah sistem | 6,50 / 5,17 / 1,17 menit | Rata-rata enam reviewer per skenario |
| Proposal yang dinilai reviewer | 100% / 100% / 0% | Desain skenario |
| Tarif honorarium per berkas | Rp 50.000 | SK honorarium reviewer |
| Kapasitas pemeriksaan per reviewer per periode | 15 jam | Wawancara sponsor |
| Biaya satu person-month tim pengembang | Rp 25.000.000 | Asumsi kelompok |
| Tingkat diskonto | 6% | Asumsi kelompok |
| Cadangan | 10% | Asumsi kelompok |
| Horizon analisis | 5 tahun | Dennis dkk. (2015) |

<span class="mark">Pada Skenario 3, tahap seleksi administrasi tidak lagi memakai reviewer sama sekali. Kasus berkeyakinan rendah, sampel audit, dan sanggahan pengusul ditangani tim internal pengelola BIMA, yang merupakan pegawai bergaji tetap sehingga tidak menimbulkan honorarium per berkas. Beban baru tersebut dianggap masuk ke dalam tugas tim yang sudah ada. Bila kelak melampaui kapasitas tim, biaya SDM internal harus ditambahkan ke Tabel 4.5 dan seluruh angka Skenario 3 dihitung ulang.</span>

<span class="mark">Sponsor menyatakan saat ini tidak ada anggaran khusus untuk pengembangan sistem pendukung seleksi proposal. Konsekuensinya, seluruh skenario memerlukan usulan anggaran baru, dan kemampuan organisasi membiayainya menjadi pembeda: sponsor menilai investasi Skenario 1 “relatif rendah dan dapat dipenuhi dari anggaran yang tersedia”, Skenario 2 “sedang dan masih memerlukan penyesuaian atau alokasi anggaran tambahan”, dan Skenario 3 “tinggi dan membutuhkan tambahan anggaran yang signifikan”.</span>

### 4.4.2 Biaya

<span id="_Toc243182799" class="anchor"></span><span class="mark">Tabel 4.4 Biaya Pengembangan (Juta Rupiah)</span>

| **Komponen** | **Dasar** | **S1** | **S2** | **S3** |
|----|----|----|----|----|
| SDM pengembangan | Person-month (Subbab 3.2) × Rp 25 juta | 225,0 | 291,0 | 300 |
| Infrastruktur, lisensi, dan persiapan data | Asumsi kelompok | 100,0 | 250,0 | 400,0 |
| Cadangan 10% |  | 32,5 | 54,1 | 70,0 |
| Total |  | 355,5 | 595,1 | 770 |

<span class="mark">Biaya SDM pengembangan Skenario 2 mengikuti estimasi effort pada Subbab 3.2, yaitu 11,64 person-month × Rp 25 juta.</span>

<span id="_Toc243182800" class="anchor"></span><span class="mark">Tabel 4.5 Biaya Operasional Tahunan (Juta Rupiah)</span>

| **Komponen**                                | **S1** | **S2** | **S3** |
|---------------------------------------------|--------|--------|--------|
| Komputasi, inferensi, dan langganan layanan | 20,0   | 150,0  | 380,0  |
| Pemeliharaan dan pemutakhiran aturan        | 20,0   | 30,0   | 40,0   |
| Dukungan pengguna dan pelatihan ulang       | 10,0   | 20,0   | 30,0   |
| Total per tahun                             | 50,0   | 200,0  | 450,0  |

<span class="mark">Biaya komputasi Skenario 3 jauh di atas Skenario 2 karena lapis deterministik ditiadakan: butir yang pada Skenario 2 dihitung aturan seperti jumlah kata, persentase komponen anggaran, dan kelengkapan bagian ikut dikirim ke model bahasa. Menghapus satu komponen dari pengembangan justru memindahkan biayanya ke operasional, dan operasional berulang tiap tahun sedangkan pengembangan hanya sekali.</span>

### 4.4.3 Manfaat

<span class="mark">Pos biaya dapat berpotensi dihemat dengan cara pengurangan besaran honorarium per berkas. Pada tahun 2026 nilainya 79.210 berkas dikali Rp 50.000, yaitu Rp 3.960,5 juta per tahun. Apabila mengimplementasikan ketiga skenario, dengan asumsi pengurangan setiap skenario sebesar 50%.</span>

Dengan kapasitas 15 jam per reviewer per periode, menuntaskan 18.707 jam pemeriksaan saat ini menuntut sekitar 1247 orang.

<span id="_Toc243182801" class="anchor"></span>Tabel 4.6 Manfaat Terukur

| **Komponen**                                | **S1** | **S2**  | **S3**  |
|---------------------------------------------|--------|---------|---------|
| Proposal yang dinilai reviewer              | 79.210 | 79.210  | 0       |
| Penghematan honorarium (juta Rp/tahun)      | 1.980  | 792,1   | 3.960,5 |
| Jam pemeriksaan yang dibutuhkan per periode | 8.581  | 6.825   | 1.545   |
| Jumlah reviewer yang dibutuhkan (dari 1247) | 572    | 455     | 0       |
| Penurunan jumlah reviewer                   | 54%    | 63,5%   | 100%    |
| Total manfaat terukur (juta Rp/tahun)       | 1.980  | 3.168,4 | 3.960,5 |

<span class="mark">Tabel 4.6 menyajikan estimasi manfaat terukur (quantifiable benefits) dari tiga skenario implementasi sistem penilaian proposal. Manfaat tersebut diukur berdasarkan efisiensi waktu kerja, pengurangan ketergantungan tenaga ahli (reviewer), serta dampak ekonomi berupa penghematan honorarium tahunan.</span>

Pada Skenario 1, proses penilaian masih dilakukan sepenuhnya secara manual oleh reviewer untuk 79.210 proposal. Meskipun demikian, sudah terlihat efisiensi yang cukup baik di mana kebutuhan reviewer berkurang menjadi 572 orang (penurunan 54% dari kondisi awal). Waktu pemeriksaan yang dibutuhkan adalah 8.581 jam per periode, dengan total penghematan finansial mencapai Rp1.980 juta (Rp1,98 miliar) per tahun.

Skenario kedua menunjukkan peningkatan efisiensi yang lebih tajam. Dengan volume proposal yang sama, kebutuhan tenaga reviewer berhasil ditekan hingga tinggal 455 orang (penurunan 63,5%). Jam pemeriksaan juga berkurang menjadi 6.825 jam. Meski penghematan langsung dari honorarium terlihat lebih kecil (Rp792,1 juta), namun total manfaat terukur yang dihasilkan secara akumulatif melonjak signifikan menjadi Rp3.168,4 juta (Rp3,17 miliar) per tahun.

Skenario ketiga merupakan model dengan tingkat efisiensi tertinggi karena mengadopsi sistem penilaian otomatis sehingga ketergantungan pada reviewer mencapai 0 orang (penurunan 100%). Waktu kerja yang tersisa (1.545 jam) hanya digunakan untuk pengawasan sistem. Dampaknya, penghematan honorarium dan total manfaat tahunan mencapai titik maksimal sebesar Rp3.960,5 juta (Rp3,96 miliar).

### 4.4.4 Arus Kas dan Ukuran Kelayakan

<span id="_Toc243182802" class="anchor"></span><span class="mark">Tabel 4.7 Arus Kas Lima Tahun (Juta Rupiah)</span>

|  | **Skenario** | **2027** | **2028** | **2029** | **2030** | **2031** | **2032** | **Total** |
|----|----|----|----|----|----|----|----|----|
| PV manfaat | S1 | 0,0 | 1.867,9 | 1.762,2 | 1.662,4 | 1.568,3 | 1.479,6 | 8.340,4 |
| PV biaya | S1 | 355,5 | 47,2 | 44,5 | 42,0 | 39,6 | 37,4 | 566,2 |
| NPV tahunan | S1 | −355,5 | 1.820,7 | 1.717,7 | 1.620,4 | 1.528,7 | 1.442,2 | 7.774,2 |
| NPV kumulatif | S1 | −355,5 | 1.465,2 | 3.182,9 | 4.803,3 | 6.332,0 | 7.774,2 |  |
| PV manfaat | S2 | 0,0 | 2.989,1 | 2.819,9 | 2.660,3 | 2.509,7 | 2.367,7 | 13.346,8 |
| PV biaya | S2 | 595,1 | 188,7 | 178,0 | 167,9 | 158,4 | 149,5 | 1.437,6 |
| NPV tahunan | S2 | −595,1 | 2.800,4 | 2.641,9 | 2.492,4 | 2.351,3 | 2.218,2 | 11.909,2 |
| NPV kumulatif | S2 | −595,1 | 2.205,3 | 4.847,2 | 7.339,6 | 9.690,9 | 11.909,2 |  |
| PV manfaat | S3 | 0,0 | 4.782,5 | 4.511,8 | 4.256,4 | 4.015,5 | 3.788,2 | 21.354,4 |
| PV biaya | S3 | 770,0 | 424,5 | 400,5 | 377,8 | 356,4 | 336,3 | 2.665,5 |
| NPV tahunan | S3 | −770,0 | 4.358,0 | 4.111,3 | 3.878,6 | 3.659,1 | 3.451,9 | 18.688,9 |
| NPV kumulatif | S3 | −770,0 | 3.588,0 | 7.699,3 | 11.577,9 | 15.237,0 | 18.688,9 |  |

<span id="_Toc243182803" class="anchor"></span>Tabel 4.8 NPV, ROI, dan Break-even Point

| **Ukuran** | **Skenario 1** | **Skenario 2** | **Skenario 3** |
|----|----|----|----|
| Nilai kini seluruh manfaat (juta Rp) | 8.340,4 | 13.346,8 | 21.354,4 |
| Nilai kini seluruh biaya (juta Rp) | 566,2 | 1.437,6 | 2.665,5 |
| NPV (juta Rp) | 7.774,2 | 11.909,2 | 18.688,9 |
| ROI | 1.373,05% | 828,41% | 701,14% |
| Break-even point | 0,20 tahun | 0,21 tahun | 0,18 tahun |

<span class="mark">Ketiga skenario menunjukkan tingkat kelayakan yang sangat tinggi dengan nilai NPV positif dan ROI di atas 700%. Hal ini mengindikasikan bahwa proyek ini, dalam skenario mana pun, akan memberikan keuntungan ekonomi yang signifikan bagi organisasi dalam jangka waktu 5 tahun.</span>

**Skenario 1 (Efisiensi Modal Tertinggi):** Menawarkan ROI paling masif sebesar 1.373,05%. Pilihan ini sangat ideal jika organisasi mengutamakan efisiensi modal dan ingin meminimalkan risiko biaya awal, karena hanya membutuhkan total nilai kini biaya (PV Biaya) sebesar Rp566,2 juta (dengan biaya investasi awal Rp355,5 juta).

**Skenario 2 (Titik Keseimbangan):** Menghasilkan NPV sebesar Rp11,91 miliar dengan ROI mencapai 828,41% serta waktu balik modal (Break-even point) 0,21 tahun. Skenario ini menawarkan profil risiko-manfaat yang sangat seimbang dan layak diambil jika Skenario 1 dianggap terlalu terbatas dan Skenario 3 membutuhkan modal awal yang terlalu besar.

**Skenario 3 (Dampak Ekonomi Maksimal):** Memberikan nilai tambah bersih (NPV) terbesar, yaitu Rp18,69 miliar, dengan ROI sebesar 701,14% dan BEP 0,18 tahun. Ini adalah opsi terbaik jika organisasi memiliki kapasitas modal yang kuat dan menargetkan skala pertumbuhan yang maksimal.

### 4.4.5 Biaya Inkremental: Apa yang Dibeli dengan Selisihnya

<span class="mark">Karena ketiga skenario layak, pertanyaan sponsor bergeser dari “apakah kembali modal” menjadi “apa yang diperoleh dengan selisih biayanya”.</span>

<span id="_Toc243182804" class="anchor"></span>Tabel 4.9 Biaya Inkremental Antar Skenario

| **Langkah** | **Selisih Biaya Nilai Kini 5 Tahun** | **Per Proposal Per Tahun** | **Terhadap Honorarium Rp 50.000** | **Yang Diperoleh** |
|----|----|----|----|----|
| S1 → S2 | Rp 4.135,0 juta | Rp 10.441 | 20,9% | 5 butir cek semantik; cakupan naik dari 18 menjadi 23 butir; kebutuhan reviewer turun dari 572 menjadi 455 orang |
| S2 → S3 | Rp 6.779,7 juta | Rp 17.118 | 34,2% | Keputusan otomatis; honorarium Rp 3.960,5 juta per tahun hilang; lapis deterministik ditiadakan sehingga biaya inferensi naik; pertimbangan manusia juga hilang |

Tambahan biaya Skenario 2 atas Skenario 1 setara Rp 10.441 per proposal per tahun, atau sekitar dua puluh persen dari honorarium yang sudah dikeluarkan. Yang dibeli dengan itu adalah pemeriksaan atas lima butir yang paling menuntut pertimbangan, justru butir tempat subjektivitas reviewer paling mungkin muncul, yang merupakan masalah asal dalam System Request.

Perlu dijelaskan pula mengapa selisih waktu antara kedua skenario hanya 1,33 menit per proposal, padahal Skenario 2 menambahkan seluruh lapis semantik. Sebabnya ada pada kebutuhan 4.1: keputusan akhir tetap pada reviewer, sehingga pada Skenario 2 reviewer masih harus membaca proposal dan memverifikasi setiap rekomendasi sebelum menyetujuinya. Mesin menghemat pertimbangan, bukan pembacaan. Waktu membaca baru benar-benar hilang pada Skenario 3, ketika proposal tidak lagi dibaca manusia dan di situlah lompatan besar terjadi, baik pada waktu maupun pada biaya.

## 4.5 Kelayakan Organisasi

### 4.5.1 Keselarasan Strategis

<span class="mark">Proyek ini selaras dengan arah kebijakan pemerintah tentang penyelenggaraan pemerintahan berbasis elektronik dan dengan tugas DPPM menyelenggarakan seleksi yang akuntabel. Pada tingkat direktorat, keselarasannya diukur dari kesesuaian dengan proses yang berjalan. Sponsor menilai Skenario 1 dan Skenario 2 “sesuai dengan sebagian besar proses existing dan hanya membutuhkan perubahan minor”, sedangkan Skenario 3 “membutuhkan perubahan besar pada proses bisnis” dan “perubahan cara kerja secara menyeluruh”.</span>

### 4.5.2 Analisis Pemangku Kepentingan

<span id="_Toc243182805" class="anchor"></span>Tabel 4.10 Analisis Pemangku Kepentingan

| **Kelompok** | **Siapa** | **Kepentingan** | **Sikap terhadap proyek** |
|----|----|----|----|
| Project champion | Ketua Tim Kerja Penelitian DPPM | Akuntabilitas hasil penilaian dan ketepatan waktu seleksi | Mendukung; bersedia menyediakan sumber daya untuk Skenario 2 |
| Manajemen senior | Pimpinan direktorat dan direktorat jenderal | Kepatuhan anggaran dan reputasi proses seleksi | Mendukung secara umum; komitmen sumber daya baru muncul pada Skenario 2 |
| Pengguna | Reviewer seleksi administrasi | Beban kerja turun tanpa kehilangan kewenangan profesional | Menerima Skenario 1 dan 2; ragu terhadap Skenario 3 |
| Pihak lain | Pengusul dan pengelola BIMA | Umpan balik yang transparan; beban integrasi yang wajar | Netral; bergantung pada mutu penjelasan hasil |

<span class="mark">Jawaban sponsor mengenai dukungan pimpinan perlu dicatat apa adanya karena mengandung ketidakkonsistenan. Pada pertanyaan tentang besarnya dukungan, Skenario 1 dan Skenario 3 sama-sama dijawab “pimpinan mendukung secara umum tetapi belum ada komitmen sumber daya”, sedangkan Skenario 2 dijawab “pimpinan mendukung dan bersedia menyediakan sumber daya”. Namun pada pertanyaan lanjutan tentang kesediaan menyediakan anggaran dan SDM, Skenario 3 berubah menjadi “bersedia menyediakan sumber daya”. Naskah ini memakai jawaban yang lebih konservatif untuk Skenario 3 dan menyarankan hal tersebut diklarifikasi pada rapat pengambilan keputusan.</span>

### 4.5.3 Hasil Kuesioner Reviewer

<span id="_Toc243182806" class="anchor"></span>Tabel 4.11 Hasil Kuesioner Reviewer (n = 6, skala 1–5)

| **Indikator** | **S1** | **S2** | **S3** | **Catatan** |
|----|----|----|----|----|
| Kesediaan memakai sistem | 3,83 | 4,17 | 3,17 | S3 terendah |
| Kesesuaian dengan proses berjalan | 3,83 | 3,50 | 2,17 | Menurun seiring tingkat otomasi |
| Kebutuhan pelatihan (makin tinggi makin banyak) | 4,00 | 4,33 | 4,67 | Dibalik arahnya menjadi 2, 1,67, dan 1,33 saat dipakai sebagai indikator kelayakan |
| Waktu pemeriksaan tersisa (menit) | 6,50 | 5,17 | 1,17 | Diukur, bukan dinilai |

**Catatan atas pengolahan data.** Dua koreksi diterapkan terhadap rekapitulasi awal kelompok. Pertama, satu responden tercatat menjawab 10 menit untuk Skenario 1, padahal lembar jawabannya menuliskan 15 menit untuk Skenario 1 dan 10 menit untuk Skenario 2; nilai Skenario 2 tersalin ke kolom Skenario 1. Setelah dikoreksi, rata-rata Skenario 1 menjadi 6,50 menit. Kedua, indikator kebutuhan pelatihan semula dijumlahkan searah dengan indikator lain, sehingga Skenario 3 memperoleh nilai tertinggi justru karena paling banyak menuntut pelatihan. Arah indikator tersebut dibalik agar seluruh indikator berarti makin tinggi makin layak.

<span class="mark">Temuan terpenting dari kuesioner bukan angkanya, melainkan pola jawabannya. Penerimaan memuncak pada Skenario 2 dan turun pada Skenario 3, reviewer bersedia dibantu mesin, tetapi tidak bersedia digantikan. Alasan yang mereka kemukakan seragam: keputusan akhir harus tetap pada manusia karena persepsi mesin dan manusia dapat berbeda, dan karena tanpa verifikasi ulang kesalahan tidak akan tertangkap. Seorang responden menyatakan bahwa dengan otomasi penuh, reviewer tidak lagi terlibat dalam seleksi administrasi dan dapat memusatkan perhatian pada seleksi substansi, pandangan yang berbeda dari mayoritas dan perlu dicatat sebagai suara minoritas yang sah.</span>

## 4.6 Kesimpulan dan Rekomendasi

<span class="mark">\[Diisi: matriks bobot × skor teknis, ekonomi, dan organisasi untuk S1–S3, lalu skenario terpilih.\]</span>

<span class="mark">Berdasarkan hasil analisis kelayakan dari tiga dimensi (teknis, ekonomi, dan organisasi), Skenario 2 merupakan titik keseimbangan terbaik (sweet spot) yang direkomendasikan untuk diimplementasikan.</span>

**Alasan Kelayakan Teknis:** Menawarkan tingkat kompleksitas dan integrasi yang moderat tanpa risiko fatal. Mempertahankan lapis deterministik (aturan pasti seperti jumlah kata/biaya) sehingga hasil evaluasi tetap akurat dan dapat dibuktikan.

**Alasan Kelayakan Ekonomi:** Menghasilkan NPV sebesar Rp11,91 miliar dengan ROI 828,41% dan modal balik (Break-Even Point) cepat (0,21 tahun). Tambahan biaya dibandingkan Skenario 1 setara Rp10.441 per proposal per tahun (sekitar 21% honorarium), namun berhasil mencakup 5 butir cek semantik yang paling rawan terhadap subjektivitas reviewer.

**Alasan Kelayakan Organisasi:** Memperoleh dukungan tertinggi dari Project Champion dan pimpinan (yang berkomitmen menyediakan sumber daya). Mendapat tingkat penerimaan (penerimaan pengguna) tertinggi dari para reviewer (skor 4,17) karena fungsi mesin adalah membantu dan mengurangi beban kerja, bukan menggantikan peran manusia (man-in-the-loop).

# STRATEGI ANALISIS KEBUTUHAN DAN HASIL *AS-IS* VERSUS *TO-BE*

## 5.1 Teknik Pengumpulan Kebutuhan

<span class="mark">Pemilihan teknik mengikuti karakteristik teknik pengumpulan kebutuhan Dennis dkk. (2015) pada tabel berikut.</span>

<span id="_Toc243182811" class="anchor"></span>Tabel 5.1 Perbandingan teknik pengumpulan kebutuhan

| **Karakteristik** | **Wawancara** | **JAD** | **Kuesioner** | **Analisis dokumen** | **Observasi** |
|----|----|----|----|----|----|
| Jenis informasi | *As-is*, perbaikan, *to-be* | *As-is*, perbaikan, *to-be* | *As-is*, perbaikan | *As-is* | *As-is* |
| Kedalaman informasi | Tinggi | Tinggi | Sedang | Rendah | Rendah |
| Keluasan informasi | Rendah | Sedang | Tinggi | Tinggi | Rendah |
| Memadukan banyak sumber | Rendah | Tinggi | Rendah | Rendah | Rendah |
| Keterlibatan pengguna | Sedang | Tinggi | Rendah | Tidak ada | Rendah |
| Biaya | Sedang | Rendah–sedang | Rendah–sedang | Rendah | Rendah–sedang |

**Wawancara** dipakai untuk sponsor, Tim Kerja DPPM, dan tim TI karena narasumbernya sedikit dan informasi yang dibutuhkan mendalam (proses as-is, aturan penugasan, integrasi BIMA). **Kuesioner** dipakai untuk enam reviewer karena memberi data waktu pemeriksaan yang dapat dibandingkan antarresponden. **Analisis dokumen** diterapkan pada Panduan Penelitian dan PkM 2026, bahan Penyamaan Persepsi Reviewer Seleksi Administrasi 2026 (borang, review points, poin kesepakatan, dan alur BIMA), serta data kegagalan komponen 2026 dari DPPM. Observasi tidak dipakai karena pemeriksaan berlangsung di tempat masing-masing reviewer dan tidak terjadwal serentak; JAD tidak dipakai karena pemangku kepentingan tersebar di banyak perguruan tinggi.

## 5.2 Strategi Analisis yang Dipilih

<span class="mark">Proyek ini memakai **business process reengineering (BPR)** (Dennis, Wixom & Tegarden, 2015): proses seleksi administrasi diubah secara mendasar dengan mengubah organisasi yang terlibat. Verifikasi administratif oleh LPPM dihapus, pemeriksaan dipindahkan ke saat pengusul mengajukan proposal, dan pengusul memperoleh dua token submisi untuk memperbaiki kesalahan administratif. BPR dipilih berdasarkan pertimbangan dan perhitungan berikut.</span>

1.  **Penyaring pertama tidak berjalan.** LPPM memverifikasi komponen yang sama dengan reviewer tetapi meloloskan sekitar 95% proposal karena cenderung tidak menggugurkan institusinya sendiri. Akibatnya data DPPM 2026 mencatat 41.098 kegagalan komponen di tahap seleksi. Selama lapis ini tetap ada, perbaikan di sisi reviewer tidak menghentikan proposal bermasalah masuk seleksi.

2.  **Sebagian besar kegagalan dapat dicegah lebih awal.** 23.140 kegagalan (56,3%) berasal dari model sitasi dan daftar pustaka (12.786) serta jumlah kata (10.354), dua komponen yang dapat diperiksa pasti dengan aturan. Bila diperiksa saat submit dan pengusul diberi kesempatan memperbaiki, kesalahan ini dapat dibereskan sebelum seleksi. Ini sekaligus menjawab tidak adanya masa sanggah dan banyaknya keluhan pengusul yang gugur administrasi.

3.  **Beban reviewer turun signifikan.** Duration analysis (Tabel 5.2) menunjukkan waktu pemeriksaan turun dari 14,17 menjadi 5,17 menit per proposal (−63,5%), atau dari ±18.610 menjadi ±6.787 jam per periode untuk 78.818 proposal. Pada kapasitas 15 jam per reviewer per periode, kebutuhan reviewer turun dari ±1.241 menjadi ±453 orang; angka ±1.241 sejalan dengan jumlah reviewer aktual 2026 (1.066–1.244).

4.  **Biaya pemeriksaan terkonsentrasi pada aktivitas yang dapat diotomasi.** Dengan honorarium Rp 50.000 per proposal (±Rp 3.940,9 juta per periode) yang dialokasikan menurut waktu, penghitungan kata dan pengecekan sitasi masing-masing bernilai ±Rp 10.588 per proposal dan kesesuaian isi ±Rp 12.353 per proposal, atau 67% dari biaya pemeriksaan.

5.  **Ada waktu tunggu yang dapat dimanfaatkan.** Dari tenggat pengusulan (5 Januari) sampai seleksi administrasi selesai (27 Januari) berlalu 22 hari, termasuk ±14 hari proposal hanya menunggu penugasan. Pemeriksaan otomatis yang berjalan sejak submit memanfaatkan selisih ini.

6.  **Teknologinya tersedia.** Proposal berupa PDF yang dapat diekstrak, integrasi dengan BIMA dimungkinkan (tim TI), butir deterministik dapat diperiksa dengan aturan, dan model bahasa dapat mengembalikan kutipan sebagai bukti untuk butir yang menuntut pembacaan isi.

Waktu per langkah pada tabel berikut adalah asumsi kelompok yang membagi rata-rata 14,17 menit dari enam responden (20, 10, 10, 10, 15, 20 menit) secara proporsional terhadap langkah yang disebut responden paling lama. Waktu to-be memakai rata-rata perkiraan responden untuk sistem yang diusulkan (10, 10, 2, 3, 3, 3 menit; rata-rata 5,17 menit).

<span id="_Toc243182809" class="anchor"></span>Tabel 5.2 Duration analysis pemeriksaan reviewer

| **Langkah pemeriksaan reviewer** | **As-is (menit)** | **To-be (menit)** | **Perubahan** |
|----|----|----|----|
| Membuka daftar usulan dan mengunduh proposal | 0,50 | 0,50 | Tetap |
| Screening cepat (template, judul, kata kunci) | 1,00 | 0,50 | Diperiksa otomatis; reviewer verifikasi |
| Kesesuaian isi per bagian | 3,50 | 2,00 | Rekomendasi AI dengan kutipan |
| Jumlah kata per bagian | 3,00 | (termasuk di atas) | Dihitung otomatis |
| Sitasi dan daftar pustaka | 3,00 | (termasuk di atas) | Diperiksa otomatis |
| Lampiran (surat mahasiswa, artikel, mitra) | 1,00 | 0,50 | Keberadaan dicek otomatis |
| Asesmen ulang TKT | 0,50 | 0,50 | Tetap |
| Menulis komentar, mengisi toggle, menyimpan | 1,67 | 1,17 | Ringkasan kesalahan disiapkan sistem |
| **Total per proposal** | **14,17** | **5,17** | **−63,5%** |
| **Total per periode (78.818 proposal)** | **±18.610 jam** | **±6.787 jam** | **−11.823 jam** |

Aktivitas yang dihapus atau diubah oleh BPR dirangkum pada tabel berikut.

<span id="_Toc243182810" class="anchor"></span>Tabel 5.3 Aktivitas yang dihapus dan diubah

| **Aktivitas** | **Keputusan** | **Alasan** |
|----|----|----|
| Verifikasi administratif LPPM | Dihapus | Meloloskan ±95%; digantikan pemeriksaan otomatis saat submit. LPPM tetap memberi persetujuan institusi. |
| Penghitungan kata dan pengecekan sitasi manual oleh reviewer | Dihapus | Dikerjakan lapis deterministik |
| Pemeriksaan isi oleh reviewer dari nol | Diubah | Reviewer memverifikasi rekomendasi AI beserta kutipannya |
| <span class="mark">Satu kali submit tanpa umpan balik</span> | Diubah | Dua token submisi dengan hasil cek per butir |

Risiko perubahan sebesar ini dikendalikan dengan tiga keputusan: LPPM tetap memberi persetujuan institusi, sistem hanya menggagalkan submisi secara otomatis untuk butir deterministik, dan keputusan akhir tetap pada reviewer.

<span class="mark">Selain BPR, proyek ini memakai business process outsourcing (BPO) untuk pembangunan dan pemeliharaan sistem: pekerjaan pengembangan perangkat lunak diserahkan kepada vendor, karena DPPM tidak memiliki tim TI internal yang mengembangkan perangkat lunak. Tim TI DPPM berperan sebagai pengelola BIMA dan penghubung integrasi, sedangkan keputusan seleksi tetap dijalankan Tim Kerja DPPM dan reviewer.</span>

## 5.3 Proses As-Is

Proses as-is disusun dari bahan Penyamaan Persepsi Reviewer 2026, wawancara DPPM, dan jawaban kuesioner reviewer.

<img src="media/image1.png" style="width:5.51042in;height:3.60417in" />

<span id="_Toc243182766" class="anchor"></span>Gambar 5.1 Use Case As-is

<img src="media/image2.png" style="width:5.36213in;height:4.91153in" />

<span id="_Toc243182767" class="anchor"></span>Gambar 5.2 Proses as-is seleksi administrasi

<span id="_Toc243182812" class="anchor"></span>Tabel 5.4 Langkah proses as-is

| **No** | **Langkah** | **Pelaku** | **Waktu** | **Titik lemah** |
|----|----|----|----|----|
| 1 | Pengusul menyusun dan mengirim proposal di BIMA | Pengusul | 3 Des 2025 – 5 Jan 2026 | Tidak ada umpan balik sebelum seleksi |
| 2 | LPPM memeriksa komponen borang dan menyetujui usulan (toggle Verifikasi LPPM, Komentar LPPM); selama masa CFP dapat mengembalikan ke pengusul | LPPM | s.d. 6 Jan 2026 | ±95% diloloskan; konflik kepentingan |
| 3 | DPPM membagi judul secara rata ke reviewer yang bersedia (institusi berbeda dari pengusul) dan mengadakan penyamaan persepsi | Tim Kerja DPPM | 6–20 Jan 2026 | Proposal menunggu ±14 hari |
| 4 | Reviewer mengunduh proposal, memeriksa enam komponen borang secara manual, mengisi toggle dan komentar maks. 25 kata, lalu Simpan Permanen | Reviewer | 20–27 Jan 2026; ±14,17 menit per proposal | Penghitungan kata dan pengecekan sitasi manual; tafsiran berbeda |
| 5 | Keputusan reviewer final; hasil dan komentar tampil ke pengusul di BIMA; tidak ada masa sanggah | Reviewer, BIMA | Setelah 27 Jan 2026 | Pengusul tidak dapat memperbaiki; banyak keluhan |

Pemeriksaan administrasi memakai borang enam komponen yang berlaku berbeda per skema. Katalog butir di bawah memetakan ketentuan pada borang dan review points 2026 ke jenis pemeriksaannya: D (deterministik, dapat diperiksa pasti dengan aturan), S (semantik, menuntut pembacaan isi), atau D+S.

<span id="_Toc243182813" class="anchor"></span>Tabel 5.5 Katalog butir seleksi administrasi 2026

| **Komponen borang** | **Ketentuan** | **Jenis** |
|----|----|----|
| Screening | Template sesuai skema yang diajukan | D |
| Screening | Judul di template sama dengan judul di sistem | D |
| 1\. Kesesuaian isi per bagian | Ringkasan memuat urgensi, tujuan, metode, dan luaran | S |
| 1\. Kesesuaian isi per bagian | Pendahuluan memuat latar belakang dan rumusan masalah, pendekatan pemecahan masalah, state of the art dan kebaruan, serta peta jalan | S |
| 1\. Kesesuaian isi per bagian | Metode memuat diagram alir | D+S |
| 1\. Kesesuaian isi per bagian | Metode memuat pembagian tugas anggota peneliti dan mitra (boleh tersirat) | S |
| 1\. Kesesuaian isi per bagian | Hasil yang diharapkan terisi | D+S |
| 2\. Jumlah kata per bagian | Jumlah kata tiap bagian tidak melebihi batas pada template skema (diagram, tabel, dan gambar tidak dihitung; tanpa toleransi) | D |
| 2\. Jumlah kata per bagian | Kata kunci tepat lima, dipisahkan titik koma, boleh berupa frasa | D |
| 3\. Sitasi dan daftar pustaka | Sitasi dalam paragraf memakai sistem penomoran | D |
| 3\. Sitasi dan daftar pustaka | Daftar pustaka bernomor dan berurutan sesuai pengutipan | D |
| 3\. Sitasi dan daftar pustaka | Jumlah referensi sama dengan yang dikutip | D |
| 4\. Lampiran surat mahasiswa bimbingan | Surat keterangan/tugas dilampirkan | D |
| 4\. Lampiran surat mahasiswa bimbingan | Nama promotor dan mahasiswa sesuai proposal; ditandatangani minimal pimpinan program studi | S |
| 5\. Artikel ketua pengusul | Artikel dan tautan jurnal dilampirkan; ketua sebagai first atau corresponding author | D+S |
| 5\. Artikel ketua pengusul | Artikel hasil penelitian (bukan review), jurnal bereputasi internasional, berstatus published, relevan, dan disitasi di proposal | S |
| 6\. Surat pernyataan mitra | Identitas mitra dan judul sesuai; tidak berafiliasi dengan pengusul; bermeterai dan ditandatangani pimpinan mitra | D+S |
| Catatan tambahan | Asesmen ulang TKT (hanya komentar, tidak memengaruhi skor) | S |

## 5.4 Proses To-Be

<img src="media/image3.png" style="width:5.51042in;height:3.6875in" />

<span id="_Toc243182768" class="anchor"></span><span class="mark">Gambar 5.3 Use case diagram to - be</span>

<img src="media/image4.png" style="width:5.51072in;height:5.88119in" />

Gambar 5.4 <span class="mark">Proses to-be</span> seleksi administrasi

<span id="_Toc243182814" class="anchor"></span>Tabel 5.6 Langkah proses to-be

| **No** | **Langkah** | **Pelaku** | **Perubahan dari as-is** |
|----|----|----|----|
| 1 | <span class="mark">Pengusul mengajukan proposal di BIMA (token ke-1)</span> | Pengusul | Pemeriksaan dimulai saat submit |
| 2 | Sistem memeriksa butir deterministik (aturan) dan butir semantik (LLM) | Sistem, Layanan LLM | Baru; menggantikan verifikasi LPPM |
| 3 | Pengusul melihat hasil pemeriksaan per butir dengan angka atau kutipan | Pengusul | Baru |
| 4 | Bila ada butir gagal, pengusul merevisi dan mengajukan ulang (token ke-2); sistem memeriksa ulang | Pengusul, Sistem | Baru; risiko waktu ditanggung pengusul |
| 5 | Bila setelah token ke-2 masih ada butir deterministik gagal, status gagal submisi; butir semantik tetap diteruskan | Sistem | Baru |
| 6 | LPPM memberi persetujuan institusi tanpa memeriksa borang | LPPM | Verifikasi administratif dihapus |
| 7 | Reviewer melakukan pemeriksaan akhir berdasarkan hasil deterministik dan rekomendasi AI; alasan wajib bila menolak rekomendasi; komentar tanpa batas 25 kata | Reviewer | ±5,17 menit per proposal |
| 8 | Hasil dan komentar tampil ke pengusul di BIMA; Tim Kerja DPPM memantau kesesuaian | BIMA, Tim Kerja DPPM | Pemantauan baru |

<span class="mark">\[Diisi: kalimat jembatan dari proses to-be ke kebutuhan fungsional dan non-fungsional di Bab 6.\]</span>

# DEFINISI KEBUTUHAN

## 6.1 Kebutuhan Fungsional

<span class="mark">Kebutuhan ditulis dalam format bernomor sesuai Dennis, Wixom & Tegarden (2015), diturunkan dari kebutuhan bisnis *system request* dan katalog bagian pemeriksaan pada Tabel 5.5. Daftar di bawah adalah kebutuhan **sistem yang diusulkan**; kebutuhan yang hanya berlaku pada alternatif yang tidak dipilih sudah dikeluarkan.</span>

<span id="_Toc243182807" class="anchor"></span>Tabel 6.1 Kebutuhan Fungsional

| **No** | **Kebutuhan** |
|----|----|
| **1** | **Mengelola basis aturan** |
| 1.1 | <span class="mark">Pengelola aturan mengunggah dan memperbarui daftar butir cek per skema pendanaan</span> |
| 1.2 | Pengelola aturan mengatur ambang penilaian dan parameter tiap skema |
| 1.3 | Sistem menyimpan riwayat versi basis aturan beserta tanggal berlakunya |
| 1.4 | Sistem menarik berkas proposal beserta metadatanya dari BIMA |
| 1.5 | Sistem memotong proposal menjadi bagian-bagian sesuai template Panduan |
| 1.6 | Sistem membuang kalimat petunjuk template sebelum penghitungan kata |
| **2** | **Memeriksa secara deterministik** |
| 2.1 | Sistem menguji tiap butir deterministik dan mengembalikan hasil beserta angka pembuktinya |
| 2.2 | Sistem menandai butir yang gugur beserta ketentuan yang dilanggar |
| 3 | **Memeriksa secara semantik** |
| 3.1 | Sistem menilai butir yang menuntut pembacaan isi dan mengembalikan rekomendasi beserta kutipan pendukung |
| 3.2 | Sistem menyertakan tingkat keyakinan pada tiap rekomendasi semantik |
| 3.3 | Sistem menilai butir yang menuntut pembacaan isi dan mengembalikan rekomendasi beserta kutipan pendukung |
| **4** | **Menyampaikan rekomendasi ke pengusul** |
| 4.1 | Sistem menyusun ringkasan umpan balik dari butir deterministik dan semantik yang tidak lolos |
| 4.2 | Sistem mengirimkan umpan balik proposal ke Sistem BIMA agar dapat diakses pengusul |
| 4.3 | *Reviewer* mencari dan menyaring proposal berdasarkan status dan skema |
| 4.4 | Sistem menyimpan status pengiriman umpan balik dan mengulang pengiriman apabila gagal |
| **5** | **Menilai Proposal** |
| 5.1 | Sistem membuat penilaian dari pemeriksaan deterministik |
| 5.2 | Sistem membuat penilaian dari pemeriksaan semantik |
| 5.3 | Sistem menggabungkan penilaian dan membuat rekomendasi kepada Reviewer |
| 5.4 | Reviewer dapat memberikan feedback dan keputusan akhir |

## 6.2 Kebutuhan Non-Fungsional

<span id="_Toc243182808" class="anchor"></span>Tabel 6.2 Kebutuhan non-fungsional

| **No** | **Kebutuhan** |
|----|----|
| **1** | **Operasional** |
| 1.1 | <span class="mark">Sistem berjalan pada server milik DPPM dan dapat diakses melalui peramban web tanpa pemasangan perangkat lunak di sisi *reviewer*</span> |
| 1.2 | Sistem menerima berkas proposal dalam format yang dihasilkan BIMA tanpa konversi manual |
| 1.3 | Basis aturan dapat diubah oleh pengelola aturan tanpa mengubah kode program |
| 1.4 | Sistem melakukan pencadangan data rekomendasi dan log audit setiap hari |
| **2** | ***Performance*** |
| 2.1 | Sistem menghasilkan penilaian satu proposal dalam waktu tidak lebih dari 2 menit sejak berkas diterima |
| 2.2 | Sistem memproses paling sedikit 4.000 proposal per hari pada masa puncak seleksi |
| 2.3 | Antarmuka *reviewer* menampilkan halaman penilaian dalam waktu tidak lebih dari 3 detik |
| 2.4 | Sistem menyelesaikan panggilan ke layanan LLM tidak lebih dari 15 detik per bagian semantik |
| 2.5 | Sistem mampu membuat antrian (queue) ke layanan LLM saat puncak beban terjadi tanpa kehilangan permintaan request |
| **3** | **Keamanan** |
| 3.1 | Hanya *reviewer* yang ditugaskan pada suatu proposal yang dapat membuka halaman penilaian proposal tersebut |
| 3.2 | Hanya pengelola aturan yang dapat mengubah basis aturan dan ambang penilaian |
| 3.3 | Log audit bersifat *view-only*; tidak ada peran yang dapat mengubah atau menghapus entri yang sudah tercatat |
| 3.4 | Isi proposal dienkripsi saat disimpan maupun saat dikirimkan |
| **4** | **Reliabilitas** |
| 4.1 | Keputusan akhir seleksi administrasi tetap berada pada *reviewer*; sistem hanya memberi rekomendasi |
| 4.2 | Pemrosesan isi proposal tunduk pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi |
| 4.3 | Sistem tersedia (uptime) minimal 99% selama periode seleksi proposal berlangsung |
| 4.4 | Sistem melakukan pengulangan otomatis maksimal 2 kali jika permintaan ke BIMA atau layanan LLM gagal, sebelum menandai kegagalan |
| **5** | **Usabilitas** |
| 5.1 | Antarmuka reviewer dirancang sederhana mengingat mayoritas reviewer bukan pengguna sistem TI harian |
| 5.2 | Sistem menampilkan indikator visual tingkat keyakinan pada tiap rekomendasi semantik agar mudah diinterpretasi reviewer |

# MODEL FUNGSIONAL

## 7.1 Use Case Diagram

<img src="media/image3.png" style="width:5.51112in;height:3.68797in" />

<span id="_Toc243182769" class="anchor"></span>Gambar 7.1 Use case diagram sistem rekomendasi penilaian administrasi

Diagram memuat tiga aktor manusia, yaitu Tim Kerja DPPM yang mengelola aturan dan memantau kesesuaian, Pengusul yang mengajukan dan merevisi proposal, dan Reviewer yang melakukan pemeriksaan akhir, serta dua sistem eksternal: «system» BIMA sebagai sumber proposal sekaligus tujuan pengembalian hasil, dan «system» Layanan LLM sebagai mesin pemeriksa semantik. Relasi «include» dipakai ketika satu use case selalu memanggil use case lain, dan «extend» ketika use case perluasan hanya terjadi pada kondisi tertentu <span class="mark">(ada butir gagal dan token masih tersisa)</span>.

<span id="_Toc243182815" class="anchor"></span><span class="mark">Tabel 7.1 Daftar use case dan jumlah transaksinya</span>

| **ID** | **Use case** | **Aktor utama** | **Relasi** | **Transaksi** | **Jenis** |
|----|----|----|----|----|----|
| UC-01 | Mengelola templat proposal | Tim Kerja DPPM | — | 7 | Average |
| UC-02 | Mengelola aturan pemeriksaan | Tim Kerja DPPM | — | 7 | Average |
| UC-03 | Menugaskan reviewer | Tim Kerja DPPM, BIMA | — | 7 | Average |
| UC-04 | Memantau kesesuaian penilaian | Tim Kerja DPPM | — | 6 | Average |
| UC-05 | Mengajukan proposal | Pengusul | «include» UC-06 | 6 | Average |
| UC-06 | Memeriksa butir deterministik | — (disertakan) | — | 7 | Average |
| UC-07 | Melakukan pemeriksaan akhir | Reviewer | — | 8 | Complex |
| UC-08 | Mengoreksi rekomendasi sistem | — (disertakan) | «extend» UC-07 | 5 | Simple |
| UC-09 | Memeriksa butir semantik | Layanan LLM | «include» UC-07 | 6 | Average |

## 7.2 Use Case Description

Setiap *use case* diuraikan dengan templat Dennis, Wixom & Tegarden (2015). *Pre-condition* adalah keadaan yang sudah harus benar sebelum *use case* dimulai, berbeda dengan *trigger* yang memulainya. *SubFlows* berisi cabang yang tetap mencapai *post-condition*, sedangkan *Alternate/Exceptional Flows* berisi alur yang berhenti sebelum *post-condition* tercapai. Langkah ditulis pada tingkat *essential*, tanpa menyebut layar atau tombol.

### UC-01 Mengelola templat proposal

<span id="_Toc243182816" class="anchor"></span>Tabel 7.2 Deskripsi UC-01 Mengelola templat proposal

<table style="width:100%;">
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Use Case Name</td>
<td>Mengelola templat proposal</td>
</tr>
<tr>
<td>ID</td>
<td>UC-01</td>
</tr>
<tr>
<td>Importance Level</td>
<td>Tinggi. Gerbang deterministik bergantung pada templat.</td>
</tr>
<tr>
<td>Primary Actor</td>
<td>Tim Kerja DPPM</td>
</tr>
<tr>
<td>Use Case Type</td>
<td>Detail, Essential</td>
</tr>
<tr>
<td>Stakeholders and Interests</td>
<td><p>Tim Kerja DPPM: templat sesuai panduan tahun berjalan.</p>
<p>Pengusul: tahu sejak awal bagian apa saja yang wajib dan batas kata tiap bagian.</p>
<p><em>Reviewer</em>: struktur proposal seragam sehingga cepat dibaca.</p></td>
</tr>
<tr>
<td>Brief Description</td>
<td>Tim Kerja DPPM menyusun dan memperbarui templat proposal per skema: daftar bagian, batas kata tiap bagian, dan lampiran wajib, beserta periode berlakunya. Saat templat diterbitkan, sistem otomatis membuat butir cek deterministik yang lahir dari templat sebagai draf di basis aturan, sehingga batas kata cukup ditetapkan sekali.</td>
</tr>
<tr>
<td>Trigger</td>
<td>Panduan penelitian tahun berjalan terbit, atau ketentuan suatu skema berubah.</td>
</tr>
<tr>
<td>Type</td>
<td>External</td>
</tr>
<tr>
<td>Pre-condition</td>
<td>Tim Kerja DPPM sudah masuk ke sistem dengan hak pengelola. Daftar skema pendanaan periode berjalan sudah tersedia.</td>
</tr>
<tr>
<td>Post-condition</td>
<td>Templat versi baru tersimpan dengan periode berlakunya dan dapat dipakai pengusul. Butir cek deterministik turunannya tersedia sebagai draf di basis aturan. Versi lama tersimpan sebagai arsip.</td>
</tr>
<tr>
<td>Relationships</td>
<td><p>Association: Tim Kerja DPPM</p>
<p>Include: —</p>
<p>Extend: —</p>
<p>Generalization: —</p></td>
</tr>
<tr>
<td>Normal Flow of Events</td>
<td><p>1. Tim Kerja DPPM memilih skema yang templatnya akan disusun.</p>
<p>2. Sistem menampilkan templat yang berlaku untuk skema itu.</p>
<p>3. Tim Kerja DPPM menetapkan daftar bagian proposal, batas jumlah kata tiap bagian, dan lampiran yang wajib.</p>
<p>4. Tim Kerja DPPM menetapkan periode berlaku templat.</p>
<p>5. Sistem memeriksa kelengkapan isian templat.</p>
<p>6. Sistem menyimpan templat sebagai versi baru dan menerbitkannya untuk pengusul.</p>
<p>7. Sistem membuat butir cek deterministik turunan templat (bagian wajib, batas kata tiap bagian, lampiran wajib) sebagai draf di basis aturan, untuk ditinjau di UC-02.</p></td>
</tr>
<tr>
<td>SubFlows</td>
<td><p>S-1 (langkah 2) Skema belum punya templat: sistem menyediakan templat kosong, lalu lanjut ke langkah 3.</p>
<p>S-2 (langkah 5) Isian belum lengkap: sistem menunjukkan bagian yang belum diisi, Tim Kerja DPPM melengkapinya, lalu kembali ke langkah 5.</p></td>
</tr>
<tr>
<td>Alternate/Exceptional Flows</td>
<td>6a. Masa pengusulan skema itu sedang berjalan: sistem tidak menerbitkan perubahan, supaya semua pengusul dinilai dengan templat yang sama. Templat disimpan sebagai draf untuk periode berikutnya, dan <em>use case</em> berhenti.</td>
</tr>
</tbody>
</table>

### UC-02 Mengelola aturan pemeriksaan 

<span id="_Toc243182817" class="anchor"></span>Tabel 7.3 Deskripsi UC-02 Mengelola aturan pemeriksaan

<table style="width:100%;">
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Use Case Name</td>
<td>Mengelola aturan pemeriksaan</td>
</tr>
<tr>
<td>ID</td>
<td>UC-02</td>
</tr>
<tr>
<td>Importance Level</td>
<td>Tinggi</td>
</tr>
<tr>
<td>Primary Actor</td>
<td>Tim Kerja DPPM</td>
</tr>
<tr>
<td>Use Case Type</td>
<td>Detail, Essential</td>
</tr>
<tr>
<td>Stakeholders and Interests</td>
<td><p>Tim Kerja DPPM: aturan sesuai borang dan <em>review points</em> tahun berjalan.</p>
<p><em>Reviewer</em>: rekomendasi sistem konsisten antarproposal.</p>
<p>Pengusul: hasil pemeriksaan bisa dijelaskan.</p></td>
</tr>
<tr>
<td>Brief Description</td>
<td>Tim Kerja DPPM meninjau butir cek turunan templat yang dibuat otomatis oleh UC-01, lalu menyusun butir yang tidak berasal dari templat: aturan sitasi dan kata kunci (deterministik), serta seluruh butir semantik beserta pertanyaan pemeriksaannya. Nilai butir turunan templat terkunci dan hanya bisa diubah lewat templat, supaya batasnya tidak ditetapkan dua kali.</td>
</tr>
<tr>
<td>Trigger</td>
<td>Butir turunan templat baru dibuat karena templat diterbitkan (UC-01), atau hasil pemantauan (UC-04) menandai butir yang sering dikoreksi.</td>
</tr>
<tr>
<td>Type</td>
<td>External</td>
</tr>
<tr>
<td>Pre-condition</td>
<td>Templat skema sudah diterbitkan dan butir turunannya tersedia (UC-01). Tim Kerja DPPM sudah masuk ke sistem dengan hak pengelola.</td>
</tr>
<tr>
<td>Post-condition</td>
<td>Basis aturan versi baru tersimpan dengan tanggal berlakunya dan tercatat di log audit.</td>
</tr>
<tr>
<td>Relationships</td>
<td><p>Association: Tim Kerja DPPM</p>
<p>Include: —</p>
<p>Extend: —</p>
<p>Generalization: —</p></td>
</tr>
<tr>
<td>Normal Flow of Events</td>
<td><p>1. Tim Kerja DPPM memilih skema dan periode seleksi.</p>
<p>2. Sistem menampilkan butir cek yang berlaku beserta jenisnya, termasuk butir turunan templat yang nilainya terkunci.</p>
<p>3. Tim Kerja DPPM menambah, mengubah, atau menonaktifkan butir cek yang tidak berasal dari templat.</p>
<p>4. Tim Kerja DPPM menetapkan parameter tiap butir tersebut: aturan hitung untuk butir deterministik (sitasi, kata kunci), atau pertanyaan pemeriksaan dan contoh jawaban untuk butir semantik.</p>
<p>5. Sistem menguji aturan pada contoh proposal periode sebelumnya dan menampilkan hasilnya.</p>
<p>6. Tim Kerja DPPM menetapkan tanggal berlaku.</p>
<p>7. Sistem menyimpan basis aturan sebagai versi baru dan mencatatnya di log audit.</p></td>
</tr>
<tr>
<td>SubFlows</td>
<td>S-1 (langkah 5) Hasil uji belum sesuai harapan: Tim Kerja DPPM memperbaiki parameter, lalu kembali ke langkah 5.</td>
</tr>
<tr>
<td>Alternate/Exceptional Flows</td>
<td><p>3a. Tim Kerja DPPM mencoba mengubah nilai butir turunan templat, misalnya batas kata: sistem menolak dan mengarahkan ke UC-01. <em>Use case</em> berhenti.</p>
<p>6a. Tanggal berlaku jatuh di tengah masa pengusulan yang sedang berjalan: sistem menolak, karena proposal dalam satu periode harus dinilai dengan aturan yang sama. <em>Use case</em> berhenti.</p></td>
</tr>
</tbody>
</table>

### UC-03 Menugaskan reviewer

<span id="_Toc243182818" class="anchor"></span>Tabel 7.4 Deskripsi UC-03 Menugaskan reviewer

<table style="width:100%;">
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Use Case Name</td>
<td>Menugaskan <em>reviewer</em></td>
</tr>
<tr>
<td>ID</td>
<td>UC-03</td>
</tr>
<tr>
<td>Importance Level</td>
<td>Sedang</td>
</tr>
<tr>
<td>Primary Actor</td>
<td>Tim Kerja DPPM</td>
</tr>
<tr>
<td>Use Case Type</td>
<td>Detail, Essential</td>
</tr>
<tr>
<td>Stakeholders and Interests</td>
<td><p>Tim Kerja DPPM: semua proposal tertugaskan cepat dan adil.</p>
<p><em>Reviewer</em>: beban kerja rata dan sesuai kesediaan.</p>
<p>Pengusul: dinilai <em>reviewer</em> dari institusi lain.</p></td>
</tr>
<tr>
<td>Brief Description</td>
<td>Setelah masa pengusulan ditutup, sistem menyusun usulan penugasan otomatis (<em>reviewer</em> dari institusi berbeda, beban rata). Tim Kerja DPPM meninjau dan menetapkannya, lalu penugasan dikirim ke BIMA.</td>
</tr>
<tr>
<td>Trigger</td>
<td>Masa pengusulan ditutup.</td>
</tr>
<tr>
<td>Type</td>
<td>Temporal</td>
</tr>
<tr>
<td>Pre-condition</td>
<td>Daftar <em>reviewer</em> yang bersedia beserta institusinya tersedia di BIMA. Tim Kerja DPPM sudah masuk ke sistem.</td>
</tr>
<tr>
<td>Post-condition</td>
<td>Setiap proposal terkirim punya <em>reviewer</em> yang ditetapkan, dan penugasannya tercatat di BIMA.</td>
</tr>
<tr>
<td>Relationships</td>
<td><p>Association: Tim Kerja DPPM, «system» BIMA</p>
<p>Include: —</p>
<p>Extend: —</p>
<p>Generalization: —</p></td>
</tr>
<tr>
<td>Normal Flow of Events</td>
<td><p>1. Tim Kerja DPPM menetapkan batas beban <em>reviewer</em> pada periode yang sedang berlangsung.</p>
<p>2. Sistem menarik daftar <em>reviewer</em> yang bersedia beserta institusinya dari BIMA.</p>
<p>3. Sistem membagi proposal terkirim ke <em>reviewer</em> dari institusi yang berbeda dengan pengusul, dengan beban rata.</p>
<p>4. Sistem menampilkan usulan penugasan beserta sebaran beban tiap <em>reviewer</em>.</p>
<p>5. Tim Kerja DPPM meninjau usulan penugasan.</p>
<p>6. Tim Kerja DPPM menetapkan penugasan.</p>
<p>7. Sistem mengirim penugasan ke BIMA dan memberi notifikasi kepada <em>reviewer</em>.</p></td>
</tr>
<tr>
<td>SubFlows</td>
<td><p>S-1 (langkah 2) Jumlah reviewer tidak cukup untuk batas beban, maka akan memperlihatkan kekurangannya dan Tim Kerja DPPM dapat mengubah batas beban sesuai kebutuhan atau menambahkan reviewer lain ke BIMA, lalu kembali ke langkah 2.</p>
<p>S-2 (langkah 5) Tim Kerja DPPM memindahkan sebagian proposal ke <em>reviewer</em> lain: sistem memeriksa ulang syarat institusi dan beban, lalu kembali ke langkah 4.</p></td>
</tr>
<tr>
<td>Alternate/Exceptional Flows</td>
<td>-</td>
</tr>
</tbody>
</table>

### UC-04 Memantau kesesuaian penilaian

<span id="_Toc243182819" class="anchor"></span>Tabel 7.5 Deskripsi UC-04 Memantau kesesuaian penilaian

<table style="width:100%;">
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Use Case Name</td>
<td>Memantau kesesuaian penilaian</td>
</tr>
<tr>
<td>ID</td>
<td>UC-04</td>
</tr>
<tr>
<td>Importance Level</td>
<td>Rendah</td>
</tr>
<tr>
<td>Primary Actor</td>
<td>Tim Kerja DPPM</td>
</tr>
<tr>
<td>Use Case Type</td>
<td>Detail, Essential</td>
</tr>
<tr>
<td>Stakeholders and Interests</td>
<td><p>Tim Kerja DPPM: tahu seberapa sering rekomendasi sistem dikoreksi dan butir mana yang bermasalah.</p>
<p>Pimpinan DPPM: bukti akuntabilitas pemakaian AI.</p>
<p><em>Reviewer</em>: koreksi mereka ditindaklanjuti.</p></td>
</tr>
<tr>
<td>Brief Description</td>
<td>Tim Kerja DPPM melihat tingkat kesesuaian rekomendasi sistem dengan keputusan <em>reviewer</em> per butir, skema, dan periode, beserta alasan koreksi dan butir deterministik yang paling sering gagal, sebagai dasar memperbaiki aturan.</td>
</tr>
<tr>
<td>Trigger</td>
<td>Tim Kerja DPPM ingin meninjau mutu pemeriksaan, misalnya di akhir periode seleksi.</td>
</tr>
<tr>
<td>Type</td>
<td>External</td>
</tr>
<tr>
<td>Pre-condition</td>
<td>Sudah ada penilaian <em>reviewer</em> yang final pada periode yang dipilih.</td>
</tr>
<tr>
<td>Post-condition</td>
<td>Laporan kesesuaian ditampilkan. Butir yang sering dikoreksi oleh reviewer ditandai sebagai bahan evaluasi UC-02.</td>
</tr>
<tr>
<td>Relationships</td>
<td><p>Association: Tim Kerja DPPM</p>
<p>Include: —</p>
<p>Extend: —</p>
<p>Generalization: —</p></td>
</tr>
<tr>
<td>Normal Flow of Events</td>
<td><p>1. Tim Kerja DPPM memilih periode dan skema.</p>
<p>2. Sistem menampilkan rekap butir deterministik yang paling sering gagal saat pengajuan, per institusi.</p>
<p>3. Sistem menghitung persentase rekomendasi yang disetujui <em>reviewer</em> untuk setiap butir.</p>
<p>4. Sistem menampilkan butir dengan tingkat koreksi tertinggi beserta alasan koreksi <em>reviewer</em>.</p>
<p>5. Tim Kerja DPPM menandai butir yang aturannya perlu diperbaiki.</p>
<p>6. Sistem menyimpan tanda tersebut sebagai bahan perbaikan aturan (UC-02).</p></td>
</tr>
<tr>
<td>SubFlows</td>
<td>S-1 (langkah 4) Tim Kerja DPPM membuka rincian satu butir: sistem menampilkan contoh rekomendasi, kutipan, dan keputusan <em>reviewer</em>, lalu kembali ke langkah 4.</td>
</tr>
<tr>
<td>Alternate/Exceptional Flows</td>
<td>—</td>
</tr>
</tbody>
</table>

### UC-05 Mengajukan proposal

<span id="_Toc243182820" class="anchor"></span>Tabel 7.6 Deskripsi UC-05 Mengajukan proposal

<table style="width:100%;">
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Use Case Name</td>
<td>Mengajukan proposal</td>
</tr>
<tr>
<td>ID</td>
<td>UC-05</td>
</tr>
<tr>
<td>Importance Level</td>
<td>Tinggi</td>
</tr>
<tr>
<td>Primary Actor</td>
<td>Pengusul</td>
</tr>
<tr>
<td>Use Case Type</td>
<td>Detail, Essential</td>
</tr>
<tr>
<td>Stakeholders and Interests</td>
<td><p>Pengusul: tahu kesalahan administratif saat itu juga dan bisa memperbaikinya sebelum tenggat.</p>
<p>Tim Kerja DPPM: hanya proposal yang lolos semua butir deterministik yang masuk seleksi.</p>
<p><em>Reviewer</em>: tidak perlu lagi memeriksa butir deterministik.</p></td>
</tr>
<tr>
<td>Brief Description</td>
<td>Pengusul mengajukan proposal yang disusun dengan templat. Sistem menarik berkas dari BIMA dan memeriksa butir deterministik. Proposal baru tercatat terkirim bila semua butir deterministik lolos.</td>
</tr>
<tr>
<td>Trigger</td>
<td>Pengusul mengajukan proposal di BIMA dalam masa pengusulan.</td>
</tr>
<tr>
<td>Type</td>
<td>External</td>
</tr>
<tr>
<td>Pre-condition</td>
<td>Pengusul sudah masuk ke BIMA. Masa pengusulan sedang berjalan. Proposal disusun dengan templat skema yang berlaku (UC-01).</td>
</tr>
<tr>
<td>Post-condition</td>
<td>Proposal tercatat terkirim dengan semua butir deterministik lolos. Hasil pemeriksaan per butir tersimpan, dan pengusul menerima bukti pengiriman.</td>
</tr>
<tr>
<td>Relationships</td>
<td><p>Association: Pengusul, «system» BIMA</p>
<p>Include: UC-06 Memeriksa butir deterministik</p>
<p>Extend: —</p>
<p>Generalization: —</p></td>
</tr>
<tr>
<td>Normal Flow of Events</td>
<td><p>1. Pengusul mengajukan proposal beserta lampirannya di BIMA.</p>
<p>2. Sistem menarik berkas proposal dan metadatanya dari BIMA.</p>
<p>3. Sistem memotong teks proposal per bagian sesuai templat skema.</p>
<p>4. Sistem menjalankan UC-06 Memeriksa butir deterministik.</p>
<p>5. Sistem menampilkan hasil setiap butir beserta angka pembuktinya.</p>
<p>6. Sistem mencatat proposal terkirim dan memberikan bukti pengiriman kepada pengusul.</p></td>
</tr>
<tr>
<td>SubFlows</td>
<td>S-1 (langkah 5) Ada butir deterministik yang gagal: sistem menahan pengiriman dan menunjukkan butir, bagian, serta batas yang dilanggar, pengusul memperbaiki proposal lalu kembali ke langkah 1.</td>
</tr>
<tr>
<td>Alternate/Exceptional Flows</td>
<td>1a. Masa pengusulan sudah ditutup: sistem menolak pengajuan, dan <em>use case</em> berhenti.</td>
</tr>
</tbody>
</table>

### UC-06 Memeriksa butir deterministik

<span id="_Toc243182821" class="anchor"></span>Tabel 7.7 Deskripsi UC-06 Memeriksa butir deterministik

<table style="width:100%;">
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Use Case Name</td>
<td>Memeriksa butir deterministik</td>
</tr>
<tr>
<td>ID</td>
<td>UC-06</td>
</tr>
<tr>
<td>Importance Level</td>
<td>Tinggi</td>
</tr>
<tr>
<td>Primary Actor</td>
<td>— (dijalankan sistem di dalam UC-05)</td>
</tr>
<tr>
<td>Use Case Type</td>
<td>Detail, Essential</td>
</tr>
<tr>
<td>Stakeholders and Interests</td>
<td><p>Pengusul: hasil pasti dan bisa dibuktikan dengan angka.</p>
<p>Tim Kerja DPPM: aturan diterapkan sama untuk semua proposal.</p></td>
</tr>
<tr>
<td>Brief Description</td>
<td>Sistem memeriksa butir yang bisa dihitung pasti pada setiap bagian proposal dengan basis aturan yang berlaku.</td>
</tr>
<tr>
<td>Trigger</td>
<td>Dipanggil oleh UC-05.</td>
</tr>
<tr>
<td>Type</td>
<td>Internal</td>
</tr>
<tr>
<td>Pre-condition</td>
<td>Teks proposal sudah dipotong per bagian. Basis aturan skema yang berlaku tersedia (UC-02).</td>
</tr>
<tr>
<td>Post-condition</td>
<td>Status lolos atau gagal setiap butir deterministik beserta angka pembuktinya tersimpan.</td>
</tr>
<tr>
<td>Relationships</td>
<td><p>Association: —</p>
<p>Include: —</p>
<p>Extend: —</p>
<p>Generalization: —</p></td>
</tr>
<tr>
<td>Normal Flow of Events</td>
<td><p>1. Sistem mengambil butir deterministik yang berlaku untuk skema proposal.</p>
<p>2. Sistem mencocokkan berkas dengan templat skema dan judul di BIMA.</p>
<p>3. Sistem menghitung jumlah kata tiap bagian (diagram, tabel, dan gambar tidak dihitung) dan membandingkannya dengan batas.</p>
<p>4. Sistem memeriksa kata kunci: tepat lima dan dipisahkan titik koma.</p>
<p>5. Sistem memeriksa sitasi bernomor, urutan daftar pustaka, dan kesamaan jumlah referensi dengan yang dikutip.</p>
<p>6. Sistem memeriksa keberadaan lampiran wajib.</p>
<p>7. Sistem menyimpan status setiap butir beserta angka pembuktinya.</p></td>
</tr>
<tr>
<td>SubFlows</td>
<td>—</td>
</tr>
<tr>
<td>Alternate/Exceptional Flows</td>
<td>—</td>
</tr>
</tbody>
</table>

### UC-07 Melakukan pemeriksaan akhir

<span id="_Toc243182822" class="anchor"></span>Tabel 7.8 Deskripsi UC-07 Melakukan pemeriksaan akhir

<table style="width:100%;">
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Use Case Name</td>
<td>Melakukan pemeriksaan akhir</td>
</tr>
<tr>
<td>ID</td>
<td>UC-07</td>
</tr>
<tr>
<td>Importance Level</td>
<td>Tinggi</td>
</tr>
<tr>
<td>Primary Actor</td>
<td><em>Reviewer</em></td>
</tr>
<tr>
<td>Use Case Type</td>
<td>Detail, Essential</td>
</tr>
<tr>
<td>Stakeholders and Interests</td>
<td><p><em>Reviewer</em>: waktu periksa singkat, dan keputusan tetap di tangannya.</p>
<p>Pengusul: keputusan beralasan dan umpan balik jelas.</p>
<p>Tim Kerja DPPM: keputusan terekam utuh untuk audit.</p></td>
</tr>
<tr>
<td>Brief Description</td>
<td><em>Reviewer</em> memeriksa isi per bagian proposal yang ditugaskan dengan bantuan rekomendasi sistem dan kutipan, memutuskan setiap komponen borang, dan menulis umpan balik. Keputusan dikirim ke BIMA.</td>
</tr>
<tr>
<td>Trigger</td>
<td><em>Reviewer</em> membuka proposal yang ditugaskan kepadanya.</td>
</tr>
<tr>
<td>Type</td>
<td>External</td>
</tr>
<tr>
<td>Pre-condition</td>
<td>Proposal sudah ditugaskan kepada <em>reviewer</em> (UC-03). <em>Reviewer</em> sudah masuk ke sistem.</td>
</tr>
<tr>
<td>Post-condition</td>
<td>Keputusan setiap komponen dan umpan balik tersimpan permanen, tercatat di log audit, dan terkirim ke BIMA.</td>
</tr>
<tr>
<td>Relationships</td>
<td><p>Association: <em>Reviewer</em>, «system» BIMA</p>
<p>Include: UC-09 Memeriksa butir semantik</p>
<p>Extend: diperluas oleh UC-08 Mengoreksi rekomendasi sistem (<em>extension point</em>: langkah 4, <em>reviewer</em> tidak setuju dengan rekomendasi)</p>
<p>Generalization: —</p></td>
</tr>
<tr>
<td>Normal Flow of Events</td>
<td><p>1. Sistem menjalankan UC-09 Memeriksa butir semantik.</p>
<p>2. <em>Reviewer</em> membuka proposal yang ditugaskan.</p>
<p>3. Sistem menampilkan rekomendasi setiap butir isi beserta kutipan dari proposal, per bagian.</p>
<p>4. <em>Reviewer</em> memverifikasi setiap rekomendasi terhadap kutipan dan isi bagian.</p>
<p>5. <em>Reviewer</em> menetapkan keputusan setiap komponen borang.</p>
<p>6. <em>Reviewer</em> menulis umpan balik untuk pengusul.</p>
<p>7. <em>Reviewer</em> menyimpan penilaian secara permanen.</p>
<p>8. Sistem mencatat penilaian di log audit dan mengirim keputusan serta umpan balik ke BIMA.</p></td>
</tr>
<tr>
<td>SubFlows</td>
<td>S-1 (langkah 6) <em>Reviewer</em> menyimpan sementara untuk dilanjutkan nanti: sistem menyimpan draf penilaian. Saat proposal dibuka lagi, alur kembali ke langkah 4.</td>
</tr>
<tr>
<td>Alternate/Exceptional Flows</td>
<td>—</td>
</tr>
</tbody>
</table>

### UC-08 Mengoreksi rekomendasi sistem

<span id="_Toc243182823" class="anchor"></span>Tabel 7.9 Deskripsi UC-08 Mengoreksi rekomendasi sistem

<table style="width:100%;">
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Use Case Name</td>
<td>Mengoreksi rekomendasi sistem</td>
</tr>
<tr>
<td>ID</td>
<td>UC-08</td>
</tr>
<tr>
<td>Importance Level</td>
<td>Sedang</td>
</tr>
<tr>
<td>Primary Actor</td>
<td><em>-</em></td>
</tr>
<tr>
<td>Use Case Type</td>
<td>Detail, Essential</td>
</tr>
<tr>
<td>Stakeholders and Interests</td>
<td><p><em>Reviewer</em>: bisa menolak rekomendasi yang keliru.</p>
<p>Tim Kerja DPPM: alasan koreksi menjadi bahan perbaikan aturan (UC-04, UC-02).</p>
<p>Pengusul: keputusan akhir tetap dibuat manusia.</p></td>
</tr>
<tr>
<td>Brief Description</td>
<td>Saat <em>reviewer</em> tidak setuju dengan rekomendasi suatu butir, ia mengganti rekomendasi itu dengan keputusannya sendiri dan wajib menuliskan alasannya.</td>
</tr>
<tr>
<td>Trigger</td>
<td><em>Reviewer</em> menyatakan tidak setuju dengan rekomendasi pada langkah verifikasi UC-07.</td>
</tr>
<tr>
<td>Type</td>
<td>External</td>
</tr>
<tr>
<td>Pre-condition</td>
<td>UC-07 sedang berjalan, dan rekomendasi butir sudah ditampilkan.</td>
</tr>
<tr>
<td>Post-condition</td>
<td>Keputusan <em>reviewer</em> menggantikan rekomendasi pada butir itu. Koreksi beserta alasannya tersimpan untuk pemantauan.</td>
</tr>
<tr>
<td>Relationships</td>
<td><p>Association: —</p>
<p>Include: —</p>
<p>Extend: memperluas UC-07 Melakukan pemeriksaan akhir (<em>extension point</em>: langkah 4)</p>
<p>Generalization: —</p></td>
</tr>
<tr>
<td>Normal Flow of Events</td>
<td><p>1. <em>Reviewer</em> memilih butir yang rekomendasinya tidak ia setujui.</p>
<p>2. Sistem menampilkan rekomendasi, kutipan, dan alasan sistem untuk butir itu.</p>
<p>3. <em>Reviewer</em> menetapkan keputusannya sendiri untuk butir itu.</p>
<p>4. <em>Reviewer</em> menulis alasan koreksi dan memilih jenis kekeliruan sistem, misalnya kutipan salah tempat atau salah tafsir isi.</p>
<p>5. Sistem menyimpan koreksi beserta alasannya, lalu kembali ke UC-07 langkah 5.</p></td>
</tr>
<tr>
<td>SubFlows</td>
<td>S-1 (langkah 4) Alasan belum diisi: sistem meminta alasan karena wajib, lalu kembali ke langkah 4.</td>
</tr>
<tr>
<td>Alternate/Exceptional Flows</td>
<td>3a. <em>Reviewer</em> membatalkan koreksi: rekomendasi semula tetap berlaku. <em>Use case</em> berhenti, dan <em>reviewer</em> kembali ke UC-07 langkah 4.</td>
</tr>
</tbody>
</table>

### UC-09 Memeriksa butir semantik

<span id="_Toc243182824" class="anchor"></span>Tabel 7.10 Deskripsi UC-09 Memeriksa butir semantik

<table style="width:100%;">
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Use Case Name</td>
<td>Memeriksa butir semantik</td>
</tr>
<tr>
<td>ID</td>
<td>UC-09</td>
</tr>
<tr>
<td>Importance Level</td>
<td>Tinggi</td>
</tr>
<tr>
<td>Primary Actor</td>
<td>— (dijalankan sistem di dalam UC-07). Aktor pendukung: «system» Layanan LLM</td>
</tr>
<tr>
<td>Use Case Type</td>
<td>Detail, Essential</td>
</tr>
<tr>
<td>Stakeholders and Interests</td>
<td><p><em>Reviewer</em>: rekomendasi disertai kutipan yang bisa dicek.</p>
<p>Tim Kerja DPPM: kerahasiaan isi proposal terjaga.</p>
<p>Pengusul: identitasnya tidak ikut dikirim keluar.</p></td>
</tr>
<tr>
<td>Brief Description</td>
<td>Sistem mengirim teks bagian yang relevan ke Layanan LLM bersama pertanyaan pemeriksaan setiap butir semantik, lalu menerima rekomendasi beserta kutipan dan tingkat keyakinan.</td>
</tr>
<tr>
<td>Trigger</td>
<td>Dipanggil oleh UC-07.</td>
</tr>
<tr>
<td>Type</td>
<td>Internal</td>
</tr>
<tr>
<td>Pre-condition</td>
<td>Proposal sudah terkirim dengan semua butir deterministik lolos. Aturan semantik skema tersedia (UC-02).</td>
</tr>
<tr>
<td>Post-condition</td>
<td>Rekomendasi, kutipan, dan tingkat keyakinan setiap butir semantik tersimpan, atau butir ditandai "belum ada rekomendasi".</td>
</tr>
<tr>
<td>Relationships</td>
<td><p>Association: «system» Layanan LLM</p>
<p>Include: —</p>
<p>Extend: —</p>
<p>Generalization: —</p></td>
</tr>
<tr>
<td>Normal Flow of Events</td>
<td><p>1. Sistem mengambil butir semantik yang berlaku untuk skema proposal.</p>
<p>2. Sistem menyiapkan teks bagian yang relevan untuk setiap butir, tanpa identitas pengusul.</p>
<p>3. Sistem mengirim teks dan pertanyaan pemeriksaan ke Layanan LLM.</p>
<p>4. Layanan LLM mengembalikan rekomendasi (memenuhi atau tidak memenuhi), kutipan pendukung, dan tingkat keyakinan.</p>
<p>5. Sistem memastikan kutipan benar-benar ada di teks proposal.</p>
<p>6. Sistem menyimpan rekomendasi setiap butir.</p></td>
</tr>
<tr>
<td>SubFlows</td>
<td><p>S-1 (langkah 5) Kutipan tidak ditemukan di teks: sistem menandai rekomendasi butir itu "perlu diperiksa manual", lalu lanjut ke langkah 6.</p>
<p>S-2 (langkah 4) Layanan LLM tidak merespons setelah dua kali percobaan: sistem menandai butir "belum ada rekomendasi", lalu lanjut ke langkah 6.</p></td>
</tr>
<tr>
<td>Alternate/Exceptional Flows</td>
<td>—</td>
</tr>
</tbody>
</table>

## 7.3 Activity Diagram

<img src="media/image4.png" style="width:5.51042in;height:5.88087in" />

<span id="_Toc243182770" class="anchor"></span>Gambar 7.2 Activity diagram proses seleksi administrasi

# MODEL STRUKTURAL

## 8.1 Kartu CRC

### Kartu C01 — TimKerjaDPPM

<span id="_Toc243182825" class="anchor"></span>Tabel 8.1 Kartu C01 TimKerjaDPPM

*Sisi depan*

<table>
<colgroup>
<col style="width: 29%" />
<col style="width: 34%" />
<col style="width: 35%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">TimKerjaDPPM</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C01</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Orang yang ditugaskan memeriksa proposal serta menegaskan atau mengoreksi rekomendasi sistem</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-01, UC-02, UC-03, UC-04</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Menyusun templat proposal</td>
<td>TemplatProposal</td>
</tr>
<tr>
<td colspan="2">Mengelola basis aturan</td>
<td>BasisAturan</td>
</tr>
<tr>
<td colspan="2">Mengatur periode seleksi</td>
<td>PeriodeSeleksi</td>
</tr>
<tr>
<td colspan="2">Menetapkan penugasan reviewer</td>
<td>PenugasanReviewer, PeriodeSeleksi</td>
</tr>
<tr>
<td colspan="2">Memilih skema pendanaan</td>
<td>SkemaPendanaan</td>
</tr>
<tr>
<td colspan="2">Memantau rekap kesesuaian proposal terhadap aturan</td>
<td>BasisAturan, PeriodeSeleksi</td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>nip: String</p>
<p>nama: String</p>
<p>hakAkses: String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>-</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>-</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>TemplatProposal (1…*)</p>
<p>SkemaPendanaan (0…*)</p>
<p>PenugasanReviewer (0...*)</p>
<p>BasisAturan (1...*)</p>
<p>PeriodeSeleksi (0...*)</p></td>
</tr>
</tbody>
</table>

### Kartu C02 — Pengusul

<span id="_Toc243182826" class="anchor"></span>Tabel 8.2 Kartu C02 Pengusul

*Sisi depan*

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 38%" />
<col style="width: 32%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">Pengusul</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C02</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Dosen atau peneliti ketua tim yang menyusun proposal dengan templat skema dan mengajukannya melalui BIMA.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-05</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Mengajukan proposal beserta lampiran pada masa pengusulan, termasuk mengajukan ulang setelah memperbaiki butir yang gagal (ajukanProposal)</td>
<td>Proposal</td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>nidn: String</p>
<p>nama: String</p>
<p>institusi: String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td>Proposal (0..*) — mengajukan</td>
</tr>
</tbody>
</table>

### Kartu C03 — Reviewer

<span id="_Toc243182827" class="anchor"></span>Tabel 8.3 Kartu C03 Reviewer

*Sisi depan*

<table>
<colgroup>
<col style="width: 29%" />
<col style="width: 34%" />
<col style="width: 35%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">Reviewer</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C03</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Orang yang ditugaskan memeriksa proposal serta menegaskan atau mengoreksi rekomendasi sistem</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-03, UC-07, UC-08</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Menerima penugasan</td>
<td>PenugasanReviewer</td>
</tr>
<tr>
<td colspan="2">Menampilkan proposal yang ditugaskan</td>
<td>PenugasanReviewer, Proposal</td>
</tr>
<tr>
<td colspan="2">Melakukan pemeriksaan akhir</td>
<td>Penilaian, Proposal</td>
</tr>
<tr>
<td colspan="2">Mengoreksi rekomendasi beserta memberikan alasannya</td>
<td>KoreksiRekomendasi</td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>Kode: String</p>
<p>NamaReviewer: string</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>-</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>-</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>PenugasanReviewer (1…*)</p>
<p>KoreksiRekomendasi (0…*)</p></td>
</tr>
</tbody>
</table>

### Kartu C04 — PeriodeSeleksi 

<span id="_Toc243182828" class="anchor"></span>Tabel 8.4 Kartu C04 PeriodeSeleksi

*Sisi depan*

<table>
<colgroup>
<col style="width: 29%" />
<col style="width: 34%" />
<col style="width: 35%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">PeriodeSeleksi</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C04</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Satu putaran seleksi proposal yang menyimpan masa pengusulan (buka–tutup) dan batas beban reviewer yang berlaku pada periode itu.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-01, UC-02, UC-03, UC-05</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2"><blockquote>
<p>Memeriksa apakah masa pengusulan sedang berjalan (saat pengajuan proposal, penerbitan templat, dan penetapan tanggal berlaku aturan)</p>
</blockquote></td>
<td>Proposal</td>
</tr>
<tr>
<td colspan="2"><blockquote>
<p>Menutup masa pengusulan sebagai pemicu penugasan reviewer</p>
</blockquote></td>
<td>Proposal, PenugasanReviewer</td>
</tr>
<tr>
<td colspan="2">Menyediakan dan memperbarui batas beban reviewer</td>
<td>TimKerjaDPPM</td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>idPeriode : String</p>
<p>tahun : int</p>
<p>tanggalBuka : Date</p>
<p>tanggalTutup : Date</p>
<p>batasBebanReviewer : int</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>-</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>-</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>TimKerjaDPPM (1..*) — diatur oleh</p>
<p>Proposal (0..*) — menampung pengajuan</p>
<p>PenugasanReviewer (0..*) — membatasi beban</p></td>
</tr>
</tbody>
</table>

### Kartu C05 — SkemaPendanaan

<span id="_Toc243182829" class="anchor"></span>Tabel 8.5 Kartu C05 SkemaPendanaan

*Sisi depan*

<table>
<colgroup>
<col style="width: 29%" />
<col style="width: 34%" />
<col style="width: 35%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">SkemaPendanaan</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C05</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Skema hibah penelitian (misalnya Penelitian Dasar atau Terapan) yang masing-masing memiliki templat proposal dan basis aturan pemeriksaannya sendiri.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-01, UC-02, UC-05</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2"><blockquote>
<p>Menyediakan templat yang berlaku untuk skema</p>
</blockquote></td>
<td>Proposal, TemplatProposal</td>
</tr>
<tr>
<td colspan="2"><blockquote>
<p>Menyediakan basis aturan yang berlaku untuk skema</p>
</blockquote></td>
<td>TimKerjaDPPM, BasisAturan</td>
</tr>
<tr>
<td colspan="2">Menjadi acuan pengelompokan proposal</td>
<td>TemplatProposal, Proposal</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 60%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>idSkema: String</p>
<p>namaSkema: String</p>
<p>Deskripsi : String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>TemplatProposal (1..*) — memiliki versi templat</p>
<p>BasisAturan (1..*) — memiliki versi aturan</p>
<p>Proposal (0..*) — dipilih oleh</p>
<p>TimKerjaDPPM (1..*) — dipilih oleh</p></td>
</tr>
</tbody>
</table>

### Kartu C06 — TemplatProposal

<span id="_Toc243182830" class="anchor"></span>Tabel 8.6 Kartu CRC C06 TemplatProposal

*Sisi depan*

<table>
<colgroup>
<col style="width: 24%" />
<col style="width: 47%" />
<col style="width: 27%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">TemplatProposal</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C06</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Struktur proposal per skema: bagian, batas kata, dan lampiran wajib, beserta periode berlakunya.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-01, UC-05</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Mengatur bagian templat, batas kata tiap bagian, dan lampiran wajib (aturBagian)</td>
<td>TimKerjaDPPM, BagianTemplat</td>
</tr>
<tr>
<td colspan="2">Menyimpan periode berlaku templat (tetapkanPeriodeBerlaku)</td>
<td>TimKerjaDPPM</td>
</tr>
<tr>
<td colspan="2">Memeriksa kelengkapan isian templat (periksaKelengkapan)</td>
<td>BagianTemplat</td>
</tr>
<tr>
<td colspan="2">Menerbitkan templat sebagai templat berlaku skema (terbitkan)</td>
<td>SkemaPendanaan</td>
</tr>
<tr>
<td colspan="2">Menurunkan butir cek deterministik dari templat (turunkanButirCek)</td>
<td>ButirCek</td>
</tr>
<tr>
<td colspan="2">Mengubah status templat versi lama menjadi arsip dan menonaktifkan butir turunannya (arsipkan)</td>
<td>SkemaPendanaan, ButirCek</td>
</tr>
<tr>
<td colspan="2">Memotong teks proposal per bagian templat (potongPerBagian)</td>
<td>VersiProposal, BagianTemplat</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>versi: Integer</p>
<p>status: String</p>
<p>periodeBerlaku: String</p>
<p>lampiranWajib: String[]</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>BagianTemplat (1..*) — terdiri atas [R6] (komposisi)</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>← SkemaPendanaan (1) — memiliki [R3]</p>
<p>ButirCek (0..*) — menurunkan [R7]</p>
<p>← TimKerjaDPPM (1) — menyusun [R9]</p>
<p>← VersiProposal (0..*) — disusun menurut [R14]</p></td>
</tr>
</tbody>
</table>

### Kartu C07 — BagianTemplat

Tabel 8.7 **Kartu CRC C07 BagianTemplat**

*Sisi depan*

<table>
<colgroup>
<col style="width: 35%" />
<col style="width: 41%" />
<col style="width: 23%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">BagianTemplat</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C07</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Satu bagian di templat beserta batas katanya.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-01, UC-05</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Menyimpan ketentuan bagian (aturKetentuan)</td>
<td>TemplatProposal</td>
</tr>
<tr>
<td colspan="2">Mengambil teks satu bagian dari proposal (ambilTeksBagian)</td>
<td>TemplatProposal</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 46%" />
<col style="width: 52%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>nama: String</p>
<p>urutan: Integer</p>
<p>batasKata: Integer</p>
<p>wajib: Boolean</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>← TemplatProposal (1) — terdiri atas [R6] (komposisi)</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td>—</td>
</tr>
</tbody>
</table>

### Kartu C08 — BasisAturan

<span id="_Toc243182831" class="anchor"></span>Tabel 8.8 Kartu C08 BasisAturan

*Sisi depan*

<table>
<colgroup>
<col style="width: 29%" />
<col style="width: 34%" />
<col style="width: 35%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">BasisAturan</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C08</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Kumpulan basis aturan berversi untuk satu skema dan periode, dengan tanggal berlaku.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-02, UC-06</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Memberikan basis aturan yang berlaku (ambilAturanBerlaku)</td>
<td>TemplatProposal, ButirCek</td>
</tr>
<tr>
<td colspan="2">Menambah, mengedit butir cek (ambilButirCek)</td>
<td>ButirCek</td>
</tr>
<tr>
<td colspan="2">Menolak perubahan butir cek bila</td>
<td></td>
</tr>
<tr>
<td colspan="2">Mengubah status basis aturan menjadi nonaktif (nonaktifkan)</td>
<td>ButirCek</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 60%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>kode: String</p>
<p>nama: String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>TemplatProposal (0..*) — memiliki [R3]</p>
<p>BasisAturan (0..*) — memiliki [R4]</p>
<p>Proposal (0..*) — diikuti [R5]</p>
<p>← TimKerjaDPPM (1..*) — memilih [R23]</p></td>
</tr>
</tbody>
</table>

### Kartu C09 — ButirCek

<span id="_Toc243182832" class="anchor"></span>Tabel 8.9 Kartu C09 ButirCek

*Sisi depan*

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 38%" />
<col style="width: 32%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">ButirCek</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C09</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Satu butir pemeriksaan, deterministik atau semantik.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-01, UC-02, UC-04, UC-06, UC-09</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Menyimpan parameter atau pertanyaan butir (aturParameter)</td>
<td>TemplatProposal, BasisAturan</td>
</tr>
<tr>
<td colspan="2">Memeriksa satu butir deterministik (periksa)</td>
<td>BasisAturan, HasilPemeriksaan</td>
</tr>
<tr>
<td colspan="2">Meminta rekomendasi satu butir semantik ke Layanan LLM (nilaiSemantik)</td>
<td>BasisAturan, HasilPemeriksaan</td>
</tr>
<tr>
<td colspan="2">Menghitung tingkat koreksi <em>reviewer</em> dan tingkat kegagalan butir (hitungTingkatKoreksi)</td>
<td>BasisAturan, HasilPemeriksaan</td>
</tr>
<tr>
<td colspan="2">Mengubah status butir menjadi perlu ditinjau (tandaiPerluDitinjau)</td>
<td>BasisAturan</td>
</tr>
<tr>
<td colspan="2">Mengubah status butir menjadi nonaktif (nonaktifkan)</td>
<td>TemplatProposal, BasisAturan</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>kode: String</p>
<p>deskripsi: String</p>
<p>jenis: String</p>
<p>parameter: String</p>
<p>pertanyaan: String</p>
<p>asalTemplat: Boolean</p>
<p>status: String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>← BasisAturan (0..*) — berisi [R8] (agregasi)</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>← TemplatProposal (0..1) — menurunkan [R7]</p>
<p>← HasilPemeriksaan (0..*) — menurut [R17]</p></td>
</tr>
</tbody>
</table>

### Kartu C10 — Proposal

<span id="_Toc243182833" class="anchor"></span>Tabel 8.10 Kartu C10 Proposal

*Sisi depan*

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 38%" />
<col style="width: 32%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">Proposal</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C10</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Mencatat penunjukan seorang reviewer untuk memeriksa proposal dalam suatu periode seleksi.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-03,UC-05,UC-07</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Membuka versi proposal yang dinilai reviewer</td>
<td>VersiProposal</td>
</tr>
<tr>
<td colspan="2">Mencatat penugasan reviewer</td>
<td>PenugasanReviewer</td>
</tr>
<tr>
<td colspan="2">Mengetahui pengusul yang mengajukan</td>
<td>Pengusul</td>
</tr>
<tr>
<td colspan="2">Mengetahui skema pendanaan yang diikuti</td>
<td>SkemaPendanaan</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>id: String</p>
<p>judul: String</p>
<p>status: String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>VersiProposal(1...*)</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>Pengusul mengajukan (1)</p>
<p>PeriodeSeleksi menampung (1..*)</p>
<p>PenugasanReviewer didistribusikan ke (1)</p>
<p>SkemaPendanaan diikuti</p></td>
</tr>
</tbody>
</table>

### Kartu C11 — VersiProposal

<span id="_Toc243182834" class="anchor"></span>Tabel 8.11 Kartu C11 VersiProposal

*Sisi depan*

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 38%" />
<col style="width: 32%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">VersiProposal</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C11</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Mewakili satu versi berkas proposal yang diajukan dan diperiksa. Versi inilah yang dibuka dan dinilai reviewer.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-05, UC-06, UC-07, UC-09</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Dibuat sebagai versi baru saat proposal diajukan</td>
<td>Proposal</td>
</tr>
<tr>
<td colspan="2">Dipotong per bagian sesuai templat skema</td>
<td>TemplatProposal</td>
</tr>
<tr>
<td colspan="2">Menghasilkan hasil pemeriksaan deterministik dan semantik</td>
<td>HasilPemeriksaan</td>
</tr>
<tr>
<td colspan="2">Dibuka oleh reviewer sebagai versi yang dinilai</td>
<td>Proposal</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>kode: String</p>
<p>nama: String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td><p>Proposal (1..*)</p>
<p>HasilPemeriksaan</p></td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td>TemplatProposal (1)</td>
</tr>
</tbody>
</table>

### Kartu C12 — HasilPemeriksaan

<span id="_Toc243182835" class="anchor"></span>Tabel 8.12 Kartu C12 HasilPemeriksaan

*Sisi depan*

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 38%" />
<col style="width: 32%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">HasilPemeriksaan</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C12</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Hasil pemeriksaan satu versi proposal terhadap templat dan basis aturan yang berlaku.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-05, UC-06, UC-07, UC-08, UC-09</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Membuat dan menyimpan sebuah versi proposal saat pemeriksaan dijalankan</td>
<td>VersiProposal</td>
</tr>
<tr>
<td colspan="2">Menyimpan status dan angka pembukti hasil pemeriksaan deterministik</td>
<td>VersiProposal</td>
</tr>
<tr>
<td colspan="2">Menyimpan rekomendasi semantik, atau menandainya bila kutipan tidak ditemukan atau layanan tidak merespons</td>
<td>VersiProposal</td>
</tr>
<tr>
<td colspan="2">Menerima koreksi yang menggantikan rekomendasi pada suatu butir</td>
<td>KoreksiRekomendasi</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>jenisButir: String</p>
<p>status: String</p>
<p>angkaPembukti: String</p>
<p>rekomendasi: String</p>
<p>kutipan: String</p>
<p>tingkatKeyakinan: Number</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>VersiProposal (1)</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td>KoreksiRekomendasi (0..1)</td>
</tr>
</tbody>
</table>

### Kartu C13 — PenugasanReviewer

<span id="_Toc243182836" class="anchor"></span>Tabel 8.13 Kartu C13 PenugasanReviewer

*Sisi depan*

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 38%" />
<col style="width: 32%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">PenugasanReviewer</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C13</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Mencatat penunjukan seorang reviewer untuk memeriksa proposal dalam suatu periode seleksi.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-03,UC-07</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Memilih reviewer dari daftar yang bersedia sesuai batas beban</td>
<td>Reviewer, PeriodeSeleksi</td>
</tr>
<tr>
<td colspan="2">Membuka proposal yang ditugaskan bagi reviewer</td>
<td>Reviewer, Proposal</td>
</tr>
<tr>
<td colspan="2">Menandai penugasan selesai setelah penilaian tersimpan</td>
<td>Penilaian</td>
</tr>
<tr>
<td colspan="2">Menetapkan tim dari penunjukka oleh Tim Kerja DPPM dan mencatatnya pada proposal</td>
<td>TimKerjaDPPM, Proposal</td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>tanggal: Date</p>
<p>status: String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>TimKerjaDPPM menetapkan (1..*)</p>
<p>Reviewer menerima (1)</p>
<p>PenugasanReviewer didistribusikan ke (1)</p>
<p>PenugasanReviewer mencakup (0..*)</p>
<p>PenugasanReviewer menghasilkan (0..*)</p></td>
</tr>
</tbody>
</table>

### Kartu C14 — Penilaian

<span id="_Toc243182837" class="anchor"></span>Tabel 8.14 Kartu C14 Penilaian

*Sisi depan*

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 38%" />
<col style="width: 32%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">Penilaian</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C14</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Keputusan akhir reviewer atas proposal yang ditugaskan, berisi nilai, komentar, dan koreksi atas rekomendasi sistem.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-07, UC-08</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Menyimpan nilai dan komentar akhir reviewer (terima)</td>
<td>Reviewer, PenugasanReviewer</td>
</tr>
<tr>
<td colspan="2">Mencatat koreksi rekomendasi beserta alasannya (catatKoreksi)</td>
<td>KoreksiRekomendasi</td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>nilai: String</p>
<p>komentar: String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>KoreksiRekomendasi (0..*) — memuat (komposisi)</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>Reviewer (1..*) — membuat</p>
<p>PenugasanReviewer (1) — menghasilkan</p></td>
</tr>
</tbody>
</table>

### Kartu C15 — KoreksiRekomendasi

<span id="_Toc243182838" class="anchor"></span>Tabel 8.15 Kartu C15 KoreksiRekomendasi

*Sisi depan*

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 38%" />
<col style="width: 32%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th colspan="2"><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Name</td>
<td colspan="2">KoreksiRekomendasi</td>
</tr>
<tr>
<td>ID</td>
<td colspan="2">C15</td>
</tr>
<tr>
<td>Type</td>
<td colspan="2">Concrete, Domain</td>
</tr>
<tr>
<td>Description</td>
<td colspan="2">Koreksi reviewer atas rekomendasi sistem pada satu butir, berisi keputusan pengganti dan alasan yang wajib diisi.</td>
</tr>
<tr>
<td>Associated Use Cases</td>
<td colspan="2">UC-04, UC-08</td>
</tr>
<tr>
<td colspan="2"><strong>Responsibilities</strong></td>
<td><strong>Collaborators</strong></td>
</tr>
<tr>
<td colspan="2">Menyimpan keputusan pengganti, alasan, dan waktu koreksi; menolak koreksi tanpa alasan (simpanKoreksi)</td>
<td>Penilaian, HasilPemeriksaan</td>
</tr>
<tr>
<td colspan="2">Memberikan keputusan dan alasan koreksi untuk pemantauan kesesuaian (ambilAlasan)</td>
<td>HasilPemeriksaan</td>
</tr>
</tbody>
</table>

*Sisi belakang*

<table style="width:100%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 61%" />
</colgroup>
<thead>
<tr>
<th><strong>Bagian</strong></th>
<th><strong>Isi</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Attributes</td>
<td><p>idRekomendasi: String</p>
<p>alasan: String</p>
<p>waktuKoreksi: String</p>
<p>keputusan: String</p></td>
</tr>
<tr>
<td>Relationships: Generalization (<em>a-kind-of</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Aggregation (<em>has-parts</em>)</td>
<td>—</td>
</tr>
<tr>
<td>Relationships: Other Associations</td>
<td><p>Penilaian (1) — memuat (komposisi)</p>
<p>HasilPemeriksaan (1) — mengoreksi</p></td>
</tr>
</tbody>
</table>

## 8.2 *Class Diagram*

<img src="media/image5.jpg" style="width:5.51112in;height:6.65612in" />

<span id="_Toc243182771" class="anchor"></span>Gambar 8.1 Class Diagram

<span id="_Toc243182839" class="anchor"></span>Tabel 8.16 Relasi Class Diagram

| Jenis relasi | Kelas yang terlibat | Penjelasan |
|----|----|----|
| Komposisi | Proposal – VersiProposal (1 : 1..\*) | Satu Proposal memiliki satu atau lebih VersiProposal. Versi tidak dapat berdiri sendiri tanpa proposalnya. |
| Komposisi | VersiProposal – HasilPemeriksaan <span class="mark">(1 : 1..*)*</span> | Satu VersiProposal menghasilkan hasil pemeriksaan yang melekat padanya. HasilPemeriksaan tidak ada tanpa versi yang diperiksa. |
| Komposisi | TemplatProposal – BagianTemplat (1 : 0..\*) | TemplatProposal terdiri atas sejumlah BagianTemplat (nama, urutan, batas kata, wajib atau tidak). Bagian hanya bermakna dalam templat induknya. |
| Komposisi | Penilaian – KoreksiRekomendasi (1 : 0..\*) | Satu Penilaian memuat nol atau lebih KoreksiRekomendasi, yaitu alasan dan keputusan reviewer atas rekomendasi sistem. |
| Agregasi | BasisAturan – ButirCek (1 : 1..\*) | BasisAturan berisi satu atau lebih ButirCek sebagai isi aturannya. ButirCek tetap dapat dikelola sebagai objek tersendiri (parameter, penonaktifan). |
| Asosiasi | Pengusul – Proposal (1 : 0..\*) | Seorang Pengusul dapat mengajukan nol atau banyak Proposal. |
| Asosiasi | PeriodeSeleksi – Proposal (1 : 1..\*) | Satu PeriodeSeleksi menampung satu atau lebih Proposal yang diajukan pada periode tersebut. |
| Asosiasi | Proposal – PenugasanReviewer (1 : 0..\*) | Proposal didistribusikan ke nol atau lebih PenugasanReviewer sesuai kebutuhan penilaian. |
| Asosiasi | PenugasanReviewer – PeriodeSeleksi (1..\* : 0..\*) | PenugasanReviewer mencakup periode seleksi dan dibatasi oleh batas beban reviewer pada periode itu. |
| Asosiasi | TimKerjaDPPM – PenugasanReviewer (1..\* : 0..\*) | TimKerjaDPPM menetapkan penugasan reviewer, yaitu memilih reviewer, menetapkan, dan menandai selesai. |
| Asosiasi | TimKerjaDPPM – PeriodeSeleksi <span class="mark">(1 : 0..*)*</span> | TimKerjaDPPM mengatur nol atau banyak periode seleksi, antara lain batas beban reviewer dan masa pengusulan. |
| Asosiasi | Reviewer – PenugasanReviewer (1 : 0..\*) | Seorang Reviewer menerima nol atau banyak PenugasanReviewer. |
| Asosiasi | PenugasanReviewer – Penilaian (1 : 0..\*) | Satu PenugasanReviewer menghasilkan nol atau lebih Penilaian. |
| Asosiasi | Reviewer – Penilaian (1..\* : 0..\*) | Reviewer membuat Penilaian, yaitu nilai dan komentar atas proposal yang ditugaskan. |
| Asosiasi | TimKerjaDPPM – BasisAturan (1 : 1..\*) | TimKerjaDPPM mengelola satu atau lebih BasisAturan, termasuk menambah butir, menguji, dan menyimpan versi. |
| Asosiasi | TimKerjaDPPM – SkemaPendanaan (1..\* : 0..\*) | TimKerjaDPPM memilih skema pendanaan yang dipakai pada proses pemeriksaan. |
| Asosiasi | TimKerjaDPPM – TemplatProposal (1 : 1..\*) | TimKerjaDPPM menyusun satu atau lebih TemplatProposal. |
| Asosiasi | SkemaPendanaan – Proposal (1 : 0..*)* | Satu skema pendanaan diikuti oleh nol atau banyak Proposal. Setiap Proposal mengikuti satu skema yang menentukan templat dan aturan berlaku. |
| Asosiasi | SkemaPendanaan – BasisAturan (0..1 : 0..\*) | SkemaPendanaan memiliki nol atau lebih BasisAturan. Setiap BasisAturan terkait paling banyak satu skema. |
| Asosiasi | SkemaPendanaan – TemplatProposal (1 : 0..\*) | Satu skema pendanaan memiliki nol atau lebih TemplatProposal yang menentukan struktur proposal. |
| Asosiasi | TemplatProposal – VersiProposal (1 : 0..\*) | Satu TemplatProposal menjadi acuan bagi nol atau banyak VersiProposal. Versi disusun menurut templat yang berlaku. |
| Asosiasi | TemplatProposal – ButirCek (1 : 0..\*) | TemplatProposal menurunkan ButirCek, misalnya kelengkapan bagian dan batas kata. |
| Asosiasi | HasilPemeriksaan – KoreksiRekomendasi (1 : 0..1) | Satu HasilPemeriksaan dapat dikoreksi melalui satu KoreksiRekomendasi (alasan, waktu koreksi, keputusan). Jika tidak ada koreksi, hasilnya dipakai apa adanya. |

# MODEL PERILAKU

Model perilaku menggambarkan bagaimana objek-objek pada model struktural berinteraksi untuk menjalankan setiap use case (perilaku dinamis eksternal), serta bagaimana suatu objek berubah keadaan sepanjang siklus hidupnya (perilaku dinamis internal). Bagian ini terdiri atas sequence diagram, communication diagram, behavioral state machine, dan CRUDE matrix. Seluruh lifeline dan pesan menggunakan kelas serta operasi dari class diagram, sehingga ketiga model (fungsional, struktural, perilaku) dapat diseimbangkan (balancing). 

## 9.1 Sequence Diagram

Sequence diagram per use case. Mengikuti Dennis, Wixom & Tegarden, setiap use case direalisasikan oleh satu sequence diagram yang menggambarkan normal flow pada use case description. Alternate dan exceptional flow yang penting dimasukkan dengan combined fragment UML 2.x, sehingga satu diagram dapat mewakili beberapa skenario tanpa membuat diagram terpisah. Relasi include dan extend pada use case diagram ditampilkan sebagai interaction use (ref). 

### Sequence Diagram UC-01 Mengelola templat proposal

Model perilaku UC-01 melibatkan lima kelas pada kartu CRC: kelas aktor TimKerjaDPPM serta kelas SkemaPendanaan, TemplatProposal, BagianTemplat, dan ButirCek. Kelima kelas itu menjadi objek pada *sequence diagram* dan *communication diagram*, dengan nama objek yang sama di kedua diagram. TemplatProposal dan ButirCek masing-masing muncul sebagai dua objek: templat versi baru beserta butir turunannya (templat, butir), dan templat versi lama beserta butir turunannya yang diarsipkan (lama, butirLama). Dari kelima kelas tersebut, hanya TemplatProposal dan ButirCek yang memiliki atribut status, sehingga hanya keduanya yang dibuatkan *state machine*.

<img src="media/image6.png" style="width:5.51112in;height:7.53328in" />

<span id="_Toc243182772" class="anchor"></span>Gambar 9.1 Sequence diagram UC-01 Mengelola templat proposal

Tim Kerja DPPM memulai dengan meminta templat yang berlaku dari skema pendanaan (ambilTemplatBerlaku(periode), langkah 1–2). Fragmen alt memisahkan tiga kemungkinan yang saling meniadakan: skema punya templat berlaku tanpa draf, skema belum punya templat sehingga yang dikembalikan adalah templat kosong (S-1), atau skema punya draf yang tersimpan dari alur 6a (S-3). Bila tidak ada draf tersimpan, Tim Kerja DPPM membuat templat versi baru dengan pesan «create» (fragmen opt); bila ada, draf itulah yang dilanjutkan. Fragmen loop (1,\*) memuat langkah 3–5, yaitu mengatur bagian dan lampiran wajib, menetapkan periode berlaku, dan memeriksa kelengkapan. Fragmen ini berjalan minimal sekali dan diulang selama isian belum lengkap, karena S-2 mengembalikan alur ke langkah 3. Di dalam aturBagian(daftarBagian, lampiranWajib), setiap bagian baru dibuat sebagai objek BagianTemplat beserta batas kata dan status wajibnya.

Pesan terbitkan() (langkah 6) membuat templat menanyakan ke skema apakah masa pengusulan sedang berjalan (cekPengusulanBerjalan()). Bila sedang berjalan, fragmen break menghentikan alur dan templat tetap tersimpan sebagai draf (6a). Bila tidak, templat meminta skema menjadikannya templat berlaku (gantiTemplatBerlaku(templat)). Fragmen opt menunjukkan bahwa bila skema sudah punya templat versi lama, skema mengarsipkan versi itu (arsipkan()), lalu versi lama menonaktifkan setiap butir cek turunannya (nonaktifkan()). Terakhir, templat baru menurunkan butir cek deterministiknya sendiri lewat turunkanButirCek() (langkah 7). Batang aktivasi bersarang menunjukkan bahwa di dalam pesan itulah setiap butir turunan dibuat sebagai objek ButirCek berstatus draf, lalu parameternya diisi. Butir draf ini belum masuk basis aturan; ia ditinjau dan dimasukkan ke basis aturan di UC-02.

*Method* susunTemplat() pada kelas aktor TimKerjaDPPM tidak muncul sebagai pesan tersendiri. Ia adalah tanggung jawab aktor yang diwujudkan sebagai rangkaian pesan yang dikirim tim ke skema dan templat (pesan 1–4), sesuai aturan bahwa *method* kelas aktor digambar sebagai pesan keluar, bukan pesan masuk.

### Sequence Diagram UC-02 Mengelola Aturan Pemeriksaan

<img src="media/image30.png" style="width:5.51181in;height:7.64332in" />

<span id="_Toc243182773" class="anchor"></span>Gambar 9.2 Sequence diagram UC-02 Mengelola aturan pemeriksaan

### Sequence Diagram UC-03 Menugaskan Reviewer

<img src="media/image32.png" style="width:5.51181in;height:5.05198in" />

Gambar 9.3 Sequence diagram UC-03 Menugaskan Reviewer

### Sequence Diagram UC-04 Memantau kesesuaian penilaian

<img src="media/image34.png" style="width:5.51181in;height:4.33383in" />

<span id="_Toc243182774" class="anchor"></span>Gambar 9.4 Sequence diagram UC-04 Memantau kesesuaian penilaian

### Sequence Diagram UC-05 Mengajukan Proposal

<img src="media/image36.png" style="width:5.51181in;height:4.4866in" />

<span id="_Toc243182775" class="anchor"></span>Gambar 9.5 Sequence diagram UC-05 Mengajukan Proposal

### Sequence Diagram UC-06 Memeriksa butir deterministik

<img src="media/image38.png" style="width:5.51181in;height:5.36982in" />

<span id="_Toc243182776" class="anchor"></span>Gambar 9.6 Sequence Diagram UC-06 Memeriksa butir deterministik

### Sequence Diagram UC-07 Melakukan pemeriksaan akhir

<img src="media/image40.png" style="width:5.51181in;height:6.24569in" />

<span id="_Toc243182777" class="anchor"></span>Gambar 9.7 Sequence Diagram UC-07 Melakukan pemeriksaan akhir

### Sequence Diagram UC-08 Mengoreksi rekomendasi sistem 

<img src="media/image42.png" style="width:5.51181in;height:4.63081in" />

<span id="_Toc243182778" class="anchor"></span>Gambar 9.8 Sequence Diagram UC-08 Mengoreksi rekomendasi sistem

### Sequence Diagram UC-09 Memeriksa butir semantik

<img src="media/image44.png" style="width:5.51181in;height:3.44556in" />

<span id="_Toc243182779" class="anchor"></span>Gambar 9.9 Sequence Diagram UC-09 Memeriksa butir semantik

## 9.2 *Communication Diagram*

Communication diagram. Communication diagram dibuat untuk use case yang sama karena secara semantik setara dengan sequence diagram, tetapi menonjolkan struktur tautan (link) antarobjek. Diagram ini dipakai untuk memeriksa bahwa setiap pesan melewati asosiasi yang memang ada di class diagram, serta mengidentifikasi objek yang terlalu banyak berkolaborasi.

### 9.2.1 Communication Diagram UC-01

<img src="media/image15.png" style="width:8.99351in;height:4.52686in" />

<span id="_Toc243182780" class="anchor"></span>Gambar 9.10 Communication Diagram UC-01 Mengelola templat proposal

*Communication diagram* memuat lima belas pesan yang sama dengan *sequence diagram*, tanpa nilai balik. Garis antarobjek adalah asosiasi pada *class diagram*: tim–skema , tim–templat , templat–bagian , templat–butir dan lama–butirLama , serta templat–skema dan skema–lama. Garis melingkar pada objek templat menandai pesan yang dikirim templat ke dirinya sendiri. Satu garis dapat memuat beberapa pesan; setiap pesan diberi panah kecil sendiri yang menunjukkan arahnya.

Penomoran pesan memakai desimal bertingkat. Pesan yang dikirim sebuah objek ketika ia sedang menjalankan pesan *n* diberi nomor *n*.1, *n*.2, dan seterusnya. Misalnya, saat menjalankan terbitkan() (pesan 4), templat mengirim cekPengusulanBerjalan() (4.1), gantiTemplatBerlaku(templat) (4.2), dan turunkanButirCek() (4.3). Saat menjalankan pesan 4.2, skema mengirim arsipkan() (4.2.1), dan saat menjalankan pesan 4.2.1, templat lama mengirim nonaktifkan() (4.2.1.1). Saat menjalankan pesan 4.3, templat membuat butir cek dan mengisi parameternya (4.3.1 dan 4.3.2).

Pesan di dalam fragmen juga diberi nomor turunan. Fragmen opt pembuatan templat menjadi pesan bernomor 2, sehingga «create» di dalamnya bernomor 2.1. Fragmen loop S-2 menjadi nomor 3, sehingga pesan di dalamnya bernomor 3.1, 3.2, dan 3.3, bukan 3, 4, dan 5. Tanda \* menandai pengulangan, dan teks di dalam kurung siku adalah syarat (*guard*). Fragmen alt (S-1, S-3) dan break (6a) hanya berisi nilai balik sehingga tidak mendapat nomor. Kebalikan syarat break, yaitu \[masa pengusulan tidak berjalan\], ditulis sebagai *guard* pesan 4.2 dan 4.3, karena kedua pesan itu beserta turunannya hanya terjadi bila alur tidak dihentikan. Fragmen opt pengarsipan berada di dalam pesan 4.2 sehingga syaratnya menjadi *guard* pesan 4.2.1. Tabel 9.1 mencocokkan setiap pesan dengan langkah narasinya; baris bernomor dalam kurung adalah fragmen yang menjadi induk nomor, bukan pesan.

<span id="_Toc243182840" class="anchor"></span>Tabel 9.1 Pesan UC-01 pada sequence dan communication diagram

| **No.** | **Pengirim → penerima** | **Pesan** | **Langkah narasi UC-01** |
|----|----|----|----|
| 1 | tim → skema | ambilTemplatBerlaku(periode) | 1–2, S-1, S-3 |
| \(2\) | — | Bukan pesan, tetapi kotak *opt*: hanya terjadi bila tidak ada draf tersimpan. Isinya pesan 2.1. | 3 |
| 2.1 | tim → templat | «create» | 3 (templat versi baru, bila tidak ada draf) |
| \(3\) | — | Bukan pesan, tetapi kotak *loop*: diulang minimal sekali selama isian belum lengkap (S-2). Isinya pesan 3.1–3.3. | 3–5, S-2 |
| 3.1 | tim → templat | aturBagian(daftarBagian, lampiranWajib) | 3, S-2 |
| 3.1.1 | templat → bagian | «create» | 3 |
| 3.1.2 | templat → bagian | aturKetentuan(batasKata, wajib) | 3 |
| 3.2 | tim → templat | tetapkanPeriodeBerlaku(periode) | 4, S-2 |
| 3.3 | tim → templat | periksaKelengkapan() | 5, S-2 |
| 4 | tim → templat | terbitkan() | 6 |
| 4.1 | templat → skema | cekPengusulanBerjalan() | 6, 6a |
| 4.2 | templat → skema | gantiTemplatBerlaku(templat) | 6 |
| 4.2.1 | skema → lama | arsipkan() | 6 |
| 4.2.1.1 | lama → butirLama | nonaktifkan() | 6 |
| 4.3 | templat → templat | turunkanButirCek() | 7 |
| 4.3.1 | templat → butir | «create» | 7 |
| 4.3.2 | templat → butir | aturParameter(parameter) | 7 |

### 9.2.2 Communication Diagram UC-02

<img src="media/image31.png" style="width:9.01678in;height:4.52756in" />

<span id="_Toc243182781" class="anchor"></span>Gambar 9.11 Communication diagram UC-02 Mengelola aturan pemeriksaan

Communication diagram memuat pesan yang sama dengan sequence diagram UC-02, tanpa nilai balik. Garis tim–skema dan tim–basis adalah asosiasi memilih dan mengelola pada class diagram. Dua pesan pada sequence diagram melewati pasangan objek yang belum berasosiasi di class diagram, yaitu tim–butir (pesan 3.1–3.3 dan 4.2) dan basis–periode (pesan 5.1). Kedua garis itu diberi label «usulan asosiasi»: asosiasinya perlu ditambahkan ke class diagram, atau pesan ke butir dialihkan melalui basis aturan (tambahButir(butir)).

Fragmen loop butir menjadi nomor 3, sehingga pesan di dalamnya bernomor 3.1–3.3, dan syarat setiap cabang alt ditulis sebagai guard pada pesannya. Fragmen loop uji menjadi nomor 4; syarat opt perbaikan menjadi guard pesan 4.2. Cabang alt yang hanya berisi nilai balik (penolakan pada 3a dan 6a) tidak mendapat nomor, sedangkan syarat cabang tanggal valid ditulis sebagai guard pesan 5.2.

<span id="_Toc243182841" class="anchor"></span>Tabel 9.2 Pesan UC-02 pada sequence dan communication diagram

| **No.** | **Pengirim → penerima** | **Pesan** | **Langkah narasi UC-02** |
|----|----|----|----|
| 1 | tim → skema | basisAturanBerlaku(periode) | 1 |
| 2 | tim → basis | daftarButirBerlaku(semua) | 2 |
| \(3\) | — | Bukan pesan, tetapi kotak loop: diulang untuk setiap butir yang ditambah, diubah, atau dinonaktifkan. Isinya kotak alt dengan pesan 3.1–3.3. | 3–4, 3a |
| 3.1 | tim → butir | «create» create(jenis, parameter) | 3–4 |
| 3.2 | tim → butir | ubahParameter(parameter) / nonaktifkan() | 3–4 |
| 3.3 | tim → butir | ubahParameter(parameter) | 3a |
| \(4\) | — | Bukan pesan, tetapi kotak loop: diulang selama hasil uji belum sesuai harapan (S-1). Isinya pesan 4.1–4.2. | 5, S-1 |
| 4.1 | tim → basis | ujiPadaContoh() | 5 |
| 4.2 | tim → butir | ubahParameter(parameter) | S-1 |
| 5 | tim → basis | validasiTanggalBerlaku(tanggal) | 6 |
| 5.1 | basis → periode | masaPengusulanBerjalan() | 6, 6a |
| 5.2 | basis → basis | simpanVersiBaru() | 7 |

### 9.2.3 Communication Diagram UC-03

<img src="media/image33.png" style="width:6.10444in;height:4.52756in" />

<span id="_Toc243182782" class="anchor"></span>Gambar 9.12 Communication diagram UC-03 Menugaskan reviewer

Garis antarobjek adalah asosiasi pada class diagram: tim–periode (mengatur), tim–penugasan (menetapkan), periode–penugasan (mencakup), penugasan–proposal (didistribusikan ke), dan penugasan–rev (menerima). Garis ke BIMA mewakili asosiasi BIMA dengan UC-03 pada use case diagram.

Fragmen loop (1,\*) S-1 menjadi nomor 1, fragmen loop S-2 menjadi nomor 2, dan fragmen loop penetapan menjadi nomor 3. Fragmen alt \[reviewer cukup\] dan loop setiap proposal berada di dalam pesan 1.2, sehingga keduanya ditulis sebagai guard dan tanda pengulangan pada pesan 1.2.2 dan 1.2.3. Cabang \[reviewer tidak cukup\] hanya berisi nilai balik sehingga tidak mendapat nomor.

<span id="_Toc243182842" class="anchor"></span>Tabel 9.3 Pesan UC-03 pada sequence dan communication diagram

| **No.** | **Pengirim → penerima** | **Pesan** | **Langkah narasi UC-03** |
|----|----|----|----|
| \(1\) | — | Bukan pesan, tetapi kotak loop (1,\*): diulang selama jumlah reviewer tidak cukup (S-1). Isinya pesan 1.1–1.2. | 1–4, S-1 |
| 1.1 | tim → periode | tetapkanBatasBeban(batas) | 1, S-1 |
| 1.2 | tim → periode | susunPenugasan() | 2–4 |
| 1.2.1 | periode → bima | ambilDaftarReviewer() | 2 |
| 1.2.2 | periode → penugasan | «create»(proposal) | 3 |
| 1.2.3 | periode → penugasan | pilihReviewer(daftarReviewer, batasBeban) | 3 |
| \(2\) | — | Bukan pesan, tetapi kotak loop: dijalankan bila Tim Kerja DPPM memindahkan proposal ke reviewer lain (S-2). Isinya pesan 2.1. | 5, S-2 |
| 2.1 | tim → penugasan | pilihReviewer(reviewerBaru, batasBeban) | 5, S-2 |
| \(3\) | — | Bukan pesan, tetapi kotak loop: diulang untuk setiap penugasan yang ditetapkan. Isinya pesan 3.1. | 6–7 |
| 3.1 | tim → penugasan | tetapkan() | 6 |
| 3.1.1 | penugasan → proposal | mencatatPenugasan(penugasan) | 6–7 |
| 3.1.1.1 | proposal → bima | kirimPenugasan(penugasan) | 7 |
| 3.1.2 | penugasan → rev | terimaProposal(proposal) | 7 |

### 9.2.4 Communication Diagram UC-04

<img src="media/image35.png" style="width:8.10181in;height:4.52756in" />

<span id="_Toc243182783" class="anchor"></span>Gambar 9.13 Communication diagram UC-04 Memantau kesesuaian penilaian

Garis tim–skema, tim–basis, basis–butir, dan hasil–koreksi adalah asosiasi memilih, mengelola, berisi, dan mengoreksi pada class diagram. Garis butir–hasil belum ada pada class diagram, tetapi sudah tercantum pada kartu CRC ButirCek (← HasilPemeriksaan, menurut), sehingga diberi label «usulan asosiasi».

Fragmen loop S-1 menjadi nomor 3 dan fragmen loop penandaan menjadi nomor 4. Loop setiap butir dan setiap hasil pemeriksaan berada di dalam pesan 2, sehingga ditulis sebagai tanda pengulangan pada pesan 2.1 dan 2.1.1, sedangkan syarat opt menjadi guard pesan 2.1.1.1.

<span id="_Toc243182843" class="anchor"></span>Tabel 9.4 Pesan UC-04 pada sequence dan communication diagram

| **No.** | **Pengirim → penerima** | **Pesan** | **Langkah narasi UC-04** |
|----|----|----|----|
| 1 | tim → skema | ambilAturanBerlaku(periode) | 1 |
| 2 | tim → basis | rekapKesesuaian(periode) | 2–4 |
| 2.1 | basis → butir | hitungTingkatKoreksi(periode) | 2–4 |
| 2.1.1 | butir → hasil | ambilStatus() | 2–3 |
| 2.1.1.1 | hasil → koreksi | ambilAlasan() | 4 |
| \(3\) | — | Bukan pesan, tetapi kotak loop: dijalankan setiap kali Tim Kerja DPPM membuka rincian satu butir (S-1). Isinya pesan 3.1. | 4, S-1 |
| 3.1 | tim → basis | rekapKesesuaian(periode, butir) | S-1 |
| 3.1.1 | basis → butir | ambilRincian(periode) | S-1 |
| 3.1.1.1 | butir → hasil | ambilContoh() | S-1 |
| \(4\) | — | Bukan pesan, tetapi kotak loop: diulang untuk setiap butir yang aturannya perlu diperbaiki. Isinya pesan 4.1. | 5–6 |
| 4.1 | tim → basis | tandaiButir(butir) | 5 |
| 4.1.1 | basis → butir | tandaiPerluDitinjau() | 6 |

### 9.2.5 Communication Diagram UC-05

<img src="media/image37.png" style="width:6.12578in;height:4.52756in" />

<span id="_Toc243182784" class="anchor"></span>Gambar 9.14 Communication diagram UC-05 Mengajukan proposal

Garis antarobjek adalah asosiasi pada class diagram: peng–proposal (mengajukan), proposal–periode (menampung), proposal–skema (diikuti), proposal–versi (memiliki, komposisi), versi–templat (disusun menurut), dan templat–bagian (terdiri atas). Garis proposal–bima mewakili asosiasi BIMA dengan UC-05 pada use case diagram. Garis melingkar pada objek proposal menandai pesan catatTerkirim() yang dikirim proposal ke dirinya sendiri.

Fragmen loop (1,\*) menjadi nomor 1, sehingga pesan dari pengusul bernomor 1.1 dan pesan turunannya 1.1.1 dan seterusnya. Fragmen break (1a) hanya berisi nilai balik sehingga tidak mendapat nomor; kebalikan syaratnya, \[masa pengusulan berjalan\], ditulis sebagai guard pesan 1.1.2–1.1.7. Syarat cabang alt \[semua butir lolos\] menjadi guard pesan 1.1.8. Kotak ref UC-06 tidak diberi nomor karena pesannya dinomori pada communication diagram UC-06.

<span id="_Toc243182844" class="anchor"></span>Tabel 9.5 Pesan UC-05 pada sequence dan communication diagram

| **No.** | **Pengirim → penerima** | **Pesan** | **Langkah narasi UC-05** |
|----|----|----|----|
| \(1\) | — | Bukan pesan, tetapi kotak loop (1,\*): berjalan minimal sekali dan diulang selama ada butir gagal (S-1). Isinya pesan 1.1. | 1–6, S-1 |
| 1.1 | peng → proposal | tarikDariBima() | 1–2 |
| 1.1.1 | proposal → periode | cekMasaPengusulan() | 1, 1a |
| 1.1.2 | proposal → bima | ambilBerkas(idProposal) | 2 |
| 1.1.3 | proposal → skema | ambilTemplatBerlaku(periode) | 3 |
| 1.1.4 | proposal → skema | ambilAturanBerlaku(periode) | 4 |
| 1.1.5 | proposal → versi | «create»(berkas, templat, basis) | 2 |
| 1.1.6 | proposal → versi | potongTeks() | 3 |
| 1.1.6.1 | versi → templat | potongPerBagian(teks) | 3 |
| 1.1.6.1.1 | templat → bagian | ambilTeksBagian(teks) | 3 |
| 1.1.7 | proposal → versi | jalankanPemeriksaan(deterministik) | 4 |
| 1.1.8 | proposal → proposal | catatTerkirim() | 6 |

### 9.2.6 Communication Diagram UC-06

<img src="media/image39.png" style="width:9.33071in;height:3.23328in" />

<span id="_Toc243182785" class="anchor"></span>Gambar 9.15 Communication diagram UC-06 Memeriksa butir deterministik

Garis proposal–versi (memiliki), versi–hasil (menghasilkan), dan basis–butir (berisi) adalah asosiasi pada class diagram. Garis versi–basis belum ada pada class diagram, padahal versi memanggil periksaDeterministik(versi) dan basis aturan membaca teks bagian dari versi; garis ini diberi label «usulan asosiasi» (VersiProposal diperiksa dengan BasisAturan). Garis melingkar pada objek butir memuat lima pesan pemeriksaan sesuai jenis butir.

Use case ini tidak memiliki aktor, sehingga penomoran dimulai dari pesan proposal ke versi. Fragmen loop setiap butir berada di dalam pesan 1.1, sehingga ditulis sebagai tanda pengulangan pada pesan 1.1.1 dan 1.1.2. Kelima cabang alt di dalam periksa(teksBagian) ditulis sebagai guard pesan 1.1.2.1–1.1.2.5.

<span id="_Toc243182845" class="anchor"></span>Tabel 9.6 Pesan UC-06 pada sequence dan communication diagram

| **No.** | **Pengirim → penerima** | **Pesan** | **Langkah narasi UC-06** |
|----|----|----|----|
| 1 | proposal → versi | jalankanPemeriksaan(deterministik) | — |
| 1.1 | versi → basis | periksaDeterministik(versi) | 1–6 |
| 1.1.1 | basis → versi | ambilTeksBagian(bagian) | 2–6 |
| 1.1.2 | basis → butir | periksa(teksBagian) | 2–6 |
| 1.1.2.1 | butir → butir | cocokkanStrukturJudul() | 2 |
| 1.1.2.2 | butir → butir | hitungKata() | 3 |
| 1.1.2.3 | butir → butir | cekKataKunci() | 4 |
| 1.1.2.4 | butir → butir | cocokkanSitasi() | 5 |
| 1.1.2.5 | butir → butir | cekLampiran() | 6 |
| 1.2 | versi → hasil | «create»(butir, status, angkaPembukti) | 7 |

### 9.2.7 Communication Diagram UC-07

<img src="media/image41.png" style="width:9.33071in;height:4.10205in" />

<span id="_Toc243182786" class="anchor"></span>Gambar 9.16 Communication diagram UC-07 Melakukan pemeriksaan akhir

Garis antarobjek adalah asosiasi pada class diagram: rev–penugasan (menerima), penugasan–proposal (didistribusikan ke), proposal–versi (memiliki), rev–penilaian (membuat), dan penilaian–penugasan (menghasilkan). Garis proposal–bima mewakili asosiasi BIMA dengan UC-07 pada use case diagram.

Fragmen alt penyimpanan menjadi nomor 3, sehingga pesan di dalamnya bernomor 3.1–3.3 dengan syarat cabang sebagai guard. Kotak ref UC-09 dan UC-08, termasuk fragmen loop dan opt yang hanya berisi ref UC-08, tidak diberi nomor karena pesannya dinomori pada communication diagram masing-masing use case.

<span id="_Toc243182846" class="anchor"></span>Tabel 9.7 Pesan UC-07 pada sequence dan communication diagram

| **No.** | **Pengirim → penerima** | **Pesan** | **Langkah narasi UC-07** |
|----|----|----|----|
| 1 | rev → penugasan | bukaProposal() | 2 |
| 1.1 | penugasan → proposal | bukaVersiDinilai() | 2–3 |
| 1.1.1 | proposal → versi | ambilHasilPemeriksaan() | 3 |
| 2 | rev → penilaian | «create» | 4 |
| \(3\) | — | Bukan pesan, tetapi kotak alt: memisahkan simpan sementara (S-1) dan simpan permanen. Isinya pesan 3.1–3.3. | 5–8, S-1 |
| 3.1 | rev → penilaian | simpanNilai(nilai, komentar) | S-1 |
| 3.2 | rev → penilaian | simpanNilai(nilai, komentar) | 5–6 |
| 3.3 | rev → penilaian | terima() | 7 |
| 3.3.1 | penilaian → penugasan | tandaiSelesai() | 7 |
| 3.3.1.1 | penugasan → proposal | mencatatPenilaian() | 8 |
| 3.3.1.1.1 | proposal → bima | kirimKeputusan(keputusan, umpanBalik) | 8 |

### 9.2.8 Communication Diagram UC-08

<img src="media/image43.png" style="width:9.33071in;height:4.50862in" />

<span id="_Toc243182787" class="anchor"></span>Gambar 9.17 Communication diagram UC-08 Mengoreksi rekomendasi sistem

Garis rev–penilaian (membuat), penilaian–koreksi (memuat, komposisi), dan koreksi–hasil (mengoreksi) adalah asosiasi pada class diagram. Garis rev–koreksi tercantum pada kartu CRC Reviewer (KoreksiRekomendasi 0..\*), tetapi belum ada pada class diagram, sehingga diberi label «usulan asosiasi».

Fragmen loop (1,\*) S-1 menjadi nomor 2. Fragmen break (3a) hanya berisi nilai balik, sehingga kebalikan syaratnya, \[koreksi tidak dibatalkan\], digabung ke guard pesan 2.1. Syarat cabang alt \[alasan terisi\] menjadi guard pesan 2.1.1, sedangkan cabang \[alasan kosong\] hanya berisi nilai balik.

<span id="_Toc243182847" class="anchor"></span>Tabel 9.8 Pesan UC-08 pada sequence dan communication diagram

| **No.** | **Pengirim → penerima** | **Pesan** | **Langkah narasi UC-08** |
|----|----|----|----|
| 1 | rev → penilaian | catatKoreksi(hasil) | 1 |
| 1.1 | penilaian → koreksi | «create»(hasil) | 1 |
| 1.1.1 | koreksi → hasil | ambilRekomendasi() | 2 |
| \(2\) | — | Bukan pesan, tetapi kotak loop (1,\*): berjalan minimal sekali dan diulang selama alasan belum diisi (S-1). Isinya pesan 2.1. | 3–5, S-1 |
| 2.1 | rev → koreksi | simpanKoreksi(keputusan, alasan, jenisKekeliruan) | 3–5, S-1 |
| 2.1.1 | koreksi → hasil | gantiRekomendasi(keputusan) | 5 |

### 9.2.9 Communication Diagram UC-09

<img src="media/image45.png" style="width:7.76863in;height:4.52756in" />

<span id="_Toc243182788" class="anchor"></span>Gambar 9.18 Communication diagram UC-09 Memeriksa butir semantik

Garis proposal–versi, versi–hasil, dan basis–butir adalah asosiasi pada class diagram, sedangkan garis butir–llm mewakili asosiasi Layanan LLM dengan UC-09 pada use case diagram. Garis versi–basis diberi label «usulan asosiasi», sama seperti pada UC-06.

Fragmen loop setiap butir semantik berada di dalam pesan 1.2, sehingga ditulis sebagai tanda pengulangan pada pesan 1.2.1. Fragmen loop (1,2) ditulis sebagai \*\[maksimal dua kali\] pada pesan 1.2.1.1, dan syarat cabang alt \[Layanan LLM merespons\] menjadi guard pesan 1.2.1.2.

<span id="_Toc243182848" class="anchor"></span>Tabel 9.9 Pesan UC-09 pada sequence dan communication diagram

| **No.** | **Pengirim → penerima** | **Pesan** | **Langkah narasi UC-09** |
|----|----|----|----|
| 1 | proposal → versi | jalankanPemeriksaan(semantik) | — |
| 1.1 | versi → versi | siapkanTeksTanpaIdentitas() | 2 |
| 1.2 | versi → basis | periksaSemantik(teksTanpaIdentitas) | 1–5 |
| 1.2.1 | basis → butir | nilaiSemantik(teksBagian) | 2–5 |
| 1.2.1.1 | butir → llm | kirimPermintaan(teksBagian, pertanyaan) | 3–4, S-2 |
| 1.2.1.2 | butir → butir | cocokkanKutipan(teksBagian) | 5, S-1 |
| 1.3 | versi → hasil | «create»(butir, rekomendasi, kutipan, keyakinan) | 6 |

## 9.3 *Behavioral State Machine*

<span class="mark">Behavioral state machine. State machine hanya dibuat untuk kelas yang memiliki siklus hidup kompleks, yaitu kelas yang memiliki atribut status dan perilakunya berbeda di setiap status: Tiket, RekomendasiAI, ArtikelKnowledge, PolaInsiden, dan SesiChat. Kelas lain (misalnya AuditLog dan Notifikasi) hanya dibuat lalu dibaca, sehingga state machine tidak memberi informasi tambahan.</span>

<span class="mark">Menggambarkan perubahan status sebuah object</span>

### 9.3.1 Behavioral State Machine

<img src="media/image24.png" style="width:5.51112in;height:1.68771in" />

<span id="_Toc243182789" class="anchor"></span>Gambar 9.19 State machine TemplatProposal

<img src="media/image25.png" style="width:5.51112in;height:1.52103in" />

<span id="_Toc243182790" class="anchor"></span>Gambar 9.20 State machine ButirCek

## 9.4 *Matriks CRUDE*

<span class="mark">CRUDE matrix. CRUDE matrix (Create, Read, Update, Delete, Execute) diturunkan langsung dari pesan pada sequence diagram, bukan diisi manual, sehingga konsisten dengan diagram. Dua matriks disusun: use case terhadap kelas untuk menelusuri dampak setiap use case pada data, dan kelas klien terhadap kelas server (format Dennis) untuk memvalidasi kolaborasi di CRC card dan asosiasi di class diagram.</span>

<span id="_Toc243182849" class="anchor"></span>Tabel 9.10 Matriks CRUDE

| **Klien \\ Server** | **C01** | **C02** | **C03** | **C04** | **C05** | **C06** | **C07** | **C08** | **C09** | **C10** | **C11** | **C12** | **C13** | **C14** | **C15** |
|----|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **C01 TimKerjaDPPM** |  |  |  | UE | R | CUE |  | RUE | CU |  |  |  | U |  |  |
| **C02 Pengusul** |  |  |  |  |  |  |  |  |  | E |  |  |  |  |  |
| **C03 Reviewer** |  |  |  |  |  |  |  |  |  |  |  |  | R | CU | U |
| **C04 PeriodeSeleksi** |  |  |  |  |  |  |  |  |  |  |  |  | CU |  |  |
| **C05 SkemaPendanaan** |  |  |  |  |  | U |  |  |  |  |  |  |  |  |  |
| **C06 TemplatProposal** |  |  |  |  | RU | E | CRU |  | CU |  |  |  |  |  |  |
| **C07 BagianTemplat** |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **C08 BasisAturan** |  |  |  | R |  |  |  | C | RUE |  | R |  |  |  |  |
| **C09 ButirCek** |  |  |  |  |  |  |  |  | E |  |  | R |  |  |  |
| **C10 Proposal** |  |  |  | R | R |  |  |  |  | U | CRUE |  |  |  |  |
| **C11 VersiProposal** |  |  |  |  |  | E |  | E |  |  | E | C |  |  |  |
| **C12 HasilPemeriksaan** |  |  |  |  |  |  |  |  |  |  |  |  |  |  | R |
| **C13 PenugasanReviewer** |  |  | E |  |  |  |  |  |  | RU |  |  |  |  |  |
| **C14 Penilaian** |  |  |  |  |  |  |  |  |  |  |  |  | U |  | C |
| **C15 KoreksiRekomendasi** |  |  |  |  |  |  |  |  |  |  |  | RU |  |  |  |

# DESAIN LAPISAN ANTARMUKA PENGGUNA

<span class="mark">\[Diisi: pengantar desain lapisan antarmuka dan alasan teknik yang dipakai.\]</span>

## 10.1 Use Scenario

<span class="mark">\[Diisi: use scenario untuk use case yang sering dipakai dan rumit.\]</span>

## 10.2 Real Use Case

<span class="mark">\[Diisi: satu real use case untuk SETIAP use case esensial (UC-01–UC-09).\]</span>

## 10.3 Desain Antarmuka

<span class="mark">\[Diisi: desain antarmuka low-fidelity per jendela.\]</span>

# ARSITEKTUR FISIK

<span class="mark">\[Diisi: pilihan arsitektur fisik sesuai skenario terpilih dan alasannya.\]</span>

## 11.1 Arsitektur Jaringan dan Deployment Diagram

<span class="mark">\[Diisi: arsitektur jaringan dan deployment diagram beserta penjelasannya.\]</span>

## 11.2 Spesifikasi Perangkat Keras dan Perangkat Lunak

<span class="mark">\[Diisi: tabel spesifikasi minimum klien dan server.\]</span>

# PROTOTIPE SISTEM

<span class="mark">\[Diisi: prototipe high-fidelity yang menjawab SEMUA use case, disusun per use case.\]</span>

# RENCANA PENGUJIAN

<span class="mark">\[Diisi: rencana uji unit, integrasi, sistem, dan penerimaan.\]</span>

# INSTALASI DAN OPERASI

<span class="mark">\[Diisi: rencana konversi dan rencana manajemen perubahan.\]</span>

# DAFTAR PUSTAKA

Albrecht, A. J. (1979). Measuring application development productivity. *Proceedings of the Joint SHARE/GUIDE/IBM Application Development Symposium*, 83–92.

Australian Research Council. (2023). *Policy on use of generative artificial intelligence in the ARC’s grants programs*. https://www.arc.gov.au/sites/default/files/2023-07/Policy%20on%20Use%20of%20Generative%20Artificial%20Intelligence%20in%20the%20ARCs%20grants%20programs%202023.pdf

Boehm, B. W., Abts, C., Brown, A. W., Chulani, S., Clark, B. K., Horowitz, E., Madachy, R., Reifer, D. J., & Steece, B. (2000). *Software cost estimation with COCOMO II*. Prentice Hall.

Checco, A., Bracciale, L., Loreti, P., Pinfield, S., & Bianchi, G. (2021). AI-assisted peer review. *Humanities and Social Sciences Communications, 8*, 25. https://doi.org/10.1057/s41599-020-00703-8

Dennis, A., Wixom, B. H., & Roth, R. M. (2021). *Systems analysis and design* (8th ed.). Wiley.

Dennis, A., Wixom, B. H., & Tegarden, D. (2015). *Systems analysis and design: An object-oriented approach with UML* (5th ed.). John Wiley & Sons.

Direktorat Penelitian dan Pengabdian kepada Masyarakat. (2025). *Panduan penelitian dan pengabdian kepada masyarakat tahun 2026*. Kementerian Pendidikan Tinggi, Sains, dan Teknologi.

Direktorat Penelitian dan Pengabdian kepada Masyarakat. (2026). *Pengumuman rekrutmen reviewer penelitian DPPM tahun 2026* (No. 42/DST/C3/DT.05.00/2026). Kementerian Pendidikan Tinggi, Sains, dan Teknologi.

<span class="mark">Direktorat Penelitian dan Pengabdian kepada Masyarakat. (2026). \[Diisi: judul resmi bahan Penyamaan Persepsi Reviewer Seleksi Administrasi 2026\]. Kementerian Pendidikan Tinggi, Sains, dan Teknologi.</span>

Direktorat Riset dan Pengembangan Universitas Indonesia. (2025, Desember). *Pengumuman pembukaan proposal penelitian Kemdiktisaintek tahun 2026*. https://research.ui.ac.id/pengumuman/pengumuman-pembukaan-proposal-penelitian-kemdiktisaintek-tahun-2026/

Drori, I., & Te’eni, D. (2024). Human-in-the-loop AI reviewing: Feasibility, opportunities, and risks. *Journal of the Association for Information Systems, 25*(1), 98–109. https://doi.org/10.17705/1jais.00867

International Organization for Standardization. (2009). *Software and systems engineering — Software measurement — IFPUG functional size measurement method 2009* (ISO/IEC 20926:2009).

Kementerian Keuangan Republik Indonesia. (2025). *Peraturan Menteri Keuangan Nomor 32 Tahun 2025 tentang Standar Biaya Masukan Tahun Anggaran 2026*. https://jdih.kemenkeu.go.id/dok/pmk-32-tahun-2025

Kementerian Keuangan Republik Indonesia. (2026). *Peraturan Menteri Keuangan Nomor 54 Tahun 2026 tentang Standar Biaya Masukan Tahun Anggaran 2027*. https://jdih.kemenkeu.go.id/dok/pmk-54-tahun-2026

Kementerian Komunikasi dan Informatika. (2023). *Surat Edaran Menteri Komunikasi dan Informatika Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial*.

Kementerian Pendidikan Tinggi, Sains, dan Teknologi. (2025). *Panduan penggunaan generative AI pada pembelajaran di perguruan tinggi* (Edisi 2). https://kemdiktisaintek.go.id/api/file/humas-production/2025/05/Buku-Panduan-\_-Penggunaan-Generative-AI-pada-Pembelajaran-di-Perguruan-Tinggi-cetak.pdf

Kousha, K., & Thelwall, M. (2024). Artificial intelligence to support publishing and peer review: A summary and review. *Learned Publishing, 37*(1), 4–12. https://doi.org/10.1002/leap.1570

Liang, W., Izzo, Z., Zhang, Y., dkk. (2024). Monitoring AI-modified content at scale: A case study on the impact of ChatGPT on AI conference peer reviews. *Proceedings of the 41st International Conference on Machine Learning* (PMLR 235). https://proceedings.mlr.press/v235/liang24b.html

Liang, W., Zhang, Y., Cao, H., Wang, B., Ding, D. Y., Yang, X., dkk. (2024). Can large language models provide useful feedback on research papers? A large-scale empirical analysis. *NEJM AI, 1*(8). https://doi.org/10.1056/AIoa2400196

Malcolm, D. G., Roseboom, J. H., Clark, C. E., & Fazar, W. (1959). Application of a technique for research and development program evaluation. *Operations Research, 7*(5), 646–669. https://doi.org/10.1287/opre.7.5.646

Marchewka, J. T. (2016). *Information technology project management: Providing measurable organizational value* (5th ed.). Wiley.

Marques, J. D. S., Duarte, A. V., Carvalho, A., Rocha, G., Martins, B., & Oliveira, A. L. (2025). Leveraging LLMs to streamline the review of public funding applications. *Proceedings of the 2025 Conference on Empirical Methods in Natural Language Processing: Industry Track*. Association for Computational Linguistics. https://aclanthology.org/2025.emnlp-industry.143/

National Institutes of Health. (2023). *NOT-OD-23-149: The use of generative artificial intelligence technologies is prohibited for the NIH peer review process*. https://grants.nih.gov/grants/guide/notice-files/NOT-OD-23-149.html

Project Management Institute. (2019). *Practice standard for work breakdown structures* (3rd ed.). Project Management Institute.

Russo Latona, G., Horta Ribeiro, M., Davidson, T. R., Veselovsky, V., & West, R. (2025). The AI review lottery: Widespread AI-assisted peer reviews boost paper scores and acceptance rates. *Proceedings of the ACM on Human-Computer Interaction, 9*(7), 1–28. https://doi.org/10.1145/3757667

Sandström, U., & Thelwall, M. (2026). *Can large language models evaluate grant proposal quality? Revisiting the Wennerås and Wold peer review data* \[Preprint\]. arXiv. https://arxiv.org/abs/2603.14565

Venkatesh, V., Morris, M. G., Davis, G. B., & Davis, F. D. (2003). User acceptance of information technology: Toward a unified view. *MIS Quarterly, 27*(3), 425–478. <https://doi.org/10.2307/30036540>

# LAMPIRAN A: TRANSKRIP WAWANCARA SPONSOR (SYSTEM REQUEST)

**Lampiran** A.**1** Transkrip Wawancara Ketua Tim Kerja Penelitian

Pewawancara: Rohmad Atkha

Terwawancara: Ibu Erlin Puspaputri, Ketua Tim Kerja Penelitian

Lokasi: Ruangan Ketua Tim Kerja Penelitian, Gedung D, Kemdiktisaintek Jakarta

Tanggal dan rekaman: <span class="mark">\[Diisi: tanggal wawancara dan tautan rekaman\]</span>

**1. Apa tugas dan fungsi Tim Kerja Penelitian pada Direktorat Penelitian dan Pengabdian kepada Masyarakat (DPPM)?**

Tugas dan fungsi tim kerja penelitian pada Direktorat Penelitian dan Pengabdian kepada masyarakat adalah terlaksananya program penelitian kompetitif nasional maupun internasional.

**2. Bagaimana pembagian tugas setiap orang dalam tim tersebut?**

• Ketua tim kerja: Erlin Puspaputri bertanggung jawab atas terlaksananya program penelitian kompetitif nasional maupun internasional.

• Anggota tim kerja: Anggun Amalia Fibriyanti bertanggung jawab atas pelaksanaan program penelitian kerja sama internasional bilateral dan multilateral serta pendanaan penelitian yang bekerja sama dengan Lembaga Pengelola Dana Pendidikan (LPDP).

• Levyn Triastono Taufiq bertanggung jawab atas berjalannya sistem informasi Basis Informasi Penelitian dan Pengabdian kepada Masyarakat (BIMA) untuk mendukung pelaksanaan program penelitian kompetitif nasional.

• Rangga Satriana bertanggung jawab atas pelaksanaan Pusat Unggulan Ipteks Perguruan Tinggi di Indonesia.

• Rohmad Atkha bertanggung jawab atas berjalannya sistem informasi BIMA untuk mendukung pelaksanaan program penelitian kompetitif nasional.

• Yulia Hefnita bertanggung jawab atas keuangan internal tim kerja penelitian.

**3. Apakah tahun ini DPPM membuka call for proposal?**

<span class="mark">Pada tahun 2026 ini, DPPM telah membuka call for proposal melalui laman bima.kemdiktisaintek.go.id sejak tanggal xxx hingga xxx, kemudian terdapat kesempatan bagi dosen yang sudah membuat draf usulan proposal namun belum disubmit hingga xxx. Dari call for proposal tersebut terdapat xxx usulan yang telah disetujui oleh Lembaga Penelitian dan Pengabdian kepada Masyarakat atau nama sejenisnya dan lanjut ke tahap seleksi yang dilakukan oleh DPPM.</span>

**4. Bagaimana mekanisme dan tahapan pemilihan proposal yang akan didanai?**

Tahap seleksi terdiri dari 2 bagian, seleksi administrasi dan seleksi substansi. Pada tahap seleksi administrasi ini mengecek beberapa hal secara administratif seperti kesesuaian isi per bagian proposal, jumlah kata per bagian, dokumen tambahan (bila ada), dan sebagainya. Apabila terdapat 1 persyaratan yang tidak sesuai maka proposal tersebut dinyatakan tidak lolos administrasi.

**5. Apa kendala dari tahapan seleksi tersebut?**

<span class="mark">Dari xxx proposal tersebut DPPM membutuhkan xxx reviewer sehingga beban pengecekan proposal bisa xxx. Hal ini yang kemudian menimbulkan permasalahan. Dengan beban yang begitu banyak serta proposal yang diperiksa hanya 1 reviewer saja, penentuan lolos atau tidaknya proposal bergantung pada reviewer tersebut. DPPM juga memiliki keterbatasan sehingga tidak dapat memonitor apakah penilaian reviewer sudah objektif atau masih terdapat subjektivitas dari reviewer. Tahapan seleksi ini juga memiliki target waktu yang ketat, agar pelaksanaan penelitian dapat memiliki keleluasaan waktu hingga akhir tahun anggaran.</span>

**6. Apa harapan apabila ada alat bantu tahapan seleksi tersebut?**

Harapannya DPPM dapat meningkatkan akuntabilitas terhadap hasil penilaian, reviewer mudah dalam menilai proposal, dan hasil penilaian semakin objektif karena penilaian tidak hanya oleh 1 reviewer, namun juga telah dicek melalui sistem (AI). Dari sisi pengusul, mendapatkan ulasan (feedback) dari proposal yang telah diusulkan secara objektif, transparan, dan dapat dipercaya.

*Sumber: system request Rohmad Atkha (tugas-2-project-plan-feasibility/kasus/system-request-rohmad-atkha-2606846222.docx).*

# LAMPIRAN B: DAFTAR PERTANYAAN WAWANCARA PEMILIK KASUS DAN DPPM

| No | Pertanyaan |
|----|----|
| 1 | Berapa jumlah proposal yang rata-rata harus diperiksa dalam satu periode seleksi dan berapa jumlah reviewer yang tersedia? |
| 2 | Berapa lama target waktu yang tersedia untuk menyelesaikan seluruh proses seleksi administrasi? |
| 3 | Apakah saat ini terdapat anggaran khusus yang dapat digunakan untuk pengembangan sistem pendukung seleksi proposal? |
| 4 | Menurut Bapak/Ibu, seberapa mampu organisasi menyediakan biaya investasi awal untuk S1, S2, dan S3? |
| 5 | Menurut Bapak/Ibu, bagaimana kemampuan organisasi menanggung biaya operasional dan pemeliharaan untuk S1, S2, dan S3 dalam jangka panjang? |
| 6 | Dari ketiga skenario, menurut Bapak/Ibu seberapa besar masing-masing dapat mempercepat proses seleksi administrasi? |
| 7 | Dari ketiga skenario, seberapa besar masing-masing dapat mengurangi beban kerja reviewer tanpa mengurangi kualitas pemeriksaan? |
| 8 | Seberapa besar dukungan pimpinan terhadap penerapan masing-masing skenario? |
| 9 | Apakah pimpinan bersedia menyediakan anggaran, SDM, dan dukungan kebijakan untuk implementasi masing-masing skenario? |
| 10 | Seberapa sesuai masing-masing skenario dengan proses seleksi administrasi yang berjalan saat ini? |
| 11 | Seberapa besar perubahan prosedur atau kebijakan yang diperlukan apabila masing-masing skenario diterapkan? |
| 12 | Menurut Bapak/Ibu, apakah penggunaan AI sebaiknya hanya menjadi alat bantu reviewer atau dapat diberikan peran yang lebih besar dalam menentukan hasil administrasi? Mengapa? |
| 13 | Risiko organisasi apa yang paling dikhawatirkan dari masing-masing skenario? |
| 14 | Dari ketiga skenario, mana yang paling realistis untuk diterapkan dan apa alasan utamanya? |

<span id="_Toc240931778" class="anchor"></span>**Lampiran** B.**1 Daftar Pertanyaan Wawancara Pemilik Kasus**

| No | Pertanyaan |
|----|----|
| 1 | Infrastruktur apa saja yang saat ini tersedia untuk mendukung pengembangan dan operasional sistem baru? |
| 2 | Seberapa siap infrastruktur existing untuk menjalankan S1 Rule-Based? |
| 3 | Seberapa siap infrastruktur existing untuk menjalankan S2 Hybrid Rule-Based + AI? |
| 4 | Seberapa siap infrastruktur existing untuk menjalankan S3 AI-Based? |
| 5 | Apakah data proposal historis, hasil pemeriksaan reviewer, aturan administrasi, dan metadata lain yang dibutuhkan tersedia dan dapat digunakan? |
| 6 | Bagaimana kualitas dan struktur data tersebut? Apakah membutuhkan cleansing, labeling, atau preprocessing tambahan? |
| 7 | Apakah sistem BIMA telah memiliki API, web service, database interface, atau mekanisme lain yang memungkinkan sistem baru mengakses proposal? |
| 8 | Seberapa mudah masing-masing skenario diintegrasikan dengan BIMA tanpa perubahan besar pada sistem existing? |
| 9 | Teknologi apa saja yang dibutuhkan untuk membangun masing-masing skenario? |
| 10 | Seberapa besar penguasaan tim IT terhadap teknologi yang dibutuhkan pada masing-masing skenario? |
| 11 | Seberapa kompleks pengembangan, pengujian, maintenance, dan troubleshooting untuk masing-masing skenario? |
| 12 | Risiko keamanan apa yang muncul apabila proposal diproses menggunakan masing-masing skenario? |
| 13 | Seberapa mudah risiko keamanan tersebut dapat dikendalikan menggunakan mekanisme keamanan yang sudah tersedia? |
| 14 | Apakah penggunaan AI eksternal/cloud/LLM menimbulkan isu kerahasiaan, lokasi penyimpanan data, atau akses pihak ketiga? |
| 15 | Berapa perkiraan investasi tambahan yang dibutuhkan untuk server, storage, GPU/cloud, lisensi, API, atau komponen lain pada masing-masing skenario? |
| 16 | Berapa perkiraan biaya tahunan untuk operasional, maintenance, lisensi/API, server/cloud, dan support masing-masing skenario? |
| 17 | Berapa perkiraan waktu pengembangan dan jumlah SDM teknis yang diperlukan untuk masing-masing skenario? |
| 18 | Dari sisi teknis, skenario mana yang paling realistis diterapkan dengan kondisi saat ini? |

<span id="_Toc243182762" class="anchor"></span>**Lampiran** B.**2 Daftar Pertanyaan Wawancara DPPM**

# LAMPIRAN C: KUESIONER REVIEWER DAN REKAPITULASI JAWABAN

| **No** | **Pertanyaan** |
|---:|----|
| 1 | Bagaimana proses yang Bapak/Ibu lakukan saat memeriksa satu proposal pada tahap seleksi administrasi? |
| 2 | Berapa rata-rata waktu yang dibutuhkan untuk memeriksa satu proposal secara manual? |
| 3 | Dalam satu periode seleksi, rata-rata berapa proposal yang harus Bapak/Ibu periksa? |
| 4 | Bagian pemeriksaan administrasi apa yang paling banyak membutuhkan waktu? |
| 5 | Jika menggunakan S1 Rule-Based, berapa perkiraan waktu yang masih dibutuhkan reviewer untuk memeriksa satu proposal? |
| 6 | Jika menggunakan S2 Hybrid, berapa perkiraan waktu pemeriksaan satu proposal? |
| 7 | Jika menggunakan S3 AI-Based, berapa perkiraan waktu pemeriksaan satu proposal? |
| 8 | Seberapa besar S1 Rule-Based dapat mengurangi pekerjaan administratif yang saat ini dilakukan secara manual? |
| 9 | Seberapa besar S2 Hybrid dapat mengurangi pekerjaan administratif yang saat ini dilakukan secara manual? |
| 10 | Seberapa besar S3 AI-Based dapat mengurangi pekerjaan administratif yang saat ini dilakukan secara manual? |
| 11 | Seberapa bersedia Bapak/Ibu menggunakan S1 Rule-Based sebagai alat bantu pemeriksaan proposal? |
| 12 | Seberapa bersedia Bapak/Ibu menggunakan S2 Hybrid Rule-Based + AI? |
| 13 | Seberapa bersedia Bapak/Ibu menggunakan S3 AI-Based? |
| 14 | Faktor apa yang membuat Bapak/Ibu percaya atau tidak percaya terhadap hasil rekomendasi sistem? |
| 15 | Apakah Bapak/Ibu tetap ingin memiliki kewenangan untuk mengubah atau menolak rekomendasi sistem? Mengapa? |
| 16 | Seberapa sesuai S1 Rule-Based dengan tahapan seleksi administrasi yang saat ini dilakukan? |
| 17 | Seberapa sesuai S2 Hybrid dengan tahapan seleksi administrasi yang saat ini dilakukan? |
| 18 | Seberapa sesuai S3 AI-Based dengan tahapan seleksi administrasi yang saat ini dilakukan? |
| 19 | Seberapa besar perubahan cara kerja yang harus dilakukan untuk menggunakan S1 Rule-Based? |
| 20 | Seberapa besar perubahan cara kerja yang harus dilakukan untuk menggunakan S2 Hybrid? |
| 21 | Seberapa besar perubahan cara kerja yang harus dilakukan untuk menggunakan S3 AI-Based? |
| 22 | Bagian apa dari cara kerja reviewer yang kemungkinan berubah apabila sistem diterapkan? |
| 23 | Seberapa banyak pelatihan yang Bapak/Ibu perkirakan diperlukan sebelum dapat menggunakan S1 Rule-Based secara mandiri? |
| 24 | Seberapa banyak pelatihan yang Bapak/Ibu perkirakan diperlukan sebelum dapat menggunakan S2 Hybrid secara mandiri? |
| 25 | Seberapa banyak pelatihan yang Bapak/Ibu perkirakan diperlukan sebelum dapat menggunakan S3 AI-Based secara mandiri? |
| 26 | Jenis pelatihan apa yang menurut Bapak/Ibu diperlukan? |
| 27 | Apakah keberadaan AI menimbulkan kekhawatiran terhadap peran atau tanggung jawab reviewer? |
| 28 | Jika sistem hanya memberikan rekomendasi sementara keputusan akhir tetap pada reviewer, apakah hal tersebut meningkatkan kesediaan Bapak/Ibu menggunakan sistem? |
| 29 | Dari ketiga skenario, mana yang paling membantu pekerjaan reviewer tanpa mengurangi peran profesional reviewer? |

<span id="_Toc240931780" class="anchor"></span>**Lampiran** C.**1 Kuesioner Reviewer**

<table>
<caption><p><span id="_Toc240931781" class="anchor"></span><strong>Lampiran</strong> C.<strong>2 Rekapitulasi Jawaban Kuesioner</strong></p></caption>
<colgroup>
<col style="width: 2%" />
<col style="width: 11%" />
<col style="width: 15%" />
<col style="width: 14%" />
<col style="width: 14%" />
<col style="width: 16%" />
<col style="width: 12%" />
<col style="width: 13%" />
</colgroup>
<thead>
<tr>
<th style="text-align: center;"><strong>No</strong></th>
<th style="text-align: center;"><strong>Pertanyaan</strong></th>
<th style="text-align: center;"><p><strong>Jawaban</strong></p>
<p><strong>Reviewer 1</strong></p></th>
<th style="text-align: center;"><p><strong>Jawaban</strong></p>
<p><strong>Reviewer 2</strong></p></th>
<th style="text-align: center;"><p><strong>Jawaban</strong></p>
<p><strong>Reviewer 3</strong></p></th>
<th style="text-align: center;"><p><strong>Jawaban</strong></p>
<p><strong>Reviewer 4</strong></p></th>
<th style="text-align: center;"><strong>Jawaban Reviewer 5</strong></th>
<th style="text-align: center;"><p><strong>Jawaban</strong></p>
<p><strong>Reviewer 6</strong></p></th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: right;">1</td>
<td>Bagaimana proses yang Bapak/Ibu lakukan saat memeriksa satu proposal pada tahap seleksi administrasi?</td>
<td>Pengecekan proposal secara skrining cepat mulai dari kata kunci, inti dari abstrak/pendahuluan, memastikan ada/tidaknya diagram alir, dst. baru secara detail</td>
<td>mengikuti aturan, jika kesalahannya sepele tapi akibatnya fatal ini</td>
<td>skim berdasarkan pengalaman dan aturan, misal kata kunci, daftar pustaka, jumlah kata, kesesuaian judul dengang yang ada disistem, jika ada salah 1 yang keliru kemudian selesai, jika tidak maka baru cek detail.</td>
<td>sesuai dengan penugasan lalu menyesuaikan dengan guideline dan materi persamaan persepsi, mulai dari judul, ringkasan, kata kunci, pendahuluan, jadwal, sitasi dan penomoran daftar pustaka</td>
<td>cari kesalahan yang sering terjadi seperti referensi, kata kunci, penomoran kemudian baru melihat yang lebih detil seperti jumlah kata dan setiap bagiannya, yang effortnya lebih yang ada dokumen lampiran seperti mitra dst.</td>
<td>memahami persyaratan yang harus dipenuhi, kemudian mencermati apakah dokumen tersebut sesuai persyaratan.lalu merangkum hal-hal sesuai/tidak sesuai</td>
</tr>
<tr>
<td style="text-align: right;">2</td>
<td>Berapa rata-rata waktu yang dibutuhkan untuk memeriksa satu proposal secara manual?</td>
<td>20 menit</td>
<td>10 menit</td>
<td>10 menit karena menulis komentar</td>
<td>5-10 menit</td>
<td>10-15 menit</td>
<td>skema penelitian dasar 15 menit, jika perlu copas jumlah kata maka bisa sampai sekitar 20 menit<br />
skema penelitian terapan ditambah 2-3 menit paling lama 20 menit</td>
</tr>
<tr>
<td style="text-align: right;">3</td>
<td>Dalam satu periode seleksi, rata-rata berapa proposal yang harus Bapak/Ibu periksa?</td>
<td>30 proposal administrasi</td>
<td>100 proposal</td>
<td>semula 40 proposal kemudian dapat tambahan, pernah sampai 100 proposal</td>
<td>30-40 proposal, jika ada tambahan bisa sampai 50</td>
<td>30-40 proposal, pernah sampai 120 proposal</td>
<td>bisa sampai 100-200 proposal, namun akhir" ini sudah kurang dari 100 proposal</td>
</tr>
<tr>
<td style="text-align: right;">4</td>
<td>Bagian pemeriksaan administrasi apa yang paling banyak membutuhkan waktu?</td>
<td>pengecekan sitasi perlu waktu yang banyak untuk memastikan, dan juga jumlah kata</td>
<td>badan proposal, seperti tugas tim penelitian mengerjakan tugas apa, ini biasanya dijabarkan secara explisit, urgensi kemanfaatan juga dijabarkan secara explisit</td>
<td>jumlah kata serta menulis komentar</td>
<td>pendetilan perkomponen yang harus ada di subbab karena terkadang itu tersirat, terutama pada metodologi dan pendahuluan, serta pengecekan sitasi</td>
<td>menghitung jumlah kata, mengecek dokumen lampiran</td>
<td>memeriksa gaya sitasi dan penomoran</td>
</tr>
<tr>
<td style="text-align: right;">5</td>
<td>Jika menggunakan S1 Rule-Based, berapa perkiraan waktu yang masih dibutuhkan reviewer untuk memeriksa satu proposal?</td>
<td>15 menit</td>
<td>2-3 menit</td>
<td>2-7 menit</td>
<td>3-4 menit</td>
<td>5 menit</td>
<td>pada awal mungkin masih akan mengecek validitas, jika secara sampling sudah akurat bisa 5 menit pemeriksaan</td>
</tr>
<tr>
<td style="text-align: right;">6</td>
<td>Jika menggunakan S2 Hybrid, berapa perkiraan waktu pemeriksaan satu proposal?</td>
<td>10 menit</td>
<td>5-10 menit</td>
<td>2 menit</td>
<td>2-3 menit</td>
<td>2-3 menit</td>
<td>pada awal mungkin masih akan mengecek validitas, jika secara sampling sudah akurat bisa 2-3 menit pemeriksaan</td>
</tr>
<tr>
<td style="text-align: right;">7</td>
<td>Jika menggunakan S3 AI-Based, berapa perkiraan waktu pemeriksaan satu proposal?</td>
<td>5 menit</td>
<td>0 menit</td>
<td>0 menit, jika reviewer masih digunakan maak 2-7 menit</td>
<td>bisa 1-2 menit</td>
<td></td>
<td></td>
</tr>
<tr>
<td style="text-align: right;">8</td>
<td>Seberapa besar S1 Rule-Based dapat mengurangi pekerjaan administratif yang saat ini dilakukan secara manual?</td>
<td>Penghematan waktu 10–&lt;25%</td>
<td>Penghematan waktu 10–&lt;25%</td>
<td>Penghematan waktu 50–&lt;75%</td>
<td>Penghematan waktu 10–&lt;25%</td>
<td>Penghematan waktu 50–&lt;75%</td>
<td>Penghematan waktu 25–&lt;50%</td>
</tr>
<tr>
<td style="text-align: right;">9</td>
<td>Seberapa besar S2 Hybrid dapat mengurangi pekerjaan administratif yang saat ini dilakukan secara manual?</td>
<td>Penghematan waktu 25–&lt;50%</td>
<td>Penghematan waktu 25–&lt;50%</td>
<td>Penghematan waktu ≥75%</td>
<td>Penghematan waktu 25–&lt;50%</td>
<td>Penghematan waktu 50–&lt;75%</td>
<td>Penghematan waktu 25–&lt;50%</td>
</tr>
<tr>
<td style="text-align: right;">10</td>
<td>Seberapa besar S3 AI-Based dapat mengurangi pekerjaan administratif yang saat ini dilakukan secara manual?</td>
<td>Penghematan waktu 50–&lt;75%</td>
<td>Penghematan waktu ≥75%</td>
<td>Penghematan waktu 50–&lt;75%</td>
<td>Penghematan waktu ≥75%</td>
<td>Penghematan waktu ≥75%</td>
<td></td>
</tr>
<tr>
<td style="text-align: right;">11</td>
<td>Seberapa bersedia Bapak/Ibu menggunakan S1 Rule-Based sebagai alat bantu pemeriksaan proposal?</td>
<td>Netral/bersedia menggunakan dengan beberapa persyaratan</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Sangat menerima dan mendukung penggunaan sistem</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Netral/bersedia menggunakan dengan beberapa persyaratan</td>
</tr>
<tr>
<td style="text-align: right;">12</td>
<td>Seberapa bersedia Bapak/Ibu menggunakan S2 Hybrid Rule-Based + AI?</td>
<td>Netral/bersedia menggunakan dengan beberapa persyaratan</td>
<td>Sangat menerima dan mendukung penggunaan sistem</td>
<td>Sangat menerima dan mendukung penggunaan sistem</td>
<td>Sangat menerima dan mendukung penggunaan sistem</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Netral/bersedia menggunakan dengan beberapa persyaratan</td>
</tr>
<tr>
<td style="text-align: right;">13</td>
<td>Seberapa bersedia Bapak/Ibu menggunakan S3 AI-Based?</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Cenderung menolak dan memiliki banyak kekhawatiran</td>
<td>Netral/bersedia menggunakan dengan beberapa persyaratan</td>
<td>Netral/bersedia menggunakan dengan beberapa persyaratan</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Cenderung menolak dan memiliki banyak kekhawatiran</td>
</tr>
<tr>
<td style="text-align: right;">14</td>
<td>Faktor apa yang membuat Bapak/Ibu percaya atau tidak percaya terhadap hasil rekomendasi sistem?</td>
<td>perlu dihati-hati mengenai rulenya, agar mencakup semua list rule, dan perlu ada banyak uji coba sebelum implementasi</td>
<td>karena sistem ada kelemahannya, jika tidak ada verifikasi ulang maka tidak seluruh bisa dikendalikan</td>
<td>hasil validasi retrospektif, menggunakan training data kita tes</td>
<td>seberapa cerdas sistem tersebut mendeteksi kesalahan/komponen yang seharusnya ada namun tidak tampak, contoh diagram alir dan pembagian peran tugas personil peneliti</td>
<td>seberapa reliable, akurat AI tersebut mengecek proposal</td>
<td></td>
</tr>
<tr>
<td style="text-align: right;">15</td>
<td>Apakah Bapak/Ibu tetap ingin memiliki kewenangan untuk mengubah atau menolak rekomendasi sistem? Mengapa?</td>
<td>iya, karena sistem perlu waktu untuk bisa sempurna dan adalakanya persepsi sistem dan manusia bisa berbeda</td>
<td>iya, yang penting aturannya jelas dan bisa dipahami</td>
<td>iya, sejauh ini belum ada AI yang 100% akurat</td>
<td>iya, terkadang sistem terlalu detil/strict sehingga tidak mengenali, jika reviewer masih punya kebijaksanaan dan mengerti apakah ini kesalahan yang sengaja atau tidak sengaja</td>
<td>tidak terlalu concern dengan seleksi administrasi</td>
<td>tetap butuh kewenangan reviewer</td>
</tr>
<tr>
<td style="text-align: right;">16</td>
<td>Seberapa sesuai S1 Rule-Based dengan tahapan seleksi administrasi yang saat ini dilakukan?</td>
<td>Membutuhkan perubahan besar pada proses bisnis</td>
<td>Sesuai dengan sebagian besar proses existing dan hanya membutuhkan perubahan minor</td>
<td>Sepenuhnya mendukung proses existing tanpa perubahan berarti</td>
<td>Sesuai dengan sebagian besar proses existing dan hanya membutuhkan perubahan minor</td>
<td>Sepenuhnya mendukung proses existing tanpa perubahan berarti</td>
<td>Sesuai dengan sebagian besar proses existing dan hanya membutuhkan perubahan minor</td>
</tr>
<tr>
<td style="text-align: right;">17</td>
<td>Seberapa sesuai S2 Hybrid dengan tahapan seleksi administrasi yang saat ini dilakukan?</td>
<td>Membutuhkan beberapa penyesuaian proses</td>
<td>Sepenuhnya mendukung proses existing tanpa perubahan berarti</td>
<td>Sepenuhnya mendukung proses existing tanpa perubahan berarti</td>
<td>Sesuai dengan sebagian besar proses existing dan hanya membutuhkan perubahan minor</td>
<td>Sepenuhnya mendukung proses existing tanpa perubahan berarti</td>
<td>Membutuhkan beberapa penyesuaian proses</td>
</tr>
<tr>
<td style="text-align: right;">18</td>
<td>Seberapa sesuai S3 AI-Based dengan tahapan seleksi administrasi yang saat ini dilakukan?</td>
<td>Sesuai dengan sebagian besar proses existing dan hanya membutuhkan perubahan minor</td>
<td>Sesuai dengan sebagian besar proses existing dan hanya membutuhkan perubahan minor</td>
<td>Membutuhkan perubahan besar pada proses bisnis</td>
<td>Membutuhkan perubahan besar pada proses bisnis</td>
<td>Membutuhkan perubahan besar pada proses bisnis</td>
<td>Sistem tidak sesuai dan membutuhkan perubahan total proses bisnis</td>
</tr>
<tr>
<td style="text-align: right;">19</td>
<td>Seberapa besar perubahan cara kerja yang harus dilakukan untuk menggunakan S1 Rule-Based?</td>
<td>Membutuhkan perubahan besar pada tugas dan alur kerja reviewer</td>
<td>Membutuhkan beberapa perubahan prosedur kerja</td>
<td>Hanya membutuhkan perubahan minor</td>
<td>Hampir tidak ada perubahan; sistem mengikuti alur kerja existing</td>
<td>Hanya membutuhkan perubahan minor</td>
<td>Hampir tidak ada perubahan; sistem mengikuti alur kerja existing</td>
</tr>
<tr>
<td style="text-align: right;">20</td>
<td>Seberapa besar perubahan cara kerja yang harus dilakukan untuk menggunakan S2 Hybrid?</td>
<td>Membutuhkan perubahan besar pada tugas dan alur kerja reviewer</td>
<td>Membutuhkan perubahan besar pada tugas dan alur kerja reviewer</td>
<td>Hanya membutuhkan perubahan minor</td>
<td>Hanya membutuhkan perubahan minor</td>
<td>Hanya membutuhkan perubahan minor</td>
<td>Hampir tidak ada perubahan; sistem mengikuti alur kerja existing</td>
</tr>
<tr>
<td style="text-align: right;">21</td>
<td>Seberapa besar perubahan cara kerja yang harus dilakukan untuk menggunakan S3 AI-Based?</td>
<td>Hanya membutuhkan perubahan minor</td>
<td>Membutuhkan perubahan cara kerja secara menyeluruh</td>
<td>Membutuhkan perubahan besar pada tugas dan alur kerja reviewer</td>
<td>Membutuhkan perubahan besar pada tugas dan alur kerja reviewer</td>
<td></td>
<td></td>
</tr>
<tr>
<td style="text-align: right;">22</td>
<td>Bagian apa dari cara kerja reviewer yang kemungkinan berubah apabila sistem diterapkan?</td>
<td>jika full AI maka tidak akan ada seleksi administrasi oleh reviewer, jadi reviewer fokus di seleksi substansi</td>
<td>cara berfikir reviewer masih subjektif sehingga bisa berbeda dengan rekomendasi dari AI</td>
<td>subjektif ke reviewer, 'mindon gawe"</td>
<td>reviewer justru menjadi verifikator/persetujuan penilaian dari AI tersebut</td>
<td>jika masih dibutuhkan reviewer adalah reviewer membaca penuh untuk mencari kesalahan AI, atau percaya pada AI. secara umum cara kerjanya sama.</td>
<td>tidak perlu melihat cara sitasi dan jumlah kata</td>
</tr>
<tr>
<td style="text-align: right;">23</td>
<td>Seberapa banyak pelatihan yang Bapak/Ibu perkirakan diperlukan sebelum dapat menggunakan S1 Rule-Based secara mandiri?</td>
<td>Membutuhkan pelatihan formal yang cukup panjang</td>
<td>Membutuhkan pelatihan khusus dalam beberapa sesi</td>
<td>Sangat intuitif; cukup dengan sosialisasi/panduan sederhana</td>
<td>Sangat intuitif; cukup dengan sosialisasi/panduan sederhana</td>
<td>Hanya membutuhkan pelatihan singkat</td>
<td>Sangat intuitif; cukup dengan sosialisasi/panduan sederhana</td>
</tr>
<tr>
<td style="text-align: right;">24</td>
<td>Seberapa banyak pelatihan yang Bapak/Ibu perkirakan diperlukan sebelum dapat menggunakan S2 Hybrid secara mandiri?</td>
<td>Hanya membutuhkan pelatihan singkat</td>
<td>Hanya membutuhkan pelatihan singkat</td>
<td>Sangat intuitif; cukup dengan sosialisasi/panduan sederhana</td>
<td>Hanya membutuhkan pelatihan singkat</td>
<td>Hanya membutuhkan pelatihan singkat</td>
<td>Sangat intuitif; cukup dengan sosialisasi/panduan sederhana</td>
</tr>
<tr>
<td style="text-align: right;">25</td>
<td>Seberapa banyak pelatihan yang Bapak/Ibu perkirakan diperlukan sebelum dapat menggunakan S3 AI-Based secara mandiri?</td>
<td>Sangat intuitif; cukup dengan sosialisasi/panduan sederhana</td>
<td></td>
<td>Sangat intuitif; cukup dengan sosialisasi/panduan sederhana</td>
<td>Membutuhkan pelatihan khusus dalam beberapa sesi</td>
<td></td>
<td></td>
</tr>
<tr>
<td style="text-align: right;">26</td>
<td>Jenis pelatihan apa yang menurut Bapak/Ibu diperlukan?</td>
<td>jika full AI tidak ada pelatihan, jika hybrid/rule based perlu ada refrehsmen</td>
<td>bimtek/pemahaman aturan, tentang jurnal dan bagaimana meneliti yang baik</td>
<td>testing atas kepatuhan reviewer terhadap penilaian (bisa objektif atau tidak)</td>
<td>mendeteksi false positif atau terlalu strict terhadap aturan, atau ada kebijakan tertentu pada satu skema juga perlu diperhatikan</td>
<td>apa yang dikerjakan AI dan reviewer</td>
<td>tidak perlu</td>
</tr>
<tr>
<td style="text-align: right;">27</td>
<td>Apakah keberadaan AI menimbulkan kekhawatiran terhadap peran atau tanggung jawab reviewer?</td>
<td>Sangat menerima dan mendukung penggunaan sistem</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Sangat menerima dan mendukung penggunaan sistem</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Netral/bersedia menggunakan dengan beberapa persyaratan</td>
</tr>
<tr>
<td style="text-align: right;">28</td>
<td>Jika sistem hanya memberikan rekomendasi sementara keputusan akhir tetap pada reviewer, apakah hal tersebut meningkatkan kesediaan Bapak/Ibu menggunakan sistem?</td>
<td>Sangat menerima dan mendukung penggunaan sistem</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Sangat menerima dan mendukung penggunaan sistem</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
<td>Menerima dan melihat sistem dapat membantu pekerjaan</td>
</tr>
<tr>
<td style="text-align: right;">29</td>
<td>Dari ketiga skenario, mana yang paling membantu pekerjaan reviewer tanpa mengurangi peran profesional reviewer?</td>
<td>Full AI, Hybrid, Rule Based</td>
<td>Hybrid, Rule-Based, AI Based, karena masiha da peran dari reviewer</td>
<td>S2, S1, S3, masih punya otoritas untuk mengecek hasil dari AI.</td>
<td>Hybrid, AI-Based, S1, karena masih perlu mengontrol semua namun sangat dibantu dengan hal-hal yang fundamental/dasar.</td>
<td>S3,</td>
<td>Rule Based, Hybrid, AI</td>
</tr>
</tbody>
</table>

# LAMPIRAN D: INSTRUMEN ANALISIS KEBUTUHAN

<span class="mark">\[Diisi: daftar pertanyaan wawancara lanjutan DPPM dan protokol benchmarking aplikasi sejenis.\]</span>
