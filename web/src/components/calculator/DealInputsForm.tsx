"use client";

import { Icon } from "@/components/ui/Icon";
import { InfoTip } from "@/components/ui/InfoTip";
import { Num } from "@/components/ui/Num";
import { Segmented } from "@/components/ui/Segmented";
import type { FinancingKind } from "@/data/types";
import {
  closingEstimate,
  closingItemKeys,
  closingItemLabels,
  defaultClosingItems,
  rehabTotal,
  type ClosingItems,
  type CustomLine,
  type DealInputs,
  type Fee,
  type Refinance,
} from "@/lib/calc";
import { money } from "@/lib/format";
import { closingItemNotes, glossary } from "@/lib/glossary";

import { NumberField } from "./NumberField";
import styles from "./Calculator.module.css";

/**
 * The assumptions behind both scenarios, grouped the way the investor's
 * spreadsheet groups them: רכישה ושווי · שיפוץ · מימון · סגירה והחזקה ·
 * מכירה · הכנסות · הוצאות תפעול · מחזור. Every change re‑runs the maths.
 *
 * Every parameter carries a "?" with the sheet's own explanation of it
 * (lib/glossary.ts).
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

const feeModes = [
  { value: "percent", label: "%" },
  { value: "amount", label: "$" },
] as const;

const rehabRepayments = [
  { value: "interest", label: "ריבית בלבד" },
  { value: "amortized", label: "פריסה לשנים" },
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
  scope = "deal",
}: {
  inputs: DealInputs;
  onChange: (next: DealInputs) => void;
  /**
   * "defaults" edits the template behind every new deal, which has no price,
   * ARV or rehab budget of its own — those fieldsets are hidden.
   */
  scope?: "deal" | "defaults";
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
  const isDeal = scope === "deal";
  const rehabAmortized = inputs.rehabLoan.termYears !== undefined;

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      {isDeal ? (
        <fieldset className={styles.group}>
          <legend className={styles.legend}>רכישה ושווי</legend>
          <NumberField
            id="f-price"
            label="מחיר רכישה"
            unit="$"
            info={glossary.purchasePrice}
            value={inputs.purchasePrice}
            onChange={(v) => patch({ purchasePrice: v })}
          />
          <NumberField
            id="f-arv"
            label="שווי לאחר שיפוץ (ARV)"
            unit="$"
            info={glossary.arv}
            value={inputs.arv}
            onChange={(v) => patch({ arv: v })}
          />
        </fieldset>
      ) : null}

      <fieldset className={styles.group}>
        <legend className={styles.legend}>שיפוץ</legend>
        {isDeal ? (
          <NumberField
            id="f-rehab"
            label="תקציב שיפוץ"
            unit="$"
            info={glossary.rehabBudget}
            value={inputs.rehabBudget}
            onChange={(v) => patch({ rehabBudget: v })}
          />
        ) : null}
        <div className={styles.row2}>
          <NumberField
            id="f-cont"
            label='בלת"מ'
            unit="%"
            hint="מומלץ 10–15%"
            info={glossary.contingencyPct}
            value={inputs.contingencyPct}
            onChange={(v) => patch({ contingencyPct: v })}
          />
          <NumberField
            id="f-months"
            label="משך השיפוץ"
            unit="חודשים"
            info={glossary.rehabMonths}
            infoAlign="end"
            value={inputs.rehabMonths}
            onChange={(v) => patch({ rehabMonths: v })}
          />
        </div>
        {isDeal ? (
          <div className={`text-muted ${styles.echo}`}>
            שיפוץ כולל בלת&quot;מ: <Num>{money(rehabTotal(inputs))}</Num>
          </div>
        ) : null}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>מימון</legend>
        <Segmented
          options={kinds}
          value={inputs.purchaseLoan.kind}
          onChange={(kind) =>
            group("purchaseLoan")({
              kind,
              ltvPct: kind === "cash" ? 0 : inputs.purchaseLoan.ltvPct || 75,
            })
          }
          ariaLabel="סוג מימון"
        />
        <FieldNote text={glossary.financingKind} />

        {!cash ? (
          <>
            <EquitySplit inputs={inputs} onChange={(ltvPct) => group("purchaseLoan")({ ltvPct })} />
            <div className={styles.row2}>
              <NumberField
                id="f-rate"
                label="ריבית שנתית"
                unit="%"
                info={glossary.rate}
                value={inputs.purchaseLoan.ratePct}
                onChange={(v) => group("purchaseLoan")({ ratePct: v })}
              />
              {hardMoney ? (
                <div className={`text-muted ${styles.echo}`}>
                  Hard money — ריבית בלבד לתקופת השיפוץ
                </div>
              ) : (
                <NumberField
                  id="f-term"
                  label="תקופת ההלוואה"
                  unit="שנים"
                  info={glossary.term}
                  infoAlign="end"
                  value={inputs.purchaseLoan.termYears}
                  onChange={(v) => group("purchaseLoan")({ termYears: v })}
                />
              )}
            </div>
            <FeeField
              id="f-points"
              label="עמלת הקמה / נקודות"
              info={glossary.purchasePoints}
              fee={inputs.purchaseLoan.points}
              onChange={(points) => group("purchaseLoan")({ points })}
            />
          </>
        ) : null}

        <div className={styles.row2}>
          <NumberField
            id="f-rehab-fin"
            label="מימון שיפוץ"
            unit="%"
            hint="מתוך תקציב השיפוץ"
            info={glossary.rehabFinanced}
            value={inputs.rehabLoan.financedPct}
            onChange={(v) => group("rehabLoan")({ financedPct: v })}
          />
          <NumberField
            id="f-rehab-rate"
            label="ריבית הלוואת שיפוץ"
            unit="%"
            info={glossary.rehabRate}
            infoAlign="end"
            value={inputs.rehabLoan.ratePct}
            onChange={(v) => group("rehabLoan")({ ratePct: v })}
          />
        </div>

        {inputs.rehabLoan.financedPct > 0 ? (
          <>
            <div className={styles.labelRow}>
              <span className={`text-muted ${styles.subLabel}`}>פירעון הלוואת השיפוץ</span>
              <InfoTip
                id="f-rehab-repayment-tip"
                text={glossary.rehabRepayment}
                label="פירעון הלוואת השיפוץ"
              />
            </div>
            <Segmented
              options={rehabRepayments}
              value={rehabAmortized ? "amortized" : "interest"}
              onChange={(mode) =>
                group("rehabLoan")({
                  termYears: mode === "amortized" ? inputs.purchaseLoan.termYears || 30 : undefined,
                })
              }
              ariaLabel="פירעון הלוואת השיפוץ"
            />
            {rehabAmortized ? (
              <NumberField
                id="f-rehab-term"
                label="תקופת הלוואת השיפוץ"
                unit="שנים"
                info={glossary.rehabTerm}
                value={inputs.rehabLoan.termYears ?? 30}
                onChange={(v) => group("rehabLoan")({ termYears: v })}
              />
            ) : null}
            <FeeField
              id="f-rehab-points"
              label="עמלת הקמה · שיפוץ"
              info={glossary.rehabPoints}
              fee={inputs.rehabLoan.points}
              onChange={(points) => group("rehabLoan")({ points })}
            />
          </>
        ) : null}
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
                          items:
                            inputs.closing.mode === "itemized"
                              ? inputs.closing.items
                              : { ...defaultClosingItems },
                          extras: inputs.closing.mode === "itemized" ? inputs.closing.extras : [],
                        },
                })
              }
              ariaLabel="אופן חישוב עלויות סגירה"
            />
            <FieldNote text={glossary.closingMode} />

            {inputs.closing.mode === "percent" ? (
              <NumberField
                id="f-closing-pct"
                label="עלויות סגירה (אומדן)"
                unit="%"
                hint="ממחיר הרכישה"
                info={glossary.closingPct}
                value={inputs.closing.pct}
                onChange={(v) => patch({ closing: { mode: "percent", pct: v } })}
              />
            ) : (
              <ItemizedClosing
                items={inputs.closing.items}
                extras={inputs.closing.extras ?? []}
                onItems={(items) =>
                  patch({ closing: { mode: "itemized", items, extras: inputs.closing.mode === "itemized" ? inputs.closing.extras : [] } })
                }
                onExtras={(extras) =>
                  patch({
                    closing: {
                      mode: "itemized",
                      items: inputs.closing.mode === "itemized" ? inputs.closing.items : { ...defaultClosingItems },
                      extras,
                    },
                  })
                }
              />
            )}
            <div className={`text-muted ${styles.echo}`}>
              סה&quot;כ סגירה: <Num>{money(closingEstimate(inputs.closing, inputs.purchasePrice))}</Num>
            </div>
          </>
        )}

        <div className={styles.row2}>
          <NumberField
            id="f-tax"
            label="מס רכוש"
            unit="$ לשנה"
            info={glossary.propertyTax}
            value={inputs.holding.propertyTaxYr}
            onChange={(v) => group("holding")({ propertyTaxYr: v })}
          />
          <NumberField
            id="f-ins"
            label="ביטוח"
            unit="$ לשנה"
            info={glossary.insurance}
            infoAlign="end"
            value={inputs.holding.insuranceYr}
            onChange={(v) => group("holding")({ insuranceYr: v })}
          />
        </div>
        <div className={styles.row2}>
          <NumberField
            id="f-util"
            label="חשבונות"
            unit="$ לחודש"
            info={glossary.utilities}
            value={inputs.holding.utilitiesMo}
            onChange={(v) => group("holding")({ utilitiesMo: v })}
          />
          <NumberField
            id="f-yard"
            label="חצר / שלג"
            unit="$ לחודש"
            info={glossary.yardSnow}
            infoAlign="end"
            value={inputs.holding.yardSnowMo}
            onChange={(v) => group("holding")({ yardSnowMo: v })}
          />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>מכירה · Fix &amp; Flip</legend>
        <div className={styles.row2}>
          <NumberField
            id="f-agent"
            label="עמלת תיווך"
            unit="%"
            info={glossary.agentPct}
            value={inputs.sale.agentPct}
            onChange={(v) => group("sale")({ agentPct: v })}
          />
          <NumberField
            id="f-other"
            label="עלויות סגירה במכירה"
            unit="%"
            info={glossary.otherPct}
            infoAlign="end"
            value={inputs.sale.otherPct}
            onChange={(v) => group("sale")({ otherPct: v })}
          />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>הכנסות · BRRRR</legend>
        <div className={styles.row2}>
          <NumberField
            id="f-rent"
            label="שכר דירה"
            unit="$ לחודש"
            info={glossary.rent}
            value={inputs.income.monthlyRent}
            onChange={(v) => group("income")({ monthlyRent: v })}
          />
          <NumberField
            id="f-vac"
            label="תפוסה ריקה"
            unit="%"
            info={glossary.vacancy}
            infoAlign="end"
            value={inputs.income.vacancyPct}
            onChange={(v) => group("income")({ vacancyPct: v })}
          />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>הוצאות תפעול</legend>
        <div className={styles.row2}>
          <NumberField
            id="f-mgmt"
            label="ניהול נכס"
            unit="% משכ״ד"
            info={glossary.management}
            value={inputs.opex.managementPct}
            onChange={(v) => group("opex")({ managementPct: v })}
          />
          <NumberField
            id="f-maint"
            label="תחזוקה"
            unit="% משכ״ד"
            info={glossary.maintenance}
            infoAlign="end"
            value={inputs.opex.maintenancePct}
            onChange={(v) => group("opex")({ maintenancePct: v })}
          />
        </div>
        <div className={styles.row2}>
          <NumberField
            id="f-capex"
            label="CapEx"
            unit="% משכ״ד"
            info={glossary.capex}
            value={inputs.opex.capexPct}
            onChange={(v) => group("opex")({ capexPct: v })}
          />
          <NumberField
            id="f-hoa"
            label="ועד בית (HOA)"
            unit="$ לחודש"
            info={glossary.hoa}
            infoAlign="end"
            value={inputs.opex.hoaMo}
            onChange={(v) => group("opex")({ hoaMo: v })}
          />
        </div>
        <div className={`text-muted ${styles.echo}`}>
          מס וביטוח נלקחים מ&quot;סגירה והחזקה&quot;:{" "}
          <Num>
            {money(Math.round((inputs.holding.propertyTaxYr + inputs.holding.insuranceYr) / 12))}
          </Num>{" "}
          לחודש
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>מחזור משכנתא</legend>
        <Segmented
          options={holdModes}
          value={inputs.refinance ? "brrrr" : "hold"}
          onChange={(mode) =>
            patch({ refinance: mode === "brrrr" ? (inputs.refinance ?? defaultRefinance) : undefined })
          }
          ariaLabel="אסטרטגיית החזקה"
        />
        <FieldNote text={glossary.holdMode} />

        {inputs.refinance ? (
          <>
            <div className={styles.row2}>
              <NumberField
                id="f-refi-ltv"
                label="מימון מחדש (LTV)"
                unit="% מה-ARV"
                info={glossary.refiLtv}
                value={inputs.refinance.ltvPct}
                onChange={(v) => patchRefi({ ltvPct: v })}
              />
              <NumberField
                id="f-refi-rate"
                label="ריבית חדשה"
                unit="%"
                info={glossary.refiRate}
                infoAlign="end"
                value={inputs.refinance.ratePct}
                onChange={(v) => patchRefi({ ratePct: v })}
              />
            </div>
            <div className={styles.row2}>
              <NumberField
                id="f-refi-term"
                label="תקופה"
                unit="שנים"
                info={glossary.refiTerm}
                value={inputs.refinance.termYears}
                onChange={(v) => patchRefi({ termYears: v })}
              />
              <NumberField
                id="f-refi-closing"
                label="עלויות מחזור"
                unit="% מההלוואה"
                info={glossary.refiClosing}
                infoAlign="end"
                value={inputs.refinance.closingPct}
                onChange={(v) => patchRefi({ closingPct: v })}
              />
            </div>
            <NumberField
              id="f-seasoning"
              label="Seasoning"
              unit="חודשים"
              info={glossary.seasoning}
              value={inputs.refinance.seasoningMonths}
              onChange={(v) => patchRefi({ seasoningMonths: v })}
            />
          </>
        ) : null}
        <NumberField
          id="f-reserves"
          label="רזרבות"
          unit="חודשים"
          info={glossary.reserves}
          value={inputs.reservesMonths}
          onChange={(v) => patch({ reservesMonths: v })}
        />
      </fieldset>
    </form>
  );
}

