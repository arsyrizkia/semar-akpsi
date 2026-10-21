import type { Metadata } from "next";
import { StubJendela } from "@/components/layout/stub";

export const metadata: Metadata = { title: "Penugasan Reviewer (J-04)" };

export default async function Halaman() {
  
  return <StubJendela kode="J-04" judul="Penugasan Reviewer" pemilik="agen B" />;
}
