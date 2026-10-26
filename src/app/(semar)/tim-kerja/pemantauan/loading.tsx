import { KepalaHalaman } from "@/components/ui";

/** Kerangka J-05 selama laporan dihitung: kepala, pilihan, angka ringkas, dan daftar Perlu perhatian setinggi aslinya. */
export default function Memuat() {
  return (
    <>
      <KepalaHalaman kode="J-05" judul="Pemantauan Kesesuaian" keterangan="Butir mana yang rekomendasinya sering dikoreksi reviewer atau sering gagal saat pengajuan." remah={[{ label: "Pemantauan Kesesuaian" }]} />
      <div role="status" aria-live="polite">
        <p className="sr-only">Memuat laporan pemantauan…</p>
        <div className="flex flex-wrap gap-3">
          <div className="h-[4.5rem] w-full max-w-sm rounded-md bg-abu-50" />
          <div className="h-[4.5rem] w-full max-w-64 rounded-md bg-abu-50" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-primer-100 py-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-28 rounded bg-abu-100" />
              <div className="h-7 w-20 rounded bg-abu-100" />
              <div className="h-3 w-32 rounded bg-abu-50" />
            </div>
          ))}
        </div>
        <div className="mt-2 h-5 w-80 max-w-full rounded bg-abu-50" />
        <div className="mt-8 h-6 w-40 rounded bg-abu-100" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-20 rounded bg-abu-50" />
          ))}
        </div>
      </div>
    </>
  );
}
