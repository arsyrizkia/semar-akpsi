// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-09 rekapKesesuaian / hitungTingkatKoreksi (Contract C-29)
// beserta fungsi bantunya, dan pilahButirDitandai (Contract C-30); setiap cabang/jalur.
import { describe, expect, it } from "vitest";
import { AMBANG_PEMANTAUAN } from "@/lib/pemantauan/ambang";
import {
  bandingkanVersi,
  kelompokKeyakinan,
  pilahPerluPerhatian,
  rekapKesesuaian,
  ringkasGagalInstitusi,
  tafsirKalibrasi,
  trenMingguan,
  type BarisKalibrasi,
  type MasukanRekap,
  type SelSemantik,
} from "@/lib/pemantauan/rekap";
import { pilahButirDitandai } from "@/lib/pemantauan/status-butir";

const sel = (kode: string, jumlah: number, o: Partial<SelSemantik> = {}): SelSemantik => ({
  butirKode: kode,
  versi: 1,
  deskripsi: `Deskripsi ${kode}`,
  tingkat: "tinggi",
  minggu: 1,
  arah: null,
  jenis: null,
  jumlah,
  ...o,
});
const masukan = (o: Partial<MasukanRekap> = {}): MasukanRekap => ({
  sel: [],
  gagal: [],
  pengajuan: [],
  butir: [],
  contoh: [],
  contohGagal: [],
  proposalPernahGagal: 0,
  penilaianFinal: 0,
  ...o,
});
const A = AMBANG_PEMANTAUAN;

describe("trenMingguan dan kelompokKeyakinan (MS-09 J8, J9)", () => {
  it("KP-trenMingguan-01: dijumlah per minggu, urut minggu, % disetujui per minggu", () => {
    const t = trenMingguan([sel("A", 8, { minggu: 2 }), sel("A", 2, { minggu: 2, arah: "longgar" }), sel("B", 5, { minggu: 1 })]);
    expect(t.map((x) => [x.minggu, x.jumlah, x.dikoreksi, x.persen])).toEqual([
      [1, 5, 0, 100],
      [2, 10, 2, 80],
    ]);
  });

  it("KP-kelompokKeyakinan-01: urutan tinggi, sedang, rendah; tingkat tanpa hasil dan tingkat null tidak ikut", () => {
    const k = kelompokKeyakinan([sel("A", 10, { tingkat: "rendah", arah: "ketat" }), sel("A", 10, { tingkat: "rendah" }), sel("A", 4, { tingkat: "tinggi" }), sel("A", 3, { tingkat: null })]);
    expect(k.map((x) => [x.tingkat, x.jumlah, x.persenDikoreksi])).toEqual([
      ["tinggi", 4, 0],
      ["rendah", 20, 50],
    ]);
  });
});

describe("tafsirKalibrasi: cabang (MS-09 J10)", () => {
  const k = (tingkat: BarisKalibrasi["tingkat"], jumlah: number, persenDikoreksi: number): BarisKalibrasi => ({ tingkat, jumlah, dikoreksi: Math.round((jumlah * persenDikoreksi) / 100), persenDikoreksi });

  it("KP-tafsirKalibrasi-01: data kurang (tinggi atau pembanding < minHasil) -> bermakna null", () => {
    expect(tafsirKalibrasi([k("tinggi", 29, 5), k("rendah", 100, 30)]).bermakna).toBeNull();
    expect(tafsirKalibrasi([k("tinggi", 100, 5), k("rendah", 29, 30)]).bermakna).toBeNull();
  });
  it("KP-tafsirKalibrasi-02: keyakinan tinggi dikoreksi >= ambang terlaluYakin -> false", () => {
    const t = tafsirKalibrasi([k("tinggi", 100, A.terlaluYakin), k("rendah", 100, 40)]);
    expect(t.bermakna).toBe(false);
    expect(t.kalimat).toMatch(/tetap sering dikoreksi/);
  });
  it("KP-tafsirKalibrasi-03: pembanding terendah yang cukup dikoreksi >= 1,5 kali -> true", () => {
    const t = tafsirKalibrasi([k("tinggi", 100, 4), k("sedang", 100, 6), k("rendah", 10, 50)]);
    expect(t.bermakna).toBe(true);
    expect(t.kalimat).toMatch(/sedang dikoreksi 1,5 kali/);
  });
  it("KP-tafsirKalibrasi-04: selisih kecil -> false (tidak membedakan)", () => {
    expect(tafsirKalibrasi([k("tinggi", 100, 10), k("rendah", 100, 12)]).kalimat).toMatch(/hampir tidak membedakan/);
  });
});

