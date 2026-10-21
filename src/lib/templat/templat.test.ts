import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { basisAturan, butirCek, periodeSeleksi, skemaPendanaan, templatProposal } from "@/db/schema";
import { bagianTersimpan, batasKataValid, periksaKelengkapan } from "./kelengkapan";
import { daftarButirBerlaku, nonaktifkanButir, periksaKunciButir, simpanButir, simpanVersiBaru, ujiPadaContoh } from "../aturan/layanan";
import { ambilDrafTemplat, ambilTemplatBerlaku, susunVersiBaru, terbitkan, type Pelaku } from "./layanan";
import { MASUKAN_BUTIR_KOSONG } from "../aturan/parameter";

const lengkap = {
  bagian: [
    { nama: "Ringkasan", batas: "300", tanpaBatas: false, wajib: true },
    { nama: "Daftar Pustaka", batas: "", tanpaBatas: true, wajib: true },
  ],
  lampiran: ["Surat Pernyataan Mitra"],
  periodeBerlakuId: "p1",
};

describe("periksaKelengkapan (UC-01 S-2)", () => {
  it("isian lengkap lolos", () => {
    expect(periksaKelengkapan(lengkap).lengkap).toBe(true);
  });

  it("menandai nama kosong, batas kata tidak valid, lampiran kosong, dan periode kosong", () => {
    const h = periksaKelengkapan({
      bagian: [
        { nama: " ", batas: "300", tanpaBatas: false, wajib: true },
        { nama: "Metode", batas: "abc", tanpaBatas: false, wajib: true },
        { nama: "Hasil", batas: "0", tanpaBatas: false, wajib: true },
      ],
      lampiran: ["", "Artikel"],
      periodeBerlakuId: null,
    });
    expect(h.lengkap).toBe(false);
    expect(h.bagian.map((b) => b.nama)).toEqual([true, false, false]);
    expect(h.bagian.map((b) => b.batas)).toEqual([false, true, true]);
    expect(h.lampiran).toEqual([true, false]);
    expect(h.periode).toBe(true);
  });

  it("menandai nama bagian ganda dan templat tanpa bagian", () => {
    const ganda = periksaKelengkapan({
      ...lengkap,
      bagian: [lengkap.bagian[0], { ...lengkap.bagian[0], nama: "ringkasan" }],
    });
    expect(ganda.bagian.every((b) => b.nama)).toBe(true);
    expect(periksaKelengkapan({ ...lengkap, bagian: [] }).lengkap).toBe(false);
  });

  it("batas kata dan nilai tersimpan", () => {
    expect(batasKataValid("1.200")).toBe(false);
    expect(batasKataValid("1200")).toBe(true);
    expect(bagianTersimpan(lengkap.bagian[1])).toEqual({ nama: "Daftar Pustaka", batasKata: null, wajib: true });
    expect(bagianTersimpan(lengkap.bagian[0]).batasKata).toBe(300);
  });
});

const ada = Boolean(process.env.DATABASE_URL);
const kode = `TES-A-${Date.now().toString(36)}`.toUpperCase();
const pelaku: Pelaku = { id: null, idBima: "tes-agen-a" };
const hari = (n: number) => new Date(Date.now() + n * 86_400_000);
const isoHari = (n: number) => hari(n).toISOString().slice(0, 10);

