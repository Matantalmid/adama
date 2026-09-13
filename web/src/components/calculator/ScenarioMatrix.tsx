import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { InfoTip } from "@/components/ui/InfoTip";
import { Num } from "@/components/ui/Num";
import type { Strategy } from "@/data/types";
import type { ScenarioComparison } from "@/lib/calc";
import { money, moneySigned, percent } from "@/lib/format";
import { glossary } from "@/lib/glossary";

import styles from "./Calculator.module.css";

/**
 * Mockup 2b's comparison matrix: one row per question, BRRRR and Fix & Flip
 * side by side. The tinted column is the strategy declared for the property —
 * the numbers make their own argument.
 *
 * Nineteen rows are too many to read flat, so they are grouped: the four that
 * decide the deal first and at a heavier weight, then the cash, the rental
 * metrics, and the costs. Nothing here computes — every figure comes from
 * `lib/calc.ts` exactly as it is.
 */

/** One value in the matrix. `null` is "this row does not apply to that side". */
type Cell = { value: ReactNode; warn?: string } | null;

interface MatrixRow {
  key: string;
  label: ReactNode;
  /** The explanation behind the row's "?" — plain text, keyed for the tip id. */
  info?: string;
  brrrr: Cell;
  flip: Cell;
}

interface MatrixGroup {
  title: string;
  /** The group whose numbers decide the deal, rendered a size up. */
  lead?: boolean;
  rows: MatrixRow[];
}

/**
 * Where a number stops being a detail and becomes a problem. These are
 * judgements, not maths, so they live here and not in `lib/calc.ts`.
 */
const DSCR_BANK_MINIMUM = 1.25;

