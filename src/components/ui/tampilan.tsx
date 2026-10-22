"use client";

import { Tabs as RTabs, Tooltip as RTooltip } from "radix-ui";
import { cn } from "@/lib/utils";

/* ----------------------------- Tabs ----------------------------- */
export const Tabs = RTabs.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof RTabs.List>) {
  return <RTabs.List className={cn("flex flex-wrap gap-1 border-b border-primer-200", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof RTabs.Trigger>) {
  return (
    <RTabs.Trigger
      className={cn(
        "-mb-px shrink-0 cursor-pointer whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-primer-700 hover:text-primer-900 data-[state=active]:border-primer-400 data-[state=active]:text-primer-900",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof RTabs.Content>) {
  return <RTabs.Content className={cn("pt-4", className)} {...props} />;
}

/** Nama pendek: Tab = Tabs (akar), Tab.Daftar dll. tersedia lewat ekspor Tabs*. */
export { Tabs as Tab };

/* ----------------------------- Tooltip ----------------------------- */
export function Tooltip({ isi, children }: { isi: string; children: React.ReactNode }) {
  return (
    <RTooltip.Provider delayDuration={150}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content
            sideOffset={6}
            className="z-50 max-w-xs rounded-md bg-primer-900 px-3 py-2 text-xs text-latar shadow-lg"
          >
            {isi}
            <RTooltip.Arrow className="fill-primer-900" />
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}
