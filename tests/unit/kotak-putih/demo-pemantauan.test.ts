// Uji kotak putih pembangkit data tiruan UC-04 (src/lib/demo/pemantauan-skenario.ts): angka cerita setiap skenario J-05 benar-benar
// dihasilkan pembangkit (data proposal mengikuti profil contoh1200: 1.200 proposal, 14 institusi timpang, PT bila (n*7) % 12 < 5).
import { describe, expect, it } from "vitest";
import { PROFIL } from "@/lib/demo/profil-skala";
import {
  BOBOT_HARI,
  INSTITUSI_TERBESAR,
  SKENARIO_PEMANTAUAN,
  acakBerbiji,
  alasanKoreksi,
  bangkitkanPemantauan,
  hariKe,
  type ButirSim,
  type HasilBangkit,
  type IdSkenarioPemantauan,
  type ProposalSim,
} from "@/lib/demo/pemantauan-skenario";

const nn = (n: number) => String(n).padStart(2, "0");
const BUTIR: ButirSim = {
  PD: {
    semantik: Array.from({ length: 15 }, (_, i) => `UNS-${nn(i + 1)}`),
    deterministik: [
      ...Array.from({ length: 8 }, (_, i) => `BGN-${nn(i + 1)}`),
      "GBR-01", "KAT-01", "KTA-01", "KTA-02", "KTA-03", "KTA-04", "SCR-01", "SCR-02", "SIT-01", "SIT-02", "SIT-03", "TBL-01",
    ],
  },
  PT: { semantik: [], deterministik: [] },
};
BUTIR.PT = BUTIR.PD;

function proposalContoh(): ProposalSim[] {
  const hasil: ProposalSim[] = [];
  let n = 0;
  PROFIL.contoh1200.bobotInstitusi.forEach((jumlah, institusi) => {
    for (let k = 0; k < jumlah; k++) {
      n++;
      hasil.push({ idProposal: `C12-2026-${String(n).padStart(4, "0")}`, skema: (n * 7) % 12 < 5 ? "PT" : "PD", institusi });
    }
  });
  return hasil;
}
const PROPOSAL = proposalContoh();
const skemaDari = new Map(PROPOSAL.map((p) => [p.idProposal, p.skema]));
const institusiDari = new Map(PROPOSAL.map((p) => [p.idProposal, p.institusi]));
const cache = new Map<IdSkenarioPemantauan, HasilBangkit>();
const bangkit = (id: IdSkenarioPemantauan) => {
  if (!cache.has(id)) cache.set(id, bangkitkanPemantauan(SKENARIO_PEMANTAUAN[id], PROPOSAL, BUTIR));
  return cache.get(id)!;
};

/** % disetujui satu butir PD pada penilaian final (opsional: hanya versi lama/baru) */
function disetujui(h: HasilBangkit, kode: string, versi?: "lama" | "baru") {
  const final = new Set(h.final.filter((f) => skemaDari.get(f.idProposal) === "PD").map((f) => f.idProposal));
  const baris = h.semantik.filter((s) => s.kode === kode && final.has(s.idProposal) && (versi === undefined || s.baru === (versi === "baru")));
  const ids = new Set(baris.map((b) => b.idProposal));
  const koreksi = h.koreksi.filter((k) => k.kode === kode && ids.has(k.idProposal));
  return { n: baris.length, persen: 100 * (1 - koreksi.length / baris.length), koreksi };
}
function persenGagal(h: HasilBangkit, kode: string, institusi?: number) {
  const ikut = PROPOSAL.filter((p) => p.skema === "PD" && (institusi === undefined || p.institusi === institusi));
  const ids = new Set(ikut.map((p) => p.idProposal));
  const gagal = h.gagal.filter((g) => ids.has(g.idProposal) && g.butir.includes(kode)).length;
  return (100 * gagal) / ikut.length;
}

describe("data fixture contoh1200", () => {
  it("1.200 proposal, PT 500", () => {
    expect(PROPOSAL).toHaveLength(1200);
    expect(PROPOSAL.filter((p) => p.skema === "PT")).toHaveLength(500);
  });
});

