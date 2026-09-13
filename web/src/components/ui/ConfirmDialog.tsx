"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import styles from "./ConfirmDialog.module.css";

/**
 * A question that has to be answered on purpose.
 *
 * Built on the design system's own `.dialog-*` classes, which shipped with the
 * handoff and had no user until now, and on the conventions
 * `expenses/ReceiptCaptureSheet.tsx` set: Escape closes, a click on the scrim
 * itself closes, the page behind stops scrolling. Two things that sheet does
 * not do and a destructive dialog should — focus is trapped inside while it is
 * open, and returned to whatever opened it on the way out.
 *
 * `code` turns it into a typed confirmation: the primary button stays disabled
 * until the field matches. **That is a guard against a misclick, not a security
 * control** — the expected value is a constant in the client bundle, so anyone
 * who opens devtools can read it. It makes a deletion deliberate; it does not
 * make it privileged.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "ביטול",
  code,
  codeLabel = "קוד אישור",
  onConfirm,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** When given, the confirm button waits for this exact text. */
  code?: string;
  codeLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const errorId = useId();

  const ready = code === undefined || typed.trim() === code;
  // Say so as soon as it cannot be right, rather than leaving a disabled
  // button and no explanation.
  const wrong = typed.trim().length > 0 && !ready;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    function focusable(): HTMLElement[] {
      if (!panel) return [];
      return [
        ...panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ];
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") return onCancel();
      if (event.key !== "Tab") return;
      // Keep Tab inside: behind this dialog is a page the user must not reach
      // while a destructive question is open.
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    firstRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [onCancel]);

  function confirm() {
    if (ready) onConfirm();
  }

  return (
    <div
      className={`dialog-backdrop ${styles.backdrop}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="dialog"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 className="dialog-title" id={titleId}>
          {title}
        </h2>
        <div className="dialog-body">{children}</div>

        {code !== undefined ? (
          <div className="field">
            <label htmlFor={`${titleId}-code`}>{codeLabel}</label>
            <input
              id={`${titleId}-code`}
              ref={(node) => {
                firstRef.current = node;
              }}
              className={`input ${styles.code}`}
              dir="ltr"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={wrong || undefined}
              aria-describedby={wrong ? errorId : undefined}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") confirm();
              }}
            />
            {wrong ? (
              <p className={styles.wrong} id={errorId} role="alert">
                הקוד שגוי.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger" onClick={confirm} disabled={!ready}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
