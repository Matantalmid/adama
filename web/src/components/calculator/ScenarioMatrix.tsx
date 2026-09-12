import type { ReactNode } from "react";

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
 * the numbers make their own argument. Below the divider, the metrics the
 * investor's spreadsheet computes that the mockup did not have room for.
 */
export function ScenarioMatrix({
  comparison,
  strategy,
}: {
  comparison: ScenarioComparison;
  strategy: Strategy;
}) {
  const { flip, brrrr } = comparison;
  const refi = brrrr.refinance;
  const dash = <span className="text-muted">—</span>;
  const usd = (v: number) => <Num>{money(Math.round(v))}</Num>;
  const signed = (v: number) => <Num>{moneySigned(Math.round(v))}</Num>;

  const rows: {
    label: ReactNode;
    /** The explanation behind the row's "?" — plain text, keyed for the tip id. */
    info?: string;
    key: string;
    brrrr: ReactNode;
    flip: ReactNode;
    divider?: boolean;
  }[] = [
    {
      key: "cash-left",
      label: "מזומן שנשאר בעסקה",
      info: glossary.cashLeftInDeal,
      brrrr: usd(brrrr.cashLeftInDeal),
      flip: dash,
    },
    {
      key: "cash-flow",
      label: <>Cash Flow חודשי</>,
      info: glossary.monthlyCashFlow,
      brrrr: signed(brrrr.monthlyCashFlow),
      flip: dash,
    },
    {
      key: "net-profit",
      label: "רווח נקי במכירה",
      info: glossary.netProfit,
      brrrr: dash,
      flip: usd(flip.netProfit),
    },
    {
      key: "coc",
      info: glossary.coc,
      label: <>Cash‑on‑Cash / ROI על ההון</>,
      brrrr: brrrr.cashOnCashPct === null ? <Num>∞</Num> : <Num>{percent(brrrr.cashOnCashPct, 1)}</Num>,
      flip: flip.roiPct === null ? dash : <Num>{percent(flip.roiPct, 1)}</Num>,
    },
    {
      key: "equity",
      label: <>Equity אחרי ריפיננס</>,
      info: glossary.equityAfterRefi,
      brrrr: refi ? usd(refi.equityAfterRefi) : dash,
      flip: dash,
    },
    {
      key: "months",
      label: "זמן עד למזומן",
      info: glossary.monthsToCash,
      brrrr: refi ? <>~<Num>{refi.monthsToCash}</Num> חודשים</> : dash,
      flip: <>~<Num>{flip.holdMonths}</Num> חודשים</>,
    },
    { key: "tax", label: "מס", info: glossary.taxNote, brrrr: brrrr.taxNote, flip: flip.taxNote },

    {
      key: "cash-needed",
      label: "מזומן נדרש / השקעה כוללת",
      info: glossary.cashNeeded,
      brrrr: usd(brrrr.totalCashNeeded),
      flip: usd(flip.totalInvestment),
      divider: true,
    },
    { key: "noi", label: <>NOI חודשי</>, info: glossary.noi, brrrr: usd(brrrr.noi), flip: dash },
    {
      key: "debt-service",
      label: <>החזר משכנתא חודשי (P&amp;I)</>,
      info: glossary.debtService,
      brrrr: usd(brrrr.debtService),
      flip: dash,
    },
    {
      key: "dscr",
      label: <>DSCR</>,
      info: glossary.dscr,
      brrrr: brrrr.dscr === null ? dash : <Num>{brrrr.dscr.toFixed(2)}</Num>,
      flip: dash,
    },
    {
      key: "cap",
      label: <>Cap Rate</>,
      info: glossary.capRate,
      brrrr: <Num>{percent(brrrr.capRatePct, 1)}</Num>,
      flip: dash,
    },
    {
      key: "one-pct",
      label: <>כלל ה‑1%</>,
      info: glossary.onePercentRule,
      brrrr: <Num>{percent(brrrr.onePercentRulePct, 2)}</Num>,
      flip: dash,
    },
    { key: "reserves", label: "רזרבות", info: glossary.reserves, brrrr: usd(brrrr.reserves), flip: dash },
    {
      key: "cash-out",
      label: <>Cash‑out בריפיננס</>,
      info: glossary.cashOut,
      brrrr: refi ? signed(refi.cashOut) : dash,
      flip: dash,
    },
    {
      key: "selling",
      label: "עלויות מכירה",
      info: glossary.sellingCosts,
      brrrr: dash,
      flip: usd(flip.selling),
    },
    {
      key: "points-closing",
      label: "נקודות + סגירה",
      info: glossary.pointsAndClosing,
      brrrr: usd(brrrr.points + brrrr.closing),
      flip: usd(flip.points + flip.closing),
    },
    {
      key: "holding",
      label: "סך עלויות ההחזקה",
      info: glossary.holdingTotal,
      brrrr: dash,
      flip: usd(flip.holding),
    },
    {
      key: "rehab-interest",
      label: "ריבית בתקופת השיפוץ",
      info: glossary.rehabInterest,
      brrrr: usd(brrrr.rehabInterest),
      flip: usd(flip.rehabInterest),
    },
  ];

  const brrrrWins = strategy === "BRRRR";
  const flipWins = strategy === "FLIP";

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

        {rows.map((row) => {
          const dividerClass = row.divider ? styles.dividerRow : "";
          return (
            <div key={row.key} className={styles.matrixRow}>
              <div className={`${styles.cell} ${styles.cellLabel} ${dividerClass}`}>
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
              <div className={`${styles.cell} ${brrrrWins ? styles.winner : ""} ${dividerClass}`}>{row.brrrr}</div>
              <div className={`${styles.cell} ${flipWins ? styles.winner : ""} ${dividerClass}`}>{row.flip}</div>
            </div>
          );
        })}
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
