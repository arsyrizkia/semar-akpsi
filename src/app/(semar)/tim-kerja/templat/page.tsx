import type { Metadata } from "next";
import { StubJendela } from "@/components/layout/stub";
import { wajibPengelola } from "@/lib/auth";
export const metadata: Metadata = { title: "Templat Proposal (J-02)" };

export default async function Halaman() {
  await wajibPengelola();
  return <StubJendela kode="J-02" judul="Templat Proposal" pemilik="agen A" />;
}
