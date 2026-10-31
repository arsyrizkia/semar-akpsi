"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Download, FileUp, X } from "lucide-react";
import { Button, Checkbox, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { aksiMulaiUji, aksiSelesaikanUji, aksiUjiDeterministik } from "./uji/aksi";

const angka = new Intl.NumberFormat("id-ID");
const BATAS_BERKAS = 3.5 * 1024 * 1024;
/** penilaian semantik yang berjalan bersamaan (fetch ke route handler; server action dijalankan peramban satu per satu) */
const PARALEL = 4;
/** kata kerja bergilir saat Claude menilai, gaya indikator Claude Code */
const KATA_KERJA = ["Menimbang", "Menelaah", "Mencocokkan kutipan", "Membaca ulang bagian", "Menilai"];
const KILAU = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];

/** Glif berdenyut seperti indikator Claude Code; diam (✻) bila pengguna memilih gerak dikurangi atau proses sudah berhenti. */
function Kilau({ jalan }: { jalan: boolean }) {
  const [i, setI] = useState(4);
  useEffect(() => {
    if (!jalan || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % KILAU.length), 140);
    return () => clearInterval(t);
  }, [jalan]);
  return (
    <span aria-hidden className="inline-block w-3 text-center text-aksen-500">
      {jalan ? KILAU[i] : "✻"}
    </span>
  );
}

export interface ContohUji {
  kode: string;
  nama: string;
  catatan: string | null;
  unggahan: boolean;
  /** format naskah yang dapat diunduh untuk dibaca sebelum diuji (PDF asli BIMA atau .docx contoh rekaan); unggahan tidak disimpan berkasnya */
  unduh: "pdf" | "docx" | null;
}

interface Log {
  jenis: "selesai" | "peringatan";
  teks: string;
}

/** Satu butir semantik atas satu dokumen; galat jaringan atau server dihitung sebagai "tanpa rekomendasi". */
async function nilaiSatu(ujiId: string, dokumenKode: string, butirKode: string): Promise<{ ok: true; status: string } | { ok: false }> {
  try {
    const r = await fetch(`/api/semar/uji-contoh/${ujiId}/semantik`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dokumenKode, butirKode }) });
    if (!r.ok) return { ok: false };
    const j = (await r.json()) as { status: string };
    return { ok: true, status: j.status };
  } catch {
    return { ok: false };
  }
}

const ukuranBerkas = (b: number) => (b < 1024 * 1024 ? `${angka.format(Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`);

/**
 * M-15 "Uji pada Contoh" (UC-02 langkah 6): pilih contoh yang tersedia dan/atau unggah naskah (.docx/.pdf), lalu "Jalankan Uji".
 * Uji berjalan bertahap dari peramban supaya kemajuannya nyata: siapkan (baca dan potong unggahan) → butir deterministik → setiap
 * butir semantik per dokumen (empat sekaligus, lewat fetch) → selesai, lalu J-03b dibuka dengan hasil tersimpan. Tampilan kemajuan meniru
 * Claude Code: baris "✻ kata kerja… (n dtk · p%)", bilah persen, butir yang sedang dinilai, dan log langkah yang selesai.
 * "Hentikan" berhenti sesudah penilaian yang sedang berjalan; hasil yang sudah ada tetap tersimpan.
 */
