import { Download } from "lucide-react";
import { kelasTombol, type ButtonProps } from "./button";

/**
 * Tombol unduh: tautan biasa ke rute unduhan (atribut `download` membiarkan peramban memakai nama dari Content-Disposition).
 * Contoh: <TombolUnduh href={`/api/semar/templat/${id}/unduh`}>Unduh Templat (.docx)</TombolUnduh>
 */
export function TombolUnduh({
  href,
  children,
  varian = "sekunder",
  ukuran = "md",
  className,
}: {
  href: string;
  children: React.ReactNode;
  varian?: ButtonProps["varian"];
  ukuran?: ButtonProps["ukuran"];
  className?: string;
}) {
  return (
    <a href={href} download className={kelasTombol(varian, ukuran, className)}>
      <Download aria-hidden className="size-4" />
      {children}
    </a>
  );
}
