"use client";

import { useEffect, useState } from "react";

import styles from "./Calculator.module.css";

const display = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/**
 * A numeric input for the assumptions form. The field is always left‑to‑right
 * — digits never enter the RTL flow — and shows thousands separators when it
 * is not being edited. Commits on every keystroke that parses, so the results
 * update as the investor types.
 */
export function NumberField({
  id,
  label,
  value,
  onChange,
  unit,
  hint,
  min = 0,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Shown after the number: $, %, חודשים, שנים, $ לשנה, $ לחודש. */
  unit?: string;
  hint?: string;
  min?: number;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(() => display.format(value));
  const [editing, setEditing] = useState(false);

  // Keep the shown text in step with the value while the field is idle.
  useEffect(() => {
    if (!editing) setDraft(display.format(value));
  }, [value, editing]);

  return (
    <div className={`field ${styles.field}`}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.numWrap}>
        <input
          id={id}
          className={`input ${styles.numInput}`}
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={draft}
          disabled={disabled}
          // Select the whole value rather than swapping the text on focus:
          // typing then replaces it, and nothing races the browser's own
          // edit of the field.
          onFocus={(event) => {
            setEditing(true);
            event.target.select();
          }}
          onBlur={() => {
            setEditing(false);
            setDraft(display.format(value));
          }}
          onChange={(event) => {
            const raw = event.target.value;
            setDraft(raw);
            const parsed = Number(raw.replace(/[^\d.-]/g, ""));
            if (raw.trim() === "") onChange(0);
            else if (!Number.isNaN(parsed) && parsed >= min) onChange(parsed);
          }}
        />
        {unit ? <span className={styles.numUnit}>{unit}</span> : null}
      </div>
      {hint ? <div className={`text-muted ${styles.hint}`}>{hint}</div> : null}
    </div>
  );
}
