// Uji kotak putih (Dennis dkk., 2015, hlm. 471-475). Sumber: Method Specification MS-04 susunPenugasan (Contract C-13); setiap cabang/jalur.
import { describe, expect, it } from "vitest";
import { susunUsulanMurni, type KandidatReviewer, type ProposalPenugasan } from "@/lib/penugasan/aturan";

const rev = (id: string, institusi: string): KandidatReviewer => ({ id, nama: id, institusi });
const prop = (id: string, institusiPengusul: string): ProposalPenugasan => ({ id, institusiPengusul });

describe("susunUsulanMurni (UC-03 langkah 4)", () => {
  const reviewer = [rev("r1", "A"), rev("r2", "B"), rev("r3", "C")];

  it("KP-susunUsulanMurni-01: tidak pernah memilih reviewer dari institusi pengusul", () => {
    const h = susunUsulanMurni([prop("p1", "A"), prop("p2", "B"), prop("p3", "C")], reviewer, {}, 5);
    expect(h.belumDitugaskan).toEqual([]);
    for (const x of h.penugasan) {
      const p = [prop("p1", "A"), prop("p2", "B"), prop("p3", "C")].find((q) => q.id === x.proposalId)!;
      const r = reviewer.find((q) => q.id === x.reviewerId)!;
      expect(r.institusi).not.toBe(p.institusiPengusul);
    }
  });

  it("KP-susunUsulanMurni-02: meratakan beban dan tidak melampaui batas", () => {
    const proposal = Array.from({ length: 6 }, (_, i) => prop(`p${i}`, "Z"));
    const h = susunUsulanMurni(proposal, reviewer, {}, 2);
    expect(h.belumDitugaskan).toEqual([]);
    expect(Object.values(h.beban)).toEqual([2, 2, 2]);
  });

  it("KP-susunUsulanMurni-03: memperhitungkan beban awal (penugasan yang sudah ditetapkan)", () => {
    const h = susunUsulanMurni([prop("p1", "Z")], reviewer, { r1: 3, r2: 3 }, 4);
    expect(h.penugasan).toEqual([{ proposalId: "p1", reviewerId: "r3" }]);
  });

  it("KP-susunUsulanMurni-04: S-1: melaporkan proposal yang belum dapat ditugaskan bila reviewer kurang", () => {
    const proposal = Array.from({ length: 7 }, (_, i) => prop(`p${i}`, "Z"));
    const h = susunUsulanMurni(proposal, reviewer, {}, 2);
    expect(h.belumDitugaskan).toHaveLength(1);
  });

  it("KP-susunUsulanMurni-05: S-1: proposal tanpa reviewer berinstitusi berbeda tidak dapat ditugaskan", () => {
    const h = susunUsulanMurni([prop("p1", "A")], [rev("r1", "A")], {}, 10);
    expect(h.belumDitugaskan).toEqual(["p1"]);
  });

  it("KP-susunUsulanMurni-06: menggeser proposal lain bila greedy buntu (jalur penambah)", () => {
    // p1 hanya boleh ke r2 (pengusul A, r1 institusi A); p2 bisa ke r1 atau r2. Batas 1.
    const h = susunUsulanMurni([prop("p2", "Z"), prop("p1", "A")], [rev("r1", "A"), rev("r2", "B")], {}, 1);
    expect(h.belumDitugaskan).toEqual([]);
    expect(h.penugasan.find((x) => x.proposalId === "p1")!.reviewerId).toBe("r2");
    expect(h.penugasan.find((x) => x.proposalId === "p2")!.reviewerId).toBe("r1");
  });

  it("KP-susunUsulanMurni-07: hasil deterministik untuk masukan yang sama", () => {
    const proposal = [prop("p1", "A"), prop("p2", "B"), prop("p3", "A"), prop("p4", "C")];
    expect(susunUsulanMurni(proposal, reviewer, {}, 3)).toEqual(susunUsulanMurni(proposal, reviewer, {}, 3));
  });
});

