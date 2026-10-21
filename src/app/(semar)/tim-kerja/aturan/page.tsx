import type { Metadata } from "next";
import { StubJendela } from "@/components/layout/stub";
import { wajibPengelola } from "@/lib/auth";
export const metadata: Metadata = { title: "Aturan Pemeriksaan (J-03)" };

export default async function Halaman() {
  await wajibPengelola();
  return <StubJendela kode="J-03" judul="Aturan Pemeriksaan" pemilik="agen A" />;
}
