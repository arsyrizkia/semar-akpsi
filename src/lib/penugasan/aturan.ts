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

const normalisasi = (x: string) => x.trim().toLowerCase();
const samaInstitusi = (a: string, b: string) => normalisasi(a) === normalisasi(b);

/**
 * pilihReviewer (langkah 4): untuk setiap proposal pilih reviewer dari institusi berbeda dengan beban paling sedikit saat itu,
 * tanpa melampaui batas. Proposal dengan pilihan paling sedikit diproses lebih dulu. Bila ada yang tidak
 * kebagian, dicoba menggeser proposal lain (jalur penambah) sebelum dinyatakan kekurangan reviewer.
 *
 * Dirancang untuk skala 10.000 proposal x ratusan reviewer: daftar reviewer yang layak dihitung sekali per institusi pengusul
 * (bukan per proposal) dan jalur penambah dilewati bila kapasitas total memang kurang dari jumlah proposal (tidak mungkin berhasil).
 */
export function susunUsulanMurni(
  proposal: ProposalPenugasan[],
  reviewer: KandidatReviewer[],
  bebanAwal: Record<string, number>,
  batas: number,
): HasilSusunMurni {
  const beban: Record<string, number> = {};
  for (const r of reviewer) beban[r.id] = bebanAwal[r.id] ?? 0;

  // reviewer yang layak per institusi pengusul (dihitung sekali per institusi), sudah terurut nama untuk pemutus seri yang stabil
  const urutNama = [...reviewer].sort((a, b) => a.nama.localeCompare(b.nama));
  const institusiReviewer = new Map(reviewer.map((r) => [r.id, normalisasi(r.institusi)]));
  const cacheLayak = new Map<string, KandidatReviewer[]>();
  const layakInstitusi = (institusiPengusul: string): KandidatReviewer[] => {
    const kunci = normalisasi(institusiPengusul);
    let daftar = cacheLayak.get(kunci);
    if (!daftar) {
      daftar = urutNama.filter((r) => institusiReviewer.get(r.id) !== kunci);
      cacheLayak.set(kunci, daftar);
    }
    return daftar;
  };
  const layak = (p: ProposalPenugasan) => layakInstitusi(p.institusiPengusul);

  const urut = [...proposal].sort((a, b) => layak(a).length - layak(b).length || a.id.localeCompare(b.id));
  const penerima = new Map<string, string>(); // proposalId -> reviewerId
  const dipegangOleh = new Map<string, Set<string>>(); // reviewerId -> proposalId
  const belum: ProposalPenugasan[] = [];

  const tetapkanKe = (pid: string, rid: string) => {
    penerima.set(pid, rid);
    let himpunan = dipegangOleh.get(rid);
    if (!himpunan) dipegangOleh.set(rid, (himpunan = new Set()));
    himpunan.add(pid);
    beban[rid]++;
  };

  const pilih = (p: ProposalPenugasan) => {
    let terbaik: KandidatReviewer | undefined;
    for (const r of layak(p)) {
      if (beban[r.id] >= batas) continue;
      if (!terbaik || beban[r.id] < beban[terbaik.id]) terbaik = r; // urutan nama menjaga seri
    }
    return terbaik;
  };

  for (const p of urut) {
    const r = pilih(p);
    if (r) tetapkanKe(p.id, r.id);
    else belum.push(p);
  }

  /* jalur penambah: pindahkan proposal lain dari reviewer yang penuh ke reviewer lain yang masih longgar */
  const proposalPer = new Map(proposal.map((p) => [p.id, p]));
  function usahakan(p: ProposalPenugasan, dikunjungi: Set<string>): boolean {
    for (const r of layak(p)) {
      if (dikunjungi.has(r.id)) continue;
      dikunjungi.add(r.id);
      if (beban[r.id] < batas) {
        tetapkanKe(p.id, r.id);
        return true;
      }
      for (const pid of [...(dipegangOleh.get(r.id) ?? [])]) {
        const lain = proposalPer.get(pid)!;
        if (usahakan(lain, dikunjungi)) {
          // `lain` sudah pindah ke reviewer lain; lepaskan dari r lalu pasang p
          dipegangOleh.get(r.id)!.delete(pid);
          beban[r.id]--;
          tetapkanKe(p.id, r.id);
          return true;
        }
      }
    }
    return false;
  }

  // Kapasitas total tersisa < proposal yang belum kebagian: jalur penambah pasti gagal, jadi dilewati (kekurangan reviewer sungguhan).
  const kapasitasSisa = reviewer.reduce((jumlah, r) => jumlah + Math.max(0, batas - beban[r.id]), 0);
  const masihBelum: string[] = [];
  let gagalBeruntun = 0;
  for (const p of belum) {
    // pencarian jalur penambah yang gagal berulang di skala besar hanya membuang waktu: setelah 25 kegagalan beruntun sisanya dilaporkan kekurangan
    if (kapasitasSisa <= 0 || gagalBeruntun >= 25 || !usahakan(p, new Set())) {
      masihBelum.push(p.id);
      gagalBeruntun++;
    } else gagalBeruntun = 0;
  }

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
