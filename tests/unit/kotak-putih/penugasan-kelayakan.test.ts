// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-04a cekKelayakan, MS-04b batasTerkecilCukup,
// MS-04c susunUsulan, MS-05a rencanakanPindah, MS-20 ringkasBeban (docs/kontrak-dan-spesifikasi-metode.md); setiap jalur [Jn].
import { describe, expect, it } from "vitest";
import { batasTerkecilCukup, cekKelayakan, rencanakanPindah, susunUsulan, type KandidatPindah, type KandidatReviewer, type ProposalPenugasan } from "@/lib/penugasan/aturan";
import { ringkasBeban } from "@/lib/penugasan/periode";

const rev = (id: string, institusi: string): KandidatReviewer => ({ id, nama: id, institusi });
const prop = (id: string, institusiPengusul: string): ProposalPenugasan => ({ id, institusiPengusul });
const banyak = (n: number, institusi: string, awal = "p") => Array.from({ length: n }, (_, i) => prop(`${awal}${institusi}${i}`, institusi));

describe("cekKelayakan (MS-04a)", () => {
  const reviewer = [rev("r1", "A"), rev("r2", "B"), rev("r3", "C")];

  it("KP-cekKelayakan-01 [J1-J4]: kapasitas tepat sama dengan jumlah proposal = layak", () => {
    const k = cekKelayakan(banyak(6, "Z"), reviewer, {}, 2);
    expect(k).toMatchObject({ layak: true, tertampung: 6, kekurangan: 0, kapasitas: 6, hambatan: [] });
  });

  it("KP-cekKelayakan-02 [J5, J7]: kapasitas total kurang satu = tidak layak, hambatan kosong (kapasitas total)", () => {
    const k = cekKelayakan(banyak(7, "Z"), reviewer, {}, 2);
    expect(k).toMatchObject({ layak: false, tertampung: 6, kekurangan: 1, hambatan: [] });
  });

  it("KP-cekKelayakan-03 [J2, J6]: institusi yang hanya boleh dinilai sedikit reviewer menjadi hambatan", () => {
    // reviewer: dua dari A, satu dari B; proposal A hanya boleh ke r3 (B)
    const k = cekKelayakan([...banyak(3, "A"), ...banyak(1, "C")], [rev("r1", "A"), rev("r2", "A"), rev("r3", "B")], {}, 2);
    expect(k.layak).toBe(false);
    expect(k.kekurangan).toBe(1);
    expect(k.hambatan).toEqual([{ institusi: "A", jumlahProposal: 3, reviewerLayak: 1 }]);
  });

  it("KP-cekKelayakan-04 [J3]: beban awal mengurangi sisa kapasitas; beban di atas batas tidak membuat kapasitas negatif", () => {
    const k = cekKelayakan(banyak(2, "Z"), reviewer, { r1: 5, r2: 1 }, 2);
    expect(k.kapasitas).toBe(0 + 1 + 2);
    expect(k.layak).toBe(true);
  });

  it("KP-cekKelayakan-05 [J1]: institusi dinormalisasi (huruf besar-kecil, spasi tepi)", () => {
    const k = cekKelayakan([prop("p1", "  universitas a ")], [rev("r1", "Universitas A")], {}, 5);
    expect(k.layak).toBe(false);
  });

  it("KP-cekKelayakan-06: alokasi tidak pernah memasangkan institusi yang sama", () => {
    const k = cekKelayakan([...banyak(4, "A"), ...banyak(4, "B")], [rev("r1", "A"), rev("r2", "B"), rev("r3", "C")], {}, 4);
    expect(k.layak).toBe(true);
    expect(k.alokasi.get("a")?.has("r1")).toBeFalsy();
    expect(k.alokasi.get("b")?.has("r2")).toBeFalsy();
  });
});

