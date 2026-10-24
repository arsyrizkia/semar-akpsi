import { KotakCentang } from "@/components/ui";
import { BAGIAN_DEPAN, type KopTemplat } from "@/lib/templat/paket";

/** Tab Halaman Depan (J-02a): kop berformat baku (hanya-baca) dan sakelar halaman depan 1-6 yang disertakan. */
export function TabDepan({ kop, kepalaJudul, kepalaSubjudul, bisaSunting, saatUbah }: { kop: KopTemplat; kepalaJudul: string; kepalaSubjudul: string; bisaSunting: boolean; saatUbah: (ubah: Partial<KopTemplat>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-sm">
        <p className="mb-1 text-xs font-semibold text-teks-redup">Kop (format baku, hanya-baca)</p>
        <p className="font-semibold text-primer-900">{kop.lembaga}</p>
        <p className="text-teks-redup">{kop.alamat}</p>
        <p className="text-teks-redup">{kop.laman}</p>
        <p className="mt-3 font-semibold text-primer-900">{kepalaJudul}</p>
        {kepalaSubjudul ? <p className="font-semibold text-primer-900">{kepalaSubjudul}</p> : null}
      </div>
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
