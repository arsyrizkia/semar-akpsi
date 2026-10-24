"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, Isian, KotakCentang, Modal, Pilihan } from "@/components/ui";
import type { JenisIsian } from "@/lib/kontrak/tipe";
import { batasKataValid, mentahKeBagian, mentahPustaka, periksaKetentuan, type BarisBagianMentah } from "@/lib/templat/kelengkapan";
import { pertanyaanUnsur, susunPetunjuk } from "@/lib/templat/isian-substansi";
import { PETUNJUK_KOLOM_RENTANG } from "@/lib/templat/kolom-rentang";
import { turunkanButirDariTemplat } from "@/lib/seed-butir";

interface Props {
  buka: boolean;
  saatUbah: (buka: boolean) => void;
  indeks: number;
  bagian: BarisBagianMentah[];
  /** bagian baru dari "Tambah Bagian": menutup tanpa Terapkan memanggil `saatBatalBaru` (penambahan dibatalkan) */
  baru?: boolean;
  saatBatalBaru?: () => void;
  /** isian tersunting dikembalikan utuh sebagai pengganti baris bagian */
  saatTerapkan: (b: BarisBagianMentah) => void;
  /** "Ubah Bagian": formulir ringkas (Nama Bagian, Batas Kata, Petunjuk Pengisian, Wajib); formulir lengkap hanya untuk "Tambah Bagian" */
  ringkas?: boolean;
  /** tautan "Atur aturan bagian ini": menutup modal dan membuka tab Aturan Pemeriksaan tersaring dan tersorot untuk bagian ini */
  saatAturAturan?: (namaBagian: string) => void;
}

const TIPE: { nilai: JenisIsian; label: string; ket: string }[] = [
  { nilai: "teks", label: "Teks", ket: "paragraf bebas" },
  { nilai: "daftar", label: "Daftar", ket: "butir dengan pemisah, mis. kata kunci" },
  { nilai: "tabel", label: "Tabel", ket: "kolom wajib, mis. jadwal" },
  { nilai: "daftar_pustaka", label: "Daftar pustaka", ket: "bernomor, hanya yang disitasi" },
];

const PEMISAH = [
  { nilai: ";", label: "Titik koma (;)" },
  { nilai: ",", label: "Koma (,)" },
  { nilai: "/", label: "Garis miring (/)" },
];

function LencanaJenis({ jenis }: { jenis: "deterministik" | "semantik" }) {
  return jenis === "semantik" ? (
    <Badge className="border-primer-200 bg-primer-100 text-primer-800">Semantik</Badge>
  ) : (
    <Badge>Deterministik</Badge>
  );
}

