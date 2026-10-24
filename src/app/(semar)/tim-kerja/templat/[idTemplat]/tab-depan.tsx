import { KotakCentang } from "@/components/ui";
import { BAGIAN_DEPAN, type KopTemplat } from "@/lib/templat/paket";

/**
 * Tab Halaman Depan (J-02a): sakelar halaman depan 1-6 yang disertakan.
 * Kop dan kepala dokumen adalah format baku dan hanya muncul di .docx, jadi tidak ditampilkan di sini.
 */
export function TabDepan({ kop, bisaSunting, saatUbah }: { kop: KopTemplat; kepalaJudul: string; kepalaSubjudul: string; bisaSunting: boolean; saatUbah: (ubah: Partial<KopTemplat>) => void }) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-primer-800">Halaman yang Disertakan</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BAGIAN_DEPAN.map((d, i) => (
            <KotakCentang
              key={d.kunci}
              id={`depan-${d.kunci}`}
              label={`${i + 1}. ${d.judul}`}
              checked={kop.depan[d.kunci]}
              disabled={!bisaSunting}
              onCheckedChange={(v) => saatUbah({ depan: { ...kop.depan, [d.kunci]: v === true } })}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
