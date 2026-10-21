import type { Metadata } from "next";
import { StubJendela } from "@/components/layout/stub";

export const metadata: Metadata = { title: "Demo" };

export default function Demo() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <StubJendela
        kode="DEMO"
        judul="Pusat Demo"
        deskripsi="Reset dan seed, jalan pintas UC-01..UC-09, enam skenario, dan sakelar masa pengusulan."
        pemilik="tahap integrasi sesudah agen A sampai D (belum ditetapkan)"
      />
    </main>
  );
}