describe("PRNG dan bantu", () => {
  it("acakBerbiji: biji sama memberi deret sama, biji beda memberi deret beda", () => {
    const a = acakBerbiji("x");
    const b = acakBerbiji("x");
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(acakBerbiji("y")()).not.toBe(acakBerbiji("x")());
  });
  it("hariKe: menyebar sesuai BOBOT_HARI dan dipotong di hari berjalan", () => {
    const n = 1000;
    const per = Array.from({ length: 7 }, (_, m) => Array.from({ length: n }, (_, i) => hariKe(i, n, 7)).filter((x) => x === m + 1).length);
    per.forEach((jumlah, m) => expect(Math.abs(jumlah - BOBOT_HARI[m] * n)).toBeLessThanOrEqual(1));
    expect(new Set(Array.from({ length: 24 }, (_, i) => hariKe(i, 24, 1)))).toEqual(new Set([1]));
    expect(Math.max(...Array.from({ length: 100 }, (_, i) => hariKe(i, 100, 5)))).toBe(5);
  });
  it("alasanKoreksi: alasan khas butir cerita, selain itu alasan umum sesuai arah", () => {
    expect(alasanKoreksi("UNS-09", "Bagian tidak ditemukan padahal ada", "ketat", 0)).toMatch(/Peta jalan/);
    expect(alasanKoreksi("UNS-01", "Kutipan salah tempat", "longgar", 0.99)).toMatch(/Kutipan|istilah|bagian/);
  });
});

