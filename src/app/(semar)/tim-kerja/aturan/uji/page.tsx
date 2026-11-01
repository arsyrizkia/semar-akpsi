import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { Alert, Badge, Bagian, BarKeyakinan, KeadaanKosong, KepalaHalaman, kelasTombol, LencanaStatus, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { TinjauanNaskah } from "@/components/penilaian/tinjauan-naskah";
import { wajibPengelola } from "@/lib/auth";
import { urlTabAturan } from "@/lib/templat/daftar";
import { ambilHasilUji, daftarContohUji, muatTinjauanUji, ujiTerakhir, type TinjauanUji } from "@/lib/aturan/uji-jalan";
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
 * Hasil uji dibuka per dokumen seperti J-08 reviewer (hanya baca): teks contoh per bagian dengan sorotan kutipan bukti dan panel butir
 * semantik, ditambah hasil butir deterministik dokumen itu. Bawaannya dokumen pertama; ?dokumen=KODE memilih dokumen lain, dan
 * ?dokumen=semua menampilkan ringkasan per contoh dan matriks hasil per butir untuk semua dokumen.
 */
export default async function Halaman({
  searchParams,
}: {
  searchParams: Promise<{ skema?: string; periode?: string; templat?: string; uji?: string; dokumen?: string; tab?: string; butir?: string }>;
}) {
  await wajibPengelola();
  const { skema: skemaParam, periode: periodeParam, templat, uji: ujiParam, dokumen: dokumenParam, tab, butir: butirParam } = await searchParams;
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
  const formatUnduh = new Map(contohUji.map((c) => [c.kode, c.unduh]));
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

  // alamat J-03b untuk uji ini; `dokumen` membuka tampilan satu dokumen
  const urlUji = (dokumen?: string) => {
    const q = new URLSearchParams({ skema: skemaTerpilih.id, uji: uji.ujiId });
    if (periodeTerpilih) q.set("periode", periodeTerpilih.id);
    if (templat) q.set("templat", templat);
    if (dokumen) q.set("dokumen", dokumen);
    return `/tim-kerja/aturan/uji?${q.toString()}`;
  };
  const peringatanUji =
    uji.status === "Berjalan" ? (
      <Alert jenis="peringatan" className="mb-4">
        Uji ini belum selesai (jendela ditutup saat berjalan). {formatAngka(uji.belumDinilai)} penilaian semantik belum ada; jalankan Uji Ulang untuk hasil lengkap.
      </Alert>
    ) : uji.status === "Dihentikan" ? (
      <Alert jenis="peringatan" className="mb-4">
        Uji dihentikan sebelum selesai. {formatAngka(uji.belumDinilai)} penilaian semantik belum dinilai dan tampil sebagai tanda hubung.
      </Alert>
    ) : null;

  // pilihan dokumen di atas kedua tampilan: ringkasan semua dokumen, lalu setiap dokumen (tampilan bersorot)
  const SEMUA = "semua";
  const pilihanDokumen = (aktif: string) => (
    <nav aria-label="Tampilan hasil uji" className="mb-4">
      <ul className="flex flex-wrap gap-2">
        {[{ dokumenKode: SEMUA, dokumenNama: "Ringkasan semua dokumen" }, ...uji.contoh].map((c) => {
          const dipilih = c.dokumenKode === aktif;
          return (
            <li key={c.dokumenKode}>
              <Link
                href={urlUji(c.dokumenKode)}
                aria-current={dipilih ? "page" : undefined}
                className={
                  dipilih
                    ? "inline-flex min-h-9 items-center rounded-md border border-primer-400 bg-primer-50 px-3 text-sm font-semibold text-primer-900 pointer-coarse:min-h-11"
                    : "inline-flex min-h-9 items-center rounded-md border border-primer-200 bg-white px-3 text-sm text-primer-800 hover:border-primer-400 hover:text-primer-900 pointer-coarse:min-h-11"
                }
              >
                {c.dokumenNama}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const dokumenDipilih = dokumenParam === SEMUA ? null : (dokumenParam ?? uji.contoh[0]?.dokumenKode ?? null);
  const tinjauan = dokumenDipilih ? await muatTinjauanUji(uji.ujiId, dokumenDipilih) : null;
  if (tinjauan) {
    return (
      <>
        <KepalaHalaman
          kode="J-03b"
          judul="Hasil Uji pada Contoh"
          keterangan={tinjauan.dokumen.nama}
          remah={[...remah.slice(0, -1), { label: "Hasil Uji", href: urlUji(SEMUA) }, { label: tinjauan.dokumen.nama }]}
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
          Diuji {formatWaktu(uji.dibuatPada)} oleh {uji.dibuatOleh} · {formatAngka(uji.contoh.length)} dokumen. Penggalan bersorot adalah kutipan bukti
          yang dipakai sistem; nomor di ujungnya membuka rincian butirnya.
        </p>
        {pilihanDokumen(tinjauan.dokumen.kode)}
        {peringatanUji}
        <RingkasDeterministik d={tinjauan.deterministik} />
        <TinjauanNaskah
          tab={tinjauan.tab}
          butir={tinjauan.butir}
          alamatGambar={`/api/semar/contoh/${encodeURIComponent(tinjauan.dokumen.kode)}/gambar`}
          tabAwal={tab}
          butirAwal={butirParam}
          judulTeks="Teks Contoh"
          ringkasPanel={
            <span className="angka text-xs text-teks-redup">
              {tinjauan.butir.length} butir, {tinjauan.butir.filter((b) => b.status === "Memenuhi").length} Memenuhi
            </span>
          }
        />
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
      {pilihanDokumen(SEMUA)}
      {peringatanUji}

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
                    <Link href={urlUji(r.dokumenKode)} className="font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2">
                      {r.dokumenNama}
                    </Link>
                    <span className="block text-xs text-teks-redup">Buka untuk melihat teks bersorot</span>
                    {formatUnduh.get(r.dokumenKode) ? (
                      <a
                        href={`/api/semar/contoh/${encodeURIComponent(r.dokumenKode)}/unduh`}
                        download
                        aria-label={`Unduh .${formatUnduh.get(r.dokumenKode)}: ${r.dokumenNama}`}
                        className="mt-0.5 flex w-fit items-center gap-1 text-xs font-semibold text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900"
                      >
                        <Download aria-hidden className="size-3.5" />
                        Unduh .{formatUnduh.get(r.dokumenKode)}
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
                  <TH key={c.dokumenKode}>
                    <Link href={urlUji(c.dokumenKode)} className="underline decoration-primer-400 underline-offset-2 hover:decoration-2" title="Lihat teks bersorot dokumen ini">
                      {c.dokumenNama}
                    </Link>
                  </TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {baris.map(({ butir, sel }) => (
                <TR key={butir.id}>
                  <TD className="min-w-52">
                    <Link
                      href={`${urlKembali}&sorot=${encodeURIComponent(butir.kode)}#butir-${butir.kode}`}
                      className="text-sm text-primer-800 underline decoration-primer-400 underline-offset-2 hover:text-primer-900 hover:decoration-2"
                      title="Buka butir ini di Aturan Pemeriksaan"
                    >
                      {butir.deskripsi}
                    </Link>
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

/** Hasil butir deterministik satu dokumen: kalimat ringkas, rincian per butir dapat dibuka. */
function RingkasDeterministik({ d }: { d: TinjauanUji["deterministik"] }) {
  if (!d.length) return null;
  const gagal = d.filter((h) => h.status === "Gagal");
  return (
    <details className="mb-6 rounded-md border border-primer-200 bg-white text-sm">
      <summary className="min-h-10 cursor-pointer px-3 py-2 font-semibold leading-6 text-primer-900">
        Butir deterministik: <span className="angka">{d.length - gagal.length}</span> dari <span className="angka">{d.length}</span> lolos
        {gagal.length ? <span className="font-medium text-bata-700">, {gagal.length} gagal</span> : null}
      </summary>
      <div className="border-t border-primer-100 p-3">
        <Table>
          <THead>
            <TR>
              <TH>Butir</TH>
              <TH>Status</TH>
              <TH>Angka Pembukti</TH>
            </TR>
          </THead>
          <TBody>
            {d.map((h) => (
              <TR key={h.kode}>
                <TD className="max-w-md">{h.deskripsi}</TD>
                <TD>
                  <LencanaStatus status={h.status} />
                </TD>
                <TD className="max-w-xs">
                  <span className="angka text-xs">{h.angkaPembukti}</span>
                  {h.batasDilanggar ? <p className="text-xs text-bata-700">{h.batasDilanggar}</p> : null}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </details>
  );
}
