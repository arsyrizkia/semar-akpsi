/**
 * Aturan murni penugasan reviewer (UC-03 langkah 4 dan S-2). Tanpa basis data supaya mudah diuji.
 * Syarat: reviewer bersedia, institusi berbeda dengan pengusul, beban tidak melampaui batas.
 */

export interface KandidatReviewer {
  id: string;
  nama: string;
  institusi: string;
}

export interface ProposalPenugasan {
  id: string;
  institusiPengusul: string;
}

export interface HasilSusunMurni {
  /** pasangan proposal -> reviewer */
  penugasan: { proposalId: string; reviewerId: string }[];
  /** proposal yang belum dapat ditugaskan pada batas beban ini (S-1) */
  belumDitugaskan: string[];
  /** beban akhir per reviewer (termasuk beban awal) */
  beban: Record<string, number>;
}

const samaInstitusi = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * pilihReviewer (langkah 4): untuk setiap proposal pilih reviewer dari institusi berbeda dengan beban paling sedikit saat itu,
 * tanpa melampaui batas. Proposal dengan pilihan paling sedikit diproses lebih dulu. Bila ada yang tidak
 * kebagian, dicoba menggeser proposal lain (jalur penambah) sebelum dinyatakan kekurangan reviewer.
 */
export function susunUsulanMurni(
  proposal: ProposalPenugasan[],
  reviewer: KandidatReviewer[],
  bebanAwal: Record<string, number>,
  batas: number,
): HasilSusunMurni {
  const beban: Record<string, number> = {};
  for (const r of reviewer) beban[r.id] = bebanAwal[r.id] ?? 0;

  const layak = (p: ProposalPenugasan) => reviewer.filter((r) => !samaInstitusi(r.institusi, p.institusiPengusul));
  const urut = [...proposal].sort((a, b) => layak(a).length - layak(b).length || a.id.localeCompare(b.id));
  const penerima = new Map<string, string>(); // proposalId -> reviewerId
  const belum: ProposalPenugasan[] = [];

  const pilih = (p: ProposalPenugasan) =>
    layak(p)
      .filter((r) => beban[r.id] < batas)
      .sort((a, b) => beban[a.id] - beban[b.id] || a.nama.localeCompare(b.nama))[0];

  for (const p of urut) {
    const r = pilih(p);
    if (r) {
      penerima.set(p.id, r.id);
      beban[r.id]++;
    } else belum.push(p);
  }

  /* jalur penambah: pindahkan proposal lain dari reviewer yang penuh ke reviewer lain yang masih longgar */
  const proposalPer = new Map(proposal.map((p) => [p.id, p]));
  function usahakan(p: ProposalPenugasan, dikunjungi: Set<string>): boolean {
    for (const r of layak(p)) {
      if (dikunjungi.has(r.id)) continue;
      dikunjungi.add(r.id);
      if (beban[r.id] < batas) {
        penerima.set(p.id, r.id);
        beban[r.id]++;
        return true;
      }
      const dipegang = [...penerima.entries()].filter(([, rid]) => rid === r.id).map(([pid]) => proposalPer.get(pid)!);
      for (const lain of dipegang) {
        if (usahakan(lain, dikunjungi)) {
          // `lain` sudah pindah (beban r berkurang lewat penugasan ulang di bawah)
          beban[r.id]--;
          penerima.set(p.id, r.id);
          beban[r.id]++;
          return true;
        }
      }
    }
    return false;
  }
  const masihBelum: string[] = [];
  for (const p of belum) if (!usahakan(p, new Set())) masihBelum.push(p.id);

  return {
    penugasan: proposal.filter((p) => penerima.has(p.id)).map((p) => ({ proposalId: p.id, reviewerId: penerima.get(p.id)! })),
    belumDitugaskan: masihBelum,
    beban,
  };
}

export interface MasukanSyarat {
  institusiPengusul: string;
  reviewer: { institusi: string; bersedia: boolean; nama?: string };
  /** beban reviewer pengganti SEBELUM pemindahan (tanpa penugasan yang sedang dipindahkan) */
  bebanSaatIni: number;
  batas: number;
}

/** S-2.2: daftar syarat yang dilanggar; kosong berarti pemindahan boleh. */
export function periksaSyarat(m: MasukanSyarat): string[] {
  const dilanggar: string[] = [];
  if (!m.reviewer.bersedia) dilanggar.push("Reviewer pengganti tidak bersedia menilai pada periode ini.");
  if (samaInstitusi(m.reviewer.institusi, m.institusiPengusul)) {
    dilanggar.push(`Institusi reviewer pengganti (${m.reviewer.institusi}) sama dengan institusi pengusul.`);
  }
  if (m.bebanSaatIni + 1 > m.batas) {
    dilanggar.push(`Beban reviewer pengganti akan melampaui batas (${m.bebanSaatIni + 1} dari batas ${m.batas} proposal).`);
  }
  return dilanggar;
}