describe("rekapKesesuaian: cabang baris semantik (MS-09 J2-J5)", () => {
  it("KP-rekapKesesuaian-01: batas cukup data tepat di minHasil, dan perhatian hanya bila cukup", () => {
    const h = rekapKesesuaian(masukan({ sel: [sel("A", A.minHasil - 1, { arah: "longgar" }), sel("B", A.minHasil - 10), sel("B", 10, { arah: "longgar" })] }));
    const a = h.semantik.find((b) => b.kode === "A")!;
    const b = h.semantik.find((x) => x.kode === "B")!;
    expect([a.cukup, a.perhatian]).toEqual([false, false]);
    expect(b.jumlah).toBe(A.minHasil);
    expect([b.cukup, b.perhatian]).toEqual([true, true]);
  });

  it("KP-rekapKesesuaian-02: tepat di ambang disetujui tidak menyala; di bawahnya menyala", () => {
    const h = rekapKesesuaian(masukan({ sel: [sel("A", 80), sel("A", 20, { arah: "ketat" }), sel("B", 79), sel("B", 21, { arah: "ketat" })] }));
    expect(h.semantik.find((b) => b.kode === "A")!.perhatian).toBe(false);
    expect(h.semantik.find((b) => b.kode === "B")!.perhatian).toBe(true);
  });

  it("KP-rekapKesesuaian-03: jenis kosong dikelompokkan sebagai 'Tanpa jenis'; jenis urut terbanyak", () => {
    const h = rekapKesesuaian(masukan({ sel: [sel("A", 2, { arah: "longgar", jenis: "" }), sel("A", 3, { arah: "longgar", jenis: "Salah tafsir isi" })] }));
    expect(h.semantik[0].jenis.map((j) => [j.jenis, j.jumlah, j.persen])).toEqual([
      ["Salah tafsir isi", 3, 60],
      ["Tanpa jenis", 2, 40],
    ]);
  });

  it("KP-rekapKesesuaian-04: terlaluYakin bila keyakinan tinggi cukup data dan dikoreksi >= ambang", () => {
    const h = rekapKesesuaian(masukan({ sel: [sel("A", 40), sel("A", 10, { arah: "longgar" }), sel("B", 49), sel("B", 1, { arah: "longgar" })] }));
    expect(h.semantik.find((b) => b.kode === "A")!.terlaluYakin).toBe(true);
    expect(h.semantik.find((b) => b.kode === "B")!.terlaluYakin).toBe(false);
  });

  it("KP-rekapKesesuaian-05: hasil berdeskripsi lama tidak ikut % berlaku, masuk bandingVersi; versi berlaku tercatat", () => {
    const butir = [{ id: "b1", kode: "A", deskripsi: "Baru", status: "Aktif", jenis: "semantik" as const }];
    const h = rekapKesesuaian(
      masukan({
        butir,
        sel: [sel("A", 6, { versi: 3, deskripsi: "Lama" }), sel("A", 4, { versi: 3, deskripsi: "Lama", arah: "longgar" }), sel("A", 9, { versi: 4, deskripsi: "Baru" }), sel("A", 1, { versi: 4, deskripsi: "Baru", arah: "ketat" })],
      }),
    );
    expect(h.semantik[0]).toMatchObject({ jumlah: 10, dikoreksi: 1, persen: 90, versi: [4], butirId: "b1" });
    expect(h.bandingVersi).toEqual([{ kode: "A", lama: { versi: 3, deskripsi: "Lama", jumlah: 10, persen: 60 }, baru: { versi: 4, deskripsi: "Baru", jumlah: 10, persen: 90 } }]);
    expect(h.trenButir.A[0].jumlah).toBe(20);
  });

  it("KP-rekapKesesuaian-06: kode tanpa info memakai deskripsi versi tertinggi; status dan butirId null", () => {
    const h = rekapKesesuaian(masukan({ sel: [sel("X", 1, { versi: 1, deskripsi: "v1" }), sel("X", 1, { versi: 2, deskripsi: "v2" })] }));
    expect(h.semantik[0]).toMatchObject({ deskripsi: "v2", status: null, butirId: null, jumlah: 1 });
  });

  it("KP-rekapKesesuaian-07: rincian dikelompokkan per butir, yang dikoreksi lebih dulu", () => {
    const c = (butirKode: string, dikoreksi: boolean) => ({
      butirKode,
      proposalId: `${butirKode}${dikoreksi}`,
      idProposal: "P",
      judulProposal: "J",
      rekomendasi: "Memenuhi",
      statusSistem: "Memenuhi",
      kutipan: null,
      keyakinan: 0.9,
      versi: 1,
      keputusanReviewer: "Memenuhi",
      dikoreksi,
      jenis: null,
      alasanKoreksi: null,
      tiruan: false,
    });
    const h = rekapKesesuaian(masukan({ contoh: [c("A", false), c("A", true), c("B", false)] }));
    expect(h.rincian.A.map((x) => x.dikoreksi)).toEqual([true, false]);
    expect(Object.keys(h.rincian)).toEqual(["A", "B"]);
  });
});

