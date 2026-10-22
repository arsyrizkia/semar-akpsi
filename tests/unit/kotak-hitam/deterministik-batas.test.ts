// Uji kotak hitam UC-05 dan UC-06 (Dennis dkk., 2015, hlm. 471-475): diturunkan dari Contract C-11, C-16..C-22 dan state machine
// status Proposal (docs/kontrak-dan-spesifikasi-metode.md), tanpa melihat isi metode. Kasus: nilai sah, batas bawah/atas, tipe salah, nilai janggal.
import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import type { DokumenPeriksa, KonteksPeriksa } from "@/lib/kontrak/tipe";
import { cekKataKunci, cekLampiran, cocokkanSitasi, cocokkanStrukturJudul, periksaBatasKata } from "@/lib/pemeriksa/deterministik/pemeriksa";
import { hitungKata } from "@/lib/pemeriksa/deterministik/teks";
import { adalahPengajuanPertama, hitungMasaPengusulan, statusSetelahPemeriksaan, transisiProposal, type PeristiwaProposal, type StatusProposal } from "@/lib/pengajuan/aturan";
import { buatTokenPengajuan, verifikasiTokenPengajuan } from "@/lib/pengajuan/token";

const kata = (n: number) => Array(n).fill("kata").join(" ");
const dok = (sebagian: Partial<DokumenPeriksa> = {}): DokumenPeriksa => ({
  judul: "Judul Uji",
  judulBima: "Judul Uji",
  teksPerBagian: {},
  kataKunci: null,
  lampiranAda: [],
  teksLampiran: {},
  judulBagianDitemukan: [],
  ...sebagian,
});
const konteks: KonteksPeriksa = {
  bagianTemplat: [
    { urutan: 1, nama: "Ringkasan", batasKata: 300, wajib: true },
    { urutan: 2, nama: "Metode", batasKata: 1200, wajib: true },
    { urutan: 3, nama: "Catatan", batasKata: null, wajib: false },
    { urutan: 4, nama: "Daftar Pustaka", batasKata: null, wajib: true },
  ],
  lampiranWajib: ["Surat Pernyataan Mitra", "Artikel Ketua Pengusul"],
};

describe("hitungKata (Contract C-16, MS-02)", () => {
  it("KH-hitungKata-04: teks kosong dan hanya spasi menghasilkan 0 kata", () => {
    expect(hitungKata("")).toBe(0);
    expect(hitungKata("  \n\t \n ")).toBe(0);
  });
  it("KH-hitungKata-05: batas tepat lolos, satu di atas gagal, satu di bawah lolos (batas 100)", () => {
    const d = dok({ teksPerBagian: { Metode: kata(100) } });
    expect(periksaBatasKata(d, "Metode", 100).status).toBe("Lolos");
    expect(periksaBatasKata(d, "Metode", 101).status).toBe("Lolos");
    expect(periksaBatasKata(d, "Metode", 99).status).toBe("Gagal");
    expect(periksaBatasKata(dok({ teksPerBagian: { Metode: kata(101) } }), "Metode", 100).angkaPembukti).toContain("lebih 1 kata");
  });
  it("KH-hitungKata-06: tabel dan gambar dalam bentuk penanda atau keterangan tidak dihitung", () => {
    expect(hitungKata(["a b", "[Tabel]", "Tabel 2.1: Anggaran", "[GAMBAR]", "Diagram 3 - Alur", "c"].join("\n"))).toBe(3);
  });
  it("KH-hitungKata-07: spasi ganda, tab, dan baris kosong tidak menambah hitungan", () => {
    expect(hitungKata("satu   dua\t tiga\n\n\n empat")).toBe(4);
  });
  it("KH-hitungKata-08: bagian yang tidak ditemukan dihitung 0 kata dan lolos dengan catatan", () => {
    const h = periksaBatasKata(dok(), "Metode", 100);
    expect(h.status).toBe("Lolos");
    expect(h.angkaPembukti).toContain("bagian tidak ditemukan");
  });
  it("KH-hitungKata-09: kata berangka dan tanda baca tetap satu kata per token", () => {
    expect(hitungKata("tahun 2026, (lihat) [1] 3,5 persen")).toBe(6);
  });
});