/** A short explanation under a control that has no NumberField to hang a "?" on. */
function FieldNote({ text }: { text: string }) {
  return <p className={`text-muted ${styles.note}`}>{text}</p>;
}

/**
 * The purchase loan from either end. The sheet's flip tabs enter an LTV; the
 * 188 Kendall Ave tab enters a down payment. They are the same number — this
 * only picks which one you type.
 */
function EquitySplit({
  inputs,
  onChange,
}: {
  inputs: DealInputs;
  onChange: (ltvPct: number) => void;
}) {
  const ltv = inputs.purchaseLoan.ltvPct;
  // Both ends are shown and linked: type either one, the other follows.
  return (
    <div className={styles.row2}>
        <NumberField
          id="f-ltv"
          label="מימון רכישה (LTV)"
          unit="%"
          info={glossary.ltv}
          value={ltv}
          onChange={onChange}
        />
        <NumberField
          id="f-down"
          label="מקדמה"
          unit="%"
          info={glossary.downPayment}
          infoAlign="end"
          value={Math.round((100 - ltv) * 100) / 100}
          onChange={(down) => onChange(Math.round((100 - down) * 100) / 100)}
        />
    </div>
  );
}

/** Points on one loan, as a percentage of it or as a flat amount. */
function FeeField({
  id,
  label,
  info,
  fee,
  onChange,
}: {
  id: string;
  label: string;
  info: string;
  fee: Fee;
  onChange: (fee: Fee) => void;
}) {
  return (
    <div className={styles.splitField}>
      <Segmented
        options={feeModes}
        value={fee.mode}
        onChange={(mode) =>
          onChange(
            mode === "percent"
              ? { mode, pct: fee.mode === "percent" ? fee.pct : 0 }
              : { mode, amount: fee.mode === "amount" ? fee.amount : 0 },
          )
        }
        ariaLabel={`${label} — אחוז או סכום`}
      />
      {fee.mode === "percent" ? (
        <NumberField
          id={id}
          label={label}
          unit="% מההלוואה"
          info={info}
          value={fee.pct}
          onChange={(pct) => onChange({ mode: "percent", pct })}
        />
      ) : (
        <NumberField
          id={id}
          label={label}
          unit="$"
          info={info}
          value={fee.amount}
          onChange={(amount) => onChange({ mode: "amount", amount })}
        />
      )}
    </div>
  );
}

