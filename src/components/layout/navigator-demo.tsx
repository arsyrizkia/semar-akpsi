"use client";

import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Compass, ChevronDown, Loader2 } from "lucide-react";
import { ambilMasaPengusulan, setSakelarMasa } from "@/app/demo/aksi";
import { COOKIE_SKENARIO, KATALOG_JENDELA, alamatPindah, alamatSkenario, cariJendela, cariSkenario, jendelaDariJalur } from "@/lib/demo/katalog";
import { cn } from "@/lib/utils";

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
 * Navigator demo mengambang. Dua hal yang dipisah tegas:
 *  - "Pindah layar/peran": tautan ke /demo/pindah; hanya membuka layar (dan memasang sesi peran bila perlu). Data TIDAK berubah.
 *  - "Pasang skenario": tombol ke /demo/mulai; menyiapkan data skenario jendela yang sedang dibuka, lalu membukanya. Data berubah.
 * Catatan skenario tampil di panel ini. Papan pintas: Alt+Shift+N membuka/menciutkan, Esc menciutkan.
 */
export function NavigatorDemo() {
  const jalur = usePathname();
  const kueri = useSearchParams().toString();
  const router = useRouter();
  const terbuka = useSyncExternalStore(langganan, bacaTerbuka, () => false);
  const cookieSkenario = useSyncExternalStore(tanpaLangganan, bacaCookieSkenario, () => null);
  const [menyiapkan, setMenyiapkan] = useState<string | null>(null);
  const [masa, setMasa] = useState<"berjalan" | "ditutup" | null>(null);
  const [pesanMasa, setPesanMasa] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pilRef = useRef<HTMLButtonElement>(null);
  const sebelumnyaTerbuka = useRef(false);

  const catatanSkenario = useCatatanSkenario(jalur);
  const jendela = jendelaDariJalur(jalur, kueri);
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
        e.preventDefault();
        aturTerbuka(!bacaTerbuka());
      } else if (e.key === "Escape" && bacaTerbuka() && panelRef.current?.contains(document.activeElement)) {
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

  const pasang = useCallback((kodeJendela: string, id: string) => {
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
    </Suspense>
  );

  const namaPendek = (j: { kode: string; nama: string }) => (j.kode.startsWith("BIMA") ? j.nama.replace("BIMA: ", "BIMA ") : `${j.kode} ${j.nama}`);
  const ringkasAktif = skenarioCookie && jendelaCookie ? `${jendelaCookie.kode} · ${skenarioCookie.nama}` : null;
  // pil hanya menyebut skenario bila cocok dengan jendela yang sedang dibuka; selain itu keadaan data saat ini tidak diketahui
  const labelPil = menyiapkan
    ? `Menyiapkan ${menyiapkan}…`
    : jendela
      ? mendarat && skenarioCookie && jendelaCookie
        ? `${jendelaCookie.kode} · ${skenarioCookie.nama}`
        : aktifDiJendela && skenarioCookie
          ? `${jendela.kode.startsWith("BIMA") ? namaPendek(jendela) : jendela.kode} · ${skenarioCookie.nama}`
          : `${jendela.kode.startsWith("BIMA") ? namaPendek(jendela) : jendela.kode} · skenario belum dipilih`
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

          <section aria-labelledby="nav-pindah">
            <h2 id="nav-pindah" className="text-xs font-semibold text-primer-800">
              Pindah layar/peran
            </h2>
            <p className="mb-1.5 text-xs text-teks-redup">Data tidak berubah. Peran dipasang hanya bila sesi saat ini belum cocok.</p>
            <ul className="grid grid-cols-2 gap-1">
              {KATALOG_JENDELA.map((j) => {
                const sekarang = jendela?.kode === j.kode;
                return (
                  <li key={j.kode}>
                    <a
                      href={alamatPindah(j.kode)}
                      rel="nofollow"
                      data-jendela={j.kode}
                      onClick={(e) => {
                        // klik biasa: panel diciutkan sebelum pindah supaya tidak menutupi layar tujuan (Ctrl/Cmd-klik tetap membuka tab baru)
                        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        aturTerbuka(false);
                        window.location.assign(alamatPindah(j.kode));
                      }}
                      aria-current={sekarang ? "page" : undefined}
                      title={`${namaPendek(j)} (${j.peran})`}
                      className={cn(
                        "flex h-full min-h-9 items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors",
                        sekarang ? "border-primer-400 bg-primer-50 font-semibold text-primer-900" : "border-primer-200 bg-white text-primer-800 hover:bg-primer-50",
                      )}
                    >
                      <span className="w-11 shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-teks-redup">{j.kode.startsWith("BIMA") ? `B-${j.kode.slice(-1)}` : j.kode}</span>
                      <span className="line-clamp-2 leading-tight">{j.nama.replace("BIMA: ", "")}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="nav-skenario">
            <h2 id="nav-skenario" className="text-xs font-semibold text-primer-800">
              Pasang skenario{jendela ? ` untuk ${namaPendek(jendela)}` : ""}
            </h2>
            <p className="mb-1.5 text-xs text-teks-redup">Menyiapkan data demo lalu membuka layar ini. Data berubah (Reset penuh ada di Pusat Demo).</p>
            {jendela ? (
              <ul className="space-y-1">
                {jendela.skenario.map((sk) => {
                  const aktif = aktifDiJendela === sk.id;
                  return (
                    <li key={sk.id}>
                      <button
                        type="button"
                        disabled={Boolean(menyiapkan)}
                        onClick={() => pasang(jendela.kode, sk.id)}
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
              <p className="text-xs text-teks-redup">Pindah ke salah satu layar di atas; skenario keadaannya muncul di sini.</p>
            )}
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
