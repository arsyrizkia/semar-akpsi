/** Sesi sisi BIMA tiruan (cookie bima_sesi). Hanya untuk halaman dan route /bima/*. */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bimaAkun } from "@/db/schema";
import { COOKIE_BIMA, verifikasiSesiBima } from "../sesi";
import { alamatMasukCepat, type BarisAkunBantuan, type KelompokCepat } from "./akun-demo";
import { AKUN_PROTOTIPE } from "./akun-prototipe";
import { reviewerMassal } from "@/lib/demo/profil-skala";

export type AkunBima = typeof bimaAkun.$inferSelect;

export async function ambilSesiBima(): Promise<AkunBima | null> {
  const jar = await cookies();
  const isi = await verifikasiSesiBima(jar.get(COOKIE_BIMA)?.value);
  if (!isi) return null;
  const [a] = await getDb().select().from(bimaAkun).where(eq(bimaAkun.idBima, isi.idBima));
  return a ?? null;
}

/** Guard halaman BIMA: arahkan ke /bima/masuk bila belum masuk. */
export async function wajibSesiBima(kembali = "/bima/pengajuan"): Promise<AkunBima> {
  const a = await ambilSesiBima();
  if (!a) redirect(`/bima/masuk?kembali=${encodeURIComponent(kembali)}`);
  return a;
}

export async function wajibPengusulBima(kembali = "/bima/pengajuan"): Promise<AkunBima> {
  const a = await wajibSesiBima(kembali);
  if (a.peran !== "pengusul") redirect("/bima/masuk?galat=peran");
  return a;
}

const PERAN_CEPAT = [
  { peran: "tim_kerja", judul: "Tim Kerja DPPM" },
  { peran: "reviewer", judul: "Reviewer" },
  { peran: "pengusul", judul: "Pengusul" },
] as const;

/**
 * Pilihan "Masuk cepat" per peran, dan baris tabel akun untuk dialog Bantuan (username/email dari akun.json). Akun reviewer massal skenario skala (rvw-skala-*, rvw-c12-*) tidak ditampilkan. Pengusul dapat diarahkan
 * ke BIMA (`kembaliPengusul`) karena pengusul tidak masuk lewat J-01.
 */
export async function kelompokMasukCepat(o: { kembali: string; lanjut?: string; kembaliPengusul?: string; catatanPengusul?: string }): Promise<{
  kelompok: KelompokCepat[];
  tersembunyi: number;
  bantuan: BarisAkunBantuan[];
}> {
  const semua = await getDb().select().from(bimaAkun);
  const akun = semua
    .filter((a) => !reviewerMassal(a.idBima))
    .sort((a, b) => Number(b.hakAkses === "pengelola") - Number(a.hakAkses === "pengelola") || a.idBima.localeCompare(b.idBima, "id", { numeric: true }));
  const kelompok = PERAN_CEPAT.map((k) => {
    const pengusul = k.peran === "pengusul" && o.kembaliPengusul;
    return {
      judul: k.judul,
      catatan: k.peran === "pengusul" ? o.catatanPengusul : undefined,
      akun: akun
        .filter((a) => a.peran === k.peran)
        .map((a) => ({
          idBima: a.idBima,
          nama: a.nama,
          keterangan: a.hakAkses ? `${a.hakAkses === "pengelola" ? "Pengelola" : "Anggota"} · ${a.institusi}` : a.institusi,
          href: pengusul ? alamatMasukCepat(a.idBima, o.kembaliPengusul!) : alamatMasukCepat(a.idBima, o.kembali, o.lanjut),
        })),
    };
  });
  const bantuan = PERAN_CEPAT.flatMap((k) =>
    akun
      .filter((a) => a.peran === k.peran)
      .flatMap((a) => {
        const p = AKUN_PROTOTIPE.find((x) => x.idBima === a.idBima);
        if (!p) return [];
        const peran = a.hakAkses ? `${k.judul} (${a.hakAkses === "pengelola" ? "pengelola" : "anggota"})` : k.judul;
        return [{ nama: a.nama, peran, username: p.username, email: p.email }];
      }),
  );
  return { kelompok, tersembunyi: semua.length - akun.length, bantuan };
}