describe("ringkasGagalInstitusi: cabang (MS-09 J6)", () => {
  const pengajuan = [
    { institusi: "U1", proposal: 100 },
    { institusi: "U2", proposal: 19 },
    { institusi: "U3", proposal: 20 },
  ];
  it("KP-ringkasGagalInstitusi-01: menyala keseluruhan bila >= ambang gagal", () => {
    const b = ringkasGagalInstitusi("K", [{ butirKode: "K", institusi: "U1", proposal: 35 }], pengajuan, undefined);
    expect(b.persen).toBeCloseTo((35 / 139) * 100);
    expect([b.perhatian, b.sebab]).toEqual([true, "keseluruhan"]);
  });
  it("KP-ringkasGagalInstitusi-02: menyala terpusat; institusi di bawah minPengajuanInstitusi tidak menjadi tertinggi", () => {
    const b = ringkasGagalInstitusi(
      "K",
      [
        { butirKode: "K", institusi: "U2", proposal: 19 },
        { butirKode: "K", institusi: "U3", proposal: 8 },
      ],
      pengajuan,
      undefined,
    );
    expect(b.perInstitusi[0].institusi).toBe("U2");
    expect(b.tertinggi?.institusi).toBe("U3");
    expect([b.perhatian, b.sebab]).toEqual([true, "terpusat"]);
  });
  it("KP-ringkasGagalInstitusi-03: tidak menyala; tanpa gagal tertinggi null", () => {
    expect(ringkasGagalInstitusi("K", [{ butirKode: "K", institusi: "U1", proposal: 1 }], pengajuan, undefined)).toMatchObject({ perhatian: false, sebab: null });
    expect(ringkasGagalInstitusi("K", [], pengajuan, undefined).tertinggi).toBeNull();
  });
});

