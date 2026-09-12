import type { ReactNode } from "react";

import { Num } from "@/components/ui/Num";
import type { Strategy } from "@/data/types";
import type { ScenarioComparison } from "@/lib/calc";
import { money, moneySigned, percent } from "@/lib/format";

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

  const rows: { label: ReactNode; brrrr: ReactNode; flip: ReactNode; divider?: boolean }[] = [
    { label: "מזומן שנשאר בעסקה", brrrr: usd(brrrr.cashLeftInDeal), flip: dash },
    { label: <>Cash Flow חודשי</>, brrrr: signed(brrrr.monthlyCashFlow), flip: dash },
    { label: "רווח נקי במכירה", brrrr: dash, flip: usd(flip.netProfit) },
    {
      label: <>Cash‑on‑Cash / ROI על ההון</>,
      brrrr: brrrr.cashOnCashPct === null ? <Num>∞</Num> : <Num>{percent(brrrr.cashOnCashPct, 1)}</Num>,
      flip: flip.roiPct === null ? dash : <Num>{percent(flip.roiPct, 1)}</Num>,
    },
    { label: <>Equity אחרי ריפיננס</>, brrrr: refi ? usd(refi.equityAfterRefi) : dash, flip: dash },
    {
      label: "זמן עד למזומן",
      brrrr: refi ? <>~<Num>{refi.monthsToCash}</Num> חודשים</> : dash,
      flip: <>~<Num>{flip.holdMonths}</Num> חודשים</>,
    },
    { label: "מס", brrrr: brrrr.taxNote, flip: flip.taxNote },

    { label: "מזומן נדרש / השקעה כוללת", brrrr: usd(brrrr.totalCashNeeded), flip: usd(flip.totalInvestment), divider: true },
    { label: <>NOI חודשי</>, brrrr: usd(brrrr.noi), flip: dash },
    { label: <>DSCR</>, brrrr: brrrr.dscr === null ? dash : <Num>{brrrr.dscr.toFixed(2)}</Num>, flip: dash },
    { label: <>Cap Rate</>, brrrr: <Num>{percent(brrrr.capRatePct, 1)}</Num>, flip: dash },
    { label: <>כלל ה‑1%</>, brrrr: <Num>{percent(brrrr.onePercentRulePct, 2)}</Num>, flip: dash },
    { label: "רזרבות", brrrr: usd(brrrr.reserves), flip: dash },
    { label: <>Cash‑out בריפיננס</>, brrrr: refi ? signed(refi.cashOut) : dash, flip: dash },
    { label: "עלויות מכירה", brrrr: dash, flip: usd(flip.selling) },
    { label: "נקודות + סגירה", brrrr: usd(brrrr.points + brrrr.closing), flip: usd(flip.points + flip.closing) },
    {
      label: (
        <>
          ריבית בתקופת השיפוץ{" "}
          <span className="text-muted" style={{ fontSize: 11 }}>· לא נכללת ב&quot;מזומן נדרש&quot;, כמו בגיליון</span>
        </>
      ),
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

        {rows.map((row, index) => {
          const dividerClass = row.divider ? styles.dividerRow : "";
          return (
            <div key={index} className={styles.matrixRow}>
              <div className={`${styles.cell} ${styles.cellLabel} ${dividerClass}`}>{row.label}</div>
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
