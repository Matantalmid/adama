import { InfoTip } from "@/components/ui/InfoTip";
import { Num } from "@/components/ui/Num";
import type { CompsAnalysis } from "@/data/types";
import {
  compsArv,
  compsInAverage,
  compsMao,
  effectivePricePerSqft,
  hasOverride,
  medianPricePerSqft,
  medianSalePrice,
  overMao,
  profitBuffer,
} from "@/lib/comps";
import { money, pricePerSqft } from "@/lib/format";
import { compsGlossary } from "@/lib/glossary";

import styles from "./Comps.module.css";

/**
 * What the comps add up to: the four figures the sheet heads each tab with.
 * The circle vocabulary is the calculator's, so the two screens read as one
 * app — ARV large in sage, the maximum offer and the 30% buffer beside it.
 *
 * Nothing here is written back. The property's own ARV is stated underneath
 * when the two differ, so the gap is visible rather than mysterious.
 */
export function ArvSummary({
  analysis,
  sqft,
  propertyArv,
}: {
  analysis: CompsAnalysis;
  sqft: number;
  /** What the deal calculator is using today. */
  propertyArv: number;
}) {
  const arv = compsArv(analysis, sqft);
  const rate = effectivePricePerSqft(analysis);
  const counted = compsInAverage(analysis).length;
  const mao = compsMao(analysis, sqft);
  const over = overMao(analysis, sqft);
  const gap = arv - propertyArv;

  return (
    <section className={styles.summary} aria-label="סיכום הקומפס">
      <div className={`${styles.circle} ${styles.circleArv}`}>
        <div className={styles.circleKicker}>
          <Num>ARV</Num>
        </div>
        <div className={styles.circleValue}>
          <Num>{money(arv)}</Num>
        </div>
        <div className={`${styles.circleMeta} text-muted`}>
          <Num>{pricePerSqft(rate, 2)}</Num> · <Num>{`${counted} comps`}</Num>
        </div>
      </div>

      <div className={styles.summaryStack}>
        <div className={styles.summaryRow}>
          <div className={`${styles.circle} ${styles.circleSmall} ${styles.circleMao}`}>
            <div className={styles.circleKickerSm}>
              <Num>MAO 70%</Num>
            </div>
            <div className={styles.circleValueSm}>
              <Num>{money(mao)}</Num>
            </div>
          </div>
          <p className={styles.summaryText}>
            <b>
              <Num>70% rule</Num>:
            </b>{" "}
            המחיר המבוקש <Num>{money(analysis.askingPrice)}</Num>,{" "}
            {over > 0 ? (
              <>
                <Num>{money(over)}</Num> מעל ה‑<Num>MAO</Num>.
              </>
            ) : (
              <>
                <Num>{money(-over)}</Num> מתחת ל‑<Num>MAO</Num> ✓
              </>
            )}
          </p>
        </div>

        <div className={styles.summaryRow}>
          <div className={`${styles.circle} ${styles.circleSmall} ${styles.circleBuffer}`}>
            <div className={styles.circleKickerSm}>רווח ובטיחות</div>
            <div className={styles.circleValueSm}>
              <Num>{money(profitBuffer(analysis, sqft))}</Num>
            </div>
          </div>
          <p className={styles.summaryText}>
            <span className={styles.medians}>
              <span className={styles.medianLabel}>
                חציון מחירי קומפס <Num>{money(medianSalePrice(analysis))}</Num>
                <InfoTip
                  id="median-price-tip"
                  text={compsGlossary.medianSalePrice}
                  label="חציון מחירי קומפס"
                />
              </span>
              <span className={styles.medianLabel}>
                חציון <Num>$/SqFt</Num> <Num>{pricePerSqft(medianPricePerSqft(analysis), 2)}</Num>
                <InfoTip
                  id="median-rate-tip"
                  text={compsGlossary.medianPricePerSqft}
                  label="חציון המחיר לרגל רבוע"
                />
              </span>
            </span>
          </p>
        </div>

        <p className={`text-muted ${styles.summaryNote}`}>
          {hasOverride(analysis) ? (
            <>
              ה‑<Num>ARV</Num> נלקח לפי מחיר לרגל רבוע שקבעת, לא לפי ממוצע הקומפס.{" "}
            </>
          ) : null}
          {gap === 0 ? (
            <>
              במחשבון העסקה רשום אותו <Num>ARV</Num>.
            </>
          ) : (
            <>
              במחשבון העסקה רשום <Num>{money(propertyArv)}</Num> — פער של{" "}
              <Num>{money(Math.abs(gap))}</Num>. המסך הזה לא משנה אותו.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