describe("pilahPerluPerhatian dan bandingkanVersi (MS-09 J7, J11)", () => {
  it("KP-pilahPerluPerhatian-01: urut paling jauh dari ambang lintas jenis, lalu butir yang ditandai walau tidak menyala", () => {
    const h = rekapKesesuaian(
      masukan({
        butir: [
          { id: "1", kode: "S1", deskripsi: "s1", status: "Aktif", jenis: "semantik" },
          { id: "2", kode: "S2", deskripsi: "s2", status: "Perlu ditinjau", jenis: "semantik" },
          { id: "3", kode: "D1", deskripsi: "d1", status: "Aktif", jenis: "deterministik" },
        ],
        sel: [sel("S1", 70, { deskripsi: "s1" }), sel("S1", 30, { deskripsi: "s1", arah: "longgar" }), sel("S2", 100, { deskripsi: "s2" })],
        gagal: [{ butirKode: "D1", institusi: "U", proposal: 60 }],
        pengajuan: [{ institusi: "U", proposal: 100 }],
      }),
    );
    // S1: 80 - 70 = 10 poin; D1: 60 - 25 = 35 poin -> D1 dulu; S2 tidak menyala tetapi ditandai -> terakhir
    expect(h.perluPerhatian.map((i) => i.baris.kode)).toEqual(["D1", "S1", "S2"]);
    expect(h.ringkas.perluPerhatian).toBe(2);
  });
  it("KP-pilahPerluPerhatian-02: tanpa butir menyala atau ditandai -> kosong", () => {
    expect(pilahPerluPerhatian([], [])).toEqual([]);
  });
  it("KP-bandingkanVersi-01: tanpa hasil lama atau tanpa hasil baru -> null; lama = kelompok berversi tertinggi", () => {
    const baru = rekapKesesuaian(masukan({ sel: [sel("A", 10)] })).semantik[0];
    expect(bandingkanVersi("A", [], baru, 2)).toBeNull();
    expect(bandingkanVersi("A", [sel("A", 5, { versi: 1, deskripsi: "v1" }), sel("A", 4, { versi: 2, deskripsi: "v2" }), sel("A", 1, { versi: 2, deskripsi: "v2", arah: "ketat" })], baru, 3)?.lama).toEqual({
      versi: 2,
      deskripsi: "v2",
      jumlah: 5,
      persen: 80,
    });
  });
});

describe("pilahButirDitandai: cabang (C-30)", () => {
  const butir = [
    { id: "1", kode: "A", status: "Aktif" as const },
    { id: "2", kode: "B", status: "Draf" as const },
    { id: "3", kode: "C", status: "Perlu ditinjau" as const },
  ];

  it("KP-pilahButirDitandai-01: butir Aktif menjadi target", () => {
    const h = pilahButirDitandai(butir, ["A"]);
    expect(h.target.map((b) => b.kode)).toEqual(["A"]);
    expect(h.dilewati).toEqual([]);
  });

  it("KP-pilahButirDitandai-02: butir bukan Aktif dilewati beserta alasan statusnya", () => {
    const h = pilahButirDitandai(butir, ["B", "C"]);
    expect(h.target).toEqual([]);
    expect(h.dilewati.map((d) => d.kode)).toEqual(["B", "C"]);
    expect(h.dilewati[0].alasan).toContain("Draf");
  });

  it("KP-pilahButirDitandai-03: kode yang tidak ada pada basis aturan dilewati", () => {
    const h = pilahButirDitandai(butir, ["Z"]);
    expect(h.dilewati).toEqual([{ kode: "Z", alasan: "Butir tidak ada pada basis aturan berlaku." }]);
  });

  it("KP-pilahButirDitandai-04: kode ganda dihitung sekali; pilihan kosong tidak menghasilkan apa-apa", () => {
    expect(pilahButirDitandai(butir, ["A", "A", "A"]).target).toHaveLength(1);
    expect(pilahButirDitandai(butir, [])).toEqual({ target: [], dilewati: [] });
  });
});
