"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "./Icon";
import styles from "./InfoTip.module.css";

/**
 * The "?" beside a parameter: hover it, or tab to it, and the full explanation
 * appears. Tapping toggles it, so it works on a phone where there is no hover.
 *
 * The bubble is `aria-hidden`; the same text reaches assistive technology
 * through the field's own `aria-describedby`, pointed at `id`, so it is
 * announced with the field rather than as a stray tooltip.
 */
export function InfoTip({
  id,
  text,
  label,
  align = "start",
}: {
  /** Referenced by the described field's aria-describedby. */
  id: string;
  text: string;
  /** What this explains, for the button's accessible name. */
  label: string;
  /** "end" flips the bubble when the icon sits near the end of a row. */
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <span
      ref={wrap}
      className={align === "end" ? `${styles.wrap} ${styles.end}` : styles.wrap}
      data-open={open ? "true" : undefined}
    >
      <button
        type="button"
        className={styles.button}
        aria-label={`הסבר: ${label}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="help" size={14} />
      </button>
      <span id={id} role="tooltip" aria-hidden="true" className={styles.bubble}>
        {text}
      </span>
    </span>
  );
}
