"use client";

import type { RehabCategory } from "@/data/types";

import styles from "./CategoryChips.module.css";

/** The rehab categories as tappable chips — the receipt sheet and the ledger's inline picker share it. */
export function CategoryChips({
  categories,
  selected,
  onSelect,
  size = "md",
  labelledBy,
}: {
  categories: RehabCategory[];
  selected: string | null;
  onSelect: (categoryId: string) => void;
  size?: "md" | "sm";
  labelledBy?: string;
}) {
  return (
    <div
      className={size === "sm" ? `${styles.chips} ${styles.sm}` : styles.chips}
      role="group"
      aria-labelledby={labelledBy}
    >
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`tag ${styles.chip}${c.id === selected ? ` ${styles.chipSelected}` : ""}`}
          aria-pressed={c.id === selected}
          onClick={() => onSelect(c.id)}
        >
          {c.name}
        </button>
      ))}
      {size === "md" ? (
        <button type="button" className={`tag ${styles.chip} ${styles.chipAdd}`} aria-label="קטגוריה חדשה">
          +
        </button>
      ) : null}
    </div>
  );
}