export function ScenarioMatrix({
  comparison,
  strategy,
}: {
  comparison: ScenarioComparison;
  strategy: Strategy;
}) {
  const { flip, brrrr } = comparison;
  const refi = brrrr.refinance;
  const usd = (v: number): Cell => ({ value: <Num>{money(Math.round(v))}</Num> });
  const signed = (v: number): Cell => ({ value: <Num>{moneySigned(Math.round(v))}</Num> });

  const groups: MatrixGroup[] = [
    {
      title: "התוצאה",
      lead: true,
      rows: [
        {
          key: "cash-left",
          label: "מזומן שנשאר בעסקה",
          info: glossary.cashLeftInDeal,
          brrrr: usd(brrrr.cashLeftInDeal),
          flip: null,
        },
        {
          key: "cash-flow",
          label: <>Cash Flow חודשי</>,
          info: glossary.monthlyCashFlow,
          brrrr: {
            value: <Num>{moneySigned(Math.round(brrrr.monthlyCashFlow))}</Num>,
            warn: brrrr.monthlyCashFlow < 0 ? "תזרים שלילי" : undefined,
          },
          flip: null,
        },
        {
          key: "net-profit",
          label: "רווח נקי במכירה",
          info: glossary.netProfit,
          brrrr: null,
          flip: usd(flip.netProfit),
        },
        {
          key: "coc",
          info: glossary.coc,
          label: <>Cash‑on‑Cash / ROI על ההון</>,
          brrrr: {
            value: (
              <>
                {brrrr.cashOnCashPct === null ? (
                  <Num>∞</Num>
                ) : (
                  <Num>{percent(brrrr.cashOnCashPct, 1)}</Num>
                )}
                <span className={styles.subValue} data-extra="">
                  <Num>{moneySigned(Math.round(brrrr.annualCashFlow))}</Num> לשנה
                </span>
              </>
            ),
          },
          flip: flip.roiPct === null ? null : { value: <Num>{percent(flip.roiPct, 1)}</Num> },
        },
      ],
    },
    {
      title: "המזומן",
      rows: [
        {
          key: "cash-needed",
          label: "מזומן נדרש / השקעה כוללת",
          info: glossary.cashNeeded,
          brrrr: usd(brrrr.totalCashNeeded),
          flip: usd(flip.totalInvestment),
        },
        {
          key: "reserves",
          label: "רזרבות",
          info: glossary.reserves,
          brrrr: usd(brrrr.reserves),
          flip: null,
        },
        {
          key: "points-closing",
          label: "נקודות + סגירה",
          info: glossary.pointsAndClosing,
          brrrr: usd(brrrr.points + brrrr.closing),
          flip: usd(flip.points + flip.closing),
        },
        {
          key: "cash-out",
          label: <>Cash‑out בריפיננס</>,
          info: glossary.cashOut,
          brrrr: refi ? signed(refi.cashOut) : null,
          flip: null,
        },
      ],
    },
    {
      title: "מדדי השכרה",
      rows: [
        {
          key: "noi",
          label: <>NOI חודשי</>,
          info: glossary.noi,
          brrrr: usd(brrrr.noi),
          flip: null,
        },
        {
          key: "debt-service",
          label: <>החזר משכנתא חודשי (P&amp;I)</>,
          info: glossary.debtService,
          brrrr: usd(brrrr.debtService),
          flip: null,
        },
        {
          key: "dscr",
          label: <>DSCR</>,
          info: glossary.dscr,
          brrrr:
            brrrr.dscr === null
              ? null
              : {
                  value: <Num>{brrrr.dscr.toFixed(2)}</Num>,
                  warn:
                    brrrr.dscr < 1
                      ? "לא מכסה את ההחזר"
                      : brrrr.dscr < DSCR_BANK_MINIMUM
                        ? "מתחת לרף הבנק"
                        : undefined,
                },
          flip: null,
        },
        {
          key: "cap",
          label: <>Cap Rate</>,
          info: glossary.capRate,
          brrrr: { value: <Num>{percent(brrrr.capRatePct, 1)}</Num> },
          flip: null,
        },
        {
          key: "one-pct",
          label: <>כלל ה‑1%</>,
          info: glossary.onePercentRule,
          brrrr: { value: <Num>{percent(brrrr.onePercentRulePct, 2)}</Num> },
          flip: null,
        },
      ],
    },
    {
      title: "עלויות ולוח זמנים",
      rows: [
        {
          key: "selling",
          label: "עלויות מכירה",
          info: glossary.sellingCosts,
          brrrr: null,
          flip: usd(flip.selling),
        },
        {
          key: "holding",
          label: "סך עלויות ההחזקה",
          info: glossary.holdingTotal,
          brrrr: null,
          flip: usd(flip.holding),
        },
        {
          key: "rehab-interest",
          label: "ריבית בתקופת השיפוץ",
          info: glossary.rehabInterest,
          brrrr: usd(brrrr.rehabInterest),
          flip: usd(flip.rehabInterest),
        },
        {
          key: "equity",
          label: <>Equity אחרי ריפיננס</>,
          info: glossary.equityAfterRefi,
          brrrr: refi ? usd(refi.equityAfterRefi) : null,
          flip: null,
        },
        {
          key: "months",
          label: "זמן עד למזומן",
          info: glossary.monthsToCash,
          brrrr: refi
            ? { value: <>~<Num>{refi.monthsToCash}</Num> חודשים</> }
            : null,
          flip: { value: <>~<Num>{flip.holdMonths}</Num> חודשים</> },
        },
        {
          key: "tax",
          label: "מס",
          info: glossary.taxNote,
          brrrr: { value: brrrr.taxNote },
          flip: { value: flip.taxNote },
        },
      ],
    },
  ];

  const brrrrWins = strategy === "BRRRR";
  const flipWins = strategy === "FLIP";

  /** A value cell. An empty one takes neither the winner tint nor its weight. */
  const valueCell = (cell: Cell, winner: boolean, lead: boolean, first: boolean) => {
    const classes = [styles.cell, lead ? styles.leadCell : "", first ? styles.firstInGroup : ""];
    if (!cell) classes.push(styles.dash);
    else if (winner) classes.push(styles.winner);
    if (cell?.warn) classes.push(styles.flagged);
    return (
      <div className={classes.filter(Boolean).join(" ")}>
        {cell ? cell.value : "—"}
        {cell?.warn ? (
          <span className={styles.flag} data-extra="">
            <Icon name="alert-triangle" size={12} />
            {cell.warn}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <section className={`card ${styles.matrix}`} aria-label="השוואת BRRRR מול Fix & Flip">
      <div className={styles.matrixGrid}>
        <div className={styles.matrixHead}>BRRRR מול Flip</div>
        <div className={`${styles.matrixHead} ${brrrrWins ? styles.winnerHead : ""}`}>
          BRRRR{brrrrWins ? " ✓" : ""}
        </div>
        <div className={`${styles.matrixHead} ${flipWins ? styles.winnerHead : ""}`}>
          Fix &amp; Flip{flipWins ? " ✓" : ""}
        </div>

        {groups.map((group) => (
          <div key={group.title} className={styles.matrixRow}>
            <h3 className={styles.groupHead}>{group.title}</h3>
            {group.rows.map((row, index) => (
              <div key={row.key} className={styles.matrixRow}>
                <div
                  className={`${styles.cell} ${styles.cellLabel} ${
                    index === 0 ? styles.firstInGroup : ""
                  }`}
                >
                  <span className={styles.rowLabel}>
                    {row.label}
                    {row.info ? (
                      <InfoTip
                        id={`m-${row.key}-tip`}
                        text={row.info}
                        label={typeof row.label === "string" ? row.label : row.key}
                      />
                    ) : null}
                  </span>
                </div>
                {valueCell(row.brrrr, brrrrWins, group.lead === true, index === 0)}
                {valueCell(row.flip, flipWins, group.lead === true, index === 0)}
              </div>
            ))}
          </div>
        ))}
      </div>
      {strategy === "UNDECIDED" ? (
        <p className={`text-muted ${styles.matrixNote}`}>
          לנכס הזה עוד לא נבחרה אסטרטגיה — שתי העמודות שוות מעמד.
        </p>
      ) : (
        <p className={`text-muted ${styles.matrixNote}`}>
          העמודה המודגשת היא האסטרטגיה שנבחרה לנכס; המספרים מדברים בעד עצמם.
        </p>
      )}
    </section>
  );
}
