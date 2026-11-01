import { NextResponse } from "next/server";
import { catatLogAudit } from "@/lib/audit";
import { bima } from "@/lib/bima/client";
import { PraPeriksaDitolak, praPeriksaNaskah } from "@/lib/pengajuan/pra-periksa";
import { bacaTokenPraPeriksa, buatTiketLolos, sidikBerkas } from "@/lib/pengajuan/tiket";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * M-16 Pemeriksaan SEMAR di BIMA (UC-06 di dalam UC-05): menerima naskah PDF yang diunggah pengusul di modal SEMAR beserta token
 * pra-periksa dari BIMA, menjalankan pemeriksaan deterministik tanpa membuat versi, dan mengembalikan hasil per butir. Bila lolos semua,
 * SEMAR memberi tiket lolos yang mengikat sidik berkas ke usulan; hanya dengan tiket itu BIMA mau menyimpan naskahnya.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const klaim = await bacaTokenPraPeriksa(String(form?.get("token") ?? ""));
  if (!klaim) return NextResponse.json({ galat: "Sesi pemeriksaan sudah berakhir. Tutup jendela ini lalu buka lagi dari BIMA." }, { status: 401 });
  const f = form?.get("berkas");
  if (!(f instanceof File) || f.size === 0) return NextResponse.json({ galat: "Pilih dokumen usulan (PDF) terlebih dahulu." }, { status: 400 });

  const bytes = Buffer.from(await f.arrayBuffer());
  try {
    // judul dan lampiran usulan dibaca dari BIMA (judul BIMA dibandingkan dengan judul di naskah)
    const usulan = await bima.ambilProposal(klaim.idProposal).catch(() => null);
    const hasil = await praPeriksaNaskah(
      { bytes, nama: f.name, tipe: f.type },
      { skemaKode: klaim.skemaKode, judulBima: usulan?.judul ?? klaim.judul, lampiranAda: (usulan?.lampiran ?? []).flatMap((l) => (l.namaLampiran ? [l.namaLampiran] : [])) },
    );
    await catatLogAudit({
      aktor: klaim.idBima,
      aksi: "pengajuan.pra_periksa",
      objek: klaim.idProposal,
      rincian: { lolos: hasil.lolos, jumlahButir: hasil.jumlahButir, jumlahGagal: hasil.jumlahGagal, berkas: f.name, ukuran: bytes.length },
    });
    const tiket = hasil.lolos ? await buatTiketLolos({ idProposal: klaim.idProposal, sidik: sidikBerkas(bytes), jumlahButir: hasil.jumlahButir }) : null;
    return NextResponse.json({ hasil, tiket });
  } catch (e) {
    if (e instanceof PraPeriksaDitolak) return NextResponse.json({ galat: e.message }, { status: 400 });
    console.error("[pra-periksa]", e);
    return NextResponse.json({ galat: "Pemeriksaan tidak dapat dijalankan sekarang. Coba lagi beberapa saat." }, { status: 500 });
  }
}
