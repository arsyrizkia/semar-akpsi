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

/** Jenis syarat yang dilanggar (pengelompokan pratinjau pindah banyak) beserta teks persis S-2.3. */
export type KodeSyarat = "bersedia" | "institusi" | "beban" | "sama" | "tidak-ada";
export interface SyaratDilanggar {
  kode: KodeSyarat;
  teks: string;
}

/** S-2.2 terinci: syarat yang dilanggar beserta jenisnya; kosong berarti pemindahan boleh. */
export function periksaSyaratRinci(m: MasukanSyarat): SyaratDilanggar[] {
  const dilanggar: SyaratDilanggar[] = [];
  if (!m.reviewer.bersedia) dilanggar.push({ kode: "bersedia", teks: "Reviewer pengganti tidak bersedia menilai pada periode ini." });
  if (samaInstitusi(m.reviewer.institusi, m.institusiPengusul)) {
    dilanggar.push({ kode: "institusi", teks: `Institusi reviewer pengganti (${m.reviewer.institusi}) sama dengan institusi pengusul.` });
  }
  if (m.bebanSaatIni + 1 > m.batas) {
    dilanggar.push({ kode: "beban", teks: `Beban reviewer pengganti akan melampaui batas (${m.bebanSaatIni + 1} dari batas ${m.batas} proposal).` });
  }
  return dilanggar;
}

/** S-2.2: daftar syarat yang dilanggar; kosong berarti pemindahan boleh. */
export function periksaSyarat(m: MasukanSyarat): string[] {
  return periksaSyaratRinci(m).map((x) => x.teks);
}

/* ------------------------------ kelayakan pasti (aliran maksimum) ------------------------------ */

/** Graf aliran kecil (Dinic). Simpul: sumber, institusi pengusul, reviewer, muara; panjang jalur selalu 3. */
class GrafAliran {
  private readonly kepala: number[];
  private readonly ke: number[] = [];
  readonly kap: number[] = [];
  private readonly lanjut: number[] = [];
  private level: number[] = [];
  private iter: number[] = [];

  constructor(private readonly n: number) {
    this.kepala = new Array<number>(n).fill(-1);
  }

  /** Menambah sisi u -> v berkapasitas c; mengembalikan indeks sisi maju (sisi balik = indeks ^ 1). */
  tambah(u: number, v: number, c: number): number {
    this.ke.push(v, u);
    this.kap.push(c, 0);
    this.lanjut.push(this.kepala[u], this.kepala[v]);
    const i = this.ke.length - 2;
    this.kepala[u] = i;
    this.kepala[v] = i + 1;
    return i;
  }

  private bfs(s: number, t: number): boolean {
    this.level = new Array<number>(this.n).fill(-1);
    this.level[s] = 0;
    const antre = [s];
    for (let k = 0; k < antre.length; k++) {
      const u = antre[k];
      for (let e = this.kepala[u]; e !== -1; e = this.lanjut[e]) {
        if (this.kap[e] > 0 && this.level[this.ke[e]] < 0) {
          this.level[this.ke[e]] = this.level[u] + 1;
          antre.push(this.ke[e]);
        }
      }
    }
    return this.level[t] >= 0;
  }

  private dfs(u: number, t: number, f: number): number {
    if (u === t) return f;
    for (; this.iter[u] !== -1; this.iter[u] = this.lanjut[this.iter[u]]) {
      const e = this.iter[u];
      const v = this.ke[e];
      if (this.kap[e] > 0 && this.level[v] === this.level[u] + 1) {
        const d = this.dfs(v, t, Math.min(f, this.kap[e]));
        if (d > 0) {
          this.kap[e] -= d;
          this.kap[e ^ 1] += d;
          return d;
        }
      }
    }
    return 0;
  }

  maks(s: number, t: number): number {
    let total = 0;
    while (this.bfs(s, t)) {
      this.iter = [...this.kepala];
      for (let f = this.dfs(s, t, Infinity); f > 0; f = this.dfs(s, t, Infinity)) total += f;
    }
    return total;
  }

  /** Simpul yang terjangkau dari s di graf sisa: sisi sumber potongan minimum. */
  terjangkau(s: number): boolean[] {
    const ya = new Array<boolean>(this.n).fill(false);
    ya[s] = true;
    const antre = [s];
    for (let k = 0; k < antre.length; k++) {
      for (let e = this.kepala[antre[k]]; e !== -1; e = this.lanjut[e]) {
        if (this.kap[e] > 0 && !ya[this.ke[e]]) {
          ya[this.ke[e]] = true;
          antre.push(this.ke[e]);
        }
      }
    }
    return ya;
  }
}