describe("cekKataKunci (Contract C-17, MS-13)", () => {
  const hasil = (kk: string | null, jumlah = 5, pemisah = ";") => cekKataKunci(dok({ kataKunci: kk }), jumlah, pemisah);
  it("KH-cekKataKunci-05: empat kata kunci gagal (satu di bawah) dengan angka pembukti", () => {
    const h = hasil("a; b; c; d");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("4 kata kunci terbaca");
  });
  it("KH-cekKataKunci-06: lima kata kunci lolos", () => expect(hasil("a; b; c; d; e").status).toBe("Lolos"));
  it("KH-cekKataKunci-07: enam kata kunci gagal (satu di atas) dan batas dilanggar menyebut 6", () => {
    const h = hasil("a; b; c; d; e; f");
    expect(h.status).toBe("Gagal");
    expect(h.batasDilanggar).toContain("ditemukan 6");
  });
  it("KH-cekKataKunci-08: pemisah salah (garis tegak) terbaca satu kata kunci dan gagal", () => {
    const h = hasil("a | b | c | d | e");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("1 kata kunci terbaca");
  });
  it("KH-cekKataKunci-09: hanya spasi atau null dianggap tidak ditemukan", () => {
    expect(hasil("   ").angkaPembukti).toContain("tidak ditemukan");
    expect(hasil(null).status).toBe("Gagal");
  });
  it("KH-cekKataKunci-10: pemisah berlebih di ujung dan segmen kosong tidak dihitung (nilai janggal tetapi sah)", () => {
    expect(hasil("a;; b; c ; d; e;").status).toBe("Lolos");
  });
  it("KH-cekKataKunci-11: jumlah diminta lain (tiga, pemisah koma) mengikuti parameter butir", () => {
    expect(hasil("x, y, z", 3, ",").status).toBe("Lolos");
    expect(hasil("x, y", 3, ",").angkaPembukti).toContain("diminta tepat 3");
  });
});

describe("cocokkanSitasi (Contract C-18, MS-03)", () => {
  const isiDan = (isi: string, pustaka?: string): DokumenPeriksa =>
    dok({ teksPerBagian: pustaka === undefined ? { Ringkasan: isi } : { Ringkasan: isi, "Daftar Pustaka": pustaka } });
  it("KH-cocokkanSitasi-07: sitasi bernomor saja lolos", () => {
    expect(cocokkanSitasi(isiDan("Satu [1], dua [2]."), konteks, "sitasi_bernomor").status).toBe("Lolos");
  });
  it("KH-cocokkanSitasi-08: naskah tanpa satu pun sitasi bernomor gagal", () => {
    const h = cocokkanSitasi(isiDan("Tanpa sitasi."), konteks, "sitasi_bernomor");
    expect(h.status).toBe("Gagal");
    expect(h.batasDilanggar).toContain("tidak ada sitasi bernomor");
  });
  it("KH-cocokkanSitasi-09: nama-tahun dengan 'dkk.' dan 'et al.' terdeteksi", () => {
    const h = cocokkanSitasi(isiDan("Menurut (Wijaya dkk., 2021) dan (Lee et al., 2019) [1]."), konteks, "sitasi_bernomor");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("2 sitasi gaya nama-tahun");
  });
  it("KH-cocokkanSitasi-10: jumlah entri sama dengan jumlah nomor dikutip lolos; entri tidak dikutip gagal", () => {
    expect(cocokkanSitasi(isiDan("a [1] b [2]", "[1] A\n[2] B"), konteks, "jumlah_referensi_sama").status).toBe("Lolos");
    const h = cocokkanSitasi(isiDan("a [1]", "[1] A\n[2] B"), konteks, "jumlah_referensi_sama");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("nomor 2 tidak dikutip");
  });
  it("KH-cocokkanSitasi-11: Daftar Pustaka kosong gagal pada jumlah_referensi_sama dan pustaka_berurutan", () => {
    expect(cocokkanSitasi(isiDan("a [1]", ""), konteks, "jumlah_referensi_sama").status).toBe("Gagal");
    expect(cocokkanSitasi(isiDan("a [1]", ""), konteks, "pustaka_berurutan").angkaPembukti).toContain("tidak ada entri bernomor");
  });
  it("KH-cocokkanSitasi-12: entri pustaka berformat '1.' dan '1)' dikenali, baris lanjutan digabung", () => {
    const d = isiDan("a [1] b [2]", "1. Penulis A. Judul\n   lanjutan baris\n2) Penulis B.");
    expect(cocokkanSitasi(d, konteks, "pustaka_berurutan").status).toBe("Lolos");
    expect(cocokkanSitasi(d, konteks, "jumlah_referensi_sama").status).toBe("Lolos");
  });
});

