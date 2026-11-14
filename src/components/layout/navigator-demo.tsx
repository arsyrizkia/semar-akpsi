"use client";

import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Compass, ChevronDown, Loader2 } from "lucide-react";
import { ambilMasaPengusulan, setSakelarMasa } from "@/app/demo/aksi";
import {
  COOKIE_SKENARIO,
  KATALOG_UC,
  alamatPindah,
  alamatSkenario,
  cariJendela,
  cariSkenario,
  cariUsecase,
  jendelaDariJalur,
  layarUsecase,
  usecaseDariJendela,
  type JendelaDemo,
} from "@/lib/demo/katalog";
import { cn } from "@/lib/utils";
import { alatPeragaanTampil, useAlatPeragaan } from "@/components/layout/alat-peragaan";

const KUNCI = "semar:navigator";
const PERISTIWA = "semar:navigator-ubah";

function langganan(cb: () => void) {
  window.addEventListener(PERISTIWA, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(PERISTIWA, cb);
    window.removeEventListener("storage", cb);
  };
}
/** Bawaan ciut: tidak menutupi tombol utama jendela. */
function bacaTerbuka() {
  try {
    return localStorage.getItem(KUNCI) === "buka";
  } catch {
    return false;
  }
}
function aturTerbuka(buka: boolean) {
  try {
    localStorage.setItem(KUNCI, buka ? "buka" : "ciut");
  } catch {
    /* penyimpanan tidak tersedia: keadaan hanya berlaku selama halaman ini */
  }
  window.dispatchEvent(new Event(PERISTIWA));
}
const tanpaLangganan = () => () => {};
function bacaCookieSkenario(): string | null {
  const baris = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_SKENARIO}=`));
  return baris ? decodeURIComponent(baris.slice(COOKIE_SKENARIO.length + 1)) : null;
}

/* Use case yang terakhir dipilih di navigator (sessionStorage): dipakai sebagai pilihan bawaan bila memuat layar yang sedang dibuka. */
const KUNCI_UC = "semar:navigator-uc";
const PERISTIWA_UC = "semar:navigator-uc-ubah";
function langgananUc(cb: () => void) {
  window.addEventListener(PERISTIWA_UC, cb);
  return () => window.removeEventListener(PERISTIWA_UC, cb);
}
function bacaUc(): string {
  try {
    return sessionStorage.getItem(KUNCI_UC) ?? "";
  } catch {
    return "";
  }
}
function simpanUc(kode: string) {
  try {
    sessionStorage.setItem(KUNCI_UC, kode);
  } catch {
    /* penyimpanan tidak tersedia: pilihan hanya berlaku selama halaman ini */
  }
  window.dispatchEvent(new Event(PERISTIWA_UC));
}

/* Catatan skenario (parameter ?catatan= dari /demo/mulai): disimpan per jalur di sessionStorage dan ditampilkan di panel navigator, bukan di badan halaman. */
const KUNCI_CATATAN = "semar:catatan-skenario";
const PERISTIWA_CATATAN = "semar:catatan-ubah";
function langgananCatatan(cb: () => void) {
  window.addEventListener(PERISTIWA_CATATAN, cb);
  return () => window.removeEventListener(PERISTIWA_CATATAN, cb);
}
function bacaCatatanMentah(): string {
  try {
    return sessionStorage.getItem(KUNCI_CATATAN) ?? "";
  } catch {
    return "";
  }
}
function useCatatanSkenario(jalur: string): string | null {
  const mentah = useSyncExternalStore(langgananCatatan, bacaCatatanMentah, () => "");
  if (!mentah) return null;
  try {
    const { jalur: j, teks } = JSON.parse(mentah) as { jalur: string; teks: string };
    return j === jalur ? teks : null;
  } catch {
    return null;
  }
}
/**
 * Kueri alamat saat ini (mis. "tab=aturan") agar tab Aturan Pemeriksaan di J-02a dikenali sebagai J-03. Dibaca oleh PembacaKueri di dalam
 * Suspense (useSearchParams) dan dibagikan lewat penyimpanan kecil ini, supaya NavigatorDemo sendiri tidak memerlukan Suspense.
 */
let kueriSaatIni = "";
const pendengarKueri = new Set<() => void>();
const langgananKueri = (cb: () => void) => {
  pendengarKueri.add(cb);
  return () => void pendengarKueri.delete(cb);
};
function PembacaKueri() {
  const kueri = useSearchParams().toString();
  useEffect(() => {
    if (kueri === kueriSaatIni) return;
    kueriSaatIni = kueri;
    pendengarKueri.forEach((f) => f());
  }, [kueri]);
  return null;
}

/** Menangkap ?catatan= lalu membersihkannya dari URL. Dipasang dalam Suspense karena memakai useSearchParams. */
function PenangkapCatatan() {
  const catatan = useSearchParams().get("catatan");
  const jalur = usePathname();
  useEffect(() => {
    if (!catatan) return;
    try {
      sessionStorage.setItem(KUNCI_CATATAN, JSON.stringify({ jalur, teks: catatan }));
    } catch {
      /* penyimpanan tidak tersedia: catatan tidak ditampilkan */
    }
    window.dispatchEvent(new Event(PERISTIWA_CATATAN));
    const u = new URL(window.location.href);
    u.searchParams.delete("catatan");
    window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
  }, [catatan, jalur]);
  return null;
}

/**
 * Navigator demo mengambang, dikelompokkan per use case (UC-01..UC-09, ditambah Umum). Use case dipilih dulu (bawaan: use case layar
 * yang sedang dibuka), lalu setiap layar use case itu tampil dengan dua hal yang dipisah tegas:
 *  - "Buka": tautan ke /demo/pindah; hanya membuka layar (dan memasang sesi peran bila perlu). Data TIDAK berubah.
 *  - keadaan (skenario): tombol ke /demo/mulai; menyiapkan data keadaan itu, lalu membuka layarnya. Data berubah.
 * Catatan skenario tampil di panel ini. Papan pintas: Alt+Shift+N membuka/menciutkan, Esc menciutkan. Seluruhnya tersembunyi sampai alat peragaan ditampilkan (Alt+Shift+D).
 */
export function NavigatorDemo() {
  const jalur = usePathname();
  const kueri = useSyncExternalStore(langgananKueri, () => kueriSaatIni, () => "");
  const router = useRouter();
  const peragaan = useAlatPeragaan();
  const terbukaTersimpan = useSyncExternalStore(langganan, bacaTerbuka, () => false);
  // alat peragaan tersembunyi (bawaan): panel dianggap ciut dan tidak ada yang dirender
  const terbuka = terbukaTersimpan && peragaan;
  const cookieSkenario = useSyncExternalStore(tanpaLangganan, bacaCookieSkenario, () => null);
  const [menyiapkan, setMenyiapkan] = useState<string | null>(null);
  const [masa, setMasa] = useState<"berjalan" | "ditutup" | null>(null);
  const [pesanMasa, setPesanMasa] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pilRef = useRef<HTMLButtonElement>(null);
  const sebelumnyaTerbuka = useRef(false);

  const catatanSkenario = useCatatanSkenario(jalur);
  const jendela = jendelaDariJalur(jalur, kueri);
  const ucTersimpan = useSyncExternalStore(langgananUc, bacaUc, () => "");
  // pilihan di panel ini selalu menang; selain itu yang terakhir dipilih (halaman sebelumnya) bila memuat layar ini, lalu use case
  // pertama yang memuat layar ini
  const [pilihanUc, setPilihanUc] = useState<string | null>(null);
  const ucSimpan = cariUsecase(ucTersimpan);
  const uc =
    cariUsecase(pilihanUc ?? "") ??
    (ucSimpan && (!jendela || ucSimpan.layar.some((l) => l.kode === jendela.kode)) ? ucSimpan : undefined) ??
    (jendela ? usecaseDariJendela(jendela.kode) : undefined) ??
    ucSimpan ??
    KATALOG_UC[0];
  const [kodeCookie, idCookie] = cookieSkenario?.split("/") ?? [];
  const jendelaCookie = kodeCookie ? cariJendela(kodeCookie) : undefined;
  const skenarioCookie = kodeCookie && idCookie ? cariSkenario(kodeCookie, idCookie) : undefined;
  // skenario J-01 (masuk) mendarat di jendela lain (J-02/J-04/J-07): pil di sana tetap menyebut skenario masuk yang dipilih
  const mendarat = jendela && skenarioCookie?.mendaratDi === jendela.kode;
  const aktifDiJendela = jendela && kodeCookie === jendela.kode ? idCookie : undefined;

  // papan pintas global
  useEffect(() => {
    function tekan(e: KeyboardEvent) {
      if (e.altKey && e.shiftKey && e.code === "KeyN") {
        // tersembunyi: pintasan ini tidak berbuat apa-apa (dan tidak membatalkan tombolnya), tampilkan dulu dengan Alt+Shift+D
        if (!alatPeragaanTampil()) return;
        e.preventDefault();
        aturTerbuka(!bacaTerbuka());
      } else if (e.key === "Escape" && alatPeragaanTampil() && bacaTerbuka() && panelRef.current?.contains(document.activeElement)) {
        aturTerbuka(false);
      }
    }
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, []);

  // fokus: ke panel saat dibuka, kembali ke tombol saat diciutkan
  useEffect(() => {
    if (terbuka && !sebelumnyaTerbuka.current) panelRef.current?.focus();
    if (!terbuka && sebelumnyaTerbuka.current) pilRef.current?.focus();
    sebelumnyaTerbuka.current = terbuka;
  }, [terbuka]);

  // keadaan sakelar masa pengusulan dibaca saat panel dibuka
  useEffect(() => {
    if (!terbuka) return;
    let batal = false;
    ambilMasaPengusulan()
      .then((m) => {
        if (!batal) setMasa(m);
      })
      .catch(() => {
        if (!batal) setMasa(null);
      });
    return () => {
      batal = true;
    };
  }, [terbuka, jalur]);

  const pasang = useCallback((kodeJendela: string, id: string, kodeUc: string) => {
    simpanUc(kodeUc);
    const sk = cariSkenario(kodeJendela, id);
    setMenyiapkan(`${kodeJendela}${sk ? `: ${sk.nama}` : ""}`);
    // panel diciutkan sebelum pindah supaya jendela tujuan tidak langsung tertutup panel; kemajuan tampil di pil
    aturTerbuka(false);
    window.location.assign(alamatSkenario(kodeJendela, id));
  }, []);

  // halaman dipulihkan dari bfcache (tombol Back): status "Menyiapkan" tidak boleh macet
  useEffect(() => {
    const pulih = (e: PageTransitionEvent) => {
      if (e.persisted) setMenyiapkan(null);
    };
    window.addEventListener("pageshow", pulih);
    return () => window.removeEventListener("pageshow", pulih);
  }, []);

  const [mengubahMasa, setMengubahMasa] = useState(false);
  async function ubahMasa(nilai: "berjalan" | "ditutup") {
    setPesanMasa(null);
    setMengubahMasa(true);
    try {
      const r = await setSakelarMasa(nilai);
      if (r.ok) {
        setMasa(nilai);
        setPesanMasa(r.pesan);
        router.refresh();
      } else setPesanMasa(r.pesan);
    } catch {
      setPesanMasa("Sakelar masa pengusulan gagal diubah; coba lagi.");
    } finally {
      setMengubahMasa(false);
    }
  }

  if (jalur === "/demo" || jalur.startsWith("/demo/")) return null;
  const penangkap = (
    <Suspense fallback={null}>
      <PenangkapCatatan />
      <PembacaKueri />
    </Suspense>
  );
  // tersembunyi: hanya penangkap ?catatan= yang jalan (tidak terlihat, tanpa unsur fokus) supaya alamat tetap bersih
  if (!peragaan) return penangkap;

  const namaPendek = (j: { kode: string; nama: string }) => (j.kode.startsWith("BIMA") ? j.nama.replace("BIMA: ", "BIMA ") : `${j.kode} ${j.nama}`);
  const kodePendek = (j: JendelaDemo) => (j.kode.startsWith("BIMA") ? `B-${j.kode.slice(-1)}` : j.kode);
  // use case skenario aktif: yang dipilih bila memuat jendela skenario itu, selain itu use case pertama jendela itu
  const ucAktif = jendelaCookie ? (ucSimpan?.layar.some((l) => l.kode === jendelaCookie.kode) ? ucSimpan : usecaseDariJendela(jendelaCookie.kode)) : undefined;
  const awalanUc = ucAktif && ucAktif.kode !== "Umum" ? `${ucAktif.kode} · ` : "";
  const ringkasAktif = skenarioCookie && jendelaCookie ? `${awalanUc}${jendelaCookie.kode} · ${skenarioCookie.nama}` : null;
  // pil hanya menyebut skenario bila cocok dengan jendela yang sedang dibuka; selain itu keadaan data saat ini tidak diketahui
  const labelPil = menyiapkan
    ? `Menyiapkan ${menyiapkan}…`
    : jendela
      ? mendarat && skenarioCookie && jendelaCookie
        ? `${awalanUc}${jendelaCookie.kode} · ${skenarioCookie.nama}`
        : aktifDiJendela && skenarioCookie
          ? `${awalanUc}${jendela.kode.startsWith("BIMA") ? namaPendek(jendela) : jendela.kode} · ${skenarioCookie.nama}`
          : `${jendela.kode.startsWith("BIMA") ? namaPendek(jendela) : jendela.kode} · keadaan belum dipilih`
      : "Navigator demo";

  if (!terbuka) {
    return (
      <>
        {penangkap}
        <button
          ref={pilRef}
          type="button"
          onClick={() => aturTerbuka(true)}
          aria-expanded={false}
          aria-keyshortcuts="Alt+Shift+N"
          aria-label={`Buka navigator demo${ringkasAktif ? `, skenario aktif ${ringkasAktif}` : ""}`}
          title={`Navigator demo (Alt+Shift+N)${ringkasAktif ? ` · skenario terakhir dipilih: ${ringkasAktif}` : ""}`}
          data-testid="navigator-pil"
          className="fixed bottom-4 left-4 z-40 inline-flex min-h-9 max-w-[min(15rem,calc(100vw-2rem))] items-center gap-2 rounded-full border border-aksen-300 bg-primer-850 px-3 py-1.5 text-xs pointer-coarse:min-h-11 font-semibold text-latar shadow-[var(--shadow-overlay)] transition-colors hover:bg-primer-700"
        >
          {menyiapkan ? <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-aksen-300" /> : <Compass aria-hidden className="size-4 shrink-0 text-aksen-300" />}
          <span className="truncate">{labelPil}</span>
          {catatanSkenario ? <span className="rounded-sm bg-aksen-300 px-1 text-xs font-bold text-primer-900">catatan</span> : null}
        </button>
      </>
    );
  }

  return (
    <>
      {penangkap}
      <aside
        ref={panelRef}
        tabIndex={-1}
        aria-label="Navigator demo"
        aria-busy={Boolean(menyiapkan)}
        data-testid="navigator-panel"
        className="fixed bottom-4 left-4 z-40 flex max-h-[min(38rem,calc(100dvh-2rem))] w-[24rem] max-w-[calc(100vw-2rem)] flex-col overscroll-contain rounded-lg border border-primer-300 bg-latar shadow-[var(--shadow-overlay)] outline-none"
      >
        <header className="flex items-center justify-between gap-2 rounded-t-lg bg-primer-800 px-3 py-2 text-latar">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Compass aria-hidden className="size-4 text-aksen-300" /> Navigator demo
          </p>
          <button
            type="button"
            onClick={() => aturTerbuka(false)}
            aria-label="Ciutkan navigator demo"
            aria-keyshortcuts="Escape"
            className="inline-flex size-9 items-center justify-center rounded transition-colors hover:bg-primer-700"
          >
            <ChevronDown aria-hidden className="size-4" />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto overscroll-contain p-3 text-sm">
          <p data-testid="navigator-aktif" className="text-xs text-primer-800">
            <span className="font-semibold">Skenario aktif:</span> {ringkasAktif ?? "belum dipilih lewat navigator"}
            {jendela ? <span className="block text-teks-redup">Sedang dibuka: {namaPendek(jendela)}</span> : null}
          </p>

          {catatanSkenario ? (
            <section aria-labelledby="nav-catatan" data-testid="navigator-catatan" className="border-l-4 border-primer-400 bg-white px-2.5 py-1.5">
              <h2 id="nav-catatan" className="text-xs font-semibold text-teks-redup">
                Catatan skenario
              </h2>
              <p className="mt-0.5 text-xs text-primer-900">{catatanSkenario}</p>
            </section>
          ) : null}

          {menyiapkan ? (
            <p role="status" className="flex items-center gap-2 rounded bg-primer-100 px-2 py-1.5 text-xs font-semibold text-primer-800">
              <Loader2 aria-hidden className="size-4 animate-spin" /> Menyiapkan {menyiapkan}…
            </p>
          ) : null}

          <section aria-labelledby="nav-uc">
            <label id="nav-uc" htmlFor="nav-pilih-uc" className="text-xs font-semibold text-primer-800">
              Use case
            </label>
            <select
              id="nav-pilih-uc"
              value={uc.kode}
              onChange={(e) => {
                setPilihanUc(e.target.value);
                simpanUc(e.target.value);
              }}
              data-testid="navigator-uc"
              className="mt-1 min-h-9 w-full rounded border border-primer-300 bg-white px-2 py-1.5 text-sm text-primer-900"
            >
              {KATALOG_UC.map((u) => (
                <option key={u.kode} value={u.kode}>
                  {u.kode === "Umum" ? "Umum" : u.kode} · {u.nama}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-teks-redup">
              Peran: {uc.peran}. &ldquo;Buka&rdquo; hanya berpindah layar (data tetap); memilih keadaan menyiapkan data lalu membuka layarnya.
            </p>
            <ol className="mt-3 space-y-3">
              {layarUsecase(uc).map(({ jendela: j, skenario }) => {
                const sekarang = jendela?.kode === j.kode;
                return (
                  <li key={j.kode} data-layar={j.kode}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("min-w-0 text-xs leading-snug", sekarang ? "font-semibold text-primer-900" : "text-primer-800")}>
                        <span className="mr-1 font-mono font-semibold text-teks-redup">{kodePendek(j)}</span>
                        {j.nama.replace("BIMA: ", "BIMA ")}
                        {sekarang ? <span className="ml-1 font-normal text-teks-redup">(sedang dibuka)</span> : null}
                      </p>
                      <a
                        href={alamatPindah(j.kode)}
                        rel="nofollow"
                        data-jendela={j.kode}
                        onClick={(e) => {
                          // klik biasa: panel diciutkan sebelum pindah supaya tidak menutupi layar tujuan (Ctrl/Cmd-klik tetap membuka tab baru)
                          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                          e.preventDefault();
                          simpanUc(uc.kode);
                          aturTerbuka(false);
                          window.location.assign(alamatPindah(j.kode));
                        }}
                        aria-current={sekarang ? "page" : undefined}
                        aria-label={`Buka ${namaPendek(j)} tanpa mengubah data`}
                        className="inline-flex min-h-8 shrink-0 items-center rounded border border-primer-300 bg-white px-2 text-xs font-semibold text-primer-800 transition-colors hover:bg-primer-50"
                      >
                        Buka
                      </a>
                    </div>
                    {skenario.length ? (
                      <ul className="mt-1 space-y-1">
                        {skenario.map((sk) => {
                          const aktif = kodeCookie === j.kode && idCookie === sk.id;
                          return (
                            <li key={sk.id}>
                              <button
                                type="button"
                                disabled={Boolean(menyiapkan)}
                                onClick={() => pasang(j.kode, sk.id, uc.kode)}
                                aria-pressed={aktif}
                                data-skenario={sk.id}
                                className={cn(
                                  "w-full rounded border px-2 py-1.5 text-left transition-colors disabled:opacity-60",
                                  aktif ? "border-primer-400 bg-primer-50" : "border-primer-200 bg-white hover:bg-primer-50",
                                )}
                              >
                                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-primer-900">
                                  {sk.nama}
                                  {aktif ? <span className="rounded-sm bg-primer-800 px-1.5 text-xs font-semibold text-latar">aktif</span> : null}
                                </span>
                                <span className="block text-xs text-teks-redup">{sk.ringkas}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-0.5 text-xs text-teks-redup">Keadaannya disiapkan lewat layar berikutnya.</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-labelledby="nav-masa">
            <h2 id="nav-masa" className="mb-1.5 text-xs font-semibold text-primer-800">
              Masa pengusulan (mengubah data)
            </h2>
            <div className="flex gap-1.5" role="group" aria-label="Sakelar masa pengusulan">
              {(["berjalan", "ditutup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  data-masa={m}
                  aria-pressed={masa === m}
                  disabled={mengubahMasa}
                  onClick={() => void ubahMasa(m)}
                  className={cn(
                    "min-h-9 flex-1 rounded border px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-60",
                    masa === m ? "border-primer-800 bg-primer-800 text-latar" : "border-primer-300 bg-white text-primer-800 hover:bg-primer-50",
                  )}
                >
                  {m === "berjalan" ? "Berjalan" : "Ditutup"}
                </button>
              ))}
            </div>
            {pesanMasa ? (
              <p role={pesanMasa.startsWith("Sakelar") ? "alert" : "status"} className={cn("mt-1 text-xs", pesanMasa.startsWith("Sakelar") ? "font-semibold text-bata-700" : "text-daun-700")}>
                {pesanMasa}
              </p>
            ) : null}
          </section>

          <p className="border-t border-primer-200 pt-2 text-xs text-teks-redup">
            <a href="/demo" className="font-semibold text-primer-800 underline underline-offset-2">
              Pusat Demo
            </a>{" "}
            (reset data, daftar skenario, log audit). Pintasan: Alt+Shift+N.
          </p>
        </div>
      </aside>
    </>
  );
}