describe("batasTerkecilCukup (MS-04b)", () => {
  it("KP-batasTerkecilCukup-01 [J1]: tanpa proposal = 1", () => {
    expect(batasTerkecilCukup([], [rev("r1", "A")], {})).toBe(1);
  });

  it("KP-batasTerkecilCukup-02 [J2]: tanpa reviewer = null", () => {
    expect(batasTerkecilCukup(banyak(3, "Z"), [], {})).toBeNull();
  });

  it("KP-batasTerkecilCukup-03 [J3]: semua reviewer seinstitusi dengan pengusul = null (berapa pun batasnya)", () => {
    expect(batasTerkecilCukup(banyak(3, "A"), [rev("r1", "A"), rev("r2", "A")], {})).toBeNull();
  });

  it("KP-batasTerkecilCukup-04 [J4]: kapasitas rata: ceil(10/3) = 4", () => {
    expect(batasTerkecilCukup(banyak(10, "Z"), [rev("r1", "A"), rev("r2", "B"), rev("r3", "C")], {})).toBe(4);
  });

  it("KP-batasTerkecilCukup-05 [J4]: hambatan institusi menaikkan batas di atas ceil(N/R)", () => {
    // 6 proposal A hanya boleh ke r3 (B): batas minimal 6 walau ceil(7/3) = 3
    expect(batasTerkecilCukup([...banyak(6, "A"), prop("x", "B")], [rev("r1", "A"), rev("r2", "A"), rev("r3", "B")], {})).toBe(6);
  });

  it("KP-batasTerkecilCukup-07 [J4]: beban awal tak merata tidak menaikkan batas bawah", () => {
    // r1 sudah memegang 10, r2 kosong: 2 proposal cukup dengan batas 2 (keduanya ke r2)
    expect(batasTerkecilCukup(banyak(2, "Z"), [rev("r1", "A"), rev("r2", "B")], { r1: 10, r2: 0 })).toBe(2);
  });

  it("KP-batasTerkecilCukup-06: hasilnya memang batas terkecil (b layak, b - 1 tidak)", () => {
    const p = [...banyak(220, "A"), ...banyak(160, "B"), ...banyak(130, "C")];
    const r = Array.from({ length: 12 }, (_, i) => rev(`r${i}`, ["A", "B", "C", "D"][i % 4]));
    const b = batasTerkecilCukup(p, r, {})!;
    expect(cekKelayakan(p, r, {}, b).layak).toBe(true);
    expect(cekKelayakan(p, r, {}, b - 1).layak).toBe(false);
  });
});

describe("susunUsulan (MS-04c)", () => {
  it("KP-susunUsulan-01 [J1]: tidak layak: tanpa penugasan, kekurangan pasti, dan saran batas", () => {
    const h = susunUsulan(banyak(10, "Z"), [rev("r1", "A"), rev("r2", "B")], {}, 3);
    expect(h).toMatchObject({ penugasan: [], kekurangan: 4, batasCukup: 5 });
  });

  it("KP-susunUsulan-02 [J2]: layak: penugasan greedy, beban rata dalam batas", () => {
    const h = susunUsulan(banyak(9, "Z"), [rev("r1", "A"), rev("r2", "B"), rev("r3", "C")], {}, 5);
    expect(h.kekurangan).toBe(0);
    expect(h.penugasan).toHaveLength(9);
    expect(Object.values(h.beban)).toEqual([3, 3, 3]);
  });

  it("KP-susunUsulan-03: skala 1.200 proposal timpang: semua tertampung, institusi berbeda, beban maks-min ≤ 1", () => {
    const bobot = [220, 160, 130, 110, 100, 90, 80, 70, 60, 50, 40, 35, 25, 30];
    const p = bobot.flatMap((n, i) => banyak(n, `I${i}`));
    const r = Array.from({ length: 30 }, (_, j) => rev(`r${j}`, `I${j % 12}`));
    const h = susunUsulan(p, r, {}, 45);
    expect(h.penugasan).toHaveLength(1200);
    const inst = new Map(r.map((x) => [x.id, x.institusi]));
    const asal = new Map(p.map((x) => [x.id, x.institusiPengusul]));
    expect(h.penugasan.filter((x) => inst.get(x.reviewerId) === asal.get(x.proposalId))).toHaveLength(0);
    const v = Object.values(h.beban);
    expect(Math.max(...v) - Math.min(...v)).toBeLessThanOrEqual(1);
  });
});

