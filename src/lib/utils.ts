import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tanggalFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const waktuFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

export const formatTanggal = (d: Date | string | null | undefined) => (d ? tanggalFmt.format(new Date(d)) : "-");
export const formatWaktu = (d: Date | string | null | undefined) => (d ? waktuFmt.format(new Date(d)) + " WIB" : "-");
export const formatAngka = (n: number) => new Intl.NumberFormat("id-ID").format(n);
