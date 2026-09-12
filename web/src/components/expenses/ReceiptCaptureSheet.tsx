"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { Num } from "@/components/ui/Num";
import { Tag } from "@/components/ui/Tag";
import { activePropertyId } from "@/data/portfolio";
import { money } from "@/lib/format";
import { stageLabels } from "@/lib/labels";
import { actions } from "@/store";
import { useProperty } from "@/store/hooks";

import { CategoryChips } from "./CategoryChips";
import styles from "./ReceiptCaptureSheet.module.css";

/**
 * New expense (mockup 3c). Two ways in: the phone's camera button, where a
 * scanned receipt prefills the amount, vendor and date; and "+ הוצאה" on the
 * ledger, where the same sheet opens empty for manual entry — the brief asked
 * for both, equally. Every field is editable either way, the category chips
 * update the budget warning as they are tapped, and "שמור הוצאה" writes to
 * the store.
 *
 * The warning projects: category spend *plus* this receipt. Mockup 3c showed
 * the category's standing before the receipt; a budget tool that under‑reports
 * an overrun is worse than useless, so the arithmetic here holds.
 */

/** Stands in for a scan; a real build reads these off the photographed receipt. */
const scanned = {
  vendor: "Home Depot",
  date: "2026-09-10",
  amount: 1_284.5,
  payment: "{Amex ····4021}",
  description: "חומרי חשמל — שקעים, כבלים",
  categoryId: "electric",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReceiptCaptureSheet({
  onClose,
  propertyId = activePropertyId,
  prefill = true,
}: {
  onClose: () => void;
  propertyId?: string;
  /** True when a receipt was scanned; false for manual entry. */
  prefill?: boolean;
}) {
  const property = useProperty(propertyId);
  const categories = property?.rehabCategories ?? [];

  const [amount, setAmount] = useState(prefill ? scanned.amount : 0);
  const [amountDraft, setAmountDraft] = useState(prefill ? String(scanned.amount) : "");
  const [vendor, setVendor] = useState(prefill ? scanned.vendor : "");
  const [date, setDate] = useState(prefill ? scanned.date : today());
  const [description, setDescription] = useState(prefill ? scanned.description : "");
  const [selected, setSelected] = useState<string | null>(prefill ? scanned.categoryId : null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    firstFieldRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const category = categories.find((c) => c.id === selected);
  const projected = category ? category.spent + amount : null;
  const overrun = category && projected !== null ? projected - category.budget : null;
  const canSave = amount > 0 && vendor.trim().length > 0;

  function save() {
    if (!property || !canSave) return;
    actions.addExpense({
      propertyId: property.id,
      date,
      description: description.trim() || `קבלה — {${vendor.trim()}}`,
      vendor: vendor.trim(),
      categoryId: selected,
      payment: prefill ? scanned.payment : "—",
      amount,
      hasReceipt: prefill,
    });
    onClose();
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={prefill ? "הוצאה חדשה מקבלה" : "הוצאה ידנית"}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {prefill ? (
        <div className={styles.viewfinder} aria-hidden="true">
          <div className={styles.guide}>
            <div>
              <span className={styles.guideIcon}>
                <Icon name="camera" size={26} />
              </span>
              קבלה נסרקה ✓
              <br />
              <span className={styles.guideVendor}>
                {scanned.vendor} · <Num>10.9.2026</Num>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.viewfinder} aria-hidden="true" />
      )}

      <div className={styles.sheet}>
        <div className={styles.grabber} />

        <div className={styles.sheetHead}>
          <h2>{prefill ? "הוצאה חדשה" : "הוצאה ידנית"}</h2>
          {prefill ? <Tag tone="accent-2">זוהה אוטומטית</Tag> : null}
        </div>

        <div className={styles.amount}>
          <label htmlFor="capture-amount" className="text-muted" style={{ fontSize: 12 }}>
            סכום
          </label>
          <div className={styles.amountField}>
            <span className={styles.amountCurrency} aria-hidden="true">$</span>
            <input
              id="capture-amount"
              ref={firstFieldRef}
              className={styles.amountInput}
              type="text"
              inputMode="decimal"
              dir="ltr"
              placeholder="0.00"
              value={amountDraft}
              onChange={(event) => {
                const raw = event.target.value;
                setAmountDraft(raw);
                const parsed = Number(raw.replace(/[^\d.]/g, ""));
                setAmount(Number.isNaN(parsed) ? 0 : parsed);
              }}
            />
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className="field">
            <label htmlFor="capture-vendor">ספק</label>
            <input
              id="capture-vendor"
              className="input"
              dir="auto"
              value={vendor}
              placeholder="Home Depot"
              onChange={(event) => setVendor(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="capture-date">תאריך</label>
            <input
              id="capture-date"
              className="input"
              type="date"
              dir="ltr"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="capture-description">תיאור</label>
          <input
            id="capture-description"
            className="input"
            value={description}
            placeholder="מה נקנה"
            onChange={(event) => setDescription(event.target.value)}
          />
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
          <CategoryChips
            categories={categories}
            selected={selected}
            onSelect={(id) => setSelected((current) => (current === id ? null : id))}
            labelledBy="capture-category-label"
          />
        </div>

        {category && projected !== null && overrun !== null && overrun > 0 ? (
          <p className={styles.warning} style={{ margin: 0 }} role="status">
            {category.name} יעמוד על <Num>{money(Math.round(projected))}</Num> מתוך{" "}
            <Num>{money(category.budget)}</Num> — חריגה של <Num>{money(Math.round(overrun))}</Num>.
          </p>
        ) : null}

        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            ביטול
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={!canSave}>
            שמור הוצאה
          </button>
        </div>
      </div>
    </div>
  );
}
