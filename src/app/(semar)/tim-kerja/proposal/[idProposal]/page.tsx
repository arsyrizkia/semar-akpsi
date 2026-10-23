import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Bagian, BarKeyakinan, KeadaanKosong, KepalaHalaman, StatusBadge, Table, TBody, TD, TH, THead, TR, TombolUnduh, kelasTombol } from "@/components/ui";
import { wajibTimKerja } from "@/lib/auth";
import { ambilRincianProposal } from "@/lib/pemantauan/proposal";
import { ringkasHasil, statusPenilaianDariLabel, urutkanHasil } from "@/lib/pemantauan/rincian-proposal";
import { formatAngka, formatWaktu } from "@/lib/utils";

export const metadata: Metadata = { title: "J-05b Rincian Proposal" };
export const dynamic = "force-dynamic";

const ukuranBerkas = (b: number) => (b >= 1_048_576 ? `${(b / 1_048_576).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** J-05b Rincian Proposal: identitas, versi pengajuan, hasil pemeriksaan, penugasan, status penilaian beserta koreksi, dan berkas. Hanya baca. */
export default async function Halaman({ params }: { params: Promise<{ idProposal: string }> }) {
  const sesi = await wajibTimKerja();
  const { idProposal } = await params;
  const p = await ambilRincianProposal(decodeURIComponent(idProposal));
  if (!p) notFound();

  const urut = urutkanHasil(p.hasil);
  const deterministik = urut.filter((h) => h.jenis === "deterministik");
  const semantik = urut.filter((h) => h.jenis === "semantik");
  const ringkas = ringkasHasil(p.hasil);
  const tautanPemantauan = `/tim-kerja/pemantauan?periode=${p.periode.id}&skema=${p.skema.id}`;
  const tautanButirJ03 = (kode: string) => `/tim-kerja/aturan?skema=${p.skema.id}&periode=${p.periode.id}&butir=${encodeURIComponent(kode)}`;
  const unduh = (idBerkas: string) => `/api/semar/proposal/${encodeURIComponent(p.idProposal)}/berkas/${idBerkas}`;
  const tautan = "text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2";

  return (
    <>
      <KepalaHalaman
        kode="J-05b"
        judul="Rincian Proposal"
        keterangan={p.idProposal}
        remah={[{ label: "Pemantauan Kesesuaian", href: tautanPemantauan }, { label: p.idProposal }]}
        aksi={
          <Link href={tautanPemantauan} className={kelasTombol("sekunder", "md")}>
            Kembali ke Pemantauan
          </Link>
        }
      />

      <Bagian judul="Identitas">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[11rem_1fr]">
          <dt className="text-teks-redup">Judul</dt>
          <dd className="font-semibold text-primer-900">{p.judul}</dd>
          <dt className="text-teks-redup">Skema Pendanaan</dt>
          <dd>{sesi.pengelola ? <Link href={`/tim-kerja/templat?skema=${p.skema.id}`} className={tautan}>{p.skema.nama}</Link> : p.skema.nama}</dd>
          <dt className="text-teks-redup">Periode Seleksi</dt>
          <dd>
            <Link href={`/tim-kerja/penugasan/${p.periode.id}`} className={tautan}>
              {p.periode.nama}
            </Link>
          </dd>
          <dt className="text-teks-redup">Pengusul</dt>
          <dd>
            {p.pengusul.nama}, {p.pengusul.institusi}
          </dd>
          <dt className="text-teks-redup">Status</dt>
          <dd>
            <StatusBadge status={p.status} />
            {p.waktuTerkirim ? <span className="ml-2 text-teks-redup">dikirim {formatWaktu(p.waktuTerkirim)}</span> : null}
          </dd>
        </dl>
      </Bagian>

      <Bagian judul="Versi Pengajuan">
        {p.versi.length === 0 ? (
          <KeadaanKosong judul="Belum ada versi pengajuan">Versi muncul sesudah pengusul mengajukan naskah dari BIMA.</KeadaanKosong>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Versi</TH>
                <TH>Waktu</TH>
                <TH>Pemeriksaan</TH>
                <TH angka>Templat</TH>
                <TH angka>Aturan</TH>
              </TR>
            </THead>
            <TBody>
              {p.versi.map((v) => (
                <TR key={v.id} tersorot={v.id === p.versiDinilai?.id}>
                  <TD className="font-semibold">{v.kode}</TD>
                  <TD>{formatWaktu(v.waktu)}</TD>
                  <TD>
                    <StatusBadge status={v.statusPemeriksaan} />
                  </TD>
                  <TD angka>
                    {v.versiTemplat && sesi.pengelola && v.templatId ? (
                      <Link href={`/tim-kerja/templat?skema=${p.skema.id}&versi=${v.templatId}`} className={tautan}>
                        v{v.versiTemplat}
                      </Link>
                    ) : v.versiTemplat ? (
                      `v${v.versiTemplat}`
                    ) : (
                      "-"
                    )}
                  </TD>
                  <TD angka>
                    {v.versiAturan && sesi.pengelola ? (
                      <Link href={`/tim-kerja/aturan?skema=${p.skema.id}&periode=${p.periode.id}`} className={tautan}>
                        v{v.versiAturan}
                      </Link>
                    ) : v.versiAturan ? (
                      `v${v.versiAturan}`
                    ) : (
                      "-"
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Bagian>

      <Bagian judul="Hasil Pemeriksaan Deterministik">
        {deterministik.length === 0 ? (
          <p className="text-sm text-teks-redup">Belum ada hasil pemeriksaan deterministik.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-teks-redup">
              <span className="angka">{ringkas.deterministik.lolos}</span> Lolos, <span className="angka">{ringkas.deterministik.gagal}</span> Gagal dari{" "}
              <span className="angka">{ringkas.deterministik.jumlah}</span> butir (versi {p.versiDinilai?.kode}).
            </p>
            <Table>
              <THead>
                <TR>
                  <TH>Butir</TH>
                  <TH>Bagian</TH>
                  <TH>Status</TH>
                  <TH>Angka Pembukti</TH>
                </TR>
              </THead>
              <TBody>
                {deterministik.map((h) => (
                  <TR key={h.butirId}>
                    <TD className="max-w-sm">
                      {sesi.pengelola ? (
                        <Link href={tautanButirJ03(h.butirKode)} className="font-mono text-xs font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2">
                          {h.butirKode}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs font-semibold text-teks-redup">{h.butirKode}</span>
                      )}
                      <p>{h.deskripsi}</p>
                    </TD>
                    <TD>{h.bagian ?? "-"}</TD>
                    <TD>
                      <StatusBadge status={h.status} />
                    </TD>
                    <TD className="max-w-xs">
                      {h.angkaPembukti ?? "-"}
                      {h.status === "Gagal" && h.batasDilanggar ? <p className="text-xs text-bata-700">{h.batasDilanggar}</p> : null}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </>
        )}
      </Bagian>

      <Bagian judul="Hasil Pemeriksaan Semantik">
        {semantik.length === 0 ? (
          <p className="text-sm text-teks-redup">Belum ada hasil pemeriksaan semantik.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-teks-redup">
              <span className="angka">{ringkas.semantik.memenuhi}</span> Memenuhi, <span className="angka">{ringkas.semantik.tidakMemenuhi}</span> Tidak memenuhi,{" "}
              <span className="angka">{ringkas.semantik.perluManual}</span> perlu diperiksa manual, <span className="angka">{ringkas.semantik.belumAda}</span> belum ada rekomendasi.
            </p>
            <Table>
              <THead>
                <TR>
                  <TH>Butir</TH>
                  <TH>Rekomendasi Sistem</TH>
                  <TH>Kutipan</TH>
                  <TH>Keputusan Reviewer</TH>
                </TR>
              </THead>
              <TBody>
                {semantik.map((h) => (
                  <TR key={h.butirId}>
                    <TD className="min-w-48 max-w-xs">
                      <Link href={`${tautanPemantauan}&butir=${encodeURIComponent(h.butirKode)}`} className="font-mono text-xs font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2" title="Rincian butir di Pemantauan (J-05)">
                        {h.butirKode}
                      </Link>
                      <p>{h.deskripsi}</p>
                    </TD>
                    <TD className="min-w-40">
                      <StatusBadge status={h.status} /> {h.tiruan ? <Badge>tiruan</Badge> : null}
                      {h.tingkatKeyakinan !== null ? <BarKeyakinan nilai={h.tingkatKeyakinan} className="mt-2" /> : null}
                    </TD>
                    <TD className="min-w-48 max-w-sm text-xs">{h.kutipan ? <q>{h.kutipan}</q> : "-"}</TD>
                    <TD className="min-w-40 text-xs">
                      {h.koreksi ? (
                        <>
                          <StatusBadge status="Dikoreksi reviewer" /> <span className="font-semibold">{h.koreksi.keputusanReviewer}</span>
                          <p className="mt-1 text-teks-redup">
                            {h.koreksi.jenisKekeliruan ? `${h.koreksi.jenisKekeliruan}: ` : ""}
                            {h.koreksi.alasan}
                          </p>
                        </>
                      ) : (
                        <span className="text-teks-redup">Belum dikoreksi</span>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </>
        )}
      </Bagian>

      <Bagian judul="Penugasan dan Penilaian">
        {p.penugasan.length === 0 ? (
          <p className="text-sm text-teks-redup">Proposal ini belum ditugaskan ke reviewer.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Reviewer</TH>
                <TH>Penugasan</TH>
                <TH>Penilaian</TH>
                <TH angka>Koreksi</TH>
              </TR>
            </THead>
            <TBody>
              {p.penugasan.map((x) => {
                const st = statusPenilaianDariLabel(x.label, x.status);
                return (
                  <TR key={x.id}>
                    <TD>
                      {x.namaReviewer}
                      <p className="text-xs text-teks-redup">{x.institusiReviewer}</p>
                    </TD>
                    <TD>
                      <StatusBadge status={x.status} /> <span className="text-xs text-teks-redup">{formatWaktu(x.tanggal)}</span>
                    </TD>
                    <TD>{st === "Final" || st === "Draf" ? <StatusBadge status={st === "Final" ? "Selesai" : "Draf"} /> : <span className="text-teks-redup">{st}</span>}</TD>
                    <TD angka>{formatAngka(x.penilaian?.jumlahKoreksi ?? 0)}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Bagian>

      <Bagian judul="Berkas">
        {p.berkas.length === 0 ? (
          <p className="text-sm text-teks-redup">Tidak ada berkas tersimpan untuk proposal ini.</p>
        ) : (
          <ul className="divide-y divide-primer-100 rounded-md border border-primer-200 bg-white">
            {p.berkas.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-primer-900">{b.nama}</p>
                  <p className="text-xs text-teks-redup">
                    {b.peran === "naskah" ? "Naskah" : "Lampiran"}
                    {b.keterangan ? `, ${b.keterangan}` : ""}
                    {b.ukuran > 0 ? `, ${ukuranBerkas(b.ukuran)}` : ""}
                  </p>
                </div>
                <TombolUnduh href={unduh(b.id)} ukuran="sm">
                  Unduh Berkas<span className="sr-only"> {b.nama}</span>
                </TombolUnduh>
              </li>
            ))}
          </ul>
        )}
      </Bagian>
    </>
  );
}
