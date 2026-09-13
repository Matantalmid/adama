"use client";

import { useId, useState } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/**
 * The design system's .seg control: radio inputs behind styled labels, so it
 * stays a real radio group for keyboard and screen-reader users.
 */
export function Segmented<T extends string>({
  options,
  defaultValue,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly SegmentedOption<T>[];
  defaultValue?: T;
  value?: T;
  onChange?: (value: T) => void;
  ariaLabel: string;
}) {
  const name = useId();
  const [internal, setInternal] = useState<T>(defaultValue ?? options[0].value);
  const selected = value ?? internal;

  function select(next: T) {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  }

  return (
    <div className="seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <label key={option.value} className="seg-opt">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selected === option.value}
            onChange={() => select(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
