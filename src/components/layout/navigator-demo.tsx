"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
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

  const jendela = jendelaDariJalur(jalur);
  const [kodeCookie, idCookie] = cookieSkenario?.split("/") ?? [];
  const jendelaCookie = kodeCookie ? cariJendela(kodeCookie) : undefined;
  const skenarioCookie = kodeCookie && idCookie ? cariSkenario(kodeCookie, idCookie) : undefined;
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
    window.location.assign(alamatSkenario(kodeJendela, id));
  }, []);

  async function ubahMasa(nilai: "berjalan" | "ditutup") {
    setPesanMasa(null);
    const r = await setSakelarMasa(nilai);
    if (r.ok) {
      setMasa(nilai);
      setPesanMasa(r.pesan);
      router.refresh();
    } else setPesanMasa(r.pesan);
  }

  if (jalur === "/demo" || jalur.startsWith("/demo/")) return null;

  const ringkasAktif = skenarioCookie && jendelaCookie ? `${jendelaCookie.kode} · ${skenarioCookie.nama}` : null;

  if (!terbuka) {
    return (
      <button
        ref={pilRef}
        type="button"
        onClick={() => aturTerbuka(true)}
        aria-expanded={false}
        aria-keyshortcuts="Alt+Shift+N"
        aria-label={`Buka navigator demo${ringkasAktif ? `, skenario aktif ${ringkasAktif}` : ""}`}
        data-testid="navigator-pil"
        className="fixed bottom-4 left-4 z-40 inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-emas-400 bg-sogan-800 px-4 py-2 text-sm font-semibold text-krem shadow-lg hover:bg-sogan-700 focus-visible:outline-3 focus-visible:outline-emas-500"
      >
        <Compass aria-hidden className="size-4 shrink-0 text-emas-300" />
        <span className="truncate">{ringkasAktif ? `Navigator demo · ${ringkasAktif}` : jendela ? `Navigator demo · ${jendela.kode}` : "Navigator demo"}</span>
      </button>
    );
  }

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      aria-label="Navigator demo"
      aria-busy={Boolean(menyiapkan)}
      data-testid="navigator-panel"
      className="fixed bottom-4 left-4 z-40 flex max-h-[min(36rem,calc(100vh-2rem))] w-[23rem] max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-emas-500 bg-krem shadow-xl outline-none"
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
          {jendela ? <span className="block text-sogan-600">Sedang dibuka: {jendela.kode} {jendela.nama}</span> : null}
        </p>

        {menyiapkan ? (
          <p role="status" className="flex items-center gap-2 rounded bg-sogan-100 px-2 py-1.5 text-xs font-semibold text-sogan-800">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Menyiapkan {menyiapkan}...
          </p>
        ) : null}

        <section aria-labelledby="nav-jendela">
          <h2 id="nav-jendela" className="mb-1.5 text-xs font-bold uppercase tracking-wide text-sogan-700">
            Jendela
          </h2>
          <ul className="grid grid-cols-2 gap-1.5">
            {KATALOG_JENDELA.map((j) => {
              const sekarang = jendela?.kode === j.kode;
              return (
                <li key={j.kode}>
                  <button
                    type="button"
                    disabled={Boolean(menyiapkan)}
                    onClick={() => buka(j.kode)}
                    aria-current={sekarang ? "page" : undefined}
                    data-jendela={j.kode}
                    title={`${j.nama} (${j.peran})`}
                    className={cn(
                      "flex h-full w-full flex-col rounded border px-2 py-1 text-left leading-tight focus-visible:outline-3 focus-visible:outline-emas-500 disabled:opacity-60",
                      sekarang ? "border-emas-600 bg-emas-100 font-semibold text-sogan-900" : "border-sogan-200 bg-white text-sogan-800 hover:border-emas-500 hover:bg-emas-50",
                    )}
                  >
                    <span className="font-mono text-[11px] font-bold text-emas-700">{j.kode.startsWith("BIMA") ? "BIMA" : j.kode}</span>
                    <span className="text-xs">{j.kode.startsWith("BIMA") ? j.nama.replace("BIMA: ", "") : j.nama}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="nav-skenario">
          <h2 id="nav-skenario" className="mb-1.5 text-xs font-bold uppercase tracking-wide text-sogan-700">
            Skenario {jendela ? `${jendela.kode} ${jendela.nama}` : ""}
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
                onClick={() => void ubahMasa(m)}
                className={cn(
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
  );
}
