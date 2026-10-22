/**
 * Ilustrasi dan logo Semar buatan sendiri (SVG, siluet sederhana bergaya wayang):
 * perut buncit, kuncung di ubun-ubun, tangan menunjuk dengan telunjuk. Orisinal, bukan salinan gambar yang ada.
 */
import { cn } from "@/lib/utils";

interface SvgProps {
  className?: string;
  judul?: string;
}

/** Ilustrasi badan penuh. */
export function SemarIlustrasi({ className, judul = "Ilustrasi Semar" }: SvgProps) {
  return (
    <svg viewBox="0 0 220 280" role="img" aria-label={judul} className={cn("h-auto w-full", className)}>
      <title>{judul}</title>
      {/* bayangan tanah */}
      <ellipse cx="108" cy="266" rx="62" ry="7" opacity=".18" className="fill-merek-semar-900" />
      {/* kaki / kain */}
      <path d="M52 188 C42 222 48 252 66 262 L150 262 C168 252 174 222 164 188 Z" className="fill-merek-semar-700" />
      <path d="M66 262 L66 244 M86 262 L86 238 M108 262 L108 236 M130 262 L130 238 M150 262 L150 244" strokeWidth="1.6" opacity=".7" className="stroke-aksen-300" />
      {/* perut buncit */}
      <ellipse cx="108" cy="156" rx="64" ry="62" className="fill-merek-semar-600" />
      <ellipse cx="108" cy="156" rx="64" ry="62" fill="none" strokeWidth="2" className="stroke-merek-semar-900" />
      {/* motif kawung di perut */}
      <g fill="none" strokeWidth="1.4" opacity=".85" className="stroke-aksen-300">
        <ellipse cx="108" cy="140" rx="7" ry="15" />
        <ellipse cx="108" cy="172" rx="7" ry="15" />
        <ellipse cx="92" cy="156" rx="15" ry="7" />
        <ellipse cx="124" cy="156" rx="15" ry="7" />
      </g>
      <circle cx="108" cy="156" r="3.2" className="fill-aksen-300" />
      {/* selempang */}
      <path d="M60 118 C80 140 122 170 160 176" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".9" className="stroke-aksen-300" />
      {/* leher & bahu */}
      <path d="M82 104 C84 92 132 92 134 104 C146 110 150 120 146 128 L70 128 C66 120 70 110 82 104 Z" className="fill-merek-semar-700" />
      {/* tangan kiri (di belakang) */}
      <path d="M62 126 C42 134 38 160 50 178 C56 182 62 178 60 172 C54 160 58 148 70 142 Z" strokeWidth="1.6" className="fill-merek-semar-700 stroke-merek-semar-900" />
      {/* tangan kanan menunjuk */}
      <path d="M144 122 C162 116 178 106 192 92 C196 88 202 92 199 97 C190 112 176 126 154 140 Z" strokeWidth="1.6" className="fill-merek-semar-700 stroke-merek-semar-900" />
      <path d="M194 91 L212 70" strokeWidth="5" strokeLinecap="round" className="stroke-merek-semar-kulit" />
      <path d="M194 91 L212 70" strokeWidth="1" strokeLinecap="round" opacity=".5" className="stroke-merek-semar-900" />
      {/* kepala */}
      <ellipse cx="108" cy="72" rx="30" ry="32" strokeWidth="2" className="fill-merek-semar-700 stroke-merek-semar-900" />
      {/* kuncung (jambul) */}
      <path d="M108 42 C98 30 102 14 112 8 C120 16 118 32 108 42 Z" className="fill-merek-semar-900" />
      <path d="M108 44 C118 36 130 38 134 30 C128 46 118 52 108 50 Z" className="fill-merek-semar-900" />
      {/* wajah */}
      <ellipse cx="108" cy="78" rx="21" ry="24" className="fill-merek-semar-kulit" />
      <ellipse cx="108" cy="78" rx="21" ry="24" fill="none" strokeWidth="1.4" className="stroke-merek-semar-900" />
      <path d="M92 70 Q98 66 104 70" strokeWidth="2" fill="none" strokeLinecap="round" className="stroke-merek-semar-900" />
      <path d="M112 70 Q118 66 124 70" strokeWidth="2" fill="none" strokeLinecap="round" className="stroke-merek-semar-900" />
      <circle cx="98" cy="73" r="2.2" className="fill-merek-semar-900" />
      <circle cx="118" cy="73" r="2.2" className="fill-merek-semar-900" />
      <ellipse cx="108" cy="82" rx="5.5" ry="6" strokeWidth="1.2" className="fill-merek-semar-kulit-tua stroke-merek-semar-900" />
      <path d="M94 94 Q108 104 122 94" strokeWidth="2" fill="none" strokeLinecap="round" className="stroke-merek-semar-900" />
    </svg>
  );
}

/** Lambang kecil: kepala dengan kuncung di dalam bingkai kawung. */
export function LambangSemar({ className, judul = "Lambang SEMAR" }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label={judul} className={cn("size-10", className)}>
      <title>{judul}</title>
      <circle cx="24" cy="24" r="22" strokeWidth="2" className="fill-merek-semar-900 stroke-aksen-300" />
      <path d="M24 6 C20 10 21 15 24 17 C27 15 28 10 24 6 Z" className="fill-aksen-300" />
      <ellipse cx="24" cy="26" rx="11" ry="12" className="fill-merek-semar-kulit" />
      <path d="M17 24 Q20 22 23 24 M25 24 Q28 22 31 24" strokeWidth="1.5" fill="none" strokeLinecap="round" className="stroke-merek-semar-900" />
      <ellipse cx="24" cy="29" rx="2.6" ry="2.8" strokeWidth=".8" className="fill-merek-semar-kulit-tua stroke-merek-semar-900" />
      <path d="M18 35 Q24 40 30 35" strokeWidth="1.5" fill="none" strokeLinecap="round" className="stroke-merek-semar-900" />
    </svg>
  );
}

/** Lambang + tulisan SEMAR. */
export function LogoSemar({ className, terang = true }: { className?: string; terang?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LambangSemar />
      <span className="flex flex-col leading-tight">
        <span translate="no" className={cn("text-2xl font-bold tracking-wide", terang ? "text-aksen-300" : "text-merek-semar-700")}>SEMAR</span>
        <span className={cn("text-[11px] tracking-wide", terang ? "text-latar-200" : "text-primer-700")}>
          Sistem Evaluasi Mandiri dan Asisten Reviewer
        </span>
      </span>
    </span>
  );
}