/** The thirteen standard lines, plus whatever this deal adds to them. */
function ItemizedClosing({
  items,
  extras,
  onItems,
  onExtras,
}: {
  items: ClosingItems;
  extras: CustomLine[];
  onItems: (items: ClosingItems) => void;
  onExtras: (extras: CustomLine[]) => void;
}) {
  return (
    <>
      <div className={styles.itemized}>
        {closingItemKeys.map((key, index) => (
          <NumberField
            key={key}
            id={`f-closing-${key}`}
            label={closingItemLabels[key]}
            unit="$"
            info={closingItemNotes[key]}
            infoAlign={index % 2 === 1 ? "end" : "start"}
            value={items[key]}
            onChange={(v) => onItems({ ...items, [key]: v })}
          />
        ))}
      </div>

      <div className={styles.labelRow}>
        <span className={`text-muted ${styles.subLabel}`}>שורות נוספות לעסקה הזו</span>
        <InfoTip id="f-closing-extras-tip" text={glossary.closingExtras} label="שורות נוספות" />
      </div>
      <div className={styles.extras}>
        {extras.map((line) => (
          <div key={line.id} className={styles.extraRow}>
            <input
              className="input"
              aria-label="שם השורה"
              placeholder="שם העמלה"
              value={line.label}
              onChange={(event) =>
                onExtras(
                  extras.map((l) => (l.id === line.id ? { ...l, label: event.target.value } : l)),
                )
              }
            />
            <input
              className={`input ${styles.extraAmount}`}
              aria-label="סכום"
              inputMode="decimal"
              dir="ltr"
              placeholder="0"
              value={line.amount === 0 ? "" : String(line.amount)}
              onChange={(event) => {
                const parsed = Number(event.target.value.replace(/[^\d.-]/g, ""));
                onExtras(
                  extras.map((l) =>
                    l.id === line.id ? { ...l, amount: Number.isNaN(parsed) ? 0 : parsed } : l,
                  ),
                );
              }}
            />
            <button
              type="button"
              className={styles.extraRemove}
              aria-label={`הסר ${line.label || "שורה"}`}
              onClick={() => onExtras(extras.filter((l) => l.id !== line.id))}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className={`btn btn-secondary ${styles.addExtra}`}
          onClick={() =>
            onExtras([...extras, { id: `x-${Date.now()}`, label: "", amount: 0 }])
          }
        >
          <Icon name="plus" size={13} />
          שורה נוספת
        </button>
      </div>
    </>
  );
}
