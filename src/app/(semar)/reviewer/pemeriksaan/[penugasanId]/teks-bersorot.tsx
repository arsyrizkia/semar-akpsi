"use client";

import { useMemo } from "react";
import { Check, CircleHelp, ImageOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { susunSorotan, type RentangSorot } from "@/lib/penilaian/sorotan";
import type { ButirTampil, GambarTampil } from "@/lib/penilaian/tipe";

/** Id penggalan kutipan: "<hasilId>#<k>", k = 0 untuk kutipan utama, 1.. untuk kutipan lain. */
export const idPenggalan = (hasilId: string, k: number) => `${hasilId}#${k}`;
const pecahPenggalan = (id: string) => {
  const i = id.lastIndexOf("#");
  return { hasilId: id.slice(0, i), k: Number(id.slice(i + 1)) };
};
/** Id elemen jangkar di teks untuk menggulir ke penggalan. */
export const idDomPenggalan = (id: string) => `sorot-${id.replace("#", "-")}`;

const KETERANGAN_GAMBAR = /^\s*(?:gambar|diagram|bagan)\s*\d+/i;

const KELAS_LEMBUT = "rounded-[2px] bg-peringatan-100 text-primer-900 shadow-[inset_0_-2px_0_var(--color-peringatan-300)] box-decoration-clone";
const KELAS_KUAT = "rounded-sm bg-peringatan-300 text-primer-900 ring-2 ring-peringatan-500 box-decoration-clone";

function IkonStatus({ status }: { status: ButirTampil["status"] }) {
  if (status === "Memenuhi") return <Check aria-hidden className="size-3.5 text-daun-700" />;
  if (status === "Tidak memenuhi") return <X aria-hidden className="size-3.5 text-bata-700" />;
  return <CircleHelp aria-hidden className="size-3.5 text-peringatan-700" />;
}

/**
 * Teks satu bagian proposal dengan kutipan bukti tersorot. Setiap penggalan yang dikutip sistem disorot lembut; penggalan butir
 * terpilih disorot kuat. Di ujung penggalan ada label kode butir (dengan ikon status) yang memilih butir itu. Penanda "[gambar n]"
 * ditampilkan sebagai gambarnya, berbingkai sorot bila gambar itu dikutip sebagai bukti.
 */
export function TeksBersorot({
  teks,
  rentang,
  butir,
  terpilih,
  gambar,
  urlGambar,
  namaBagian,
  saatPilih,
}: {
  teks: string;
  rentang: RentangSorot[];
  /** hasilId -> butir */
  butir: Map<string, ButirTampil>;
  terpilih: string | null;
  gambar: GambarTampil[];
  urlGambar: (id: string) => string;
  namaBagian: string;
  /** label butir diklik: id penggalan yang labelnya diklik */
  saatPilih: (idPenggalan: string) => void;
}) {
  const potongan = useMemo(() => susunSorotan(teks, rentang), [teks, rentang]);
  // posisi awal setiap potongan di teks (label tidak memakan teks)
  const awalPotongan = useMemo(() => {
    const hasil: number[] = [];
    let x = 0;
    for (const p of potongan) {
      hasil.push(x);
      if (p.jenis !== "label") x += p.teks.length;
    }
    return hasil;
  }, [potongan]);
  const terpasang = new Set<string>(); // penggalan yang jangkarnya sudah dipasang (hanya di potongan pertamanya)

  return potongan.map((p, i) => {
    if (p.jenis === "label") {
      // satu label per butir pada titik yang sama
      const unik = [...new Map(p.rentang.map((r) => [pecahPenggalan(r).hasilId, r])).values()];
      return unik.map((r) => {
        const { hasilId } = pecahPenggalan(r);
        const b = butir.get(hasilId);
        if (!b) return null;
        const dipilih = hasilId === terpilih;
        return (
          <button
            key={`${i}-${r}`}
            type="button"
            onClick={() => saatPilih(r)}
            aria-pressed={dipilih}
            aria-label={`Butir ${b.kode}, rekomendasi ${b.status}${b.koreksi ? ", sudah Anda koreksi" : ""}. Tampilkan rinciannya`}
            className={cn(
              "mx-0.5 inline-flex h-6 cursor-pointer touch-manipulation items-center gap-1 whitespace-nowrap rounded border px-1.5 align-middle font-mono text-xs leading-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primer-600",
              dipilih ? "border-peringatan-500 bg-peringatan-300 text-primer-900" : "border-peringatan-300 bg-peringatan-50 text-primer-800 hover:bg-peringatan-100",
            )}
          >
            <IkonStatus status={b.status} />
            <span translate="no">{b.kode}</span>
          </button>
        );
      });
    }

    const baru = p.rentang.filter((r) => !terpasang.has(r));
    baru.forEach((r) => terpasang.add(r));
    const jangkar = baru.map((r) => <span key={r} id={idDomPenggalan(r)} className="scroll-mt-24" />);
    const kuat = terpilih !== null && p.rentang.some((r) => pecahPenggalan(r).hasilId === terpilih);

    if (p.jenis === "gambar") {
      const g = gambar.find((x) => x.nomor === p.nomor);
      // keterangan gambar = baris sesudah penanda bila berbentuk "Gambar n. ..."
      const baris = teks.slice(awalPotongan[i] + p.teks.length).split("\n")[0].trim();
      const alt = KETERANGAN_GAMBAR.test(baris) ? baris : `Gambar ${p.nomor} pada bagian ${namaBagian}, tanpa keterangan`;
      return (
        <figure
          key={i}
          className={cn(
            "my-2 block w-fit max-w-full rounded-sm",
            p.rentang.length ? (kuat ? "ring-2 ring-peringatan-500 ring-offset-4" : "ring-2 ring-peringatan-300 ring-offset-4") : null,
          )}
        >
          {jangkar}
          {g ? (
            // eslint-disable-next-line @next/next/no-img-element -- gambar naskah dari rute berhak akses (bukan aset statis)
            <img
              src={urlGambar(g.id)}
              width={g.lebar}
              height={g.tinggi}
              loading="lazy"
              decoding="async"
              alt={alt}
              className="h-auto max-h-[28rem] w-auto max-w-full border border-primer-100 bg-white"
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-primer-300 px-2 py-1 text-xs text-teks-redup">
              <ImageOff aria-hidden className="size-4" />
              Gambar {p.nomor} tidak tersimpan; lihat berkas naskah
            </span>
          )}
        </figure>
      );
    }

    if (!p.rentang.length) return <span key={i}>{p.teks}</span>;
    return (
      <span key={i}>
        {jangkar}
        <mark className={kuat ? KELAS_KUAT : KELAS_LEMBUT}>{p.teks}</mark>
      </span>
    );
  });
}