describe("cekLampiran (Contract C-19)", () => {
  it("KH-cekLampiran-01: lampiran ada lolos tanpa membedakan huruf besar dan spasi ganda", () => {
    const d = dok({ lampiranAda: ["surat  pernyataan MITRA"] });
    expect(cekLampiran(d, konteks, "Surat Pernyataan Mitra").status).toBe("Lolos");
  });
  it("KH-cekLampiran-02: tanpa lampiran terunggah gagal dan menyebut 0 dari 2", () => {
    const h = cekLampiran(dok(), konteks, "Surat Pernyataan Mitra");
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("0 dari 2 lampiran wajib ada");
    expect(h.batasDilanggar).toContain("belum diunggah");
  });
  it("KH-cekLampiran-03: daftar lampiran wajib templat kosong memakai nama butir sebagai satu-satunya wajib", () => {
    const k: KonteksPeriksa = { ...konteks, lampiranWajib: [] };
    expect(cekLampiran(dok({ lampiranAda: ["Peta Lokasi"] }), k, "Peta Lokasi").status).toBe("Lolos");
    expect(cekLampiran(dok(), k, "Peta Lokasi").angkaPembukti).toContain("0 dari 1");
  });
  it("KH-cekLampiran-04: lampiran yang diunggah bernama lain tidak memenuhi", () => {
    expect(cekLampiran(dok({ lampiranAda: ["Artikel Ketua Pengusul"] }), konteks, "Surat Pernyataan Mitra").status).toBe("Gagal");
  });
});

describe("cocokkanStrukturJudul (Contract C-20)", () => {
  it("KH-cocokkanStrukturJudul-01: bagian_wajib ada lolos, tidak ada gagal dengan nama bagian", () => {
    const ada = dok({ judulBagianDitemukan: ["2. Metode"] });
    expect(cocokkanStrukturJudul(ada, konteks, { tipe: "bagian_wajib", bagian: "Metode" }).status).toBe("Lolos");
    const h = cocokkanStrukturJudul(dok(), konteks, { tipe: "bagian_wajib", bagian: "Metode" });
    expect(h.status).toBe("Gagal");
    expect(h.batasDilanggar).toContain('"Metode"');
  });
  it("KH-cocokkanStrukturJudul-02: judul naskah kosong gagal pada judul_sama", () => {
    const h = cocokkanStrukturJudul(dok({ judul: "  " }), konteks, { tipe: "judul_sama" });
    expect(h.status).toBe("Gagal");
    expect(h.angkaPembukti).toContain("tidak ditemukan");
  });
  it("KH-cocokkanStrukturJudul-03: struktur sama persis lolos; judul di luar templat dicatat tetapi tidak menggagalkan", () => {
    const d = dok({ judulBagianDitemukan: ["Ringkasan", "Metode", "Lampiran Tambahan", "Daftar Pustaka"] });
    const h = cocokkanStrukturJudul(d, konteks, { tipe: "struktur_judul" });
    expect(h.status).toBe("Lolos");
    expect(h.angkaPembukti).toContain('judul di luar templat: "Lampiran Tambahan"');
  });
  it("KH-cocokkanStrukturJudul-04: bagian opsional yang tidak ada tidak mengurangi bagian wajib", () => {
    const d = dok({ judulBagianDitemukan: ["Ringkasan", "Metode", "Daftar Pustaka"] });
    expect(cocokkanStrukturJudul(d, konteks, { tipe: "struktur_judul" }).angkaPembukti).toContain("3 dari 3 bagian wajib");
  });
});

describe("cekMasaPengusulan (Contract C-11)", () => {
  const buka = new Date("2026-10-01T00:00:00Z");
  const tutup = new Date("2026-10-31T16:59:59Z");
  const lagi = (iso: string, sakelar = true) => hitungMasaPengusulan(new Date(iso), buka, tutup, sakelar);
  it("KH-cekMasaPengusulan-01: di tengah masa dengan sakelar berjalan", () => expect(lagi("2026-10-15T00:00:00Z")).toBe(true));
  it("KH-cekMasaPengusulan-02: tepat pada tanggal tutup masih berjalan (inklusif)", () => expect(lagi("2026-10-31T16:59:59Z")).toBe(true));
  it("KH-cekMasaPengusulan-03: satu milidetik sesudah tanggal tutup ditutup", () => expect(lagi("2026-10-31T16:59:59.001Z")).toBe(false));
  it("KH-cekMasaPengusulan-04: tepat pada tanggal buka berjalan, satu milidetik sebelumnya belum", () => {
    expect(lagi("2026-10-01T00:00:00Z")).toBe(true);
    expect(lagi("2026-09-30T23:59:59.999Z")).toBe(false);
  });
  it("KH-cekMasaPengusulan-05: sakelar ditutup menang walau tanggal di dalam rentang", () => expect(lagi("2026-10-15T00:00:00Z", false)).toBe(false));
  it("KH-cekMasaPengusulan-06: tanggal tidak sah (Invalid Date) tidak pernah dianggap berjalan", () => {
    expect(hitungMasaPengusulan(new Date("bukan tanggal"), buka, tutup, true)).toBe(false);
    expect(hitungMasaPengusulan(new Date("2026-10-15T00:00:00Z"), buka, new Date("x"), true)).toBe(false);
  });
});

