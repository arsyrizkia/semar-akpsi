import type { Metadata } from "next";
import { StubJendela } from "@/components/layout/stub";

export const metadata: Metadata = { title: "Pemantauan Kesesuaian (J-05)" };

export default async function Halaman() {
  
  return <StubJendela kode="J-05" judul="Pemantauan Kesesuaian" pemilik="agen B" />;
}
