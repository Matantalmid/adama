"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Num } from "@/components/ui/Num";
import {
  assumptionsOf,
  builtInAssumptions,
  closingEstimate,
  type DealAssumptions,
  type DealInputs,
} from "@/lib/calc";
import { money } from "@/lib/format";
import { actions } from "@/store";
import { useDefaults, useDraft } from "@/store/hooks";

import { DealInputsForm } from "./DealInputsForm";
import styles from "./Calculator.module.css";

/**
 * The assumptions behind every deal, in one place: the title company's standard
 * fees, the lender's usual terms, the vacancy and maintenance ratios, the cost
 * of sale. A new deal starts from these, and "אפס לברירת מחדל" in the
 * calculator returns to them.
 *
 * It is the same form the calculator uses, in "defaults" scope — a template has
 * no price, ARV or rehab budget of its own.
 */
export function DefaultsScreen() {
  const saved = useDefaults();
  const [draft, setDraft] = useDraft<DealAssumptions>(saved);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  // The form speaks DealInputs; a template has no deal facts to put in it.
  const asInputs: DealInputs = { ...draft, purchasePrice: 0, arv: 0, rehabBudget: 0 };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.defaultsTitle}>ברירות מחדל לעסקה</h1>
          <p className={`text-muted ${styles.subtitle}`}>
            הערכים שכל עסקה חדשה מתחילה מהם. כל עסקה יכולה לשנות אותם אצלה בלי להשפיע כאן.
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={() => setDraft(builtInAssumptions())}>
            שחזר מקוריים
          </button>
          {dirty ? (
            <button type="button" className="btn btn-secondary" onClick={() => setDraft(saved)}>
              בטל שינויים
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!dirty}
            onClick={() => actions.saveDefaults(draft)}
          >
            שמור
          </button>
        </div>
      </header>

      <p className={`card ${styles.defaultsSummary}`}>
        סה&quot;כ עלויות סגירה בברירת המחדל:{" "}
        <Num>
          <b>{money(closingEstimate(draft.closing, 0))}</b>
        </Num>
      </p>

      <div className={styles.defaultsForm}>
        <DealInputsForm
          inputs={asInputs}
          scope="defaults"
          onChange={(next) => setDraft(assumptionsOf(next))}
        />
      </div>

      <p className={`text-muted ${styles.note}`}>
        <Link href="/calculators">← חזרה למחשבון</Link>
      </p>

      {dirty ? (
        <div className={styles.saveBar}>
          <span>יש שינויים שלא נשמרו</span>
          <button type="button" className="btn btn-primary" onClick={() => actions.saveDefaults(draft)}>
            שמור
          </button>
        </div>
      ) : null}
    </div>
  );
}