describe.skipIf(!ada)("alur UC-01 dan UC-02 pada skema sementara", () => {
  let skemaId = "";
  let periodeId = "";

  afterAll(async () => {
    if (!skemaId) return;
    const db = getDb();
    try {
      const basis = await db.select({ id: basisAturan.id }).from(basisAturan).where(eq(basisAturan.skemaId, skemaId));
      if (basis.length) await db.delete(butirCek).where(inArray(butirCek.basisAturanId, basis.map((b) => b.id)));
      await db.delete(basisAturan).where(eq(basisAturan.skemaId, skemaId));
      await db.delete(templatProposal).where(eq(templatProposal.skemaId, skemaId));
      await db.delete(skemaPendanaan).where(eq(skemaPendanaan.id, skemaId));
      if (periodeId) await db.delete(periodeSeleksi).where(eq(periodeSeleksi.id, periodeId));
    } catch {
      /* data uji dibersihkan sebisanya */
    }
  });

  it("S-1: skema baru belum punya templat; Susun Versi Baru membuat versi 1", async () => {
    const db = getDb();
    const [s] = await db.insert(skemaPendanaan).values({ kode, namaSkema: `Skema Uji ${kode}`, contoh: true }).returning();
    skemaId = s.id;
    const [p] = await db
      .insert(periodeSeleksi)
      .values({ tahun: 2099, nama: `Periode Uji ${kode}`, tanggalBuka: hari(-10), tanggalTutup: hari(10), contoh: true })
      .returning();
    periodeId = p.id;

    expect(await ambilTemplatBerlaku(skemaId)).toBeNull();
    const r = await susunVersiBaru(skemaId, pelaku);
    expect(r.templat.versi).toBe(1);
    expect(r.templat.status).toBe("Draf");
    expect(r.dilanjutkan).toBe(false);
    // S-3: draf yang sama dibuka kembali
    const lagi = await susunVersiBaru(skemaId, pelaku);
    expect(lagi.dilanjutkan).toBe(true);
    expect(lagi.templat.id).toBe(r.templat.id);
  });

  it("S-2, 9a, lalu terbit: butir turunan berstatus Draf dan terkunci", async () => {
    const draf = (await ambilDrafTemplat(skemaId))!;
    const isian = {
      bagian: [
        { nama: "Ringkasan", batas: "300", tanpaBatas: false, wajib: true },
        { nama: "Metode", batas: "1200", tanpaBatas: false, wajib: true },
        { nama: "Daftar Pustaka", batas: "", tanpaBatas: true, wajib: true },
      ],
      lampiran: ["Surat Pernyataan Mitra"],
      periodeBerlakuId: periodeId,
    };
    const tidakLengkap = await terbitkan({ skemaId, templatId: draf.id, isian: { ...isian, periodeBerlakuId: null }, pelaku, masaBerjalan: false });
    expect(tidakLengkap.hasil).toBe("tidak-lengkap");

    const tahan = await terbitkan({ skemaId, templatId: draf.id, isian, pelaku, masaBerjalan: true });
    expect(tahan.hasil).toBe("draf-disimpan");
    expect(await ambilTemplatBerlaku(skemaId)).toBeNull();
    expect((await ambilDrafTemplat(skemaId))?.bagian).toHaveLength(3);

    const terbit = await terbitkan({ skemaId, templatId: draf.id, isian, pelaku, masaBerjalan: false });
    expect(terbit).toMatchObject({ hasil: "terbit", versi: 1, jumlahButir: 3 + 2 + 1 }); // 3 BGN + 2 KTA + 1 LMP
    expect((await ambilTemplatBerlaku(skemaId))?.versi).toBe(1);
    expect(await ambilDrafTemplat(skemaId)).toBeNull();

    const t = await daftarButirBerlaku(skemaId, periodeId);
    expect(t.draf).not.toBeNull();
    expect(t.nyata).toBeNull();
    expect(t.butir).toHaveLength(6);
    expect(t.butir.every((b) => b.asal === "templat" && b.status === "Draf" && b.jenis === "deterministik")).toBe(true);
  });

  it("4a: butir turunan templat ditolak diubah dan tidak dapat dinonaktifkan", async () => {
    const { butir } = await daftarButirBerlaku(skemaId, periodeId);
    const kunci = await periksaKunciButir(butir[0].id);
    expect(kunci.terkunci).toBe(true);
    expect(kunci.pesan).toMatch(/hanya dapat diubah melalui jendela J-02 Templat Proposal/);
    const ubah = await simpanButir({ skemaId, butirId: butir[0].id, pelaku, masukan: { ...MASUKAN_BUTIR_KOSONG, jenis: "deterministik", kode: "X", deskripsi: "x", aturanHitung: "kata kunci tepat lima" } });
    expect(ubah).toMatchObject({ ok: false, terkunci: true });
    expect(await nonaktifkanButir({ skemaId, butirId: butir[0].id, pelaku })).toMatchObject({ ok: false, terkunci: true });
  });

  it("menambah, mengubah, dan menonaktifkan butir manual; kode ganda ditolak", async () => {
    const baru = await simpanButir({
      skemaId,
      pelaku,
      masukan: { ...MASUKAN_BUTIR_KOSONG, jenis: "deterministik", kode: "KAT-01", deskripsi: "Kata kunci tepat lima", aturanHitung: "Kata kunci tepat lima, dipisahkan titik koma" },
    });
    expect(baru).toMatchObject({ ok: true, baru: true });
    const ganda = await simpanButir({
      skemaId,
      pelaku,
      masukan: { ...MASUKAN_BUTIR_KOSONG, jenis: "deterministik", kode: "KAT-01", deskripsi: "lagi", aturanHitung: "kata kunci tepat lima" },
    });
    expect(ganda).toMatchObject({ ok: false });
    expect((ganda as { galat: { kode?: string } }).galat.kode).toBeTruthy();

    const sem = await simpanButir({
      skemaId,
      pelaku,
      masukan: { ...MASUKAN_BUTIR_KOSONG, jenis: "semantik", kode: "ISI-01", deskripsi: "Ringkasan memuat tujuan", pertanyaan: "Apakah ringkasan memuat tujuan?", bagian: "Ringkasan" },
    });
    expect(sem).toMatchObject({ ok: true });

    const { butir } = await daftarButirBerlaku(skemaId, periodeId);
    const kat = butir.find((b) => b.kode === "KAT-01")!;
    expect(kat.status).toBe("Draf");
    expect(kat.parameter).toEqual({ tipe: "kata_kunci", jumlah: 5, pemisah: ";" });
    const diubah = await simpanButir({
      skemaId,
      butirId: kat.id,
      pelaku,
      masukan: { ...MASUKAN_BUTIR_KOSONG, jenis: "deterministik", kode: "KAT-01", deskripsi: "Kata kunci tepat enam", aturanHitung: "Kata kunci tepat enam, dipisah koma" },
    });
    expect(diubah).toMatchObject({ ok: true, baru: false });
    const nonaktif = await nonaktifkanButir({ skemaId, butirId: (await daftarButirBerlaku(skemaId, periodeId)).butir.find((b) => b.kode === "ISI-01")!.id, pelaku });
    expect(nonaktif).toMatchObject({ ok: true, kode: "ISI-01" });
  });

  it("Uji pada Contoh tidak melempar galat walau pemeriksa belum tersedia", async () => {
    const h = await ujiPadaContoh(skemaId, periodeId);
    expect(Array.isArray(h.contoh)).toBe(true);
    expect(Array.isArray(h.peringatan)).toBe(true);
  });

  it("8a: tanggal berlaku di tengah masa pengusulan ditolak; di luar rentang disimpan dan semua butir Aktif", async () => {
    const tolak = await simpanVersiBaru({ skemaId, periodeId, tanggalBerlaku: isoHari(0), pelaku, masaBerjalan: true });
    expect(tolak).toMatchObject({ ok: false, alasan: "tanggal" });
    expect((tolak as { pesan: string }).pesan).toMatch(/tidak boleh jatuh di antara tanggal buka dan tanggal tutup/);
    expect((await daftarButirBerlaku(skemaId, periodeId)).draf).not.toBeNull(); // basis tidak berubah

    const ok = await simpanVersiBaru({ skemaId, periodeId, tanggalBerlaku: isoHari(20), pelaku, masaBerjalan: true });
    expect(ok).toMatchObject({ ok: true, versi: 1 });
    const t = await daftarButirBerlaku(skemaId, periodeId);
    expect(t.draf).toBeNull();
    expect(t.nyata?.versi).toBe(1);
    expect(t.butir.filter((b) => b.status !== "Nonaktif").every((b) => b.status === "Aktif")).toBe(true);
    expect(t.butir.some((b) => b.kode === "ISI-01" && b.status === "Nonaktif")).toBe(true);
  });

  it("templat versi 2: versi lama Arsip, butir turunan lama Nonaktif pada draf, butir baru Draf", async () => {
    const s = await susunVersiBaru(skemaId, pelaku);
    expect(s.templat.versi).toBe(2);
    expect(s.templat.bagian).toHaveLength(3); // disalin dari templat berlaku
    const isian = {
      bagian: s.templat.bagian.map((b) => ({ nama: b.nama, batas: b.batasKata == null ? "" : String(b.batasKata), tanpaBatas: b.batasKata == null, wajib: b.wajib })),
      lampiran: s.templat.lampiranWajib,
      periodeBerlakuId: periodeId,
    };
    isian.bagian[1].batas = "1400";
    const r = await terbitkan({ skemaId, templatId: s.templat.id, isian, pelaku, masaBerjalan: false });
    expect(r).toMatchObject({ hasil: "terbit", versi: 2 });

    const [lama] = await getDb().select().from(templatProposal).where(eq(templatProposal.skemaId, skemaId)).orderBy(templatProposal.versi);
    expect(lama.status).toBe("Arsip");
    const t = await daftarButirBerlaku(skemaId, periodeId);
    expect(t.draf?.versi).toBe(2);
    const turunan = t.butir.filter((b) => b.asal === "templat");
    expect(turunan.filter((b) => b.status === "Nonaktif")).toHaveLength(6);
    expect(turunan.filter((b) => b.status === "Draf")).toHaveLength(6);
    // basis versi 1 yang berlaku tidak berubah sebelum Simpan Versi
    expect(t.nyata?.versi).toBe(1);
  });
});