describe("rencanakanPindah (MS-05a)", () => {
  const kandidat: KandidatPindah[] = [
    { id: "r1", nama: "Ana", institusi: "A", bersedia: true },
    { id: "r2", nama: "Budi", institusi: "B", bersedia: true },
    { id: "r3", nama: "Cici", institusi: "C", bersedia: true },
    { id: "r4", nama: "Dodi", institusi: "D", bersedia: false },
  ];
  const baris = (id: string, inst: string, dari: string) => ({ penugasanId: id, institusiPengusul: inst, reviewerId: dari });

  it("KP-rencanakanPindah-01 [J1]: reviewer tujuan tidak dikenal = ditolak tidak-ada", () => {
    const r = rencanakanPindah([baris("x", "Z", "r1")], { jenis: "reviewer", reviewerId: "r9" }, kandidat, {}, 5);
    expect(r.ditolak[0].alasan[0].kode).toBe("tidak-ada");
  });

  it("KP-rencanakanPindah-02 [J2]: tujuan sama dengan reviewer sekarang = ditolak sama", () => {
    const r = rencanakanPindah([baris("x", "Z", "r1")], { jenis: "reviewer", reviewerId: "r1" }, kandidat, {}, 5);
    expect(r.ditolak[0].alasan[0].kode).toBe("sama");
  });

  it("KP-rencanakanPindah-03 [J3]: institusi sama dan tidak bersedia ditolak dengan teks S-2.3", () => {
    const a = rencanakanPindah([baris("x", "B", "r1")], { jenis: "reviewer", reviewerId: "r2" }, kandidat, {}, 5);
    expect(a.ditolak[0].alasan.map((x) => x.kode)).toEqual(["institusi"]);
    expect(a.ditolak[0].alasan[0].teks).toBe("Institusi reviewer pengganti (B) sama dengan institusi pengusul.");
    const b = rencanakanPindah([baris("x", "Z", "r1")], { jenis: "reviewer", reviewerId: "r4" }, kandidat, {}, 5);
    expect(b.ditolak[0].alasan.map((x) => x.kode)).toEqual(["bersedia"]);
  });

  it("KP-rencanakanPindah-04 [J3, J4]: beban diperbarui baris demi baris; batas tidak terlampaui pindah sekaligus", () => {
    const r = rencanakanPindah([baris("x1", "Z", "r1"), baris("x2", "Z", "r1"), baris("x3", "Z", "r1")], { jenis: "reviewer", reviewerId: "r2" }, kandidat, { r1: 3, r2: 3 }, 5);
    expect(r.diterima.map((d) => d.penugasanId)).toEqual(["x1", "x2"]);
    expect(r.ditolak.map((d) => d.alasan[0].kode)).toEqual(["beban"]);
  });

  it("KP-rencanakanPindah-05 [J5]: otomatis memilih reviewer memenuhi syarat dengan beban terendah, bukan reviewer asal", () => {
    const r = rencanakanPindah([baris("x1", "C", "r1"), baris("x2", "C", "r1")], { jenis: "otomatis" }, kandidat, { r1: 4, r2: 1, r3: 0 }, 5);
    // r3 seinstitusi dengan pengusul (C), r4 tidak bersedia: keduanya ke r2
    expect(r.diterima.map((d) => d.ke)).toEqual(["r2", "r2"]);
  });

  it("KP-rencanakanPindah-06 [J6]: otomatis tanpa reviewer tersisa di bawah batas = ditolak tidak-ada", () => {
    const r = rencanakanPindah([baris("x1", "Z", "r1")], { jenis: "otomatis" }, kandidat, { r1: 2, r2: 2, r3: 2 }, 2);
    expect(r.ditolak[0].alasan[0].kode).toBe("tidak-ada");
  });
});

describe("ringkasBeban (MS-20)", () => {
  it("KP-ringkasBeban-01 [J1]: daftar kosong", () => {
    expect(ringkasBeban([], 10)).toEqual({ jumlahReviewer: 0, min: 0, median: 0, maks: 0, melampaui: 0, kelompok: [] });
  });

  it("KP-ringkasBeban-02 [J2, J3]: median genap, kelompok mencakup batas, melampaui dihitung", () => {
    const r = ringkasBeban([40, 41, 42, 47], 45);
    expect(r).toMatchObject({ jumlahReviewer: 4, min: 40, median: 41.5, maks: 47, melampaui: 1 });
    expect(r.kelompok.at(-1)!.sampai).toBe(47);
    expect(r.kelompok.reduce((n, k) => n + k.jumlah, 0)).toBe(4);
  });

  it("KP-ringkasBeban-03 [J3]: median ganjil", () => {
    expect(ringkasBeban([3, 1, 2], 5).median).toBe(2);
  });
});
