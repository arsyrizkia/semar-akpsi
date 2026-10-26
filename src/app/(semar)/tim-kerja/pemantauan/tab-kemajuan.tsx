import { AlertTriangle, CircleCheck } from "lucide-react";
import { Badge, TBody, TD, TH, THead, TR, Table, type WarnaBadge } from "@/components/ui";
import type { HasilKemajuan } from "@/lib/pemantauan/kemajuan";
import { formatPersen } from "@/lib/pemantauan/rekap";
import { formatTenggat, kapasitasPerHari, teksSisa, type ParamMasa, type StatusJadwal } from "@/lib/penilaian/masa";
import { cn, formatAngka } from "@/lib/utils";

const desimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const WARNA_STATUS: Record<StatusJadwal, WarnaBadge> = { Tertinggal: "bata", "Di bawah jadwal": "peringatan", "Sesuai jadwal": "netral", Selesai: "daun" };
const TAMPIL_REVIEWER = 15;

/** Kalimat posisi masa penilaian, dipakai juga di kepala J-05. */
export function kalimatMasa(k: HasilKemajuan, sekarang: Date): string | null {
  if (!k.dimulai || !k.posisi || !k.tenggat) return null;
  const sisa = teksSisa(k.posisi, sekarang, k.tenggat);
  return k.posisi.lewat ? `Masa penilaian berakhir ${formatTenggat(k.tenggat)} (${sisa})` : `Hari ke-${k.posisi.hariKe} dari ${k.posisi.lama} · tenggat ${formatTenggat(k.tenggat)} (${sisa})`;
}

/**
 * Tab "Kemajuan Penilaian" J-05: posisi hari, proyeksi selesai dengan laju sejauh ini, grafik penilaian final kumulatif per hari terhadap
 * jadwal merata, dan reviewer yang tertinggal. Seluruh skema periode dihitung bersama (beban reviewer lintas skema).
 */
