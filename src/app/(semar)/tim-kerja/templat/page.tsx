import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Bagian, KeadaanKosong, KepalaHalaman, kelasTombol, LencanaStatus, Table, TBody, TD, TH, THead, TombolUnduh, TR } from "@/components/ui";
import { wajibPengelola } from "@/lib/auth";
import { ambilDrafTemplat, ambilTemplatBerlaku, ambilTemplatPerId, daftarSkema, daftarVersiTemplat, type TemplatTampil } from "@/lib/templat/layanan";
import { hurufBagian } from "@/lib/templat/isian-substansi";
import { PESAN_DRAF_9A } from "@/lib/templat/status";
import { masaPengusulanBerjalan } from "@/lib/waktu";
import { formatAngka, formatTanggal } from "@/lib/utils";
import { PilihSkema } from "./pilih-skema";
import { TombolSusunVersi } from "./tombol-susun";

export const metadata: Metadata = { title: "J-02 Templat Proposal" };
export const dynamic = "force-dynamic";

type Param = { skema?: string; versi?: string; hasil?: string; jumlah?: string };

/** J-02 Templat Proposal (UC-01). Hanya Tim Kerja DPPM dengan hak pengelola (NFR 3.2). Pilihan skema dan versi tersimpan di URL. */
export default async function Halaman({ searchParams }: { searchParams: Promise<Param> }) {
  await wajibPengelola();
  const { skema: skemaParam, versi: versiParam, hasil, jumlah } = await searchParams;
  const [skema, masaBerjalan] = await Promise.all([daftarSkema(), masaPengusulanBerjalan()]);

  if (skema.length === 0) {
    return (
      <>
        <KepalaHalaman kode="J-02" judul="Templat Proposal" remah={[{ label: "Templat Proposal" }]} />
        <KeadaanKosong judul="Belum ada skema pendanaan">Jalankan &ldquo;Reset &amp; isi data demo&rdquo; di Pusat Demo.</KeadaanKosong>
      </>
    );
  }
  const skemaTerpilih = skema.find((s) => s.id === skemaParam) ?? skema[0];
  const [berlaku, draf, riwayat] = await Promise.all([ambilTemplatBerlaku(skemaTerpilih.id), ambilDrafTemplat(skemaTerpilih.id), daftarVersiTemplat(skemaTerpilih.id)]);

  // versi yang dilihat: pilihan di URL (harus milik skema ini), selain itu templat yang berlaku
  let dilihat: TemplatTampil | null = berlaku;
  if (versiParam) {
    const perId = await ambilTemplatPerId(versiParam);
    if (perId && perId.skemaId === skemaTerpilih.id) dilihat = perId.templat;
  }
  const jumlahButir = Number.parseInt(jumlah ?? "", 10);
  const urlSusun = (id: string) => `/tim-kerja/templat/${id}/susun`;
  const urlUnduh = (id: string) => `/api/semar/templat/${id}/unduh`;

  return (
    <>
      <KepalaHalaman
        kode="J-02"
        judul="Templat Proposal"
        keterangan="Bagian, batas kata, dan lampiran wajib per skema pendanaan."
        remah={[{ label: "Templat Proposal" }]}
        aksi={
          draf ? (
            <Link href={urlSusun(draf.id)} className={kelasTombol(hasil === "terbit" ? "sekunder" : "utama")}>Buka Draf Versi {draf.versi}</Link>
          ) : (
            <TombolSusunVersi skemaId={skemaTerpilih.id} sekunder={hasil === "terbit"} />
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-3">
        <PilihSkema skema={skema} skemaId={skemaTerpilih.id} />
        {masaBerjalan ? <p className="pb-2 text-sm text-teks-redup">Masa pengusulan sedang berjalan: templat baru disimpan sebagai draf untuk periode berikutnya.</p> : null}
      </div>

      {hasil === "terbit" && dilihat?.status === "Terbit" ? (
        <Alert jenis="sukses" judul={`Templat versi ${dilihat.versi} telah terbit`} className="mb-6">
          <p>
            {Number.isFinite(jumlahButir) ? `${formatAngka(jumlahButir)} butir cek draf dibuat dari templat ini. ` : ""}Tinjau butir itu di Aturan Pemeriksaan lalu simpan versi basis aturannya agar berlaku.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/tim-kerja/aturan?skema=${skemaTerpilih.id}`} className={kelasTombol("utama", "sm")}>Buka Aturan Pemeriksaan</Link>
          </div>
        </Alert>
      ) : null}
      {hasil === "draf" && dilihat?.status === "Draf" ? (
        <Alert jenis="peringatan" className="mb-6">
          <p>{PESAN_DRAF_9A}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={urlSusun(dilihat.id)} className={kelasTombol("sekunder", "sm")}>Buka Draf Versi {dilihat.versi}</Link>
            <TombolUnduh href={urlUnduh(dilihat.id)} ukuran="sm">
              Unduh Pratinjau (.docx)
            </TombolUnduh>
          </div>
        </Alert>
      ) : null}

      <Bagian
        judul={dilihat ? (dilihat.id === berlaku?.id ? `Templat Berlaku, Versi ${dilihat.versi}` : `Versi ${dilihat.versi} (${dilihat.status})`) : "Templat Berlaku"}
        aksi={
          dilihat ? (
            <TombolUnduh href={urlUnduh(dilihat.id)}>Unduh Templat (.docx)</TombolUnduh>
          ) : undefined
        }
      >
        {dilihat ? (
          <p className="mb-1 text-sm text-teks-redup">Struktur mengikuti Isian Substansi Proposal (bagian A sampai H).</p>
        ) : null}
        {dilihat ? (
          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-teks-redup">
            <span>{skemaTerpilih.namaSkema}</span>
            <LencanaStatus status={dilihat.status} />
            <span>
              Periode berlaku: <strong className="font-semibold text-primer-900">{dilihat.periodeBerlakuNama ?? "belum ditetapkan"}</strong>
            </span>
            {dilihat.diterbitkanPada ? <span>Terbit {formatTanggal(dilihat.diterbitkanPada)}</span> : null}
            {dilihat.id !== berlaku?.id && berlaku ? (
              <Link href={`/tim-kerja/templat?skema=${skemaTerpilih.id}`} className="font-semibold text-primer-800 underline underline-offset-2">
                Lihat templat berlaku
              </Link>
            ) : null}
          </p>
        ) : null}
        <Table>
          <THead>
            <TR>
              <TH angka>Urutan</TH>
              <TH>Nama Bagian</TH>
              <TH angka>Batas Kata</TH>
              <TH>Wajib</TH>
            </TR>
          </THead>
          <TBody>
            {dilihat && dilihat.bagian.length > 0 ? (
              dilihat.bagian.map((b) => (
                <TR key={b.urutan}>
                  <TD angka>{b.urutan}</TD>
                  <TD>{hurufBagian(b.urutan - 1)}. {b.nama}</TD>
                  <TD angka>{b.batasKata == null ? "Tanpa batas" : formatAngka(b.batasKata)}</TD>
                  <TD>{b.wajib ? "Ya" : "Tidak"}</TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={4} className="py-6 text-center text-teks-redup">
                  Skema ini belum memiliki templat
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
        {dilihat ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-primer-800">Lampiran Wajib</h3>
            {dilihat.lampiranWajib.length > 0 ? (
              <ul className="mt-1 list-inside list-disc text-sm">
                {dilihat.lampiranWajib.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-teks-redup">Tidak ada lampiran wajib.</p>
            )}
          </div>
        ) : null}
      </Bagian>

      <Bagian judul="Riwayat Versi">
        <Table>
          <THead>
            <TR>
              <TH angka>Versi</TH>
              <TH>Status</TH>
              <TH>Periode Berlaku</TH>
              <TH>Diterbitkan</TH>
              <TH angka>Bagian</TH>
              <TH>
                <span className="sr-only">Aksi</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {riwayat.length === 0 ? (
              <TR>
                <TD colSpan={6} className="py-6 text-center text-teks-redup">
                  Belum ada versi templat untuk skema ini.
                </TD>
              </TR>
            ) : null}
            {riwayat.map((v) => (
              <TR key={v.id} tersorot={dilihat?.id === v.id}>
                <TD angka className="font-semibold">
                  <Link href={`/tim-kerja/templat?skema=${skemaTerpilih.id}&versi=${v.id}`} className="underline underline-offset-2">
                    {v.versi}
                  </Link>
                </TD>
                <TD>
                  <LencanaStatus status={v.status} />
                </TD>
                <TD>{v.periodeBerlakuNama ?? "-"}</TD>
                <TD>{formatTanggal(v.diterbitkanPada)}</TD>
                <TD angka>{v.jumlahBagian}</TD>
                <TD>
                  <span className="flex flex-wrap justify-end gap-2">
                    {v.status === "Draf" ? (
                      <Link href={urlSusun(v.id)} className={kelasTombol("hantu", "sm")}>Buka Draf</Link>
                    ) : (
                      <Link href={`/tim-kerja/templat?skema=${skemaTerpilih.id}&versi=${v.id}`} className={kelasTombol("hantu", "sm")}>
                          Lihat<span className="sr-only"> versi {v.versi}</span>
                        </Link>
                    )}
                    <TombolUnduh href={urlUnduh(v.id)} ukuran="sm">
                      Unduh Templat (.docx)
                      <span className="sr-only"> versi {v.versi}</span>
                    </TombolUnduh>
                  </span>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Bagian>
    </>
  );
}
