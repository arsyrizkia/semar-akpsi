"use client";

import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Compass, ChevronDown, Loader2 } from "lucide-react";
import { ambilMasaPengusulan, setSakelarMasa } from "@/app/demo/aksi";
import { COOKIE_SKENARIO, KATALOG_JENDELA, alamatSkenario, cariJendela, cariSkenario, jendelaDariJalur, skenarioBawaan } from "@/lib/demo/katalog";
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
 * Navigator demo mengambang (menggantikan panel langkah real use case): pindah antar-jendela J-01..J-08 dan halaman BIMA tiruan, serta
 * antar-skenario keadaan jendela yang sedang dibuka. Setiap pilihan membuka /demo/mulai yang menyiapkan data, memasang sesi peran, lalu
 * membuka jendela. Papan pintas: Alt+Shift+N membuka/menciutkan, Esc menciutkan.
 */
export function NavigatorDemo() {
  const jalur = usePathname();
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
  const jendela = jendelaDariJalur(jalur);
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

  const buka = useCallback((kodeJendela: string, id?: string) => {
    const sk = id ? cariSkenario(kodeJendela, id) : skenarioBawaan(kodeJendela);
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
    ? `Menyiapkan ${menyiapkan}...`
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
        className="fixed bottom-4 left-4 z-40 inline-flex max-w-[min(15rem,calc(100vw-2rem))] items-center gap-2 rounded-full border border-emas-400 bg-sogan-800 px-3 py-1.5 text-xs font-semibold text-krem shadow-lg hover:bg-sogan-700 focus-visible:outline-3 focus-visible:outline-emas-500"
      >
        {menyiapkan ? <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-emas-300" /> : <Compass aria-hidden className="size-4 shrink-0 text-emas-300" />}
        <span className="truncate">{labelPil}</span>
        {catatanSkenario ? <span className="rounded-sm bg-emas-300 px-1 text-[10px] font-bold text-sogan-900">catatan</span> : null}
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
      className="fixed bottom-4 left-4 z-40 flex max-h-[min(36rem,calc(100vh-2rem))] w-[23rem] max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-sogan-300 bg-krem shadow-[var(--shadow-overlay)] outline-none"
    >
      <header className="flex items-center justify-between gap-2 rounded-t-lg bg-sogan-800 px-3 py-2 text-krem">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Compass aria-hidden className="size-4 text-emas-300" /> Navigator demo
        </p>
        <button
          type="button"
          onClick={() => aturTerbuka(false)}
          aria-label="Ciutkan navigator demo"
          aria-keyshortcuts="Escape"
          className="rounded p-1 hover:bg-sogan-700 focus-visible:outline-3 focus-visible:outline-emas-500"
        >
          <ChevronDown aria-hidden className="size-4" />
        </button>
      </header>

      <div className="space-y-4 overflow-y-auto p-3 text-sm">
        <p data-testid="navigator-aktif" className="rounded bg-emas-50 px-2 py-1.5 text-xs text-sogan-800">
          <span className="font-semibold">Skenario aktif:</span>{" "}
          {ringkasAktif ?? "belum dipilih lewat navigator"}
          {jendela ? <span className="block text-sogan-600">Sedang dibuka: {namaPendek(jendela)}</span> : null}
        </p>

        {catatanSkenario ? (
          <section aria-labelledby="nav-catatan" data-testid="navigator-catatan" className="rounded border-l-4 border-emas-500 bg-white px-2 py-1.5">
            <h2 id="nav-catatan" className="text-xs font-bold uppercase tracking-wide text-sogan-700">
              Catatan skenario
            </h2>
            <p className="mt-0.5 text-xs text-sogan-900">{catatanSkenario}</p>
          </section>
        ) : null}

        {menyiapkan ? (
          <p role="status" className="flex items-center gap-2 rounded bg-sogan-100 px-2 py-1.5 text-xs font-semibold text-sogan-800">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Menyiapkan {menyiapkan}...
          </p>
        ) : null}

        <section aria-labelledby="nav-skenario">
          <h2 id="nav-skenario" className="mb-1.5 text-xs font-bold uppercase tracking-wide text-sogan-700">
            Skenario {jendela ? namaPendek(jendela) : ""}
          </h2>
          {jendela ? (
            <ul className="space-y-1.5">
              {jendela.skenario.map((sk) => {
                const aktif = aktifDiJendela === sk.id;
                return (
                  <li key={sk.id}>
                    <button
                      type="button"
                      disabled={Boolean(menyiapkan)}
                      onClick={() => buka(jendela.kode, sk.id)}
                      aria-pressed={aktif}
                      data-skenario={sk.id}
                      className={cn(
                        "w-full rounded border px-2 py-1.5 text-left focus-visible:outline-3 focus-visible:outline-emas-500 disabled:opacity-60",
                        aktif ? "border-emas-600 bg-emas-100 ring-1 ring-emas-500" : "border-sogan-200 bg-white hover:border-emas-500 hover:bg-emas-50",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2 font-semibold text-sogan-900">
                        {sk.nama}
                        {aktif ? <span className="rounded bg-sogan-800 px-1.5 text-[10px] font-bold uppercase text-krem">aktif</span> : null}
                      </span>
                      <span className="block text-xs text-sogan-700">{sk.ringkas}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-sogan-700">Pilih salah satu jendela di atas; skenario keadaannya muncul di sini.</p>
          )}
        </section>

        <section aria-labelledby="nav-jendela">
          <h2 id="nav-jendela" className="mb-1.5 text-xs font-bold uppercase tracking-wide text-sogan-700">
            Pindah jendela
          </h2>
          <ul className="grid grid-cols-5 gap-1.5">
            {KATALOG_JENDELA.map((j) => {
              const sekarang = jendela?.kode === j.kode;
              const bawaan = skenarioBawaan(j.kode);
              return (
                <li key={j.kode}>
                  <button
                    type="button"
                    disabled={Boolean(menyiapkan)}
                    onClick={() => buka(j.kode)}
                    aria-current={sekarang ? "page" : undefined}
                    aria-label={`${j.kode.startsWith("BIMA") ? j.nama : `${j.kode} ${j.nama}`}, peran ${j.peran}, membuka skenario bawaan ${bawaan?.nama ?? ""}`}
                    data-jendela={j.kode}
                    title={`${namaPendek(j)} (${j.peran}); membuka skenario bawaan: ${bawaan?.nama ?? "-"}`}
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded border px-1 py-1.5 text-center font-mono text-[11px] font-bold leading-tight focus-visible:outline-3 focus-visible:outline-emas-500 disabled:opacity-60",
                      sekarang ? "border-emas-600 bg-emas-100 text-sogan-900" : "border-sogan-200 bg-white text-emas-700 hover:border-emas-500 hover:bg-emas-50",
                    )}
                  >
                    {j.kode === "BIMA-1" ? "B-1" : j.kode === "BIMA-2" ? "B-2" : j.kode}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-[11px] text-sogan-700">J-01..J-08 = jendela SEMAR; B-1 BIMA Pengajuan, B-2 BIMA Kotak masuk. Arahkan kursor untuk nama dan skenario bawaan.</p>
        </section>

        <section aria-labelledby="nav-masa">
          <h2 id="nav-masa" className="mb-1.5 text-xs font-bold uppercase tracking-wide text-sogan-700">
            Masa pengusulan
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
                  "disabled:opacity-60",
                  "flex-1 rounded border px-2 py-1 text-xs font-semibold focus-visible:outline-3 focus-visible:outline-emas-500",
                  masa === m ? "border-sogan-800 bg-sogan-800 text-krem" : "border-sogan-300 bg-white text-sogan-800 hover:bg-emas-50",
                )}
              >
                {m === "berjalan" ? "Berjalan" : "Ditutup"}
              </button>
            ))}
          </div>
          {pesanMasa ? <p role="status" className="mt-1 text-xs text-daun-700">{pesanMasa}</p> : null}
        </section>

        <p className="border-t border-sogan-200 pt-2 text-xs text-sogan-700">
          <a href="/demo" className="font-semibold text-sogan-800 underline underline-offset-2">Pusat Demo</a> (Reset &amp; isi data demo, log audit). Pintasan: Alt+Shift+N.
        </p>
      </div>
    </aside>
    </>
  );
}
