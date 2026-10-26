import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { Alert, Badge, Bagian, BarKeyakinan, KeadaanKosong, KepalaHalaman, kelasTombol, LencanaStatus, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { wajibPengelola } from "@/lib/auth";
import { urlTabAturan } from "@/lib/templat/daftar";
import { ambilHasilUji, daftarContohUji, ujiTerakhir } from "@/lib/aturan/uji-jalan";
import { adalahDeterministik, ringkasPerContoh, susunBarisUji, type SelUji } from "@/lib/aturan/uji";
import { daftarPeriode, daftarSkema } from "@/lib/templat/layanan";
import { formatAngka, formatTanggal, formatWaktu } from "@/lib/utils";
import { TombolUjiContoh } from "../uji-contoh";

export const metadata: Metadata = { title: "J-03b Hasil Uji pada Contoh" };
export const dynamic = "force-dynamic";
// "Uji Ulang" menjalankan aksi uji dari halaman ini: satu aksi = satu penilaian semantik (satu panggilan LLM)
export const maxDuration = 60;

/**
 * J-03b Hasil Uji pada Contoh (UC-02 langkah 6). Layar tersendiri dengan URL sendiri (?uji=). Uji dijalankan dari M-15 (pilih contoh
 * dan/atau unggah naskah, kemajuan bertahap); halaman ini hanya membaca hasil tersimpan, jadi membukanya lagi tidak memanggil LLM.
 * Tanpa ?uji= ditampilkan uji terakhir templat (atau skema) itu. Butir yang diuji dibekukan saat uji dimulai.
 */
export default async function Halaman({ searchParams }: { searchParams: Promise<{ skema?: string; periode?: string; templat?: string; uji?: string }> }) {
  await wajibPengelola();
  const { skema: skemaParam, periode: periodeParam, templat, uji: ujiParam } = await searchParams;
  const [skema, periode] = await Promise.all([daftarSkema(), daftarPeriode()]);
  const skemaTerpilih = skema.find((s) => s.id === skemaParam) ?? skema[0];
  const periodeTerpilih = periode.find((p) => p.id === periodeParam) ?? periode[0];

  if (!skemaTerpilih) {
    return (
      <>
        <KepalaHalaman kode="J-03b" judul="Hasil Uji pada Contoh" remah={[{ label: "Templat Proposal", href: "/tim-kerja/templat" }, { label: "Hasil Uji" }]} />
        <KeadaanKosong judul="Belum ada skema pendanaan">Jalankan &ldquo;Reset &amp; isi data demo&rdquo; di Pusat Demo.</KeadaanKosong>
      </>
    );
  }

  // kembali ke tab Aturan Pemeriksaan pada templat asal; tanpa templat, /tim-kerja/aturan memilih templat Aktif skema dan periode ini
  const urlKembali = templat ? urlTabAturan(templat, { periodeId: periodeTerpilih?.id }) : `/tim-kerja/aturan?skema=${skemaTerpilih.id}${periodeTerpilih ? `&periode=${periodeTerpilih.id}` : ""}`;
  const [ujiId, contohUji] = await Promise.all([ujiParam ? Promise.resolve(ujiParam) : ujiTerakhir(skemaTerpilih.id, templat ?? null), daftarContohUji(skemaTerpilih.id)]);
  const uji = ujiId ? await ambilHasilUji(ujiId) : null;
  const tombolUji = (label: string, varian: "utama" | "sekunder") => (
    <TombolUjiContoh skemaId={skemaTerpilih.id} periodeId={periodeTerpilih?.id ?? null} templatId={templat ?? null} contoh={contohUji} label={label} varian={varian} />
  );
  const remah = [{ label: "Templat Proposal", href: "/tim-kerja/templat" }, { label: "Aturan Pemeriksaan", href: urlKembali }, { label: "Hasil Uji" }];

  if (!uji) {
    return (
      <>
        <KepalaHalaman kode="J-03b" judul="Hasil Uji pada Contoh" keterangan={skemaTerpilih.namaSkema} remah={remah} />
        <KeadaanKosong
          judul={ujiParam ? "Hasil uji ini tidak ditemukan" : "Belum ada uji untuk templat ini"}
          aksi={
            <div className="flex flex-wrap justify-center gap-2">
              {tombolUji("Jalankan Uji pada Contoh", "utama")}
              <Link href={urlKembali} className={kelasTombol("sekunder")}>
                Kembali ke Aturan Pemeriksaan
              </Link>
            </div>
          }
        >
          Pilih contoh yang tersedia atau unggah naskah (.docx/.pdf); hasilnya tersimpan di sini.
        </KeadaanKosong>
      </>
    );
  }

  const baris = susunBarisUji(uji.butir, uji.contoh);
  const ringkasan = ringkasPerContoh(uji.contoh);
  const sumber = uji.sumber;
  const keteranganSumber = !sumber
    ? skemaTerpilih.namaSkema
    : sumber.jenis === "templat-draf"
      ? `${skemaTerpilih.namaSkema}, templat versi ${sumber.versi} (Draf, isian tersimpan)`
      : `${skemaTerpilih.namaSkema}, basis aturan versi ${sumber.versi}${sumber.tanggalBerlaku ? "" : " (sedang disusun)"}`;

  return (
    <>
      <KepalaHalaman
        kode="J-03b"
        judul="Hasil Uji pada Contoh"
        keterangan={keteranganSumber}
        remah={remah}
        aksi={
          <>
            {tombolUji("Uji Ulang", "sekunder")}
            <Link href={urlKembali} className={kelasTombol("utama")}>
              Kembali ke Aturan Pemeriksaan
            </Link>
          </>
        }
      />

      <p className="mb-4 text-sm text-teks-redup">
        Diuji {formatWaktu(uji.dibuatPada)} oleh {uji.dibuatOleh} · {formatAngka(uji.contoh.length)} dokumen · {formatAngka(uji.butir.filter((b) => b.status !== "Nonaktif").length)} butir
      </p>
      {uji.status === "Berjalan" ? (
        <Alert jenis="peringatan" className="mb-4">
          Uji ini belum selesai (jendela ditutup saat berjalan). {formatAngka(uji.belumDinilai)} penilaian semantik belum ada; jalankan Uji Ulang untuk hasil lengkap.
        </Alert>
      ) : uji.status === "Dihentikan" ? (
        <Alert jenis="peringatan" className="mb-4">
          Uji dihentikan sebelum selesai. {formatAngka(uji.belumDinilai)} penilaian semantik belum dinilai dan tampil sebagai tanda hubung.
        </Alert>
      ) : null}

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
                  <TD>
                    <span className="font-semibold">{r.dokumenNama}</span>
                    {r.dokumenKode.startsWith("contoh-") ? (
                      <a
                        href={`/api/semar/contoh/${encodeURIComponent(r.dokumenKode)}/unduh`}
                        download
                        aria-label={`Unduh .docx: ${r.dokumenNama}`}
                        className="mt-0.5 flex w-fit items-center gap-1 text-xs font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900"
                      >
                        <Download aria-hidden className="size-3.5" />
                        Unduh .docx
                      </a>
                    ) : null}
                  </TD>
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
            Uji ini tidak memiliki butir aktif.
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
                    <span className="block text-xs text-teks-redup">{butir.deskripsi}</span>
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
        <p className="mt-3 text-xs text-teks-redup">
          Contoh proposal adalah data contoh sementara; butir yang diuji adalah butir saat uji dijalankan
          {sumber?.jenis === "basis" && sumber.tanggalBerlaku ? `; basis aturan berlaku sejak ${formatTanggal(sumber.tanggalBerlaku)}` : ""}
          {sumber?.jenis === "templat-draf" ? "; perubahan yang belum disimpan di templat tidak ikut diuji" : ""}.
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
      {h.kutipan ? <p className="text-xs">&ldquo;{h.kutipan}&rdquo;</p> : null}
      {h.alasanSistem ? <p className="text-xs text-teks-redup">{h.alasanSistem}</p> : null}
      {h.tingkatKeyakinan != null ? <BarKeyakinan nilai={h.tingkatKeyakinan} /> : null}
    </div>
  );
}