export interface HambatanInstitusi {
  institusi: string;
  jumlahProposal: number;
  /** reviewer bersedia dari institusi lain (yang boleh menilai proposal institusi ini) */
  reviewerLayak: number;
}

export interface HasilKelayakan {
  layak: boolean;
  jumlahProposal: number;
  /** proposal yang dapat ditampung sekaligus pada batas ini (aliran maksimum) */
  tertampung: number;
  kekurangan: number;
  /** jumlah sisa kapasitas semua reviewer: sum(max(0, batas - bebanAwal)) */
  kapasitas: number;
  /**
   * Institusi pengusul penghambat (sisi sumber potongan minimum): proposalnya melebihi kapasitas reviewer yang boleh menilainya.
   * Kosong bila hambatannya kapasitas total (semua institusi ikut terhambat), urut jumlah proposal terbesar.
   */
  hambatan: HambatanInstitusi[];
  /** aliran per institusi (dinormalisasi) ke reviewer: bahan penempatan cadangan */
  alokasi: Map<string, Map<string, number>>;
}

/**
 * cekKelayakan (MS-04a): apakah semua proposal dapat ditugaskan pada batas beban ini, dihitung pasti dengan aliran maksimum
 * sumber -> institusi pengusul (jumlah proposal) -> reviewer dari institusi lain -> muara (sisa kapasitas). Monoton terhadap batas,
 * jadi dipakai untuk keputusan S-1 dan pencarian batas terkecil. Simpul hanya institusi + reviewer (puluhan sampai ratusan).
 */
export function cekKelayakan(proposal: ProposalPenugasan[], reviewer: KandidatReviewer[], bebanAwal: Record<string, number>, batas: number): HasilKelayakan {
  const perInstitusi = new Map<string, { nama: string; jumlah: number }>();
  for (const p of proposal) {
    const k = normalisasi(p.institusiPengusul);
    const x = perInstitusi.get(k);
    if (x) x.jumlah++;
    else perInstitusi.set(k, { nama: p.institusiPengusul, jumlah: 1 });
  }
  const institusi = [...perInstitusi.entries()];
  const I = institusi.length;
  const R = reviewer.length;
  const s = 0;
  const t = I + R + 1;
  const g = new GrafAliran(I + R + 2);
  const sisa = reviewer.map((r) => Math.max(0, batas - (bebanAwal[r.id] ?? 0)));
  const sisiPasang: { i: number; r: number; e: number }[] = [];
  institusi.forEach(([k, x], i) => {
    g.tambah(s, 1 + i, x.jumlah);
    reviewer.forEach((r, j) => {
      if (normalisasi(r.institusi) !== k && sisa[j] > 0) sisiPasang.push({ i, r: j, e: g.tambah(1 + i, 1 + I + j, x.jumlah) });
    });
  });
  reviewer.forEach((_, j) => g.tambah(1 + I + j, t, sisa[j]));
  const tertampung = g.maks(s, t);

  const alokasi = new Map<string, Map<string, number>>();
  for (const { i, r, e } of sisiPasang) {
    const f = g.kap[e ^ 1];
    if (f <= 0) continue;
    const k = institusi[i][0];
    let m = alokasi.get(k);
    if (!m) alokasi.set(k, (m = new Map()));
    m.set(reviewer[r].id, f);
  }

  const jumlahProposal = proposal.length;
  const layak = tertampung === jumlahProposal;
  let hambatan: HambatanInstitusi[] = [];
  if (!layak) {
    const ya = g.terjangkau(s);
    const terhambat = institusi.filter((_, i) => ya[1 + i]);
    if (terhambat.length < I) {
      hambatan = terhambat
        .map(([k, x]) => ({ institusi: x.nama, jumlahProposal: x.jumlah, reviewerLayak: reviewer.filter((r) => normalisasi(r.institusi) !== k).length }))
        .sort((a, b) => b.jumlahProposal - a.jumlahProposal);
    }
  }
  return { layak, jumlahProposal, tertampung, kekurangan: jumlahProposal - tertampung, kapasitas: sisa.reduce((a, b) => a + b, 0), hambatan, alokasi };
}

