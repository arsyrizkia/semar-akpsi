import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { akun as tabelAkun, penugasanReviewer, periodeSeleksi, proposal, skemaPendanaan, templatProposal } from "@/db/schema";
import { ambilSesi, pastikanAkunDariBima, type SesiSemar } from "@/lib/auth";
import { COOKIE_BIMA, COOKIE_SEMAR, buatSesiBima, buatSesiSemar, opsiCookie } from "@/lib/sesi";
import { cariJendela, type JendelaDemo } from "@/lib/demo/katalog";
import { ambilPeriodeAktif, periodeSudahDibuka } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/** Apakah sesi yang ada sudah memadai untuk jendela ini (peran cocok, dan hak pengelola bila diperlukan). */
function sesiCocok(j: JendelaDemo, sesi: SesiSemar | null): boolean {
  if (j.peranSesi === "siapa-saja") return sesi !== null;
  if (!sesi || !j.peranSesi || j.peranSesi === "tanpa") return false;
  return sesi.akun.peran === j.peranSesi && (!j.hanyaPengelola || sesi.pengelola);
}

/**
 * "Pindah layar/peran" untuk Navigator demo dan Pusat Demo: hanya membuka layar dan memasang sesi peran bila sesi yang ada
 * belum cocok. TIDAK mengubah data (hanya membaca basis data untuk mencari id layar; menyalin akun BIMA ke tabel akun hanya bila belum ada).
 * Menyiapkan data adalah tugas /demo/mulai ("Pasang skenario").
 *   ?j=<kode jendela>  [&p=<idProposal>]
 */
export async function GET(req: NextRequest) {
  const kode = req.nextUrl.searchParams.get("j") ?? "";
  const rujukan = req.nextUrl.searchParams.get("p");
  const jendela = cariJendela(kode);
  if (!jendela) return NextResponse.redirect(new URL("/demo?galat=kode", req.url), 303);

  try {
    const db = getDb();
    const sesi = await ambilSesi();
    const pakaiSesi = sesiCocok(jendela, sesi);
    const idAkun = pakaiSesi && sesi ? sesi.akun.idBima : jendela.akunBawaan ?? null;
    const akunNyata = pakaiSesi && sesi ? sesi.akun : idAkun ? await akunDemo(idAkun) : null;

    let tujuan = jendela.alamatPindah;
    // id layar dicari dari data yang sudah ada; bila belum ada, jatuh ke layar induk
    if (jendela.kode === "J-02a") {
      const [d] = await db.select({ id: templatProposal.id }).from(templatProposal).where(eq(templatProposal.status, "Draf")).orderBy(desc(templatProposal.dibuatPada)).limit(1);
      if (d) tujuan = `/tim-kerja/templat/${d.id}`;
    } else if (jendela.kode === "J-03" || jendela.kode === "J-03b") {
      const [periode] = await db.select().from(periodeSeleksi).where(periodeSudahDibuka()).orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka)).limit(1);
      const [skema] = await db.select().from(skemaPendanaan).where(eq(skemaPendanaan.kode, "PD"));
      if (periode && skema) tujuan = `/tim-kerja/aturan${jendela.kode === "J-03b" ? "/uji" : ""}?skema=${skema.id}&periode=${periode.id}`;
    } else if (jendela.kode === "J-04b") {
      const periode = await ambilPeriodeAktif();
      if (periode) tujuan = `/tim-kerja/penugasan/${periode.id}`;
    } else if (jendela.kode === "J-05") {
      const [periode] = await db.select().from(periodeSeleksi).where(periodeSudahDibuka()).orderBy(desc(periodeSeleksi.tahun), desc(periodeSeleksi.tanggalBuka)).limit(1);
      const [skema] = await db.select().from(skemaPendanaan).where(eq(skemaPendanaan.kode, "PD"));
      if (periode && skema) tujuan = `/tim-kerja/pemantauan?skema=${skema.id}&periode=${periode.id}`;
    } else if (jendela.kode === "J-05b") {
      const [p] = rujukan
        ? await db.select({ id: proposal.idProposal }).from(proposal).where(eq(proposal.idProposal, rujukan)).limit(1)
        : await db.select({ id: proposal.idProposal }).from(proposal).where(inArray(proposal.status, ["Terkirim", "Ditahan"])).orderBy(desc(proposal.dibuatPada)).limit(1);
      if (p) tujuan = `/tim-kerja/proposal/${encodeURIComponent(p.id)}`;
    } else if (jendela.kode === "J-06" && akunNyata) {
      const [p] = await db.select({ id: proposal.idProposal }).from(proposal).where(eq(proposal.pengusulId, akunNyata.id)).orderBy(desc(proposal.dibuatPada)).limit(1);
      if (p) tujuan = `/pengusul/hasil/${encodeURIComponent(p.id)}`;
    } else if ((jendela.kode === "J-08" || jendela.kode === "J-08b") && akunNyata) {
      const [pn] = await db
        .select({ id: penugasanReviewer.id })
        .from(penugasanReviewer)
        .where(and(eq(penugasanReviewer.reviewerId, akunNyata.id), ne(penugasanReviewer.status, "Diusulkan")))
        .orderBy(desc(penugasanReviewer.tanggal))
        .limit(1);
      if (pn) tujuan = `/reviewer/pemeriksaan/${pn.id}${jendela.kode === "J-08b" ? "/keputusan" : ""}`;
    }

    const res = NextResponse.redirect(new URL(tujuan, req.url), 303);
    if (jendela.peranSesi === "tanpa") {
      res.cookies.delete(COOKIE_SEMAR);
      res.cookies.delete(COOKIE_BIMA);
    } else if (!pakaiSesi && idAkun) {
      res.cookies.set(COOKIE_SEMAR, await buatSesiSemar(idAkun), opsiCookie);
      res.cookies.set(COOKIE_BIMA, await buatSesiBima(idAkun), opsiCookie);
    }
    return res;
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "gagal berpindah layar";
    return NextResponse.redirect(new URL(`/demo?galat=${encodeURIComponent(pesan)}`, req.url), 303);
  }
}

/** Akun demo dari tabel akun; disalin dari BIMA hanya bila belum ada (tanpa menimpa apa pun). */
async function akunDemo(idBima: string) {
  const [ada] = await getDb().select().from(tabelAkun).where(eq(tabelAkun.idBima, idBima));
  return ada ?? (await pastikanAkunDariBima(idBima));
}