/** Pengelompokan isian M-12 supaya modal yang besar tetap mudah dipindai: satu judul kelompok, satu keterangan. */
function Kelompok({ judul, keterangan, children }: { judul: string; keterangan?: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-primer-100 pt-4">
      <legend className="pr-2 text-sm font-semibold text-primer-800">{judul}</legend>
      {keterangan ? <p className="mb-3 text-xs text-teks-redup">{keterangan}</p> : null}
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

/** Daftar isian yang bisa ditambah dan dihapus (kolom tabel, frasa wajib). */
function DaftarIsian({ label, nilai, saatUbah, galat, placeholder, labelTambah, petunjuk }: { label: string; nilai: string[]; saatUbah: (x: string[]) => void; galat?: string | null; placeholder: string; labelTambah: string; petunjuk?: string }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-primer-900">{label}</p>
      {petunjuk ? <p className="mb-2 text-xs text-teks-redup">{petunjuk}</p> : null}
      <ul className="space-y-2">
        {nilai.map((v, i) => (
          <li key={i} className="flex items-center gap-2">
            <Isian
              label={`${label} ${i + 1}`}
              className="min-w-0 flex-1 [&>label]:sr-only"
              name={`${label}-${i}`}
              autoComplete="off"
              placeholder={placeholder}
              value={v}
              onChange={(e) => saatUbah(nilai.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <Button varian="hantu" ukuran="sm" aria-label={`Hapus ${label} ${i + 1}`} onClick={() => saatUbah(nilai.filter((_, j) => j !== i))}>
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      {galat ? (
        <p role="alert" className="mt-1 text-xs font-medium text-bata-600">
          {galat}
        </p>
      ) : null}
      <Button varian="sekunder" ukuran="sm" className="mt-2" onClick={() => saatUbah([...nilai, ""])}>
        <Plus aria-hidden className="size-4" /> {labelTambah}
      </Button>
    </div>
  );
}

/**
 * M-12 Ketentuan Bagian (UC-01, putaran 3): dipakai untuk "Tambah Bagian" dan "Atur Ketentuan". Kelompok: Tipe Isian, Batas Kata, Wajib Memuat,
 * Petunjuk Pengisian. Setiap pilihan diberi label jenis butir yang lahir ("Deterministik" atau "Semantik"); pratinjau butir turunan ada di bawah.
 */
export function ModalKetentuan(props: Props) {
  // isi dimuat ulang tiap dibuka: komponen dalam dipasang hanya selama modal terbuka
  return props.buka ? <IsiModal {...props} /> : null;
}

function IsiModal({ buka, saatUbah, indeks, bagian, baru, saatBatalBaru, saatTerapkan, ringkas = false, saatAturAturan }: Props) {
  const [k, setK] = useState<BarisBagianMentah>(() => ({ ...bagian[indeks], kolomTabel: [...(bagian[indeks].kolomTabel ?? [])], frasaWajib: [...(bagian[indeks].frasaWajib ?? [])], unsurIsi: (bagian[indeks].unsurIsi ?? []).map((u) => ({ ...u })) }));
  // petunjuk mengikuti ketentuan sampai disunting manual; bagian yang sudah punya petunjuk (mis. resmi dari contoh) dianggap manual
  const [manual, setManual] = useState(() => (bagian[indeks].petunjuk ?? "").trim() !== "");
  const [diterapkan, setDiterapkan] = useState(false);

  const jenis = k.jenisIsian ?? "teks";
  const ubah = (p: Partial<BarisBagianMentah>) =>
    setK((s) => {
      const berikut = { ...s, ...p };
      return manual ? berikut : { ...berikut, petunjuk: susunPetunjuk(mentahKeBagian(berikut)) };
    });
  const ubahTipe = (nilai: JenisIsian) => ubah({ jenisIsian: nilai, daftarPustaka: nilai === "daftar_pustaka", ...(nilai === "daftar" ? { jumlahButir: k.jumlahButir || "5", pemisah: k.pemisah || ";" } : {}) });

  const semua = useMemo(() => bagian.map((b, i) => (i === indeks ? k : b)), [bagian, indeks, k]);
  const galat = periksaKetentuan(semua)[indeks];
  const nama = k.nama.trim();
  const galatNama = nama === "" ? "Nama bagian wajib diisi" : bagian.some((b, i) => i !== indeks && b.nama.trim().toLowerCase() === nama.toLowerCase()) ? "Nama bagian sudah dipakai" : null;
  const galatBatas = !k.tanpaBatas && !batasKataValid(k.batas) ? "Isi angka bulat lebih dari 0, atau centang Tanpa batas kata" : null;
  const adaGalat = Boolean(galat) || Boolean(galatNama) || Boolean(galatBatas);

  // butir yang akan lahir dari bagian ini (nomor kode mengikuti seluruh templat saat terbit; di sini hanya awalan)
  const pratinjau = useMemo(() => {
    const turunan = turunkanButirDariTemplat(semua.map(mentahKeBagian));
    return turunan.filter((b) => b.bagian === k.nama && k.nama.trim() !== "");
  }, [semua, k.nama]);
  const jumlahDet = pratinjau.filter((b) => b.jenis === "deterministik").length;
  const jumlahSem = pratinjau.length - jumlahDet;

  const tutup = (b: boolean) => {
    if (!b && baru && !diterapkan) saatBatalBaru?.();
    saatUbah(b);
  };

  return (
    <Modal
      kode="M-12"
      buka={buka}
      saatUbah={tutup}
      ukuran="lg"
      judul={baru ? "Tambah Bagian" : ringkas ? "Ubah Bagian" : "Ketentuan Bagian"}
      deskripsi={nama ? `Bagian: ${nama}` : "Atur nama, tipe isian, batas kata, dan hal yang wajib dimuat."}
      kaki={
        <>
          <Button varian="sekunder" onClick={() => tutup(false)}>
            Batal
          </Button>
          <Button
            disabled={adaGalat}
            onClick={() => {
              setDiterapkan(true);
              saatTerapkan({ ...k, nama: k.nama.trim(), daftarPustaka: mentahPustaka(k) });
              saatUbah(false);
            }}
          >
            Terapkan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <Isian label="Nama Bagian" name="nama-bagian" autoComplete="off" className="min-w-64 flex-1" value={k.nama} galat={galatNama} onChange={(e) => ubah({ nama: e.target.value })} />
          <KotakCentang className="pt-7" id="k-wajib" label="Wajib" checked={k.wajib} onCheckedChange={(v) => ubah({ wajib: v === true })} />
        </div>

        {ringkas ? null : (
        <Kelompok judul="Tipe Isian" keterangan="Menentukan bentuk tempat isian di templat dan butir yang diturunkan.">
          <Pilihan label="Tipe Isian" name="tipe-isian" value={jenis} onChange={(e) => ubahTipe(e.target.value as JenisIsian)} className="max-w-sm">
            {TIPE.map((t) => (
              <option key={t.nilai} value={t.nilai}>
                {t.label} ({t.ket})
              </option>
            ))}
          </Pilihan>
          {jenis === "daftar" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start gap-4">
                <Isian label="Jumlah Butir" name="jumlah-butir" inputMode="numeric" autoComplete="off" className="w-36" value={k.jumlahButir ?? ""} galat={galat?.jumlahButir} onChange={(e) => ubah({ jumlahButir: e.target.value })} />
                <Pilihan label="Pemisah" name="pemisah" className="w-48" value={k.pemisah ?? ""} galat={galat?.pemisah} onChange={(e) => ubah({ pemisah: e.target.value })}>
                  <option value="">Pilih pemisah</option>
                  {PEMISAH.map((p) => (
                    <option key={p.nilai} value={p.nilai}>
                      {p.label}
                    </option>
                  ))}
                </Pilihan>
              </div>
              <p className="flex items-center gap-2 text-xs text-teks-redup">
                <LencanaJenis jenis="deterministik" /> tepat jumlah butir, pemisah sesuai, tanpa butir kosong (cekKataKunci)
              </p>
            </div>
          ) : null}
          {jenis === "tabel" ? (
            <div className="space-y-3">
              <DaftarIsian label="Kolom Wajib" nilai={k.kolomTabel ?? []} saatUbah={(x) => ubah({ kolomTabel: x })} galat={galat?.kolomTabel} placeholder="mis. Nama Kegiatan, atau Bulan 1–12…" labelTambah="Tambah Kolom" petunjuk={PETUNJUK_KOLOM_RENTANG} />
              <Isian label="Judul Blok (opsional)" name="judul-tabel" autoComplete="off" className="max-w-xs" placeholder="mis. Tahun ke-1…" value={k.judulTabel ?? ""} onChange={(e) => ubah({ judulTabel: e.target.value })} />
              <p className="flex items-center gap-2 text-xs text-teks-redup">
                <LencanaJenis jenis="deterministik" /> tabel ada dan kolom wajib terbaca (cekTabel)
              </p>
            </div>
          ) : null}
          {jenis === "daftar_pustaka" ? (
            <p className="flex items-center gap-2 text-xs text-teks-redup">
              <LencanaJenis jenis="deterministik" /> bernomor berurutan, setiap [n] ada di pustaka, setiap pustaka disitasi (cocokkanSitasi)
            </p>
          ) : null}
          {galat?.daftarPustaka ? (
            <p role="alert" className="text-xs font-medium text-bata-600">
              {galat.daftarPustaka}
            </p>
          ) : null}
        </Kelompok>
        )}

        <Kelompok judul="Batas Kata" keterangan="Kosongkan Minimal bila tidak ada batas bawah.">
          <div className="flex flex-wrap items-start gap-4">
            {ringkas ? null : <Isian label="Minimal" name="batas-min" inputMode="numeric" autoComplete="off" className="w-32" value={k.batasMin ?? ""} galat={galat?.batasMin} onChange={(e) => ubah({ batasMin: e.target.value })} />}
            <Isian label="Maksimal" name="batas-kata" inputMode="numeric" autoComplete="off" className="w-32" value={k.tanpaBatas ? "" : k.batas} disabled={k.tanpaBatas} galat={galatBatas} onChange={(e) => ubah({ batas: e.target.value })} />
            <KotakCentang className="pt-7" id="k-tanpa-batas" label="Tanpa batas maksimal" checked={k.tanpaBatas} onCheckedChange={(v) => ubah({ tanpaBatas: v === true })} />
          </div>
          <p className="flex items-center gap-2 text-xs text-teks-redup">
            <LencanaJenis jenis="deterministik" /> jumlah kata dihitung tanpa kalimat petunjuk, tabel, dan gambar (hitungKata)
          </p>
        </Kelompok>

        {ringkas ? null : (
        <Kelompok judul="Wajib Memuat" keterangan="Setiap pilihan menjadi butir cek. Label di kanan menunjukkan jenis butir yang lahir.">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <KotakCentang id="k-gambar" label="Gambar berketerangan" checked={k.wajibGambar ?? false} onCheckedChange={(v) => ubah({ wajibGambar: v === true })} />
              <span className="flex gap-1">
                <LencanaJenis jenis="deterministik" />
                <LencanaJenis jenis="semantik" />
              </span>
            </div>
            {k.wajibGambar ? <Isian label="Keterangan Gambar" name="ket-gambar" autoComplete="off" className="max-w-md" placeholder="mis. diagram alir penelitian…" value={k.ketGambar ?? ""} onChange={(e) => ubah({ ketGambar: e.target.value })} /> : null}
          </div>

          {jenis !== "tabel" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <KotakCentang id="k-tabel" label="Tabel di dalam bagian" checked={k.wajibTabel ?? false} onCheckedChange={(v) => ubah({ wajibTabel: v === true })} />
                <LencanaJenis jenis="deterministik" />
              </div>
              {k.wajibTabel ? <DaftarIsian label="Kolom Wajib" nilai={k.kolomTabel ?? []} saatUbah={(x) => ubah({ kolomTabel: x })} galat={galat?.kolomTabel} placeholder="mis. Uraian…" labelTambah="Tambah Kolom" petunjuk={PETUNJUK_KOLOM_RENTANG} /> : null}
            </div>
          ) : null}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <KotakCentang id="k-sitasi" label="Sitasi bernomor sesuai urutan pengutipan" checked={k.sitasiBernomor ?? false} onCheckedChange={(v) => ubah({ sitasiBernomor: v === true })} />
              <LencanaJenis jenis="deterministik" />
            </div>
            {galat?.sitasiBernomor ? (
              <p role="alert" className="text-xs font-medium text-bata-600">
                {galat.sitasiBernomor}
              </p>
            ) : (
              <p className="text-xs text-teks-redup">Dicocokkan dengan bagian bertipe daftar pustaka.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-primer-900">Frasa wajib</p>
              <LencanaJenis jenis="deterministik" />
            </div>
            <DaftarIsian label="Frasa" nilai={k.frasaWajib ?? []} saatUbah={(x) => ubah({ frasaWajib: x })} galat={galat?.frasaWajib} placeholder="mis. Seluruh biaya sesuai RAB…" labelTambah="Tambah Frasa" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-primer-900">Unsur isi</p>
              <LencanaJenis jenis="semantik" />
            </div>
            <ul className="space-y-2">
              {(k.unsurIsi ?? []).map((u, i) => (
                <li key={i} className="rounded-md border border-primer-100 p-2">
                  <div className="flex items-start gap-2">
                    <Isian
                      label={`Unsur ${i + 1}`}
                      className="min-w-0 flex-1"
                      name={`unsur-${i}`}
                      autoComplete="off"
                      placeholder="mis. urgensi…"
                      value={u.unsur}
                      onChange={(e) => ubah({ unsurIsi: (k.unsurIsi ?? []).map((x, j) => (j === i ? { ...x, unsur: e.target.value } : x)) })}
                    />
                    <Button className="mt-6" varian="hantu" ukuran="sm" aria-label={`Hapus unsur ${i + 1}`} onClick={() => ubah({ unsurIsi: (k.unsurIsi ?? []).filter((_, j) => j !== i) })}>
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </div>
                  <Isian
                    label={`Pertanyaan pemeriksaan unsur ${i + 1}`}
                    className="mt-2"
                    name={`pertanyaan-${i}`}
                    autoComplete="off"
                    placeholder={pertanyaanUnsur(nama || "bagian", { unsur: u.unsur.trim() || "…" })}
                    petunjuk="Kosongkan untuk memakai pertanyaan otomatis; boleh disunting."
                    value={u.pertanyaan ?? ""}
                    onChange={(e) => ubah({ unsurIsi: (k.unsurIsi ?? []).map((x, j) => (j === i ? { ...x, pertanyaan: e.target.value } : x)) })}
                  />
                </li>
              ))}
            </ul>
            {galat?.unsurIsi ? (
              <p role="alert" className="text-xs font-medium text-bata-600">
                {galat.unsurIsi}
              </p>
            ) : null}
            <Button varian="sekunder" ukuran="sm" onClick={() => ubah({ unsurIsi: [...(k.unsurIsi ?? []), { unsur: "", pertanyaan: "" }] })}>
              <Plus aria-hidden className="size-4" /> Tambah Unsur Isi
            </Button>
          </div>
        </Kelompok>
        )}

        <Kelompok judul="Petunjuk Pengisian" keterangan="Disusun otomatis dari pilihan di atas; sunting manual bila perlu. {batas} diganti Batas Kata maksimal.">
          <Isian
            label="Petunjuk Pengisian"
            multibaris
            rows={5}
            name="petunjuk"
            autoComplete="off"
            value={k.petunjuk ?? ""}
            onChange={(e) => {
              setManual(true);
              setK((s) => ({ ...s, petunjuk: e.target.value }));
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              varian="sekunder"
              ukuran="sm"
              onClick={() => {
                setManual(false);
                setK((s) => ({ ...s, petunjuk: susunPetunjuk(mentahKeBagian(s)) }));
              }}
            >
              <RefreshCw aria-hidden className="size-4" /> Susun ulang petunjuk
            </Button>
            <span className="text-xs text-teks-redup">{manual ? "Petunjuk disunting manual." : "Petunjuk mengikuti pilihan."}</span>
          </div>
        </Kelompok>

        {ringkas ? (
          saatAturAturan ? (
            <div className="border-t border-primer-100 pt-4">
              <button type="button" className="cursor-pointer text-sm font-semibold text-primer-800 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={adaGalat} onClick={() => {
                  setDiterapkan(true);
                  saatTerapkan({ ...k, nama: k.nama.trim(), daftarPustaka: mentahPustaka(k) });
                  saatUbah(false);
                  saatAturAturan(k.nama.trim());
                }}>
                Atur aturan bagian ini
              </button>
              <p className="mt-1 text-xs text-teks-redup">Batas kata minimal, format, tabel, gambar, sitasi, frasa, dan unsur isi diatur di tab Aturan Pemeriksaan.</p>
            </div>
          ) : null
        ) : (
        <section aria-labelledby="pratinjau-butir" className="border-t border-primer-100 pt-4">
          <h3 id="pratinjau-butir" className="text-sm font-semibold text-primer-800">
            Butir cek yang akan lahir dari bagian ini
          </h3>
          <p className="mb-2 text-xs text-teks-redup">
            {jumlahDet} deterministik dan {jumlahSem} semantik. Dibuat sebagai draf saat templat terbit; dikelola di Aturan Pemeriksaan.
          </p>
          {pratinjau.length === 0 ? (
            <p className="text-sm text-teks-redup">Belum ada butir. Isi nama bagian dan ketentuannya.</p>
          ) : (
            <ul className="space-y-1">
              {pratinjau.map((b, i) => (
                <li key={`${b.kode}-${i}`} className="flex flex-wrap items-center gap-2">
                  <span translate="no" className="font-mono text-xs font-semibold text-abu-700">{b.kode.replace(/-\d+$/, "")}</span>
                  <span className="min-w-0 flex-1">{b.deskripsi}</span>
                  <LencanaJenis jenis={b.jenis} />
                </li>
              ))}
            </ul>
          )}
        </section>
        )}
      </div>
    </Modal>
  );
}
