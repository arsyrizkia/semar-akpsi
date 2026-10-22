// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-08 siapkanTeksTanpaIdentitas (Contract C-23), cabang ekspor BIMA:
// pembuangan bagian "2. IDENTITAS PENGUSUL", baris NO. DOKUMEN, dan pengumpulan identitas anggota tim.
import { describe, expect, it } from "vitest";
import { PENANDA_IDENTITAS, buangIdentitasBima, kumpulkanIdentitasBima, siapkanTeksTanpaIdentitas } from "@/lib/pemeriksa/semantik/teks";

const ekspor = [
  "PROPOSAL PENELITIAN",
  "NO. DOKUMEN: PP-000000000001",
  "1. JUDUL PENELITIAN",
  "Judul Rekaan Penelitian",
  "2. IDENTITAS PENGUSUL",
  "Nama, Peran Jenis Program Studi/Bagian Bidang Tugas ID Sinta",
  "NAMA KETUA REKAAN",
  "0011223344",
  "Ketua Pengusul",
  "Universitas Rekaan",
  "Dosen Teknik Contoh",
  "NAMA ANGGOTA REKAAN",
  "0055667788",
  "Anggota",
  "Mahasiswa Rekaan Satu",
  "2299887766",
  "Mahasiswa",
  "3. MITRA KERJASAMA PENELITIAN (Jika Ada)",
  "tidak ada",
  "A. JUDUL",
  "Judul Rekaan Penelitian",
  "E. METODE",
  "Pembagian tugas: Mahasiswa Rekaan Satu (NIM 2299887766) membantu pengumpulan data; Nama Anggota Rekaan bertugas menganalisis.",
].join("\n");

describe("buangIdentitasBima (cabang)", () => {
  it("KP-identitasBima-01: blok identitas diganti satu penanda sampai judul bagian bernomor berikutnya; NO. DOKUMEN dibuang", () => {
    const hasil = buangIdentitasBima(ekspor).split("\n");
    expect(hasil).not.toContain("NO. DOKUMEN: PP-000000000001");
    expect(hasil.filter((b) => b === PENANDA_IDENTITAS)).toHaveLength(1);
    expect(hasil).toContain("3. MITRA KERJASAMA PENELITIAN (Jika Ada)");
    expect(hasil.join("\n")).not.toMatch(/0011223344|IDENTITAS PENGUSUL|Ketua Pengusul/);
  });
  it("KP-identitasBima-02: tanpa blok identitas, hanya baris NO. DOKUMEN yang dibuang; teks lain tidak berubah", () => {
    expect(buangIdentitasBima("A. JUDUL\nj\nNO. DOKUMEN : X")).toBe("A. JUDUL\nj");
    expect(buangIdentitasBima("teks biasa")).toBe("teks biasa");
  });
  it("KP-identitasBima-03: blok identitas tanpa judul bagian penutup: dibuang sampai akhir teks; A. JUDUL juga menutup blok", () => {
    expect(buangIdentitasBima("2. IDENTITAS PENGUSUL\nx\ny")).toBe(PENANDA_IDENTITAS);
    expect(buangIdentitasBima("2. IDENTITAS PENGUSUL\nx\nA. JUDUL\nj")).toBe(`${PENANDA_IDENTITAS}\nA. JUDUL\nj`);
  });
});

describe("kumpulkanIdentitasBima dan siapkanTeksTanpaIdentitas (cabang)", () => {
  it("KP-identitasBima-04: nomor induk panjang dan nama di atasnya dikumpulkan; baris peran, angka, dan nama pendek diabaikan; tanpa blok: kosong", () => {
    const hasil = kumpulkanIdentitasBima(ekspor);
    expect(hasil).toEqual(expect.arrayContaining(["0011223344", "NAMA KETUA REKAAN", "0055667788", "NAMA ANGGOTA REKAAN", "2299887766", "Mahasiswa Rekaan Satu"]));
    expect(hasil).not.toContain("Ketua Pengusul");
    expect(kumpulkanIdentitasBima("tanpa blok")).toEqual([]);
    expect(kumpulkanIdentitasBima("2. IDENTITAS PENGUSUL\nAnggota\n12345678\nAB\n87654321\nDosen\n11112222\n3. MITRA")).toEqual(["12345678", "87654321", "11112222"]);
  });
  it("KP-identitasBima-05: seluruh identitas anggota tim ikut dibuang dari teks lain (pembagian tugas pada Metode), tanpa memberi identitas pengusul", () => {
    const bersih = siapkanTeksTanpaIdentitas(ekspor, {});
    expect(bersih).not.toMatch(/2299887766|Mahasiswa Rekaan Satu|NAMA ANGGOTA REKAAN/i);
    expect(bersih).toContain("Pembagian tugas: [identitas dihapus] (NIM [identitas dihapus]) membantu pengumpulan data");
    expect(bersih).toContain("A. JUDUL");
  });
});
