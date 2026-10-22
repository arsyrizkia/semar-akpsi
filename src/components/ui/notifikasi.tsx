"use client";

import { Toaster, toast } from "sonner";

/**
 * Notifikasi (toast) bertema. Sonner menyediakan wilayah aria-live; pesan galat bertahan lebih lama.
 * Pakai `beriTahu.sukses("...")` atau `toast` langsung dari "sonner".
 */
export function Notifikasi() {
  return (
    <Toaster
      position="bottom-right"
      offset={{ bottom: "4.5rem", right: "1rem" }}
      mobileOffset={{ bottom: "4.5rem", right: "1rem", left: "1rem" }}
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast: "!rounded-md !border !border-primer-200 !bg-white !text-primer-900 !shadow-md !font-sans",
          success: "!border-daun-500 !bg-daun-100 !text-daun-700",
          error: "!border-bata-600 !bg-bata-100 !text-bata-700",
          warning: "!border-peringatan-500 !bg-peringatan-50 !text-primer-900",
        },
      }}
    />
  );
}

export const beriTahu = {
  sukses: (pesan: string) => toast.success(pesan),
  galat: (pesan: string) => toast.error(pesan, { duration: 8000 }),
  peringatan: (pesan: string) => toast.warning(pesan),
  info: (pesan: string) => toast(pesan),
};
