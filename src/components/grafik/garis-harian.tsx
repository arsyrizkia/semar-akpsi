"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatAngka } from "@/lib/utils";

const persen = (n: number) => `${String(Math.round(n * 10) / 10).replace(".", ",")}%`;

export interface TitikHarian {
  hari: number;
  persen: number;
  jumlah: number;
}

const T = 220;
const M = { kiri: 44, kanan: 16, atas: 22, bawah: 30 };

/**
 * Grafik garis satu seri: % disetujui per hari masa penilaian (sumbu H1..Hn) (dataviz: satu warna, garis 2 px, penanda >= 8 px berbingkai putih,
 * kisi samar, garis ambang putus-putus berlabel). Penanda versi ("v4 berlaku") berupa garis tegak berlabel.
 * Lebar viewBox mengikuti lebar wadah (1 satuan = 1 px) sehingga teks sumbu tetap 12 px di ponsel maupun di sheet.
 * Papan ketik: satu perhentian Tab, panah kiri/kanan (Home/End) berpindah hari, nilai dibacakan dan tampil di tooltip; tabel yang
 * sama tersedia di "Lihat sebagai tabel".
 */
export function GarisHarian({
  judul,
  titik,
  ambang,
  penanda = [],
  ringkasan,
  jumlahHari = 0,
}: {
  judul: string;
  titik: TitikHarian[];
  ambang?: number;
  penanda?: { hari: number; label: string }[];
  ringkasan: string;
  /** lebar sumbu dalam hari (mis. lama masa penilaian), supaya hari yang belum berjalan tetap tampil */
  jumlahHari?: number;
}) {
  const id = useId();
  const wadah = useRef<HTMLDivElement>(null);
  const titikRef = useRef<(SVGGElement | null)[]>([]);
  const [lebar, setLebar] = useState(640);
  const [arah, setArah] = useState<number | null>(null);
  const [fokus, setFokus] = useState<number | null>(null);
  const [indeksTab, setIndeksTab] = useState(Math.max(0, titik.length - 1));

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const ukur = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setLebar(w);
    };
    ukur();
    const pengamat = new ResizeObserver(ukur);
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  if (!titik.length) return <p className="text-sm text-teks-redup">Belum ada penilaian final untuk digambar.</p>;

  const L = Math.max(280, lebar);
  const hariMaks = Math.max(jumlahHari, ...titik.map((t) => t.hari), ...penanda.map((p) => p.hari));
  const terendah = Math.min(...titik.map((t) => t.persen), ambang ?? 100);
  const bawah = Math.max(0, Math.floor((terendah - 10) / 10) * 10);
  const lebarPlot = L - M.kiri - M.kanan;
  const tinggi = T - M.atas - M.bawah;
  const langkah = lebarPlot / Math.max(1, hariMaks);
  const x = (hari: number) => M.kiri + (hari - 0.5) * langkah;
  const y = (p: number) => M.atas + ((100 - p) / (100 - bawah)) * tinggi;
  const kisi = Array.from({ length: (100 - bawah) / 10 + 1 }, (_, i) => bawah + i * 10);
  const jarangLabel = langkah < 36;
  const aktif = fokus ?? arah;
  const titikAktif = aktif === null ? null : titik[aktif];

  function tekan(e: React.KeyboardEvent) {
    const sekarang = fokus ?? indeksTab;
    const ke =
      e.key === "ArrowRight" ? Math.min(titik.length - 1, sekarang + 1) : e.key === "ArrowLeft" ? Math.max(0, sekarang - 1) : e.key === "Home" ? 0 : e.key === "End" ? titik.length - 1 : null;
    if (ke === null) return;
    e.preventDefault();
    setIndeksTab(ke);
    titikRef.current[ke]?.focus();
  }

  return (
    <figure className="max-w-3xl">
      <figcaption id={`${id}-judul`} className="mb-2 text-sm font-semibold text-primer-800">
        {judul}
      </figcaption>
      <div ref={wadah} className="relative">
        <svg width={L} height={T} viewBox={`0 0 ${L} ${T}`} className="block max-w-full" role="group" aria-labelledby={`${id}-judul`} aria-describedby={`${id}-ringkas`} onKeyDown={tekan}>
          {kisi.map((g) => (
            <g key={g}>
              <line x1={M.kiri} x2={L - M.kanan} y1={y(g)} y2={y(g)} className="stroke-abu-100" strokeWidth={1} />
              {g % 20 === 0 || g === bawah ? (
                <text x={M.kiri - 8} y={y(g)} dy="0.32em" textAnchor="end" className="fill-teks-redup text-xs">
                  {g}%
                </text>
              ) : null}
            </g>
          ))}
          {Array.from({ length: hariMaks }, (_, i) => i + 1).map((m) =>
            !jarangLabel || m % 2 === 1 || m === hariMaks ? (
              <text key={m} x={x(m)} y={T - 10} textAnchor="middle" className="fill-teks-redup text-xs">
                H{m}
              </text>
            ) : null,
          )}
          {ambang !== undefined ? (
            <g>
              <line x1={M.kiri} x2={L - M.kanan} y1={y(ambang)} y2={y(ambang)} className="stroke-abu-600" strokeWidth={1} strokeDasharray="4 4" />
              <text x={L - M.kanan} y={y(ambang) - 6} textAnchor="end" className="fill-abu-700 text-xs">
                ambang {ambang}%
              </text>
            </g>
          ) : null}
          {penanda.map((p) => (
            <g key={p.label}>
              <line x1={x(p.hari) - langkah / 2} x2={x(p.hari) - langkah / 2} y1={M.atas - 6} y2={T - M.bawah} className="stroke-abu-600" strokeWidth={1} strokeDasharray="2 3" />
              <text x={x(p.hari) - langkah / 2 + 4} y={M.atas - 8} className="fill-abu-700 text-xs font-semibold">
                {p.label}
              </text>
            </g>
          ))}
          <polyline points={titik.map((t) => `${x(t.hari)},${y(t.persen)}`).join(" ")} fill="none" className="stroke-primer-700" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {titik.map((t, i) => (
            <g
              key={t.hari}
              ref={(el) => {
                titikRef.current[i] = el;
              }}
              tabIndex={i === indeksTab ? 0 : -1}
              role="img"
              aria-label={`Hari ${t.hari}: ${persen(t.persen)} disetujui dari ${formatAngka(t.jumlah)} hasil`}
              onMouseEnter={() => setArah(i)}
              onMouseLeave={() => setArah(null)}
              onFocus={() => {
                setFokus(i);
                setIndeksTab(i);
              }}
              onBlur={() => setFokus(null)}
              className="cursor-default outline-none"
            >
              <rect x={x(t.hari) - langkah / 2} y={M.atas} width={langkah} height={tinggi} fill="transparent" />
              {aktif === i ? <line x1={x(t.hari)} x2={x(t.hari)} y1={M.atas} y2={T - M.bawah} className="stroke-primer-200" strokeWidth={1} /> : null}
              {fokus === i ? (
                <>
                  <circle cx={x(t.hari)} cy={y(t.persen)} r={11} className="fill-none stroke-white" strokeWidth={4} />
                  <circle cx={x(t.hari)} cy={y(t.persen)} r={10} className="fill-none stroke-primer-400" strokeWidth={3} />
                </>
              ) : null}
              <circle cx={x(t.hari)} cy={y(t.persen)} r={aktif === i ? 6 : 4.5} className="fill-primer-700 stroke-white" strokeWidth={2} />
            </g>
          ))}
        </svg>
        {titikAktif ? (
          <div
            role="presentation"
            aria-hidden
            className="pointer-events-none absolute z-10 w-max -translate-x-1/2 -translate-y-full rounded-md border border-primer-200 bg-white px-2.5 py-1.5 text-xs shadow-sm"
            style={{ left: Math.min(L - 64, Math.max(64, x(titikAktif.hari))), top: y(titikAktif.persen) - 12 }}
          >
            <p className="font-semibold text-primer-900">Hari {titikAktif.hari}</p>
            <p className="angka text-primer-900">{persen(titikAktif.persen)} disetujui</p>
            <p className="angka text-teks-redup">{formatAngka(titikAktif.jumlah)} hasil</p>
          </div>
        ) : null}
      </div>
      <p id={`${id}-ringkas`} className="mt-1 text-sm text-teks-redup">
        {ringkasan}
      </p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-semibold text-primer-800">Lihat sebagai tabel</summary>
        <table className="mt-2 w-full max-w-sm text-left">
          <thead>
            <tr className="text-xs text-teks-redup">
              <th scope="col" className="py-1 font-semibold">
                Hari
              </th>
              <th scope="col" className="py-1 text-right font-semibold">
                Disetujui
              </th>
              <th scope="col" className="py-1 text-right font-semibold">
                Hasil
              </th>
            </tr>
          </thead>
          <tbody>
            {titik.map((t) => (
              <tr key={t.hari} className="border-t border-primer-100">
                <td className="py-1">{t.hari}</td>
                <td className="angka py-1 text-right">{persen(t.persen)}</td>
                <td className="angka py-1 text-right">{formatAngka(t.jumlah)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
