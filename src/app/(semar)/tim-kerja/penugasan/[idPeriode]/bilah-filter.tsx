"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Combobox, KotakCentang, Pilihan } from "@/components/ui";
import type { FasetUsulan } from "@/lib/penugasan/layanan";
import { UKURAN_PER_HALAMAN, type FilterUsulan } from "@/lib/penugasan/periode";

const angka = new Intl.NumberFormat("id-ID");

/**
 * Bilah filter tab Usulan Penugasan dan Sudah Ditetapkan (J-04b). Semua pilihan tersimpan di URL (q, rev, inst, skema, syarat, urut,
 * per) sehingga Back dan tautan mempertahankannya; setiap perubahan mengembalikan ke halaman 1. Pencarian ditunda 300 ms dan memakai
 * router.replace supaya setiap ketikan tidak menambah riwayat; pilihan lain memakai router.push.
 */
export function BilahFilter({ faset, filter, ukuran, jenis }: { faset: FasetUsulan; filter: FilterUsulan; ukuran: number; jenis: "usulan" | "ditetapkan" }) {
  const router = useRouter();
  const jalur = usePathname();
  const cari = useSearchParams();
  const [memuat, mulai] = useTransition();
  const [q, setQ] = useState(filter.q);
  const qTerakhir = useRef(filter.q);

  function ke(ubah: Record<string, string | null>, ganti = false) {
    const p = new URLSearchParams(cari.toString());
    for (const [k, v] of Object.entries(ubah)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    p.delete("hal");
    p.delete("tetap");
    p.delete("susun");
    const alamat = `${jalur}?${p.toString()}`;
    mulai(() => (ganti ? router.replace(alamat, { scroll: false }) : router.push(alamat, { scroll: false })));
  }

  // pencarian ditunda; nilai dari URL (Back/hapus filter) menimpa isian lokal
  useEffect(() => {
    if (q === qTerakhir.current) return;
    const t = setTimeout(() => {
      qTerakhir.current = q;
      ke({ q: q.trim() || null }, true);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  useEffect(() => {
    qTerakhir.current = filter.q;
    setQ(filter.q);
  }, [filter.q]);

  const adaFilter = Boolean(filter.q || filter.rev || filter.inst || filter.skema || filter.melanggar);
  return (
    <div role="search" aria-label="Saring usulan" className="mb-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1.4fr)_minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(9rem,0.7fr)]">
        <div>
          <label htmlFor="cari-usulan" className="mb-1 block text-sm font-semibold text-primer-800">
            Cari
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primer-600" />
            <input
              id="cari-usulan"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Judul, ID proposal, atau nama pengusul"
              autoComplete="off"
              className="h-10 w-full rounded-md border border-primer-400 bg-white pl-9 pr-3 text-primer-900 placeholder:text-primer-600 focus-visible:outline-primer-400"
            />
          </div>
        </div>
        <Combobox
          label="Reviewer"
          bolehKosong
          labelKosong="Semua reviewer"
          nilai={filter.rev ?? ""}
          saatUbah={(v) => ke({ rev: v || null })}
          opsi={faset.reviewer.map((r) => ({ nilai: r.id, label: r.nama, keterangan: `${r.institusi} · ${angka.format(r.jumlah)} proposal` }))}
        />
        <Pilihan label="Institusi Pengusul" value={filter.inst ?? ""} onChange={(e) => ke({ inst: e.target.value || null })}>
          <option value="">Semua institusi</option>
          {faset.institusi.map((i) => (
            <option key={i.nama} value={i.nama}>
              {i.nama} ({angka.format(i.jumlah)})
            </option>
          ))}
        </Pilihan>
        <Pilihan label="Skema" value={filter.skema ?? ""} onChange={(e) => ke({ skema: e.target.value || null })}>
          <option value="">Semua skema</option>
          {faset.skema.map((s) => (
            <option key={s.kode} value={s.kode}>
              {s.nama} ({angka.format(s.jumlah)})
            </option>
          ))}
        </Pilihan>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {jenis === "usulan" ? (
            <KotakCentang
              label={`Hanya yang melanggar syarat (${angka.format(faset.melanggar)})`}
              checked={filter.melanggar}
              disabled={!filter.melanggar && faset.melanggar === 0}
              onCheckedChange={(c) => ke({ syarat: c === true ? "melanggar" : null })}
            />
          ) : null}
          {adaFilter ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                qTerakhir.current = "";
                ke({ q: null, rev: null, inst: null, skema: null, syarat: null });
              }}
              className="cursor-pointer text-sm font-semibold text-primer-800 underline underline-offset-2 hover:text-primer-900"
            >
              Hapus filter
            </button>
          ) : null}
          {memuat ? (
            <span role="status" className="inline-flex items-center gap-1.5 text-sm text-teks-redup">
              <Loader2 aria-hidden className="size-4 animate-spin" /> Memuat…
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Pilihan label="Urutkan" value={filter.urut} onChange={(e) => ke({ urut: e.target.value === "id" ? null : e.target.value })} className="w-44">
            <option value="id">ID proposal</option>
            <option value="judul">Judul</option>
            <option value="reviewer">Reviewer</option>
            <option value="institusi">Institusi pengusul</option>
          </Pilihan>
          <Pilihan label="Per halaman" value={String(ukuran)} onChange={(e) => ke({ per: e.target.value === "50" ? null : e.target.value })} className="w-28">
            {UKURAN_PER_HALAMAN.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Pilihan>
        </div>
      </div>
    </div>
  );
}
