import type { Metadata } from "next";
import { StubJendela } from "@/components/layout/stub";

export const metadata: Metadata = { title: "Pemeriksaan Proposal (J-08)" };

export default async function Halaman() {
  
  return <StubJendela kode="J-08" judul="Pemeriksaan Proposal" pemilik="agen D" />;
}
