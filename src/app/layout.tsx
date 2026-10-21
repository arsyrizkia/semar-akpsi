import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const judul = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-judul", display: "swap" });
const ui = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SEMAR", template: "%s | SEMAR" },
  description: "Sistem Evaluasi Mandiri dan Asisten Reviewer: prototipe pemeriksaan administratif proposal penelitian.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${judul.variable} ${ui.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
