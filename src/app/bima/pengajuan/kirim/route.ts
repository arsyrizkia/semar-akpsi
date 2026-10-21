import { NextResponse } from "next/server";
import { ambilSesiBima } from "@/lib/bima/sesi";
import { daftarSkemaBima, simpanUsulanBima, type BerkasUnggahan } from "@/lib/bima/servis-pengajuan";
import { jenisBerkas, TIPE_DOCX, TIPE_PDF } from "@/lib/pengajuan/ekstraksi";
import { buatTokenPengajuan } from "@/lib/pengajuan/token";
import { urlSsoSemar } from "@/lib/bima/sso";

export const dynamic = "force-dynamic";

const BATAS_BYTE = 8 * 1024 * 1024;

interface GalatForm {
  judul?: string;
  skema?: string;
  naskah?: string;
  umum?: string;
  lampiran?: Record<string, string>;
}

async function bacaBerkas(f: FormDataEntryValue | null, bolehKosong: boolean): Promise<{ berkas?: BerkasUnggahan; galat?: string }> {
  if (!(f instanceof File) || f.size === 0) return bolehKosong ? {} : { galat: "Berkas wajib diunggah." };
  if (f.size > BATAS_BYTE) return { galat: "Berkas terlalu besar (maksimal 8 MB)." };
  const bytes = Buffer.from(await f.arrayBuffer());
  const jenis = jenisBerkas(f.name, f.type, bytes);
  if (!jenis) return { galat: "Format berkas harus DOCX atau PDF." };
  return { berkas: { nama: f.name, tipe: jenis === "pdf" ? TIPE_PDF : TIPE_DOCX, bytes } };
}

/**
 * Tombol "Ajukan Usulan" di BIMA tiruan: menyimpan usulan dan berkas ke tabel bima_*, lalu mengembalikan alamat J-06
 * di SEMAR (lewat SSO) beserta token pengajuan yang membawa idProposal dan identitas pengusul.
 */
export async function POST(req: Request) {
  const akun = await ambilSesiBima();
  if (!akun || akun.peran !== "pengusul") return NextResponse.json({ galat: { umum: "Masuk sebagai pengusul terlebih dahulu." } }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ galat: { umum: "Permintaan tidak valid." } }, { status: 400 });

  const galat: GalatForm = {};
  const idProposal = String(form.get("idProposal") ?? "").trim() || undefined;
  const judul = String(form.get("judul") ?? "").trim();
  const skemaKode = String(form.get("skema") ?? "").trim();
  if (!judul) galat.judul = "Judul usulan wajib diisi.";
  const skema = (await daftarSkemaBima()).find((s) => s.kode === skemaKode);
  if (!skema) galat.skema = "Pilih skema pendanaan.";

  const naskah = await bacaBerkas(form.get("naskah"), Boolean(idProposal));
  if (naskah.galat) galat.naskah = naskah.galat;

  const lampiran: Record<string, BerkasUnggahan> = {};
  for (const nama of skema?.lampiranWajib ?? []) {
    const l = await bacaBerkas(form.get(`lampiran:${nama}`), true);
    if (l.galat) (galat.lampiran ??= {})[nama] = l.galat;
    else if (l.berkas) lampiran[nama] = l.berkas;
  }
  if (Object.keys(galat).length) return NextResponse.json({ galat }, { status: 400 });

  try {
    const { idProposal: id } = await simpanUsulanBima({
      pengusulIdBima: akun.idBima,
      idProposal,
      judul,
      skemaKode,
      naskah: naskah.berkas,
      lampiran,
    });
    const token = await buatTokenPengajuan({ idProposal: id, idBima: akun.idBima, judul, skemaKode });
    const lanjut = await urlSsoSemar(akun.idBima, `/pengusul/mulai?token=${encodeURIComponent(token)}`);
    return NextResponse.json({ ok: true, idProposal: id, lanjut });
  } catch (e) {
    return NextResponse.json({ galat: { umum: (e as Error).message } }, { status: 400 });
  }
}
