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
      <ellipse cx="108" cy="266" rx="62" ry="7" fill="#2b190e" opacity=".18" />
      {/* kaki / kain */}
      <path d="M52 188 C42 222 48 252 66 262 L150 262 C168 252 174 222 164 188 Z" fill="#573620" />
      <path d="M66 262 L66 244 M86 262 L86 238 M108 262 L108 236 M130 262 L130 238 M150 262 L150 244" stroke="#d4a63a" strokeWidth="1.6" opacity=".7" />
      {/* perut buncit */}
      <ellipse cx="108" cy="156" rx="64" ry="62" fill="#6f4727" />
      <ellipse cx="108" cy="156" rx="64" ry="62" fill="none" stroke="#2b190e" strokeWidth="2" />
      {/* motif kawung di perut */}
      <g fill="none" stroke="#d4a63a" strokeWidth="1.4" opacity=".85">
        <ellipse cx="108" cy="140" rx="7" ry="15" />
        <ellipse cx="108" cy="172" rx="7" ry="15" />
        <ellipse cx="92" cy="156" rx="15" ry="7" />
        <ellipse cx="124" cy="156" rx="15" ry="7" />
      </g>
      <circle cx="108" cy="156" r="3.2" fill="#d4a63a" />
      {/* selempang */}
      <path d="M60 118 C80 140 122 170 160 176" stroke="#d4a63a" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".9" />
      {/* leher & bahu */}
      <path d="M82 104 C84 92 132 92 134 104 C146 110 150 120 146 128 L70 128 C66 120 70 110 82 104 Z" fill="#573620" />
      {/* tangan kiri (di belakang) */}
      <path d="M62 126 C42 134 38 160 50 178 C56 182 62 178 60 172 C54 160 58 148 70 142 Z" fill="#573620" stroke="#2b190e" strokeWidth="1.6" />
      {/* tangan kanan menunjuk */}
      <path d="M144 122 C162 116 178 106 192 92 C196 88 202 92 199 97 C190 112 176 126 154 140 Z" fill="#573620" stroke="#2b190e" strokeWidth="1.6" />
      <path d="M194 91 L212 70" stroke="#e8c98a" strokeWidth="5" strokeLinecap="round" />
      <path d="M194 91 L212 70" stroke="#2b190e" strokeWidth="1" strokeLinecap="round" opacity=".5" />
      {/* kepala */}
      <ellipse cx="108" cy="72" rx="30" ry="32" fill="#573620" stroke="#2b190e" strokeWidth="2" />
      {/* kuncung (jambul) */}
      <path d="M108 42 C98 30 102 14 112 8 C120 16 118 32 108 42 Z" fill="#2b190e" />
      <path d="M108 44 C118 36 130 38 134 30 C128 46 118 52 108 50 Z" fill="#2b190e" />
      {/* wajah */}
      <ellipse cx="108" cy="78" rx="21" ry="24" fill="#e8c98a" />
      <ellipse cx="108" cy="78" rx="21" ry="24" fill="none" stroke="#2b190e" strokeWidth="1.4" />
      <path d="M92 70 Q98 66 104 70" stroke="#2b190e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M112 70 Q118 66 124 70" stroke="#2b190e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="98" cy="73" r="2.2" fill="#2b190e" />
      <circle cx="118" cy="73" r="2.2" fill="#2b190e" />
      <ellipse cx="108" cy="82" rx="5.5" ry="6" fill="#d9a35f" stroke="#2b190e" strokeWidth="1.2" />
      <path d="M94 94 Q108 104 122 94" stroke="#2b190e" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Lambang kecil: kepala dengan kuncung di dalam bingkai kawung. */
export function LambangSemar({ className, judul = "Lambang SEMAR" }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label={judul} className={cn("size-10", className)}>
      <title>{judul}</title>
      <circle cx="24" cy="24" r="22" fill="#2b190e" stroke="#d4a63a" strokeWidth="2" />
      <path d="M24 6 C20 10 21 15 24 17 C27 15 28 10 24 6 Z" fill="#d4a63a" />
      <ellipse cx="24" cy="26" rx="11" ry="12" fill="#e8c98a" />
      <path d="M17 24 Q20 22 23 24 M25 24 Q28 22 31 24" stroke="#2b190e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="24" cy="29" rx="2.6" ry="2.8" fill="#d9a35f" stroke="#2b190e" strokeWidth=".8" />
      <path d="M18 35 Q24 40 30 35" stroke="#2b190e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Lambang + tulisan SEMAR. */
export function LogoSemar({ className, terang = true }: { className?: string; terang?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LambangSemar />
      <span className="flex flex-col leading-tight">
        <span className={cn("font-serif text-2xl font-bold tracking-wide", terang ? "text-emas-100" : "text-sogan-800")}>SEMAR</span>
        <span className={cn("text-[11px] tracking-wide", terang ? "text-krem-200" : "text-sogan-600")}>
          Sistem Evaluasi Mandiri dan Asisten Reviewer
        </span>
      </span>
    </span>
  );
}
