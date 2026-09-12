"use client";

import { Num } from "@/components/ui/Num";
import { Segmented } from "@/components/ui/Segmented";
import type { FinancingKind } from "@/data/types";
import {
  closingEstimate,
  closingItemKeys,
  closingItemLabels,
  emptyClosingItems,
  rehabTotal,
  type ClosingItems,
  type DealInputs,
  type Refinance,
} from "@/lib/calc";
import { money } from "@/lib/format";

import { NumberField } from "./NumberField";
import styles from "./Calculator.module.css";

/**
 * The assumptions behind both scenarios, grouped the way the investor's
 * spreadsheet groups them: רכישה ושווי · שיפוץ · מימון · סגירה והחזקה ·
 * מכירה · הכנסות · הוצאות תפעול · מחזור. Every change re‑runs the maths.
 */

const kinds: { value: FinancingKind; label: string }[] = [
  { value: "hard-money", label: "Hard money" },
  { value: "conventional", label: "קונבנציונלי" },
  { value: "dscr", label: "DSCR" },
  { value: "cash", label: "מזומן" },
];

const closingModes = [
  { value: "percent", label: "אחוז" },
  { value: "itemized", label: "פירוט" },
] as const;

const holdModes = [
  { value: "brrrr", label: "BRRRR · ריפיננס" },
  { value: "hold", label: "Buy & Hold" },
] as const;

const defaultRefinance: Refinance = {
  ltvPct: 75,
  ratePct: 7.6,
  termYears: 30,
  closingPct: 2,
  seasoningMonths: 6,
};

