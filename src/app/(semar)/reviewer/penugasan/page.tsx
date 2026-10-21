import type { Metadata } from "next";
import { StubJendela } from "@/components/layout/stub";

export const metadata: Metadata = { title: "Daftar Penugasan (J-07)" };

export default async function Halaman() {
  
  return <StubJendela kode="J-07" judul="Daftar Penugasan" pemilik="agen D" />;
}
