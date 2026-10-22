import { Suspense } from "react";
import { CangkangSemar } from "@/components/layout/cangkang";
import { PesanGalat } from "@/components/layout/pesan-galat";
import { targetSetelahMasuk, wajibMasuk } from "@/lib/auth";
import { menuUntukPeran } from "@/lib/menu";

export const dynamic = "force-dynamic";

/** Cangkang SEMAR: sidebar per peran (laci di layar sempit) + isi. Pengusul tanpa menu (NFR 5.1). */
export default async function LayoutSemar({ children }: { children: React.ReactNode }) {
  const { akun, pengelola } = await wajibMasuk();
  return (
    <CangkangSemar
      menu={menuUntukPeran({ peran: akun.peran, pengelola })}
      nama={akun.nama}
      peran={akun.peran}
      pengelola={pengelola}
      institusi={akun.institusi}
      beranda={akun.peran === "pengusul" ? null : targetSetelahMasuk(akun)}
      bisaKeluar={akun.peran !== "pengusul"}
    >
      <Suspense fallback={null}>
        <PesanGalat />
      </Suspense>
      {children}
    </CangkangSemar>
  );
}