export function TombolUjiContoh({
  skemaId,
  periodeId,
  templatId,
  contoh,
  catatan = null,
  label = "Uji pada Contoh",
  varian = "sekunder",
}: {
  skemaId: string;
  periodeId: string | null;
  templatId: string | null;
  contoh: ContohUji[];
  /** keterangan pendek di atas pilihan (mis. isian Draf belum disimpan) */
  catatan?: string | null;
  label?: string;
  varian?: "utama" | "sekunder";
}) {
  const router = useRouter();
  const [menavigasi, mulaiNavigasi] = useTransition();
  const [buka, setBuka] = useState(false);
  const [tahap, setTahap] = useState<"pilih" | "jalan" | "selesai">("pilih");
  const [pilihan, setPilihan] = useState<Set<string>>(() => new Set(contoh.filter((c) => !c.unggahan).slice(0, 1).map((c) => c.kode)));
  const [berkas, setBerkas] = useState<File[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [seret, setSeret] = useState(false);

  // keadaan berjalan
  const [selesai, setSelesai] = useState(0);
  const [total, setTotal] = useState(1);
  const [verba, setVerba] = useState("Menyiapkan uji");
  const [rinci, setRinci] = useState("");
  const [log, setLog] = useState<Log[]>([]);
  const [detik, setDetik] = useState(0);
  const [indeksVerba, setIndeksVerba] = useState(0);
  const berhenti = useRef(false);
  const [menghentikan, setMenghentikan] = useState(false);
  const [semantikJalan, setSemantikJalan] = useState(false);

  useEffect(() => {
    if (tahap !== "jalan") return;
    const t = setInterval(() => setDetik((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [tahap]);
  useEffect(() => {
    if (!semantikJalan) return;
    const t = setInterval(() => setIndeksVerba((i) => (i + 1) % KATA_KERJA.length), 2500);
    return () => clearInterval(t);
  }, [semantikJalan]);

  const tambahLog = (l: Log) => setLog((x) => [...x, l]);
  const persen = Math.min(100, Math.round((selesai / Math.max(1, total)) * 100));

  function tambahBerkas(daftar: FileList | File[]) {
    setGalat(null);
    const baru = [...daftar].filter((f) => /\.(docx|pdf)$/i.test(f.name));
    if (baru.length < [...daftar].length) setGalat("Hanya berkas .docx atau .pdf yang dapat diuji.");
    const besar = baru.find((f) => f.size > BATAS_BERKAS);
    if (besar) {
      setGalat(`"${besar.name}" ${ukuranBerkas(besar.size)}; batasnya 3,5 MB per berkas.`);
      return;
    }
    setBerkas((x) => [...x, ...baru.filter((f) => !x.some((y) => y.name === f.name && y.size === f.size))].slice(0, 3));
  }

  function bukaModal() {
    setTahap("pilih");
    setGalat(null);
    setBuka(true);
  }

  function tutup(b: boolean) {
    if (b) return bukaModal();
    if (tahap === "jalan") return; // tidak dapat ditutup saat berjalan: pakai Hentikan
    setBuka(false);
  }

  async function jalankan() {
    const jumlahDok = pilihan.size + berkas.length;
    if (!jumlahDok) {
      setGalat("Pilih sekurang-kurangnya satu contoh atau unggah satu naskah.");
      return;
    }
    const ukuranTotal = berkas.reduce((n, f) => n + f.size, 0);
    if (ukuranTotal > 3.9 * 1024 * 1024) {
      setGalat(`Total unggahan ${ukuranBerkas(ukuranTotal)}; batasnya 3,9 MB sekali uji. Unggah berkas satu per satu.`);
      return;
    }
    berhenti.current = false;
    setMenghentikan(false);
    setTahap("jalan");
    setSelesai(0);
    setTotal(2);
    setLog([]);
    setDetik(0);
    setVerba(berkas.length ? `Membaca ${berkas.length} berkas dan memotong per bagian templat` : "Menyiapkan uji");
    setRinci(berkas.map((f) => f.name).join(", "));

    const fd = new FormData();
    fd.set("skemaId", skemaId);
    if (periodeId) fd.set("periodeId", periodeId);
    if (templatId) fd.set("templatId", templatId);
    for (const k of pilihan) fd.append("contoh", k);
    for (const f of berkas) fd.append("berkas", f);
    const m = await aksiMulaiUji(fd).catch(() => ({ ok: false as const, galat: "Uji tidak dapat dimulai (koneksi terputus atau berkas terlalu besar). Coba lagi." }));
    if (!m.ok) {
      setTahap("pilih");
      setGalat(m.galat);
      return;
    }
    const r = m.rencana;
    setBerkas([]); // unggahan kini tersimpan sebagai contoh; Uji Ulang tidak mengunggahnya dua kali
    const tugas = r.dokumen.flatMap((d) => r.semantik.map((b) => ({ d, b })));
    setTotal(2 + tugas.length);
    setSelesai(1);
    for (const d of r.dokumen.filter((x) => x.unggahan)) {
      tambahLog({ jenis: "selesai", teks: `Membaca ${d.nama}: ${d.bagianDitemukan} dari ${d.bagianTemplat} bagian templat dikenali` });
    }
    for (const p of r.peringatan) tambahLog({ jenis: "peringatan", teks: p });
    tambahLog({ jenis: "selesai", teks: `Menyiapkan uji: ${r.dokumen.length} dokumen, ${r.deterministik} butir deterministik, ${r.semantik.length} butir semantik` });

    setVerba(`Memeriksa ${r.deterministik} butir deterministik`);
    setRinci(r.dokumen.map((d) => d.nama).join(", "));
    const det = await aksiUjiDeterministik(r.ujiId).catch(() => ({ ok: false as const, galat: "Pemeriksaan deterministik terputus; butir semantik tetap dinilai." }));
    setSelesai(2);
    tambahLog(det.ok ? { jenis: "selesai", teks: `Memeriksa butir deterministik: ${angka.format(det.lolos)} lolos, ${angka.format(det.gagal)} gagal` } : { jenis: "peringatan", teks: det.galat });

    // butir semantik: empat penilaian sekaligus, urut dokumen lalu butir
    setSemantikJalan(true);
    const perDok = new Map(r.dokumen.map((d) => [d.kode, { dinilai: 0, memenuhi: 0, gagal: 0 }]));
    let berikut = 0;
    let gagalPanggil = 0;
    const pekerja = async () => {
      while (!berhenti.current && berikut < tugas.length) {
        const { d, b } = tugas[berikut++];
        setRinci(`${d.nama} · ${b.deskripsi}`);
        const h = await nilaiSatu(r.ujiId, d.kode, b.kode);
        const s = perDok.get(d.kode)!;
        s.dinilai++;
        if (h.ok && h.status === "Memenuhi") s.memenuhi++;
        if (!h.ok || h.status === "Belum ada rekomendasi") {
          s.gagal++;
          gagalPanggil++;
        }
        setSelesai((x) => x + 1);
        if (s.dinilai === r.semantik.length) {
          tambahLog({ jenis: "selesai", teks: `Menilai ${d.nama}: ${s.dinilai} butir semantik, ${s.memenuhi} Memenuhi${s.gagal ? `, ${s.gagal} tanpa rekomendasi` : ""}` });
        }
      }
    };
    setVerba("Menilai butir semantik dengan Claude");
    await Promise.all(Array.from({ length: Math.min(PARALEL, tugas.length) }, pekerja));
    setSemantikJalan(false);
    if (gagalPanggil) tambahLog({ jenis: "peringatan", teks: `${gagalPanggil} penilaian semantik tanpa rekomendasi (LLM tidak menjawab); butir lain tetap dinilai.` });

    const dihentikan = berhenti.current;
    await aksiSelesaikanUji(r.ujiId, dihentikan).catch(() => null);
    setSelesai((x) => (dihentikan ? x : 2 + tugas.length));
    tambahLog({ jenis: "selesai", teks: dihentikan ? "Uji dihentikan; hasil yang sudah dinilai tersimpan" : "Uji selesai; hasil tersimpan" });
    setVerba(dihentikan ? "Dihentikan" : "Selesai");
    setRinci("");
    const q = new URLSearchParams({ skema: skemaId, uji: r.ujiId });
    if (periodeId) q.set("periode", periodeId);
    if (templatId) q.set("templat", templatId);
    setTahap("selesai");
    mulaiNavigasi(() => router.push(`/tim-kerja/aturan/uji?${q.toString()}`));
  }

  const jumlahDipilih = pilihan.size + berkas.length;
  // sesudah selesai modal tetap terbuka sampai J-03b termuat (juga bila tombol ini ada di J-03b sendiri: "Uji Ulang")
  const terbuka = buka && !(tahap === "selesai" && !menavigasi);
  return (
    <>
      <Button varian={varian} onClick={bukaModal}>
        {label}
      </Button>
      <Modal
        buka={terbuka}
        saatUbah={tutup}
        kode="M-15"
        judul="Uji pada Contoh"
        deskripsi={tahap === "pilih" ? "Butir aturan templat ini diterapkan pada naskah contoh. Hasil tersimpan dan dapat dibuka lagi tanpa menguji ulang." : undefined}
        ukuran="lg"
        kaki={
          tahap === "pilih" ? (
            <>
              <Button varian="sekunder" onClick={() => tutup(false)}>
                Batal
              </Button>
              <Button onClick={() => void jalankan()} disabled={!jumlahDipilih}>
                Jalankan Uji{jumlahDipilih ? ` (${jumlahDipilih} dokumen)` : ""}
              </Button>
            </>
          ) : tahap === "jalan" ? (
            <Button
              varian="sekunder"
              memuat={menghentikan}
              onClick={() => {
                berhenti.current = true;
                setMenghentikan(true);
              }}
            >
              Hentikan
            </Button>
          ) : (
            <p className="text-sm text-teks-redup">Membuka hasil uji…</p>
          )
        }
      >
        {tahap === "pilih" ? (
          <div className="space-y-5">
            {catatan ? <p className="text-sm text-peringatan-700">{catatan}</p> : null}
            <fieldset>
              <legend className="text-sm font-semibold text-primer-800">Contoh yang tersedia</legend>
              <p className="mb-2 mt-0.5 text-xs text-teks-redup">Yang diuji hanya Isian Substansi (bagian A sampai H); halaman depan dan lampiran dari BIMA dilewati.</p>
              {contoh.length ? (
                <ul className="max-h-48 space-y-1.5 overflow-y-auto overscroll-contain pr-1">
                  {contoh.map((c) => (
                    <li key={c.kode} className="flex items-start gap-2">
                      <Checkbox
                        id={`contoh-${c.kode}`}
                        checked={pilihan.has(c.kode)}
                        onCheckedChange={(v) =>
                          setPilihan((s) => {
                            const n = new Set(s);
                            if (v === true) n.add(c.kode);
                            else n.delete(c.kode);
                            return n;
                          })
                        }
                        className="mt-0.5"
                      />
                      <label htmlFor={`contoh-${c.kode}`} className="min-w-0 flex-1 cursor-pointer text-sm">
                        <span className="text-primer-900">{c.nama}</span>
                        {c.unggahan ? <span className="ml-1.5 rounded-sm bg-abu-100 px-1 text-xs text-abu-700">unggahan</span> : null}
                        {c.catatan && !c.unggahan ? <span className="block text-xs text-teks-redup">{c.catatan}</span> : null}
                      </label>
                      {c.unduh ? (
                        <a
                          href={`/api/semar/contoh/${encodeURIComponent(c.kode)}/unduh`}
                          download
                          aria-label={`Unduh .${c.unduh}: ${c.nama}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:bg-primer-50 hover:text-primer-900 pointer-coarse:min-h-11"
                        >
                          <Download aria-hidden className="size-3.5" />
                          Unduh .{c.unduh}
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-teks-redup">Belum ada contoh tersimpan; unggah naskah di bawah.</p>
              )}
            </fieldset>

            <div>
              <p id="label-unggah" className="mb-2 text-sm font-semibold text-primer-800">
                Unggah naskah untuk diuji
              </p>
              <input
                id="berkas-uji"
                type="file"
                accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                aria-labelledby="label-unggah"
                className="peer sr-only"
                onChange={(e) => {
                  if (e.target.files) tambahBerkas(e.target.files);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor="berkas-uji"
                onDragOver={(e) => {
                  e.preventDefault();
                  setSeret(true);
                }}
                onDragLeave={() => setSeret(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setSeret(false);
                  tambahBerkas(e.dataTransfer.files);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed px-4 py-5 text-center text-sm transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primer-700",
                  seret ? "border-primer-400 bg-primer-50" : "border-primer-300 bg-white hover:bg-latar",
                )}
              >
                <FileUp aria-hidden className="size-6 text-primer-600" />
                <span className="font-semibold text-primer-800">Pilih berkas atau seret ke sini</span>
                <span className="text-xs text-teks-redup">.docx atau .pdf, maks. 3,5 MB per berkas, paling banyak 3 berkas</span>
              </label>

              {berkas.length ? (
                <ul className="mt-2 space-y-1">
                  {berkas.map((f) => (
                    <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-2 rounded border border-primer-200 bg-white px-2.5 py-1.5 text-sm">
                      <span className="min-w-0 truncate text-primer-900">{f.name}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-teks-redup">
                        {ukuranBerkas(f.size)}
                        <button
                          type="button"
                          aria-label={`Hapus ${f.name}`}
                          onClick={() => setBerkas((x) => x.filter((y) => y !== f))}
                          className="inline-flex size-9 cursor-pointer items-center justify-center rounded text-primer-700 hover:bg-primer-100"
                        >
                          <X aria-hidden className="size-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {galat ? (
              <p role="alert" className="rounded-md border-l-4 border-bata-600 bg-bata-100 px-3 py-2 font-medium text-bata-700">
                {galat}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="flex items-baseline gap-2 font-mono text-sm text-primer-900">
                <Kilau jalan={tahap === "jalan"} />
                <span>
                  {semantikJalan && !menghentikan ? KATA_KERJA[indeksVerba] : verba}
                  {tahap === "jalan" ? "…" : ""}
                </span>
                <span className="text-teks-redup">
                  ({angka.format(detik)} dtk · {persen}%)
                </span>
              </p>
              {semantikJalan && !menghentikan ? <p className="mt-0.5 pl-5 font-mono text-xs text-teks-redup">{verba}</p> : null}
              {menghentikan && tahap === "jalan" ? <p className="mt-0.5 pl-5 text-xs text-peringatan-700">Menghentikan sesudah penilaian yang sedang berjalan…</p> : null}
            </div>
            <div
              role="progressbar"
              aria-label="Kemajuan uji"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={persen}
              aria-valuetext={`${persen}%, ${selesai} dari ${total} langkah`}
              className="h-2 w-full overflow-hidden rounded-full bg-primer-100">
              <div className="h-full rounded-full bg-primer-700 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${persen}%` }} />
            </div>
            <p className="min-h-5 truncate font-mono text-xs text-primer-800" title={rinci}>
              {rinci ? `└ ${rinci}` : ""}
            </p>
            <ol aria-live="polite" className="max-h-56 space-y-1 overflow-y-auto overscroll-contain font-mono text-xs">
              {log.map((l, i) => (
                <li key={i} className={cn("flex items-start gap-2", l.jenis === "peringatan" ? "text-peringatan-700" : "text-primer-900")}>
                  {l.jenis === "peringatan" ? <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" /> : <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-daun-600" />}
                  <span>{l.teks}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>
    </>
  );
}