describe("susunUsulanMurni pada skala nyata (10.000 proposal)", () => {
  const institusi = Array.from({ length: 40 }, (_, i) => `Institusi ${i}`);
  const reviewer = Array.from({ length: 130 }, (_, i) => rev(`r${String(i).padStart(3, "0")}`, institusi[i % 40]));
  const proposal = Array.from({ length: 10_000 }, (_, i) => prop(`p${String(i).padStart(5, "0")}`, institusi[(i * 17 + (i % 3) * 5) % 40]));

  it("KP-susunUsulanMurniSkala-01: membagi seluruh proposal dengan beda institusi, beban rata, dan cepat (< 3 dtk)", () => {
    const mulai = Date.now();
    const h = susunUsulanMurni(proposal, reviewer, {}, 100);
    const lama = Date.now() - mulai;
    expect(lama).toBeLessThan(3000);
    expect(h.belumDitugaskan).toEqual([]);
    expect(h.penugasan).toHaveLength(10_000);
    const instRev = new Map(reviewer.map((r) => [r.id, r.institusi]));
    const instProp = new Map(proposal.map((p) => [p.id, p.institusiPengusul]));
    for (const x of h.penugasan) expect(instRev.get(x.reviewerId)).not.toBe(instProp.get(x.proposalId));
    const beban = Object.values(h.beban);
    expect(Math.max(...beban)).toBeLessThanOrEqual(100);
    expect(Math.max(...beban) - Math.min(...beban)).toBeLessThanOrEqual(3);
  });

  it("KP-susunUsulanMurniSkala-02: S-1 cepat bila batas diturunkan di bawah kapasitas (60 x 130 < 10.000)", () => {
    const mulai = Date.now();
    const h = susunUsulanMurni(proposal, reviewer, {}, 60);
    expect(Date.now() - mulai).toBeLessThan(5000);
    expect(h.belumDitugaskan.length).toBeGreaterThanOrEqual(10_000 - 60 * 130);
  });
});

describe("susunUsulanMurni: cabang tambahan (MS-04)", () => {
  it("KP-susunUsulanMurni-08: tanpa proposal tidak menghasilkan penugasan maupun kekurangan", () => {
    const h = susunUsulanMurni([], [rev("r1", "A")], {}, 3);
    expect(h).toEqual({ penugasan: [], belumDitugaskan: [], beban: { r1: 0 } });
  });

  it("KP-susunUsulanMurni-09: tanpa reviewer semua proposal belum ditugaskan", () => {
    const h = susunUsulanMurni([prop("p1", "A"), prop("p2", "B")], [], {}, 3);
    expect(h.penugasan).toEqual([]);
    expect(h.belumDitugaskan.sort()).toEqual(["p1", "p2"]);
  });

  it("KP-susunUsulanMurni-10: institusi dinormalisasi (huruf besar dan spasi tepi) saat memilih reviewer layak", () => {
    const h = susunUsulanMurni([prop("p1", "  universitas a ")], [rev("r1", "Universitas A"), rev("r2", "Universitas B")], {}, 3);
    expect(h.penugasan).toEqual([{ proposalId: "p1", reviewerId: "r2" }]);
  });

  it("KP-susunUsulanMurni-11: kapasitas sisa nol (semua reviewer penuh oleh beban awal) melewati jalur penambah", () => {
    const h = susunUsulanMurni([prop("p1", "Z")], [rev("r1", "A"), rev("r2", "B")], { r1: 2, r2: 2 }, 2);
    expect(h.penugasan).toEqual([]);
    expect(h.belumDitugaskan).toEqual(["p1"]);
  });

  it("KP-susunUsulanMurni-12: setelah 25 kegagalan jalur penambah beruntun sisa proposal langsung dilaporkan kekurangan", () => {
    // 30 proposal berinstitusi B hanya cocok dengan r1 (kapasitas 2); r2 (institusi B) masih longgar tetapi tidak layak.
    const proposal = Array.from({ length: 30 }, (_, i) => prop(`p${String(i).padStart(2, "0")}`, "B"));
    const h = susunUsulanMurni(proposal, [rev("r1", "A"), rev("r2", "B")], {}, 2);
    expect(h.penugasan).toHaveLength(2);
    expect(h.belumDitugaskan).toHaveLength(28);
    expect(h.beban.r1).toBe(2);
  });

  it("KP-susunUsulanMurni-13: beban akhir memuat beban awal reviewer yang tidak mendapat proposal baru", () => {
    const h = susunUsulanMurni([prop("p1", "A")], [rev("r1", "A"), rev("r2", "B"), rev("r3", "C")], { r1: 1, r3: 2 }, 5);
    expect(h.beban.r1).toBe(1);
    expect(h.beban.r2).toBe(1); // beban paling sedikit dan institusi beda: r2
    expect(h.beban.r3).toBe(2);
  });
});
