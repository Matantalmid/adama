import { Num } from "@/components/ui/Num";
import type { DealInputs, ScenarioComparison } from "@/lib/calc";
import { money, moneyCompact, percent, pricePerSqft } from "@/lib/format";

import styles from "./Calculator.module.css";

/** Mockup 2b's headline: the ARV circle, the MAO circle, and all‑in against ARV. */
export function ArvCircles({
  inputs,
  comparison,
  compCount,
  sqft,
}: {
  inputs: DealInputs;
  comparison: ScenarioComparison;
  compCount?: number;
  sqft?: number;
}) {
  const { flip, brrrr } = comparison;
  const over = inputs.purchasePrice - flip.mao;
  const allIn = flip.allInExFinancing + flip.points + flip.rehabInterest;
  const allInPct = inputs.arv > 0 ? (allIn / inputs.arv) * 100 : 0;

  return (
    <div className={styles.circles}>
      <div className={`${styles.circle} ${styles.circleArv}`}>
        <div className={styles.circleKicker}>ARV</div>
        <Num className={styles.circleValue}>{moneyCompact(inputs.arv)}</Num>
        <div className={styles.circleMeta}>
          {compCount ? <><Num>{`${compCount} comps`}</Num> · </> : null}
          {sqft ? <Num>{pricePerSqft(inputs.arv / sqft)}</Num> : null}
        </div>
      </div>

      <div className={styles.circleStack}>
        <div className={styles.circleRow}>
          <div className={`${styles.circle} ${styles.circleSmall} ${styles.circleMao}`}>
            <div className={styles.circleKickerSm}>MAO</div>
            <Num className={styles.circleValueSm}>{moneyCompact(flip.mao)}</Num>
          </div>
          <p className={styles.circleText}>
            <b><Num>70% rule</Num>:</b>{" "}
            {over > 0 ? (
              <>
                המחיר <Num>{money(inputs.purchasePrice)}</Num>, <Num>{money(over)}</Num> מעל ה‑MAO.
              </>
            ) : (
              <>
                המחיר <Num>{money(inputs.purchasePrice)}</Num>, <Num>{money(-over)}</Num> מתחת ל‑MAO ✓
              </>
            )}
          </p>
        </div>

        <div className={styles.circleRow}>
          <div className={`${styles.circle} ${styles.circleSmall} ${styles.circleSurface}`}>
            <div className={`text-muted ${styles.circleKickerSm}`}>All‑in / ARV</div>
            <Num className={styles.circleValueSm}>{percent(allInPct)}</Num>
          </div>
          <p className={styles.circleText}>
            {brrrr.refinance ? (
              <>
                ריפיננס ב‑<Num>{`${percent(inputs.refinance?.ltvPct ?? 0)} LTV`}</Num> →{" "}
                <Num>{money(Math.round(brrrr.refinance.newLoan))}</Num>.{" "}
                <span className="text-muted">
                  נשארים בעסקה ~<Num>{money(Math.round(brrrr.cashLeftInDeal))}</Num>.
                </span>
              </>
            ) : (
              <>
                Buy &amp; Hold — כל ההון נשאר בעסקה: <Num>{money(Math.round(brrrr.cashLeftInDeal))}</Num>.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
