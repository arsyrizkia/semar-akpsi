import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Badge, Bagian, BarKeyakinan, KeadaanKosong, KepalaHalaman, kelasTombol, LencanaStatus, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { wajibPengelola } from "@/lib/auth";
import { daftarButirBerlaku, ujiPadaContoh } from "@/lib/aturan/layanan";
import { adalahDeterministik, ringkasPerContoh, susunBarisUji, type SelUji } from "@/lib/aturan/uji";
import { daftarPeriode, daftarSkema } from "@/lib/templat/layanan";
import { formatTanggal } from "@/lib/utils";

export const metadata: Metadata = { title: "J-03b Hasil Uji pada Contoh" };
export const dynamic = "force-dynamic";
// pengujian ikut memanggil layanan LLM untuk butir semantik (15 detik per bagian)
export const maxDuration = 60;

/** J-03b Hasil Uji pada Contoh (UC-02 langkah 6). Layar tersendiri dengan URL sendiri; data tidak berubah, hanya dibaca dan diuji. */
export default async function Halaman({ searchParams }: { searchParams: Promise<{ skema?: string; periode?: string }> }) {
  await wajibPengelola();
  const { skema: skemaParam, periode: periodeParam } = await searchParams;
  const [skema, periode] = await Promise.all([daftarSkema(), daftarPeriode()]);
  const skemaTerpilih = skema.find((s) => s.id === skemaParam) ?? skema[0];
  const periodeTerpilih = periode.find((p) => p.id === periodeParam) ?? periode[0];

  if (!skemaTerpilih) {
    return (
      <>
        <KepalaHalaman kode="J-03b" judul="Hasil Uji pada Contoh" remah={[{ label: "Aturan Pemeriksaan", href: "/tim-kerja/aturan" }, { label: "Hasil Uji" }]} />
        <KeadaanKosong judul="Belum ada skema pendanaan">Jalankan &ldquo;Reset &amp; isi data demo&rdquo; di Pusat Demo.</KeadaanKosong>
      </>
    );
  }

  const kueri = `skema=${skemaTerpilih.id}${periodeTerpilih ? `&periode=${periodeTerpilih.id}` : ""}`;
  const urlKembali = `/tim-kerja/aturan?${kueri}`;
  const [tampilan, uji] = await Promise.all([daftarButirBerlaku(skemaTerpilih.id, periodeTerpilih?.id ?? null), ujiPadaContoh(skemaTerpilih.id, periodeTerpilih?.id ?? null)]);
  const baris = susunBarisUji(tampilan.butir, uji.contoh);
  const ringkasan = ringkasPerContoh(uji.contoh);
  const dasar = tampilan.draf ?? tampilan.nyata;

  return (
    <>
      <KepalaHalaman
        kode="J-03b"
        judul="Hasil Uji pada Contoh"
        keterangan={dasar ? `${skemaTerpilih.namaSkema}, basis aturan versi ${dasar.versi}${tampilan.draf ? " (sedang disusun)" : ""}` : skemaTerpilih.namaSkema}
        remah={[{ label: "Aturan Pemeriksaan", href: urlKembali }, { label: "Hasil Uji" }]}
        aksi={
          <>
            <Link href={`/tim-kerja/aturan/uji?${kueri}`} className={kelasTombol("sekunder")}>
              Uji Ulang
            </Link>
            <Link href={urlKembali} className={kelasTombol("utama")}>
              Kembali ke Aturan Pemeriksaan
            </Link>
          </>
        }
      />

      {uji.semuaContoh ? (
        <Alert jenis="info" className="mb-4">
          Skema ini belum memiliki contoh sendiri, sehingga semua contoh proposal dipakai.
        </Alert>
      ) : null}
      {uji.peringatan.map((p) => (
        <Alert key={p} jenis="peringatan" className="mb-4">
          {p}
        </Alert>
      ))}

      {ringkasan.length > 0 ? (
        <Bagian judul="Ringkasan per Contoh">
          <Table>
            <THead>
              <TR>
                <TH>Contoh</TH>
                <TH angka>Lolos</TH>
                <TH angka>Gagal</TH>
                <TH angka>Memenuhi</TH>
                <TH angka>Tidak memenuhi</TH>
                <TH angka>Tanpa rekomendasi</TH>
              </TR>
            </THead>
            <TBody>
              {ringkasan.map((r) => (
                <TR key={r.dokumenKode}>
                  <TD className="font-semibold">{r.dokumenNama}</TD>
                  <TD angka>{r.lolos}</TD>
                  <TD angka className={r.gagal > 0 ? "font-semibold text-bata-700" : undefined}>
                    {r.gagal}
                  </TD>
                  <TD angka>{r.memenuhi}</TD>
                  <TD angka>{r.tidakMemenuhi}</TD>
                  <TD angka>{r.tanpaRekomendasi}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Bagian>
      ) : null}

      <Bagian judul="Hasil per Butir">
        {baris.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada hasil untuk ditampilkan"
            aksi={
              <Link href={urlKembali} className={kelasTombol("sekunder")}>
                Kembali ke Aturan Pemeriksaan
              </Link>
            }
          >
            Skema ini belum memiliki butir aktif atau contoh proposal untuk diuji.
          </KeadaanKosong>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Butir</TH>
                {uji.contoh.map((c) => (
                  <TH key={c.dokumenKode}>{c.dokumenNama}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {baris.map(({ butir, sel }) => (
                <TR key={butir.id}>
                  <TD className="min-w-52">
                    <Link href={`${urlKembali}&sorot=${encodeURIComponent(butir.kode)}#butir-${butir.kode}`} className="font-mono text-xs font-semibold underline underline-offset-2" translate="no">
                      {butir.kode}
                    </Link>
                    <span className="block text-xs text-primer-700">{butir.deskripsi}</span>
                  </TD>
                  {sel.map((h, i) => (
                    <TD key={uji.contoh[i].dokumenKode} className="min-w-52">
                      {h ? <SelHasil h={h} /> : <span className="text-primer-500">-</span>}
                    </TD>
                  ))}
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <p className="mt-3 text-xs text-primer-700">
          Contoh proposal adalah data contoh sementara{dasar?.tanggalBerlaku ? `; basis aturan berlaku sejak ${formatTanggal(dasar.tanggalBerlaku)}` : ""}.
        </p>
      </Bagian>
    </>
  );
}

function SelHasil({ h }: { h: SelUji }) {
  if (adalahDeterministik(h)) {
    return (
      <div className="space-y-1">
        <LencanaStatus status={h.status} />
        <p className="angka text-xs">{h.angkaPembukti}</p>
        {h.batasDilanggar ? <p className="text-xs text-bata-700">{h.batasDilanggar}</p> : null}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <span className="flex flex-wrap items-center gap-1">
        <LencanaStatus status={h.status} />
        {h.tiruan ? <Badge>tiruan</Badge> : null}
      </span>
      {h.kutipan ? <p className="text-xs italic">&ldquo;{h.kutipan}&rdquo;</p> : null}
      {h.alasanSistem ? <p className="text-xs text-primer-700">{h.alasanSistem}</p> : null}
      {h.tingkatKeyakinan != null ? <BarKeyakinan nilai={h.tingkatKeyakinan} /> : null}
    </div>
  );
}
