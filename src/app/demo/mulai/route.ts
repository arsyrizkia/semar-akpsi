import { NextResponse, type NextRequest } from "next/server";
import { pastikanAkunDariBima } from "@/lib/auth";
import { COOKIE_BIMA, COOKIE_SEMAR, DURASI_SESI_DETIK, buatSesiBima, buatSesiSemar, opsiCookie } from "@/lib/sesi";
import { COOKIE_SKENARIO, cariJendela, cariSkenario, skenarioBawaan } from "@/lib/demo/katalog";
import { siapkanJalanPintas, siapkanSkenario, type HasilSkenario, type KodeJalanPintas } from "@/lib/demo/skenario";

export const dynamic = "force-dynamic";
/** Skenario uji beban membuat 10.000 proposal pada pemakaian pertama. */
export const maxDuration = 300;

const KODE = new Set<string>([
  "UC-01", "UC-02", "UC-03", "UC-04", "UC-05", "UC-06", "UC-07", "UC-08", "UC-09",
  "UC-05a", "UC-05b", "UC-05c", "UC-06-koma", "UC-07a", "UC-07b", "UC-07c", "UC-07c-awal", "UC-01-S1", "UC-09-S1", "UC-09-S2",
]);

/**
 * Pintu masuk navigator dan kartu /demo.
 *  - `?j=J-04&s=skala`: skenario keadaan jendela (navigator); tanpa `s` dipakai skenario bawaan jendela itu.
 *  - `?k=UC-03` (dan `&j08=1`): jalan pintas use case lama (kartu /demo).
 * Menyiapkan data, memasang sesi peran yang sesuai (SEMAR dan BIMA), mencatat skenario aktif di cookie `semar_skenario`
 * (dibaca navigator), lalu membuka jendela tujuan.
 */
export async function GET(req: NextRequest) {
  // GET ini mengubah data. Pratinjau tautan, prefetch, dan perayap tidak boleh memicunya: hanya navigasi peramban biasa yang diproses.
  const mode = req.headers.get("sec-fetch-mode");
  const tujuanFetch = req.headers.get("purpose") ?? req.headers.get("sec-purpose") ?? req.headers.get("next-router-prefetch");
  if ((mode && mode !== "navigate") || tujuanFetch || /bot|crawl|spider|preview|slurp|facebookexternalhit|whatsapp|telegram|slack/i.test(req.headers.get("user-agent") ?? "")) {
    return new NextResponse("Pergantian skenario hanya diproses lewat navigasi peramban dari Navigator demo atau halaman /demo.", {
      status: 405,
      headers: { "x-robots-tag": "noindex, nofollow", allow: "GET" },
    });
  }
  const kode = req.nextUrl.searchParams.get("k");
  const kodeJendela = req.nextUrl.searchParams.get("j");
  try {
    let hasil: HasilSkenario;
    let skenarioAktif: string | null = null;
    if (kodeJendela) {
      const jendela = cariJendela(kodeJendela);
      const id = req.nextUrl.searchParams.get("s") ?? skenarioBawaan(kodeJendela)?.id ?? "";
      if (!jendela || !cariSkenario(kodeJendela, id)) return NextResponse.redirect(new URL("/demo?galat=kode", req.url), 303);
      hasil = await siapkanSkenario(kodeJendela, id);
      skenarioAktif = `${kodeJendela}/${id}`;
    } else {
      if (!kode || !KODE.has(kode)) return NextResponse.redirect(new URL("/demo?galat=kode", req.url), 303);
      hasil = await siapkanJalanPintas(kode as KodeJalanPintas, { langsungJ08: req.nextUrl.searchParams.get("j08") === "1" });
    }
    // catatan skenario ditampilkan di panel navigator demo (lihat navigator-demo.tsx), bukan di badan halaman
    const tujuan = new URL(hasil.tujuan, req.url);
    tujuan.searchParams.set("catatan", hasil.catatan);
    const res = NextResponse.redirect(tujuan, 303);
    if (hasil.akun) {
      const akun = await pastikanAkunDariBima(hasil.akun);
      if (!akun) throw new Error(`akun ${hasil.akun} tidak ada`);
      res.cookies.set(COOKIE_SEMAR, await buatSesiSemar(akun.idBima), opsiCookie);
      res.cookies.set(COOKIE_BIMA, await buatSesiBima(akun.idBima), opsiCookie);
    } else {
      res.cookies.delete(COOKIE_SEMAR);
      res.cookies.delete(COOKIE_BIMA);
    }
    if (skenarioAktif) res.cookies.set(COOKIE_SKENARIO, skenarioAktif, { ...opsiCookie, httpOnly: false, maxAge: DURASI_SESI_DETIK });
    else res.cookies.delete(COOKIE_SKENARIO);
    return res;
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "gagal menyiapkan skenario";
    return NextResponse.redirect(new URL(`/demo?galat=${encodeURIComponent(pesan)}`, req.url), 303);
  }
}
