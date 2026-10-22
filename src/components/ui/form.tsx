"use client";

import { useId } from "react";
import { Checkbox as RCheckbox, RadioGroup as RRadio } from "radix-ui";
import { Check, ChevronDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const dasarInput =
  "w-full rounded-md border border-primer-400 bg-white px-3 text-primer-900 placeholder:text-primer-600 focus-visible:outline-primer-400 disabled:bg-abu-100 disabled:text-abu-600 aria-[invalid=true]:border-2 aria-[invalid=true]:border-bata-600 aria-[invalid=true]:bg-bata-100/40";

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
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primer-600" />
    </span>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-semibold text-primer-800", className)} {...props} />;
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
      {petunjuk && !galat ? <p className="mt-1 text-xs text-primer-600">{petunjuk}</p> : null}
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
        className="flex size-5 cursor-pointer items-center justify-center rounded-sm border border-primer-500 bg-white aria-[invalid=true]:border-2 aria-[invalid=true]:border-bata-600 data-[state=checked]:bg-primer-700 data-[state=checked]:text-latar"
        {...props}
      >
        <RCheckbox.Indicator>
          <Check aria-hidden className="size-4" />
        </RCheckbox.Indicator>
      </RCheckbox.Root>
      {label ? (
        <label htmlFor={id} className="text-sm text-primer-900">
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
        className="flex size-5 items-center justify-center rounded-full border border-primer-500 bg-white data-[state=checked]:border-primer-700"
      >
        <RRadio.Indicator>
          <Circle aria-hidden className="size-3 fill-primer-700 text-primer-700" />
        </RRadio.Indicator>
      </RRadio.Item>
      <label htmlFor={id} className="text-sm text-primer-900">
        {label}
      </label>
    </span>
  );
}

/* ---------------- Isian terpadu: label + kontrol + petunjuk + galat di dekat isian ---------------- */
interface DasarIsian {
  label: string;
  petunjuk?: string;
  /** pesan galat; bila ada, isian ditandai aria-invalid (bingkai merah) dan pesan dibacakan */
  galat?: string | null;
  wajib?: boolean;
  className?: string;
}

function Penanda({ id, label, wajib, petunjuk, galat, children, className }: DasarIsian & { id: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-primer-800">
        {label}
        {wajib ? <span aria-hidden className="ml-0.5 text-bata-600">*</span> : null}
      </label>
      {children}
      {galat ? (
        <p id={`${id}-galat`} role="alert" className="mt-1 text-sm font-medium text-bata-600">
          {galat}
        </p>
      ) : petunjuk ? (
        <p id={`${id}-petunjuk`} className="mt-1 text-xs text-primer-600">
          {petunjuk}
        </p>
      ) : null}
    </div>
  );
}

const deskripsiId = (id: string, d: DasarIsian) => (d.galat ? `${id}-galat` : d.petunjuk ? `${id}-petunjuk` : undefined);

/** Isian teks satu baris atau (rows) banyak baris. */
export function Isian({
  label,
  petunjuk,
  galat,
  wajib,
  className,
  id,
  multibaris,
  ...props
}: DasarIsian & { id?: string; multibaris?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  const otomatis = useId();
  const kunci = id ?? otomatis;
  const bersama = { id: kunci, "aria-invalid": galat ? true : undefined, "aria-describedby": deskripsiId(kunci, { label, petunjuk, galat }), "aria-required": wajib || undefined };
  return (
    <Penanda id={kunci} label={label} petunjuk={petunjuk} galat={galat} wajib={wajib} className={className}>
      {multibaris ? <Textarea {...bersama} {...props} /> : <Input {...bersama} {...props} />}
    </Penanda>
  );
}

/** Pilihan (select bawaan peramban) dengan label dan galat. */
export function Pilihan({
  label,
  petunjuk,
  galat,
  wajib,
  className,
  id,
  children,
  ...props
}: DasarIsian & { id?: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className">) {
  const otomatis = useId();
  const kunci = id ?? otomatis;
  return (
    <Penanda id={kunci} label={label} petunjuk={petunjuk} galat={galat} wajib={wajib} className={className}>
      <Select id={kunci} aria-invalid={galat ? true : undefined} aria-describedby={deskripsiId(kunci, { label, petunjuk, galat })} aria-required={wajib || undefined} {...props}>
        {children}
      </Select>
    </Penanda>
  );
}

/** Kotak centang dengan label terhubung dan galat di bawahnya. */
export function KotakCentang({ label, galat, id, className, ...props }: { label: string; galat?: string | null; id?: string; className?: string } & Omit<React.ComponentProps<typeof RCheckbox.Root>, "id" | "className">) {
  const otomatis = useId();
  const kunci = id ?? otomatis;
  return (
    <div className={className}>
      <Checkbox id={kunci} label={label} aria-invalid={galat ? true : undefined} aria-describedby={galat ? `${kunci}-galat` : undefined} {...props} />
      {galat ? (
        <p id={`${kunci}-galat`} role="alert" className="mt-1 text-sm font-medium text-bata-600">
          {galat}
        </p>
      ) : null}
    </div>
  );
}