/**
 * batasTerkecilCukup (MS-04b): batas beban terkecil yang membuat semua proposal dapat ditugaskan, lewat pencarian biner atas
 * cekKelayakan mulai dari ceil(proposal / reviewer). null bila berapa pun batasnya tetap tidak cukup (mis. semua
 * reviewer dari institusi yang sama dengan sebagian pengusul) atau tidak ada reviewer.
 */
export function batasTerkecilCukup(proposal: ProposalPenugasan[], reviewer: KandidatReviewer[], bebanAwal: Record<string, number>): number | null {
  if (proposal.length === 0) return 1;
  if (reviewer.length === 0) return null;
  const bebanMaks = Math.max(0, ...reviewer.map((r) => bebanAwal[r.id] ?? 0));
  let atas = proposal.length + bebanMaks;
  if (!cekKelayakan(proposal, reviewer, bebanAwal, atas).layak) return null;
  // batas bawah sah: kapasitas sum(max(0, b - beban awal)) <= R x b, jadi b >= ceil(N / R) (beban awal tak merata tidak boleh menaikkannya)
  let bawah = Math.max(1, Math.ceil(proposal.length / reviewer.length));
  while (bawah < atas) {
    const tengah = Math.floor((bawah + atas) / 2);
    if (cekKelayakan(proposal, reviewer, bebanAwal, tengah).layak) atas = tengah;
    else bawah = tengah + 1;
  }
  return bawah;
}

export interface HasilSusunUsulan {
  penugasan: { proposalId: string; reviewerId: string }[];
  /** 0 bila semua tertampung; > 0 berarti S-1 (usulan tidak disusun) */
  kekurangan: number;
  kelayakan: HasilKelayakan;
  /** batas beban terkecil yang cukup (saran S-1); null bila tidak ada batas yang cukup */
  batasCukup: number | null;
  beban: Record<string, number>;
}

/**
 * susunUsulan (MS-04): keputusan S-1 memakai cekKelayakan (pasti), penempatan memakai susunUsulanMurni (beban terendah, rata).
 * Bila greedy dan jalur penambahnya tidak menampung semua padahal aliran menyatakan layak, penempatan diambil dari aliran pada
 * batas terkecil yang cukup (beban serata mungkin) sehingga S-1 palsu tidak terjadi.
 */
export function susunUsulan(proposal: ProposalPenugasan[], reviewer: KandidatReviewer[], bebanAwal: Record<string, number>, batas: number): HasilSusunUsulan {
  const kelayakan = cekKelayakan(proposal, reviewer, bebanAwal, batas);
  if (!kelayakan.layak) {
    const beban = Object.fromEntries(reviewer.map((r) => [r.id, bebanAwal[r.id] ?? 0]));
    return { penugasan: [], kekurangan: kelayakan.kekurangan, kelayakan, batasCukup: batasTerkecilCukup(proposal, reviewer, bebanAwal), beban };
  }
  const greedy = susunUsulanMurni(proposal, reviewer, bebanAwal, batas);
  if (greedy.belumDitugaskan.length === 0) return { penugasan: greedy.penugasan, kekurangan: 0, kelayakan, batasCukup: null, beban: greedy.beban };

  const cukup = batasTerkecilCukup(proposal, reviewer, bebanAwal) ?? batas;
  const rapat = cekKelayakan(proposal, reviewer, bebanAwal, Math.min(cukup, batas));
  const beban: Record<string, number> = Object.fromEntries(reviewer.map((r) => [r.id, bebanAwal[r.id] ?? 0]));
  const penugasan: { proposalId: string; reviewerId: string }[] = [];
  const perInstitusi = new Map<string, ProposalPenugasan[]>();
  for (const p of [...proposal].sort((a, b) => a.id.localeCompare(b.id))) {
    const k = normalisasi(p.institusiPengusul);
    perInstitusi.set(k, [...(perInstitusi.get(k) ?? []), p]);
  }
  for (const [k, daftar] of perInstitusi) {
    let i = 0;
    for (const [rid, n] of rapat.alokasi.get(k) ?? []) {
      for (let c = 0; c < n && i < daftar.length; c++, i++) {
        penugasan.push({ proposalId: daftar[i].id, reviewerId: rid });
        beban[rid]++;
      }
    }
  }
  return { penugasan, kekurangan: 0, kelayakan, batasCukup: null, beban };
}

