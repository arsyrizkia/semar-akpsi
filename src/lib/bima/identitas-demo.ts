/**
 * Isian BIMA tiruan yang sudah terisi untuk demo (langkah Identitas Usulan, Substansi Usulan selain dokumen, RAB): data rekaan yang
 * tetap untuk setiap usulan (diturunkan dari idProposal, skema, dan judul), supaya saat demo pengusul tinggal mengunggah dokumen usulan.
 * BIMA asli menyimpan isian ini sendiri; tabel BIMA tiruan tidak memilikinya, dan SEMAR tidak memakainya. Murni.
 */

export interface AnggotaDemo {
  peran: "Ketua" | "Anggota" | "Mahasiswa";
  nama: string;
  /** NIDN untuk dosen, NIM untuk mahasiswa (rekaan) */
  nomorInduk: string;
  institusi: string;
  tugas: string;
}

export interface BarisRab {
  tahun: number;
  kelompok: string;
  komponen: string;
  keterangan: string;
  hargaSatuan: number;
  volume: number;
  satuan: string;
}

export interface IdentitasDemo {
  tktSaatIni: number;
  tktTarget: number;
  kelompokSkema: string;
  ruangLingkup: string;
  danaMaksimalPerTahun: number;
  bidangFokus: string;
  tema: string;
  topik: string;
  rumpunIlmu: [string, string, string];
  prioritasRiset: string;
  tahunPertama: number;
  lamaKegiatan: number;
  anggota: AnggotaDemo[];
  kelompokMakroRiset: string;
  luaranWajib: { tahun: number; luaran: string; status: string }[];
  rab: BarisRab[];
}

const BIDANG = [
  { bidang: "Pangan", tema: "Ketahanan pangan berkelanjutan", topik: "Kemandirian pangan berbasis sumber daya lokal", rumpun: ["Ilmu Pertanian", "Agribisnis", "Sosial Ekonomi Pertanian"] },
  { bidang: "Kemaritiman", tema: "Pengelolaan sumber daya pesisir", topik: "Ketahanan ekonomi masyarakat pesisir", rumpun: ["Ilmu Kelautan", "Sosial Ekonomi Perikanan", "Manajemen Sumber Daya Perairan"] },
  { bidang: "Kebencanaan", tema: "Mitigasi dan adaptasi bencana", topik: "Sistem peringatan dini berbasis data", rumpun: ["Ilmu Teknik", "Teknik Sipil", "Teknik Lingkungan"] },
  { bidang: "Kesehatan", tema: "Layanan kesehatan masyarakat", topik: "Pemanfaatan data untuk layanan primer", rumpun: ["Ilmu Kesehatan", "Kesehatan Masyarakat", "Epidemiologi"] },
  { bidang: "Digitalisasi", tema: "Transformasi digital layanan publik", topik: "Sistem informasi untuk pengambilan keputusan", rumpun: ["Ilmu Teknik", "Teknik Elektro", "Ilmu Komputer"] },
] as const;

const NAMA_ANGGOTA = ["Dr. Rina Kartikasari", "Dr. Arif Wicaksono", "Dr. Maya Puspitasari", "Dr. Hendra Gunawan", "Dr. Sari Wulandari", "Dr. Bayu Pratama"];
const NAMA_MAHASISWA = ["Nadia Rahmawati", "Fajar Nugroho", "Intan Permatasari", "Rizky Ramadhan"];