export function DealInputsForm({
  inputs,
  onChange,
}: {
  inputs: DealInputs;
  onChange: (next: DealInputs) => void;
}) {
  const patch = (partial: Partial<DealInputs>) => onChange({ ...inputs, ...partial });
  const group =
    <K extends "purchaseLoan" | "rehabLoan" | "holding" | "sale" | "income" | "opex">(key: K) =>
    (partial: Partial<DealInputs[K]>) =>
      onChange({ ...inputs, [key]: { ...inputs[key], ...partial } });
  const patchRefi = (partial: Partial<Refinance>) =>
    onChange({ ...inputs, refinance: { ...(inputs.refinance ?? defaultRefinance), ...partial } });

  const cash = inputs.purchaseLoan.kind === "cash";
  const hardMoney = inputs.purchaseLoan.kind === "hard-money";
  const closed = inputs.closingActual !== undefined;

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>רכישה ושווי</legend>
        <NumberField id="f-price" label="מחיר רכישה" unit="$" value={inputs.purchasePrice} onChange={(v) => patch({ purchasePrice: v })} />
        <NumberField id="f-arv" label="שווי לאחר שיפוץ (ARV)" unit="$" value={inputs.arv} onChange={(v) => patch({ arv: v })} />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>שיפוץ</legend>
        <NumberField id="f-rehab" label="תקציב שיפוץ" unit="$" value={inputs.rehabBudget} onChange={(v) => patch({ rehabBudget: v })} />
        <div className={styles.row2}>
          <NumberField id="f-cont" label='בלת"מ' unit="%" hint="מומלץ 10–15%" value={inputs.contingencyPct} onChange={(v) => patch({ contingencyPct: v })} />
          <NumberField id="f-months" label="משך השיפוץ" unit="חודשים" value={inputs.rehabMonths} onChange={(v) => patch({ rehabMonths: v })} />
        </div>
        <div className={`text-muted ${styles.echo}`}>
          שיפוץ כולל בלת&quot;מ: <Num>{money(rehabTotal(inputs))}</Num>
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>מימון</legend>
        <Segmented
          options={kinds}
          value={inputs.purchaseLoan.kind}
          onChange={(kind) =>
            group("purchaseLoan")({ kind, ltvPct: kind === "cash" ? 0 : inputs.purchaseLoan.ltvPct || 75 })
          }
          ariaLabel="סוג מימון"
        />
        {!cash ? (
          <>
            <div className={styles.row2}>
              <NumberField id="f-ltv" label="מימון רכישה (LTV)" unit="%" value={inputs.purchaseLoan.ltvPct} onChange={(v) => group("purchaseLoan")({ ltvPct: v })} />
              <NumberField id="f-rate" label="ריבית שנתית" unit="%" value={inputs.purchaseLoan.ratePct} onChange={(v) => group("purchaseLoan")({ ratePct: v })} />
            </div>
            {!hardMoney ? (
              <NumberField id="f-term" label="תקופת ההלוואה" unit="שנים" value={inputs.purchaseLoan.termYears} onChange={(v) => group("purchaseLoan")({ termYears: v })} />
            ) : (
              <div className={`text-muted ${styles.echo}`}>Hard money — ריבית בלבד לתקופת השיפוץ</div>
            )}
          </>
        ) : null}
        <div className={styles.row2}>
          <NumberField id="f-rehab-fin" label="מימון שיפוץ" unit="%" hint="מתוך תקציב השיפוץ" value={inputs.rehabLoan.financedPct} onChange={(v) => group("rehabLoan")({ financedPct: v })} />
          <NumberField id="f-rehab-rate" label="ריבית הלוואת שיפוץ" unit="%" value={inputs.rehabLoan.ratePct} onChange={(v) => group("rehabLoan")({ ratePct: v })} />
        </div>
        <NumberField id="f-points" label="עמלת הקמה / נקודות" unit="%" hint="מסך כל ההלוואות" value={inputs.pointsPct} onChange={(v) => patch({ pointsPct: v })} />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>סגירה והחזקה</legend>
        {closed ? (
          <div className={`text-muted ${styles.echo}`}>
            עלויות סגירה ששולמו: <Num>{money(inputs.closingActual ?? 0)}</Num>
          </div>
        ) : (
          <>
            <Segmented
              options={closingModes}
              value={inputs.closing.mode}
              onChange={(mode) =>
                patch({
                  closing:
                    mode === "percent"
                      ? { mode, pct: inputs.closing.mode === "percent" ? inputs.closing.pct : 3 }
                      : {
                          mode,
                          items: inputs.closing.mode === "itemized" ? inputs.closing.items : emptyClosingItems,
                        },
                })
              }
              ariaLabel="אופן חישוב עלויות סגירה"
            />
            {inputs.closing.mode === "percent" ? (
              <NumberField id="f-closing-pct" label="עלויות סגירה (אומדן)" unit="%" hint="ממחיר הרכישה" value={inputs.closing.pct} onChange={(v) => patch({ closing: { mode: "percent", pct: v } })} />
            ) : (
              <ClosingItemsFields
                items={inputs.closing.items}
                onChange={(items) => patch({ closing: { mode: "itemized", items } })}
              />
            )}
            <div className={`text-muted ${styles.echo}`}>
              סה&quot;כ סגירה: <Num>{money(closingEstimate(inputs.closing, inputs.purchasePrice))}</Num>
            </div>
          </>
        )}
        <div className={styles.row2}>
          <NumberField id="f-tax" label="מס רכוש" unit="$ לשנה" value={inputs.holding.propertyTaxYr} onChange={(v) => group("holding")({ propertyTaxYr: v })} />
          <NumberField id="f-ins" label="ביטוח" unit="$ לשנה" value={inputs.holding.insuranceYr} onChange={(v) => group("holding")({ insuranceYr: v })} />
        </div>
        <div className={styles.row2}>
          <NumberField id="f-util" label="חשבונות" unit="$ לחודש" value={inputs.holding.utilitiesMo} onChange={(v) => group("holding")({ utilitiesMo: v })} />
          <NumberField id="f-yard" label="חצר / שלג" unit="$ לחודש" value={inputs.holding.yardSnowMo} onChange={(v) => group("holding")({ yardSnowMo: v })} />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>מכירה · Fix &amp; Flip</legend>
        <div className={styles.row2}>
          <NumberField id="f-agent" label="עמלת תיווך" unit="%" value={inputs.sale.agentPct} onChange={(v) => group("sale")({ agentPct: v })} />
          <NumberField id="f-other" label="עלויות סגירה במכירה" unit="%" value={inputs.sale.otherPct} onChange={(v) => group("sale")({ otherPct: v })} />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>הכנסות · BRRRR</legend>
        <div className={styles.row2}>
          <NumberField id="f-rent" label="שכר דירה" unit="$ לחודש" value={inputs.income.monthlyRent} onChange={(v) => group("income")({ monthlyRent: v })} />
          <NumberField id="f-vac" label="תפוסה ריקה" unit="%" value={inputs.income.vacancyPct} onChange={(v) => group("income")({ vacancyPct: v })} />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>הוצאות תפעול</legend>
        <div className={styles.row2}>
          <NumberField id="f-mgmt" label="ניהול נכס" unit="% משכ״ד" value={inputs.opex.managementPct} onChange={(v) => group("opex")({ managementPct: v })} />
          <NumberField id="f-maint" label="תחזוקה" unit="% משכ״ד" value={inputs.opex.maintenancePct} onChange={(v) => group("opex")({ maintenancePct: v })} />
        </div>
        <div className={styles.row2}>
          <NumberField id="f-capex" label="CapEx" unit="% משכ״ד" value={inputs.opex.capexPct} onChange={(v) => group("opex")({ capexPct: v })} />
          <NumberField id="f-hoa" label="ועד בית (HOA)" unit="$ לחודש" value={inputs.opex.hoaMo} onChange={(v) => group("opex")({ hoaMo: v })} />
        </div>
        <div className={`text-muted ${styles.echo}`}>
          מס וביטוח נלקחים מ&quot;סגירה והחזקה&quot;:{" "}
          <Num>{money(Math.round((inputs.holding.propertyTaxYr + inputs.holding.insuranceYr) / 12))}</Num> לחודש
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>מחזור משכנתא</legend>
        <Segmented
          options={holdModes}
          value={inputs.refinance ? "brrrr" : "hold"}
          onChange={(mode) => patch({ refinance: mode === "brrrr" ? (inputs.refinance ?? defaultRefinance) : undefined })}
          ariaLabel="אסטרטגיית החזקה"
        />
        {inputs.refinance ? (
          <>
            <div className={styles.row2}>
              <NumberField id="f-refi-ltv" label="מימון מחדש (LTV)" unit="% מה-ARV" value={inputs.refinance.ltvPct} onChange={(v) => patchRefi({ ltvPct: v })} />
              <NumberField id="f-refi-rate" label="ריבית חדשה" unit="%" value={inputs.refinance.ratePct} onChange={(v) => patchRefi({ ratePct: v })} />
            </div>
            <div className={styles.row2}>
              <NumberField id="f-refi-term" label="תקופה" unit="שנים" value={inputs.refinance.termYears} onChange={(v) => patchRefi({ termYears: v })} />
              <NumberField id="f-refi-closing" label="עלויות מחזור" unit="% מההלוואה" value={inputs.refinance.closingPct} onChange={(v) => patchRefi({ closingPct: v })} />
            </div>
            <NumberField id="f-seasoning" label="Seasoning" unit="חודשים" hint="זמן החזקה שהבנק דורש לפני cash-out" value={inputs.refinance.seasoningMonths} onChange={(v) => patchRefi({ seasoningMonths: v })} />
          </>
        ) : null}
        <NumberField id="f-reserves" label="רזרבות" unit="חודשים" hint="של הוצאות + החזר משכנתא" value={inputs.reservesMonths} onChange={(v) => patch({ reservesMonths: v })} />
      </fieldset>
    </form>
  );
}

function ClosingItemsFields({
  items,
  onChange,
}: {
  items: ClosingItems;
  onChange: (items: ClosingItems) => void;
}) {
  return (
    <div className={styles.itemized}>
      {closingItemKeys.map((key) => (
        <NumberField
          key={key}
          id={`f-closing-${key}`}
          label={closingItemLabels[key]}
          unit="$"
          value={items[key]}
          onChange={(v) => onChange({ ...items, [key]: v })}
        />
      ))}
    </div>
  );
}
