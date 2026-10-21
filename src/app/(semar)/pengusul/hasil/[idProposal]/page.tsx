import type { Metadata } from "next";
import { StubJendela } from "@/components/layout/stub";

export const metadata: Metadata = { title: "Hasil Pemeriksaan Pengajuan (J-06)" };

export default async function Halaman() {
  
  return <StubJendela kode="J-06" judul="Hasil Pemeriksaan Pengajuan" pemilik="agen C" />;
}
