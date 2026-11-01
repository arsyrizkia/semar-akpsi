// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: pra-periksa M-16 (lib/pengajuan/pra-periksa.ts susunHasilPraPeriksa) dan
// tiket lolos (lib/pengajuan/tiket.ts); setiap cabang.
import { describe, expect, it } from "vitest";
import type { ButirCek, HasilButirDeterministik } from "@/lib/kontrak/tipe";
import { identitasDemo, totalRab } from "@/lib/bima/identitas-demo";
import { susunHasilPraPeriksa } from "@/lib/pengajuan/pra-periksa";
import { bacaTokenPraPeriksa, buatTiketLolos, buatTokenPraPeriksa, periksaTiketLolos, sidikBerkas } from "@/lib/pengajuan/tiket";

const butir = (kode: string, deskripsi: string) => ({ id: kode, kode, deskripsi }) as ButirCek;
const hasil = (kode: string, status: "Lolos" | "Gagal", batas: string | null = null): HasilButirDeterministik => ({
  butirId: kode,
  kode,
  bagian: "Metode",
  status,
  angkaPembukti: `${kode} terbaca`,
  batasDilanggar: batas,
});

describe("susunHasilPraPeriksa", () => {
  const daftar = [butir("A-01", "Satu"), butir("A-02", "Dua"), butir("A-03", "Tiga")];
  it("KP-susunHasilPraPeriksa-01: Gagal lebih dulu, lalu urutan butir; deskripsi digabung; batas hanya untuk Gagal", () => {
    const h = susunHasilPraPeriksa([hasil("A-01", "Lolos", "abaikan"), hasil("A-03", "Gagal", "maks 1.000"), hasil("A-02", "Lolos")], daftar, { dikenali: 8, templat: 8 });
    expect(h.baris.map((b) => b.deskripsi)).toEqual(["Tiga", "Satu", "Dua"]);
    expect(h.baris[0].batasDilanggar).toBe("maks 1.000");
    expect(h.baris[1].batasDilanggar).toBeNull();
    expect(h).toMatchObject({ lolos: false, jumlahButir: 3, jumlahGagal: 1, bagianDikenali: 8, bagianTemplat: 8 });
  });
  it("KP-susunHasilPraPeriksa-02: lolos hanya bila ada butir dan tidak ada yang gagal", () => {
    expect(susunHasilPraPeriksa([hasil("A-01", "Lolos")], daftar, { dikenali: 8, templat: 8 }).lolos).toBe(true);
    expect(susunHasilPraPeriksa([], daftar, { dikenali: 0, templat: 8 }).lolos).toBe(false);
  });
});

describe("token dan tiket M-16", () => {
  const sidik = sidikBerkas(Buffer.from("isi naskah"));
  it("KP-tiketLolos-01: tiket sah untuk usulan dan berkas yang sama", async () => {
    const t = await buatTiketLolos({ idProposal: "PRP-2027-0001", sidik, jumlahButir: 20 });
    expect(await periksaTiketLolos(t, { idProposal: "PRP-2027-0001", sidik })).toEqual({ jumlahButir: 20 });
  });
  it("KP-tiketLolos-02: berkas berbeda, usulan lain, kedaluwarsa, atau palsu ditolak", async () => {
    const t = await buatTiketLolos({ idProposal: "PRP-2027-0001", sidik, jumlahButir: 20 });
    expect(await periksaTiketLolos(t, { idProposal: "PRP-2027-0001", sidik: sidikBerkas(Buffer.from("berkas lain")) })).toBeNull();
    expect(await periksaTiketLolos(t, { idProposal: "PRP-2027-0002", sidik })).toBeNull();
    const kedaluwarsa = await buatTiketLolos({ idProposal: "PRP-2027-0001", sidik, jumlahButir: 20 }, -10);
    expect(await periksaTiketLolos(kedaluwarsa, { idProposal: "PRP-2027-0001", sidik })).toBeNull();
    expect(await periksaTiketLolos(`${t.slice(0, -4)}abcd`, { idProposal: "PRP-2027-0001", sidik })).toBeNull();
  });
  it("KP-tokenPraPeriksa-01: token terbaca kembali; token tiket (audiens lain) ditolak", async () => {
    const k = { idProposal: "PRP-2027-0001", idBima: "pengusul-1", judul: "Judul", skemaKode: "PD" };
    expect(await bacaTokenPraPeriksa(await buatTokenPraPeriksa(k))).toEqual(k);
    expect(await bacaTokenPraPeriksa(await buatTiketLolos({ idProposal: "x", sidik, jumlahButir: 1 }))).toBeNull();
  });
});

describe("identitasDemo", () => {
  const u = { id: "PRP-2027-0001", skemaKode: "PD", judul: "Judul contoh", ketua: { nama: "Dr. Sekar", institusi: "Universitas Contoh", nomorInduk: null }, tahun: 2027 };
  it("KP-identitasDemo-01: tetap untuk usulan yang sama; ketua = pengusul; RAB tiap tahun di bawah dana maksimal", () => {
    const a = identitasDemo(u);
    expect(identitasDemo(u)).toEqual(a);
    expect(a.anggota[0]).toMatchObject({ peran: "Ketua", nama: "Dr. Sekar", institusi: "Universitas Contoh" });
    for (let t = 1; t <= a.lamaKegiatan; t++) expect(totalRab(a.rab, t)).toBeLessThanOrEqual(a.danaMaksimalPerTahun);
    expect(a.tahunPertama).toBe(2027);
  });
  it("KP-identitasDemo-02: skema terapan memakai TKT dan dana terapan", () => {
    const pd = identitasDemo(u);
    const pt = identitasDemo({ ...u, skemaKode: "PT" });
    expect([pd.tktSaatIni, pd.tktTarget, pt.tktSaatIni, pt.tktTarget]).toEqual([1, 3, 3, 5]);
    expect(pt.danaMaksimalPerTahun).toBeGreaterThan(pd.danaMaksimalPerTahun);
  });
});
