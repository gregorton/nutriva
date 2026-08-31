"use client";

import type { ReactNode } from "react";

/*
  The three shapes the checkout form is built from, split out so checkout-form.tsx reads as the
  order of the questions rather than as markup.

  `Tile` is the bordered attribute tile pdp/pack-options.tsx uses for pack size, wrapped around a
  radio input: a solved pattern in this codebase for "pick one of these", and one that works with
  no JavaScript because the radio is real.
*/

export function Step({ n, heading, children }: { n: number; heading: string; children: ReactNode }) {
  return (
    <section aria-label={heading}>
      <h2 className="flex items-center gap-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-plum-800 text-[13px] font-bold text-white"
          data-num
          aria-hidden
        >
          {n}
        </span>
        <span className="text-[19px] font-semibold text-ink">{heading}</span>
      </h2>
      <div className="mt-4 sm:pl-10">{children}</div>
    </section>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  className = "",
  ...input
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      <input
        name={name}
        required
        aria-invalid={error ? true : undefined}
        className={`mt-1.5 h-11 w-full rounded-[7px] border bg-white px-3 text-sm text-ink placeholder:text-faint focus:outline-none ${
          error ? "border-sale-600 focus:border-sale-600" : "border-line-strong focus:border-plum-600"
        }`}
        {...input}
      />
      {error ? (
        <span className="facts mt-1 block text-sale-600">{error}</span>
      ) : (
        hint && <span className="facts mt-1 block">{hint}</span>
      )}
    </label>
  );
}

export function Tile({
  name,
  value,
  checked,
  onChange,
  label,
  blurb,
  aside,
  foot,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  blurb: string;
  /** Right-aligned on the label row: a price, usually. */
  aside?: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col rounded-[7px] border-2 px-3.5 py-3 transition-colors ${
        checked ? "border-plum-700 bg-plum-100" : "border-line-strong bg-white hover:border-plum-600"
      }`}
    >
      <span className="flex items-start gap-2.5">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-plum-700"
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-[13.5px] font-semibold text-ink">{label}</span>
            {aside && <span className="facts">{aside}</span>}
          </span>
          <span className="facts mt-0.5 block leading-snug">{blurb}</span>
          {foot && <span className="facts mt-1.5 block leading-snug text-plum-700">{foot}</span>}
        </span>
      </span>
    </label>
  );
}