/** Hash kecil yang stabil (FNV-1a) untuk memilih data rekaan. */
function hash(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const nomor = (dasar: string, panjang: number) => String(hash(dasar) % 10 ** panjang).padStart(panjang, "0");

export function identitasDemo(u: { id: string; skemaKode: string; judul: string; ketua: { nama: string; institusi: string | null; nomorInduk: string | null }; tahun: number }): IdentitasDemo {
  const h = hash(`${u.id}|${u.judul}`);
  const b = BIDANG[h % BIDANG.length];
  const terapan = u.skemaKode === "PT";
  const lama = 2;
  const dana = terapan ? 150_000_000 : 75_000_000;
  const institusi = u.ketua.institusi ?? "Universitas Contoh";
  const a1 = NAMA_ANGGOTA[h % NAMA_ANGGOTA.length];
  const a2 = NAMA_ANGGOTA[(h + 3) % NAMA_ANGGOTA.length];
  const mhs = NAMA_MAHASISWA[h % NAMA_MAHASISWA.length];

  // RAB per tahun: komponen sama, total di bawah dana maksimal per tahun
  const komponen: Omit<BarisRab, "tahun">[] = [
    { kelompok: "Honor", komponen: "Honor pembantu peneliti", keterangan: "Asisten pengumpulan data", hargaSatuan: 1_500_000, volume: 6, satuan: "OB" },
    { kelompok: "Bahan", komponen: "Bahan habis pakai", keterangan: "ATK dan bahan survei", hargaSatuan: 2_500_000, volume: 2, satuan: "paket" },
    { kelompok: "Pengumpulan data", komponen: "Transport survei lapangan", keterangan: `Survei ke lokasi mitra`, hargaSatuan: 750_000, volume: 12, satuan: "OK" },
    { kelompok: "Sewa peralatan", komponen: "Sewa perangkat lunak analisis", keterangan: "Lisensi tahunan", hargaSatuan: 6_000_000, volume: 1, satuan: "tahun" },
    { kelompok: "Analisis data", komponen: "Pengolahan dan validasi data", keterangan: "Lokakarya bersama mitra", hargaSatuan: 3_500_000, volume: 2, satuan: "kegiatan" },
    { kelompok: "Pelaporan, luaran wajib, dan luaran tambahan", komponen: "Biaya publikasi artikel", keterangan: "Jurnal nasional terakreditasi", hargaSatuan: terapan ? 7_500_000 : 4_000_000, volume: 1, satuan: "artikel" },
  ];
  const rab = Array.from({ length: lama }, (_, i) => komponen.map((k) => ({ ...k, tahun: i + 1 }))).flat();

  return {
    tktSaatIni: terapan ? 3 : 1,
    tktTarget: terapan ? 5 : 3,
    kelompokSkema: terapan ? "Penelitian Terapan" : "Penelitian Dasar",
    ruangLingkup: terapan ? "Penelitian Terapan Luaran Model" : "Penelitian Fundamental Reguler",
    danaMaksimalPerTahun: dana,
    bidangFokus: b.bidang,
    tema: b.tema,
    topik: b.topik,
    rumpunIlmu: [...b.rumpun],
    prioritasRiset: "Riset prioritas nasional",
    tahunPertama: u.tahun,
    lamaKegiatan: lama,
    anggota: [
      { peran: "Ketua", nama: u.ketua.nama, nomorInduk: u.ketua.nomorInduk ?? nomor(`${u.id}k`, 10), institusi, tugas: "Merancang penelitian dan menulis artikel" },
      { peran: "Anggota", nama: a1, nomorInduk: nomor(`${u.id}a1`, 10), institusi, tugas: "Mengumpulkan dan mengolah data" },
      { peran: "Anggota", nama: a2, nomorInduk: nomor(`${u.id}a2`, 10), institusi, tugas: "Menguji model dan menganalisis hasil" },
      { peran: "Mahasiswa", nama: mhs, nomorInduk: `2${nomor(`${u.id}m`, 9)}`, institusi, tugas: "Membantu survei lapangan" },
    ],
    kelompokMakroRiset: terapan ? "Riset terapan untuk mitra" : "Riset dasar berorientasi pengetahuan",
    luaranWajib: [
      { tahun: 1, luaran: "Artikel di jurnal nasional terakreditasi (Sinta 1-2)", status: "Submitted" },
      { tahun: 2, luaran: terapan ? "Model atau prototipe yang diuji bersama mitra" : "Artikel di jurnal internasional bereputasi", status: "Accepted" },
    ],
    rab,
  };
}

export const totalRab = (rab: BarisRab[], tahun?: number) => rab.filter((r) => tahun === undefined || r.tahun === tahun).reduce((n, r) => n + r.hargaSatuan * r.volume, 0);
