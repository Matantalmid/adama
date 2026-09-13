"use client";

import { useState, type ReactNode } from "react";

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
import { money, percent } from "@/lib/format";
import { closingItemNotes, glossary } from "@/lib/glossary";

import { NumberField } from "./NumberField";
import styles from "./Calculator.module.css";

/**
 * The assumptions behind both scenarios, grouped the way the investor's
 * spreadsheet groups them: רכישה ושווי · שיפוץ · מימון · סגירה והחזקה ·
 * מכירה · הכנסות · הוצאות תפעול · מחזור. Every change re‑runs the maths.
 *
 * Thirty-odd fields open at once is a wall, so each group is a disclosure that
 * starts closed and carries a digest of what is inside it — the form can be
 * read before it is edited. Every parameter still carries a "?" with the
 * sheet's own explanation of it (lib/glossary.ts).
 */

const groupIds = ["buy", "rehab", "finance", "closing", "sale", "income", "opex", "refi"] as const;

type GroupId = (typeof groupIds)[number];

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

/** 7% and 7.6% — a digest has no room for trailing zeros. */
const pct = (value: number) => percent(Number(value.toFixed(2)), value % 1 === 0 ? 0 : 2);

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
   * ARV or rehab budget of its own — that group is hidden.
   */
  scope?: "deal" | "defaults";
}) {
  const isDeal = scope === "deal";
  const patch = (partial: Partial<DealInputs>) => onChange({ ...inputs, ...partial });
  const group =
    <K extends "purchaseLoan" | "rehabLoan" | "holding" | "sale" | "income" | "opex">(key: K) =>
    (partial: Partial<DealInputs[K]>) =>
      onChange({ ...inputs, [key]: { ...inputs[key], ...partial } });
  const patchRefi = (partial: Partial<Refinance>) =>
    onChange({ ...inputs, refinance: { ...(inputs.refinance ?? defaultRefinance), ...partial } });

  // Which groups are open. Closed is the default at every width: the digests
  // are what the form says when nothing is expanded.
  const [open, setOpen] = useState<Partial<Record<GroupId, boolean>>>({});
  const toggle = (id: GroupId, value: boolean) =>
    setOpen((current) => (current[id] === value ? current : { ...current, [id]: value }));
  const shown = groupIds.filter((id) => isDeal || id !== "buy");
  const allOpen = shown.every((id) => open[id]);
  const setAll = (value: boolean) =>
    setOpen(Object.fromEntries(shown.map((id) => [id, value])) as Record<GroupId, boolean>);

  const cash = inputs.purchaseLoan.kind === "cash";
  const hardMoney = inputs.purchaseLoan.kind === "hard-money";
  const closed = inputs.closingActual !== undefined;
  const rehabAmortized = inputs.rehabLoan.termYears !== undefined;
  const kindLabel = kinds.find((k) => k.value === inputs.purchaseLoan.kind)?.label ?? "";

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <button type="button" className={styles.openAll} onClick={() => setAll(!allOpen)}>
        {allOpen ? "סגור הכל" : "פתח הכל"}
      </button>

      {isDeal ? (
        <Group
          id="buy"
          title="רכישה ושווי"
          open={open.buy}
          onToggle={toggle}
          digest={
            <>
              <Num>{money(inputs.purchasePrice)}</Num> · <Num>{`ARV ${money(inputs.arv)}`}</Num>
            </>
          }
        >
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
        </Group>
      ) : null}

      <Group
        id="rehab"
        title="שיפוץ"
        open={open.rehab}
        onToggle={toggle}
        digest={
          <>
            {isDeal ? (
              <>
                <Num>{money(rehabTotal(inputs))}</Num> ·{" "}
              </>
            ) : (
              <>
                בלת&quot;מ <Num>{pct(inputs.contingencyPct)}</Num> ·{" "}
              </>
            )}
            <Num>{inputs.rehabMonths}</Num> חודשים
          </>
        }
      >
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
      </Group>

      <Group
        id="finance"
        title="מימון"
        open={open.finance}
        onToggle={toggle}
        digest={
          <>
            {kindLabel}
            {cash ? null : (
              <>
                {" · "}
                <Num>{`LTV ${pct(inputs.purchaseLoan.ltvPct)}`}</Num> ·{" "}
                <Num>{pct(inputs.purchaseLoan.ratePct)}</Num>
              </>
            )}
          </>
        }
      >
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
      </Group>

      <Group
        id="closing"
        title="סגירה והחזקה"
        open={open.closing}
        onToggle={toggle}
        digest={
          <>
            <Num>
              {money(
                closed
                  ? (inputs.closingActual ?? 0)
                  : closingEstimate(inputs.closing, inputs.purchasePrice),
              )}
            </Num>{" "}
            · מס וביטוח{" "}
            <Num>{money(inputs.holding.propertyTaxYr + inputs.holding.insuranceYr)}</Num> לשנה
          </>
        }
      >
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
      </Group>

      <Group
        id="sale"
        title={<>מכירה · Fix &amp; Flip</>}
        open={open.sale}
        onToggle={toggle}
        digest={
          <>
            תיווך <Num>{pct(inputs.sale.agentPct)}</Num> · סגירה{" "}
            <Num>{pct(inputs.sale.otherPct)}</Num>
          </>
        }
      >
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
      </Group>

      <Group
        id="income"
        title={<>הכנסות · BRRRR</>}
        open={open.income}
        onToggle={toggle}
        digest={
          <>
            {isDeal ? (
              <>
                <Num>{money(inputs.income.monthlyRent)}</Num> לחודש ·{" "}
              </>
            ) : null}
            תפוסה ריקה <Num>{pct(inputs.income.vacancyPct)}</Num>
          </>
        }
      >
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
      </Group>

      <Group
        id="opex"
        title="הוצאות תפעול"
        open={open.opex}
        onToggle={toggle}
        digest={
          <>
            ניהול <Num>{pct(inputs.opex.managementPct)}</Num> · תחזוקה{" "}
            <Num>{pct(inputs.opex.maintenancePct)}</Num> ·{" "}
            <Num>{`CapEx ${pct(inputs.opex.capexPct)}`}</Num>
          </>
        }
      >
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
      </Group>

      <Group
        id="refi"
        title="מחזור משכנתא"
        open={open.refi}
        onToggle={toggle}
        digest={
          <>
            {inputs.refinance ? (
              <>
                ריפיננס <Num>{pct(inputs.refinance.ltvPct)}</Num>
              </>
            ) : (
              <Num>Buy &amp; Hold</Num>
            )}{" "}
            · רזרבות <Num>{inputs.reservesMonths}</Num> חודשים
          </>
        }
      >
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
      </Group>
    </form>
  );
}

/**
 * One group of the form. Closed, the summary is the only thing on screen: the
 * group's name and a digest of the values inside it, so the form can be read
 * without being opened. Several may be open at once — an accordion that shuts
 * one group to open another fights comparison.
 *
 * `<legend>` wants a `<fieldset>`; this trades that grouping semantic for a
 * native, keyboard-operable disclosure. Every field keeps its own label,
 * `aria-describedby` and "?", so nothing an assistive technology reads is lost.
 */
function Group({
  id,
  title,
  digest,
  open,
  onToggle,
  children,
}: {
  id: GroupId;
  title: ReactNode;
  digest: ReactNode;
  open?: boolean;
  onToggle: (id: GroupId, open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details
      className={styles.group}
      open={open ?? false}
      onToggle={(event) => onToggle(id, event.currentTarget.open)}
    >
      <summary className={styles.groupSummary}>
        <span className={styles.legend}>{title}</span>
        <span className={`text-muted ${styles.digest}`}>{digest}</span>
        <Icon name="chevron-down" size={15} className={styles.groupChevron} />
      </summary>
      <div className={styles.groupBody}>{children}</div>
    </details>
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
