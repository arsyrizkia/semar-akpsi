import { Alert, JudulHalaman, Panel } from "@/components/ui";

/** Penanda halaman yang belum dibangun. Agen pemilik mengganti seluruh isi page.tsx-nya. */
export function StubJendela({ kode, judul, deskripsi, pemilik }: { kode: string; judul: string; deskripsi?: string; pemilik: string }) {
  return (
    <>
      <JudulHalaman kode={kode} judul={judul} deskripsi={deskripsi} />
      <Panel>
        <Alert jenis="info" judul="Halaman ini belum dibangun">
          Kerangka jendela {kode} sudah tersedia (menu, sesi, dan guard peran). Isi halaman dikerjakan oleh {pemilik}.
        </Alert>
      </Panel>
    </>
  );
}
