import { Suspense } from "react";
import { HeaderSemar } from "@/components/layout/header-semar";
import { MenuTimKerja } from "@/components/layout/menu-tim-kerja";
import { CatatanSkenario } from "@/components/layout/catatan-skenario";
import { PesanGalat } from "@/components/layout/pesan-galat";
import { wajibMasuk } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Cangkang SEMAR: header bertema + menu sesuai peran. Reviewer dan pengusul tanpa menu (NFR 5.1). */
export default async function LayoutSemar({ children }: { children: React.ReactNode }) {
  const { akun, pengelola } = await wajibMasuk();
  return (
    <div className="min-h-screen">
      <HeaderSemar akun={akun} pengelola={pengelola}>
        {akun.peran === "tim_kerja" ? <MenuTimKerja pengelola={pengelola} /> : null}
      </HeaderSemar>
      <main className="mx-auto max-w-6xl px-4 pb-40 pt-8">
        <Suspense fallback={null}>
          <PesanGalat />
          <CatatanSkenario />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