describe("state machine status Proposal (CRC Proposal; Contract C-22)", () => {
  const sah: [StatusProposal, PeristiwaProposal, StatusProposal][] = [
    ["Belum diajukan", "mulai", "Sedang diperiksa"],
    ["Sedang diperiksa", "semua-lolos", "Terkirim"],
    ["Sedang diperiksa", "ada-gagal", "Ditahan"],
    ["Ditahan", "mulai", "Sedang diperiksa"],
    ["Ditahan", "masa-tutup", "Ditolak"],
    ["Belum diajukan", "masa-tutup", "Ditolak"],
    ["Sedang diperiksa", "masa-tutup", "Ditolak"],
    ["Ditolak", "mulai", "Sedang diperiksa"],
  ];
  it("KH-statusProposal-01: semua transisi yang didefinisikan menghasilkan status berikutnya yang benar", () => {
    for (const [dari, peristiwa, ke] of sah) expect(transisiProposal(dari, peristiwa), `${dari} + ${peristiwa}`).toBe(ke);
  });
  it("KH-statusProposal-02: Terkirim adalah keadaan akhir, semua peristiwa ditolak", () => {
    for (const p of ["mulai", "semua-lolos", "ada-gagal", "masa-tutup", "galat"] as PeristiwaProposal[]) {
      expect(() => transisiProposal("Terkirim", p)).toThrow("transisi tidak diizinkan");
    }
  });
  it("KH-statusProposal-03: transisi yang tidak didefinisikan ditolak (Ditahan tidak bisa langsung Terkirim)", () => {
    expect(() => transisiProposal("Ditahan", "semua-lolos")).toThrow();
    expect(() => transisiProposal("Belum diajukan", "semua-lolos")).toThrow();
  });
  it("KH-statusProposal-04: statusSetelahPemeriksaan: 0 gagal Terkirim, 1 gagal Ditahan", () => {
    expect(statusSetelahPemeriksaan(0)).toBe("Terkirim");
    expect(statusSetelahPemeriksaan(1)).toBe("Ditahan");
    expect(statusSetelahPemeriksaan(17)).toBe("Ditahan");
  });
  it("KH-statusProposal-05: jumlah gagal negatif atau pecahan ditolak (tipe salah)", () => {
    expect(() => statusSetelahPemeriksaan(-1)).toThrow();
    expect(() => statusSetelahPemeriksaan(0.5)).toThrow();
    expect(() => statusSetelahPemeriksaan(Number.NaN)).toThrow();
  });
});

describe("token pengajuan (CRC Proposal; satu token satu pengajuan)", () => {
  const dasar = { idProposal: "PRP-2026-0001", idBima: "pengusul-1", judul: "J", skemaKode: "PD" };
  it("KH-tokenPengajuan-02: dua token untuk proposal yang sama memiliki jti berbeda", async () => {
    const a = await verifikasiTokenPengajuan(await buatTokenPengajuan(dasar));
    const b = await verifikasiTokenPengajuan(await buatTokenPengajuan(dasar));
    expect(a!.jti).not.toBe(b!.jti);
  });
  it("KH-tokenPengajuan-03: hanya entri audit pertama untuk sebuah jti yang diterima, sisanya duplikat", () => {
    expect(adalahPengajuanPertama(10, 10)).toBe(true);
    expect(adalahPengajuanPertama(10, 11)).toBe(false);
    expect(adalahPengajuanPertama(10, 12)).toBe(false);
  });
  it("KH-tokenPengajuan-04: tidak ada entri pembanding (null atau undefined) tidak pernah dianggap pertama", () => {
    expect(adalahPengajuanPertama(null, 1)).toBe(false);
    expect(adalahPengajuanPertama(undefined, 1)).toBe(false);
  });
  it("KH-tokenPengajuan-05: token berstring kosong, bertanda tangan kunci lain, atau tanpa klaim wajib ditolak", async () => {
    expect(await verifikasiTokenPengajuan("")).toBeNull();
    const asing = await new SignJWT({ idProposal: "X" }).setProtectedHeader({ alg: "HS256" }).setAudience("semar-pengajuan").setJti("j").sign(new TextEncoder().encode("kunci-lain-yang-cukup-panjang-123456"));
    expect(await verifikasiTokenPengajuan(asing)).toBeNull();
  });
  it("KH-tokenPengajuan-06: token dengan audiens lain ditolak", async () => {
    const t = await new SignJWT({ idProposal: "X", idBima: "y", judul: "j", skemaKode: "PD" }).setProtectedHeader({ alg: "HS256" }).setAudience("lain").sign(new TextEncoder().encode("kunci"));
    expect(await verifikasiTokenPengajuan(t)).toBeNull();
  });
});