export function TabKemajuan({ k, masa, sekarang }: { k: HasilKemajuan; masa: ParamMasa; sekarang: Date }) {
  if (!k.dimulai || !k.posisi || !k.proyeksi || !k.tenggat) {
    return <p className="text-sm text-teks-redup">Masa penilaian periode ini belum dimulai. Masa dimulai saat Tim Kerja menetapkan penugasan reviewer (J-04b).</p>;
  }
  const { posisi, proyeksi } = k;
  const tertinggal = k.reviewer.filter((r) => r.status === "Tertinggal" || r.status === "Di bawah jadwal");
  const tampil = (tertinggal.length ? tertinggal : k.reviewer.filter((r) => r.status !== "Selesai")).slice(0, TAMPIL_REVIEWER);
  const sisaBaris = k.reviewer.length - tampil.length;
  const maks = Math.max(1, k.total);
  const ringkasGrafik = `${formatAngka(k.final)} dari ${formatAngka(k.total)} penugasan final sampai hari ke-${posisi.hariKe}; jadwal merata hari itu ${formatAngka(
    k.harian[Math.max(0, posisi.hariKe - 1)]?.jadwal ?? 0,
  )}.`;

  return (
    <div className="space-y-10">
      <section aria-labelledby="judul-proyeksi" className="max-w-3xl">
        <h3 id="judul-proyeksi" className="mb-2 text-sm font-semibold text-primer-900">
          {kalimatMasa(k, sekarang)}
        </h3>
        <p className={cn("flex items-start gap-2 text-sm", proyeksi.tepatWaktu ? "text-primer-900" : "font-medium text-bata-700")}>
          {proyeksi.tepatWaktu ? <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-daun-600" /> : <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />}
          <span>
            Semua skema: <span className="angka">{formatAngka(k.final)}</span> dari <span className="angka">{formatAngka(k.total)}</span> penugasan sudah final ({formatPersen(k.persen)}).{" "}
            {k.final >= k.total
              ? "Semua penugasan selesai."
              : posisi.lewat
                ? `Tenggat sudah lewat; ${formatAngka(proyeksi.kurang)} penugasan belum final.`
                : proyeksi.tepatWaktu
                  ? `Dengan laju ${desimal.format(proyeksi.lajuPerHari)} per hari, semua diperkirakan final sebelum tenggat.`
                  : `Dengan laju ${desimal.format(proyeksi.lajuPerHari)} per hari, diperkirakan ${formatAngka(proyeksi.perkiraanFinal)} final pada tenggat: kurang ±${formatAngka(proyeksi.kurang)}. Dibutuhkan ${desimal.format(proyeksi.lajuDibutuhkan)} per hari.`}
          </span>
        </p>
      </section>

      <section aria-labelledby="judul-harian">
        <h3 id="judul-harian" className="mb-1 text-sm font-semibold text-primer-900">
          Penilaian final kumulatif per hari
        </h3>
        <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-teks-redup">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block size-3 rounded-[2px] bg-primer-700" /> Final kumulatif
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block w-4 border-t-2 border-dashed border-abu-600" /> Jadwal merata
          </span>
        </p>
        <div role="img" aria-label={ringkasGrafik} className="flex max-w-3xl items-end gap-2">
          {k.harian.map((h) => {
            const hariIni = !posisi.lewat && h.hari === posisi.hariKe;
            return (
              <div key={h.hari} aria-hidden className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="angka h-4 text-xs text-primer-900">{h.berjalan ? formatAngka(h.kumulatif) : ""}</span>
                <div
                  className={cn("relative h-40 w-full rounded-t-[4px]", h.berjalan ? "bg-abu-100" : "border border-dashed border-primer-200")}
                  title={h.berjalan ? `Hari ${h.hari}: ${formatAngka(h.kumulatif)} final (${formatAngka(h.final)} hari itu); jadwal ${formatAngka(h.jadwal)}` : `Hari ${h.hari}: belum berjalan; jadwal ${formatAngka(h.jadwal)}`}
                >
                  {h.berjalan ? <span className="absolute inset-x-0 bottom-0 rounded-t-[4px] bg-primer-700" style={{ height: `${(h.kumulatif / maks) * 100}%` }} /> : null}
                  <span className="absolute inset-x-0 border-t-2 border-dashed border-abu-600" style={{ bottom: `${(h.jadwal / maks) * 100}%` }} />
                </div>
                <span className={cn("text-xs", hariIni ? "font-semibold text-primer-900" : "text-teks-redup")}>
                  H{h.hari}
                  {hariIni ? " · hari ini" : ""}
                </span>
              </div>
            );
          })}
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-primer-800">Lihat sebagai tabel</summary>
          <table className="mt-2 w-full max-w-md text-left">
            <thead>
              <tr className="text-xs text-teks-redup">
                <th scope="col" className="py-1 font-semibold">Hari</th>
                <th scope="col" className="py-1 text-right font-semibold">Final hari itu</th>
                <th scope="col" className="py-1 text-right font-semibold">Kumulatif</th>
                <th scope="col" className="py-1 text-right font-semibold">Jadwal merata</th>
              </tr>
            </thead>
            <tbody>
              {k.harian.map((h) => (
                <tr key={h.hari} className="border-t border-primer-100">
                  <td className="py-1">{h.hari}</td>
                  <td className="angka py-1 text-right">{h.berjalan ? formatAngka(h.final) : "-"}</td>
                  <td className="angka py-1 text-right">{h.berjalan ? formatAngka(h.kumulatif) : "-"}</td>
                  <td className="angka py-1 text-right">{formatAngka(h.jadwal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section aria-labelledby="judul-reviewer">
        <h3 id="judul-reviewer" className="mb-1 text-sm font-semibold text-primer-900">
          Reviewer
        </h3>
        <p className="mb-3 max-w-3xl text-xs text-teks-redup">
          {(["Tertinggal", "Di bawah jadwal", "Sesuai jadwal", "Selesai"] as const).map((s, i) => (
            <span key={s}>
              {i ? " · " : ""}
              {s} <span className="angka font-semibold text-primer-900">{formatAngka(k.jumlahStatus[s])}</span>
            </span>
          ))}
          . Tertinggal: sisa penugasan melebihi kapasitas hari tersisa ({desimal.format(kapasitasPerHari(masa))} proposal per hari pada {desimal.format(masa.jamPerHari)} jam). Di bawah jadwal: yang
          selesai kurang dari jadwal merata sampai kemarin.
        </p>
        {tampil.length ? (
          <Table aria-label="Reviewer menurut status jadwal">
            <THead>
              <TR>
                <TH>Reviewer</TH>
                <TH>Institusi</TH>
                <TH angka>Selesai</TH>
                <TH angka>Sisa</TH>
                <TH angka>Perlu per Hari</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {tampil.map((r) => (
                <TR key={r.reviewerId}>
                  <TD className="font-medium">{r.nama}</TD>
                  <TD>{r.institusi ?? "-"}</TD>
                  <TD angka>
                    {formatAngka(r.selesai)} dari {formatAngka(r.beban)}
                  </TD>
                  <TD angka>{formatAngka(r.sisa)}</TD>
                  <TD angka>{Number.isFinite(r.perluPerHari) ? desimal.format(r.perluPerHari) : "-"}</TD>
                  <TD>
                    <Badge warna={WARNA_STATUS[r.status]}>{r.status}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <p className="text-sm text-teks-redup">Semua reviewer sudah menyelesaikan penugasannya.</p>
        )}
        {sisaBaris > 0 ? (
          <p className="mt-2 text-xs text-teks-redup">
            {formatAngka(sisaBaris)} reviewer lain {tertinggal.length ? "sesuai jadwal atau sudah selesai" : "sudah selesai"} tidak ditampilkan.
          </p>
        ) : null}
      </section>
    </div>
  );
}