/* ------------------------------ pindah banyak (S-2) ------------------------------ */

export interface BarisPindah {
  penugasanId: string;
  institusiPengusul: string;
  reviewerId: string;
}

export interface KandidatPindah extends KandidatReviewer {
  bersedia: boolean;
}

export type TujuanPindah = { jenis: "reviewer"; reviewerId: string } | { jenis: "otomatis" };

export interface RencanaPindah {
  diterima: { penugasanId: string; dari: string; ke: string }[];
  ditolak: { penugasanId: string; alasan: SyaratDilanggar[] }[];
}

/**
 * rencanakanPindah (MS-05a, S-2 untuk satu atau banyak baris): untuk setiap baris periksa ulang syarat institusi, kesediaan, dan
 * beban terhadap reviewer tujuan (pilihan Tim) atau, bila "otomatis", pilih reviewer lain yang memenuhi syarat dengan beban terendah
 * (aturan pilihReviewer). Beban diperbarui baris demi baris sehingga batas tidak terlampaui oleh pemindahan sekaligus. Murni: dipakai
 * pratinjau (tanpa menyimpan) dan penyimpanan di server.
 */
export function rencanakanPindah(baris: BarisPindah[], tujuan: TujuanPindah, kandidat: KandidatPindah[], bebanSaatIni: Record<string, number>, batas: number): RencanaPindah {
  const beban: Record<string, number> = { ...bebanSaatIni };
  const per = new Map(kandidat.map((k) => [k.id, k]));
  const urutNama = [...kandidat].sort((a, b) => a.nama.localeCompare(b.nama));
  const hasil: RencanaPindah = { diterima: [], ditolak: [] };
  const terima = (b: BarisPindah, ke: string) => {
    hasil.diterima.push({ penugasanId: b.penugasanId, dari: b.reviewerId, ke });
    beban[ke] = (beban[ke] ?? 0) + 1;
    beban[b.reviewerId] = Math.max(0, (beban[b.reviewerId] ?? 0) - 1);
  };

  for (const b of baris) {
    if (tujuan.jenis === "reviewer") {
      const r = per.get(tujuan.reviewerId);
      if (!r) {
        hasil.ditolak.push({ penugasanId: b.penugasanId, alasan: [{ kode: "tidak-ada", teks: "Reviewer pengganti tidak ditemukan." }] });
        continue;
      }
      if (r.id === b.reviewerId) {
        hasil.ditolak.push({ penugasanId: b.penugasanId, alasan: [{ kode: "sama", teks: `Proposal ini sudah ditangani ${r.nama}.` }] });
        continue;
      }
      const alasan = periksaSyaratRinci({ institusiPengusul: b.institusiPengusul, reviewer: r, bebanSaatIni: beban[r.id] ?? 0, batas });
      if (alasan.length) hasil.ditolak.push({ penugasanId: b.penugasanId, alasan });
      else terima(b, r.id);
      continue;
    }
    let terbaik: KandidatPindah | undefined;
    for (const r of urutNama) {
      if (r.id === b.reviewerId || !r.bersedia || samaInstitusi(r.institusi, b.institusiPengusul) || (beban[r.id] ?? 0) >= batas) continue;
      if (!terbaik || (beban[r.id] ?? 0) < (beban[terbaik.id] ?? 0)) terbaik = r;
    }
    if (terbaik) terima(b, terbaik.id);
    else hasil.ditolak.push({ penugasanId: b.penugasanId, alasan: [{ kode: "tidak-ada", teks: "Tidak ada reviewer lain yang memenuhi syarat dan masih di bawah batas beban." }] });
  }
  return hasil;
}

/** Pengelompokan alasan penolakan untuk pratinjau: jenis syarat, jumlah baris, dan satu contoh teks. */
export function kelompokkanPenolakan(ditolak: RencanaPindah["ditolak"]): { kode: KodeSyarat; jumlah: number; contoh: string }[] {
  const per = new Map<KodeSyarat, { jumlah: number; contoh: string }>();
  for (const d of ditolak) {
    for (const a of d.alasan) {
      const x = per.get(a.kode);
      if (x) x.jumlah++;
      else per.set(a.kode, { jumlah: 1, contoh: a.teks });
    }
  }
  return [...per.entries()].map(([kode, x]) => ({ kode, ...x })).sort((a, b) => b.jumlah - a.jumlah);
}
