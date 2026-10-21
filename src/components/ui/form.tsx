"use client";

import { Checkbox as RCheckbox, RadioGroup as RRadio } from "radix-ui";
import { Check, ChevronDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const dasarInput =
  "w-full rounded-md border border-sogan-400 bg-white px-3 text-sogan-900 placeholder:text-sogan-400 focus-visible:outline-emas-500 disabled:bg-krem-100 disabled:text-sogan-500 aria-[invalid=true]:border-2 aria-[invalid=true]:border-bata-600 aria-[invalid=true]:bg-bata-100/40";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(dasarInput, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(dasarInput, "min-h-24 py-2", className)} {...props} />;
}

/** Daftar pilihan memakai elemen select bawaan peramban (paling mudah diakses, termasuk papan ketik dan layar sentuh). */
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={cn(dasarInput, "h-10 appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-sogan-600" />
    </span>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-semibold text-sogan-800", className)} {...props} />;
}

/** Pembungkus isian: label, petunjuk, dan pesan galat (bingkai merah dipasang lewat aria-invalid pada isian). */
export function Field({
  label,
  htmlFor,
  petunjuk,
  galat,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  petunjuk?: string;
  galat?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {petunjuk && !galat ? <p className="mt-1 text-xs text-sogan-600">{petunjuk}</p> : null}
      {galat ? (
        <p role="alert" className="mt-1 text-sm font-medium text-bata-600">
          {galat}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  id,
  label,
  className,
  ...props
}: React.ComponentProps<typeof RCheckbox.Root> & { label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <RCheckbox.Root
        id={id}
        className="flex size-5 items-center justify-center rounded border border-sogan-500 bg-white data-[state=checked]:bg-sogan-700 data-[state=checked]:text-krem"
        {...props}
      >
        <RCheckbox.Indicator>
          <Check aria-hidden className="size-4" />
        </RCheckbox.Indicator>
      </RCheckbox.Root>
      {label ? (
        <label htmlFor={id} className="text-sm text-sogan-900">
          {label}
        </label>
      ) : null}
    </span>
  );
}

export function RadioGroup({ className, ...props }: React.ComponentProps<typeof RRadio.Root>) {
  return <RRadio.Root className={cn("flex flex-wrap gap-4", className)} {...props} />;
}

export function RadioItem({ id, value, label }: { id: string; value: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <RRadio.Item
        id={id}
        value={value}
        className="flex size-5 items-center justify-center rounded-full border border-sogan-500 bg-white data-[state=checked]:border-sogan-700"
      >
        <RRadio.Indicator>
          <Circle aria-hidden className="size-3 fill-sogan-700 text-sogan-700" />
        </RRadio.Indicator>
      </RRadio.Item>
      <label htmlFor={id} className="text-sm text-sogan-900">
        {label}
      </label>
    </span>
  );
}
