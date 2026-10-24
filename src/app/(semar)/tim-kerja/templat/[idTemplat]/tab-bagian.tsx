import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { mentahKeBagian, type BarisBagianMentah, type HasilKelengkapan } from "@/lib/templat/kelengkapan";
import { hurufBagian, ringkasKetentuan } from "@/lib/templat/isian-substansi";

/** Tab Bagian (J-02a): baris sederhana bagian A-H dan tambahan; semua isian bagian ada di M-12. */
export function TabBagian({
  bagian,
  bisaSunting,
  tandai,
  kelengkapan,
  sorotNama,
  saatUbah,
  saatHapus,
  saatGeser,
  saatTambah,
}: {
  bagian: BarisBagianMentah[];
  bisaSunting: boolean;
  tandai: boolean;
  kelengkapan: HasilKelengkapan;
  sorotNama?: string | null;
  saatUbah: (i: number) => void;
  saatHapus: (i: number) => void;
  saatGeser: (i: number, arah: -1 | 1) => void;
  saatTambah: () => void;
}) {
  return (
    <div>
      <Table>
        <THead>
          <TR>
            <TH>Kode</TH>
            <TH>Nama Bagian</TH>
            <TH>Ketentuan</TH>
            <TH>Wajib</TH>
            {bisaSunting ? (
              <TH>
                <span className="sr-only">Aksi</span>
              </TH>
            ) : null}
          </TR>
        </THead>
        <TBody>
          {bagian.length === 0 ? (
            <TR>
              <TD colSpan={bisaSunting ? 5 : 4} className={tandai && kelengkapan.tanpaBagian ? "py-6 text-center font-medium text-bata-600" : "py-6 text-center text-teks-redup"}>
                {bisaSunting ? "Belum ada bagian. Tekan “Tambah Bagian”." : "Templat ini belum memiliki bagian."}
              </TD>
            </TR>
          ) : null}
          {bagian.map((b, i) => {
            const k = kelengkapan.bagian[i];
            const bermasalah = tandai && Boolean(k?.nama || k?.batas || k?.ketentuan);
            return (
              <TR key={i} tersorot={sorotNama != null && sorotNama === b.nama} className={bermasalah ? "bg-bata-100" : undefined} data-tanda={bermasalah ? "ya" : undefined}>
                <TD className="w-14 font-semibold">{hurufBagian(i)}</TD>
                <TD className="min-w-48">
                  {b.nama.trim() || <span className="text-teks-redup">(tanpa nama)</span>}
                  {bermasalah ? <p className="mt-1 text-xs font-medium text-bata-600">Lengkapi isian yang ditandai: buka Ubah</p> : null}
                </TD>
                <TD>
                  <span className="flex flex-wrap gap-1">
                    {ringkasKetentuan(mentahKeBagian(b)).map((c) => (
                      <Badge key={c}>{c}</Badge>
                    ))}
                  </span>
                </TD>
                <TD className="whitespace-nowrap">{b.wajib ? "Ya" : "Tidak"}</TD>
                {bisaSunting ? (
                  <TD>
                    <span className="flex flex-wrap justify-end gap-1">
                      <Button varian="hantu" ukuran="sm" aria-label={`Naikkan bagian ${hurufBagian(i)}`} disabled={i === 0} onClick={() => saatGeser(i, -1)}>
                        <ArrowUp aria-hidden className="size-4" />
                      </Button>
                      <Button varian="hantu" ukuran="sm" aria-label={`Turunkan bagian ${hurufBagian(i)}`} disabled={i === bagian.length - 1} onClick={() => saatGeser(i, 1)}>
                        <ArrowDown aria-hidden className="size-4" />
                      </Button>
                      <Button varian="sekunder" ukuran="sm" aria-label={`Ubah bagian ${hurufBagian(i)}`} onClick={() => saatUbah(i)}>
                        <Pencil aria-hidden className="size-4" /> Ubah
                      </Button>
                      <Button varian="hantu" ukuran="sm" className="text-bata-700 hover:bg-bata-100" aria-label={`Hapus bagian ${hurufBagian(i)}`} onClick={() => saatHapus(i)}>
                        <Trash2 aria-hidden className="size-4" /> Hapus
                      </Button>
                    </span>
                  </TD>
                ) : null}
              </TR>
            );
          })}
        </TBody>
      </Table>
      {bisaSunting ? (
        <Button varian="sekunder" ukuran="sm" className="mt-3" onClick={saatTambah}>
          <Plus aria-hidden className="size-4" /> Tambah Bagian
        </Button>
      ) : null}
    </div>
  );
}
