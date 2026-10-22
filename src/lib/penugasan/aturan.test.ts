import { describe, expect, it } from "vitest";
import { periksaSyarat, susunUsulanMurni, type KandidatReviewer, type ProposalPenugasan } from "./aturan";

const rev = (id: string, institusi: string): KandidatReviewer => ({ id, nama: id, institusi });
const prop = (id: string, institusiPengusul: string): ProposalPenugasan => ({ id, institusiPengusul });

describe("susunUsulanMurni (UC-03 langkah 4)", () => {
  const reviewer = [rev("r1", "A"), rev("r2", "B"), rev("r3", "C")];

  it("tidak pernah memilih reviewer dari institusi pengusul", () => {
    const h = susunUsulanMurni([prop("p1", "A"), prop("p2", "B"), prop("p3", "C")], reviewer, {}, 5);
    expect(h.belumDitugaskan).toEqual([]);
    for (const x of h.penugasan) {
      const p = [prop("p1", "A"), prop("p2", "B"), prop("p3", "C")].find((q) => q.id === x.proposalId)!;
      const r = reviewer.find((q) => q.id === x.reviewerId)!;
      expect(r.institusi).not.toBe(p.institusiPengusul);
    }
  });

  it("meratakan beban dan tidak melampaui batas", () => {
    const proposal = Array.from({ length: 6 }, (_, i) => prop(`p${i}`, "Z"));
    const h = susunUsulanMurni(proposal, reviewer, {}, 2);
    expect(h.belumDitugaskan).toEqual([]);
    expect(Object.values(h.beban)).toEqual([2, 2, 2]);
  });

  it("memperhitungkan beban awal (penugasan yang sudah ditetapkan)", () => {
    const h = susunUsulanMurni([prop("p1", "Z")], reviewer, { r1: 3, r2: 3 }, 4);
    expect(h.penugasan).toEqual([{ proposalId: "p1", reviewerId: "r3" }]);
  });

  it("S-1: melaporkan proposal yang belum dapat ditugaskan bila reviewer kurang", () => {
    const proposal = Array.from({ length: 7 }, (_, i) => prop(`p${i}`, "Z"));
    const h = susunUsulanMurni(proposal, reviewer, {}, 2);
    expect(h.belumDitugaskan).toHaveLength(1);
  });

  it("S-1: proposal tanpa reviewer berinstitusi berbeda tidak dapat ditugaskan", () => {
    const h = susunUsulanMurni([prop("p1", "A")], [rev("r1", "A")], {}, 10);
    expect(h.belumDitugaskan).toEqual(["p1"]);
  });

  it("menggeser proposal lain bila greedy buntu (jalur penambah)", () => {
    // p1 hanya boleh ke r2 (pengusul A, r1 institusi A); p2 bisa ke r1 atau r2. Batas 1.
    const h = susunUsulanMurni([prop("p2", "Z"), prop("p1", "A")], [rev("r1", "A"), rev("r2", "B")], {}, 1);
    expect(h.belumDitugaskan).toEqual([]);
    expect(h.penugasan.find((x) => x.proposalId === "p1")!.reviewerId).toBe("r2");
    expect(h.penugasan.find((x) => x.proposalId === "p2")!.reviewerId).toBe("r1");
  });

  it("hasil deterministik untuk masukan yang sama", () => {
    const proposal = [prop("p1", "A"), prop("p2", "B"), prop("p3", "A"), prop("p4", "C")];
    expect(susunUsulanMurni(proposal, reviewer, {}, 3)).toEqual(susunUsulanMurni(proposal, reviewer, {}, 3));
  });
});

describe("susunUsulanMurni pada skala nyata (10.000 proposal)", () => {
  const institusi = Array.from({ length: 40 }, (_, i) => `Institusi ${i}`);
  const reviewer = Array.from({ length: 130 }, (_, i) => rev(`r${String(i).padStart(3, "0")}`, institusi[i % 40]));
  const proposal = Array.from({ length: 10_000 }, (_, i) => prop(`p${String(i).padStart(5, "0")}`, institusi[(i * 17 + (i % 3) * 5) % 40]));

  it("membagi seluruh proposal dengan beda institusi, beban rata, dan cepat (< 3 dtk)", () => {
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

  it("S-1 cepat bila batas diturunkan di bawah kapasitas (60 x 130 < 10.000)", () => {
    const mulai = Date.now();
    const h = susunUsulanMurni(proposal, reviewer, {}, 60);
    expect(Date.now() - mulai).toBeLessThan(5000);
    expect(h.belumDitugaskan.length).toBeGreaterThanOrEqual(10_000 - 60 * 130);
  });
});

describe("periksaSyarat (S-2.2)", () => {
  it("meloloskan reviewer beda institusi dengan beban di bawah batas", () => {
    expect(periksaSyarat({ institusiPengusul: "A", reviewer: { institusi: "B", bersedia: true }, bebanSaatIni: 2, batas: 3 })).toEqual([]);
  });

  it("menolak institusi sama", () => {
    const s = periksaSyarat({ institusiPengusul: "A", reviewer: { institusi: "a", bersedia: true }, bebanSaatIni: 0, batas: 3 });
    expect(s).toHaveLength(1);
    expect(s[0]).toMatch(/institusi/i);
  });

  it("menolak beban melampaui batas", () => {
    const s = periksaSyarat({ institusiPengusul: "A", reviewer: { institusi: "B", bersedia: true }, bebanSaatIni: 3, batas: 3 });
    expect(s[0]).toMatch(/beban/i);
  });

  it("melaporkan semua syarat yang dilanggar", () => {
    const s = periksaSyarat({ institusiPengusul: "A", reviewer: { institusi: "A", bersedia: false }, bebanSaatIni: 5, batas: 5 });
    expect(s).toHaveLength(3);
  });
});
