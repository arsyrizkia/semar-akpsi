import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { NavigatorDemo } from "@/components/layout/navigator-demo";
import { Notifikasi } from "@/components/ui/notifikasi";

/** Outfit untuk merek, judul, dan teks UI (variabel; angka tabel memakai fitur tnum bawaan Outfit). */
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });

export const metadata: Metadata = {
  // judul tab per halaman: "J-xx Nama · SEMAR" (export metadata di tiap page.tsx)
  title: { default: "SEMAR", template: "%s · SEMAR" },
  description: "Sistem Evaluasi Mandiri dan Asisten Reviewer: prototipe pemeriksaan administratif proposal penelitian.",
};

/** Warna bilah peramban sama dengan latar halaman (latar). */
export const viewport: Viewport = { themeColor: "#F4F7FC", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={outfit.variable}>
      <body className="min-h-screen antialiased">
        {children}
        <NavigatorDemo />
        <Notifikasi />
      </body>
    </html>
  );
}
