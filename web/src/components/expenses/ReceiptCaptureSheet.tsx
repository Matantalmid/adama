"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { Num } from "@/components/ui/Num";
import { Tag } from "@/components/ui/Tag";
import { getProperty, activePropertyId } from "@/data/portfolio";
import { money, moneyExact } from "@/lib/format";
import { stageLabels } from "@/lib/labels";

import styles from "./ReceiptCaptureSheet.module.css";

/**
 * Receipt capture (mockup 3c): photograph a receipt, confirm the amount the
 * scan read, tap a category. The overrun warning updates as the category
 * changes, so the budget consequence is visible before the expense is saved —
 * that immediacy is the point of the screen.
 */

/**
 * One deliberate divergence from mockup 3c: the warning there reads "חשמל
 * יעמוד על $5,150 מתוך $4,800 — חריגה של $350", which is the category's
 * standing *before* this receipt. Since the sentence is a projection ("will
 * stand at"), and a budget tool that under-reports an overrun is worse than
 * useless, the figures below are projected — category spend plus the receipt
 * being filed. Same sentence, arithmetic that holds.
 */

/** Stands in for a scan; a real build reads these off the photographed receipt. */
const scanned = {
  vendor: "Home Depot",
  date: "10.9.2026",
  amount: 1_284.5,
  payment: "Amex ····4021",
};

export function ReceiptCaptureSheet({ onClose }: { onClose: () => void }) {
  const property = getProperty(activePropertyId);
  const categories = property?.rehabCategories ?? [];
  const [selected, setSelected] = useState<string | null>("electric");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const category = categories.find((c) => c.id === selected);
  const projected = category ? category.spent + scanned.amount : null;
  const overrun = category && projected !== null ? projected - category.budget : null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="הוצאה חדשה"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.viewfinder} aria-hidden="true">
        <div className={styles.guide}>
          <div>
            <span className={styles.guideIcon}>
              <Icon name="camera" size={26} />
            </span>
            קבלה נסרקה ✓
            <br />
            <span className={styles.guideVendor}>
              {scanned.vendor} · <Num>{scanned.date}</Num>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.sheet}>
        <div className={styles.grabber} />

        <div className={styles.sheetHead}>
          <h2>הוצאה חדשה</h2>
          <Tag tone="accent-2">זוהה אוטומטית</Tag>
        </div>

        <div className={styles.amount}>
          <div className="text-muted" style={{ fontSize: 12 }}>
            סכום
          </div>
          <Num className={styles.amountValue}>{moneyExact(scanned.amount)}</Num>
          <div className="text-muted" style={{ fontSize: 12.5, marginTop: 4 }}>
            {scanned.vendor} · <Num>{scanned.payment}</Num>
          </div>
        </div>

        <div className="field">
          <label htmlFor="capture-property">נכס</label>
          <button type="button" id="capture-property" className={`input ${styles.select}`}>
            <span>
              <Num>{property?.address}</Num>
              {property ? ` · ${stageLabels[property.stage].label}` : null}
            </span>
            <Icon name="chevron-down" size={14} />
          </button>
        </div>

        <div className="field">
          <span
            id="capture-category-label"
            style={{ display: "block", fontSize: 12, marginBottom: 5 }}
            className="text-muted"
          >
            קטגוריה
          </span>
          <div
            className={styles.categories}
            role="group"
            aria-labelledby="capture-category-label"
          >
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={[
                  "tag",
                  styles.category,
                  c.id === selected ? styles.categorySelected : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={c.id === selected}
                onClick={() => setSelected(c.id)}
              >
                {c.name}
              </button>
            ))}
            <button
              type="button"
              className={`tag ${styles.category} ${styles.categoryAdd}`}
              aria-label="קטגוריה חדשה"
            >
              +
            </button>
          </div>
        </div>

        {category && projected !== null && overrun !== null && overrun > 0 ? (
          <p className={styles.warning} style={{ margin: 0 }} role="status">
            {category.name} יעמוד על <Num>{money(projected)}</Num> מתוך{" "}
            <Num>{money(category.budget)}</Num> — חריגה של <Num>{money(overrun)}</Num>.
          </p>
        ) : null}

        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary" ref={closeRef} onClick={onClose}>
            ערוך פרטים
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            שמור הוצאה
          </button>
        </div>
      </div>
    </div>
  );
}
