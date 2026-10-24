import { Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { LampiranTemplat } from "@/lib/templat/paket";

/** Tab Lampiran (J-02a): lampiran wajib dan jenisnya; pengaturan lengkap ada di M-13. */
export function TabLampiran({
  lampiran,
  definisi,
  bisaSunting,
  galat,
  saatAtur,
  saatHapus,
  saatTambah,
}: {
  lampiran: string[];
  definisi: LampiranTemplat[];
  bisaSunting: boolean;
  /** indeks lampiran yang namanya kosong, hanya diisi setelah percobaan Terbitkan */
  galat: boolean[];
  saatAtur: (i: number) => void;
  saatHapus: (i: number) => void;
  saatTambah: () => void;
}) {
  return (
    <div>
      {lampiran.length === 0 ? <p className="text-sm text-teks-redup">{bisaSunting ? "Belum ada lampiran wajib." : "Tidak ada lampiran wajib."}</p> : null}
      <ul className="divide-y divide-primer-100 rounded-md border border-primer-200 bg-white empty:hidden">
        {lampiran.map((l, i) => (
          <li key={i} className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 ${galat[i] ? "bg-bata-100" : ""}`}>
            <span className="min-w-0 flex-1 text-sm font-medium">
              {l.trim() || <span className="text-bata-600">Nama lampiran wajib diisi</span>}
            </span>
            <Badge>{(definisi[i]?.jenis ?? "unggahan") === "formulir" ? "Formulir bertemplat" : "Unggahan bebas"}</Badge>
            {bisaSunting ? (
              <span className="flex gap-1">
                <Button varian="sekunder" ukuran="sm" aria-label={`Atur Templat Lampiran ${i + 1}`} onClick={() => saatAtur(i)}>
                  <SlidersHorizontal aria-hidden className="size-4" /> Atur Templat Lampiran
                </Button>
                <Button varian="hantu" ukuran="sm" className="text-bata-700 hover:bg-bata-100" aria-label={`Hapus lampiran ${i + 1}`} onClick={() => saatHapus(i)}>
                  <Trash2 aria-hidden className="size-4" /> Hapus
                </Button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {bisaSunting ? (
        <Button varian="sekunder" ukuran="sm" className="mt-3" onClick={saatTambah}>
          <Plus aria-hidden className="size-4" /> Tambah Lampiran
        </Button>
      ) : null}
    </div>
  );
}
