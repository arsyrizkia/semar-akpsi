"use client";

import { Dialog as RDialog, Tabs as RTabs, Tooltip as RTooltip } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ----------------------------- Tabs ----------------------------- */
export const Tabs = RTabs.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof RTabs.List>) {
  return <RTabs.List className={cn("flex flex-wrap gap-1 border-b border-sogan-200", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof RTabs.Trigger>) {
  return (
    <RTabs.Trigger
      className={cn(
        "-mb-px shrink-0 whitespace-nowrap rounded-t-md border border-transparent px-4 py-2 text-sm font-semibold text-sogan-700 hover:bg-sogan-100 data-[state=active]:border-sogan-200 data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:text-sogan-900",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof RTabs.Content>) {
  return <RTabs.Content className={cn("rounded-b-md border border-t-0 border-sogan-200 bg-white p-4", className)} {...props} />;
}

/* ----------------------------- Dialog ----------------------------- */
export function Dialog({
  buka,
  saatUbah,
  judul,
  deskripsi,
  children,
  lebar = "max-w-2xl",
}: {
  buka: boolean;
  saatUbah: (buka: boolean) => void;
  judul: string;
  deskripsi?: string;
  children: React.ReactNode;
  lebar?: string;
}) {
  return (
    <RDialog.Root open={buka} onOpenChange={saatUbah}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-40 bg-sogan-900/60" />
        <RDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-sogan-300 bg-krem p-6 shadow-xl",
            lebar,
          )}
        >
          <RDialog.Title className="font-serif text-2xl font-semibold text-sogan-800">{judul}</RDialog.Title>
          {deskripsi ? (
            <RDialog.Description className="mt-1 text-sm text-sogan-600">{deskripsi}</RDialog.Description>
          ) : (
            <RDialog.Description className="sr-only">{judul}</RDialog.Description>
          )}
          <div className="mt-4">{children}</div>
          <RDialog.Close aria-label="Tutup" className="absolute right-3 top-3 rounded p-1 text-sogan-700 hover:bg-sogan-100">
            <X aria-hidden className="size-5" />
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/* ----------------------------- Tooltip ----------------------------- */
export function Tooltip({ isi, children }: { isi: string; children: React.ReactNode }) {
  return (
    <RTooltip.Provider delayDuration={150}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content
            sideOffset={6}
            className="z-50 max-w-xs rounded-md bg-sogan-900 px-3 py-2 text-xs text-krem shadow-lg"
          >
            {isi}
            <RTooltip.Arrow className="fill-sogan-900" />
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}
