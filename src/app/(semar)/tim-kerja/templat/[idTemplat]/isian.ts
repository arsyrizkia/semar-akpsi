import type { BarisBagianMentah } from "@/lib/templat/kelengkapan";
import { petunjukResmi } from "@/lib/templat/isian-substansi";
import type { KopTemplat, LampiranTemplat } from "@/lib/templat/paket";
import type { TemplatTampil } from "@/lib/templat/layanan";

/** Isian templat yang disunting di J-02a (satu keadaan bersama untuk tab Bagian, Lampiran, dan Halaman Depan). */
export interface IsianForm {
  bagian: BarisBagianMentah[];
  lampiran: string[];
  /** templat lampiran, sejajar `lampiran` (nama disinkronkan saat dikirim) */
  lampiranDef: LampiranTemplat[];
  periodeId: string;
  kepala: { judulDokumen: string; subjudul: string; pengantar: string };
  kop: KopTemplat;
}

export const dariTemplat = (t: TemplatTampil): IsianForm => ({
  bagian: t.bagian.map((b) => ({
    nama: b.nama,
    batas: b.batasKata == null ? "" : String(b.batasKata),
    tanpaBatas: b.batasKata == null,
    wajib: b.wajib,
    petunjuk: b.petunjuk ?? petunjukResmi(b.nama, b.batasKata) ?? "",
    jenisIsian: b.jenisIsian ?? "teks",
    jumlahButir: b.jumlahButir == null ? "" : String(b.jumlahButir),
    pemisah: b.pemisah ?? "",
    wajibGambar: b.wajibGambar ?? false,
    ketGambar: b.ketGambar ?? "",
    sitasiBernomor: b.sitasiBernomor ?? false,
    daftarPustaka: b.daftarPustaka ?? false,
    batasMin: b.batasMin == null ? "" : String(b.batasMin),
    wajibTabel: b.wajibTabel ?? false,
    kolomTabel: [...(b.kolomTabel ?? [])],
    judulTabel: b.judulTabel ?? "",
    frasaWajib: [...(b.frasaWajib ?? [])],
    unsurIsi: (b.unsurIsi ?? []).map((u) => ({ unsur: u.unsur, pertanyaan: u.pertanyaan ?? "", contoh: u.contoh ?? "" })),
  })),
  lampiran: [...t.lampiranWajib],
  lampiranDef: t.lampiranTemplat.map((l) => ({ ...l })),
  periodeId: t.periodeBerlakuId ?? "",
  kepala: { judulDokumen: t.kepala.judulDokumen, subjudul: t.kepala.subjudul ?? "", pengantar: t.kepala.pengantar ?? "" },
  kop: t.kop,
});

export const BAGIAN_BARU: BarisBagianMentah = { nama: "", batas: "", tanpaBatas: true, wajib: true, petunjuk: "", jenisIsian: "teks", jumlahButir: "", pemisah: "", wajibGambar: false, ketGambar: "", sitasiBernomor: false, daftarPustaka: false, batasMin: "", wajibTabel: false, kolomTabel: [], judulTabel: "", frasaWajib: [], unsurIsi: [] };

export const sidikIsian = (i: IsianForm) => JSON.stringify(i);