describe("skenario J-05", () => {
  it("awal: 24 final PD di hari 1, setiap butir < 30 hasil", () => {
    const h = bangkit("awal");
    const pd = h.final.filter((f) => skemaDari.get(f.idProposal) === "PD");
    expect(pd).toHaveLength(24);
    expect(new Set(pd.map((f) => f.hari))).toEqual(new Set([1]));
    expect(disetujui(h, "UNS-10").n).toBe(24);
  });

  it("sehat: semua penugasan final sampai hari ke-7, semua butir semantik PD >= 90% disetujui", () => {
    const h = bangkit("sehat");
    expect(h.final).toHaveLength(1200);
    expect(Math.max(...h.final.map((f) => f.hari))).toBe(7);
    for (const kode of BUTIR.PD.semantik) expect(disetujui(h, kode).persen, kode).toBeGreaterThanOrEqual(90);
  });

  it("bermasalah: UNS-10 ±58% (longgar ±81%, kutipan salah tempat dominan), UNS-08 ±76%, lainnya >= 88%", () => {
    const h = bangkit("bermasalah");
    const u10 = disetujui(h, "UNS-10");
    expect(u10.n).toBe(560);
    expect(Math.max(...h.final.map((f) => f.hari))).toBe(5);
    expect(u10.persen).toBeGreaterThan(55);
    expect(u10.persen).toBeLessThan(61);
    const longgar = u10.koreksi.filter((k) => k.keputusan === "Tidak memenuhi").length / u10.koreksi.length;
    expect(longgar).toBeGreaterThan(0.74);
    expect(longgar).toBeLessThan(0.88);
    const kutipan = u10.koreksi.filter((k) => k.jenis === "Kutipan salah tempat").length / u10.koreksi.length;
    expect(kutipan).toBeGreaterThan(0.56);
    expect(kutipan).toBeLessThan(0.72);
    const u08 = disetujui(h, "UNS-08").persen;
    expect(u08).toBeGreaterThan(71);
    expect(u08).toBeLessThan(81);
    for (const kode of BUTIR.PD.semantik.filter((k) => k !== "UNS-10" && k !== "UNS-08")) expect(disetujui(h, kode).persen, kode).toBeGreaterThanOrEqual(88);
  });

  it("bermasalah: UNS-10 memburuk dari hari awal ke akhir, dan keyakinan tinggi tetap sering dikoreksi", () => {
    const h = bangkit("bermasalah");
    const hari = new Map(h.final.map((f) => [f.idProposal, f.hari]));
    const pd = h.semantik.filter((s) => s.kode === "UNS-10" && hari.has(s.idProposal) && skemaDari.get(s.idProposal) === "PD");
    const koreksi = new Set(h.koreksi.filter((k) => k.kode === "UNS-10").map((k) => k.idProposal));
    const laju = (f: (s: (typeof pd)[number]) => boolean) => {
      const b = pd.filter(f);
      return b.filter((s) => koreksi.has(s.idProposal)).length / b.length;
    };
    expect(laju((s) => hari.get(s.idProposal)! <= 2)).toBeLessThan(laju((s) => hari.get(s.idProposal)! >= 4));
    expect(laju((s) => s.keyakinan >= 0.8)).toBeGreaterThan(0.33);
  });

  it("sehat: keyakinan bermakna (rendah lebih sering dikoreksi daripada tinggi)", () => {
    const h = bangkit("sehat");
    const final = new Set(h.final.map((f) => f.idProposal));
    const koreksi = new Set(h.koreksi.map((k) => `${k.idProposal}:${k.kode}`));
    const laju = (f: (k: number) => boolean) => {
      const b = h.semantik.filter((s) => final.has(s.idProposal) && f(s.keyakinan));
      return b.filter((s) => koreksi.has(`${s.idProposal}:${s.kode}`)).length / b.length;
    };
    expect(laju((k) => k < 0.5)).toBeGreaterThan(2 * laju((k) => k >= 0.8));
  });

  it("terlalu-ketat: KTA-04 gagal ±28% pengajuan PD, > 40% (ambang terpusat) di institusi terbesar; UNS-09 ±70% dengan koreksi ketat", () => {
    const h = bangkit("terlalu-ketat");
    const semua = persenGagal(h, "KTA-04");
    expect(semua).toBeGreaterThan(24);
    expect(semua).toBeLessThan(32);
    const terbesar = persenGagal(h, "KTA-04", INSTITUSI_TERBESAR);
    expect(terbesar).toBeGreaterThan(41);
    expect(terbesar).toBeLessThan(52);
    const u09 = disetujui(h, "UNS-09");
    expect(u09.persen).toBeGreaterThan(65);
    expect(u09.persen).toBeLessThan(77);
    expect(u09.koreksi.filter((k) => k.keputusan === "Memenuhi").length / u09.koreksi.length).toBeGreaterThan(0.8);
    expect(institusiDari.size).toBe(1200);
  });

  it("sesudah-perbaikan: UNS-10 ±58% pada versi lama naik ke >= 88% pada versi baru; hanya PD yang diperiksa ulang", () => {
    const h = bangkit("sesudah-perbaikan");
    const lama = disetujui(h, "UNS-10", "lama");
    const baru = disetujui(h, "UNS-10", "baru");
    expect(lama.persen).toBeGreaterThan(53);
    expect(lama.persen).toBeLessThan(63);
    expect(baru.persen).toBeGreaterThanOrEqual(88);
    expect(lama.n + baru.n).toBe(700);
    expect(lama.n).toBeGreaterThanOrEqual(30);
    expect(baru.n).toBeGreaterThanOrEqual(30);
    const hari = new Map(h.final.map((f) => [f.idProposal, f.hari]));
    for (const s of h.semantik.filter((x) => x.baru)) {
      expect(skemaDari.get(s.idProposal)).toBe("PD");
      const m = hari.get(s.idProposal);
      if (m !== undefined) expect(m).toBeGreaterThanOrEqual(4);
    }
  });

  it("terlambat: hari ke-6, baru 60% penugasan final (penulis membuang lagi final reviewer yang belum mulai)", () => {
    const sk = SKENARIO_PEMANTAUAN.terlambat;
    const h = bangkit("terlambat");
    expect(sk.hariBerjalan).toBe(6);
    expect(sk.reviewerBelumMulai).toBe(5);
    expect(h.final).toHaveLength(720);
    expect(Math.max(...h.final.map((f) => f.hari))).toBe(6);
  });

  it("final: hari 1..hariBerjalan dan menit kerja 08.00-21.59 untuk setiap skenario", () => {
    for (const id of Object.keys(SKENARIO_PEMANTAUAN) as IdSkenarioPemantauan[]) {
      const h = bangkit(id);
      expect(h.final.every((f) => f.hari >= 1 && f.hari <= SKENARIO_PEMANTAUAN[id].hariBerjalan && f.menit >= 0 && f.menit < 14 * 60), id).toBe(true);
    }
  });

  it("gagal saat pengajuan: setiap butir gagal milik butir deterministik skema, dan koreksi hanya pada proposal final", () => {
    for (const id of Object.keys(SKENARIO_PEMANTAUAN) as IdSkenarioPemantauan[]) {
      const h = bangkit(id);
      const final = new Set(h.final.map((f) => f.idProposal));
      expect(h.koreksi.every((k) => final.has(k.idProposal)), id).toBe(true);
      expect(h.gagal.every((g) => g.butir.every((b) => BUTIR.PD.deterministik.includes(b))), id).toBe(true);
    }
  });
});
